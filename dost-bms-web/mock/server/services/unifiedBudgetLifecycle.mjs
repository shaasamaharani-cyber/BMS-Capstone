import { createEmptyUnifiedWorkflow, applyUnifiedBudgetWorkflowAction, deriveUnifiedWorkflowStage } from '../../../src/utils/workflow_utils.js';
import { financialItemFromStored, getLineItemErrors } from '../../../src/utils/budget_financials.js';

const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const statusOf = (budget) => String(budget?.ub_current_status || 'draft').toLowerCase();
export const storedWorkflow = (db, id) => db.rows('unified-budget-workflow-steps')
  .filter((row) => Number(row.ubws_unified_budget_id) === Number(id))
  .sort((a, b) => a.ubws_sort_order - b.ubws_sort_order).map((row) => row.ubws_payload);
export const storedVersions = (db, id) => db.rows('unified-budget-versions')
  .filter((row) => Number(row.ubv_unified_budget_id) === Number(id)).map((row) => row.ubv_payload);

// The division may adjust its consolidation copy. Identity and original amounts
// always come from the reviewed source; payload IDs cannot relink other items.
export function trustedConsolidationSections(db, sections, existing, fiscalYearId, submitting) {
  if (!Array.isArray(sections)) fail(422, 'Provide consolidated line items.');
  const seen = new Set();
  const requests = new Set();
  const oldId = existing?.ub_id ?? existing?.id;
  const allLinks = db.rows('unified-budget-items').filter((row) => row.ubi_deleted_at == null && db.find('unified-budgets', row.ubi_unified_budget_id));
  const ownIds = new Set(allLinks.filter((row) => Number(row.ubi_unified_budget_id) === Number(oldId)).map((row) => Number(row.ubi_budget_request_id)));
  const result = sections.map((section) => {
    if (!section || typeof section !== 'object') fail(422, 'Provide valid source request sections.');
    const requestId = Number(section.sourceRequestId);
    const request = db.find('budget-requests', requestId);
    if (!request || requests.has(requestId)) fail(422, 'Each source request must exist and appear once.');
    requests.add(requestId);
    const own = ownIds.has(requestId);
    if (request.br_status !== 'reviewed' && !(own && request.br_status === 'consolidated')) fail(409, 'Only reviewed requests are eligible for consolidation.');
    if (Number(request.br_fiscal_year_id) !== Number(fiscalYearId)) fail(422, 'All requests must be for the same fiscal year as the consolidated budget.');
    if (allLinks.some((link) => Number(link.ubi_budget_request_id) === requestId && Number(link.ubi_unified_budget_id) !== Number(oldId))) fail(409, 'This request is already linked to another consolidated budget.');
    const unit = db.find('requesting-units', request.br_requesting_unit_id);
    const sourceItems = db.rows('budget-request-items').filter((row) => Number(row.bri_br_id) === requestId);
    if (!Array.isArray(section.items) || !section.items.length) fail(422, 'Each source request needs its line items.');
    const items = section.items.map((item) => {
      if (!item || typeof item !== 'object') fail(422, 'Provide valid consolidated line items.');
      const sourceId = Number(item.budgetRequestItemId ?? item.sourceItemId ?? item.ubi_budget_request_item_id);
      const source = sourceItems.find((row) => Number(row.bri_id ?? row.id) === sourceId);
      if (!source || seen.has(sourceId) || (item.sourceRequestId != null && Number(item.sourceRequestId) !== requestId)) fail(422, 'Each source item must belong to its request and appear once.');
      seen.add(sourceId);
      const trusted = { ...financialItemFromStored(source, db.rows('budget-categories')), ...item,
        id: allLinks.find((row) => Number(row.ubi_unified_budget_id) === Number(oldId) && Number(row.ubi_budget_request_item_id) === sourceId)?.id ?? `${requestId}-${sourceId}`,
        name: source.bri_description, category: financialItemFromStored(source, db.rows('budget-categories')).category,
        costStructure: source.bri_cost_structure, sourceItemId: sourceId, budgetRequestItemId: sourceId,
        sourceRequestId: requestId, requestingUnit: unit?.ru_name || '',
        originalAmount: Number(source.bri_planned_amount), climateAmount: source.bri_climate_amount ?? 0,
        climateTypology: source.bri_climate_typology || '', climateType: source.bri_climate_type || '' };
      const errors = getLineItemErrors(trusted, { allowLegacy: trusted.category === 'TAG' });
      if (errors.length) fail(422, errors.join(' '));
      return trusted;
    });
    if (sourceItems.some((row) => !seen.has(Number(row.bri_id ?? row.id)))) fail(422, 'Retain every source line item, or remove the whole request.');
    return { ...section, sourceRequestId: requestId, requestingUnit: unit?.ru_name || '', items };
  });
  if (submitting && !result.length) fail(422, 'Select at least one reviewed request.');
  return result;
}

export function prepareDivisionSave(db, payload, existing, actor, existingSections = []) {
  const previous = statusOf(existing);
  const next = String(payload.ub_current_status ?? payload.status ?? previous).toLowerCase();
  if (existing && !['draft', 'rejected'].includes(previous)) fail(409, 'Only draft or returned consolidated budgets can be edited.');
  if (!['draft', 'pending', 'rejected'].includes(next) || (!existing && next === 'rejected') || (next === 'rejected' && previous !== 'rejected')) fail(409, 'Invalid consolidated budget transition.');
  const year = payload.ub_fiscal_year_id != null
    ? db.find('fiscal-years', payload.ub_fiscal_year_id)
    : db.rows('fiscal-years').find((row) => String(row.fy_year) === String(payload.fiscalYear ?? db.find('fiscal-years', existing?.ub_fiscal_year_id)?.fy_year));
  if (!year || (next === 'pending' && Number(year.fy_is_active) !== 1)) fail(422, 'Choose an open fiscal year.');
  const title = payload.title ?? payload.ub_title ?? existing?.ub_title;
  if (typeof title !== 'string' || !title.trim() || title.length > 255) fail(422, 'Enter a consolidated budget title of 1 to 255 characters.');
  const sections = trustedConsolidationSections(db, payload.consolidatedLineItems ?? existingSections, existing, year.fy_id, next === 'pending');
  const versions = storedVersions(db, existing?.ub_id ?? existing?.id);
  const submitted = next === 'pending';
  const version = submitted ? Math.max(0, ...versions.map((entry) => Number(entry.version))) + 1 : Number(existing?.ub_current_version_number) || 1;
  const definitions = db.rows('approval-workflow-stages').filter((row) => Number(row.aws_is_active) === 1);
  const workflow = applyUnifiedBudgetWorkflowAction(createEmptyUnifiedWorkflow(definitions), submitted ? 'submit' : 'save_draft', new Date().toISOString(), actor.usr_name, definitions);
  if (submitted && (!workflow.some((step) => step.stepKey === 'finance_planning_director' && step.status === 'current') || !workflow.some((step) => step.stepKey === 'dbm' && ['external_approval', 'review'].includes(step.type)))) fail(422, 'The configured workflow needs the Director decision and next DBM stage. Ask the administrator to check the stage configuration.');
  const divisionComment = String(payload.comment ?? existing?.ub_division_comment ?? '').trim();
  if (submitted) versions.push({ version, status: 'PENDING', stage: deriveUnifiedWorkflowStage(workflow), startedAt: new Date().toISOString(), actionNote: divisionComment, workflow });
  // Whitelist mutable business fields. Approval state, identities and history are server-owned.
  return { title: title.trim(), description: payload.description ?? payload.ub_description ?? existing?.ub_description ?? '',
    fiscalYear: year.fy_year, ub_fiscal_year_id: year.fy_id, planningPeriod: payload.planningPeriod ?? existing?.ub_planning_period_id,
    attachedFiles: payload.attachedFiles ?? payload.ub_attached_files,
    attachedForms: payload.attachedForms ?? payload.ub_form_entries ?? existing?.ub_form_entries ?? [],
    actor_id: actor.id, ub_created_by: existing?.ub_created_by ?? actor.id, divisionComment,
    status: next, stage: deriveUnifiedWorkflowStage(workflow), currentVersion: version,
    consolidatedLineItems: sections, approvalWorkflow: workflow, approvalVersions: versions };
}

export function requireDirectorDecision(db, existing, comment, returning) {
  const workflow = storedWorkflow(db, existing.ub_id ?? existing.id);
  if (statusOf(existing) !== 'pending' || !workflow.some((step) => step.stepKey === 'finance_planning_director' && step.status === 'current')) fail(409, 'This budget is not awaiting a Director decision.');
  if (returning && !String(comment || '').trim()) fail(422, 'Remarks are required when returning a consolidated budget.');
  return workflow;
}

// Existing external tracker: an office records a result manually. Nothing is transmitted.
export function prepareExternalDecision(db, existing, decision, actor) {
  const workflow = storedWorkflow(db, existing.ub_id ?? existing.id);
  const current = workflow.find((step) => step.status === 'current');
  if (statusOf(existing) !== 'approved' || !['external_approval', 'review'].includes(current?.type) || current.stepKey !== decision?.stageKey) fail(409, 'Only the current external stage can be updated after Director approval.');
  if (!['approve', 'reject'].includes(decision.action)) fail(422, 'Choose a valid external decision.');
  if (decision.action === 'reject' && !String(decision.comment || '').trim()) fail(422, 'Remarks are required for an external return.');
  const timestamp = new Date().toISOString();
  const updated = workflow.map((step) => ({ ...step }));
  const index = workflow.indexOf(current);
  Object.assign(updated[index], { status: decision.action === 'approve' ? 'done' : 'rejected', actionText: `External result recorded by ${actor.usr_name}`, actorName: actor.usr_name, actionAt: timestamp });
  if (decision.action === 'approve') {
    const next = updated.slice(index + 1).find((step) => ['external_approval', 'review'].includes(step.type));
    if (next) Object.assign(next, { status: 'current', actionText: 'Awaiting external result' });
  } else Object.assign(updated.find((step) => step.stepKey === 'draft'), { status: 'current', actionText: 'Resubmit', actionAt: timestamp });
  const versions = storedVersions(db, existing.ub_id ?? existing.id).map((entry) => Number(entry.version) === Number(existing.ub_current_version_number) ? { ...entry, workflow: updated, reviewComment: String(decision.comment || '').trim() } : entry);
  return { status: decision.action === 'approve' ? 'approved' : 'rejected', stage: deriveUnifiedWorkflowStage(updated), approvalWorkflow: updated, approvalVersions: versions, reviewComment: String(decision.comment || '').trim(), actor_id: actor.id };
}
