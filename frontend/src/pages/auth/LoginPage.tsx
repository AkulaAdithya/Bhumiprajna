/**
 * Bhūmi Prājñā - Login Page
 * White card on light blue background with India skyline.
 * Matches approved login-page-reference.png design.
 */

import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

function IndiaSkylineSmall() {
  return (
    <div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, pointerEvents: 'none', overflow: 'hidden', height: 140 }}>
      <svg viewBox="0 0 1440 140" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', width: '100%', height: '100%' }}>
        <g fill="#93c5fd" opacity="0.45">
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
        <g fill="#60a5fa" opacity="0.25">
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #eff6ff 0%, #dbeafe 50%, #e0f2fe 100%)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Inter, sans-serif', position: 'relative',
    }}>
      {/* Header */}
      <header style={{
        padding: '18px 32px', display: 'flex', alignItems: 'center', gap: 12,
        position: 'relative', zIndex: 1,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: '#1d4ed8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, fontWeight: 800, color: 'white',
          }}>
            प्र
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Bhūmi Prājñā</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>Land Acquisition Intelligence Platform</div>
            <div style={{ fontSize: 10, color: '#94a3b8' }}>Government of India</div>
          </div>
        </Link>
      </header>

      {/* Card */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '20px 16px', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          background: 'white', borderRadius: 16,
          boxShadow: '0 4px 32px rgba(0,0,0,0.12)',
          padding: '36px 40px', width: '100%', maxWidth: 440,
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 12, background: '#1d4ed8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: 'white', margin: '0 auto 14px',
            }}>
              प्र
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', margin: 0 }}>Officer Login</h1>
            <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>
              Predictive Land Acquisition Intelligence Platform
            </p>
            <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>Government of India</p>
          </div>

          {error && (
            <div style={{
              marginBottom: 16, padding: '10px 14px', borderRadius: 8,
              background: '#fef2f2', border: '1px solid #fecaca',
              fontSize: 13, color: '#dc2626',
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Official Email / Officer ID
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
                  style={{
                    width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 10, paddingBottom: 10,
                    border: '1.5px solid #d1d5db', borderRadius: 8,
                    fontSize: 14, color: '#111827', background: 'white',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#1d4ed8'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#d1d5db'}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                  <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
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
                  style={{
                    width: '100%', paddingLeft: 38, paddingRight: 40, paddingTop: 10, paddingBottom: 10,
                    border: '1.5px solid #d1d5db', borderRadius: 8,
                    fontSize: 14, color: '#111827', background: 'white',
                    outline: 'none', boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => (e.target as HTMLInputElement).style.borderColor = '#1d4ed8'}
                  onBlur={e => (e.target as HTMLInputElement).style.borderColor = '#d1d5db'}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2,
                  }}
                >
                  {showPwd ? (
                    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                    </svg>
                  ) : (
                    <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting || isLoading}
              style={{
                width: '100%', padding: '12px',
                background: submitting ? '#93c5fd' : '#1d4ed8', color: 'white',
                border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 700,
                cursor: submitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s',
              }}
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>

            {/* Demo accounts */}
          </form>
        </div>
      </div>

      {/* Skyline */}
      <IndiaSkylineSmall />

      {/* Footer */}
      <footer style={{ background: '#0f2144', color: '#94a3b8', padding: '16px 40px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 5, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white' }}>प्र</div>
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>Bhūmi Prājñā</div>
              <div>Land Acquisition Intelligence Platform · Government of India</div>
            </div>
          </div>
          <span>&copy; 2025 Bhūmi Prājñā. Government of India. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 14 }}>
            {['Privacy', 'Terms', 'Help', 'Contact'].map(l => <span key={l} style={{ color: '#cbd5e1', cursor: 'pointer' }}>{l}</span>)}
          </div>
        </div>
      </footer>
    </div>
  );
}
