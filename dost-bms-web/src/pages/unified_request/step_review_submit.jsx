/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Step 5 of the unified budget request - final review. Shows what still blocks submission, checks that the form totals equal
 * the request totals, collects the signed copy of each generated form (DOST has no digital signatures yet) and submits.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import { Button } from '../../components/ui';
import { FORM_ENGINE, FORM_LEVEL, getFormById } from '../../bp_forms/bp_form_catalog';
import { formatBudgetRequestCurrency } from '../../utils/budget_request_utils';
import styles from './unified_request.module.css';

const STEP_LABELS = { details: 'Request details', questions: 'Questions', forms: 'Required forms', fill: 'Forms', review: 'Review' };

const STATUS_TEXT = {
  match: { text: 'Matches', className: 'statusDone' },
  stale: { text: 'Out of date', className: 'statusBad' },
  no_form: { text: 'No form covers this', className: 'statusBad' },
  not_generated: { text: 'Not generated yet', className: 'statusOpen' },
  none: { text: 'Not used', className: 'statusMuted' },
};

export default function StepReviewSubmit({ arrIssues, arrTotalsCheck, arrRequired, objSigned, objSummary, strComment, blnSubmitting, blnSavingDraft, onSignedChange, onCommentChange, onGoToStep, onSubmit, onSaveDraft }) {
  const arrSignable = arrRequired.filter((objEntry) => getFormById(objEntry.formId)?.engine === FORM_ENGINE.DYNAMIC && getFormById(objEntry.formId)?.level === FORM_LEVEL.REQUEST);
  const blnReady = arrIssues.length === 0;

  return (
    <>
      <section className={`${styles.banner} ${blnReady ? styles.bannerOk : styles.bannerWarn}`}>
        {blnReady ? 'Everything is complete. You can submit this request for review.' : `${arrIssues.length} thing${arrIssues.length === 1 ? '' : 's'} to fix before you can submit.`}
      </section>

      {!blnReady && (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>To fix</h3>
          {arrIssues.map((objIssue) => (
            <div key={objIssue.id} className={styles.overrideRow}>
              <span>{objIssue.message}</span>
              <Button variant="ghost" size="sm" onClick={() => onGoToStep(objIssue.step)}>Go to {STEP_LABELS[objIssue.step]}</Button>
            </div>
          ))}
        </section>
      )}

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Totals check - forms against the request</h3>
        <p className={styles.cardHint}>Every expense class in the line items must appear on a form with the same total. DOST asked that forms and request always agree.</p>
        <div className={styles.tableWrap}>
          <table className={styles.itemTable}>
            <thead><tr><th>Category</th><th>Form</th><th className={styles.numericCell}>Request total</th><th className={styles.numericCell}>On the form</th><th>Result</th></tr></thead>
            <tbody>
              {arrTotalsCheck.map((objRow) => (
                <tr key={objRow.category}>
                  <td><strong>{objRow.category}</strong></td>
                  <td>{objRow.formCode}</td>
                  <td className={styles.numericCell}>{formatBudgetRequestCurrency(objRow.requestTotal)}</td>
                  <td className={styles.numericCell}>{objRow.formTotal === null ? '-' : formatBudgetRequestCurrency(objRow.formTotal)}</td>
                  <td><span className={styles[STATUS_TEXT[objRow.status].className]}>{STATUS_TEXT[objRow.status].text}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className={styles.cardHint}>TAG amounts are mapped to BP Form 207 as a working assumption. DOST has not yet said what TAG means.</p>
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Signed copies</h3>
        <p className={styles.cardHint}>Print each generated form, have it signed by the institution, then upload the scan. The signed copy is the evidence that the data entered is approved.</p>
        {arrSignable.length === 0 && <p className={styles.emptyCell}>No generated forms need a signed copy yet.</p>}
        {arrSignable.map((objEntry) => {
          const objForm = getFormById(objEntry.formId);
          const objFile = objSigned[objEntry.formId];
          return (
            <div key={objEntry.formId} className={styles.overrideRow}>
              <span><strong>{objForm.code}</strong> <span className={styles.subText}>{objFile ? objFile.name : 'No file uploaded'}</span></span>
              <label className={styles.uploadButton}>
                {objFile ? 'Replace file' : 'Upload signed copy'}
                <input type="file" accept=".pdf,image/png,image/jpeg" hidden onChange={(objEvent) => { const objPicked = objEvent.target.files?.[0]; if (objPicked) onSignedChange(objEntry.formId, objPicked); objEvent.target.value = ''; }} />
              </label>
            </div>
          );
        })}
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Summary</h3>
        <dl className={styles.lockedGrid}>
          <div className={styles.lockedField}><dt>Title</dt><dd>{objSummary.title || '-'}</dd></div>
          <div className={styles.lockedField}><dt>Requesting unit</dt><dd>{objSummary.unitName || '-'}</dd></div>
          <div className={styles.lockedField}><dt>Fiscal year</dt><dd>{objSummary.fiscalYearLabel || '-'}</dd></div>
          <div className={styles.lockedField}><dt>Line items</dt><dd>{objSummary.itemCount}</dd></div>
          <div className={styles.lockedField}><dt>Forms required</dt><dd>{objSummary.formCount}</dd></div>
          <div className={styles.lockedField}><dt>Grand total</dt><dd>{formatBudgetRequestCurrency(objSummary.grandTotal)}</dd></div>
        </dl>
        <label htmlFor="submit-comment" className={styles.fieldLabel}>Comment for the reviewer (optional)</label>
        <textarea id="submit-comment" className="form-control" rows={2} value={strComment} onChange={(objEvent) => onCommentChange(objEvent.target.value)} maxLength={500} />
        <div className={styles.inlineActions}>
          <Button variant="outline" onClick={onSaveDraft} loading={blnSavingDraft}>Save as draft</Button>
          <Button onClick={onSubmit} disabled={!blnReady} loading={blnSubmitting}>Submit for review</Button>
        </div>
      </section>
    </>
  );
}

StepReviewSubmit.propTypes = {
  arrIssues: PropTypes.array.isRequired,
  arrTotalsCheck: PropTypes.array.isRequired,
  arrRequired: PropTypes.array.isRequired,
  objSigned: PropTypes.object.isRequired,
  objSummary: PropTypes.object.isRequired,
  strComment: PropTypes.string.isRequired,
  blnSubmitting: PropTypes.bool,
  blnSavingDraft: PropTypes.bool,
  onSignedChange: PropTypes.func.isRequired,
  onCommentChange: PropTypes.func.isRequired,
  onGoToStep: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onSaveDraft: PropTypes.func.isRequired,
};
