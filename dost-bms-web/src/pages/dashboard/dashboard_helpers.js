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

import { getBudgetRequestActivity } from '../../api';

// Same colour band as the existing dashboard (amber/red below 90%). DOST has not confirmed its own targets.
export const ATTENTION_BELOW = 90;

// Team assumption (slice 2 plan): a spending report is "due soon" within 14 days of its due date
export const DUE_SOON_DAYS = 14;

export function sortByUpdated(arrRequests) {
  return [...arrRequests].sort((objA, objB) => new Date(objB.br_updated_at || 0) - new Date(objA.br_updated_at || 0));
}

// The current spending-report period is the one with the latest due date
export function newestReportFirst(arrReports) {
  return [...arrReports].sort((objA, objB) => String(objB.sr_due_date).localeCompare(String(objA.sr_due_date)));
}

// Recent actions across the given requests, newest first
export async function loadRecentActivity(arrRequests, intCount) {
  const arrLogs = await Promise.all(arrRequests.map(async (objRequest) => {
    const objResponse = await getBudgetRequestActivity(objRequest.id);
    return (objResponse?.data || []).map((objLog) => ({ ...objLog, strTitle: objRequest.br_title, strUnit: objRequest.requesting_unit?.ru_name }));
  }));
  return arrLogs.flat()
    .sort((objA, objB) => new Date(objB.bral_created_at) - new Date(objA.bral_created_at))
    .slice(0, intCount);
}

export function daysUntil(strDate) {
  const strToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  return Math.round((new Date(strDate) - new Date(strToday)) / 86400000);
}

export function formatDay(strDate) {
  return new Date(`${strDate}T00:00:00+08:00`).toLocaleDateString('en-PH', { month: 'short', day: '2-digit', year: 'numeric', timeZone: 'Asia/Manila' });
}
