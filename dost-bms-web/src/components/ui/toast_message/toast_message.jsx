/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Auto-dismissing toast notification system with success, error, warning, and info variants.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import PropTypes from 'prop-types';
import {
  BsCheckCircleFill,
  BsExclamationCircleFill,
  BsInfoCircleFill,
  BsXCircleFill,
} from 'react-icons/bs';
import { ToastContext, useToast } from './toast_context';
const EXIT_MS = 220;

const VARIANT_META = {
  success: {
    icon: <BsCheckCircleFill className="toast-message-icon success" />,
    defaultTitle: 'Success',
  },
  danger: {
    icon: <BsXCircleFill className="toast-message-icon danger" />,
    defaultTitle: 'Error',
  },
  warning: {
    icon: <BsExclamationCircleFill className="toast-message-icon warning" />,
    defaultTitle: 'Warning',
  },
  info: {
    icon: <BsInfoCircleFill className="toast-message-icon info" />,
    defaultTitle: 'Information',
  },
};

function ToastItem({ toast, onClose }) {
  const resolved = VARIANT_META[toast.variant] || VARIANT_META.success;

  return (
    <div
      className={`toast-message toast-message-${toast.variant} ${toast.closing ? 'is-leaving' : 'is-entering'}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="toast-message-content">
        <span className="toast-message-icon-wrap">{resolved.icon}</span>
        <div className="toast-message-copy">
          <div className="toast-message-title-row">
            <strong className="toast-message-title">{toast.title || resolved.defaultTitle}</strong>
            <small className="toast-message-time">{toast.timeLabel || 'just now'}</small>
          </div>
          <div className="toast-message-body">{toast.message}</div>
        </div>
        <button
          type="button"
          className="btn-close toast-message-close"
          aria-label="Close notification"
          onClick={() => onClose(toast.id)}
        />
      </div>
      <div
        className="toast-message-progress"
        style={{ animationDuration: `${toast.duration}ms` }}
      />
    </div>
  );
}

ToastItem.propTypes = {
  toast: PropTypes.shape({
    id: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    variant: PropTypes.oneOf(['success', 'danger', 'warning', 'info']).isRequired,
    title: PropTypes.string,
    timeLabel: PropTypes.string,
    duration: PropTypes.number.isRequired,
    closing: PropTypes.bool,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) window.clearTimeout(timer);
    timersRef.current.delete(id);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) =>
      prev.map((toast) => (toast.id === id ? { ...toast, closing: true } : toast))
    );
    window.setTimeout(() => removeToast(id), EXIT_MS);
  }, [removeToast]);

  const showToast = useCallback((options) => {
    const normalized = typeof options === 'string' ? { message: options } : options;
    const id = `toast-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const duration = Number(normalized?.duration) > 0 ? Number(normalized.duration) : 3600;
    const toast = {
      id,
      message: normalized?.message || '',
      variant: normalized?.variant || 'success',
      title: normalized?.title || '',
      timeLabel: normalized?.timeLabel || 'just now',
      duration,
      closing: false,
    };

    setToasts((prev) => [toast, ...prev].slice(0, 4));
    const timer = window.setTimeout(() => dismissToast(id), duration);
    timersRef.current.set(id, timer);
    return id;
  }, [dismissToast]);

  useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const value = useMemo(() => ({
    showToast,
    dismissToast,
  }), [showToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-global-viewport" aria-live="polite" aria-relevant="additions">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={dismissToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default function ToastMessage({ message, variant = 'success', title, timeLabel }) {
  const { showToast } = useToast();

  useEffect(() => {
    if (message) {
      showToast({ message, variant, title, timeLabel });
    }
  }, [message, variant, title, timeLabel, showToast]);

  return null;
}

ToastMessage.propTypes = {
  message: PropTypes.string,
  variant: PropTypes.oneOf(['success', 'danger', 'warning', 'info']),
  title: PropTypes.string,
  timeLabel: PropTypes.string,
};

ToastMessage.defaultProps = {
  message: '',
  variant: 'success',
  title: '',
  timeLabel: 'just now',
};
