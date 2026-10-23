/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Fixed top navigation bar with the application logo, global search, user profile menu, and logout action.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getBudgetRequests, getUnifiedBudgets, getUsers } from '../../api';
import { useAuth } from '../../context/auth_context';
import { useClickOutside } from '../../hooks/use_click_outside';
import { usePermissions } from '../../hooks/use_permissions';
import { extractApiRows } from '../../utils/budget_request_utils';
import { formatRoleName, getInitials } from '../../utils/helpers';
import { PERMISSIONS } from '../../utils/permissions';
import SearchBar from '../ui/search_bar/search_bar';
import { ALL_NAV_ITEMS } from './nav_items';
import styles from './topbar.module.css';

const MOCK_NOTIFICATIONS = [];

// Records the signed-in role may open, each with where it lives ("Budget request › BR-2027-005 · NCR").
// The server already limits every list to what this role may see.
async function loadSearchRecords(arrPermissions) {
  const can = (strPermission) => arrPermissions.includes(strPermission);
  const quietly = (promise) => promise.then(extractApiRows).catch(() => []);
  const strRequestPath = can(PERMISSIONS.BUDGET_REVIEW) ? '/budget-review' : '/budget-requests';
  const [arrRequests, arrBudgets, arrUsers] = await Promise.all([
    can(PERMISSIONS.BUDGET_REQUESTS) || can(PERMISSIONS.BUDGET_REVIEW) ? quietly(getBudgetRequests({ per_page: 200 })) : [],
    can(PERMISSIONS.BUDGET_CONSOLIDATION) ? quietly(getUnifiedBudgets({ per_page: 200 })) : [],
    can(PERMISSIONS.USERS) ? quietly(getUsers(1, 200)) : [],
  ]);
  return [
    ...arrRequests.map((objRequest) => ({
      id: `request-${objRequest.id}`,
      label: objRequest.br_title,
      hint: `Budget request › ${objRequest.br_reference_no} · ${objRequest.requesting_unit?.ru_name || ''}`,
      path: `${strRequestPath}/${objRequest.id}`,
    })),
    ...arrBudgets.map((objBudget) => ({
      id: `budget-${objBudget.id}`,
      label: objBudget.title,
      hint: `Consolidated budget › ${objBudget.code} · FY${objBudget.fiscalYear}`,
      path: `/budget-consolidation/${objBudget.id}`,
    })),
    ...arrUsers.map((objUser) => ({
      id: `user-${objUser.id}`,
      label: objUser.usr_name,
      hint: `User › ${objUser.usr_email}`,
      path: '/users',
    })),
  ];
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [blnNotifOpen, setBlnNotifOpen] = useState(false);
  const [blnAvatarOpen, setBlnAvatarOpen] = useState(false);
  const [arrNotifications, setArrNotifications] = useState(MOCK_NOTIFICATIONS);
  const arrPermissions = usePermissions();
  const [arrSearchRecords, setArrSearchRecords] = useState([]);
  const strPermissionKey = arrPermissions.join(',');

  useEffect(() => {
    let blnMounted = true;
    if (!user) return undefined;
    loadSearchRecords(strPermissionKey.split(',')).then((arrRows) => { if (blnMounted) setArrSearchRecords(arrRows); });
    return () => { blnMounted = false; };
  }, [user, strPermissionKey]);

  const arrSearchItems = [
    ...ALL_NAV_ITEMS.filter((objItem) => arrPermissions.includes(objItem.permission))
      .map((objItem) => ({ id: objItem.path, label: objItem.label, hint: 'Page', path: objItem.path })),
    ...arrSearchRecords,
  ];

  const notifRef = useRef(null);
  const avatarRef = useRef(null);

  useClickOutside(notifRef, () => setBlnNotifOpen(false));
  useClickOutside(avatarRef, () => setBlnAvatarOpen(false));

  const unreadCount = arrNotifications.filter((n) => n.unread).length;

  function markAllRead() {
    setArrNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  }

  function markRead(id) {
    setArrNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  }

  function handleLogout() {
    logout();
    setBlnAvatarOpen(false);
    navigate('/login');
  }

  const pathParts = location.pathname.split('/').filter(Boolean);
  let title = 'Dashboard';
  if (pathParts.length > 0) {
    const mainSection = pathParts[0];
    title = mainSection
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <h1 className={styles.title}>{title}</h1>
      </div>

      <div className={styles.center}>
        <div className={styles.searchWrapper}>
          <SearchBar
            placeholder="Search pages, requests, budgets..."
            suggestions={arrSearchItems}
            maxSuggestions={8}
            onSuggestionSelect={(objItem) => navigate(objItem.path)}
          />
        </div>
      </div>

      <div className={styles.right}>
        {/* ── Notification ── */}
        <div className={styles.dropdownWrap} ref={notifRef}>
          <button
            className={styles.iconBtn}
            aria-label="Notifications"
            aria-expanded={blnNotifOpen}
            onClick={() => {
              setBlnNotifOpen((o) => !o);
              setBlnAvatarOpen(false);
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount}</span>
            )}
          </button>

          {blnNotifOpen && (
            <div
              className={`${styles.dropdown} ${styles.dropdownAnchorRight}`}
              role="dialog"
              aria-label="Notifications panel"
            >
              <div className={styles.dropdownHeader}>
                <span className={styles.dropdownTitle}>Notifications</span>
                {unreadCount > 0 && (
                  <button className={styles.textBtn} onClick={markAllRead}>
                    Mark all read
                  </button>
                )}
              </div>

              {arrNotifications.length === 0 ? (
                <div className={styles.notifEmpty}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.3">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                  </svg>
                  <p>No notifications yet</p>
                </div>
              ) : (
                <>
                  <ul className={styles.notifList}>
                    {arrNotifications.map((n) => (
                      <li
                        key={n.id}
                        className={`${styles.notifItem} ${n.unread ? styles.unread : ''}`}
                        onClick={() => markRead(n.id)}
                      >
                        <div className={styles.notifDot} data-unread={n.unread} />
                        <div className={styles.notifBody}>
                          <p className={styles.notifTitle}>{n.title}</p>
                          <p className={styles.notifDesc}>{n.description}</p>
                          <span className={styles.notifTime}>{n.time}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <div className={styles.dropdownFooter}>
                    <button className={styles.textBtn}>View all notifications</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Help lives in the sidebar's Help Center only (DOST, 20 Oct: the icon was duplicated) */}
        <div className={styles.divider} />

        {/* ── Avatar ── */}
        <div className={styles.dropdownWrap} ref={avatarRef}>
          <button
            className={styles.profileBtn}
            aria-label="User menu"
            aria-expanded={blnAvatarOpen}
            onClick={() => {
              setBlnAvatarOpen((o) => !o);
              setBlnNotifOpen(false);
            }}
          >
            <div className={styles.avatar}>{getInitials(user)}</div>
            <div className={styles.profileInfo}>
              <span className={styles.profileName}>{user?.usr_name || 'User'}</span>
              <span className={styles.profileRole}>{formatRoleName(user)}</span>
            </div>
          </button>

          {blnAvatarOpen && (
            <div className={`${styles.dropdown} ${styles.dropdownRight}`} role="menu">
              <div className={styles.avatarHeader}>
                <div className={styles.avatarLg}>{getInitials(user)}</div>
                <div>
                  <p className={styles.avatarName}>{user?.usr_name || 'User'}</p>
                  <p className={styles.avatarRole}>{formatRoleName(user)}</p>
                </div>
              </div>

              <div className={styles.menuDivider} />

              <ul className={styles.menuList}>
                <li>
                  <button className={styles.menuItem} role="menuitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    My Profile
                  </button>
                </li>
                <li>
                  <button className={styles.menuItem} role="menuitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                    </svg>
                    Settings
                  </button>
                </li>
              </ul>

              <div className={styles.menuDivider} />

              <ul className={styles.menuList}>
                <li>
                  <button
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    role="menuitem"
                    onClick={handleLogout}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Sign Out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
