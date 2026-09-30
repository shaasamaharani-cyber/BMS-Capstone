/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Horizontal tab bar component that manages active-tab state and renders the associated content panel.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import styles from './tabs.module.css';

/**
 * Tabs component
 */
export default function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = 'underline',
  size = 'md'
}) {
  return (
    <div className={`${styles.tabsContainer} ${styles[`variant-${variant}`]}`}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            className={`
              ${styles.tab} 
              ${isActive ? styles.active : ''} 
              ${tab.disabled ? styles.disabled : ''}
              ${styles[`size-${size}`]}
            `}
            onClick={() => !tab.disabled && onChange(tab.id)}
            disabled={tab.disabled}
          >
            {tab.icon && <span className={styles.icon}>{tab.icon}</span>}
            <span className={styles.label}>{tab.label}</span>
            {tab.badge && (
              <span className={styles.badge}>{tab.badge}</span>
            )}
            {variant === 'underline' && isActive && (
              <div className={styles.underlineActive} />
            )}
          </button>
        );
      })}
    </div>
  );
}

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.node,
    badge: PropTypes.node,
    disabled: PropTypes.bool
  })).isRequired,
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['underline', 'pills', 'bordered']),
  size: PropTypes.oneOf(['sm', 'md'])
};
