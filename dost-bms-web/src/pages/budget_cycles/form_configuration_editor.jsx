import PropTypes from 'prop-types';
import { Button } from '../../components/ui';
import SchemaFieldsEditor from './schema_fields_editor';
import { QUESTION_CONDITION_OPTIONS, describeCondition } from '../../bp_forms/bp_form_conditions';
import { createClientId } from '../../utils/client_id';

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
        <SchemaFieldsEditor fields={value.fields} sections={value.sections || []} formId={formId} onChange={(fields) => onChange({ ...value, fields })} />
        <h6 className="mt-4">Sections</h6>
        {(value.sections || []).map((section, index) => <div className="mb-2" key={section.id}><label className="form-label small" htmlFor={`section-title-${index}`}>Section {section.id}</label><input id={`section-title-${index}`} className="form-control" value={section.title} onChange={(event) => onChange({ ...value, sections: value.sections.map((row, i) => i === index ? { ...row, title: event.target.value } : row) })} /><label className="form-label small mt-1" htmlFor={`section-description-${index}`}>Section guidance</label><textarea id={`section-description-${index}`} className="form-control" rows={2} value={section.description || ''} onChange={(event) => onChange({ ...value, sections: value.sections.map((row, i) => i === index ? { ...row, description: event.target.value } : row) })} /></div>)}
        <Button type="button" variant="outline" size="sm" onClick={() => onChange({ ...value, sections: [...(value.sections || []), { id: createClientId('section-'), title: 'New section', description: '' }] })}>Add section</Button>
      </section>
    </>
  );
}

FormConfigurationEditor.propTypes = { formId: PropTypes.string, value: PropTypes.object.isRequired, onChange: PropTypes.func.isRequired };
