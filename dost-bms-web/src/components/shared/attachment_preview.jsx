/**
 * System Name: Budget Management System
 * Module Name: Components Module
 *
 * Purpose of this file:
 * Inline file preview component that renders images directly and PDFs in an iframe based on MIME type.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import PropTypes from 'prop-types';
import { getAttachmentPreviewUrl } from '../../utils/attachments';

export default function AttachmentPreview({ file }) {
  const type = String(file?.type || '').toLowerCase();
  const name = String(file?.name || 'File');
  const previewUrl = getAttachmentPreviewUrl(file);

  if (type.startsWith('image/')) {
    return (
      <div className="border rounded-2 mt-2 bg-light overflow-hidden">
        <img
          src={previewUrl}
          alt={`${name} preview`}
          className="w-100 d-block"
          style={{ maxHeight: 420, objectFit: 'contain' }}
        />
      </div>
    );
  }

  if (type === 'application/pdf' || name.toLowerCase().endsWith('.pdf')) {
    return (
      <iframe
        className="w-100 border rounded-2 mt-2"
        src={previewUrl}
        title={`${name} preview`}
        style={{ height: 420 }}
      />
    );
  }

  return (
    <div className="border rounded-2 mt-2 p-4 text-center text-muted small bg-light">
      Preview is not available for this file type.
    </div>
  );
}

AttachmentPreview.propTypes = {
  file: PropTypes.object,
};

AttachmentPreview.defaultProps = {
  file: {},
};
