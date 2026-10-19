import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import { BP_FORM_CATALOG } from '../../src/bp_forms/bp_form_catalog.js';
import { evaluateRequiredForms, PROPOSAL_QUESTIONS } from '../../src/bp_forms/bp_form_rules.js';
import { getFormCompletion } from '../../src/bp_forms/bp_form_fields.js';

test('Add BP form works without randomUUID, saves to any open year, and keeps closed years read-only', async () => {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://budget.local' });
  const { document } = dom.window;
  const descriptors = new Map();
  for (const [key, value] of Object.entries({
    window: dom.window, document: dom.window.document, navigator: dom.window.navigator,
    localStorage: dom.window.localStorage, crypto: { getRandomValues: dom.window.crypto.getRandomValues.bind(dom.window.crypto) },
    IS_REACT_ACT_ENVIRONMENT: true,
  })) {
    descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { configurable: true, writable: true, value });
  }
  const React = await import('react');
  const { createRoot } = await import('react-dom/client');
  const vite = await createServer({ server: { middlewareMode: true, watch: null }, appType: 'custom' });
  const root = createRoot(document.getElementById('root'));
  let client;
  let originalAdapter;
  try {
    const { default: BudgetCyclesPage } = await vite.ssrLoadModule('/src/pages/budget_cycles/budget_cycles_page.jsx');
    const { ToastContext } = await vite.ssrLoadModule('/src/components/ui/toast_message/toast_context.js');
    ({ default: client } = await vite.ssrLoadModule('/src/api/client.js'));
    originalAdapter = client.defaults.adapter;
    const cycles = ['2028', '2027', '2026'].map((year) => ({ fy_year: year, fy_is_active: year !== '2026', custom_forms: [], enabled_form_ids: BP_FORM_CATALOG.map((form) => form.id), supporting_documents: [], configured: false }));
    const writes = [];
    let rejectNextSave = false;
    client.defaults.adapter = async (config) => {
      if (config.method === 'get') return { data: { data: structuredClone(cycles) }, status: 200, config };
      if (rejectNextSave) { rejectNextSave = false; throw new Error('The form could not be saved.'); }
      const year = config.url.split('/').at(-1);
      const payload = JSON.parse(config.data);
      writes.push({ year, payload });
      const cycle = cycles.find((row) => row.fy_year === year);
      Object.assign(cycle, payload, { configured: true, updated_by: 'Main Administrator', updated_at: new Date().toISOString() });
      return { data: { data: structuredClone(cycle) }, status: 200, config };
    };
    const messages = [];
    await React.act(async () => {
      root.render(React.createElement(ToastContext.Provider, { value: { showToast: (message) => messages.push(message) } }, React.createElement(BudgetCyclesPage)));
    });
    const button = (label) => [...document.querySelectorAll('button')].find((node) => node.textContent.trim() === label);
    const click = async (node) => { assert.ok(node, 'Button must exist'); await React.act(async () => node.click()); };
    const fill = async (selector, value) => {
      const input = document.querySelector(selector);
      assert.ok(input, `Field ${selector} must exist`);
      await React.act(async () => {
        Object.getOwnPropertyDescriptor(input.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype, 'value').set.call(input, value);
        input.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
      });
    };
    const choose = async (selector, value) => {
      const select = document.querySelector(selector);
      assert.ok(select);
      await React.act(async () => { select.value = value; select.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
    };
    assert.equal(typeof globalThis.crypto.randomUUID, 'undefined');
    await click(button('+ Add BP form'));
    assert.ok(document.querySelector('[role="dialog"]'), 'Click must open the editor on ordinary HTTP');
    const yearSelect = document.querySelector('#bp-form-year');
    assert.deepEqual([...yearSelect.options].map((option) => option.value), ['2028', '2027']);
    await React.act(async () => { yearSelect.value = '2027'; yearSelect.dispatchEvent(new dom.window.Event('change', { bubbles: true })); });
    await fill('#bp-form-code', 'BP Form 999');
    await fill('#bp-form-name', 'New fiscal year form');
    await fill('#editor-label-0', 'Project title');
    await choose('#editor-type-0', 'text');
    assert.equal(document.querySelector('#requirement-mode').value, 'optional', 'New forms require an explicit mandate');
    await choose('#requirement-mode', 'conditional');
    await choose('#condition-match', 'all');
    for (const question of PROPOSAL_QUESTIONS) {
      const group = document.querySelector(`[data-question-id="${question.id}"]`);
      assert.equal(group.querySelector('legend').textContent, question.label);
      assert.deepEqual([...group.querySelectorAll('input[type="checkbox"]')].map((input) => input.dataset.conditionAnswer), question.options.map((answer) => answer.value));
      for (const answer of question.options) assert.ok(group.textContent.includes(`Requester answers ${answer.label}`));
    }
    assert.equal(button('+ Add Question Condition'), undefined);
    assert.equal(document.querySelector('#condition-field-0'), null);
    await click(document.querySelector('[data-condition-question="proposalTier"][data-condition-answer="tier2"]'));
    await click(document.querySelector('[data-condition-question="hasClimate"][data-condition-answer="yes"]'));
    await click(button('+ Add field'));
    await fill('#editor-label-1', 'Estimated cost');
    await choose('#editor-type-1', 'number');
    await click(document.querySelector('#editor-required-1'));
    await click(button('+ Add field'));
    await fill('#editor-label-2', 'Project category');
    await choose('#editor-type-2', 'select');
    await fill('#editor-options-2', 'Research\nOperations');
    await click(button('Add BP form'));
    assert.equal(document.querySelector('[role="dialog"]'), null);
    assert.equal(writes.length, 1);
    assert.equal(writes[0].year, '2027');
    const custom = writes[0].payload.custom_forms[0];
    assert.equal(custom.code, 'BP Form 999');
    assert.match(custom.id, /^custom-[a-zA-Z0-9-]+$/);
    assert.ok(writes[0].payload.enabled_form_ids.includes(custom.id));
    assert.equal(writes[0].payload.form_configs[custom.id].fields.length, 3);
    assert.equal(writes[0].payload.form_configs[custom.id].requirement.conditions.length, 2);
    assert.ok(document.querySelector(`#form-${custom.id}`).checked);
    assert.equal(messages.length, 1);
    await click(button('FY2028'));
    assert.equal(document.querySelector(`#form-${custom.id}`), null, 'Adding a form must not change other years');

    // A failed save must retain the editor and its data so the admin can retry.
    await click(button('+ Add BP form'));
    await fill('#bp-form-code', 'BP Form 998');
    await fill('#bp-form-name', 'Another form');
    rejectNextSave = true;
    await click(button('Add BP form'));
    assert.ok(document.querySelector('[role="dialog"]'));
    assert.equal(document.querySelector('#bp-form-name').value, 'Another form');
    assert.match(document.querySelector('[role="dialog"] [role="alert"]').textContent, /could not be saved/);
    await click(button('Add BP form'));
    assert.equal(document.querySelector('[role="dialog"]'), null);
    assert.equal(writes[1].year, '2028');
    await click(button('FY2027'));
    await click(document.querySelector('[aria-label="Edit BP Form 999"]'));
    assert.ok(document.querySelector('[data-condition-question="hasClimate"][data-condition-answer="yes"]').checked);
    assert.ok(document.querySelector('[data-condition-question="proposalTier"][data-condition-answer="tier2"]').checked);
    assert.equal(document.querySelector('#condition-match').value, 'all');
    await fill('#editor-label-0', 'Updated project title');
    await click(document.querySelector('[aria-label="Move field 2 up"]'));
    await click(button('Save BP form'));
    assert.equal(writes[2].payload.form_configs[custom.id].fields[1].label, 'Updated project title');
    await click(document.querySelector('[aria-label="Edit BP Form 202"]'));
    assert.ok(document.querySelector('#bp-form-code').readOnly);
    assert.equal(document.querySelector('#bp-form-owner').readOnly, false);
    await fill('#bp-form-owner', 'Institution planning contributors (provisional)');
    assert.ok(document.querySelector('[data-field-key="rationale"]'), 'Existing fields must be available to edit');
    await fill('#editor-label-0', 'Responsible department');
    await choose('#requirement-mode', 'conditional');
    await click(document.querySelector('[data-condition-question="proposalTier"][data-condition-answer="tier2"]'));
    await click(document.querySelector('[data-condition-question="proposalTier"][data-condition-answer="tier1"]'));
    await click(button('Save BP form'));
    assert.equal(writes[3].payload.form_configs['bp-202'].fields[0].label, 'Responsible department');
    assert.equal(writes[3].payload.form_configs['bp-202'].completedBy, 'Institution planning contributors (provisional)');
    assert.equal(writes[3].payload.form_configs['bp-202'].requirement.conditions[0].value, 'tier1');
    assert.equal(cycles[0].form_configs['bp-202'], undefined, 'Editing existing fields must not affect other fiscal years');
    await click(button('FY2026 (closed)'));
    assert.equal(button('Save FY2026').disabled, true);
    assert.ok(button('+ Add BP form').matches(':disabled'));
    await click(button('+ Add BP form'));
    assert.equal(document.querySelector('[role="dialog"]'), null);

    // Use the actual requester component with the admin's saved definition, then remount with saved answers.
    const { default: StepPrefilledForms } = await vite.ssrLoadModule('/src/pages/unified_request/step_prefilled_forms.jsx');
    const { default: StepProposalQuestions } = await vite.ssrLoadModule('/src/pages/unified_request/step_proposal_questions.jsx');
    const { default: FormsSummary } = await vite.ssrLoadModule('/src/components/form/unified_request_forms_summary.jsx');
    const { AuthProvider } = await vite.ssrLoadModule('/src/context/auth_context.jsx');
    const { getCycleFormCatalog } = await vite.ssrLoadModule('/src/bp_forms/bp_form_catalog.js');
    const { MemoryRouter } = await import('react-router-dom');
    const exports = [];
    client.defaults.adapter = async (config) => {
      if (config.url === '/bp-form-exports') { exports.push(JSON.parse(config.data)); return { data: { data: { pdfUrl: '/generated/forms/test-draft.pdf' } }, status: 200, config }; }
      return { data: { data: { usr_id: 2, role: { role_group: 'requester', role_name: 'requester' } } }, status: 200, config };
    };
    dom.window.localStorage.setItem('token', 'test-token');
    const savedCycle = writes[0].payload;
    const savedConfig = savedCycle.form_configs[custom.id];
    const totals = { grandTotal: 100, psTotal: 0, mooeTotal: 100, coTotal: 0, tagTotal: 0 };
    const tier1 = evaluateRequiredForms({ proposalTier: 'tier1' }, totals, {}, savedCycle.enabled_form_ids, {}, savedCycle.custom_forms, savedCycle.form_configs);
    assert.ok(!tier1.arrRequired.some((entry) => entry.formId === custom.id));
    const required = evaluateRequiredForms({ proposalTier: 'tier2', hasClimate: 'yes' }, totals, {}, savedCycle.enabled_form_ids, {}, savedCycle.custom_forms, savedCycle.form_configs).arrRequired.filter((entry) => entry.formId === custom.id);
    function AnswerHarness() {
      const [answers, setAnswers] = React.useState({ proposalTier: 'tier2', hasClimate: 'no' });
      const selected = evaluateRequiredForms(answers, totals, {}, savedCycle.enabled_form_ids, {}, savedCycle.custom_forms, savedCycle.form_configs).arrRequired.filter((entry) => entry.formId === custom.id);
      return React.createElement(React.Fragment, null,
        React.createElement(StepProposalQuestions, { objAnswers: answers, objHints: {}, intRequiredCount: selected.length, onAnswerChange: (key, value) => setAnswers((previous) => ({ ...previous, [key]: value })) }),
        React.createElement(StepPrefilledForms, { arrCatalog: getCycleFormCatalog(savedCycle), arrRequired: selected, objContext: { common: {}, totals, lineItems: [], formConfigs: savedCycle.form_configs }, onSelectForm: () => {}, onFormValueChange: () => {}, onRegenerate: () => {} }));
    }
    await React.act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(AuthProvider, null, React.createElement(AnswerHarness)))));
    const climateQuestion = PROPOSAL_QUESTIONS.find((question) => question.id === 'hasClimate');
    const climateGroup = () => [...document.querySelectorAll('[role="radiogroup"]')].find((group) => group.getAttribute('aria-label') === climateQuestion.label);
    assert.ok(!document.body.textContent.includes(custom.name));
    await click([...climateGroup().querySelectorAll('button')].find((node) => node.textContent === 'Yes'));
    assert.ok(document.body.textContent.includes(custom.name), 'Actual requester Yes answer immediately requires the saved custom form');
    await click([...climateGroup().querySelectorAll('button')].find((node) => node.textContent === 'No'));
    assert.ok(!document.body.textContent.includes(custom.name), 'No answer removes the form without a page refresh');
    let savedValues = {};
    function RequesterHarness({ initialValues }) {
      const [values, setValues] = React.useState(initialValues);
      savedValues = values;
      return React.createElement(StepPrefilledForms, {
        arrCatalog: getCycleFormCatalog(savedCycle), arrRequired: required,
        objContext: { common: {}, totals, lineItems: [], formValues: values, formConfigs: savedCycle.form_configs },
        onSelectForm: () => {}, onRegenerate: () => {},
        onFormValueChange: (formId, key, value) => setValues((prev) => ({ ...prev, [formId]: { ...prev[formId], [key]: value } })),
      });
    }
    const renderRequester = async (values, key) => React.act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(AuthProvider, null, React.createElement(RequesterHarness, { key, initialValues: values })))));
    await renderRequester({}, 'first');
    assert.ok(!document.body.textContent.includes('Prepare this form offline'));
    await fill(`#field-${savedConfig.fields[0].key}`, 'Research project');
    await fill(`#field-${savedConfig.fields[1].key}`, '250.5');
    await choose(`#field-${savedConfig.fields[2].key}`, 'Research');
    assert.equal(getFormCompletion(custom.id, { formConfigs: savedCycle.form_configs, formValues: savedValues }).complete, true);
    let printedTarget;
    dom.window.print = () => { printedTarget = document.body.dataset.printTarget; };
    await click(button('Print / Save as PDF'));
    assert.equal(printedTarget, 'request-form-print-area');
    assert.match(document.querySelector('#request-form-print-area').textContent, /Research project/);
    const storedValues = JSON.parse(JSON.stringify(savedValues));
    await renderRequester(storedValues, 'reopened');
    assert.equal(document.querySelector(`#field-${savedConfig.fields[0].key}`).value, 'Research project');
    assert.equal(document.querySelector(`#field-${savedConfig.fields[1].key}`).value, '250.5');
    assert.equal(document.querySelector(`#field-${savedConfig.fields[2].key}`).value, 'Research');
    await React.act(async () => root.render(React.createElement(FormsSummary, { unified: { customForms: savedCycle.custom_forms, formConfigs: savedCycle.form_configs, formValues: storedValues, requiredForms: required, common: {}, totalsAtGeneration: totals } })));
    assert.match(document.body.textContent, /Project title/);
    assert.match(document.body.textContent, /Research project/);
    assert.ok(!document.body.textContent.includes('Updated project title'), 'Submitted forms must display the saved definition');

    // Enter actual/current/NEP targets in the same repeatable editor used for Form B.
    let performanceValues = {};
    function PerformanceHarness({ initialValues }) {
      const [values, setValues] = React.useState(initialValues);
      performanceValues = values;
      return React.createElement(StepPrefilledForms, {
        arrCatalog: getCycleFormCatalog({}), arrRequired: [{ formId: 'bp-b' }],
        objContext: { common: { fiscalYear: '2027', agency: 'Institution A' }, totals, lineItems: [], formValues: { 'bp-b': values } },
        onSelectForm: () => {}, onRegenerate: () => {}, onFormValueChange: (_id, key, value) => setValues((previous) => ({ ...previous, [key]: value })),
      });
    }
    const renderPerformance = (values, key) => React.act(async () => root.render(React.createElement(MemoryRouter, null, React.createElement(AuthProvider, null, React.createElement(PerformanceHarness, { key, initialValues: values })))));
    await renderPerformance({}, 'performance-new');
    assert.equal(button('Add row'), undefined, 'The first entry is visible without adding a spreadsheet row');
    assert.equal(document.querySelectorAll('#request-form-print-area table').length, 0);
    const performanceInput = (label) => `[aria-label="Performance measures and targets, row 1, ${label}"]`;
    await fill(performanceInput('Organisational outcome'), 'Outcome A');
    await fill(performanceInput('Program'), 'Science services');
    await fill(performanceInput('Sub-program'), 'Laboratories');
    await choose(performanceInput('Indicator type'), 'Output indicator');
    await fill(performanceInput('Performance indicator'), 'Reports delivered');
    for (const [label, value] of [['2025 GAA targets', '80%'], ['2025 actual accomplishments', '85%'], ['2026 GAA targets', '90%'], ['2027 NEP targets — Tier 1', '92%'], ['2027 NEP targets — Tier 2', '95%']]) await fill(performanceInput(label), value);
    await fill('#field-budgetOfficer', 'Budget name');
    await fill('#field-planningOfficer', 'Planning name');
    assert.equal(document.querySelector('input#field-agencyHead'), null, 'Requester cannot enter approval metadata');
    assert.equal(document.querySelector('input#field-approvalDate'), null, 'Approval date belongs to the approving office');
    assert.equal(performanceValues.performance[0].proposedTier2, '95%');
    await click(button('Generate government-style PDF'));
    const printed = document.querySelector('#request-form-print-area');
    assert.match(printed.textContent, /Prepared by — Budget officer/);
    assert.match(printed.textContent, /Approved by — Agency head/);
    assert.match(printed.textContent, /Not required at requester submission/);
    assert.equal(exports[0].context.formValues['bp-b'].performance[0].proposedTier2, '95%');
    assert.equal(document.querySelector('a[href="/generated/forms/test-draft.pdf"]').textContent, 'Download draft PDF');
    const performanceSaved = structuredClone(performanceValues);
    await renderPerformance(performanceSaved, 'performance-reopened');
    assert.equal(document.querySelector(performanceInput('2027 NEP targets — Tier 2')).value, '95%');
    assert.equal(document.querySelector('#field-budgetOfficer').value, 'Budget name');

    const { default: NativeFormRenderer } = await vite.ssrLoadModule('/src/forms/components/form_renderer.jsx');
    const { BPFormBSchema } = await vite.ssrLoadModule('/src/forms/schemas/default_schemas.js');
    const legacySection = [{ id: 'old-row', name: 'Old financial sample', quantity: 1, unitCost: 100, total: 100 }];
    await React.act(async () => root.render(React.createElement(NativeFormRenderer, { schema: BPFormBSchema, entry: { name: 'Institution measures', header: {}, sections: { performance: performanceSaved.performance, requirements: legacySection } }, setEntry: () => {} })));
    assert.ok(document.body.textContent.includes('2027 NEP targets — Tier 2'));
    assert.ok(document.body.textContent.includes('Old financial sample'));
    assert.ok(!document.body.textContent.includes('Subtotal'), 'Targets cannot be summed as financial expenditure');
  } finally {
    if (client) client.defaults.adapter = originalAdapter;
    await React.act(async () => root.unmount());
    await vite.close();
    dom.window.close();
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
});
