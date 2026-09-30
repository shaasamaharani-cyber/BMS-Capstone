/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Default form schema definitions (PPMP, DBM-PPMP, APP-CSE) seeded into the mock database on first run.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

function createEmptyBPFormSchema(code) {
  return {
    id: `bp-form-${code.toLowerCase()}`,
    name: `BP FORM ${code}`,
    version: '',
    headerFields: [],
    sections: [],
    footer: { showGrandTotal: false, notes: [], signers: [] },
  };
}

export const BPFormASchema = createEmptyBPFormSchema('A');
export const BPFormBSchema = createEmptyBPFormSchema('B');
export const BPFormCSchema = createEmptyBPFormSchema('C');
export const BPFormDSchema = createEmptyBPFormSchema('D');

const bpForm100Rows = [
  {
    id: 'bp100-free-portion',
    sourceOfRevenue: 'Free Portion',
    descriptionSourceRevenue: '',
    objectCode: '',
    legalBasis: '',
    estimate2025: 0,
    actual2025: 0,
    program2026: 0,
    proposed2027: 0,
    projection2028: 0,
    projection2029: 0,
    level: 0,
    style: 'label',
  },
  {
    id: 'bp100-free-tax-revenues',
    sourceOfRevenue: 'Tax Revenues',
    descriptionSourceRevenue: '',
    objectCode: '',
    legalBasis: '',
    estimate2025: 0,
    actual2025: 0,
    program2026: 0,
    proposed2027: 0,
    projection2028: 0,
    projection2029: 0,
    level: 1,
  },
  {
    id: 'bp100-free-non-tax-revenues',
    sourceOfRevenue: 'Non-Tax Revenues',
    descriptionSourceRevenue: '',
    objectCode: '',
    legalBasis: '',
    estimate2025: 0,
    actual2025: 0,
    program2026: 0,
    proposed2027: 0,
    projection2028: 0,
    projection2029: 0,
    level: 1,
  },
  {
    id: 'bp100-earmarked-portion',
    sourceOfRevenue: 'Earmarked Portion',
    descriptionSourceRevenue: '',
    objectCode: '',
    legalBasis: '',
    estimate2025: 0,
    actual2025: 0,
    program2026: 0,
    proposed2027: 0,
    projection2028: 0,
    projection2029: 0,
    level: 0,
    style: 'label',
  },
  {
    id: 'bp100-earmarked-tax-revenues',
    sourceOfRevenue: 'Tax Revenues',
    descriptionSourceRevenue: '',
    objectCode: '',
    legalBasis: '',
    estimate2025: 0,
    actual2025: 0,
    program2026: 0,
    proposed2027: 0,
    projection2028: 0,
    projection2029: 0,
    level: 1,
  },
  {
    id: 'bp100-earmarked-non-tax-revenues',
    sourceOfRevenue: 'Non-Tax Revenues',
    descriptionSourceRevenue: '',
    objectCode: '',
    legalBasis: '',
    estimate2025: 0,
    actual2025: 0,
    program2026: 0,
    proposed2027: 0,
    projection2028: 0,
    projection2029: 0,
    level: 1,
  },
];

export const BPForm100Schema = {
  id: 'bp-form-100',
  name: 'BP FORM 100 - Statement of Revenues',
  version: '2025-2029',
  headerFields: [
    { key: 'department', label: 'Department', type: 'text', span: 1, required: true },
    { key: 'agency', label: 'Agency', type: 'text', span: 1, required: true },
    { key: 'unit', label: 'Amount Unit', type: 'select', span: 1, options: ['In Thousand Pesos', 'In Pesos'] },
  ],
  sections: [
    {
      id: 'statement-revenues-general-fund',
      title: 'Statement of Revenues - General Fund',
      collapsible: false,
      table: {
        addRowLabel: 'Add revenue row',
        hierarchical: true,
        allowAddChildRows: true,
        allowAddSiblingRows: true,
        childLabelKey: 'sourceOfRevenue',
        defaultRows: bpForm100Rows,
        columns: [
          { key: 'sourceOfRevenue', label: 'Source of Revenue (1)', type: 'textarea', width: 260, indentKey: 'level', indentMap: { 0: 10, 1: 24, 2: 40 } },
          { key: 'descriptionSourceRevenue', label: 'Description / Source of Revenue (2)', type: 'textarea', width: 150 },
          { key: 'objectCode', label: 'Object Code (3)', type: 'text', width: 115 },
          { key: 'legalBasis', label: 'Legal Basis (4)', type: 'textarea', width: 145 },
          { key: 'estimate2025', label: '2025 Estimate (5)', type: 'number', align: 'right', width: 120, group: "AMOUNT IN P'000" },
          { key: 'actual2025', label: '2025 Actual (6)', type: 'number', align: 'right', width: 110, group: "AMOUNT IN P'000" },
          { key: 'program2026', label: '2026 Program (7)', type: 'number', align: 'right', width: 120, group: "AMOUNT IN P'000" },
          { key: 'proposed2027', label: '2027 Proposed (8)', type: 'number', align: 'right', width: 130, group: "AMOUNT IN P'000" },
          { key: 'projection2028', label: '2028 Projections (9)', type: 'number', align: 'right', width: 135, group: "AMOUNT IN P'000" },
          { key: 'projection2029', label: '2029 Projections (10)', type: 'number', align: 'right', width: 135, group: "AMOUNT IN P'000" },
        ],
      },
    },
  ],
  footer: {
    showGrandTotal: true,
    notes: [
      { key: 'dbm-note', label: 'NOTE: The information reflected in this table shall be evaluated by the DBM for inclusion in Table C of the BESF.' },
    ],
    signers: [],
  },
};

export const RDCSummarySchema = {
  id: 'rdc-summary',
  name: 'RDC Summary',
  version: '2027',
  headerFields: [
    { key: 'region', label: 'Region', type: 'text', span: 1 },
  ],
  sections: [
    {
      id: 'summary',
      title: 'Regional Summary',
      table: {
        addRowLabel: 'Add summary row',
        hierarchical: false,
        columns: [
          { key: 'agency', label: 'Agency', type: 'text' },
          { key: 'ps', label: 'PS', type: 'number', align: 'right', group: 'AMOUNT (in thousand)' },
          { key: 'mooe', label: 'MOOE', type: 'number', align: 'right', group: 'AMOUNT (in thousand)' },
          { key: 'co', label: 'CO', type: 'number', align: 'right', group: 'AMOUNT (in thousand)' },
          { key: 'total', label: 'Total', type: 'computed', formula: 'ps + mooe + co', align: 'right', editable: false, group: 'AMOUNT (in thousand)' },
        ],
      },
    },
  ],
  footer: { showGrandTotal: true, notes: [], signers: [] },
};

const bpForm100ARows = [
  {
    id: 'bp100a-special-account',
    category: 'A. Special Account in the General Fund (Automatically Appropriated)',
    descriptionSourceRevenue: '',
    uacsObjectCode: '',
    legalBasis: '',
    natureOfExpenditures: '',
    fundBalance2025: 0,
    actual2025Revenue: 0,
    actual2025Expenditure: 0,
    program2026Revenue: 0,
    program2026Expenditure: 0,
    proposed2027Revenue: 0,
    proposed2027Expenditure: 0,
    projection2028Revenue: 0,
    projection2028Expenditure: 0,
    projection2029Revenue: 0,
    projection2029Expenditure: 0,
    level: 0,
    style: 'label',
  },
  {
    id: 'bp100a-afp-modernization-trust-fund',
    category: 'AFP Modernization Trust Fund',
    descriptionSourceRevenue: '',
    uacsObjectCode: '',
    legalBasis: '',
    natureOfExpenditures: '',
    fundBalance2025: 0,
    actual2025Revenue: 0,
    actual2025Expenditure: 0,
    program2026Revenue: 0,
    program2026Expenditure: 0,
    proposed2027Revenue: 0,
    proposed2027Expenditure: 0,
    projection2028Revenue: 0,
    projection2028Expenditure: 0,
    projection2029Revenue: 0,
    projection2029Expenditure: 0,
    level: 1,
    style: 'label',
  },
  {
    id: 'bp100a-non-tax-revenue',
    category: 'Non-Tax Revenue',
    descriptionSourceRevenue: '',
    uacsObjectCode: '',
    legalBasis: '',
    natureOfExpenditures: '',
    fundBalance2025: 0,
    actual2025Revenue: 0,
    actual2025Expenditure: 0,
    program2026Revenue: 0,
    program2026Expenditure: 0,
    proposed2027Revenue: 0,
    proposed2027Expenditure: 0,
    projection2028Revenue: 0,
    projection2028Expenditure: 0,
    projection2029Revenue: 0,
    projection2029Expenditure: 0,
    level: 2,
  },
];

export const BPForm100ASchema = {
  id: 'bp-form-100-a',
  name: 'BP FORM 100-A Statement of Revenues and Expenditures',
  version: '2025-2029',
  headerFields: [
    { key: 'department', label: 'Department', type: 'text', span: 1, required: true },
    { key: 'agency', label: 'Agency', type: 'text', span: 1, required: true },
    { key: 'unit', label: 'Amount Unit', type: 'select', span: 1, options: ['In Thousand Pesos', 'In Pesos'] },
  ],
  sections: [
    {
      id: 'statement-revenues-expenditures',
      title: 'Statement of Revenues and Expenditures - Earmarked Revenues',
      collapsible: false,
      table: {
        addRowLabel: 'Add revenue category',
        hierarchical: true,
        allowAddChildRows: true,
        allowAddSiblingRows: true,
        childLabelKey: 'category',
        defaultRows: bpForm100ARows,
        columns: [
          { key: 'category', label: 'Category (1)', type: 'textarea', width: 260, indentKey: 'level', indentMap: { 0: 10, 1: 24, 2: 40 } },
          { key: 'descriptionSourceRevenue', label: 'Description / Source of Revenue (2)', type: 'textarea', width: 150 },
          { key: 'uacsObjectCode', label: 'UACS Object Code (3)', type: 'text', width: 95 },
          { key: 'legalBasis', label: 'Legal Basis (4)', type: 'textarea', width: 90 },
          { key: 'natureOfExpenditures', label: 'Nature of Expenditures (5)', type: 'textarea', width: 160 },
          { key: 'fundBalance2025', label: 'Fund Balance as of Dec. 31, 2025 (6)', type: 'number', align: 'right', width: 130 },
          { key: 'actual2025Revenue', label: '2025 Actual Revenue (7)', type: 'number', align: 'right', width: 105, group: "AMOUNT IN P'000" },
          { key: 'actual2025Expenditure', label: '2025 Actual Expenditure (8)', type: 'number', align: 'right', width: 120, group: "AMOUNT IN P'000" },
          { key: 'program2026Revenue', label: '2026 Program Revenue (9)', type: 'number', align: 'right', width: 110, group: "AMOUNT IN P'000" },
          { key: 'program2026Expenditure', label: '2026 Program Expenditure (10)', type: 'number', align: 'right', width: 125, group: "AMOUNT IN P'000" },
          { key: 'proposed2027Revenue', label: '2027 Proposed Revenue (11)', type: 'number', align: 'right', width: 115, group: "AMOUNT IN P'000" },
          { key: 'proposed2027Expenditure', label: '2027 Proposed Expenditure (12)', type: 'number', align: 'right', width: 130, group: "AMOUNT IN P'000" },
          { key: 'projection2028Revenue', label: '2028 Projections Revenue (13)', type: 'number', align: 'right', width: 125, group: "AMOUNT IN P'000" },
          { key: 'projection2028Expenditure', label: '2028 Projections Expenditure (14)', type: 'number', align: 'right', width: 140, group: "AMOUNT IN P'000" },
          { key: 'projection2029Revenue', label: '2029 Projections Revenue (15)', type: 'number', align: 'right', width: 125, group: "AMOUNT IN P'000" },
          { key: 'projection2029Expenditure', label: '2029 Projections Expenditure (16)', type: 'number', align: 'right', width: 140, group: "AMOUNT IN P'000" },
        ],
      },
    },
  ],
  footer: {
    showGrandTotal: true,
    notes: [
      { key: 'dbm-note', label: 'NOTE: The information reflected in this table shall be evaluated by the DBM for inclusion in Table C of the BESF.' },
    ],
    signers: [],
  },
};

const bpForm100BRows = [
  {
    id: 'bp100b-row-1',
    natureOfReceipts: '',
    fundingSourceCode: '',
    sourceOfRevenue: '',
    legalBasis: '',
    natureOfExpenditures: '',
    cashBalance2025: 0,
    actual2025Receipt: 0,
    actual2025Expenditure: 0,
    program2026Receipt: 0,
    program2026Expenditure: 0,
    proposed2027Receipt: 0,
    proposed2027Expenditure: 0,
    level: 0,
  },
];

export const BPForm100BSchema = {
  id: 'bp-form-100-b',
  name: 'BP FORM 100-B Statement of Other Receipts/Expenditures',
  version: '2025-2027',
  headerFields: [
    { key: 'department', label: 'Department', type: 'text', span: 1, required: true },
    { key: 'agency', label: 'Agency', type: 'text', span: 1, required: true },
    { key: 'unit', label: 'Amount Unit', type: 'select', span: 1, options: ['In Thousand Pesos', 'In Pesos'] },
  ],
  sections: [
    {
      id: 'statement-other-receipts-expenditures',
      title: 'Statement of Other Receipts/Expenditures - Off-Budgetary and Custodial Funds',
      collapsible: false,
      table: {
        addRowLabel: 'Add receipt/expenditure row',
        hierarchical: true,
        allowAddChildRows: true,
        allowAddSiblingRows: true,
        childLabelKey: 'natureOfReceipts',
        defaultRows: bpForm100BRows,
        columns: [
          { key: 'natureOfReceipts', label: 'Nature of Receipts (1)', type: 'textarea', width: 270, indentKey: 'level', indentMap: { 0: 10, 1: 24, 2: 40 } },
          { key: 'fundingSourceCode', label: 'Funding Source Code (2)', type: 'text', width: 120 },
          { key: 'sourceOfRevenue', label: 'Source of Revenue (3)', type: 'textarea', width: 120 },
          { key: 'legalBasis', label: 'Legal Basis (4)', type: 'textarea', width: 110 },
          { key: 'natureOfExpenditures', label: 'Nature of Expenditures (5)', type: 'textarea', width: 155 },
          { key: 'cashBalance2025', label: 'Cash Balance as of Dec. 31, 2025* (6)', type: 'number', align: 'right', width: 140 },
          { key: 'actual2025Receipt', label: '2025 Actual Receipt (7)', type: 'number', align: 'right', width: 105, group: "AMOUNT IN P'000" },
          { key: 'actual2025Expenditure', label: '2025 Actual Expenditure (8)', type: 'number', align: 'right', width: 130, group: "AMOUNT IN P'000" },
          { key: 'program2026Receipt', label: '2026 Program Receipt (9)', type: 'number', align: 'right', width: 115, group: "AMOUNT IN P'000" },
          { key: 'program2026Expenditure', label: '2026 Program Expenditure (10)', type: 'number', align: 'right', width: 140, group: "AMOUNT IN P'000" },
          { key: 'proposed2027Receipt', label: '2027 Proposed Receipt (11)', type: 'number', align: 'right', width: 120, group: "AMOUNT IN P'000" },
          { key: 'proposed2027Expenditure', label: '2027 Proposed Expenditure (12)', type: 'number', align: 'right', width: 145, group: "AMOUNT IN P'000" },
        ],
      },
    },
  ],
  footer: {
    showGrandTotal: true,
    notes: [
      { key: 'dbm-note', label: 'NOTE: The information reflected in this table shall be evaluated and consolidated by the DBM for inclusion in Table B of the BESF.' },
      { key: 'cash-balance-note', label: '* Cash Balance as of Dec. 31, 2025 shall be equivalent to the Cash Balance as of December 31, 2024 plus FY 2025 Actual Receipt minus FY 2025 Actual Expenditure.' },
    ],
    signers: [],
  },
};

const bpForm100CRows = [
  {
    id: 'bp100c-in-cash',
    natureOfReceipts: 'I. In Cash (40402010 00)',
    uacsFundingSourceCode: '',
    term: '',
    legalBasis: '',
    natureOfExpenditures: '',
    cashBalance2025: 0,
    actual2025Receipt: 0,
    actual2025Expenditure: 0,
    program2026Receipt: 0,
    program2026Expenditure: 0,
    proposed2027Receipt: 0,
    proposed2027Expenditure: 0,
    level: 0,
    style: 'label',
  },
  {
    id: 'bp100c-in-cash-local-grants',
    natureOfReceipts: 'Local Grants',
    uacsFundingSourceCode: '',
    term: '',
    legalBasis: '',
    natureOfExpenditures: '',
    cashBalance2025: 0,
    actual2025Receipt: 0,
    actual2025Expenditure: 0,
    program2026Receipt: 0,
    program2026Expenditure: 0,
    proposed2027Receipt: 0,
    proposed2027Expenditure: 0,
    level: 1,
  },
  {
    id: 'bp100c-in-cash-foreign-grants',
    natureOfReceipts: 'Foreign Grants',
    uacsFundingSourceCode: '',
    term: '',
    legalBasis: '',
    natureOfExpenditures: '',
    cashBalance2025: 0,
    actual2025Receipt: 0,
    actual2025Expenditure: 0,
    program2026Receipt: 0,
    program2026Expenditure: 0,
    proposed2027Receipt: 0,
    proposed2027Expenditure: 0,
    level: 1,
  },
  {
    id: 'bp100c-in-kind',
    natureOfReceipts: 'II. In Kind (40402020 00)',
    uacsFundingSourceCode: '',
    term: '',
    legalBasis: '',
    natureOfExpenditures: '',
    cashBalance2025: 0,
    actual2025Receipt: 0,
    actual2025Expenditure: 0,
    program2026Receipt: 0,
    program2026Expenditure: 0,
    proposed2027Receipt: 0,
    proposed2027Expenditure: 0,
    level: 0,
    style: 'label',
  },
  {
    id: 'bp100c-in-kind-local-grants',
    natureOfReceipts: 'Local Grants',
    uacsFundingSourceCode: '',
    term: '',
    legalBasis: '',
    natureOfExpenditures: '',
    cashBalance2025: 0,
    actual2025Receipt: 0,
    actual2025Expenditure: 0,
    program2026Receipt: 0,
    program2026Expenditure: 0,
    proposed2027Receipt: 0,
    proposed2027Expenditure: 0,
    level: 1,
  },
  {
    id: 'bp100c-in-kind-foreign-grants',
    natureOfReceipts: 'Foreign Grants',
    uacsFundingSourceCode: '',
    term: '',
    legalBasis: '',
    natureOfExpenditures: '',
    cashBalance2025: 0,
    actual2025Receipt: 0,
    actual2025Expenditure: 0,
    program2026Receipt: 0,
    program2026Expenditure: 0,
    proposed2027Receipt: 0,
    proposed2027Expenditure: 0,
    level: 1,
  },
];

export const BPForm100CSchema = {
  id: 'bp-form-100-c',
  name: 'BP FORM 100-C Statement of Donations and Grants',
  version: '2025-2027',
  headerFields: [
    { key: 'department', label: 'Department', type: 'text', span: 1, required: true },
    { key: 'agency', label: 'Agency', type: 'text', span: 1, required: true },
    { key: 'unit', label: 'Amount Unit', type: 'select', span: 1, options: ['In Thousand Pesos', 'In Pesos'] },
  ],
  sections: [
    {
      id: 'statement-donations-grants',
      title: 'Statement of Donations and Grants',
      collapsible: false,
      table: {
        addRowLabel: 'Add donation/grant row',
        hierarchical: true,
        allowAddChildRows: true,
        allowAddSiblingRows: true,
        childLabelKey: 'natureOfReceipts',
        defaultRows: bpForm100CRows,
        columns: [
          { key: 'natureOfReceipts', label: 'Nature of Receipts (1)', type: 'textarea', width: 270, indentKey: 'level', indentMap: { 0: 10, 1: 24, 2: 40 } },
          { key: 'uacsFundingSourceCode', label: 'UACS Funding Source Code (2)', type: 'text', width: 110 },
          { key: 'term', label: 'Term (i.e. implementation period in years) (3)', type: 'textarea', width: 170 },
          { key: 'legalBasis', label: 'Legal Basis (4)', type: 'textarea', width: 110 },
          { key: 'natureOfExpenditures', label: 'Nature of Expenditures (5)', type: 'textarea', width: 160 },
          { key: 'cashBalance2025', label: 'Cash Balance as of Dec. 31, 2025* (6)', type: 'number', align: 'right', width: 140 },
          { key: 'actual2025Receipt', label: '2025 Actual Receipt (7)', type: 'number', align: 'right', width: 105, group: "AMOUNT IN P'000" },
          { key: 'actual2025Expenditure', label: '2025 Actual Expenditure (8)', type: 'number', align: 'right', width: 130, group: "AMOUNT IN P'000" },
          { key: 'program2026Receipt', label: '2026 Program Receipt (9)', type: 'number', align: 'right', width: 115, group: "AMOUNT IN P'000" },
          { key: 'program2026Expenditure', label: '2026 Program Expenditure (10)', type: 'number', align: 'right', width: 140, group: "AMOUNT IN P'000" },
          { key: 'proposed2027Receipt', label: '2027 Proposed Receipt (11)', type: 'number', align: 'right', width: 120, group: "AMOUNT IN P'000" },
          { key: 'proposed2027Expenditure', label: '2027 Proposed Expenditure (12)', type: 'number', align: 'right', width: 145, group: "AMOUNT IN P'000" },
        ],
      },
    },
  ],
  footer: {
    showGrandTotal: true,
    notes: [
      { key: 'dbm-note', label: 'NOTE: The information reflected in this table shall be evaluated and consolidated by the DBM for inclusion in Table B of the BESF.' },
      { key: 'cash-balance-note', label: '* Cash Balance as of Dec. 31, 2025 shall be equivalent to the Cash Balance as of December 31, 2024 plus FY 2025 Actual Receipt minus FY 2025 Actual Expenditure.' },
    ],
    signers: [],
  },
};

const bpForm200Particulars = [
  { id: 'new-general-appropriations', label: 'NEW GENERAL APPROPRIATIONS', level: 0, style: 'label' },
  { id: 'general-fund', label: 'General Fund', level: 1 },
  { id: 'automatic-appropriations', label: 'AUTOMATIC APPROPRIATIONS', level: 0, style: 'label' },
  { id: 'retirement-life-insurance-premiums', label: 'Retirement and Life Insurance Premiums', level: 1 },
  { id: 'grant-proceeds', label: 'Grant Proceeds', level: 1 },
  { id: 'special-account', label: 'Special Account', level: 1 },
  { id: 'customs-duties-taxes', label: 'Customs Duties and Taxes', level: 1 },
  { id: 'sale-nonserviceable-equipment', label: 'Proceeds from Sale of Non-serviceable, Obsolete and Other Unnecessary Equipment', level: 1 },
  { id: 'tax-refund', label: 'Tax Refund', level: 1 },
  { id: 'pension-ex-presidents', label: 'Pension for Ex-Presidents or their surviving spouses', level: 1 },
  { id: 'continuing-appropriations', label: 'CONTINUING APPROPRIATIONS', level: 0, style: 'label' },
  { id: 'unobligated-allotments', label: 'Unobligated Allotments', level: 1, style: 'label' },
  { id: 'unobligated-mooe', label: 'Maintenance and Other Operating Expenses (R.A. ________)', level: 2 },
  { id: 'unobligated-co', label: 'Capital Outlays (R.A. ________)', level: 2 },
  { id: 'unreleased-appropriations', label: 'Unreleased Appropriations', level: 1, style: 'label' },
  { id: 'unreleased-mooe', label: 'Maintenance and Other Operating Expenses (R.A. ________)', level: 2 },
  { id: 'unreleased-co', label: 'Capital Outlays (R.A. ________)', level: 2 },
  { id: 'budgetary-adjustments', label: 'BUDGETARY ADJUSTMENTS:', level: 0, style: 'label' },
  { id: 'transfers-to', label: 'Transfer(s) to:', level: 1, style: 'label' },
  { id: 'transfers-to-specify', label: 'Specify', level: 2 },
  { id: 'transfers-from', label: 'Transfer(s) from:', level: 1, style: 'label' },
  { id: 'ndrrmf', label: 'National Disaster Risk Reduction and Management Fund', level: 2 },
  { id: 'contingent-fund', label: 'Contingent Fund', level: 2 },
  { id: 'misc-personnel-benefits-fund', label: 'Miscellaneous Personnel Benefits Fund', level: 2 },
  { id: 'pension-gratuity-fund', label: 'Pension and Gratuity Fund', level: 2 },
  { id: 'unprogrammed-funds', label: 'Unprogrammed Funds (Specify)', level: 2 },
  { id: 'others-specify', label: 'Others (Specify)', level: 2 },
  { id: 'total-available-appropriations', label: 'TOTAL AVAILABLE APPROPRIATIONS', level: 0, style: 'total' },
  { id: 'less-unused-appropriations', label: 'LESS: Unused Appropriations', level: 0, style: 'label' },
  { id: 'unobligated-allotment-less', label: 'Unobligated Allotment', level: 2 },
  { id: 'unreleased-appropriation-less', label: 'Unreleased Appropriation', level: 2 },
  { id: 'total-obligations', label: 'TOTAL OBLIGATIONS', level: 0, style: 'total' },
];

const bpForm200Rows = bpForm200Particulars.map(({ id, label, level, style }) => ({
  id: `bp200-${id}`,
  particulars: label,
  actual2025: 0,
  current2026: 0,
  proposed2027: 0,
  level,
  style,
}));

export const BPForm200Schema = {
  id: 'bp-form-200',
  name: 'BP FORM 200 Comparison of Appropriations and Obligations',
  version: '2025-2027',
  headerFields: [
    { key: 'department', label: 'Department', type: 'text', span: 1, required: true },
    { key: 'agency', label: 'Agency', type: 'text', span: 1, required: true },
    { key: 'operatingUnit', label: 'Operating Unit', type: 'text', span: 1 },
    { key: 'unit', label: 'Amount Unit', type: 'select', span: 1, options: ['In Thousand Pesos', 'In Pesos'] },
  ],
  sections: [
    {
      id: 'comparison-appropriations-obligations',
      title: 'Comparison of Appropriations and Obligations',
      collapsible: false,
      table: {
        addRowLabel: 'Add appropriation/obligation row',
        hierarchical: true,
        allowAddChildRows: true,
        allowAddSiblingRows: true,
        childLabelKey: 'particulars',
        defaultRows: bpForm200Rows,
        columns: [
          { key: 'particulars', label: 'Particulars (1)', type: 'textarea', width: 520, indentKey: 'level', indentMap: { 0: 10, 1: 60, 2: 110 } },
          { key: 'actual2025', label: '2025 Actual (2)', type: 'number', align: 'right', width: 150, group: "AMOUNT IN P'000" },
          { key: 'current2026', label: '2026 Current (3)', type: 'number', align: 'right', width: 150, group: "AMOUNT IN P'000" },
          { key: 'proposed2027', label: '2027 Proposed (4)', type: 'number', align: 'right', width: 150, group: "AMOUNT IN P'000" },
        ],
      },
    },
  ],
  footer: {
    showGrandTotal: false,
    notes: [],
    signers: [],
  },
};

const bpForm300Rows = [
  {
    id: 'bp300-special-provisions',
    authorized2026: 'A. SPECIAL PROVISIONS',
    proposal2027: '',
    justification: '',
    level: 0,
    style: 'label',
  },
  {
    id: 'bp300-general-provisions',
    authorized2026: 'B. GENERAL PROVISIONS',
    proposal2027: '',
    justification: '',
    level: 0,
    style: 'label',
  },
];

export const BPForm300Schema = {
  id: 'bp-form-300',
  name: 'BP FORM 300 Proposed Provisions',
  version: '2027',
  headerFields: [
    { key: 'department', label: 'Department', type: 'text', span: 1, required: true },
    { key: 'agency', label: 'Agency', type: 'text', span: 1, required: true },
  ],
  sections: [
    {
      id: 'proposed-provisions',
      title: 'FY 2027 Proposed Provisions',
      collapsible: false,
      table: {
        addRowLabel: 'Add provision row',
        hierarchical: false,
        defaultRows: bpForm300Rows,
        columns: [
          { key: 'authorized2026', label: 'Authorized for 2026 (Provision in the FY 2026 NEP) (1)', type: 'textarea', width: 360 },
          { key: 'proposal2027', label: 'Proposal for FY 2027 (2)', type: 'textarea', width: 360 },
          { key: 'justification', label: 'Justification (Proposal should include both legal and practical considerations/justifications) (3)', type: 'textarea', width: 380 },
        ],
      },
    },
  ],
  footer: {
    showGrandTotal: false,
    notes: [],
    signers: [],
  },
};

export const BPForm201Schema = createEmptyBPFormSchema('201 Summary of Obligations and Proposed Programs/Projects');
export const BPForm201ASchema = createEmptyBPFormSchema('201-A Obligations for PS');
export const BPForm201BSchema = createEmptyBPFormSchema('201-B Obligations for MOOE');
export const BPForm201CSchema = createEmptyBPFormSchema('201-C Obligations for FINEX');
export const BPForm201DSchema = createEmptyBPFormSchema('201-D Obligations for CO');
export const BPForm201ESchema = createEmptyBPFormSchema('201-E Summary of Outyear Requirements');
export const BPForm202Schema = createEmptyBPFormSchema('202 Profile for Tier 2 Budget Proposal');
export const BPForm203Schema = createEmptyBPFormSchema('203 Profile for Foreign-Assisted Projects');
export const BPForm204Schema = createEmptyBPFormSchema('204 Staffing Summary of Non-Permanent Position');
export const BPForm205Schema = createEmptyBPFormSchema('205 List of Retirees');
export const BPForm206Schema = createEmptyBPFormSchema('206 Convergence Programs and Project');
export const BPForm207Schema = createEmptyBPFormSchema('207 Climate Change Expenditures');

const programBudgetMatrixRows = [
  { id: 'pbm-gas', uacsCode: '', pap: 'I. GAS', level: 0, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'total' },
  { id: 'pbm-gas-activities', uacsCode: '', pap: 'Activities', level: 1, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'label' },
  { id: 'pbm-gas-a1', uacsCode: '', pap: '1.', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-gas-a2', uacsCode: '', pap: '2.', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-gas-a3', uacsCode: '', pap: '3.', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sto', uacsCode: '', pap: 'II. STO', level: 0, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'total' },
  { id: 'pbm-sto-activities', uacsCode: '', pap: 'Activities', level: 1, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'label' },
  { id: 'pbm-sto-a1', uacsCode: '', pap: '1.', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sto-a2', uacsCode: '', pap: '2.', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sto-a3', uacsCode: '', pap: '3.', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sto-projects', uacsCode: '', pap: 'Projects', level: 1, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'label' },
  { id: 'pbm-sto-p1', uacsCode: '', pap: '1.', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sto-p2', uacsCode: '', pap: '2.', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sto-p3', uacsCode: '', pap: '3.', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-operations', uacsCode: '', pap: 'III. OPERATIONS', level: 0, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'total' },
  { id: 'pbm-outcome', uacsCode: '', pap: 'Organizational Outcome', level: 1, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'label' },
  { id: 'pbm-program-1', uacsCode: '', pap: 'Program 1', level: 1, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'total' },
  { id: 'pbm-subprogram-1', uacsCode: '', pap: 'Sub-Program 1', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'label' },
  { id: 'pbm-sp1-activities', uacsCode: '', pap: 'Activities', level: 3, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'label' },
  { id: 'pbm-sp1-a1', uacsCode: '', pap: '1.', level: 4, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sp1-a2', uacsCode: '', pap: '2.', level: 4, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sp1-a3', uacsCode: '', pap: '3.', level: 4, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sp1-projects', uacsCode: '', pap: 'Projects', level: 3, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'label' },
  { id: 'pbm-sp1-p1', uacsCode: '', pap: '1.', level: 4, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sp1-p2', uacsCode: '', pap: '2.', level: 4, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sp1-p3', uacsCode: '', pap: '3.', level: 4, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-subprogram-2', uacsCode: '', pap: 'Sub-Program 2', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'label' },
  { id: 'pbm-sp2-activities', uacsCode: '', pap: 'Activities', level: 3, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'label' },
  { id: 'pbm-sp2-a1', uacsCode: '', pap: '1.', level: 4, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sp2-a2', uacsCode: '', pap: '2.', level: 4, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sp2-a3', uacsCode: '', pap: '3.', level: 4, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sp2-projects', uacsCode: '', pap: 'Projects', level: 3, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'label' },
  { id: 'pbm-sp2-p1', uacsCode: '', pap: '1.', level: 4, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sp2-p2', uacsCode: '', pap: '2.', level: 4, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-sp2-p3', uacsCode: '', pap: '3.', level: 4, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-program-2', uacsCode: '', pap: 'Program 2', level: 1, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'total' },
  { id: 'pbm-program-2-activities', uacsCode: '', pap: 'Activities', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'label' },
  { id: 'pbm-program-2-a1', uacsCode: '', pap: '1.', level: 3, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-program-2-a2', uacsCode: '', pap: '2.', level: 3, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-program-2-a3', uacsCode: '', pap: '3.', level: 3, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-program-2-projects', uacsCode: '', pap: 'Projects', level: 2, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'label' },
  { id: 'pbm-program-2-p1', uacsCode: '', pap: '1.', level: 3, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-program-2-p2', uacsCode: '', pap: '2.', level: 3, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-program-2-p3', uacsCode: '', pap: '3.', level: 3, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 },
  { id: 'pbm-subtotal-operations', uacsCode: 'Sub-Total Operations', pap: '', level: 0, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'total' },
  { id: 'pbm-grand-total', uacsCode: 'GRAND TOTAL', pap: '', level: 0, status: '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0, style: 'total' },
];

export const ProgramBudgetMatrixSchema = {
  id: 'program-budget-matrix',
  name: 'Program Budget Matrix',
  version: '2027',
  headerFields: [
    { key: 'programCycle', label: 'Program Cycle', type: 'select', span: 1, options: ['2025 Actual Obligation', '2026 Current Program', '2027 Total Proposed Program'] },
    { key: 'tier', label: 'Tier', type: 'select', span: 1, options: ['Tier 1', 'Tier 2'] },
    { key: 'department', label: 'Department', type: 'text', span: 3, required: true },
    { key: 'agency', label: 'Agency', type: 'text', span: 3, required: true },
    { key: 'operatingUnit', label: 'Operating Unit', type: 'text', span: 3 },
  ],
  sections: [
    {
      id: 'program-budget-matrix',
      title: 'Program Budget Matrix',
      collapsible: false,
      table: {
        addRowLabel: 'Add P/A/P row',
        hierarchical: true,
        allowAddChildRows: true,
        allowAddSiblingRows: true,
        childLabelKey: 'pap',
        defaultRows: programBudgetMatrixRows,
        columns: [
          { key: 'uacsCode', label: 'UACS Code', type: 'text', width: 150 },
          { key: 'pap', label: 'P/A/P', type: 'text', width: 260, indentKey: 'level', indentMap: { 0: 10, 1: 22, 2: 38, 3: 54, 4: 70 } },
          { key: 'status', label: 'Status (OG) (P) (T)', type: 'select', options: ['OG', 'P', 'T'], width: 85 },
          { key: 'ps', label: 'PS', type: 'number', align: 'right', width: 90, group: 'AMOUNT (in thousand)' },
          { key: 'mooe', label: 'MOOE', type: 'number', align: 'right', width: 90, group: 'AMOUNT (in thousand)' },
          { key: 'finex', label: 'FINEX', type: 'number', align: 'right', width: 90, group: 'AMOUNT (in thousand)' },
          { key: 'co', label: 'CO', type: 'number', align: 'right', width: 90, group: 'AMOUNT (in thousand)' },
          { key: 'total', label: 'Total', type: 'computed', formula: 'ps + mooe + finex + co', align: 'right', width: 90, editable: false, group: 'AMOUNT (in thousand)' },
        ],
      },
    },
  ],
  footer: {
    showGrandTotal: false,
    notes: [
      { key: 'notes-title', label: 'Notes:' },
      { key: 'og', label: 'OG - On-going' },
      { key: 'p', label: 'P - Proposed' },
      { key: 't', label: 'T - Terminating' },
    ],
    signers: [],
  },
};

export const DEFAULT_FORM_SCHEMAS = [
  BPFormASchema,
  BPFormBSchema,
  BPFormCSchema,
  BPFormDSchema,
  BPForm100Schema,
  BPForm100ASchema,
  BPForm100BSchema,
  BPForm100CSchema,
  BPForm200Schema,
  BPForm201Schema,
  BPForm201ASchema,
  BPForm201BSchema,
  BPForm201CSchema,
  BPForm201DSchema,
  BPForm201ESchema,
  BPForm202Schema,
  BPForm203Schema,
  BPForm204Schema,
  BPForm205Schema,
  BPForm206Schema,
  BPForm207Schema,
  BPForm300Schema,
  ProgramBudgetMatrixSchema,
];
