import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const [email,    setEmail]    = useState('admin@crmhq.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [showPass, setShowPass] = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const from       = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px]
          bg-brand-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px]
          bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl
            bg-gradient-to-br from-brand-500 to-purple-600 mb-4 shadow-2xl shadow-brand-500/30">
            <span className="text-white text-2xl font-bold">C</span>
          </div>
          <h1 className="text-2xl font-bold text-white">CRM.ai</h1>
          <p className="text-muted text-sm mt-1">Retail Intelligence Platform</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8 shadow-2xl">
          <h2 className="text-white font-semibold text-lg mb-1">Welcome back</h2>
          <p className="text-muted text-sm mb-6">Sign in to your workspace</p>

          {error && (
            <div className="mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/30
              rounded-xl text-sm text-rose-300 flex items-center gap-2">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Email address</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@company.com"
                className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-sm text-white
                  placeholder-muted focus:outline-none focus:border-brand-500 focus:ring-2
                  focus:ring-brand-500/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-muted mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-surface border border-border rounded-xl px-4 py-3 pr-11 text-sm text-white
                    placeholder-muted focus:outline-none focus:border-brand-500 focus:ring-2
                    focus:ring-brand-500/20 transition-all"
                />
                <button type="button" onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-white text-xs transition-colors">
                  {showPass ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-brand-500 to-purple-600 hover:from-brand-600
                hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all
                shadow-lg shadow-brand-500/25 disabled:opacity-60 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in…
                </>
              ) : 'Sign in →'}
            </button>
          </form>

          {/* Demo hint */}
          <div className="mt-5 p-3 bg-brand-500/5 border border-brand-500/20 rounded-xl">
            <p className="text-xs text-brand-300 font-medium mb-1">Demo credentials</p>
            <p className="text-xs text-muted font-mono">ashwani107kumar@gmail.com · Admin@123</p>
          </div>
        </div>

        <p className="text-center text-xs text-muted mt-6">
          Don't have an account?{' '}
          <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}