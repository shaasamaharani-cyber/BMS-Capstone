/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Root application shell that composes the sidebar, topbar, and main content area into the full-page layout.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import Topbar from './topbar';
import { loadAppSettings } from '../../utils/app_settings';
import styles from './app_shell.module.css';

export default function AppShell() {
  // Alert thresholds come from the administrator's Settings; load them once before the pages render
  const [blnSettingsReady, setBlnSettingsReady] = useState(false);
  useEffect(() => {
    loadAppSettings().finally(() => setBlnSettingsReady(true));
  }, []);

  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <main className={styles.content}>
          {blnSettingsReady ? <Outlet /> : null}
        </main>
      </div>
    </div>
  );
}
