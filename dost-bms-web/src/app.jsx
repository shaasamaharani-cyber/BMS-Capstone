/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Root React component that wraps the application in auth, toast, and routing providers.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect } from 'react';
import { AppProvider } from './context/app_context';
import { AuthProvider } from './context/auth_context';
import AppRouter from './router/app_router';
import { ToastProvider } from './components/ui';
import { seedDefaultSchemas } from './forms/utils/seed_default_schemas';
import './styles/globals.css';

export default function App() {
  useEffect(() => {
    // Only roles the server lets write form templates (admin, division); before login this was a 401
    let strGroup = '';
    try { strGroup = String(JSON.parse(localStorage.getItem('user') || 'null')?.role?.role_group || '').toLowerCase(); } catch { /* not signed in */ }
    if (import.meta.env.MODE === 'mock' && ['admin', 'reviewer'].includes(strGroup)) {
      seedDefaultSchemas().catch(() => {});
    }
  }, []);

  return (
    <AuthProvider>
      <AppProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AppProvider>
    </AuthProvider>
  );
}
