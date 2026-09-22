/**
 * Bhumi Prajna - Analytics Page (M4)
 * Role-scoped risk analytics: distribution charts, stage breakdown,
 * weekly trend, state/district comparison, data freshness, risk drivers.
 * Uses Plotly for rich interactive charts.
 */

import { useState, useEffect, useCallback } from 'react';
import Plot from 'react-plotly.js';
import { api } from '../../services/api';
import { PageHeader, Button, SectionCard, EmptyState } from '../../components/shared';

const RISK_COLORS: Record<string, string> = {
  CRITICAL: '#b8271f', HIGH: '#c2530c', MEDIUM: '#b5730a',
  LOW: '#157f45', NO_PREDICTION: '#93816d',
};

const GRID_COLOR = '#ede1d0';

const PLOTLY_LAYOUT_BASE = {
  paper_bgcolor: 'rgba(0,0,0,0)',
  plot_bgcolor: 'rgba(0,0,0,0)',
  font: { color: '#5a4c3d', family: 'Inter, sans-serif', size: 12 },
  margin: { l: 40, r: 20, t: 30, b: 40 },
  showlegend: false,
};

const PLOTLY_CONFIG = { displayModeBar: false, responsive: true };

function Skeleton() {
  return <div className="h-52 rounded-lg animate-pulse" style={{ background: 'var(--color-surface)' }} />;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [trendDays, setTrendDays] = useState(90);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [ov, tr] = await Promise.all([
        api.getAnalyticsOverview(),
        api.getAnalyticsTrends(trendDays),
      ]);
      setOverview(ov);
      setTrends(tr);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [trendDays]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Chart data builders ──────────────────────────────────────────────────

  const riskPieData = () => {
    if (!overview?.risk_distribution) return null;
    const d = overview.risk_distribution;
    const labels = Object.keys(d).filter(k => d[k] > 0);
    return [{
      type: 'pie' as const,
      labels,
      values: labels.map(k => d[k]),
      marker: { colors: labels.map(l => RISK_COLORS[l] || '#94a3b8') },
      textfont: { color: '#f1f5f9' },
      hole: 0.55,
      hovertemplate: '<b>%{label}</b><br>%{value} projects<br>%{percent}<extra></extra>',
    }];
  };

  const stageBarsData = () => {
    if (!overview?.stage_distribution) return null;
    const d = overview.stage_distribution;
    const probs = overview.avg_prob_by_stage || {};
    const stages = Object.keys(d).sort((a, b) => d[b] - d[a]);
    return {
      count: [{
        type: 'bar' as const,
        x: stages.map(s => s.length > 20 ? s.slice(0, 18) + '…' : s),
        y: stages.map(s => d[s]),
        marker: { color: '#24663f' },
        hovertemplate: '<b>%{x}</b><br>%{y} projects<extra></extra>',
      }],
      prob: [{
        type: 'bar' as const,
        x: stages.map(s => s.length > 20 ? s.slice(0, 18) + '…' : s),
        y: stages.map(s => probs[s] ? Math.round(probs[s] * 100) : 0),
        marker: { color: '#c2530c' },
        hovertemplate: '<b>%{x}</b><br>Avg: %{y}%<extra></extra>',
      }],
    };
  };

  const trendData = () => {
    if (!trends?.weekly_trends?.length) return null;
    const weeks = trends.weekly_trends;
    return [
      {
        type: 'scatter' as const, mode: 'lines+markers',
        name: 'Avg Delay Probability',
        x: weeks.map((w: any) => w.week_start),
        y: weeks.map((w: any) => w.avg_delay_probability !== null ? Math.round((w.avg_delay_probability || 0) * 100) : null),
        line: { color: '#b8623a', width: 2 },
        marker: { size: 5, color: '#b8623a' },
        hovertemplate: 'Week: %{x}<br>Avg Prob: %{y}%<extra></extra>',
      },
      {
        type: 'bar' as const, name: 'Critical',
        x: weeks.map((w: any) => w.week_start),
        y: weeks.map((w: any) => w.critical || 0),
        marker: { color: 'rgba(184,39,31,0.75)' },
        yaxis: 'y2',
        hovertemplate: 'Week: %{x}<br>Critical: %{y}<extra></extra>',
      },
      {
        type: 'bar' as const, name: 'High',
        x: weeks.map((w: any) => w.week_start),
        y: weeks.map((w: any) => w.high || 0),
        marker: { color: 'rgba(194,83,12,0.75)' },
        yaxis: 'y2',
        hovertemplate: 'Week: %{x}<br>High: %{y}<extra></extra>',
      },
    ];
  };

  const stateCompData = () => {
    if (!overview?.state_comparison?.length) return null;
    const d = [...overview.state_comparison].sort(
      (a, b) => (b.avg_delay_probability || 0) - (a.avg_delay_probability || 0)
    );
    return [{
      type: 'bar' as const,
      orientation: 'h' as const,
      x: d.map(s => s.avg_delay_probability !== null ? Math.round((s.avg_delay_probability || 0) * 100) : 0),
      y: d.map(s => s.state),
      text: d.map(s => `${s.total} projects`),
      textposition: 'outside',
      marker: {
        color: d.map(s => {
          const p = s.avg_delay_probability || 0;
          return p >= 0.75 ? '#b8271f' : p >= 0.5 ? '#c2530c' : p >= 0.25 ? '#b5730a' : '#157f45';
        }),
      },
      hovertemplate: '<b>%{y}</b><br>Avg: %{x}%<extra></extra>',
    }];
  };

  const freshnessData = () => {
    if (!overview?.data_freshness) return null;
    const d = overview.data_freshness;
    const labels = Object.keys(d);
    return [{
      type: 'bar' as const,
      x: labels,
      y: labels.map(k => d[k]),
      marker: { color: ['#157f45', '#b5730a', '#c2530c', '#b8271f'] },
      hovertemplate: '<b>%{x}</b><br>%{y} projects<extra></extra>',
    }];
  };

  const riskDriversData = () => {
    if (!overview?.avg_risk_drivers) return null;
    const d = overview.avg_risk_drivers;
    const entries = Object.entries(d).sort((a: any, b: any) => b[1] - a[1]);
    if (!entries.length) return null;
    return [{
      type: 'bar' as const,
      orientation: 'h' as const,
      x: entries.map(([, v]) => v),
      y: entries.map(([k]) => k),
      marker: { color: '#b8623a' },
      hovertemplate: '<b>%{y}</b><br>Avg: %{x:.1f}<extra></extra>',
    }];
  };

  const stageBars = stageBarsData();
  const trend = trendData();

  const noData = !loading && !overview?.total_ongoing;

  const noDataIcon = (
    <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  return (
    <div className="animate-fade-in flex flex-col gap-6">
      <PageHeader
        title="Analytics"
        subtitle="Descriptive analytics from your operational data. Predictions are generated by the ML model separately."
        action={
          <div className="flex gap-2">
            {[30, 90, 180, 365].map(d => (
              <Button
                key={d}
                variant={trendDays === d ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setTrendDays(d)}
              >
                {d}d
              </Button>
            ))}
          </div>
        }
      />

      {noData ? (
        <EmptyState
          icon={noDataIcon}
          title="No data available yet"
          description="Add projects to see analytics here."
        />
      ) : (
        <>
          {/* Row 1: Risk Pie + Stage Count + Stage Prob */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <SectionCard title="Risk Distribution" subtitle="Ongoing projects by risk level">
              {loading ? <Skeleton /> : riskPieData() ? (
                <Plot
                  data={riskPieData()!}
                  layout={{
                    ...PLOTLY_LAYOUT_BASE,
                    height: 210,
                    margin: { l: 10, r: 10, t: 10, b: 10 },
                    annotations: [{
                      text: `${overview?.total_ongoing ?? 0}<br>projects`,
                      x: 0.5, y: 0.5, xref: 'paper', yref: 'paper',
                      showarrow: false,
                      font: { size: 13, color: '#5a4c3d' },
                    }],
                  }}
                  config={PLOTLY_CONFIG}
                  style={{ width: '100%', height: 210 }}
                />
              ) : <p className="text-[var(--color-text-muted)] text-sm">No data</p>}
            </SectionCard>

            <SectionCard title="Projects by Stage" subtitle="Count per acquisition stage">
              {loading ? <Skeleton /> : stageBars ? (
                <Plot
                  data={stageBars.count}
                  layout={{
                    ...PLOTLY_LAYOUT_BASE,
                    height: 210,
                    xaxis: { tickangle: -25, tickfont: { size: 9 } },
                    yaxis: { gridcolor: GRID_COLOR },
                  }}
                  config={PLOTLY_CONFIG}
                  style={{ width: '100%', height: 210 }}
                />
              ) : <p className="text-[var(--color-text-muted)] text-sm">No data</p>}
            </SectionCard>

            <SectionCard title="Avg Delay Prob by Stage" subtitle="Model output grouped by stage">
              {loading ? <Skeleton /> : stageBars ? (
                <Plot
                  data={stageBars.prob}
                  layout={{
                    ...PLOTLY_LAYOUT_BASE,
                    height: 210,
                    xaxis: { tickangle: -25, tickfont: { size: 9 } },
                    yaxis: { gridcolor: GRID_COLOR, title: { text: '%', font: { size: 10 } } },
                  }}
                  config={PLOTLY_CONFIG}
                  style={{ width: '100%', height: 210 }}
                />
              ) : <p className="text-[var(--color-text-muted)] text-sm">No data</p>}
            </SectionCard>
          </div>

          {/* Row 2: Trend over time (full width) */}
          <SectionCard
            title={`Risk Trend — Last ${trendDays} Days`}
            subtitle="Weekly avg delay probability (line, left axis) and risk count breakdown (bars, right axis)"
          >
            {loading ? <Skeleton /> : trend ? (
              <Plot
                data={trend}
                layout={{
                  ...PLOTLY_LAYOUT_BASE,
                  height: 260,
                  barmode: 'stack',
                  showlegend: true,
                  legend: { orientation: 'h', x: 0, y: 1.1, font: { size: 11 } },
                  xaxis: { gridcolor: GRID_COLOR },
                  yaxis: { title: { text: 'Avg Prob %', font: { size: 10 } }, gridcolor: GRID_COLOR, range: [0, 100] },
                  yaxis2: { title: { text: 'Count', font: { size: 10 } }, overlaying: 'y', side: 'right', gridcolor: 'rgba(0,0,0,0)' },
                }}
                config={PLOTLY_CONFIG}
                style={{ width: '100%', height: 260 }}
              />
            ) : (
              <div className="h-52 flex items-center justify-center text-[var(--color-text-muted)] text-sm">
                Not enough data for trend analysis yet.
              </div>
            )}
          </SectionCard>

          {/* Row 3: State Comparison + Avg Risk Drivers */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SectionCard title="State-wise Risk Profile" subtitle="Avg delay probability by state">
              {loading ? <Skeleton /> : stateCompData() ? (
                <Plot
                  data={stateCompData()!}
                  layout={{
                    ...PLOTLY_LAYOUT_BASE,
                    height: 240,
                    margin: { l: 120, r: 60, t: 20, b: 40 },
                    xaxis: { gridcolor: GRID_COLOR, title: { text: '%', font: { size: 10 } } },
                    yaxis: { tickfont: { size: 11 } },
                  }}
                  config={PLOTLY_CONFIG}
                  style={{ width: '100%', height: 240 }}
                />
              ) : <p className="text-[var(--color-text-muted)] text-sm">No multi-state data</p>}
            </SectionCard>

            <SectionCard title="Avg Risk Drivers" subtitle="Mean pending counts across all active projects">
              {loading ? <Skeleton /> : riskDriversData() ? (
                <Plot
                  data={riskDriversData()!}
                  layout={{
                    ...PLOTLY_LAYOUT_BASE,
                    height: 240,
                    margin: { l: 160, r: 30, t: 20, b: 40 },
                    xaxis: { gridcolor: GRID_COLOR },
                    yaxis: { tickfont: { size: 11 } },
                  }}
                  config={PLOTLY_CONFIG}
                  style={{ width: '100%', height: 240 }}
                />
              ) : <p className="text-[var(--color-text-muted)] text-sm">No data</p>}
            </SectionCard>
          </div>

          {/* Row 4: Data Freshness */}
          <SectionCard title="Data Freshness" subtitle="How many days since last snapshot was entered">
            {loading ? <Skeleton /> : freshnessData() ? (
              <Plot
                data={freshnessData()!}
                layout={{
                  ...PLOTLY_LAYOUT_BASE,
                  height: 180,
                  xaxis: { title: { text: 'Age of last snapshot', font: { size: 10 } } },
                  yaxis: { gridcolor: GRID_COLOR, title: { text: 'Projects', font: { size: 10 } } },
                }}
                config={PLOTLY_CONFIG}
                style={{ width: '100%', height: 180 }}
              />
            ) : <p className="text-[var(--color-text-muted)] text-sm">No data</p>}
          </SectionCard>

          {/* Footer note */}
          <p className="text-xs text-[var(--color-text-muted)] text-center pb-2">
            Analytics are descriptive summaries of entered operational data. Model predictions are generated independently by the LightGBM prediction engine.
          </p>
        </>
      )}
    </div>
  );
}
