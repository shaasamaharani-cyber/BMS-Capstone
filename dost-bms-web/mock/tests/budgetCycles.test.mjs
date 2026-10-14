import assert from 'node:assert/strict';
import test from 'node:test';
import { randomUUID } from 'node:crypto';
import { readFile, unlink } from 'node:fs/promises';
import { handleSettings } from '../server/routes/settings.mjs';
import { BP_FORM_CATALOG, FORM_ENGINE, getCycleFormCatalog } from '../../src/bp_forms/bp_form_catalog.js';
import { evaluateRequiredForms, PROPOSAL_QUESTIONS } from '../../src/bp_forms/bp_form_rules.js';
import { buildTotalsCheck, collectSubmissionIssues } from '../../src/utils/unified_request_checks.js';
import { signedFromAttachedFiles } from '../../src/utils/unified_request_form_attachments.js';
import { buildFormView, getDefaultFormDefinition, getFormCompletion, getFormDefinition, getFormContent } from '../../src/bp_forms/bp_form_fields.js';
import { getDefaultRequirement } from '../../src/bp_forms/bp_form_rules.js';
import { validateFormConfig } from '../../src/bp_forms/bp_form_configuration.js';
import { captureRequestFormConfiguration, validateConfiguredSubmission } from '../server/services/requestFormConfiguration.mjs';
import { saveBudgetRequest } from '../server/services/budgetRequests.mjs';
import { handleBudgetRequests } from '../server/routes/budgetRequests.mjs';
import { createVersionSnapshot } from '../server/services/budgetRequestLifecycle.mjs';

const newForm = (changes = {}) => ({ id: 'custom-208', code: 'BP Form 208', name: 'New Annual Schedule', level: 'request', completedBy: 'Proposing office', ...changes });
const defaultIds = BP_FORM_CATALOG.map((form) => form.id);

function fixture() {
  const resources = new Map(Object.entries({
    users: [{ id: 1, usr_id: 1, usr_name: 'Main Administrator', usr_role_id: 1 }, { id: 2, usr_id: 2, usr_name: 'Requester', usr_role_id: 2, usr_requesting_unit_id: 1 }, { id: 3, usr_id: 3, usr_name: 'Technical Administrator', usr_role_id: 3 }],
    roles: [{ id: 1, role_id: 1, role_group: 'admin', role_name: 'main_administrator' }, { id: 2, role_id: 2, role_group: 'requester' }, { id: 3, role_id: 3, role_group: 'admin', role_name: 'technical_administrator' }],
    'requesting-units': [{ id: 1, ru_id: 1, ru_name: 'Central Office' }],
    'budget-categories': [{ id: 1, bcat_id: 1, bcat_code: 'MOOE' }],
    'fiscal-years': [{ id: 1, fy_id: 1, fy_year: '2027', fy_is_active: 1 }, { id: 2, fy_id: 2, fy_year: '2028', fy_is_active: 1 }, { id: 3, fy_id: 3, fy_year: '2026', fy_is_active: 0 }],
  }));
  const db = {
    rows: (resource) => structuredClone(resources.get(resource) || []),
    find: (resource, id) => structuredClone((resources.get(resource) || []).find((row) => String(row.id) === String(id)) || null),
    nextId: (resource) => Math.max(0, ...db.rows(resource).map((row) => Number(row.id))) + 1,
    remove: (resource, id) => resources.set(resource, db.rows(resource).filter((row) => String(row.id) !== String(id))),
    upsert: (resource, id, value) => resources.set(resource, [...db.rows(resource).filter((row) => String(row.id) !== String(id)), structuredClone(value)]),
  };
  async function request(method, path, payload = {}, actorId = 1) {
    let response;
    const handled = await handleSettings({ db, parts: path.split('/'), payload, req: { method, headers: actorId ? { authorization: `Bearer mock-token-uid-${actorId}` } : {} }, res: {}, json: (_, status, body) => { response = { status, ...body }; } });
    assert.equal(handled, true);
    return response;
  }
  return { db, request };
}

test('cycles include open and closed years with compatible built-in defaults', async () => {
  const { request } = fixture();
  const response = await request('GET', 'budget-cycles');
  assert.equal(response.status, 200);
  assert.deepEqual(response.data.map((cycle) => cycle.fy_year), ['2028', '2027', '2026']);
  assert.equal(response.data[2].fy_is_active, false);
  assert.deepEqual(response.data[0].enabled_form_ids, defaultIds);
  assert.deepEqual(response.data[0].custom_forms, []);
});

test('main admin adds, edits and toggles a custom form in one year without changing other years', async () => {
  const { request, db } = fixture();
  const saved = await request('PUT', 'budget-cycles/2027', { custom_forms: [newForm()], enabled_form_ids: ['bp-a', 'custom-208'], supporting_documents: [{ name: 'Project plan', required: true }] });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.custom_forms[0].engine, FORM_ENGINE.MANUAL);
  assert.equal(saved.data.updated_by, 'Main Administrator');
  const other = await request('GET', 'budget-cycles/2028');
  assert.deepEqual(other.data.custom_forms, []);
  assert.deepEqual(other.data.enabled_form_ids, defaultIds);
  const edited = await request('PUT', 'budget-cycles/2027', { custom_forms: [newForm({ name: 'Updated schedule' })], enabled_form_ids: ['bp-a'] });
  assert.equal(edited.status, 200);
  assert.equal(edited.data.custom_forms[0].name, 'Updated schedule');
  assert.deepEqual(edited.data.enabled_form_ids, ['bp-a']);
  assert.match(db.rows('admin-change-logs').at(-1).acl_details, /BP Form 208/);
  const enabled = await request('PUT', 'budget-cycles/2027', { enabled_form_ids: ['custom-208'] });
  assert.equal(enabled.status, 200);
  assert.equal(enabled.data.custom_forms[0].name, 'Updated schedule');
});

test('all forms can be disabled and the empty selection persists', async () => {
  const { request } = fixture();
  assert.equal((await request('PUT', 'budget-cycles/2027', { enabled_form_ids: [] })).status, 200);
  assert.deepEqual((await request('GET', 'budget-cycles/2027')).data.enabled_form_ids, []);
});

test('custom form IDs from another fiscal year cannot be enabled', async () => {
  const { request } = fixture();
  await request('PUT', 'budget-cycles/2027', { custom_forms: [newForm()], enabled_form_ids: ['custom-208'] });
  assert.equal((await request('PUT', 'budget-cycles/2028', { enabled_form_ids: ['custom-208'] })).status, 422);
});

test('invalid custom definitions, duplicate codes and malformed selections are rejected without writing a cycle', async () => {
  const cases = [
    { custom_forms: [newForm({ code: 'bp form a' })], enabled_form_ids: [] },
    { custom_forms: [newForm(), newForm({ id: 'custom-209' })], enabled_form_ids: [] },
    { custom_forms: [newForm({ id: 'bp-a' })], enabled_form_ids: [] },
    { custom_forms: [newForm({ level: 'invalid' })], enabled_form_ids: [] },
    { custom_forms: [newForm({ name: ' ' })], enabled_form_ids: [] },
    { custom_forms: [newForm({ completedBy: '' })], enabled_form_ids: [] },
    { custom_forms: {} , enabled_form_ids: [] },
    { enabled_form_ids: 'bp-a' },
    { enabled_form_ids: ['unknown'] },
  ];
  for (const payload of cases) {
    const { request, db } = fixture();
    assert.equal((await request('PUT', 'budget-cycles/2027', payload)).status, 422);
    assert.equal(db.rows('budget-cycles').length, 0);
    assert.equal(db.rows('admin-change-logs').length, 0);
  }
});

test('cycle changes require an administrator while requesters can read definitions', async () => {
  const { request } = fixture();
  assert.equal((await request('PUT', 'budget-cycles/2027', { enabled_form_ids: [] }, 2)).status, 403);
  assert.equal((await request('PUT', 'budget-cycles/2027', { enabled_form_ids: [] }, null)).status, 401);
  assert.equal((await request('GET', 'budget-cycles/2027', {}, 2)).status, 200);
  assert.equal((await request('PUT', 'budget-cycles/2027', { enabled_form_ids: [] }, 3)).status, 200);
});

test('fiscal years can be added then configured, and unknown years are rejected', async () => {
  const { request } = fixture();
  assert.equal((await request('POST', 'fiscal-years', { fy_year: 2029 })).status, 201);
  assert.equal((await request('PUT', 'budget-cycles/2029', { enabled_form_ids: [], custom_forms: [newForm()] })).status, 200);
  assert.equal((await request('GET', 'budget-cycles/2099')).status, 404);
  assert.equal((await request('PUT', 'budget-cycles/2099', { enabled_form_ids: [] })).status, 404);
});

test('closed years remain readable but reject new BP forms and availability changes', async () => {
  const { request, db } = fixture();
  const closed = await request('GET', 'budget-cycles/2026');
  assert.equal(closed.status, 200);
  assert.equal(closed.data.fy_is_active, false);
  const response = await request('PUT', 'budget-cycles/2026', { enabled_form_ids: ['custom-208'], custom_forms: [newForm()] });
  assert.equal(response.status, 422);
  assert.match(response.message, /closed/);
  assert.equal((await request('PUT', 'budget-cycles/2026', { enabled_form_ids: [] })).status, 422);
  assert.equal(db.rows('budget-cycles').length, 0);
  assert.equal(db.rows('admin-change-logs').length, 0);
  assert.equal((await request('PUT', 'fiscal-years/3', { fy_is_active: 1 })).status, 200);
  assert.equal((await request('PUT', 'budget-cycles/2026', { enabled_form_ids: ['custom-208'], custom_forms: [newForm()] })).status, 200);
});

test('enabled new forms appear in wizard requirements and disabled forms are skipped', () => {
  const enabled = evaluateRequiredForms({}, {}, { fiscalYearLabel: '2027' }, ['custom-208'], {}, [newForm()]);
  assert.deepEqual(enabled.arrRequired.map((form) => form.formId), ['custom-208']);
  assert.match(enabled.arrRequired[0].reasons[0], /2027/);
  const disabled = evaluateRequiredForms({}, {}, {}, [], {}, [newForm()]);
  assert.deepEqual(disabled.arrRequired, []);
  assert.ok(disabled.arrNotInCycle.some((form) => form.formId === 'custom-208'));
});

test('disabled category forms do not block submission but missing enabled category forms still do', () => {
  const disabled = buildTotalsCheck({ mooeTotal: 100 }, null, [], []);
  assert.equal(disabled.find((row) => row.category === 'MOOE').status, 'disabled');
  const enabled = buildTotalsCheck({ mooeTotal: 100 }, null, [], ['bp-201-b']);
  assert.equal(enabled.find((row) => row.category === 'MOOE').status, 'no_form');
});

function submission(changes = {}) {
  return collectSubmissionIssues({
    arrCatalog: getCycleFormCatalog({ custom_forms: [{ ...newForm(), engine: FORM_ENGINE.MANUAL }] }),
    objRequest: { title: 'Proposal', unitId: 1, fiscalYearId: 1, fundingSource: 'national_government' },
    arrLineItems: [{ name: 'Supplies', category: 'MOOE', amount: 100 }],
    objAnswers: Object.fromEntries(PROPOSAL_QUESTIONS.map((question) => [question.key, 'no'])),
    arrRequired: [{ formId: 'custom-208' }],
    objSigned: {}, objTotalsCheck: [], ...changes, objContext: { ...changes.objContext, formValues: changes.objContext?.formValues || {}, enabledFormIds: ['custom-208'] },
  });
}

test('manual request forms require completion and signed uploads; agency forms do not block requesters', () => {
  assert.deepEqual(submission().map((issue) => issue.id), ['form-custom-208', 'signed-custom-208']);
  assert.deepEqual(submission({ objContext: { formValues: { 'custom-208': { __done: true } } }, objSigned: { 'custom-208': { name: 'signed.pdf', formContent: getFormContent('custom-208', { formValues: { 'custom-208': { __done: true } } }) } } }), []);
  assert.deepEqual(submission({ arrCatalog: getCycleFormCatalog({ custom_forms: [newForm({ level: 'agency', engine: FORM_ENGINE.MANUAL })] }) }), []);
});

test('saved signed copies for custom forms reopen by stable ID even after the form code changes', () => {
  const attachment = { id: 'file-1', formId: 'custom-208', name: 'Signed - BP Form 208 - signed.pdf', url: '/generated/signed.pdf', size: 100 };
  const catalog = getCycleFormCatalog({ custom_forms: [newForm({ code: 'BP Form 208-A' })] });
  assert.equal(signedFromAttachedFiles([attachment], catalog)['custom-208'].name, 'signed.pdf');
  assert.equal(signedFromAttachedFiles([attachment], catalog)['custom-208'].url, attachment.url);
  const legacy = { ...attachment, formId: undefined, name: 'Signed - BP Form A - legacy.pdf' };
  assert.equal(signedFromAttachedFiles([legacy])['bp-a'].name, 'legacy.pdf');
});

const textField = (changes = {}) => ({ key: 'projectName', label: 'Project name', source: 'user', type: 'text', required: true, ...changes });
const tierCondition = (changes = {}) => ({ id: 'tier', field: 'proposalTier', operator: 'equals', value: 'tier2', enabled: true, ...changes });
const formConfig = (changes = {}) => ({ level: 'request', fields: [textField()], requirement: { mode: 'conditional', match: 'any', enabled: true, allowOverride: false, conditions: [tierCondition()] }, ...changes });

test('existing and new form fields and requirements are saved for the chosen year only', async () => {
  const { request } = fixture();
  const saved = await request('PUT', 'budget-cycles/2027', { custom_forms: [newForm()], enabled_form_ids: ['bp-a', 'custom-208'], form_configs: { 'bp-a': formConfig({ requirement: getDefaultRequirement('bp-a') }), 'custom-208': formConfig() } });
  assert.equal(saved.status, 200);
  assert.equal(saved.data.form_configs['bp-a'].fields[0].label, 'Project name');
  assert.equal(getCycleFormCatalog(saved.data).find((form) => form.id === 'custom-208').engine, FORM_ENGINE.DYNAMIC);
  assert.deepEqual((await request('GET', 'budget-cycles/2028')).data.form_configs, {});
  const toggled = await request('PUT', 'budget-cycles/2027', { enabled_form_ids: [] });
  assert.deepEqual(toggled.data.form_configs, saved.data.form_configs);
});

test('invalid field definitions and condition configuration are rejected before saving', async () => {
  const invalid = [
    formConfig({ fields: [] }), formConfig({ fields: [textField(), textField()] }),
    formConfig({ fields: [textField({ key: 'constructor' })] }), formConfig({ fields: [textField({ label: ' ' })] }),
    formConfig({ fields: [textField({ type: 'script' })] }), formConfig({ fields: [textField({ source: 'computed', formula: 'evil()' })] }),
    formConfig({ fields: [textField({ source: 'canonical', canonical: 'unknown' })] }),
    formConfig({ fields: [textField({ source: 'derived', derived: 'unknown' })] }),
    formConfig({ fields: [textField({ type: 'select', options: [] })] }),
    formConfig({ fields: [textField({ type: 'select', options: ['Yes', 'Yes'] })] }),
    formConfig({ requirement: { mode: 'conditional', match: 'any', conditions: [] } }),
    formConfig({ requirement: { mode: 'conditional', match: 'any', conditions: [tierCondition({ field: 'not_real' })] } }),
    formConfig({ requirement: { mode: 'conditional', match: 'any', conditions: [tierCondition({ operator: 'execute' })] } }),
    formConfig({ requirement: { mode: 'conditional', match: 'any', conditions: [tierCondition({ value: 'tier3' })] } }),
    formConfig({ requirement: { mode: 'conditional', match: 'all', conditions: [tierCondition({ field: 'psTotal', operator: 'gt', value: [] })] } }),
  ];
  const { request, db } = fixture();
  for (const config of invalid) {
    assert.ok(validateFormConfig(config).error);
    assert.equal((await request('PUT', 'budget-cycles/2027', { enabled_form_ids: ['bp-a'], form_configs: { 'bp-a': config } })).status, 422);
  }
  assert.equal((await request('PUT', 'budget-cycles/2027', { enabled_form_ids: [], form_configs: { 'custom-other-year': formConfig() } })).status, 422);
  assert.equal(db.rows('budget-cycles').length, 0);
});

test('Tier 1 and Tier 2 requirements replace built-in rules and support all, any and paused conditions', () => {
  const configs = { 'bp-202': formConfig({ requirement: { mode: 'conditional', match: 'all', enabled: true, conditions: [tierCondition({ value: 'tier1' }), tierCondition({ id: 'amount', field: 'mooeTotal', operator: 'gte', value: 100 })] } }) };
  const evaluate = (tier, amount) => evaluateRequiredForms({ proposalTier: tier }, { mooeTotal: amount }, {}, ['bp-202'], {}, [], configs).arrRequired.map((row) => row.formId);
  assert.deepEqual(evaluate('tier1', 100), ['bp-202']);
  assert.deepEqual(evaluate('tier1', 99), []);
  assert.deepEqual(evaluate('tier2', 100), [], 'Original Tier 2 rule must be replaced');
  configs['bp-202'].requirement.match = 'any';
  assert.deepEqual(evaluate('tier1', 0), ['bp-202']);
  configs['bp-202'].requirement.conditions[0].enabled = false;
  assert.deepEqual(evaluate('tier1', 0), []);
  configs['bp-202'].requirement.enabled = false;
  assert.deepEqual(evaluate('tier1', 100), []);
});

test('conditional new forms follow tier changes and optional forms can still be added with a reason', () => {
  const configs = { 'custom-208': formConfig() };
  const evaluate = (tier, overrides = {}) => evaluateRequiredForms({ proposalTier: tier }, {}, {}, ['custom-208'], overrides, [newForm()], configs);
  assert.deepEqual(evaluate('tier1').arrRequired, []);
  assert.equal(evaluate('tier2').arrRequired[0].formId, 'custom-208');
  assert.equal(evaluate('tier2', { 'custom-208': { action: 'remove', reason: 'Handled by partner' } }).arrRequired.length, 1, 'Administrator-mandated form cannot be removed by default');
  configs['custom-208'].requirement.allowOverride = true;
  assert.deepEqual(evaluate('tier2', { 'custom-208': { action: 'remove', reason: 'Handled by partner' } }).arrRequired, []);
  configs['custom-208'].requirement.mode = 'optional';
  assert.deepEqual(evaluate('tier2').arrRequired, []);
  assert.equal(evaluate('tier1', { 'custom-208': { action: 'add', reason: 'Additional documentation' } }).arrRequired[0].origin, 'override');
});

test('conditions support foreign funding and numeric amounts without selecting forms for unanswered questions', () => {
  const config = formConfig({ requirement: { mode: 'conditional', enabled: true, match: 'all', conditions: [tierCondition({ field: 'fundingSource', value: 'foreign' }), tierCondition({ id: 'tier-not', operator: 'not_equals', value: 'tier1' })] } });
  const evaluate = (answers, fundingSource) => evaluateRequiredForms(answers, {}, { fundingSource }, ['custom-208'], {}, [newForm()], { 'custom-208': config }).arrRequired;
  assert.equal(evaluate({ proposalTier: 'tier2' }, 'foreign_loan').length, 1);
  assert.equal(evaluate({ proposalTier: 'tier2' }, 'foreign_grant').length, 1);
  assert.equal(evaluate({}, 'foreign_grant').length, 0);
  assert.equal(evaluate({ proposalTier: 'tier2' }, 'national_government').length, 0);
});

test('configured fields render requester input and automatic values without changing other years', () => {
  const config = formConfig({ fields: [textField(), textField({ key: 'agency', label: 'Agency', source: 'canonical', canonical: 'agency' }), textField({ key: 'total', label: 'Total', source: 'derived', derived: 'mooeTotal', type: 'number' })] });
  const context = { common: { agency: 'Central Office' }, totals: { mooeTotal: 500 }, lineItems: [], formValues: { 'custom-208': { projectName: 'Research' } }, formConfigs: { 'custom-208': config } };
  const view = buildFormView('custom-208', context);
  assert.deepEqual(view.fields.map((field) => field.value), ['Research', 'Central Office', 500]);
  assert.deepEqual(view.fields.map((field) => field.locked), [false, true, true]);
  assert.equal(getFormCompletion('custom-208', context).complete, true);
  assert.equal(buildFormView('custom-208', { ...context, formConfigs: {} }), null);
  const before = structuredClone(getDefaultFormDefinition('bp-a'));
  buildFormView('bp-a', { ...context, formConfigs: { 'bp-a': config } });
  assert.deepEqual(getDefaultFormDefinition('bp-a'), before);
  assert.ok(getDefaultFormDefinition('bp-100').fields.some((field) => field.label.includes('Revenue')));
});

test('completion enforces number, dropdown, date and checkbox fields while accepting zero', () => {
  const config = formConfig({ fields: [textField({ key: 'amount', type: 'number' }), textField({ key: 'choice', type: 'select', options: ['One', 'Two'] }), textField({ key: 'date', type: 'date' }), textField({ key: 'confirmed', type: 'checkbox' }), textField({ key: 'optionalAmount', type: 'number', required: false })] });
  const context = { formConfigs: { 'custom-208': config }, formValues: { 'custom-208': { amount: 0, choice: 'One', date: '2028-02-29', confirmed: true } } };
  assert.equal(getFormCompletion('custom-208', context).complete, true);
  Object.assign(context.formValues['custom-208'], { amount: 'NaN', choice: 'Invalid', date: '2027-02-29', confirmed: false, optionalAmount: 'invalid' });
  assert.equal(getFormCompletion('custom-208', context).errors.length, 5);
});

test('a category form intentionally excluded by conditions does not force a requester to add it', () => {
  const result = evaluateRequiredForms({ proposalTier: 'tier1' }, { mooeTotal: 100 }, {}, ['bp-201-b'], {}, [], { 'bp-201-b': formConfig() });
  const checks = buildTotalsCheck({ mooeTotal: 100 }, null, result.arrRequired.map((row) => row.formId), ['bp-201-b'], result.arrApplicableFormIds);
  assert.equal(checks.find((row) => row.category === 'MOOE').status, 'not_required');
});

test('server captures trusted definitions, retains filled draft values, and validates requirements on submission', async () => {
  const { request, db } = fixture();
  const config = formConfig();
  await request('PUT', 'budget-cycles/2027', { custom_forms: [newForm()], enabled_form_ids: ['custom-208'], form_configs: { 'custom-208': config } });
  const unified = { answers: { proposalTier: 'tier2' }, request: { fundingSource: 'national_government' }, formConfigs: { 'custom-208': formConfig({ fields: [] }) }, formValues: { 'custom-208': { projectName: 'Saved research proposal' } }, requiredForms: [] };
  const captured = captureRequestFormConfiguration(db, unified, 1);
  assert.deepEqual(captured.formConfigs['custom-208'], config);
  const draft = saveBudgetRequest(db, { br_fiscal_year_id: 1, br_requesting_unit_id: 1, br_title: 'Draft', br_unified_request: unified, br_attached_files: [], items: [{ bri_category_id: 1, bri_description: 'Supplies', bri_planned_amount: 100 }] });
  assert.equal(draft.br_unified_request.formValues['custom-208'].projectName, 'Saved research proposal');
  assert.deepEqual(draft.br_unified_request.formConfigs['custom-208'], config);
  assert.match(validateConfiguredSubmission(db, draft).errors.join(' '), /signed copy/);
  const context = { common: {}, totals: {}, lineItems: [], formConfigs: captured.formConfigs, formValues: unified.formValues };
  const complete = saveBudgetRequest(db, { br_attached_files: [{ formId: 'custom-208', name: 'Signed - BP Form 208 - scan.pdf', dataUrl: 'data:application/pdf;base64,JVBERi0xCg==', formDefinition: JSON.stringify(getFormDefinition('custom-208', context)), formContent: getFormContent('custom-208', context) }] }, draft);
  assert.deepEqual(validateConfiguredSubmission(db, complete).errors, []);
  const incomplete = { ...complete, br_unified_request: { ...complete.br_unified_request, formValues: {}, formConfigs: {} } };
  assert.match(validateConfiguredSubmission(db, incomplete).errors.join(' '), /Project name/);
  incomplete.br_unified_request.answers.proposalTier = 'tier1';
  assert.deepEqual(validateConfiguredSubmission(db, incomplete).errors, []);
});

test('submit endpoint rejects missing configured fields even if a client claims no forms are required', async () => {
  const { request, db } = fixture();
  await request('PUT', 'budget-cycles/2027', { enabled_form_ids: ['bp-a'], form_configs: { 'bp-a': formConfig({ requirement: { mode: 'always', enabled: true, match: 'any', conditions: [] } }) } });
  db.upsert('budget-requests', 1, { id: 1, br_id: 1, br_fiscal_year_id: 1, br_status: 'draft', br_requesting_unit_id: 1, br_unified_request: { requiredForms: [], formValues: {}, formConfigs: {} } });
  let response;
  await handleBudgetRequests({ db, parts: ['budget-requests', '1', 'submit'], payload: {}, req: { method: 'POST', headers: { authorization: 'Bearer mock-token-uid-2' } }, res: {}, json: (_, status, body) => { response = { status, ...body }; } });
  assert.equal(response.status, 422);
  assert.match(response.message, /Project name/);
  assert.equal(db.find('budget-requests', 1).br_status, 'draft');
});

test('submission cannot bypass conditions by omitting proposal answers or supplying forged totals', async () => {
  const { request, db } = fixture();
  const config = formConfig({ requirement: { mode: 'conditional', enabled: true, match: 'all', conditions: [tierCondition(), tierCondition({ id: 'amount', field: 'mooeTotal', operator: 'gte', value: 100 })] } });
  await request('PUT', 'budget-cycles/2027', { custom_forms: [newForm()], enabled_form_ids: ['custom-208'], form_configs: { 'custom-208': config } });
  const draft = { id: 1, br_id: 1, br_fiscal_year_id: 1, br_unified_request: { answers: {}, formValues: {}, totalsAtGeneration: { mooeTotal: 0 } } };
  assert.match(validateConfiguredSubmission(db, draft).errors.join(' '), /budget tier/);
  draft.br_unified_request.answers.proposalTier = 'tier2';
  db.upsert('budget-categories', 1, { id: 1, bcat_id: 1, bcat_code: 'MOOE' });
  db.upsert('budget-request-items', 1, { id: 1, bri_br_id: 1, bri_category_id: 1, bri_planned_amount: 100 });
  assert.match(validateConfiguredSubmission(db, draft).errors.join(' '), /Project name/);
  assert.match(validateConfiguredSubmission(db, draft).errors.join(' '), /signed copy/);
});

test('field changes invalidate an earlier signed copy while saved definitions remain unchanged', async () => {
  const { request, db } = fixture();
  const original = formConfig();
  await request('PUT', 'budget-cycles/2027', { custom_forms: [newForm()], enabled_form_ids: ['custom-208'], form_configs: { 'custom-208': original } });
  const captured = captureRequestFormConfiguration(db, { answers: { proposalTier: 'tier2' }, request: { fundingSource: 'national_government' }, formValues: { 'custom-208': { projectName: 'Proposal' } } }, 1);
  const oldDefinition = JSON.stringify(getFormDefinition('custom-208', { formConfigs: captured.formConfigs }));
  const content = getFormContent('custom-208', { common: {}, totals: {}, lineItems: [], formConfigs: captured.formConfigs, formValues: captured.formValues });
  const draft = saveBudgetRequest(db, { br_fiscal_year_id: 1, br_requesting_unit_id: 1, br_title: 'Proposal', br_unified_request: captured, items: [{ bri_category_id: 1, bri_description: 'Supplies', bri_planned_amount: 100 }], br_attached_files: [{ formId: 'custom-208', name: 'Signed - BP Form 208 - scan.pdf', dataUrl: 'data:application/pdf;base64,JVBERi0xCg==', formDefinition: oldDefinition, formContent: content }] });
  assert.deepEqual(validateConfiguredSubmission(db, draft).errors, []);
  await request('PUT', 'budget-cycles/2027', { enabled_form_ids: ['custom-208'], form_configs: { 'custom-208': formConfig({ fields: [textField({ label: 'Updated project name' })] }) } });
  assert.match(validateConfiguredSubmission(db, draft).errors.join(' '), /fields changed/);
  assert.equal(captured.formConfigs['custom-208'].fields[0].label, 'Project name');
});

test('submitted versions retain configured fields and filled answers and generate a PDF snapshot', async () => {
  const { request, db } = fixture();
  await request('PUT', 'budget-cycles/2027', { custom_forms: [newForm()], enabled_form_ids: ['custom-208'], form_configs: { 'custom-208': formConfig() } });
  const unified = captureRequestFormConfiguration(db, {
    common: { agency: 'Central Office', fiscalYear: '2027' },
    requiredForms: [{ formId: 'custom-208', reasons: ['Tier 2'] }],
    formValues: { 'custom-208': { projectName: 'Completed research proposal' } },
  }, 1);
  const version = await createVersionSnapshot(db, { id: 1, br_id: 1, br_reference_no: `TEST-CONFIG-${randomUUID()}`, br_title: 'Configured submission', br_fiscal_year_id: 1, br_unified_request: unified }, 1, null);
  try {
    assert.equal(version.brv_snapshot.unifiedRequest.formValues['custom-208'].projectName, 'Completed research proposal');
    assert.equal((await readFile(version.brv_pdf_path)).subarray(0, 5).toString(), '%PDF-');
    await request('PUT', 'budget-cycles/2027', { enabled_form_ids: ['custom-208'], form_configs: { 'custom-208': formConfig({ fields: [textField({ label: 'Changed later' })] }) } });
    assert.equal(db.find('budget-request-versions', 1).brv_snapshot.unifiedRequest.formConfigs['custom-208'].fields[0].label, 'Project name');
  } finally {
    await unlink(version.brv_pdf_path);
  }
});
