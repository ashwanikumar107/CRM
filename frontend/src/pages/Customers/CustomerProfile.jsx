import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerAPI } from '../../services/api';
import { Button, Badge, Spinner, KpiCard } from '../../components/common';

const fmtRs = n => '₹' + Number(n||0).toLocaleString('en-IN');

export default function CustomerProfile() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    customerAPI.get(id)
      .then(r => setData(r.data))
      .catch(() => navigate('/customers'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spinner />;
  if (!data)   return null;

  const { orders = [], ...customer } = data;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Back */}
      <button onClick={() => navigate('/customers')}
        className="text-muted hover:text-white text-sm mb-5 flex items-center gap-1 transition-colors">
        ← Back to Customers
      </button>

      {/* Profile header */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-5 flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600
          flex items-center justify-center text-2xl font-bold text-white shrink-0">
          {customer.name[0]}
        </div>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{customer.name}</h1>
          <div className="flex flex-wrap gap-3 mt-1">
            <span className="text-sm text-muted">{customer.email}</span>
            {customer.phone && <span className="text-sm text-muted">{customer.phone}</span>}
            {customer.city  && <Badge color="gray">{customer.city}</Badge>}
          </div>
          <div className="text-xs text-muted mt-2">
            Customer since {new Date(customer.created_at).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' })}
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/customers')}>Edit</Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <KpiCard title="Total Spent"   value={fmtRs(customer.total_spent)} icon="💰" color="emerald" />
        <KpiCard title="Orders"        value={customer.order_count}         icon="🛒" color="brand" />
        <KpiCard title="Avg Order"
          value={customer.order_count > 0 ? fmtRs(customer.total_spent / customer.order_count) : '—'}
          icon="📊" color="amber" />
        <KpiCard title="Last Order"
          value={customer.last_order_at ? new Date(customer.last_order_at).toLocaleDateString('en-IN') : 'Never'}
          icon="🕐" color="purple" />
      </div>

      {/* Order history */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-white mb-4">Order History</h2>
        {orders.length === 0 ? (
          <p className="text-muted text-sm">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Product','Category','Amount','Date'].map(h => (
                    <th key={h} className="pb-2 text-left text-xs text-muted font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {orders.map(o => (
                  <tr key={o.order_id} className="hover:bg-white/[0.02]">
                    <td className="py-3 text-white font-medium">{o.product_name}</td>
                    <td className="py-3">{o.category ? <Badge color="gray">{o.category}</Badge> : '—'}</td>
                    <td className="py-3 text-emerald-300 font-semibold">{fmtRs(o.amount)}</td>
                    <td className="py-3 text-muted">{new Date(o.order_date).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
