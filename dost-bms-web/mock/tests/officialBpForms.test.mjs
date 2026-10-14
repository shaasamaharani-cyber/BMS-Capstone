import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { OFFICIAL_WORKBOOK_FORMS, WORKBOOK_REFERENCE } from '../../src/bp_forms/official_workbook_manifest.js';
import { getDefaultFormDefinition, getFormDefinition, buildFormView, getFieldValueError, getFormCompletion } from '../../src/bp_forms/bp_form_fields.js';
import { validateFormConfig } from '../../src/bp_forms/bp_form_configuration.js';
import { getDefaultRequirement } from '../../src/bp_forms/bp_form_rules.js';
import { resolveEntryFields } from '../../src/bp_forms/form_schema.js';
import { DEFAULT_FORM_SCHEMAS } from '../../src/forms/schemas/default_schemas.js';
import { generateBpFormPdf } from '../server/services/bpFormPdf.mjs';
import { handleBpFormExports } from '../server/routes/bpFormExports.mjs';

const extractor = existsSync('C:/Program Files/Git/mingw64/bin/pdftotext.exe') ? 'C:/Program Files/Git/mingw64/bin/pdftotext.exe' : 'pdftotext';
const canExtract = !spawnSync(extractor, ['-v']).error;
const textOf = (path) => {
  const result = spawnSync(extractor, ['-layout', path, '-'], { encoding: 'utf8', maxBuffer: 30 * 1024 * 1024 });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.replace(/\s+/g, ' ');
};
const common = { department: 'Department of Science and Technology', agency: 'Fixture institution', operatingUnit: 'Fixture unit', fiscalYear: '2027', projectName: 'Fixture project', implementingAgency: 'Fixture institution', projectDescription: 'Fixture description', objectives: 'Fixture purpose', fundingSource: 'national_government' };
const config = (fields, extra = {}) => ({ level: 'agency', fields, requirement: { mode: 'optional', match: 'any', conditions: [] }, ...extra });
const fill = (field, index = 0) => field.columns ? [Object.fromEntries(field.columns.filter((column) => !column.outputOnly && !column.calculation).map((column, i) => [column.key, fill(column, i)]))] : field.options ? field.options[0] : field.type === 'date' ? '2026-10-14' : field.type === 'checkbox' ? false : ['currency', 'number'].includes(field.type) ? 1000 + index : `Fixture ${field.key}`;

test('actual workbook inventory covers all 21 forms and excludes blue sample values', async () => {
  const inventory = JSON.parse(await readFile(resolve('../docs/bp_forms_workbook_inventory.json'), 'utf8'));
  assert.equal(inventory.sheetCount, 22);
  assert.equal(inventory.formCount, 21);
  assert.equal(WORKBOOK_REFERENCE.sha256, inventory.sha256);
  assert.deepEqual(OFFICIAL_WORKBOOK_FORMS.map((form) => form.sheet), inventory.sheets.filter((sheet) => sheet.sheet !== 'Index').map((sheet) => sheet.sheet));
  const examples = inventory.sheets.flatMap((sheet) => sheet.cells).filter((cell) => cell.kind === 'example-excluded');
  assert.ok(examples.length > 1000);
  assert.ok(examples.every((cell) => !Object.hasOwn(cell, 'value')));
  assert.equal(OFFICIAL_WORKBOOK_FORMS.find((form) => form.id === 'bp-201-b').sections[0].columns.length, 60);
  assert.match(OFFICIAL_WORKBOOK_FORMS.find((form) => form.id === 'bp-201-c').verification, /assumed/);
});

test('every official form has an editable mapped definition and an empty native schema without example records', () => {
  for (const form of OFFICIAL_WORKBOOK_FORMS) {
    const definition = getDefaultFormDefinition(form.id);
    const validated = validateFormConfig(config(definition.fields, { sections: definition.sections, requirement: getDefaultRequirement(form.id) }));
    assert.equal(validated.error, undefined, `${form.id}: ${validated.error}`);
    assert.equal(definition.official.id, form.id);
    for (const section of form.sections) assert.ok(definition.workbookLayout.some((layout) => layout.reference === section.reference));
    const native = DEFAULT_FORM_SCHEMAS.find((schema) => schema.official?.id === form.id);
    assert.ok(native.official, form.id);
    assert.ok(native.sections.every((section) => !section.table?.defaultRows), 'No DBM example rows may seed DOST entries');
  }
});

test('large configurations and nested groups preserve all fields, options, descriptions, validation and calculations', () => {
  const fields = Array.from({ length: 180 }, (_, i) => ({ key: `field_${i}`, label: `Field ${i}`, source: 'user', type: 'text' }));
  fields.push({ key: 'entries', label: 'Entries', type: 'group', source: 'user', description: 'Office contribution', columns: [{ key: 'choice', label: 'Choice', type: 'radio', options: ['One', 'Two'] }, ...Array.from({ length: 65 }, (_, i) => ({ key: `amount_${i}`, label: `Amount ${i}`, type: 'currency', validation: { min: 0, max: 1000000 } })), { key: 'total', label: 'Total', type: 'currency', calculation: 'sum', operands: ['amount_0', 'amount_64'] }, { key: 'nested', label: 'Nested', type: 'group', columns: [{ key: 'note', label: 'Note', type: 'textarea' }] }] });
  const result = validateFormConfig(config(fields));
  assert.equal(result.error, undefined);
  assert.equal(result.config.fields.length, 181);
  assert.equal(result.config.fields.at(-1).columns.length, 68);
  const values = { entries: [{ choice: 'Two', amount_0: 100.01, amount_64: 200.02, nested: [{ note: 'Retained nested note' }] }] };
  const resolved = resolveEntryFields(result.config.fields, values);
  assert.equal(resolved.entries[0].total, 300.03);
  assert.equal(resolved.entries[0].nested[0].note, 'Retained nested note');
  assert.deepEqual(values.entries[0].nested, resolved.entries[0].nested);
});

test('required visibility follows existing proposal answers and attachment/currency/date validation is explicit', () => {
  const field = { key: 'amount', label: 'Amount', source: 'user', type: 'currency', required: true, visibleWhen: { match: 'all', conditions: [{ id: 'climate', questionId: 'hasClimate', operator: 'equals', value: 'yes' }] } };
  const configuration = validateFormConfig(config([field]));
  assert.equal(configuration.error, undefined);
  const context = { formConfigs: { 'custom-visibility': configuration.config }, formValues: {}, answers: { hasClimate: 'no' } };
  assert.equal(getFormCompletion('custom-visibility', context).complete, true);
  context.answers.hasClimate = 'yes';
  assert.equal(getFormCompletion('custom-visibility', context).complete, false);
  assert.match(getFieldValueError({ type: 'currency' }, 'invalid'), /number/);
  assert.match(getFieldValueError({ type: 'date' }, '2027-02-30'), /date/);
  assert.equal(getFieldValueError({ type: 'attachment', required: true }, { name: 'evidence.pdf', type: 'application/pdf', size: 8, dataUrl: 'data:application/pdf;base64,JVBERi0xCg==' }), '');
  assert.ok(getFieldValueError({ type: 'attachment', required: true }, { name: 'fake.pdf' }));
});

test('official mappings survive additive overlays, formula tampering, custom additions and historical captures', () => {
  const original = structuredClone(getDefaultFormDefinition('bp-201-b'));
  const field = original.fields.find((field) => field.key === 'official_maintenance');
  const edited = structuredClone(field);
  edited.label = 'Institution operating expenditure';
  edited.columns.at(-1).calculation = 'multiply';
  edited.columns.at(-1).operands = ['col_D'];
  edited.columns[0].reference = 'forged';
  edited.columns.push({ key: 'internalNote', label: 'Internal note', type: 'text', source: 'user' });
  const definition = getFormDefinition('bp-201-b', { formConfigs: { 'bp-201-b': config([edited, { key: 'extra', label: 'Custom approval note', type: 'textarea', source: 'user' }]) } });
  const mapped = definition.fields.find((field) => field.key === 'official_maintenance');
  assert.equal(mapped.columns.length, 61);
  assert.equal(mapped.columns[0].reference, field.columns[0].reference);
  assert.equal(mapped.columns.find((column) => column.key === 'col_BH').calculation, 'sum');
  assert.ok(definition.fields.some((field) => field.key === 'department'));
  assert.ok(definition.fields.some((field) => field.key === 'extra'));
  assert.deepEqual(getDefaultFormDefinition('bp-201-b'), original);
  const captured = { fields: [{ key: 'old', label: 'Original captured field', source: 'user', type: 'text' }], table: null };
  assert.equal(getFormDefinition('bp-201-b', { formDefinitions: { 'bp-201-b': captured } }), captured);
  const oldValues = buildFormView('bp-100', { common, totals: {}, lineItems: [], formValues: { 'bp-100': { section0_actual2025: 123 } } });
  assert.equal(oldValues.fields.find((field) => field.key === 'section0_actual2025').preserved, true);
});

test('staffing and retirement calculations use explicit inputs, preserve fractional leave credits and assume no benefit rate', () => {
  const staffing = getDefaultFormDefinition('bp-204').fields.find((field) => field.key === 'official_positions');
  const known = Object.fromEntries(staffing.columns.filter((column) => column.type === 'currency' && !column.outputOnly).map((column) => [column.key, 0]));
  const values = resolveEntryFields([staffing], { official_positions: [{ ...known, col_E: 2, col_F: 6, col_H: 10000, col_K: 2000 }] });
  assert.equal(values.official_positions[0].col_G, 12);
  assert.equal(values.official_positions[0].col_J, 120000);
  assert.equal(values.official_positions[0].col_Y, 122000);
  const retirees = getDefaultFormDefinition('bp-205').fields.find((field) => field.key === 'official_retirees');
  const unknown = resolveEntryFields([retirees], { official_retirees: [{ col_G: 10000, col_H: 10.123, col_I: 20.456 }] });
  assert.equal(unknown.official_retirees[0].leaveCredits, 30.579);
  assert.equal(unknown.official_retirees[0].col_J, null);
  assert.equal(getDefaultFormDefinition('bp-204').official.units, 'pesos');
  assert.equal(getDefaultFormDefinition('bp-205').official.units, 'pesos');
});

test('verified FinEx columns preserve assumed workbook records without allocating them to fees', () => {
  const definition = getDefaultFormDefinition('bp-201-c');
  const verified = definition.fields.find((field) => field.key === 'official_verifiedFinancial');
  assert.equal(verified.columns.length, 9);
  assert.equal(definition.fields.find((field) => field.key === 'official_financial').legacy, true);
  const values = { official_financial: [{ col_E: 999 }], official_verifiedFinancial: [{ managementFees: 1, interestNonResidents: 2, guaranteeFees: 3, bankCharges: 4, commitmentFees: 5, otherFinancialCharges: 6 }] };
  const view = buildFormView('bp-201-c', { common, totals: {}, lineItems: [], formValues: { 'bp-201-c': values } });
  assert.equal(view.fields.find((field) => field.key === verified.key).value[0].total, 21);
  assert.equal(view.fields.find((field) => field.key === 'official_financial').value[0].col_E, 999);
  assert.equal(values.official_verifiedFinancial[0].total, undefined);
  const component = getDefaultFormDefinition('bp-203').fields.find((field) => field.key === 'official_components');
  const explicit = Object.fromEntries(component.columns.filter((column) => column.type === 'currency' && !column.outputOnly).map((column) => [column.key, 1]));
  assert.equal(resolveEntryFields([component], { [component.key]: [explicit] })[component.key][0].col_S, 11);
});

test('climate actual, current and proposed records and summaries remain independent', () => {
  const values = { official_climateActual: [{ col_D: 10, col_E: 20 }], official_climateCurrent: [{ col_D: 30, col_E: 40 }], official_climateActualSummary: [{ col_A: 'Adaptation', col_B: 10, col_C: 20 }], official_climateCurrentSummary: [{ col_A: 'Mitigation', col_B: 30, col_C: 40 }] };
  const view = buildFormView('bp-207', { common, answers: { proposalTier: 'tier2' }, totals: {}, lineItems: [], formValues: { 'bp-207': values } });
  const field = (key) => view.fields.find((field) => field.key === key);
  assert.ok(view.sections.every((section) => !/\{(?:actualYear|currentYear|fiscalYear)\}/.test(section.title)));
  assert.equal(field('official_climateActual').value[0].col_F, 30);
  assert.equal(field('official_climateCurrent').value[0].col_F, 70);
  assert.equal(field('official_climateActualSummary').value[0].col_D, 30);
  assert.equal(field('official_climateCurrentSummary').value[0].col_D, 70);
  assert.deepEqual(field('official_climateProposed').value, []);
  assert.deepEqual(field('official_climateSummary').value, []);
});

test('proposed manual financial schedules reconcile with primary line-item classes', () => {
  const context = { common, totals: { psTotal: 1, mooeTotal: 2, finexTotal: 3, coTotal: 4, climateTotal: 2 }, lineItems: [], formValues: { 'bp-a': { programHistory: [{ period: 'Proposed program', ps: 1, mooe: 2, finex: 3, co: 4 }] } } };
  assert.equal(getFormCompletion('bp-a', context).complete, true);
  context.formValues['bp-a'].programHistory[0].finex = 99;
  assert.match(getFormCompletion('bp-a', context).errors.map((error) => error.message).join(' '), /Reconcile/);
});

test('request data prefills financial schedules without TAG conversion, historical invention or overwriting saved arrays', () => {
  const context = { common, answers: { proposalTier: 'tier2' }, totals: { psTotal: 100.01, coTotal: 50, climateTotal: 20 }, lineItems: [{ category: 'PS', name: 'Salary requirement', amount: 100.01 }, { category: 'CO', name: 'Climate equipment', amount: 50, climateAmount: 20, climateType: 'adaptation', climateTypology: 'Confirmed typology' }, { category: 'TAG', name: 'Unresolved legacy entry', amount: 999 }], formValues: {} };
  const funding = buildFormView('bp-202', context).fields.find((field) => field.key === 'official_papFunding').value;
  assert.equal(funding.length, 2);
  assert.equal(funding.reduce((sum, row) => sum + row.col_D, 0), 150.01);
  assert.ok(funding.every((row) => row.col_B === 0 && row.col_E === '' && row.col_F === ''));
  const climate = buildFormView('bp-207', context).fields;
  assert.equal(climate.find((field) => field.key === 'official_climateProposed').value[0].col_L, 20);
  assert.equal(climate.find((field) => field.key === 'official_climateActual').value.length, 0);
  assert.equal(climate.find((field) => field.key === 'official_climateSummary').value[0].col_D, 20);
  for (const [formId, key] of [['bp-202', 'official_papFunding'], ['bp-207', 'official_climateProposed']]) {
    const saved = { ...context, formValues: { [formId]: { [key]: [] } } };
    assert.deepEqual(buildFormView(formId, saved).fields.find((field) => field.key === key).value, []);
  }
  const missingTier = { ...context, answers: {} };
  assert.equal(buildFormView('bp-207', missingTier).fields.find((field) => field.key === 'official_climateProposed').value[0].col_D, null);
  assert.ok(!getFormCompletion('bp-207', missingTier).errors.some((error) => error.message.includes('Reconcile')));
});

test('report-year tokens rebase once while entered names and unresolved BP206 years retain their literal meaning', { skip: !canExtract }, async (t) => {
  const context = { common: { ...common, fiscalYear: '2028' }, totals: {}, lineItems: [], formValues: { 'bp-a': { programHistory: [{ period: 'Proposed program', tier: 'Tier 2', pap: 'Literal project 2027', ps: 1000, mooe: 0, finex: 0, co: 0 }] } } };
  const labels = buildFormView('bp-100', context).fields.flatMap((field) => field.columns?.map((column) => column.label) || []);
  assert.ok(labels.some((label) => /2026.*ACTUAL/i.test(label)));
  assert.ok(labels.some((label) => /2028.*PROPOSED/i.test(label)));
  const output = await generateBpFormPdf({ formId: 'bp-a', context });
  t.after(() => unlink(output.pdfPath));
  const text = textOf(output.pdfPath);
  assert.match(text, /2026.*Actual obligations/);
  assert.match(text, /2027.*Current program/);
  assert.match(text, /2028.*Proposed program/);
  assert.match(text, /Literal project 2027/);
  const physical = buildFormView('bp-206', context).fields.find((field) => field.key === 'official_physical');
  assert.ok(physical.columns.some((column) => column.label.includes('2024')));
});

for (const form of OFFICIAL_WORKBOOK_FORMS) test(`${form.code} retains entered records in a separate draft PDF`, async (t) => {
  const definition = getDefaultFormDefinition(form.id);
  const values = Object.fromEntries(definition.fields.filter((field) => field.source === 'user' && !field.legacy).map((field) => [field.key, fill(field)]));
  const markers = [];
  for (const [index, field] of definition.fields.filter((field) => field.columns && values[field.key]).entries()) {
    const key = field.key === 'performance' ? 'indicator' : field.key === 'programHistory' ? 'pap' : field.columns.find((column) => column.type === 'text' && !column.outputOnly)?.key;
    if (!key) continue;
    values[field.key] = [0, 1].map((rowIndex) => {
      const marker = `m-${form.id.slice(3)}-${index}-${rowIndex}`;
      markers.push(marker);
      return { ...values[field.key][0], [key]: marker };
    });
  }
  const before = structuredClone(values);
  const output = await generateBpFormPdf({ formId: form.id, context: { common, answers: { proposalTier: 'tier2' }, totals: {}, lineItems: [], formValues: { [form.id]: values } } });
  t.after(() => unlink(output.pdfPath));
  assert.equal((await readFile(output.pdfPath)).subarray(0, 5).toString(), '%PDF-');
  assert.deepEqual(values, before);
  if (canExtract) {
    const text = textOf(output.pdfPath);
    assert.match(text, /DRAFT \/ INTERNAL/);
    assert.match(text, /Fixture institution/);
    assert.match(text, /FY2027/);
    assert.doesNotMatch(text, /\{(?:actualYear|currentYear|fiscalYear|outyearOne|outyearTwo)\}/);
    for (const marker of markers) assert.ok(text.includes(marker), `${marker} must remain in the PDF`);
    assert.ok(!text.includes('Cisco Controller'), 'Workbook samples must never become submission values');
  }
});

test('wide multi-page MOOE PDF repeats identifiers and includes late columns and every record', { skip: !canExtract }, async (t) => {
  const field = getDefaultFormDefinition('bp-201-b').fields.find((field) => field.key === 'official_maintenance');
  const row = fill(field)[0];
  row.col_BG = 9876543.21;
  const records = Array.from({ length: 80 }, (_, i) => ({ ...row, col_A: `record-${String(i).padStart(3, '0')}` }));
  const output = await generateBpFormPdf({ formId: 'bp-201-b', context: { common, totals: {}, lineItems: [], formValues: { 'bp-201-b': { official_maintenance: records } } } });
  t.after(() => unlink(output.pdfPath));
  const text = textOf(output.pdfPath);
  assert.match(text, /9,876\.54321/);
  for (let index = 0; index < records.length; index++) assert.ok(text.includes(`record-${String(index).padStart(3, '0')}`));
  assert.ok((text.match(/column set/g) || []).length > 1);
  assert.ok((text.match(/continued/g) || []).length > 1);
});

test('draft export API authenticates and ignores client totals and definition overrides', async (t) => {
  const resources = { users: [{ id: 7, usr_id: 7, usr_role_id: 1, usr_requesting_unit_id: 1 }], roles: [{ id: 1, role_id: 1, role_group: 'requester' }], 'requesting-units': [{ id: 1, ru_id: 1, ru_name: 'Fixture unit', agency: 'Fixture institution' }], 'fiscal-years': [{ id: 1, fy_year: '2027', fy_is_active: 1 }] };
  const db = { rows: (resource) => resources[resource] || [], find: (resource, id) => (resources[resource] || []).find((row) => String(row.id) === String(id)) };
  const request = async (payload, auth = true) => {
    let response;
    await handleBpFormExports({ db, req: { method: 'POST', headers: auth ? { authorization: 'Bearer mock-token-uid-7' } : {} }, parts: ['bp-form-exports'], payload, res: {}, json: (_, status, body) => { response = { status, ...body }; } });
    return response;
  };
  const payload = { formId: 'bp-a', context: { common, totals: { grandTotal: 999999999 }, lineItems: [{ category: 'FINEX', name: 'Fixture FinEx', amount: 123456.78, costStructure: 'General' }], formValues: {} } };
  assert.equal((await request(payload, false)).status, 401);
  assert.equal((await request({ ...payload, definition: 'forged' })).status, 409);
  const response = await request(payload);
  assert.equal(response.status, 200);
  const path = resolve('mock/generated/forms', response.data.pdfUrl.split('/').at(-1));
  t.after(() => unlink(path));
  if (canExtract) { const text = textOf(path); assert.match(text, /123\.45678/); assert.ok(!text.includes('999,999')); }
});
