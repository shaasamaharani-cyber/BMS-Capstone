import XLSX from 'xlsx';
import { log } from 'node:console';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const workbookPath = resolve(root, 'docs/reference/DBM BP Forms FY2027 - Consolidated.xlsx');
const book = XLSX.readFile(workbookPath, { cellStyles: true, bookFiles: true, cellFormula: true });
if (book.SheetNames.length !== 22) throw new Error('Expected Index plus 21 BP forms; review the workbook before regenerating.');
// Explicitly reviewed table boundaries. Never infer input rows from the example records.
const tables = {
  'BP A': [['matrix', 'Program budget matrix', 'A17:H19', 3]],
  'BP B': [['performance', 'Organisational outcomes and performance indicators', 'A10:H12', 8]],
  'BP C': [['rdcInputs', 'RDC inputs and agency feedback', 'A13:H16', 1]],
  'BP D': [['csoInputs', 'CSO inputs and agency feedback', 'A13:H15', 5]],
  'BP 100': [['revenues', 'General fund revenues', 'A14:K17', 4]],
  'BP 100-A': [['earmarked', 'Earmarked revenues and expenditure', 'A14:Q17', 5]],
  'BP 100-B': [['receipts', 'Off-budgetary and custodial funds', 'A14:M17', 5]],
  'BP 100-C': [['donations', 'Donations and grants', 'A13:M16', 5]],
  'BP 200': [['appropriations', 'Appropriations and obligations', 'A12:D14', 1]],
  'BP 201-A': [['personnel', 'Personnel services by object', 'A15:Y16', 4]],
  'BP 201-B': [['maintenance', 'MOOE by object', 'A15:BH16', 3]],
  'BP 201-C': [['financial', 'Financial expenses — layout pending verification', 'A13:F14', 4]],
  'BP 201-D': [['capital', 'Capital outlays by object', 'A15:Q16', 4]],
  'BP 201-E': [['outyears', 'Outyear requirements by year and tier', 'A13:X17', 2]],
  'BP 202': [['papFunding', '13.1 P/A/P attribution by expense class', 'A36:F37', 1], ['projectCost', '13.3 Total project cost', 'A56:B56', 1], ['operatingCosts', '13.4 Operating costs of infrastructure projects', 'A61:C61', 1], ['components', '13.5 Costing by components', 'A67:F67', 1], ['locations', '13.6 Location of implementation', 'A72:F72', 1]],
  'BP 203': [['implementation', '10.1 Project implementation schedule', 'A28:E29', 1], ['projectCost', '12.1 Total project cost', 'A35:E37', 1], ['comparative', '12.1.a Comparative budget levels', 'A42:H43', 1], ['components', '12.2 Costing by components', 'A47:S49', 1], ['physical', '12.3 Physical targets', 'A54:S57', 19]],
  'BP 204': [['positions', 'Staffing positions by tier and classification', 'A14:Y16', 3]],
  'BP 205': [['retirees', 'Retiree details and benefits', 'A14:M17', 6]],
  'BP 206': [['agencies', '4 Implementing agencies', 'A16:D16', 4], ['funding', '6 Funding requirements', 'A25:F26', 2], ['physical', '7 Physical targets and accomplishments', 'A37:G39', 7]],
  'BP 207': [['climateProposed', 'Proposed climate expenditure by tier', 'A13:L16', 3], ['climateActual', 'Actual climate expenditure', 'A24:F26', 3], ['climateSummary', 'Summary by adaptation and mitigation', 'A41:D41', 1]],
  'BP 300': [['provisions', 'Special provisions and justification', 'A11:C12', 3]],
};
const profileRanges = { 'BP 202': [11, 33], 'BP 203': [11, 26] };
const metadata = [];
const inventory = [];
const titleCase = (str) => str.replaceAll('\n', ' ').replace(/\s+/g, ' ').trim();
for (const [sheetIndex, sheetName] of book.SheetNames.entries()) {
  const sheet = book.Sheets[sheetName];
  const xml = book.files[`xl/worksheets/sheet${sheetIndex + 1}.xml`]?.content?.toString() || '';
  const styleIndices = new Map([...xml.matchAll(/<c\b[^>]*\br="([A-Z]+\d+)"[^>]*\bs="(\d+)"/g)].map((match) => [match[1], Number(match[2])]));
  const cells = Object.entries(sheet).filter(([key]) => !key.startsWith('!')).map(([address, cell]) => {
    const xf = book.Styles.CellXf[styleIndices.get(address) || 0];
    const font = book.Styles.Fonts[xf?.fontId];
    const sample = font?.color?.rgb === '0000FF';
    return { address, kind: cell.f ? 'formula' : sample ? 'example-excluded' : cell.s?.fgColor?.rgb === 'FFFDE7' ? 'blank-input-area' : 'reference-label', ...(sample ? {} : { value: cell.v ?? '', ...(cell.f ? { formula: cell.f } : {}) }) };
  });
  inventory.push({ sheet: sheetName, range: sheet['!ref'], merges: (sheet['!merges'] || []).map(XLSX.utils.encode_range), cells });
  if (sheetName === 'Index') continue;
  const id = sheetName.toLowerCase().replace(' ', '-');
  const notes = cells.filter((cell) => String(cell.value).startsWith('- ')).map((cell) => ({ ref: cell.address, text: cell.value, status: /ASSUMED|added here|still has the year|factor|capped|another agency/i.test(cell.value) ? 'requires-confirmation' : 'workbook-reference' }));
  const cellText = (row, col) => {
    const merged = (sheet['!merges'] || []).find((range) => row >= range.s.r && row <= range.e.r && col >= range.s.c && col <= range.e.c);
    const address = XLSX.utils.encode_cell(merged ? merged.s : { r: row, c: col });
    const found = cells.find((cell) => cell.address === address);
    return found?.kind === 'example-excluded' ? '' : titleCase(String(found?.value ?? ''));
  };
  const sections = tables[sheetName].map(([key, title, rangeText, firstAmount]) => {
    const range = XLSX.utils.decode_range(rangeText);
    const columns = [];
    for (let col = range.s.c; col <= range.e.c; col++) {
      const path = [];
      for (let row = range.s.r; row <= range.e.r; row++) {
        const text = cellText(row, col);
        if (text && !/^\(\d+\)$/.test(text) && !path.includes(text)) path.push(text);
      }
      const letter = XLSX.utils.encode_col(col);
      let type = col >= firstAmount ? 'currency' : 'text';
      const leaf = path.at(-1) || `Column ${letter} (pending verification)`;
      if (/REMARKS|feedback|justification|explanation/i.test(leaf)) type = 'textarea';
      if (sheetName === 'BP 205' && col >= 3 && col <= 5) type = 'date';
      if (sheetName === 'BP 205' && [7, 8, 10, 11].includes(col)) type = 'number';
      if (sheetName === 'BP 204' && col >= 3 && col <= 6) type = 'number';
      if (sheetName === 'BP 204' && col === 8) type = 'text';
      const total = /^(TOTAL|GRAND TOTAL|TOTAL \d{4} Requirements)$/i.test(leaf) || /Total (Other Compensation|Compensation|No\. of Months|Salary Based)/i.test(leaf);
      columns.push({ key: `col_${letter}`, label: path.join(' / ') || leaf, type, reference: `${sheetName}!${letter}${range.s.r + 1}:${letter}${range.e.r + 1}`, headingPath: path, outputOnly: total, verification: sheetName === 'BP 201-C' ? 'assumed' : 'workbook-transcription' });
    }
    return { key, title, reference: `${sheetName}!${rangeText}`, columns };
  });
  const profile = profileRanges[sheetName] ? cells.filter((cell) => {
    const pos = XLSX.utils.decode_cell(cell.address);
    return pos.c === 0 && pos.r >= profileRanges[sheetName][0] - 1 && pos.r < profileRanges[sheetName][1] && /^\d+\./.test(String(cell.value));
  }).map((cell) => ({ key: `profile_${cell.address}`, label: titleCase(cell.value), reference: `${sheetName}!${cell.address}`, type: /Date|Period/.test(cell.value) ? 'text' : /Cost/.test(cell.value) ? 'currency' : /Ranking/.test(cell.value) ? 'number' : /Description|Purpose|Beneficiaries/.test(cell.value) ? 'textarea' : 'text' })) : [];
  metadata.push({ id, sheet: sheetName, code: sheet.A5.v, title: sheet.A1.v.replace(/^BP FORM [\w-]+ - /, ''), units: ['BP 204', 'BP 205'].includes(sheetName) ? 'pesos' : sheetName === 'BP B' || sheetName === 'BP 300' ? 'indicator/text' : 'thousand-pesos', sections, profile, notes, verification: sheetName === 'BP 201-C' ? 'assumed-layout-pending' : 'workbook-transcription-pdf-comparison-pending' });
}
const stamp = { workbook: 'docs/reference/DBM BP Forms FY2027 - Consolidated.xlsx', sha256: createHash('sha256').update(readFileSync(workbookPath)).digest('hex'), sheetCount: inventory.length, formCount: metadata.length };
writeFileSync(resolve(root, 'docs/bp_forms_workbook_inventory.json'), JSON.stringify({ ...stamp, sheets: inventory }, null, 2) + '\n');
writeFileSync(resolve(root, 'dost-bms-web/src/bp_forms/official_workbook_manifest.js'), `// Generated by scripts/audit-bp-workbook.mjs; headings only, no example records.\nexport const WORKBOOK_REFERENCE = ${JSON.stringify(stamp, null, 2)};\nexport const OFFICIAL_WORKBOOK_FORMS = ${JSON.stringify(metadata, null, 2)};\n`);
let report = '# FY2027 BP workbook field mapping\n\nPrincipal reference: `' + stamp.workbook + '`. SHA-256: `' + stamp.sha256 + '`. Read **22 worksheets / 21 form tabs**. Blue-font example values are excluded from the inventory and runtime definitions. Static headings, notes, numbering, sample hierarchy rows and totals are not requester inputs. All source locations below are stable worksheet references; government object codes are not inferred from examples.\n\n';
report += 'The workbook is a transcription of DBM-OSEC submissions, not a DOST responsibility specification. NBM 156 remains the instruction reference. `workbook-transcription` is evidence of a heading, not certification of PDF fidelity. BP 201-C is explicitly ASSUMED. BP B differs from the NBM blank template (Data Source/Remarks versus its additional 2025 GAA column). BP 206 retains an older printed target-year sequence; it must not silently be rebased. BP 204 and BP 205 use pesos. Sample signatory titles and benefit rates are not DOST defaults.\n\n';
report += '| Form | Sections | Columns | Units | Export verification |\n| --- | --- | ---: | --- | --- |\n';
for (const form of metadata) report += `| ${form.code} | ${form.sections.map((s) => s.title).join('; ')} | ${form.sections.reduce((n, s) => n + s.columns.length, 0)} | ${form.units} | ${form.verification} |\n`;
for (const form of metadata) {
  report += `\n## ${form.code} — ${form.title}\n\n`;
  for (const section of form.sections) {
    report += `\n### ${section.title}\n\nReference: \`${section.reference}\`. Repeatable records; headings are output labels.\n\n| Stable column ID | Heading path | Type | Treatment |\n| --- | --- | --- | --- |\n`;
    for (const column of section.columns) report += `| \`${form.id}.${section.key}.${column.key}\` | ${column.label.replaceAll('|', '/')} | ${column.type} | ${column.outputOnly ? 'Calculated/output only; formula needs a verified operand mapping' : 'Input or mapped existing data; office responsibility configurable'} |\n`;
  }
  if (form.profile.length) report += '\nProfile inputs: ' + form.profile.map((field) => `\`${field.reference}\` ${field.label}`).join('; ') + '.\n';
  report += '\nReference notes and unresolved details:\n\n' + form.notes.map((note) => `- \`${form.sheet}!${note.ref}\` (${note.status}): ${note.text.replace(/^- /, '')}`).join('\n') + '\n';
}
report += '\n## Initial BMS gaps and staged mapping\n\nThe existing BMS has shared headers and partial dynamic schedules, with native schema flattening for other forms. Native flattening loses repeatable hierarchy. Validation caps definitions at 150 fields and 40 columns, while BP 201-B alone has 60 columns. Tables, formula cells and output labels require separate treatment. The new official registry will preserve source references while cycle configuration supplies overlays and custom additions. Existing values/definitions stay in submitted snapshots. Stage reports in `bp_forms_excel_implementation.md` record implementation status and actual tests; this inventory alone does not claim implementation.\n';
const { getDefaultFormDefinition } = await import('../src/bp_forms/bp_form_fields.js');
report += '\n## Implemented runtime mapping\n\nThe workbook paths above describe source locations. The following are the actual persisted BMS keys, including preserved aliases. Blank references mean shared/internal/supporting data, not a newly asserted official requirement. Column order is independent of these stable keys. Versioned defaults only use real request data; historical periods and unconfirmed factors remain blank. All exports remain draft pending layout acceptance.\n';
for (const form of metadata) {
  const definition = getDefaultFormDefinition(form.id);
  report += `\n### ${form.code} runtime fields\n\n| Stored field path | Type / source | Reference | Calculation / prefill |\n| --- | --- | --- | --- |\n`;
  const add = (fields, prefix = form.id) => {
    for (const field of fields) {
      report += `| \`${prefix}.${field.key}\` | ${field.type} / ${field.source || 'user'}${field.legacy ? ' (legacy/internal)' : ''} | ${field.reference || 'Shared/internal'} | ${field.calculation ? `${field.calculation}(${field.operands.join(', ')})` : field.recordSource || field.canonical || field.derived || (field.outputOnly ? 'Output only; operand/unit mapping unresolved' : 'Explicit office input')} |\n`;
      if (field.columns) add(field.columns, `${prefix}.${field.key}[]`);
    }
  };
  add(definition.fields);
}
writeFileSync(resolve(root, 'docs/bp_forms_field_mapping.md'), report);
log(JSON.stringify({ ...stamp, forms: metadata.map((form) => ({ id: form.id, sections: form.sections.length, columns: form.sections.reduce((n, section) => n + section.columns.length, 0) })), sampleCellsExcluded: inventory.reduce((n, sheet) => n + sheet.cells.filter((cell) => cell.kind === 'example-excluded').length, 0) }, null, 2));
