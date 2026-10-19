import { financialItemFromStored, getLineItemErrors } from '../../../src/utils/budget_financials.js';
import { requesterSignoffChanges } from '../../../src/bp_forms/field_ownership.js';

const HEADER_FIELDS = ['br_fiscal_year_id', 'br_planning_period_id', 'br_title', 'br_description', 'br_requesting_unit_id', 'br_attached_files', 'br_unified_request', 'br_form_entries', 'br_form_schema_id', 'br_form_entry_id'];
const ITEM_FIELDS = ['bri_category_id', 'bri_cost_structure', 'bri_description', 'bri_planned_amount', 'bri_justification', 'bri_sort_order', 'bri_climate_amount', 'bri_climate_typology', 'bri_climate_type', 'bri_object_code'];
export const cleanItemPayload = (payload) => Object.fromEntries(ITEM_FIELDS.filter((key) => Object.hasOwn(payload, key)).map((key) => [key, payload[key]]));
export const cleanHeaderPayload = (payload) => Object.fromEntries(HEADER_FIELDS.filter((key) => Object.hasOwn(payload, key)).map((key) => [key, payload[key]]));

export function validateItemPayload(db, item, existing = null) {
  const next = { ...existing, ...cleanItemPayload(item) };
  const category = db.rows('budget-categories').find((row) => Number(row.bcat_id ?? row.id) === Number(next.bri_category_id));
  const oldCategory = db.rows('budget-categories').find((row) => Number(row.bcat_id ?? row.id) === Number(existing?.bri_category_id));
  return getLineItemErrors(financialItemFromStored(next, db.rows('budget-categories')), { allowLegacy: category?.bcat_code === 'TAG' && oldCategory?.bcat_code === 'TAG' });
}

export function validateRequestPayload(db, payload, existing = null) {
  const errors = [];
  const next = { ...existing, ...payload };
  errors.push(...requesterSignoffChanges(payload.br_unified_request?.formValues, existing?.br_unified_request?.formValues));
  const unified = payload.br_unified_request;
  if (unified && typeof unified === 'object') {
    for (const key of ['formValues', 'request', 'answers', 'overrides']) if (Object.hasOwn(unified, key) && (!unified[key] || typeof unified[key] !== 'object' || Array.isArray(unified[key]))) errors.push(`Provide valid ${key} data.`);
    if (unified.formValues && typeof unified.formValues === 'object') for (const values of Object.values(unified.formValues)) if (!values || typeof values !== 'object' || Array.isArray(values)) errors.push('Provide valid form field values.');
  }
  if (!String(next.br_title || '').trim() || typeof next.br_title !== 'string' || next.br_title.length > 255) errors.push('Enter a request title of 1 to 255 characters.');
  if (!db.rows('requesting-units').some((row) => Number(row.ru_id) === Number(next.br_requesting_unit_id))) errors.push('Choose a valid requesting unit.');
  if (existing?.br_unified_request && (!next.br_unified_request || typeof next.br_unified_request !== 'object')) errors.push('The unified request data cannot be removed.');
  if (Object.hasOwn(payload, 'br_unified_request') && (!payload.br_unified_request || typeof payload.br_unified_request !== 'object' || Array.isArray(payload.br_unified_request))) errors.push('Provide valid unified request data.');
  // Legacy native entries may remain linked, but the requester cannot use an
  // arbitrary entry ID to read another institution's Forms-library PDF.
  const previousEntries = existing?.br_form_entries || (existing?.br_form_entry_id ? [{ entryId: existing.br_form_entry_id }] : []);
  if (Object.hasOwn(payload, 'br_form_entries') && (!Array.isArray(payload.br_form_entries) || payload.br_form_entries.some((entry) => !previousEntries.some((old) => old.entryId === entry?.entryId)))) errors.push('Native form entries must already belong to this request. Use the wizard and signed uploads for new requester forms.');
  if (payload.br_form_entry_id && payload.br_form_entry_id !== existing?.br_form_entry_id) errors.push('Native form entries must already belong to this request.');
  if (Object.hasOwn(payload, 'items')) {
    if (!Array.isArray(payload.items)) errors.push('Provide a list of line items.');
    else {
      const seen = new Set();
      for (const item of payload.items) {
        if (!item || typeof item !== 'object') { errors.push('Provide a valid line item.'); continue; }
        const previous = item.bri_id == null ? null : db.find('budget-request-items', item.bri_id);
        if (item.bri_id != null && (!previous || Number(previous.bri_br_id) !== Number(existing?.br_id ?? existing?.id) || seen.has(String(item.bri_id)))) errors.push('Each item must belong to this request and appear once.');
        seen.add(String(item.bri_id));
        errors.push(...validateItemPayload(db, item, previous));
      }
    }
  }
  if (Object.hasOwn(payload, 'br_attached_files')) {
    if (!Array.isArray(payload.br_attached_files)) errors.push('Provide a list of attachments.');
    else for (const file of payload.br_attached_files) {
      if (!file || typeof file !== 'object') { errors.push('Provide a valid attachment.'); continue; }
      if (file.url || file.fileUrl) {
        if (!(existing?.br_attached_files || []).some((old) => old.id === file.id && String(old.url || old.fileUrl) === String(file.url || file.fileUrl))) errors.push('Existing attachments must belong to this request.');
      } else if (!/^data:[^;]+;base64,[a-zA-Z0-9+/=\r\n]+$/.test(String(file.dataUrl || ''))) errors.push('Upload attachment contents.');
    }
  }
  return errors;
}
