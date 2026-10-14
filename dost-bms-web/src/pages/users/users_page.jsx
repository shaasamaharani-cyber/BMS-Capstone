/**
 * System Name: Budget Management System
 * Module Name: Users Module
 *
 * Purpose of this file:
 * Users & Roles page for administrators: list accounts, add or edit them (name, email, role, unit),
 * deactivate or activate them, and see the latest account changes. Accounts are never deleted.
 *
 * Author(s): QUT Group T214
 *
 * Copyright (C) 2026
 * by the Department of Science and Technology - Central Office
 * All rights reserved.
 */

import { useCallback, useEffect, useState } from 'react';
import PageHeader from '../../components/layout/page_header';
import { Badge, Button, Dropdown, FormField, Input, Modal, Table, useToast } from '../../components/ui';
import { activateUser, createUser, deactivateUser, getRequestingUnits, getRoles, getUserChanges, getUsers, updateUser } from '../../api';
import { useAuth } from '../../context/auth_context';
import { formatRoleName } from '../../utils/helpers';
import { formatTimestamp } from '../../utils/formatters';

const EMPTY_FORM = { usr_fname: '', usr_lname: '', usr_email: '', usr_role_id: '', usr_requesting_unit_id: '' };

const rowsOf = (objResponse) => (Array.isArray(objResponse?.data) ? objResponse.data : []);

export default function UsersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [arrUsers, setArrUsers] = useState([]);
  const [arrRoles, setArrRoles] = useState([]);
  const [arrUnits, setArrUnits] = useState([]);
  const [arrChanges, setArrChanges] = useState([]);
  const [blnLoading, setBlnLoading] = useState(true);
  const [objEditing, setObjEditing] = useState(null);
  const [objForm, setObjForm] = useState(EMPTY_FORM);
  const [strFormError, setStrFormError] = useState('');
  const [blnSaving, setBlnSaving] = useState(false);

  const loadAll = useCallback(async () => {
    const [objUsers, objRoles, objUnits, objChanges] = await Promise.all([getUsers(1, 200), getRoles(), getRequestingUnits(), getUserChanges()]);
    setArrUsers(rowsOf(objUsers));
    setArrRoles(rowsOf(objRoles));
    setArrUnits(rowsOf(objUnits));
    setArrChanges(rowsOf(objChanges));
  }, []);

  useEffect(() => {
    loadAll().finally(() => setBlnLoading(false));
  }, [loadAll]);

  const intOwnId = Number(user?.usr_id ?? user?.id);
  const strFormRoleGroup = String(arrRoles.find((objRole) => String(objRole.role_id) === String(objForm.usr_role_id))?.role_group || '');

  const openForm = (objUser = null) => {
    setObjEditing(objUser || {});
    setObjForm(objUser ? {
      usr_fname: objUser.usr_fname || '',
      usr_lname: objUser.usr_lname || '',
      usr_email: objUser.usr_email || '',
      usr_role_id: String(objUser.usr_role_id ?? ''),
      usr_requesting_unit_id: String(objUser.usr_requesting_unit_id ?? ''),
    } : EMPTY_FORM);
    setStrFormError('');
  };

  const handleSave = async () => {
    setBlnSaving(true);
    setStrFormError('');
    try {
      if (objEditing?.id) await updateUser(objEditing.id, objForm);
      else await createUser(objForm);
      showToast({ message: objEditing?.id ? 'Account updated.' : 'Account created.' });
      setObjEditing(null);
      await loadAll();
    } catch (objError) {
      // The server explains what is wrong (missing name, email in use, requester without a unit...)
      setStrFormError(objError?.message || 'Cannot save this account.');
    } finally {
      setBlnSaving(false);
    }
  };

  const handleToggleActive = async (objUser) => {
    try {
      if (Number(objUser.usr_is_active) === 0) await activateUser(objUser.id);
      else await deactivateUser(objUser.id);
      showToast({ message: Number(objUser.usr_is_active) === 0 ? 'Account activated.' : 'Account deactivated.' });
      await loadAll();
    } catch (objError) {
      showToast({ message: objError?.message || 'Cannot change this account.', variant: 'warning' });
    }
  };

  const columns = [
    {
      key: 'usr_name',
      label: 'Name',
      render: (_, objUser) => (
        <div>
          <strong className="d-block">{objUser.usr_name}</strong>
          <span className="text-muted small">{objUser.usr_email}</span>
        </div>
      ),
    },
    { key: 'role', label: 'Role', render: (_, objUser) => formatRoleName(objUser) },
    { key: 'requesting_unit', label: 'Unit', render: (_, objUser) => objUser.requesting_unit?.ru_name || '-' },
    {
      key: 'usr_is_active',
      label: 'Status',
      render: (_, objUser) => (Number(objUser.usr_is_active) === 0
        ? <Badge status="cancelled" label="Deactivated" />
        : <Badge status="approved" label="Active" />),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, objUser) => (
        <div className="d-flex gap-2">
          <Button size="sm" variant="outline" onClick={() => openForm(objUser)}>Edit</Button>
          {Number(objUser.id) !== intOwnId && (
            <Button size="sm" variant="ghost" onClick={() => handleToggleActive(objUser)}>
              {Number(objUser.usr_is_active) === 0 ? 'Activate' : 'Deactivate'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Users & Roles">
        <Button onClick={() => openForm()}>+ Add user</Button>
      </PageHeader>
      <p className="text-muted small px-1">
        Accounts are deactivated, never deleted, so the history always shows who did what. You cannot change your own role or
        deactivate yourself. Passwords are set up with the Laravel back end in Phase 2.
      </p>

      <div className="card border rounded-3 mb-4">
        <Table columns={columns} data={arrUsers} loading={blnLoading} emptyState="No accounts yet." />
      </div>

      <div className="card border rounded-3 p-4 mb-4">
        <p className="fw-bold text-uppercase mb-3 section-eyebrow">Recent changes</p>
        {arrChanges.length === 0 ? (
          <p className="text-muted small mb-0">No account changes yet.</p>
        ) : (
          <table className="table table-sm mb-0">
            <thead><tr><th>When</th><th>Account</th><th>Change</th><th>By</th></tr></thead>
            <tbody>
              {arrChanges.map((objChange) => (
                <tr key={objChange.id}>
                  <td>{formatTimestamp(objChange.ucl_created_at)}</td>
                  <td>{objChange.ucl_user_name}</td>
                  <td>{objChange.ucl_action}{objChange.ucl_details ? <span className="text-muted small d-block">{objChange.ucl_details}</span> : null}</td>
                  <td>{objChange.ucl_actor_name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={Boolean(objEditing)}
        onClose={() => { if (!blnSaving) setObjEditing(null); }}
        title={objEditing?.id ? 'Edit account' : 'Add user'}
        footer={(
          <div className="d-flex justify-content-end gap-2 w-100">
            <Button variant="secondary" onClick={() => setObjEditing(null)} disabled={blnSaving}>Cancel</Button>
            <Button onClick={handleSave} disabled={blnSaving}>{blnSaving ? 'Saving...' : 'Save'}</Button>
          </div>
        )}
      >
        <FormField label="First name" required>
          <Input value={objForm.usr_fname} onChange={(objEvent) => setObjForm((objPrev) => ({ ...objPrev, usr_fname: objEvent.target.value }))} />
        </FormField>
        <FormField label="Last name" required>
          <Input value={objForm.usr_lname} onChange={(objEvent) => setObjForm((objPrev) => ({ ...objPrev, usr_lname: objEvent.target.value }))} />
        </FormField>
        <FormField label="Email" required hint="Used to sign in, e.g. name@dost.gov.ph">
          <Input type="email" value={objForm.usr_email} onChange={(objEvent) => setObjForm((objPrev) => ({ ...objPrev, usr_email: objEvent.target.value }))} />
        </FormField>
        <FormField label="Role" required>
          <Dropdown
            options={arrRoles.map((objRole) => ({ value: String(objRole.role_id), label: formatRoleName({ role: objRole }) }))}
            value={objForm.usr_role_id}
            onChange={(strValue) => setObjForm((objPrev) => ({ ...objPrev, usr_role_id: strValue }))}
            placeholder="Choose a role"
            disabled={Number(objEditing?.id) === intOwnId}
          />
        </FormField>
        {strFormRoleGroup === 'requester' && (
          <FormField label="Requesting unit" required hint="A requester only sees their own unit's requests">
            <Dropdown
              options={arrUnits.map((objUnit) => ({ value: String(objUnit.ru_id), label: objUnit.ru_name }))}
              value={objForm.usr_requesting_unit_id}
              onChange={(strValue) => setObjForm((objPrev) => ({ ...objPrev, usr_requesting_unit_id: strValue }))}
              placeholder="Choose a unit"
              searchable
            />
          </FormField>
        )}
        {strFormError ? <div className="text-danger small">{strFormError}</div> : null}
      </Modal>
    </div>
  );
}
