/**
 * Bhumi Prajna - Add Project Page (M3)
 * Multi-step guided form: 4 steps covering all 10 parameter groups.
 * Supports two modes:
 *   1. Upload Mode: Upload Excel (.xlsx) or PDF → extract → review/correct → submit
 *   2. Manual Mode: 4-step form (fallback / default)
 * Server-side derived fields; client collects raw inputs.
 * Government of India portal style.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { PageHeader, Button } from '../../components/shared';

const STEPS = ['Project Info', 'Legal & Approvals', 'Compensation & Docs', 'R&R & Possession'];
const PROJECT_TYPES = ['HIGHWAY','RAILWAY','IRRIGATION','INDUSTRIAL','URBAN_DEVELOPMENT','POWER','MINING','DEFENSE','OTHER'];

// ── Excel parser (SheetJS) ──
async function parseExcelFile(file: File): Promise<Record<string, any>> {
  const XLSX = await import('xlsx');
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
  const extracted: Record<string, any> = {};
  for (const row of rows) {
    if (row.length >= 2) {
      const key = String(row[0]).toLowerCase().trim().replace(/[\s\-/]+/g, '_').replace(/[^a-z0-9_]/g, '');
      const val = row[1];
      if (key && val !== '') extracted[key] = val;
    }
  }
  return extracted;
}

// Map raw Excel keys → form field names
function mapExtractedToForm(raw: Record<string, any>): { mapped: Record<string, string>; extracted: string[]; missing: string[] } {
  const FIELD_MAP: Record<string, string> = {
    project_name: 'project_name',
    state: 'state',
    district: 'district',
    project_type: 'project_type',
    land_area: 'land_area',
    affected_families: 'affected_families',
    current_stage: 'current_stage',
    next_stage: 'next_stage',
    snapshot_date: 'snapshot_date',
    latitude: 'latitude',
    longitude: 'longitude',
    approvals_required: 'approvals_required',
    approvals_completed: 'approvals_completed',
    approval_process_start_date: 'approval_process_start_date',
    approval_expected_completion_date: 'approval_expected_completion_date',
    oldest_pending_approval_days: 'oldest_pending_approval_days',
    legal_cases_total: 'legal_cases_total',
    legal_cases_resolved: 'legal_cases_resolved',
    disputed_land_area: 'disputed_land_area',
    oldest_pending_case_days: 'oldest_pending_case_days',
    compensation_total_amount: 'compensation_total_amount',
    compensation_paid_amount: 'compensation_paid_amount',
    beneficiaries_eligible: 'beneficiaries_eligible',
    beneficiaries_compensated: 'beneficiaries_compensated',
    compensation_expected_completion_date: 'compensation_expected_completion_date',
    documents_required: 'documents_required',
    documents_submitted: 'documents_submitted',
    documents_verified: 'documents_verified',
    notifications_required: 'notifications_required',
    notifications_issued: 'notifications_issued',
    parcels_total: 'parcels_total',
    parcels_disputed: 'parcels_disputed',
    ownership_claims_total: 'ownership_claims_total',
    ownership_conflicts_pending: 'ownership_conflicts_pending',
    ownership_conflicts_resolved: 'ownership_conflicts_resolved',
    rr_families_required: 'rr_families_required',
    rr_families_completed: 'rr_families_completed',
    land_required_for_possession: 'land_required_for_possession',
    land_acquired_for_possession: 'land_acquired_for_possession',
    stakeholder_requests_raised: 'stakeholder_requests_raised',
    stakeholder_responses_received: 'stakeholder_responses_received',
    average_response_time_days: 'average_response_time_days',
    departments_involved: 'departments_involved',
    coordination_requests_raised: 'coordination_requests_raised',
    coordination_requests_resolved: 'coordination_requests_resolved',
  };

  const REQUIRED = ['project_name', 'state', 'district', 'land_area', 'affected_families', 'current_stage', 'approvals_required', 'compensation_total_amount', 'beneficiaries_eligible', 'documents_required', 'notifications_required', 'parcels_total'];

  const mapped: Record<string, string> = {};
  const extracted: string[] = [];

  for (const [rawKey, formKey] of Object.entries(FIELD_MAP)) {
    if (raw[rawKey] !== undefined && raw[rawKey] !== '') {
      mapped[formKey] = String(raw[rawKey]);
      extracted.push(formKey);
    }
  }

  const missing = REQUIRED.filter(f => !extracted.includes(f));
  
  // Normalize project_type to match DB Enum
  if (mapped.project_type) {
    const pt = mapped.project_type.toUpperCase();
    if (pt === 'URBAN') mapped.project_type = 'URBAN_DEVELOPMENT';
    else if (['AIRPORT', 'PORT', 'PIPELINE'].includes(pt)) mapped.project_type = 'OTHER';
    else mapped.project_type = pt;
  }

  return { mapped, extracted, missing };
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
              style={
                i < current ? { background: 'var(--color-accent-600)', color: '#fff' } :
                i === current ? { background: 'var(--color-accent-700)', color: '#fff', boxShadow: '0 0 0 2px var(--color-accent-200)' } :
                { background: 'var(--color-border)', color: 'var(--color-text-muted)' }
              }
            >
              {i < current ? '✓' : i + 1}
            </div>
            <span
              className="text-xs font-medium hidden sm:block"
              style={{ color: i === current ? 'var(--color-text-primary)' : i < current ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}
            >{label}</span>
          </div>
          {i < total - 1 && <div className="flex-1 h-0.5" style={{ background: i < current ? 'var(--color-accent-600)' : 'var(--color-border)' }} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="field-label">
        {label}{required && <span style={{ color: 'var(--risk-critical)' }} className="ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{hint}</p>}
    </div>
  );
}

const inputClass = "field-input";

export default function AddProjectPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'upload' | 'manual'>('choose');
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [states, setStates] = useState<any[]>([]);
  const [districts, setDistricts] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);

  // Upload state
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [extractedFields, setExtractedFields] = useState<string[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    project_name: '', state: '', district: '', project_type: 'HIGHWAY',
    land_area: '', affected_families: '', current_stage: '', next_stage: '',
    snapshot_date: new Date().toISOString().split('T')[0],
    latitude: '', longitude: '',
    approvals_required: '', approvals_completed: '',
    approval_process_start_date: '', approval_expected_completion_date: '',
    oldest_pending_approval_days: '',
    legal_cases_total: '0', legal_cases_resolved: '0', disputed_land_area: '0',
    oldest_pending_case_days: '',
    compensation_total_amount: '', compensation_paid_amount: '0',
    beneficiaries_eligible: '', beneficiaries_compensated: '0',
    compensation_expected_completion_date: '',
    documents_required: '', documents_submitted: '0', documents_verified: '0',
    notifications_required: '', notifications_issued: '0',
    parcels_total: '', parcels_disputed: '0',
    ownership_claims_total: '0', ownership_conflicts_pending: '0', ownership_conflicts_resolved: '0',
    rr_families_required: '0', rr_families_completed: '0',
    land_required_for_possession: '', land_acquired_for_possession: '0',
    possession_status: '',
    stakeholder_requests_raised: '0', stakeholder_responses_received: '0',
    average_response_time_days: '',
    departments_involved: '1', coordination_requests_raised: '0', coordination_requests_resolved: '0',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    api.getStates().then(s => setStates(s)).catch(console.error);
    api.getStages().then(s => setStages(s)).catch(console.error);
  }, []);

  useEffect(() => {
    if (form.state) {
      api.getDistricts(form.state).then(d => setDistricts(d)).catch(console.error);
    }
  }, [form.state]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('parsing');
    setUploadMessage('');
    setExtractedFields([]);
    setMissingFields([]);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'xls') {
        const raw = await parseExcelFile(file);
        const { mapped, extracted, missing } = mapExtractedToForm(raw);
        if (extracted.length === 0) {
          setUploadStatus('error');
          setUploadMessage('No recognizable fields found. Column A should contain field names matching the data dictionary. Please use manual entry or correct the file.');
        } else {
          setForm(prev => ({ ...prev, ...mapped }));
          setExtractedFields(extracted);
          setMissingFields(missing);
          setUploadStatus('done');
          setUploadMessage(`Extracted ${extracted.length} field(s). ${missing.length > 0 ? `${missing.length} required fields are missing — fill them in below.` : 'All required fields found.'}`);
          setMode('manual'); // Switch to form for review/correction
          setStep(0);
        }
      } else if (ext === 'pdf') {
        setUploadStatus('error');
        setUploadMessage('PDF automatic extraction is not supported in-browser. Please use the Excel template or manual entry. Refer to the PDF while filling in the form.');
      } else {
        setUploadStatus('error');
        setUploadMessage('Unsupported file type. Please upload Excel (.xlsx/.xls).');
      }
    } catch (err: any) {
      setUploadStatus('error');
      setUploadMessage(err.message || 'Failed to parse file.');
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const n = (v: string) => parseFloat(v) || 0;
  const ni = (v: string) => parseInt(v) || 0;

  const buildPayload = () => ({
    project_name: form.project_name,
    state: form.state,
    district: form.district,
    project_type: form.project_type,
    land_area: n(form.land_area),
    affected_families: ni(form.affected_families),
    current_stage: form.current_stage,
    next_stage: form.next_stage || undefined,
    snapshot_date: form.snapshot_date,
    latitude: form.latitude ? n(form.latitude) : undefined,
    longitude: form.longitude ? n(form.longitude) : undefined,
    approvals: {
      approvals_required: ni(form.approvals_required),
      approvals_completed: ni(form.approvals_completed),
      approval_process_start_date: form.approval_process_start_date || undefined,
      approval_expected_completion_date: form.approval_expected_completion_date || undefined,
      oldest_pending_approval_days: form.oldest_pending_approval_days ? ni(form.oldest_pending_approval_days) : undefined,
    },
    legal: {
      legal_cases_total: ni(form.legal_cases_total),
      legal_cases_resolved: ni(form.legal_cases_resolved),
      disputed_land_area: n(form.disputed_land_area),
      oldest_pending_case_days: form.oldest_pending_case_days ? ni(form.oldest_pending_case_days) : undefined,
    },
    compensation: {
      compensation_total_amount: n(form.compensation_total_amount),
      compensation_paid_amount: n(form.compensation_paid_amount),
      beneficiaries_eligible: ni(form.beneficiaries_eligible),
      beneficiaries_compensated: ni(form.beneficiaries_compensated),
      compensation_expected_completion_date: form.compensation_expected_completion_date || undefined,
    },
    documentation: {
      documents_required: ni(form.documents_required),
      documents_submitted: ni(form.documents_submitted),
      documents_verified: ni(form.documents_verified),
    },
    notifications: {
      notifications_required: ni(form.notifications_required),
      notifications_issued: ni(form.notifications_issued),
    },
    ownership: {
      parcels_total: ni(form.parcels_total),
      parcels_disputed: ni(form.parcels_disputed),
      ownership_claims_total: ni(form.ownership_claims_total),
      ownership_conflicts_pending: ni(form.ownership_conflicts_pending),
      ownership_conflicts_resolved: ni(form.ownership_conflicts_resolved),
    },
    rr: {
      rr_families_required: ni(form.rr_families_required),
      rr_families_completed: ni(form.rr_families_completed),
    },
    possession: {
      land_required_for_possession: n(form.land_required_for_possession) || n(form.land_area),
      land_acquired_for_possession: n(form.land_acquired_for_possession),
      possession_status: form.possession_status || undefined,
    },
    stakeholder: {
      stakeholder_requests_raised: ni(form.stakeholder_requests_raised),
      stakeholder_responses_received: ni(form.stakeholder_responses_received),
      average_response_time_days: form.average_response_time_days ? n(form.average_response_time_days) : undefined,
    },
    coordination: {
      departments_involved: Math.max(1, ni(form.departments_involved)),
      coordination_requests_raised: ni(form.coordination_requests_raised),
      coordination_requests_resolved: ni(form.coordination_requests_resolved),
    },
  });

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const result = await api.createProject(buildPayload());
      navigate(`/projects/${result.id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to create project.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const validateStep = () => {
    if (step === 0) return form.project_name && form.state && form.district && form.land_area && form.affected_families && form.current_stage && form.snapshot_date;
    if (step === 1) return form.approvals_required;
    if (step === 2) return form.compensation_total_amount && form.beneficiaries_eligible && form.documents_required && form.notifications_required;
    if (step === 3) return form.parcels_total && form.land_required_for_possession;
    return true;
  };

  const stageList = stages.length > 0 ? stages.map(s => s.name) :
    ['Notification', 'Social Impact Assessment', 'Approval Process', 'Compensation Disbursement',
     'Rehabilitation & Resettlement', 'Land Possession', 'Documentation & Registry'];

  // ── Mode: Choose ──
  if (mode === 'choose') {
    return (
      <div className="animate-fade-in max-w-2xl mx-auto">
        <button onClick={() => navigate('/projects')} className="text-xs font-semibold flex items-center gap-1 mb-5" style={{ color: 'var(--color-accent-600)' }}>
          ← Back to Projects
        </button>
        <PageHeader title="Add New Project" subtitle="Enter current state data — the system will immediately generate a delay-risk prediction using the trained ML model." />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {/* Upload option */}
          <button
            onClick={() => setMode('upload')}
            className="text-left p-5 bg-white rounded-[10px] card-hover group"
            style={{ border: '1.5px solid var(--color-accent-200)', boxShadow: 'var(--shadow-xs)' }}
          >
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3" style={{ background: 'var(--color-accent-100)', color: 'var(--color-accent-600)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Upload Project Report</h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Upload Excel (.xlsx) — auto-extract fields, review, correct, then save. Recommended.</p>
            <p className="text-xs mt-2 font-medium" style={{ color: 'var(--color-accent-600)' }}>Supports Excel (.xlsx/.xls)</p>
          </button>

          {/* Manual option */}
          <button
            onClick={() => setMode('manual')}
            className="text-left p-5 bg-white rounded-[10px] card-hover group"
            style={{ border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-xs)' }}
          >
            <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3" style={{ background: 'var(--color-surface)', color: 'var(--color-text-secondary)' }}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <h2 className="text-sm font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Manual Entry</h2>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Enter all project parameters step-by-step through a guided 4-step form.</p>
            <p className="text-xs mt-2 font-medium" style={{ color: 'var(--color-text-muted)' }}>4-step form</p>
          </button>
        </div>

        <p className="text-xs mt-4 text-center" style={{ color: 'var(--color-text-muted)' }}>
          For PDF reports: refer to the document while using Manual Entry.
        </p>
      </div>
    );
  }

  // ── Mode: Upload ──
  if (mode === 'upload') {
    return (
      <div className="animate-fade-in max-w-xl mx-auto">
        <button onClick={() => setMode('choose')} className="text-xs font-semibold flex items-center gap-1 mb-5" style={{ color: 'var(--color-accent-600)' }}>
          ← Back
        </button>
        <PageHeader title="Upload Project Report" subtitle="The system will extract available fields. You will review and correct before saving — no data is fabricated for missing fields." />

        <div className="bg-white rounded-[10px] p-8 text-center mt-6" style={{ border: '2px dashed var(--color-border-strong)', boxShadow: 'var(--shadow-xs)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: 'var(--color-accent-50)' }}>
            <svg className="w-6 h-6" style={{ color: 'var(--color-accent-600)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Select Excel file</p>
          <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>Supported: .xlsx, .xls</p>
          <Button onClick={() => fileInputRef.current?.click()}>Choose File</Button>
          <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.pdf" onChange={handleFileUpload} className="hidden" />
        </div>

        {uploadStatus === 'parsing' && (
          <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: 'var(--color-accent-700)' }}>
            <div className="w-4 h-4 rounded-full animate-spin" style={{ border: '2px solid var(--color-accent-600)', borderTopColor: 'transparent' }} />
            Parsing file…
          </div>
        )}
        {uploadStatus === 'error' && (
          <div className="mt-4 p-3 rounded-md text-xs" style={{ background: 'var(--risk-medium-bg)', border: '1px solid var(--risk-medium-border)', color: 'var(--risk-medium)' }}>{uploadMessage}</div>
        )}

        <div className="mt-5 p-3 rounded-md text-xs space-y-1" style={{ background: 'var(--color-accent-50)', border: '1px solid var(--color-accent-100)', color: 'var(--color-accent-700)' }}>
          <strong>Expected Excel format:</strong>
          <p>Column A: Field name (e.g. "project_name", "land_area", "approvals_required")</p>
          <p>Column B: Value</p>
          <p>One field per row. Field names should match the data dictionary.</p>
        </div>

        <Button variant="secondary" onClick={() => setMode('manual')} className="mt-4 w-full">
          Use manual entry instead →
        </Button>
      </div>
    );
  }

  // ── Mode: Manual (also used as review after upload) ──
  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="mb-5">
        <button onClick={() => setMode('choose')} className="text-xs font-semibold flex items-center gap-1 mb-3" style={{ color: 'var(--color-accent-600)' }}>
          ← Back
        </button>
        <PageHeader title="Add New Project" subtitle="Enter current state data — the system will generate a delay-risk prediction after saving." />
      </div>

      {/* Upload status banner (shown if came from upload) */}
      {uploadStatus === 'done' && (
        <div className="mb-4 p-3 rounded-md text-xs" style={{ background: 'var(--risk-low-bg)', border: '1px solid var(--risk-low-border)', color: 'var(--risk-low)' }}>
          <strong>Upload complete:</strong> {extractedFields.length} fields extracted.
          {missingFields.length > 0 && (
            <span className="ml-2" style={{ color: 'var(--risk-medium)' }}>
              Missing required: {missingFields.join(', ')}. Please fill these in below.
            </span>
          )}
        </div>
      )}

      {/* Inline upload option */}
      <div className="mb-5 flex items-center gap-3 p-3 bg-white rounded-[10px]" style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xs)' }}>
        <svg className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-muted)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        <span className="text-xs flex-1" style={{ color: 'var(--color-text-secondary)' }}>Have an Excel report? Upload to auto-fill fields.</span>
        <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>Upload Excel</Button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.pdf" onChange={handleFileUpload} className="hidden" />
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md text-sm" style={{ background: 'var(--risk-critical-bg)', border: '1px solid var(--risk-critical-border)', color: 'var(--risk-critical)' }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      <StepIndicator current={step} total={STEPS.length} />

      <div className="bg-white rounded-[10px] p-6 space-y-5" style={{ border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xs)' }}>

        {/* Step 0 */}
        {step === 0 && (
          <>
            <h2 className="text-sm font-semibold pb-2" style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid var(--color-border)' }}>Project Information</h2>
            <FormField label="Project Name" required>
              <input className={inputClass} placeholder="e.g. NH-48 Widening Phase 2" value={form.project_name} onChange={set('project_name')} />
            </FormField>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="State" required>
                <select className={inputClass} value={form.state} onChange={set('state')}>
                  <option value="">Select state</option>
                  {states.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                </select>
              </FormField>
              <FormField label="District" required>
                <select className={inputClass} value={form.district} onChange={set('district')} disabled={!form.state}>
                  <option value="">Select district</option>
                  {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Project Type" required>
                <select className={inputClass} value={form.project_type} onChange={set('project_type')}>
                  {PROJECT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </FormField>
              <FormField label="Report Date" required hint="Date of this observation/data">
                <input type="date" className={inputClass} value={form.snapshot_date} onChange={set('snapshot_date')} />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Land Area (ha)" required>
                <input type="number" className={inputClass} placeholder="e.g. 250.5" value={form.land_area} onChange={set('land_area')} min="0" step="0.1" />
              </FormField>
              <FormField label="Affected Families" required>
                <input type="number" className={inputClass} placeholder="e.g. 850" value={form.affected_families} onChange={set('affected_families')} min="0" />
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Current Stage" required>
                <select className={inputClass} value={form.current_stage} onChange={set('current_stage')}>
                  <option value="">Select stage</option>
                  {stageList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Next Stage">
                <select className={inputClass} value={form.next_stage} onChange={set('next_stage')}>
                  <option value="">None / Last stage</option>
                  {stageList.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Latitude (optional)">
                <input type="number" className={inputClass} placeholder="e.g. 18.52" value={form.latitude} onChange={set('latitude')} step="0.0001" />
              </FormField>
              <FormField label="Longitude (optional)">
                <input type="number" className={inputClass} placeholder="e.g. 73.86" value={form.longitude} onChange={set('longitude')} step="0.0001" />
              </FormField>
            </div>
          </>
        )}

        {/* Step 1 */}
        {step === 1 && (
          <>
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Administrative Approvals</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Approvals Required" required>
                <input type="number" className={inputClass} value={form.approvals_required} onChange={set('approvals_required')} min="0" />
              </FormField>
              <FormField label="Approvals Completed">
                <input type="number" className={inputClass} value={form.approvals_completed} onChange={set('approvals_completed')} min="0" />
              </FormField>
              <FormField label="Process Start Date">
                <input type="date" className={inputClass} value={form.approval_process_start_date} onChange={set('approval_process_start_date')} />
              </FormField>
              <FormField label="Expected Completion">
                <input type="date" className={inputClass} value={form.approval_expected_completion_date} onChange={set('approval_expected_completion_date')} />
              </FormField>
              <FormField label="Oldest Pending (days)">
                <input type="number" className={inputClass} placeholder="Days since oldest pending approval" value={form.oldest_pending_approval_days} onChange={set('oldest_pending_approval_days')} min="0" />
              </FormField>
            </div>

            <h2 className="text-sm font-semibold mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>Legal & Disputes</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Total Legal Cases">
                <input type="number" className={inputClass} value={form.legal_cases_total} onChange={set('legal_cases_total')} min="0" />
              </FormField>
              <FormField label="Cases Resolved">
                <input type="number" className={inputClass} value={form.legal_cases_resolved} onChange={set('legal_cases_resolved')} min="0" />
              </FormField>
              <FormField label="Disputed Area (ha)">
                <input type="number" className={inputClass} value={form.disputed_land_area} onChange={set('disputed_land_area')} min="0" step="0.1" />
              </FormField>
              <FormField label="Oldest Pending Case (days)">
                <input type="number" className={inputClass} placeholder="Optional" value={form.oldest_pending_case_days} onChange={set('oldest_pending_case_days')} min="0" />
              </FormField>
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Compensation</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Total Amount (₹ Cr)" required>
                <input type="number" className={inputClass} placeholder="e.g. 450.0" value={form.compensation_total_amount} onChange={set('compensation_total_amount')} min="0" step="0.1" />
              </FormField>
              <FormField label="Amount Paid (₹ Cr)">
                <input type="number" className={inputClass} value={form.compensation_paid_amount} onChange={set('compensation_paid_amount')} min="0" step="0.1" />
              </FormField>
              <FormField label="Eligible Beneficiaries" required>
                <input type="number" className={inputClass} value={form.beneficiaries_eligible} onChange={set('beneficiaries_eligible')} min="0" />
              </FormField>
              <FormField label="Beneficiaries Compensated">
                <input type="number" className={inputClass} value={form.beneficiaries_compensated} onChange={set('beneficiaries_compensated')} min="0" />
              </FormField>
              <FormField label="Expected Completion">
                <input type="date" className={inputClass} value={form.compensation_expected_completion_date} onChange={set('compensation_expected_completion_date')} />
              </FormField>
            </div>

            <h2 className="text-sm font-semibold mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>Documentation</h2>
            <div className="grid grid-cols-3 gap-4">
              <FormField label="Docs Required" required>
                <input type="number" className={inputClass} value={form.documents_required} onChange={set('documents_required')} min="0" />
              </FormField>
              <FormField label="Docs Submitted">
                <input type="number" className={inputClass} value={form.documents_submitted} onChange={set('documents_submitted')} min="0" />
              </FormField>
              <FormField label="Docs Verified">
                <input type="number" className={inputClass} value={form.documents_verified} onChange={set('documents_verified')} min="0" />
              </FormField>
            </div>

            <h2 className="text-sm font-semibold mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>Statutory Notifications</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Notifications Required" required>
                <input type="number" className={inputClass} value={form.notifications_required} onChange={set('notifications_required')} min="0" />
              </FormField>
              <FormField label="Notifications Issued">
                <input type="number" className={inputClass} value={form.notifications_issued} onChange={set('notifications_issued')} min="0" />
              </FormField>
            </div>
          </>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <>
            <h2 className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>Ownership & Parcels</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Total Parcels" required>
                <input type="number" className={inputClass} value={form.parcels_total} onChange={set('parcels_total')} min="0" />
              </FormField>
              <FormField label="Disputed Parcels">
                <input type="number" className={inputClass} value={form.parcels_disputed} onChange={set('parcels_disputed')} min="0" />
              </FormField>
              <FormField label="Ownership Claims">
                <input type="number" className={inputClass} value={form.ownership_claims_total} onChange={set('ownership_claims_total')} min="0" />
              </FormField>
              <FormField label="Ownership Conflicts Pending">
                <input type="number" className={inputClass} value={form.ownership_conflicts_pending} onChange={set('ownership_conflicts_pending')} min="0" />
              </FormField>
            </div>

            <h2 className="text-sm font-semibold mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>Rehabilitation & Resettlement</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="R&R Families Required">
                <input type="number" className={inputClass} value={form.rr_families_required} onChange={set('rr_families_required')} min="0" />
              </FormField>
              <FormField label="R&R Families Completed">
                <input type="number" className={inputClass} value={form.rr_families_completed} onChange={set('rr_families_completed')} min="0" />
              </FormField>
            </div>

            <h2 className="text-sm font-semibold mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>Possession</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Land Required (ha)" required>
                <input type="number" className={inputClass} value={form.land_required_for_possession} onChange={set('land_required_for_possession')} min="0" step="0.1" placeholder={form.land_area || 'e.g. 250'} />
              </FormField>
              <FormField label="Land Acquired (ha)">
                <input type="number" className={inputClass} value={form.land_acquired_for_possession} onChange={set('land_acquired_for_possession')} min="0" step="0.1" />
              </FormField>
            </div>

            <h2 className="text-sm font-semibold mt-4 mb-1" style={{ color: 'var(--color-text-primary)' }}>Stakeholder & Coordination</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Stakeholder Requests">
                <input type="number" className={inputClass} value={form.stakeholder_requests_raised} onChange={set('stakeholder_requests_raised')} min="0" />
              </FormField>
              <FormField label="Responses Received">
                <input type="number" className={inputClass} value={form.stakeholder_responses_received} onChange={set('stakeholder_responses_received')} min="0" />
              </FormField>
              <FormField label="Avg Response Time (days)">
                <input type="number" className={inputClass} value={form.average_response_time_days} onChange={set('average_response_time_days')} min="0" step="0.5" />
              </FormField>
              <FormField label="Departments Involved">
                <input type="number" className={inputClass} value={form.departments_involved} onChange={set('departments_involved')} min="1" />
              </FormField>
              <FormField label="Coordination Requests">
                <input type="number" className={inputClass} value={form.coordination_requests_raised} onChange={set('coordination_requests_raised')} min="0" />
              </FormField>
              <FormField label="Coordination Resolved">
                <input type="number" className={inputClass} value={form.coordination_requests_resolved} onChange={set('coordination_requests_resolved')} min="0" />
              </FormField>
            </div>
          </>
        )}
      </div>

      {/* Nav Buttons */}
      <div className="flex justify-between items-center mt-5">
        <Button variant="secondary" onClick={() => step > 0 ? setStep(s => s - 1) : setMode('choose')}>
          {step === 0 ? 'Cancel' : '← Back'}
        </Button>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Step {step + 1} of {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!validateStep()}>
              Next →
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting || !validateStep()} loading={submitting}>
              {submitting ? 'Saving…' : 'Create Project & Predict →'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
