/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Collapsible navigation sidebar with role-based menu items and active-link highlighting.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/auth_context';
import { usePermissions } from '../../hooks/use_permissions';
import { PERMISSIONS } from '../../utils/permissions';
import styles from './sidebar.module.css';

const ALL_NAV_ITEMS = [
  { path: '/dashboard',          label: 'Dashboard',           icon: 'grid',        permission: PERMISSIONS.DASHBOARD },
  { path: '/forms',              label: 'Forms',               icon: 'file-text',   permission: PERMISSIONS.FORMS },
  { path: '/budget-requests',    label: 'Budget Requests',     icon: 'file-text',   permission: PERMISSIONS.BUDGET_REQUESTS },
  { path: '/budget-review',      label: 'Budget Review',       icon: 'check-square',permission: PERMISSIONS.BUDGET_REVIEW },
  { path: '/budget-consolidation', label: 'Budget Consolidation',  icon: 'layers',      permission: PERMISSIONS.BUDGET_CONSOLIDATION },
  // { path: '/budget-tracking',    label: 'Budget Tracking',     icon: 'bar-chart-2', permission: PERMISSIONS.BUDGET_TRACKING },
  // { path: '/reports',            label: 'Reports',             icon: 'clipboard',   permission: PERMISSIONS.REPORTS },
  { path: '/settings',           label: 'Settings',            icon: 'settings',    permission: PERMISSIONS.SETTINGS },
];

const COLLAPSED_STORAGE_KEY = 'dost-bms.sidebar.collapsed';

// Reads the persisted collapsed preference from localStorage. Returns false
// if storage is not available (e.g. SSR, privacy mode) or no value was set.
function readPersistedCollapsed() {
  try {
    return window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function Sidebar() {
  const { isLoading, user } = useAuth();
  const permissions = usePermissions();
  const navItems = (isLoading || !user) ? [] : ALL_NAV_ITEMS.filter(item => permissions.includes(item.permission));

  const [blnCollapsed, setCollapsed] = useState(readPersistedCollapsed);

  // Persist the collapsed preference so it survives page reloads.
  useEffect(() => {
    try {
      window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(blnCollapsed));
    } catch {
      // Storage may be unavailable (private mode, quota); ignore silently.
    }
  }, [blnCollapsed]);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  const renderIcon = (name) => {
    // Simple SVG placeholders for Feather-like icons
    const icons = {
      'grid': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>,
      'file-text': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
      'layers': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>,
      'bar-chart-2': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>,
      'clipboard': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>,
      'check-square': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>,
      'settings': <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
    };
    return icons[name] || null;
  };

  const strToggleLabel = blnCollapsed ? 'Expand sidebar' : 'Collapse sidebar';

  return (
    <aside className={`${styles.sidebar} ${blnCollapsed ? styles.collapsed : ''}`}>
      {/*
       * Logo area doubles as the collapse / expand toggle. Clicking the
       * DOST logo (or the system name when expanded) switches the sidebar
       * between its full and collapsed widths.
       */}
      <button
        type="button"
        className={styles.logoArea}
        onClick={toggleCollapsed}
        aria-label={strToggleLabel}
        aria-pressed={blnCollapsed}
        aria-controls="app-sidebar-nav"
        title={strToggleLabel}
      >
        <img src="../../../public/assets/dost-logo.png" alt="DOST logo" className={styles.logoImage} />
        <span className={styles.logoText}>Budget Management System</span>
      </button>

      <nav id="app-sidebar-nav" className={styles.nav}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            title={blnCollapsed ? item.label : undefined}
            className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{renderIcon(item.icon)}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottomArea}>
        <a href="#" className={styles.helpLink} title={blnCollapsed ? 'Help Center' : undefined}>
          <span className={styles.navIcon}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
          </span>
          <span className={styles.navLabel}>Help Center</span>
        </a>
      </div>
    </aside>
  );
}
