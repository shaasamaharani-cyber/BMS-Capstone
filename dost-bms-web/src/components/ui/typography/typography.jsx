/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Polymorphic text component supporting multiple heading and body variants with semantic colour tokens.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';

/**
 * Typography component
 * 
 * @param {Object} props
 * @param {'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'caption' | 'label' | 'mono'} [props.variant='body']
 * @param {'primary' | 'secondary' | 'muted' | 'danger' | 'success'} [props.color]
 * @param {string} [props.as]
 * @param {string} [props.className]
 * @param {React.ReactNode} props.children
 */
export default function Typography({
  variant = 'body',
  color = 'primary',
  as,
  className = '',
  children,
  ...rest
}) {
  const getStyle = () => {
    switch(variant) {
      case 'h1': return { fontSize: 'var(--font-size-2xl)', fontWeight: 700 };
      case 'h2': return { fontSize: 'var(--font-size-xl)', fontWeight: 600 };
      case 'h3': return { fontSize: 'var(--font-size-lg)', fontWeight: 600 };
      case 'h4': return { fontSize: 'var(--font-size-md)', fontWeight: 600 };
      case 'body': return { fontSize: 'var(--font-size-base)', fontWeight: 400 };
      case 'small': return { fontSize: 'var(--font-size-sm)', fontWeight: 400 };
      case 'caption': return { fontSize: 'var(--font-size-xs)', fontWeight: 500 };
      case 'label': return { fontSize: 'var(--font-size-sm)', fontWeight: 600 };
      case 'mono': return { fontSize: 'var(--font-size-sm)', fontFamily: 'var(--font-mono)' };
      default: return {};
    }
  };

  const getColor = () => {
    switch(color) {
      case 'primary': return 'var(--color-text-primary)';
      case 'secondary': return 'var(--color-text-secondary)';
      case 'muted': return 'var(--color-text-muted)';
      case 'danger': return 'var(--color-status-rejected-text)';
      case 'success': return 'var(--color-status-approved-text)';
      default: return color; // Allow custom hex if needed
    }
  };

  const Component = as || (['h1', 'h2', 'h3', 'h4'].includes(variant) ? variant : 'p');

  return (
    <Component 
      style={{ ...getStyle(), color: getColor(), margin: 0, ...rest.style }} 
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
}

Typography.propTypes = {
  variant: PropTypes.oneOf(['h1', 'h2', 'h3', 'h4', 'body', 'small', 'caption', 'label', 'mono']),
  color: PropTypes.string,
  as: PropTypes.string,
  className: PropTypes.string,
  children: PropTypes.node.isRequired
};

/*
USAGE EXAMPLE:
<Typography variant="h1" color="primary">Welcome</Typography>
<Typography variant="small" color="muted">Last updated today</Typography>
*/
