/**
 * Bhumi Prajna - GIS Map Page (M4)
 * Role-scoped Leaflet map with risk-coloured project markers,
 * heatmap overlay, project popups linking to detail view.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';
import { PageHeader, Button, RiskBadge } from '../../components/shared';
import { riskPinIcon } from '../../components/shared/riskPin';
import type { RiskCategory } from '../../types';

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#b8271f',
  HIGH: '#c2530c',
  MEDIUM: '#b5730a',
  LOW: '#157f45',
  NO_PREDICTION: '#93816d',
};

const RISK_LABELS: Record<string, string> = {
  CRITICAL: 'Critical', HIGH: 'High', MEDIUM: 'Medium', LOW: 'Low', NO_PREDICTION: 'No Prediction',
};

function MapBounds({ features }: { features: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (features.length > 0) {
      const lats = features.map(f => f.lat);
      const lons = features.map(f => f.lon);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lats) - 0.5, Math.min(...lons) - 0.5],
        [Math.max(...lats) + 0.5, Math.max(...lons) + 0.5],
      ];
      map.fitBounds(bounds, { padding: [30, 30] });
    }
  }, [features, map]);
  return null;
}

export default function GISPage() {
  const navigate = useNavigate();
  const [features, setFeatures] = useState<any[]>([]);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [riskFilter, setRiskFilter] = useState('');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (riskFilter) params.risk_category = riskFilter;
      const [gisData, heatData] = await Promise.all([
        api.getGISProjects(params),
        api.getGISHeatmap(),
      ]);
      const feats = gisData.features || [];
      setFeatures(feats);
      setHeatmap(heatData.heatmap_points || []);

      // Count by risk
      const c: Record<string, number> = {};
      feats.forEach((f: any) => {
        const k = f.risk_category || 'NO_PREDICTION';
        c[k] = (c[k] || 0) + 1;
      });
      setCounts(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [riskFilter]);

  // Marker diameter in px: 12 (no risk) → 18 (certain delay)
  const getPinSize = (f: any) => Math.round(12 + (f.delay_probability || 0) * 6);

  return (
    <div className="animate-fade-in flex flex-col h-full" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="mb-4 flex-shrink-0">
        <PageHeader
          title="GIS Risk Map"
          subtitle={`${features.length} project${features.length !== 1 ? 's' : ''} in your scope`}
          action={
            <div className="flex items-center gap-3">
              {/* Heatmap toggle */}
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                <div
                  onClick={() => setShowHeatmap(h => !h)}
                  className="w-10 h-5 rounded-full transition-colors relative cursor-pointer"
                  style={{ background: showHeatmap ? 'var(--color-accent-600)' : 'var(--color-border-strong)' }}
                >
                  <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showHeatmap ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
                Heatmap
              </label>
              {/* Risk filter */}
              <select
                value={riskFilter}
                onChange={e => setRiskFilter(e.target.value)}
                className="field-input"
                style={{ width: 'auto', cursor: 'pointer' }}
              >
                <option value="">All Risks</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          }
        />
      </div>

      {/* Risk legend + counts */}
      <div className="flex items-center gap-3 mb-3 flex-shrink-0 flex-wrap">
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Marker colour = predicted risk:</span>
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NO_PREDICTION'].map(risk => (
          <div key={risk} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: RISK_COLORS[risk] }} />
            {RISK_LABELS[risk]} ({counts[risk] || 0})
          </div>
        ))}
        <div className="ml-auto text-xs" style={{ color: 'var(--color-text-muted)' }}>Larger marker = higher delay probability</div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-[10px] overflow-hidden border relative min-h-96" style={{ borderColor: 'var(--color-border)', boxShadow: 'var(--shadow-xs)' }}>
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-[10px]">
            <div className="w-8 h-8 rounded-full animate-spin" style={{ border: '2px solid var(--color-accent-600)', borderTopColor: 'transparent' }} />
          </div>
        )}

        <MapContainer
          center={[22.5, 80.0]}
          zoom={5}
          style={{ height: '100%', width: '100%', background: '#1b140f' }}
          zoomControl={true}
        >
          <TileLayer
            attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="map-dark-filter"
          />

          {/* Fit bounds when features load */}
          {features.length > 0 && <MapBounds features={features} />}

          {/* Heatmap circles (districts) */}
          {/* Soft two-ring glow: wide faint halo + tighter core */}
          {showHeatmap && heatmap.map((h, i) => (
            <CircleMarker
              key={`heat-${i}`}
              center={[h.lat, h.lon]}
              radius={10 + h.risk_intensity * 14}
              interactive={false}
              pathOptions={{ fillColor: '#b8271f', fillOpacity: 0.1 + h.risk_intensity * 0.12, stroke: false }}
            />
          ))}
          {showHeatmap && heatmap.map((h, i) => (
            <CircleMarker
              key={`heat-core-${i}`}
              center={[h.lat, h.lon]}
              radius={5 + h.risk_intensity * 6}
              interactive={false}
              pathOptions={{ fillColor: '#b8271f', fillOpacity: 0.15 + h.risk_intensity * 0.2, stroke: false }}
            />
          ))}

          {/* Project markers */}
          {features.map(f => {
            const color = RISK_COLORS[f.risk_category] || RISK_COLORS.NO_PREDICTION;
            return (
              <Marker
                key={f.id}
                position={[f.lat, f.lon]}
                icon={riskPinIcon(color, getPinSize(f))}
                title={`${f.project_name} — ${RISK_LABELS[f.risk_category] || 'Unknown'} risk`}
              >
                <Popup>
                  <div className="font-sans" style={{ minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: 'var(--color-text-primary)' }}>
                      {f.project_name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                      {f.district}, {f.state} · {f.project_type}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                      {f.risk_category && f.risk_category !== 'NO_PREDICTION' ? (
                        <RiskBadge risk={f.risk_category as RiskCategory} size="sm" />
                      ) : (
                        <span style={{
                          background: 'var(--color-surface)', color: 'var(--color-text-muted)',
                          padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                        }}>
                          {RISK_LABELS[f.risk_category] || 'Unknown'}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
                        {f.delay_probability_pct}% delay prob
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>
                      Stage: {f.current_stage}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 8 }}>
                      {f.land_area} ha · {f.affected_families?.toLocaleString()} families
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate(`/projects/${f.id}`)}
                      className="w-full"
                    >
                      View Details →
                    </Button>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Stats bar */}
      {features.length === 0 && !loading && (
        <div className="mt-4 text-center text-gray-400 text-sm">
          No projects with location data. Add projects and include coordinates.
        </div>
      )}
    </div>
  );
}
