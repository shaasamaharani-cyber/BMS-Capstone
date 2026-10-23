/**
 * System Name: Budget Management System
 * Module Name: Dashboard Module
 *
 * Purpose of this file:
 * Small helpers shared by the role dashboards (dates in Manila time, recent request activity).
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

// Set by the administrator on the Settings page (defaults: 90%, 14 days and a 25% per quarter pace, until DOST confirms its targets)
export { ATTENTION_BELOW, DUE_SOON_DAYS, PACE_PER_QUARTER } from '../../utils/app_settings';
export { expectedPaceForPeriod, expectedPaceToDate } from '../../utils/spending_pace';

export function sortByUpdated(arrRequests) {
  return [...arrRequests].sort((objA, objB) => new Date(objB.br_updated_at || 0) - new Date(objA.br_updated_at || 0));
}

// The current spending-report period is the one with the latest due date
export function newestReportFirst(arrReports) {
  return [...arrReports].sort((objA, objB) => String(objB.sr_due_date).localeCompare(String(objA.sr_due_date)));
}

export function daysUntil(strDate) {
  const strToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  return Math.round((new Date(strDate) - new Date(strToday)) / 86400000);
}

export function formatDay(strDate) {
  return new Date(`${strDate}T00:00:00+08:00`).toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'Asia/Manila' });
}
