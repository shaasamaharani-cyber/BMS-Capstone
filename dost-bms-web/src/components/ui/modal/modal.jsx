/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Accessible modal dialog rendered in a React portal with size variants, backdrop dismiss, and a footer slot.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

/**
 * Modal component
 * 
 * @param {Object} props
 * @param {boolean} props.open
 * @param {function} props.onClose
 * @param {string} props.title
 * @param {'sm' | 'md' | 'lg' | 'xl'} [props.size='md']
 * @param {React.ReactNode} [props.footer]
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.closeOnBackdrop=true]
 * @param {boolean} [props.showCloseButton=true]
 */
export default function Modal({
  open,
  onClose,
  title,
  size = 'md',
  footer,
  children,
  closeOnBackdrop = true,
  showCloseButton = true,
}) {
  const sizeClass = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl',
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && open) onClose();
    };

    if (open) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  const dialogSizeClass = sizeClass[size] || '';
  const dialogClassName = ['modal-dialog', dialogSizeClass, 'modal-dialog-centered'].filter(Boolean).join(' ');

  return createPortal(
    <>
      <div
        className="modal fade show"
        style={{ display: 'block' }}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        onClick={handleBackdropClick}
      >
        <div className={dialogClassName}>
          <div className="modal-content">
            <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            {showCloseButton ? (
              <button type="button" className="btn-close" aria-label="Close" onClick={onClose}></button>
            ) : null}
            </div>
            <div className="modal-body">
              {children}
            </div>
            {footer && (
              <div className="modal-footer">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show"></div>
    </>,
    document.body
  );
}

Modal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  footer: PropTypes.node,
  children: PropTypes.node.isRequired,
  closeOnBackdrop: PropTypes.bool,
  showCloseButton: PropTypes.bool,
};

/*
USAGE EXAMPLE:
<Modal open={isOpen} onClose={close} title="Create Detail">
  <p>Are you sure?</p>
</Modal>
*/
