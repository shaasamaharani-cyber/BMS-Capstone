import test from 'node:test';
import assert from 'node:assert/strict';
import { applyApproveToWorkflow, applyRejectToWorkflow } from '../server/services/unifiedBudgets.mjs';
import { DEFAULT_FORM_SCHEMAS } from '../../src/forms/schemas/default_schemas.js';

const steps = () => [
  { stepKey: 'draft', title: 'Internal Consolidation', status: 'done' },
  { stepKey: 'finance_planning_director', title: 'Finance / Planning Director', status: 'current' },
  { stepKey: 'usec', title: 'USEC', status: 'locked' },
  { stepKey: 'secretary', title: 'Secretary', status: 'locked' },
  { stepKey: 'dbm', title: 'DBM', status: 'locked' },
];

test('director approval says USEC and Secretary are not recorded in BMS', () => {
  const byKey = Object.fromEntries(applyApproveToWorkflow(steps(), 'Dung Tran').map((step) => [step.stepKey, step]));
  assert.equal(byKey.finance_planning_director.actionText, 'Approved by Dung Tran');
  assert.equal(byKey.usec.actionText, 'Not recorded in BMS');
  assert.equal(byKey.secretary.actionText, 'Not recorded in BMS');
  assert.equal(byKey.dbm.status, 'current');
});

test('a director return reads "Returned by", not "Rejected by"', () => {
  const director = applyRejectToWorkflow(steps(), 'Dung Tran').find((step) => step.stepKey === 'finance_planning_director');
  assert.equal(director.actionText, 'Returned by Dung Tran');
});

test('no form template id contains "/", which the API cannot route', () => {
  assert.deepEqual(DEFAULT_FORM_SCHEMAS.filter((schema) => schema.id.includes('/')).map((schema) => schema.id), []);
});
