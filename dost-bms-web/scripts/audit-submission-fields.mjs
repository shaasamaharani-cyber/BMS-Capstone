import { writeFile } from 'node:fs/promises';
import { URL } from 'node:url';
import console from 'node:console';
import { getDefaultFormDefinition } from '../src/bp_forms/bp_form_fields.js';
import { BP_FORM_CATALOG } from '../src/bp_forms/bp_form_catalog.js';
import { laterStageOwner } from '../src/bp_forms/field_ownership.js';

const walk = (fields, path = '') => fields.flatMap((field) => [{
  path: path + field.key, label: field.label, type: field.type || 'text', source: field.source || 'user',
  required: Boolean(field.required), owner: laterStageOwner(field) || null,
  reference: field.reference || null, recordSource: field.recordSource || null,
  calculation: field.calculation || null, operands: field.operands || null,
  visibleWhen: field.visibleWhen || null, legacy: Boolean(field.legacy),
}, ...walk(field.columns || [], path + field.key + '[].')]);
const forms = BP_FORM_CATALOG.flatMap((form) => {
  const definition = getDefaultFormDefinition(form.id);
  return definition ? [{ formId: form.id, code: form.code, level: form.level, completedBy: form.completedBy,
    official: Boolean(definition.official), sections: definition.sections || [], fields: walk(definition.fields) }] : [];
});
await writeFile(new URL('../../docs/submission_form_audit.json', import.meta.url), JSON.stringify({
  scope: 'Current built-in definitions; live cycle overlays must be inspected per fiscal year. Requirement flags describe implemented requester gates, not DBM official completeness.', forms,
}, null, 2) + '\n');
console.log(`Inventoried ${forms.length} forms and ${forms.reduce((count, form) => count + form.fields.length, 0)} fields, including nested columns. No submission data was read.`);
