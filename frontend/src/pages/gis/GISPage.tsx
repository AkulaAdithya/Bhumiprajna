/**
 * Pravaah - GIS Map Page (M4)
 * Role-scoped Leaflet map with risk-coloured project markers,
 * heatmap overlay, project popups linking to detail view.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../../services/api';

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#10b981',
  NO_PREDICTION: '#64748b',
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

  const getRadius = (f: any) => {
    const base = 8;
    const p = f.delay_probability || 0;
    return base + p * 10;
  };

  return (
    <div className="animate-fade-in flex flex-col h-full" style={{ height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#0f2144' }}>GIS Risk Map</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {features.length} project{features.length !== 1 ? 's' : ''} in your scope
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Heatmap toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <div
              onClick={() => setShowHeatmap(h => !h)}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${showHeatmap ? 'bg-blue-600' : 'bg-gray-300'}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${showHeatmap ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
            Heatmap
          </label>
          {/* Risk filter */}
          <select
            value={riskFilter}
            onChange={e => setRiskFilter(e.target.value)}
            style={{ padding: '6px 12px', border: '1.5px solid #e2e8f0', borderRadius: 8, fontSize: 13, color: '#374151', background: 'white', outline: 'none' }}
          >
            <option value="">All Risks</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Risk legend + counts */}
      <div className="flex gap-3 mb-3 flex-shrink-0 flex-wrap">
        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'NO_PREDICTION'].map(risk => (
          <div key={risk} className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: RISK_COLORS[risk] }} />
            {RISK_LABELS[risk]} ({counts[risk] || 0})
          </div>
        ))}
        <div className="ml-auto text-xs text-gray-400">Marker size ∝ delay probability</div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden border border-gray-200 relative min-h-96">
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10 rounded-xl">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <MapContainer
          center={[22.5, 80.0]}
          zoom={5}
          style={{ height: '100%', width: '100%', background: '#0f172a' }}
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
          {showHeatmap && heatmap.map((h, i) => (
            <CircleMarker
              key={`heat-${i}`}
              center={[h.lat, h.lon]}
              radius={30 + h.risk_intensity * 40}
              pathOptions={{
                fillColor: `rgba(220, 38, 38, ${h.risk_intensity * 0.8})`,
                fillOpacity: Math.max(0.4, h.risk_intensity * 0.9),
                color: 'rgba(185, 28, 28, 0.4)',
                weight: 2,
              }}
            />
          ))}

          {/* Project markers */}
          {features.map(f => {
            const color = RISK_COLORS[f.risk_category] || RISK_COLORS.NO_PREDICTION;
            return (
              <CircleMarker
                key={f.id}
                center={[f.lat, f.lon]}
                radius={getRadius(f)}
                pathOptions={{
                  fillColor: color,
                  fillOpacity: 0.85,
                  color: '#0f172a',
                  weight: 1.5,
                }}
              >
                <Popup>
                  <div className="font-sans" style={{ minWidth: 200 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: '#1e293b' }}>
                      {f.project_name}
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                      {f.district}, {f.state} · {f.project_type}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{
                        background: color + '20', color: color,
                        padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 600,
                      }}>
                        {RISK_LABELS[f.risk_category] || 'Unknown'}
                      </span>
                      <span style={{ fontSize: 11, color: '#475569' }}>
                        {f.delay_probability_pct}% delay prob
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6 }}>
                      Stage: {f.current_stage}
                    </div>
                    <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 8 }}>
                      {f.land_area} ha · {f.affected_families?.toLocaleString()} families
                    </div>
                    <button
                      onClick={() => navigate(`/projects/${f.id}`)}
                      style={{
                        background: '#4f46e5', color: '#fff', border: 'none',
                        padding: '5px 12px', borderRadius: 6, fontSize: 12,
                        cursor: 'pointer', width: '100%', fontWeight: 600,
                      }}
                    >
                      View Details →
                    </button>
                  </div>
                </Popup>
              </CircleMarker>
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
