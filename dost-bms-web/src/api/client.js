/**
 * System Name: Budget Management System
 * Module Name: API Layer
 *
 * Purpose of this file:
 * Configured axios instance with auth token injection and error normalisation.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import axios from 'axios';

export const TOKEN_KEY = 'token';

export const getStoredToken = () => localStorage.getItem(TOKEN_KEY);
export const setStoredToken = (strToken) => localStorage.setItem(TOKEN_KEY, strToken);

const clearAllAuthKeys = () =>
{
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('user');
  localStorage.removeItem('role');
  localStorage.removeItem('permissions');

  // Backward compatibility for earlier mock/client implementations.
  localStorage.removeItem('bms_token');
};

export const clearStoredToken = () => clearAllAuthKeys();

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept:         'application/json',
  },
});


// Attach Bearer token to every outgoing request
client.interceptors.request.use((objConfig) =>
{
  const strToken = getStoredToken();

  if (strToken)
  {
    objConfig.headers.Authorization = `Bearer ${strToken}`;
  }

  return objConfig;
});


// Normalise error shape; broadcast logout event on 401
client.interceptors.response.use(
  (objResponse) => objResponse,
  (objError) =>
  {
    if (objError.response?.status === 401)
    {
      clearStoredToken();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }

    const objNormalised = {
      message: objError.response?.data?.message
        || objError.message
        || 'Cannot perform transaction. Error encountered.',
      status: objError.response?.status ?? null,
      errors: objError.response?.data?.errors ?? null,
      // Preserve axios error shape for legacy callers that still read `err.response.*`.
      response: objError.response,
    };

    return Promise.reject(objNormalised);
  }
);

export default client;
