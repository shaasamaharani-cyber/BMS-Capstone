/**
 * System Name: Budget Management System
 * Module Name: Dashboard Module
 *
 * Purpose of this file:
 * Dashboard for a requester (a unit's budget or project officer). It answers one question: "Where is my request, and did
 * my unit spend as planned?" It shows what needs the user's action first, then the unit's request pipeline, then the
 * unit's own spending and the gaps. It never shows other units' figures.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getBudgetRequests, getDashboardData, getSpendingReports } from '../../api';
import { Badge, Button } from '../../components/ui';
import PageHeader from '../../components/layout/page_header';
import { useAuth } from '../../context/auth_context';
import { getScopedRequestingUnitId } from '../../utils/requesting_unit_scope';
import { extractApiRows, getBudgetRequestEditPath } from '../../utils/budget_request_utils';
import { downloadCsv } from '../../utils/csv';
import { formatCurrency, formatRate, formatTimestamp, getRateClassName, toTitleCase } from '../../utils/formatters';
import { FiguresAsOf, ProposalTag } from './proposal_sections';
import { ATTENTION_BELOW, DUE_SOON_DAYS, daysUntil, formatDay, loadRecentActivity, newestReportFirst, sortByUpdated } from './dashboard_helpers';
import styles from './requester_dashboard.module.css';

const UNIFIED_DRAFT_KEY = 'dost-bms.unified-request.draft';
const RECENT_REQUEST_COUNT = 5;
const RECENT_ACTIVITY_COUNT = 5;


const STATUS_STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Pending review' },
  { key: 'rejected', label: 'Returned' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'consolidated', label: 'Consolidated' },
];

const REPORT_STATUS_LABELS = { not_started: 'Not started', draft: 'Draft saved', submitted: 'Submitted' };

// Where a request is now. Consolidated requests show the last approval stage their consolidated budget reached (approved or rejected there).
const WHERE_NOW = {
  draft: 'Your unit (draft)',
  rejected: 'Your unit (returned)',
  submitted: 'Central Office review',
  reviewed: 'Waiting for consolidation',
};

const RATE_MEANINGS = {
  executionRate: { label: 'Committed', help: 'Obligation as a share of allotment' },
  disbursementRate: { label: 'Paid out of commitments', help: 'Disbursement as a share of obligation' },
  absorptionRate: { label: 'Paid out of released funds', help: 'Disbursement as a share of allotment' },
};

function readLocalDraft() {
  try {
    const objDraft = JSON.parse(localStorage.getItem(UNIFIED_DRAFT_KEY) || 'null');
    if (!objDraft?.objRequest?.title?.trim()) return null;
    return { title: objDraft.objRequest.title.trim(), intStep: Number(objDraft.intStep) || 0 };
  } catch {
    return null;
  }
}

// Every fiscal year (not in the future) with spending recorded for this unit, newest first
async function loadUnitHistory(intUnitId) {
  const objBase = await getDashboardData({ requesting_unit_id: intUnitId, period: 'annually' });
  const intThisYear = new Date().getFullYear();
  const arrYears = (objBase.filters?.fiscalYears || [])
    .filter((objYear) => Number(objYear.label) <= intThisYear)
    .sort((objA, objB) => Number(objB.label) - Number(objA.label));

  const arrData = await Promise.all(arrYears.map((objYear) => getDashboardData({ requesting_unit_id: intUnitId, fiscal_year_id: objYear.value, period: 'annually' })));
  return arrYears
    .map((objYear, intIndex) => ({ yearLabel: objYear.label, objRow: arrData[intIndex].monitoring?.performanceRows?.[0], objMonitoring: arrData[intIndex].monitoring }))
    .filter((objYear) => objYear.objRow);
}

export default function RequesterDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const intUnitId = useMemo(() => getScopedRequestingUnitId(user), [user]);
  const strUnitName = user?.requesting_unit?.ru_name || 'your unit';

  const [arrRequests, setArrRequests] = useState([]);
  const [arrHistory, setArrHistory] = useState([]);
  const [objReport, setObjReport] = useState(null);
  const [arrActivity, setArrActivity] = useState([]);
  const [blnLoading, setBlnLoading] = useState(true);
  const [blnFailed, setBlnFailed] = useState(false);
  const objLocalDraft = useMemo(() => readLocalDraft(), []);

  useEffect(() => {
    let blnMounted = true;
    (async () => {
      try {
        const [objRequests, arrUnitHistory, arrReports] = await Promise.all([
          getBudgetRequests({ per_page: 100 }),
          intUnitId ? loadUnitHistory(intUnitId) : Promise.resolve([]),
          getSpendingReports(),
        ]);
        const arrRows = extractApiRows(objRequests);
        const arrRecentLogs = await loadRecentActivity(sortByUpdated(arrRows).slice(0, RECENT_ACTIVITY_COUNT), RECENT_ACTIVITY_COUNT);
        if (!blnMounted) return;
        setArrRequests(arrRows);
        setArrHistory(arrUnitHistory);
        setObjReport(newestReportFirst(arrReports)[0] || null);
        setArrActivity(arrRecentLogs);
      } catch {
        if (blnMounted) setBlnFailed(true);
      } finally {
        if (blnMounted) setBlnLoading(false);
      }
    })();
    return () => { blnMounted = false; };
  }, [intUnitId]);

  const arrNeedsAction = arrRequests.filter((objRequest) => ['rejected', 'draft'].includes(String(objRequest.br_status).toLowerCase()));
  const arrRecent = sortByUpdated(arrRequests).slice(0, RECENT_REQUEST_COUNT);
  const objExecution = arrHistory[0] || null;
  const blnReportOpen = objReport && objReport.sr_status !== 'submitted';
  const intDaysLeft = objReport ? daysUntil(objReport.sr_due_date) : null;
  const countByStatus = (strKey) => arrRequests.filter((objRequest) => String(objRequest.br_status).toLowerCase() === strKey).length;

  const arrAttention = objExecution
    ? Object.entries(RATE_MEANINGS)
      .map(([strKey, objMeaning]) => ({ strKey, ...objMeaning, numValue: objExecution.objRow[strKey] }))
      .filter((objRate) => objRate.numValue < ATTENTION_BELOW)
    : [];

  const arrGaps = objExecution
    ? (objExecution.objMonitoring.releasedVariance?.labels || []).map((strLabel, intIndex) => ({
      strLabel,
      numNotReleased: objExecution.objMonitoring.releasedVariance.values[intIndex] || 0,
      numNotCommitted: objExecution.objMonitoring.executionVariance.values[intIndex] || 0,
    }))
    : [];

  const arrAlerts = [
    ...arrAttention.map((objRate) => ({ strKey: objRate.strKey, node: <><span className={getRateClassName(objRate.numValue)}>{formatRate(objRate.numValue)}</span> - {objRate.label.toLowerCase()} is below {ATTENTION_BELOW}%. {objRate.help}.</> })),
    ...(objReport?.over_allotment_count > 0 ? [{ strKey: 'over', node: <>{objReport.over_allotment_count} expense class{objReport.over_allotment_count === 1 ? ' is' : 'es are'} over the approved allotment in the {objReport.sr_period_label} spending report{objReport.missing_justification_count > 0 ? ', and a justification is still missing' : ''}.</> }] : []),
    ...(blnReportOpen && objReport.is_late ? [{ strKey: 'late', node: <>The {objReport.sr_period_label} spending report is late. It was due {formatDay(objReport.sr_due_date)}.</> }] : []),
    ...(blnReportOpen && !objReport.is_late && intDaysLeft <= DUE_SOON_DAYS ? [{ strKey: 'due', node: <>The {objReport.sr_period_label} spending report is due in {intDaysLeft} day{intDaysLeft === 1 ? '' : 's'} ({formatDay(objReport.sr_due_date)}).</> }] : []),
  ];

  return (
    <div className={`dashboard-page ${styles.page}`}>
      <PageHeader title={`My dashboard - ${strUnitName}`}>
        <Button onClick={() => navigate('/budget-requests/unified/new')}>+ New Request</Button>
      </PageHeader>

      {blnFailed && <div className={styles.errorBanner}>Cannot perform transaction. Error encountered.</div>}

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Needs your action</h3>
        {blnLoading && <p className={styles.muted}>Loading...</p>}

        {blnReportOpen && (
          <div className={styles.actionRow}>
            <div>
              <strong>Spending report for {objReport.sr_period_label}</strong>
              <span className={styles.muted}>{objReport.is_late ? `Late - was due ${formatDay(objReport.sr_due_date)}` : `Due ${formatDay(objReport.sr_due_date)}`}</span>
            </div>
            <Button size="sm" onClick={() => navigate('/spending-monitoring')}>Open report</Button>
          </div>
        )}

        {objLocalDraft && (
          <div className={styles.actionRow}>
            <div>
              <strong>Unfinished request: {objLocalDraft.title}</strong>
              <span className={styles.muted}>Saved on this device. You stopped at step {objLocalDraft.intStep + 1} of 5.</span>
            </div>
            <Button size="sm" onClick={() => navigate('/budget-requests/unified/new')}>Continue</Button>
          </div>
        )}

        {arrNeedsAction.map((objRequest) => {
          const blnReturned = String(objRequest.br_status).toLowerCase() === 'rejected';
          return (
            <div key={objRequest.id} className={styles.actionRow}>
              <div>
                <strong>{objRequest.br_title}</strong>
                <span className={styles.muted}>{objRequest.br_reference_no} - {blnReturned ? 'returned by the reviewer' : 'saved as a draft'}</span>
                {blnReturned && objRequest.br_review_comment && <span className={styles.remark}>Reviewer&apos;s remark: {objRequest.br_review_comment}</span>}
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate(getBudgetRequestEditPath(objRequest.id, Boolean(objRequest.br_unified_request)))}>{blnReturned ? 'Fix and resubmit' : 'Open'}</Button>
            </div>
          );
        })}

        {!blnLoading && !blnReportOpen && !objLocalDraft && arrNeedsAction.length === 0 && <p className={styles.muted}>Nothing needs your action right now.</p>}
      </section>

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Spending Monitoring <ProposalTag section="monitoring" /></h3>
        {!blnLoading && !objReport && <p className={styles.muted}>No spending report has been set up for your unit yet.</p>}
        {objReport && (
          <>
            <div className={styles.amounts}>
              <div className={styles.amount}>
                <span className={styles.amountLabel}>Reporting period</span>
                <span className={styles.amountValue}>{objReport.sr_period_label}</span>
              </div>
              <div className={styles.amount}>
                <span className={styles.amountLabel}>Status</span>
                <span className={styles.amountValue}>{REPORT_STATUS_LABELS[objReport.sr_status] || 'Not started'}{objReport.is_late ? ' (late)' : ''}</span>
              </div>
              <div className={styles.amount}>
                <span className={styles.amountLabel}>Due</span>
                <span className={styles.amountValue}>{formatDay(objReport.sr_due_date)}</span>
                {blnReportOpen && <span className={styles.muted}>{intDaysLeft >= 0 ? `${intDaysLeft} day${intDaysLeft === 1 ? '' : 's'} left` : `${-intDaysLeft} day${intDaysLeft === -1 ? '' : 's'} late`}</span>}
              </div>
              <div className={styles.amount}>
                <span className={styles.amountLabel}>Classes over allotment</span>
                <span className={styles.amountValue}>{objReport.sr_status === 'not_started' ? '—' : objReport.over_allotment_count}</span>
              </div>
            </div>
            <div className={styles.linkRow}><Link to="/spending-monitoring">{blnReportOpen ? 'Fill in the spending report' : 'See the spending report'}</Link></div>
          </>
        )}
      </section>

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Alerts <ProposalTag section="alerts" /></h3>
        {!blnLoading && arrAlerts.length === 0 && <p className={styles.muted}>No alerts for {strUnitName} right now.</p>}
        {arrAlerts.length > 0 && (
          <ul className={styles.attentionList}>
            {arrAlerts.map((objAlert) => <li key={objAlert.strKey}>{objAlert.node}</li>)}
          </ul>
        )}
        <p className={styles.footnote}>Rates below {ATTENTION_BELOW}% use the existing dashboard&apos;s colour bands, and &quot;due soon&quot; means within {DUE_SOON_DAYS} days. DOST has not yet set its own thresholds.</p>
      </section>

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Financial Overview - how {strUnitName} is spending {objExecution ? `- FY${objExecution.yearLabel}` : ''} <ProposalTag section="overview" /></h3>
        {objExecution && <FiguresAsOf asOf={`FY${objExecution.yearLabel}`} source="BMS budget execution records for your unit (mock database in Phase 1)" />}
        {!blnLoading && !objExecution && <p className={styles.muted}>No spending has been recorded for your unit yet.</p>}

        {objExecution && (
          <>
            <div className={styles.amounts}>
              {[['Appropriation', 'appropriation'], ['Allotment (released)', 'allotment'], ['Obligation (committed)', 'obligation'], ['Disbursement (paid)', 'disbursement']].map(([strLabel, strKey]) => (
                <div key={strKey} className={styles.amount}>
                  <span className={styles.amountLabel}>{strLabel}</span>
                  <span className={styles.amountValue}>{formatCurrency(objExecution.objRow[strKey])}</span>
                </div>
              ))}
            </div>

            <div className={styles.rates}>
              {Object.entries(RATE_MEANINGS).map(([strKey, objMeaning]) => (
                <div key={strKey} className={styles.rate}>
                  <span className={`${styles.rateValue} ${getRateClassName(objExecution.objRow[strKey])}`}>{formatRate(objExecution.objRow[strKey])}</span>
                  <span className={styles.rateLabel}>{objMeaning.label}</span>
                  <span className={styles.muted}>{objMeaning.help}</span>
                </div>
              ))}
            </div>

            <h4 className={styles.subTitle}>Where the gaps are, by category</h4>
            <table className={styles.table}>
              <thead><tr><th>Category</th><th className={styles.numeric}>Not yet released</th><th className={styles.numeric}>Released but not committed</th></tr></thead>
              <tbody>
                {arrGaps.map((objGap) => (
                  <tr key={objGap.strLabel}><td>{objGap.strLabel}</td><td className={styles.numeric}>{formatCurrency(objGap.numNotReleased)}</td><td className={styles.numeric}>{formatCurrency(objGap.numNotCommitted)}</td></tr>
                ))}
              </tbody>
            </table>
            <p className={styles.footnote}>
              Figures are demonstration data for FY{objExecution.yearLabel}. Colour bands follow the existing dashboard and are not yet DOST targets.
              Amounts are in PHP.
            </p>
          </>
        )}
      </section>

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>My requests <ProposalTag section="calendar" /></h3>
        <div className={styles.pipeline}>
          {STATUS_STEPS.map((objStep) => (
            <div key={objStep.key} className={styles.pipelineStep}>
              <span className={styles.pipelineCount}>{countByStatus(objStep.key)}</span>
              <span className={styles.pipelineLabel}>{objStep.label}</span>
            </div>
          ))}
        </div>

        <table className={styles.table}>
          <thead><tr><th>Request</th><th>Fiscal year</th><th>Status</th><th>Where it is now</th><th>Last updated</th></tr></thead>
          <tbody>
            {arrRecent.map((objRequest) => {
              const strStatus = String(objRequest.br_status).toLowerCase();
              return (
                <tr key={objRequest.id}>
                  <td><Link to={`/budget-requests/${objRequest.id}`}>{objRequest.br_title}</Link><span className={styles.muted}>{objRequest.br_reference_no}</span></td>
                  <td>{objRequest.fiscal_year?.fy_year || '-'}</td>
                  <td><Badge status={objRequest.br_status} label={strStatus === 'rejected' ? 'Returned' : undefined} /></td>
                  <td>{strStatus === 'consolidated' ? `Consolidated budget${objRequest.current_stage ? ` - last stage: ${objRequest.current_stage}` : ''}` : (WHERE_NOW[strStatus] || '-')}</td>
                  <td>{formatTimestamp(objRequest.br_updated_at)}</td>
                </tr>
              );
            })}
            {!blnLoading && arrRecent.length === 0 && <tr><td colSpan={5} className={styles.muted}>You have not created a request yet.</td></tr>}
          </tbody>
        </table>
        <div className={styles.linkRow}><Link to="/budget-requests">See all my requests</Link></div>
      </section>

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Past years - {strUnitName} <ProposalTag section="forecast" /></h3>
        {!blnLoading && arrHistory.length === 0 && <p className={styles.muted}>No spending has been recorded for your unit yet.</p>}
        {arrHistory.length > 0 && (
          <table className={styles.table}>
            <thead><tr><th>Fiscal year</th><th className={styles.numeric}>Allotment</th><th className={styles.numeric}>Obligation</th><th className={styles.numeric}>Disbursement</th><th className={styles.numeric}>Committed</th></tr></thead>
            <tbody>
              {arrHistory.map((objYear) => (
                <tr key={objYear.yearLabel}>
                  <td>FY{objYear.yearLabel}</td>
                  <td className={styles.numeric}>{formatCurrency(objYear.objRow.allotment)}</td>
                  <td className={styles.numeric}>{formatCurrency(objYear.objRow.obligation)}</td>
                  <td className={styles.numeric}>{formatCurrency(objYear.objRow.disbursement)}</td>
                  <td className={`${styles.numeric} ${getRateClassName(objYear.objRow.executionRate)}`}>{formatRate(objYear.objRow.executionRate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <p className={styles.footnote}>History only. Projections and next-cycle suggestions are prepared by Central Office.</p>
        {arrHistory.length > 0 && (
          <div className={styles.linkRow}>
            <Button size="sm" variant="outline" onClick={() => downloadCsv(`${strUnitName}-spending-by-year.csv`, ['Fiscal year', 'Appropriation', 'Allotment', 'Obligation', 'Disbursement', 'Committed %', 'Paid of commitments %', 'Absorption %'], arrHistory.map((objYear) => [objYear.yearLabel, objYear.objRow.appropriation, objYear.objRow.allotment, objYear.objRow.obligation, objYear.objRow.disbursement, objYear.objRow.executionRate, objYear.objRow.disbursementRate, objYear.objRow.absorptionRate]))}>Download my unit summary (CSV)</Button>
          </div>
        )}
      </section>

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Activity History <ProposalTag section="activity" /></h3>
        {!blnLoading && arrActivity.length === 0 && <p className={styles.muted}>No actions have been recorded on your requests yet. Submitting or reviewing a request adds an entry here.</p>}
        {arrActivity.length > 0 && (
          <table className={styles.table}>
            <thead><tr><th>When</th><th>Request</th><th>What happened</th><th>By</th></tr></thead>
            <tbody>
              {arrActivity.map((objLog) => (
                <tr key={objLog.bral_id}>
                  <td>{formatTimestamp(objLog.bral_created_at)}</td>
                  <td>{objLog.strTitle}</td>
                  <td>{toTitleCase(objLog.bral_action)}{objLog.bral_comment && <span className={styles.muted}>Remark: {objLog.bral_comment}</span>}</td>
                  <td>{objLog.bral_actor_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
