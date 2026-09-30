/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Thin form wrapper that prevents default submission and delegates to a caller-supplied onSubmit handler.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';

export default function Form({ onSubmit, children, className = '', ...rest }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit(e);
  };

  return (
    <form onSubmit={handleSubmit} className={className} {...rest}>
      {children}
    </form>
  );
}

Form.propTypes = {
  onSubmit: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};
