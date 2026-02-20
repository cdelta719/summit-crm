import { useState, useEffect, useCallback } from 'react';
import { localDB } from '../../utils/local-storage';
import { useApp } from '../../store/AppContext';

type TimeRange = 'week' | 'month' | 'all';

function getStart(range: TimeRange): string {
  const now = new Date();
  if (range === 'week') { const d = new Date(now); d.setDate(d.getDate() - 7); return d.toISOString(); }
  if (range === 'month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  return '2020-01-01T00:00:00Z';
}

export default function Leaderboard() {
  const { state } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [activities, setActivities] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const start = getStart(timeRange);
    const [actRes, revRes, taskRes] = await Promise.all([
      localDB.from('activities').select('*').gte('created_at', start),
      localDB.from('revenue').select('*').gte('date', start).eq('status', 'Paid'),
      localDB.from('tasks').select('*').eq('status', 'done').gte('completed_at', start),
    ]);
    if (actRes.data) setActivities(actRes.data);
    if (revRes.data) setRevenue(revRes.data);
    if (taskRes.data) setTasks(taskRes.data);
    setLoading(false);
  }, [timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const start = getStart(timeRange);
  const calls = activities.filter(a => a.type === 'Call').length;
  const deals = state.leads.filter(l => l.pipelineStage === 'closed_won' && new Date(l.stageEnteredDate) >= new Date(start)).length;
  const rev = revenue.reduce((s, r) => s + (r.amount || 0), 0);
  const tasksCompleted = tasks.length;
  const pipelineValue = state.leads.filter(l => l.pipelineStage !== 'closed_won').reduce((s, l) => s + (l.dealValue || 0), 0);

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

  const ranges: { key: TimeRange; label: string }[] = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'all', label: 'All Time' },
  ];

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">📊 Performance Overview</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {ranges.map(r => (
            <button key={r.key} onClick={() => setTimeRange(r.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeRange === r.key ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '📞 Calls Made', value: calls },
          { label: '🤝 Deals Closed', value: deals },
          { label: '💰 Revenue', value: fmt(rev) },
          { label: '⚡ Tasks Done', value: tasksCompleted },
          { label: '📈 Pipeline Value', value: fmt(pipelineValue) },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-xs text-gray-500 mb-2">{c.label}</div>
            <div className="text-3xl font-bold text-[#1E3A5F]">{c.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
