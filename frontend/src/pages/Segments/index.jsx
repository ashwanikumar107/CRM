import React, { useEffect, useState, useCallback } from 'react';
import { segmentAPI } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import {
  PageHeader, Button, Input, Select, Table, Modal,
  Badge, Spinner, EmptyState, KpiCard
} from '../../components/common';

const PRESETS = [
  { label: 'High Value (> ₹5000)',  sql: "total_spent > 5000",    conditions: {total_spent:{gt:5000}} },
  { label: 'Inactive 60 days',      sql: "last_order_at < DATE_SUB(NOW(), INTERVAL 60 DAY) OR last_order_at IS NULL", conditions: {inactive:60} },
  { label: 'Frequent Buyers (5+)',  sql: "order_count >= 5",      conditions: {order_count:{gte:5}} },
  { label: 'New Customers (30d)',   sql: "created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)", conditions: {new:30} },
];

export default function Segments() {
  const [segments, setSegments] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [tab,      setTab]      = useState('manual');  // manual | ai
  const [form,     setForm]     = useState({ name:'', description:'', sql_condition:'', conditions:{} });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [previewCustomers, setPreviewCustomers] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [aiLoading,setAiLoading]= useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await segmentAPI.list(); setSegments(r.data); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const preview = async () => {
    if (!form.sql_condition) return;
    setPreviewing(true);
    try {
      const r = await segmentAPI.preview({ sql_condition: form.sql_condition });
      setPreviewCustomers(r.data);
    } catch(e) { toast(e.message,'error'); }
    finally { setPreviewing(false); }
  };

  const runAI = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const r = await segmentAPI.aiCreate({ name: aiPrompt, natural_language: aiPrompt });
      setAiResult(r);
      load();
      toast('AI Segment created! ✨', 'success');
      setModal(null);
    } catch(e) { toast(e.message,'error'); }
    finally { setAiLoading(false); }
  };

  const saveManual = async () => {
    setSaving(true);
    try {
      await segmentAPI.create(form);
      toast('Segment created');
      setModal(null); load();
    } catch(e) { toast(e.message,'error'); }
    finally { setSaving(false); }
  };

  const del = async (s) => {
    if (!window.confirm(`Delete "${s.name}"?`)) return;
    try { await segmentAPI.delete(s.segment_id); toast('Deleted'); load(); }
    catch(e) { toast(e.message,'error'); }
  };

  const columns = [
    { key:'name',       header:'Segment Name', render:(v,r)=>(
      <div>
        <div className="font-medium text-white">{v}</div>
        <div className="text-xs text-muted mt-0.5">{r.description?.slice(0,60)}</div>
      </div>
    )},
    { key:'customer_count', header:'Customers',   render:v=><span className="text-brand-300 font-bold">{v}</span> },
    { key:'ai_generated',   header:'Source',       render:v=> v ? <Badge color="purple">✦ AI</Badge> : <Badge color="gray">Manual</Badge> },
    { key:'created_at',     header:'Created',      render:v=> new Date(v).toLocaleDateString('en-IN') },
    { key:'segment_id',     header:'Actions',
      render:(_,r)=>(
        <div className="flex gap-2" onClick={e=>e.stopPropagation()}>
          <button onClick={()=>del(r)} className="text-xs text-rose-400 hover:text-rose-300">Delete</button>
        </div>
      )
    },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Audience Segments"
        subtitle="Group customers for targeted campaigns"
        actions={
          <div className="flex gap-2">
            <Button variant="ai" onClick={() => { setTab('ai'); setModal('create'); setAiPrompt(''); setAiResult(null); }}>
              ✦ AI Segment
            </Button>
            <Button onClick={() => { setTab('manual'); setModal('create'); setForm({name:'',description:'',sql_condition:'',conditions:{}}); setPreviewCustomers(null); }}>
              + Manual Segment
            </Button>
          </div>
        }
      />

      {loading ? <Spinner /> : (
        segments.length === 0 ? (
          <EmptyState icon="🎯" title="No segments yet"
            description="Create your first audience segment"
            action={<Button onClick={()=>setModal('create')}>Create Segment</Button>} />
        ) : <Table columns={columns} data={segments} />
      )}

      {/* Create Modal */}
      <Modal open={modal==='create'} onClose={() => setModal(null)}
        title={tab==='ai' ? '✦ AI-Powered Segment' : 'Create Segment'} maxWidth="max-w-2xl">

        {/* Tab Switch */}
        <div className="flex gap-1 bg-surface rounded-lg p-1 mb-5">
          {[['manual','Manual'],['ai','✦ AI (Natural Language)']].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)}
              className={`flex-1 py-1.5 text-sm rounded-md font-medium transition-colors
                ${tab===k ? 'bg-brand-500 text-white' : 'text-muted hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {tab === 'ai' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Describe your audience in plain English</label>
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={e=>setAiPrompt(e.target.value)}
                placeholder="e.g. Customers who spent more than ₹5000 and haven't ordered in 60 days"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white
                  placeholder-muted focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                'High value customers inactive for 60 days',
                'Customers from Mumbai who bought beauty products',
                'Frequent buyers with more than 5 orders',
              ].map(ex => (
                <button key={ex} onClick={()=>setAiPrompt(ex)}
                  className="text-xs bg-white/5 hover:bg-white/10 text-muted hover:text-white
                    border border-border rounded-full px-3 py-1 transition-colors">
                  {ex}
                </button>
              ))}
            </div>
            <Button variant="ai" onClick={runAI} loading={aiLoading} className="w-full justify-center">
              ✦ Generate Segment with AI
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input label="Segment Name *" value={form.name}
              onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="High Value Customers" />
            <Input label="Description" value={form.description}
              onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Brief description" />

            <div>
              <label className="block text-xs font-medium text-muted mb-1">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button key={p.label} onClick={()=>setForm(f=>({...f,sql_condition:p.sql,conditions:p.conditions}))}
                    className="text-xs bg-white/5 hover:bg-white/10 text-muted hover:text-white
                      border border-border rounded-lg px-3 py-1.5 transition-colors">
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted mb-1">SQL WHERE Condition *</label>
              <textarea
                rows={2}
                value={form.sql_condition}
                onChange={e=>setForm(f=>({...f,sql_condition:e.target.value}))}
                placeholder="total_spent > 5000 AND order_count >= 3"
                className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-white
                  font-mono placeholder-muted focus:outline-none focus:border-brand-500 resize-none"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" onClick={preview} loading={previewing} size="sm">Preview Customers</Button>
              {previewCustomers !== null && (
                <span className="text-sm text-brand-300 self-center">
                  {previewCustomers.length} customers matched
                </span>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={saveManual} loading={saving} className="flex-1">Create Segment</Button>
              <Button variant="secondary" onClick={()=>setModal(null)}>Cancel</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
