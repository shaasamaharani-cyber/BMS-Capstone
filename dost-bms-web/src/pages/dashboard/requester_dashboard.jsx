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
import { getBudgetRequests, getDashboardData } from '../../api';
import { Badge, Button } from '../../components/ui';
import PageHeader from '../../components/layout/page_header';
import { useAuth } from '../../context/auth_context';
import { getScopedRequestingUnitId } from '../../utils/requesting_unit_scope';
import { extractApiRows, getBudgetRequestEditPath } from '../../utils/budget_request_utils';
import { formatCurrency, formatTimestamp } from '../../utils/formatters';
import { ExecutionAmountCards, FinancialAlerts, FinancialOverview, PlanningInsight, ProjectedExpenditureChart } from './execution_insights';
import { buildCategoryAlerts, buildExpenditureProjection, buildPlanningInsight } from './unit_insights';
import styles from './requester_dashboard.module.css';

const UNIFIED_DRAFT_KEY = 'dost-bms.unified-request.draft';
const RECENT_REQUEST_COUNT = 5;

const STATUS_STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'submitted', label: 'Pending review' },
  { key: 'rejected', label: 'Returned' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'consolidated', label: 'Consolidated' },
];

function readLocalDraft() {
  try {
    const objDraft = JSON.parse(localStorage.getItem(UNIFIED_DRAFT_KEY) || 'null');
    if (!objDraft?.objRequest?.title?.trim()) return null;
    return { title: objDraft.objRequest.title.trim(), intStep: Number(objDraft.intStep) || 0 };
  } catch {
    return null;
  }
}

// Every fiscal year (not in the future) with spending recorded for this unit, oldest first. The newest one is the
// year the dashboard reports on; the earlier ones feed the expenditure trend.
async function loadUnitExecution(intUnitId) {
  const objBase = await getDashboardData({ requesting_unit_id: intUnitId, period: 'annually' });
  const intThisYear = new Date().getFullYear();
  const arrYears = (objBase.filters?.fiscalYears || [])
    .filter((objYear) => Number(objYear.label) <= intThisYear)
    .sort((objA, objB) => Number(objA.label) - Number(objB.label));

  const arrData = await Promise.all(arrYears.map((objYear) => getDashboardData({ requesting_unit_id: intUnitId, fiscal_year_id: objYear.value, period: 'annually' })));
  const arrHistory = arrYears
    .map((objYear, intIndex) => ({ yearLabel: objYear.label, objRow: arrData[intIndex].monitoring?.performanceRows?.[0], objMonitoring: arrData[intIndex].monitoring }))
    .filter((objYear) => objYear.objRow);

  if (arrHistory.length === 0) return null;
  return { ...arrHistory[arrHistory.length - 1], arrHistory };
}

export default function RequesterDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const intUnitId = useMemo(() => getScopedRequestingUnitId(user), [user]);
  const strUnitName = user?.requesting_unit?.ru_name || 'your unit';

  const [arrRequests, setArrRequests] = useState([]);
  const [objExecution, setObjExecution] = useState(null);
  const [blnLoading, setBlnLoading] = useState(true);
  const [blnFailed, setBlnFailed] = useState(false);
  const objLocalDraft = useMemo(() => readLocalDraft(), []);

  useEffect(() => {
    let blnMounted = true;
    (async () => {
      try {
        const [objRequests, objUnitExecution] = await Promise.all([
          getBudgetRequests({ per_page: 100 }),
          intUnitId ? loadUnitExecution(intUnitId) : Promise.resolve(null),
        ]);
        if (!blnMounted) return;
        setArrRequests(extractApiRows(objRequests));
        setObjExecution(objUnitExecution);
      } catch {
        if (blnMounted) setBlnFailed(true);
      } finally {
        if (blnMounted) setBlnLoading(false);
      }
    })();
    return () => { blnMounted = false; };
  }, [intUnitId]);

  const arrNeedsAction = arrRequests.filter((objRequest) => ['rejected', 'draft'].includes(String(objRequest.br_status).toLowerCase()));
  const arrRecent = [...arrRequests].sort((objA, objB) => new Date(objB.br_updated_at || 0) - new Date(objA.br_updated_at || 0)).slice(0, RECENT_REQUEST_COUNT);
  const countByStatus = (strKey) => arrRequests.filter((objRequest) => String(objRequest.br_status).toLowerCase() === strKey).length;

  const objInsights = useMemo(() => {
    if (!objExecution) return null;
    const { objRow, objMonitoring, arrHistory } = objExecution;
    const objProjection = buildExpenditureProjection(arrHistory);
    return {
      arrSummaryCards: ['appropriation', 'allotment', 'obligation', 'disbursement'].map((strKey) => ({ key: strKey, value: objRow[strKey] })),
      objProjection,
      dblProjectedVariance: objProjection.projectedNextYear - Number(objRow.appropriation),
      arrAlerts: buildCategoryAlerts(objMonitoring.categoryRows),
      arrPlanning: buildPlanningInsight(objMonitoring.categoryRows),
    };
  }, [objExecution]);

  const scrollToGaps = () => document.getElementById('requester-gaps-heading')?.scrollIntoView({ behavior: 'smooth' });

  const arrGaps = objExecution
    ? (objExecution.objMonitoring.releasedVariance?.labels || []).map((strLabel, intIndex) => ({
      strLabel,
      numNotReleased: objExecution.objMonitoring.releasedVariance.values[intIndex] || 0,
      numNotCommitted: objExecution.objMonitoring.executionVariance.values[intIndex] || 0,
    }))
    : [];

  return (
    <div className={`dashboard-page ${styles.page}`}>
      <PageHeader title={`My dashboard - ${strUnitName}`}>
        <Button onClick={() => navigate('/budget-requests/unified/new')}>+ New Request</Button>
      </PageHeader>

      {blnFailed && <div className={styles.errorBanner}>Cannot perform transaction. Error encountered.</div>}

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Needs your action</h3>
        {blnLoading && <p className={styles.muted}>Loading...</p>}

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

        {!blnLoading && !objLocalDraft && arrNeedsAction.length === 0 && <p className={styles.muted}>Nothing needs your action right now.</p>}
      </section>

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>My requests</h3>
        <div className={styles.pipeline}>
          {STATUS_STEPS.map((objStep) => (
            <div key={objStep.key} className={styles.pipelineStep}>
              <span className={styles.pipelineCount}>{countByStatus(objStep.key)}</span>
              <span className={styles.pipelineLabel}>{objStep.label}</span>
            </div>
          ))}
        </div>

        <table className={styles.table}>
          <thead><tr><th>Request</th><th>Fiscal year</th><th>Status</th><th>Last updated</th></tr></thead>
          <tbody>
            {arrRecent.map((objRequest) => (
              <tr key={objRequest.id}>
                <td><Link to={`/budget-requests/${objRequest.id}`}>{objRequest.br_title}</Link><span className={styles.muted}>{objRequest.br_reference_no}</span></td>
                <td>{objRequest.fiscal_year?.fy_year || '-'}</td>
                <td><Badge status={objRequest.br_status} label={String(objRequest.br_status).toLowerCase() === 'rejected' ? 'Returned' : undefined} /></td>
                <td>{formatTimestamp(objRequest.br_updated_at)}</td>
              </tr>
            ))}
            {!blnLoading && arrRecent.length === 0 && <tr><td colSpan={4} className={styles.muted}>You have not created a request yet.</td></tr>}
          </tbody>
        </table>
        <div className={styles.linkRow}><Link to="/budget-requests">See all my requests</Link></div>
      </section>

      {!blnLoading && !objExecution && (
        <section className={`dashboard-panel ${styles.card}`}>
          <h3 className={`dashboard-section__title ${styles.cardTitle}`}>How {strUnitName} is spending</h3>
          <p className={styles.muted}>No spending has been recorded for your unit yet.</p>
        </section>
      )}

      {objInsights && (
        <>
          <ExecutionAmountCards summaryCards={objInsights.arrSummaryCards} title={`How ${strUnitName} is spending - FY${objExecution.yearLabel}`} />

          <FinancialOverview
            summaryCards={objInsights.arrSummaryCards}
            projectedYearEnd={objInsights.objProjection.projectedNextYear}
            projectedVariance={objInsights.dblProjectedVariance}
          />

          <section className={styles.insightRow}>
            <div className="row g-3">
              <div className="col-lg-7">
                <ProjectedExpenditureChart {...objInsights.objProjection} />
              </div>
              <div className="col-lg-5">
                <FinancialAlerts alerts={objInsights.arrAlerts} onView={scrollToGaps} />
              </div>
            </div>
          </section>

          <PlanningInsight year={Number(objExecution.yearLabel) + 1} items={objInsights.arrPlanning} />

          <section className={`dashboard-panel ${styles.card}`}>
            <h3 id="requester-gaps-heading" className={`dashboard-section__title ${styles.cardTitle}`}>Where the gaps are, by category</h3>
            <table className={styles.table}>
              <thead><tr><th>Category</th><th className={styles.numeric}>Not yet released</th><th className={styles.numeric}>Released but not committed</th></tr></thead>
              <tbody>
                {arrGaps.map((objGap) => (
                  <tr key={objGap.strLabel}><td>{objGap.strLabel}</td><td className={styles.numeric}>{formatCurrency(objGap.numNotReleased)}</td><td className={styles.numeric}>{formatCurrency(objGap.numNotCommitted)}</td></tr>
                ))}
              </tbody>
            </table>
            <p className={styles.footnote}>
              Figures are demonstration data for FY{objExecution.yearLabel}. Projections follow a straight-line trend of the amounts paid, and the alert
              bands (90% and 75%) follow the existing dashboard; neither is a DOST target yet. Amounts are in PHP.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
