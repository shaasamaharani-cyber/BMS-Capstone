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
    if (import.meta.env.MODE === 'mock') {
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
