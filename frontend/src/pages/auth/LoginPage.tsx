/**
 * Bhumi Prajna - Login Page
 * Split layout: Indian-inspired illustration panel (left), officer login card (right).
 * Role and jurisdiction come from the authenticated account — never chosen here.
 */

import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BrandStyles, Wordmark, JaaliPattern, MotifDivider, RiskMapPreview, RiskLegend, Icon, ICONS } from './authBrand';

export default function LoginPage() {
  const { login, isAuthenticated, isLoading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showResetHelp, setShowResetHelp] = useState(false);

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
    <div className="bp min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      <BrandStyles />

      {/* ── Left: illustration panel ── */}
      <aside
        className="relative overflow-hidden hidden lg:flex flex-col justify-between"
        style={{ background: '#F2F0E8', borderRight: '1px solid var(--bp-border)', padding: '32px 48px' }}
      >
        <JaaliPattern id="bp-login-jaali" opacity={0.06} />

        <Link to="/" className="relative self-start" aria-label="Back to Bhumi Prajna home">
          <Wordmark />
        </Link>

        <div className="relative flex-1 flex flex-col items-center justify-center" style={{ padding: "24px 0" }}>
          <div className="bp-card" style={{ width: '100%', maxWidth: 440, padding: 12 }}>
            <RiskMapPreview height={340} />
            <div style={{ padding: '10px 4px 2px' }}>
              <RiskLegend />
            </div>
          </div>
          <div className="text-center" style={{ maxWidth: 420, marginTop: 24 }}>
            <h2 style={{ fontSize: 22 }}>Indian land intelligence, powered by modern AI</h2>
            <MotifDivider />
            <p className="bp-muted" style={{ fontSize: 14 }}>
              Identify emerging land-acquisition risk early, understand its causes, and prioritise timely intervention.
            </p>
          </div>
        </div>

      </aside>

      {/* ── Right: login ── */}
      <main className="flex flex-col" style={{ padding: '24px' }}>
        <div className="flex items-center justify-between">
          <Link to="/" className="lg:hidden" aria-label="Back to Bhumi Prajna home">
            <Wordmark compact />
          </Link>
          <Link to="/" className="bp-nav-link inline-flex items-center gap-1.5 ml-auto" style={{ fontSize: 13 }}>
            <span style={{ transform: 'rotate(180deg)', display: 'inline-flex' }}><Icon d={ICONS.arrowRight} size={15} /></span>
            Back to overview
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center" style={{ padding: '32px 0' }}>
          <div className="bp-card w-full relative overflow-hidden" style={{ maxWidth: 420, padding: '36px 36px 32px' }}>
            <span
              aria-hidden="true"
              className="absolute top-0 left-0 right-0"
              style={{ height: 3, background: 'linear-gradient(90deg, #D97706 0%, #D97706 33%, #183153 33%, #183153 67%, #3F7D58 67%)', opacity: 0.85 }}
            />

            <h1 style={{ fontSize: 26 }}>Officer Login</h1>
            <p className="bp-muted" style={{ fontSize: 14, marginTop: 6 }}>
              Sign in with your official credentials to access Bhumi Prajna.
            </p>

            {error && (
              <div
                role="alert"
                className="flex gap-2.5"
                style={{ marginTop: 20, padding: '10px 12px', borderRadius: 10, fontSize: 13, background: '#FAEDED', border: '1px solid #EDCFCF', color: 'var(--bp-critical)' }}
              >
                <span style={{ flexShrink: 0, marginTop: 1 }}><Icon d={ICONS.info} size={16} /></span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
              <div style={{ marginBottom: 18 }}>
                <label htmlFor="email" className="bp-field-label">Official Email / Officer ID</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 flex" style={{ color: '#98A2B3' }}>
                    <Icon d={ICONS.mail} size={17} />
                  </span>
                  <input
                    id="email"
                    type="text"
                    autoComplete="username"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="name@department.gov.in"
                    className="bp-input"
                  />
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label htmlFor="password" className="bp-field-label">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 flex" style={{ color: '#98A2B3' }}>
                    <Icon d={ICONS.lock} size={17} />
                  </span>
                  <input
                    id="password"
                    type={showPwd ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="Enter your password"
                    className="bp-input"
                    style={{ paddingRight: 44 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                    aria-pressed={showPwd}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center"
                    style={{ width: 32, height: 32, background: 'none', border: 'none', cursor: 'pointer', color: '#667085', borderRadius: 8 }}
                  >
                    <Icon d={showPwd ? ICONS.eyeOff : ICONS.eye} size={17} />
                  </button>
                </div>
              </div>

              <div className="flex justify-end" style={{ marginBottom: 22 }}>
                <button
                  type="button"
                  className="bp-link-btn"
                  aria-expanded={showResetHelp}
                  aria-controls="bp-reset-help"
                  onClick={() => setShowResetHelp(v => !v)}
                >
                  Forgot Password?
                </button>
              </div>

              {showResetHelp && (
                <div
                  id="bp-reset-help"
                  style={{ marginTop: -8, marginBottom: 20, padding: '10px 12px', borderRadius: 10, fontSize: 13, background: 'var(--bp-bg)', border: '1px solid var(--bp-border)', color: 'var(--bp-text)' }}
                >
                  For security, passwords are reset by your department's system administrator.
                  Please contact them with your Officer ID.
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || isLoading}
                className="bp-btn bp-btn-primary bp-btn-block"
                style={{ padding: '13px 20px', fontSize: 15 }}
              >
                {submitting ? 'Signing in…' : 'Sign In'}
              </button>
            </form>

            <p className="bp-muted flex items-start gap-2" style={{ fontSize: 12, marginTop: 24, paddingTop: 18, borderTop: '1px solid var(--bp-border)' }}>
              <span style={{ flexShrink: 0, marginTop: 1 }}><Icon d={ICONS.shield} size={14} /></span>
              Authorised government use only. Your role and jurisdiction are assigned to your account.
            </p>
          </div>
        </div>

        <p className="bp-muted text-center" style={{ fontSize: 12 }}>
          Bhumi Prajna supports—not replaces—official judgement.
        </p>
      </main>
    </div>
  );
}
