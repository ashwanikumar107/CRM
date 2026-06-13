import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { customerAPI, orderAPI, campaignAPI } from '../../services/api';
import { KpiCard, Spinner, Badge } from '../../components/common';

const COLORS = ['#3b5bfe','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'];

const fmt = n => n == null ? '—' : Number(n).toLocaleString('en-IN');
const fmtRs = n => n == null ? '—' : '₹' + Number(n).toLocaleString('en-IN');

export default function Dashboard() {
  const [custStats, setCustStats]   = useState(null);
  const [orderData, setOrderData]   = useState(null);
  const [campData,  setCampData]    = useState(null);
  const [loading,   setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      customerAPI.stats(),
      orderAPI.analytics(),
      campaignAPI.analytics(),
    ]).then(([c, o, ca]) => {
      setCustStats(c.data);
      setOrderData(o.data);
      setCampData(ca.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const stats  = custStats?.stats  || {};
  const cities = custStats?.cities || [];
  const monthly = orderData?.monthly || [];
  const cats    = orderData?.categories || [];
  const overall = campData?.overall || {};
  const recent  = campData?.recent  || [];

  const channelStatusColor = s => ({
    completed:'green', sent:'blue', sending:'amber', draft:'gray', failed:'red'
  }[s] || 'gray');

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Dashboard <span className="text-brand-400">✦</span>
        </h1>
        <p className="text-muted text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}
        </p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Customers" value={fmt(stats.total_customers)} icon="👥" color="brand" />
        <KpiCard title="Total Revenue"   value={fmtRs(stats.total_revenue)}  icon="💰" color="emerald" />
        <KpiCard title="Active (30d)"    value={fmt(stats.active_30d)}        icon="🟢" color="purple" />
        <KpiCard title="Inactive (60d)"  value={fmt(stats.inactive_60d)}      icon="🔴" color="rose" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Orders"    value={fmt(stats.total_orders)}       icon="🛒" color="amber" />
        <KpiCard title="Avg Spend"       value={fmtRs(stats.avg_spent)}         icon="📈" color="brand" />
        <KpiCard title="Campaigns Sent"  value={fmt(overall.total_campaigns)}   icon="📢" color="purple" />
        <KpiCard title="Converted"       value={fmt(overall.total_converted)}   icon="🎯" color="emerald" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b5bfe" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b5bfe" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252840" />
              <XAxis dataKey="month" tick={{ fill:'#8892b0', fontSize:11 }} />
              <YAxis tick={{ fill:'#8892b0', fontSize:11 }} />
              <Tooltip
                contentStyle={{ background:'#1a1d2e', border:'1px solid #252840', borderRadius:8, color:'white' }}
                formatter={v => ['₹' + Number(v).toLocaleString('en-IN'), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#3b5bfe" fill="url(#rev)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category breakdown */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">By Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={cats} dataKey="revenue" nameKey="category" cx="50%" cy="50%"
                outerRadius={80} label={({ category }) => category}>
                {cats.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background:'#1a1d2e', border:'1px solid #252840', borderRadius:8, color:'white' }}
                formatter={v => ['₹' + Number(v).toLocaleString('en-IN')]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaign funnel + cities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Campaign performance */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Campaign Funnel</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[
              { name: 'Sent',      v: overall.total_sent      || 0 },
              { name: 'Delivered', v: overall.total_delivered || 0 },
              { name: 'Opened',    v: overall.total_opened    || 0 },
              { name: 'Clicked',   v: overall.total_clicked   || 0 },
              { name: 'Converted', v: overall.total_converted || 0 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252840" />
              <XAxis dataKey="name" tick={{ fill:'#8892b0', fontSize:11 }} />
              <YAxis tick={{ fill:'#8892b0', fontSize:11 }} />
              <Tooltip contentStyle={{ background:'#1a1d2e', border:'1px solid #252840', borderRadius:8, color:'white' }} />
              <Bar dataKey="v" fill="#3b5bfe" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* City distribution */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Top Cities</h3>
          <div className="space-y-3">
            {cities.slice(0,6).map((c,i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i] }} />
                  <span className="text-sm text-white">{c.city}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted">{c.count} customers</span>
                  <span className="text-sm text-white font-medium">{fmtRs(c.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Campaigns */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-white">Recent Campaigns</h3>
          <Link to="/campaigns" className="text-xs text-brand-400 hover:text-brand-300">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Campaign','Channel','Status','Sent','Delivered','Clicked','Converted'].map(h => (
                  <th key={h} className="pb-2 text-left text-xs text-muted font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {recent.map(c => (
                <tr key={c.campaign_id} className="hover:bg-white/[0.02]">
                  <td className="py-2.5 text-white font-medium truncate max-w-[160px]">{c.name}</td>
                  <td className="py-2.5"><Badge color="blue">{c.channel}</Badge></td>
                  <td className="py-2.5"><Badge color={channelStatusColor(c.status)}>{c.status}</Badge></td>
                  <td className="py-2.5 text-muted">{c.stat_sent}</td>
                  <td className="py-2.5 text-muted">{c.stat_delivered}</td>
                  <td className="py-2.5 text-brand-300">{c.stat_clicked}</td>
                  <td className="py-2.5 text-emerald-300">{c.stat_converted}</td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-muted">No campaigns yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
