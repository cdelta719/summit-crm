import { useState } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { INDUSTRIES, LEAD_SOURCES, PIPELINE_STAGES } from '../../types';

const inputClass = "w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/25 transition-all";
const labelClass = "block text-xs font-medium text-text-secondary mb-1";

export default function AddLeadModal() {
  const { state, dispatch, addLead } = useApp();
  const { users } = useAuth();
  const [quickMode, setQuickMode] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const activeMembers = users.filter(u => u.active).map(u => u.name);
  const set = (key: string, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addLead({
      companyName: form.companyName || '',
      pointOfContact: form.pointOfContact || '',
      email: form.email || '',
      phone: form.phone || '',
      industry: form.industry || '',
      needs: form.needs || '',
      employeeCount: form.employeeCount || '',
      annualRevenue: form.annualRevenue || '',
      location: form.location || '',
      leadSource: form.leadSource || '',
      pipelineStage: (form.pipelineStage as typeof PIPELINE_STAGES[number]['key']) || 'new_lead',
      dealValue: parseFloat(form.dealValue || '0') || 0,
      assignedTo: form.assignedTo || '',
      scheduledCallDate: form.scheduledCallDate || '',
    });
    setForm({});
    dispatch({ type: 'TOGGLE_ADD_MODAL', show: false });
  };

  const close = () => {
    setForm({});
    dispatch({ type: 'TOGGLE_ADD_MODAL', show: false });
  };

  return (
    <Modal open={state.showAddModal} onClose={close} title="Add New Lead" wide>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => setQuickMode(false)}
          className={`text-xs px-3 py-1.5 rounded-lg transition-all ${!quickMode ? 'bg-brand/15 text-brand-light font-medium' : 'text-text-secondary hover:bg-surface-3'}`}
        >Full Details</button>
        <button
          onClick={() => setQuickMode(true)}
          className={`text-xs px-3 py-1.5 rounded-lg transition-all ${quickMode ? 'bg-brand/15 text-brand-light font-medium' : 'text-text-secondary hover:bg-surface-3'}`}
        >Quick Add</button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Company Name *</label>
            <input className={inputClass} value={form.companyName || ''} onChange={e => set('companyName', e.target.value)} required placeholder="Acme Corp" />
          </div>
          <div>
            <label className={labelClass}>Point of Contact *</label>
            <input className={inputClass} value={form.pointOfContact || ''} onChange={e => set('pointOfContact', e.target.value)} required placeholder="John Doe" />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input className={inputClass} value={form.phone || ''} onChange={e => set('phone', e.target.value)} placeholder="(555) 123-4567" />
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <input className={inputClass} type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} placeholder="john@acme.com" />
          </div>
        </div>

        {!quickMode && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Industry</label>
                <select className={inputClass} value={form.industry || ''} onChange={e => set('industry', e.target.value)}>
                  <option value="">Select...</option>
                  {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Location (City/State)</label>
                <input className={inputClass} value={form.location || ''} onChange={e => set('location', e.target.value)} placeholder="Dallas, TX" />
              </div>
              <div>
                <label className={labelClass}>Employee Count</label>
                <input className={inputClass} value={form.employeeCount || ''} onChange={e => set('employeeCount', e.target.value)} placeholder="25" />
              </div>
              <div>
                <label className={labelClass}>Annual Revenue</label>
                <input className={inputClass} value={form.annualRevenue || ''} onChange={e => set('annualRevenue', e.target.value)} placeholder="$2M" />
              </div>
              <div>
                <label className={labelClass}>Lead Source</label>
                <select className={inputClass} value={form.leadSource || ''} onChange={e => set('leadSource', e.target.value)}>
                  <option value="">Select...</option>
                  {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Deal Value ($)</label>
                <input className={inputClass} type="number" value={form.dealValue || ''} onChange={e => set('dealValue', e.target.value)} placeholder="5000" />
              </div>
              <div>
                <label className={labelClass}>Pipeline Stage</label>
                <select className={inputClass} value={form.pipelineStage || 'new_lead'} onChange={e => set('pipelineStage', e.target.value)}>
                  {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Assigned To</label>
                <select className={inputClass} value={form.assignedTo || ''} onChange={e => set('assignedTo', e.target.value)}>
                  <option value="">Unassigned</option>
                  {activeMembers.map(m => <option key={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Schedule Call</label>
                <input className={inputClass} type="date" value={form.scheduledCallDate || ''} onChange={e => set('scheduledCallDate', e.target.value)} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Needs</label>
              <textarea className={`${inputClass} min-h-[60px] resize-none`} value={form.needs || ''} onChange={e => set('needs', e.target.value)} placeholder="What do they need from us?" />
            </div>
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <button type="button" onClick={close} className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-3 rounded-lg transition-all">
            Cancel
          </button>
          <button type="submit" className="px-6 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-lg transition-all">
            Add Lead
          </button>
        </div>
      </form>
    </Modal>
  );
}
