import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  PageHeader, Button, Input, Table, Modal, Badge, Spinner, EmptyState
} from '../../components/common';

const BLANK = { name:'', email:'', phone:'', city:'' };

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null); // null | 'add' | 'edit'
  const [form,      setForm]      = useState(BLANK);
  const [editing,   setEditing]   = useState(null);
  const [saving,    setSaving]    = useState(false);
  const toast    = useToast();
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await customerAPI.list({ page, limit: 20, search });
      setCustomers(res.data);
      setTotal(res.total);
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openAdd  = () => { setForm(BLANK); setEditing(null); setModal('add'); };
  const openEdit = c  => { setForm({ name:c.name, email:c.email, phone:c.phone||'', city:c.city||'' }); setEditing(c); setModal('edit'); };
  const close    = () => { setModal(null); setForm(BLANK); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        await customerAPI.update(editing.customer_id, form);
        toast('Customer updated');
      } else {
        await customerAPI.create(form);
        toast('Customer added');
      }
      close(); load();
    } catch(e) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const del = async (c) => {
    if (!window.confirm(`Delete ${c.name}?`)) return;
    try {
      await customerAPI.delete(c.customer_id);
      toast('Customer deleted');
      load();
    } catch(e) { toast(e.message, 'error'); }
  };

  const columns = [
    { key:'name',        header:'Name',    render:(v,r) => <span className="font-medium text-white">{v}</span> },
    { key:'email',       header:'Email',   render:(v)   => <span className="text-muted">{v}</span> },
    { key:'phone',       header:'Phone',   render:(v)   => v || '—' },
    { key:'city',        header:'City',    render:(v)   => v ? <Badge color="gray">{v}</Badge> : '—' },
    { key:'total_spent', header:'Spent',   render:(v)   => v ? '₹' + Number(v).toLocaleString('en-IN') : '₹0' },
    { key:'order_count', header:'Orders',  render:(v)   => <span className="text-brand-300">{v}</span> },
    {
      key:'customer_id', header:'Actions',
      render:(_,r) => (
        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
          <button onClick={() => openEdit(r)} className="text-xs text-brand-400 hover:text-brand-300">Edit</button>
          <button onClick={() => del(r)}       className="text-xs text-rose-400 hover:text-rose-300">Delete</button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Customers"
        subtitle={`${total} total customers`}
        actions={<Button onClick={openAdd}>+ Add Customer</Button>}
      />

      {/* Search */}
      <div className="flex gap-3 mb-4">
        <Input
          placeholder="Search by name, email or phone…"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="max-w-xs"
        />
      </div>

      {loading ? <Spinner /> : (
        customers.length === 0 ? (
          <EmptyState icon="👥" title="No customers yet"
            description="Add your first customer to get started"
            action={<Button onClick={openAdd}>Add Customer</Button>} />
        ) : (
          <Table columns={columns} data={customers}
            onRowClick={c => navigate(`/customers/${c.customer_id}`)} />
        )
      )}

      {/* Pagination */}
      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}>← Prev</Button>
          <span className="text-muted text-sm py-1.5">Page {page} of {Math.ceil(total/20)}</span>
          <Button variant="secondary" size="sm" onClick={() => setPage(p => p+1)} disabled={page>=Math.ceil(total/20)}>Next →</Button>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal open={!!modal} onClose={close} title={editing ? 'Edit Customer' : 'Add Customer'}>
        <div className="space-y-4">
          <Input label="Full Name *"    value={form.name}  onChange={e=>setForm(f=>({...f,name:e.target.value}))}  placeholder="Aasha Mehta" />
          <Input label="Email *"        value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="aasha@email.com" type="email" />
          <Input label="Phone"          value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="9876543210" />
          <Input label="City"           value={form.city}  onChange={e=>setForm(f=>({...f,city:e.target.value}))}  placeholder="Mumbai" />
          <div className="flex gap-2 pt-2">
            <Button onClick={save} loading={saving} className="flex-1">
              {editing ? 'Save Changes' : 'Add Customer'}
            </Button>
            <Button variant="secondary" onClick={close}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
