import React, { useState, useRef, useEffect } from 'react';
import { aiAPI } from '../../services/api';
import { Button } from '../../components/common';

const STARTERS = [
  'How do I re-engage inactive customers?',
  'Help me increase sales of beauty products.',
  'Suggest a campaign for high-value customers.',
  'Which channel works best for promotions?',
  'Create a segment for customers in Mumbai.',
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 font-bold
        ${isUser ? 'bg-brand-500/30 text-brand-300' : 'bg-gradient-to-br from-brand-500 to-purple-600 text-white'}`}>
        {isUser ? 'M' : '✦'}
      </div>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed
        ${isUser
          ? 'bg-brand-500/20 text-white rounded-tr-sm'
          : 'bg-card border border-border text-white/90 rounded-tl-sm'}`}>
        {msg.content.split('\n').map((line,i) => (
          <p key={i} className={line.startsWith('#') || line.startsWith('**') ? 'font-semibold mt-2' : ''}>{
            line.replace(/\*\*(.*?)\*\*/g, '$1')
               .replace(/^#+\s/, '')
               .replace(/^-\s/, '• ')
            || <br/>
          }</p>
        ))}
      </div>
    </div>
  );
}

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    { role:'assistant', content:"Hi! I'm your AI marketing assistant. I can help you create audience segments, craft campaign messages, recommend channels, and grow your retail business. What would you like to work on?" }
  ]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setInput('');
    const newMessages = [...messages, { role:'user', content:msg }];
    setMessages(newMessages);
    setLoading(true);
    try {
      const history = newMessages.slice(-8).map(m => ({ role:m.role, content:m.content }));
      const r = await aiAPI.chat({ message: msg, history: history.slice(0,-1) });
      setMessages(prev => [...prev, { role:'assistant', content: r.data.reply }]);
    } catch(e) {
      setMessages(prev => [...prev, { role:'assistant', content: `Sorry, I ran into an error: ${e.message}` }]);
    } finally { setLoading(false); }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600
            flex items-center justify-center text-white font-bold">✦</div>
          <div>
            <h1 className="font-bold text-white">AI Marketing Assistant</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-muted">Powered by GPT / Gemini</span>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((m,i) => <Message key={i} msg={m} />)}

        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600
              flex items-center justify-center text-white font-bold shrink-0">✦</div>
            <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                {[0,1,2].map(i=>(
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-muted animate-bounce"
                    style={{ animationDelay:`${i*0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Starters (only when fresh) */}
      {messages.length === 1 && (
        <div className="px-6 pb-4">
          <p className="text-xs text-muted mb-2">Try asking:</p>
          <div className="flex flex-wrap gap-2">
            {STARTERS.map(s => (
              <button key={s} onClick={() => send(s)}
                className="text-xs bg-white/5 hover:bg-white/10 text-muted hover:text-white
                  border border-border rounded-full px-3 py-1.5 transition-colors">
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 pb-6 pt-2">
        <div className="flex gap-2 bg-card border border-border rounded-2xl p-2">
          <input
            className="flex-1 bg-transparent px-2 text-sm text-white placeholder-muted
              focus:outline-none"
            placeholder="Ask anything about your customers, campaigns or strategy…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key==='Enter' && !e.shiftKey && send()}
            disabled={loading}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white
              w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0">
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
