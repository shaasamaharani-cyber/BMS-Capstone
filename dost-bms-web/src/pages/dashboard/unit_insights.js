/**
 * System Name: Budget Management System
 * Module Name: Dashboard Module
 *
 * Purpose of this file:
 * Builds the requester dashboard's projections, alerts and next-year planning insight from one unit's own figures.
 * The rules are simple placeholders (straight-line trend, same colour bands as the existing dashboard); DOST has not
 * confirmed its own forecasting method or targets.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { formatShortPeso } from '../../utils/formatters';

export const PROJECTED_YEARS = 2;
const HIGH_USE_FROM = 90;
const LOW_USE_BELOW = 75;
const PLANNING_BUFFER = 1.05;

const CATEGORY_NAMES = {
  PS: 'Personnel Services (PS)',
  MOOE: 'MOOE',
  CO: 'Capital Outlay (CO)',
  TAG: 'Project Tagging (TAG)',
};

function percentOf(dblPart, dblWhole)
{
  return dblWhole > 0 ? (dblPart / dblWhole) * 100 : 0;
}

// Least-squares straight line through the years that have figures
function fitLine(arrPoints)
{
  if (arrPoints.length < 2) return { dblSlope: 0, dblIntercept: arrPoints[0]?.y || 0 };
  const intCount = arrPoints.length;
  const dblMeanX = arrPoints.reduce((sum, objPoint) => sum + objPoint.x, 0) / intCount;
  const dblMeanY = arrPoints.reduce((sum, objPoint) => sum + objPoint.y, 0) / intCount;
  const dblCov = arrPoints.reduce((sum, objPoint) => sum + (objPoint.x - dblMeanX) * (objPoint.y - dblMeanY), 0);
  const dblVar = arrPoints.reduce((sum, objPoint) => sum + (objPoint.x - dblMeanX) ** 2, 0);
  const dblSlope = dblVar > 0 ? dblCov / dblVar : 0;
  return { dblSlope, dblIntercept: dblMeanY - dblSlope * dblMeanX };
}

/**
 * arrHistory: [{ yearLabel, objRow }] oldest first, one entry per fiscal year with figures for this unit.
 * Returns the chart series (paid amounts, then a straight-line projection) and next year's projected spend.
 */
export function buildExpenditureProjection(arrHistory)
{
  const intFirstYear = Number(arrHistory[0].yearLabel);
  const intLastYear = Number(arrHistory[arrHistory.length - 1].yearLabel);
  const objPaidByYear = Object.fromEntries(arrHistory.map((objYear) => [Number(objYear.yearLabel), Number(objYear.objRow.disbursement) || 0]));

  const { dblSlope } = fitLine(arrHistory.map((objYear) => ({ x: Number(objYear.yearLabel), y: Number(objYear.objRow.disbursement) || 0 })));
  const dblLastPaid = objPaidByYear[intLastYear];
  const projectFor = (intYear) => Math.max(0, dblLastPaid + dblSlope * (intYear - intLastYear));

  const arrYears = [];
  for (let intYear = intFirstYear; intYear <= intLastYear + PROJECTED_YEARS; intYear += 1) arrYears.push(intYear);

  return {
    labels: arrYears.map((intYear) => `FY ${String(intYear).slice(-2)}`),
    values: arrYears.map((intYear) => (intYear <= intLastYear ? (objPaidByYear[intYear] ?? null) : projectFor(intYear))),
    todayIndex: intLastYear - intFirstYear,
    subtitle: `FY ${intFirstYear} – ${intLastYear + PROJECTED_YEARS}, amount paid (₱)`,
    projectedNextYear: projectFor(intLastYear + 1),
  };
}

// One alert per category whose commitments are over, close to, or well under what has been released
export function buildCategoryAlerts(arrCategoryRows)
{
  return (arrCategoryRows || [])
    .filter((objRow) => Number(objRow.allotment) > 0)
    .map((objRow) => {
      const dblUse = percentOf(Number(objRow.obligation), Number(objRow.allotment));
      const strTitle = CATEGORY_NAMES[objRow.category] || objRow.category;
      if (Number(objRow.obligation) > Number(objRow.allotment))
      {
        return { key: objRow.category, level: 'danger', title: strTitle, message: `Commitments are ${formatShortPeso(objRow.obligation - objRow.allotment)} more than the funds released.` };
      }
      if (dblUse >= HIGH_USE_FROM)
      {
        return { key: objRow.category, level: 'warning', title: strTitle, message: `${Math.round(dblUse)}% of the released funds have already been committed.` };
      }
      if (dblUse < LOW_USE_BELOW)
      {
        return { key: objRow.category, level: 'notice', title: strTitle, message: `Only ${Math.round(dblUse)}% of the released funds have been committed.` };
      }
      return null;
    })
    .filter(Boolean);
}

/**
 * Next-year suggestion per category. Projected spend assumes the rest of the appropriation is released and committed at
 * the rate seen so far; the suggestion adds a 5% buffer to that.
 */
export function buildPlanningInsight(arrCategoryRows)
{
  return (arrCategoryRows || [])
    .filter((objRow) => Number(objRow.appropriation) > 0)
    .map((objRow) => {
      const dblAllocation = Number(objRow.appropriation);
      const dblUse = percentOf(Number(objRow.obligation), Number(objRow.allotment));
      const dblProjected = Number(objRow.allotment) > 0 ? Number(objRow.obligation) * (dblAllocation / Number(objRow.allotment)) : 0;
      const dblSuggested = dblProjected * PLANNING_BUFFER;
      const dblChange = percentOf(dblSuggested - dblAllocation, dblAllocation);
      const blnUp = dblChange >= 0;
      const strTitle = CATEGORY_NAMES[objRow.category] || objRow.category;

      let strTone = 'ok';
      let strInsight = `${strTitle} use is within the expected range. Plan close to this year's projected spending.`;
      if (dblProjected > dblAllocation)
      {
        strTone = 'danger';
        strInsight = `${strTitle} spending is projected to exceed its allocation. A larger allocation may be needed.`;
      }
      else if (dblUse < LOW_USE_BELOW)
      {
        strTone = 'warning';
        strInsight = `${strTitle} is under-used. A smaller allocation may be enough unless new activities are planned.`;
      }

      return {
        key: objRow.category,
        title: strTitle,
        allocation: formatShortPeso(dblAllocation),
        projected: formatShortPeso(dblProjected),
        projectedTone: strTone,
        suggested: `${formatShortPeso(dblSuggested)} ${blnUp ? '↑' : '↓'} ${Math.abs(Math.round(dblChange))}%`,
        suggestedTone: blnUp ? 'info' : 'danger',
        insightTone: strTone === 'danger' ? 'info' : strTone,
        insight: strInsight,
      };
    });
}
