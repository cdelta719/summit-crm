import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../store/AuthContext';

interface RevenueEntry {
  id: string;
  client_id: string | null;
  company_name: string;
  type: string;
  amount: number;
  date: string;
  status: string;
  notes: string;
  created_by: string;
  created_by_name: string;
  created_at: string;
}

const TYPES = ['Setup Fee', 'Monthly Maintenance', 'Add-on', 'Other'];
const STATUSES = ['Paid', 'Pending', 'Overdue'];

export default function RevenueTracker() {
  const { currentUser } = useAuth();
  const [entries, setEntries] = useState<RevenueEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortField, setSortField] = useState<'date' | 'amount' | 'company_name'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [form, setForm] = useState({ company_name: '', type: 'Setup Fee', amount: '', date: '', status: 'Paid', notes: '' });

  const fetchEntries = useCallback(async () => {
    const { data } = await supabase.from('revenue').select('*').order('date', { ascending: false });
    if (data) setEntries(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntries();
    const channel = supabase.channel('revenue-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'revenue' }, () => fetchEntries())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchEntries]);

  const handleAdd = async () => {
    if (!form.company_name.trim() || !form.amount || !currentUser) return;
    await supabase.from('revenue').insert({
      company_name: form.company_name, type: form.type, amount: parseFloat(form.amount),
      date: form.date || new Date().toISOString().slice(0, 10), status: form.status, notes: form.notes,
      created_by: currentUser.id, created_by_name: currentUser.name,
    });
    setForm({ company_name: '', type: 'Setup Fee', amount: '', date: '', status: 'Paid', notes: '' });
    setShowModal(false);
    fetchEntries();
  };

  const now = new Date();
  const thisMonth = now.toISOString().slice(0, 7);
  const totalRevenue = entries.filter(e => e.status === 'Paid').reduce((s, e) => s + e.amount, 0);
  const monthRevenue = entries.filter(e => e.status === 'Paid' && (e.date || '').startsWith(thisMonth)).reduce((s, e) => s + e.amount, 0);
  const mrr = entries.filter(e => e.status === 'Paid' && e.type === 'Monthly Maintenance').reduce((s, e) => s + e.amount, 0);
  const outstanding = entries.filter(e => e.status === 'Pending' || e.status === 'Overdue').reduce((s, e) => s + e.amount, 0);

  const filtered = entries
    .filter(e => (!filterType || e.type === filterType) && (!filterStatus || e.status === filterStatus))
    .sort((a, b) => {
      const av = sortField === 'amount' ? a.amount : (a[sortField] || '');
      const bv = sortField === 'amount' ? b.amount : (b[sortField] || '');
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

  // Monthly summary
  const monthlyMap: Record<string, { setup: number; recurring: number; other: number }> = {};
  entries.filter(e => e.status === 'Paid').forEach(e => {
    const m = (e.date || '').slice(0, 7);
    if (!monthlyMap[m]) monthlyMap[m] = { setup: 0, recurring: 0, other: 0 };
    if (e.type === 'Setup Fee') monthlyMap[m].setup += e.amount;
    else if (e.type === 'Monthly Maintenance') monthlyMap[m].recurring += e.amount;
    else monthlyMap[m].other += e.amount;
  });
  const monthlySummary = Object.entries(monthlyMap).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 12);

  const fmt = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]/20 focus:border-[#1E3A5F]';
  const labelClass = 'block text-xs font-medium text-gray-700 mb-1';

  const statusColor = (s: string) => s === 'Paid' ? 'bg-green-100 text-green-700' : s === 'Overdue' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700';

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">💰 Revenue Tracker</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C] transition-all">+ Add Entry</button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: fmt(totalRevenue), icon: '💰' },
          { label: "This Month", value: fmt(monthRevenue), icon: '📅' },
          { label: 'MRR', value: fmt(mrr), icon: '🔄' },
          { label: 'Outstanding', value: fmt(outstanding), icon: '⚠️' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-lg mb-1">{m.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{m.value}</div>
            <div className="text-xs text-gray-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs">
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs">
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Revenue Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('company_name')}>Company {sortField === 'company_name' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('amount')}>Amount {sortField === 'amount' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 cursor-pointer" onClick={() => toggleSort('date')}>Date {sortField === 'date' && (sortDir === 'asc' ? '↑' : '↓')}</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Added By</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{e.company_name}</td>
                <td className="px-4 py-3 text-gray-600">{e.type}</td>
                <td className="px-4 py-3 font-semibold text-gray-900">{fmt(e.amount)}</td>
                <td className="px-4 py-3 text-gray-500">{e.date}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusColor(e.status)}`}>{e.status}</span></td>
                <td className="px-4 py-3 text-gray-500">{e.created_by_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="p-8 text-center text-sm text-gray-400">No entries found</div>}
      </div>

      {/* Monthly Summary */}
      {monthlySummary.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Monthly Summary</h2>
          <div className="space-y-2">
            {monthlySummary.map(([month, data]) => (
              <div key={month} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                <span className="text-xs font-medium text-gray-700 w-20">{month}</span>
                <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                  <span className="text-gray-500">Setup: <strong className="text-gray-900">{fmt(data.setup)}</strong></span>
                  <span className="text-gray-500">Recurring: <strong className="text-gray-900">{fmt(data.recurring)}</strong></span>
                  <span className="text-gray-500">Total: <strong className="text-[#1E3A5F]">{fmt(data.setup + data.recurring + data.other)}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-lg space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">Add Revenue Entry</h2>
            <div><label className={labelClass}>Company Name *</label><input className={inputClass} value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Type</label>
                <select className={inputClass} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className={labelClass}>Amount *</label><input type="number" className={inputClass} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="5000" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={labelClass}>Date</label><input type="date" className={inputClass} value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></div>
              <div><label className={labelClass}>Status</label>
                <select className={inputClass} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                  {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div><label className={labelClass}>Notes</label><textarea className={inputClass} rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleAdd} className="px-4 py-2 bg-[#1E3A5F] text-white text-sm font-medium rounded-lg hover:bg-[#B91C1C]">Add Entry</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
