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

import { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/auth_context';
import { useClickOutside } from '../../hooks/use_click_outside';
import { formatRoleName, getInitials } from '../../utils/helpers';
import SearchBar from '../ui/search_bar/search_bar';
import styles from './topbar.module.css';

const MOCK_NOTIFICATIONS = [];

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [blnNotifOpen, setBlnNotifOpen] = useState(false);
  const [blnAvatarOpen, setBlnAvatarOpen] = useState(false);
  const [arrNotifications, setArrNotifications] = useState(MOCK_NOTIFICATIONS);

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
          <SearchBar placeholder="Search globally..." />
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

        {/* ── Help ── */}
        <button className={styles.iconBtn} aria-label="Help">
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" />
            <path d="M6.25 6a1.75 1.75 0 1 1 2.98 1.24c-.58.58-.98.9-.98 1.76" />
            <circle cx="8" cy="11.6" r="0.6" fill="currentColor" stroke="none" />
          </svg>
        </button>

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
                <li>
                  <button className={styles.menuItem} role="menuitem">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Help & Support
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
