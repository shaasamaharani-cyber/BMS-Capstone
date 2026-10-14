// Stable IDs and stored values are shared by the questionnaire, administrator and API.
export const YES_NO_OPTIONS = [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }];
export const FUNDING_SOURCE_OPTIONS = [
  { value: 'national_government', label: 'National Government' },
  { value: 'foreign_grant', label: 'Foreign Grant' },
  { value: 'foreign_loan', label: 'Foreign Loan' },
  { value: 'other', label: 'Other' },
];
export const TIER_OPTIONS = [
  { value: 'tier1', label: 'Tier 1 - current requirements' },
  { value: 'tier2', label: 'Tier 2 - new or expanded proposal' },
];
export const PROPOSAL_QUESTIONS = [
  { key: 'proposalTier', group: 'Project', label: 'Which budget tier is this proposal?', type: 'select', options: TIER_OPTIONS },
  { key: 'fundingSource', source: 'common', group: 'Project', label: 'What is the funding source for this proposal?', type: 'select', options: FUNDING_SOURCE_OPTIONS },
  { key: 'hasOutyear', group: 'Project', label: 'Does this proposal have outyear funding requirements?', type: 'yesno' },
  { key: 'hasFinEx', group: 'Project', label: 'Does this proposal include financial expenses (FinEx)?', type: 'yesno' },
  { key: 'isPcb', group: 'Project', label: 'Is this proposal part of an approved Program Convergence Budgeting arrangement?', type: 'yesno' },
  { key: 'hasClimate', group: 'Project', label: 'Does this proposal contain climate change adaptation or mitigation expenditure?', type: 'yesno' },
  { key: 'hasNonPermanent', group: 'People', label: 'Does this proposal need non-permanent positions?', type: 'yesno' },
  { key: 'hasRetirement', group: 'People', label: 'Does the agency have retirement requirements?', type: 'yesno' },
  { key: 'hasEarmarked', group: 'Agency finance', label: 'Does the agency have earmarked revenues?', type: 'yesno' },
  { key: 'hasOtherReceipts', group: 'Agency finance', label: 'Does the agency have other receipts or expenditures to report?', type: 'yesno' },
  { key: 'hasDonations', group: 'Agency finance', label: 'Does the agency receive donations or grants?', type: 'yesno' },
  { key: 'hasProvisions', group: 'Agency finance', label: 'Does the agency propose new, amended or deleted provisions?', type: 'yesno' },
  { key: 'hasRdcInputs', group: 'Consultations', label: 'Are there Regional Development Council (RDC) inputs or recommendations?', type: 'yesno' },
  { key: 'hasCsoInputs', group: 'Consultations', label: 'Are there Civil Society Organisation (CSO) inputs?', type: 'yesno' },
].map((question) => ({ ...question, id: question.key, source: question.source || 'answers', options: question.options || YES_NO_OPTIONS }));

export function getQuestionAnswer(question, context = {}) {
  return context[question.source]?.[question.id];
}
