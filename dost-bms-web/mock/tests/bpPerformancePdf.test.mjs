import assert from 'node:assert/strict';
import test from 'node:test';
import { existsSync } from 'node:fs';
import { readFile, unlink } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { BPFormBSchema } from '../../src/forms/schemas/default_schemas.js';
import { getDefaultFormDefinition } from '../../src/bp_forms/bp_form_fields.js';
import { generateFormEntryPdf } from '../server/services/formEntryPdf.mjs';
import { generateBudgetRequestVersionPdf } from '../server/services/budgetRequestVersionPdf.mjs';

test('Form B PDF reports retain both NEP tiers, indicator units, signatories and legacy data', async (t) => {
  const values = {
    performance: [{ outcome: 'Outcome A', program: 'Science services', subprogram: 'Laboratories', indicatorType: 'Output indicator', indicator: 'Reports delivered', actualTarget: '2025-target-80%', actualAccomplishment: '2025-actual-85%', currentTarget: '2026-target-90%', baseline: '% of reports', proposedTier1: 'TierOne92Percent', proposedTier2: 'TierTwo95Percent', proposedTarget: 'LegacyUnassigned99' }],
    budgetOfficer: 'Budget fixture name', planningOfficer: 'Planning fixture name', agencyHead: 'Agency fixture name', approvalDate: '2026-10-14',
  };
  const native = await generateFormEntryPdf({ entry: { id: randomUUID(), header: values, sections: { performance: values.performance, requirements: [{ name: 'PreservedFinancialSample', total: 100 }] } }, schemaRecord: BPFormBSchema });
  const unified = await generateBudgetRequestVersionPdf({ version: { brv_br_id: randomUUID(), brv_version_number: 1 }, snapshot: { unifiedRequest: { requiredForms: [{ formId: 'bp-b' }], formDefinitions: { 'bp-b': getDefaultFormDefinition('bp-b') }, common: { fiscalYear: '2027' }, formValues: { 'bp-b': values } } } });
  t.after(async () => { for (const path of [native.pdfPath, unified.pdfPath]) await unlink(path); });
  for (const path of [native.pdfPath, unified.pdfPath]) assert.equal((await readFile(path)).subarray(0, 5).toString(), '%PDF-');
  const windowsTool = 'C:/Program Files/Git/mingw64/bin/pdftotext.exe';
  const extractor = existsSync(windowsTool) ? windowsTool : 'pdftotext';
  const probe = spawnSync(extractor, ['-v']);
  await t.test('extract and verify all printed target and certification fields', { skip: Boolean(probe.error) }, () => {
    for (const path of [native.pdfPath, unified.pdfPath]) {
      const result = spawnSync(extractor, ['-layout', path, '-'], { encoding: 'utf8' });
      assert.equal(result.status, 0, result.stderr);
      const text = result.stdout.replace(/\s+/g, ' ');
      for (const expected of ['2025 GAA targets', '2025 actual accomplishments', '2026 GAA targets', '2027 NEP targets', 'TierOne92Percent', 'TierTwo95Percent', 'LegacyUnassigned99', 'Budget fixture name', 'Planning fixture name', 'Agency fixture name', '14/10/2026']) assert.ok(text.includes(expected), `${expected} must be in ${path}`);
      assert.match(result.stdout, /tier unassigned/);
      assert.match(result.stdout, /signature/i);
      if (path === native.pdfPath) assert.match(result.stdout, /PreservedFinancialSample/);
    }
  });
});
