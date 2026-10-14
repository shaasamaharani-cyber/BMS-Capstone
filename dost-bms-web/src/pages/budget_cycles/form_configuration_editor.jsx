import PropTypes from 'prop-types';
import { Button, Input } from '../../components/ui';
import { CANONICAL_FIELD_LABELS, DERIVED_FIELD_LABELS, FIELD_SOURCE } from '../../bp_forms/bp_form_fields';
import { QUESTION_CONDITION_OPTIONS, describeCondition } from '../../bp_forms/bp_form_conditions';
import { FIELD_TYPE_OPTIONS } from '../../bp_forms/bp_form_configuration';
import { createClientId } from '../../utils/client_id';

function createEditableField() {
  return { key: `field_${createClientId().replace(/-/g, '')}`, label: '', type: 'text', source: FIELD_SOURCE.USER, required: false };
}

export default function FormConfigurationEditor({ formId, value, onChange }) {
  const requirement = value.requirement;
  const changeRequirement = (changes) => onChange({ ...value, requirement: { ...requirement, ...changes } });
  const isAnswerCondition = (row, question, answer) => (row.questionId || row.field) === question.id && row.operator === 'equals' && row.value === answer.value;
  const toggleAnswer = (question, answer, checked) => {
    const existing = requirement.conditions.filter((row) => isAnswerCondition(row, question, answer));
    const others = requirement.conditions.filter((row) => !isAnswerCondition(row, question, answer));
    changeRequirement({ conditions: checked ? [...others, { ...(existing[0] || { id: createClientId('condition-') }), questionId: question.id, field: question.id, operator: 'equals', value: answer.value, enabled: true }] : others });
  };
  const legacyConditions = requirement.conditions.filter((row) => !QUESTION_CONDITION_OPTIONS.some((question) => question.options.some((answer) => isAnswerCondition(row, question, answer))));
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
        <p className="small text-muted">Choose when this enabled form is needed using the same questions and answers as Step 2: Proposal Questions.</p>
        <label className="form-label" htmlFor="requirement-mode">When is this form required?</label>
        <select id="requirement-mode" className="form-select mb-3" value={requirement.mode} onChange={(event) => changeRequirement({ mode: event.target.value, conditions: requirement.conditions })}>
          <option value="default">Use existing official/default rules</option>
          <option value="always">Always required</option>
          <option value="conditional">Conditionally required</option>
          <option value="optional">Optional (requester may add it)</option>
        </select>
        {requirement.mode === 'default' && <p className="small text-muted mb-0">{requirement.conditions.length ? `Existing rules: ${requirement.conditions.map(describeCondition).join('; ')}.` : 'Use the established rules for this form. New custom forms remain optional until Always or Conditional is selected.'} Select conditional requirements to change these rules.</p>}
        {requirement.mode === 'conditional' && (
          <>
            <label className="form-check mb-3"><input id="conditions-enabled" className="form-check-input" type="checkbox" checked={requirement.enabled} onChange={(event) => changeRequirement({ enabled: event.target.checked })} /><span className="form-check-label">Enable conditional requirements</span></label>
            <label className="form-label" htmlFor="condition-match">Require this form when</label>
            <select id="condition-match" className="form-select mb-3" value={requirement.match} onChange={(event) => changeRequirement({ match: event.target.value })}><option value="any">Match ANY - at least one answer matches</option><option value="all">Match ALL - every answer matches</option></select>
            {!requirement.enabled && <p className="small text-muted">These conditions are paused. Requesters can still add this form themselves.</p>}
            <p className="small text-muted">Check each requester answer that should require this form. Unchecked answers do not trigger it.</p>
            <div className="row g-3" aria-label="Proposal answer conditions">
              {QUESTION_CONDITION_OPTIONS.map((question) => <div className="col-md-6" key={question.id}>
                <fieldset className="border rounded p-3 h-100" data-question-id={question.id}>
                  <legend className="float-none w-auto fs-6 fw-semibold px-1">{question.label}</legend>
                  {question.options.map((answer) => <label className="form-check mb-2" key={answer.value}>
                    <input className="form-check-input" type="checkbox" data-condition-question={question.id} data-condition-answer={answer.value} checked={requirement.conditions.some((row) => isAnswerCondition(row, question, answer) && row.enabled !== false)} onChange={(event) => toggleAnswer(question, answer, event.target.checked)} />
                    <span className="form-check-label">Requester answers {answer.label}</span>
                  </label>)}
                </fieldset>
              </div>)}
            </div>
            {legacyConditions.length > 0 && <div className="mt-3"><p className="small text-muted">Previously saved conditions remain in effect alongside the selected answers.</p>{legacyConditions.map((row) => <div className="border rounded p-2 mb-2 d-flex justify-content-between gap-2" key={row.id}>
              <label className="form-check mb-0"><input type="checkbox" className="form-check-input" checked={row.enabled !== false} onChange={(event) => changeRequirement({ conditions: requirement.conditions.map((other) => other.id === row.id ? { ...other, enabled: event.target.checked } : other) })} /><span className="form-check-label">{describeCondition(row)}</span></label>
              <Button type="button" variant="ghost" size="sm" onClick={() => changeRequirement({ conditions: requirement.conditions.filter((other) => other.id !== row.id) })}>Remove saved condition</Button>
            </div>)}</div>}
          </>
        )}
        {requirement.mode !== 'optional' && <label className="form-check mt-3"><input className="form-check-input" type="checkbox" checked={requirement.allowOverride === true} onChange={(event) => changeRequirement({ allowOverride: event.target.checked })} /><span className="form-check-label">Allow requesters to remove this required form with a recorded reason</span></label>}
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
                  <div className="col-md-6 d-flex align-items-end"><label className="form-check mb-2"><input id={`editor-required-${index}`} className="form-check-input" type="checkbox" checked={field.required} disabled={formId === 'bp-a' && field.key === 'performanceMeasure'} onChange={(event) => updateField(field.key, { required: event.target.checked })} /><span className="form-check-label">{formId === 'bp-a' && field.key === 'performanceMeasure' ? 'Internal optional field; not an official Form A requirement' : 'Required field'}</span></label></div>
                  {field.type === 'table' && <div className="col-12"><p className="small text-muted">Row columns (calculated columns retain their configured formula)</p>{(field.columns || []).map((column, columnIndex) => <div className="row g-2 mb-2" key={column.key}><div className="col-8"><Input aria-label={`Column ${columnIndex + 1} label`} value={column.label} onChange={(event) => updateField(field.key, { columns: field.columns.map((item, i) => i === columnIndex ? { ...item, label: event.target.value } : item) })} /></div><div className="col-4"><span className="small text-muted">{column.calculation ? 'Calculated' : column.type}</span></div></div>)}<Button type="button" variant="outline" size="sm" onClick={() => updateField(field.key, { columns: [...(field.columns || []), { key: `column_${createClientId().replace(/-/g, '')}`, label: 'New column', type: 'text', required: false }] })}>Add column</Button></div>}
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

FormConfigurationEditor.propTypes = { formId: PropTypes.string, value: PropTypes.object.isRequired, onChange: PropTypes.func.isRequired };
