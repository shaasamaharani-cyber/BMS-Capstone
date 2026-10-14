import PropTypes from 'prop-types';
import { Button, Input } from '../../components/ui';
import { CANONICAL_FIELD_LABELS, DERIVED_FIELD_LABELS, FIELD_SOURCE } from '../../bp_forms/bp_form_fields';
import { CONDITION_OPTIONS, describeCondition, NUMBER_OPERATORS, VALUE_OPERATORS } from '../../bp_forms/bp_form_conditions';
import { FIELD_TYPE_OPTIONS } from '../../bp_forms/bp_form_configuration';
import { createClientId } from '../../utils/client_id';

function createEditableField() {
  return { key: `field_${createClientId().replace(/-/g, '')}`, label: '', type: 'text', source: FIELD_SOURCE.USER, required: false };
}

export default function FormConfigurationEditor({ value, onChange }) {
  const requirement = value.requirement;
  const changeRequirement = (changes) => onChange({ ...value, requirement: { ...requirement, ...changes } });
  const updateCondition = (id, changes) => changeRequirement({ conditions: requirement.conditions.map((row) => row.id === id ? { ...row, ...changes } : row) });
  const updateField = (key, changes) => onChange({ ...value, fields: value.fields.map((field) => field.key === key ? { ...field, ...changes } : field) });
  const moveField = (index, offset) => {
    const fields = [...value.fields];
    [fields[index], fields[index + offset]] = [fields[index + offset], fields[index]];
    onChange({ ...value, fields });
  };

  return (
    <>
      <section className="border rounded-3 p-3" aria-labelledby="requirement-heading">
        <h6 id="requirement-heading" className="fw-bold">Conditional requirements</h6>
        <p className="small text-muted">Choose when this enabled form is needed. Conditions use the requester's proposal answers, funding source or budget amounts.</p>
        <label className="form-label" htmlFor="requirement-mode">When is this form required?</label>
        <select id="requirement-mode" className="form-select mb-3" value={requirement.mode} onChange={(event) => changeRequirement({ mode: event.target.value, conditions: event.target.value === 'conditional' && !requirement.conditions.length ? [{ id: createClientId('condition-'), field: 'proposalTier', operator: 'equals', value: 'tier2', enabled: true }] : requirement.conditions })}>
          <option value="default">Use existing form rules</option>
          <option value="always">Always required</option>
          <option value="conditional">Required when conditions match</option>
          <option value="optional">Optional (requester may add it)</option>
        </select>
        {requirement.mode === 'default' && <p className="small text-muted mb-0">{requirement.conditions.length ? `Existing rules: ${requirement.conditions.map(describeCondition).join('; ')}.` : 'This form is always required when enabled.'} Select conditional requirements to change these rules.</p>}
        {requirement.mode === 'conditional' && (
          <>
            <label className="form-check mb-3"><input id="conditions-enabled" className="form-check-input" type="checkbox" checked={requirement.enabled} onChange={(event) => changeRequirement({ enabled: event.target.checked })} /><span className="form-check-label">Enable conditional requirements</span></label>
            <label className="form-label" htmlFor="condition-match">Require this form when</label>
            <select id="condition-match" className="form-select mb-3" value={requirement.match} onChange={(event) => changeRequirement({ match: event.target.value })}><option value="any">Any enabled condition matches</option><option value="all">All enabled conditions match</option></select>
            {!requirement.enabled && <p className="small text-muted">These conditions are paused. Requesters can still add this form themselves.</p>}
            {requirement.conditions.map((row, index) => {
              const option = CONDITION_OPTIONS.find((item) => item.field === row.field);
              const operators = option.numeric ? NUMBER_OPERATORS : VALUE_OPERATORS;
              return (
                <div className="border rounded p-3 mb-2" key={row.id}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-check mb-0"><input className="form-check-input" type="checkbox" checked={row.enabled} onChange={(event) => updateCondition(row.id, { enabled: event.target.checked })} /><span className="form-check-label">Condition {index + 1} enabled</span></label>
                    <Button type="button" variant="ghost" size="sm" aria-label={`Remove condition ${index + 1}`} onClick={() => changeRequirement({ conditions: requirement.conditions.filter((other) => other.id !== row.id) })}>Remove</Button>
                  </div>
                  <div className="row g-2">
                    <div className="col-md-5"><label className="form-label small" htmlFor={`condition-field-${index}`}>Request value</label><select id={`condition-field-${index}`} className="form-select" value={row.field} onChange={(event) => { const next = CONDITION_OPTIONS.find((item) => item.field === event.target.value); updateCondition(row.id, { field: next.field, operator: next.numeric ? 'gt' : 'equals', value: next.numeric ? 0 : next.options[0].value }); }}>{CONDITION_OPTIONS.map((item) => <option key={item.field} value={item.field}>{item.label}</option>)}</select></div>
                    <div className="col-md-3"><label className="form-label small" htmlFor={`condition-operator-${index}`}>Comparison</label><select id={`condition-operator-${index}`} className="form-select" value={row.operator} onChange={(event) => updateCondition(row.id, { operator: event.target.value })}>{operators.map((operator) => <option key={operator.value} value={operator.value}>{operator.label}</option>)}</select></div>
                    <div className="col-md-4"><label className="form-label small" htmlFor={`condition-value-${index}`}>Value</label>{option.numeric ? <Input id={`condition-value-${index}`} type="number" min={0} step="any" value={row.value} onChange={(event) => updateCondition(row.id, { value: event.target.value })} /> : <select id={`condition-value-${index}`} className="form-select" value={row.value} onChange={(event) => updateCondition(row.id, { value: event.target.value })}>{option.options.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>}</div>
                  </div>
                </div>
              );
            })}
            <Button type="button" size="sm" variant="outline" onClick={() => changeRequirement({ conditions: [...requirement.conditions, { id: createClientId('condition-'), field: 'proposalTier', operator: 'equals', value: 'tier2', enabled: true }] })}>+ Add condition</Button>
          </>
        )}
      </section>

      <section className="border rounded-3 p-3" aria-labelledby="fields-heading">
        <h6 id="fields-heading" className="fw-bold">Form fields</h6>
        <p className="small text-muted">Add and edit the fields requesters see. Request values and calculated totals are filled automatically. Field order here is the order on the form.</p>
        {value.fields.map((field, index) => (
          <div className="border rounded p-3 mb-3" key={field.key} data-field-key={field.key}>
            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
              <strong className="small">Field {index + 1}</strong>
              <div className="d-flex gap-1">
                <Button type="button" size="sm" variant="ghost" disabled={index === 0} aria-label={`Move field ${index + 1} up`} onClick={() => moveField(index, -1)}>Up</Button>
                <Button type="button" size="sm" variant="ghost" disabled={index === value.fields.length - 1} aria-label={`Move field ${index + 1} down`} onClick={() => moveField(index, 1)}>Down</Button>
                <Button type="button" size="sm" variant="ghost" aria-label={`Remove field ${index + 1}`} onClick={() => onChange({ ...value, fields: value.fields.filter((other) => other.key !== field.key) })}>Remove</Button>
              </div>
            </div>
            <div className="row g-2">
              <div className="col-md-6"><label className="form-label small" htmlFor={`editor-label-${index}`}>Field label</label><Input id={`editor-label-${index}`} maxLength={200} required value={field.label} onChange={(event) => updateField(field.key, { label: event.target.value })} /></div>
              <div className="col-md-6"><label className="form-label small" htmlFor={`editor-source-${index}`}>Filled by</label><select id={`editor-source-${index}`} className="form-select" value={field.source} onChange={(event) => updateField(field.key, { source: event.target.value, type: event.target.value === FIELD_SOURCE.DERIVED ? 'number' : 'text', canonical: field.canonical || 'department', derived: field.derived || 'expenseTotal', required: false })}><option value={FIELD_SOURCE.USER}>Requester</option><option value={FIELD_SOURCE.CANONICAL}>Information from the request</option><option value={FIELD_SOURCE.DERIVED}>Calculated from the request</option></select></div>
              {field.source === FIELD_SOURCE.USER ? (
                <>
                  <div className="col-md-6"><label className="form-label small" htmlFor={`editor-type-${index}`}>Field type</label><select id={`editor-type-${index}`} className="form-select" value={field.type} onChange={(event) => updateField(field.key, { type: event.target.value, options: field.options || [] })}>{FIELD_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
                  <div className="col-md-6 d-flex align-items-end"><label className="form-check mb-2"><input id={`editor-required-${index}`} className="form-check-input" type="checkbox" checked={field.required} onChange={(event) => updateField(field.key, { required: event.target.checked })} /><span className="form-check-label">Required field</span></label></div>
                  {field.type === 'select' && <div className="col-12"><label className="form-label small" htmlFor={`editor-options-${index}`}>Dropdown options (one per line)</label><Input id={`editor-options-${index}`} type="textarea" value={(field.options || []).join('\n')} onChange={(event) => updateField(field.key, { options: event.target.value.split('\n') })} /></div>}
                </>
              ) : <div className="col-12"><label className="form-label small" htmlFor={`editor-value-${index}`}>Automatic value</label><select id={`editor-value-${index}`} className="form-select" value={field.source === FIELD_SOURCE.CANONICAL ? field.canonical : field.derived} onChange={(event) => updateField(field.key, { [field.source === FIELD_SOURCE.CANONICAL ? 'canonical' : 'derived']: event.target.value })}>{Object.entries(field.source === FIELD_SOURCE.CANONICAL ? CANONICAL_FIELD_LABELS : DERIVED_FIELD_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></div>}
            </div>
          </div>
        ))}
        {!value.fields.length && <p className="small text-muted">Add at least one field so this form can be filled online.</p>}
        <Button type="button" size="sm" variant="outline" onClick={() => onChange({ ...value, fields: [...value.fields, createEditableField()] })}>+ Add field</Button>
      </section>
    </>
  );
}

FormConfigurationEditor.propTypes = { value: PropTypes.object.isRequired, onChange: PropTypes.func.isRequired };
