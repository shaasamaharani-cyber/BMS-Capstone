// These fields contain printed names/designations, never authenticated signatures.
// DOST still needs to assign the institutional certifying/approving offices.
const CERTIFICATION = new Set(['certifiedBy', 'certifiedTitle', 'certifiedBy2', 'certifiedTitle2']);
const APPROVAL = new Set(['approvedBy', 'approvedTitle', 'agencyHead', 'approvalDate']);
export function laterStageOwner(field) {
  if (CERTIFICATION.has(field.key)) return 'certifying office';
  if (APPROVAL.has(field.key)) return 'approving office';
  return null;
}
export const signatoryHelp = 'Typed names and designations identify printed signatories; they do not record a signature, certification or workflow approval. Upload the legitimately signed documents required by your institution.';

export function requesterSignoffChanges(formValues = {}, existingValues = {}) {
  const errors = [];
  const inspect = (values, previousValues, path) => {
    if (!values || typeof values !== 'object') return;
    for (const [key, value] of Object.entries(values)) {
      const owner = laterStageOwner({ key });
      if (!owner) { inspect(value, previousValues?.[key], `${path}.${key}`); continue; }
      const previous = previousValues?.[key];
      if (JSON.stringify(value ?? '') !== JSON.stringify(previous ?? '') && (String(value ?? '').trim() || String(previous ?? '').trim())) errors.push(`${path}.${key} belongs to the ${owner}; requesters cannot change it.`);
    }
  };
  inspect(formValues, existingValues, 'formValues');
  return errors;
}

// A partial draft payload must not erase earlier office metadata. An explicit
// attempted change is rejected by validation before this preservation runs.
export function preserveSignoffValues(values = {}, previous = {}) {
  const next = { ...values };
  for (const [key, value] of Object.entries(previous || {})) {
    if (laterStageOwner({ key }) && !Object.hasOwn(next, key)) next[key] = value;
    else if (value && typeof value === 'object' && !Array.isArray(value)) next[key] = preserveSignoffValues(next[key], value);
  }
  return next;
}
