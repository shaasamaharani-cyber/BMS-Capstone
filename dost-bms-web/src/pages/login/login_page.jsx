/**
 * System Name: Budget Management System
 * Module Name: Authentication Module
 *
 * Purpose of this file:
 * Login page — authenticates users and issues a session token.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, LogIn, User } from 'lucide-react';
import { Form, Input } from '../../components/ui';
import { login as authLogin } from '../../api';
import dostLogo from '../../../public/assets/dost-logo.png';
import styles from './login_page.module.css';


export default function LoginPage()
{
  const objNavigate      = useNavigate();

  const [strUsername, setUsername] = useState('');
  const [strPassword, setPassword] = useState('');
  const [blnRemember, setRemember] = useState(false);
  const [blnLoading,  setLoading]  = useState(false);
  const [strError,    setError]    = useState('');


  const handleSubmit = async () =>
  {
    setError('');
    setLoading(true);

    try
    {
      const objResult = await authLogin(strUsername, strPassword);
      const objData = objResult?.data ?? objResult;

      localStorage.setItem('token', objData.token);
      localStorage.setItem('user', JSON.stringify(objData.user));
      localStorage.setItem('role', objData.role);
      localStorage.setItem('permissions', JSON.stringify(objData.permissions || []));

      window.dispatchEvent(new Event('auth:login'));
      objNavigate('/dashboard', { replace: true });
    }
    catch (objErr)
    {
      const intStatus = objErr?.response?.status ?? null;

      if (intStatus === 401 || intStatus === 403)
      {
        setError('Invalid email or password.');
        return;
      }

      if (intStatus === 422)
      {
        const objErrors = objErr?.response?.data?.errors;
        const strMessage =
          (objErr?.response?.data?.message || '')
          || (objErrors ? Object.values(objErrors).flat()?.[0] : '')
          || 'Validation failed.';

        setError(strMessage);
        return;
      }

      if (! objErr?.response)
      {
        setError('Cannot connect to server. Please try again.');
        return;
      }

      setError(objErr?.response?.data?.message || 'Login failed. Please try again.');
    }
    finally
    {
      setLoading(false);
    }
  };


  const handleForgotPassword = () =>
  {
    alert('Please contact your administrator.');
  };


  return (
    <div className={`min-vh-100 d-flex flex-column align-items-center justify-content-center ${styles.pageWrapper}`}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="text-center mb-4">
        <img
          src={dostLogo}
          alt="DOST Logo"
          className={`mb-3 d-block mx-auto ${styles.logo}`}
        />

        <p className={`fw-bold mb-1 ${styles.dostTitle}`}>
          DOST
        </p>

        <p className={`text-uppercase text-muted mb-2 ${styles.subtitle}`}>
          Philippines Department of Science and Technology
        </p>

        <p className={`fw-bold mb-0 ${styles.systemTitle}`}>
          Budget Management System
        </p>
      </div>


      {/* ── Card ───────────────────────────────────────────────── */}
      <div className={`card border-0 shadow ${styles.card}`}>
        <div className="card-body p-4 p-sm-5">

          <h5 className={`fw-bold mb-4 text-center ${styles.cardHeading}`}>
            Sign In to your account
          </h5>



          <Form onSubmit={handleSubmit}>

            {/* Username */}
            <div className="mb-3">
              <label
                className={`d-inline-flex align-items-center gap-1 fw-semibold text-uppercase mb-1 ${styles.fieldLabel}`}
                htmlFor="fieldUsername"
              >
                <User size={13} strokeWidth={2.2} />
                Username
              </label>
              <Input
                id="fieldUsername"
                name="username"
                type="text"
                placeholder="e.g. fiscal.admin"
                value={strUsername}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={blnLoading}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div className="mb-3">
              <label
                className={`d-inline-flex align-items-center gap-1 fw-semibold text-uppercase mb-1 ${styles.fieldLabel}`}
                htmlFor="fieldPassword"
              >
                <Lock size={13} strokeWidth={2.2} />
                Password
              </label>
              <Input
                id="fieldPassword"
                name="password"
                type="password"
                placeholder="••••••••"
                value={strPassword}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={blnLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Remember me / Forgot password */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="form-check mb-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={blnRemember}
                  onChange={(e) => setRemember(e.target.checked)}
                  disabled={blnLoading}
                />
                <label
                  className={`form-check-label text-muted ${styles.checkLabel}`}
                  htmlFor="rememberMe"
                >
                  Remember me
                </label>
              </div>

              <button
                type="button"
                className="btn btn-link p-0 fw-bold text-decoration-none"
                onClick={handleForgotPassword}
                disabled={blnLoading}
              >
                Forgot password?
              </button>
            </div>

            {/* Error message */}
            {strError && (
              <div className={`alert alert-danger py-2 mb-3 ${styles.errorAlert}`} role="alert">
                {strError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className={`btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2 fw-semibold ${styles.submitBtn}`}
              disabled={blnLoading}
            >
              {blnLoading ? (
                <>
                  <span
                    className="spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />
                  Logging in...
                </>
              ) : (
                <>
                  <LogIn size={16} strokeWidth={2.2} />
                  LOGIN
                </>
              )}
            </button>

          </Form>
        </div>
      </div>

      {/* Footer */}
      <p className={`text-muted mt-4 ${styles.footer}`}>
        © {new Date().getFullYear()} Department of Science and Technology — Philippines
      </p>

    </div>
  );
}
