import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { PROFILES } from '../types';
import { supabase } from '../utils/supabase';
import {
  hashPin, setSession, clearSession, getSessionUserId, profileToUser,
} from '../utils/auth';

interface AuthContextValue {
  currentUser: User | null;
  users: User[];
  loginWithPin: (profileId: string, pin: string) => Promise<string | null>;
  registerWithPin: (profileId: string, pin: string) => Promise<string | null>;
  isProfileRegistered: (profileId: string) => boolean;
  logout: () => void;
  updateUser: (user: User) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  deactivateUser: (userId: string) => void;
  reactivateUser: (userId: string) => void;
  refreshUsers: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileHashes, setProfileHashes] = useState<Record<string, string>>({});

  // Load profiles from Supabase on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('profiles').select('*');
        if (error) { console.error('Failed to load profiles:', error); setLoading(false); return; }
        if (cancelled) return;
        const profiles = data || [];
        const userList = profiles.map(profileToUser);
        setUsers(userList);

        // Build hash map for PIN checks
        const hashes: Record<string, string> = {};
        for (const p of profiles) {
          if (p.pin_hash) hashes[p.id] = p.pin_hash;
        }
        setProfileHashes(hashes);

        // Restore session
        const sessionId = getSessionUserId();
        if (sessionId) {
          const u = userList.find(u => u.id === sessionId);
          if (u) setCurrentUser(u);
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const isProfileRegistered = useCallback((profileId: string): boolean => {
    return !!profileHashes[profileId];
  }, [profileHashes]);

  const registerWithPin = useCallback(async (profileId: string, pin: string): Promise<string | null> => {
    const profile = PROFILES.find(p => p.id === profileId);
    if (!profile) return 'Profile not found';
    if (profileHashes[profileId]) return 'Profile already registered';

    const hashedPin = await hashPin(pin);

    const { error } = await supabase.from('profiles').update({
      pin_hash: hashedPin,
      last_login_at: new Date().toISOString(),
    }).eq('id', profileId);

    if (error) return 'Failed to register: ' + error.message;

    setProfileHashes(prev => ({ ...prev, [profileId]: hashedPin }));

    const user: User = {
      id: profileId,
      name: profile.name,
      email: `${profileId}@summitcrm.local`,
      passwordHash: hashedPin,
      role: profile.role,
      avatarColor: profile.color,
      active: true,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev.filter(u => u.id !== profileId), user]);
    setSession(profileId, true);
    setCurrentUser(user);
    return null;
  }, [profileHashes]);

  const loginWithPin = useCallback(async (profileId: string, pin: string): Promise<string | null> => {
    if (!profileHashes[profileId]) return 'not_registered';

    const hashedPin = await hashPin(pin);
    if (hashedPin !== profileHashes[profileId]) return 'Incorrect PIN';

    const user = users.find(u => u.id === profileId);
    if (!user) return 'User data not found';
    if (!user.active) return 'Account has been deactivated';

    // Update last_login_at in Supabase
    const now = new Date().toISOString();
    await supabase.from('profiles').update({ last_login_at: now }).eq('id', profileId);

    const updated = { ...user, lastLoginAt: now };
    setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    setSession(profileId, true);
    setCurrentUser(updated);
    return null;
  }, [profileHashes, users]);

  const logout = useCallback(() => {
    clearSession();
    setCurrentUser(null);
  }, []);

  const updateUser = useCallback((user: User) => {
    setUsers(prev => prev.map(u => u.id === user.id ? user : u));
    if (currentUser?.id === user.id) setCurrentUser(user);
  }, [currentUser]);

  const updateUserRole = useCallback((userId: string, role: UserRole) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
    supabase.from('profiles').update({ role }).eq('id', userId);
  }, []);

  const deactivateUser = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: false } : u));
  }, []);

  const reactivateUser = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: true } : u));
  }, []);

  const refreshUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*');
    if (data) {
      setUsers(data.map(profileToUser));
      const hashes: Record<string, string> = {};
      for (const p of data) {
        if (p.pin_hash) hashes[p.id] = p.pin_hash;
      }
      setProfileHashes(hashes);
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      currentUser, users, loginWithPin, registerWithPin, isProfileRegistered,
      logout, updateUser, updateUserRole, deactivateUser, reactivateUser, refreshUsers, loading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
