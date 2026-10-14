// Shared schema behavior for cycle configuration, guided entry and PDF preparation.
// Calculations are declarative; neither administrator settings nor workbook formulas execute code.
import { matchesRequirement } from './bp_form_conditions.js';

export const ENTRY_TYPES = ['text', 'textarea', 'number', 'currency', 'date', 'select', 'radio', 'checkbox', 'attachment', 'table', 'group'];
export const isRepeatingField = (field) => ['table', 'group'].includes(field.type);
export const isNumericField = (field) => ['number', 'currency'].includes(field.type);
export const isFieldVisible = (field, context = {}) => field.enabled !== false && (!field.visibleWhen || matchesRequirement(field.visibleWhen, { answers: context.answers || {}, common: context.common || {}, totals: context.totals || {} }));
export const formatPesos = (value, divisor = 1) => value === '' || value == null ? '' : !Number.isFinite(Number(value)) ? 'Invalid amount' : (Number(value) / divisor).toLocaleString('en-PH', { minimumFractionDigits: divisor === 1000 ? 3 : 2, maximumFractionDigits: divisor === 1000 ? 5 : 2 });

export function calculateValue(field, row) {
  const values = (field.operands || []).map((key) => row[key]);
  if (!values.length || values.some((value) => value === '' || value == null || !Number.isFinite(Number(value)))) return null;
  const numbers = values.map(Number);
  const amount = field.calculation === 'multiply' ? numbers.reduce((a, b) => a * b, 1)
    : field.calculation === 'difference' ? numbers.slice(1).reduce((a, b) => a - b, numbers[0]) : numbers.reduce((a, b) => a + b, 0);
  const scale = 10 ** (field.precision ?? 2);
  return Math.round((amount + Number.EPSILON) * scale) / scale;
}

export function resolveEntryFields(fields, values = {}, context = {}) {
  const row = { ...values };
  for (const field of fields) {
    if (isRepeatingField(field)) row[field.key] = (Array.isArray(values[field.key]) ? values[field.key] : []).map((entry) => resolveEntryFields(field.columns, entry, context));
    else if (field.source === 'canonical') row[field.key] = context.common?.[field.canonical] ?? '';
    else if (field.source === 'derived') row[field.key] = context.derived?.[field.derived] ?? '';
    else if (field.calculation) row[field.key] = calculateValue(field, row);
  }
  return row;
}
