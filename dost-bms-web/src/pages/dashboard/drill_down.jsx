/**
 * System Name: Budget Management System
 * Module Name: Dashboard Module
 *
 * Purpose of this file:
 * Breakdown and Drill-Down (proposal section 5): click an expense class to see the units
 * in it, then a unit to see its budget requests. Follows the dashboard's fiscal year filter.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { getBudgetRequests, getDashboardData } from '../../api';
import { Badge, Button } from '../../components/ui';
import { extractApiRows } from '../../utils/budget_request_utils';
import { formatCurrency, formatRate, getRateClassName } from '../../utils/formatters';
import { ProposalTag } from './proposal_sections';
import styles from './requester_dashboard.module.css';

export default function DrillDown({ strFiscalYearId, arrCategories }) {
  const [arrByCategory, setArrByCategory] = useState([]);
  const [strCategoryId, setStrCategoryId] = useState('');
  const [objUnit, setObjUnit] = useState(null);
  const [arrRequests, setArrRequests] = useState([]);
  const [blnLoading, setBlnLoading] = useState(true);
  const [blnFailed, setBlnFailed] = useState(false);

  // One dashboard call per expense class gives its totals and the units in it
  useEffect(() => {
    let blnMounted = true;
    setStrCategoryId('');
    setObjUnit(null);
    setBlnLoading(true);
    Promise.all(arrCategories.map((objCategory) => getDashboardData({ fiscal_year_id: strFiscalYearId, category_id: objCategory.value, period: 'annually' })))
      .then((arrData) => {
        if (!blnMounted) return;
        setArrByCategory(arrCategories.map((objCategory, intIndex) => ({
          ...objCategory,
          objTotals: Object.fromEntries((arrData[intIndex].monitoring?.summaryCards || []).map((objCard) => [objCard.key, objCard.value])),
          arrUnits: arrData[intIndex].monitoring?.performanceRows || [],
        })));
        setBlnFailed(false);
      })
      .catch(() => { if (blnMounted) setBlnFailed(true); })
      .finally(() => { if (blnMounted) setBlnLoading(false); });
    return () => { blnMounted = false; };
  }, [strFiscalYearId, arrCategories]);

  useEffect(() => {
    if (!objUnit) return undefined;
    let blnMounted = true;
    getBudgetRequests({ requesting_unit_id: objUnit.intUnitId, per_page: 100 })
      .then((objResponse) => {
        if (!blnMounted) return;
        setArrRequests(extractApiRows(objResponse)
          .filter((objRequest) => !strFiscalYearId || String(objRequest.br_fiscal_year_id) === String(strFiscalYearId)));
      })
      .catch(() => { if (blnMounted) setBlnFailed(true); });
    return () => { blnMounted = false; };
  }, [objUnit, strFiscalYearId]);

  const objCategory = arrByCategory.find((objRow) => objRow.value === strCategoryId);
  // Classes with nothing recorded are hidden; largest allotment first
  const arrClasses = arrByCategory
    .filter((objRow) => Object.values(objRow.objTotals).some(Boolean))
    .sort((objA, objB) => (objB.objTotals.allotment || 0) - (objA.objTotals.allotment || 0));
  const dblTotalAllotment = arrClasses.reduce((dblSum, objRow) => dblSum + (objRow.objTotals.allotment || 0), 0);
  const percentOf = (dblPart, dblWhole) => (dblWhole > 0 ? (dblPart / dblWhole) * 100 : 0);
  const objTop = arrClasses[0];

  return (
    <section className={`dashboard-panel ${styles.card}`}>
      <h3 className={`dashboard-section__title ${styles.cardTitle}`}>By Expense Class <ProposalTag section="drilldown" /></h3>
      <p className={styles.muted}>
        {objUnit ? `${objCategory?.label} › ${objUnit.strName} › budget requests` : objCategory ? `${objCategory.label} › units` : 'Click an expense class to see its units, then a unit to see its requests.'}
      </p>
      {blnFailed && <div className={styles.errorBanner}>Cannot perform transaction. Error encountered.</div>}
      {blnLoading && <p className={styles.muted}>Loading...</p>}

      {!blnLoading && !objCategory && (
        <>
          {objTop && dblTotalAllotment > 0 && (
            <p><strong>Highest allocation: {objTop.label}</strong>, {formatCurrency(objTop.objTotals.allotment)} or {percentOf(objTop.objTotals.allotment, dblTotalAllotment).toFixed(1)}% of the total allotment.</p>
          )}
          <div className="table-responsive">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Expense class</th>
                  <th className={styles.numeric}>Appropriation</th>
                  <th className={styles.numeric}>Allotment</th>
                  <th className={styles.numeric}>Share</th>
                  <th className={styles.numeric}>Not yet released</th>
                  <th className={styles.numeric}>Obligation</th>
                  <th className={styles.numeric}>Committed</th>
                  <th className={styles.numeric}>Not committed</th>
                  <th className={styles.numeric}>Disbursement</th>
                  <th className={styles.numeric}>Units</th>
                </tr>
              </thead>
              <tbody>
                {arrClasses.map((objRow) => {
                  const { appropriation = 0, allotment = 0, obligation = 0, disbursement = 0 } = objRow.objTotals;
                  return (
                    <tr key={objRow.value}>
                      <td><Button size="sm" variant="ghost" onClick={() => setStrCategoryId(objRow.value)}>{objRow.label}</Button></td>
                      <td className={styles.numeric}>{formatCurrency(appropriation)}</td>
                      <td className={styles.numeric}>{formatCurrency(allotment)}</td>
                      <td className={styles.numeric}>{percentOf(allotment, dblTotalAllotment).toFixed(1)}%</td>
                      <td className={styles.numeric}>{formatCurrency(appropriation - allotment)}</td>
                      <td className={styles.numeric}>{formatCurrency(obligation)}</td>
                      <td className={`${styles.numeric} ${getRateClassName(percentOf(obligation, allotment))}`}>{formatRate(percentOf(obligation, allotment))}</td>
                      <td className={styles.numeric}>{formatCurrency(allotment - obligation)}</td>
                      <td className={styles.numeric}>{formatCurrency(disbursement)}</td>
                      <td className={styles.numeric}>{objRow.arrUnits.length}</td>
                    </tr>
                  );
                })}
                {arrClasses.length === 0 && <tr><td colSpan={10} className={styles.muted}>No allotment recorded for the selected fiscal year.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className={styles.footnote}>Not yet released = appropriation − allotment. Committed = obligation / allotment. Not committed = allotment − obligation. Same date and source as the Financial Overview.</p>
        </>
      )}

      {objCategory && !objUnit && (
        <>
          <div className="table-responsive">
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Unit</th>
                  <th className={styles.numeric}>Allotment</th>
                  <th className={styles.numeric}>Obligation</th>
                  <th className={styles.numeric}>Committed</th>
                  <th className={styles.numeric}>Not committed</th>
                  <th className={styles.numeric}>Disbursement</th>
                  <th className={styles.numeric}>Disbursement rate</th>
                </tr>
              </thead>
              <tbody>
                {objCategory.arrUnits.map((objRow) => (
                  <tr key={objRow.requestingUnit}>
                    <td><Button size="sm" variant="ghost" onClick={() => setObjUnit({ strName: objRow.requestingUnit, intUnitId: objRow.requestingUnitId })}>{objRow.requestingUnit}</Button></td>
                    <td className={styles.numeric}>{formatCurrency(objRow.allotment)}</td>
                    <td className={styles.numeric}>{formatCurrency(objRow.obligation)}</td>
                    <td className={`${styles.numeric} ${getRateClassName(objRow.executionRate)}`}>{formatRate(objRow.executionRate)}</td>
                    <td className={styles.numeric}>{formatCurrency(objRow.allotment - objRow.obligation)}</td>
                    <td className={styles.numeric}>{formatCurrency(objRow.disbursement)}</td>
                    <td className={styles.numeric}>{formatRate(objRow.disbursementRate)}</td>
                  </tr>
                ))}
                {objCategory.arrUnits.length === 0 && <tr><td colSpan={7} className={styles.muted}>No spending recorded in this class.</td></tr>}
              </tbody>
            </table>
          </div>
          <p className={styles.footnote}>Disbursement rate = disbursement / obligation.</p>
          <div className={styles.linkRow}><Button size="sm" variant="outline" onClick={() => setStrCategoryId('')}>Back to expense classes</Button></div>
        </>
      )}

      {objUnit && (
        <>
          <table className={styles.table}>
            <thead><tr><th>Request</th><th>Status</th><th className={styles.numeric}>Total requested</th></tr></thead>
            <tbody>
              {arrRequests.map((objRequest) => (
                <tr key={objRequest.id}>
                  <td><Link to={`/budget-requests/${objRequest.id}`}>{objRequest.br_title}</Link><span className={styles.muted}>{objRequest.br_reference_no}</span></td>
                  <td><Badge status={objRequest.br_status} /></td>
                  <td className={styles.numeric}>{formatCurrency(objRequest.br_total_amount || 0)}</td>
                </tr>
              ))}
              {arrRequests.length === 0 && <tr><td colSpan={3} className={styles.muted}>No budget requests from this unit for the selected fiscal year.</td></tr>}
            </tbody>
          </table>
          <p className={styles.footnote}>Requests are listed for the whole unit; a request can cover several expense classes.</p>
          <div className={styles.linkRow}><Button size="sm" variant="outline" onClick={() => setObjUnit(null)}>Back to units</Button></div>
        </>
      )}
    </section>
  );
}

DrillDown.propTypes = {
  strFiscalYearId: PropTypes.string.isRequired,
  arrCategories: PropTypes.arrayOf(PropTypes.object).isRequired,
};
