import { useApp } from '../../store/AppContext';
import { useAuth } from '../../store/AuthContext';
import { DEFAULT_FILTERS } from '../../types';
import { getInitials } from '../../utils/auth';

export default function TopBar() {
  const { state, dispatch } = useApp();
  const { currentUser } = useAuth();

  return (
    <header className="h-14 bg-surface-1 border-b border-border flex items-center justify-between px-5 shrink-0">
      <div className="flex items-center gap-3 flex-1">
        <div className="relative flex-1 max-w-md">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search leads..."
            value={state.filters.search}
            onChange={e => dispatch({ type: 'SET_FILTERS', filters: { ...state.filters, search: e.target.value } })}
            className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text-primary placeholder-text-tertiary focus:outline-none focus:border-brand/50 focus:ring-1 focus:ring-brand/25 transition-all"
          />
          {state.filters.search && (
            <button
              onClick={() => dispatch({ type: 'SET_FILTERS', filters: { ...state.filters, search: '' } })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary text-xs"
            >✕</button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => dispatch({ type: 'SET_FILTERS', filters: DEFAULT_FILTERS })}
          className="px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-3 rounded-lg transition-all"
        >
          Clear Filters
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_IMPORT_MODAL', show: true })}
          className="px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-3 rounded-lg transition-all"
        >
          📥 Import
        </button>
        <button
          onClick={() => dispatch({ type: 'TOGGLE_ADD_MODAL', show: true })}
          className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-lg transition-all hover:shadow-lg hover:shadow-brand/20"
        >
          + Add Lead
        </button>

        {currentUser && (
          <div
            onClick={() => dispatch({ type: 'SET_VIEW', view: 'profile' })}
            className="ml-2 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer hover:ring-2 hover:ring-brand/50 transition-all"
            style={{ backgroundColor: currentUser.avatarColor }}
            title={currentUser.name}
          >
            {getInitials(currentUser.name)}
          </div>
        )}
      </div>
    </header>
  );
}
