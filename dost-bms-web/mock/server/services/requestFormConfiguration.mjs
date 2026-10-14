import { readBudgetCycle } from './budgetCycles.mjs';
import { FORM_LEVEL, getCycleFormCatalog } from '../../../src/bp_forms/bp_form_catalog.js';
import { evaluateRequiredForms } from '../../../src/bp_forms/bp_form_rules.js';
import { getFormCompletion, getFormDefinition } from '../../../src/bp_forms/bp_form_fields.js';
import { CONDITION_OPTIONS } from '../../../src/bp_forms/bp_form_conditions.js';

export function captureRequestFormConfiguration(db, unified, fiscalYearId) {
  const year = db.rows('fiscal-years').find((row) => Number(row.fy_id) === Number(fiscalYearId));
  const cycle = readBudgetCycle(db, year?.fy_year);
  return { ...unified, formConfigs: cycle.form_configs, customForms: cycle.custom_forms, enabledFormIds: cycle.enabled_form_ids, cycleDocuments: cycle.supporting_documents };
}

// Configured fields and conditions are enforced from the administrator's saved cycle, never a client-supplied schema.
export function validateConfiguredSubmission(db, request) {
  const year = db.rows('fiscal-years').find((row) => Number(row.fy_id) === Number(request.br_fiscal_year_id));
  const cycle = readBudgetCycle(db, year?.fy_year);
  const unified = captureRequestFormConfiguration(db, request.br_unified_request || {}, request.br_fiscal_year_id);
  const catalog = getCycleFormCatalog(cycle);
  const totals = { psTotal: 0, mooeTotal: 0, coTotal: 0, tagTotal: 0, grandTotal: 0 };
  const keys = { PS: 'psTotal', MOOE: 'mooeTotal', CO: 'coTotal', TAG: 'tagTotal' };
  db.rows('budget-request-items').filter((row) => Number(row.bri_br_id) === Number(request.br_id ?? request.id)).forEach((item) => {
    const category = db.rows('budget-categories').find((row) => Number(row.bcat_id) === Number(item.bri_category_id));
    const amount = Number(item.bri_planned_amount) || 0;
    if (keys[category?.bcat_code]) totals[keys[category.bcat_code]] += amount;
    totals.grandTotal += amount;
  });
  const common = { ...unified.common, fundingSource: unified.request?.fundingSource || unified.common?.fundingSource || '', fiscalYear: String(year?.fy_year || '') };
  const overrides = Object.fromEntries(Object.entries(unified.overrides || {}).filter(([, row]) => ['add', 'remove'].includes(row?.action) && typeof row.reason === 'string' && row.reason.trim()));
  const { arrRequired } = evaluateRequiredForms(unified.answers || {}, totals, common, cycle.enabled_form_ids, overrides, cycle.custom_forms, cycle.form_configs);
  const context = { formValues: unified.formValues || {}, formConfigs: cycle.form_configs };
  const errors = [];
  const missingConditions = new Set();
  for (const id of cycle.enabled_form_ids) {
    const requirement = cycle.form_configs[id]?.requirement;
    if (!requirement || !['default', 'conditional'].includes(requirement.mode) || requirement.enabled === false) continue;
    for (const condition of requirement.conditions.filter((row) => row.enabled !== false)) {
      const option = CONDITION_OPTIONS.find((row) => row.field === condition.field);
      if (!option || option.numeric) continue;
      const actual = option.source === 'answers' ? unified.answers?.[option.field] : common[option.field];
      if (!option.options.some((row) => row.value === actual && !(option.field === 'fundingSource' && actual === 'foreign'))) missingConditions.add(option.label);
    }
  }
  for (const label of missingConditions) errors.push(`Answer ${label.toLowerCase()} before submitting.`);
  for (const entry of arrRequired) {
    const form = catalog.find((row) => row.id === entry.formId);
    if (!cycle.form_configs[entry.formId] || form?.level !== FORM_LEVEL.REQUEST) continue;
    const completion = getFormCompletion(entry.formId, context);
    for (const error of completion.errors || []) errors.push(`${form.code} - ${error.label}: ${error.message}`);
    const signed = (request.br_attached_files || []).find((file) => file.formId === entry.formId || (!file.formId && String(file.name).startsWith(`Signed - ${form.code} - `)));
    if (!signed?.url) errors.push(`Upload the signed copy of ${form.code}.`);
    else if (signed.formDefinition && signed.formDefinition !== JSON.stringify(getFormDefinition(entry.formId, context))) errors.push(`${form.code} fields changed. Replace its signed copy.`);
  }
  return { errors, unified: { ...unified, requiredForms: arrRequired.map((entry) => ({ formId: entry.formId, ruleIds: entry.ruleIds, reasons: entry.reasons })) } };
}
