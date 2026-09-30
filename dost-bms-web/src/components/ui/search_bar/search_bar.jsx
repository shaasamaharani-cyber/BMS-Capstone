/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Debounced search input with a keyboard-navigable suggestion dropdown and configurable option list.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import Input from '../input/input';
import { useDebounce } from '../../../hooks/use_debounce';
import styles from './search_bar.module.css';

/**
 * SearchBar component
 */
const DEFAULT_SUGGESTIONS = [
  { id: 'dash', label: 'Dashboard', hint: 'Overview and quick stats' },
  { id: 'budget', label: 'Budget Requests', hint: 'Create & review requests' },
  { id: 'oblig', label: 'Obligations', hint: 'Track obligation entries' },
  { id: 'disb', label: 'Disbursements', hint: 'DV processing status' },
  { id: 'reports', label: 'Reports', hint: 'Monthly/quarterly exports' },
  { id: 'settings', label: 'Settings', hint: 'Profile and preferences' },
];

export default function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  debounce = 300,
  loading = false,
  onClear,
  className = '',
  suggestions = DEFAULT_SUGGESTIONS,
  maxSuggestions = 6,
  onSuggestionSelect
}) {
  const [localValue, setLocalValue] = useState(value || '');
  const debouncedValue = useDebounce(localValue, debounce);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapRef = useRef(null);

  // Sync external value
  useEffect(() => {
    if (value !== undefined) {
      setLocalValue(value);
    }
  }, [value]);

  // Trigger search on debounce
  useEffect(() => {
    if (onSearch) {
      onSearch(debouncedValue);
    }
  }, [debouncedValue, onSearch]);

  useEffect(() => {
    function onMouseDown(e) {
      if (!wrapRef.current) return;
      if (wrapRef.current.contains(e.target)) return;
      setOpen(false);
      setActiveIndex(-1);
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, []);

  const filtered = useMemo(() => {
    const q = (localValue || '').trim().toLowerCase();
    if (!q) return suggestions.slice(0, maxSuggestions);
    return suggestions
      .filter((s) => {
        const hay = `${s.label} ${s.hint || ''}`.toLowerCase();
        return hay.includes(q);
      })
      .slice(0, maxSuggestions);
  }, [localValue, suggestions, maxSuggestions]);

  const handleChange = (e) => {
    setLocalValue(e.target.value);
    setOpen(true);
    setActiveIndex(-1);
    if (onChange) onChange(e);
  };

  const handleClear = () => {
    setLocalValue('');
    setOpen(false);
    setActiveIndex(-1);
    if (onClear) onClear();
    if (onChange) onChange({ target: { value: '' } });
  };

  function selectSuggestion(s) {
    if (!s) return;
    if (onSuggestionSelect) {
      onSuggestionSelect(s);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    // Default behavior: populate input with selected label
    setLocalValue(s.label);
    if (onChange) onChange({ target: { value: s.label } });
    setOpen(false);
    setActiveIndex(-1);
  }

  const handleKeyDown = (e) => {
    if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      setOpen(true);
      return;
    }

    if (e.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!open || filtered.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
      return;
    }

    if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        selectSuggestion(filtered[activeIndex]);
      } else {
        setOpen(false);
      }
    }
  };

  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );

  const clearBtn = localValue ? (
    <div style={{ cursor: 'pointer', display: 'flex' }} onClick={handleClear}>
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </div>
  ) : null;

  const rightAddon = loading ? (
    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" style={{ width: '1rem', height: '1rem', color: 'var(--color-primary)' }}></span>
  ) : clearBtn;

  return (
    <div ref={wrapRef} className={`${styles.wrap} ${className}`}>
      <Input
        type="search"
        value={localValue}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        leftAddon={icon}
        rightAddon={rightAddon}
        className={styles.input}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="global-search-suggestions"
      />

      {open && filtered.length > 0 && (
        <div
          id="global-search-suggestions"
          className={styles.dropdown}
          role="listbox"
          aria-label="Search suggestions"
        >
          {filtered.map((s, idx) => (
            <button
              key={s.id ?? s.label}
              type="button"
              className={`${styles.item} ${idx === activeIndex ? styles.active : ''}`}
              role="option"
              aria-selected={idx === activeIndex}
              onMouseEnter={() => setActiveIndex(idx)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectSuggestion(s)}
            >
              <span className={styles.itemLabel}>{s.label}</span>
              {s.hint && <span className={styles.itemHint}>{s.hint}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

SearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  onSearch: PropTypes.func,
  placeholder: PropTypes.string,
  debounce: PropTypes.number,
  loading: PropTypes.bool,
  onClear: PropTypes.func,
  className: PropTypes.string,
  suggestions: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    label: PropTypes.string.isRequired,
    hint: PropTypes.string,
  })),
  maxSuggestions: PropTypes.number,
  onSuggestionSelect: PropTypes.func
};
