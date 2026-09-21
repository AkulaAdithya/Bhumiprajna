/**
 * Bhumi Prajna - Shared UI Components
 * Reusable design system components consistent with design.md.
 */

import React from 'react';
import type { RiskCategory } from '../../types';

// ========== Risk Badge ==========
// Always pairs color with text label (design.md §2)

const RISK_STYLES: Record<RiskCategory, string> = {
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
};

const RISK_DOT: Record<RiskCategory, string> = {
  LOW: 'bg-emerald-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-orange-500',
  CRITICAL: 'bg-red-500',
};

interface RiskBadgeProps {
  risk: RiskCategory;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

export function RiskBadge({ risk, size = 'md', showDot = true }: RiskBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${RISK_STYLES[risk]} ${sizeClasses[size]}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${RISK_DOT[risk]}`} />}
      {risk === 'LOW' && 'Low'}
      {risk === 'MEDIUM' && 'Medium'}
      {risk === 'HIGH' && 'High'}
      {risk === 'CRITICAL' && 'Critical'}
    </span>
  );
}

// ========== KPI Card ==========

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  variant?: 'default' | 'critical' | 'high' | 'medium' | 'low';
  onClick?: () => void;
}

export function KPICard({ title, value, subtitle, icon, trend, variant = 'default', onClick }: KPICardProps) {
  const borderColors: Record<string, string> = {
    default: 'border-l-blue-500',
    critical: 'border-l-red-500',
    high: 'border-l-orange-500',
    medium: 'border-l-amber-500',
    low: 'border-l-emerald-500',
  };

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-slate-200 border-l-4 ${borderColors[variant]} p-5 card-hover ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
          {trend && (
            <p className={`text-xs mt-1 font-medium ${trend.value >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
        {icon && <div className="text-slate-400">{icon}</div>}
      </div>
    </div>
  );
}

// ========== Progress Bar ==========

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md';
  color?: string;
}

export function ProgressBar({ value, max = 100, label, showPercent = true, size = 'md', color }: ProgressBarProps) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const barColor = color || (pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : pct >= 25 ? 'bg-amber-500' : 'bg-red-500');
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-slate-600">{label}</span>}
          {showPercent && <span className="text-xs font-semibold text-slate-700">{pct}%</span>}
        </div>
      )}
      <div className={`w-full ${h} bg-slate-100 rounded-full overflow-hidden`}>
        <div
          className={`${h} ${barColor} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ========== Status Badge ==========

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles: Record<string, string> = {
    ONGOING: 'bg-blue-50 text-blue-700 border-blue-200',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    ON_HOLD: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium rounded-full border ${styles[status] || styles.ONGOING}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

// ========== Data Freshness Indicator ==========

interface FreshnessIndicatorProps {
  days: number;
}

export function FreshnessIndicator({ days }: FreshnessIndicatorProps) {
  let label: string;
  let color: string;

  if (days <= 7) {
    label = 'Fresh';
    color = 'text-emerald-600';
  } else if (days <= 30) {
    label = 'Recent';
    color = 'text-blue-600';
  } else if (days <= 60) {
    label = 'Aging';
    color = 'text-amber-600';
  } else {
    label = 'Stale';
    color = 'text-red-600';
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${color}`}>
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
      {days}d — {label}
    </span>
  );
}

// ========== Empty State ==========

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-slate-300 mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      {description && <p className="text-sm text-slate-500 mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ========== Loading Spinner ==========

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-slate-500 mt-3">{message}</p>
    </div>
  );
}

// ========== Section Card ==========

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export function SectionCard({ title, subtitle, children, action, className = '', noPadding }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            {title && <h3 className="text-sm font-semibold text-slate-800">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
