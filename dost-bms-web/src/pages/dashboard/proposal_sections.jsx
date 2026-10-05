/**
 * System Name: Budget Management System
 * Module Name: Dashboard
 *
 * Purpose of this file:
 * Shared dashboard labels taken word for word from "BMS Financial Dashboard by User Role - Proposal (Draft v2)":
 * the eight section names with their status, a sample-data note and a "figures as of" stamp.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import styles from './proposal_sections.module.css';

const PROPOSAL_SECTIONS = {
  overview:   { title: 'Financial Overview',                status: 'Retained and combined' },
  monitoring: { title: 'Spending Monitoring',               status: 'New (DOST requirement)' },
  alerts:     { title: 'Alerts',                            status: 'Retained and expanded' },
  forecast:   { title: 'Forecast and Next-Cycle Planning',  status: 'Combined' },
  drilldown:  { title: 'Breakdown and Drill-Down',          status: 'Retained and expanded' },
  calendar:   { title: 'Budget Calendar and Stage Tracker', status: 'New (team suggestion)' },
  activity:   { title: 'Activity History',                  status: 'Retained and clarified' },
  reports:    { title: 'Reports and Briefing Sheets',       status: 'New (DOST requirement), plus a team suggestion' },
};

// Phase 1 presentation aid: shows which proposal section a panel belongs to. Set to false before real users see the system.
const SHOW_PROPOSAL_STATUS = true;

export function ProposalTag({ section })
{
  const objSection = PROPOSAL_SECTIONS[section];
  if (!SHOW_PROPOSAL_STATUS || !objSection) return null;
  return (
    <span className={styles.tag} title="Section and status from the dashboard proposal (Draft v2)">
      {objSection.title} · {objSection.status}
    </span>
  );
}

ProposalTag.propTypes = { section: PropTypes.oneOf(Object.keys(PROPOSAL_SECTIONS)).isRequired };

export function SampleDataNote({ children })
{
  return <p className={styles.sampleNote}><strong>Sample data (Phase 1).</strong> {children}</p>;
}

SampleDataNote.propTypes = { children: PropTypes.node };

export function FiguresAsOf({ asOf, source })
{
  return <p className={styles.asOf}>Figures as of {asOf} · Source: {source}</p>;
}

FiguresAsOf.propTypes = { asOf: PropTypes.string.isRequired, source: PropTypes.string.isRequired };
