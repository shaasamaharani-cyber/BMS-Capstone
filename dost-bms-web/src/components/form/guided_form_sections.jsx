import PropTypes from 'prop-types';
import GuidedFieldInput from './guided_field_input';
import { isRepeatingField } from '../../bp_forms/form_schema';

export default function GuidedFormSections({ fields, sections = [], values = {}, context = {}, onChange }) {
  const ids = [...new Set(fields.map((field) => field.section || 'details'))];
  return <div className="d-grid gap-3">{ids.map((id) => {
    const section = sections.find((row) => row.id === id) || { title: id === 'details' ? 'Form details' : id };
    return <details open className="border rounded-3 p-3" key={id}>
      <summary className="fw-semibold mb-3">{section.title}</summary>
      {section.description && <p className="small text-muted">{section.description}</p>}
      <div className="row g-3">{fields.filter((field) => (field.section || 'details') === id).map((field) => <div className={field.type === 'textarea' || isRepeatingField(field) ? 'col-12' : 'col-12 col-md-6'} key={field.key}>
        <label className="form-label fw-semibold" htmlFor={`field-${field.key}`}>{field.label}{field.required ? ' *' : ''}</label>
        {!field.required && <div className="small text-muted mb-1">Optional for requester submission unless your institution requires it. Entered values are validated.</div>}
        {field.recordSource && <div className="small text-muted mb-1">Initially filled from your budget items. You can edit the allocation; proposed totals must still reconcile with those items.</div>}
        <GuidedFieldInput field={field} value={values[field.key] ?? field.value} context={context} onChange={onChange ? (value) => onChange(field.key, value) : undefined} />
      </div>)}</div>
    </details>;
  })}</div>;
}
GuidedFormSections.propTypes = { fields: PropTypes.array.isRequired, sections: PropTypes.array, values: PropTypes.object, context: PropTypes.object, onChange: PropTypes.func };
