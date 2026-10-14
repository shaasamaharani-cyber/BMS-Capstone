// NBM No. 156, BP Form B and instructions, PDF pages 47–48.
// Values are text: a performance target can be a percentage, count or descriptive milestone.
export const PERFORMANCE_COLUMNS = [
  { key: 'outcome', label: 'Organisational outcome', type: 'text' },
  { key: 'program', label: 'Program', type: 'text' },
  { key: 'subprogram', label: 'Sub-program', type: 'text' },
  { key: 'indicatorType', label: 'Indicator type', type: 'select', options: ['Outcome indicator', 'Output indicator'] },
  { key: 'indicator', label: 'Performance indicator', type: 'text' },
  { key: 'actualTarget', label: '{actualYear} GAA targets', type: 'text' },
  { key: 'actualAccomplishment', label: '{actualYear} actual accomplishments', type: 'text' },
  { key: 'currentTarget', label: '{currentYear} GAA targets', type: 'text' },
  { key: 'baseline', label: 'Baseline / unit (Matrix of Indicator Definitions)', type: 'text' },
  { key: 'proposedTier1', label: '{fiscalYear} NEP targets — Tier 1', type: 'text' },
  { key: 'proposedTier2', label: '{fiscalYear} NEP targets — Tier 2', type: 'text' },
  { key: 'proposedTarget', label: 'Internal: legacy proposed NEP target (tier unassigned)', type: 'text', legacy: true },
  { key: 'outyearOne', label: 'Internal: legacy outyear 1 target', type: 'text', legacy: true },
  { key: 'outyearTwo', label: 'Internal: legacy outyear 2 target', type: 'text', legacy: true },
];

export const PERFORMANCE_SIGNATORIES = [
  { key: 'budgetOfficer', label: 'Prepared by — Budget officer', role: 'Budget officer' },
  { key: 'planningOfficer', label: 'Prepared by — Planning officer', role: 'Planning officer' },
  { key: 'agencyHead', label: 'Approved by — Agency head', role: 'Agency head' },
];

const OLD_COLUMN_KEYS = ['outcome', 'program', 'indicator', 'baseline', 'actualTarget', 'actualAccomplishment', 'currentTarget', 'proposedTarget', 'outyearOne', 'outyearTwo'];

// Only the previous built-in table shape is upgraded. Custom administrator tables and
// captured submission definitions retain their own fields. No stored values are converted.
export function upgradeLegacyPerformanceFields(fields, signatoryFields) {
  const table = fields.find((field) => field.key === 'performance' && field.type === 'table');
  if (table?.columns?.map((column) => column.key).join('|') !== OLD_COLUMN_KEYS.join('|')) return fields;
  return [
    ...fields.map((field) => field === table ? { ...field, columns: PERFORMANCE_COLUMNS } : field),
    ...signatoryFields.filter((field) => !fields.some((existing) => existing.key === field.key)),
  ];
}

export function performanceYearLabel(label, fiscalYear) {
  const year = Number(fiscalYear);
  return label.replaceAll('{fiscalYear}', year || 'proposed year')
    .replaceAll('{actualYear}', year ? year - 2 : 'actual year')
    .replaceAll('{currentYear}', year ? year - 1 : 'current year');
}
