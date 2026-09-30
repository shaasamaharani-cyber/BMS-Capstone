/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Step 3 of the unified budget request - shows which BP forms the rules decided are required and why, who normally completes
 * each one, and how much of it the system fills in. A user can add or remove a form, but the change needs a reason and is
 * recorded, so the decision stays auditable.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Dropdown } from '../../components/ui';
import { AUTOMATION_LABELS, BP_FORM_CATALOG, FORM_LEVEL, getFormById } from '../../bp_forms/bp_form_catalog';
import styles from './unified_request.module.css';

export default function StepRequiredForms({ arrRequired, arrNotInCycle, objOverrides, arrEnabledFormIds, strFiscalYearLabel, onOverride, onUndoOverride }) {
  const [strRemovingId, setStrRemovingId] = useState('');
  const [strReason, setStrReason] = useState('');
  const [strAddId, setStrAddId] = useState('');
  const [strAddReason, setStrAddReason] = useState('');

  const arrRequiredIds = arrRequired.map((objEntry) => objEntry.formId);
  const arrAddable = BP_FORM_CATALOG.filter((objForm) => arrEnabledFormIds.includes(objForm.id) && !arrRequiredIds.includes(objForm.id));
  const arrRemoved = Object.entries(objOverrides).filter(([, objOverride]) => objOverride.action === 'remove');

  const handleConfirmRemove = () => {
    if (!strReason.trim()) return;
    onOverride(strRemovingId, { action: 'remove', reason: strReason.trim() });
    setStrRemovingId('');
    setStrReason('');
  };

  const handleConfirmAdd = () => {
    if (!strAddId || !strAddReason.trim()) return;
    onOverride(strAddId, { action: 'add', reason: strAddReason.trim() });
    setStrAddId('');
    setStrAddReason('');
  };

  return (
    <>
      <section className={styles.banner}>
        The system selected <strong>{arrRequired.length} forms</strong> from your answers - you do not have to search a list.
        Rule IDs (BR-xx) come from the team&apos;s business rules register and are <strong>proposed rules awaiting DOST confirmation</strong>.
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Required BP forms</h3>
        <div className={styles.tableWrap}>
          <table className={styles.itemTable}>
            <thead>
              <tr>
                <th>Form</th>
                <th>Why it is required</th>
                <th>Completed by</th>
                <th>Automation</th>
                <th aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {arrRequired.map((objEntry) => {
                const objForm = getFormById(objEntry.formId);
                return (
                  <tr key={objEntry.formId}>
                    <td>
                      <strong>{objForm.code}</strong>
                      <div className={styles.subText}>{objForm.name}</div>
                      {objForm.level === FORM_LEVEL.AGENCY && <span className={styles.chipMuted}>Agency-level form</span>}
                    </td>
                    <td>
                      {objEntry.reasons.map((strReasonText) => <div key={strReasonText}>{strReasonText}</div>)}
                      <div className={styles.ruleIds}>{objEntry.ruleIds.map((strRuleId) => <span key={strRuleId} className={styles.chipRule}>{strRuleId}</span>)}</div>
                    </td>
                    <td>{objForm.completedBy}</td>
                    <td><span className={styles.chipAuto}>{AUTOMATION_LABELS[objForm.automation]}</span></td>
                    <td>
                      {objEntry.origin === 'override'
                        ? <Button variant="ghost" size="sm" onClick={() => onUndoOverride(objEntry.formId)}>Undo add</Button>
                        : <Button variant="ghost" size="sm" onClick={() => setStrRemovingId(objEntry.formId)}>Remove</Button>}
                    </td>
                  </tr>
                );
              })}
              {arrRequired.length === 0 && (
                <tr><td colSpan={5} className={styles.emptyCell}>No forms are required yet. Add line items in step 1 and answer the questions in step 2.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {strRemovingId && (
          <div className={styles.inlinePanel}>
            <strong>Remove {getFormById(strRemovingId)?.code}?</strong>
            <p className={styles.cardHint}>The rules selected this form. Give a reason - it is saved with the request so reviewers can see it.</p>
            <input type="text" className="form-control" value={strReason} onChange={(objEvent) => setStrReason(objEvent.target.value)} placeholder="Reason for removing this form" />
            <div className={styles.inlineActions}>
              <Button variant="danger" size="sm" onClick={handleConfirmRemove} disabled={!strReason.trim()}>Remove form</Button>
              <Button variant="ghost" size="sm" onClick={() => { setStrRemovingId(''); setStrReason(''); }}>Cancel</Button>
            </div>
          </div>
        )}
      </section>

      <section className={styles.card}>
        <h3 className={styles.cardTitle}>Add another form</h3>
        <p className={styles.cardHint}>Use this if the rules missed a form your proposal needs. The addition is recorded with your reason.</p>
        <div className={styles.addRow}>
          <div className={styles.addSelect}>
            <Dropdown options={arrAddable.map((objForm) => ({ value: objForm.id, label: `${objForm.code} - ${objForm.name}` }))} value={strAddId} onChange={setStrAddId} placeholder="Choose a form" searchable />
          </div>
          <input type="text" className="form-control" value={strAddReason} onChange={(objEvent) => setStrAddReason(objEvent.target.value)} placeholder="Reason for adding this form" />
          <Button variant="outline" onClick={handleConfirmAdd} disabled={!strAddId || !strAddReason.trim()}>Add form</Button>
        </div>
      </section>

      {arrRemoved.length > 0 && (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Removed by you</h3>
          {arrRemoved.map(([strFormId, objOverride]) => (
            <div key={strFormId} className={styles.overrideRow}>
              <span><strong>{getFormById(strFormId)?.code}</strong> - {objOverride.reason}</span>
              <Button variant="ghost" size="sm" onClick={() => onUndoOverride(strFormId)}>Restore</Button>
            </div>
          ))}
        </section>
      )}

      {arrNotInCycle.length > 0 && (
        <section className={styles.card}>
          <h3 className={styles.cardTitle}>Selected by the rules but not enabled for FY{strFiscalYearLabel || ''}</h3>
          <p className={styles.cardHint}>An administrator controls which forms DBM requires for each budget cycle. These are skipped for this request.</p>
          {arrNotInCycle.map((objEntry) => <div key={objEntry.formId} className={styles.overrideRow}><span>{getFormById(objEntry.formId)?.code} - {getFormById(objEntry.formId)?.name}</span></div>)}
        </section>
      )}
    </>
  );
}

StepRequiredForms.propTypes = {
  arrRequired: PropTypes.array.isRequired,
  arrNotInCycle: PropTypes.array.isRequired,
  objOverrides: PropTypes.object.isRequired,
  arrEnabledFormIds: PropTypes.array.isRequired,
  strFiscalYearLabel: PropTypes.string,
  onOverride: PropTypes.func.isRequired,
  onUndoOverride: PropTypes.func.isRequired,
};
