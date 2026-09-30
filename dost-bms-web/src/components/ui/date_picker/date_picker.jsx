/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Calendar popover date picker with month/year navigation, integrated with the shared Input component.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './date_picker.module.css';
import Input from '../input/input';
import { formatDate } from '../../../utils/formatters';

const DAYS_OF_WEEK = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  disabled,
  error,
  required,
  minDate,
  maxDate,
  format = 'MMM dd, yyyy',
  range = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(
    (range ? value?.start : value) || new Date()
  );
  
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleDateClick = (date) => {
    if (isDisabledDate(date)) return;

    if (range) {
      if (!value?.start || (value?.start && value?.end)) {
        onChange({ start: date, end: null });
      } else {
        if (date < value.start) {
          onChange({ start: date, end: value.start });
        } else {
          onChange({ start: value.start, end: date });
          setIsOpen(false);
        }
      }
    } else {
      onChange(date);
      setIsOpen(false);
    }
  };

  const isDisabledDate = (date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const isSelected = (date) => {
    if (range) {
      return (
        (value?.start && date.getTime() === value.start.getTime()) ||
        (value?.end && date.getTime() === value.end.getTime())
      );
    }
    return value && date.getTime() === value.getTime();
  };

  const isInRange = (date) => {
    if (!range || !value?.start || !value?.end) return false;
    return date > value.start && date < value.end;
  };

  const generateDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];
    
    // Padding disabled days from previous month
    for (let i = 0; i < firstDay.getDay(); i++) {
        days.push(<div key={`prev-${i}`} className={styles.emptyDay} />);
    }
    
    // Active days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      const disabledDay = isDisabledDate(date);
      const selected = isSelected(date);
      const inRange = isInRange(date);
      const today = new Date().setHours(0,0,0,0) === date.setHours(0,0,0,0);

      days.push(
        <div 
          key={i} 
          onClick={() => handleDateClick(date)}
          className={`
            ${styles.day} 
            ${disabledDay ? styles.disabledDay : ''} 
            ${selected ? styles.selectedDay : ''} 
            ${inRange ? styles.inRangeDay : ''}
            ${today && !selected ? styles.today : ''}
          `}
        >
          {i}
        </div>
      );
    }
    return days;
  };

  const displayValue = range 
    ? (value?.start && value?.end ? `${formatDate(value.start, format)} - ${formatDate(value.end, format)}` : '')
    : formatDate(value, format);

  const icon = (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );

  return (
    <div className={styles.container} ref={containerRef}>
      <div onClick={toggleOpen} className={styles.trigger}>
         <Input 
            label={label}
            placeholder={placeholder}
            value={displayValue}
            readOnly
            disabled={disabled}
            error={error}
            required={required}
            leftAddon={icon}
            style={{ cursor: disabled ? 'not-allowed' : 'pointer' }}
         />
      </div>

      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.header}>
            <button type="button" className={styles.navBtn} onClick={prevMonth}>&lt;</button>
            <span className={styles.monthLabel}>
                {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" className={styles.navBtn} onClick={nextMonth}>&gt;</button>
          </div>
          
          <div className={styles.weekdays}>
            {DAYS_OF_WEEK.map(d => <div key={d} className={styles.weekday}>{d}</div>)}
          </div>
          
          <div className={styles.daysGrid}>
            {generateDays()}
          </div>
        </div>
      )}
    </div>
  );
}

DatePicker.propTypes = {
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.string,
  required: PropTypes.bool,
  minDate: PropTypes.instanceOf(Date),
  maxDate: PropTypes.instanceOf(Date),
  format: PropTypes.string,
  range: PropTypes.bool
};
