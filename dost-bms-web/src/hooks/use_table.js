/**
 * System Name: Budget Management System
 * Module Name: Hooks Module
 *
 * Purpose of this file:
 * Custom hook encapsulating sort, filter, and pagination state for table components.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useState, useMemo } from 'react';

export function useTable({ data, pageSize = 7 }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({});

  const setFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset page on filter change
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSortKey('');
    setSortDir('asc');
    setCurrentPage(1);
  };

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const processedData = useMemo(() => {
    let result = [...data];

    // Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(lowerQuery)
        )
      );
    }

    // Filter
    Object.keys(filters).forEach(key => {
      const filterVal = filters[key];
      if (filterVal !== undefined && filterVal !== null && filterVal !== '') {
        result = result.filter(item => {
          if (Array.isArray(filterVal)) {
             return filterVal.includes(item[key]);
          }
          return item[key] === filterVal;
        });
      }
    });

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        const valA = a[sortKey];
        const valB = b[sortKey];
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, sortKey, sortDir, filters]);

  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  
  const rows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  return {
    rows,
    totalPages,
    currentPage,
    setPage: setCurrentPage,
    sortKey,
    sortDir,
    onSort,
    searchQuery,
    setSearchQuery,
    filters,
    setFilter,
    clearFilters
  };
}
