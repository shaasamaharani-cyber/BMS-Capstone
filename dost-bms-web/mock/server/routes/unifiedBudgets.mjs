import { prepareDivisionSave, requireDirectorDecision, prepareExternalDecision, storedVersions } from '../services/unifiedBudgetLifecycle.mjs';
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
import { serializeWorkflowWrite } from '../services/workflowWrites.mjs';

export async function handleUnifiedBudgets(ctx) {
  if (ctx.parts[0] !== 'unified-budgets') return false;
  return ctx.req.method === 'GET' ? handleUnifiedBudgetOperation(ctx) : serializeWorkflowWrite(ctx.db, () => handleUnifiedBudgetOperation(ctx));
}

async function handleUnifiedBudgetOperation(ctx) {
  const { db, json, paginate, parts, req, res, url, payload } = ctx;

  if (parts[0] !== 'unified-budgets') return false;
  const actor = resolveRequestActor(db, req);
  if (!actor) { json(res, 401, { message: 'Authentication required.' }); return true; }
  if (!['reviewer', 'executive'].includes(String(actor.role?.role_group || '').toLowerCase())) { json(res, 403, { message: 'Insufficient permissions.' }); return true; }
  payload.actor_id = actor.id;
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

  // Who may change a consolidated budget (as-is lanes; Security Standards 6.15, 6.17): the division
  // prepares it and records external results; the directors approve or return.
  // Administrators have no budget access. The login token decides.
  if (req.method !== 'GET') {
    const strGroup = String(resolveRequestActor(db, req)?.role?.role_group || '').toLowerCase();
    const blnDirectorAction = req.method === 'POST' && ['approve', 'reject'].includes(parts[2]);
    const blnAllowed = blnDirectorAction ? strGroup === 'executive' : strGroup === 'reviewer';
    if (!blnAllowed) {
      json(res, 403, { message: 'Unauthorized. Insufficient permissions.' });
      return true;
    }
  }

  if (req.method === 'POST' && parts.length === 1) {
    try {
      const trusted = prepareDivisionSave(db, payload, null, actor);
      json(res, 201, { data: await saveUnifiedBudget(db, trusted) });
    } catch (error) { json(res, error.status || 500, { message: error.message }); }
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

  if (req.method === 'POST' && ['approve', 'reject'].includes(parts[2])) {
    try {
      const returning = parts[2] === 'reject';
      const currentSteps = requireDirectorDecision(db, existing, payload.comment, returning);
      const actorName = actorDisplayNameFromUser(actor);
      const updatedSteps = returning ? applyRejectToWorkflow(currentSteps, actorName) : applyApproveToWorkflow(currentSteps, actorName);
      const comment = String(payload.comment || '').trim();
      const versions = storedVersions(db, existing.ub_id ?? existing.id).map((version) =>
        Number(version.version) === Number(existing.ub_current_version_number)
          ? { ...version, workflow: updatedSteps, reviewComment: comment, decidedBy: actor.id, decidedAt: new Date().toISOString() } : version);
      const trusted = { status: returning ? 'rejected' : 'approved',
        stage: updatedSteps.find((step) => step.status === 'current')?.title || 'DBM',
        approvalWorkflow: updatedSteps, approvalVersions: versions, reviewComment: comment, actor_id: actor.id };
      json(res, 200, { data: await saveUnifiedBudget(db, trusted, existing) });
    } catch (error) { json(res, error.status || 500, { message: error.message }); }
    return true;
  }

  if (req.method === 'PUT') {
    try {
      const attachmentsOnly = Object.keys(payload).every((key) => ['attachedFiles', 'actor_id'].includes(key)) && Array.isArray(payload.attachedFiles);
      const trusted = attachmentsOnly
        ? { attachedFiles: payload.attachedFiles, actor_id: actor.id }
        : payload.externalDecision
        ? prepareExternalDecision(db, existing, payload.externalDecision, actor)
        : prepareDivisionSave(db, payload, existing, actor, withUnifiedBudgetRelations(db, existing).consolidatedLineItems);
      json(res, 200, { data: await saveUnifiedBudget(db, trusted, existing) });
    } catch (error) { json(res, error.status || 500, { message: error.message }); }
    return true;
  }

  if (req.method === 'DELETE') {
    if (String(existing.ub_current_status).toLowerCase() !== 'draft' || storedVersions(db, id).length) {
      json(res, 409, { message: 'Only an unsubmitted draft can be deleted.' }); return true;
    }
    db.removeWhere('unified-budget-items', (row) => Number(row.ubi_unified_budget_id) === Number(id));
    db.removeWhere('unified-budget-workflow-steps', (row) => Number(row.ubws_unified_budget_id) === Number(id));
    db.remove('unified-budgets', id);
    json(res, 200, { message: 'Deleted' });
    return true;
  }

  return false;
}
