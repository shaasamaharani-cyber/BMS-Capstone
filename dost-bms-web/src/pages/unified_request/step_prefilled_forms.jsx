import GuidedFormSections from '../../components/form/guided_form_sections';
import FormSignatories from '../../components/form/form_signatories';
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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui';
import { BP_FORM_CATALOG, FORM_ENGINE, FORM_LEVEL, getFormById as findForm } from '../../bp_forms/bp_form_catalog';
import { buildFormView, FIELD_SOURCE, getFormCompletion, getFormContent, getFormDefinition } from '../../bp_forms/bp_form_fields';
import client from '../../api/client';
import { formatBudgetRequestCurrency } from '../../utils/budget_request_utils';
import { useHasPermission } from '../../hooks/use_permissions';
import { PERMISSIONS } from '../../utils/permissions';
import { exportToPdf } from '../../forms/utils/export_pdf';
import styles from './unified_request.module.css';

const formatLockedValue = (objField) => {
  if (objField.value === '' || objField.value === null || objField.value === undefined) return '-';
  if (objField.source === FIELD_SOURCE.DERIVED && typeof objField.value === 'number') return formatBudgetRequestCurrency(objField.value);
  return String(objField.value);
};

export default function StepPrefilledForms({ arrCatalog = BP_FORM_CATALOG, arrRequired, objContext, blnSnapshotStale, strSelectedFormId, onSelectForm, onFormValueChange, onRegenerate }) {
  const getFormById = (strId) => findForm(strId, arrCatalog);
  const navigate = useNavigate();
  const [exported, setExported] = useState(null);
  const [exporting, setExporting] = useState(false);
  // Access to the separate Forms module follows permissions; completing offices remain configurable.
  const blnCanOpenForms = useHasPermission(PERMISSIONS.FORMS);
  const strActiveId = arrRequired.some((objEntry) => objEntry.formId === strSelectedFormId) ? strSelectedFormId : arrRequired[0]?.formId;
  const objActiveForm = strActiveId ? getFormById(strActiveId) : null;
  const objView = objActiveForm?.engine === FORM_ENGINE.DYNAMIC ? buildFormView(strActiveId, objContext) : null;
  const exportOfficial = async () => {
    const content = getFormContent(strActiveId, objContext);
    setExporting(true); setExported(null);
    try {
      const response = await client.post('/bp-form-exports', { formId: strActiveId, context: objContext, definition: JSON.stringify(getFormDefinition(strActiveId, objContext)) });
      setExported({ formId: strActiveId, content, url: response.data.data.pdfUrl });
    } catch (error) { setExported({ error: error.response?.data?.message || error.message }); }
    finally { setExporting(false); }
  };

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
            <p className={styles.cardHint}>{strActiveId === 'bp-b' ? 'Performance working schedule; targets use indicator units. Layout verification and office certification remain required.' : 'Internal working schedule in pesos; this layout is not an official DBM template.'}</p><p className={styles.cardHint}>Completed by: {objActiveForm.completedBy}</p>
            {objView && <div className="no-print mb-3"><Button type="button" variant="outline" size="sm" onClick={objView.official ? exportOfficial : () => exportToPdf('request-form-print-area')} disabled={blnSnapshotStale || exporting}>{objView.official ? exporting ? 'Generating PDF…' : 'Generate government-style PDF' : 'Print / Save as PDF'}</Button>{exported?.error && <p role="alert" className="text-danger small mt-2">{exported.error}</p>}{exported?.formId === strActiveId && exported?.content === getFormContent(strActiveId, objContext) && <a className="btn btn-sm btn-primary ms-2" href={exported.url} target="_blank" rel="noreferrer">Download draft PDF</a>}<p className="small text-muted mt-1 mb-0">The PDF uses a separate report layout. Review the draft and upload the signed official form required by your institution.</p></div>}
            {objActiveForm.level === FORM_LEVEL.AGENCY && (
              <div className={styles.autoSummary}>
                Institution-level and consolidated reporting are both required. The completing office and timing for this schedule await DOST confirmation; this schedule does <strong>not</strong> block the requester unless configured as a request form.
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
                      <dd style={{ whiteSpace: objField.preserved ? 'pre-wrap' : undefined }}>{formatLockedValue(objField)}<span className={styles.chipAuto}>{objField.preserved ? 'Preserved' : objField.source === FIELD_SOURCE.DERIVED ? 'Calculated' : 'From request'}</span></dd>
                    </div>
                  ))}
                </dl>

                {objView.table && <section className="mb-4" aria-label="Calculated expenditure from line items"><h4 className={styles.subTitle}>Calculated expenditure</h4><div className="row g-3">{objView.table.rows.map((row, index) => <div className="col-12 col-lg-6" key={index}><div className="border rounded p-3 h-100"><strong>{row.name}</strong><dl className="row small mt-2 mb-0">{objView.table.columns.filter((column) => column.numeric).map((column) => <div className="col-6" key={column.key}><dt>{column.label}</dt><dd>{formatBudgetRequestCurrency(row[column.key])}</dd></div>)}</dl></div></div>)}</div><p className="fw-semibold mt-3">Total: {formatBudgetRequestCurrency(objView.table.total)}</p></section>}

                <GuidedFormSections fields={arrUserFields} sections={objView.sections} values={objUserValues} context={objContext} onChange={(key, value) => onFormValueChange(strActiveId, key, value)} />
                {objView.signatories ? <FormSignatories signatories={objView.signatories} values={objUserValues} /> : <div className="print-only mt-4">Signature: ______________________________ &nbsp; Date: __________________</div>}
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
