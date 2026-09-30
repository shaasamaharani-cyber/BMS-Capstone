/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Status badge that maps workflow states (draft, pending, reviewed, approved, rejected) to colour-coded labels.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import { STATUS_LABELS } from '../../../utils/formatters';

/**
 * Badge component
 * 
 * @param {Object} props
 * @param {'pending' | 'reviewed' | 'draft' | 'rejected' | 'approved' | string} props.status
 * @param {'sm' | 'md'} [props.size='sm']
 * @param {boolean} [props.dot=false]
 * @param {string} [props.label]
 */
export default function Badge({ status, size = 'sm', dot = false, label }) {
  const rawStatus = String(status || '').trim().toLowerCase();
  const normalizedStatus = (() => {
    if (!rawStatus) return 'draft';
    if (rawStatus === 'submitted') return 'pending';
    return rawStatus;
  })();
  const displayLabel = label || STATUS_LABELS[normalizedStatus] || status;
  const sizeStyles = size === 'md'
    ? { padding: '4px 10px', fontSize: '13px' }
    : { padding: '3px 12px', fontSize: '12px' };

  const statusStyles = {
    draft: { backgroundColor: '#F3F4F6', color: '#4B5563', border: '1px solid #D1D5DB' },
    pending: { backgroundColor: '#FEF3C7', color: '#B45309', border: '1px solid #FDE68A' },
    approved: { backgroundColor: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0' },
    reviewed: { backgroundColor: '#DBEAFE', color: '#1D4ED8', border: '1px solid #BFDBFE' },
    rejected: { backgroundColor: '#FEE2E2', color: '#B91C1C', border: '1px solid #FECACA' },
    consolidated: { backgroundColor: '#EDE9FE', color: '#6D28D9', border: '1px solid #DDD6FE' },
    completed: { backgroundColor: '#CCFBF1', color: '#0F766E', border: '1px solid #99F6E4' },
    cancelled: { backgroundColor: '#E2E8F0', color: '#475569', border: '1px solid #CBD5E1' },
    ps: { backgroundColor: 'var(--ps-bg)', color: 'var(--ps)' },
    mooe: { backgroundColor: 'var(--mooe-bg)', color: 'var(--mooe)' },
    co: { backgroundColor: 'var(--co-bg)', color: 'var(--co)' },
  };

  const badgeStyle = {
    borderRadius: '6px',
    fontWeight: 500,
    textTransform: 'uppercase',
    lineHeight: 1.2,
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    ...sizeStyles,
    ...(statusStyles[normalizedStatus] || {}),
  };

  const dotStyle = {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: 'currentColor',
  };

  return (
    <span style={badgeStyle}>
      {dot && <span style={dotStyle} />}
      {displayLabel}
    </span>
  );
}

Badge.propTypes = {
  status: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md']),
  dot: PropTypes.bool,
  label: PropTypes.string
};

/*
USAGE EXAMPLE:
<Badge status="pending" />
<Badge status="approved" dot size="md" />
*/
