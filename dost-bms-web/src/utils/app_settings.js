/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Alert thresholds the administrator sets on the Settings page. They are loaded once after sign-in
 * (see AppShell) and read by the dashboards. The defaults are the team's values until DOST decides.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import client from '../api/client';

// Flag a committed rate below this (green at or above), amber at or above AMBER_BELOW, red below it
export let ATTENTION_BELOW = 90;
export let AMBER_BELOW = 75;
// A spending report is "due soon" within this many days of its due date
export let DUE_SOON_DAYS = 14;
// Share of the allotment a unit is expected to have committed per quarter (25 = 25/50/75/100%), team default awaiting DOST
export let PACE_PER_QUARTER = 25;

export function applyAppSettings(objSettings = {}) {
  ATTENTION_BELOW = Number(objSettings.attention_below) || ATTENTION_BELOW;
  AMBER_BELOW = Number(objSettings.amber_below) || AMBER_BELOW;
  DUE_SOON_DAYS = Number(objSettings.due_soon_days) || DUE_SOON_DAYS;
  PACE_PER_QUARTER = Number(objSettings.pace_per_quarter) || PACE_PER_QUARTER;
}

export async function loadAppSettings() {
  try {
    const objResponse = await client.get('/settings');
    applyAppSettings(objResponse.data?.data);
  } catch {
    // Keep the defaults; the dashboards still work
  }
}
