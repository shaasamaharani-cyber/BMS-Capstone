/**
 * System Name: Budget Management System
 * Module Name: Routing Module
 *
 * Purpose of this file:
 * Central route map that declares all application paths, lazy-loads page components, and applies auth and permission guards.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from '../components/layout/app_shell';
import ProtectedRoute from '../routes/protected_route';
import PermissionRoute from '../routes/permission_route';
import { PERMISSIONS } from '../utils/permissions';
import LoginPage from '../pages/login/login_page';
import DashboardPage from '../pages/dashboard/dashboard_page';
import BudgetRequestsPage from '../pages/budget_requests/budget_requests_page';
import BudgetRequestDetailPage from '../pages/budget_requests/budget_request_detail_page';
import NewBudgetRequest from '../pages/budget_requests/new_budget_request';
import UnifiedRequestPage from '../pages/unified_request/unified_request_page';
import EditBudgetRequest from '../pages/budget_requests/edit_budget_request';
import BudgetReviewPage from '../pages/budget_review/budget_review_page';
import BudgetReviewDetailPage from '../pages/budget_review/budget_review_detail_page';
import BudgetConsolidationPage from '../pages/budget_consolidate/budget_consolidation_page';
import NewBudgetConsolidation from '../pages/budget_consolidate/new_budget_consolidation';
import EditBudgetConsolidation from '../pages/budget_consolidate/edit_budget_consolidation';
import BudgetConsolidationDetailPage from '../pages/budget_consolidate/budget_consolidation_detail_page';
import BudgetTrackingPage from '../pages/budget_tracking/budget_tracking_page';
import ReportsPage from '../pages/reports/reports_page';
import EntryPage from '../pages/forms/entry_page';
import FormBuilder from '../pages/forms/form_builder';
import FormsDataPage from '../pages/forms/forms_data_page';
import SettingsPage from '../pages/settings/settings_page';
import NotFoundPage from '../pages/not_found/not_found_page';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="budget-requests" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_REQUESTS}><BudgetRequestsPage /></PermissionRoute>
          } />
          <Route path="budget-requests/new" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_REQUESTS}><NewBudgetRequest /></PermissionRoute>
          } />
          <Route path="budget-requests/unified/new" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_REQUESTS}><UnifiedRequestPage /></PermissionRoute>
          } />
          <Route path="budget-requests/unified/:id" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_REQUESTS}><UnifiedRequestPage /></PermissionRoute>
          } />
          <Route path="budget-requests/:id/edit" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_REQUESTS}><EditBudgetRequest /></PermissionRoute>
          } />
          <Route path="budget-requests/:id" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_REQUESTS}><BudgetRequestDetailPage /></PermissionRoute>
          } />

          <Route path="budget-review" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_REVIEW}><BudgetReviewPage /></PermissionRoute>
          } />
          <Route path="budget-review/:id" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_REVIEW}><BudgetReviewDetailPage /></PermissionRoute>
          } />

          <Route path="budget-consolidation" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_CONSOLIDATION}><BudgetConsolidationPage /></PermissionRoute>
          } />
          <Route path="budget-consolidation/new" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_CONSOLIDATION}><NewBudgetConsolidation /></PermissionRoute>
          } />
          <Route path="budget-consolidation/:id/edit" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_CONSOLIDATION}><EditBudgetConsolidation /></PermissionRoute>
          } />
          <Route path="budget-consolidation/:id" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_CONSOLIDATION}><BudgetConsolidationDetailPage /></PermissionRoute>
          } />

          {/* <Route path="budget-tracking" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_TRACKING}><BudgetTrackingPage /></PermissionRoute>
          } /> */}
          <Route path="budget-tracking/:id" element={
            <PermissionRoute permission={PERMISSIONS.BUDGET_TRACKING}><BudgetTrackingPage /></PermissionRoute>
          } />

          <Route path="reports" element={
            <PermissionRoute permission={PERMISSIONS.REPORTS}><ReportsPage /></PermissionRoute>
          } />
          <Route path="forms" element={
            <PermissionRoute permission={PERMISSIONS.FORMS}><FormsDataPage /></PermissionRoute>
          } />
          <Route path="forms/builder" element={
            <PermissionRoute permission={PERMISSIONS.FORMS}><FormBuilder /></PermissionRoute>
          } />
          <Route path="forms/:schemaId/new" element={
            <PermissionRoute permission={PERMISSIONS.FORMS}><EntryPage /></PermissionRoute>
          } />
          <Route path="forms/:schemaId/entries/:entryId" element={
            <PermissionRoute permission={PERMISSIONS.FORMS}><EntryPage /></PermissionRoute>
          } />
          <Route path="settings" element={
            <PermissionRoute permission={PERMISSIONS.SETTINGS}><SettingsPage /></PermissionRoute>
          } />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
