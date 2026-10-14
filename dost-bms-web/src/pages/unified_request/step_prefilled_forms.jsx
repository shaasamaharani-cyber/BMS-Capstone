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
import { BP_FORM_CATALOG, FORM_ENGINE, FORM_LEVEL, getFormById as findForm } from '../../bp_forms/bp_form_catalog';
import { buildFormView, FIELD_SOURCE, getFieldValueError, getFormCompletion } from '../../bp_forms/bp_form_fields';
import { formatBudgetRequestCurrency } from '../../utils/budget_request_utils';
import { useHasPermission } from '../../hooks/use_permissions';
import { PERMISSIONS } from '../../utils/permissions';
import { exportToPdf } from '../../forms/utils/export_pdf';
import styles from './unified_request.module.css';

function FieldInput({ objField, strValue, onChange }) {
  const strId = `field-${objField.key}`;
  const error = getFieldValueError(objField, strValue);
  const props = { id: strId, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${strId}-error` : undefined, required: Boolean(objField.required) };

  if (objField.type === 'checkbox') return <input {...props} className="form-check-input" type="checkbox" checked={strValue === true} onChange={(event) => onChange(event.target.checked)} />;

  if (objField.type === 'textarea') {
    return <textarea {...props} className="form-control" rows={3} value={strValue} onChange={(objEvent) => onChange(objEvent.target.value)} />;
  }
  if (objField.type === 'select') {
    return (
      <select {...props} className="form-select" value={strValue} onChange={(objEvent) => onChange(objEvent.target.value)}>
        <option value="">Select</option>
        {objField.options.map((strOption) => <option key={strOption} value={strOption}>{strOption}</option>)}
      </select>
    );
  }
  return <input {...props} className="form-control" step={objField.type === 'number' ? 'any' : undefined} type={objField.type === 'number' ? 'number' : objField.type === 'date' ? 'date' : 'text'} value={strValue} onChange={(objEvent) => onChange(objEvent.target.value)} />;
}

FieldInput.propTypes = { objField: PropTypes.object.isRequired, strValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]), onChange: PropTypes.func.isRequired };

const formatLockedValue = (objField) => {
  if (objField.value === '' || objField.value === null || objField.value === undefined) return '-';
  if (objField.source === FIELD_SOURCE.DERIVED && typeof objField.value === 'number') return formatBudgetRequestCurrency(objField.value);
  return String(objField.value);
};

export default function StepPrefilledForms({ arrCatalog = BP_FORM_CATALOG, arrRequired, objContext, blnSnapshotStale, strSelectedFormId, onSelectForm, onFormValueChange, onRegenerate }) {
  const getFormById = (strId) => findForm(strId, arrCatalog);
  const navigate = useNavigate();
  // Requesters have no Forms module; agency-level schema forms are completed by Central Office offices
  const blnCanOpenForms = useHasPermission(PERMISSIONS.FORMS);
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
          Regenerating also removes the signed copies already uploaded: print the new forms and upload them signed again.
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
          <section id="request-form-print-area" className={`${styles.card} print-area`}>
            <h3 className={styles.cardTitle}>{objActiveForm.code} - {objActiveForm.name}</h3>
            <p className={styles.cardHint}>Completed by: {objActiveForm.completedBy}</p>
            {objView && <div className="no-print mb-3"><Button type="button" variant="outline" size="sm" onClick={() => exportToPdf('request-form-print-area')} disabled={blnSnapshotStale || !getFormCompletion(strActiveId, objContext).complete}>Print / Save as PDF</Button><p className="small text-muted mt-1 mb-0">Complete the required fields, then print this form for signing.</p></div>}
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
                          <div className="no-print"><FieldInput objField={objField} strValue={objUserValues[objField.key] ?? ''} onChange={(value) => onFormValueChange(strActiveId, objField.key, value)} /></div>
                          <div className="print-only" style={{ whiteSpace: 'pre-wrap' }}>{typeof objUserValues[objField.key] === 'boolean' ? objUserValues[objField.key] ? 'Yes' : 'No' : String(objUserValues[objField.key] ?? '') || '-'}</div>
                          {getFieldValueError(objField, objUserValues[objField.key]) && <p id={`field-${objField.key}-error`} className="no-print text-danger small mt-1 mb-0">{getFieldValueError(objField, objUserValues[objField.key])}</p>}
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div className="print-only mt-4">Signature: ______________________________ &nbsp; Date: __________________</div>
              </>
            ) : (
              <div className={styles.inlinePanel}>
                <p>
                  {objActiveForm.engine === FORM_ENGINE.MANUAL
                    ? `Prepare this form offline, then confirm completion below.${objActiveForm.level === FORM_LEVEL.REQUEST ? ' Upload its signed copy in the review step.' : ''}`
                    : objActiveForm.engine !== FORM_ENGINE.SCHEMA
                    ? 'The layout for this form is planned for a later sprint. Prepare it offline for now, then tick the box below.'
                    : blnCanOpenForms
                      ? 'This form already has a layout in the Forms module (schema-driven). Complete it there, then tick the box below.'
                      : `${objActiveForm.code} is completed by the ${objActiveForm.completedBy} in the Forms module. You do not need to fill it in.`}
                </p>
                {objActiveForm.engine === FORM_ENGINE.SCHEMA && blnCanOpenForms && <Button variant="outline" size="sm" onClick={() => navigate('/forms')}>Open the Forms module</Button>}
                {(objActiveForm.engine !== FORM_ENGINE.SCHEMA || blnCanOpenForms) && (
                  <label className={styles.checkRow}>
                    <input type="checkbox" checked={Boolean(objUserValues.__done)} onChange={(objEvent) => onFormValueChange(strActiveId, '__done', objEvent.target.checked)} />
                    <span>I have completed {objActiveForm.code}</span>
                  </label>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
}

StepPrefilledForms.propTypes = {
  arrCatalog: PropTypes.array,
  arrRequired: PropTypes.array.isRequired,
  objContext: PropTypes.object.isRequired,
  blnSnapshotStale: PropTypes.bool,
  strSelectedFormId: PropTypes.string,
  onSelectForm: PropTypes.func.isRequired,
  onFormValueChange: PropTypes.func.isRequired,
  onRegenerate: PropTypes.func.isRequired,
};
