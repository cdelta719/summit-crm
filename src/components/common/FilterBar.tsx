import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { PIPELINE_STAGES, INDUSTRIES, LEAD_SOURCES } from '../../types';

const selectClass = "bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-brand/50 transition-all";

export default function FilterBar() {
  const { state, dispatch } = useApp();
  const { users } = useAuth();
  const [showSave, setShowSave] = useState(false);
  const [presetName, setPresetName] = useState('');
  const f = state.filters;
  const set = (patch: Partial<typeof f>) => dispatch({ type: 'SET_FILTERS', filters: { ...f, ...patch } });

  const activeMembers = users.filter(u => u.active).map(u => u.name);

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-surface-1 border-b border-border">
      <select value={f.stage} onChange={e => set({ stage: e.target.value as typeof f.stage })} className={selectClass}>
        <option value="">All Stages</option>
        {PIPELINE_STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
      </select>
      <select value={f.industry} onChange={e => set({ industry: e.target.value })} className={selectClass}>
        <option value="">All Industries</option>
        {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
      </select>
      <select value={f.leadSource} onChange={e => set({ leadSource: e.target.value })} className={selectClass}>
        <option value="">All Sources</option>
        {LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}
      </select>
      <select value={f.assignedTo} onChange={e => set({ assignedTo: e.target.value })} className={selectClass}>
        <option value="">All Team</option>
        {activeMembers.map(m => <option key={m}>{m}</option>)}
      </select>
      <input type="date" value={f.dateFrom} onChange={e => set({ dateFrom: e.target.value })} className={selectClass} />
      <input type="date" value={f.dateTo} onChange={e => set({ dateTo: e.target.value })} className={selectClass} />

      {state.filterPresets.length > 0 && (
        <select
          value=""
          onChange={e => {
            const p = state.filterPresets.find(p => p.id === e.target.value);
            if (p) dispatch({ type: 'SET_FILTERS', filters: p.filters });
          }}
          className={selectClass}
        >
          <option value="">Load Preset...</option>
          {state.filterPresets.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      )}

      {showSave ? (
        <div className="flex items-center gap-1">
          <input type="text" placeholder="Preset name" value={presetName} onChange={e => setPresetName(e.target.value)} className={`${selectClass} w-32`} autoFocus />
          <button onClick={() => {
            if (presetName.trim()) {
              dispatch({ type: 'SAVE_PRESET', preset: { id: uuidv4(), name: presetName.trim(), filters: f } });
              setPresetName(''); setShowSave(false);
            }
          }} className="text-xs text-brand hover:text-brand-light">Save</button>
          <button onClick={() => setShowSave(false)} className="text-xs text-text-tertiary">✕</button>
        </div>
      ) : (
        <button onClick={() => setShowSave(true)} className="text-xs text-text-tertiary hover:text-text-secondary">💾 Save Filter</button>
      )}
    </div>
  );
}
