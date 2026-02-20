import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { isCallOverdue, isCallToday } from '../../utils/helpers';
import { getInitials } from '../../utils/auth';

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const { currentUser, logout } = useAuth();
  const overdueCount = state.leads.filter(l => isCallOverdue(l)).length;
  const callsTodayCount = state.leads.filter(l => isCallToday(l)).length;

  const NAV_ITEMS = [
    { key: 'dashboard' as const, label: 'Dashboard', icon: '📈' },
    { key: 'pipeline' as const, label: 'Pipeline', icon: '📊' },
    { key: 'list' as const, label: 'All Leads', icon: '📋' },
    { key: 'clients' as const, label: 'Active Clients', icon: '👥' },
    { key: 'tasks' as const, label: 'Tasks', icon: '📅' },
    { key: 'reports' as const, label: 'Reports', icon: '📉' },
    { key: 'revenue' as const, label: 'Revenue', icon: '💰' },
    { key: 'contracts' as const, label: 'Contracts', icon: '📄' },
    { key: 'emails' as const, label: 'Email Templates', icon: '📧' },
    { key: 'training' as const, label: 'Training', icon: '📚' },
    { key: 'tickets' as const, label: 'HelpDesk', icon: '🎫' },
  ];

  return (
    <aside className="w-60 bg-[#111827] flex flex-col h-screen shrink-0">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏔️</span>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Summit CRM</h1>
            <p className="text-[10px] text-[#D4A844] uppercase tracking-widest">Summit Digital Co</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            onClick={() => dispatch({ type: 'SET_VIEW', view: item.key })}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
              state.currentView === item.key
                ? 'bg-[#D4A844]/15 text-[#D4A844] font-medium'
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-base">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10 space-y-2">
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/15 text-red-400 text-xs font-medium">
            <span>⚠️</span>
            {overdueCount} overdue call{overdueCount !== 1 ? 's' : ''}
          </div>
        )}
        {callsTodayCount > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-500/15 text-amber-400 text-xs font-medium">
            <span>📞</span>
            {callsTodayCount} call{callsTodayCount !== 1 ? 's' : ''} today
          </div>
        )}
        <div className="px-3 py-2 text-gray-500 text-[10px]">
          {state.leads.length} total leads
        </div>
      </div>

      {currentUser && (
        <div className="p-3 border-t border-white/10">
          <button
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'profile' })}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-all"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ backgroundColor: currentUser.avatarColor }}>
              {getInitials(currentUser.name)}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-medium text-white truncate">{currentUser.name}</p>
              <p className="text-[10px] text-gray-500">{currentUser.role}</p>
            </div>
          </button>
          <button onClick={logout} className="w-full mt-1 px-3 py-2 text-xs text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all text-left">
            🚪 Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
