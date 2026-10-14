import { OFFICIAL_WORKBOOK_FORMS, WORKBOOK_REFERENCE } from './official_workbook_manifest.js';
import { PERFORMANCE_COLUMNS, PERFORMANCE_SIGNATORIES } from './bp_form_b.js';

export const OFFICIAL_SCHEMA_VERSION = `fy2027-${WORKBOOK_REFERENCE.sha256.slice(0, 12)}`;
const input = (key, label, type = 'text', extra = {}) => ({ key, label, type, source: 'user', required: false, ...extra });
const total = (key, label, operands) => input(key, label, 'currency', { outputOnly: true, calculation: 'sum', operands });
const currencies = ['ps', 'mooe', 'finex', 'co'].map((key) => input(key, key === 'finex' ? 'FinEx (PHP)' : `${key.toUpperCase()} (PHP)`, 'currency'));
const signers = [input('preparedBy', 'Prepared by — name'), input('preparedTitle', 'Prepared by — designation'), input('preparedBy2', 'Second preparer / Planning Officer ? name'), input('preparedTitle2', 'Second preparer ? designation'), input('certifiedBy', 'Certified correct — name'), input('certifiedTitle', 'Certified correct — designation'), input('certifiedBy2', 'Second certification — name'), input('certifiedTitle2', 'Second certification — designation'), input('approvedBy', 'Approved by — name'), input('approvedTitle', 'Approved by — designation'), input('reportDate', 'Date', 'date')].map((field) => ({ ...field, section: 'signoff' }));
const group = (key, label, columns, reference, extra = {}) => input(key, label, 'table', { columns, reference, section: key, ...extra });
const getRef = (form, section) => form.sections.find((row) => row.key === section)?.reference;
const yearTemplate = (label) => label.replace(/202[5-9]/g, (year) => ({ 2025: '{actualYear}', 2026: '{currentYear}', 2027: '{fiscalYear}', 2028: '{outyearOne}', 2029: '{outyearTwo}' })[year]);

function workbookColumns(form, section) {
  const columns = section.columns.map((column) => input(column.key, form.id === 'bp-206' && section.key === 'physical' ? column.label : yearTemplate(column.label), column.type, { reference: column.reference, outputOnly: column.outputOnly, section: form.id === 'bp-206' && section.key === 'physical' ? column.headingPath[0] || section.title : yearTemplate(column.headingPath[0] || section.title) }));
  // Total only disjoint input columns. Never sum a parent rollup together with its children.
  for (const [index, column] of columns.entries()) if (column.outputOnly) {
    const inputs = columns.slice(0, index).filter((item) => item.type === 'currency' && !item.outputOnly);
    if (index === columns.length - 1 && inputs.length && !columns.slice(0, index).some((item) => item.outputOnly)) Object.assign(column, { calculation: 'sum', operands: inputs.map((item) => item.key) });
    column.required = false;
  }
  if (form.id === 'bp-201-e') {
    for (const [key, operands] of Object.entries({ G: ['C', 'D', 'E', 'F'], L: ['H', 'I', 'J', 'K'], M: ['G', 'L'], R: ['N', 'O', 'P', 'Q'], W: ['S', 'T', 'U', 'V'], X: ['R', 'W'] })) Object.assign(columns.find((column) => column.key === `col_${key}`), { calculation: 'sum', operands: operands.map((col) => `col_${col}`), outputOnly: true });
  }
  if (form.id === 'bp-202' && section.key === 'papFunding') Object.assign(columns.find((column) => column.key === 'col_D'), { calculation: 'sum', operands: ['col_B', 'col_C'] });
  if (form.id === 'bp-203' && section.key === 'comparative') Object.assign(columns.find((column) => column.key === 'col_F'), { calculation: 'sum', operands: ['col_D', 'col_E'] });
  if (form.id === 'bp-203' && section.key === 'components') {
    for (const [key, operands] of Object.entries({ E: ['B', 'C', 'D'], I: ['F', 'G', 'H'], O: ['L', 'M', 'N'], P: ['B', 'F', 'J', 'L'], Q: ['C', 'G', 'K', 'M'], R: ['D', 'H', 'N'], S: ['P', 'Q', 'R'] })) Object.assign(columns.find((column) => column.key === `col_${key}`), { calculation: 'sum', operands: operands.map((col) => `col_${col}`), outputOnly: true });
  }
  // Physical targets can be percentages or narrative indicators. A financial sum
  // would impose unsupported units; their total cells remain explicit office inputs.
  if (section.key === 'physical') for (const column of columns) if (!['number', 'currency'].includes(column.type)) column.outputOnly = false;
  if (form.id === 'bp-204') {
    Object.assign(columns[6], { outputOnly: true, calculation: 'multiply', operands: ['col_E', 'col_F'] });
    Object.assign(columns[9], { outputOnly: true, calculation: 'multiply', operands: ['col_G', 'col_H'] });
    Object.assign(columns[23], { outputOnly: true, calculation: 'sum', operands: columns.slice(10, 23).map((column) => column.key) });
    Object.assign(columns[24], { outputOnly: true, calculation: 'sum', operands: ['col_J', 'col_X'] });
  }
  if (form.id === 'bp-207' && section.key === 'climateProposed') {
    for (const [key, operands] of Object.entries({ F: ['D', 'E'], I: ['G', 'H'], J: ['D', 'G'], K: ['E', 'H'], L: ['J', 'K'] })) Object.assign(columns.find((column) => column.key === `col_${key}`), { outputOnly: true, calculation: 'sum', operands: operands.map((col) => `col_${col}`) });
  }
  if (form.id === 'bp-205') {
    const amount = columns.find((column) => column.key === 'col_J');
    const position = columns.indexOf(amount);
    columns.splice(position, 0, { ...total('leaveCredits', 'Total leave credits (calculated)', ['col_H', 'col_I']), type: 'number', precision: 3 }, input('terminalLeaveFactor', 'HR-confirmed terminal leave factor (no default rate)', 'number', { contributor: 'HR', description: 'Enter only a factor independently confirmed by the responsible office. No statutory rate is assumed.' }));
    Object.assign(amount, { outputOnly: true, calculation: 'multiply', operands: ['col_G', 'leaveCredits', 'terminalLeaveFactor'] });
  }
  // No automatic statutory factors, contribution rates, or inferred object codes.
  return columns;
}

const existingGroup = { 'bp-b': 'performance', 'bp-c': 'rdcInputs', 'bp-d': 'csoInputs' };
const aliases = {
  'bp-b': ['indicator', 'dataSource', 'actualAccomplishment', 'currentTarget', 'baseline', 'proposedTier1', 'proposedTier2', 'remarks'],
  'bp-c': ['pap', 'tierOne', 'rdcTierTwo', 'included', 'excluded', 'total', 'rationale', 'feedback'],
  'bp-d': ['prexc', 'pap', 'locationCode', 'ongoing', 'newSpending', 'amount', 'basis', 'feedback'],
};

export function extendOfficialDefinition(formId, original = { fields: [], table: null }) {
  const form = OFFICIAL_WORKBOOK_FORMS.find((row) => row.id === formId);
  if (!form) return original;
  let fields = original.fields.map((field) => ({ ...field, section: field.source === 'canonical' ? 'common' : field.source === 'derived' ? 'financialSummary' : field.section || 'details' }));
  if (formId === 'bp-b' && !fields.some((field) => field.key === 'performance')) fields.push(group('performance', 'Performance measures and targets', PERFORMANCE_COLUMNS, form.sections[0].reference), ...PERFORMANCE_SIGNATORIES.map((signer) => input(signer.key, signer.label)), input('approvalDate', 'Date', 'date'));
  if (['bp-c', 'bp-d'].includes(formId) && !fields.some((field) => field.key === existingGroup[formId])) fields.push(group(existingGroup[formId], form.sections[0].title, form.sections[0].columns.map((column, index) => input(aliases[formId][index], column.label, column.type, { reference: column.reference })), form.sections[0].reference));
  const additions = [];
  if (formId === 'bp-a') {
    additions.push(group('programHistory', 'Program obligations and requirements by period', [
      input('period', 'Reporting period', 'radio', { options: ['Actual obligations', 'Current program', 'Proposed program'] }), input('tier', 'Budget tier (for proposed)', 'select', { options: ['Tier 1', 'Tier 2'] }),
      input('costStructure', 'Cost structure', 'select', { options: ['General Administration and Support', 'Support to Operations', 'Operations'] }),
      input('prexcCode', 'Verified UACS / PREXC reference'), input('pap', 'Program / activity / project'), input('status', 'Program status', 'select', { options: ['OG', 'P', 'T'] }),
      ...currencies, total('total', 'Total (PHP)', ['ps', 'mooe', 'finex', 'co']),
    ], getRef(form, 'matrix')));
  } else if (existingGroup[formId]) {
    fields = fields.map((field) => {
      if (field.key !== existingGroup[formId]) return field;
      const source = form.sections[0];
      const columns = [...field.columns];
      for (const [index, column] of source.columns.entries()) {
        const key = aliases[formId][index];
        const mapped = columns.findIndex((item) => item.key === key);
        if (mapped >= 0) columns[mapped] = { ...columns[mapped], ...(column.type === 'currency' ? { type: 'currency' } : {}), reference: column.reference };
        else columns.push(input(key, column.label, column.type, { reference: column.reference }));
      }
      return { ...field, section: source.key, reference: source.reference, columns };
    });
  } else {
    additions.push(...form.sections.map((section) => group(`official_${section.key}`, section.title, workbookColumns(form, section), section.reference)));
  }
  if (['bp-202', 'bp-203'].includes(formId)) {
    fields = fields.map((field) => ['fundingRequirements', 'physicalTargets', 'projectComponents', 'rationale', 'implementationStrategy', 'prerequisites'].includes(field.key) ? { ...field, required: false, legacy: true, section: 'legacy' } : field);
    if (formId === 'bp-202') additions.push(input('myca', 'For issuance of MYCA', 'checkbox', { section: 'projectInfo', reference: 'BP 202!B15' }));
    {
      const missing = [
        { key: 'projectName', label: 'Proposal / project name', source: 'canonical', canonical: 'projectName', type: 'text' },
        { key: 'implementingAgency', label: 'Implementing department / agency', source: 'canonical', canonical: 'implementingAgency', type: 'text' },
        input('priorityRanking', 'Priority ranking', 'number'), input('projectType', 'Project categorization', 'select', { options: ['New', 'Expanded/Revised'] }), input('infrastructure', 'Infrastructure classification', 'select', { options: ['Infrastructure', 'Non-infrastructure'] }),
        input('pipCode', 'DEPDev PIP code'), input('beneficiaries', 'Beneficiaries', 'textarea'), input('revisedStart', 'Revised start date', 'date'), input('revisedEnd', 'Revised finish date', 'date'),
        ...['implementationStart', 'implementationEnd', 'projectDescription', 'objectives'].map((key) => ({ key, label: ({ implementationStart: 'Original start date', implementationEnd: 'Original finish date', projectDescription: 'Project description', objectives: 'Purpose / objectives' })[key], source: 'canonical', canonical: key, type: key.includes('implementation') ? 'date' : 'textarea' })),
        { key: 'costTotal', label: 'Total proposal cost (PHP)', source: 'derived', derived: 'expenseTotal', type: 'currency' },
      ];
      if (formId === 'bp-202') missing.push(input('originalProjectCost', 'Original total project cost', 'currency'), input('revisedProjectCost', 'Revised total project cost', 'currency'), input('ictClassification', 'ICT classification', 'select', { options: ['ICT', 'Non-ICT'] }));
      for (const field of missing) if (!fields.some((existing) => existing.key === field.key)) fields.push({ ...field, section: 'projectInfo' });
    }
    if (formId === 'bp-202') additions.push(group('official_physical', '13.2 Physical targets', [input('indicator', 'Performance indicator'), input('actual', '{actualYear} actual'), input('current', '{currentYear} current'), input('tier1', '{fiscalYear} Tier 1'), input('tier2', '{fiscalYear} Tier 2'), input('total', '{fiscalYear} total (in indicator units)'), input('outyear1', '{outyearOne} target'), input('outyear2', '{outyearTwo} target')], 'BP 202!A42:B53'));
    const originals = ['projectName', 'implementingAgency', 'priorityRanking', 'projectType', 'pipCode', 'originalProjectCost', 'revisedProjectCost', 'costTotal', 'projectDescription', 'objectives', 'beneficiaries', 'implementationStart', 'implementationEnd', 'revisedStart', 'revisedEnd'];
    for (const field of fields) if (originals.includes(field.key)) field.section = ['projectDescription', 'objectives', 'beneficiaries'].includes(field.key) ? 'justification' : 'projectInfo';
  }
  if (['bp-201-a', 'bp-201-b', 'bp-201-c', 'bp-201-d', 'bp-201-e', 'bp-204'].includes(formId)) {
    additions.push(input('reportRegion', 'Reporting region', 'text', { section: 'details' }));
    additions.push({ key: 'reportTier', label: 'Proposal tier', source: 'canonical', canonical: 'proposalTier', type: 'text', section: 'common' });
  }
  if (formId === 'bp-204') {
    fields = fields.map((field) => field.source === 'user' ? { ...field, required: false, legacy: true, section: 'legacy' } : field);
    additions.find((field) => field.key === 'official_positions').columns.unshift(input('tier', 'Tier', 'select', { options: ['Tier 1', 'Tier 2'] }), input('classification', 'Employment classification', 'select', { options: ['Casual', 'Contractual'] }));
  }
  if (formId === 'bp-205') {
    fields = fields.map((field) => field.source === 'user' && field.key !== 'retirementType' ? { ...field, required: false, legacy: true, section: 'legacy' } : field);
    if (!fields.some((field) => field.key === 'retirementType')) additions.push(input('retirementType', 'Retirement type', 'radio', { options: ['Mandatory', 'Optional'], section: 'details', reference: 'BP 205!A10' }));
  }
  if (/^bp-201-[a-e]$/.test(formId)) fields = fields.map((field) => field.source === 'user' ? { ...field, required: false, legacy: true, section: 'legacy' } : field);
  if (formId === 'bp-206') {
    additions.push(input('cabinetCluster', '1. Cabinet cluster', 'text', { section: 'details', reference: 'BP 206!A12' }), input('strategies', '8. Strategies and activities / projects to achieve targets', 'textarea', { section: 'details', reference: 'BP 206!A42' }), input('implementationMeasures', '9. Proposed measures to address implementing issues / gaps', 'textarea', { section: 'details', reference: 'NBM 156 p.88, BP 206 item 9' }));
    for (const field of [input('convergenceProgram', '3. Program convergence', 'text', { reference: 'BP 206!A14' }), { key: 'projectDescription', label: '5. Program description', type: 'textarea', source: 'canonical', canonical: 'projectDescription', reference: 'BP 206!A23' }, { key: 'objectives', label: 'Program objectives', type: 'textarea', source: 'canonical', canonical: 'objectives', reference: 'BP 206!A23' }]) if (!fields.some((existing) => existing.key === field.key)) fields.push({ ...field, section: 'details' });
  }
  fields = fields.map((field) => ['originalProjectCost', 'revisedProjectCost', 'foreignAmount', 'counterpartFunding'].includes(field.key) ? { ...field, type: 'currency' } : field);
  const profileRefs = formId === 'bp-202' ? { projectName: 'A11', implementingAgency: 'A12', priorityRanking: 'A13', projectType: 'A14', infrastructure: 'E14', ictClassification: 'E15', pipCode: 'A20', originalProjectCost: 'A22', revisedProjectCost: 'A23', costTotal: 'A24', projectDescription: 'A25', objectives: 'A26', beneficiaries: 'A27', implementationStart: 'B29', implementationEnd: 'B30', revisedStart: 'B32', revisedEnd: 'B33' } : formId === 'bp-203' ? { projectName: 'A11', implementingAgency: 'A12', priorityRanking: 'A13', projectType: 'A14', infrastructure: 'E14', pipCode: 'A16', costTotal: 'A17', projectDescription: 'A18', objectives: 'A19', beneficiaries: 'A20', implementationStart: 'B22', implementationEnd: 'B23', revisedStart: 'B25', revisedEnd: 'B26' } : {};
  fields = fields.map((field) => profileRefs[field.key] ? { ...field, reference: `${form.sheet}!${profileRefs[field.key]}` } : field);
  const common = ['department', 'agency', 'fiscalYear', 'operatingUnit', 'appropriationSource', 'prexcCode'];
  for (const key of common) if (!fields.some((field) => field.key === key)) fields.unshift({ key, label: ({ department: 'Department', agency: 'Agency', fiscalYear: 'Fiscal year', operatingUnit: 'Operating unit', appropriationSource: 'Appropriation source', prexcCode: 'Verified PREXC / UACS reference' })[key], type: 'text', source: 'canonical', canonical: key, section: 'common' });
  // Signatory roles in DBM-OSEC samples are not DOST role assignments.
  if (!original.signatories && formId !== 'bp-b') additions.push(...signers);
  const sections = [
    { id: 'common', title: 'Shared proposal information' }, { id: 'projectInfo', title: 'Project information' }, { id: 'justification', title: 'Project justification' }, { id: 'financialSummary', title: 'Financial requirements from budget items' },
    { id: 'details', title: 'Supporting information' }, ...form.sections.map((section) => ({ id: existingGroup[formId] || `official_${section.key}`, title: section.title })),
    { id: 'programHistory', title: 'Program reporting periods' }, { id: 'official_physical', title: 'Physical targets' }, { id: 'signoff', title: 'Prepared, certified and approved by' }, { id: 'legacy', title: 'Preserved internal information' },
  ].filter((section, index, rows) => rows.findIndex((row) => row.id === section.id) === index);
  const combined = [...fields, ...additions].map((field) => formId === 'bp-202' && field.key === 'official_papFunding' ? { ...field, recordSource: 'pap-requirements-v1' } : formId === 'bp-207' && field.key === 'official_climateProposed' ? { ...field, recordSource: 'climate-proposed-v1' } : formId === 'bp-207' && field.key === 'official_climateSummary' ? { ...field, recordSource: 'climate-summary-v1' } : field);
  if (/^bp-201-[a-d]$/.test(formId)) combined.push(input('reportPeriod', 'Reporting period (year check mark)', 'radio', { options: ['Actual obligations', 'Current program', 'Total proposed program'], reference: 'NBM 156 pp.67–70, year check mark', section: 'common' }));
  const workbookLayout = form.sections.map((section) => ({ ...section, columns: section.columns.map((column) => ({ ...column, templateHeadingPath: column.headingPath.map((label) => formId === 'bp-206' && section.key === 'physical' ? label : yearTemplate(label)), templateLabel: formId === 'bp-206' && section.key === 'physical' ? column.label : yearTemplate(column.label) })) }));
  if (formId === 'bp-207') {
    // NBM pp.92–94 specifies separate actual/current/proposed reports. The
    // workbook transcribes only one historical table; never reuse its values
    // for the other period or its proposed-climate summary for actuals.
    const actual = combined.find((field) => field.key === 'official_climateActual');
    const summary = combined.find((field) => field.key === 'official_climateSummary');
    const currentReference = 'NBM 156 p.93, current climate expenditure columns 1-6';
    const currentColumns = actual.columns.map((column, index) => ({ ...column, label: column.label.replaceAll('{actualYear}', '{currentYear}'), reference: `NBM 156 p.93 column ${index + 1}` }));
    const actualSummaryRef = 'NBM 156 p.92, climate summary';
    const currentSummaryRef = 'NBM 156 p.93, climate summary';
    const summaryColumns = (reference) => summary.columns.map((column, index) => ({ ...column, reference: `${reference} column ${index + 1}` }));
    const newGroups = [group('official_climateActualSummary', '{actualYear} actual climate summary', summaryColumns(actualSummaryRef), actualSummaryRef), group('official_climateCurrent', '{currentYear} current climate expenditure', currentColumns, currentReference), group('official_climateCurrentSummary', '{currentYear} current climate summary', summaryColumns(currentSummaryRef), currentSummaryRef)];
    summary.label = '{fiscalYear} proposed climate summary';
    combined.splice(combined.indexOf(summary), 0, ...newGroups);
    sections.push(...newGroups.map((field) => ({ id: field.key, title: field.label })));
    const toLayout = (field) => ({ key: field.key, title: field.label, reference: field.reference, columns: field.columns.map((column) => ({ ...column, templateLabel: column.label, templateHeadingPath: [column.label] })) });
    workbookLayout.splice(2, 0, ...newGroups.map(toLayout));
    workbookLayout.at(-1).title = '{fiscalYear} proposed climate summary';
  }
  if (formId === 'bp-201-c') {
    // The workbook explicitly marks this reconstruction ASSUMED. The original
    // blank template was inspected visually: NBM 156 p.69 has nine columns.
    const reference = 'NBM 156 p.69, BP 201-C columns 1-9';
    const keys = ['uacsCode', 'pap', 'managementFees', 'interestNonResidents', 'guaranteeFees', 'bankCharges', 'commitmentFees', 'otherFinancialCharges', 'total'];
    const labels = ['UACS Code(s)', 'Cost structure / Programs / Activities / Projects', 'Financial Expenses / Management Supervision / Trusteeship Fees', 'Interest Expenses / Interest Paid to Non Residents', 'Guarantee Fees', 'Bank Charges', 'Commitment Fees', 'Other Financial Charges', 'TOTAL'];
    const columns = keys.map((key, index) => input(key, labels[index], index < 2 ? 'text' : 'currency', { reference: `NBM 156 p.69 column ${index + 1}`, ...(index === 8 ? { outputOnly: true, calculation: 'sum', operands: keys.slice(2, 8) } : {}) }));
    for (const field of combined) if (field.key === 'official_financial') Object.assign(field, { legacy: true, section: 'legacy', label: 'Internal: preserved ASSUMED workbook financial schedule', description: 'Retained without conversion. Use the separate NBM 156 schedule for verified object columns.' });
    combined.push(group('official_verifiedFinancial', 'Financial expenses — NBM 156 verified columns', columns, reference));
    sections.push({ id: 'official_verifiedFinancial', title: 'Financial expenses by object (NBM 156 p.69)' });
    workbookLayout[0] = { ...workbookLayout[0], internal: true, title: 'Internal: preserved ASSUMED workbook schedule — not an official object classification' };
    workbookLayout.unshift({ key: 'verifiedFinancial', title: 'Financial expenses by object', reference, columns: columns.map((column) => ({ ...column, headingPath: [column.label] })) });
  }
  return { ...original, ...(formId === 'bp-b' ? { signatories: PERFORMANCE_SIGNATORIES } : {}), fields: combined, sections, official: { id: formId, version: OFFICIAL_SCHEMA_VERSION, units: form.units, reference: form.sheet, verification: formId === 'bp-201-c' ? 'nbm69-columns-verified-layout-pending' : form.verification }, workbookLayout };
}

// Official IDs and PDF mappings live in the registry. Cycle edits overlay labels,
// options, validation, sources and visibility, while custom fields remain additive.
export function applyOfficialConfiguration(base, config) {
  if (!base?.official || !config?.fields) return config?.fields ? { ...base, fields: config.fields } : base;
  const overrides = new Map(config.fields.map((field) => [field.key, field]));
  const fields = base.fields.map((field) => {
    const override = overrides.get(field.key);
    overrides.delete(field.key);
    if (!override) return field;
    const mapped = { ...field, ...override, reference: field.reference, ...(field.columns ? { type: field.type, source: field.source } : {}) };
    if (field.columns && override.columns) {
      const custom = new Map(override.columns.map((column) => [column.key, column]));
      mapped.columns = field.columns.map((column) => { const next = custom.get(column.key); custom.delete(column.key); return { ...column, ...next, reference: column.reference, ...(column.outputOnly ? { outputOnly: true, source: column.source || 'user', type: column.type, calculation: column.calculation, operands: column.operands } : {}) }; });
      mapped.columns.push(...custom.values());
    }
    return mapped;
  });
  fields.push(...overrides.values());
  const sections = new Map((base.sections || []).map((section) => [section.id, section]));
  for (const section of config.sections || []) sections.set(section.id, { ...sections.get(section.id), ...section });
  return { ...base, fields, sections: [...sections.values()] };
}

export const isOfficialForm = (id) => OFFICIAL_WORKBOOK_FORMS.some((form) => form.id === id);

export function createOfficialNativeSchema(schemaId) {
  const code = schemaId.match(/^bp-form-([a-d]|\d{3}(?:-[a-z])?)(?:\s|$)/i)?.[1];
  const formId = code ? `bp-${code.toLowerCase()}` : '';
  const reference = OFFICIAL_WORKBOOK_FORMS.find((form) => form.id === formId);
  if (!reference) return null;
  const definition = extendOfficialDefinition(formId);
  // Standalone office schedules have their own header; requests reuse canonical data in the wizard.
  definition.fields = definition.fields.map((field) => ['canonical', 'derived'].includes(field.source) ? { ...field, source: 'user' } : field);
  return { id: schemaId, name: `${reference.code} — ${reference.title}`, version: OFFICIAL_SCHEMA_VERSION, official: definition.official, definition,
    headerFields: definition.fields.filter((field) => !field.columns),
    sections: definition.fields.filter((field) => field.columns).map((field) => ({ id: field.key, title: field.label, table: { kind: 'bp-guided', columns: field.columns } })),
    footer: { showGrandTotal: false, notes: [{ key: 'draft', label: 'Draft / internal. Official layout verification and DOST responsibility assignments remain pending.' }], signers: [] },
  };
}
