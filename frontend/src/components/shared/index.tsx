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

const KPI_VARIANT_COLORS: Record<string, { bg: string; fg: string }> = {
  default: { bg: 'var(--color-accent-100)', fg: 'var(--color-accent-600)' },
  critical: { bg: 'var(--risk-critical-bg)', fg: 'var(--risk-critical)' },
  high: { bg: 'var(--risk-high-bg)', fg: 'var(--risk-high)' },
  medium: { bg: 'var(--risk-medium-bg)', fg: 'var(--risk-medium)' },
  low: { bg: 'var(--risk-low-bg)', fg: 'var(--risk-low)' },
};

export function KPICard({ title, value, subtitle, icon, trend, variant = 'default', onClick }: KPICardProps) {
  const colors = KPI_VARIANT_COLORS[variant];

  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden bg-white rounded-[10px] border border-[var(--color-border)] p-[18px] flex items-start gap-3.5 card-hover ${onClick ? 'cursor-pointer' : ''}`}
      style={{ boxShadow: 'var(--shadow-xs)' }}
    >
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: colors.fg, opacity: 0.85 }} />
      {icon && (
        <div
          className="w-11 h-11 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: colors.bg, color: colors.fg, boxShadow: `inset 0 0 0 1px ${colors.fg}22` }}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider m-0" style={{ color: 'var(--color-text-muted)' }}>{title}</p>
        <p className="text-[28px] font-semibold mt-0.5 leading-none" style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-display)' }}>{value}</p>
        {subtitle && <p className="text-[11px] mt-1 m-0" style={{ color: 'var(--color-text-muted)' }}>{subtitle}</p>}
        {trend && (
          <p className={`text-xs mt-1 font-medium ${trend.value >= 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
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
  const barColor = color || (pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-[var(--color-accent-500)]' : pct >= 25 ? 'bg-amber-500' : 'bg-red-500');
  const h = size === 'sm' ? 'h-1.5' : 'h-2.5';

  return (
    <div>
      {(label || showPercent) && (
        <div className="flex justify-between items-center mb-1">
          {label && <span className="text-xs text-[var(--color-text-secondary)]">{label}</span>}
          {showPercent && <span className="text-xs font-semibold text-[var(--color-text-secondary)]">{pct}%</span>}
        </div>
      )}
      <div className={`w-full ${h} bg-[var(--color-surface)] rounded-full overflow-hidden`}>
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
    ONGOING: 'bg-[var(--color-accent-50)] text-[var(--color-accent-700)] border-[var(--color-accent-200)]',
    COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CANCELLED: 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
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
    color = 'text-[var(--color-accent-600)]';
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
      {icon && <div className="text-[var(--color-border-strong)] mb-4">{icon}</div>}
      <h3 className="text-lg font-semibold text-[var(--color-text-secondary)]">{title}</h3>
      {description && <p className="text-sm text-[var(--color-text-muted)] mt-1 max-w-md">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ========== Pagination ==========

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, pageSize, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between text-xs" style={{ color: 'var(--color-text-secondary)' }}>
      <span>Showing {from}–{to} of {total}</span>
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>← Prev</Button>
        <span className="px-2" style={{ color: 'var(--color-text-muted)' }}>Page {page} / {totalPages}</span>
        <Button variant="secondary" size="sm" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}>Next →</Button>
      </div>
    </div>
  );
}

// ========== Loading Spinner ==========

export function LoadingSpinner({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-8 h-8 border-3 border-[var(--color-accent-600)] border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-[var(--color-text-muted)] mt-3">{message}</p>
    </div>
  );
}

// ========== Button ==========

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'danger-solid';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', icon, loading, children, className = '', disabled, ...rest }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70" />
      ) : icon}
      {children}
    </button>
  );
}

// ========== Page Header ==========

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  breadcrumb?: string[];
}

export function PageHeader({ title, subtitle, action, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium mb-1.5">
            {breadcrumb.map((b, i) => (
              <span key={b} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-[var(--color-border-strong)]">/</span>}
                <span className={i === breadcrumb.length - 1 ? 'text-[var(--color-text-muted)]' : ''}>{b}</span>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-[22px] font-extrabold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
        {subtitle && <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>}
      </div>
      {action && <div className="flex items-center gap-2 flex-shrink-0">{action}</div>}
    </div>
  );
}

// ========== Modal ==========

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: number;
}

export function Modal({ open, onClose, children, maxWidth = 440 }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(27,20,15,0.5)', backdropFilter: 'blur(2px)' }}
      onClick={onClose}
    >
      <div
        className="w-full bg-white"
        style={{ maxWidth, borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', padding: '28px 32px' }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

// ========== Confirm Dialog ==========

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  error?: string;
  onConfirm: () => void;
  onCancel: () => void;
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger, loading, error, onConfirm, onCancel, children,
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onCancel}>
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0"
          style={{ background: danger ? 'var(--risk-critical-bg)' : 'var(--color-accent-50)' }}
        >
          <svg className="w-5 h-5" style={{ color: danger ? 'var(--risk-critical)' : 'var(--color-accent-600)' }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold" style={{ color: 'var(--color-text-primary)' }}>{title}</h3>
          {description && <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{description}</p>}
        </div>
      </div>
      {children}
      {error && (
        <p className="text-xs mb-3 px-3 py-2 rounded-md" style={{ color: 'var(--risk-critical)', background: 'var(--risk-critical-bg)' }}>
          {error}
        </p>
      )}
      <div className="flex gap-2.5 justify-end mt-2">
        <Button variant="secondary" onClick={onCancel}>{cancelLabel}</Button>
        <Button variant={danger ? 'danger-solid' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </div>
    </Modal>
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
    <div className={`bg-white rounded-[10px] border border-[var(--color-border)] ${className}`} style={{ boxShadow: 'var(--shadow-xs)' }}>
      {(title || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <div>
            {title && <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">{title}</h3>}
            {subtitle && <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>{children}</div>
    </div>
  );
}
