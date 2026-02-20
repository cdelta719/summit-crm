import { useState, useMemo } from 'react';
import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { PIPELINE_STAGES } from '../../types';
import type { Lead } from '../../types';
import { formatCurrency, formatDate, isCallOverdue, isCallToday } from '../../utils/helpers';
import { getInitials } from '../../utils/auth';

type CalendarView = 'day' | 'week' | 'month';

export default function Dashboard() {
  const { state, dispatch } = useApp();
  const { users } = useAuth();
  const [calendarView, setCalendarView] = useState<CalendarView>('day');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const leads = state.leads;

  // Metrics
  const totalLeads = leads.length;
  const pipelineValue = leads.reduce((sum, l) => sum + l.dealValue, 0);
  const callsToday = leads.filter(l => isCallToday(l));
  const overdueCallLeads = leads.filter(l => isCallOverdue(l));
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const closedWonThisMonth = leads.filter(l => l.pipelineStage === 'closed_won' && l.stageEnteredDate >= monthStart);
  const closedWonValue = closedWonThisMonth.reduce((s, l) => s + l.dealValue, 0);

  // Activity feed
  const allActivities = useMemo(() =>
    leads.flatMap(l => l.activities.map(a => ({ ...a, companyName: l.companyName })))
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 50),
    [leads]
  );

  // Active members
  const activeMembers = users.filter(u => u.active);

  // Team breakdown
  const teamData = activeMembers.map(m => {
    const memberLeads = leads.filter(l => l.assignedTo === m.name);
    return { name: m.name, color: m.avatarColor, count: memberLeads.length, value: memberLeads.reduce((s, l) => s + l.dealValue, 0) };
  });

  const StatCard = ({ label, value, sub, color, danger }: { label: string; value: string | number; sub?: string; color?: string; danger?: boolean }) => (
    <div className={`border rounded-xl p-4 hover:shadow-md transition-all ${danger ? 'bg-red-50 border-red-200' : 'bg-surface-1 border-border hover:border-brand/20'}`}>
      <p className="text-[10px] text-text-tertiary uppercase tracking-wider">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${danger ? 'text-red-600' : color || 'text-text-primary'}`}>{value}</p>
      {sub && <p className="text-[10px] text-text-tertiary mt-1">{sub}</p>}
    </div>
  );

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Top Row: Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard label="Total Leads" value={totalLeads} />
        <StatCard label="Pipeline Value" value={formatCurrency(pipelineValue)} color="text-brand" />
        <StatCard label="Calls Today" value={callsToday.length} sub={callsToday.map(l => l.companyName).join(', ') || 'None'} />
        <StatCard label="Overdue Calls" value={overdueCallLeads.length} danger={overdueCallLeads.length > 0} />
        <StatCard label="Closed Won (Month)" value={closedWonThisMonth.length} sub={formatCurrency(closedWonValue)} color="text-green-600" />
      </div>

      {/* Second Row: Call Calendar */}
      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text-primary">📞 Call Calendar</h3>
          <div className="flex items-center gap-2">
            <div className="flex bg-surface-2 rounded-lg overflow-hidden border border-border">
              {(['day', 'week', 'month'] as CalendarView[]).map(v => (
                <button key={v} onClick={() => setCalendarView(v)}
                  className={`px-3 py-1.5 text-xs font-medium transition-all ${calendarView === v ? 'bg-brand text-white' : 'text-text-secondary hover:text-text-primary'}`}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>
        {calendarView === 'day' && <DayView leads={leads} onSelectLead={(id) => dispatch({ type: 'SELECT_LEAD', id })} />}
        {calendarView === 'week' && <WeekView leads={leads} onSelectLead={(id) => dispatch({ type: 'SELECT_LEAD', id })} date={calendarDate} setDate={setCalendarDate} />}
        {calendarView === 'month' && <MonthView leads={leads} date={calendarDate} setDate={setCalendarDate} />}
      </div>

      {/* Third Row: Pipeline Overview */}
      <div className="bg-surface-1 border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-text-primary mb-4">Pipeline Overview</h3>
        <div className="flex gap-1 items-stretch">
          {PIPELINE_STAGES.map((stage, i) => {
            const stageLeads = leads.filter(l => l.pipelineStage === stage.key);
            const stageValue = stageLeads.reduce((s, l) => s + l.dealValue, 0);
            return (
              <button key={stage.key}
                onClick={() => { dispatch({ type: 'SET_FILTERS', filters: { ...state.filters, stage: stage.key } }); dispatch({ type: 'SET_VIEW', view: 'list' }); }}
                className="flex-1 rounded-lg p-3 text-center transition-all hover:scale-[1.02] hover:shadow-md"
                style={{ backgroundColor: stage.color + '15', borderLeft: i === 0 ? 'none' : `3px solid ${stage.color}30` }}>
                <p className="text-[10px] font-medium truncate" style={{ color: stage.color }}>{stage.label}</p>
                <p className="text-xl font-bold mt-1" style={{ color: stage.color }}>{stageLeads.length}</p>
                <p className="text-[10px] text-text-tertiary">{formatCurrency(stageValue)}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fourth Row: Team Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Feed */}
        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Recent Activity</h3>
          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {allActivities.map(a => {
              const user = users.find(u => u.name === a.userName);
              return (
                <div key={a.id} className="flex items-start gap-3 py-1.5">
                  {user ? (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0 mt-0.5" style={{ backgroundColor: user.avatarColor }}>
                      {getInitials(user.name)}
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-surface-3 flex items-center justify-center text-[10px] shrink-0 mt-0.5">📝</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-primary">
                      {a.description}
                      {a.companyName && <span className="text-text-secondary"> — {a.companyName}</span>}
                    </p>
                    <p className="text-[10px] text-text-tertiary mt-0.5">{a.type} · {formatDate(a.timestamp)}</p>
                  </div>
                </div>
              );
            })}
            {allActivities.length === 0 && <p className="text-xs text-text-tertiary">No activity yet</p>}
          </div>
        </div>

        {/* Team Breakdown */}
        <div className="bg-surface-1 border border-border rounded-xl p-5">
          <h3 className="text-sm font-semibold text-text-primary mb-4">Leads by Team Member</h3>
          {teamData.length > 0 ? (
            <div className="space-y-3">
              {teamData.map(m => (
                <div key={m.name} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: m.color }}>
                    {getInitials(m.name)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-text-primary font-medium">{m.name}</span>
                      <span className="text-text-tertiary">{m.count} leads · {formatCurrency(m.value)}</span>
                    </div>
                    <div className="h-1.5 bg-surface-3 rounded-full mt-1.5 overflow-hidden">
                      <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${Math.min(100, (m.count / Math.max(totalLeads, 1)) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-text-tertiary">No team members registered yet</p>}
        </div>
      </div>
    </div>
  );
}

/* ===== Calendar Sub-Components ===== */

function DayView({ leads, onSelectLead }: { leads: Lead[]; onSelectLead: (id: string) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const overdueLeads = leads.filter(l => {
    if (!l.scheduledCallDate || l.callCompleted) return false;
    const d = l.scheduledCallDate.split('T')[0];
    return d < today;
  });
  const todayLeads = leads.filter(l => {
    if (!l.scheduledCallDate || l.callCompleted) return false;
    return l.scheduledCallDate.split('T')[0] === today;
  });

  return (
    <div>
      <p className="text-xs text-text-secondary mb-3">
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        <span className="ml-2 bg-brand/10 text-brand text-[10px] font-medium px-2 py-0.5 rounded-full">{todayLeads.length} calls today</span>
      </p>

      {overdueLeads.length > 0 && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-red-700 mb-2">⚠️ Overdue ({overdueLeads.length})</p>
          <div className="space-y-2">
            {overdueLeads.map(l => (
              <CallEntry key={l.id} lead={l} onSelectLead={onSelectLead} overdue />
            ))}
          </div>
        </div>
      )}

      {todayLeads.length > 0 ? (
        <div className="space-y-2">
          {todayLeads.map(l => (
            <CallEntry key={l.id} lead={l} onSelectLead={onSelectLead} />
          ))}
        </div>
      ) : (
        <p className="text-xs text-text-tertiary py-4 text-center">No calls scheduled for today</p>
      )}
    </div>
  );
}

function CallEntry({ lead, onSelectLead, overdue }: { lead: Lead; onSelectLead: (id: string) => void; overdue?: boolean }) {
  const stage = PIPELINE_STAGES.find(s => s.key === lead.pipelineStage);
  return (
    <button
      onClick={() => onSelectLead(lead.id)}
      className={`w-full text-left flex items-center gap-3 p-2.5 rounded-lg transition-all hover:shadow-sm ${overdue ? 'bg-red-100 hover:bg-red-200' : 'bg-surface-2 hover:bg-surface-3'}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{lead.companyName}</p>
        <p className="text-xs text-text-secondary">{lead.pointOfContact}</p>
      </div>
      {lead.phone && <span className="text-xs font-mono text-text-secondary shrink-0">{lead.phone}</span>}
      {stage && <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0" style={{ backgroundColor: stage.color + '20', color: stage.color }}>{stage.label}</span>}
    </button>
  );
}

function WeekView({ leads, onSelectLead, date, setDate }: { leads: Lead[]; onSelectLead: (id: string) => void; date: Date; setDate: (d: Date) => void }) {
  const today = new Date().toISOString().split('T')[0];

  // Get Monday of current week
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));

  const days = Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday);
    dd.setDate(monday.getDate() + i);
    return dd.toISOString().split('T')[0];
  });

  const navWeek = (dir: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + dir * 7);
    setDate(next);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => navWeek(-1)} className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-3">← Prev</button>
        <p className="text-xs text-text-secondary font-medium">
          {new Date(days[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — {new Date(days[6]).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        <button onClick={() => navWeek(1)} className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-3">Next →</button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map(dayStr => {
          const dayLeads = leads.filter(l => l.scheduledCallDate && !l.callCompleted && l.scheduledCallDate.split('T')[0] === dayStr);
          const isToday = dayStr === today;
          const isPast = dayStr < today;
          const hasOverdue = isPast && dayLeads.length > 0;
          return (
            <div key={dayStr} className={`rounded-lg p-2 min-h-[100px] border ${isToday ? 'border-brand bg-brand/5' : hasOverdue ? 'border-red-300 bg-red-50' : 'border-border bg-surface-2'}`}>
              <p className={`text-[10px] font-medium mb-1 ${isToday ? 'text-brand' : 'text-text-tertiary'}`}>
                {new Date(dayStr + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })}
              </p>
              {dayLeads.length > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${hasOverdue ? 'bg-red-200 text-red-700' : 'bg-brand/10 text-brand'}`}>{dayLeads.length}</span>
              )}
              <div className="mt-1 space-y-0.5">
                {dayLeads.slice(0, 3).map(l => (
                  <button key={l.id} onClick={() => onSelectLead(l.id)}
                    className="block w-full text-left text-[9px] text-text-secondary truncate hover:text-text-primary">
                    {l.companyName}
                  </button>
                ))}
                {dayLeads.length > 3 && <p className="text-[9px] text-text-tertiary">+{dayLeads.length - 3} more</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthView({ leads, date, setDate }: { leads: Lead[]; date: Date; setDate: (d: Date) => void }) {
  const today = new Date().toISOString().split('T')[0];
  const year = date.getFullYear();
  const month = date.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7; // Monday start

  const totalDays = lastDay.getDate();
  const cells: (string | null)[] = Array.from({ length: startPad }, () => null);
  for (let i = 1; i <= totalDays; i++) {
    const d = new Date(year, month, i);
    cells.push(d.toISOString().split('T')[0]);
  }

  const navMonth = (dir: number) => setDate(new Date(year, month + dir, 1));

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => navMonth(-1)} className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-3">← Prev</button>
        <p className="text-sm font-semibold text-text-primary">{date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
        <button onClick={() => navMonth(1)} className="text-xs text-text-secondary hover:text-text-primary px-2 py-1 rounded hover:bg-surface-3">Next →</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} className="text-[10px] text-text-tertiary text-center py-1 font-medium">{d}</div>
        ))}
        {cells.map((dayStr, i) => {
          if (!dayStr) return <div key={`pad-${i}`} className="h-10" />;
          const dayLeads = leads.filter(l => l.scheduledCallDate && l.scheduledCallDate.split('T')[0] === dayStr);
          const completedCount = dayLeads.filter(l => l.callCompleted).length;
          const pendingCount = dayLeads.filter(l => !l.callCompleted).length;
          const isToday = dayStr === today;
          const isPast = dayStr < today;
          const hasOverdue = isPast && pendingCount > 0;

          return (
            <button key={dayStr}
              onClick={() => { if (pendingCount > 0) { setDate(new Date(dayStr + 'T12:00:00')); } }}
              className={`h-10 rounded-lg text-xs relative flex items-center justify-center transition-all ${
                isToday ? 'bg-brand text-white font-bold' :
                hasOverdue ? 'bg-red-100 text-red-700' :
                'text-text-secondary hover:bg-surface-3'
              }`}>
              {new Date(dayStr + 'T12:00:00').getDate()}
              {dayLeads.length > 0 && (
                <span className={`absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-bold flex items-center justify-center ${
                  hasOverdue ? 'bg-red-500 text-white' :
                  completedCount === dayLeads.length ? 'bg-green-500 text-white' :
                  'bg-brand text-white'
                }`}>{dayLeads.length}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
