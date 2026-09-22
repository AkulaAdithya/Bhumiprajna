/**
 * Bhumi Prajna - Login Page
 * White card on light blue background with India skyline.
 */

import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function IndiaSkylineSmall() {
  return (
    <div className="absolute pointer-events-none overflow-hidden" style={{ bottom: 80, left: 0, right: 0, height: 140 }}>
      <svg viewBox="0 0 1440 140" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" className="block w-full h-full">
        <g fill="#dea179" opacity="0.4">
          <polygon points="0,140 80,60 160,100 240,40 320,85 400,140" />
          <rect x="100" y="75" width="7" height="65" />
          <polygon points="96,75 110,75 103,55" />
          <ellipse cx="190" cy="95" rx="20" ry="10" />
          <rect x="175" y="95" width="30" height="45" />
          <rect x="240" y="50" width="5" height="90" />
          <polygon points="237,50 248,50 242,32" />
          <path d="M660,140 L660,90 Q720,38 780,90 L780,140 Z" />
          <rect x="1100" y="78" width="6" height="62" />
          <polygon points="1097,78 1108,78 1102,58" />
          <ellipse cx="1155" cy="90" rx="22" ry="12" />
          <rect x="1133" y="90" width="44" height="50" />
          <polygon points="1200,140 1300,50 1400,95 1440,75 1440,140" />
        </g>
        <g fill="#b8623a" opacity="0.22">
          <polygon points="0,140 120,85 200,115 300,65 380,105 440,140" />
          <polygon points="1000,140 1100,78 1200,110 1350,58 1440,90 1440,140" />
        </g>
      </svg>
    </div>
  );
}

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      // Error handled by AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{ background: 'linear-gradient(160deg, #fdf8f3 0%, #f5e9dd 55%, #f0e2d0 100%)' }}
    >
      {/* Header */}
      <header className="flex items-center gap-3 px-8 py-4.5 relative z-[1]">
        <Link to="/" className="flex items-center gap-3 no-underline">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[17px] font-extrabold text-white"
            style={{ background: 'var(--color-accent-600)' }}
          >
            प्र
          </div>
          <div>
            <div className="text-[15px] font-semibold leading-tight" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>Bhumi Prajna</div>
            <div className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>Land Acquisition Intelligence Platform</div>
            <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>Government of India</div>
          </div>
        </Link>
      </header>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-5 relative z-[1]">
        <div
          className="w-full bg-white"
          style={{ maxWidth: 440, borderRadius: 'var(--radius-2xl)', boxShadow: 'var(--shadow-lg)', padding: '36px 40px' }}
        >
          {/* Logo */}
          <div className="text-center mb-6">
            <div
              className="rounded-xl flex items-center justify-center text-[22px] font-extrabold text-white mx-auto"
              style={{ width: 52, height: 52, background: 'var(--color-accent-600)', marginBottom: 14 }}
            >
              प्र
            </div>
            <h1 className="text-[22px] font-extrabold m-0" style={{ color: 'var(--color-text-primary)' }}>Officer Login</h1>
            <p className="text-xs mt-1 m-0" style={{ color: 'var(--color-text-secondary)' }}>
              Predictive Land Acquisition Intelligence Platform
            </p>
            <p className="text-xs mt-0.5 m-0" style={{ color: 'var(--color-text-secondary)' }}>Government of India</p>
          </div>

          {error && (
            <div
              className="mb-4 px-3.5 py-2.5 rounded-lg text-[13px]"
              style={{ background: 'var(--risk-critical-bg)', border: '1px solid var(--risk-critical-border)', color: 'var(--risk-critical)' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className="field-label">Official Email / Officer ID</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="officer@bhumiprjna.gov.in"
                  className="field-input"
                  style={{ paddingLeft: 38 }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="mb-6">
              <label htmlFor="password" className="field-label">Password</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-muted)' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="field-input"
                  style={{ paddingLeft: 38, paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer p-0.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {showPwd ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              className="btn btn-primary btn-lg w-full"
              style={{ padding: 12, fontSize: 15 }}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      {/* Skyline */}
      <IndiaSkylineSmall />

      {/* Footer */}
      <footer className="px-10 py-4 relative z-[1]" style={{ background: 'var(--sidebar-bg)', color: 'var(--sidebar-text)' }}>
        <div className="flex items-center justify-between flex-wrap gap-3 text-[11px]">
          <div className="flex items-center gap-2.5">
            <div className="rounded flex items-center justify-center text-xs font-extrabold text-white" style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.1)' }}>प्र</div>
            <div>
              <div className="text-white font-bold text-xs">Bhumi Prajna</div>
              <div>Land Acquisition Intelligence Platform · Government of India</div>
            </div>
          </div>
          <span>&copy; 2025 Bhumi Prajna. Government of India. All rights reserved.</span>
          <div className="flex gap-3.5">
            {['Privacy', 'Terms', 'Help', 'Contact'].map(l => <span key={l} style={{ color: 'var(--sidebar-text)', cursor: 'pointer' }}>{l}</span>)}
          </div>
        </div>
      </footer>
    </div>
  );
}
