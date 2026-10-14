import { PROPOSAL_QUESTIONS } from './proposal_questions.js';

// Old numeric and aggregate-funding conditions remain readable; new editor rows use questions.
export const QUESTION_CONDITION_OPTIONS = PROPOSAL_QUESTIONS.map((question) => ({ ...question, field: question.id }));
export const CONDITION_OPTIONS = [
  ...QUESTION_CONDITION_OPTIONS.map((question) => question.id === 'fundingSource'
    ? { ...question, options: [...question.options, { value: 'foreign', label: 'Foreign grant or loan' }] } : question),
  ...[['psTotal', 'PS amount'], ['mooeTotal', 'MOOE amount'], ['finexTotal', 'FinEx amount'], ['coTotal', 'CO amount'], ['climateTotal', 'Climate-tagged amount'], ['tagTotal', 'Legacy TAG amount'], ['grandTotal', 'Total request amount']]
    .map(([field, label]) => ({ field, label, source: 'totals', numeric: true })),
];

export const NUMBER_OPERATORS = [{ value: 'gt', label: 'Greater than' }, { value: 'gte', label: 'At least' }, { value: 'lt', label: 'Less than' }, { value: 'lte', label: 'At most' }, { value: 'equals', label: 'Equals' }];
export const VALUE_OPERATORS = [{ value: 'equals', label: 'Is' }, { value: 'not_equals', label: 'Is not' }];

export function matchesCondition(condition, context) {
  const option = CONDITION_OPTIONS.find((row) => row.field === (condition.questionId || condition.field));
  if (!option) return false;
  const actual = context[option.source]?.[(condition.questionId || condition.field)];
  if (actual === undefined || actual === null || actual === '') return false;
  if (option.numeric) {
    const left = Number(actual);
    const right = Number(condition.value);
    if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
    return ({ gt: () => left > right, gte: () => left >= right, lt: () => left < right, lte: () => left <= right, equals: () => left === right })[condition.operator]?.() || false;
  }
  const equal = (condition.questionId || condition.field) === 'fundingSource' && condition.value === 'foreign'
    ? ['foreign_grant', 'foreign_loan'].includes(actual) : String(actual) === String(condition.value);
  if (!option.options.some((row) => row.value === actual)) return false;
  return condition.operator === 'not_equals' ? !equal : condition.operator === 'equals' ? equal : false;
}

export function matchesRequirement(requirement, context) {
  if (requirement.enabled === false) return false;
  const conditions = (requirement.conditions || []).filter((row) => row.enabled !== false);
  if (!conditions.length) return false;
  return requirement.match === 'all' ? conditions.every((row) => matchesCondition(row, context)) : conditions.some((row) => matchesCondition(row, context));
}

export function describeCondition(condition) {
  const option = CONDITION_OPTIONS.find((row) => row.field === (condition.questionId || condition.field));
  const operator = [...NUMBER_OPERATORS, ...VALUE_OPERATORS].find((row) => row.value === condition.operator)?.label || 'Is';
  const value = option?.options?.find((row) => row.value === condition.value)?.label || condition.value;
  return `${option?.label || (condition.questionId || condition.field)} ${operator.toLowerCase()} ${value}`;
}
