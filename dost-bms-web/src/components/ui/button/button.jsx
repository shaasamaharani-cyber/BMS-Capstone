/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Multi-variant, multi-size action button with optional loading state, icons, and full-width layout.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import styles from './button.module.css';

/**
 * Button component
 * 
 * @param {Object} props
 * @param {'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.fullWidth=false]
 * @param {React.ReactNode} [props.leftIcon]
 * @param {React.ReactNode} [props.rightIcon]
 * @param {function} [props.onClick]
 * @param {React.ReactNode} props.children
 */
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  onClick,
  children,
  ...rest
}) {
  const className = [
    styles.button,
    styles[`variant-${variant}`],
    styles[`size-${size}`],
    fullWidth ? styles.fullWidth : '',
    loading ? styles.loading : ''
  ].filter(Boolean).join(' ');

  return (
    <button
      className={className}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
      ) : (
        <>
          {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
          <span className={styles.label}>{children}</span>
          {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger', 'outline']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  onClick: PropTypes.func,
  children: PropTypes.node.isRequired
};

/*
USAGE EXAMPLE:
<Button variant="primary" size="md" onClick={() => console.log('Clicked')}>
  Submit Request
</Button>
<Button loading size="lg" fullWidth>
  Saving...
</Button>
*/
