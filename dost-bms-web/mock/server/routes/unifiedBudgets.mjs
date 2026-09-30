import { unique } from '../utils.mjs';
import {
  saveUnifiedBudget,
  withUnifiedBudgetRelations,
  unifiedBudgetRows,
  unifiedBudgetSummary,
  applyApproveToWorkflow,
  applyRejectToWorkflow,
} from '../services/unifiedBudgets.mjs';
import { actorDisplayNameFromUser, resolveRequestActor } from '../services/requestActor.mjs';

export async function handleUnifiedBudgets(ctx) {
  const { db, json, paginate, parts, req, res, url, payload } = ctx;

  if (parts[0] !== 'unified-budgets') return false;

  if (req.method === 'GET' && parts[1] === 'summary-stats') {
    json(res, 200, unifiedBudgetSummary(db));
    return true;
  }

  if (req.method === 'GET' && parts[1] === 'options' && parts[2] === 'stages') {
    json(res, 200, { data: unique(db.rows('unified-budgets').map((item) => item.ub_current_stage)) });
    return true;
  }

  if (req.method === 'GET' && parts[1] === 'options' && parts[2] === 'statuses') {
    json(res, 200, { data: unique(db.rows('unified-budgets').map((item) => String(item.ub_current_status || '').toUpperCase())) });
    return true;
  }

  if (req.method === 'GET' && parts[1] === 'options' && parts[2] === 'fiscal-years') {
    const years = db.rows('unified-budgets')
      .map((item) => db.rows('fiscal-years').find((year) => Number(year.fy_id) === Number(item.ub_fiscal_year_id))?.fy_year);
    json(res, 200, { data: unique(years.filter(Boolean)) });
    return true;
  }

  if (req.method === 'GET' && parts.length === 1) {
    const items = unifiedBudgetRows(db, url.searchParams);
    json(res, 200, paginate(items, url.searchParams));
    return true;
  }

  if (req.method === 'POST' && parts.length === 1) {
    json(res, 201, { data: await saveUnifiedBudget(db, payload) });
    return true;
  }

  const id = parts[1];
  const existing = db.find('unified-budgets', id);

  if (!existing) {
    json(res, 404, { message: 'Unified budget not found' });
    return true;
  }

  if (req.method === 'GET') {
    json(res, 200, { data: withUnifiedBudgetRelations(db, existing) });
    return true;
  }

  if (req.method === 'POST' && parts[2] === 'approve') {
    const ubId = existing.ub_id ?? existing.id;
    const currentSteps = db.rows('unified-budget-workflow-steps')
      .filter((s) => Number(s.ubws_unified_budget_id) === Number(ubId))
      .sort((a, b) => Number(a.ubws_sort_order) - Number(b.ubws_sort_order))
      .map((s) => s.ubws_payload);
    const objActor = resolveRequestActor(db, req, payload);
    const strActorName = actorDisplayNameFromUser(objActor);
    const updatedSteps = applyApproveToWorkflow(currentSteps, strActorName);
    const existingVersions = db.rows('unified-budget-versions')
      .filter((v) => Number(v.ubv_unified_budget_id) === Number(ubId))
      .map((v) => v.ubv_payload);
    const updatedVersions = existingVersions.map((v) =>
      Number(v.version) === Number(existing.ub_current_version_number)
        ? { ...v, workflow: updatedSteps }
        : v
    );
    const updated = await saveUnifiedBudget(db, {
      status: 'approved',
      stage: 'Secretary',
      approvalWorkflow: updatedSteps,
      approvalVersions: updatedVersions.length ? updatedVersions : undefined,
      comment: payload?.comment,
    }, existing);
    json(res, 200, { data: updated });
    return true;
  }

  if (req.method === 'POST' && parts[2] === 'reject') {
    const ubId = existing.ub_id ?? existing.id;
    const currentSteps = db.rows('unified-budget-workflow-steps')
      .filter((s) => Number(s.ubws_unified_budget_id) === Number(ubId))
      .sort((a, b) => Number(a.ubws_sort_order) - Number(b.ubws_sort_order))
      .map((s) => s.ubws_payload);
    const objActor = resolveRequestActor(db, req, payload);
    const strActorName = actorDisplayNameFromUser(objActor);
    const updatedSteps = applyRejectToWorkflow(currentSteps, strActorName);
    const existingVersions = db.rows('unified-budget-versions')
      .filter((v) => Number(v.ubv_unified_budget_id) === Number(ubId))
      .map((v) => v.ubv_payload);
    const updatedVersions = existingVersions.map((v) =>
      Number(v.version) === Number(existing.ub_current_version_number)
        ? { ...v, workflow: updatedSteps }
        : v
    );
    const updated = await saveUnifiedBudget(db, {
      status: 'rejected',
      approvalWorkflow: updatedSteps,
      approvalVersions: updatedVersions.length ? updatedVersions : undefined,
      comment: payload?.comment,
    }, existing);
    json(res, 200, { data: updated });
    return true;
  }

  if (req.method === 'PUT') {
    json(res, 200, { data: await saveUnifiedBudget(db, payload, existing) });
    return true;
  }

  if (req.method === 'DELETE') {
    db.remove('unified-budgets', id);
    json(res, 200, { message: 'Deleted' });
    return true;
  }

  return false;
}
