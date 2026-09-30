/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Tab panel for managing attached form entries and supporting file uploads on a budget request or consolidation.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useRef } from 'react';
import PropTypes from 'prop-types';
import { BsCloudUpload, BsFileEarmarkText } from 'react-icons/bs';
import { Button, Dropdown } from '../ui';
import AttachmentPreview from '../shared/attachment_preview';
import { formatAttachmentFileSize, getGeneratedFileUrl } from '../../utils/attachments';

export default function BudgetRequestAttachedFormsTab({
  canEdit = true,
  title = 'Attached Forms',
  attachmentMode,
  showFormPicker = true,
  showFilePicker = false,
  formSchemaOptions = [],
  formEntryOptions = [],
  selectedFormSchemaId = '',
  selectedFormEntryId = '',
  onSelectedFormSchemaChange = () => {},
  onSelectedFormEntryChange = () => {},
  onAttachForm = () => {},
  onDetachForm = () => {},
  attachedForms = [],
  attachedFiles = [],
  onAttachFiles = () => {},
  onDetachFile = () => {},
  renderFilePreview,
  formatFileSize = formatAttachmentFileSize,
}) {
  const fileInputRef = useRef(null);
  const resolvedShowFormPicker = attachmentMode
    ? ['forms', 'both'].includes(attachmentMode)
    : showFormPicker;
  const resolvedShowFilePicker = attachmentMode
    ? ['files', 'both'].includes(attachmentMode)
    : showFilePicker;
  const safeAttachedForms = Array.isArray(attachedForms) ? attachedForms : [];
  const safeAttachedFiles = Array.isArray(attachedFiles) ? attachedFiles : [];
  const hasForms = safeAttachedForms.length > 0;
  const hasFiles = safeAttachedFiles.length > 0;

  return (
    <div className="p-4">
      <div className="card border rounded-3 p-4">
        <FormHeader title={title} />

        {canEdit && resolvedShowFormPicker ? (
          <>
            <div className="row g-2">
              <div className="col-12 col-md-6">
                <Dropdown
                  className="w-100"
                  options={formSchemaOptions}
                  value={selectedFormSchemaId}
                  onChange={onSelectedFormSchemaChange}
                  placeholder="Select form type"
                  disabled={!canEdit}
                />
              </div>
              <div className="col-12 col-md-6">
                <Dropdown
                  className="w-100"
                  options={formEntryOptions}
                  value={selectedFormEntryId}
                  onChange={onSelectedFormEntryChange}
                  placeholder="Select created form"
                  disabled={!canEdit || !selectedFormSchemaId}
                />
              </div>
            </div>
            <div className="d-flex align-items-center gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onAttachForm}
                disabled={!canEdit || !selectedFormSchemaId || !selectedFormEntryId}
              >
                Add Form
              </Button>
              <span className="text-muted small">Choose from entries created on the Forms page.</span>
            </div>
          </>
        ) : null}

        {canEdit && resolvedShowFilePicker ? (
          <div className="d-flex align-items-center gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              leftIcon={<BsCloudUpload />}
              onClick={() => fileInputRef.current?.click()}
            >
              Add File
            </Button>
            <span className="text-muted small">Choose supporting documents from your device.</span>
            <input
              ref={fileInputRef}
              type="file"
              className="visually-hidden"
              multiple
              onChange={onAttachFiles}
            />
          </div>
        ) : null}

        {hasForms ? (
          <div className="d-flex flex-column gap-2 mt-3">
            {safeAttachedForms.map((form) => (
              <div key={`${form.schemaId}:${form.entryId}`} className="border rounded-3 px-3 py-2">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <div>
                    <div className="fw-semibold">{form.schemaName || form.schemaId}</div>
                    <div className="text-muted small">
                      {form.entryLabel || form.entryId}
                      {form.pdfGeneratedAt ? (
                        <span className="ms-2">PDF saved {new Date(form.pdfGeneratedAt).toLocaleString()}</span>
                      ) : null}
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {form.pdfUrl ? (
                      <a
                        className="btn btn-sm btn-outline-primary"
                        href={getGeneratedFileUrl(form.pdfUrl)}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open PDF
                      </a>
                    ) : (
                      <span className="text-muted small">Save form to generate PDF</span>
                    )}
                    {canEdit ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDetachForm(form.entryId)}
                      >
                        Remove
                      </Button>
                    ) : null}
                  </div>
                </div>
                {form.pdfUrl ? (
                  <iframe
                    className="w-100 border rounded-2 mt-2"
                    src={getGeneratedFileUrl(form.pdfUrl)}
                    title={`${form.schemaName || form.schemaId} preview`}
                    style={{ height: 420 }}
                  />
                ) : null}
              </div>
            ))}
          </div>
        ) : resolvedShowFormPicker ? (
          <div className="text-muted small mt-2">No forms attached.</div>
        ) : null}

        {hasFiles ? (
          <div className="d-flex flex-column gap-2 mt-3">
            {safeAttachedFiles.map((file) => (
              <div key={file.id} className="border rounded-3 px-3 py-2">
                <div className="d-flex align-items-center justify-content-between gap-2">
                  <div className="d-flex align-items-center gap-2 min-w-0">
                    <BsFileEarmarkText className="text-muted flex-shrink-0" />
                    <div className="min-w-0">
                      <div className="fw-semibold text-truncate">{file.name}</div>
                      <div className="text-muted small">
                        {formatFileSize(file.size)}
                        {file.type && file.type !== 'File' ? (
                          <span className="ms-2">{file.type}</span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  {canEdit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDetachFile(file.id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
                {renderFilePreview ? renderFilePreview(file) : <AttachmentPreview file={file} />}
              </div>
            ))}
          </div>
        ) : resolvedShowFilePicker ? (
          <div className="text-muted small mt-2">No files attached.</div>
        ) : null}
      </div>
    </div>
  );
}

function FormHeader({ title }) {
  return (
    <div className="d-flex justify-content-between align-items-center mb-3">
      <span className="fw-bold text-uppercase section-eyebrow">{title}</span>
    </div>
  );
}

FormHeader.propTypes = {
  title: PropTypes.string.isRequired,
};

BudgetRequestAttachedFormsTab.propTypes = {
  canEdit: PropTypes.bool,
  title: PropTypes.string,
  attachmentMode: PropTypes.oneOf(['forms', 'files', 'both']),
  showFormPicker: PropTypes.bool,
  showFilePicker: PropTypes.bool,
  formSchemaOptions: PropTypes.arrayOf(PropTypes.object),
  formEntryOptions: PropTypes.arrayOf(PropTypes.object),
  selectedFormSchemaId: PropTypes.string,
  selectedFormEntryId: PropTypes.string,
  onSelectedFormSchemaChange: PropTypes.func,
  onSelectedFormEntryChange: PropTypes.func,
  onAttachForm: PropTypes.func,
  onDetachForm: PropTypes.func,
  attachedForms: PropTypes.arrayOf(PropTypes.object),
  attachedFiles: PropTypes.arrayOf(PropTypes.object),
  onAttachFiles: PropTypes.func,
  onDetachFile: PropTypes.func,
  renderFilePreview: PropTypes.func,
  formatFileSize: PropTypes.func,
};

BudgetRequestAttachedFormsTab.defaultProps = {
  canEdit: true,
  title: 'Attached Forms',
  attachmentMode: undefined,
  showFormPicker: true,
  showFilePicker: false,
  formSchemaOptions: [],
  formEntryOptions: [],
  selectedFormSchemaId: '',
  selectedFormEntryId: '',
  onSelectedFormSchemaChange: () => {},
  onSelectedFormEntryChange: () => {},
  onAttachForm: () => {},
  onDetachForm: () => {},
  attachedForms: [],
  attachedFiles: [],
  onAttachFiles: () => {},
  onDetachFile: () => {},
  renderFilePreview: undefined,
  formatFileSize: formatAttachmentFileSize,
};
