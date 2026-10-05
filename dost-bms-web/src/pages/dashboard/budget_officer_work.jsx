/**
 * System Name: Budget Management System
 * Module Name: Dashboard Module
 *
 * Purpose of this file:
 * "My work" block for the Central Office budget officer, shown above the dashboard tabs:
 * spending monitoring across units, the review queue, alerts, deadlines and stages, recent activity.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getBudgetRequests, getDashboardData, getSpendingReports, getUnifiedBudgets } from '../../api';
import { extractApiRows } from '../../utils/budget_request_utils';
import { formatRate, formatTimestamp, getRateClassName, toTitleCase } from '../../utils/formatters';
import { DUE_SOON_DAYS, daysUntil, formatDay, loadRecentActivity, newestReportFirst, sortByUpdated } from './dashboard_helpers';
import { ProposalTag } from './proposal_sections';
import styles from './requester_dashboard.module.css';

const RECENT_ACTIVITY_COUNT = 10;
// Same colour band as the rest of the dashboard (amber/red below 90%). DOST has not confirmed its own targets.
const ATTENTION_BELOW = 90;

export default function BudgetOfficerWork() {
  const [arrReports, setArrReports] = useState([]);
  const [arrQueue, setArrQueue] = useState([]);
  const [arrUnitRows, setArrUnitRows] = useState([]);
  const [strYearLabel, setStrYearLabel] = useState('');
  const [arrBudgets, setArrBudgets] = useState([]);
  const [arrActivity, setArrActivity] = useState([]);
  const [blnLoading, setBlnLoading] = useState(true);
  const [blnFailed, setBlnFailed] = useState(false);

  useEffect(() => {
    let blnMounted = true;
    (async () => {
      try {
        const [arrAllReports, objRequests, objBudgets] = await Promise.all([
          getSpendingReports(),
          getBudgetRequests({ per_page: 100 }),
          getUnifiedBudgets({ per_page: 100 }),
        ]);
        const arrRequests = extractApiRows(objRequests);
        const objCurrent = newestReportFirst(arrAllReports)[0];
        const [objDashboard, arrLogs] = await Promise.all([
          objCurrent ? getDashboardData({ fiscal_year_id: objCurrent.sr_fiscal_year_id, period: 'annually' }) : Promise.resolve(null),
          loadRecentActivity(sortByUpdated(arrRequests).slice(0, RECENT_ACTIVITY_COUNT), RECENT_ACTIVITY_COUNT),
        ]);
        if (!blnMounted) return;
        setArrReports(objCurrent ? arrAllReports.filter((objReport) => objReport.sr_period_label === objCurrent.sr_period_label) : []);
        // Oldest first: the request that has waited longest is reviewed first
        setArrQueue(sortByUpdated(arrRequests.filter((objRequest) => String(objRequest.br_status).toLowerCase() === 'submitted')).reverse());
        setArrUnitRows(objDashboard?.monitoring?.performanceRows || []);
        setStrYearLabel(objDashboard?.filters?.fiscalYears?.find((objYear) => String(objYear.value) === String(objCurrent?.sr_fiscal_year_id))?.label || '');
        setArrBudgets(extractApiRows(objBudgets));
        setArrActivity(arrLogs);
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
  const arrCounts = [
    { label: 'Units', value: arrReports.length },
    { label: 'Submitted', value: arrReports.filter((objReport) => objReport.sr_status === 'submitted').length },
    { label: 'Not submitted', value: arrReports.filter((objReport) => objReport.sr_status !== 'submitted').length },
    { label: 'Late', value: arrReports.filter((objReport) => objReport.is_late).length },
    { label: 'Missing justification', value: arrReports.filter((objReport) => objReport.missing_justification_count > 0).length },
  ];

  const arrAlerts = [
    ...arrUnitRows.filter((objRow) => objRow.executionRate < ATTENTION_BELOW).map((objRow) => ({
      strKey: `rate-${objRow.requestingUnit}`,
      node: <>{objRow.requestingUnit}: <span className={getRateClassName(objRow.executionRate)}>{formatRate(objRow.executionRate)}</span> of its allotment is committed, below {ATTENTION_BELOW}%.</>,
    })),
    ...arrReports.filter((objReport) => objReport.is_late && objReport.sr_status !== 'submitted').map((objReport) => ({
      strKey: `late-${objReport.id}`,
      node: <>{objReport.unit_name}: the {objReport.sr_period_label} spending report is late (due {formatDay(objReport.sr_due_date)}).</>,
    })),
    ...arrReports.filter((objReport) => objReport.missing_justification_count > 0).map((objReport) => ({
      strKey: `missing-${objReport.id}`,
      node: <>{objReport.unit_name}: obligations are over the allotment in {objReport.missing_justification_count} expense class{objReport.missing_justification_count === 1 ? '' : 'es'} with no justification yet.</>,
    })),
  ];

  return (
    <div className={`dashboard-page ${styles.page}`}>
      {blnFailed && <div className={styles.errorBanner}>Cannot perform transaction. Error encountered.</div>}

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Spending Monitoring - all units <ProposalTag section="monitoring" /></h3>
        {blnLoading && <p className={styles.muted}>Loading...</p>}
        {!blnLoading && !objPeriod && <p className={styles.muted}>No spending report period has been set up yet.</p>}
        {objPeriod && (
          <>
            <p className={styles.muted}>{objPeriod.sr_period_label} - due {formatDay(objPeriod.sr_due_date)}{intDaysLeft >= 0 ? ` (${intDaysLeft} day${intDaysLeft === 1 ? '' : 's'} left)` : ''}</p>
            <div className={styles.pipeline}>
              {arrCounts.map((objCount) => (
                <div key={objCount.label} className={styles.pipelineStep}>
                  <span className={styles.pipelineCount}>{objCount.value}</span>
                  <span className={styles.pipelineLabel}>{objCount.label}</span>
                </div>
              ))}
            </div>
            <div className={styles.linkRow}><Link to="/spending-monitoring">Open Spending Monitoring</Link></div>
          </>
        )}
      </section>

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Review queue</h3>
        <table className={styles.table}>
          <thead><tr><th>Request</th><th>Unit</th><th>Waiting since</th><th className={styles.numeric}>Days waiting</th></tr></thead>
          <tbody>
            {arrQueue.map((objRequest) => (
              <tr key={objRequest.id}>
                <td><Link to={`/budget-review/${objRequest.id}`}>{objRequest.br_title}</Link><span className={styles.muted}>{objRequest.br_reference_no}</span></td>
                <td>{objRequest.requesting_unit?.ru_name || '-'}</td>
                <td>{formatTimestamp(objRequest.br_updated_at)}</td>
                <td className={styles.numeric}>{Math.max(0, -daysUntil(String(objRequest.br_updated_at).slice(0, 10)))}</td>
              </tr>
            ))}
            {!blnLoading && arrQueue.length === 0 && <tr><td colSpan={4} className={styles.muted}>No requests are waiting for review.</td></tr>}
          </tbody>
        </table>
        <div className={styles.linkRow}><Link to="/budget-review">Open Budget Review</Link></div>
      </section>

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Alerts <ProposalTag section="alerts" /></h3>
        {!blnLoading && arrAlerts.length === 0 && <p className={styles.muted}>No alerts right now.</p>}
        {arrAlerts.length > 0 && (
          <ul className={styles.attentionList}>
            {arrAlerts.map((objAlert) => <li key={objAlert.strKey}>{objAlert.node}</li>)}
          </ul>
        )}
        <p className={styles.footnote}>
          Committed rates are for FY{strYearLabel}, the year of the current spending report, and use the existing dashboard&apos;s {ATTENTION_BELOW}% colour band. DOST has not yet set its own thresholds.
        </p>
      </section>

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
          <thead><tr><th>Consolidated budget</th><th>Fiscal year</th><th>Current stage</th></tr></thead>
          <tbody>
            {arrBudgets.map((objBudget) => (
              <tr key={objBudget.id}>
                <td><Link to={`/budget-consolidation/${objBudget.id}`}>{objBudget.title}</Link><span className={styles.muted}>{objBudget.code}</span></td>
                <td>{objBudget.fiscalYear}</td>
                <td>{objBudget.stage}</td>
              </tr>
            ))}
            {!blnLoading && arrBudgets.length === 0 && <tr><td colSpan={3} className={styles.muted}>No consolidated budgets yet.</td></tr>}
          </tbody>
        </table>
      </section>

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Activity History <ProposalTag section="activity" /></h3>
        {!blnLoading && arrActivity.length === 0 && <p className={styles.muted}>No actions have been recorded on budget requests yet.</p>}
        {arrActivity.length > 0 && (
          <table className={styles.table}>
            <thead><tr><th>When</th><th>Request</th><th>What happened</th><th>By</th></tr></thead>
            <tbody>
              {arrActivity.map((objLog) => (
                <tr key={objLog.bral_id}>
                  <td>{formatTimestamp(objLog.bral_created_at)}</td>
                  <td>{objLog.strTitle}<span className={styles.muted}>{objLog.strUnit}</span></td>
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
