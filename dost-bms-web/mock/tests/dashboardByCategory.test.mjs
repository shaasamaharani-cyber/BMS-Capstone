import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildDashboardData } from '../server/services/dashboard.mjs';

const seed = JSON.parse(readFileSync(new URL('../db.json', import.meta.url), 'utf8'));
const db = { rows: (strName) => seed[strName] || [] };

test('amounts by expense class add up to the Financial Overview totals', () => {
  for (const objFilters of [{ period: 'annually' }, { period: 'quarterly' }, { period: 'annually', fiscalYearId: '6' }, { period: 'annually', requestingUnitId: '2' }]) {
    const { monitoring } = buildDashboardData(db, objFilters);
    const objTotals = Object.fromEntries(monitoring.summaryCards.map((objCard) => [objCard.key, objCard.value]));
    for (const strKey of ['appropriation', 'allotment', 'obligation', 'disbursement']) {
      const dblSum = monitoring.byCategory.reduce((dblTotal, objRow) => dblTotal + objRow[strKey], 0);
      assert.ok(Math.abs(dblSum - objTotals[strKey]) < 0.05, `${strKey} for ${JSON.stringify(objFilters)}: ${dblSum} vs ${objTotals[strKey]}`);
    }
  }
});

test('the class with the highest allotment can be read from the rows', () => {
  const { monitoring } = buildDashboardData(db, { period: 'annually' });
  const objTop = [...monitoring.byCategory].sort((objA, objB) => objB.allotment - objA.allotment)[0];
  assert.ok(objTop.allotment > 0);
  assert.deepEqual(Object.keys(objTop).sort(), ['allotment', 'appropriation', 'category', 'disbursement', 'obligation']);
});
