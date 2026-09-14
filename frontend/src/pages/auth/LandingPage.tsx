/**
 * Bhūmi Prājñā - Landing Page
 * Light government portal style matching reference design.
 * White/light-blue background, India skyline silhouette, dark navy footer.
 */

import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Simple India skyline silhouette as inline SVG
function IndiaSkyline() {
  return (
    <div className="w-full overflow-hidden leading-none" style={{ height: 160 }}>
      <svg viewBox="0 0 1440 160" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', width: '100%', height: '100%' }}>
        {/* Sky gradient behind skyline */}
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </linearGradient>
        </defs>
        <rect width="1440" height="160" fill="url(#skyGrad)" />
        {/* Silhouette — simplified India monuments */}
        <g fill="#93c5fd" opacity="0.55">
          {/* Mountains left */}
          <polygon points="0,160 80,60 160,110 240,40 320,90 400,160" />
          {/* Minaret / tower */}
          <rect x="100" y="80" width="8" height="80" />
          <polygon points="96,80 108,80 104,60" />
          {/* Dome structure */}
          <ellipse cx="190" cy="105" rx="22" ry="12" />
          <rect x="175" y="105" width="30" height="55" />
          {/* Tall minaret */}
          <rect x="240" y="55" width="6" height="105" />
          <polygon points="237,55 249,55 243,35" />
          {/* India Gate-like arch */}
          <rect x="650" y="70" width="140" height="90" fill="none" />
          <path d="M660,160 L660,100 Q720,40 780,100 L780,160 Z" />
          <rect x="680" y="160" width="80" height="5" />
          {/* Right mosque */}
          <rect x="1100" y="80" width="7" height="80" />
          <polygon points="1097,80 1110,80 1103,58" />
          <ellipse cx="1155" cy="95" rx="25" ry="14" />
          <rect x="1130" y="95" width="50" height="65" />
          {/* Right mountain */}
          <polygon points="1200,160 1300,50 1400,100 1440,80 1440,160" />
        </g>
        {/* Slightly darker second layer */}
        <g fill="#60a5fa" opacity="0.3">
          <polygon points="0,160 120,90 200,130 300,70 380,120 440,160" />
          <polygon points="1000,160 1100,85 1200,120 1350,65 1440,100 1440,160" />
        </g>
      </svg>
    </div>
  );
}

const STEPS = [
  { n: 1, label: 'Predict', desc: 'Analyze project data', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
  )},
  { n: 2, label: 'Explain', desc: 'Identify key factors', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
  )},
  { n: 3, label: 'Prioritize', desc: 'Assess risk levels', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>
  )},
  { n: 4, label: 'Intervene', desc: 'Enable proactive action', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
  )},
  { n: 5, label: 'Learn', desc: 'Improve over time', icon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" /></svg>
  )},
];

const FEATURES = [
  { icon: (
    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>
  ), title: 'Data-Driven Governance', sub: 'Transparent & Accountable' },
  { icon: (
    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" /></svg>
  ), title: 'Faster Decision Making', sub: 'Early Risk Detection' },
  { icon: (
    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" /></svg>
  ), title: 'Efficient Resource Use', sub: 'Better Project Outcomes' },
  { icon: (
    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" /></svg>
  ), title: 'Sustainable Development', sub: 'Stronger India' },
];

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f0f4ff', fontFamily: 'Inter, sans-serif' }}>
      {/* Top navbar */}
      <header style={{
        background: 'white',
        borderBottom: '1px solid #e2e8f0',
        padding: '0 32px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 8,
            background: '#1d4ed8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: 'white',
          }}>
            प्र
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.2 }}>Bhūmi Prājñā</div>
            <div style={{ fontSize: 11, color: '#64748b', lineHeight: 1 }}>Land Acquisition Intelligence Platform</div>
          </div>
        </div>
        <Link
          to="/login"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '9px 20px', borderRadius: 8,
            background: '#1d4ed8', color: 'white',
            fontSize: 14, fontWeight: 600, textDecoration: 'none',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#1e40af'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#1d4ed8'}
        >
          <svg style={{ width: 16, height: 16 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
          Officer Login
        </Link>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '60px 24px 0' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 14px', borderRadius: 999,
          background: 'rgba(219,234,254,0.7)', border: '1px solid #bfdbfe',
          fontSize: 12, fontWeight: 500, color: '#1d4ed8',
          marginBottom: 24,
        }}>
          <svg style={{ width: 14, height: 14 }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
          </svg>
          Predictive Analytics for Government
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 48, fontWeight: 800, color: '#0f2144', textAlign: 'center', lineHeight: 1.15, margin: 0, maxWidth: 720 }}>
          Predictive Land Acquisition{' '}
          <span style={{ color: '#1d4ed8' }}>Intelligence Platform</span>
        </h1>

        {/* Sub */}
        <p style={{ fontSize: 16, color: '#475569', textAlign: 'center', maxWidth: 560, lineHeight: 1.7, margin: '20px 0 36px' }}>
          Early detection of land acquisition delays through predictive analytics.
          The system analyzes project progress to identify risk factors before they cause
          delays, enabling proactive intervention by authorized officers.
        </p>

        {/* CTA */}
        <Link
          to="/login"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '14px 32px', borderRadius: 10,
            background: '#1d4ed8', color: 'white',
            fontSize: 15, fontWeight: 700, textDecoration: 'none',
            boxShadow: '0 4px 20px rgba(29,78,216,0.35)',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#1e40af'; el.style.boxShadow = '0 6px 24px rgba(29,78,216,0.45)'; }}
          onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.background = '#1d4ed8'; el.style.boxShadow = '0 4px 20px rgba(29,78,216,0.35)'; }}
        >
          Access Dashboard
          <svg style={{ width: 18, height: 18 }} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
          </svg>
        </Link>

        {/* 5-step pipeline */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 0,
          marginTop: 56, width: '100%', maxWidth: 860, flexWrap: 'wrap', justifyContent: 'center',
        }}>
          {STEPS.map((step, i) => (
            <div key={step.n} style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{
                background: 'white', border: '1px solid #e2e8f0', borderRadius: 12,
                padding: '18px 20px', textAlign: 'center', minWidth: 130,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#1d4ed8', color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, margin: '0 auto 10px',
                }}>
                  {step.n}
                </div>
                <div style={{ color: '#1d4ed8', marginBottom: 6, display: 'flex', justifyContent: 'center' }}>{step.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2144' }}>{step.label}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{step.desc}</div>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ color: '#93c5fd', fontSize: 22, margin: '0 6px', fontWeight: 300 }}>→</div>
              )}
            </div>
          ))}
        </div>

        {/* Feature tiles */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24,
          marginTop: 48, width: '100%', maxWidth: 900,
        }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: '#dbeafe', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {f.icon}
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#0f2144' }}>{f.title}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{f.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Skyline */}
      <div style={{ marginTop: 40 }}>
        <IndiaSkyline />
      </div>

      {/* Footer */}
      <footer style={{ background: '#0f2144', color: '#94a3b8', padding: '20px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 6,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 15, fontWeight: 800, color: 'white',
            }}>प्र</div>
            <div>
              <div style={{ color: 'white', fontSize: 14, fontWeight: 700 }}>Bhūmi Prājñā</div>
              <div style={{ fontSize: 11 }}>Land Acquisition Intelligence Platform · Government of India</div>
            </div>
          </div>
          <div style={{ fontSize: 11 }}>
            © 2025 Bhūmi Prājñā. Government of India. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#cbd5e1' }}>
            {['Privacy', 'Terms', 'Help', 'Contact'].map(l => (
              <span key={l} style={{ cursor: 'pointer' }}>{l}</span>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
