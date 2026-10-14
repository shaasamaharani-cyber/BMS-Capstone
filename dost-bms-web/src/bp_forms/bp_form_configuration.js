import { CANONICAL_FIELD_LABELS, DERIVED_FIELD_LABELS, FIELD_SOURCE } from './bp_form_fields.js';
import { CONDITION_OPTIONS, NUMBER_OPERATORS, VALUE_OPERATORS } from './bp_form_conditions.js';
import { ENTRY_TYPES, isRepeatingField, isNumericField } from './form_schema.js';

export const FIELD_TYPE_OPTIONS = ENTRY_TYPES.map((value, index) => ({ value, label: ['Text', 'Long text', 'Number', 'Currency (stored in pesos)', 'Date', 'Dropdown', 'Radio choices', 'Checkbox', 'Attachment', 'Repeatable entry cards', 'Repeatable group'][index] }));
const reservedKeys = new Set(['__proto__', 'constructor', 'prototype', '__done']);

// Shared validation prevents an invalid editor configuration reaching the requester renderer.
export function validateFormConfig(value, depth = 0) {
  if (depth > 8) return { error: 'Repeatable groups may be nested up to eight levels.' };
  if (!value || typeof value !== 'object' || !['request', 'agency'].includes(value.level)) return { error: 'Choose a form level.' };
  if (value.completedBy !== undefined && (typeof value.completedBy !== 'string' || !value.completedBy.trim() || value.completedBy.trim().length > 150)) return { error: 'Enter a completing office (up to 150 characters).' };
  if (!Array.isArray(value.fields) || value.fields.length < 1) return { error: 'Add at least one field to this form.' };
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
    for (const property of ['description', 'section', 'reference', 'contributor']) {
      if (field[property] !== undefined) {
        if (typeof field[property] !== 'string' || field[property].length > 4000) return { error: `Provide valid ${property} for ${label}.` };
        next[property] = field[property];
      }
    }
    if (field.enabled === false) next.enabled = false;
    if (field.outputOnly === true) next.outputOnly = true;
    if (field.legacy === true) next.legacy = true;
    if (field.validation !== undefined) {
      if (!field.validation || typeof field.validation !== 'object' || Array.isArray(field.validation)) return { error: `Choose valid validation rules for ${label}.` };
      next.validation = {};
      for (const key of ['min', 'max', 'maxLength']) if (field.validation[key] !== undefined) {
        if (!Number.isFinite(Number(field.validation[key])) || (key === 'maxLength' && (!Number.isInteger(Number(field.validation[key])) || Number(field.validation[key]) < 1))) return { error: `Choose a valid ${key} for ${label}.` };
        next.validation[key] = Number(field.validation[key]);
      }
      if (next.validation.min > next.validation.max) return { error: `Minimum cannot exceed maximum for ${label}.` };
      if (field.validation.integer === true) next.validation.integer = true;
      if (field.validation.allowNegative === true) next.validation.allowNegative = true;
    }
    if (field.visibleWhen) {
      const visibility = validateFormConfig({ level: 'request', fields: [{ key: 'visibility', label: 'Visibility', source: 'user', type: 'text' }], requirement: { ...field.visibleWhen, mode: 'conditional' } }, depth + 1);
      if (visibility.error) return visibility;
      next.visibleWhen = visibility.config.requirement;
    }
    if (field.calculation) {
      if (!isNumericField(field) || !['sum', 'multiply', 'difference'].includes(field.calculation) || !Array.isArray(field.operands) || !field.operands.length || field.operands.some((key) => !fields.some((previous) => previous.key === key && isNumericField(previous)))) return { error: `Choose earlier numeric operands for ${label}.` };
      next.calculation = field.calculation;
      next.operands = [...field.operands];
      next.required = false;
    }
    if (field.source === FIELD_SOURCE.CANONICAL) {
      if (!Object.hasOwn(CANONICAL_FIELD_LABELS, field.canonical)) return { error: `Choose a request value for ${label}.` };
      next.canonical = field.canonical;
    } else if (field.source === FIELD_SOURCE.DERIVED) {
      if (!Object.hasOwn(DERIVED_FIELD_LABELS, field.derived)) return { error: `Choose a calculated value for ${label}.` };
      next.derived = field.derived;
    } else if (isRepeatingField(field)) {
      if (!Array.isArray(field.columns) || !field.columns.length) return { error: `Add fields to the repeating section ${label}.` };
      const result = validateFormConfig({ level: 'request', fields: field.columns.map((column) => ({ ...column, source: column.source || FIELD_SOURCE.USER })), requirement: { mode: 'optional', match: 'any', conditions: [] } }, depth + 1);
      if (result.error) return result;
      const available = new Set();
      next.columns = [];
      for (const [index, column] of field.columns.entries()) {
        const normalized = result.config.fields[index];
        if (column.calculation) {
          if (!['sum', 'multiply', 'difference'].includes(column.calculation) || !isNumericField(column) || !Array.isArray(column.operands) || !column.operands.length || column.operands.some((key) => !available.has(key))) return { error: `Choose valid earlier columns for the calculation in ${column.label}.` };
          normalized.calculation = column.calculation;
          normalized.operands = [...column.operands];
        }
        next.columns.push(normalized);
        available.add(column.key);
      }
    } else if (['select', 'radio'].includes(type)) {
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
    if (row?.questionId && row.field && row.questionId !== row.field) return { error: 'The condition question and request value must match.' };
    const option = CONDITION_OPTIONS.find((item) => item.field === (row?.questionId || row?.field));
    if (!row || !/^[a-zA-Z0-9-]{1,80}$/.test(row.id) || ids.has(row.id) || !option) return { error: 'Each condition needs a unique identifier and a valid request value.' };
    const operators = option.numeric ? NUMBER_OPERATORS : VALUE_OPERATORS;
    if (!operators.some((operator) => operator.value === row.operator)) return { error: `Choose a valid comparison for ${option.label}.` };
    if (option.numeric ? (!['string', 'number'].includes(typeof row.value) || String(row.value).trim() === '' || !Number.isFinite(Number(row.value)) || Number(row.value) < 0) : !option.options.some((item) => item.value === row.value)) return { error: `Enter a valid value for ${option.label}.` };
    conditions.push({ id: row.id, field: option.field, ...(row.questionId ? { questionId: option.field } : {}), operator: row.operator, value: option.numeric ? Number(row.value) : row.value, enabled: row.enabled !== false });
    ids.add(row.id);
  }
  if (requirement.mode === 'conditional' && !conditions.length) return { error: 'Add at least one condition, or choose a different requirement mode.' };
  const sections = [];
  if (value.sections !== undefined) {
    if (!Array.isArray(value.sections)) return { error: 'Provide a list of sections.' };
    const sectionIds = new Set();
    for (const section of value.sections) {
      if (!/^[a-zA-Z][a-zA-Z0-9_-]{0,79}$/.test(section?.id) || sectionIds.has(section.id) || typeof section.title !== 'string' || !section.title.trim() || section.title.length > 250) return { error: 'Each section needs a stable unique ID and a title.' };
      if (section.description !== undefined && (typeof section.description !== 'string' || section.description.length > 4000)) return { error: 'Section descriptions must contain up to 4,000 characters.' };
      sections.push({ id: section.id, title: section.title.trim(), description: section.description || '' });
      sectionIds.add(section.id);
    }
  }
  return { config: { level: value.level, ...(value.sections !== undefined ? { sections } : {}), ...(value.completedBy !== undefined ? { completedBy: value.completedBy.trim() } : {}), fields, requirement: { mode: requirement.mode, enabled: requirement.enabled !== false, allowOverride: requirement.allowOverride === true, match: requirement.match, conditions } } };
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
