/**
 * System Name: Budget Management System
 * Module Name: Reports Module
 *
 * Purpose of this file:
 * Phase 1 reports for Central Office (DOST written answer 8): institution summary per unit,
 * consolidated summary by expense class and spending report status, each as a CSV download
 * (opens in Excel) and a printable page (Save as PDF). BP forms in DBM layouts come in Phase 2.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getDashboardData, getSpendingReports } from '../../api';
import { Button } from '../../components/ui';
import PageHeader from '../../components/layout/page_header';
import { downloadCsv } from '../../utils/csv';
import { formatCurrency, formatRate } from '../../utils/formatters';
import { formatDay, newestReportFirst } from '../dashboard/dashboard_helpers';
import { ProposalTag, SampleDataNote } from '../dashboard/proposal_sections';
import styles from './reports_page.module.css';

const AMOUNT_KEYS = ['appropriation', 'allotment', 'obligation', 'disbursement'];
const AMOUNT_HEADERS = ['Appropriation', 'Allotment', 'Obligation', 'Disbursement'];

function ReportCard({ strTitle, strHelp, arrHeaders, arrRows, arrCsvRows, strFilename }) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHead}>
        <div>
          <h3 className={styles.cardTitle}>{strTitle}</h3>
          <p className={styles.muted}>{strHelp}</p>
        </div>
        <span className={styles.noPrint}><Button size="sm" variant="outline" disabled={arrRows.length === 0} onClick={() => downloadCsv(strFilename, arrHeaders, arrCsvRows)}>Download CSV</Button></span>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead><tr>{arrHeaders.map((strHeader) => <th key={strHeader}>{strHeader}</th>)}</tr></thead>
          <tbody>
            {arrRows.map((arrRow) => <tr key={arrRow[0]}>{arrRow.map((value, intIndex) => <td key={arrHeaders[intIndex]}>{value}</td>)}</tr>)}
            {arrRows.length === 0 && <tr><td colSpan={arrHeaders.length} className={styles.muted}>No records for this selection.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

ReportCard.propTypes = {
  strTitle: PropTypes.string.isRequired,
  strHelp: PropTypes.string.isRequired,
  arrHeaders: PropTypes.arrayOf(PropTypes.string).isRequired,
  arrRows: PropTypes.arrayOf(PropTypes.array).isRequired,
  arrCsvRows: PropTypes.arrayOf(PropTypes.array).isRequired,
  strFilename: PropTypes.string.isRequired,
};

export default function ReportsPage() {
  const [arrYears, setArrYears] = useState([]);
  const [strYearId, setStrYearId] = useState('');
  const [arrUnitRows, setArrUnitRows] = useState([]);
  const [arrCategories, setArrCategories] = useState([]);
  const [arrClassTotals, setArrClassTotals] = useState([]);
  const [arrReports, setArrReports] = useState([]);
  const [blnLoading, setBlnLoading] = useState(true);
  const [blnFailed, setBlnFailed] = useState(false);

  // Years up to this one, newest first; the report status list is the current period
  useEffect(() => {
    let blnMounted = true;
    Promise.all([getDashboardData({ period: 'annually' }), getSpendingReports()])
      .then(([objBase, arrAllReports]) => {
        if (!blnMounted) return;
        const arrPastYears = (objBase.filters?.fiscalYears || [])
          .filter((objYear) => Number(objYear.label) <= new Date().getFullYear())
          .sort((objA, objB) => Number(objB.label) - Number(objA.label));
        const strPeriod = newestReportFirst(arrAllReports)[0]?.sr_period_label;
        setArrYears(arrPastYears);
        setStrYearId(arrPastYears[0]?.value || '');
        setArrReports(arrAllReports.filter((objReport) => objReport.sr_period_label === strPeriod));
        setArrCategories(objBase.filters?.categories || []);
        if (arrPastYears.length === 0) setBlnLoading(false);
      })
      .catch(() => { if (blnMounted) { setBlnFailed(true); setBlnLoading(false); } });
    return () => { blnMounted = false; };
  }, []);

  useEffect(() => {
    if (!strYearId || arrCategories.length === 0) return undefined;
    let blnMounted = true;
    setBlnLoading(true);
    Promise.all([
      getDashboardData({ fiscal_year_id: strYearId, period: 'annually' }),
      ...arrCategories.map((objCategory) => getDashboardData({ fiscal_year_id: strYearId, category_id: objCategory.value, period: 'annually' })),
    ])
      .then(([objYear, ...arrByCategory]) => {
        if (!blnMounted) return;
        setArrUnitRows(objYear.monitoring?.performanceRows || []);
        setArrClassTotals(arrCategories.map((objCategory, intIndex) => ({
          label: objCategory.label,
          objTotals: Object.fromEntries((arrByCategory[intIndex].monitoring?.summaryCards || []).map((objCard) => [objCard.key, objCard.value])),
        })));
        setBlnFailed(false);
      })
      .catch(() => { if (blnMounted) setBlnFailed(true); })
      .finally(() => { if (blnMounted) setBlnLoading(false); });
    return () => { blnMounted = false; };
  }, [strYearId, arrCategories]);

  const strYearLabel = arrYears.find((objYear) => objYear.value === strYearId)?.label || '';
  const strPeriod = arrReports[0]?.sr_period_label || '';
  const rate = (dblPart, dblWhole) => (Number(dblWhole) ? (Number(dblPart) / Number(dblWhole)) * 100 : 0);

  // Screen rows show pesos and percentages; CSV rows keep plain numbers so Excel can add them up
  const arrUnitCsv = arrUnitRows.map((objRow) => [objRow.requestingUnit, ...AMOUNT_KEYS.map((strKey) => objRow[strKey]), objRow.executionRate, objRow.disbursementRate, objRow.absorptionRate]);
  const arrUnitScreen = arrUnitRows.map((objRow) => [objRow.requestingUnit, ...AMOUNT_KEYS.map((strKey) => formatCurrency(objRow[strKey])), formatRate(objRow.executionRate), formatRate(objRow.disbursementRate), formatRate(objRow.absorptionRate)]);
  const arrClassCsv = arrClassTotals.map((objCategory) => [objCategory.label, ...AMOUNT_KEYS.map((strKey) => objCategory.objTotals[strKey] ?? 0), Number(rate(objCategory.objTotals.obligation, objCategory.objTotals.allotment).toFixed(2))]);
  const arrClassScreen = arrClassTotals.map((objCategory) => [objCategory.label, ...AMOUNT_KEYS.map((strKey) => formatCurrency(objCategory.objTotals[strKey] ?? 0)), formatRate(rate(objCategory.objTotals.obligation, objCategory.objTotals.allotment))]);
  const arrStatusCsv = arrReports.map((objReport) => [objReport.unit_name, objReport.sr_period_label, objReport.sr_status, objReport.sr_due_date, objReport.sr_submitted_at || '', objReport.is_late ? 'Yes' : 'No', objReport.over_allotment_count, objReport.missing_justification_count]);
  const arrStatusScreen = arrStatusCsv.map((arrRow) => [arrRow[0], arrRow[1], arrRow[2].replace('_', ' '), formatDay(arrRow[3]), arrRow[4] ? formatDay(arrRow[4].slice(0, 10)) : '—', arrRow[5], arrRow[6], arrRow[7]]);

  return (
    <div className={styles.page}>
      <PageHeader title="Reports">
        <span className={styles.noPrint}><Button variant="outline" onClick={() => window.print()}>Print / Save as PDF</Button></span>
      </PageHeader>
      <p className={styles.intro}>Summary reports for DOST Central Office, downloadable as CSV for Excel. <ProposalTag section="reports" /></p>
      <SampleDataNote>Figures come from the mock database. The official BP forms in DBM layouts (PDF and Excel) are planned for Phase 2.</SampleDataNote>

      <label className={`${styles.field} ${styles.noPrint}`}>
        <span className={styles.fieldLabel}>Fiscal year</span>
        <select className="form-select form-select-sm" value={strYearId} onChange={(event) => setStrYearId(event.target.value)}>
          {arrYears.map((objYear) => <option key={objYear.value} value={objYear.value}>FY{objYear.label}</option>)}
        </select>
      </label>

      {blnFailed && <div className={styles.errorBanner}>Cannot perform transaction. Error encountered.</div>}
      {blnLoading && <p className={styles.muted}>Loading...</p>}

      <ReportCard
        strTitle={`Institution summary - FY${strYearLabel}`}
        strHelp="Appropriation, allotment, obligation and disbursement for each requesting unit, with the committed, paid and absorption rates."
        arrHeaders={['Requesting unit', ...AMOUNT_HEADERS, 'Committed %', 'Paid of commitments %', 'Absorption %']}
        arrRows={arrUnitScreen}
        arrCsvRows={arrUnitCsv}
        strFilename={`institution-summary-FY${strYearLabel}.csv`}
      />
      <ReportCard
        strTitle={`Consolidated summary by expense class - FY${strYearLabel}`}
        strHelp="All units together, one row per expense class."
        arrHeaders={['Expense class', ...AMOUNT_HEADERS, 'Committed %']}
        arrRows={arrClassScreen}
        arrCsvRows={arrClassCsv}
        strFilename={`consolidated-by-class-FY${strYearLabel}.csv`}
      />
      <ReportCard
        strTitle={`Spending report status - ${strPeriod || 'no period'}`}
        strHelp="Which units have reported actual spending for the current period, who is late, and missing justifications."
        arrHeaders={['Unit', 'Period', 'Status', 'Due', 'Submitted', 'Late', 'Classes over allotment', 'Missing justification']}
        arrRows={arrStatusScreen}
        arrCsvRows={arrStatusCsv}
        strFilename={`spending-report-status-${strPeriod.split(' ').slice(0, 2).join('-') || 'none'}.csv`}
      />
    </div>
  );
}
