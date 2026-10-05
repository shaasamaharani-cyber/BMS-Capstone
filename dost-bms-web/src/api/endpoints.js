/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Central registry of all API endpoint path constants.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

export const ENDPOINTS = {
  AUTH: {
    LOGIN:  '/auth/login',
    LOGOUT: '/auth/logout',
    ME:     '/auth/me',
  },

  BUDGET_CATEGORIES: {
    INDEX: '/budget-categories',
  },

  FISCAL_YEARS: {
    INDEX: '/fiscal-years',
  },

  PLANNING_PERIODS: {
    INDEX: '/planning-periods',
  },

  REQUESTING_UNITS: {
    INDEX: '/requesting-units',
  },

  SPENDING_REPORTS: {
    INDEX:  '/spending-reports',
    UPDATE: (intId) => `/spending-reports/${intId}`,
  },

  USERS: {
    INDEX:      '/users',
    SHOW:       (intId) => `/users/${intId}`,
    UPDATE:     (intId) => `/users/${intId}`,
    DESTROY:    (intId) => `/users/${intId}`,
    ACTIVATE:   (intId) => `/users/${intId}/activate`,
    DEACTIVATE: (intId) => `/users/${intId}/deactivate`,
  },

  BUDGET_REQUESTS: {
    INDEX:          '/budget-requests',
    STORE:          '/budget-requests',
    SHOW:           (intId) => `/budget-requests/${intId}`,
    UPDATE:         (intId) => `/budget-requests/${intId}`,
    DESTROY:        (intId) => `/budget-requests/${intId}`,
    SUBMIT:         (intId) => `/budget-requests/${intId}/submit`,
    REVIEW:         (intId) => `/budget-requests/${intId}/review`,
    VERSIONS:       (intId) => `/budget-requests/${intId}/versions`,
    VERSION_DETAIL: (intId, intVersionId) => `/budget-requests/${intId}/versions/${intVersionId}`,
    ACTIVITY:       (intId) => `/budget-requests/${intId}/activity`,
  },

  BUDGET_REVIEW: {
    INDEX: '/budget-review',
  },

  BUDGET_REQUEST_ITEMS: {
    INDEX:   (intBrId) => `/budget-requests/${intBrId}/items`,
    STORE:   (intBrId) => `/budget-requests/${intBrId}/items`,
    SHOW:    (intBrId, intItemId) => `/budget-requests/${intBrId}/items/${intItemId}`,
    UPDATE:  (intBrId, intItemId) => `/budget-requests/${intBrId}/items/${intItemId}`,
    DESTROY: (intBrId, intItemId) => `/budget-requests/${intBrId}/items/${intItemId}`,
  },

  DASHBOARD: {
    INDEX: '/dashboard',
  },

  FORM_SCHEMAS: {
    INDEX:   '/form_schemas',
    SHOW:    (strId) => `/form_schemas/${strId}`,
    STORE:   '/form_schemas',
    UPDATE:  (strId) => `/form_schemas/${strId}`,
    DESTROY: (strId) => `/form_schemas/${strId}`,
  },

  FORM_ENTRIES: {
    INDEX:   '/form_entries',
    SHOW:    (strId) => `/form_entries/${strId}`,
    STORE:   '/form_entries',
    UPDATE:  (strId) => `/form_entries/${strId}`,
    DESTROY: (strId) => `/form_entries/${strId}`,
  },
};
