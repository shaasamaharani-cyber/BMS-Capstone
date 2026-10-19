import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { mkdtemp, writeFile, unlink, readdir, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createDocumentDb } from '../server/db.mjs';
import { handleAuth } from '../server/routes/auth.mjs';
import { handleBudgetRequests } from '../server/routes/budgetRequests.mjs';
import { handleBudgetReview } from '../server/routes/budgetReview.mjs';
import { handleUnifiedBudgets } from '../server/routes/unifiedBudgets.mjs';
import { handleForms } from '../server/routes/forms.mjs';
import { handleDashboard } from '../server/routes/dashboard.mjs';
import { json, paginate, readJsonBody } from '../server/http.mjs';
import { validateConfiguredSubmission } from '../server/services/requestFormConfiguration.mjs';
import { getFormDefinition, getFormContent } from '../../src/bp_forms/bp_form_fields.js';
import { financialItemFromStored } from '../../src/utils/budget_financials.js';

// Real HTTP + SQLite, separate logins and a new temporary database. No shared
// mock.sqlite, seed reset, external API or user records are touched.
async function fixture(t) {
  const directory = await mkdtemp(join(tmpdir(), 'bms-submission-'));
  const sqlitePath = join(directory, 'test.sqlite');
  const seedPath = join(directory, 'seed.json');
  const sql = new DatabaseSync(sqlitePath);
  sql.exec('CREATE TABLE documents (resource TEXT, id TEXT, data TEXT, PRIMARY KEY (resource, id))');
  sql.close();
  const roles = ['requester', 'reviewer', 'executive', 'admin'].map((role_group, i) => ({ id: i + 1, role_id: i + 1, role_group, role_name: role_group }));
  const seed = { roles, users: [
    [1, 1, 1, 'requester'], [2, 1, 2, 'other'], [3, 2, null, 'division'], [4, 3, null, 'finance'], [5, 3, null, 'planning'], [6, 4, null, 'admin'],
  ].map(([id, role, unit, name]) => ({ id, usr_id: id, usr_role_id: role, usr_requesting_unit_id: unit, usr_name: name, usr_email: `${name}@fixture.test`, usr_is_active: 1 })),
  'requesting-units': [{ id: 1, ru_id: 1, ru_name: 'Fixture unit' }, { id: 2, ru_id: 2, ru_name: 'Other unit' }],
  'fiscal-years': [{ id: 1, fy_id: 1, fy_year: '2027', fy_is_active: 1 }, { id: 2, fy_id: 2, fy_year: '2028', fy_is_active: 1 }],
  'budget-categories': ['PS', 'MOOE', 'FINEX', 'CO'].map((code, i) => ({ id: i + 1, bcat_id: i + 1, bcat_code: code })),
  'budget-cycles': [{ id: '2027', enabled_form_ids: ['bp-a', 'bp-b'], custom_forms: [], form_configs: { 'bp-b': { level: 'request', requirement: { mode: 'always', match: 'any', conditions: [] } } }, supporting_documents: [{ name: 'Project evidence', required: true }] }],
  'form_entries': [{ id: 'institutional', name: 'Institution record', amount: 100 }],
  };
  await writeFile(seedPath, JSON.stringify(seed));
  let db = createDocumentDb({ sqlitePath, seedPath });
  const generated = new Set();
  const routes = [handleAuth, handleBudgetRequests, handleBudgetReview, handleUnifiedBudgets, handleForms, handleDashboard];
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://test');
    const path = url.pathname;
    const payload = await readJsonBody(req);
    try {
      for (const route of routes) if (await route({ db, req, res, json, paginate, payload, path, parts: path.split('/').filter(Boolean), url })) return;
      json(res, 404, { message: 'Not found' });
    } catch (error) { json(res, error.status || 500, { message: error.message }); }
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const call = async (method, path, payload, token) => {
    const response = await fetch(origin + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }) });
    return { status: response.status, ...await response.json() };
  };
  const tokens = {};
  for (const name of ['requester', 'other', 'division', 'finance', 'planning', 'admin']) {
    const login = await call('POST', '/auth/login', { email: `${name}@fixture.test`, password: 'mock-only' });
    assert.equal(login.status, 200); tokens[name] = login.token;
  }
  const rememberFiles = () => {
    for (const version of db.rows('budget-request-versions')) if (version.brv_pdf_path) generated.add(version.brv_pdf_path);
    for (const version of db.rows('unified-budget-versions')) if (version.ubv_payload?.pdfPath) generated.add(version.ubv_payload.pdfPath);
    for (const request of db.rows('budget-requests')) for (const file of request.br_attached_files || []) if (file.url) generated.add(resolve('mock/generated/attachments', file.url.split('/').at(-1)));
  };
  t.after(async () => {
    rememberFiles();
    await new Promise((done) => server.close(done)); db.close();
    for (const file of generated) await unlink(file).catch(() => {});
    for (const file of await readdir(directory)) await unlink(join(directory, file));
    await rmdir(directory);
  });
  const reopen = () => { rememberFiles(); db.close(); db = createDocumentDb({ sqlitePath, seedPath }); };
  const send = (role, method, path, payload) => call(method, path, payload, tokens[role]);
  const create = async () => {
    const response = await send('requester', 'POST', '/budget-requests', { br_title: 'Isolated research budget', br_fiscal_year_id: 1, br_requesting_unit_id: 1,
      br_unified_request: { request: { fundingSource: 'national_government' }, answers: {}, formValues: {
        'bp-a': { preparedBy: 'Fixture preparer', programHistory: [{ period: 'Proposed program', pap: 'Science', ps: 100, mooe: 200, finex: 0, co: 0 }] },
        'bp-b': { performance: [{ outcome: 'Science services', indicator: 'Projects delivered', proposedTier1: '5' }] },
      } }, items: [{ bri_category_id: 1, bri_description: 'Staff', bri_planned_amount: 100 }, { bri_category_id: 2, bri_description: 'Supplies', bri_planned_amount: 200 }] });
    assert.equal(response.status, 201, response.message); return response.data;
  };
  const attach = async (id) => {
    const record = db.find('budget-requests', id);
    const u = validateConfiguredSubmission(db, record).unified;
    const context = { common: u.common, answers: u.answers, totals: u.totalsAtGeneration, lineItems: u.lineItems, formValues: u.formValues, formConfigs: u.formConfigs, formDefinitions: u.formDefinitions };
    const files = ['bp-a', 'bp-b'].map((formId) => ({ id: `signed-${id}-${formId}`, formId, name: `Signed ${formId}.pdf`, type: 'application/pdf', dataUrl: 'data:application/pdf;base64,JVBERi0xCg==', formDefinition: JSON.stringify(getFormDefinition(formId, context)), formContent: getFormContent(formId, context) }));
    files.push({ id: `evidence-${id}`, docName: 'Project evidence', name: 'Evidence.pdf', type: 'application/pdf', dataUrl: 'data:application/pdf;base64,JVBERi0xCg==' });
    const saved = await send('requester', 'PUT', `/budget-requests/${id}`, { br_attached_files: files });
    assert.equal(saved.status, 200, saved.message); rememberFiles();
  };
  const sections = (id) => [{ sourceRequestId: id, requestingUnit: 'Fixture unit', items: db.rows('budget-request-items').filter((item) => Number(item.bri_br_id) === id).map((item) => ({ ...financialItemFromStored(item, db.rows('budget-categories')), sourceItemId: item.bri_id, sourceRequestId: id })) }];
  return { send, call, create, attach, sections, reopen, get db() { return db; } };
}

test('HTTP/SQLite workflow preserves forms, signed files, remarks and original amounts through two return/resubmit cycles and DBM handoff', async (t) => {
  const f = await fixture(t);
  const created = await f.create(); const id = created.br_id;
  assert.equal((await f.send('requester', 'POST', `/budget-requests/${id}/submit`, {})).status, 422, 'Signed forms and evidence required');
  await f.attach(id);
  assert.equal((await f.send('requester', 'POST', `/budget-requests/${id}/submit`, {})).status, 200);
  const originalVersion = structuredClone(f.db.rows('budget-request-versions')[0]);
  assert.equal((await f.send('division', 'POST', `/budget-requests/${id}/review`, { action: 'return' })).status, 422);
  assert.equal((await f.send('division', 'POST', `/budget-requests/${id}/review`, { action: 'return', comment: 'Clarify the project scope' })).status, 200);
  f.reopen();
  const returned = (await f.send('requester', 'GET', `/budget-requests/${id}`)).data;
  assert.equal(returned.br_review_comment, 'Clarify the project scope');
  assert.equal(returned.br_attached_files.length, 3);
  assert.equal((await f.send('requester', 'PUT', `/budget-requests/${id}`, { br_description: 'Clarified scope' })).status, 200);
  await f.attach(id);
  assert.equal((await f.send('requester', 'POST', `/budget-requests/${id}/submit`, {})).status, 200);
  assert.equal(f.db.rows('budget-request-versions').length, 2);
  assert.deepEqual(f.db.rows('budget-request-versions')[0], originalVersion);
  assert.equal((await f.send('division', 'POST', `/budget-requests/${id}/review`, { action: 'validate', comment: 'Validated' })).data.br_status, 'reviewed');
  const source = structuredClone(f.db.rows('budget-request-versions')[1]);
  const sections = f.sections(id); sections[0].items[0].amount = 90;
  const consolidated = await f.send('division', 'POST', '/unified-budgets', { title: 'Consolidated fixture', fiscalYear: '2027', status: 'pending', consolidatedLineItems: sections, approvalWorkflow: [{ stepKey: 'president', status: 'done' }], currentVersion: 999 });
  assert.equal(consolidated.status, 201, consolidated.message);
  const ubId = consolidated.data.id;
  assert.equal(consolidated.data.currentVersion, 1);
  assert.equal(consolidated.data.consolidatedLineItems[0].items[0].originalAmount, 100);
  assert.equal(f.db.find('budget-requests', id).br_total_amount, '300.00');
  assert.equal(f.db.find('budget-requests', id).br_status, 'consolidated');
  assert.equal((await f.send('finance', 'POST', `/unified-budgets/${ubId}/reject`, {})).status, 422);
  assert.equal((await f.send('finance', 'POST', `/unified-budgets/${ubId}/reject`, { comment: 'Revise the division allocation' })).status, 200);
  f.reopen();
  const ubReturned = (await f.send('division', 'GET', `/unified-budgets/${ubId}`)).data;
  assert.equal(ubReturned.reviewComment, 'Revise the division allocation');
  const resubmitted = await f.send('division', 'PUT', `/unified-budgets/${ubId}`, { status: 'pending', comment: 'Division revision explanation', consolidatedLineItems: ubReturned.consolidatedLineItems });
  assert.equal(resubmitted.status, 200, resubmitted.message);
  assert.equal(resubmitted.data.currentVersion, 2);
  assert.equal(resubmitted.data.comment, 'Division revision explanation');
  assert.equal(resubmitted.data.approvalVersions[1].actionNote, 'Division revision explanation');
  assert.equal(resubmitted.data.approvalVersions[0].reviewComment, 'Revise the division allocation');
  const approved = await f.send('planning', 'POST', `/unified-budgets/${ubId}/approve`, { comment: 'Director approved', actor_id: 1 });
  assert.equal(approved.status, 200, approved.message);
  assert.equal(approved.data.stage, 'DBM');
  assert.equal(approved.data.statusLabel, 'Director approved');
  const workflow = approved.data.approvalWorkflow;
  assert.equal(workflow.find((step) => step.stepKey === 'dbm').status, 'current');
  assert.ok(workflow.filter((step) => ['external_approval', 'review'].includes(step.type)).every((step) => step.status !== 'done'));
  assert.ok(workflow.filter((step) => ['usec', 'secretary'].includes(step.stepKey)).every((step) => step.status !== 'done'));
  assert.equal(workflow.find((step) => step.stepKey === 'finance_planning_director').actorName, 'planning');
  assert.deepEqual(f.db.rows('budget-request-versions')[1], source);
  const captured = approved.data.approvalVersions[1].snapshot.sourceRequestForms[0];
  assert.deepEqual(captured.unifiedRequest, source.brv_snapshot.unifiedRequest);
  assert.deepEqual(captured.attachedFiles, source.brv_attached_files);
  f.reopen();
  for (const role of ['division', 'finance', 'planning']) assert.equal((await f.send(role, 'GET', `/unified-budgets/${ubId}`)).data.stage, 'DBM');
  assert.equal((await f.send('requester', 'GET', `/budget-requests/${id}`)).data.br_status, 'consolidated');
  for (const role of ['requester', 'division', 'finance', 'planning']) {
    const dashboard = await f.send(role, 'GET', '/dashboard');
    assert.equal(dashboard.data.planning.statusSummary.find((row) => row.status === 'consolidated').value, 1, `${role} dashboard agrees after reopening`);
  }
});

test('HTTP rejects cross-unit reads, unauthorised actions, spoofed sign-off, invalid transitions and repeated approvals without changing stored data', async (t) => {
  const f = await fixture(t); const { br_id: id } = await f.create();
  assert.equal((await f.call('GET', `/budget-requests/${id}`)).status, 401);
  assert.equal((await f.call('GET', '/dashboard')).status, 401);
  const otherDashboard = await f.send('other', 'GET', '/dashboard?requesting_unit_id=1');
  assert.equal(otherDashboard.status, 200);
  assert.ok(otherDashboard.data.planning.budgetByCategory.datasets.every((set) => set.data.every((amount) => amount === 0)), 'Dashboard unit override cannot reveal another unit’s amounts');
  for (const suffix of ['', '/items', '/versions', '/activity']) assert.equal((await f.send('other', 'GET', `/budget-requests/${id}${suffix}`)).status, 403);
  assert.equal((await f.send('other', 'GET', '/budget-requests?requesting_unit_id=1')).data.length, 0);
  assert.equal((await f.send('requester', 'POST', `/budget-requests/${id}/review`, { action: 'approve' })).status, 403);
  assert.equal((await f.send('finance', 'POST', `/budget-requests/${id}/review`, { action: 'approve' })).status, 403);
  assert.equal((await f.send('division', 'POST', `/budget-requests/${id}/review`, { action: 'approve' })).status, 403, 'Drafts are not disclosed to reviewers');
  for (const key of ['certifiedBy', 'approvedBy', 'agencyHead', 'approvalDate']) assert.equal((await f.send('requester', 'PUT', `/budget-requests/${id}`, { br_unified_request: { formValues: { 'bp-a': { [key]: 'Someone else' } } } })).status, 422);
  assert.equal((await f.call('GET', '/form_entries')).status, 401);
  assert.equal((await f.send('requester', 'GET', '/form_entries')).status, 403);
  assert.equal((await f.send('planning', 'PUT', '/form_entries/institutional', { amount: 0 })).status, 403);
  assert.equal((await f.send('requester', 'PUT', `/budget-requests/${id}`, { br_form_entries: [{ entryId: 'institutional' }] })).status, 422, 'Request links cannot bypass the Forms-library access policy');
  const payload = { title: 'Consolidation', fiscalYear: '2027', status: 'pending', consolidatedLineItems: f.sections(id) };
  assert.equal((await f.send('division', 'POST', '/unified-budgets', payload)).status, 409, 'Draft request cannot be consolidated');
  await f.attach(id);
  const submissions = await Promise.all([1, 2].map(() => f.send('requester', 'POST', `/budget-requests/${id}/submit`, {})));
  assert.deepEqual(submissions.map((r) => r.status).sort(), [200, 409]);
  assert.equal((await f.send('requester', 'PUT', `/budget-requests/${id}`, { br_title: 'Changed after submission' })).status, 409);
  assert.equal((await f.send('division', 'POST', `/budget-requests/${id}/review`, { action: 'approve' })).status, 200);
  assert.equal((await f.send('division', 'POST', `/budget-requests/${id}/review`, { action: 'approve' })).status, 409);
  const forged = structuredClone(payload); forged.consolidatedLineItems[0].items[0].sourceItemId = 999;
  assert.equal((await f.send('division', 'POST', '/unified-budgets', forged)).status, 422);
  const duplicate = structuredClone(payload); duplicate.consolidatedLineItems[0].items.push(duplicate.consolidatedLineItems[0].items[0]);
  assert.equal((await f.send('division', 'POST', '/unified-budgets', duplicate)).status, 422);
  assert.equal((await f.send('division', 'POST', '/unified-budgets', { ...payload, fiscalYear: '2028' })).status, 422);
  const consolidated = await f.send('division', 'POST', '/unified-budgets', payload); assert.equal(consolidated.status, 201, consolidated.message);
  const ubId = consolidated.data.id;
  const before = structuredClone(f.db.find('unified-budgets', ubId));
  for (const role of ['requester', 'division', 'admin']) assert.equal((await f.send(role, 'POST', `/unified-budgets/${ubId}/approve`, {})).status, 403);
  assert.equal((await f.send('finance', 'PUT', `/unified-budgets/${ubId}`, { title: 'Director edit' })).status, 403);
  assert.equal((await f.send('division', 'PUT', `/unified-budgets/${ubId}`, { status: 'approved' })).status, 409);
  assert.equal((await f.send('division', 'DELETE', `/unified-budgets/${ubId}`)).status, 409);
  assert.deepEqual(f.db.find('unified-budgets', ubId), before);
  const approvals = await Promise.all(['finance', 'planning'].map((role) => f.send(role, 'POST', `/unified-budgets/${ubId}/approve`, {})));
  assert.deepEqual(approvals.map((r) => r.status).sort(), [200, 409]);
  const after = structuredClone(f.db.find('unified-budgets', ubId));
  assert.equal((await f.send('planning', 'POST', `/unified-budgets/${ubId}/reject`, { comment: 'Too late' })).status, 409);
  assert.equal((await f.send('division', 'PUT', `/unified-budgets/${ubId}`, { externalDecision: { stageKey: 'president', action: 'approve' } })).status, 409);
  assert.deepEqual(f.db.find('unified-budgets', ubId), after);
  const dbm = await f.send('division', 'PUT', `/unified-budgets/${ubId}`, { externalDecision: { stageKey: 'dbm', action: 'approve', comment: 'Isolated manual result fixture' } });
  assert.equal(dbm.status, 200, dbm.message);
  assert.equal(dbm.data.approvalWorkflow.find((s) => s.stepKey === 'dbm').status, 'done');
  assert.equal((await f.send('division', 'PUT', `/unified-budgets/${ubId}`, { externalDecision: { stageKey: 'dbm', action: 'approve' } })).status, 409);
});

test('concurrent submissions of different requests retain distinct immutable versions', async (t) => {
  const f = await fixture(t);
  const first = await f.create(); const second = await f.create();
  await f.attach(first.br_id); await f.attach(second.br_id);
  const result = await Promise.all([first.br_id, second.br_id].map((id) => f.send('requester', 'POST', `/budget-requests/${id}/submit`, {})));
  assert.deepEqual(result.map((row) => row.status), [200, 200]);
  assert.deepEqual(f.db.rows('budget-request-versions').map((row) => row.brv_br_id).sort(), [first.br_id, second.br_id]);
  assert.equal(new Set(f.db.rows('budget-request-versions').map((row) => row.brv_pdf_path)).size, 2);
});
