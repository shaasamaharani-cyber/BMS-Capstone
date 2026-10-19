import { resolveRequestActor } from '../services/requestActor.mjs';
import { readBudgetCycle } from '../services/budgetCycles.mjs';
import { getFormDefinition, resolveCommonValues } from '../../../src/bp_forms/bp_form_fields.js';
import { computeBudgetLineItemTotals, getLineItemErrors } from '../../../src/utils/budget_financials.js';
import { generateBpFormPdf } from '../services/bpFormPdf.mjs';

export async function handleBpFormExports({ db, req, res, parts, payload, json }) {
  if (parts[0] !== 'bp-form-exports') return false;
  const actor = resolveRequestActor(db, req);
  if (!actor) { json(res, 401, { message: 'Unauthenticated.' }); return true; }
  if (!['requester', 'admin', 'reviewer', 'executive'].includes(actor.role?.role_group)) { json(res, 403, { message: 'BP form access is not available for this account.' }); return true; }
  if (req.method !== 'POST') { json(res, 405, { message: 'Use POST to generate a draft form.' }); return true; }
  const context = payload.context || {};
  const year = String(context.common?.fiscalYear || '');
  if (!db.rows('fiscal-years').some((row) => String(row.fy_year) === year)) { json(res, 422, { message: 'Choose a valid fiscal year.' }); return true; }
  const cycle = readBudgetCycle(db, year);
  if (!cycle.enabled_form_ids.includes(payload.formId)) { json(res, 422, { message: 'This form is unavailable for the selected fiscal year.' }); return true; }
  const definition = getFormDefinition(payload.formId, { formConfigs: cycle.form_configs });
  if (!definition?.official) { json(res, 422, { message: 'This form has no mapped official export template.' }); return true; }
  if (payload.definition && payload.definition !== JSON.stringify(definition)) { json(res, 409, { message: 'The form configuration changed. Reload the draft before exporting.' }); return true; }
  const lineItems = Array.isArray(context.lineItems) ? context.lineItems : [];
  if (lineItems.some((item) => getLineItemErrors(item, { allowLegacy: true }).length)) { json(res, 422, { message: 'Correct invalid line-item amounts before exporting.' }); return true; }
  const unit = db.rows('requesting-units').find((row) => Number(row.ru_id) === Number(actor.usr_requesting_unit_id));
  // Draft previews accept current inputs, never client totals, definitions or approvals.
  // Source institution identity comes from the authenticated requester.
  const common = actor.role.role_group === 'requester' ? resolveCommonValues({ ...context.common, title: context.common?.projectName, description: context.common?.projectDescription }, { unitName: unit?.ru_name || '', agencyName: unit?.agency || '', fiscalYearLabel: year }) : { ...context.common };
  const trusted = { common, answers: context.answers || {}, lineItems, totals: computeBudgetLineItemTotals(lineItems), formValues: context.formValues || {}, formConfigs: cycle.form_configs, formDefinitions: { [payload.formId]: definition }, reportingScope: 'Individual institution' };
  const data = await generateBpFormPdf({ formId: payload.formId, context: trusted });
  json(res, 200, { data: { pdfUrl: data.pdfUrl, verification: data.verification } });
  return true;
}
