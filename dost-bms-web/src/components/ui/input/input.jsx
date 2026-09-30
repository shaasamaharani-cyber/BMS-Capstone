/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Unified text, password, and textarea input with error feedback and forwarded ref support.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { forwardRef } from 'react';
import PropTypes from 'prop-types';
import styles from './input.module.css';

/**
 * Input component
 */
const Input = forwardRef(({
  placeholder,
  value,
  onChange,
  name,
  id,
  type = 'text',
  error,
  disabled,
  required,
  readOnly,
  leftAddon,
  rightAddon,
  rows,
  className = '',
  ...rest
}, ref) => {
  const isTextarea = type === 'textarea';
  const Component = isTextarea ? 'textarea' : 'input';

  const wrapperClass = [
    styles.wrapper,
    error ? styles.hasError : '',
    disabled ? styles.isDisabled : '',
    leftAddon ? styles.hasLeftAddon : '',
    rightAddon ? styles.hasRightAddon : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClass}>
      {leftAddon && <span className={styles.addonLeft}>{leftAddon}</span>}
      <Component
        ref={ref}
        id={id || name}
        name={name}
        type={isTextarea ? undefined : type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        readOnly={readOnly}
        rows={isTextarea ? (rows || 3) : undefined}
        className={styles.input}
        {...rest}
      />
      {rightAddon && <span className={styles.addonRight}>{rightAddon}</span>}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  label: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  name: PropTypes.string,
  id: PropTypes.string,
  type: PropTypes.oneOf(['text', 'email', 'number', 'password', 'search', 'textarea']),
  error: PropTypes.string,
  hint: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
  readOnly: PropTypes.bool,
  leftAddon: PropTypes.node,
  rightAddon: PropTypes.node,
  rows: PropTypes.number,
  className: PropTypes.string
};

export default Input;
