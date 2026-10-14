/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for permissions.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

export const PERMISSIONS = {
  DASHBOARD:          'route:dashboard',
  BUDGET_REQUESTS:    'route:budget-requests',
  SPENDING_MONITORING: 'route:spending-monitoring',
  BUDGET_REVIEW:      'route:budget-review',
  BUDGET_CONSOLIDATION: 'route:budget-consolidation',
  BUDGET_TRACKING:    'route:budget-tracking',
  REPORTS:            'route:reports',
  FORMS:              'route:forms',
  SETTINGS:           'route:settings',
  USERS:              'route:users',
  BUDGET_CYCLES:      'route:budget-cycles',
};

export const ROLE_PERMISSIONS = {
  // Administrators keep the system running: no budget pages and no peso amounts (least privilege)
  admin:     [PERMISSIONS.DASHBOARD, PERMISSIONS.USERS, PERMISSIONS.BUDGET_CYCLES, PERMISSIONS.FORMS, PERMISSIONS.SETTINGS],
  reviewer:  [PERMISSIONS.DASHBOARD, PERMISSIONS.SPENDING_MONITORING, PERMISSIONS.BUDGET_REVIEW, PERMISSIONS.BUDGET_CONSOLIDATION, PERMISSIONS.BUDGET_TRACKING, PERMISSIONS.REPORTS, PERMISSIONS.FORMS],
  requester: [PERMISSIONS.DASHBOARD, PERMISSIONS.BUDGET_REQUESTS, PERMISSIONS.SPENDING_MONITORING],
  executive: [PERMISSIONS.DASHBOARD, PERMISSIONS.SPENDING_MONITORING, PERMISSIONS.BUDGET_CONSOLIDATION, PERMISSIONS.BUDGET_TRACKING, PERMISSIONS.REPORTS, PERMISSIONS.FORMS],
};


export function getPermissionsForRoleGroup(roleGroup) {
  return ROLE_PERMISSIONS[String(roleGroup || '').toLowerCase()] || [];
}

export function getPermissionsForUser(user) {
  return getPermissionsForRoleGroup(user?.role?.role_group);
}

// Seeing a page is not the same as acting on it: only the Budget and Finance Division (reviewer group)
// validates, returns, consolidates and records external results. The main administrator views only.
export function canActAsDivision(user) {
  return String(user?.role?.role_group || '').toLowerCase() === 'reviewer';
}
