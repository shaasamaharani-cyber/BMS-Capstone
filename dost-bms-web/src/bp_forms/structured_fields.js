// Only these arithmetic operations are supported; configuration never executes code.
import { calculateValue } from './form_schema.js';
export function calculateTableRows(columns, rows = []) {
  return (Array.isArray(rows) ? rows : []).map((input) => {
    const row = { ...input };
    for (const column of columns) {
      if (!column.calculation) continue;
      row[column.key] = calculateValue(column, row);
    }
    return row;
  });
}

const text = (key, label) => ({ key, label, type: 'text', required: true });
const number = (key, label) => ({ key, label, type: 'number', required: true });
const calculated = (key, label, calculation, operands) => ({ key, label, type: 'number', calculation, operands });
export const FUNDING_COLUMNS = [
  text('pap', 'P/A/P attribution'), number('year', 'Fiscal year'),
  { key: 'tier', label: 'Budget tier', type: 'select', options: ['Tier 1', 'Tier 2'], required: true },
  { key: 'expenseClass', label: 'Expense class', type: 'select', options: ['PS', 'MOOE', 'FINEX', 'CO'], required: true },
  number('amount', 'Requirement (PHP)'),
];
const compensationKeys = ['pera', 'rata', 'clothing', 'midYear', 'yearEnd', 'cashGift', 'pei', 'rlip', 'pagibig', 'ecip', 'phic', 'medical', 'magnaCarta'];
export const STAFFING_COLUMNS = [
  text('pap', 'P/A/P attribution'), text('unit', 'Organisational unit'), text('position', 'Position title'),
  { key: 'classification', label: 'Position classification', type: 'select', options: ['Casual', 'Contractual', 'Part-Time', 'Substitute (Teachers)'], required: true },
  { key: 'tier', label: 'Budget tier', type: 'select', options: ['Tier 1', 'Tier 2'], required: true },
  number('salaryGrade', 'Salary grade (confirmed by HR)'), number('positions', 'Number of positions'), number('months', 'Months per position'),
  calculated('totalMonths', 'Total months', 'multiply', ['positions', 'months']), number('monthlyRate', 'Monthly hiring rate (PHP)'),
  calculated('salary', 'Total salary (PHP)', 'multiply', ['totalMonths', 'monthlyRate']),
  ...compensationKeys.map((key, index) => ({ ...number(key, ['PERA', 'RATA', 'Clothing / uniform', 'Mid-year bonus', 'Year-end bonus', 'Cash gift', 'PEI', 'RLIP', 'Pag-IBIG', 'ECIP', 'PHIC', 'Medical allowance', 'Magna Carta benefits'][index] + ' (PHP, row total)'), required: false })),
  calculated('otherCompensation', 'Total other compensation (PHP)', 'sum', compensationKeys),
  calculated('totalCompensation', 'Total compensation (PHP)', 'sum', ['salary', 'otherCompensation']),
];
