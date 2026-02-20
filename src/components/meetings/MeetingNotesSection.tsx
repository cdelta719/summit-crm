import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../store/AuthContext';

interface MeetingNote {
  id: string;
  lead_id: string;
  company_name: string;
  contact_name: string;
  meeting_type: string;
  meeting_date: string;
  pain_points: string;
  objections: string;
  next_steps: string;
  notes: string;
  outcome: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

interface Props {
  entityId: string;
  companyName: string;
  contactName: string;
  meetingTypes?: string[];
  inputClass?: string;
  labelClass?: string;
}

const DEFAULT_LEAD_TYPES = ['Discovery Call', 'Demo', 'Follow-Up', 'Negotiation', 'Onboarding', 'Other'];
const CLIENT_EXTRA_TYPES = ['Check-In', 'QBR', 'Support Escalation'];

const OUTCOME_COLORS: Record<string, string> = {
  Positive: 'bg-green-100 text-green-700',
  Neutral: 'bg-gray-100 text-gray-600',
  Negative: 'bg-red-100 text-red-700',
};

export default function MeetingNotesSection({
  entityId,
  companyName,
  contactName,
  meetingTypes,
  inputClass = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/25",
  labelClass = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1",
}: Props) {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);

  const types = meetingTypes || DEFAULT_LEAD_TYPES;

  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    meeting_type: types[0],
    meeting_date: today,
    pain_points: '',
    objections: '',
    next_steps: '',
    notes: '',
    outcome: 'Neutral',
  });

  const fetchNotes = useCallback(async () => {
    const { data } = await supabase
      .from('meeting_notes')
      .select('*')
      .eq('lead_id', entityId)
      .order('meeting_date', { ascending: false });
    if (data) setNotes(data);
  }, [entityId]);

  useEffect(() => {
    fetchNotes();
    const channel = supabase
      .channel(`meeting-notes-${entityId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_notes', filter: `lead_id=eq.${entityId}` }, () => fetchNotes())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [entityId, fetchNotes]);

  const handleSave = async () => {
    if (!currentUser) return;
    setSaving(true);
    await supabase.from('meeting_notes').insert({
      lead_id: entityId,
      company_name: companyName,
      contact_name: contactName,
      meeting_type: form.meeting_type,
      meeting_date: form.meeting_date,
      pain_points: form.pain_points,
      objections: form.objections,
      next_steps: form.next_steps,
      notes: form.notes,
      outcome: form.outcome,
      created_by: currentUser.id,
      created_by_name: currentUser.name,
    });
    setForm({
      meeting_type: types[0],
      meeting_date: today,
      pain_points: '',
      objections: '',
      next_steps: '',
      notes: '',
      outcome: 'Neutral',
    });
    setShowForm(false);
    setSaving(false);
    fetchNotes();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCollapsed(!collapsed)} className="flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-gray-700">
          <span className={`transition-transform ${collapsed ? '-rotate-90' : ''}`}>▾</span>
          📝 Meeting Notes ({notes.length})
        </button>
        {!collapsed && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-[#1E3A5F] hover:bg-[#B91C1C] text-white transition-all"
          >
            + Add Meeting Note
          </button>
        )}
      </div>

      {collapsed ? null : (
        <>
          {/* Add Form */}
          {showForm && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Meeting Type</label>
                  <select className={inputClass} value={form.meeting_type} onChange={e => setForm(f => ({ ...f, meeting_type: e.target.value }))}>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Date</label>
                  <input className={inputClass} type="date" value={form.meeting_date} onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Outcome</label>
                  <select className={inputClass} value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))}>
                    <option value="Positive">Positive</option>
                    <option value="Neutral">Neutral</option>
                    <option value="Negative">Negative</option>
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Pain Points</label>
                <textarea className={`${inputClass} resize-none`} rows={2} value={form.pain_points} onChange={e => setForm(f => ({ ...f, pain_points: e.target.value }))} placeholder="What problems are they facing?" />
              </div>
              <div>
                <label className={labelClass}>Objections</label>
                <textarea className={`${inputClass} resize-none`} rows={2} value={form.objections} onChange={e => setForm(f => ({ ...f, objections: e.target.value }))} placeholder="Any pushback or concerns?" />
              </div>
              <div>
                <label className={labelClass}>Next Steps</label>
                <textarea className={`${inputClass} resize-none`} rows={2} value={form.next_steps} onChange={e => setForm(f => ({ ...f, next_steps: e.target.value }))} placeholder="What's the follow-up plan?" />
              </div>
              <div>
                <label className={labelClass}>Notes</label>
                <textarea className={`${inputClass} resize-none`} rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Additional notes..." />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1E3A5F] hover:bg-[#B91C1C] text-white transition-all disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Note'}
                </button>
              </div>
            </div>
          )}

          {/* Notes List */}
          <div className="space-y-3 max-h-96 overflow-auto">
            {notes.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No meeting notes yet</p>
            ) : (
              notes.map(note => (
                <div key={note.id} className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">{note.meeting_type}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${OUTCOME_COLORS[note.outcome] || 'bg-gray-100 text-gray-600'}`}>{note.outcome}</span>
                    <span className="text-[10px] text-gray-400">{new Date(note.meeting_date).toLocaleDateString()}</span>
                    <span className="text-[10px] text-gray-400">· {note.created_by_name}</span>
                  </div>
                  {note.pain_points && (
                    <div className="mb-1.5">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Pain Points: </span>
                      <span className="text-xs text-gray-700">{note.pain_points}</span>
                    </div>
                  )}
                  {note.objections && (
                    <div className="mb-1.5">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Objections: </span>
                      <span className="text-xs text-gray-700">{note.objections}</span>
                    </div>
                  )}
                  {note.next_steps && (
                    <div className="mb-1.5">
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Next Steps: </span>
                      <span className="text-xs text-gray-700">{note.next_steps}</span>
                    </div>
                  )}
                  {note.notes && (
                    <div>
                      <span className="text-[10px] font-semibold text-gray-400 uppercase">Notes: </span>
                      <span className="text-xs text-gray-700">{note.notes}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

export { DEFAULT_LEAD_TYPES, CLIENT_EXTRA_TYPES };
