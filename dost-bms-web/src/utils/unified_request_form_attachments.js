import { BP_FORM_CATALOG, getFormById } from '../bp_forms/bp_form_catalog.js';
import { getFormDefinition } from '../bp_forms/bp_form_fields.js';

// The ID survives code changes; matching by code keeps older request attachments readable.
export function signedFromAttachedFiles(arrFiles, arrCatalog = BP_FORM_CATALOG, objFormConfigs = {}) {
  const objSigned = {};
  (arrFiles || []).forEach((objFile) => {
    const arrMatch = String(objFile.name || '').match(/^Signed - (.+?) - (.+)$/);
    if (!arrMatch) return;
    const objForm = getFormById(objFile.formId, arrCatalog) || arrCatalog.find((objCandidate) => objCandidate.code === arrMatch[1]);
    if (objForm) objSigned[objForm.id] = { id: objFile.id, name: arrMatch[2], size: objFile.size, type: objFile.type, lastModified: objFile.lastModified, url: objFile.url, formContent: objFile.formContent, formDefinition: objFile.formDefinition || JSON.stringify(getFormDefinition(objForm.id, { formConfigs: objFormConfigs })) };
  });
  return objSigned;
}
