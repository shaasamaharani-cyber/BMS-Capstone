import test from 'node:test';
import assert from 'node:assert/strict';
import { expectedPaceForPeriod } from '../../src/utils/spending_pace.js';
import { handleSettings } from '../server/routes/settings.mjs';

test('expected spending pace follows the quarter in the report period', () => {
  assert.equal(expectedPaceForPeriod('Q1 2026 (Jan-Mar)', 25), 25);
  assert.equal(expectedPaceForPeriod('Q3 2026 (Jul-Sep)', 25), 75);
  assert.equal(expectedPaceForPeriod('Q4 2026 (Oct-Dec)', 30), 100, 'never above 100%');
  assert.equal(expectedPaceForPeriod('Annual 2026', 25), null, 'no quarter, no pace check');
});

function settingsFixture() {
  const rows = new Map(Object.entries({
    users: [{ id: 1, usr_id: 1, usr_name: 'Main Administrator', usr_role_id: 1 }],
    roles: [{ id: 1, role_id: 1, role_group: 'admin', role_name: 'main_administrator' }],
  }));
  const db = {
    rows: (strName) => structuredClone(rows.get(strName) || []),
    find: (strName, id) => structuredClone((rows.get(strName) || []).find((row) => String(row.id) === String(id)) || null),
    nextId: (strName) => Math.max(0, ...db.rows(strName).map((row) => Number(row.id))) + 1,
    upsert: (strName, id, value) => rows.set(strName, [...db.rows(strName).filter((row) => String(row.id) !== String(id)), structuredClone(value)]),
  };
  return async (method, payload = {}) => {
    let objResponse;
    await handleSettings({ db, parts: ['settings'], payload, req: { method, headers: { authorization: 'Bearer mock-token-uid-1' } }, res: {}, json: (_, status, body) => { objResponse = { status, ...body }; } });
    return objResponse;
  };
}

test('the spending pace is a setting the admin can change, kept when not sent', async () => {
  const request = settingsFixture();
  assert.equal((await request('GET')).data.pace_per_quarter, 25);
  const base = { attention_below: 90, amber_below: 75, due_soon_days: 14 };
  assert.equal((await request('PUT', { ...base, pace_per_quarter: 30 })).data.pace_per_quarter, 30);
  assert.equal((await request('PUT', base)).data.pace_per_quarter, 30, 'older clients that do not send it keep the saved value');
  assert.equal((await request('PUT', { ...base, pace_per_quarter: 0 })).status, 422);
  assert.equal((await request('PUT', { ...base, pace_per_quarter: 101 })).status, 422);
});
