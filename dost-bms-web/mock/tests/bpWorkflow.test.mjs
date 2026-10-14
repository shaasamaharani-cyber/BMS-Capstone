import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, rmdir, unlink, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { DatabaseSync } from 'node:sqlite';
import { createDocumentDb } from '../server/db.mjs';
import { PROPOSAL_QUESTIONS } from '../../src/bp_forms/proposal_questions.js';
import { QUESTION_CONDITION_OPTIONS, matchesRequirement } from '../../src/bp_forms/bp_form_conditions.js';
import { BP_FORM_CATALOG, getCycleFormCatalog } from '../../src/bp_forms/bp_form_catalog.js';
import { evaluateRequiredForms, getRequiredQuestions } from '../../src/bp_forms/bp_form_rules.js';
import { buildFormView, getFormCompletion, getFormContent, getFormDefinition, getDefaultFormDefinition, resolveCommonValues } from '../../src/bp_forms/bp_form_fields.js';
import { validateFormConfig } from '../../src/bp_forms/bp_form_configuration.js';
import { STAFFING_COLUMNS, calculateTableRows } from '../../src/bp_forms/structured_fields.js';
import { computeBudgetLineItemTotals, financialItemFromStored, getLineItemErrors } from '../../src/utils/budget_financials.js';
import { handleBudgetRequests } from '../server/routes/budgetRequests.mjs';
import { saveBudgetRequest } from '../server/services/budgetRequests.mjs';
import { validateConfiguredSubmission } from '../server/services/requestFormConfiguration.mjs';
import { handleBudgetReview } from '../server/routes/budgetReview.mjs';
import { handleUnifiedBudgets } from '../server/routes/unifiedBudgets.mjs';

const ids = BP_FORM_CATALOG.map((form) => form.id);
const condition = (questionId, value, id = questionId) => ({ id, questionId, operator: 'equals', value, enabled: true });
const config = (conditions = [], changes = {}) => ({ level: 'request', fields: [{ key: 'description', label: 'Description', type: 'text', source: 'user', required: true }], requirement: { mode: 'conditional', enabled: true, match: 'all', conditions }, ...changes });

function fixture(t, enabled = []) {
  const resources = new Map(Object.entries({
    users: [1, 2, 3, 4].map((id) => ({ id, usr_id: id, usr_name: `User ${id}`, usr_role_id: id > 2 ? id : 1, usr_requesting_unit_id: id <= 2 ? id : null })),
    roles: [{ id: 1, role_id: 1, role_group: 'requester' }, { id: 3, role_id: 3, role_group: 'reviewer' }, { id: 4, role_id: 4, role_group: 'admin' }],
    'requesting-units': [{ id: 1, ru_id: 1, ru_name: 'Institution A' }, { id: 2, ru_id: 2, ru_name: 'Institution B' }],
    'fiscal-years': [{ id: 1, fy_id: 1, fy_year: '2027', fy_is_active: 1 }, { id: 2, fy_id: 2, fy_year: '2028', fy_is_active: 1 }],
    'budget-categories': ['PS', 'MOOE', 'CO', 'TAG', 'FINEX'].map((code, index) => ({ id: index + 1, bcat_id: index + 1, bcat_code: code })),
    'budget-cycles': [{ id: '2027', enabled_form_ids: enabled, form_configs: {}, custom_forms: [], supporting_documents: [] }],
  }));
  const db = {
    rows: (resource) => structuredClone(resources.get(resource) || []),
    find: (resource, id) => db.rows(resource).find((row) => String(row.id) === String(id)) || null,
    nextId: (resource) => Math.max(0, ...db.rows(resource).map((row) => Number(row.id)).filter(Number.isFinite)) + 1,
    upsert: (resource, id, row) => { resources.set(resource, [...db.rows(resource).filter((old) => String(old.id) !== String(id)), structuredClone(row)]); return row; },
    remove: (resource, id) => resources.set(resource, db.rows(resource).filter((row) => String(row.id) !== String(id))),
    removeWhere: (resource, predicate) => resources.set(resource, db.rows(resource).filter((row) => !predicate(row))),
  };
  t.after(async () => {
    for (const row of db.rows('budget-request-versions')) if (row.brv_pdf_path) await unlink(row.brv_pdf_path).catch(() => {});
    for (const row of db.rows('unified-budget-versions')) if (row.ubv_payload?.pdfPath) await unlink(row.ubv_payload.pdfPath).catch(() => {});
    for (const request of db.rows('budget-requests')) for (const file of request.br_attached_files || []) {
      const name = file.url?.split('/').at(-1);
      if (name) await unlink(resolve('mock/generated/attachments', name)).catch(() => {});
    }
  });
  const request = async (method, path, payload = {}, actor = 1) => {
    let response;
    await handleBudgetRequests({ db, parts: path.split('/'), payload, req: { method, headers: actor ? { authorization: `Bearer mock-token-uid-${actor}` } : {} }, res: {}, url: new URL('http://test/' + path), paginate: (data) => ({ data }), json: (_, status, body) => { response = { status, ...body }; } });
    return response;
  };
  const header = { br_title: 'Research proposal', br_requesting_unit_id: 1, br_fiscal_year_id: 1, br_unified_request: { request: { fundingSource: 'national_government' }, answers: {}, formValues: {} }, items: [{ bri_category_id: 2, bri_description: 'Supplies', bri_cost_structure: 'General', bri_planned_amount: 100 }] };
  const create = async (changes = {}) => (await request('POST', 'budget-requests', { ...header, ...changes })).data;
  const sign = (record, formId) => {
    const evaluated = validateConfiguredSubmission(db, record).unified;
    const context = { common: evaluated.common, totals: evaluated.totalsAtGeneration, lineItems: evaluated.lineItems, formValues: evaluated.formValues, formConfigs: evaluated.formConfigs, formDefinitions: evaluated.formDefinitions };
    return saveBudgetRequest(db, { br_attached_files: [{ formId, name: `Signed - ${ids.includes(formId) ? BP_FORM_CATALOG.find((form) => form.id === formId).code : 'Custom'} - signed.pdf`, dataUrl: 'data:application/pdf;base64,JVBERi0xCg==', formDefinition: JSON.stringify(getFormDefinition(formId, context)), formContent: getFormContent(formId, context) }] }, record);
  };
  return { db, request, create, header, sign };
}

test('question conditions share every requester label, type and exact answer option', () => {
  assert.equal(QUESTION_CONDITION_OPTIONS.length, PROPOSAL_QUESTIONS.length);
  for (const question of PROPOSAL_QUESTIONS) {
    const option = QUESTION_CONDITION_OPTIONS.find((row) => row.id === question.id);
    assert.equal(option.label, question.label);
    assert.equal(option.type, question.type);
    assert.deepEqual(option.options, question.options);
  }
});

test('new question IDs support ALL and ANY, missing answers and legacy foreign/numeric rules', () => {
  const requirement = { match: 'all', conditions: [condition('proposalTier', 'tier2'), condition('hasClimate', 'yes')] };
  assert.equal(matchesRequirement(requirement, { answers: { proposalTier: 'tier2', hasClimate: 'yes' } }), true);
  assert.equal(matchesRequirement(requirement, { answers: { proposalTier: 'tier2', hasClimate: 'no' } }), false);
  requirement.match = 'any';
  assert.equal(matchesRequirement(requirement, { answers: { proposalTier: 'tier1', hasClimate: 'yes' } }), true);
  assert.equal(matchesRequirement(requirement, { answers: {} }), false);
  assert.equal(matchesRequirement({ match: 'all', conditions: [{ field: 'fundingSource', operator: 'equals', value: 'foreign' }, { field: 'finexTotal', operator: 'gt', value: 0 }] }, { common: { fundingSource: 'foreign_loan' }, totals: { finexTotal: 20 } }), true);
});

test('every default expenditure and proposal trigger is distinct, and TAG never implies climate', () => {
  const selected = (answers = {}, totals = {}, common = {}) => evaluateRequiredForms(answers, totals, common, ids).arrRequired.map((row) => row.formId);
  for (const [total, form] of [['psTotal', 'bp-201-a'], ['mooeTotal', 'bp-201-b'], ['finexTotal', 'bp-201-c'], ['coTotal', 'bp-201-d'], ['climateTotal', 'bp-207']]) {
    assert.ok(selected({}, { [total]: 1 }).includes(form));
    assert.ok(!selected({}, { [total]: 0 }).includes(form));
  }
  for (const [question, form] of [['hasOutyear', 'bp-201-e'], ['hasNonPermanent', 'bp-204'], ['isPcb', 'bp-206'], ['hasClimate', 'bp-207'], ['hasRetirement', 'bp-205'], ['hasEarmarked', 'bp-100-a'], ['hasOtherReceipts', 'bp-100-b'], ['hasDonations', 'bp-100-c'], ['hasRdcInputs', 'bp-c'], ['hasCsoInputs', 'bp-d']]) {
    assert.ok(selected({ [question]: 'yes' }).includes(form));
    assert.ok(!selected({ [question]: 'no' }).includes(form));
  }
  assert.ok(selected({ proposalTier: 'tier2' }).includes('bp-202'));
  assert.ok(!selected({ proposalTier: 'tier1' }).includes('bp-202'));
  for (const fundingSource of ['foreign_grant', 'foreign_loan']) assert.ok(selected({}, {}, { fundingSource }).includes('bp-203'));
  assert.ok(!selected({}, { tagTotal: 200 }).includes('bp-207'));
  assert.ok(selected({ hasProvisions: 'no' }).includes('bp-300'), 'Retention is addressed by BP300 too');
});

test('disabled and paused forms remain excluded; mandates lock removal until admin allows it', () => {
  const configs = { 'bp-202': config([condition('proposalTier', 'tier2')]) };
  const evaluate = (answers, enabled = ['bp-202'], override = {}) => evaluateRequiredForms(answers, {}, {}, enabled, override, [], configs).arrRequired;
  assert.equal(evaluate({ proposalTier: 'tier2' }).length, 1);
  assert.equal(evaluate({ proposalTier: 'tier1' }).length, 0);
  assert.equal(evaluate({ proposalTier: 'tier2' }, []).length, 0);
  const remove = { 'bp-202': { action: 'remove', reason: 'Reviewed by office' } };
  assert.equal(evaluate({ proposalTier: 'tier2' }, ['bp-202'], remove).length, 1);
  configs['bp-202'].requirement.allowOverride = true;
  assert.equal(evaluate({ proposalTier: 'tier2' }, ['bp-202'], remove).length, 0);
  configs['bp-202'].requirement.enabled = false;
  assert.equal(evaluate({ proposalTier: 'tier2' }).length, 0);
});

test('only relevant requester questions block submission, with institution reporting retained', () => {
  const questions = getRequiredQuestions(['bp-202', 'bp-205', 'bp-201-c'], {}, BP_FORM_CATALOG);
  assert.deepEqual(questions.map((row) => row.id), ['proposalTier']);
  assert.match(getCycleFormCatalog({}).find((form) => form.id === 'bp-b').reportingScope, /Individual institution/);
  assert.equal(getRequiredQuestions([], {}, BP_FORM_CATALOG).length, 0);
});

test('peso totals reconcile FinEx, climate subsets and unchanged legacy TAG amounts', () => {
  const items = [{ name: 'Staff', category: 'PS', amount: 10.01 }, { name: 'Supplies', category: 'MOOE', amount: 20.02, climateAmount: 7.01 }, { name: 'FinEx', category: 'FINEX', amount: 30.03 }, { name: 'Equipment', category: 'CO', amount: 40.04, climateAmount: 9.02 }, { category: 'TAG', amount: 50.05 }];
  const totals = computeBudgetLineItemTotals(items);
  assert.equal(totals.grandTotal, 150.15);
  assert.equal(totals.finexTotal, 30.03);
  assert.equal(totals.climateTotal, 16.03);
  assert.equal(totals.legacyTagTotal, 50.05);
  assert.deepEqual(getLineItemErrors({ category: 'PS', name: 'Ordinary item', amount: 100, climateAmount: '' }), []);
  const context = { common: {}, totals, lineItems: items, formValues: {} };
  assert.equal(buildFormView('bp-a', context).table.total, 100.1);
  assert.equal(buildFormView('bp-201-c', context).fields.find((field) => field.key === 'proposedFinex').value, 30.03);
  assert.equal(buildFormView('bp-207', context).table.total, 16.03);
  assert.equal(buildFormView('bp-206', context).fields.find((field) => field.key === 'budgetRequirement').value, 60.06);
  for (const item of [{ category: 'MOOE', name: 'x', amount: -1 }, { category: 'MOOE', name: 'x', amount: 'NaN' }, { category: 'CO', name: 'x', amount: 100, climateAmount: 101 }, { category: 'PS', name: 'x', amount: 100, climateAmount: 10 }]) assert.ok(getLineItemErrors(item).length);
});

test('common metadata uses named sources independently, without treating request IDs as accounting references', () => {
  const common = resolveCommonValues({ title: 'Research', unitId: '67', fiscalYearId: '67', appropriationSource: 'GAA', prexcCode: 'Office-confirmed UACS reference', programPap: 'Research program' }, { unitName: 'Laboratory A', agencyName: 'Research Institute', fiscalYearLabel: '2027' });
  assert.equal(common.agency, 'Research Institute');
  assert.equal(common.operatingUnit, 'Laboratory A');
  assert.equal(common.appropriationSource, 'GAA');
  assert.equal(common.prexcCode, 'Office-confirmed UACS reference');
  assert.equal(common.programPap, 'Research program');
  const unknown = resolveCommonValues({ unitId: '67' }, {});
  for (const key of ['operatingUnit', 'appropriationSource', 'prexcCode', 'agency']) assert.equal(unknown[key], '');
  const overridden = resolveCommonValues({ implementingAgency: 'Confirmed agency', operatingUnit: 'Field office', appropriationSource: '67', prexcCode: '67' }, { agencyName: 'Lookup agency', unitName: 'Lookup unit' });
  assert.equal(overridden.agency, 'Confirmed agency');
  assert.equal(overridden.operatingUnit, 'Field office');
  assert.equal(overridden.prexcCode, '67', 'Existing user-entered references must not be silently erased');
});

test('Form A no longer requires the internal performance measure and retains old data and captured definitions', () => {
  const previous = { fields: [{ key: 'performanceMeasure', label: 'Associated performance measure', type: 'textarea', source: 'user', required: true }], table: { kind: 'matrix' } };
  const context = { common: {}, totals: {}, lineItems: [], formConfigs: { 'bp-a': { fields: previous.fields } }, formValues: { 'bp-a': { performanceMeasure: 'Previously entered output' } } };
  assert.equal(getFormCompletion('bp-a', { ...context, formValues: {} }).complete, true);
  const field = buildFormView('bp-a', context).fields[0];
  assert.equal(field.required, false);
  assert.match(field.label, /Internal/);
  assert.equal(field.value, 'Previously entered output');
  assert.equal(getFormDefinition('bp-a', { ...context, formDefinitions: { 'bp-a': previous } }), previous);
  assert.equal(previous.fields[0].required, true, 'Historical signed definitions remain intact');
});

test('Form B uses indicator units, exact year and tier columns, signatories, and preserves an unassigned legacy target', () => {
  const values = { performance: [{ outcome: 'Outcome 1', program: 'Research', subprogram: 'Grants', indicatorType: 'Output indicator', indicator: 'Projects delivered', actualTarget: '80%', actualAccomplishment: '82%', currentTarget: '90%', baseline: 'Percentage of projects', proposedTier1: '92%', proposedTier2: '95%', proposedTarget: 99, outyearOne: 100 }] };
  const context = { common: { fiscalYear: '2027' }, formValues: { 'bp-b': values }, totals: {}, lineItems: [] };
  const view = buildFormView('bp-b', context);
  const table = view.fields.find((field) => field.key === 'performance');
  for (const [key, label] of [['actualTarget', '2025 GAA targets'], ['actualAccomplishment', '2025 actual accomplishments'], ['currentTarget', '2026 GAA targets'], ['proposedTier1', '2027 NEP targets — Tier 1'], ['proposedTier2', '2027 NEP targets — Tier 2']]) {
    assert.equal(table.columns.find((column) => column.key === key).label, label);
    assert.equal(table.columns.find((column) => column.key === key).type, 'text');
  }
  assert.match(table.columns.find((column) => column.key === 'proposedTarget').label, /tier unassigned/);
  assert.deepEqual(table.value, values.performance);
  assert.equal(getFormCompletion('bp-b', context).complete, true);
  assert.equal(view.table, null, 'Performance targets are never a financial matrix');
  assert.equal(view.signatories.length, 3);
  const fresh = buildFormView('bp-b', { ...context, formValues: {} }).fields.find((field) => field.key === 'performance');
  assert.ok(!fresh.columns.some((column) => column.key === 'proposedTarget'));
  assert.equal(validateFormConfig(config([], { fields: getDefaultFormDefinition('bp-b').fields, requirement: { mode: 'always', match: 'all', conditions: [] } })).error, undefined);
  const oldKeys = ['outcome', 'program', 'indicator', 'baseline', 'actualTarget', 'actualAccomplishment', 'currentTarget', 'proposedTarget', 'outyearOne', 'outyearTwo'];
  const old = { fields: [{ key: 'performance', label: 'Performance', type: 'table', source: 'user', columns: oldKeys.map((key) => ({ key, label: key, type: key.includes('Target') ? 'number' : 'text' })) }] };
  const upgraded = buildFormView('bp-b', { ...context, formConfigs: { 'bp-b': old } });
  assert.ok(upgraded.fields[0].columns.some((column) => column.key === 'proposedTier2'));
  assert.equal(upgraded.fields[0].value[0].proposedTarget, 99);
  const frozen = getFormDefinition('bp-b', { formDefinitions: { 'bp-b': old } });
  assert.equal(frozen, old);
  assert.equal(old.fields[0].columns.length, 10);
});

test('Form B draft targets and signers reopen unchanged; target edits invalidate signatures and submitted values remain captured', async (t) => {
  const { db, request, create, sign } = fixture(t, ['bp-b']);
  const fields = getDefaultFormDefinition('bp-b').fields;
  db.upsert('budget-cycles', '2027', { id: '2027', enabled_form_ids: ['bp-b'], custom_forms: [], form_configs: { 'bp-b': config([], { fields, requirement: { mode: 'always', match: 'any', conditions: [] } }) }, supporting_documents: [] });
  const values = { performance: [{ outcome: 'Outcome A', program: 'Research', indicatorType: 'Outcome indicator', indicator: 'Service quality', actualTarget: '80%', actualAccomplishment: '85%', currentTarget: '90%', baseline: '% satisfaction', proposedTier1: '92%', proposedTier2: '95%', proposedTarget: 100 }], budgetOfficer: 'Prepared name', planningOfficer: 'Planning name', agencyHead: 'Approved name', approvalDate: '2026-10-14' };
  const draft = await create({ br_unified_request: { request: { fundingSource: 'national_government' }, answers: {}, formValues: { 'bp-b': values } } });
  const reopened = await request('GET', 'budget-requests/1');
  assert.deepEqual(reopened.data.br_unified_request.formValues['bp-b'], values);
  assert.deepEqual(validateConfiguredSubmission(db, sign(draft, 'bp-b')).errors, []);
  const changed = structuredClone(values);
  changed.performance[0].proposedTier2 = '97%';
  await request('PUT', 'budget-requests/1', { br_unified_request: { ...draft.br_unified_request, formValues: { 'bp-b': changed } } });
  assert.match((await request('POST', 'budget-requests/1/submit')).message, /content changed/);
  sign(db.find('budget-requests', 1), 'bp-b');
  assert.equal((await request('POST', 'budget-requests/1/submit')).status, 200);
  const submitted = db.find('budget-request-versions', 1).brv_snapshot.unifiedRequest;
  assert.deepEqual(submitted.formValues['bp-b'], changed);
  assert.equal(submitted.formDefinitions['bp-b'].fields.find((field) => field.key === 'performance').columns.find((column) => column.key === 'proposedTier2').type, 'text');
});

test('structured staffing calculates explicit costs, validates rows and preserves unknown amounts', () => {
  const row = { pap: 'Research', unit: 'Lab', position: 'Scientist', classification: 'Contractual', tier: 'Tier 2', salaryGrade: 1, positions: 2, months: 6, monthlyRate: 10000, ...Object.fromEntries(STAFFING_COLUMNS.filter((column) => column.type === 'number' && !column.calculation && !column.required).map((column) => [column.key, 0])) };
  const result = calculateTableRows(STAFFING_COLUMNS, [row])[0];
  assert.equal(result.totalMonths, 12);
  assert.equal(result.salary, 120000);
  assert.equal(result.totalCompensation, 120000);
  assert.equal(calculateTableRows(STAFFING_COLUMNS, [{ ...row, monthlyRate: '' }])[0].salary, null);
  assert.equal(getFormCompletion('bp-204', { formValues: { 'bp-204': { positions: [row, row] } } }).complete, true);
  assert.equal(getFormCompletion('bp-204', { formValues: { 'bp-204': { positions: [{ ...row, months: 13 }] } } }).complete, false);
  assert.equal(getFormCompletion('bp-204', { totals: { psTotal: 100 }, formValues: { 'bp-204': { positions: [row] } } }).complete, false);
  const configured = { 'bp-204': { fields: [...getDefaultFormDefinition('bp-204').fields, { key: 'officeConfirmation', label: 'Office confirmation', source: 'user', type: 'text', required: true }] } };
  assert.equal(getFormCompletion('bp-204', { formConfigs: configured, formValues: { 'bp-204': { positions: [row] } } }).complete, false, 'Structured rows must not bypass additional administrator-required fields');
  assert.equal(validateFormConfig(config([], { fields: getDefaultFormDefinition('bp-204').fields, requirement: { mode: 'always', match: 'all', conditions: [] } })).error, undefined);
});

test('BP202 current-year funding rows reconcile against each expenditure class', () => {
  const definition = getDefaultFormDefinition('bp-202');
  const formValues = { 'bp-202': Object.fromEntries(definition.fields.filter((field) => field.required).map((field) => [field.key, field.type === 'select' ? field.options[0] : 'Test'])) };
  formValues['bp-202'].fundingRequirements = [{ pap: 'Project', year: 2027, tier: 'Tier 2', expenseClass: 'FINEX', amount: 30 }];
  const context = { common: { fiscalYear: '2027' }, totals: { finexTotal: 30 }, formValues };
  assert.equal(getFormCompletion('bp-202', context).complete, true);
  context.totals.finexTotal = 40;
  assert.match(getFormCompletion('bp-202', context).errors.map((error) => error.message).join(' '), /reconcile/);
});

test('API authenticates, enforces requester/unit ownership and ignores spoofed status and identity', async (t) => {
  const { request, header, create } = fixture(t);
  assert.equal((await request('POST', 'budget-requests', header, null)).status, 401);
  assert.equal((await request('POST', 'budget-requests', header, 4)).status, 403);
  const draft = await create({ br_status: 'submitted', actor_id: 4, br_id: 999 });
  assert.equal(draft.br_status, 'draft');
  assert.equal(draft.br_id, 1);
  assert.equal(draft.br_created_by_id, 1);
  assert.equal((await request('PUT', 'budget-requests/1', { br_title: 'Stolen' }, 2)).status, 403);
  assert.equal((await request('PUT', 'budget-requests/1', { br_requesting_unit_id: 2 })).status, 403);
  assert.equal((await request('GET', 'budget-requests/1', {}, null)).status, 401);
});

test('API validates items on every write, rejects cross-request IDs, and keeps database totals consistent', async (t) => {
  const { db, request, create, header } = fixture(t);
  assert.equal((await request('POST', 'budget-requests', { ...header, items: [{ ...header.items[0], bri_planned_amount: -1 }] })).status, 422);
  assert.equal((await request('POST', 'budget-requests', { ...header, items: [{ ...header.items[0], bri_category_id: 4 }] })).status, 422);
  await create();
  await create({ br_title: 'Second request' });
  assert.equal((await request('PUT', 'budget-requests/1/items/2', { bri_planned_amount: 1 })).status, 404);
  assert.equal((await request('PUT', 'budget-requests/1', { items: [{ ...header.items[0], bri_id: 2 }] })).status, 422);
  assert.equal((await request('PUT', 'budget-requests/1/items/1', { bri_planned_amount: 'Infinity' })).status, 422);
  await request('POST', 'budget-requests/1/items', { bri_category_id: 5, bri_description: 'Bank expense', bri_planned_amount: 30.05, bri_br_id: 2, bri_id: 900 });
  assert.equal(db.find('budget-requests', 1).br_total_amount, '130.05');
  assert.equal(db.rows('budget-request-items').at(-1).bri_br_id, 1);
  await request('DELETE', 'budget-requests/1/items/1');
  assert.equal(db.find('budget-requests', 1).br_total_amount, '30.05');
});

test('draft saves retain answers, partial rows, custom values, attachments and original TAG records', async (t) => {
  const { db, request, create } = fixture(t);
  const values = { answers: { hasClimate: 'yes' }, formValues: { 'bp-202': { fundingRequirements: [{ year: 2028, amount: '' }] } }, draftLineItems: [{ name: 'Incomplete', amount: '' }] };
  await create({ br_unified_request: values });
  await request('PUT', 'budget-requests/1', { br_unified_request: values });
  const reopened = await request('GET', 'budget-requests/1');
  assert.deepEqual(reopened.data.br_unified_request.formValues, values.formValues);
  assert.deepEqual(reopened.data.br_unified_request.draftLineItems, values.draftLineItems);
  db.upsert('budget-request-items', 1, { id: 1, bri_id: 1, bri_br_id: 1, bri_category_id: 4, bri_description: 'Original TAG', bri_planned_amount: 123 });
  assert.equal((await request('PUT', 'budget-requests/1/items/1', { bri_justification: 'Meaning unresolved' })).status, 200);
  assert.equal(db.find('budget-request-items', 1).bri_category_id, 4);
  assert.equal(db.find('budget-requests', 1).br_total_amount, '123.00');
});

test('default built-in fields and signed copies are enforced independently by the server', async (t) => {
  const { request, create } = fixture(t, ['bp-a']);
  await create();
  const rejected = await request('POST', 'budget-requests/1/submit', { actor_id: 4, requiredForms: [] });
  assert.equal(rejected.status, 422);
  assert.doesNotMatch(rejected.message, /associated performance measure/i);
  assert.match(rejected.message, /signed copy/);
});

test('backend checks question conditions from trusted fiscal-year configuration and supporting uploads', async (t) => {
  const { db, request, create } = fixture(t, ['custom-test']);
  db.upsert('budget-cycles', '2027', { id: '2027', enabled_form_ids: ['custom-test'], custom_forms: [{ id: 'custom-test', code: 'Custom', level: 'request', engine: 'dynamic' }], form_configs: { 'custom-test': config([condition('proposalTier', 'tier2'), condition('hasClimate', 'yes')]) }, supporting_documents: [{ name: 'Plan', required: true }] });
  await create({ br_unified_request: { request: { fundingSource: 'national_government' }, answers: { proposalTier: 'tier2', hasClimate: 'yes' }, formConfigs: {}, requiredForms: [] } });
  const rejected = await request('POST', 'budget-requests/1/submit');
  assert.equal(rejected.status, 422);
  assert.match(rejected.message, /Description/);
  assert.match(rejected.message, /Upload the Plan/);
  await request('PUT', 'budget-requests/1', { br_fiscal_year_id: 2 });
  assert.equal(db.find('budget-requests', 1).br_fiscal_year_id, 2);
  assert.equal(db.find('budget-requests', 1).br_unified_request.formConfigs['custom-test']?.fields, undefined);
});

test('stale signatures cannot be refreshed by forging metadata; submitted versions remain immutable', async (t) => {
  const { db, request, create, sign } = fixture(t, ['bp-a']);
  const draft = await create({ br_unified_request: { request: { fundingSource: 'national_government' }, answers: {}, formValues: { 'bp-a': { performanceMeasure: 'Output 1' } } } });
  const signed = sign(draft, 'bp-a');
  assert.deepEqual(validateConfiguredSubmission(db, signed).errors, []);
  await request('PUT', 'budget-requests/1/items/1', { bri_planned_amount: 200 });
  assert.match((await request('POST', 'budget-requests/1/submit')).message, /content changed/);
  const forged = signed.br_attached_files.map((file) => ({ ...file, formContent: 'forged-current-content' }));
  await request('PUT', 'budget-requests/1', { br_attached_files: forged });
  assert.equal(db.find('budget-requests', 1).br_attached_files[0].formContent, signed.br_attached_files[0].formContent);
  sign(db.find('budget-requests', 1), 'bp-a');
  assert.equal((await request('POST', 'budget-requests/1/submit', { actor_id: 4 })).status, 200);
  const version = db.find('budget-request-versions', 1);
  assert.equal(version.brv_submitted_by_id, 1);
  assert.equal((await request('POST', 'budget-requests/1/submit')).status, 409);
  assert.equal((await request('PUT', 'budget-requests/1', { br_title: 'Changed' })).status, 409);
  assert.equal((await request('DELETE', 'budget-requests/1/items/1')).status, 409);
  assert.equal((await request('POST', 'budget-requests/1/review', { action: 'approve', actor_id: 4 }, 3)).status, 200);
  assert.deepEqual(db.find('budget-request-versions', 1), version);
  assert.equal(db.find('budget-requests', 1).br_reviewed_by_id, 3);
  const frozen = version.brv_snapshot.unifiedRequest.formDefinitions['bp-a'];
  db.upsert('budget-cycles', '2027', { id: '2027', enabled_form_ids: ['bp-a'], form_configs: { 'bp-a': config([]) } });
  assert.deepEqual(getFormDefinition('bp-a', { formDefinitions: version.brv_snapshot.unifiedRequest.formDefinitions }), frozen);
});

test('review and version endpoints do not leak other institutions or accept invalid actions', async (t) => {
  const { db, request, create } = fixture(t);
  await create();
  db.upsert('budget-requests', 1, { ...db.find('budget-requests', 1), br_status: 'submitted' });
  db.upsert('budget-request-versions', 7, { id: 7, brv_br_id: 2 });
  assert.equal((await request('GET', 'budget-requests/1/versions/7')).status, 404);
  assert.equal((await request('POST', 'budget-requests/1/review', { action: 'invalid' }, 3)).status, 422);
  let status;
  await handleBudgetReview({ db, path: '/budget-review', req: { method: 'GET', headers: { authorization: 'Bearer mock-token-uid-1' } }, res: {}, json: (_, value) => { status = value; } });
  assert.equal(status, 403);
});

test('BP207 reuses item typology and requires its QAR annex only while applicable', async (t) => {
  const { db, create, sign } = fixture(t, ['bp-207']);
  const draft = await create({ items: [{ bri_category_id: 2, bri_description: 'Climate activity', bri_planned_amount: 100, bri_climate_amount: 40, bri_climate_typology: 'Office-confirmed code and description', bri_climate_type: 'adaptation' }], br_unified_request: { request: { fundingSource: 'national_government' }, answers: { hasClimate: 'yes' }, formValues: {} } });
  const signed = sign(draft, 'bp-207');
  assert.deepEqual(validateConfiguredSubmission(db, signed).errors, ['Upload the CCC-approved QAR form.']);
  const withAnnex = saveBudgetRequest(db, { br_attached_files: [...signed.br_attached_files, { name: 'Supporting [CCC-approved QAR form] - approval.pdf', docName: 'CCC-approved QAR form', dataUrl: 'data:application/pdf;base64,JVBERi0xCg==' }] }, signed);
  assert.deepEqual(validateConfiguredSubmission(db, withAnnex).errors, []);
  assert.equal(withAnnex.br_total_amount, '100.00');
  const unified = validateConfiguredSubmission(db, withAnnex).unified;
  const view = buildFormView('bp-207', { common: unified.common, totals: unified.totalsAtGeneration, lineItems: unified.lineItems });
  assert.equal(view.fields.find((field) => field.key === 'typology').value, 'Office-confirmed code and description');
  db.upsert('budget-cycles', '2027', { id: '2027', enabled_form_ids: [], form_configs: {}, custom_forms: [], supporting_documents: [] });
  assert.deepEqual(validateConfiguredSubmission(db, { ...withAnnex, br_attached_files: [] }).errors, []);
});

test('API rejects incomplete draft rows and unexplained legacy FinEx amounts at submission', async (t) => {
  const { request, create } = fixture(t);
  await create({ br_unified_request: { request: { fundingSource: 'national_government' }, draftLineItems: [{ category: 'MOOE', name: 'Unfinished', amount: '' }], formValues: { 'bp-201-c': { proposedFinex: 50 } } } });
  const result = await request('POST', 'budget-requests/1/submit');
  assert.equal(result.status, 422);
  assert.match(result.message, /peso amount/);
  assert.match(result.message, /older typed FinEx/);
});

test('consolidation retains FinEx, climate subsets and immutable institution form versions', async (t) => {
  const { db, create } = fixture(t);
  const draft = await create({ items: [{ bri_category_id: 2, bri_description: 'Climate activity', bri_planned_amount: 100, bri_climate_amount: 40, bri_climate_typology: 'Confirmed typology', bri_climate_type: 'adaptation' }, { bri_category_id: 5, bri_description: 'Financial expense', bri_planned_amount: 30 }] });
  db.upsert('budget-requests', 1, { ...draft, br_status: 'reviewed' });
  const version = { id: 1, brv_br_id: 1, brv_version_number: 1, brv_status: 'submitted', brv_snapshot: { overview: { status: 'submitted' }, unifiedRequest: { formDefinitions: { 'bp-a': { fields: [{ key: 'historic', label: 'Historical definition' }] } } } } };
  db.upsert('budget-request-versions', 1, version);
  const items = db.rows('budget-request-items').map((item) => ({ ...financialItemFromStored(item, db.rows('budget-categories')), sourceItemId: item.bri_id, sourceRequestId: 1, requestingUnit: 'Institution A' }));
  const payload = { fiscalYear: '2027', title: 'Consolidated', status: 'pending', actor_id: 4, consolidatedLineItems: [{ sourceRequestId: 1, requestingUnit: 'Institution A', items }], approvalVersions: [{ version: 1, status: 'PENDING', workflow: [] }] };
  let response;
  const call = async (actor, body = payload) => handleUnifiedBudgets({ db, parts: ['unified-budgets'], payload: structuredClone(body), req: { method: 'POST', headers: { authorization: `Bearer mock-token-uid-${actor}` } }, res: {}, json: (_, status, value) => { response = { status, ...value }; } });
  await call(1);
  assert.equal(response.status, 403);
  await call(3);
  assert.equal(response.status, 201);
  assert.equal(response.data.totals.finexTotal, 30);
  assert.equal(response.data.totals.climateTotal, 40);
  assert.equal(response.data.totals.grandTotal, 130);
  assert.deepEqual(db.find('budget-request-versions', 1), version);
  assert.equal(db.find('budget-requests', 1).br_status, 'consolidated');
  assert.equal(response.data.approvalVersions[0].snapshot.sourceRequestForms[0].versionId, 1);
  assert.equal(response.data.approvalVersions[0].snapshot.sourceRequestForms[0].unifiedRequest.formDefinitions['bp-a'].fields[0].label, 'Historical definition');
  const reduced = structuredClone(payload);
  reduced.consolidatedLineItems[0].items[0].amount = 10;
  await call(3, reduced);
  assert.equal(response.status, 422, 'Adjustment cannot silently shrink the original climate attribution');
});

test('SQLite upgrade adds FinEx without changing TAG or historical totals and rolls back failed writes', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'bms-bp-audit-'));
  const sqlitePath = join(directory, 'test.sqlite');
  const seedPath = join(directory, 'seed.json');
  let db;
  try {
    await writeFile(seedPath, '{}');
    const sqlite = new DatabaseSync(sqlitePath);
    sqlite.exec('CREATE TABLE documents (resource TEXT, id TEXT, data TEXT, PRIMARY KEY (resource, id))');
    const insert = sqlite.prepare('INSERT INTO documents VALUES (?, ?, ?)');
    insert.run('budget-categories', '4', JSON.stringify({ id: 4, bcat_id: 4, bcat_code: 'TAG', bcat_name: 'Original TAG' }));
    insert.run('budget-requests', '1', JSON.stringify({ id: 1, br_id: 1, br_total_amount: '987.65' }));
    sqlite.close();
    db = createDocumentDb({ sqlitePath, seedPath, seedScriptPath: 'not-used' });
    assert.equal(db.find('budget-categories', 4).bcat_code, 'TAG');
    assert.equal(db.find('budget-requests', 1).br_total_amount, '987.65');
    assert.equal(db.rows('budget-categories').find((category) => category.bcat_code === 'FINEX').bcat_id, 5);
    assert.throws(() => db.transaction(() => { db.upsert('budget-requests', 1, { id: 1, br_total_amount: 0 }); throw new Error('failed'); }), /failed/);
    assert.equal(db.find('budget-requests', 1).br_total_amount, '987.65');
    db.close(); db = null;
    db = createDocumentDb({ sqlitePath, seedPath, seedScriptPath: 'not-used' });
    assert.equal(db.rows('budget-categories').filter((category) => category.bcat_code === 'FINEX').length, 1);
  } finally {
    db?.close();
    await unlink(sqlitePath).catch(() => {});
    await unlink(seedPath).catch(() => {});
    await rmdir(directory);
  }
});
