import { useState, useEffect, useCallback } from 'react';
import { localDB } from '../../utils/local-storage';
import { useApp } from '../../store/AppContext';
import { PIPELINE_STAGES } from '../../types';

type TimeRange = 'week' | 'month' | 'last_month' | '90days' | 'all';

function getDateRange(range: TimeRange): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString();
  let start: Date;
  switch (range) {
    case 'week': start = new Date(now); start.setDate(now.getDate() - 7); break;
    case 'month': start = new Date(now.getFullYear(), now.getMonth(), 1); break;
    case 'last_month': start = new Date(now.getFullYear(), now.getMonth() - 1, 1); break;
    case '90days': start = new Date(now); start.setDate(now.getDate() - 90); break;
    default: start = new Date('2020-01-01');
  }
  if (range === 'last_month') {
    const e = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: start.toISOString(), end: e.toISOString() };
  }
  return { start: start.toISOString(), end };
}

export default function Reports() {
  const { state } = useApp();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [revenue, setRevenue] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { start, end } = getDateRange(timeRange);
    const [revRes, actRes] = await Promise.all([
      localDB.from('revenue').select('*').gte('date', start).lte('date', end),
      localDB.from('activities').select('*').gte('created_at', start).lte('created_at', end),
    ]);
    if (revRes.data) setRevenue(revRes.data);
    if (actRes.data) setActivities(actRes.data);
    setLoading(false);
  }, [timeRange]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const { start, end } = getDateRange(timeRange);
  const filteredLeads = state.leads.filter(l => {
    const d = new Date(l.createdDate);
    return d >= new Date(start) && d <= new Date(end);
  });
  const allLeads = state.leads;

  // Metrics
  const totalRevenue = revenue.reduce((s, r) => s + (r.amount || 0), 0);
  const dealsClosed = filteredLeads.filter(l => l.pipelineStage === 'closed_won').length;
  const avgDealSize = dealsClosed > 0 ? totalRevenue / dealsClosed : 0;
  const totalLeads = filteredLeads.length;
  const conversionRate = totalLeads > 0 ? (dealsClosed / totalLeads * 100) : 0;
  const callsMade = activities.filter(a => a.type === 'Call').length;
  const closedLeads = filteredLeads.filter(l => l.pipelineStage === 'closed_won');
  const avgDaysToClose = closedLeads.length > 0
    ? closedLeads.reduce((s, l) => s + Math.max(1, Math.round((new Date(l.stageEnteredDate).getTime() - new Date(l.createdDate).getTime()) / 86400000)), 0) / closedLeads.length
    : 0;

  // Pipeline funnel
  const stageCounts = PIPELINE_STAGES.map(s => ({
    ...s,
    count: allLeads.filter(l => l.pipelineStage === s.key).length,
  }));
  const maxStageCount = Math.max(...stageCounts.map(s => s.count), 1);

  // Industry breakdown
  const industryMap: Record<string, number> = {};
  filteredLeads.filter(l => l.pipelineStage === 'closed_won').forEach(l => {
    industryMap[l.industry || 'Unknown'] = (industryMap[l.industry || 'Unknown'] || 0) + 1;
  });
  const industries = Object.entries(industryMap).sort((a, b) => b[1] - a[1]);
  const maxIndustry = Math.max(...industries.map(i => i[1]), 1);

  // Lead source breakdown
  const sourceMap: Record<string, number> = {};
  filteredLeads.filter(l => l.pipelineStage === 'closed_won').forEach(l => {
    sourceMap[l.leadSource || 'Unknown'] = (sourceMap[l.leadSource || 'Unknown'] || 0) + 1;
  });
  const sources = Object.entries(sourceMap).sort((a, b) => b[1] - a[1]);
  const maxSource = Math.max(...sources.map(s => s[1]), 1);

  // Team performance
  const teamMap: Record<string, { deals: number; calls: number; revenue: number }> = {};
  filteredLeads.filter(l => l.pipelineStage === 'closed_won').forEach(l => {
    const name = l.assignedTo || 'Unassigned';
    if (!teamMap[name]) teamMap[name] = { deals: 0, calls: 0, revenue: 0 };
    teamMap[name].deals++;
  });
  activities.filter(a => a.type === 'Call').forEach(a => {
    const name = a.user_name || 'Unknown';
    if (!teamMap[name]) teamMap[name] = { deals: 0, calls: 0, revenue: 0 };
    teamMap[name].calls++;
  });
  revenue.forEach(r => {
    const name = r.created_by_name || 'Unknown';
    if (!teamMap[name]) teamMap[name] = { deals: 0, calls: 0, revenue: 0 };
    teamMap[name].revenue += r.amount || 0;
  });
  const teamEntries = Object.entries(teamMap).sort((a, b) => b[1].revenue - a[1].revenue);

  // Monthly revenue
  const monthlyRev: Record<string, { setup: number; recurring: number }> = {};
  revenue.forEach(r => {
    const m = (r.date || r.created_at || '').slice(0, 7);
    if (!monthlyRev[m]) monthlyRev[m] = { setup: 0, recurring: 0 };
    if (r.type === 'Setup Fee') monthlyRev[m].setup += r.amount || 0;
    else monthlyRev[m].recurring += r.amount || 0;
  });
  const months = Object.entries(monthlyRev).sort((a, b) => a[0].localeCompare(b[0]));
  const maxMonthly = Math.max(...months.map(m => m[1].setup + m[1].recurring), 1);

  const ranges: { key: TimeRange; label: string }[] = [
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: '90days', label: 'Last 90 Days' },
    { key: 'all', label: 'All Time' },
  ];

  const fmt = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(0)}`;

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">📉 Reports</h1>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {ranges.map(r => (
            <button key={r.key} onClick={() => setTimeRange(r.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeRange === r.key ? 'bg-white text-[#1E3A5F] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Revenue', value: fmt(totalRevenue), icon: '💰' },
          { label: 'Deals Closed', value: dealsClosed.toString(), icon: '🤝' },
          { label: 'Avg Deal Size', value: fmt(avgDealSize), icon: '📊' },
          { label: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%`, icon: '🎯' },
          { label: 'Calls Made', value: callsMade.toString(), icon: '📞' },
          { label: 'Avg Days to Close', value: avgDaysToClose.toFixed(0), icon: '⏱️' },
        ].map(m => (
          <div key={m.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="text-lg mb-1">{m.icon}</div>
            <div className="text-2xl font-bold text-gray-900">{m.value}</div>
            <div className="text-xs text-gray-500 mt-1">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Over Time */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Revenue Over Time</h2>
        {months.length === 0 ? <p className="text-sm text-gray-400">No revenue data</p> : (
          <div className="space-y-2">
            {months.map(([month, data]) => (
              <div key={month} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-16 shrink-0">{month}</span>
                <div className="flex-1 flex gap-0.5 h-6">
                  <div className="bg-[#1E3A5F] rounded-l h-full transition-all" style={{ width: `${(data.setup / maxMonthly) * 100}%` }} title={`Setup: ${fmt(data.setup)}`} />
                  <div className="bg-[#1E3A5F]/40 rounded-r h-full transition-all" style={{ width: `${(data.recurring / maxMonthly) * 100}%` }} title={`Recurring: ${fmt(data.recurring)}`} />
                </div>
                <span className="text-xs font-medium text-gray-700 w-16 text-right">{fmt(data.setup + data.recurring)}</span>
              </div>
            ))}
            <div className="flex gap-4 mt-2 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#1E3A5F] rounded" /> Setup</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-[#1E3A5F]/40 rounded" /> Recurring</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Funnel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Pipeline Funnel</h2>
          <div className="space-y-2">
            {stageCounts.map((s, i) => {
              const prev = i > 0 ? stageCounts[i - 1].count : s.count;
              const pct = prev > 0 ? ((s.count / prev) * 100).toFixed(0) : '—';
              return (
                <div key={s.key}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-700">{s.icon} {s.label}</span>
                    <span className="text-gray-500">{s.count} {i > 0 && <span className="text-gray-400">({pct}%)</span>}</span>
                  </div>
                  <div className="h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${(s.count / maxStageCount) * 100}%`, backgroundColor: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Deals by Industry */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Deals by Industry</h2>
          {industries.length === 0 ? <p className="text-sm text-gray-400">No closed deals</p> : (
            <div className="space-y-2">
              {industries.map(([ind, count]) => (
                <div key={ind} className="flex items-center gap-3">
                  <span className="text-xs text-gray-700 w-28 shrink-0 truncate">{ind}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1E3A5F] rounded-full" style={{ width: `${(count / maxIndustry) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deals by Source */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Deals by Lead Source</h2>
          {sources.length === 0 ? <p className="text-sm text-gray-400">No closed deals</p> : (
            <div className="space-y-2">
              {sources.map(([src, count]) => (
                <div key={src} className="flex items-center gap-3">
                  <span className="text-xs text-gray-700 w-28 shrink-0 truncate">{src}</span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#1E3A5F]/70 rounded-full" style={{ width: `${(count / maxSource) * 100}%` }} />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Team Performance */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Team Performance</h2>
          {teamEntries.length === 0 ? <p className="text-sm text-gray-400">No data</p> : (
            <div className="space-y-3">
              {teamEntries.map(([name, data]) => (
                <div key={name} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-[#1E3A5F] flex items-center justify-center text-white text-xs font-bold">
                    {name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{name}</div>
                    <div className="flex gap-3 text-[10px] text-gray-500">
                      <span>🤝 {data.deals} deals</span>
                      <span>📞 {data.calls} calls</span>
                      <span>💰 {fmt(data.revenue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
