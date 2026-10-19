import { mkdir, copyFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { log } from 'node:console';
import process from 'node:process';
import { OFFICIAL_WORKBOOK_FORMS } from '../src/bp_forms/official_workbook_manifest.js';
import { getDefaultFormDefinition } from '../src/bp_forms/bp_form_fields.js';
import { computeBudgetLineItemTotals } from '../src/utils/budget_financials.js';
import { generateBpFormPdf } from '../mock/server/services/bpFormPdf.mjs';

if (!process.argv.includes('--synthetic')) throw new Error('Use --synthetic to generate clearly marked test artifacts; no database is read or written.');
const directory = resolve(import.meta.dirname, '../../.tmp/bp-previews');
await mkdir(directory, { recursive: true });
const common = { department: 'Department of Science and Technology', agency: 'SYNTHETIC TEST INSTITUTION', operatingUnit: 'SYNTHETIC TEST UNIT', fiscalYear: '2027', projectName: 'Synthetic layout test', programPap: 'Synthetic program', implementingAgency: 'SYNTHETIC TEST INSTITUTION', projectDescription: 'Synthetic layout test only. These values do not represent any DOST submission.', objectives: 'Check field placement and pagination.', prexcCode: '' };
const lineItems = ['PS', 'MOOE', 'FINEX', 'CO'].map((category, index) => ({ category, name: `Synthetic ${category} requirement`, costStructure: 'General Administration and Support', amount: (index + 1) * 10000.01, climateAmount: ['MOOE', 'CO'].includes(category) ? 1000 : 0, climateType: 'adaptation', climateTypology: 'Awaiting independently verified typology' }));
const input = (field) => field.columns ? [Object.fromEntries(field.columns.filter((column) => !column.calculation && !column.outputOnly).map((column) => [column.key, input(column)]))] : field.options ? field.options[0] : field.type === 'checkbox' ? false : field.type === 'date' ? '2026-10-14' : ['number', 'currency'].includes(field.type) ? field.key === 'terminalLeaveFactor' ? '' : 1000 : /UACS|PREXC|Code/i.test(field.label) ? '' : `Synthetic ${field.key}`;
const files = [];
for (const form of OFFICIAL_WORKBOOK_FORMS) {
  const definition = getDefaultFormDefinition(form.id);
  const values = Object.fromEntries(definition.fields.filter((field) => field.source === 'user' && !field.legacy && !field.recordSource).map((field) => [field.key, input(field)]));
  const result = await generateBpFormPdf({ formId: form.id, context: { common, answers: { proposalTier: 'tier2' }, lineItems, totals: computeBudgetLineItemTotals(lineItems), formValues: { [form.id]: values }, synthetic: true } });
  const path = resolve(directory, `${form.id}.pdf`);
  await copyFile(result.pdfPath, path);
  files.push({ formId: form.id, path, status: result.verification });
}
await writeFile(resolve(directory, 'index.json'), JSON.stringify(files, null, 2));
log(`Generated ${files.length} synthetic draft previews in ${directory}. No submission records were changed.`);
