import { AUTOMATION_LEVEL, BP_FORM_CATALOG, FORM_ENGINE, FORM_LEVEL } from '../../../src/bp_forms/bp_form_catalog.js';

export function readBudgetCycle(db, year) {
  return {
    fy_year: String(year), enabled_form_ids: BP_FORM_CATALOG.map((form) => form.id),
    supporting_documents: [], custom_forms: [], form_configs: {}, configured: false,
    ...(db.find('budget-cycles', year) || {}),
    fy_is_active: db.rows('fiscal-years').some((row) => String(row.fy_year) === String(year) && Number(row.fy_is_active) === 1),
  };
}

// Metadata for custom forms; the cycle's field definitions select the online renderer.
export function validateCustomForms(value) {
  if (!Array.isArray(value)) return { error: 'Provide a list of new BP forms.' };
  const forms = [];
  const ids = new Set(BP_FORM_CATALOG.map((form) => form.id));
  const codes = new Set(BP_FORM_CATALOG.map((form) => form.code.toLowerCase()));
  for (const form of value) {
    const id = String(form?.id || '').trim();
    const code = String(form?.code || '').trim();
    const name = String(form?.name || '').trim();
    const completedBy = String(form?.completedBy || '').trim();
    if (!/^custom-[a-zA-Z0-9-]{1,80}$/.test(id) || ids.has(id)) {
      return { error: 'Each new BP form needs a unique custom form ID.' };
    }
    if (!code || code.length > 50 || codes.has(code.toLowerCase())) {
      return { error: 'Each BP form needs a different code (up to 50 characters).' };
    }
    if (!name || name.length > 200 || !completedBy || completedBy.length > 150) {
      return { error: 'Enter a form name (up to 200 characters) and completing office (up to 150 characters).' };
    }
    if (![FORM_LEVEL.REQUEST, FORM_LEVEL.AGENCY].includes(form.level)) {
      return { error: 'Choose request-level or agency-level for each new BP form.' };
    }
    ids.add(id);
    codes.add(code.toLowerCase());
    forms.push({ id, code, name, completedBy, level: form.level, engine: FORM_ENGINE.MANUAL, automation: AUTOMATION_LEVEL.MANUAL, ...(form.optionalByDefault === true ? { optionalByDefault: true } : {}) });
  }
  return { forms };
}
