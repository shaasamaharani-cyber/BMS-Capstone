/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Form entry editor that renders a schema-driven form and saves the completed entry with a generated PDF.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/layout/page_header';
import { createEntry, fetchEntry, fetchSchema, updateEntry } from '../../api/forms_api';
import FormRenderer from '../../forms/components/form_renderer';
import styles from '../../forms/components/flexible_forms.module.css';
import { createBlankEntry, normalizeSchemaRecord, validateFormEntry } from '../../forms/utils/form_object';
import { exportToPdf } from '../../forms/utils/export_pdf';
import { useToast } from '../../components/ui';


export default function EntryPage() {
  const { schemaId, entryId } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [objSchema, setObjSchema] = useState(null);
  const [objEntry, setObjEntry] = useState(null);
  const [blnLoading, setBlnLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setBlnLoading(true);
      const schemaRecord = await fetchSchema(schemaId);
      const normalizedSchema = normalizeSchemaRecord(schemaRecord);
      const nextEntry = entryId
        ? await fetchEntry(entryId)
        : createBlankEntry(normalizedSchema);

      if (!mounted) return;
      setObjSchema(normalizedSchema);
      setObjEntry(nextEntry);
      setBlnLoading(false);
    }

    load().catch(() => {
      if (mounted) setBlnLoading(false);
    });
    return () => { mounted = false; };
  }, [entryId, schemaId]);


  async function handleSave() {
    const validationErrors = validateFormEntry(objSchema, objEntry);
    if (validationErrors.length > 0) {
      showToast({ message: validationErrors[0], type: 'error' });
      return;
    }

    const payload = {
      ...objEntry,
      schemaId: objSchema.id,
      name: String(objEntry.name ?? '').trim(),
      updatedAt: new Date().toISOString(),
    };
    const saved = entryId
      ? await updateEntry(entryId, payload)
      : await createEntry(payload);

    setObjEntry(saved);
    showToast({ message: saved.pdfUrl ? 'Saved and PDF generated.' : 'Form saved successfully.' });

    if (!entryId) navigate(`/forms/${objSchema.id}/entries/${saved.id}`, { replace: true });
  }

  if (blnLoading) return <div className="py-5 text-center text-muted">Loading form...</div>;
  if (!objSchema || !objEntry) return <div className="alert alert-warning">Form not found.</div>;

  return (
    <div>
      <PageHeader title={objSchema.name} subtitle={`Version ${objSchema.version || '-'}`} />

      <div className={`${styles.toolbar} mb-3 no-print`}>
        <div className="d-flex gap-2">
          <Link to="/forms" className="btn btn-outline-secondary">Back</Link>
          <button type="button" className="btn btn-outline-primary" onClick={() => exportToPdf('form-print-area')}>
            Print / PDF
          </button>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => handleSave()}>
          Save
        </button>
      </div>

      <div id="form-print-area" className="print-area">
        <div className="print-only mb-3">
          <h1 className="h4 mb-1">{objSchema.name}</h1>
          <div className="text-muted">Version {objSchema.version || '-'}</div>
        </div>
        <FormRenderer schema={objSchema} entry={objEntry} setEntry={setObjEntry} />
      </div>
    </div>
  );
}
