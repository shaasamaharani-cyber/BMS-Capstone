/**
 * System Name: Budget Management System
 * Module Name: Dashboard
 *
 * Purpose of this file:
 * Enhanced Budget Execution Monitoring sections: execution amount cards with
 * rates, financial overview, actual vs projected expenditure, financial alerts
 * and next-year planning insight.
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import { Line } from 'react-chartjs-2';
import { formatCurrency, formatShortPeso } from '../../utils/formatters';
import { ProposalTag } from './proposal_sections';
import styles from './execution_insights.module.css';

function SectionTitle({ id, title, tag })
{
  return (
    <h2 id={id} className={styles.sectionTitle}>
      {title}
      {tag}
    </h2>
  );
}

SectionTitle.propTypes = { id: PropTypes.string, title: PropTypes.string.isRequired, tag: PropTypes.node };

function percentOf(dblPart, dblWhole)
{
  return dblWhole > 0 ? (dblPart / dblWhole) * 100 : 0;
}

export function ExecutionAmountCards({ summaryCards, title = 'Budget Execution Amount', tag = <ProposalTag section="overview" /> })
{
  const objByKey = Object.fromEntries((summaryCards || []).map((objCard) => [objCard.key, Number(objCard.value) || 0]));
  const { appropriation = 0, allotment = 0, obligation = 0, disbursement = 0 } = objByKey;

  const arrCards = [
    { key: 'appropriation', label: 'Appropriation', value: appropriation, note: 'Total Approved', variant: 'blue' },
    { key: 'allotment',     label: 'Allotment',     value: allotment,     rate: percentOf(allotment, appropriation),  of: 'of Appropriation', variant: 'dark' },
    { key: 'obligation',    label: 'Obligation',    value: obligation,    rate: percentOf(obligation, allotment),     of: 'of Allotment',     variant: 'blue' },
    { key: 'disbursement',  label: 'Disbursement',  value: disbursement,  rate: percentOf(disbursement, obligation),  of: 'of Obligations',   variant: 'dark' },
  ];

  return (
    <section className={styles.section} aria-labelledby="exec-amount-heading">
      <SectionTitle id="exec-amount-heading" title={title} tag={tag} />
      <div className="row g-3">
        {arrCards.map((objCard) => (
          <div className="col-sm-6 col-xl-3" key={objCard.key}>
            <div className={`${styles.card} ${styles[`card_${objCard.variant}`]}`}>
              <div className={styles.cardHead}>
                <span className={styles.cardLabel}>{objCard.label}</span>
                {objCard.rate !== undefined && <span className={styles.ratePill}>{objCard.rate.toFixed(1)}%</span>}
              </div>
              <div className={styles.cardAmount}>{formatCurrency(objCard.value)}</div>
              {objCard.rate !== undefined
                ? <div className={styles.cardNoteOk}>{objCard.rate.toFixed(1)}% {objCard.of}</div>
                : <div className={styles.cardNote}>{objCard.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

ExecutionAmountCards.propTypes = { summaryCards: PropTypes.array, title: PropTypes.string, tag: PropTypes.node };

export function FinancialOverview({ summaryCards, projectedYearEnd, projectedVariance })
{
  const objByKey = Object.fromEntries((summaryCards || []).map((objCard) => [objCard.key, Number(objCard.value) || 0]));
  const dblUtilisation = percentOf(objByKey.obligation || 0, objByKey.allotment || 0);
  const blnOverspend = projectedVariance > 0;

  return (
    <section className={styles.section} aria-labelledby="fin-overview-heading">
      <SectionTitle id="fin-overview-heading" title="Financial Overview" tag={<ProposalTag section="overview" />} />
      <div className="row g-3">
        <div className="col-md-4">
          <div className={`${styles.card} ${styles.card_green}`}>
            <span className={styles.cardLabel}>Budget Utilisation</span>
            <div className={styles.bigValue}>{dblUtilisation.toFixed(1)}%</div>
            <div className={styles.cardNoteOk}>Within Expected Range</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className={`${styles.card} ${styles.card_blue}`}>
            <span className={styles.cardLabel}>Projected Year-End</span>
            <div className={styles.bigValue}>{formatShortPeso(projectedYearEnd)}</div>
            <div className={styles.cardNoteInfo}>Based on current spending</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className={`${styles.card} ${blnOverspend ? styles.card_red : styles.card_green}`}>
            <span className={styles.cardLabel}>Projected Variance</span>
            <div className={`${styles.bigValue} ${blnOverspend ? styles.textDanger : ''}`}>
              {blnOverspend ? '+' : ''}{formatShortPeso(projectedVariance)}
            </div>
            <div className={blnOverspend ? styles.cardNoteDanger : styles.cardNoteOk}>
              {blnOverspend ? '⚠️ Projected Overspend' : 'Projected Underspend'}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

FinancialOverview.propTypes = {
  summaryCards: PropTypes.array,
  projectedYearEnd: PropTypes.number.isRequired,
  projectedVariance: PropTypes.number.isRequired,
};

// Draws the dashed "Today" line on the chart
const todayLinePlugin = {
  id: 'todayLine',
  afterDatasetsDraw(chart, _args, objOptions)
  {
    if (objOptions?.index === undefined) return;
    const objX = chart.scales.x;
    const objArea = chart.chartArea;
    const dblX = objX.getPixelForValue(objOptions.index);
    const { ctx } = chart;
    ctx.save();
    ctx.strokeStyle = '#9aa1ad';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(dblX, objArea.top);
    ctx.lineTo(dblX, objArea.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#9aa1ad';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Today', dblX - 20, objArea.top + 10);
    ctx.restore();
  },
};

export function ProjectedExpenditureChart({ labels, values, todayIndex, subtitle, yTicks })
{
  const strBlue = '#14a7e0';
  // Actual stops at today, projected starts at today so the two lines join
  const arrActual = values.map((dblValue, intIndex) => (intIndex <= todayIndex ? dblValue : null));
  const arrProjected = values.map((dblValue, intIndex) => (intIndex >= todayIndex ? dblValue : null));

  const objData = {
    labels,
    datasets: [
      { label: 'Actual', data: arrActual, borderColor: strBlue, backgroundColor: strBlue, tension: 0.4, pointRadius: 0, borderWidth: 2, spanGaps: true },
      { label: 'Projected', data: arrProjected, borderColor: strBlue, backgroundColor: strBlue, borderDash: [6, 4], tension: 0.4, pointRadius: 0, borderWidth: 2 },
    ],
  };

  const objOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { color: strBlue, usePointStyle: true, boxHeight: 6, font: { size: 11 } } },
      tooltip: { callbacks: { label: (objCtx) => `${objCtx.dataset.label}: ${formatShortPeso(objCtx.parsed.y)}` } },
      todayLine: { index: todayIndex },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: {
        min: 0,
        max: yTicks ? yTicks[yTicks.length - 1] : undefined,
        afterBuildTicks: yTicks ? (objAxis) => { objAxis.ticks = yTicks.map((dblValue) => ({ value: dblValue })); } : undefined,
        ticks: { maxTicksLimit: 5, callback: (dblValue) => formatShortPeso(dblValue), font: { size: 11 } },
        grid: { borderDash: [4, 4] },
      },
    },
  };

  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>Actual and Projected Expenditure <ProposalTag section="forecast" /></h3>
      {subtitle && <div className={styles.panelSubtitle}>{subtitle}</div>}
      <div className={styles.chart}>
        <Line data={objData} options={objOptions} plugins={[todayLinePlugin]} />
      </div>
    </div>
  );
}

ProjectedExpenditureChart.propTypes = {
  labels: PropTypes.arrayOf(PropTypes.string).isRequired,
  values: PropTypes.arrayOf(PropTypes.number).isRequired,
  todayIndex: PropTypes.number.isRequired,
  subtitle: PropTypes.string,
  yTicks: PropTypes.arrayOf(PropTypes.number),
};

export function FinancialAlerts({ alerts, onView })
{
  return (
    <div className={styles.panel}>
      <h3 className={styles.panelTitle}>Financial Alerts <ProposalTag section="alerts" /></h3>
      <div className={styles.alertList}>
        {alerts.length === 0 && <p className={styles.alertText}>No alerts. Every category is within the expected range.</p>}
        {alerts.map((objAlert) => (
          <div key={objAlert.key} className={`${styles.alert} ${styles[`alert_${objAlert.level}`]}`}>
            <div className={styles.alertHead}>
              <span className={styles.alertTitle}>
                <span className={styles.alertDot} aria-hidden="true" />
                {objAlert.title}
              </span>
                {onView && <button type="button" className={styles.viewButton} onClick={() => onView(objAlert)}>View</button>}
            </div>
            <p className={styles.alertText}>{objAlert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

FinancialAlerts.propTypes = { alerts: PropTypes.array.isRequired, onView: PropTypes.func };

export function PlanningInsight({ year, items })
{
  const intColumnWidth = Math.max(3, Math.floor(12 / Math.max(1, items.length)));

  return (
    <section className={`${styles.panel} ${styles.section}`} aria-labelledby="planning-insight-heading">
      <h3 id="planning-insight-heading" className={styles.panelTitle}>
        {year} Budget Planning Insight <ProposalTag section="forecast" />
      </h3>
      {items.length === 0 && <p className={styles.panelSubtitle}>No allocation recorded yet to plan from.</p>}
      <div className="row g-4 mt-1">
        {items.map((objItem) => (
          <div className={`col-lg-${intColumnWidth}`} key={objItem.key}>
            <div className={styles.insightTitle}>{objItem.title}</div>
            <div className={styles.insightRow}>
              <span>{year - 1} Allocation</span>
              <span className={styles.insightValue}>{objItem.allocation}</span>
            </div>
            <div className={styles.insightRow}>
              <span>{year - 1} Projected Expenditure</span>
              <span className={styles[`tone_${objItem.projectedTone}`]}>{objItem.projected}</span>
            </div>
            <div className={styles.insightRow}>
              <span>Suggested {year} Planning</span>
              <span className={styles[`tone_${objItem.suggestedTone}`]}>{objItem.suggested}</span>
            </div>
            <div className={`${styles.insightNote} ${styles[`note_${objItem.insightTone}`]}`}>
              <strong>Insight:</strong> {objItem.insight}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

PlanningInsight.propTypes = { year: PropTypes.number.isRequired, items: PropTypes.array.isRequired };
