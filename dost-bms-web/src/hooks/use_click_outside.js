/**
 * System Name: Budget Management System
 * Module Name: Hooks Module
 *
 * Purpose of this file:
 * Provide a custom React hook to detect clicks outside a specified element.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect } from 'react';

/**
 * Hook to trigger a handler function when clicking outside the specified ref element.
 *
 * @param {object} ref
 * @param {function} handler
 */
export function useClickOutside(ref, handler) {
  useEffect(() => {
    function listener(e) {
      if (!ref.current || ref.current.contains(e.target)) return;
      handler();
    }
    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [ref, handler]);
}
