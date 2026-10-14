import { CANONICAL_FIELD_LABELS, DERIVED_FIELD_LABELS, FIELD_SOURCE } from './bp_form_fields.js';
import { CONDITION_OPTIONS, NUMBER_OPERATORS, VALUE_OPERATORS } from './bp_form_conditions.js';

export const FIELD_TYPE_OPTIONS = [{ value: 'text', label: 'Text' }, { value: 'textarea', label: 'Long text' }, { value: 'number', label: 'Number' }, { value: 'date', label: 'Date' }, { value: 'select', label: 'Dropdown' }, { value: 'checkbox', label: 'Checkbox' }];
const reservedKeys = new Set(['__proto__', 'constructor', 'prototype', '__done']);

// Shared validation prevents an invalid editor configuration reaching the requester renderer.
export function validateFormConfig(value) {
  if (!value || typeof value !== 'object' || !['request', 'agency'].includes(value.level)) return { error: 'Choose a form level.' };
  if (!Array.isArray(value.fields) || value.fields.length < 1 || value.fields.length > 150) return { error: 'Add between 1 and 150 fields to this form.' };
  const fields = [];
  const keys = new Set();
  for (const field of value.fields) {
    const key = String(field?.key || '').trim();
    const label = String(field?.label || '').trim();
    const type = field?.type || 'text';
    if (!/^[a-zA-Z][a-zA-Z0-9_]{0,79}$/.test(key) || reservedKeys.has(key) || keys.has(key)) return { error: 'Each field needs a unique valid identifier.' };
    if (!label || label.length > 200) return { error: 'Each field needs a label (up to 200 characters).' };
    if (!FIELD_TYPE_OPTIONS.some((option) => option.value === type) || !Object.values(FIELD_SOURCE).includes(field.source)) return { error: `Choose a valid type and source for ${label}.` };
    const next = { key, label, type, source: field.source, required: field.source === FIELD_SOURCE.USER && Boolean(field.required) };
    if (field.source === FIELD_SOURCE.CANONICAL) {
      if (!Object.hasOwn(CANONICAL_FIELD_LABELS, field.canonical)) return { error: `Choose a request value for ${label}.` };
      next.canonical = field.canonical;
    } else if (field.source === FIELD_SOURCE.DERIVED) {
      if (!Object.hasOwn(DERIVED_FIELD_LABELS, field.derived)) return { error: `Choose a calculated value for ${label}.` };
      next.derived = field.derived;
    } else if (type === 'select') {
      if (!Array.isArray(field.options) || !field.options.length || field.options.length > 100 || field.options.some((option) => typeof option !== 'string' || !option.trim() || option.length > 200)) return { error: `Add dropdown options for ${label} (one per line).` };
      next.options = field.options.map((option) => option.trim());
      if (new Set(next.options).size !== next.options.length) return { error: `Dropdown options for ${label} must be different.` };
    }
    fields.push(next);
    keys.add(key);
  }
  const requirement = value.requirement;
  if (!requirement || !['default', 'always', 'conditional', 'optional'].includes(requirement.mode) || !['any', 'all'].includes(requirement.match)) return { error: 'Choose when this form is required and how conditions match.' };
  if (!Array.isArray(requirement.conditions) || requirement.conditions.length > 50) return { error: 'Use 50 conditions or fewer.' };
  const conditions = [];
  const ids = new Set();
  for (const row of requirement.conditions) {
    const option = CONDITION_OPTIONS.find((item) => item.field === row?.field);
    if (!row || !/^[a-zA-Z0-9-]{1,80}$/.test(row.id) || ids.has(row.id) || !option) return { error: 'Each condition needs a unique identifier and a valid request value.' };
    const operators = option.numeric ? NUMBER_OPERATORS : VALUE_OPERATORS;
    if (!operators.some((operator) => operator.value === row.operator)) return { error: `Choose a valid comparison for ${option.label}.` };
    if (option.numeric ? (!['string', 'number'].includes(typeof row.value) || String(row.value).trim() === '' || !Number.isFinite(Number(row.value)) || Number(row.value) < 0) : !option.options.some((item) => item.value === row.value)) return { error: `Enter a valid value for ${option.label}.` };
    conditions.push({ id: row.id, field: row.field, operator: row.operator, value: option.numeric ? Number(row.value) : row.value, enabled: row.enabled !== false });
    ids.add(row.id);
  }
  if (requirement.mode === 'conditional' && !conditions.length) return { error: 'Add at least one condition, or choose a different requirement mode.' };
  return { config: { level: value.level, fields, requirement: { mode: requirement.mode, enabled: requirement.enabled !== false, match: requirement.match, conditions } } };
}

export function validateFormConfigs(value, arrFormIds) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return { error: 'Provide form definitions for this fiscal year.' };
  const configs = {};
  for (const [id, config] of Object.entries(value)) {
    if (!arrFormIds.includes(id) || reservedKeys.has(id)) return { error: 'Only forms belonging to this fiscal year can be configured.' };
    const result = validateFormConfig(config);
    if (result.error) return { error: result.error };
    configs[id] = result.config;
  }
  return { configs };
}
