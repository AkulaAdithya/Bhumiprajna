/**
 * Bhumi Prajna - Landing Page
 * Public product overview: hero, approach comparison, capabilities,
 * process, analysed factors, GIS + explainability previews, technology,
 * impact, governance and final call to action.
 */

import { Fragment } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  BrandStyles, Wordmark, JaaliPattern, MotifDivider, RiskMapPreview, RiskLegend, Icon, ICONS,
} from './authBrand';

const NAV = [
  { href: '#overview', label: 'Overview' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#technology', label: 'Technology' },
  { href: '#impact', label: 'Impact' },
];

const CURRENT_FLOW = ['Monitor', 'Detect issue', 'Delay becomes visible', 'React'];
const BP_FLOW = ['Monitor', 'Predict risk', 'Understand cause', 'Prioritize', 'Intervene'];

const CAPABILITIES = [
  { icon: ICONS.trend, title: 'Predictive Risk', desc: 'Identify projects with elevated delay risk.' },
  { icon: ICONS.bulb, title: 'Explainable AI', desc: 'Understand the factors contributing to the prediction.' },
  { icon: ICONS.layers, title: 'Project Prioritization', desc: 'Focus attention on high-risk projects first.' },
  { icon: ICONS.map, title: 'GIS Intelligence', desc: 'Explore project risk spatially across India.' },
  { icon: ICONS.bell, title: 'Smart Alerts', desc: 'Surface important changes and emerging risks.' },
  { icon: ICONS.shield, title: 'Audit & Governance', desc: 'Maintain role-based access and project history.' },
];

const PROCESS = [
  { icon: ICONS.database, label: 'Project Data', desc: 'Stage-wise progress records' },
  { icon: ICONS.cpu, label: 'AI Analysis', desc: 'Pattern learning on history' },
  { icon: ICONS.gauge, label: 'Risk Prediction', desc: 'Delay likelihood per project' },
  { icon: ICONS.info, label: 'Explanation', desc: 'Contributing factors' },
  { icon: ICONS.layers, label: 'Prioritization', desc: 'Ranked attention list' },
  { icon: ICONS.target, label: 'Intervention', desc: 'Officer-led action' },
];

const FACTORS = [
  { icon: ICONS.stamp, label: 'Approvals' },
  { icon: ICONS.rupee, label: 'Compensation' },
  { icon: ICONS.scale, label: 'Legal Disputes' },
  { icon: ICONS.file, label: 'Documentation' },
  { icon: ICONS.user, label: 'Ownership' },
  { icon: ICONS.megaphone, label: 'Notifications' },
  { icon: ICONS.home, label: 'R&R' },
  { icon: ICONS.flag, label: 'Possession' },
  { icon: ICONS.users, label: 'Stakeholder Responsiveness' },
  { icon: ICONS.link, label: 'Coordination' },
  { icon: ICONS.history, label: 'Historical Patterns' },
];

const SHAP_SAMPLE = [
  { label: 'Legal disputes', value: 0.8 },
  { label: 'Compensation lag', value: 0.6 },
  { label: 'Pending approvals', value: 0.5 },
];

const TECH = [
  { name: 'React + TypeScript', role: 'Officer interface' },
  { name: 'FastAPI', role: 'Secure service layer' },
  { name: 'ML / SHAP', role: 'Prediction & explanation' },
  { name: 'PostgreSQL + PostGIS', role: 'Project & spatial data' },
  { name: 'GIS / Analytics', role: 'Maps, trends, reports' },
];

const IMPACT = [
  { icon: ICONS.clock, label: 'Earlier risk visibility' },
  { icon: ICONS.layers, label: 'Better prioritization' },
  { icon: ICONS.info, label: 'Explainable decisions' },
  { icon: ICONS.map, label: 'Spatial awareness' },
  { icon: ICONS.eye, label: 'Improved monitoring' },
  { icon: ICONS.history, label: 'Auditability' },
  { icon: ICONS.expand, label: 'Scalable integration' },
];

const GOVERNANCE = [
  { icon: ICONS.lock, title: 'Role-Based Access', desc: 'Officers see only the projects within their assigned jurisdiction.' },
  { icon: ICONS.refresh, title: 'Data Freshness', desc: 'Every prediction shows when its underlying data was last updated.' },
  { icon: ICONS.gauge, title: 'Confidence Indicators', desc: 'Estimates carry a confidence level, so uncertainty is never hidden.' },
  { icon: ICONS.history, title: 'Audit History', desc: 'Updates, predictions and actions are recorded for later review.' },
  { icon: ICONS.users, title: 'Human-in-the-Loop', desc: 'The system recommends; authorised officers decide.' },
];

function SectionHeader({ eyebrow, title, lead, center = true }: { eyebrow: string; title: string; lead?: string; center?: boolean }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', maxWidth: center ? 680 : undefined, margin: center ? '0 auto 48px' : '0 0 32px' }}>
      <span className="bp-eyebrow">{eyebrow}</span>
      <h2 style={{ marginTop: 12 }}>{title}</h2>
      <MotifDivider align={center ? 'center' : 'left'} />
      {lead && <p className="bp-lead">{lead}</p>}
    </div>
  );
}

function FlowArrow() {
  return (
    <span aria-hidden="true" style={{ color: '#B4AE9F', display: 'inline-flex' }}>
      <Icon d={ICONS.arrowRight} size={16} />
    </span>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="bp min-h-screen">
      <BrandStyles />

      {/* ── Navbar ── */}
      <header
        className="sticky top-0 z-20"
        style={{ background: 'rgba(248,247,242,0.92)', backdropFilter: 'blur(8px)', borderBottom: '1px solid var(--bp-border)' }}
      >
        <div className="bp-container flex items-center justify-between" style={{ height: 68 }}>
          <a href="#top" aria-label="Bhumi Prajna home"><Wordmark /></a>
          <nav aria-label="Primary" className="hidden lg:flex items-center gap-1">
            {NAV.map(n => (
              <a key={n.href} href={n.href} className="bp-nav-link">{n.label}</a>
            ))}
          </nav>
          <Link to="/login" className="bp-btn bp-btn-primary bp-btn-sm">
            <Icon d={ICONS.login} size={16} />
            Officer Login
          </Link>
        </div>
      </header>

      <main id="top">
        {/* ── Hero ── */}
        <section className="relative overflow-hidden" style={{ borderBottom: '1px solid var(--bp-border)' }}>
          <JaaliPattern id="bp-hero-jaali" opacity={0.05} />
          <div className="bp-container relative grid lg:grid-cols-[1.05fr_1fr] gap-12 items-center" style={{ padding: '72px 24px 80px' }}>
            <div>
              <span className="bp-eyebrow">Decision support for land acquisition</span>
              <h1 style={{ marginTop: 16, maxWidth: 580 }}>
                Predict Land Acquisition Risk Before Delays Become Critical
              </h1>
              <p className="bp-lead" style={{ marginTop: 20, maxWidth: 540 }}>
                Bhumi Prajna transforms project data into explainable risk insights, helping authorities
                identify emerging bottlenecks, prioritize intervention, and make evidence-based decisions.
              </p>
              <div className="flex flex-wrap gap-3" style={{ marginTop: 32 }}>
                <Link to="/login" className="bp-btn bp-btn-primary">
                  <Icon d={ICONS.login} size={17} />
                  Officer Login
                </Link>
                <a href="#overview" className="bp-btn bp-btn-secondary">
                  Explore Platform
                  <Icon d={ICONS.arrowRight} size={17} />
                </a>
              </div>
              <div className="flex flex-wrap gap-x-6 gap-y-2" style={{ marginTop: 36, fontSize: 13, color: 'var(--bp-text-2)' }}>
                {['Explainable predictions', 'Jurisdiction-based access', 'Officer-led decisions'].map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5">
                    <span style={{ color: 'var(--bp-green)' }}><Icon d={ICONS.check} size={15} /></span>
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Hero visual */}
            <div className="relative mx-auto w-full" style={{ maxWidth: 520 }}>
              <div className="bp-card relative" style={{ padding: '28px 28px 20px' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--bp-navy)' }}>National risk view</span>
                  <span className="bp-badge bp-badge-demo">Illustrative</span>
                </div>
                <RiskMapPreview height={400} />
                <div style={{ paddingTop: 14 }}>
                  <RiskLegend />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── Overview ── */}
        <section id="overview" className="bp-section" style={{ scrollMarginTop: 68 }}>
          <div className="bp-container">
            <SectionHeader
              eyebrow="Overview"
              title="From Reactive Monitoring to Proactive Decision Support"
              lead="Delays in land acquisition usually become visible only after they have already affected timelines. Bhumi Prajna shifts attention earlier in the process."
            />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bp-card" style={{ padding: 28, background: '#FBFAF7' }}>
                <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                  <h3 style={{ color: 'var(--bp-text-2)' }}>Current approach</h3>
                  <span className="bp-badge bp-badge-demo">Reactive</span>
                </div>
                <ol className="flex flex-wrap items-center gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {CURRENT_FLOW.map((s, i) => (
                    <Fragment key={s}>
                      <li style={{ fontSize: 14, padding: '8px 14px', borderRadius: 999, border: '1px dashed #CFC9BB', color: 'var(--bp-text-2)', background: '#fff' }}>
                        {s}
                      </li>
                      {i < CURRENT_FLOW.length - 1 && <FlowArrow />}
                    </Fragment>
                  ))}
                </ol>
                <p className="bp-muted" style={{ fontSize: 14, marginTop: 20 }}>
                  Issues are acted on once they are already causing delay.
                </p>
              </div>

              <div className="bp-card relative overflow-hidden" style={{ padding: 28, borderColor: '#C9D3E0' }}>
                <span aria-hidden="true" className="absolute left-0 top-0 bottom-0" style={{ width: 4, background: 'linear-gradient(180deg, #D97706, #3F7D58)' }} />
                <div className="flex items-center justify-between" style={{ marginBottom: 20 }}>
                  <h3>Bhumi Prajna</h3>
                  <span className="bp-badge bp-badge-low">Proactive</span>
                </div>
                <ol className="flex flex-wrap items-center gap-2" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {BP_FLOW.map((s, i) => (
                    <Fragment key={s}>
                      <li
                        style={{
                          fontSize: 14, fontWeight: 500, padding: '8px 14px', borderRadius: 999,
                          background: i === 1 ? 'var(--bp-navy)' : '#EEF2F7',
                          color: i === 1 ? '#fff' : 'var(--bp-navy)',
                        }}
                      >
                        {s}
                      </li>
                      {i < BP_FLOW.length - 1 && <FlowArrow />}
                    </Fragment>
                  ))}
                </ol>
                <p className="bp-muted" style={{ fontSize: 14, marginTop: 20 }}>
                  Emerging risk is flagged, explained and ranked while there is still time to intervene.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Capabilities ── */}
        <section id="capabilities" className="bp-section bp-section-alt" style={{ scrollMarginTop: 68 }}>
          <div className="bp-container">
            <SectionHeader eyebrow="Core capabilities" title="What Officers Can Do With Bhumi Prajna" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {CAPABILITIES.map(c => (
                <div key={c.title} className="bp-card" style={{ padding: 24 }}>
                  <span className="bp-icon-tile"><Icon d={c.icon} /></span>
                  <h3 style={{ marginTop: 16 }}>{c.title}</h3>
                  <p className="bp-muted" style={{ fontSize: 14, marginTop: 6 }}>{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how-it-works" className="bp-section" style={{ scrollMarginTop: 68 }}>
          <div className="bp-container">
            <SectionHeader eyebrow="How it works" title="From Project Data to Timely Intervention" />
            <ol className="relative grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              <span
                aria-hidden="true"
                className="hidden lg:block absolute"
                style={{ top: 28, left: '8%', right: '8%', height: 0, borderTop: '1.5px dashed #D2CCBE' }}
              />
              {PROCESS.map((p, i) => (
                <li key={p.label} className="relative flex lg:flex-col items-center lg:text-center gap-4 lg:gap-3">
                  <span
                    className="relative flex items-center justify-center flex-shrink-0"
                    style={{
                      width: 56, height: 56, borderRadius: 14,
                      background: i === PROCESS.length - 1 ? 'var(--bp-navy)' : '#fff',
                      color: i === PROCESS.length - 1 ? '#fff' : 'var(--bp-navy)',
                      border: '1px solid var(--bp-border)', boxShadow: 'var(--bp-shadow)',
                    }}
                  >
                    <Icon d={p.icon} size={22} />
                    <span
                      className="absolute flex items-center justify-center"
                      style={{ top: -8, right: -8, width: 22, height: 22, borderRadius: 999, background: 'var(--bp-saffron)', color: '#fff', fontSize: 11, fontWeight: 700 }}
                    >
                      {i + 1}
                    </span>
                  </span>
                  <span className="flex flex-col">
                    <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bp-navy)' }}>{p.label}</span>
                    <span className="bp-muted" style={{ fontSize: 13 }}>{p.desc}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ── What the platform analyzes ── */}
        <section className="bp-section bp-section-alt">
          <div className="bp-container">
            <SectionHeader eyebrow="Inputs" title="What the Platform Analyzes" />
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {FACTORS.map(f => (
                <li key={f.label} className="bp-card flex items-center gap-3" style={{ padding: '14px 16px', boxShadow: 'none' }}>
                  <span className="bp-icon-tile" style={{ width: 36, height: 36 }}><Icon d={f.icon} size={18} /></span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--bp-text)' }}>{f.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── GIS preview ── */}
        <section className="bp-section">
          <div className="bp-container grid lg:grid-cols-[0.85fr_1.15fr] gap-12 items-center">
            <div>
              <SectionHeader
                center={false}
                eyebrow="GIS intelligence"
                title="See Risk Where It Matters"
                lead="Every project is placed on the map with its current risk level, so regional clusters and bottlenecks are visible at a glance."
              />
              <ul className="flex flex-col gap-3" style={{ listStyle: 'none', margin: 0, padding: 0, fontSize: 14 }}>
                {['State and district boundaries', 'Project clusters by region', 'Colour-coded markers with plain-language labels', 'Heatmap view for concentration'].map(t => (
                  <li key={t} className="flex items-center gap-2.5">
                    <span style={{ color: 'var(--bp-green)' }}><Icon d={ICONS.check} size={16} /></span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bp-card" style={{ padding: 20 }}>
              <div className="flex items-center justify-between flex-wrap gap-2" style={{ padding: '0 4px 12px', borderBottom: '1px solid var(--bp-border)' }}>
                <span className="inline-flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600, color: 'var(--bp-navy)' }}>
                  <Icon d={ICONS.map} size={16} /> Project risk map
                </span>
                <span className="bp-badge bp-badge-demo">Conceptual preview · sample data</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <RiskMapPreview height={460} />
                <div className="flex items-center flex-wrap gap-x-4 gap-y-2" style={{ paddingTop: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--bp-text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Marker colour = predicted risk
                  </span>
                  <RiskLegend />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── AI explanation preview ── */}
        <section className="bp-section bp-section-alt">
          <div className="bp-container grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center">
            <div className="bp-card order-2 lg:order-1" style={{ padding: 28 }}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--bp-text-2)' }}>Project</div>
                  <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--bp-navy)', marginTop: 2 }}>Example Infrastructure Project</div>
                </div>
                <span className="bp-badge bp-badge-demo">Sample data — for illustration</span>
              </div>

              <div className="grid grid-cols-2 gap-4" style={{ marginTop: 20 }}>
                <div style={{ padding: 16, borderRadius: 10, background: '#FAEDED', border: '1px solid #EDCFCF' }}>
                  <div style={{ fontSize: 12, color: 'var(--bp-text-2)' }}>Risk</div>
                  <div className="flex items-baseline gap-2" style={{ marginTop: 4 }}>
                    <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--bp-critical)' }}>78%</span>
                    <span className="bp-badge bp-badge-high">
                      <svg width="9" height="9" viewBox="0 0 12 12" aria-hidden="true"><path d="M6 0.5 L11.5 11 L0.5 11 Z" fill="currentColor" /></svg>
                      High
                    </span>
                  </div>
                </div>
                <div style={{ padding: 16, borderRadius: 10, background: 'var(--bp-bg)', border: '1px solid var(--bp-border)' }}>
                  <div style={{ fontSize: 12, color: 'var(--bp-text-2)' }}>Next critical stage</div>
                  <div className="flex items-center gap-2" style={{ marginTop: 8, fontSize: 16, fontWeight: 600, color: 'var(--bp-navy)' }}>
                    <Icon d={ICONS.flag} size={17} /> Possession
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--bp-text)', marginBottom: 12 }}>Top contributing factors</div>
                <ul className="flex flex-col gap-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {SHAP_SAMPLE.map(f => (
                    <li key={f.label} className="grid items-center gap-3" style={{ gridTemplateColumns: '150px 1fr' }}>
                      <span style={{ fontSize: 14, color: 'var(--bp-text)' }}>{f.label}</span>
                      <span style={{ height: 10, borderRadius: 999, background: '#F1EEE6' }}>
                        <span
                          style={{
                            display: 'block', height: '100%', width: `${f.value * 100}%`, borderRadius: 999,
                            background: 'linear-gradient(90deg, #C98080, #B54747)',
                          }}
                        />
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3" style={{ marginTop: 24, padding: 16, borderRadius: 10, background: 'var(--bp-saffron-soft)', border: '1px solid #F2DDBD' }}>
                <span style={{ color: '#B25F04', flexShrink: 0, marginTop: 1 }}><Icon d={ICONS.target} size={18} /></span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#7A4203' }}>Recommended focus</div>
                  <div style={{ fontSize: 14, color: 'var(--bp-text)', marginTop: 2 }}>Resolve oldest pending legal and compensation cases.</div>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <SectionHeader
                center={false}
                eyebrow="Explainable AI"
                title="Every Prediction Comes With a Reason"
                lead="Officers see not just a risk score, but the specific factors driving it and where to focus first — making each recommendation easy to verify, discuss and act on."
              />
            </div>
          </div>
        </section>

        {/* ── Technology ── */}
        <section id="technology" className="bp-section" style={{ scrollMarginTop: 68 }}>
          <div className="bp-container grid lg:grid-cols-2 gap-12 items-center">
            <SectionHeader
              center={false}
              eyebrow="Technology"
              title="Built on a Dependable, Open Stack"
              lead="A layered architecture that keeps the officer interface, prediction service and spatial data cleanly separated — ready to integrate with existing state and central systems."
            />
            <ol className="flex flex-col items-stretch mx-auto w-full" style={{ listStyle: 'none', margin: 0, padding: 0, maxWidth: 440 }}>
              {TECH.map((t, i) => (
                <Fragment key={t.name}>
                  <li
                    className="bp-card flex items-center justify-between gap-4"
                    style={{ padding: '14px 18px', boxShadow: 'none', borderLeft: `3px solid ${i === 2 ? 'var(--bp-saffron)' : 'var(--bp-navy)'}` }}
                  >
                    <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--bp-navy)' }}>{t.name}</span>
                    <span className="bp-muted" style={{ fontSize: 13, textAlign: 'right' }}>{t.role}</span>
                  </li>
                  {i < TECH.length - 1 && (
                    <li aria-hidden="true" className="flex justify-center" style={{ color: '#B4AE9F', padding: '4px 0' }}>
                      <svg width="12" height="16" viewBox="0 0 12 16"><path d="M6 0v14M1 9l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
                    </li>
                  )}
                </Fragment>
              ))}
            </ol>
          </div>
        </section>

        {/* ── Impact ── */}
        <section id="impact" className="bp-section bp-section-alt" style={{ scrollMarginTop: 68 }}>
          <div className="bp-container">
            <SectionHeader eyebrow="Impact" title="Supporting Earlier, Better-Informed Decisions" />
            <ul className="flex flex-wrap justify-center gap-3" style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {IMPACT.map(i => (
                <li
                  key={i.label}
                  className="bp-card inline-flex items-center gap-2.5"
                  style={{ padding: '12px 18px', borderRadius: 999, boxShadow: 'none', fontSize: 14, fontWeight: 500 }}
                >
                  <span style={{ color: 'var(--bp-green)' }}><Icon d={i.icon} size={18} /></span>
                  {i.label}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── Trust / governance ── */}
        <section className="bp-section">
          <div className="bp-container">
            <SectionHeader
              eyebrow="Trust & governance"
              title="Designed for Accountable Public Decisions"
              lead="Safeguards are built in, so that predictions remain transparent, traceable and subject to official review."
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {GOVERNANCE.map(g => (
                <div key={g.title} className="bp-card" style={{ padding: 20, boxShadow: 'none' }}>
                  <span style={{ color: 'var(--bp-navy)' }}><Icon d={g.icon} size={22} /></span>
                  <h3 style={{ fontSize: 16, marginTop: 12 }}>{g.title}</h3>
                  <p className="bp-muted" style={{ fontSize: 13, marginTop: 6 }}>{g.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section style={{ padding: '0 0 88px' }}>
          <div className="bp-container">
            <div className="relative overflow-hidden text-center" style={{ background: 'var(--bp-navy)', borderRadius: 16, padding: '56px 24px' }}>
              <JaaliPattern id="bp-cta-jaali" opacity={0.08} color="#fff" />
              <div className="relative">
                <h2 style={{ color: '#fff' }}>Make Risk Visible Before It Becomes Delay</h2>
                <div style={{ marginTop: 28 }}>
                  <Link to="/login" className="bp-btn" style={{ background: '#fff', color: 'var(--bp-navy)' }}>
                    <Icon d={ICONS.login} size={17} />
                    Officer Login
                  </Link>
                </div>
                <p style={{ marginTop: 20, fontSize: 13, color: '#C4CEDB', maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
                  Bhumi Prajna is a decision-support system designed to support—not replace—official judgement.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer style={{ borderTop: '1px solid var(--bp-border)', background: '#F2F0E8' }}>
        <div className="bp-container flex flex-col md:flex-row items-center justify-between gap-4" style={{ padding: '28px 24px' }}>
          <Wordmark compact />
          <p className="bp-muted text-center" style={{ fontSize: 12 }}>
            Predictive Land Acquisition Intelligence &amp; Early-Intervention Decision Support Platform
          </p>
          <p className="bp-muted" style={{ fontSize: 12 }}>© {new Date().getFullYear()} Bhumi Prajna</p>
        </div>
      </footer>
    </div>
  );
}
