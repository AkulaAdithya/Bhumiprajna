/**
 * Pravaah - Update Project Data (Snapshot) Page
 * Fixes M3 routing bug: /projects/:id/snapshot was unregistered → redirected to Home.
 * This page loads the current project state, lets the officer enter updated data,
 * submits as a NEW snapshot (preserving history), re-runs ML prediction, then
 * navigates back to the updated Project Detail page.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../services/api';

const STEPS = ['Project Stage', 'Legal & Approvals', 'Compensation & Docs', 'R&R & Possession'];

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEPS.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              i < current ? 'bg-blue-700 text-white' :
              i === current ? 'bg-blue-800 text-white ring-2 ring-blue-300' :
              'bg-gray-200 text-gray-500'
            }`}>
              {i < current ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${
              i === current ? 'text-blue-900' : i < current ? 'text-gray-500' : 'text-gray-400'
            }`}>{label}</span>
          </div>
          {i < total - 1 && <div className={`flex-1 h-0.5 ${i < current ? 'bg-blue-700' : 'bg-gray-200'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
}

function FormField({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );
}

// Excel parser tab using SheetJS (xlsx library) — dynamic import
async function parseExcelFile(file: File): Promise<Record<string, any>> {
  try {
    const XLSX = await import('xlsx');
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    // Convert to flat key-value: look for label:value pattern
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    const extracted: Record<string, any> = {};
    for (const row of rows) {
      if (row.length >= 2) {
        const key = String(row[0]).toLowerCase().trim().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const val = row[1];
        if (key && val !== '') extracted[key] = val;
      }
    }
    return extracted;
  } catch (e) {
    throw new Error('Failed to parse Excel file. Please check the file format.');
  }
}

// Map common report field names to our schema fields
function mapExtractedToForm(raw: Record<string, any>): Partial<Record<string, string>> {
  const map: Record<string, string> = {
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
    documents_required: 'documents_required',
    documents_submitted: 'documents_submitted',
    documents_verified: 'documents_verified',
    notifications_required: 'notifications_required',
    notifications_issued: 'notifications_issued',
    parcels_total: 'parcels_total',
    parcels_disputed: 'parcels_disputed',
    ownership_claims_total: 'ownership_claims_total',
    ownership_conflicts_pending: 'ownership_conflicts_pending',
    rr_families_required: 'rr_families_required',
    rr_families_completed: 'rr_families_completed',
    land_required_for_possession: 'land_required_for_possession',
    land_acquired_for_possession: 'land_acquired_for_possession',
    stakeholder_requests_raised: 'stakeholder_requests_raised',
    stakeholder_responses_received: 'stakeholder_responses_received',
    departments_involved: 'departments_involved',
    coordination_requests_raised: 'coordination_requests_raised',
    coordination_requests_resolved: 'coordination_requests_resolved',
  };
  const result: Partial<Record<string, string>> = {};
  for (const [rawKey, formKey] of Object.entries(map)) {
    if (raw[rawKey] !== undefined) {
      result[formKey] = String(raw[rawKey]);
    }
  }
  return result;
}

const inputClass = "w-full px-3 py-2 bg-white border border-gray-300 text-gray-900 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 transition-all";

export default function UpdateSnapshotPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [stages, setStages] = useState<any[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [extractedFields, setExtractedFields] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    snapshot_date: new Date().toISOString().split('T')[0],
    current_stage: '',
    next_stage: '',
    status: 'ONGOING',
    approvals_required: '',
    approvals_completed: '',
    approval_process_start_date: '',
    approval_expected_completion_date: '',
    oldest_pending_approval_days: '',
    legal_cases_total: '0',
    legal_cases_resolved: '0',
    disputed_land_area: '0',
    oldest_pending_case_days: '',
    compensation_total_amount: '',
    compensation_paid_amount: '0',
    beneficiaries_eligible: '',
    beneficiaries_compensated: '0',
    compensation_expected_completion_date: '',
    documents_required: '',
    documents_submitted: '0',
    documents_verified: '0',
    notifications_required: '',
    notifications_issued: '0',
    parcels_total: '',
    parcels_disputed: '0',
    ownership_claims_total: '0',
    ownership_conflicts_pending: '0',
    ownership_conflicts_resolved: '0',
    rr_families_required: '0',
    rr_families_completed: '0',
    land_required_for_possession: '',
    land_acquired_for_possession: '0',
    possession_status: '',
    stakeholder_requests_raised: '0',
    stakeholder_responses_received: '0',
    average_response_time_days: '',
    departments_involved: '1',
    coordination_requests_raised: '0',
    coordination_requests_resolved: '0',
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }));

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.getProject(id),
      api.getStages(),
    ]).then(([proj, stgs]) => {
      setProject(proj);
      setStages(stgs);
      // Pre-fill from latest snapshot
      const snap = proj.latest_snapshot;
      if (snap) {
        setForm(prev => ({
          ...prev,
          current_stage: proj.current_stage || '',
          next_stage: proj.next_stage || '',
          approvals_required: String(snap.approvals_required ?? ''),
          approvals_completed: String(snap.approvals_completed ?? '0'),
          legal_cases_total: String(snap.legal_cases_total ?? '0'),
          legal_cases_resolved: String(snap.legal_cases_resolved ?? '0'),
          disputed_land_area: String(snap.disputed_land_area ?? '0'),
          compensation_total_amount: String(snap.compensation_total_amount ?? ''),
          compensation_paid_amount: String(snap.compensation_paid_amount ?? '0'),
          beneficiaries_eligible: String(snap.beneficiaries_eligible ?? ''),
          beneficiaries_compensated: String(snap.beneficiaries_compensated ?? '0'),
          documents_required: String(snap.documents_required ?? ''),
          documents_submitted: String(snap.documents_submitted ?? '0'),
          documents_verified: String(snap.documents_verified ?? '0'),
          notifications_required: String(snap.notifications_required ?? ''),
          notifications_issued: String(snap.notifications_issued ?? '0'),
          parcels_total: String(snap.parcels_total ?? ''),
          parcels_disputed: String(snap.parcels_disputed ?? '0'),
          ownership_claims_total: String(snap.ownership_claims_total ?? '0'),
          ownership_conflicts_pending: String(snap.ownership_conflicts_pending ?? '0'),
          ownership_conflicts_resolved: String(snap.ownership_conflicts_resolved ?? '0'),
          rr_families_required: String(snap.rr_families_required ?? '0'),
          rr_families_completed: String(snap.rr_families_completed ?? '0'),
          land_required_for_possession: String(snap.land_required_for_possession ?? proj.land_area ?? ''),
          land_acquired_for_possession: String(snap.land_acquired_for_possession ?? '0'),
          stakeholder_requests_raised: String(snap.stakeholder_requests_raised ?? '0'),
          stakeholder_responses_received: String(snap.stakeholder_responses_received ?? '0'),
          departments_involved: String(snap.departments_involved ?? '1'),
          coordination_requests_raised: String(snap.coordination_requests_raised ?? '0'),
          coordination_requests_resolved: String(snap.coordination_requests_resolved ?? '0'),
        }));
      }
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadStatus('parsing');
    setUploadMessage('');
    setExtractedFields([]);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase();
      if (ext === 'xlsx' || ext === 'xls') {
        const raw = await parseExcelFile(file);
        const mapped = mapExtractedToForm(raw);
        const fields = Object.keys(mapped);
        if (fields.length === 0) {
          setUploadStatus('error');
          setUploadMessage('No recognizable fields found in the Excel file. Please check the column names match the data dictionary format, or use manual entry.');
        } else {
          setForm(prev => ({ ...prev, ...mapped as any }));
          setExtractedFields(fields);
          setUploadStatus('done');
          setUploadMessage(`Extracted ${fields.length} field(s) from Excel. Please review and correct below, then submit.`);
        }
      } else if (ext === 'pdf') {
        setUploadStatus('error');
        setUploadMessage('PDF upload: automatic extraction is not supported in-browser. Please use the manual entry form and refer to the PDF while entering data. Excel (.xlsx) is recommended for automatic extraction.');
      } else {
        setUploadStatus('error');
        setUploadMessage('Unsupported file type. Please upload an Excel (.xlsx/.xls) file.');
      }
    } catch (err: any) {
      setUploadStatus('error');
      setUploadMessage(err.message || 'Failed to parse file.');
    }
    // Reset file input so same file can be re-uploaded
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const n = (v: string) => parseFloat(v) || 0;
  const ni = (v: string) => parseInt(v) || 0;

  const buildPayload = () => ({
    snapshot_date: form.snapshot_date,
    current_stage: form.current_stage,
    next_stage: form.next_stage || undefined,
    status: form.status,
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
      land_required_for_possession: n(form.land_required_for_possession) || n(String(project?.land_area || 0)),
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
    if (!id) return;
    setSubmitting(true);
    setError('');
    try {
      await api.addSnapshot(id, buildPayload());
      navigate(`/projects/${id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to save snapshot.';
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSubmitting(false);
    }
  };

  const validateStep = () => {
    if (step === 0) return form.current_stage && form.snapshot_date;
    if (step === 1) return form.approvals_required;
    if (step === 2) return form.compensation_total_amount && form.beneficiaries_eligible && form.documents_required && form.notifications_required;
    if (step === 3) return form.parcels_total && form.land_required_for_possession;
    return true;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return <div className="text-gray-500 text-center py-20">Project not found.</div>;
  }

  const stageList = stages.length > 0 ? stages.map((s: any) => s.name) :
    ['Notification', 'Social Impact Assessment', 'Approval Process', 'Compensation Disbursement',
     'Rehabilitation & Resettlement', 'Land Possession', 'Documentation & Registry'];

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <button onClick={() => navigate('/projects')} className="hover:text-blue-700 transition-colors">Projects</button>
        <span>/</span>
        <button onClick={() => navigate(`/projects/${id}`)} className="hover:text-blue-700 transition-colors truncate max-w-xs">{project.project_name}</button>
        <span>/</span>
        <span className="text-gray-800">Update Data</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Update Project Data</h1>
        <p className="text-sm text-gray-500 mt-1">
          {project.project_name} · {project.district}, {project.state}
          · Current stage: <span className="font-medium text-gray-700">{project.current_stage}</span>
          · Last snapshot: <span className="font-mono">{project.snapshot_date}</span>
        </p>
        <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
          A new snapshot will be created — historical data is preserved. The ML model will re-predict after saving.
        </div>
      </div>

      {/* Upload section */}
      <div className="mb-5 bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-sm font-semibold text-gray-800">Upload Project Report (Optional)</h2>
            <p className="text-xs text-gray-500 mt-0.5">Upload Excel (.xlsx) to auto-fill fields. Review and correct before saving.</p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Upload Excel / PDF
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
        {uploadStatus === 'parsing' && (
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            Parsing file...
          </div>
        )}
        {uploadStatus === 'done' && (
          <div className="p-2 bg-green-50 border border-green-200 rounded text-xs text-green-800">
            <span className="font-semibold">Extracted fields:</span> {extractedFields.join(', ')}
            <br />{uploadMessage}
          </div>
        )}
        {uploadStatus === 'error' && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">{uploadMessage}</div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded text-red-700 text-sm">
          <strong>Error:</strong> {error}
        </div>
      )}

      <StepIndicator current={step} total={STEPS.length} />

      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-sm">

        {/* Step 0: Stage & Date */}
        {step === 0 && (
          <>
            <h2 className="text-sm font-semibold text-gray-800 mb-3 border-b border-gray-100 pb-2">Current Project Stage</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Snapshot Date" required hint="Date of this observation/report">
                <input type="date" className={inputClass} value={form.snapshot_date} onChange={set('snapshot_date')} />
              </FormField>
              <FormField label="Project Status">
                <select className={inputClass} value={form.status} onChange={set('status')}>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                </select>
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
          </>
        )}

        {/* Step 1: Approvals + Legal */}
        {step === 1 && (
          <>
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Administrative Approvals</h2>
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
              <FormField label="Oldest Pending Approval (days)">
                <input type="number" className={inputClass} value={form.oldest_pending_approval_days} onChange={set('oldest_pending_approval_days')} min="0" />
              </FormField>
            </div>

            <h2 className="text-sm font-semibold text-gray-800 mt-4 mb-1">Legal & Disputes</h2>
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
                <input type="number" className={inputClass} value={form.oldest_pending_case_days} onChange={set('oldest_pending_case_days')} min="0" />
              </FormField>
            </div>
          </>
        )}

        {/* Step 2: Compensation + Documentation + Notifications */}
        {step === 2 && (
          <>
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Compensation</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Total Amount (₹ Cr)" required>
                <input type="number" className={inputClass} value={form.compensation_total_amount} onChange={set('compensation_total_amount')} min="0" step="0.1" />
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

            <h2 className="text-sm font-semibold text-gray-800 mt-4 mb-1">Documentation</h2>
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

            <h2 className="text-sm font-semibold text-gray-800 mt-4 mb-1">Statutory Notifications</h2>
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

        {/* Step 3: Ownership + R&R + Possession + Stakeholder + Coordination */}
        {step === 3 && (
          <>
            <h2 className="text-sm font-semibold text-gray-800 mb-1">Ownership & Parcels</h2>
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

            <h2 className="text-sm font-semibold text-gray-800 mt-4 mb-1">Rehabilitation & Resettlement</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="R&R Families Required">
                <input type="number" className={inputClass} value={form.rr_families_required} onChange={set('rr_families_required')} min="0" />
              </FormField>
              <FormField label="R&R Families Completed">
                <input type="number" className={inputClass} value={form.rr_families_completed} onChange={set('rr_families_completed')} min="0" />
              </FormField>
            </div>

            <h2 className="text-sm font-semibold text-gray-800 mt-4 mb-1">Possession</h2>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Land Required (ha)" required hint={`Project total: ${project.land_area} ha`}>
                <input type="number" className={inputClass} value={form.land_required_for_possession} onChange={set('land_required_for_possession')} min="0" step="0.1" />
              </FormField>
              <FormField label="Land Acquired (ha)">
                <input type="number" className={inputClass} value={form.land_acquired_for_possession} onChange={set('land_acquired_for_possession')} min="0" step="0.1" />
              </FormField>
            </div>

            <h2 className="text-sm font-semibold text-gray-800 mt-4 mb-1">Stakeholder & Coordination</h2>
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
        <button
          onClick={() => step > 0 ? setStep(s => s - 1) : navigate(`/projects/${id}`)}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded border border-gray-300 transition-colors"
        >
          {step === 0 ? '← Back to Project' : '← Back'}
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Step {step + 1} of {STEPS.length}</span>
          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!validateStep()}
              className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || !validateStep()}
              className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold rounded transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {submitting ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Saving...</>
              ) : (
                <>Save Snapshot & Re-Predict →</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
