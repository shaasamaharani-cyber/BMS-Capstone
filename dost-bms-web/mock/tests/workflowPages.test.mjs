import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';

test('Director UI reports failed saves truthfully; tracking uses persisted budgets and does not call Director approval completed', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://fixture.local' });
  const { document } = dom.window;
  const previous = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, localStorage: dom.window.localStorage, IS_REACT_ACT_ENVIRONMENT: true })) {
    previous.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { MemoryRouter, Routes, Route } = await import('react-router-dom');
  const vite = await createServer({ server: { middlewareMode: true, watch: null, hmr: false }, appType: 'custom' });
  const root = createRoot(document.getElementById('root'));
  let client, oldAdapter;
  try {
    ({ default: client } = await vite.ssrLoadModule('/src/api/client.js'));
    oldAdapter = client.defaults.adapter;
    const { default: Detail } = await vite.ssrLoadModule('/src/pages/budget_consolidate/budget_consolidation_detail_page.jsx');
    const { AuthProvider } = await vite.ssrLoadModule('/src/context/auth_context.jsx');
    const { ToastContext } = await vite.ssrLoadModule('/src/components/ui/toast_message/toast_context.js');
    const { createEmptyUnifiedWorkflow, applyUnifiedBudgetWorkflowAction } = await vite.ssrLoadModule('/src/utils/workflow_utils.js');
    const tracking = await vite.ssrLoadModule('/src/api/budget_tracking_api.js');
    const messages = []; const writes = [];
    const record = { id: 88, title: 'Persisted fixture', status: 'PENDING', stage: 'Finance / Planning Director', fiscalYear: '2027', totals: { psTotal: 100, mooeTotal: 200 }, consolidatedLineItems: [], currentVersion: 1, approvalWorkflow: applyUnifiedBudgetWorkflowAction(createEmptyUnifiedWorkflow(), 'submit'), approvalVersions: [] };
    let rejectSave = true;
    client.defaults.adapter = async (config) => {
      let data;
      if (config.url === '/auth/me') data = { id: 4, role: { role_group: 'executive', role_name: 'finance_director' } };
      else if (config.url === '/planning-periods') data = [];
      else if (config.method === 'post') {
        writes.push(config.url);
        if (rejectSave) throw new Error('Fixture API unavailable');
        record.status = 'APPROVED'; record.stage = 'DBM'; record.statusLabel = 'Director approved';
        record.approvalWorkflow = record.approvalWorkflow.map((step) => ({ ...step, status: step.stepKey === 'draft' || step.stepKey === 'finance_planning_director' ? 'done' : step.stepKey === 'dbm' ? 'current' : 'locked' }));
        data = record;
      } else data = config.url === '/unified-budgets' ? [record] : record;
      return { data: { data: structuredClone(data) }, status: 200, config };
    };
    localStorage.setItem('token', 'fixture-token');
    const render = async (key) => React.act(async () => root.render(React.createElement(MemoryRouter, { key, initialEntries: ['/budget-consolidation/88'] }, React.createElement(AuthProvider, null, React.createElement(ToastContext.Provider, { value: { showToast: (message) => messages.push(message) } }, React.createElement(Routes, null, React.createElement(Route, { path: '/budget-consolidation/:id', element: React.createElement(Detail) })))))));
    await render('first');
    const approve = () => [...document.querySelectorAll('button')].find((node) => node.textContent.includes('Approve') && !node.textContent.includes('Approval'));
    assert.ok(approve(), 'Director can decide a pending budget');
    await React.act(async () => approve().click());
    assert.ok(approve(), 'Failed API call must leave the decision available');
    assert.equal(messages.at(-1).variant, 'danger');
    assert.equal(messages.filter((message) => message.variant === 'success').length, 0);
    rejectSave = false;
    await React.act(async () => approve().click());
    assert.equal(messages.at(-1).variant, 'success');
    assert.equal(approve(), undefined);
    assert.match(document.body.textContent, /DBM/);
    await render('reopened');
    assert.equal(approve(), undefined, 'Reopened approved budget remains read-only');
    const rows = await tracking.getTrackingBudgets();
    assert.deepEqual(rows.data.map((row) => row.id), [88], 'No unrelated demonstration records');
    assert.equal(rows.data[0].statusLabel, 'Director approved');
    const stats = await tracking.getTrackingSummaryStats();
    assert.equal(stats.completed, 0); assert.equal(stats.inProgress, 1); assert.match(stats.ps, /100/); assert.match(stats.mooe, /200/);
    assert.equal(writes.length, 2);
  } finally {
    if (client) client.defaults.adapter = oldAdapter;
    await React.act(async () => root.unmount()); await vite.close(); dom.window.close();
    for (const [key, descriptor] of previous) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
});
