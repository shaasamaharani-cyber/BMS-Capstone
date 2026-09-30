/**
 * System Name: Budget Management System
 * Module Name: Context Module
 *
 * Purpose of this file:
 * Provide React context provider and state management for app_context.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [theme, setTheme] = useState('light');

  const toggleSidebar = () => setSidebarOpen(prev => !prev);
  
  return (
    <AppContext.Provider value={{ sidebarOpen, toggleSidebar, theme, setTheme }}>
      {children}
    </AppContext.Provider>
  );
}

AppProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export const useAppContext = () => useContext(AppContext);
