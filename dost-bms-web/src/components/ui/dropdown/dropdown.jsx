/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Accessible select dropdown with custom styling, placeholder, and optional disabled state.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import styles from './dropdown.module.css';

/**
 * Dropdown Component
 */
export default function Dropdown({
  options = [],
  value,
  onChange,
  placeholder = 'Select option...',
  multiple = false,
  searchable = false,
  disabled = false,
  maxHeight = 240,
  error
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [menuStyle, setMenuStyle] = useState({});
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        menuRef.current && !menuRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setMenuStyle({
        position: 'fixed',
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (option) => {
    if (option.disabled) return;
    
    if (multiple) {
      const currentValues = Array.isArray(value) ? value : [];
      const isSelected = currentValues.includes(option.value);
      let newValues;
      
      if (isSelected) {
        newValues = currentValues.filter(v => v !== option.value);
      } else {
        newValues = [...currentValues, option.value];
      }
      onChange(newValues);
    } else {
      onChange(option.value);
      setIsOpen(false);
    }
  };

  const filteredOptions = searchable 
    ? options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
    : options;

  const getDisplayValue = () => {
    if (multiple) {
      const selectedOpts = options.filter(opt => Array.isArray(value) && value.includes(opt.value));
      return selectedOpts.length ? selectedOpts.map(o => o.label).join(', ') : placeholder;
    }
    const selectedOpt = options.find(opt => opt.value === value);
    return selectedOpt ? selectedOpt.label : placeholder;
  };

  const isSelected = (optValue) => {
    if (multiple && Array.isArray(value)) return value.includes(optValue);
    return value === optValue;
  };

  return (
    <div className={styles.container} ref={dropdownRef}>
      <div 
        className={`${styles.trigger} ${isOpen ? styles.open : ''} ${disabled ? styles.disabled : ''} ${error ? styles.error : ''}`}
        onClick={toggleDropdown}
      >
        <div className={styles.valueWrap}>
          <span className={(!value || (multiple && value.length === 0)) ? styles.placeholder : styles.value}>
            {getDisplayValue()}
          </span>
        </div>
        <div className={styles.icon}>▼</div>
      </div>
      
      {isOpen && createPortal(
        <div ref={menuRef} className={styles.menu} style={{ ...menuStyle, maxHeight: `${maxHeight}px` }}>
          {searchable && (
            <div className={styles.searchWrap}>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={styles.searchInput}
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}
          <ul className={styles.list}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option.value}
                  className={`${styles.option} ${isSelected(option.value) ? styles.selected : ''} ${option.disabled ? styles.optionDisabled : ''}`}
                  onClick={() => handleSelect(option)}
                >
                  {multiple && (
                    <input
                      type="checkbox"
                      readOnly
                      checked={isSelected(option.value)}
                      className={styles.checkbox}
                    />
                  )}
                  {option.icon && <span className={styles.optionIcon}>{option.icon}</span>}
                  <span>{option.label}</span>
                </li>
              ))
            ) : (
              <li className={styles.noResults}>No options found</li>
            )}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}

Dropdown.propTypes = {
  options: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.any.isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.node,
    disabled: PropTypes.bool
  })).isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  multiple: PropTypes.bool,
  searchable: PropTypes.bool,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  maxHeight: PropTypes.number
};
