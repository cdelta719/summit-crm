import { useAuth } from '../../store/AuthContext';
import { useApp } from '../../store/AppContext';
import type { UserRole } from '../../types';
import { getInitials } from '../../utils/auth';
import { formatDate } from '../../utils/helpers';

export default function TeamManagement() {
  const { currentUser, users, updateUserRole, deactivateUser, reactivateUser } = useAuth();
  const { dispatch } = useApp();

  if (!currentUser || currentUser.role !== 'Admin') {
    return (
      <div className="flex items-center justify-center h-full text-text-tertiary">
        <p>Only Admins can manage the team</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <button onClick={() => dispatch({ type: 'SET_VIEW', view: 'dashboard' })} className="text-text-tertiary hover:text-text-primary text-sm mb-4 transition-colors">
          ← Back to Dashboard
        </button>
        <h2 className="text-xl font-bold text-text-primary mb-6">Team Management</h2>

        <div className="bg-surface-1 border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-2">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Member</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Email</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Role</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Last Login</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(user => (
                <tr key={user.id} className={`${!user.active ? 'opacity-50' : ''}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: user.avatarColor }}>
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text-primary">{user.name}</p>
                        {user.id === currentUser.id && <span className="text-[10px] text-brand">(you)</span>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-text-secondary">{user.email}</td>
                  <td className="px-5 py-4">
                    {user.id === currentUser.id ? (
                      <span className="text-sm text-text-secondary">{user.role}</span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={e => updateUserRole(user.id, e.target.value as UserRole)}
                        className="bg-surface-2 border border-border rounded-lg px-2 py-1 text-xs text-text-primary focus:outline-none focus:border-brand/50 transition-all"
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Sales Rep">Sales Rep</option>
                      </select>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-text-tertiary">{formatDate(user.lastLoginAt)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${user.active ? 'bg-success/15 text-success' : 'bg-danger/15 text-danger'}`}>
                      {user.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {user.id !== currentUser.id && (
                      user.active ? (
                        <button onClick={() => deactivateUser(user.id)} className="text-xs text-danger hover:text-danger/80 transition-colors">
                          Deactivate
                        </button>
                      ) : (
                        <button onClick={() => reactivateUser(user.id)} className="text-xs text-success hover:text-success/80 transition-colors">
                          Reactivate
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="flex items-center justify-center py-12 text-text-tertiary text-sm">
              No team members yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
