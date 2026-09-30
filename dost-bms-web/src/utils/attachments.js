/**
 * System Name: Budget Management System
 * Module Name: Utilities Module
 *
 * Purpose of this file:
 * Provide helper functions and utility methods for attachments.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

export function getAttachmentPreviewUrl(file = {}) {
  // Prefer a local blob/object URL or a pre-rendered data URL — these don't
  // require a server round-trip and are not subject to auth restrictions.
  if (file.previewUrl) return file.previewUrl;
  if (file.dataUrl) return file.dataUrl;

  const directUrl = file.url || file.fileUrl || '';

  if (directUrl) {
    try {
      const parsed = new URL(directUrl, window.location.origin);
      const apiOrigin = new URL(import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').origin;

      // Re-host any /generated/* path under the configured API origin so that
      // requests always go to the correct server regardless of what host:port
      // the URL was originally stored with.  This covers all sub-directories:
      //   /generated/attachments/      — file attachments
      //   /generated/forms/            — form-entry PDFs
      //   /generated/budget-request-versions/   — version snapshot PDFs
      //   /generated/unified-budget-versions/   — unified budget PDFs
      if (parsed.pathname.startsWith('/generated/')) {
        return `${apiOrigin}${parsed.pathname}`;
      }
    } catch {
      // Fall through to the original URL.
    }

    return directUrl;
  }

  return '';
}

/**
 * Rewrite any URL whose pathname starts with /generated/ so that it always
 * resolves against the configured API origin (VITE_API_URL).  Use this for
 * pdfUrl / version snapshot URLs that are rendered directly in <a href> or
 * <iframe src> elements (i.e. not via getAttachmentPreviewUrl).
 *
 * Returns the original value unchanged if it is empty or cannot be parsed.
 */
export function getGeneratedFileUrl(url = '') {
  if (!url) return url;
  try {
    const parsed = new URL(url, window.location.origin);
    const apiOrigin = new URL(import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1').origin;
    if (parsed.pathname.startsWith('/generated/')) {
      return `${apiOrigin}${parsed.pathname}`;
    }
  } catch {
    // Return original on parse error.
  }
  return url;
}

export function formatAttachmentFileSize(size) {
  const bytes = Number(size);

  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 KB';
  }

  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
