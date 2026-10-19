import PropTypes from 'prop-types';
import { getFieldValueError, getDerivedValues } from '../../bp_forms/bp_form_fields';
import { isRepeatingField, isNumericField, isFieldVisible, resolveEntryFields, formatPesos } from '../../bp_forms/form_schema';

export default function GuidedFieldInput({ field, value, onChange, context = {}, inputId }) {
  const id = inputId || `field-${field.key}`;
  const error = getFieldValueError(field, value, context);
  const readonly = !onChange || field.outputOnly || field.calculation || ['canonical', 'derived'].includes(field.source);
  const label = field.label;
  const props = { id, 'aria-label': label, 'aria-invalid': Boolean(error), 'aria-describedby': `${id}-help${error ? ` ${id}-error` : ''}`, required: Boolean(field.required) };
  let control;
  if (isRepeatingField(field)) {
    const stored = Array.isArray(value) ? value : [];
    const rows = stored.length ? stored : onChange ? [{}] : [];
    control = <div className="d-grid gap-3" aria-label={label}>
      {rows.map((raw, index) => {
        const row = resolveEntryFields(field.columns, raw, { ...context, derived: getDerivedValues(context) });
        const update = (key, next) => onChange(rows.map((entry, i) => i === index ? { ...entry, [key]: next } : entry));
        const sections = [...new Set(field.columns.filter((column) => isFieldVisible(column, context)).map((column) => column.section || ''))];
        return <fieldset className="border rounded-3 p-3 bg-body" key={index} aria-label={`${label}, entry ${index + 1}`}>
          <legend className="float-none w-auto fs-6 fw-semibold px-2">Entry {index + 1}</legend>
          {sections.map((section) => <div key={section} className="mb-3">
            {section && sections.length > 1 && <h6 className="fw-semibold border-bottom pb-2">{section}</h6>}
            <div className="row g-3">{field.columns.filter((column) => (column.section || '') === section && isFieldVisible(column, context)).map((column) => {
              const child = { ...column, label: `${label}, row ${index + 1}, ${column.label}` };
              const childId = `${id}-${index}-${column.key}`;
              return <div className={['textarea', 'table', 'group'].includes(column.type) ? 'col-12' : 'col-12 col-md-6 col-xl-4'} key={column.key}>
                <label className="form-label small fw-semibold" htmlFor={childId}>{column.label}{column.required ? ' *' : ''}</label>
                <GuidedFieldInput field={child} inputId={childId} value={row[column.key]} context={context} onChange={readonly ? undefined : (next) => update(column.key, next)} />
              </div>;
            })}</div>
          </div>)}
          {!readonly && <button type="button" className="btn btn-sm btn-outline-danger no-print" aria-label={`Remove ${label} row ${index + 1}`} onClick={() => onChange(stored.filter((_, i) => i !== index))}>Remove entry</button>}
        </fieldset>;
      })}
      {!readonly && <button type="button" className="btn btn-sm btn-outline-primary no-print" aria-label={`Add another ${label}`} onClick={() => onChange([...rows, {}])}>Add another</button>}
    </div>;
  } else if (readonly) {
    const resolved = field.source === 'canonical' ? context.common?.[field.canonical] ?? value : value;
    control = <div id={id} className="form-control bg-body-tertiary" aria-label={label}>{resolved === '' || resolved == null ? 'Awaiting data' : field.type === 'currency' ? `PHP ${formatPesos(resolved)}` : field.type === 'number' ? Number(resolved).toLocaleString('en-PH', { maximumFractionDigits: 10 }) : typeof resolved === 'object' ? resolved.name || JSON.stringify(resolved) : String(resolved)}</div>;
  } else if (field.type === 'checkbox') control = <input {...props} className="form-check-input" type="checkbox" checked={value === true} onChange={(event) => onChange(event.target.checked)} />;
  else if (field.type === 'radio') control = <div role="radiogroup" aria-label={label}>{(field.options || []).map((option, index) => <label className="form-check" key={option}><input type="radio" name={id} id={`${id}-${index}`} className="form-check-input" value={option} checked={value === option} onChange={() => onChange(option)} /><span className="form-check-label">{option}</span></label>)}</div>;
  else if (field.type === 'select') control = <select {...props} className="form-select" value={value ?? ''} onChange={(event) => onChange(event.target.value)}><option value="">Select</option>{(field.options || []).map((option) => <option key={option}>{option}</option>)}</select>;
  else if (field.type === 'textarea') control = <textarea {...props} className="form-control" rows={4} value={value ?? ''} maxLength={field.validation?.maxLength} onChange={(event) => onChange(event.target.value)} />;
  else if (field.type === 'attachment') control = <div><input {...props} type="file" className="form-control" onChange={(event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { onChange({ name: file.name, size: file.size }); return; }
    const reader = new FileReader();
    reader.onload = () => onChange({ name: file.name, size: file.size, type: file.type || 'application/octet-stream', dataUrl: reader.result });
    reader.readAsDataURL(file);
  }} />{value?.name && <div className="small mt-2"><span>{value.name}</span> <button type="button" className="btn btn-link btn-sm" onClick={() => onChange('')}>Remove attachment</button></div>}</div>;
  else control = <div className={field.type === 'currency' ? 'input-group' : ''}>{field.type === 'currency' && <span className="input-group-text">PHP</span>}<input {...props} className="form-control" type={isNumericField(field) ? 'number' : field.type === 'date' ? 'date' : 'text'} step={isNumericField(field) ? field.validation?.integer ? 1 : 'any' : undefined} min={field.validation?.min ?? (isNumericField(field) && !field.validation?.allowNegative ? 0 : undefined)} max={field.validation?.max} maxLength={field.validation?.maxLength} value={value ?? ''} onChange={(event) => onChange(event.target.value)} /></div>;
  return <>{!isRepeatingField(field) && onChange ? <><div className="no-print">{control}</div><div className="print-only">{typeof value === 'object' ? value?.name || JSON.stringify(value) : typeof value === 'boolean' ? value ? 'Yes' : 'No' : String(value ?? '')}</div></> : control}<div id={`${id}-help`} className="small text-muted mt-1">{field.description}{field.contributor ? ` Contribution: ${field.contributor}. Office assignment is configurable.` : ''}{field.type === 'currency' ? ' Enter pesos; export formatting handles the reporting unit.' : ''}</div>{error && <div id={`${id}-error`} className="text-danger small mt-1" role="status">{error}</div>}</>;
}
GuidedFieldInput.propTypes = { field: PropTypes.object.isRequired, value: PropTypes.any, onChange: PropTypes.func, context: PropTypes.object, inputId: PropTypes.string };
