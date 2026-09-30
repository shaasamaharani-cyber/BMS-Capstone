/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Sortable data table with configurable columns, loading skeleton, empty-state slot, and optional row click.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import styles from './table.module.css';

/**
 * Table Component
 */
export default function Table({
  columns,
  data,
  loading = false,
  emptyState = 'No data available',
  onRowClick,
  sortKey,
  sortDir,
  onSort
}) {
  const renderSortIcon = (colKey) => {
    if (sortKey !== colKey) return <span className={styles.sortIcon}>↕</span>;
    return sortDir === 'asc' 
      ? <span className={styles.sortIconActive}>↑</span> 
      : <span className={styles.sortIconActive}>↓</span>;
  };

  const handleRowClick = (row) => {
    if (onRowClick) onRowClick(row);
  };

  if (loading) {
    return (
      <div className="table-responsive">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              {columns.map(col => (
                <th key={col.key} style={{ width: col.width }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key}>
                    <div className={`skeleton ${styles.skeletonRow}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={`table-responsive ${styles.tableWrapper}`}>
      <table className={`table table-hover mb-0 ${styles.table}`}>
        <thead className={styles.thead}>
          <tr>
            {columns.map(col => (
              <th 
                key={col.key} 
                style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default' }}
                onClick={() => col.sortable && onSort && onSort(col.key)}
                className={styles.th}
              >
                {col.label}
                {col.sortable && renderSortIcon(col.key)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {emptyState}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr 
                key={row.id || idx} 
                onClick={() => handleRowClick(row)}
                className={onRowClick ? styles.clickableRow : ''}
              >
                {columns.map(col => (
                  <td key={col.key} className={styles.td}>
                    {col.render ? col.render(row[col.key], row, idx) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

Table.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    label: PropTypes.node.isRequired,
    sortable: PropTypes.bool,
    width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    render: PropTypes.func
  })).isRequired,
  data: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  emptyState: PropTypes.node,
  onRowClick: PropTypes.func,
  sortKey: PropTypes.string,
  sortDir: PropTypes.oneOf(['asc', 'desc']),
  onSort: PropTypes.func
};
