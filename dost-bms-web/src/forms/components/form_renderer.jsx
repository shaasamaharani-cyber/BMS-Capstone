/**
 * System Name: Budget Management System
 * Module Name: Forms Module
 *
 * Purpose of this file:
 * Drives the full schema-driven form, composing header fields, section tabs, and dynamic tables into one view.
 *
 * Author(s): QUT Group 27
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * Developed by Team 27, Queensland University of Technology
 * All rights reserved.
 */

import { useState } from 'react';
import DynamicTable from './dynamic_table';
import HeaderFields from './header_fields';
import StructuredField from '../../components/form/structured_field';
import styles from './flexible_forms.module.css';

function getSectionKey(sectionId, tabId) {
  return tabId ? `${sectionId}__${tabId}` : sectionId;
}

function Footer({ footer }) {
  if (!footer) return null;

  return (
    <div className={styles.footer}>
      {footer.notes?.length ? (
        <div>
          {footer.notes.map((note) => (
            <div key={note.key} className="text-muted small">{note.label}</div>
          ))}
        </div>
      ) : null}
      {footer.signers?.length ? (
        <div className={styles.signers}>
          {footer.signers.map((signer) => (
            <div key={signer.key} className={styles.signerLine}>{signer.role}</div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function SectionRenderer({ section, entry, activeTab, setActiveTab, updateSection }) {
  const [collapsed, setCollapsed] = useState(false);
  const tabs = section.tabs || null;
  const selectedTabId = activeTab[section.id] || tabs?.[0]?.id;
  const selectedTab = tabs?.find((tab) => tab.id === selectedTabId) || tabs?.[0];
  const table = selectedTab?.table || section.table;
  const sectionKey = getSectionKey(section.id, selectedTab?.id && tabs ? selectedTab.id : null);
  const rows = entry.sections?.[sectionKey] || [];

  return (
    <section className={styles.section}>
      <button
        type="button"
        className={styles.sectionHeader}
        onClick={() => section.collapsible && setCollapsed((value) => !value)}
      >
        <span>{section.title}</span>
        {section.collapsible ? <span>{collapsed ? '+' : '-'}</span> : null}
      </button>
      {!collapsed && (
        <div className={styles.sectionBody}>
          {tabs ? (
            <div className={`${styles.tabs} no-print`}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`${styles.tabButton} ${tab.id === selectedTabId ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab((prev) => ({ ...prev, [section.id]: tab.id }))}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}
          {table?.kind === 'performance' ? <StructuredField field={{ key: 'performance', label: section.title, columns: table.columns.filter((column) => !column.legacy || rows.some((row) => row[column.key] !== undefined && row[column.key] !== '')) }} value={rows} onChange={(nextRows) => updateSection(sectionKey, nextRows)} /> : table ? (
            <DynamicTable
              schema={table}
              rows={rows}
              onChange={(nextRows) => updateSection(sectionKey, nextRows)}
            />
          ) : null}
          {section.subsections?.map((subsection) => (
            <SectionRenderer
              key={subsection.id}
              section={subsection}
              entry={entry}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              updateSection={updateSection}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function FormRenderer({ schema, entry, setEntry }) {
  const [activeTab, setActiveTab] = useState({});

  function updateHeader(key, value) {
    setEntry((prev) => ({
      ...prev,
      header: { ...prev.header, [key]: value },
      updatedAt: new Date().toISOString(),
    }));
  }

  function updateEntryName(value) {
    setEntry((prev) => ({
      ...prev,
      name: value,
      updatedAt: new Date().toISOString(),
    }));
  }

  function updateSection(sectionKey, rows) {
    setEntry((prev) => ({
      ...prev,
      sections: { ...prev.sections, [sectionKey]: rows },
      updatedAt: new Date().toISOString(),
    }));
  }

  return (
    <div className={styles.formShell}>
      <HeaderFields
        fields={schema.headerFields}
        values={entry.header}
        onChange={updateHeader}
        entryName={entry.name}
        onEntryNameChange={updateEntryName}
      />
      {schema.sections.map((section) => (
        <SectionRenderer
          key={section.id}
          section={section}
          entry={entry}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          updateSection={updateSection}
        />
      ))}
      <Footer footer={schema.footer} />
      {schema.id === 'bp-form-b' && Object.entries(entry.sections || {}).filter(([key, rows]) => !schema.sections.some((section) => section.id === key) && rows?.length).map(([key, rows]) => <details key={key} className="border rounded p-3 mt-3">
        <summary>Internal: preserved legacy section {key}</summary>
        <p className="small text-muted">These original values have not been converted to performance indicators or assigned to a budget tier.</p>
        <pre className="small" style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(rows, null, 2)}</pre>
      </details>)}
    </div>
  );
}
