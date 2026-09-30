/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Sticky page header that renders a title, optional subtitle, and a right-side action slot.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';

export default function PageHeader({ title, children }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-4">
      <h4 className="fw-bold mb-0">{title}</h4>
      <div>{children}</div>
    </div>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
};

PageHeader.defaultProps = {
  children: null,
};
