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
  BUDGET_REVIEW:      'route:budget-review',
  BUDGET_CONSOLIDATION: 'route:budget-consolidation',
  BUDGET_TRACKING:    'route:budget-tracking',
  REPORTS:            'route:reports',
  FORMS:              'route:forms',
  SETTINGS:           'route:settings',
};

export const ROLE_PERMISSIONS = {
  admin:     [PERMISSIONS.DASHBOARD, PERMISSIONS.FORMS, PERMISSIONS.SETTINGS],
  reviewer:  [PERMISSIONS.DASHBOARD, PERMISSIONS.BUDGET_REVIEW, PERMISSIONS.BUDGET_CONSOLIDATION, PERMISSIONS.BUDGET_TRACKING, PERMISSIONS.REPORTS, PERMISSIONS.FORMS],
  requester: [PERMISSIONS.DASHBOARD, PERMISSIONS.BUDGET_REQUESTS],
  executive: [PERMISSIONS.DASHBOARD, PERMISSIONS.BUDGET_REVIEW, PERMISSIONS.BUDGET_CONSOLIDATION, PERMISSIONS.BUDGET_TRACKING, PERMISSIONS.REPORTS, PERMISSIONS.FORMS],
};

// Only requesters create and manage budget requests, so full access leaves the Budget Requests menu out
export const ALL_PERMISSIONS = Object.values(PERMISSIONS).filter((strPermission) => strPermission !== PERMISSIONS.BUDGET_REQUESTS);

const FULL_ACCESS_EMAILS = new Set([
  'main.admin@dost.gov.ph',
]);

export function getPermissionsForRoleGroup(roleGroup) {
  return ROLE_PERMISSIONS[String(roleGroup || '').toLowerCase()] || [];
}

export function getPermissionsForUser(user) {
  const email = String(user?.usr_email || user?.email || '').toLowerCase().trim();

  if (FULL_ACCESS_EMAILS.has(email)) {
    return ALL_PERMISSIONS;
  }

  return getPermissionsForRoleGroup(user?.role?.role_group);
}
