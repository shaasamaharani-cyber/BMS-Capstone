/**
 * System Name: Budget Management System
 * Module Name: Authentication Module
 *
 * Purpose of this file:
 * Shared auth helpers for localStorage session handling.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const ROLE_KEY = 'role';
const PERMISSIONS_KEY = 'permissions';
const LEGACY_TOKEN_KEY = 'bms_token';

export function getToken()
{
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser()
{
  const strVal = localStorage.getItem(USER_KEY);
  if (!strVal)
  {
    return null;
  }

  try
  {
    return JSON.parse(strVal);
  }
  catch
  {
    return null;
  }
}

export function getRole()
{
  return localStorage.getItem(ROLE_KEY);
}

export function hasPermission(strPermission)
{
  const strVal = localStorage.getItem(PERMISSIONS_KEY);
  if (!strVal)
  {
    return false;
  }

  try
  {
    const arrPermissions = JSON.parse(strVal);
    return Array.isArray(arrPermissions) && arrPermissions.includes(strPermission);
  }
  catch
  {
    return false;
  }
}

export function isAuthenticated()
{
  return !!getToken();
}

export function logout()
{
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);

  // Backward compatibility.
  localStorage.removeItem(LEGACY_TOKEN_KEY);

  window.dispatchEvent(new Event('auth:unauthorized'));
}

