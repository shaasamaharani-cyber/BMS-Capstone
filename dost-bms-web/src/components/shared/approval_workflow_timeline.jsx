/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Step-by-step approval workflow timeline showing actor name, timestamp, and status for each review stage.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import { BsCheck, BsClock, BsLock, BsXCircleFill } from 'react-icons/bs';
import { getWorkflowStatusClass } from '../../utils/budget_request_workflow_utils';

const stepPropType = PropTypes.shape({
  title: PropTypes.string.isRequired,
  status: PropTypes.oneOf(['done', 'current', 'locked', 'rejected']).isRequired,
  statusText: PropTypes.string,
  actionAt: PropTypes.string,
  actorName: PropTypes.string,
  actorRole: PropTypes.string,
});

function nodeClass(status) {
  if (status === 'done') return 'workflow-node-done';
  if (status === 'current') return 'workflow-node-current';
  if (status === 'rejected') return 'workflow-node-rejected';
  return 'workflow-node-locked';
}

function connectorClass(status) {
  return status === 'done' ? 'workflow-connector-done' : 'workflow-connector-locked';
}

function StepIcon({ status }) {
  if (status === 'done') return <BsCheck className="text-white icon-xs" />;
  if (status === 'current') return <BsClock className="text-white icon-xs" />;
  if (status === 'rejected') return <BsXCircleFill className="text-white icon-xs" />;
  return <BsLock className="text-muted icon-xs" />;
}

function StepMeta({ step }) {
  const strAction = String(step.statusText || '').trim();
  const strActorName = String(step.actorName || '').trim();
  const blnActorNamedInAction = strActorName.length > 0
    && strAction.toLowerCase().includes(strActorName.toLowerCase());
  const blnActorRoleMatchesTitle = step.actorRole
    && String(step.actorRole).trim().toLowerCase() === String(step.title || '').trim().toLowerCase();

  const showTimestamp = step.actionAt && step.status !== 'current' && step.status !== 'locked';

  return (
    <>
      {strAction ? (
        <p className={`mb-0 fw-semibold workflow-status ${getWorkflowStatusClass(strAction)}`}>
          {strAction}
        </p>
      ) : null}
      {showTimestamp ? (
        <p className="text-muted mb-0 workflow-meta">{step.actionAt}</p>
      ) : null}
      {(step.actorRole && !blnActorRoleMatchesTitle && !blnActorNamedInAction) ? (
        <p className="text-muted mb-0 workflow-actor">
          {step.actorRole}
        </p>
      ) : null}
    </>
  );
}

function VerticalTimeline({ steps }) {
  return (
    <>
      {steps.map((step, index) => (
        <div key={`${String(step.title)}-${index}`} className="d-flex align-items-start gap-3">
          <div className="workflow-stack">
            <div className={`workflow-node ${nodeClass(step.status)}`}>
              <StepIcon status={step.status} />
            </div>
            {index < steps.length - 1 ? (
              <div className={`workflow-connector ${connectorClass(step.status)}`} />
            ) : null}
          </div>
          <div className="mb-3">
            <p className="mb-0 fw-semibold workflow-title">{step.title}</p>
            <StepMeta step={step} />
          </div>
        </div>
      ))}
    </>
  );
}

function HorizontalTimeline({ steps }) {
  return (
    <div className="workflow-h-container">
      {steps.map((step, index) => (
        <div
          key={`${String(step.title)}-${index}`}
          className={`workflow-h-item${step.status === 'rejected' ? ' workflow-h-item-rejected' : ''}`}
        >
          <div className="workflow-h-track">
            <div className={`workflow-h-line ${index === 0 ? 'workflow-h-line-invisible' : connectorClass(steps[index - 1].status)}`} />
            <div className={`workflow-node ${nodeClass(step.status)}`}>
              <StepIcon status={step.status} />
            </div>
            <div className={`workflow-h-line ${index === steps.length - 1 ? 'workflow-h-line-invisible' : connectorClass(step.status)}`} />
          </div>
          <div className="workflow-h-label">
            <p className="mb-0 fw-semibold workflow-title">{step.title}</p>
            <StepMeta step={step} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ReviewWorkflowTimeline({ steps }) {
  return <VerticalTimeline steps={steps} />;
}

ReviewWorkflowTimeline.propTypes = {
  steps: PropTypes.arrayOf(stepPropType).isRequired,
};

export default function ApprovalWorkflowTimeline({ steps }) {
  return <HorizontalTimeline steps={steps} />;
}

ApprovalWorkflowTimeline.propTypes = {
  steps: PropTypes.arrayOf(stepPropType).isRequired,
};
