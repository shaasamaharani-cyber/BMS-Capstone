/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * The menu pages, shared by the sidebar and the global search, each with the permission that shows it.
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { PERMISSIONS } from '../../utils/permissions';

export const ALL_NAV_ITEMS = [
  { path: '/dashboard',          label: 'Dashboard',           icon: 'grid',        permission: PERMISSIONS.DASHBOARD },
  { path: '/users',              label: 'Users & Roles',       icon: 'users',       permission: PERMISSIONS.USERS },
  { path: '/budget-cycles',      label: 'Budget Cycles',       icon: 'calendar',    permission: PERMISSIONS.BUDGET_CYCLES },
  { path: '/forms',              label: 'Forms',               icon: 'file-text',   permission: PERMISSIONS.FORMS },
  { path: '/budget-requests',    label: 'Budget Requests',     icon: 'file-text',   permission: PERMISSIONS.BUDGET_REQUESTS },
  { path: '/spending-monitoring', label: 'Spending Monitoring', icon: 'bar-chart-2', permission: PERMISSIONS.SPENDING_MONITORING },
  { path: '/budget-review',      label: 'Budget Review',       icon: 'check-square',permission: PERMISSIONS.BUDGET_REVIEW },
  { path: '/budget-consolidation', label: 'Budget Consolidation',  icon: 'layers',      permission: PERMISSIONS.BUDGET_CONSOLIDATION },
  // { path: '/budget-tracking',    label: 'Budget Tracking',     icon: 'bar-chart-2', permission: PERMISSIONS.BUDGET_TRACKING },
  { path: '/reports',            label: 'Reports',             icon: 'clipboard',   permission: PERMISSIONS.REPORTS },
  { path: '/settings',           label: 'Settings',            icon: 'settings',    permission: PERMISSIONS.SETTINGS },
];
