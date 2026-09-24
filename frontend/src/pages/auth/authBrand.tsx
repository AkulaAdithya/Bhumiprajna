/**
 * Bhumi Prajna - Public page brand kit
 * Scoped styles, wordmark, motifs and the India risk map preview
 * shared by the Landing and Login pages only. Everything is prefixed
 * `bp-` so it never leaks into the authenticated app.
 */

import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { riskPinIcon } from '../../components/shared/riskPin';

export const BRAND_CSS = `
.bp {
  --bp-navy: #183153;
  --bp-navy-soft: #24406a;
  --bp-saffron: #D97706;
  --bp-saffron-soft: #FDF3E4;
  --bp-green: #3F7D58;
  --bp-green-soft: #EDF5EF;
  --bp-bg: #F8F7F2;
  --bp-bg-alt: #F2F0E8;
  --bp-card: #FFFFFF;
  --bp-border: #E5E1D8;
  --bp-text: #243244;
  --bp-text-2: #667085;
  --bp-success: #3F7D58;
  --bp-warning: #C88719;
  --bp-danger: #B54747;
  --bp-critical: #8F2D2D;
  --bp-shadow: 0 1px 2px rgba(24,49,83,0.04), 0 4px 16px rgba(24,49,83,0.05);
  font-family: 'Inter', 'Noto Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: var(--bp-bg);
  color: var(--bp-text);
  font-size: 15px;
  line-height: 1.6;
}
.bp h1, .bp h2, .bp h3, .bp h4 {
  font-family: 'Inter', 'Noto Sans', sans-serif;
  color: var(--bp-navy);
  letter-spacing: -0.015em;
  margin: 0;
}
.bp h1 { font-size: clamp(30px, 3.4vw, 42px); font-weight: 700; line-height: 1.18; }
.bp h2 { font-size: clamp(24px, 2.4vw, 30px); font-weight: 700; line-height: 1.25; }
.bp h3 { font-size: 18px; font-weight: 600; line-height: 1.35; }
.bp p { margin: 0; }
.bp a { text-decoration: none; }
.bp *:focus-visible { outline: 2px solid var(--bp-saffron); outline-offset: 2px; border-radius: 6px; }

.bp-container { width: 100%; max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.bp-section { padding: 88px 0; }
.bp-section-alt { background: var(--bp-bg-alt); }
.bp-eyebrow {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase;
  color: var(--bp-saffron);
}
.bp-eyebrow::before { content: ''; width: 18px; height: 2px; background: currentColor; border-radius: 2px; }
.bp-lead { font-size: 16px; color: var(--bp-text-2); line-height: 1.7; }
.bp-muted { color: var(--bp-text-2); }

.bp-card {
  background: var(--bp-card);
  border: 1px solid var(--bp-border);
  border-radius: 14px;
  box-shadow: var(--bp-shadow);
}

.bp-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  font-family: inherit; font-size: 14px; font-weight: 600; line-height: 1;
  padding: 12px 20px; border-radius: 10px; border: 1px solid transparent;
  cursor: pointer; transition: background-color .15s, border-color .15s, color .15s, box-shadow .15s;
  white-space: nowrap;
}
.bp-btn-sm { padding: 9px 14px; font-size: 13px; }
.bp-btn-primary { background: var(--bp-navy); color: #fff; }
.bp-btn-primary:hover:not(:disabled) { background: var(--bp-navy-soft); box-shadow: 0 4px 12px rgba(24,49,83,0.18); }
.bp-btn-primary:disabled { opacity: .6; cursor: not-allowed; }
.bp-btn-secondary { background: var(--bp-card); color: var(--bp-navy); border-color: var(--bp-border); }
.bp-btn-secondary:hover { border-color: #cfc9bb; background: #fdfcf9; }
.bp-btn-block { width: 100%; }

.bp-nav-link {
  font-size: 14px; font-weight: 500; color: var(--bp-text-2);
  padding: 8px 12px; border-radius: 8px; transition: color .15s, background-color .15s;
}
.bp-nav-link:hover { color: var(--bp-navy); background: rgba(24,49,83,0.05); }

.bp-icon-tile {
  width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--bp-bg); border: 1px solid var(--bp-border); color: var(--bp-navy);
}

.bp-badge {
  display: inline-flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; padding: 3px 10px; border-radius: 999px; border: 1px solid;
}
.bp-badge-low { color: var(--bp-success); background: #EDF5EF; border-color: #CFE3D6; }
.bp-badge-medium { color: #9A6512; background: #FBF3E3; border-color: #EEDAB3; }
.bp-badge-high { color: var(--bp-danger); background: #FAEDED; border-color: #EDCFCF; }
.bp-badge-demo { color: var(--bp-text-2); background: var(--bp-bg); border-color: var(--bp-border); font-weight: 500; }

.bp-field-label { display: block; font-size: 13px; font-weight: 600; color: var(--bp-text); margin-bottom: 6px; }
.bp-input {
  width: 100%; font-family: inherit; font-size: 14px; color: var(--bp-text);
  background: #fff; border: 1px solid var(--bp-border); border-radius: 10px;
  padding: 11px 12px 11px 40px; transition: border-color .15s, box-shadow .15s;
}
.bp-input::placeholder { color: #98A2B3; }
.bp-input:hover { border-color: #d3cdbf; }
.bp-input:focus { outline: none; border-color: var(--bp-navy); box-shadow: 0 0 0 3px rgba(24,49,83,0.12); }

.bp-link-btn {
  background: none; border: none; padding: 0; font: inherit; cursor: pointer;
  font-size: 13px; font-weight: 600; color: var(--bp-navy);
}
.bp-link-btn:hover { text-decoration: underline; }

.bp-jaali { position: absolute; inset: 0; pointer-events: none; color: var(--bp-navy); }

@media (prefers-reduced-motion: no-preference) {
  html:has(.bp) { scroll-behavior: smooth; }
}
`;

export function BrandStyles() {
  return <style>{BRAND_CSS}</style>;
}

/* ── Logo mark: land parcels inside a jaali-cut square ── */
export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#183153" />
      <path d="M8 27 C14 22, 20 30, 32 21" stroke="#F8F7F2" strokeOpacity="0.35" strokeWidth="1.2" fill="none" />
      <path d="M8 21 C15 16, 21 24, 32 15" stroke="#F8F7F2" strokeOpacity="0.55" strokeWidth="1.2" fill="none" />
      <path d="M20 8 L27 15 L20 22 L13 15 Z" fill="none" stroke="#F8F7F2" strokeWidth="1.6" />
      <circle cx="20" cy="15" r="2.4" fill="#D97706" />
      <path d="M8 32 H32" stroke="#3F7D58" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={compact ? 32 : 36} />
      <span className="flex flex-col leading-none">
        <span
          style={{
            fontFamily: "'Inter', 'Noto Sans', sans-serif",
            fontSize: compact ? 17 : 19,
            fontWeight: 700,
            color: '#183153',
            letterSpacing: '-0.01em',
          }}
        >
          Bhumi <span style={{ color: '#B25F04' }}>Prajna</span>
        </span>
        {!compact && (
          <span style={{ fontSize: 11, color: '#667085', marginTop: 4, letterSpacing: '0.02em' }}>
            Land Acquisition Intelligence
          </span>
        )}
      </span>
    </span>
  );
}

/* ── Jaali-inspired lattice pattern (background texture) ── */
export function JaaliPattern({ id, opacity = 0.06, color }: { id: string; opacity?: number; color?: string }) {
  return (
    <svg className="bp-jaali" width="100%" height="100%" aria-hidden="true" style={color ? { color } : undefined}>
      <defs>
        <pattern id={id} width="48" height="48" patternUnits="userSpaceOnUse">
          <path
            d="M24 0 L48 24 L24 48 L0 24 Z M24 10 L38 24 L24 38 L10 24 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
          />
          <circle cx="24" cy="24" r="2" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="3" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="48" cy="0" r="3" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="0" cy="48" r="3" fill="none" stroke="currentColor" strokeWidth="0.8" />
          <circle cx="48" cy="48" r="3" fill="none" stroke="currentColor" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} opacity={opacity} />
    </svg>
  );
}

/* ── Section divider: thin rule with a small lattice knot ── */
export function MotifDivider({ align = 'center' }: { align?: 'center' | 'left' }) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-2"
      style={{ justifyContent: align === 'center' ? 'center' : 'flex-start', margin: '14px 0 18px' }}
    >
      <span style={{ width: 28, height: 1, background: '#D8D2C4' }} />
      <svg width="30" height="10" viewBox="0 0 30 10">
        <path d="M5 1 L9 5 L5 9 L1 5 Z" fill="none" stroke="#D97706" strokeWidth="1" />
        <path d="M15 0.5 L19.5 5 L15 9.5 L10.5 5 Z" fill="#D97706" fillOpacity="0.85" />
        <path d="M25 1 L29 5 L25 9 L21 5 Z" fill="none" stroke="#3F7D58" strokeWidth="1" />
      </svg>
      <span style={{ width: 28, height: 1, background: '#D8D2C4' }} />
    </div>
  );
}

/* ── Live map preview (Leaflet tiles, sample markers) ───────────────── */

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export const RISK_META: Record<RiskLevel, { color: string; label: string }> = {
  low: { color: '#3F7D58', label: 'Low risk' },
  medium: { color: '#C88719', label: 'Medium risk' },
  high: { color: '#B54747', label: 'High risk' },
  critical: { color: '#8F2D2D', label: 'Critical risk' },
};

type SampleSite = { pos: [number, number]; risk: RiskLevel; region: string };

// Illustrative sample projects only — not real data.
const SAMPLE_SITES: SampleSite[] = [
  { pos: [28.61, 77.21], risk: 'low', region: 'Delhi NCR' },
  { pos: [19.08, 72.88], risk: 'critical', region: 'Mumbai' },
  { pos: [13.08, 80.27], risk: 'high', region: 'Chennai' },
  { pos: [22.57, 88.36], risk: 'medium', region: 'Kolkata' },
  { pos: [12.97, 77.59], risk: 'low', region: 'Bengaluru' },
  { pos: [23.02, 72.57], risk: 'low', region: 'Ahmedabad' },
  { pos: [17.39, 78.49], risk: 'medium', region: 'Hyderabad' },
  { pos: [26.85, 80.95], risk: 'medium', region: 'Lucknow' },
  { pos: [23.26, 77.41], risk: 'low', region: 'Bhopal' },
  { pos: [26.14, 91.74], risk: 'high', region: 'Guwahati' },
  { pos: [25.59, 85.14], risk: 'medium', region: 'Patna' },
  { pos: [26.91, 75.79], risk: 'low', region: 'Jaipur' },
  { pos: [21.15, 79.09], risk: 'high', region: 'Nagpur' },
  { pos: [20.30, 85.82], risk: 'low', region: 'Bhubaneswar' },
  { pos: [9.93, 76.27], risk: 'medium', region: 'Kochi' },
  { pos: [18.52, 73.86], risk: 'medium', region: 'Pune' },
  { pos: [17.69, 83.22], risk: 'low', region: 'Visakhapatnam' },
  { pos: [30.73, 76.78], risk: 'low', region: 'Chandigarh' },
];

const INDIA_BOUNDS: [[number, number], [number, number]] = [[7.5, 68.5], [35.5, 97.2]];

export function RiskMapPreview({ height = 420 }: { height?: number }) {
  return (
    <div style={{ height, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--bp-border)' }}>
      <MapContainer
        bounds={INDIA_BOUNDS}
        zoomSnap={0.25}
        zoomControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        style={{ height: '100%', width: '100%', borderRadius: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {SAMPLE_SITES.map(s => (
          <Marker key={s.region} position={s.pos} icon={riskPinIcon(RISK_META[s.risk].color, 13)}>
            <Tooltip direction="top">
              <span style={{ fontSize: 12 }}>
                <strong>Sample project · {s.region}</strong>
                <br />
                {RISK_META[s.risk].label}
              </span>
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function PinSwatch({ color }: { color: string }) {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="6" cy="6" r="6" fill={color} fillOpacity="0.18" />
      <circle cx="6" cy="6" r="4" fill={color} />
    </svg>
  );
}

/** Explicit colour key: every colour is paired with its meaning in words. */
export function RiskLegend({ vertical = false }: { vertical?: boolean }) {
  const levels: [RiskLevel, string][] = [
    ['low', 'Green'],
    ['medium', 'Amber'],
    ['high', 'Red'],
    ['critical', 'Dark red'],
  ];
  return (
    <div className={vertical ? 'flex flex-col items-start gap-1.5' : 'flex flex-wrap items-center gap-x-4 gap-y-2'}>
      {levels.map(([risk, name]) => (
        <span key={risk} className="inline-flex items-center gap-1.5" style={{ fontSize: 12, color: '#243244' }}>
          <PinSwatch color={RISK_META[risk].color} />
          <span><strong style={{ fontWeight: 600 }}>{name}</strong> = {RISK_META[risk].label}</span>
        </span>
      ))}
    </div>
  );
}

/* ── Minimal line icons (24px grid, 1.6 stroke) ── */
export function Icon({ d, size = 20 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

export const ICONS = {
  arrowRight: 'M5 12h14M13 6l6 6-6 6',
  login: 'M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3',
  trend: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  bulb: 'M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.1V17h6v-.2c0-.8.4-1.6 1-2.1A7 7 0 0 0 12 2z',
  layers: 'M12 2l10 5-10 5L2 7l10-5zM2 17l10 5 10-5M2 12l10 5 10-5',
  map: 'M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3zM9 3v15M15 6v15',
  bell: 'M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  database: 'M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3zM4 6v6c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6',
  cpu: 'M9 9h6v6H9zM4 9h2M4 15h2M18 9h2M18 15h2M9 4v2M15 4v2M9 18v2M15 18v2M6 6h12v12H6z',
  gauge: 'M12 14l4-4M3.3 17a9 9 0 1 1 17.4 0',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  check: 'M20 6L9 17l-5-5',
  stamp: 'M9 11V6a3 3 0 1 1 6 0v5M5 15h14v3H5zM4 21h16M8 11h8l1 4H7l1-4z',
  rupee: 'M6 3h12M6 8h12M6 13l8.5 8M6 13h3a5 5 0 0 0 0-10',
  scale: 'M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0L5 7zM19 7l-3 7a3 3 0 0 0 6 0l-3-7z',
  file: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM14 2v6h6M8 13h8M8 17h5',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  megaphone: 'M3 11v2a1 1 0 0 0 1 1h3l5 4V6L7 10H4a1 1 0 0 0-1 1zM16 8a5 5 0 0 1 0 8M19 5a9 9 0 0 1 0 14',
  home: 'M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1V10z',
  flag: 'M4 22V4M4 4h12l-2 4 2 4H4',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  link: 'M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7',
  history: 'M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 3',
  lock: 'M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4',
  mail: 'M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM22 6l-10 7L2 6',
  eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  eyeOff: 'M17.9 17.9A10 10 0 0 1 12 20c-7 0-11-8-11-8a18.5 18.5 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.2 3.2M14.1 14.1a3 3 0 1 1-4.2-4.2M1 1l22 22',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  refresh: 'M23 4v6h-6M1 20v-6h6M3.5 9a9 9 0 0 1 14.9-3.4L23 10M1 14l4.6 4.4A9 9 0 0 0 20.5 15',
  expand: 'M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.3-4.3',
};
