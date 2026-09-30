/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Collapsible tree-timeline that renders hierarchical audit events with status dots and nested children.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useState } from 'react';
import PropTypes from 'prop-types';
import styles from './tree_timeline.module.css';

function TimelineNode({ event, expandable, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const hasChildren = event.children && event.children.length > 0;

  return (
    <div className={styles.nodeWrapper}>
      <div className={styles.timelineArea}>
        <div className={`${styles.dot} ${styles[event.status || 'pending']}`} />
        {!isLast && <div className={styles.line} />}
      </div>
      
      <div className={styles.contentArea}>
        <div className={styles.header} onClick={() => expandable && hasChildren && setExpanded(!expanded)}>
          <div className={styles.dateActorGroup}>
             <span className={styles.date}>{event.date}</span>
             {event.actor && <span className={styles.actor}> • {event.actor}</span>}
          </div>
          <div className={styles.titleGroup}>
            <span className={styles.title}>{event.title}</span>
            {expandable && hasChildren && (
              <span className={styles.expander}>{expanded ? '▼' : '►'}</span>
            )}
          </div>
        </div>
        
        {event.description && <div className={styles.description}>{event.description}</div>}
        
        {hasChildren && (
          <div className={`${styles.children} ${expanded || !expandable ? styles.expanded : ''}`}>
            <TreeTimeline events={event.children} expandable={expandable} isNested={true} />
          </div>
        )}
      </div>
    </div>
  );
}

TimelineNode.propTypes = {
  event: PropTypes.object.isRequired,
  expandable: PropTypes.bool.isRequired,
  isLast: PropTypes.bool.isRequired,
  depth: PropTypes.number
};

export default function TreeTimeline({ events, expandable = false, isNested = false }) {
  return (
    <div className={`${styles.container} ${isNested ? styles.nestedContainer : ''}`}>
      {events.map((evt, idx) => (
        <TimelineNode 
          key={evt.id || idx} 
          event={evt} 
          expandable={expandable} 
          isLast={idx === events.length - 1}
        />
      ))}
    </div>
  );
}

TreeTimeline.propTypes = {
  events: PropTypes.array.isRequired,
  expandable: PropTypes.bool,
  isNested: PropTypes.bool
};
