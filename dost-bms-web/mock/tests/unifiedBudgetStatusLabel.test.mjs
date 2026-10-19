import test from 'node:test';
import assert from 'node:assert/strict';
import { getUnifiedBudgetStatusLabel } from '../../src/utils/unified_budget_workflow_lanes.js';

const step = (stepKey, type, status, title = stepKey) => ({ stepKey, type, status, title });

test('consolidated budget status words follow the as-is workflow', () => {
  const director = (status) => step('finance_planning_director', 'internal_approval', status, 'Finance / Planning Director');

  assert.equal(getUnifiedBudgetStatusLabel('APPROVED', [director('done'), step('dbm', 'external_approval', 'current', 'DBM')]), 'Director approved');
  assert.equal(getUnifiedBudgetStatusLabel('approved', [director('done'), step('president', 'external_approval', 'done', 'President')]), 'Approved');
  assert.equal(getUnifiedBudgetStatusLabel('REJECTED', [step('draft', 'system', 'current'), director('rejected')]), 'Returned');
  assert.equal(getUnifiedBudgetStatusLabel('rejected', [step('draft', 'system', 'current'), step('dbm', 'external_approval', 'rejected', 'DBM')]), 'Rejected by DBM');
  assert.equal(getUnifiedBudgetStatusLabel('pending', []), 'PENDING');
});
