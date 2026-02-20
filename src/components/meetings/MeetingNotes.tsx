import { useState, useEffect, useCallback } from 'react';
import { localDB } from '../../utils/local-storage';
import { useAuth } from '../../store/AuthContext';

interface MeetingNote {
  id: string;
  lead_id: string | null;
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

const MEETING_TYPES = ['Discovery Call', 'Demo', 'Follow-Up', 'Negotiation', 'Onboarding', 'Other'];
const OUTCOMES = ['Positive', 'Neutral', 'Negative'];
const OUTCOME_COLORS: Record<string, string> = {
  Positive: 'bg-green-100 text-green-700',
  Neutral: 'bg-yellow-100 text-yellow-700',
  Negative: 'bg-red-100 text-red-700',
};

export default function MeetingNotes() {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState<MeetingNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editNote, setEditNote] = useState<MeetingNote | null>(null);
  const [viewNote, setViewNote] = useState<MeetingNote | null>(null);
  const [filterType, setFilterType] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('');
  const [filterMember, setFilterMember] = useState('');

  const emptyForm = { company_name: '', contact_name: '', meeting_type: 'Discovery Call', meeting_date: '', pain_points: '', objections: '', next_steps: '', notes: '', outcome: 'Neutral' };
  const [form, setForm] = useState(emptyForm);

  const fetchNotes = useCallback(async () => {
    const { data } = await localDB.from('meeting_notes').select('*').order('meeting_date', { ascending: false });
    if (data) setNotes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotes();
    const channel = localDB.channel('meetings-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meeting_notes' }, () => fetchNotes())
      .subscribe();
    return () => { localDB.removeChannel(channel); };
  }, [fetchNotes]);

  const openAdd = () => {
    setEditNote(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (n: MeetingNote) => {
    setEditNote(n);
    setForm({
      company_name: n.company_name, contact_name: n.contact_name, meeting_type: n.meeting_type,
      meeting_date: n.meeting_date?.slice(0, 10) || '', pain_points: n.pain_points || '', objections: n.objections || '',
      next_steps: n.next_steps || '', notes: n.notes || '', outcome: n.outcome,
    });
    setViewNote(null);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.company_name.trim() || !currentUser) return;
    const payload = {
      company_name: form.company_name, contact_name: form.contact_name, meeting_type: form.meeting_type,
      meeting_date: form.meeting_date || new Date().toISOString().slice(0, 10),
      pain_points: form.pain_points, objections: form.objections, next_steps: form.next_steps,
      notes: form.notes, outcome: form.outcome,
    };
    if (editNote) {
      await localDB.from('meeting_notes').update(payload).eq('id', editNote.id);
    } else {
      await localDB.from('meeting_notes').insert({
        ...payload, created_by: currentUser.id, created_by_name: currentUser.name,
      });
    }
    setShowModal(false);
    fetchNotes();
  };

  const filtered = notes.filter(n => {
    if (filterType && n.meeting_type !== filterType) return false;
    if (filterOutcome && n.outcome !== filterOutcome) return false;
    if (filterMember && n.created_by_name !== filterMember) return false;
    return true;
  });

  const members = [...new Set(notes.map(n => n.created_by_name))].filter(Boolean);

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]';
  const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">📝 Meeting Notes</h1>
        <button onClick={openAdd} className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] transition-all">+ Add Meeting Note</button>
      </div>

      <div className="flex gap-3">
        <select value={filterMember} onChange={e => setFilterMember(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs">
          <option value="">All Members</option>
          {members.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs">
          <option value="">All Types</option>
          {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterOutcome} onChange={e => setFilterOutcome(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs">
          <option value="">All Outcomes</option>
          {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map(n => (
          <div key={n.id} onClick={() => setViewNote(n)} className="bg-white rounded-xl border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-900">{n.company_name}</h3>
                <span className="text-xs text-gray-500">{n.contact_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${OUTCOME_COLORS[n.outcome] || 'bg-gray-100 text-gray-600'}`}>{n.outcome}</span>
                <span className="text-xs text-gray-400">{n.meeting_date}</span>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span className="px-2 py-0.5 bg-gray-100 rounded text-[10px]">{n.meeting_type}</span>
              <span>by {n.created_by_name}</span>
              {n.next_steps && <span className="truncate max-w-xs">Next: {n.next_steps}</span>}
            </div>
          </div>
        ))}
        {filtered.length === 0 && <div className="text-center py-12 text-gray-400">No meeting notes found</div>}
      </div>

      {/* View Modal */}
      {viewNote && !showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setViewNote(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{viewNote.company_name}</h2>
              <div className="flex items-center gap-2">
                <button onClick={() => openEdit(viewNote)} className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">✏️ Edit</button>
                <button onClick={() => setViewNote(null)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div><span className="text-gray-500">Contact:</span> <strong>{viewNote.contact_name}</strong></div>
              <div><span className="text-gray-500">Type:</span> <strong>{viewNote.meeting_type}</strong></div>
              <div><span className="text-gray-500">Date:</span> <strong>{viewNote.meeting_date}</strong></div>
            </div>
            <div className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${OUTCOME_COLORS[viewNote.outcome] || ''}`}>{viewNote.outcome}</div>
            {[
              { label: '😰 Pain Points', value: viewNote.pain_points },
              { label: '🚫 Objections', value: viewNote.objections },
              { label: '➡️ Next Steps', value: viewNote.next_steps },
              { label: '📝 Notes', value: viewNote.notes },
            ].filter(s => s.value).map(s => (
              <div key={s.label}>
                <h3 className="text-xs font-semibold text-gray-700 mb-1">{s.label}</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-lg p-3">{s.value}</p>
              </div>
            ))}
            <div className="text-[10px] text-gray-400">Added by {viewNote.created_by_name}</div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[85vh] overflow-y-auto space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">{editNote ? 'Edit Meeting Note' : 'Add Meeting Note'}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Company Name *</label><input className={inputClass} value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
              <div><label className={labelClass}>Contact Name</label><input className={inputClass} value={form.contact_name} onChange={e => setForm({ ...form, contact_name: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className={labelClass}>Meeting Type</label>
                <select className={inputClass} value={form.meeting_type} onChange={e => setForm({ ...form, meeting_type: e.target.value })}>
                  {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={form.meeting_date} onChange={e => setForm({ ...form, meeting_date: e.target.value })} /></div>
              <div><label className={labelClass}>Outcome</label>
                <select className={inputClass} value={form.outcome} onChange={e => setForm({ ...form, outcome: e.target.value })}>
                  {OUTCOMES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div><label className={labelClass}>Pain Points Discussed</label><textarea className={inputClass} rows={2} value={form.pain_points} onChange={e => setForm({ ...form, pain_points: e.target.value })} /></div>
            <div><label className={labelClass}>Objections Raised</label><textarea className={inputClass} rows={2} value={form.objections} onChange={e => setForm({ ...form, objections: e.target.value })} /></div>
            <div><label className={labelClass}>Next Steps</label><textarea className={inputClass} rows={2} value={form.next_steps} onChange={e => setForm({ ...form, next_steps: e.target.value })} /></div>
            <div><label className={labelClass}>General Notes</label><textarea className={inputClass} rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C]">
                {editNote ? 'Save Changes' : 'Add Note'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
