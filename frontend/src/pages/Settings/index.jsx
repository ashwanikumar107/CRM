import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Button, Input, Select, Badge, Table, Modal } from '../../components/common';

const BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const roleBadge = r => ({ admin:'purple', manager:'blue', viewer:'gray' }[r] || 'gray');

export default function Settings() {
  const { user, isAdmin, refreshUser, accessToken } = useAuth();
  const toast = useToast();

  // Profile
  const [profile,  setProfile]  = useState({ name: user?.name || '', avatar: user?.avatar || '' });
  const [savingP,  setSavingP]  = useState(false);

  // Password
  const [pwForm,   setPwForm]   = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });
  const [savingPw, setSavingPw] = useState(false);
  const [showPw,   setShowPw]   = useState(false);

  // Admin: users list
  const [users,    setUsers]    = useState([]);
  const [modal,    setModal]    = useState(false);
  const [newUser,  setNewUser]  = useState({ name:'', email:'', password:'', role:'manager' });
  const [savingU,  setSavingU]  = useState(false);

  const headers = { Authorization: `Bearer ${accessToken}` };

  useEffect(() => {
    if (isAdmin) {
      axios.get(`${BASE}/users`, { headers }).then(r => setUsers(r.data.data)).catch(() => {});
    }
  }, [isAdmin]);

  const saveProfile = async () => {
    setSavingP(true);
    try {
      await axios.put(`${BASE}/auth/profile`, profile, { headers });
      await refreshUser();
      toast('Profile updated');
    } catch(e) { toast(e.response?.data?.message || e.message, 'error'); }
    finally { setSavingP(false); }
  };

  const changePassword = async () => {
    if (pwForm.newPassword !== pwForm.confirmPassword)
      return toast('Passwords do not match', 'error');
    if (pwForm.newPassword.length < 6)
      return toast('Password must be at least 6 characters', 'error');
    setSavingPw(true);
    try {
      await axios.put(`${BASE}/auth/change-password`, {
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }, { headers });
      toast('Password changed — please log in again', 'success');
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
    } catch(e) { toast(e.response?.data?.message || e.message, 'error'); }
    finally { setSavingPw(false); }
  };

  const createUser = async () => {
    setSavingU(true);
    try {
      await axios.post(`${BASE}/auth/register`, newUser, { headers });
      toast('User created');
      setModal(false);
      const r = await axios.get(`${BASE}/users`, { headers });
      setUsers(r.data.data);
    } catch(e) { toast(e.response?.data?.message || e.message, 'error'); }
    finally { setSavingU(false); }
  };

  const changeRole = async (userId, role) => {
    try {
      await axios.put(`${BASE}/users/${userId}/role`, { role }, { headers });
      toast('Role updated');
      const r = await axios.get(`${BASE}/users`, { headers });
      setUsers(r.data.data);
    } catch(e) { toast(e.response?.data?.message || e.message, 'error'); }
  };

  const deactivate = async (u) => {
    if (!window.confirm(`Deactivate ${u.name}?`)) return;
    try {
      await axios.delete(`${BASE}/users/${u.user_id}`, { headers });
      toast('User deactivated');
      setUsers(prev => prev.filter(x => x.user_id !== u.user_id));
    } catch(e) { toast(e.response?.data?.message || e.message, 'error'); }
  };

  const userColumns = [
    { key:'name',  header:'Name',  render:(v,r) => (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-purple-600
          flex items-center justify-center text-xs font-bold text-white">{v[0]}</div>
        <span className="text-white font-medium">{v}</span>
      </div>
    )},
    { key:'email', header:'Email', render:v=><span className="text-muted text-xs">{v}</span> },
    { key:'role',  header:'Role',  render:(v,r) => (
      <Select value={v}
        onChange={e => changeRole(r.user_id, e.target.value)}
        className="!py-1 !text-xs !w-28">
        <option value="admin">admin</option>
        <option value="manager">manager</option>
        <option value="viewer">viewer</option>
      </Select>
    )},
    { key:'last_login_at', header:'Last Login', render:v => v ? new Date(v).toLocaleDateString('en-IN') : 'Never' },
    { key:'user_id', header:'', render:(_,r) => r.user_id !== user?.user_id ? (
      <button onClick={() => deactivate(r)} className="text-xs text-rose-400 hover:text-rose-300">Deactivate</button>
    ) : <span className="text-xs text-muted">You</span> },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <PageHeader title="Settings" subtitle="Manage your profile, security, and team" />

      {/* Profile */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span>👤</span> Profile
        </h2>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600
            flex items-center justify-center text-xl font-bold text-white">
            {user?.name?.[0]}
          </div>
          <div>
            <div className="font-semibold text-white">{user?.name}</div>
            <div className="text-sm text-muted">{user?.email}</div>
            <Badge color={roleBadge(user?.role)}>{user?.role}</Badge>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <Input label="Full Name" value={profile.name}
            onChange={e => setProfile(p => ({...p, name: e.target.value}))} />
          <Input label="Avatar URL (optional)" value={profile.avatar}
            onChange={e => setProfile(p => ({...p, avatar: e.target.value}))}
            placeholder="https://…" />
        </div>
        <Button onClick={saveProfile} loading={savingP}>Save Profile</Button>
      </div>

      {/* Change Password */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
          <span>🔑</span> Change Password
        </h2>
        <div className="space-y-3 max-w-sm">
          <Input label="Current Password"
            type={showPw ? 'text' : 'password'}
            value={pwForm.currentPassword}
            onChange={e => setPwForm(p => ({...p, currentPassword: e.target.value}))} />
          <Input label="New Password"
            type={showPw ? 'text' : 'password'}
            value={pwForm.newPassword}
            onChange={e => setPwForm(p => ({...p, newPassword: e.target.value}))} />
          <Input label="Confirm New Password"
            type={showPw ? 'text' : 'password'}
            value={pwForm.confirmPassword}
            onChange={e => setPwForm(p => ({...p, confirmPassword: e.target.value}))} />
          <div className="flex items-center gap-3">
            <Button onClick={changePassword} loading={savingPw}>Update Password</Button>
            <button onClick={() => setShowPw(s => !s)}
              className="text-xs text-muted hover:text-white transition-colors">
              {showPw ? 'Hide' : 'Show'} passwords
            </button>
          </div>
        </div>
      </div>

      {/* Team Management (Admin only) */}
      {isAdmin && (
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span>👥</span> Team Members
            </h2>
            <Button size="sm" onClick={() => { setNewUser({name:'',email:'',password:'',role:'manager'}); setModal(true); }}>
              + Invite User
            </Button>
          </div>
          <Table columns={userColumns} data={users} emptyMessage="No users found" />
        </div>
      )}

      {/* Role legend */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Role Permissions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {[
            { role:'viewer',  color:'gray',   perms:['Read customers','Read orders','View analytics'] },
            { role:'manager', color:'blue',   perms:['All viewer perms','Create/edit customers & orders','Create & send campaigns','Create segments'] },
            { role:'admin',   color:'purple', perms:['All manager perms','Delete any record','Manage team & roles','Full access'] },
          ].map(({ role, color, perms }) => (
            <div key={role} className="bg-surface rounded-xl p-3 border border-border">
              <Badge color={color}>{role}</Badge>
              <ul className="mt-2 space-y-1">
                {perms.map(p => <li key={p} className="text-muted flex items-start gap-1"><span className="text-emerald-400 mt-0.5">✓</span>{p}</li>)}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Invite User Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Invite Team Member">
        <div className="space-y-4">
          <Input label="Full Name *" value={newUser.name}
            onChange={e => setNewUser(u => ({...u, name: e.target.value}))} />
          <Input label="Email *" type="email" value={newUser.email}
            onChange={e => setNewUser(u => ({...u, email: e.target.value}))} />
          <Input label="Temporary Password *" type="password" value={newUser.password}
            onChange={e => setNewUser(u => ({...u, password: e.target.value}))} />
          <Select label="Role" value={newUser.role}
            onChange={e => setNewUser(u => ({...u, role: e.target.value}))}>
            <option value="manager">manager</option>
            <option value="viewer">viewer</option>
            <option value="admin">admin</option>
          </Select>
          <div className="flex gap-2 pt-2">
            <Button onClick={createUser} loading={savingU} className="flex-1">Create User</Button>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
