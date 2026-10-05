/**
 * System Name: Budget Management System
 * Module Name: Spending Monitoring
 *
 * Purpose of this file:
 * Requesters report actual spending against their approved allotment each quarter;
 * Central Office sees every unit's submission status, late reports and missing justifications.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { getSpendingReports, saveSpendingReport } from '../../api';
import { Badge, Button, Modal, useToast } from '../../components/ui';
import PageHeader from '../../components/layout/page_header';
import { useAuth } from '../../context/auth_context';
import { isRequesterRole } from '../../utils/requesting_unit_scope';
import { formatCurrency, formatTimestamp } from '../../utils/formatters';
import { ProposalTag, SampleDataNote } from '../dashboard/proposal_sections';
import styles from './spending_monitoring.module.css';

const STATUS_BADGES = {
  not_started: { status: 'draft', label: 'Not started' },
  draft: { status: 'pending', label: 'Draft saved' },
  submitted: { status: 'completed', label: 'Submitted' },
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All units' },
  { value: 'not_submitted', label: 'Not submitted' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'late', label: 'Late' },
  { value: 'missing', label: 'Missing justification' },
];

// Same rule as the mock API: obligations to date above the approved allotment need a reason
function needsJustification(objLine) {
  return objLine.obligation_amount !== '' && objLine.obligation_amount !== null
    && Number(objLine.obligation_amount) > Number(objLine.allotment_amount);
}

function formatDay(strDate) {
  if (!strDate) return '—';
  return new Date(`${strDate}T00:00:00+08:00`).toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'Asia/Manila' });
}

function sortNewestFirst(arrReports) {
  return [...arrReports].sort((objA, objB) => String(objB.sr_due_date).localeCompare(String(objA.sr_due_date)));
}

function StatusBadges({ objReport }) {
  const objBadge = STATUS_BADGES[objReport.sr_status] || STATUS_BADGES.not_started;
  return (
    <span className={styles.badges}>
      <Badge status={objBadge.status} label={objBadge.label} />
      {objReport.is_late && <Badge status="rejected" label="Late" />}
    </span>
  );
}

StatusBadges.propTypes = {
  objReport: PropTypes.object.isRequired,
};

function RequesterReport({ arrReports, onSaved }) {
  const { showToast } = useToast();
  const [strReportId, setReportId] = useState(String(arrReports[0]?.id ?? ''));
  const objReport = arrReports.find((row) => String(row.id) === strReportId) || arrReports[0];
  const [arrLines, setLines] = useState([]);
  const [objErrors, setErrors] = useState({});
  const [blnSaving, setSaving] = useState(false);
  const [blnConfirmOpen, setConfirmOpen] = useState(false);
  const blnLocked = objReport?.sr_status === 'submitted';

  useEffect(() => {
    setLines((objReport?.sr_lines || []).map((objLine) => ({
      ...objLine,
      obligation_amount: objLine.obligation_amount ?? '',
      disbursement_amount: objLine.disbursement_amount ?? '',
      justification: objLine.justification ?? '',
    })));
    setErrors({});
  }, [objReport]);

  if (!objReport) {
    return <section className={styles.card}><p className={styles.muted}>No spending report has been set up for your unit yet.</p></section>;
  }

  const updateLine = (intCategoryId, strField, value) => {
    setLines((arrPrev) => arrPrev.map((objLine) => (objLine.category_id === intCategoryId ? { ...objLine, [strField]: value } : objLine)));
  };

  const save = async (blnSubmit) => {
    setSaving(true);
    setConfirmOpen(false);
    try {
      await saveSpendingReport(objReport.id, {
        submit: blnSubmit,
        lines: arrLines.map(({ category_id, obligation_amount, disbursement_amount, justification }) => ({ category_id, obligation_amount, disbursement_amount, justification })),
      });
      showToast({ message: blnSubmit ? 'Spending report submitted to Central Office.' : 'Draft saved.', variant: 'success' });
      onSaved();
    } catch (objError) {
      setErrors(objError.errors || {});
      showToast({ message: objError.message || 'Cannot perform transaction. Error encountered.', variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={styles.card}>
      <div className={styles.reportHead}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Reporting period</span>
          <select className="form-select form-select-sm" value={String(objReport.id)} onChange={(event) => setReportId(event.target.value)}>
            {arrReports.map((row) => <option key={row.id} value={String(row.id)}>{row.sr_period_label}</option>)}
          </select>
        </label>
        <div className={styles.meta}>
          <span><span className={styles.fieldLabel}>Due</span>{formatDay(objReport.sr_due_date)}</span>
          <span><span className={styles.fieldLabel}>Submitted</span>{objReport.sr_submitted_at ? formatTimestamp(objReport.sr_submitted_at) : '—'}</span>
          <StatusBadges objReport={objReport} />
        </div>
      </div>

      <p className={styles.muted}>
        Enter your unit&apos;s actual obligations and disbursements for the year to date. If obligations for an expense class
        are higher than its approved allotment, explain why.
      </p>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Expense class</th>
              <th className={styles.num}>Approved allotment</th>
              <th className={styles.num}>Actual obligations to date</th>
              <th className={styles.num}>Actual disbursements to date</th>
              <th className={styles.num}>Over (under) allotment</th>
              <th>Justification</th>
            </tr>
          </thead>
          <tbody>
            {arrLines.map((objLine) => {
              const blnNeeds = needsJustification(objLine);
              const arrLineErrors = objErrors[objLine.category_id] || [];
              const blnHasObligation = objLine.obligation_amount !== '';
              return (
                <tr key={objLine.category_id} className={arrLineErrors.length > 0 ? styles.errorRow : undefined}>
                  <td>{objLine.category_name}<span className={styles.muted}>{objLine.category_code}</span></td>
                  <td className={styles.num}>{formatCurrency(objLine.allotment_amount)}</td>
                  <td className={styles.num}>
                    <input type="number" step="0.01" className="form-control form-control-sm" aria-label={`Actual obligations, ${objLine.category_name}`}
                      value={objLine.obligation_amount} disabled={blnLocked} onChange={(event) => updateLine(objLine.category_id, 'obligation_amount', event.target.value)} />
                  </td>
                  <td className={styles.num}>
                    <input type="number" step="0.01" className="form-control form-control-sm" aria-label={`Actual disbursements, ${objLine.category_name}`}
                      value={objLine.disbursement_amount} disabled={blnLocked} onChange={(event) => updateLine(objLine.category_id, 'disbursement_amount', event.target.value)} />
                  </td>
                  <td className={`${styles.num} ${blnNeeds ? styles.over : ''}`}>
                    {blnHasObligation ? formatCurrency(Number(objLine.obligation_amount) - Number(objLine.allotment_amount)) : '—'}
                  </td>
                  <td>
                    {blnNeeds || objLine.justification ? (
                      <textarea className="form-control form-control-sm" rows={2} maxLength={1000} aria-label={`Justification, ${objLine.category_name}`}
                        placeholder="Required: why are obligations over the allotment?" value={objLine.justification} disabled={blnLocked}
                        onChange={(event) => updateLine(objLine.category_id, 'justification', event.target.value)} />
                    ) : <span className={styles.muted}>Not needed</span>}
                    {arrLineErrors.map((strError) => <span key={strError} className={styles.error}>{strError}</span>)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!blnLocked && (
        <div className={styles.actions}>
          <Button variant="outline" disabled={blnSaving} onClick={() => save(false)}>Save draft</Button>
          <Button loading={blnSaving} onClick={() => setConfirmOpen(true)}>Submit report</Button>
        </div>
      )}

      <Modal
        open={blnConfirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit spending report?"
        footer={(
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={() => save(true)}>Submit</Button>
          </>
        )}
      >
        <p>You are submitting the {objReport.sr_period_label} report to Central Office. You cannot change it after submitting.</p>
      </Modal>
    </section>
  );
}

RequesterReport.propTypes = {
  arrReports: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSaved: PropTypes.func.isRequired,
};

function CentralOfficeView({ arrReports }) {
  const arrPeriods = useMemo(() => [...new Set(sortNewestFirst(arrReports).map((row) => row.sr_period_label))], [arrReports]);
  const [strPeriod, setPeriod] = useState('');
  const [strStatus, setStatus] = useState('all');
  const [intOpenId, setOpenId] = useState(null);
  const strActivePeriod = strPeriod || arrPeriods[0] || '';

  const arrInPeriod = arrReports.filter((row) => row.sr_period_label === strActivePeriod);
  const arrShown = arrInPeriod.filter((row) => {
    if (strStatus === 'not_submitted') return row.sr_status !== 'submitted';
    if (strStatus === 'submitted') return row.sr_status === 'submitted';
    if (strStatus === 'late') return row.is_late;
    if (strStatus === 'missing') return row.missing_justification_count > 0;
    return true;
  });
  const arrCounts = [
    { label: 'Units', value: arrInPeriod.length },
    { label: 'Submitted', value: arrInPeriod.filter((row) => row.sr_status === 'submitted').length },
    { label: 'Not submitted', value: arrInPeriod.filter((row) => row.sr_status !== 'submitted').length },
    { label: 'Late', value: arrInPeriod.filter((row) => row.is_late).length },
    { label: 'Missing justification', value: arrInPeriod.filter((row) => row.missing_justification_count > 0).length },
  ];
  const sumLines = (objReport, strField) => objReport.sr_lines.reduce((dblSum, objLine) => dblSum + Number(objLine[strField] || 0), 0);

  return (
    <section className={styles.card}>
      <div className={styles.reportHead}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Reporting period</span>
          <select className="form-select form-select-sm" value={strActivePeriod} onChange={(event) => setPeriod(event.target.value)}>
            {arrPeriods.map((strLabel) => <option key={strLabel} value={strLabel}>{strLabel}</option>)}
          </select>
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Show</span>
          <select className="form-select form-select-sm" value={strStatus} onChange={(event) => setStatus(event.target.value)}>
            {STATUS_FILTERS.map((objFilter) => <option key={objFilter.value} value={objFilter.value}>{objFilter.label}</option>)}
          </select>
        </label>
        {arrInPeriod[0] && <span className={styles.meta}><span><span className={styles.fieldLabel}>Due</span>{formatDay(arrInPeriod[0].sr_due_date)}</span></span>}
      </div>

      <div className={styles.counts}>
        {arrCounts.map((objCount) => (
          <div key={objCount.label} className={styles.count}>
            <span className={styles.countValue}>{objCount.value}</span>
            <span className={styles.fieldLabel}>{objCount.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Unit</th>
              <th>Status</th>
              <th>Date submitted</th>
              <th className={styles.num}>Approved allotment</th>
              <th className={styles.num}>Obligations to date</th>
              <th className={styles.num}>Classes over allotment</th>
              <th className={styles.num}>Missing justification</th>
              <th aria-label="Details" />
            </tr>
          </thead>
          <tbody>
            {arrShown.map((objReport) => (
              <ReportRows key={objReport.id} objReport={objReport} blnOpen={intOpenId === objReport.id}
                onToggle={() => setOpenId(intOpenId === objReport.id ? null : objReport.id)}
                dblAllotment={sumLines(objReport, 'allotment_amount')} dblObligation={sumLines(objReport, 'obligation_amount')} />
            ))}
            {arrShown.length === 0 && <tr><td colSpan={8} className={styles.muted}>No units match this filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

CentralOfficeView.propTypes = {
  arrReports: PropTypes.arrayOf(PropTypes.object).isRequired,
};

function ReportRows({ objReport, blnOpen, onToggle, dblAllotment, dblObligation }) {
  const blnStarted = objReport.sr_status !== 'not_started';
  return (
    <>
      <tr>
        <td className="fw-bold">{objReport.unit_name}</td>
        <td><StatusBadges objReport={objReport} /></td>
        <td>{objReport.sr_submitted_at ? formatTimestamp(objReport.sr_submitted_at) : '—'}</td>
        <td className={styles.num}>{formatCurrency(dblAllotment)}</td>
        <td className={styles.num}>{blnStarted ? formatCurrency(dblObligation) : '—'}</td>
        <td className={styles.num}>{blnStarted ? objReport.over_allotment_count : '—'}</td>
        <td className={`${styles.num} ${objReport.missing_justification_count > 0 ? styles.over : ''}`}>{blnStarted ? objReport.missing_justification_count : '—'}</td>
        <td><Button size="sm" variant="outline" disabled={!blnStarted} onClick={onToggle}>{blnOpen ? 'Hide' : 'View'}</Button></td>
      </tr>
      {blnOpen && (
        <tr className={styles.detailRow}>
          <td colSpan={8}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Expense class</th>
                  <th className={styles.num}>Allotment</th>
                  <th className={styles.num}>Obligations</th>
                  <th className={styles.num}>Disbursements</th>
                  <th>Justification</th>
                </tr>
              </thead>
              <tbody>
                {objReport.sr_lines.map((objLine) => (
                  <tr key={objLine.category_id}>
                    <td>{objLine.category_name}</td>
                    <td className={styles.num}>{formatCurrency(objLine.allotment_amount)}</td>
                    <td className={`${styles.num} ${needsJustification(objLine) ? styles.over : ''}`}>{objLine.obligation_amount === null ? '—' : formatCurrency(objLine.obligation_amount)}</td>
                    <td className={styles.num}>{objLine.disbursement_amount === null ? '—' : formatCurrency(objLine.disbursement_amount)}</td>
                    <td>{objLine.justification || (needsJustification(objLine) ? <span className={styles.error}>Missing</span> : <span className={styles.muted}>Not needed</span>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </td>
        </tr>
      )}
    </>
  );
}

ReportRows.propTypes = {
  objReport: PropTypes.object.isRequired,
  blnOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  dblAllotment: PropTypes.number.isRequired,
  dblObligation: PropTypes.number.isRequired,
};

export default function SpendingMonitoringPage() {
  const { user } = useAuth();
  const blnRequester = isRequesterRole(user);
  const [arrReports, setReports] = useState([]);
  const [blnLoading, setLoading] = useState(true);
  const [blnFailed, setFailed] = useState(false);
  const [intReload, setReload] = useState(0);

  useEffect(() => {
    let blnActive = true;
    getSpendingReports()
      .then((arrRows) => { if (blnActive) { setReports(sortNewestFirst(arrRows)); setFailed(false); } })
      .catch(() => { if (blnActive) setFailed(true); })
      .finally(() => { if (blnActive) setLoading(false); });
    return () => { blnActive = false; };
  }, [intReload]);

  const strUnitName = user?.requesting_unit?.ru_name || 'your unit';

  return (
    <div className={styles.page}>
      <PageHeader title={blnRequester ? `Spending Monitoring - ${strUnitName}` : 'Spending Monitoring'} />
      <p className={styles.intro}>
        {blnRequester
          ? 'Report what your unit has actually obligated and paid out against its approved allotment, by the due date.'
          : 'See which units have reported actual spending against their approved allotment, who is late, and which overspends are not yet explained.'}
        {' '}<ProposalTag section="monitoring" />
      </p>
      <SampleDataNote>Reporting periods, due dates and amounts are sample records in the mock database. DOST has not yet confirmed the reporting frequency or the justification rule.</SampleDataNote>

      {blnFailed && <div className={styles.errorBanner}>Cannot perform transaction. Error encountered.</div>}
      {blnLoading && <p className={styles.muted}>Loading...</p>}
      {!blnLoading && !blnFailed && (blnRequester
        ? <RequesterReport arrReports={arrReports} onSaved={() => setReload((intValue) => intValue + 1)} />
        : <CentralOfficeView arrReports={arrReports} />)}
    </div>
  );
}
