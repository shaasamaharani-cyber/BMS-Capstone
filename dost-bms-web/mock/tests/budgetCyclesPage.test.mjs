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
    await choose('#requirement-mode', 'conditional');
    await click(button('+ Add Question Condition'));
    await choose('#condition-match', 'all');
    assert.deepEqual([...document.querySelector('#condition-field-0').options].filter((option) => option.value).map((option) => ({ id: option.value, label: option.textContent })), PROPOSAL_QUESTIONS.map((question) => ({ id: question.id, label: question.label })));
    for (const question of PROPOSAL_QUESTIONS) {
      await choose('#condition-field-0', question.id);
      assert.deepEqual([...document.querySelector('#condition-value-0').options].map((option) => ({ value: option.value, label: option.textContent })), question.options);
    }
    await choose('#condition-field-0', 'proposalTier');
    await choose('#condition-value-0', 'tier2');
    await click(button('+ Add Question Condition'));
    await choose('#condition-field-1', 'hasClimate');
    await choose('#condition-value-1', 'yes');
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
    await fill('#editor-label-0', 'Updated project title');
    await click(document.querySelector('[aria-label="Move field 2 up"]'));
    await click(button('Save BP form'));
    assert.equal(writes[2].payload.form_configs[custom.id].fields[1].label, 'Updated project title');
    await click(document.querySelector('[aria-label="Edit BP Form 202"]'));
    assert.ok(document.querySelector('#bp-form-code').readOnly);
    assert.ok(document.querySelector('[data-field-key="rationale"]'), 'Existing fields must be available to edit');
    await fill('#editor-label-0', 'Responsible department');
    await choose('#requirement-mode', 'conditional');
    await choose('#condition-value-0', 'tier1');
    await click(button('Save BP form'));
    assert.equal(writes[3].payload.form_configs['bp-202'].fields[0].label, 'Responsible department');
    assert.equal(writes[3].payload.form_configs['bp-202'].requirement.conditions[0].value, 'tier1');
    assert.equal(cycles[0].form_configs['bp-202'], undefined, 'Editing existing fields must not affect other fiscal years');
    await click(button('FY2026 (closed)'));
    assert.equal(button('Save FY2026').disabled, true);
    assert.ok(button('+ Add BP form').matches(':disabled'));
    await click(button('+ Add BP form'));
    assert.equal(document.querySelector('[role="dialog"]'), null);

    // Use the actual requester component with the admin's saved definition, then remount with saved answers.
    const { default: StepPrefilledForms } = await vite.ssrLoadModule('/src/pages/unified_request/step_prefilled_forms.jsx');
    const { default: FormsSummary } = await vite.ssrLoadModule('/src/components/form/unified_request_forms_summary.jsx');
    const { AuthProvider } = await vite.ssrLoadModule('/src/context/auth_context.jsx');
    const { getCycleFormCatalog } = await vite.ssrLoadModule('/src/bp_forms/bp_form_catalog.js');
    const { MemoryRouter } = await import('react-router-dom');
    client.defaults.adapter = async (config) => ({ data: { data: { usr_id: 2, role: { role_group: 'requester', role_name: 'requester' } } }, status: 200, config });
    dom.window.localStorage.setItem('token', 'test-token');
    const savedCycle = writes[0].payload;
    const savedConfig = savedCycle.form_configs[custom.id];
    const totals = { grandTotal: 100, psTotal: 0, mooeTotal: 100, coTotal: 0, tagTotal: 0 };
    const tier1 = evaluateRequiredForms({ proposalTier: 'tier1' }, totals, {}, savedCycle.enabled_form_ids, {}, savedCycle.custom_forms, savedCycle.form_configs);
    assert.ok(!tier1.arrRequired.some((entry) => entry.formId === custom.id));
    const required = evaluateRequiredForms({ proposalTier: 'tier2', hasClimate: 'yes' }, totals, {}, savedCycle.enabled_form_ids, {}, savedCycle.custom_forms, savedCycle.form_configs).arrRequired.filter((entry) => entry.formId === custom.id);
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
