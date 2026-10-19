import PDFDocument from 'pdfkit';
import { createWriteStream } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { buildFormView } from '../../../src/bp_forms/bp_form_fields.js';
import { isRepeatingField, isNumericField, formatPesos } from '../../../src/bp_forms/form_schema.js';
import { performanceYearLabel } from '../../../src/bp_forms/bp_form_b.js';

const OUTPUT = resolve(import.meta.dirname, '../../generated/forms');
const pageSizes = { 'bp-a': [865, 567], 'bp-b': [842, 551], 'bp-200': [595, 842], 'bp-202': [612, 936], 'bp-203': [612, 936], 'bp-206': [595, 842], 'bp-207': [865, 567] };
const officialTitles = {
  'bp-a': 'Program Budget Matrix', 'bp-b': 'Agency Performance Measures',
  'bp-c': 'Summary of RDC Inputs and Recommendations on Agency Programs and Projects',
  'bp-d': 'Report of CSO Inputs on Ongoing and New Spending Projects and Activities',
  'bp-100': 'Statement of Revenues — General Fund', 'bp-100-a': 'Statement of Revenues and Expenditures — Earmarked Revenues',
  'bp-100-b': 'Statement of Other Receipts and Expenditures — Off-Budgetary and Custodial Funds',
  'bp-100-c': 'Statement of Donations and Grants',
  'bp-200': 'Comparison of Appropriations and Obligations',
  'bp-201-a': 'Obligations, by Object of Expenditures — Personnel Services',
  'bp-201-b': 'Obligations, by Object of Expenditures — Maintenance and Other Operating Expenses',
  'bp-201-c': 'Obligations, by Object of Expenditures — Financial Expenses',
  'bp-201-d': 'Obligations, by Object of Expenditures — Capital Outlays',
  'bp-201-e': 'Summary of Outyear Requirements', 'bp-202': 'Profile for Tier 2 Budget Proposals',
  'bp-203': 'Profile for Foreign-Assisted Projects', 'bp-204': 'Staffing Summary of Non-Permanent Positions',
  'bp-205': 'List of Retirees — For Payment of Terminal Leave and Retirement Gratuity Benefits',
  'bp-206': 'Convergence Programs and Projects', 'bp-207': 'Climate Change Expenditures',
  'bp-300': 'Proposed Provisions',
};
const textValue = (value) => value == null || value === '' ? '' : typeof value === 'boolean' ? value ? 'Yes' : 'No' : typeof value === 'object' ? value.name || JSON.stringify(value) : String(value);
const currentLabel = (label, year) => performanceYearLabel(label, year);

function wrap(doc, value, width, size = 8) {
  doc.font('Helvetica').fontSize(size);
  const lines = [];
  for (const paragraph of textValue(value).split('\n')) {
    let line = '';
    for (const character of paragraph) {
      if (line && doc.widthOfString(line + character) > width) {
        const space = line.lastIndexOf(' ');
        if (space > 0) { lines.push(line.slice(0, space)); line = line.slice(space + 1); }
        else { lines.push(line); line = ''; }
      }
      line += character;
    }
    lines.push(line);
  }
  return lines.length ? lines : [''];
}

function heading(doc, view, context, continuation = '') {
  const width = doc.page.width - 48;
  doc.x = 24; doc.y = 22;
  doc.font('Helvetica-Bold').fontSize(9).text(view.formId.toUpperCase().replace('BP-', 'BP FORM '), 24, 22, { width, align: 'right' });
  const title = view.officialTitle || view.formId;
  doc.fontSize(12).text(title.toUpperCase(), 24, 40, { width, align: 'center' });
  doc.font('Helvetica').fontSize(8).text(`FY${context.common?.fiscalYear || '____'}${continuation ? ` — ${currentLabel(continuation, context.common?.fiscalYear)}` : ''}`, { width, align: 'center' });
  doc.fillColor('#8a2525').fontSize(7).text('DRAFT / INTERNAL — layout verification and office certification pending', { width, align: 'center' }).fillColor('black');
  const common = context.common || {};
  doc.fontSize(8).text(`Department: ${common.department || '____________________'}`, 24, doc.y + 9, { width, align: 'left' });
  doc.text(`Agency: ${common.agency || '____________________'}    Operating unit: ${common.operatingUnit || '____________________'}`, { width });
  doc.text(`Reporting scope: ${context.reportingScope || 'Individual institution'}    ${view.official.units === 'thousand-pesos' ? 'Amounts in thousand pesos (stored values remain pesos)' : view.official.units === 'pesos' ? 'Amounts in pesos' : 'Targets in indicator units; no financial aggregation'}`, { width });
  const historicalPeriod = ['Actual obligations', 'Current program'].includes(view.fields.find((field) => field.key === 'reportPeriod')?.value);
  if (common.appropriationSource || view.fields.some((field) => ['reportRegion', 'reportTier'].includes(field.key) && field.value)) doc.text(`Authorization: ${common.appropriationSource || ''}   Region: ${view.fields.find((field) => field.key === 'reportRegion')?.value || ''}${historicalPeriod ? '' : `   Tier: ${view.fields.find((field) => field.key === 'reportTier')?.value || ''}`}`, { width });
  if (view.fields.some((field) => field.key === 'reportPeriod')) {
    const period = view.fields.find((field) => field.key === 'reportPeriod')?.value;
    const offset = { 'Actual obligations': -2, 'Current program': -1, 'Total proposed program': 0 }[period];
    doc.text(`Reporting period: ${period || 'Awaiting confirmation'}${offset !== undefined && Number(common.fiscalYear) ? ` — ${Number(common.fiscalYear) + offset}` : ''}`, { width });
  }
  doc.moveDown(0.6);
}

function page(doc, view, context, label) {
  doc.addPage({ size: pageSizes[view.formId] || [842, 595], margins: { top: 24, bottom: 28, left: 24, right: 24 } });
  heading(doc, view, context, label);
}

function writeRows(doc, view, context, section, columns, rows, { totals = true, totalLabel = 'GRAND TOTAL' } = {}) {
  if (!columns.length) return;
  const identifiers = columns.filter((column) => !isNumericField(column)).slice(0, 3);
  const maxColumns = view.formId === 'bp-207' ? 12 : 11;
  const bands = columns.length <= maxColumns ? [columns] : [];
  if (!bands.length) {
    const remaining = columns.filter((column) => !identifiers.includes(column));
    for (let index = 0; index < remaining.length; index += maxColumns - identifiers.length) bands.push([...identifiers, ...remaining.slice(index, index + maxColumns - identifiers.length)]);
  }
  for (const [bandIndex, band] of bands.entries()) {
    if (bandIndex || doc.y > doc.page.height - 160) page(doc, view, context, `${section.title} — column set ${bandIndex + 1}/${bands.length}`);
    const width = doc.page.width - 48;
    const weights = band.map((column) => isNumericField(column) ? 1 : columns.length < 5 ? 2 : 2.2);
    const sizes = weights.map((weight) => width * weight / weights.reduce((a, b) => a + b, 0));
    const paths = band.map((column) => (column.headingPath?.length ? column.headingPath : column.label.split(' / ')).map((label) => currentLabel(label, context.common?.fiscalYear)));
    const depth = Math.max(...paths.map((path) => path.length));
    const headerGroups = [];
    const levelHeights = Array(depth).fill(20);
    for (let level = 0; level < depth; level++) {
      for (let start = 0; start < band.length;) {
        if (level >= paths[start].length) { start++; continue; }
        const prefix = JSON.stringify(paths[start].slice(0, level + 1));
        let end = start + 1;
        while (end < band.length && paths[start].length > level + 1 && paths[end].length > level + 1 && JSON.stringify(paths[end].slice(0, level + 1)) === prefix) end++;
        const groupWidth = sizes.slice(start, end).reduce((sum, size) => sum + size, 0);
        const lines = wrap(doc, paths[start][level], groupWidth - 8, 7);
        levelHeights[level] = Math.max(levelHeights[level], lines.length * 9 + 10);
        headerGroups.push({ level, start, end, lines, terminal: level === paths[start].length - 1, width: groupWidth });
        start = end;
      }
    }
    const headerHeight = levelHeights.reduce((sum, height) => sum + height, 0);
    const drawHeader = () => {
      doc.font('Helvetica-Bold').fontSize(9).text(currentLabel(section.title, context.common?.fiscalYear, view.formId), 24, doc.y, { width });
      doc.y += 4;
      const y = doc.y;
      for (const group of headerGroups) {
        const x = 24 + sizes.slice(0, group.start).reduce((sum, size) => sum + size, 0);
        const top = y + levelHeights.slice(0, group.level).reduce((sum, height) => sum + height, 0);
        const height = group.terminal ? levelHeights.slice(group.level).reduce((sum, value) => sum + value, 0) : levelHeights[group.level];
        doc.rect(x, top, group.width, height).fillAndStroke('#f1f3f4', '#444');
        doc.fillColor('black').font('Helvetica-Bold').fontSize(7).text(group.lines.join('\n'), x + 4, top + 5, { width: group.width - 8, lineGap: 0, align: 'center' });
      }
      doc.y = y + headerHeight;
    };
    const nextPage = () => { page(doc, view, context, `${section.title} — continued`); drawHeader(); };
    drawHeader();
    const recordRows = rows.length ? rows : [{}];
    for (const row of recordRows) {
      const data = band.map((column, index) => {
        const value = row[column.key];
        const display = isNumericField(column) ? (value == null || value === '' ? '' : column.type === 'number' ? Number(value).toLocaleString('en-PH', { maximumFractionDigits: 10 }) : formatPesos(value, view.official.units === 'thousand-pesos' ? 1000 : 1)) : column.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? formDate(value, view.formId) : value;
        return wrap(doc, display, sizes[index] - 8);
      });
      let offset = 0;
      const count = Math.max(...data.map((lines) => lines.length));
      while (offset < count) {
        const available = Math.floor((doc.page.height - 35 - doc.y - 10) / 10);
        if (available < 2) { nextPage(); continue; }
        const lineCount = Math.min(count - offset, available);
        const height = lineCount * 10 + 8;
        const y = doc.y;
        let x = 24;
        for (const [index, lines] of data.entries()) {
          doc.rect(x, y, sizes[index], height).strokeColor('#777').stroke();
          doc.font('Helvetica').fontSize(8).fillColor('black').text(lines.slice(offset, offset + lineCount).join('\n'), x + 4, y + 4, { width: sizes[index] - 8, lineGap: 0, align: isNumericField(band[index]) ? 'right' : 'left' });
          x += sizes[index];
        }
        doc.y = y + height;
        offset += lineCount;
        if (offset < count) nextPage();
      }
    }
    if (totals && rows.length && band.some((column) => column.type === 'currency')) {
      const firstAmount = Math.max(1, band.findIndex((column) => isNumericField(column)));
      const labelWidth = sizes.slice(0, firstAmount).reduce((a, b) => a + b, 0);
      const incomplete = band.some((column) => column.type === 'currency' && rows.some((row) => row[column.key] === '' || row[column.key] == null));
      const footerLabel = `${totalLabel}${incomplete ? ' (known amounts only)' : ''}`;
      const footerHeight = Math.max(23, wrap(doc, footerLabel, labelWidth - 8, 7).length * 9 + 10);
      if (doc.y + footerHeight > doc.page.height - 35) nextPage();
      const y = doc.y;
      doc.rect(24, y, labelWidth, footerHeight).fillAndStroke('#eeeeee', '#555');
      doc.fillColor('black').font('Helvetica-Bold').fontSize(7).text(footerLabel, 28, y + 5, { width: labelWidth - 8 });
      let x = 24 + labelWidth;
      for (let index = firstAmount; index < band.length; index++) {
        const column = band[index];
        const known = rows.map((row) => row[column.key]).filter((value) => value !== '' && value != null && Number.isFinite(Number(value)));
        const amount = column.type === 'currency' && known.length ? formatPesos(known.reduce((sum, value) => sum + Math.round(Number(value) * 100), 0) / 100, view.official.units === 'thousand-pesos' ? 1000 : 1) : '';
        doc.rect(x, y, sizes[index], footerHeight).fillAndStroke('#eeeeee', '#555');
        doc.fillColor('black').font('Helvetica-Bold').fontSize(7).text(amount, x + 3, y + 6, { width: sizes[index] - 6, align: 'right' });
        x += sizes[index];
      }
      doc.y = y + footerHeight;
    }
    doc.x = 24; doc.y += 12;
  }
}

function writeProfile(doc, view, context, entries) {
  const fields = new Map(view.fields.map((field) => [field.key, field]));
  for (const [label, key] of entries) {
    const field = fields.get(key);
    const value = field?.value;
    const display = field && (field.type === 'currency' || field.source === 'derived') && value !== '' && value != null && Number.isFinite(Number(value)) ? formatPesos(value, view.official.units === 'thousand-pesos' ? 1000 : 1) : field?.type === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(value) ? formDate(value, view.formId) : textValue(value);
    const width = doc.page.width - 48;
    const left = width * 0.34;
    const labelLines = wrap(doc, label, left - 12, 9);
    const valueLines = wrap(doc, display, width - left - 12, 9);
    let offset = 0;
    const count = Math.max(labelLines.length, valueLines.length);
    while (offset < count) {
      const available = Math.floor((doc.page.height - 35 - doc.y - 10) / 11);
      if (available < 2) { page(doc, view, context, 'Profile continued'); continue; }
      const lines = Math.min(available, count - offset);
      const height = Math.max(28, lines * 11 + 10);
      const y = doc.y;
      doc.rect(24, y, left, height).strokeColor('#555').stroke();
      doc.rect(24 + left, y, width - left, height).stroke();
      doc.font('Helvetica').fontSize(9).text(labelLines.slice(offset, offset + lines).join('\n'), 30, y + 5, { width: left - 12 });
      doc.text(valueLines.slice(offset, offset + lines).join('\n'), 30 + left, y + 5, { width: width - left - 12 });
      doc.y = y + height; doc.x = 24;
      offset += lines;
    }
  }
}

export function appendOfficialBpForm(doc, formId, context) {
  const view = buildFormView(formId, context);
  if (!view?.official) return false; // Historical captures retain the renderer for their own definition.
  let layout = view.workbookLayout || [];
  if (formId === 'bp-207') {
    const order = ['climateActual', 'official_climateActualSummary', 'official_climateCurrent', 'official_climateCurrentSummary', 'climateProposed', 'climateSummary'];
    // Sort a copy: submitted/captured definitions must never be mutated.
    layout = [...layout].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
  }
  view.officialTitle = officialTitles[formId] || formId;
  page(doc, view, context);
  if (formId === 'bp-205') writeProfile(doc, view, context, [['Retirement type (separate list for each)', 'retirementType']]);
  if (formId === 'bp-206') writeProfile(doc, view, context, [['1. Cabinet cluster', 'cabinetCluster'], ['2. Department / agency', 'agency'], ['3. Program convergence', 'convergenceProgram'], ['5. Program description', 'projectDescription'], ['Objectives', 'objectives'], ['8. Strategies and activities / projects to achieve targets', 'strategies'], ['9. Proposed measures to address implementing issues / gaps', 'implementationMeasures']]);
  if (formId === 'bp-203') writeProfile(doc, view, context, [['1. Proposal / Project Name', 'projectName'], ['2. Implementing Department / Agency', 'implementingAgency'], ['3. Priority Ranking No.', 'priorityRanking'], ['4. Categorization', 'projectType'], ['Infrastructure classification', 'infrastructure'], ['5. DEPDev PIP Code', 'pipCode'], ['6. Total Proposal Cost', 'costTotal'], ['7. Description', 'projectDescription'], ['8. Purpose', 'objectives'], ['9. Beneficiaries', 'beneficiaries'], ['10. Original Start Date', 'implementationStart'], ['Original Finish Date', 'implementationEnd'], ['Revised Start Date', 'revisedStart'], ['Revised Finish Date', 'revisedEnd']]);
  if (formId === 'bp-202') writeProfile(doc, view, context, [
    ['1. Proposal / Project Name', 'projectName'], ['2. Implementing Department / Agency', 'implementingAgency'], ['3. Priority Ranking No.', 'priorityRanking'], ['4. Categorization', 'projectType'], ['Infrastructure classification', 'infrastructure'], ['ICT classification', 'ictClassification'], ['For issuance of MYCA', 'myca'], ['5. DEPDev PIP Code', 'pipCode'], ['6. Original Total Project Cost', 'originalProjectCost'], ['Revised Total Project Cost', 'revisedProjectCost'], ['7. Total Proposal Cost', 'costTotal'], ['8. Description', 'projectDescription'], ['9. Purpose', 'objectives'], ['10. Beneficiaries', 'beneficiaries'], ['11. Original Start Date', 'implementationStart'], ['Original Finish Date', 'implementationEnd'], ['Revised Start Date', 'revisedStart'], ['Revised Finish Date', 'revisedEnd'],
  ]);
  if (['bp-202', 'bp-203', 'bp-206'].includes(formId)) doc.y += 12;
  if (formId === 'bp-a') {
    const manual = context.formValues?.[formId]?.programHistory || [];
    const columns = [{ key: 'prexcCode', label: 'UACS Code (1)', type: 'text' }, { key: 'pap', label: 'P/A/P (2)', type: 'text' }, { key: 'status', label: 'Status (OG) (P) (T) (3)', type: 'text' }, ...['ps', 'mooe', 'finex', 'co', 'total'].map((key, index) => ({ key, label: `AMOUNT (in thousand) / ${key.toUpperCase()} (${index + 4})`, type: 'currency' }))];
    const periods = ['Actual obligations', 'Current program', 'Proposed program'];
    for (const [index, period] of periods.entries()) {
      let rows = view.fields.find((field) => field.key === 'programHistory')?.value?.filter((row) => row.period === period) || [];
      if (period === 'Proposed program' && !manual.some((row) => row.period === period)) {
        const groups = new Map();
        for (const item of (context.lineItems || []).filter((item) => ['PS', 'MOOE', 'FINEX', 'CO'].includes(item.category) && Number.isFinite(Number(item.amount)) && item.amount !== '')) {
          const pap = context.common?.programPap || context.common?.projectName || 'P/A/P awaiting confirmation';
          const costStructure = item.costStructure || 'Cost structure awaiting confirmation';
          const key = `${costStructure}|${pap}`;
          const row = groups.get(key) || { pap, costStructure, tier: ({ tier1: 'Tier 1', tier2: 'Tier 2' })[context.answers?.proposalTier] || 'Tier awaiting confirmation', prexcCode: context.common?.prexcCode || '', ps: 0, mooe: 0, finex: 0, co: 0, total: 0 };
          const category = item.category.toLowerCase();
          row[category] = (Math.round(row[category] * 100) + Math.round(Number(item.amount) * 100)) / 100;
          row.total = (Math.round(row.total * 100) + Math.round(Number(item.amount) * 100)) / 100;
          groups.set(key, row);
        }
        rows = [...groups.values()];
      }
      if (index) page(doc, view, context, period);
      const structures = [...new Set(rows.map((row) => [period === 'Proposed program' ? row.tier || 'Tier awaiting confirmation' : '', row.costStructure || 'P/A/P requirements'].filter(Boolean).join(' / ')))];
      if (!structures.length) writeRows(doc, view, context, { title: `${Number(context.common?.fiscalYear || 2027) - 2 + index} — ${period}` }, columns, []);
      for (const structure of structures) writeRows(doc, view, context, { title: `${Number(context.common?.fiscalYear || 2027) - 2 + index} — ${period} / ${structure}` }, columns, rows.filter((row) => [period === 'Proposed program' ? row.tier || 'Tier awaiting confirmation' : '', row.costStructure || 'P/A/P requirements'].filter(Boolean).join(' / ') === structure), { totalLabel: `Sub-Total — ${structure}` });
      if (rows.length) {
        const grand = { pap: 'GRAND TOTAL' };
        for (const key of ['ps', 'mooe', 'finex', 'co', 'total']) grand[key] = rows.every((row) => row[key] !== '' && row[key] != null) ? rows.reduce((sum, row) => sum + Math.round(Number(row[key]) * 100), 0) / 100 : null;
        writeRows(doc, view, context, { title: `${period} — grand total` }, columns, [grand], { totals: false });
      }
    }
  } else if (formId === 'bp-b') {
    const field = view.fields.find((field) => field.key === 'performance');
    const keys = ['indicator', 'dataSource', 'actualAccomplishment', 'currentTarget', 'baseline', 'proposedTier1', 'proposedTier2', 'remarks'];
    const columns = keys.map((key, index) => ({ key, headingPath: layout[0].columns[index].templateHeadingPath, label: layout[0].columns[index].templateLabel || layout[0].columns[index].label, type: 'text' }));
    const rows = field?.value || [];
    const groups = [...new Set(rows.map((row) => [row.outcome, row.program, row.subprogram, row.indicatorType].filter(Boolean).join(' / ')))];
    if (!groups.length) writeRows(doc, view, context, { title: 'Organisational outcomes / programs / indicators' }, columns, [], { totals: false });
    for (const group of groups) writeRows(doc, view, context, { title: group }, columns, rows.filter((row) => [row.outcome, row.program, row.subprogram, row.indicatorType].filter(Boolean).join(' / ') === group), { totals: false });
  } else {
    for (const section of layout) {
      if (formId === 'bp-207' && ['official_climateCurrent', 'climateProposed'].includes(section.key)) page(doc, view, context, section.title);
      const field = view.fields.find((field) => field.reference === section.reference && isRepeatingField(field));
      let rows = field?.value || [];
      if (section.internal && !rows.length) continue;
      const columns = section.columns.map((column) => {
        const mapped = field?.columns.find((candidate) => candidate.reference === column.reference);
        return { ...column, headingPath: column.templateHeadingPath || column.headingPath, label: column.templateLabel || column.label, key: mapped?.key || column.key, type: ['currency', 'date'].includes(column.type) ? column.type : mapped?.type || column.type };
      });
      if (formId === 'bp-204' && rows.length) {
        const groups = [...new Set(rows.map((row) => [row.tier, row.classification].filter(Boolean).join(' / ') || 'Classification awaiting confirmation'))];
        for (const group of groups) writeRows(doc, view, context, { ...section, title: `${section.title} / ${group}` }, columns, rows.filter((row) => ([row.tier, row.classification].filter(Boolean).join(' / ') || 'Classification awaiting confirmation') === group));
      } else writeRows(doc, view, context, section, columns, rows, { totals: !['physical', 'provisions', 'agencies'].includes(section.key) });
      if (formId === 'bp-207' && ['official_climateActualSummary', 'official_climateCurrentSummary', 'climateSummary'].includes(section.key)) writeSignoff(doc, view, context);
      if (formId === 'bp-202' && section.key === 'papFunding') {
        const physical = view.fields.find((field) => field.key === 'official_physical');
        if (physical) writeRows(doc, view, context, { title: physical.label }, physical.columns, physical.value, { totals: false });
      }
    }
  }
  if (formId !== 'bp-207') writeSignoff(doc, view, context);
  for (const field of view.fields.filter((field) => isRepeatingField(field) && field.reference && field.key !== 'performance')) {
    const extraColumns = field.columns.filter((column) => !column.reference && !column.outputOnly && !['tier', 'classification'].includes(column.key));
    if (extraColumns.some((column) => field.value.some((row) => row[column.key] != null && row[column.key] !== ''))) {
      page(doc, view, context, 'Internal additional entry fields');
      writeRows(doc, view, context, { title: `${field.label} — additional internal fields` }, extraColumns, field.value, { totals: false });
    }
  }
  // Preserve supporting data and custom additions separately from the numbered official sections.
  const supplemental = view.fields.filter((field) => !field.locked && !field.reference && !['programHistory', 'performance', 'preparedBy', 'preparedTitle', 'preparedBy2', 'preparedTitle2', 'certifiedBy', 'certifiedTitle', 'certifiedBy2', 'certifiedTitle2', 'approvedBy', 'approvedTitle', 'reportDate', 'budgetOfficer', 'planningOfficer', 'agencyHead', 'approvalDate'].includes(field.key));
  if (supplemental.some((field) => field.value !== '' && field.value != null && (!Array.isArray(field.value) || field.value.length))) {
    page(doc, view, context, 'Internal supporting information — not part of the official layout');
    for (const field of supplemental.filter((field) => field.value !== '' && field.value != null && (!Array.isArray(field.value) || field.value.length))) {
      if (isRepeatingField(field)) writeRows(doc, view, context, { title: field.label }, field.columns, field.value, { totals: false });
      else writeProfile(doc, view, context, [[field.label, field.key]]);
    }
  }
  if (formId === 'bp-b') {
    const performance = view.fields.find((field) => field.key === 'performance');
    const internal = performance?.columns.filter((column) => ['actualTarget', 'proposedTarget', 'outyearOne', 'outyearTwo'].includes(column.key)) || [];
    if (internal.some((column) => performance.value.some((row) => row[column.key] !== undefined && row[column.key] !== ''))) {
      page(doc, view, context, 'Preserved additional performance data');
      writeRows(doc, view, context, { title: 'Internal / NBM additional targets — not mapped to the DBM-OSEC layout' }, internal, performance.value, { totals: false });
    }
  }
  for (const [key, rows] of Object.entries(context.preservedNativeSections || {})) if (rows?.length) {
    page(doc, view, context, 'Internal preserved source data');
    writeRows(doc, view, context, { title: `Preserved legacy section ${key} — no automatic conversion` }, [{ key: 'record', label: 'Original record', type: 'text' }], rows.map((row) => ({ record: JSON.stringify(row) })), { totals: false });
  }
  const preserved = view.fields.filter((field) => field.preserved);
  if (preserved.length) {
    page(doc, view, context, 'Preserved earlier inputs — not reclassified');
    writeProfile(doc, view, context, preserved.map((field) => [field.label, field.key]));
  }
  return true;
}

function writeSignoff(doc, view, context) {
  const values = Object.fromEntries(view.fields.map((field) => [field.key, field.value]));
  const twoPreparers = ['bp-a', 'bp-c', 'bp-d', 'bp-207'].includes(view.formId);
  const schedules = /^bp-201-/.test(view.formId) || ['bp-202', 'bp-203'].includes(view.formId);
  const roles = view.signatories ? view.signatories.map((signer) => ({ key: signer.key, label: signer.label })) : [
    { key: 'preparedBy', label: `Prepared by: ${view.formId.startsWith('bp-100') ? 'Chief Accountant' : view.formId === 'bp-205' ? 'Personnel Officer' : view.formId === 'bp-206' ? 'PCB Focal Person' : 'Budget Officer'}` },
    ...(twoPreparers || schedules ? [{ key: 'preparedBy2', label: 'Prepared by: Planning Officer' }] : []),
    ...(schedules || view.formId === 'bp-200' ? [{ key: 'certifiedBy', label: 'Certified correct: Chief Accountant' }] : []),
    ...(view.formId !== 'bp-200' ? [{ key: 'approvedBy', label: 'Approved by: Head of Office / Agency' }] : []),
  ];
  if (view.formId === 'bp-204') roles.splice(0, roles.length, { key: 'preparedBy', label: 'Internal preparation ? designation pending verification' }, { key: 'approvedBy', label: 'Internal review ? designation pending verification' });
  const height = 90;
  if (doc.y + height > doc.page.height - 35) page(doc, view, context, 'Sign-off');
  const y = doc.y + 10;
  const width = (doc.page.width - 48) / (roles.length + 1);
  for (const [index, role] of roles.entries()) {
    const x = 24 + index * width;
    doc.rect(x, y, width, height - 10).strokeColor('#555').stroke();
    doc.font('Helvetica').fontSize(7).text(role.label, x + 5, y + 5, { width: width - 10 });
    doc.text(textValue(values[role.key]) || '____________________', x + 5, y + 34, { width: width - 10, align: 'center' });
    doc.text('Signature: __________________', x + 5, y + 55, { width: width - 10, align: 'center' });
  }
  const x = 24 + roles.length * width;
  doc.rect(x, y, width, height - 10).stroke();
  const date = values.reportDate || values.approvalDate || '';
  doc.text(`Date\n\n${/^\d{4}-\d{2}-\d{2}$/.test(date) ? formDate(date, view.formId) : date || '____ / ____ / ________'}`, x + 5, y + 5, { width: width - 10 });
  doc.x = 24; doc.y = y + height;
}

function formDate(value, formId) {
  const [year, month, day] = value.split('-');
  return formId === 'bp-205' ? `${month}/${day}/${year}` : `${day}/${month}/${year}`;
}

export async function generateBpFormPdf({ formId, context }) {
  await mkdir(OUTPUT, { recursive: true });
  const filename = `bp-draft-${formId}-${randomUUID()}.pdf`;
  const pdfPath = resolve(OUTPUT, filename);
  const doc = new PDFDocument({ autoFirstPage: false, info: { Title: `${formId} — draft`, Author: 'DOST BMS' } });
  await new Promise((resolvePromise, reject) => {
    const stream = createWriteStream(pdfPath);
    stream.on('finish', resolvePromise); stream.on('error', reject); doc.on('error', reject); doc.pipe(stream);
    try { if (!appendOfficialBpForm(doc, formId, context)) throw new Error('No mapped BP template for this form.'); doc.end(); } catch (error) { doc.destroy(error); }
  });
  const base = process.env.MOCK_PUBLIC_BASE_URL || `http://${process.env.MOCK_API_HOST || '127.0.0.1'}:${process.env.MOCK_API_PORT || 4000}`;
  return { pdfPath, pdfUrl: `${base}/generated/forms/${filename}`, verification: 'draft-layout-pending-approval' };
}

export function writeBpTable(doc, tableInfo, rows) {
  const view = { formId: 'legacy', fields: [], officialTitle: 'Legacy working schedule — units require verification', official: { units: 'indicator/text' } };
  writeRows(doc, view, { common: {} }, tableInfo, (tableInfo.table.columns || []).map((column) => ({ ...column, type: column.type === 'computed' ? 'number' : column.type })), rows || [], { totals: false });
}
