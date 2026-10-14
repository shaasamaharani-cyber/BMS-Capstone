import { readBudgetCycle } from './budgetCycles.mjs';
import { isStoredRequestAttachment } from './budgetRequests.mjs';
import { FORM_LEVEL, getCycleFormCatalog } from '../../../src/bp_forms/bp_form_catalog.js';
import { canOverrideForm, evaluateRequiredForms, getRequiredQuestions } from '../../../src/bp_forms/bp_form_rules.js';
import { getQuestionAnswer } from '../../../src/bp_forms/proposal_questions.js';
import { getFormCompletion, getFormContent, getFormDefinition, resolveCommonValues } from '../../../src/bp_forms/bp_form_fields.js';
import { computeBudgetLineItemTotals, financialItemFromStored, getLineItemErrors } from '../../../src/utils/budget_financials.js';

export function captureRequestFormConfiguration(db, unified, fiscalYearId) {
  const year = db.rows('fiscal-years').find((row) => Number(row.fy_id) === Number(fiscalYearId));
  const cycle = readBudgetCycle(db, year?.fy_year);
  const formDefinitions = Object.fromEntries(getCycleFormCatalog(cycle).map((form) => [form.id, getFormDefinition(form.id, { formConfigs: cycle.form_configs })]));
  return { ...unified, formConfigs: cycle.form_configs, formDefinitions, formCatalog: getCycleFormCatalog(cycle), customForms: cycle.custom_forms, enabledFormIds: cycle.enabled_form_ids, cycleDocuments: cycle.supporting_documents };
}

// Every submission is evaluated against trusted, current cycle rules and stored expenditure.
// Submitted versions subsequently render the captured definitions, never the live cycle.
export function validateConfiguredSubmission(db, request) {
  const year = db.rows('fiscal-years').find((row) => Number(row.fy_id) === Number(request.br_fiscal_year_id));
  const cycle = readBudgetCycle(db, year?.fy_year);
  const unified = captureRequestFormConfiguration(db, request.br_unified_request || {}, request.br_fiscal_year_id);
  const catalog = getCycleFormCatalog(cycle);
  const items = db.rows('budget-request-items').filter((row) => Number(row.bri_br_id) === Number(request.br_id ?? request.id));
  const lineItems = items.map((item) => financialItemFromStored(item, db.rows('budget-categories')));
  const totals = computeBudgetLineItemTotals(lineItems);
  const unit = db.rows('requesting-units').find((row) => Number(row.ru_id) === Number(request.br_requesting_unit_id));
  const common = resolveCommonValues({ ...unified.request, title: request.br_title, description: request.br_description, fundingSource: unified.request?.fundingSource || unified.common?.fundingSource || '' }, { unitName: unit?.ru_name || '', agencyName: unit?.agency || '', fiscalYearLabel: String(year?.fy_year || '') });
  const overrides = unified.overrides || {};
  const errors = [];
  if (!String(request.br_title || '').trim()) errors.push('Enter a title for the request.');
  if (!request.br_requesting_unit_id || !unit) errors.push('Choose a valid requesting unit.');
  if (!year || Number(year.fy_is_active) !== 1) errors.push('Choose an open fiscal year.');
  if (!lineItems.length) errors.push('Add at least one budget line item with an amount.');
  for (const item of lineItems) {
    errors.push(...getLineItemErrors(item, { allowLegacy: true }));
    if (Number(item.amount) === 0) errors.push('Remove line items with a zero amount or enter an amount.');
  }
  for (const [id, override] of Object.entries(overrides)) {
    if (!cycle.enabled_form_ids.includes(id)) continue; // Retain obsolete overrides as history; disabled forms cannot be selected.
    if (!['add', 'remove'].includes(override?.action) || typeof override.reason !== 'string' || !override.reason.trim()) errors.push('Each form override needs an action and a recorded reason.');
    if (override?.action === 'remove' && !canOverrideForm(id, cycle.form_configs)) errors.push('The administrator does not permit removing this required form.');
  }
  const { arrRequired } = evaluateRequiredForms(unified.answers || {}, totals, common, cycle.enabled_form_ids, overrides, cycle.custom_forms, cycle.form_configs);
  // Classic requests retain the older workflow; new unified requests cannot bypass form requirements.
  if (!request.br_unified_request) return { errors, unified };
  if (Array.isArray(unified.draftLineItems)) for (const item of unified.draftLineItems) {
    if (!item || typeof item !== 'object') { errors.push('Provide valid draft line items.'); continue; }
    if (String(item.name || '').trim() || String(item.amount ?? '').trim()) errors.push(...getLineItemErrors(item, { allowLegacy: item.category === 'TAG' }));
  }
  if (unified.answers?.hasFinEx === 'yes' && !(totals.finexTotal > 0)) errors.push('Add Financial Expenses line items, or correct the FinEx answer.');
  const legacyFinex = unified.formValues?.['bp-201-c']?.proposedFinex;
  if (legacyFinex != null && legacyFinex !== '' && Number(legacyFinex) !== totals.finexTotal) errors.push('The older typed FinEx form amount differs from the line items. Reconcile it explicitly.');
  if (arrRequired.some((entry) => entry.formId === 'bp-207') && !(totals.climateTotal > 0)) errors.push('Link climate expenditure to its underlying MOOE or CO items.');
  if (!['national_government', 'foreign_grant', 'foreign_loan', 'other'].includes(common.fundingSource)) errors.push('Choose the funding source.');
  const context = { common, totals, lineItems, formValues: unified.formValues || {}, formConfigs: cycle.form_configs, formDefinitions: unified.formDefinitions };
  for (const question of getRequiredQuestions(cycle.enabled_form_ids, cycle.form_configs, catalog)) {
    if (!question.options.some((option) => option.value === getQuestionAnswer(question, { answers: unified.answers, common }))) errors.push(`Answer ${question.label} before submitting.`);
  }
  for (const entry of arrRequired) {
    const form = catalog.find((row) => row.id === entry.formId);
    if (form?.level !== FORM_LEVEL.REQUEST) continue;
    const completion = getFormCompletion(entry.formId, context);
    if (!completion.complete) {
      if (completion.errors?.length) for (const error of completion.errors) errors.push(`${form.code} - ${error.label}: ${error.message}`);
      else errors.push(`Complete ${form.code}.`);
    }
    const signed = (request.br_attached_files || []).find((file) => file.formId === entry.formId || (!file.formId && String(file.name).startsWith(`Signed - ${form.code} - `)));
    if (!isStoredRequestAttachment(signed)) errors.push(`Upload the signed copy of ${form.code}.`);
    else if (signed.formDefinition !== JSON.stringify(getFormDefinition(entry.formId, context))) errors.push(`${form.code} fields changed. Replace its signed copy.`);
    else if (signed.formContent !== getFormContent(entry.formId, context)) errors.push(`${form.code} content changed or predates content tracking. Replace its signed copy.`);
  }
  const requiredDocuments = [...new Map([...cycle.supporting_documents.filter((row) => row.required), ...arrRequired.flatMap((entry) => getFormDefinition(entry.formId, context)?.requiredDocuments || [])].map((document) => [document.name, document])).values()];
  for (const document of requiredDocuments) {
    if (!(request.br_attached_files || []).some((file) => (file.docName === document.name || String(file.name).startsWith(`Supporting [${document.name}] - `)) && isStoredRequestAttachment(file))) errors.push(`Upload the ${document.name}.`);
  }
  return { errors, unified: { ...unified, common, lineItems, totalsAtGeneration: totals, requiredForms: arrRequired.map((entry) => ({ formId: entry.formId, ruleIds: entry.ruleIds, reasons: entry.reasons })) } };
}
