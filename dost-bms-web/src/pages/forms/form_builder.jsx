/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Schema-driven form builder that lets administrators create and edit flexible form schemas with a live preview.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/layout/page_header';
import FormRenderer from '../../forms/components/form_renderer';
import styles from '../../forms/components/flexible_forms.module.css';
import { createSchema, updateSchema } from '../../api/forms_api';
import { createBlankEntry, deepGet, deepSet, emptySchema, toSchemaRecord } from '../../forms/utils/form_object';
import { parseTextList, textList } from '../../utils/helpers';

function StructureTree({ objSchema, objSelected, onSelect }) {
  const activePath = objSelected?.path?.join('.');
  const itemClass = (path) => `${styles.treeButton} ${activePath === path.join('.') ? styles.treeButtonActive : ''}`;

  return (
    <div>
      <button type="button" className={itemClass([])} onClick={() => onSelect({ type: 'schema', path: [] })}>
        Form: {objSchema.name}
      </button>
      <div className="mt-3 fw-bold small text-muted">Header Fields</div>
      {objSchema.headerFields.map((field, index) => {
        const path = ['headerFields', index];
        return (
          <button key={field.key} type="button" className={itemClass(path)} onClick={() => onSelect({ type: 'headerField', path })}>
            {field.label}
          </button>
        );
      })}
      <div className="mt-3 fw-bold small text-muted">Sections</div>
      {objSchema.sections.map((section, sectionIndex) => {
        const sectionPath = ['sections', sectionIndex];
        return (
          <div key={section.id}>
            <button type="button" className={itemClass(sectionPath)} onClick={() => onSelect({ type: 'section', path: sectionPath })}>
              {section.title}
            </button>
            {section.table?.columns?.map((column, columnIndex) => {
              const path = [...sectionPath, 'table', 'columns', columnIndex];
              return (
                <button key={column.key} type="button" className={itemClass(path)} style={{ paddingLeft: 18 }} onClick={() => onSelect({ type: 'column', path })}>
                  Column: {column.label}
                </button>
              );
            })}
            {section.tabs?.map((tab, tabIndex) => {
              const tabPath = [...sectionPath, 'tabs', tabIndex];
              return (
                <div key={tab.id}>
                  <button type="button" className={itemClass(tabPath)} style={{ paddingLeft: 18 }} onClick={() => onSelect({ type: 'tab', path: tabPath })}>
                    Tab: {tab.label}
                  </button>
                  {tab.table?.columns?.map((column, columnIndex) => {
                    const path = [...tabPath, 'table', 'columns', columnIndex];
                    return (
                      <button key={column.key} type="button" className={itemClass(path)} style={{ paddingLeft: 34 }} onClick={() => onSelect({ type: 'column', path })}>
                        Column: {column.label}
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function SettingsPanel({ objSchema, objSelected, applyPatch }) {
  const target = objSelected ? deepGet(objSchema, objSelected.path) : objSchema;
  if (!target) return <div className="text-muted">Select a node to edit.</div>;

  const patch = (key, value) => applyPatch(objSelected?.path || [], { [key]: value });

  if (!objSelected || objSelected.type === 'schema') {
    return (
      <div className="d-grid gap-3">
        <label>
          <span className={styles.fieldLabel}>ID</span>
          <input className="form-control" value={objSchema.id} onChange={(event) => patch('id', event.target.value)} />
        </label>
        <label>
          <span className={styles.fieldLabel}>Name</span>
          <input className="form-control" value={objSchema.name} onChange={(event) => patch('name', event.target.value)} />
        </label>
        <label>
          <span className={styles.fieldLabel}>Version</span>
          <input className="form-control" value={objSchema.version || ''} onChange={(event) => patch('version', event.target.value)} />
        </label>
      </div>
    );
  }

  if (objSelected.type === 'headerField') {
    return (
      <div className="d-grid gap-3">
        <label><span className={styles.fieldLabel}>Key</span><input className="form-control" value={target.key} onChange={(event) => patch('key', event.target.value)} /></label>
        <label><span className={styles.fieldLabel}>Label</span><input className="form-control" value={target.label} onChange={(event) => patch('label', event.target.value)} /></label>
        <label><span className={styles.fieldLabel}>Type</span><select className="form-select" value={target.type} onChange={(event) => patch('type', event.target.value)}><option>text</option><option>select</option><option>date</option><option>readonly</option></select></label>
        <label><span className={styles.fieldLabel}>Span</span><input className="form-control" type="number" value={target.span || 1} onChange={(event) => patch('span', Number(event.target.value))} /></label>
        {target.type === 'select' ? <label><span className={styles.fieldLabel}>Options</span><input className="form-control" value={textList(target.options)} onChange={(event) => patch('options', parseTextList(event.target.value))} /></label> : null}
      </div>
    );
  }

  if (objSelected.type === 'section') {
    return (
      <div className="d-grid gap-3">
        <label><span className={styles.fieldLabel}>ID</span><input className="form-control" value={target.id} onChange={(event) => patch('id', event.target.value)} /></label>
        <label><span className={styles.fieldLabel}>Title</span><input className="form-control" value={target.title} onChange={(event) => patch('title', event.target.value)} /></label>
        <label className="form-check"><input className="form-check-input" type="checkbox" checked={Boolean(target.collapsible)} onChange={(event) => patch('collapsible', event.target.checked)} /> Collapsible</label>
      </div>
    );
  }

  if (objSelected.type === 'tab') {
    return (
      <div className="d-grid gap-3">
        <label><span className={styles.fieldLabel}>ID</span><input className="form-control" value={target.id} onChange={(event) => patch('id', event.target.value)} /></label>
        <label><span className={styles.fieldLabel}>Label</span><input className="form-control" value={target.label} onChange={(event) => patch('label', event.target.value)} /></label>
      </div>
    );
  }

  return (
    <div className="d-grid gap-3">
      <label><span className={styles.fieldLabel}>Key</span><input className="form-control" value={target.key} onChange={(event) => patch('key', event.target.value)} /></label>
      <label><span className={styles.fieldLabel}>Label</span><input className="form-control" value={target.label} onChange={(event) => patch('label', event.target.value)} /></label>
      <label><span className={styles.fieldLabel}>Type</span><select className="form-select" value={target.type} onChange={(event) => patch('type', event.target.value)}><option>text</option><option>number</option><option>select</option><option>textarea</option><option>date</option><option>computed</option><option>label</option></select></label>
      {target.type === 'computed' ? <label><span className={styles.fieldLabel}>Formula</span><input className="form-control" value={target.formula || ''} onChange={(event) => patch('formula', event.target.value)} /></label> : null}
      {target.type === 'select' ? <label><span className={styles.fieldLabel}>Options</span><input className="form-control" value={textList(target.options)} onChange={(event) => patch('options', parseTextList(event.target.value))} /></label> : null}
      <label><span className={styles.fieldLabel}>Group</span><input className="form-control" value={target.group || ''} onChange={(event) => patch('group', event.target.value)} /></label>
    </div>
  );
}

export default function FormBuilder() {
  const [objSchema, setObjSchema] = useState(emptySchema());
  const [objSelected, setObjSelected] = useState({ type: 'schema', path: [] });
  const [strMessage, setStrMessage] = useState('');
  const previewEntry = useMemo(() => createBlankEntry(objSchema), [objSchema]);
  const [objEntry, setObjEntry] = useState(previewEntry);

  function applyPatch(path, patch) {
    setObjSchema((prev) => deepSet(prev, path, { ...deepGet(prev, path), ...patch }));
    setObjEntry(createBlankEntry(objSchema));
  }

  async function handleSave() {
    const record = toSchemaRecord(objSchema);
    try {
      await updateSchema(objSchema.id, record);
    } catch {
      await createSchema(record);
    }
    setStrMessage('Schema saved');
  }

  return (
    <div>
      <PageHeader title="Form Builder" subtitle="Edit schema structure and preview the result." />
      <div className="d-flex gap-2 mb-3 no-print">
        <Link className="btn btn-outline-secondary" to="/forms">Back</Link>
        <button type="button" className="btn btn-primary" onClick={handleSave}>Save Schema</button>
        <span className="align-self-center small text-muted">{strMessage}</span>
      </div>
      <div className={styles.builder}>
        <aside className={styles.panel}>
          <h6>Structure</h6>
          <StructureTree objSchema={objSchema} objSelected={objSelected} onSelect={setObjSelected} />
        </aside>
        <main className={styles.panel}>
          <h6>Preview</h6>
          <FormRenderer schema={objSchema} entry={objEntry} setEntry={setObjEntry} />
        </main>
        <aside className={styles.panel}>
          <h6>Settings</h6>
          <SettingsPanel objSchema={objSchema} objSelected={objSelected} applyPatch={applyPatch} />
        </aside>
      </div>
    </div>
  );
}
