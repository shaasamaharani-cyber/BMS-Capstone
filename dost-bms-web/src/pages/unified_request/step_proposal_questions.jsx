/**
 * System Name: Budget Management System
 * Module Name: Core Module
 *
 * Purpose of this file:
 * Step 2 of the unified budget request - a short list of plain-language questions about the proposal. The answers, together
 * with the line items and funding source, let the rules decide which BP forms are required (nothing is searched by hand).
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import { Dropdown } from '../../components/ui';
import { PROPOSAL_QUESTIONS } from '../../bp_forms/bp_form_rules';
import styles from './unified_request.module.css';

const GROUP_ORDER = ['Project', 'People', 'Agency finance', 'Consultations'];

function YesNoToggle({ strValue, onChange, strName }) {
  return (
    <div className={styles.segmented} role="radiogroup" aria-label={strName}>
      {['yes', 'no'].map((strOption) => (
        <button key={strOption} type="button" role="radio" aria-checked={strValue === strOption} className={`${styles.segment} ${strValue === strOption ? styles.segmentOn : ''}`} onClick={() => onChange(strOption)}>
          {strOption === 'yes' ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  );
}

YesNoToggle.propTypes = { strValue: PropTypes.string, onChange: PropTypes.func.isRequired, strName: PropTypes.string.isRequired };

export default function StepProposalQuestions({ objAnswers, objHints, intRequiredCount, onAnswerChange }) {
  return (
    <>
      <section className={styles.banner}>
        <strong>{intRequiredCount} BP forms</strong> are required with your current answers. This count updates as you answer.
        The rules behind each decision are drafts that DOST still has to confirm.
      </section>

      {GROUP_ORDER.map((strGroup) => (
        <section key={strGroup} className={styles.card}>
          <h3 className={styles.cardTitle}>{strGroup}</h3>
          {PROPOSAL_QUESTIONS.filter((objQuestion) => objQuestion.group === strGroup).map((objQuestion) => (
            <div key={objQuestion.key} className={styles.questionRow}>
              <div className={styles.questionText}>
                <span>{objQuestion.label}</span>
                {objHints[objQuestion.key] && <span className={styles.hintText}>{objHints[objQuestion.key]}</span>}
              </div>
              {objQuestion.type === 'yesno' ? (
                <YesNoToggle strValue={objAnswers[objQuestion.key]} onChange={(strValue) => onAnswerChange(objQuestion.key, strValue)} strName={objQuestion.label} />
              ) : (
                <div className={styles.questionSelect}>
                  <Dropdown options={objQuestion.options} value={objAnswers[objQuestion.key]} onChange={(strValue) => onAnswerChange(objQuestion.key, strValue)} placeholder="Select" />
                </div>
              )}
            </div>
          ))}
        </section>
      ))}
    </>
  );
}

StepProposalQuestions.propTypes = {
  objAnswers: PropTypes.object.isRequired,
  objHints: PropTypes.object.isRequired,
  intRequiredCount: PropTypes.number.isRequired,
  onAnswerChange: PropTypes.func.isRequired,
};
