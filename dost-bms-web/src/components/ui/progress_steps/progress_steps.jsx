/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Horizontal or vertical step indicator that reflects done, current, and locked states for multi-step flows.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import styles from './progress_steps.module.css';

export default function ProgressSteps({
  steps,
  orientation = 'horizontal',
  size = 'md'
}) {
  return (
    <div className={`${styles.container} ${styles[orientation]} ${styles[size]}`}>
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        
        return (
          <div key={step.id} className={`${styles.stepWrapper} ${styles[step.status]}`}>
            <div className={styles.indicatorContainer}>
              <div className={styles.circle}>
                {step.status === 'completed' ? (
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                ) : step.status === 'error' ? (
                   <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
              {!isLast && <div className={styles.line} />}
            </div>
            <div className={styles.content}>
              <div className={styles.label}>{step.label}</div>
              {step.description && <div className={styles.description}>{step.description}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

ProgressSteps.propTypes = {
  steps: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    status: PropTypes.oneOf(['completed', 'active', 'pending', 'error']).isRequired
  })).isRequired,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  size: PropTypes.oneOf(['sm', 'md'])
};
