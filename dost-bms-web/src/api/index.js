/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Barrel export for all API modules.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

export { ENDPOINTS } from './endpoints';

export {
  default as apiClient,
  getStoredToken,
  setStoredToken,
  clearStoredToken,
} from './client';

export { login, logout, me } from './auth_api';

export {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser,
} from './users_api';

export {
  getBudgetRequests,
  getBudgetRequestById,
  createBudgetRequest,
  updateBudgetRequest,
  deleteBudgetRequest,
  submitBudgetRequest,
  reviewBudgetRequest,
  getBudgetRequestVersions,
  getBudgetRequestVersionDetail,
  getReviewedBudgetRequests,
  getBudgetRequestsByIds,
  getBudgetReviewList,
  getBudgetRequestActivity,
} from './budget_requests_api';

export {
  getUnifiedBudgets,
  getSummaryStats,
  createUnifiedBudget,
  getUnifiedBudgetById,
  updateUnifiedBudget,
} from './budget_consolidation_api';

export {
  getBudgetRequestItems,
  getBudgetRequestItemById,
  createBudgetRequestItem,
  updateBudgetRequestItem,
  deleteBudgetRequestItem,
} from './budget_request_items_api';

export {
  getBudgetCategories,
} from './budget_categories_api';

export {
  getFiscalYears,
} from './fiscal_years_api';

export {
  getPlanningPeriods,
} from './planning_periods_api';

export {
  getRequestingUnits,
} from './requesting_units_api';

export {
  getDashboardData,
} from './dashboard_api';

export {
  fetchAllSchemas,
  fetchSchema,
  createSchema,
  updateSchema,
  deleteSchema,
  fetchEntriesBySchema,
  fetchEntry,
  createEntry,
  updateEntry,
  deleteEntry,
} from './forms_api';
