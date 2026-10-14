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

export const FIELD_SOURCE = {
  CANONICAL: 'canonical',
  DERIVED: 'derived',
  USER: 'user',
};

export const CANONICAL_FIELD_LABELS = {
  department: 'Department',
  agency: 'Agency / Requesting unit',
  fiscalYear: 'Fiscal year',
  programPap: 'Program / Activity / Project',
  location: 'Implementation location',
  implementationStart: 'Implementation start',
  implementationEnd: 'Implementation end',
  fundingSource: 'Funding source',
  projectDescription: 'Project description',
  objectives: 'Objectives',
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
const PERIOD = [canonical('implementationStart', 'implementationStart'), canonical('implementationEnd', 'implementationEnd')];

const ITEM_COLUMNS = [
  { key: 'name', label: 'Item' },
  { key: 'costStructure', label: 'Cost structure' },
  { key: 'amount', label: 'Proposed amount', numeric: true },
  { key: 'justification', label: 'Justification' },
];

export const FORM_DEFINITIONS = {
  'bp-a': {
    fields: [...HEADER, canonical('programPap', 'programPap'), user('performanceMeasure', 'Associated performance measure', 'textarea', true), user('remarks', 'Remarks', 'textarea')],
    table: { kind: 'matrix' },
  },
  'bp-201-a': {
    fields: [...HEADER, canonical('programPap', 'programPap'), derived('proposedPs', 'Proposed PS', 'psTotal'), user('numberOfPositions', 'Number of positions', 'number', true), user('actualPs', 'Actual PS obligation (last year)', 'number', true), user('currentPs', 'Current-year PS program', 'number'), user('remarks', 'Remarks', 'textarea')],
    table: { kind: 'items', categories: ['PS'], columns: ITEM_COLUMNS },
  },
  'bp-201-b': {
    fields: [...HEADER, canonical('programPap', 'programPap'), derived('proposedMooe', 'Proposed MOOE', 'mooeTotal'), user('actualMooe', 'Actual MOOE obligation (last year)', 'number', true), user('currentMooe', 'Current-year MOOE program', 'number'), user('remarks', 'Remarks', 'textarea')],
    table: { kind: 'items', categories: ['MOOE'], columns: ITEM_COLUMNS },
  },
  'bp-201-c': {
    fields: [...HEADER, canonical('programPap', 'programPap'), user('finexCategory', 'Financial expense category', 'text', true), user('actualFinex', 'Actual FinEx obligation (last year)', 'number'), user('currentFinex', 'Current-year FinEx program', 'number'), user('proposedFinex', 'Proposed FinEx', 'number', true)],
    table: null,
  },
  'bp-201-d': {
    fields: [...HEADER, canonical('programPap', 'programPap'), derived('proposedCo', 'Proposed CO', 'coTotal'), user('actualCo', 'Actual CO obligation (last year)', 'number', true), user('currentCo', 'Current-year CO program', 'number'), user('assetDescription', 'Project / asset description', 'textarea', true)],
    table: { kind: 'items', categories: ['CO'], columns: ITEM_COLUMNS },
  },
  'bp-201-e': {
    fields: [...HEADER, canonical('programPap', 'programPap'), ...PERIOD, canonical('fundingSource', 'fundingSource'), derived('requirementFy', 'FY requirement (from line items)', 'expenseTotal'), user('totalProjectCost', 'Total project cost', 'number', true), user('outyearOne', 'Outyear 1 requirement', 'number', true), user('outyearTwo', 'Outyear 2 requirement', 'number', true), user('furtherOutyears', 'Further outyear requirements', 'number')],
    table: null,
  },
  'bp-202': {
    fields: [
      ...HEADER, canonical('programPap', 'programPap'), canonical('objectives', 'objectives'), canonical('projectDescription', 'projectDescription'), canonical('location', 'location'), ...PERIOD, canonical('fundingSource', 'fundingSource'),
      derived('costPs', 'Costing - PS', 'psTotal'), derived('costMooe', 'Costing - MOOE', 'mooeTotal'), derived('costCo', 'Costing - CO', 'coTotal'), derived('costFinex', 'Costing - FinEx', 'finexTotal'), derived('costTotal', 'Costing - total', 'expenseTotal'),
      user('projectType', 'Project type', 'select', true, ['New', 'Expanded', 'Revised']), user('rationale', 'Rationale / problem statement', 'textarea', true), user('beneficiaries', 'Target beneficiaries', 'textarea', true),
      user('implementationStrategy', 'Implementation strategy', 'textarea', true), user('prerequisites', 'Prerequisites or approvals needed', 'textarea'), user('physicalTargets', 'Physical targets (2025 actual, 2026 current, FY2027, 2028, 2029)', 'textarea', true),
    ],
    table: null,
  },
  'bp-203': {
    fields: [
      ...HEADER, canonical('programPap', 'programPap'), canonical('objectives', 'objectives'), canonical('projectDescription', 'projectDescription'), canonical('location', 'location'), ...PERIOD,
      derived('financingType', 'Financing type', 'financingType'), derived('totalProjectCost', 'Total cost (from line items)', 'expenseTotal'),
      user('foreignInstitution', 'Foreign funding institution', 'text', true), user('countrySource', 'Country / source', 'text', true), user('foreignAmount', 'Foreign financing amount', 'number', true),
      user('counterpartFunding', 'Local counterpart funding', 'number'), user('projectComponents', 'Project components', 'textarea', true), user('outputs', 'Expected outputs / targets', 'textarea'),
    ],
    table: null,
  },
  'bp-204': {
    fields: [...HEADER, canonical('fundingSource', 'fundingSource'), user('position', 'Position / designation', 'text', true), user('employmentType', 'Employment type', 'select', true, ['Contractual', 'Job order', 'Other']), user('numberOfPersonnel', 'Number of personnel', 'number', true), user('salaryRate', 'Salary grade / monthly rate', 'number', true), user('annualRequirement', 'Annual requirement', 'number', true), user('justification', 'Justification', 'textarea', true)],
    table: null,
  },
  'bp-205': {
    fields: [canonical('department', 'department'), canonical('agency', 'agency'), user('employeeName', 'Employee name', 'text', true), user('positionTitle', 'Position title', 'text', true), user('salaryGrade', 'Salary grade', 'text', true), user('retirementDate', 'Retirement date', 'date', true), user('retirementType', 'Retirement type', 'select', true, ['Mandatory', 'Optional', 'Other']), user('terminalLeave', 'Terminal leave benefit', 'number'), user('gratuity', 'Retirement gratuity', 'number')],
    table: null,
  },
  'bp-206': {
    fields: [
      ...HEADER, canonical('programPap', 'programPap'), canonical('objectives', 'objectives'), canonical('projectDescription', 'projectDescription'), canonical('location', 'location'), ...PERIOD, canonical('fundingSource', 'fundingSource'),
      derived('budgetRequirement', 'Budget requirement (from line items)', 'expenseTotal'),
      user('convergenceProgram', 'Official convergence program', 'text', true), user('leadAgency', 'Lead agency', 'text', true), user('participatingAgencies', 'Participating agencies', 'textarea'), user('physicalTarget', 'Physical target / output', 'textarea', true),
    ],
    table: null,
  },
  'bp-207': {
    fields: [
      ...HEADER, canonical('programPap', 'programPap'), canonical('location', 'location'), canonical('fundingSource', 'fundingSource'),
      derived('taggedAmount', 'Climate-related expenditure (TAG line items)', 'tagTotal'), derived('expenseTotal', 'Expense total (PS + MOOE + CO)', 'expenseTotal'),
      user('typology', 'Climate change typology', 'text', true), user('adaptationMitigation', 'Adaptation or mitigation', 'select', true, ['Adaptation', 'Mitigation']), user('climateTag', 'Climate change tag / category', 'text', true), user('physicalOutput', 'Physical output / target', 'textarea'),
    ],
    table: null,
  },
};

const DERIVED_RESOLVERS = {
  psTotal: (objTotals) => objTotals.psTotal,
  mooeTotal: (objTotals) => objTotals.mooeTotal,
  coTotal: (objTotals) => objTotals.coTotal,
  tagTotal: (objTotals) => objTotals.tagTotal,
  grandTotal: (objTotals) => objTotals.grandTotal,
  finexTotal: () => 0,
  expenseTotal: (objTotals) => (Number(objTotals.psTotal) || 0) + (Number(objTotals.mooeTotal) || 0) + (Number(objTotals.coTotal) || 0),
  financingType: (objTotals, objCommon) => ({ foreign_loan: 'Loan', foreign_grant: 'Grant' })[objCommon.fundingSource] || '',
};

export const DERIVED_FIELD_LABELS = {
  psTotal: 'PS total', mooeTotal: 'MOOE total', coTotal: 'CO total', tagTotal: 'TAG total',
  finexTotal: 'FinEx total', expenseTotal: 'Expense total', grandTotal: 'Total request amount', financingType: 'Financing type',
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
  const config = objContext.formConfigs?.[strFormId];
  const base = FORM_DEFINITIONS[strFormId];
  return config?.fields ? { fields: config.fields, table: base?.table || null } : base || null;
}

/** Values every form can reuse. Built once from the request header fields the user typed in step 1. */
export function resolveCommonValues(objRequest, objLookups) {
  return {
    department: DEPARTMENT_NAME,
    agency: objLookups.unitName || '',
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

  if (objTable.kind === 'items') {
    const arrRows = itemsForCategories(arrLineItems, objTable.categories).map((objItem) => ({
      name: objItem.name,
      costStructure: getCostStructureAbbreviation(objItem.costStructure) || objItem.costStructure,
      amount: Number(objItem.amount) || 0,
      justification: objItem.justification || '',
    }));
    return { columns: objTable.columns, rows: arrRows, total: arrRows.reduce((numSum, objRow) => numSum + objRow.amount, 0) };
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
  const arrRows = itemsForCategories(arrLineItems, ['PS', 'MOOE', 'CO']).map((objItem) => {
    const numAmount = Number(objItem.amount) || 0;
    return { name: objItem.name, ps: objItem.category === 'PS' ? numAmount : 0, mooe: objItem.category === 'MOOE' ? numAmount : 0, finex: 0, co: objItem.category === 'CO' ? numAmount : 0, total: numAmount };
  });
  return { columns: arrColumns, rows: arrRows, total: arrRows.reduce((numSum, objRow) => numSum + objRow.total, 0) };
}

/**
 * Build the on-screen view of one generated form.
 * objContext = { common, totals, lineItems, formValues } where formValues holds what the user typed for this form only.
 */
export function buildFormView(strFormId, objContext) {
  const objDefinition = getFormDefinition(strFormId, objContext);
  if (!objDefinition) return null;

  const objUserValues = objContext.formValues?.[strFormId] || {};

  const arrFields = objDefinition.fields.map((objField) => {
    if (objField.source === FIELD_SOURCE.CANONICAL) {
      const strValue = objField.canonical === 'fundingSource' ? objContext.common.fundingSourceLabel : objContext.common[objField.canonical];
      return { ...objField, value: strValue ?? '', locked: true };
    }
    if (objField.source === FIELD_SOURCE.DERIVED) {
      return { ...objField, value: DERIVED_RESOLVERS[objField.derived](objContext.totals, objContext.common), locked: true };
    }
    return { ...objField, value: objUserValues[objField.key] ?? '', locked: false };
  });

  return { formId: strFormId, fields: arrFields, table: buildDerivedTable(objDefinition.table, objContext.lineItems) };
}

export function getFieldValueError(field, value) {
  const filled = value !== undefined && value !== null && String(value).trim() !== '';
  if (field.type === 'checkbox') {
    if (filled && typeof value !== 'boolean') return 'Choose a valid checkbox value.';
    return field.required && value !== true ? 'Confirm this field.' : '';
  }
  if (!filled) return field.required ? 'This field is required.' : '';
  if (field.type === 'number' && (!['string', 'number'].includes(typeof value) || !Number.isFinite(Number(value)))) return 'Enter a valid number.';
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

  const arrUserFields = objDefinition.fields.filter((objField) => objField.source === FIELD_SOURCE.USER);
  const arrRequired = arrUserFields.filter((objField) => objField.required);
  const errors = arrUserFields.flatMap((field) => {
    const error = getFieldValueError(field, objUserValues[field.key]);
    return error ? [{ key: field.key, label: field.label, message: error }] : [];
  });
  const intFilled = arrRequired.filter((field) => !getFieldValueError(field, objUserValues[field.key])).length;
  return { total: arrRequired.length, filled: intFilled, complete: errors.length === 0, manual: false, errors };
}

/** Which expense-class forms carry which category, used by the totals check in step 5. */
export const CATEGORY_FORM_MAP = [
  { category: 'PS', totalKey: 'psTotal', formId: 'bp-201-a' },
  { category: 'MOOE', totalKey: 'mooeTotal', formId: 'bp-201-b' },
  { category: 'CO', totalKey: 'coTotal', formId: 'bp-201-d' },
  { category: 'TAG', totalKey: 'tagTotal', formId: 'bp-207' },
];
