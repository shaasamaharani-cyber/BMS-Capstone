import { FUNDING_COLUMNS, STAFFING_COLUMNS, calculateTableRows } from './structured_fields.js';
/**
 * System Name: Budget Management System
 * Module Name: BP Forms Module
 *
 * Purpose of this file:
 * Field-level definition of the BP forms that are generated inside the unified budget request. Every field is one of
 * three kinds: canonical (entered once on the request and reused), derived (calculated from the line items) or user
 * (only this form needs it). This is what removes repeated typing across forms.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { getCostStructureAbbreviation } from '../utils/cost_structure.js';
import { BP_FORM_CATALOG } from './bp_form_catalog.js';
import { DEFAULT_FORM_SCHEMAS } from '../forms/schemas/default_schemas.js';
import { PERFORMANCE_COLUMNS, PERFORMANCE_SIGNATORIES, performanceYearLabel, upgradeLegacyPerformanceFields } from './bp_form_b.js';

export const FIELD_SOURCE = {
  CANONICAL: 'canonical',
  DERIVED: 'derived',
  USER: 'user',
};

export const CANONICAL_FIELD_LABELS = {
  department: 'Department',
  agency: 'Agency',
  fiscalYear: 'Fiscal year',
  programPap: 'Program / Activity / Project',
  location: 'Implementation location',
  implementationStart: 'Implementation start',
  implementationEnd: 'Implementation end',
  fundingSource: 'Funding source',
  projectDescription: 'Project description',
  objectives: 'Objectives',
  projectName: 'Proposal / project name',
  implementingAgency: 'Implementing agency',
  operatingUnit: 'Operating unit',
  appropriationSource: 'Appropriation source',
  prexcCode: 'P/A/P UACS / PREXC code (verified reference)',
};

const DEPARTMENT_NAME = 'Department of Science and Technology';

const FUNDING_LABELS = {
  national_government: 'National Government',
  foreign_grant: 'Foreign Grant',
  foreign_loan: 'Foreign Loan',
  other: 'Other',
};

// ── field builders (keep the definitions below short and readable) ──
const canonical = (strKey, strCanonical) => ({ key: strKey, label: CANONICAL_FIELD_LABELS[strCanonical], source: FIELD_SOURCE.CANONICAL, canonical: strCanonical });
const derived = (strKey, strLabel, strDerived) => ({ key: strKey, label: strLabel, source: FIELD_SOURCE.DERIVED, derived: strDerived, type: 'number' });
const user = (strKey, strLabel, strType = 'text', blnRequired = false, arrOptions = null) => ({ key: strKey, label: strLabel, source: FIELD_SOURCE.USER, type: strType, required: blnRequired, options: arrOptions });

const HEADER = [canonical('department', 'department'), canonical('agency', 'agency'), canonical('fiscalYear', 'fiscalYear')];
const SHARED_CLASSIFICATION = ['operatingUnit', 'appropriationSource', 'prexcCode'].map((key) => canonical(key, key));
const PERIOD = [canonical('implementationStart', 'implementationStart'), canonical('implementationEnd', 'implementationEnd')];
const PERFORMANCE_SIGNATORY_FIELDS = [
  ...PERFORMANCE_SIGNATORIES.map((signer) => user(signer.key, `${signer.label} (name)`)),
  user('approvalDate', 'Date (day / month / year on printed form)', 'date'),
];

const ITEM_COLUMNS = [
  { key: 'name', label: 'Item' },
  { key: 'costStructure', label: 'Cost structure' },
  { key: 'amount', label: 'Proposed amount', numeric: true },
  { key: 'justification', label: 'Justification' },
];
const LEGACY_STAFFING_KEYS = new Set(['position', 'employmentType', 'numberOfPersonnel', 'salaryRate', 'annualRequirement', 'justification']);
const usesStaffingRows = (definition, values) => definition.fields.some((field) => field.key === 'positions' && field.type === 'table') && Array.isArray(values.positions) && values.positions.length > 0;

export const FORM_DEFINITIONS = {
  'bp-a': {
    fields: [...HEADER, ...SHARED_CLASSIFICATION, canonical('programPap', 'programPap'), user('performanceMeasure', 'Internal: associated performance measure (optional)', 'textarea'), user('remarks', 'Remarks', 'textarea')],
    table: { kind: 'matrix' },
  },
  'bp-b': {
    fields: [...HEADER, ...SHARED_CLASSIFICATION, { ...user('performance', 'Performance measures and targets', 'table'), columns: PERFORMANCE_COLUMNS }, ...PERFORMANCE_SIGNATORY_FIELDS],
    signatories: PERFORMANCE_SIGNATORIES,
    table: null,
  },
  'bp-c': {
    fields: [...HEADER, { ...user('rdcInputs', 'RDC inputs and agency response', 'table'), columns: [
      { key: 'pap', label: 'P/A/P', type: 'text' }, { key: 'region', label: 'Region', type: 'text' },
      ...['tierOne', 'rdcTierTwo', 'included', 'excluded'].map((key, index) => ({ key, label: ['Tier 1 allocation (PHP)', 'RDC Tier 2 recommendation (PHP)', 'Included Tier 2 (PHP)', 'Excluded Tier 2 (PHP)'][index], type: 'number' })),
      { key: 'total', label: 'Tier 2 total (PHP)', type: 'number', calculation: 'sum', operands: ['included', 'excluded'] },
      { key: 'rationale', label: 'RDC rationale', type: 'text' }, { key: 'feedback', label: 'Agency feedback', type: 'text' },
    ] }], table: null,
  },
  'bp-d': {
    fields: [...HEADER, { ...user('csoInputs', 'CSO inputs (excluding consultations under RDC)', 'table'), columns: [
      { key: 'pap', label: 'P/A/P', type: 'text' }, { key: 'prexc', label: 'Verified PREXC UACS code', type: 'text' }, { key: 'locationCode', label: 'Verified UACS location code', type: 'text' },
      { key: 'ongoing', label: 'Inputs on ongoing expenditure', type: 'text' }, { key: 'newSpending', label: 'Inputs on new / expanded expenditure', type: 'text' },
      { key: 'amount', label: 'Included expenditure (PHP)', type: 'number' }, { key: 'basis', label: 'Basis / assumptions', type: 'text' }, { key: 'feedback', label: 'Agency feedback / source', type: 'text' },
    ] }], table: null,
  },
  'bp-201': {
    fields: [...HEADER, ...SHARED_CLASSIFICATION, derived('ps', 'PS (PHP)', 'psTotal'), derived('mooe', 'MOOE (PHP)', 'mooeTotal'), derived('finex', 'FinEx (PHP)', 'finexTotal'), derived('co', 'CO (PHP)', 'coTotal'), derived('total', 'Total classified expenditure (PHP)', 'expenseTotal')], table: { kind: 'matrix' },
  },
  'bp-201-a': {
    fields: [...HEADER, ...SHARED_CLASSIFICATION, canonical('programPap', 'programPap'), derived('proposedPs', 'Proposed PS', 'psTotal'), user('numberOfPositions', 'Number of positions (awaiting office confirmation if unknown)', 'number'), user('actualPs', 'FY{actualYear} actual PS obligations', 'number'), user('currentPs', 'FY{currentYear} current PS program', 'number'), user('remarks', 'Remarks', 'textarea')],
    table: { kind: 'items', categories: ['PS'], columns: ITEM_COLUMNS },
  },
  'bp-201-b': {
    fields: [...HEADER, ...SHARED_CLASSIFICATION, canonical('programPap', 'programPap'), derived('proposedMooe', 'Proposed MOOE', 'mooeTotal'), user('actualMooe', 'FY{actualYear} actual MOOE obligations', 'number'), user('currentMooe', 'FY{currentYear} current MOOE program', 'number'), user('remarks', 'Remarks', 'textarea')],
    table: { kind: 'items', categories: ['MOOE'], columns: ITEM_COLUMNS },
  },
  'bp-201-c': {
    fields: [...HEADER, ...SHARED_CLASSIFICATION, canonical('programPap', 'programPap'), user('finexCategory', 'Financial expense category', 'text', true), user('actualFinex', 'FY{actualYear} actual FinEx obligations', 'number'), user('currentFinex', 'FY{currentYear} current FinEx program', 'number'), derived('proposedFinex', 'Proposed FinEx', 'finexTotal')],
    table: { kind: 'items', categories: ['FINEX'], columns: ITEM_COLUMNS },
  },
  'bp-201-d': {
    fields: [...HEADER, ...SHARED_CLASSIFICATION, canonical('programPap', 'programPap'), derived('proposedCo', 'Proposed CO', 'coTotal'), user('actualCo', 'FY{actualYear} actual CO obligations', 'number'), user('currentCo', 'FY{currentYear} current CO program', 'number'), user('assetDescription', 'Project / asset description', 'textarea', true)],
    table: { kind: 'items', categories: ['CO'], columns: ITEM_COLUMNS },
  },
  'bp-201-e': {
    fields: [...HEADER, ...SHARED_CLASSIFICATION, canonical('programPap', 'programPap'), ...PERIOD, canonical('fundingSource', 'fundingSource'), derived('requirementFy', 'FY requirement (from line items)', 'expenseTotal'), user('totalProjectCost', 'Total project cost', 'number', true), user('outyearOne', 'Outyear 1 requirement', 'number', true), user('outyearTwo', 'Outyear 2 requirement', 'number', true), user('furtherOutyears', 'Further outyear requirements', 'number')],
    table: null,
  },
  'bp-202': {
    fields: [
      ...HEADER, ...SHARED_CLASSIFICATION, canonical('projectName', 'projectName'), canonical('implementingAgency', 'implementingAgency'), canonical('programPap', 'programPap'), canonical('objectives', 'objectives'), canonical('projectDescription', 'projectDescription'), canonical('location', 'location'), ...PERIOD, canonical('fundingSource', 'fundingSource'),
      derived('costPs', 'Costing - PS', 'psTotal'), derived('costMooe', 'Costing - MOOE', 'mooeTotal'), derived('costCo', 'Costing - CO', 'coTotal'), derived('costFinex', 'Costing - FinEx', 'finexTotal'), derived('costTotal', 'Costing - total', 'expenseTotal'),
      user('projectType', 'Project type', 'select', true, ['New', 'Expanded', 'Revised']), user('rationale', 'Rationale / problem statement', 'textarea', true), user('beneficiaries', 'Target beneficiaries', 'textarea', true),
      user('implementationStrategy', 'Implementation strategy', 'textarea', true), user('prerequisites', 'Prerequisites or approvals needed', 'textarea'), user('physicalTargets', 'Physical targets ({actualYear} actual, {currentYear} current, {fiscalYear} proposed and outyears)', 'textarea', true),
      user('priorityRanking', 'Priority ranking number', 'number'),
      user('infrastructure', 'Infrastructure classification', 'select', false, ['Infrastructure', 'Non-infrastructure']),
      user('ictClassification', 'ICT classification', 'select', false, ['ICT', 'Non-ICT']),
      user('pipCode', 'DEPDev PIP code (where applicable)'),
      user('originalProjectCost', 'Original total project cost (PHP)', 'number'),
      user('revisedProjectCost', 'Revised total project cost (PHP)', 'number'),
      user('revisedStart', 'Revised implementation start', 'date'), user('revisedEnd', 'Revised implementation finish', 'date'),
      { ...user('fundingRequirements', 'Funding requirements by year, tier and expense class', 'table'), columns: FUNDING_COLUMNS },
    ],
    table: null,
  },
  'bp-203': {
    fields: [
      ...HEADER, ...SHARED_CLASSIFICATION, canonical('programPap', 'programPap'), canonical('objectives', 'objectives'), canonical('projectDescription', 'projectDescription'), canonical('location', 'location'), ...PERIOD,
      derived('financingType', 'Financing type', 'financingType'), derived('totalProjectCost', 'Total cost (from line items)', 'expenseTotal'),
      user('foreignInstitution', 'Foreign funding institution', 'text', true), user('countrySource', 'Country / source', 'text', true), user('foreignAmount', 'Foreign financing amount', 'number', true),
      user('counterpartFunding', 'Local counterpart funding', 'number'), user('projectComponents', 'Project components', 'textarea', true), user('outputs', 'Expected outputs / targets', 'textarea'),
    ],
    table: null,
  },
  'bp-204': {
    fields: [...HEADER, ...SHARED_CLASSIFICATION, { ...user('positions', 'Staffing positions (office contribution)', 'table'), columns: STAFFING_COLUMNS }, canonical('fundingSource', 'fundingSource'), user('position', 'Position / designation', 'text', true), user('employmentType', 'Employment type', 'select', true, ['Casual', 'Contractual', 'Part-Time', 'Substitute (Teachers)']), user('numberOfPersonnel', 'Number of personnel', 'number', true), user('salaryRate', 'Salary grade / monthly rate', 'number', true), user('annualRequirement', 'Annual requirement', 'number', true), user('justification', 'Justification', 'textarea', true)],
    table: null,
  },
  'bp-205': {
    fields: [canonical('department', 'department'), canonical('agency', 'agency'), user('employeeName', 'Employee name', 'text', true), user('positionTitle', 'Position title', 'text', true), user('salaryGrade', 'Salary grade', 'text', true), user('retirementDate', 'Retirement date', 'date', true), user('retirementType', 'Retirement type', 'select', true, ['Mandatory', 'Optional', 'Other']), user('terminalLeave', 'Terminal leave benefit', 'number'), user('gratuity', 'Retirement gratuity', 'number')],
    table: null,
  },
  'bp-206': {
    fields: [
      ...HEADER, ...SHARED_CLASSIFICATION, canonical('programPap', 'programPap'), canonical('objectives', 'objectives'), canonical('projectDescription', 'projectDescription'), canonical('location', 'location'), ...PERIOD, canonical('fundingSource', 'fundingSource'),
      derived('budgetRequirement', 'Convergence requirement (MOOE + CO, net of PS)', 'convergenceTotal'),
      user('convergenceProgram', 'Official convergence program', 'text', true), user('leadAgency', 'Lead agency', 'text', true), user('participatingAgencies', 'Participating agencies', 'textarea'), user('physicalTarget', 'Physical target / output', 'textarea', true),
    ],
    table: null,
  },
  'bp-207': {
    fields: [
      ...HEADER, ...SHARED_CLASSIFICATION, canonical('programPap', 'programPap'), canonical('location', 'location'), canonical('fundingSource', 'fundingSource'),
      derived('taggedAmount', 'Climate expenditure (included in MOOE / CO)', 'climateTotal'), derived('expenseTotal', 'Expense total (PS + MOOE + FinEx + CO)', 'expenseTotal'),
      derived('typology', 'Climate change typology (from expenditure items)', 'climateTypologies'), derived('adaptationMitigation', 'Adaptation / mitigation (from expenditure items)', 'climateClassifications'), user('climateTag', 'Supplementary climate information (if confirmed)'), user('physicalOutput', 'Physical output / target', 'textarea'),
    ],
    table: { kind: 'climate' },
    requiredDocuments: [{ name: 'CCC-approved QAR form', required: true }],
  },
};

const DERIVED_RESOLVERS = {
  psTotal: (objTotals) => objTotals.psTotal,
  mooeTotal: (objTotals) => objTotals.mooeTotal,
  coTotal: (objTotals) => objTotals.coTotal,
  tagTotal: (objTotals) => objTotals.tagTotal,
  climateTypologies: (_totals, _common, lineItems = []) => [...new Set(lineItems.filter((item) => Number(item.climateAmount) > 0).map((item) => item.climateTypology).filter(Boolean))].join('; '),
  climateClassifications: (_totals, _common, lineItems = []) => [...new Set(lineItems.filter((item) => Number(item.climateAmount) > 0).map((item) => item.climateType).filter(Boolean))].join('; '),
  climateTotal: (objTotals) => objTotals.climateTotal ?? 0,
  convergenceTotal: (objTotals) => (Number(objTotals.mooeTotal) || 0) + (Number(objTotals.coTotal) || 0),
  grandTotal: (objTotals) => objTotals.grandTotal,
  finexTotal: (objTotals) => objTotals.finexTotal ?? 0,
  expenseTotal: (objTotals) => (Number(objTotals.psTotal) || 0) + (Number(objTotals.mooeTotal) || 0) + (Number(objTotals.coTotal) || 0) + (Number(objTotals.finexTotal) || 0),
  financingType: (objTotals, objCommon) => ({ foreign_loan: 'Loan', foreign_grant: 'Grant' })[objCommon.fundingSource] || '',
};

export const DERIVED_FIELD_LABELS = {
  climateTypologies: 'Climate typologies from expenditure items', climateClassifications: 'Adaptation / mitigation from expenditure items',
  psTotal: 'PS total', mooeTotal: 'MOOE total', coTotal: 'CO total', tagTotal: 'Legacy TAG total (unclassified)', climateTotal: 'Climate expenditure (included in MOOE / CO)',
  convergenceTotal: 'Convergence total (MOOE + CO)', finexTotal: 'FinEx total', expenseTotal: 'Expense total', grandTotal: 'Total request amount', financingType: 'Financing type',
};

// Schema forms keep their dedicated layout until an admin configures fields for this cycle.
export function getDefaultFormDefinition(strFormId) {
  if (FORM_DEFINITIONS[strFormId]) return FORM_DEFINITIONS[strFormId];
  const form = BP_FORM_CATALOG.find((row) => row.id === strFormId);
  const schema = DEFAULT_FORM_SCHEMAS.find((row) => row.id === form?.schemaId);
  if (!schema) return null;
  const fields = [];
  const addFields = (rows, prefix = '') => (rows || []).forEach((field) => {
    if (field.type === 'computed' || field.type === 'label') return;
    const key = `${prefix}${field.key}`;
    const canonicalKey = field.key === 'year' ? 'fiscalYear' : field.key;
    if (!prefix && CANONICAL_FIELD_LABELS[canonicalKey]) fields.push(canonical(key, canonicalKey));
    else fields.push(user(key, field.label, ['number', 'date', 'textarea', 'select'].includes(field.type) ? field.type : 'text', Boolean(field.required), (field.options || []).map((option) => typeof option === 'string' ? option : String(option.value ?? option.label))));
  });
  addFields(schema.headerFields);
  (schema.sections || []).forEach((section, index) => {
    addFields(section.table?.columns, `section${index}_`);
    (section.tabs || []).forEach((tab, tabIndex) => addFields(tab.table?.columns, `section${index}_tab${tabIndex}_`));
  });
  return fields.length ? { fields, table: null } : null;
}

export function getFormDefinition(strFormId, objContext = {}) {
  if (objContext.formDefinitions && Object.hasOwn(objContext.formDefinitions, strFormId)) return objContext.formDefinitions[strFormId];
  const config = objContext.formConfigs?.[strFormId];
  const base = FORM_DEFINITIONS[strFormId];
  if (!config?.fields) return base || null;
  let fields = config.fields;
  if (strFormId === 'bp-b') fields = upgradeLegacyPerformanceFields(fields, PERFORMANCE_SIGNATORY_FIELDS);
  // This key came from the old built-in Form A, not from the official matrix.
  // Retain its data; an administrator can create a separately named internal requirement.
  if (strFormId === 'bp-a') fields = fields.map((field) => field.key === 'performanceMeasure' && field.source === FIELD_SOURCE.USER ? { ...field, required: false, label: 'Internal: associated performance measure (optional)' } : field);
  return { ...base, fields, table: base?.table || null };
}

// Stored alongside a signature; changing a label, answer, common value or item invalidates it.
export function getFormContent(strFormId, context) {
  return JSON.stringify(buildFormView(strFormId, context) || { formId: strFormId, values: context.formValues?.[strFormId] || {} });
}

/** Values every form can reuse. Built once from the request header fields the user typed in step 1. */
export function resolveCommonValues(objRequest, objLookups) {
  return {
    department: DEPARTMENT_NAME,
    projectName: objRequest.title || '',
    implementingAgency: objRequest.implementingAgency || objLookups.agencyName || objLookups.unitName || '',
    operatingUnit: objRequest.operatingUnit || objLookups.unitName || '',
    appropriationSource: objRequest.appropriationSource || '',
    prexcCode: objRequest.prexcCode || '',
    agency: objRequest.implementingAgency || objLookups.agencyName || objLookups.unitName || '',
    fiscalYear: objLookups.fiscalYearLabel || '',
    programPap: objRequest.programPap || objRequest.title || '',
    location: objRequest.location || '',
    implementationStart: objRequest.implementationStart || '',
    implementationEnd: objRequest.implementationEnd || '',
    fundingSource: objRequest.fundingSource || '',
    fundingSourceLabel: FUNDING_LABELS[objRequest.fundingSource] || '',
    projectDescription: objRequest.description || '',
    objectives: objRequest.objectives || '',
  };
}

/** How many generated forms reuse a canonical field - shown next to the field in step 1 so the saving is visible. */
export function countFormsUsingCanonical(strCanonical) {
  return Object.values(FORM_DEFINITIONS).filter((objDefinition) => objDefinition.fields.some((objField) => objField.canonical === strCanonical)).length;
}

function itemsForCategories(arrLineItems, arrCategories) {
  return arrLineItems.filter((objItem) => arrCategories.includes(objItem.category) && String(objItem.name || '').trim() !== '');
}

function buildDerivedTable(objTable, arrLineItems) {
  if (!objTable) return null;

  if (objTable.kind === 'climate') {
    const rows = arrLineItems.filter((item) => ['MOOE', 'CO'].includes(item.category) && Number(item.climateAmount) > 0).map((item) => ({ name: item.name, category: item.category, typology: item.climateTypology || '', classification: item.climateType || '', amount: Number(item.climateAmount) }));
    return { columns: [{ key: 'name', label: 'Underlying expenditure item' }, { key: 'category', label: 'Expense class' }, { key: 'typology', label: 'Typology' }, { key: 'classification', label: 'Adaptation / mitigation' }, { key: 'amount', label: 'Climate amount (PHP, included)', numeric: true }], rows, total: rows.reduce((sum, row) => sum + Math.round(row.amount * 100), 0) / 100 };
  }
  if (objTable.kind === 'items') {
    const arrRows = itemsForCategories(arrLineItems, objTable.categories).map((objItem) => ({
      name: objItem.name,
      costStructure: getCostStructureAbbreviation(objItem.costStructure) || objItem.costStructure,
      amount: Number(objItem.amount) || 0,
      justification: objItem.justification || '',
    }));
    return { columns: objTable.columns, rows: arrRows, total: arrRows.reduce((numSum, objRow) => numSum + Math.round(objRow.amount * 100), 0) / 100 };
  }

  // matrix: one row per line item, amounts placed under their expense class (BP Form A layout)
  const arrColumns = [
    { key: 'name', label: 'Program / Activity / Project' },
    { key: 'ps', label: 'PS', numeric: true },
    { key: 'mooe', label: 'MOOE', numeric: true },
    { key: 'finex', label: 'FinEx', numeric: true },
    { key: 'co', label: 'CO', numeric: true },
    { key: 'total', label: 'Total', numeric: true },
  ];
  const arrRows = itemsForCategories(arrLineItems, ['PS', 'MOOE', 'FINEX', 'CO']).map((objItem) => {
    const numAmount = Number(objItem.amount) || 0;
    return { name: objItem.name, ps: objItem.category === 'PS' ? numAmount : 0, mooe: objItem.category === 'MOOE' ? numAmount : 0, finex: objItem.category === 'FINEX' ? numAmount : 0, co: objItem.category === 'CO' ? numAmount : 0, total: numAmount };
  });
  return { columns: arrColumns, rows: arrRows, total: arrRows.reduce((numSum, objRow) => numSum + Math.round(objRow.total * 100), 0) / 100 };
}

/**
 * Build the on-screen view of one generated form.
 * objContext = { common, totals, lineItems, formValues } where formValues holds what the user typed for this form only.
 */
export function buildFormView(strFormId, objContext) {
  const objDefinition = getFormDefinition(strFormId, objContext);
  if (!objDefinition) return null;

  const objUserValues = objContext.formValues?.[strFormId] || {};

  const displayFields = objDefinition.fields.filter((field) => !(strFormId === 'bp-204' && usesStaffingRows(objDefinition, objUserValues) && LEGACY_STAFFING_KEYS.has(field.key)));
  const arrFields = displayFields.map((definitionField) => {
    const objField = { ...definitionField, label: performanceYearLabel(definitionField.label, objContext.common?.fiscalYear) };
    if (objField.type === 'table') objField.columns = objField.columns
      .filter((column) => !column.legacy || (Array.isArray(objUserValues[objField.key]) && objUserValues[objField.key].some((row) => row?.[column.key] !== undefined && row?.[column.key] !== '')))
      .map((column) => ({ ...column, label: performanceYearLabel(column.label, objContext.common?.fiscalYear) }));
    if (objField.source === FIELD_SOURCE.CANONICAL) {
      const strValue = objField.canonical === 'fundingSource' ? objContext.common.fundingSourceLabel : objContext.common[objField.canonical];
      return { ...objField, value: strValue ?? '', locked: true };
    }
    if (objField.source === FIELD_SOURCE.DERIVED) {
      return { ...objField, value: DERIVED_RESOLVERS[objField.derived](objContext.totals, objContext.common, objContext.lineItems), locked: true };
    }
    return { ...objField, value: objField.type === 'table' ? calculateTableRows(objField.columns, objUserValues[objField.key]) : objUserValues[objField.key] ?? '', locked: false };
  });

  return { formId: strFormId, fields: arrFields, table: buildDerivedTable(objDefinition.table, objContext.lineItems), ...(objDefinition.signatories ? { signatories: objDefinition.signatories } : {}) };
}

export function getFieldValueError(field, value) {
  if (field.type === 'table') {
    if (value == null || value === '') return field.required ? 'Add at least one row.' : '';
    if (!Array.isArray(value) || value.length > 500) return 'Provide up to 500 rows.';
    if (field.required && !value.length) return 'Add at least one row.';
    for (const [index, row] of value.entries()) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return 'Provide valid rows.';
      for (const column of field.columns.filter((column) => !column.calculation)) {
        const error = getFieldValueError(column, row[column.key]);
        if (error) return `Row ${index + 1}, ${column.label}: ${error}`;
      }
      if (field.key === 'positions' && (!Number.isInteger(Number(row.positions)) || Number(row.positions) <= 0 || Number(row.months) > 12)) return 'Position counts must be positive whole numbers and months must be at most 12.';
    }
    return '';
  }
  const filled = value !== undefined && value !== null && String(value).trim() !== '';
  if (field.type === 'checkbox') {
    if (filled && typeof value !== 'boolean') return 'Choose a valid checkbox value.';
    return field.required && value !== true ? 'Confirm this field.' : '';
  }
  if (!filled) return field.required ? 'This field is required.' : '';
  if (field.type === 'number' && (!['string', 'number'].includes(typeof value) || !Number.isFinite(Number(value)) || Number(value) < 0)) return 'Enter a valid number.';
  if (field.type === 'select' && !field.options?.includes(value)) return 'Choose an option from the list.';
  if (field.type === 'date' && (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value)) return 'Enter a valid date.';
  if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') return 'Enter a valid value.';
  if (String(value).length > 10000) return 'Use 10,000 characters or fewer.';
  return '';
}

/** Completion of a form: how many of its required user fields are filled. Forms outside the dynamic engine use a manual tick. */
export function getFormCompletion(strFormId, objContext) {
  const objDefinition = getFormDefinition(strFormId, objContext);
  const objUserValues = objContext.formValues?.[strFormId] || {};

  if (!objDefinition) {
    return { total: 1, filled: objUserValues.__done ? 1 : 0, complete: Boolean(objUserValues.__done), manual: true };
  }

  const arrUserFields = objDefinition.fields.filter((field) => field.source === FIELD_SOURCE.USER && !(strFormId === 'bp-204' && usesStaffingRows(objDefinition, objUserValues) && LEGACY_STAFFING_KEYS.has(field.key)));
  const arrRequired = arrUserFields.filter((objField) => objField.required);
  const errors = arrUserFields.flatMap((field) => {
    const error = getFieldValueError(field, objUserValues[field.key]);
    return error ? [{ key: field.key, label: field.label, message: error }] : [];
  });
  if (strFormId === 'bp-202' && Array.isArray(objUserValues.fundingRequirements) && objContext.totals) {
    const current = objUserValues.fundingRequirements.filter((row) => Number(row.year) === Number(objContext.common?.fiscalYear));
    const keys = { PS: 'psTotal', MOOE: 'mooeTotal', FINEX: 'finexTotal', CO: 'coTotal' };
    if (current.length && Object.entries(keys).some(([code, key]) => current.filter((row) => row.expenseClass === code).reduce((sum, row) => sum + Math.round(Number(row.amount || 0) * 100), 0) !== Math.round(Number(objContext.totals[key] || 0) * 100))) {
      errors.push({ key: 'fundingRequirements', label: 'Funding requirements', message: 'Current-year requirements by expense class must reconcile with the underlying line items.' });
    }
  }
  if (strFormId === 'bp-204' && Array.isArray(objUserValues.positions) && objContext.totals) {
    const salary = calculateTableRows(STAFFING_COLUMNS, objUserValues.positions).reduce((sum, row) => sum + Math.round(Number(row.totalCompensation ?? row.salary ?? 0) * 100), 0);
    if (salary > Math.round(Number(objContext.totals.psTotal || 0) * 100)) errors.push({ key: 'positions', label: 'Staffing positions', message: 'Known staffing costs exceed the PS line items. Reconcile the personnel budget.' });
  }
  const intFilled = arrRequired.filter((field) => !getFieldValueError(field, objUserValues[field.key])).length;
  return { total: arrRequired.length, filled: intFilled, complete: errors.length === 0, manual: false, errors };
}

/** Which expense-class forms carry which category, used by the totals check in step 5. */
export const CATEGORY_FORM_MAP = [
  { category: 'PS', totalKey: 'psTotal', formId: 'bp-201-a' },
  { category: 'MOOE', totalKey: 'mooeTotal', formId: 'bp-201-b' },
  { category: 'CO', totalKey: 'coTotal', formId: 'bp-201-d' },
  { category: 'FINEX', totalKey: 'finexTotal', formId: 'bp-201-c' },
  { category: 'Climate', totalKey: 'climateTotal', formId: 'bp-207' },
];
