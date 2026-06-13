import React, { useEffect, useState, useCallback } from 'react';
import { orderAPI, customerAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { PageHeader, Button, Input, Select, Table, Modal, Badge, Spinner, EmptyState } from '../../components/common';

const CATEGORIES = ['Beauty','Sports','Clothing','Health','Electronics','Home','Food','Other'];

export default function Orders() {
  const [orders,    setOrders]    = useState([]);
  const [total,     setTotal]     = useState(0);
  const [page,      setPage]      = useState(1);
  const [customers, setCustomers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState({ customer_id:'', product_name:'', category:'', amount:'', order_date:'' });
  const [saving,    setSaving]    = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [o,c] = await Promise.all([orderAPI.list({ page, limit:20 }), customerAPI.list({ limit:100 })]);
      setOrders(o.data); setTotal(o.total);
      setCustomers(c.data);
    } finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const save = async () => {
    setSaving(true);
    try {
      await orderAPI.create({ ...form, amount: parseFloat(form.amount) });
      toast('Order added'); setModal(false); load();
    } catch(e) { toast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const del = async (o) => {
    if (!window.confirm('Delete this order?')) return;
    try { await orderAPI.delete(o.order_id); toast('Order deleted'); load(); }
    catch(e) { toast(e.message,'error'); }
  };

  const columns = [
    { key:'product_name',  header:'Product',  render:(v,r)=><div><div className="text-white font-medium">{v}</div><div className="text-xs text-muted">{r.category}</div></div> },
    { key:'customer_name', header:'Customer', render:v=><span className="text-brand-300">{v}</span> },
    { key:'amount',        header:'Amount',   render:v=><span className="text-white font-semibold">₹{Number(v).toLocaleString('en-IN')}</span> },
    { key:'category',      header:'Category', render:v=>v?<Badge color="gray">{v}</Badge>:'—' },
    { key:'order_date',    header:'Date',     render:v=>new Date(v).toLocaleDateString('en-IN') },
    { key:'order_id',      header:'',         render:(_,r)=>(
      <button onClick={e=>{e.stopPropagation();del(r)}} className="text-xs text-rose-400 hover:text-rose-300">Delete</button>
    )},
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Orders"
        subtitle={`${total} total orders`}
        actions={<Button onClick={()=>{ setForm({customer_id:'',product_name:'',category:'',amount:'',order_date:''}); setModal(true); }}>+ Add Order</Button>}
      />

      {loading ? <Spinner /> : (
        orders.length === 0
          ? <EmptyState icon="🛒" title="No orders yet" description="Add your first order" action={<Button onClick={()=>setModal(true)}>Add Order</Button>} />
          : <Table columns={columns} data={orders} />
      )}

      {total > 20 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="secondary" size="sm" onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}>← Prev</Button>
          <span className="text-muted text-sm py-1.5">Page {page}</span>
          <Button variant="secondary" size="sm" onClick={()=>setPage(p=>p+1)} disabled={page>=Math.ceil(total/20)}>Next →</Button>
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title="Add Order">
        <div className="space-y-4">
          <Select label="Customer *" value={form.customer_id} onChange={e=>setForm(f=>({...f,customer_id:e.target.value}))}>
            <option value="">Select customer…</option>
            {customers.map(c=><option key={c.customer_id} value={c.customer_id}>{c.name} ({c.email})</option>)}
          </Select>
          <Input label="Product Name *" value={form.product_name} onChange={e=>setForm(f=>({...f,product_name:e.target.value}))} placeholder="Moisturizer SPF50" />
          <Select label="Category" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
            <option value="">Select…</option>
            {CATEGORIES.map(c=><option key={c}>{c}</option>)}
          </Select>
          <Input label="Amount (₹) *" value={form.amount} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} placeholder="1500" type="number" />
          <Input label="Order Date" value={form.order_date} onChange={e=>setForm(f=>({...f,order_date:e.target.value}))} type="datetime-local" />
          <div className="flex gap-2 pt-2">
            <Button onClick={save} loading={saving} className="flex-1">Add Order</Button>
            <Button variant="secondary" onClick={()=>setModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
