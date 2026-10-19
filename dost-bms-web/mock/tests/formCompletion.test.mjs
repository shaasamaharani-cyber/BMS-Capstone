import test from 'node:test';
import assert from 'node:assert/strict';
import { getFormCompletion, getFieldValueError, buildFormView, getDefaultFormDefinition } from '../../src/bp_forms/bp_form_fields.js';
import { OFFICIAL_WORKBOOK_FORMS } from '../../src/bp_forms/official_workbook_manifest.js';
import { laterStageOwner, requesterSignoffChanges, preserveSignoffValues } from '../../src/bp_forms/field_ownership.js';
import { calculateValue } from '../../src/bp_forms/form_schema.js';

const field = (key, type = 'text', extra = {}) => ({ key, label: key, source: 'user', type, ...extra });
const completion = (fields, values, extra = {}) => getFormCompletion('fixture', { common: {}, formDefinitions: { fixture: { fields } }, formValues: { fixture: values }, ...extra });

test('completion counts required nested inputs and empty required rows honestly; optional blanks do not block', () => {
  const fields = [field('title', 'text', { required: true }), field('rows', 'group', { required: true, columns: [field('name', 'text', { required: true }), field('amount', 'currency', { required: true }), field('notes'), field('nested', 'group', { columns: [field('target', 'number', { required: true }), field('note')] })] }), field('optional')];
  const empty = completion(fields, { title: '  ', rows: [{}] });
  assert.equal(empty.complete, false); assert.equal(empty.filled, 0); assert.equal(empty.missing, 4);
  assert.equal(completion([fields[1]], { rows: [{ id: 'empty-row-identity', total: 0 }] }).filled, 0, 'Identity and calculated cells alone do not complete an empty row');
  const partial = completion(fields, { title: 'Project', rows: [{ name: 'Research', amount: 0, nested: [{ target: '', note: 'Used row' }] }] });
  assert.equal(partial.total, 5); assert.equal(partial.filled, 4); assert.equal(partial.missing, 1); assert.equal(partial.complete, false);
  const complete = completion(fields, { title: 'Project', rows: [{ name: 'Research', amount: 0, nested: [{ target: 0 }] }] });
  assert.equal(complete.missing, 0); assert.equal(complete.complete, true);
  assert.equal(completion([field('optional', 'table', { columns: [field('requiredInUsedRow', 'text', { required: true })] })], { optional: [{}] }).complete, true);
  assert.equal(completion([field('optional', 'table', { columns: [field('requiredInUsedRow', 'text', { required: true }), field('note')] })], { optional: [{ note: 'Used row' }] }).missing, 1);
  assert.equal(completion([fields[1]], { rows: 'not an array' }).complete, false, 'Malformed tables must not be normalised into optional blanks');
  assert.equal(completion([fields[1]], { rows: [null] }).complete, false, 'Malformed rows produce validation errors, not exceptions');
});

test('prefill counts actual values, confirmed zero is valid, placeholders and empty calculated operands are not data', () => {
  const fields = [{ ...field('agency'), source: 'canonical', canonical: 'agency', required: true }, { ...field('amount', 'currency'), source: 'derived', derived: 'grandTotal' }, field('optionalNumber', 'number')];
  assert.equal(completion(fields, {}, { common: { agency: '' }, derived: { grandTotal: 0 } }).missing, 1);
  assert.equal(completion(fields, {}, { common: { agency: 'Fixture institution' }, totals: { grandTotal: 0 } }).complete, true);
  for (const value of ['', ' ', '-', 'TBD', 'Awaiting data', 'P/A/P awaiting confirmation']) assert.ok(getFieldValueError(field('required', 'text', { required: true }), value));
  assert.equal(getFieldValueError(field('amount', 'currency', { required: true }), 0), '');
  assert.equal(calculateValue({ calculation: 'sum', operands: ['a', 'b'] }, { a: '  ', b: 5 }), null);
  const invalidOptional = completion([field('optional', 'number')], { optional: 'wrong' });
  assert.equal(invalidOptional.missing, 0); assert.equal(invalidOptional.complete, false, 'No missing mandatory fields is distinct from no validation errors');
});

test('conditional nested requirements activate only with the applicable proposal answer', () => {
  const conditional = field('climate', 'group', { required: true, visibleWhen: { match: 'all', conditions: [{ id: 'climate', questionId: 'hasClimate', operator: 'equals', value: 'yes' }] }, columns: [field('code', 'text', { required: true })] });
  assert.equal(completion([conditional], {}, { answers: { hasClimate: 'no' } }).missing, 0);
  assert.equal(completion([conditional], {}, { answers: { hasClimate: 'yes' } }).missing, 1);
  assert.equal(completion([conditional], { climate: [{ code: '' }] }, { answers: { hasClimate: 'yes' } }).missing, 2);
  assert.equal(completion([conditional], { climate: [{ code: 'Confirmed typology' }] }, { answers: { hasClimate: 'yes' } }).complete, true);
});

test('all 21 generated forms retain preparer input, lock later-office metadata, and do not require certification for requester submission', () => {
  for (const form of OFFICIAL_WORKBOOK_FORMS) {
    const definition = getDefaultFormDefinition(form.id);
    const context = { common: {}, totals: {}, lineItems: [], formValues: {}, formDefinitions: { [form.id]: definition } };
    const view = buildFormView(form.id, context);
    for (const signer of definition.fields.filter(laterStageOwner)) {
      const rendered = view.fields.find((f) => f.key === signer.key);
      assert.equal(rendered.locked, true, `${form.id}.${signer.key}`);
      assert.equal(rendered.required, false);
      const check = completion([{ ...signer, required: true }], {});
      assert.equal(check.total, 0); assert.equal(check.complete, true);
    }
    for (const preparer of view.fields.filter((f) => ['preparedBy', 'preparedTitle', 'budgetOfficer', 'planningOfficer'].includes(f.key))) assert.equal(preparer.locked, false, `${form.id}.${preparer.key}`);
  }
  const historical = { 'bp-a': { approvedBy: 'Old printed name', preparedBy: 'Preparer' } };
  assert.equal(requesterSignoffChanges(historical, historical).length, 0);
  assert.equal(requesterSignoffChanges({ 'bp-a': { approvedBy: 'New name' } }, historical).length, 1);
  assert.equal(requesterSignoffChanges({ 'bp-a': { rows: [{ certifiedBy: 'Forged' }] } }).length, 1);
  assert.equal(preserveSignoffValues({}, historical)['bp-a'].approvedBy, 'Old printed name');
});

test('A/B/202 blank optional schedules remain honestly optional while configured required rows are enforced', () => {
  for (const id of ['bp-a', 'bp-b', 'bp-202']) {
    const definition = getDefaultFormDefinition(id);
    const tables = definition.fields.filter((f) => f.columns && !f.legacy);
    assert.ok(tables.length);
    for (const table of tables) {
      assert.equal(table.required, false, `${id}.${table.key} requires DOST policy before becoming mandatory`);
      const required = { ...table, required: true };
      assert.equal(completion([required], { [table.key]: [{}] }).complete, false, `${id}.${table.key} cannot count an empty row as completed`);
    }
  }
  const def = getDefaultFormDefinition('bp-202');
  const pap = def.fields.find((f) => f.key === 'official_papFunding');
  const context = { common: { fiscalYear: '2027', programPap: 'Science' }, answers: { proposalTier: 'tier2' }, totals: { psTotal: 100, expenseTotal: 100 }, lineItems: [{ name: 'Staff', category: 'PS', amount: 100 }], formValues: {} };
  const prefills = buildFormView('bp-202', context).fields.find((f) => f.key === pap.key);
  assert.equal(prefills.value[0].col_C, 100); assert.equal(prefills.locked, false, 'Allocation may intentionally be edited');
});
