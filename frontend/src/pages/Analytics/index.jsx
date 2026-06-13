import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { orderAPI, campaignAPI } from '../../services/api';
import { KpiCard, Spinner } from '../../components/common';

const COLORS = ['#3b5bfe','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4'];
const fmtRs = n => '₹' + Number(n||0).toLocaleString('en-IN');
const pct = (a,b) => b > 0 ? ((a/b)*100).toFixed(1)+'%' : '0%';

export default function Analytics() {
  const [orderData, setOrderData] = useState(null);
  const [campData,  setCampData]  = useState(null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([orderAPI.analytics(), campaignAPI.analytics()])
      .then(([o,c]) => { setOrderData(o.data); setCampData(c.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  const monthly  = orderData?.monthly    || [];
  const cats     = orderData?.categories || [];
  const top      = orderData?.topCustomers || [];
  const overall  = campData?.overall     || {};
  const recent   = campData?.recent      || [];

  const funnelData = [
    { name:'Sent',      value: overall.total_sent      || 0 },
    { name:'Delivered', value: overall.total_delivered || 0 },
    { name:'Opened',    value: overall.total_opened    || 0 },
    { name:'Read',      value: (overall.total_read     || 0) },
    { name:'Clicked',   value: overall.total_clicked   || 0 },
    { name:'Converted', value: overall.total_converted || 0 },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <p className="text-sm text-muted mt-0.5">Campaign performance and revenue insights</p>
      </div>

      {/* Campaign KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard title="Total Sent"      value={(overall.total_sent||0).toLocaleString()}      icon="📤" color="brand" />
        <KpiCard title="Delivered"       value={(overall.total_delivered||0).toLocaleString()}  icon="✅" color="emerald" />
        <KpiCard title="Clicked"         value={(overall.total_clicked||0).toLocaleString()}    icon="👆" color="amber" />
        <KpiCard title="Converted"       value={(overall.total_converted||0).toLocaleString()}  icon="💎" color="purple" />
      </div>

      {/* Delivery Rate / CTR cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {[
          { label:'Delivery Rate', a:overall.total_delivered, b:overall.total_sent, color:'text-emerald-300' },
          { label:'Open Rate',     a:overall.total_opened,    b:overall.total_sent, color:'text-amber-300' },
          { label:'Click Rate',    a:overall.total_clicked,   b:overall.total_sent, color:'text-brand-300' },
        ].map(({label,a,b,color}) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
            <div className={`text-3xl font-bold ${color}`}>{pct(a||0,b||1)}</div>
            <div>
              <div className="text-white text-sm font-medium">{label}</div>
              <div className="text-muted text-xs">{(a||0).toLocaleString()} / {(b||0).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Revenue trend */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthly}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b5bfe" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b5bfe" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#252840" />
              <XAxis dataKey="month" tick={{fill:'#8892b0',fontSize:10}} />
              <YAxis tick={{fill:'#8892b0',fontSize:10}} />
              <Tooltip contentStyle={{background:'#1a1d2e',border:'1px solid #252840',borderRadius:8,color:'white'}}
                formatter={v=>[fmtRs(v),'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#3b5bfe" fill="url(#g1)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Campaign funnel */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Campaign Funnel</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#252840" />
              <XAxis type="number" tick={{fill:'#8892b0',fontSize:10}} />
              <YAxis dataKey="name" type="category" tick={{fill:'#8892b0',fontSize:10}} width={70} />
              <Tooltip contentStyle={{background:'#1a1d2e',border:'1px solid #252840',borderRadius:8,color:'white'}} />
              <Bar dataKey="value" radius={[0,4,4,0]}>
                {funnelData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category revenue */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={cats}>
              <CartesianGrid strokeDasharray="3 3" stroke="#252840" />
              <XAxis dataKey="category" tick={{fill:'#8892b0',fontSize:10}} />
              <YAxis tick={{fill:'#8892b0',fontSize:10}} />
              <Tooltip contentStyle={{background:'#1a1d2e',border:'1px solid #252840',borderRadius:8,color:'white'}}
                formatter={v=>[fmtRs(v)]} />
              <Bar dataKey="revenue" fill="#8b5cf6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top customers */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-white mb-4">Top 10 Customers</h3>
          <div className="space-y-2 overflow-y-auto max-h-[200px]">
            {top.map((c,i)=>(
              <div key={c.customer_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted w-4">{i+1}</span>
                  <div className="w-6 h-6 rounded-full bg-brand-500/30 flex items-center justify-center text-[10px] text-brand-300 font-bold">
                    {c.name[0]}
                  </div>
                  <span className="text-sm text-white">{c.name}</span>
                </div>
                <span className="text-sm font-semibold text-emerald-300">{fmtRs(c.total)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
