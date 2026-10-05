/**
 * System Name: Budget Management System
 * Module Name: Dashboard Module
 *
 * Purpose of this file:
 * Administrator dashboard cards with no peso amounts: cycle setup status, users, the alert
 * thresholds in use and recent activity. The technical administrator sees only these; the
 * main administrator sees cycle setup and users above the directors' view.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/page_header';
import { fetchAllSchemas, getBudgetRequests, getFiscalYears, getUsers } from '../../api';
import { extractApiRows } from '../../utils/budget_request_utils';
import { formatTimestamp, toTitleCase } from '../../utils/formatters';
import { ActivityTable } from './central_office_work';
import { ATTENTION_BELOW, DUE_SOON_DAYS, loadRecentActivity, sortByUpdated } from './dashboard_helpers';
import { ProposalTag } from './proposal_sections';
import styles from './requester_dashboard.module.css';

const RECENT_ACTIVITY_COUNT = 10;

// Cycle setup (DOST written answers 2, 5, 7) and users. No amounts.
export function AdminSetupCards() {
  const [arrSchemas, setArrSchemas] = useState([]);
  const [arrYears, setArrYears] = useState([]);
  const [arrUsers, setArrUsers] = useState([]);
  const [blnLoading, setBlnLoading] = useState(true);
  const [blnFailed, setBlnFailed] = useState(false);

  useEffect(() => {
    let blnMounted = true;
    Promise.all([fetchAllSchemas(), getFiscalYears(), getUsers(1, 100)])
      .then(([arrFormSchemas, objYears, objUsers]) => {
        if (!blnMounted) return;
        setArrSchemas(arrFormSchemas);
        setArrYears(extractApiRows(objYears));
        setArrUsers(extractApiRows(objUsers));
      })
      .catch(() => { if (blnMounted) setBlnFailed(true); })
      .finally(() => { if (blnMounted) setBlnLoading(false); });
    return () => { blnMounted = false; };
  }, []);

  const strLastChanged = arrSchemas.map((objSchema) => objSchema.updatedAt).filter(Boolean).sort().pop();
  const arrActiveYears = arrYears.filter((objYear) => Number(objYear.fy_is_active) === 1).map((objYear) => objYear.fy_year);
  const objRoleCounts = arrUsers.reduce((objCounts, objUser) => {
    const strRole = toTitleCase(objUser.role?.role_name || 'No role');
    const objRow = objCounts[strRole] || { intActive: 0, intInactive: 0 };
    if (Number(objUser.usr_is_active) === 1) objRow.intActive += 1; else objRow.intInactive += 1;
    return { ...objCounts, [strRole]: objRow };
  }, {});

  return (
    <div className={`dashboard-page ${styles.page}`}>
      {blnFailed && <div className={styles.errorBanner}>Cannot perform transaction. Error encountered.</div>}

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Cycle setup status</h3>
        {blnLoading && <p className={styles.muted}>Loading...</p>}
        {!blnLoading && (
          <>
            <div className={styles.amounts}>
              <div className={styles.amount}>
                <span className={styles.amountLabel}>BP form templates</span>
                <span className={styles.amountValue}>{arrSchemas.length}</span>
                <span className={styles.muted}>{strLastChanged ? `Last changed ${formatTimestamp(strLastChanged)}` : 'Not changed yet'}</span>
              </div>
              <div className={styles.amount}>
                <span className={styles.amountLabel}>Active fiscal years</span>
                <span className={styles.amountValue}>{arrActiveYears.length > 0 ? arrActiveYears.join(', ') : 'None'}</span>
              </div>
            </div>
            <div className={styles.linkRow}><Link to="/forms">Open the Forms module</Link></div>
          </>
        )}
        <p className={styles.footnote}>
          DOST said administrators set which forms and supporting documents are required for each budget cycle (written answers 2, 5, 7).
          That per-cycle setting is not built yet.
        </p>
      </section>

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Users</h3>
        <table className={styles.table}>
          <thead><tr><th>Role</th><th className={styles.numeric}>Active</th><th className={styles.numeric}>Inactive</th></tr></thead>
          <tbody>
            {Object.entries(objRoleCounts).map(([strRole, objRow]) => (
              <tr key={strRole}><td>{strRole}</td><td className={styles.numeric}>{objRow.intActive}</td><td className={styles.numeric}>{objRow.intInactive}</td></tr>
            ))}
            {!blnLoading && arrUsers.length === 0 && <tr><td colSpan={3} className={styles.muted}>No users found.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export default function TechAdminDashboard() {
  const [arrActivity, setArrActivity] = useState([]);
  const [blnLoading, setBlnLoading] = useState(true);
  const [blnFailed, setBlnFailed] = useState(false);

  useEffect(() => {
    let blnMounted = true;
    getBudgetRequests({ per_page: 100 })
      .then((objRequests) => loadRecentActivity(sortByUpdated(extractApiRows(objRequests)).slice(0, RECENT_ACTIVITY_COUNT), RECENT_ACTIVITY_COUNT))
      .then((arrLogs) => { if (blnMounted) setArrActivity(arrLogs); })
      .catch(() => { if (blnMounted) setBlnFailed(true); })
      .finally(() => { if (blnMounted) setBlnLoading(false); });
    return () => { blnMounted = false; };
  }, []);

  return (
    <div className={`dashboard-page ${styles.page}`}>
      <PageHeader title="System Dashboard" />
      <AdminSetupCards />

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Alert thresholds <ProposalTag section="alerts" /></h3>
        <table className={styles.table}>
          <thead><tr><th>Rule</th><th>Value in use</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Flag a unit or class whose committed rate is below</td><td>{ATTENTION_BELOW}%</td><td>Awaiting DOST</td></tr>
            <tr><td>Flag a spending report as due soon within</td><td>{DUE_SOON_DAYS} days</td><td>Awaiting DOST</td></tr>
            <tr><td>Require a justification when obligations exceed the allotment</td><td>Any amount over</td><td>Awaiting DOST</td></tr>
          </tbody>
        </table>
        <p className={styles.footnote}>View only. These become editable here once DOST confirms its thresholds.</p>
      </section>

      <section className={`dashboard-panel ${styles.card}`}>
        <h3 className={`dashboard-section__title ${styles.cardTitle}`}>Activity History <ProposalTag section="activity" /></h3>
        {blnFailed && <div className={styles.errorBanner}>Cannot perform transaction. Error encountered.</div>}
        <ActivityTable arrActivity={arrActivity} blnLoading={blnLoading} />
      </section>
    </div>
  );
}
