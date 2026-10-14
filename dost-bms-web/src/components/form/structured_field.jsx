import PropTypes from 'prop-types';
import { calculateTableRows } from '../../bp_forms/structured_fields';

export default function StructuredField({ field, value, onChange }) {
  const rows = calculateTableRows(field.columns, value);
  const update = (index, key, next) => onChange(rows.map((row, i) => i === index ? { ...row, [key]: next } : row));
  return <div className="table-responsive border rounded p-2">
    <table className="table table-sm small mb-2"><thead><tr>{field.columns.map((column) => <th key={column.key}>{column.label}{column.required ? ' *' : ''}</th>)}<th className="no-print">Actions</th></tr></thead>
      <tbody>{rows.map((row, index) => <tr key={index}>{field.columns.map((column) => <td key={column.key} style={{ minWidth: 140 }}>
        {!onChange || column.calculation ? <span>{row[column.key] ?? 'Awaiting data'}</span> : <>
          <div className="no-print">{column.type === 'select' ? <select className="form-select form-select-sm" aria-label={`${field.label}, row ${index + 1}, ${column.label}`} value={row[column.key] ?? ''} onChange={(event) => update(index, column.key, event.target.value)}><option value="">Select</option>{column.options.map((option) => <option key={option}>{option}</option>)}</select> : <input className="form-control form-control-sm" aria-label={`${field.label}, row ${index + 1}, ${column.label}`} type={column.type} min={column.type === 'number' ? 0 : undefined} step="any" value={row[column.key] ?? ''} onChange={(event) => update(index, column.key, event.target.value)} />}</div>
          <span className="print-only">{row[column.key] ?? 'Awaiting data'}</span>
        </>}
      </td>)}<td className="no-print">{onChange && <button type="button" className="btn btn-sm btn-outline-danger" aria-label={`Remove ${field.label} row ${index + 1}`} onClick={() => onChange(rows.filter((_, i) => i !== index))}>Remove</button>}</td></tr>)}</tbody>
    </table>
    {onChange && <button type="button" className="btn btn-sm btn-outline-primary no-print" onClick={() => onChange([...rows, Object.fromEntries(field.columns.filter((column) => !column.calculation).map((column) => [column.key, '']))])}>Add row</button>}
    <p className="small text-muted mb-0">Blank amounts mean awaiting data. Enter zero only when confirmed. Compensation amounts are supplied by the responsible office; statutory rates are not assumed.</p>
  </div>;
}
StructuredField.propTypes = { field: PropTypes.object.isRequired, value: PropTypes.array, onChange: PropTypes.func };
