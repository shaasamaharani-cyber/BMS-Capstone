/**
 * System Name: Budget Management System
 * Module Name: Dashboard Module
 *
 * Purpose of this file:
 * Central Office dashboard cards. Budget officer: "My work" (to review, to consolidate, returned, external result
 * to record), Follow-ups (spending reports and spending pace, one line per unit) and Deadlines above the tabs.
 * Directors: "Approvals waiting for me" above the tabs, Follow-ups and Deadlines below them.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { getBudgetRequests, getDashboardData, getSpendingReports, getUnifiedBudgets } from '../../api';
import { extractApiRows } from '../../utils/budget_request_utils';
import { formatCurrency, formatRate, formatTimestamp } from '../../utils/formatters';
import { DUE_SOON_DAYS, PACE_PER_QUARTER, daysUntil, expectedPaceForPeriod, formatDay, newestReportFirst, sortByUpdated } from './dashboard_helpers';
import { ProposalTag } from './proposal_sections';
import styles from './requester_dashboard.module.css';

// Card order per role (draft v3, 24 Oct). The work queue is the division's own; directors see Follow-ups view only.
// Activity History was removed: each request and consolidated budget keeps its full history (decision 24 Oct).
const CARD_ORDER = {
  officer: ['work', 'followups', 'calendar'],
  director: ['followups', 'calendar'],
};

const LONG_WAIT_DAYS = 30;

const statusOf = (objRow, strKey) => String(objRow?.[strKey] || '').toLowerCase();
const daysWaiting = (objRequest) => Math.max(0, -daysUntil(String(objRequest.br_updated_at).slice(0, 10)));

export default function CentralOfficeWork({ strView }) {
  const [arrReports, setArrReports] = useState([]);
  const [arrRequests, setArrRequests] = useState([]);
  const [arrUnitRows, setArrUnitRows] = useState([]);
  const [strYearLabel, setStrYearLabel] = useState('');
  const [arrBudgets, setArrBudgets] = useState([]);
  const [blnLoading, setBlnLoading] = useState(true);
  const [blnFailed, setBlnFailed] = useState(false);

  useEffect(() => {
    let blnMounted = true;
    (async () => {
      try {
        const [arrAllReports, objRequests, objBudgets] = await Promise.all([
          getSpendingReports(),
          getBudgetRequests({ per_page: 200 }),
          getUnifiedBudgets({ per_page: 100 }),
        ]);
        const objCurrent = newestReportFirst(arrAllReports)[0];
        const objDashboard = objCurrent ? await getDashboardData({ fiscal_year_id: objCurrent.sr_fiscal_year_id, period: 'annually' }) : null;
        if (!blnMounted) return;
        setArrReports(objCurrent ? arrAllReports.filter((objReport) => objReport.sr_period_label === objCurrent.sr_period_label) : []);
        setArrRequests(extractApiRows(objRequests));
        setArrUnitRows(objDashboard?.monitoring?.performanceRows || []);
        setStrYearLabel(objDashboard?.filters?.fiscalYears?.find((objYear) => String(objYear.value) === String(objCurrent?.sr_fiscal_year_id))?.label || '');
        setArrBudgets(extractApiRows(objBudgets));
      } catch {
        if (blnMounted) setBlnFailed(true);
      } finally {
        if (blnMounted) setBlnLoading(false);
      }
    })();
    return () => { blnMounted = false; };
  }, []);

  const objPeriod = arrReports[0];
  const intDaysLeft = objPeriod ? daysUntil(objPeriod.sr_due_date) : null;
  const intPace = objPeriod ? expectedPaceForPeriod(objPeriod.sr_period_label, PACE_PER_QUARTER) : null;

  // My work: the division's four jobs in the as-is workflow (steps 3-5, 6-7, 10 and 14, 12-16)
  const arrToReview = sortByUpdated(arrRequests.filter((objRequest) => statusOf(objRequest, 'br_status') === 'submitted')).reverse();
  const objByYear = arrRequests
    .filter((objRequest) => statusOf(objRequest, 'br_status') === 'reviewed')
    .reduce((objGroups, objRequest) => {
      const strYear = String(objRequest.fiscal_year?.fy_year || '-');
      return { ...objGroups, [strYear]: [...(objGroups[strYear] || []), objRequest] };
    }, {});
  const arrToConsolidate = Object.entries(objByYear).sort(([strA], [strB]) => strA.localeCompare(strB));
  const arrReturned = arrBudgets.filter((objBudget) => statusOf(objBudget, 'status') === 'rejected');
  const arrExternal = arrBudgets.filter((objBudget) => statusOf(objBudget, 'status') === 'approved' && objBudget.statusLabel === 'Director approved');
  const draftFor = (strYear) => arrBudgets.find((objBudget) => String(objBudget.fiscalYear) === strYear && statusOf(objBudget, 'status') === 'draft');

  // Follow-ups: one line per unit, every reason together (late, missing justification, behind the expected pace)
  const objUnits = {};
  const unitEntry = (strUnit) => {
    objUnits[strUnit] = objUnits[strUnit] || { strUnit, arrReasons: [], blnUrgent: false };
    return objUnits[strUnit];
  };
  arrReports.forEach((objReport) => {
    if (objReport.is_late && objReport.sr_status !== 'submitted') {
      const objEntry = unitEntry(objReport.unit_name);
      objEntry.blnUrgent = true;
      objEntry.arrReasons.push(`Late (report ${objReport.sr_status === 'draft' ? 'in draft' : 'not started'})`);
    }
    if (objReport.missing_justification_count > 0) {
      unitEntry(objReport.unit_name).arrReasons.push(`${objReport.missing_justification_count} class${objReport.missing_justification_count === 1 ? '' : 'es'} over allotment, no justification`);
    }
  });
  if (intPace != null) {
    arrUnitRows.filter((objRow) => objRow.executionRate < intPace).forEach((objRow) => {
      unitEntry(objRow.requestingUnit).arrReasons.push(`${formatRate(objRow.executionRate)} committed, behind the ${intPace}% pace`);
    });
  }
  const arrFollowUps = Object.values(objUnits).sort((objA, objB) => Number(objB.blnUrgent) - Number(objA.blnUrgent) || objA.strUnit.localeCompare(objB.strUnit));
  const arrCounts = [
    { label: 'Units', value: arrReports.length },
    { label: 'Submitted', value: arrReports.filter((objReport) => objReport.sr_status === 'submitted').length },
    { label: 'Late', value: arrReports.filter((objReport) => objReport.is_late && objReport.sr_status !== 'submitted').length },
    { label: 'No justification', value: arrReports.filter((objReport) => objReport.missing_justification_count > 0).length },
  ];

  const arrWorkCounts = [
    { label: 'To review', value: arrToReview.length },
    { label: 'To consolidate', value: arrToConsolidate.length },
    { label: 'Returned for revision', value: arrReturned.length },
    { label: 'External result to record', value: arrExternal.length },
  ];

  const renderCounts = (arrRows) => (
    <div className={styles.pipeline}>
      {arrRows.map((objCount) => (
        <div key={objCount.label} className={styles.pipelineStep}>
          <span className={styles.pipelineCount}>{objCount.value}</span>
          <span className={styles.pipelineLabel}>{objCount.label}</span>
        </div>
      ))}
    </div>
  );

  const renderGroup = (strTitle, strHint, arrRows, strEmpty) => (
    <div className="mt-3">
      <p className="small fw-semibold mb-1">{strTitle} <span className="text-muted fw-normal">{strHint}</span></p>
      {arrRows.length > 0 ? arrRows : <p className={styles.muted}>{strEmpty}</p>}
    </div>
  );

  const objCards = {
    work: (
      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>My work</h3>
        {blnLoading && <p className={styles.muted}>Loading...</p>}
        {renderCounts(arrWorkCounts)}
        {renderGroup('To review', '- oldest first', arrToReview.map((objRequest) => (
          <div key={objRequest.id} className={styles.actionRow}>
            <div>
              <strong>{objRequest.br_title}</strong>
              <span className={styles.muted}>{objRequest.br_reference_no} - {objRequest.requesting_unit?.ru_name || '-'} - waiting since {formatTimestamp(objRequest.br_updated_at)}</span>
            </div>
            <div className="text-end">
              <span className={daysWaiting(objRequest) > LONG_WAIT_DAYS ? 'text-danger' : styles.muted}>{daysWaiting(objRequest)} days</span>
              <div><Link to={`/budget-review/${objRequest.id}`}>Review</Link></div>
            </div>
          </div>
        )), 'No requests are waiting for review.')}
        {renderGroup('To consolidate', '- reviewed requests by fiscal year', arrToConsolidate.map(([strYear, arrYearRequests]) => {
          const objDraft = draftFor(strYear);
          return (
            <div key={strYear} className={styles.actionRow}>
              <div>
                <strong>FY{strYear}</strong>
                <span className={styles.muted}>{arrYearRequests.length} reviewed request{arrYearRequests.length === 1 ? '' : 's'}: {arrYearRequests.map((objRequest) => `${objRequest.br_title} (${objRequest.requesting_unit?.ru_name || '-'})`).join(', ')}</span>
              </div>
              {objDraft
                ? <Link to={`/budget-consolidation/${objDraft.id}/edit`}>Continue draft {objDraft.code}</Link>
                : <Link to="/budget-consolidation/new">Start consolidation</Link>}
            </div>
          );
        }), 'No reviewed requests are waiting to be consolidated.')}
        {renderGroup('Returned for revision', '- by a director or an external body', arrReturned.map((objBudget) => (
          <div key={objBudget.id} className={styles.actionRow}>
            <div>
              <strong>{objBudget.title}</strong>
              <span className={styles.muted}>{objBudget.code} - {objBudget.statusLabel || 'Returned'}</span>
              {objBudget.reviewComment && <span className={styles.remark}>Remark: {objBudget.reviewComment}</span>}
            </div>
            <Link to={`/budget-consolidation/${objBudget.id}/edit`}>Fix and resubmit</Link>
          </div>
        )), 'Nothing has been returned.')}
        {renderGroup('External result to record', '- DBM to President', arrExternal.map((objBudget) => (
          <div key={objBudget.id} className={styles.actionRow}>
            <div>
              <strong>{objBudget.title}</strong>
              <span className={styles.muted}>{objBudget.code} - waiting on {objBudget.stage}</span>
            </div>
            <Link to={`/budget-tracking/${objBudget.id}`}>Record result</Link>
          </div>
        )), 'No budget is waiting on an external decision.')}
      </section>
    ),
    followups: (
      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Follow-ups <ProposalTag section="monitoring" /></h3>
        {blnLoading && <p className={styles.muted}>Loading...</p>}
        {!blnLoading && !objPeriod && <p className={styles.muted}>No spending report period has been set up yet.</p>}
        {objPeriod && (
          <>
            <p className={styles.muted}>As of the {objPeriod.sr_period_label} spending reports - due {formatDay(objPeriod.sr_due_date)}{intDaysLeft < 0 ? ' (overdue)' : ` (${intDaysLeft} day${intDaysLeft === 1 ? '' : 's'} left)`}</p>
            {renderCounts(arrCounts)}
            {arrFollowUps.map((objUnit) => (
              <div key={objUnit.strUnit} className={styles.actionRow}>
                <div>
                  <strong>{objUnit.strUnit}</strong>
                  <span className={`${styles.muted}${objUnit.blnUrgent ? ' text-danger' : ''}`}>{objUnit.arrReasons.join(' - ')}</span>
                </div>
                <Link to="/spending-monitoring">Open</Link>
              </div>
            ))}
            {arrFollowUps.length === 0 && <p className={styles.muted}>No unit needs a follow-up.</p>}
            <p className={styles.footnote}>
              {intPace != null
                ? `Spending pace: ${intPace}% of the allotment committed by the end of this quarter (${PACE_PER_QUARTER}% per quarter, the team default until DOST sets its own). Committed = obligation / allotment, FY${strYearLabel}.`
                : 'No quarter found in the report period, so the spending pace is not checked.'}
            </p>
          </>
        )}
      </section>
    ),
    calendar: (
      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Deadlines and stages <ProposalTag section="calendar" /></h3>
        {objPeriod && (
          <div className={styles.actionRow}>
            <div>
              <strong>Spending reports for {objPeriod.sr_period_label}</strong>
              <span className={styles.muted}>Due {formatDay(objPeriod.sr_due_date)}{intDaysLeft >= 0 && intDaysLeft <= DUE_SOON_DAYS ? ' - due soon' : ''}</span>
            </div>
          </div>
        )}
        <table className={styles.table}>
          <thead><tr><th>Consolidated budget</th><th>Fiscal year</th><th>Current stage</th><th aria-label="Tracking" /></tr></thead>
          <tbody>
            {arrBudgets.map((objBudget) => (
              <tr key={objBudget.id}>
                <td><Link to={`/budget-consolidation/${objBudget.id}`}>{objBudget.title}</Link><span className={styles.muted}>{objBudget.code}</span></td>
                <td>{objBudget.fiscalYear}</td>
                <td>{objBudget.stage}</td>
                {/* Team 27's approval tracking page: the full stage timeline and the external decisions (DBM to President) */}
                <td><Link to={`/budget-tracking/${objBudget.id}`}>Track</Link></td>
              </tr>
            ))}
            {!blnLoading && arrBudgets.length === 0 && <tr><td colSpan={4} className={styles.muted}>No consolidated budgets yet.</td></tr>}
          </tbody>
        </table>
      </section>
    ),
  };

  return (
    <div className={`dashboard-page ${styles.page}`}>
      {blnFailed && <div className={styles.errorBanner}>Cannot perform transaction. Error encountered.</div>}
      {CARD_ORDER[strView].map((strKey) => <Fragment key={strKey}>{objCards[strKey]}</Fragment>)}
    </div>
  );
}

CentralOfficeWork.propTypes = {
  strView: PropTypes.oneOf(['officer', 'director']).isRequired,
};

// Directors approve or reject consolidated budgets the budget officer has sent as Pending (as-is steps 8-11)
export function ApprovalsWaiting({ blnCanApprove }) {
  const [arrPending, setArrPending] = useState([]);
  const [blnLoading, setBlnLoading] = useState(true);
  const [blnFailed, setBlnFailed] = useState(false);

  useEffect(() => {
    let blnMounted = true;
    getUnifiedBudgets({ per_page: 100 })
      .then((objBudgets) => {
        if (blnMounted) setArrPending(extractApiRows(objBudgets).filter((objBudget) => String(objBudget.status).toUpperCase() === 'PENDING'));
      })
      .catch(() => { if (blnMounted) setBlnFailed(true); })
      .finally(() => { if (blnMounted) setBlnLoading(false); });
    return () => { blnMounted = false; };
  }, []);

  return (
    <div className={`dashboard-page ${styles.page}`}>
      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>{blnCanApprove ? 'Approvals waiting for me' : 'Waiting for director approval'}</h3>
        {blnFailed && <div className={styles.errorBanner}>Cannot perform transaction. Error encountered.</div>}
        <table className={styles.table}>
          <thead><tr><th>Consolidated budget</th><th>Fiscal year</th><th className={styles.numeric}>Total</th><th>Sent on</th></tr></thead>
          <tbody>
            {arrPending.map((objBudget) => (
              <tr key={objBudget.id}>
                <td><Link to={`/budget-consolidation/${objBudget.id}`}>{objBudget.title}</Link><span className={styles.muted}>{objBudget.code}</span></td>
                <td>{objBudget.fiscalYear}</td>
                <td className={styles.numeric}>{formatCurrency(objBudget.totals?.grandTotal || 0)}</td>
                <td>{formatTimestamp(objBudget.lastUpdated)}</td>
              </tr>
            ))}
            {!blnLoading && arrPending.length === 0 && <tr><td colSpan={4} className={styles.muted}>{blnCanApprove ? 'Nothing is waiting for your approval.' : 'Nothing is waiting for director approval.'}</td></tr>}
          </tbody>
        </table>
        <p className={styles.footnote}>{blnCanApprove ? 'Open a budget to approve it for the external stages or return it to the Budget and Finance Division.' : 'View only. The finance and planning directors approve or return these budgets.'}</p>
      </section>
    </div>
  );
}

ApprovalsWaiting.propTypes = {
  blnCanApprove: PropTypes.bool.isRequired,
};
