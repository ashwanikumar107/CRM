import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../common';

const NAV = [
  { to: '/',          label: 'Dashboard',    icon: '⬡' },
  { to: '/customers', label: 'Customers',    icon: '👥' },
  { to: '/orders',    label: 'Orders',       icon: '🛒' },
  { to: '/segments',  label: 'Segments',     icon: '🎯' },
  { to: '/campaigns', label: 'Campaigns',    icon: '📢' },
  { to: '/analytics', label: 'Analytics',    icon: '📊' },
  { to: '/assistant', label: 'AI Assistant', icon: '✦',  badge: 'AI' },
  { to: '/settings',  label: 'Settings',     icon: '⚙️' },
];

const roleBadge = r => ({ admin:'purple', manager:'blue', viewer:'gray' }[r] || 'gray');

export default function Layout({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-surface text-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`flex flex-col bg-card border-r border-border transition-all duration-300
        ${collapsed ? 'w-16' : 'w-60'} shrink-0`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-purple-600
            flex items-center justify-center text-white font-bold text-sm shrink-0">C</div>
          {!collapsed && (
            <div>
              <div className="font-bold text-white text-sm leading-tight">CRM.ai</div>
              <div className="text-xs text-muted">Retail Intelligence</div>
            </div>
          )}
          <button onClick={() => setCollapsed(c => !c)}
            className="ml-auto text-muted hover:text-white transition-colors">
            {collapsed ? '›' : '‹'}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {NAV.map(({ to, label, icon, badge }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150
                ${isActive
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/30'
                  : 'text-muted hover:text-white hover:bg-white/5'}`
              }>
              <span className="text-base shrink-0">{icon}</span>
              {!collapsed && <span>{label}</span>}
              {!collapsed && badge && (
                <span className="ml-auto text-[10px] bg-brand-500/30 text-brand-300 px-1.5 py-0.5 rounded-full">
                  {badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-border">
          {collapsed ? (
            <button onClick={handleLogout}
              className="w-full flex items-center justify-center py-4 text-muted hover:text-rose-400 transition-colors"
              title="Logout">
              ⇥
            </button>
          ) : (
            <div className="px-3 py-3">
              <button onClick={() => setShowUserMenu(s => !s)}
                className="w-full flex items-center gap-2 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-purple-500
                  flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {user?.name?.[0] || '?'}
                </div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="text-xs font-medium text-white truncate">{user?.name}</div>
                  <div className="text-[10px] text-muted truncate">{user?.email}</div>
                </div>
                <span className="text-muted text-xs">{showUserMenu ? '▲' : '▼'}</span>
              </button>

              {showUserMenu && (
                <div className="mt-1 bg-surface border border-border rounded-xl overflow-hidden">
                  <div className="px-3 py-2 border-b border-border">
                    <Badge color={roleBadge(user?.role)}>{user?.role}</Badge>
                  </div>
                  <button onClick={() => { navigate('/settings'); setShowUserMenu(false); }}
                    className="w-full text-left px-3 py-2 text-xs text-muted hover:text-white hover:bg-white/5 transition-colors">
                    ⚙️ Settings
                  </button>
                  <button onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors">
                    ⇥ Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
