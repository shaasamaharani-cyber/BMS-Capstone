/**
 * System Name: Budget Management System
 * Module Name: Dashboard Module
 *
 * Purpose of this file:
 * Expected spending pace: how much of its allotment a unit should have committed by the end of a quarter.
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

// "Q3 2026 (Jul-Sep)" with 25% per quarter -> 75. Null when the label names no quarter.
export function expectedPaceForPeriod(strPeriodLabel, intPacePerQuarter) {
  const intQuarter = Number(/Q([1-4])/i.exec(String(strPeriodLabel || ''))?.[1]);
  return intQuarter ? Math.min(100, intQuarter * Number(intPacePerQuarter)) : null;
}

// Expected committed rate today: quarters already finished this year x pace. A past fiscal year should be
// complete (100) and a future one has not started (0).
export function expectedPaceToDate(intFiscalYear, dateToday, intPacePerQuarter) {
  const intThisYear = dateToday.getFullYear();
  if (intFiscalYear && intFiscalYear < intThisYear) return 100;
  if (intFiscalYear && intFiscalYear > intThisYear) return 0;
  return Math.min(100, Math.floor(dateToday.getMonth() / 3) * Number(intPacePerQuarter));
}
