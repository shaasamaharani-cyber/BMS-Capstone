const yesNo = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
export const CONDITION_OPTIONS = [
  { field: 'proposalTier', source: 'answers', label: 'Proposal tier', options: [{ value: 'tier1', label: 'Tier 1' }, { value: 'tier2', label: 'Tier 2' }] },
  { field: 'fundingSource', source: 'common', label: 'Funding source', options: [{ value: 'national_government', label: 'National Government' }, { value: 'foreign_grant', label: 'Foreign grant' }, { value: 'foreign_loan', label: 'Foreign loan' }, { value: 'foreign', label: 'Foreign grant or loan' }, { value: 'other', label: 'Other' }] },
  ...[
    ['hasOutyear', 'Outyear funding'], ['hasFinEx', 'Financial expenses'], ['isPcb', 'Convergence program'],
    ['hasClimate', 'Climate expenditure'], ['hasNonPermanent', 'Non-permanent positions'], ['hasRetirement', 'Retirement requirements'],
    ['hasEarmarked', 'Earmarked revenues'], ['hasOtherReceipts', 'Other receipts'], ['hasDonations', 'Donations or grants'],
    ['hasProvisions', 'New or amended provisions'], ['hasRdcInputs', 'RDC inputs'], ['hasCsoInputs', 'CSO inputs'],
  ].map(([field, label]) => ({ field, label, source: 'answers', options: yesNo })),
  ...[['psTotal', 'PS amount'], ['mooeTotal', 'MOOE amount'], ['coTotal', 'CO amount'], ['tagTotal', 'TAG amount'], ['grandTotal', 'Total request amount']]
    .map(([field, label]) => ({ field, label, source: 'totals', numeric: true })),
];

export const NUMBER_OPERATORS = [{ value: 'gt', label: 'Greater than' }, { value: 'gte', label: 'At least' }, { value: 'lt', label: 'Less than' }, { value: 'lte', label: 'At most' }, { value: 'equals', label: 'Equals' }];
export const VALUE_OPERATORS = [{ value: 'equals', label: 'Is' }, { value: 'not_equals', label: 'Is not' }];

export function matchesCondition(condition, context) {
  const option = CONDITION_OPTIONS.find((row) => row.field === condition.field);
  if (!option) return false;
  const actual = context[option.source]?.[condition.field];
  if (actual === undefined || actual === null || actual === '') return false;
  if (option.numeric) {
    const left = Number(actual);
    const right = Number(condition.value);
    if (!Number.isFinite(left) || !Number.isFinite(right)) return false;
    return ({ gt: () => left > right, gte: () => left >= right, lt: () => left < right, lte: () => left <= right, equals: () => left === right })[condition.operator]?.() || false;
  }
  const equal = condition.field === 'fundingSource' && condition.value === 'foreign'
    ? ['foreign_grant', 'foreign_loan'].includes(actual) : String(actual) === String(condition.value);
  return condition.operator === 'not_equals' ? !equal : equal;
}

export function matchesRequirement(requirement, context) {
  if (requirement.enabled === false) return false;
  const conditions = (requirement.conditions || []).filter((row) => row.enabled !== false);
  if (!conditions.length) return false;
  return requirement.match === 'all' ? conditions.every((row) => matchesCondition(row, context)) : conditions.some((row) => matchesCondition(row, context));
}

export function describeCondition(condition) {
  const option = CONDITION_OPTIONS.find((row) => row.field === condition.field);
  const operator = [...NUMBER_OPERATORS, ...VALUE_OPERATORS].find((row) => row.value === condition.operator)?.label || 'Is';
  const value = option?.options?.find((row) => row.value === condition.value)?.label || condition.value;
  return `${option?.label || condition.field} ${operator.toLowerCase()} ${value}`;
}
