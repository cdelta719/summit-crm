import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../store/AuthContext';
import { useApp } from '../../store/AppContext';
import { TEAM_MEMBERS } from '../../types';

interface Task {
  id: string;
  title: string;
  description: string;
  assigned_to: string;
  lead_id: string | null;
  due_date: string;
  priority: 'Low' | 'Medium' | 'High' | 'Urgent';
  status: 'todo' | 'in_progress' | 'done';
  created_by: string;
  created_by_name: string;
  completed_at: string | null;
  created_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  Low: 'bg-gray-100 text-gray-600',
  Medium: 'bg-blue-100 text-blue-700',
  High: 'bg-orange-100 text-orange-700',
  Urgent: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  todo: { label: 'To Do', icon: '📋', color: 'bg-gray-100 text-gray-700' },
  in_progress: { label: 'In Progress', icon: '🔄', color: 'bg-blue-100 text-blue-700' },
  done: { label: 'Done', icon: '✅', color: 'bg-green-100 text-green-700' },
};

const MEMBER_COLORS: Record<string, string> = { CD: '#1E3A5F', Pablo: '#2563EB', Chito: '#16A34A', Arturo: '#9333EA' };

export default function TaskManager() {
  const { currentUser } = useAuth();
  const { state } = useApp();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const [form, setForm] = useState({
    title: '', description: '', assigned_to: '', due_date: '', priority: 'Medium' as Task['priority'], lead_id: '',
  });

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) setTasks(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
    const channel = supabase.channel('tasks-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchTasks())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchTasks]);

  const openAdd = (member?: string) => {
    setEditTask(null);
    setForm({ title: '', description: '', assigned_to: member || '', due_date: '', priority: 'Medium', lead_id: '' });
    setShowModal(true);
  };

  const openEdit = (t: Task) => {
    setEditTask(t);
    setForm({ title: t.title, description: t.description, assigned_to: t.assigned_to, due_date: t.due_date?.slice(0, 10) || '', priority: t.priority, lead_id: t.lead_id || '' });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !currentUser) return;
    if (editTask) {
      await supabase.from('tasks').update({
        title: form.title, description: form.description, assigned_to: form.assigned_to,
        due_date: form.due_date || null, priority: form.priority, lead_id: form.lead_id || null,
      }).eq('id', editTask.id);
    } else {
      await supabase.from('tasks').insert({
        title: form.title, description: form.description, assigned_to: form.assigned_to,
        due_date: form.due_date || null, priority: form.priority, lead_id: form.lead_id || null,
        status: 'todo', created_by: currentUser.id, created_by_name: currentUser.name,
      });
    }
    setShowModal(false);
    fetchTasks();
  };

  const cycleStatus = async (t: Task) => {
    const next = t.status === 'todo' ? 'in_progress' : t.status === 'in_progress' ? 'done' : 'todo';
    const updates: Record<string, unknown> = { status: next };
    if (next === 'done') updates.completed_at = new Date().toISOString();
    else updates.completed_at = null;
    await supabase.from('tasks').update(updates).eq('id', t.id);
    fetchTasks();
  };

  const deleteTask = async (id: string) => {
    await supabase.from('tasks').delete().eq('id', id);
    fetchTasks();
  };

  const isOverdue = (t: Task) => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date();

  const filtered = tasks.filter(t => !statusFilter || t.status === statusFilter);

  const unassigned = filtered.filter(t => !t.assigned_to);

  const totalOpen = tasks.filter(t => t.status !== 'done').length;
  const totalOverdue = tasks.filter(t => isOverdue(t)).length;

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]';
  const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-full overflow-y-auto p-4 bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">📅 Tasks</h1>
          <p className="text-xs text-gray-500">{totalOpen} open{totalOverdue > 0 && <span className="text-red-600 font-medium"> · {totalOverdue} overdue</span>}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white">
            <option value="">All Status</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button onClick={() => openAdd()} className="px-4 py-2 bg-[#1E3A5F] text-white text-xs font-medium rounded-lg hover:bg-[#B91C1C] transition-all">
            + Add Task
          </button>
        </div>
      </div>

      {/* Team Member Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {TEAM_MEMBERS.map(member => {
          const memberTasks = filtered.filter(t => t.assigned_to === member);
          const memberOpen = memberTasks.filter(t => t.status !== 'done').length;
          const memberDone = memberTasks.filter(t => t.status === 'done').length;

          return (
            <div key={member} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              {/* Member Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: MEMBER_COLORS[member] || '#6B7280' }}>
                    {member.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{member}</h3>
                    <p className="text-[10px] text-gray-400">{memberOpen} open · {memberDone} done</p>
                  </div>
                </div>
                <button onClick={() => openAdd(member)} className="px-2.5 py-1 text-[10px] font-medium text-[#1E3A5F] border border-[#1E3A5F]/20 rounded-lg hover:bg-red-50 transition-all">
                  + Add
                </button>
              </div>

              {/* Task List */}
              <div className="p-3 space-y-2 max-h-80 overflow-y-auto">
                {memberTasks.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No tasks assigned</p>
                ) : (
                  memberTasks.map(t => (
                    <div key={t.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border transition-all hover:shadow-sm cursor-pointer ${
                        t.status === 'done' ? 'bg-gray-50 border-gray-100 opacity-60' :
                        isOverdue(t) ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'
                      }`}
                      onClick={() => openEdit(t)}>
                      {/* Status toggle */}
                      <button onClick={e => { e.stopPropagation(); cycleStatus(t); }}
                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          t.status === 'done' ? 'bg-green-500 border-green-500 text-white' :
                          t.status === 'in_progress' ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                        }`}>
                        {t.status === 'done' && <span className="text-[10px]">✓</span>}
                        {t.status === 'in_progress' && <span className="text-[8px] text-blue-500">●</span>}
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-medium ${t.status === 'done' ? 'line-through text-gray-400' : 'text-gray-900'}`}>{t.title}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${STATUS_LABELS[t.status].color}`}>{STATUS_LABELS[t.status].label}</span>
                          {t.due_date && (
                            <span className={`text-[9px] ${isOverdue(t) ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                              {isOverdue(t) ? '⚠️ ' : ''}{new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>
                      </div>

                      <button onClick={e => { e.stopPropagation(); deleteTask(t.id); }}
                        className="text-gray-300 hover:text-red-500 text-xs transition-all shrink-0">✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Unassigned Tasks */}
      {unassigned.length > 0 && (
        <div className="mt-4 bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">📥 Unassigned Tasks <span className="text-xs text-gray-400 font-normal">({unassigned.length})</span></h3>
          </div>
          <div className="p-3 space-y-2">
            {unassigned.map(t => (
              <div key={t.id} onClick={() => openEdit(t)}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:shadow-sm ${isOverdue(t) ? 'bg-red-50 border-red-200' : 'bg-white border-gray-100'}`}>
                <button onClick={e => { e.stopPropagation(); cycleStatus(t); }}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    t.status === 'done' ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
                  }`}>
                  {t.status === 'done' && <span className="text-[10px]">✓</span>}
                </button>
                <p className="text-xs font-medium text-gray-900 flex-1">{t.title}</p>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${PRIORITY_COLORS[t.priority]}`}>{t.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">{editTask ? 'Edit Task' : 'New Task'}</h2>
            <div><label className={labelClass}>Title *</label><input className={inputClass} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} autoFocus /></div>
            <div><label className={labelClass}>Description</label><textarea className={inputClass} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Assigned To</label>
                <select className={inputClass} value={form.assigned_to} onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                  <option value="">Unassigned</option>
                  {TEAM_MEMBERS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Due Date</label><input type="date" className={inputClass} value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Priority</label>
                <select className={inputClass} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as Task['priority'] })}>
                  {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Link to Lead</label>
                <select className={inputClass} value={form.lead_id} onChange={e => setForm({ ...form, lead_id: e.target.value })}>
                  <option value="">None</option>
                  {state.leads.map(l => <option key={l.id} value={l.id}>{l.companyName}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleSave} disabled={!form.title.trim()} className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] disabled:opacity-50">
                {editTask ? 'Save' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
