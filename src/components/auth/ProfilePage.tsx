import { useAuth } from '../../store/AuthContext';
import { useApp } from '../../store/AppContext';
import { getInitials } from '../../utils/auth';

export default function ProfilePage() {
  const { currentUser } = useAuth();
  const { dispatch } = useApp();

  if (!currentUser) return null;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-xl mx-auto">
        <button onClick={() => dispatch({ type: 'SET_VIEW', view: 'pipeline' })} className="text-text-tertiary hover:text-text-primary text-sm mb-4 transition-colors">
          ← Back
        </button>
        <h2 className="text-xl font-bold text-text-primary mb-6">My Profile</h2>

        {/* Avatar preview */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold" style={{ backgroundColor: currentUser.avatarColor }}>
            {getInitials(currentUser.name)}
          </div>
          <div>
            <p className="text-lg font-semibold text-text-primary">{currentUser.name}</p>
            <p className="text-sm text-text-secondary">{currentUser.role}</p>
          </div>
        </div>

        <div className="bg-surface-1 border border-border rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Name</label>
            <div className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
              {currentUser.name}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Role</label>
            <div className="w-full bg-surface-2 border border-border rounded-lg px-3 py-2 text-sm text-text-primary">
              {currentUser.role}
            </div>
            <p className="text-[10px] text-text-tertiary mt-1">Role can only be changed by an Admin</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Profile Color</label>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full" style={{ backgroundColor: currentUser.avatarColor }} />
              <span className="text-sm text-text-secondary">{currentUser.avatarColor}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
