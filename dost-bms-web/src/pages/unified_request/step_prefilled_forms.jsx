/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Step 4 of the unified budget request - each required BP form is generated and pre-filled. Fields that were already
 * entered on the request are shown locked with their source, tables and totals are calculated from the line items, and the
 * user only completes the few fields that are unique to that form.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { FORM_ENGINE, FORM_LEVEL, getFormById } from '../../bp_forms/bp_form_catalog';
import { buildFormView, FIELD_SOURCE, getFormCompletion } from '../../bp_forms/bp_form_fields';
import { formatBudgetRequestCurrency } from '../../utils/budget_request_utils';
import styles from './unified_request.module.css';

function FieldInput({ objField, strValue, onChange }) {
  const strId = `field-${objField.key}`;

  if (objField.type === 'textarea') {
    return <textarea id={strId} className="form-control" rows={3} value={strValue} onChange={(objEvent) => onChange(objEvent.target.value)} />;
  }
  if (objField.type === 'select') {
    return (
      <select id={strId} className="form-select" value={strValue} onChange={(objEvent) => onChange(objEvent.target.value)}>
        <option value="">Select</option>
        {objField.options.map((strOption) => <option key={strOption} value={strOption}>{strOption}</option>)}
      </select>
    );
  }
  return <input id={strId} className="form-control" type={objField.type === 'number' ? 'number' : objField.type === 'date' ? 'date' : 'text'} value={strValue} onChange={(objEvent) => onChange(objEvent.target.value)} />;
}

FieldInput.propTypes = { objField: PropTypes.object.isRequired, strValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), onChange: PropTypes.func.isRequired };

const formatLockedValue = (objField) => {
  if (objField.value === '' || objField.value === null || objField.value === undefined) return '-';
  if (objField.source === FIELD_SOURCE.DERIVED && typeof objField.value === 'number') return formatBudgetRequestCurrency(objField.value);
  return String(objField.value);
};

export default function StepPrefilledForms({ arrRequired, objContext, blnSnapshotStale, strSelectedFormId, onSelectForm, onFormValueChange, onRegenerate }) {
  const navigate = useNavigate();
  const strActiveId = arrRequired.some((objEntry) => objEntry.formId === strSelectedFormId) ? strSelectedFormId : arrRequired[0]?.formId;
  const objActiveForm = strActiveId ? getFormById(strActiveId) : null;
  const objView = objActiveForm?.engine === FORM_ENGINE.DYNAMIC ? buildFormView(strActiveId, objContext) : null;

  if (arrRequired.length === 0) {
    return <section className={styles.card}><p className={styles.emptyCell}>No forms are required yet. Go back to steps 1 and 2.</p></section>;
  }

  const arrLockedFields = objView ? objView.fields.filter((objField) => objField.locked) : [];
  const arrUserFields = objView ? objView.fields.filter((objField) => !objField.locked) : [];
  const objUserValues = objContext.formValues?.[strActiveId] || {};
  const intAutoCount = arrLockedFields.length;

  return (
    <>
      {blnSnapshotStale && (
        <section className={`${styles.banner} ${styles.bannerWarn}`}>
          The line items changed after these forms were generated, so the form totals are out of date.
          <Button variant="outline" size="sm" onClick={onRegenerate}>Regenerate forms</Button>
        </section>
      )}

      <div className={styles.formsLayout}>
        <nav className={styles.formList} aria-label="Required forms">
          {arrRequired.map((objEntry) => {
            const objForm = getFormById(objEntry.formId);
            const objCompletion = getFormCompletion(objEntry.formId, objContext);
            return (
              <button key={objEntry.formId} type="button" className={`${styles.formListItem} ${objEntry.formId === strActiveId ? styles.formListItemOn : ''}`} onClick={() => onSelectForm(objEntry.formId)}>
                <span>
                  <strong>{objForm.code}</strong>
                  <span className={styles.subText}>{objForm.name}</span>
                </span>
                {objForm.level === FORM_LEVEL.AGENCY
                  ? <span className={styles.statusMuted}>Other office</span>
                  : (
                    <span className={objCompletion.complete ? styles.statusDone : styles.statusOpen}>
                      {objCompletion.complete ? 'Complete' : `${objCompletion.filled}/${objCompletion.total}`}
                    </span>
                  )}
              </button>
            );
          })}
        </nav>

        <div className={styles.formPanel}>
          <section className={styles.card}>
            <h3 className={styles.cardTitle}>{objActiveForm.code} - {objActiveForm.name}</h3>
            <p className={styles.cardHint}>Completed by: {objActiveForm.completedBy}</p>
            {objActiveForm.level === FORM_LEVEL.AGENCY && (
              <div className={styles.autoSummary}>
                Agency-level form. It is completed by the office above when requests are consolidated, so it does <strong>not</strong> block your submission.
              </div>
            )}

            {objView ? (
              <>
                <div className={styles.autoSummary}>{intAutoCount} field{intAutoCount === 1 ? '' : 's'} filled in for you. {arrUserFields.length > 0 ? `${arrUserFields.filter((objField) => objField.required).length} required field(s) need your input.` : 'Nothing else is needed.'}</div>

                <h4 className={styles.subTitle}>Filled in for you</h4>
                <dl className={styles.lockedGrid}>
                  {arrLockedFields.map((objField) => (
                    <div key={objField.key} className={styles.lockedField}>
                      <dt>{objField.label}</dt>
                      <dd>{formatLockedValue(objField)}<span className={styles.chipAuto}>{objField.source === FIELD_SOURCE.DERIVED ? 'Calculated' : 'From request'}</span></dd>
                    </div>
                  ))}
                </dl>

                {objView.table && (
                  <div className={styles.tableWrap}>
                    <table className={styles.itemTable}>
                      <thead><tr>{objView.table.columns.map((objColumn) => <th key={objColumn.key} className={objColumn.numeric ? styles.numericCell : ''}>{objColumn.label}</th>)}</tr></thead>
                      <tbody>
                        {objView.table.rows.map((objRow, intIndex) => (
                          <tr key={`${objRow.name}-${intIndex}`}>
                            {objView.table.columns.map((objColumn) => <td key={objColumn.key} className={objColumn.numeric ? styles.numericCell : ''}>{objColumn.numeric ? formatBudgetRequestCurrency(objRow[objColumn.key]) : objRow[objColumn.key]}</td>)}
                          </tr>
                        ))}
                        {objView.table.rows.length === 0 && <tr><td colSpan={objView.table.columns.length} className={styles.emptyCell}>No line items in this category yet.</td></tr>}
                      </tbody>
                      <tfoot><tr><td colSpan={objView.table.columns.length - 1}>Total</td><td className={styles.numericCell}>{formatBudgetRequestCurrency(objView.table.total)}</td></tr></tfoot>
                    </table>
                  </div>
                )}

                {arrUserFields.length > 0 && (
                  <>
                    <h4 className={styles.subTitle}>Only this form needs</h4>
                    <div className={styles.fieldGrid}>
                      {arrUserFields.map((objField) => (
                        <div key={objField.key} className={objField.type === 'textarea' ? styles.spanTwo : ''}>
                          <label htmlFor={`field-${objField.key}`} className={styles.fieldLabel}>{objField.label}{objField.required && <span className={styles.requiredMark}> *</span>}</label>
                          <FieldInput objField={objField} strValue={objUserValues[objField.key] ?? ''} onChange={(value) => onFormValueChange(strActiveId, objField.key, value)} />
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className={styles.inlinePanel}>
                <p>
                  {objActiveForm.engine === FORM_ENGINE.SCHEMA
                    ? 'This form already has a layout in the Forms module (schema-driven). Complete it there, then tick the box below.'
                    : 'The layout for this form is planned for a later sprint. Prepare it offline for now, then tick the box below.'}
                </p>
                {objActiveForm.engine === FORM_ENGINE.SCHEMA && <Button variant="outline" size="sm" onClick={() => navigate('/forms')}>Open the Forms module</Button>}
                <label className={styles.checkRow}>
                  <input type="checkbox" checked={Boolean(objUserValues.__done)} onChange={(objEvent) => onFormValueChange(strActiveId, '__done', objEvent.target.checked)} />
                  <span>I have completed {objActiveForm.code}</span>
                </label>
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

StepPrefilledForms.propTypes = {
  arrRequired: PropTypes.array.isRequired,
  objContext: PropTypes.object.isRequired,
  blnSnapshotStale: PropTypes.bool,
  strSelectedFormId: PropTypes.string,
  onSelectForm: PropTypes.func.isRequired,
  onFormValueChange: PropTypes.func.isRequired,
  onRegenerate: PropTypes.func.isRequired,
};
