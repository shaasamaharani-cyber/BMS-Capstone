/**
 * System Name: Budget Management System
 * Module Name: Authentication Module
 *
 * Purpose of this file:
 * React context providing auth state, login, logout, and session hydration.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { login as apiLogin, logout as apiLogout, me as apiMe } from '../api/auth_api';
import { clearStoredToken, getStoredToken, setStoredToken } from '../api/client';


const AuthContext = createContext(null);

const LOADING_IDLE    = 'idle';
const LOADING_PENDING = 'pending';


export function AuthProvider({ children })
{
  const [objUser,        setUser]        = useState(null);
  const [strAuthStatus,  setAuthStatus]  = useState(LOADING_PENDING);
  const [strError,       setError]       = useState(null);


  // Hydrate session from stored token on first mount
  useEffect(() =>
  {
    const strToken = getStoredToken();

    if (!strToken)
    {
      setAuthStatus(LOADING_IDLE);
      return;
    }

    apiMe()
      .then((objResponse) =>
      {
        setUser(objResponse.data?.data ?? objResponse.data);
        setAuthStatus(LOADING_IDLE);
      })
      .catch(() =>
      {
        clearStoredToken();
        setAuthStatus(LOADING_IDLE);
      });
  }, []);


  // Listen for 401 broadcasts from the axios interceptor
  useEffect(() =>
  {
    const handleUnauthorized = () =>
    {
      setUser(null);
      setAuthStatus(LOADING_IDLE);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);


  // Listen for local login events from the login page
  useEffect(() =>
  {
    const handleLogin = () =>
    {
      const strToken = getStoredToken();
      if (!strToken)
      {
        setUser(null);
        setAuthStatus(LOADING_IDLE);
        return;
      }

      setAuthStatus(LOADING_PENDING);
      apiMe()
        .then((objResponse) =>
        {
          setUser(objResponse.data?.data ?? objResponse.data);
          setAuthStatus(LOADING_IDLE);
        })
        .catch(() =>
        {
          clearStoredToken();
          setUser(null);
          setAuthStatus(LOADING_IDLE);
        });
    };

    window.addEventListener('auth:login', handleLogin);

    return () => window.removeEventListener('auth:login', handleLogin);
  }, []);


  const login = useCallback(async (strEmail, strPassword) =>
  {
    setError(null);

    try
    {
      const objResponse = await apiLogin(strEmail, strPassword);
      const objData     = objResponse.data ?? objResponse;

      setStoredToken(objData.token);
      setUser(objData.user);

      return objData;
    }
    catch (objErr)
    {
      setError(objErr.message);
      throw objErr;
    }
  }, []);


  const logout = useCallback(async () =>
  {
    try
    {
      await apiLogout();
    }
    catch
    {
      // Proceed with local cleanup even if server call fails
    }
    finally
    {
      clearStoredToken();
      setUser(null);
    }
  }, []);


  const blnIsAuthenticated = objUser !== null;
  const blnIsLoading       = strAuthStatus === LOADING_PENDING;

  return (
    <AuthContext.Provider
      value={{
        user:            objUser,
        isAuthenticated: blnIsAuthenticated,
        isLoading:       blnIsLoading,
        error:           strError,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => useContext(AuthContext);
