/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Paginated navigation control with entry-range summary, ellipsis, and first/last shortcuts.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import styles from './pagination.module.css';

export default function Pagination({
  total,
  page,
  pageSize,
  onChange,
  showFirstLast = true,
  showPageInfo = true
}) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startEntry = (page - 1) * pageSize + 1;
  const endEntry = Math.min(page * pageSize, total);

  if (totalPages <= 1 && total === 0) return null;

  const handlePage = (p) => {
    if (p >= 1 && p <= totalPages) onChange(p);
  };

  const renderPages = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, page - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      pages.push(<li key="1" className="page-item"><button className="page-link" onClick={() => handlePage(1)}>1</button></li>);
      if (startPage > 2) {
        pages.push(<li key="ellipsis1" className="page-item disabled"><span className="page-link">...</span></li>);
      }
    }

    for (let i = startPage; i <= endPage; i++) {
        pages.push(
            <li key={i} className={`page-item ${i === page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => handlePage(i)}>{i}</button>
            </li>
        );
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pages.push(<li key="ellipsis2" className="page-item disabled"><span className="page-link">...</span></li>);
        }
        pages.push(<li key={totalPages} className="page-item"><button className="page-link" onClick={() => handlePage(totalPages)}>{totalPages}</button></li>);
    }

    return pages;
  };

  return (
    <div className={`d-flex align-items-center justify-content-between mt-3 ${styles.paginationWrap}`}>
        {showPageInfo && (
            <div className={styles.pageInfo}>
                Showing {total === 0 ? 0 : startEntry} to {endEntry} of {total} entries
            </div>
        )}
        
        <nav className={styles.nav}>
            <ul className="pagination pagination-sm mb-0">
                {showFirstLast && (
                    <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePage(1)}>&laquo;</button>
                    </li>
                )}
                
                <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePage(page - 1)}>&lsaquo;</button>
                </li>
                
                {renderPages()}
                
                <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                    <button className="page-link" onClick={() => handlePage(page + 1)}>&rsaquo;</button>
                </li>
                
                {showFirstLast && (
                    <li className={`page-item ${page === totalPages ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => handlePage(totalPages)}>&raquo;</button>
                    </li>
                )}
            </ul>
        </nav>
    </div>
  );
}

Pagination.propTypes = {
  total: PropTypes.number.isRequired,
  page: PropTypes.number.isRequired,
  pageSize: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  showFirstLast: PropTypes.bool,
  showPageInfo: PropTypes.bool
};
