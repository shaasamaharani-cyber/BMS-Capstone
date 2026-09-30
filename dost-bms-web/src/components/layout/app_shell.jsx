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

import { Outlet } from 'react-router-dom';
import Sidebar from './sidebar';
import Topbar from './topbar';
import styles from './app_shell.module.css';

export default function AppShell() {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <div className={styles.main}>
        <Topbar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
