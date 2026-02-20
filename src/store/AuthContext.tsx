import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../types';
import { PROFILES } from '../types';
import {
  hashPin, setSession, clearSession, getSessionUserId, profileToUser,
} from '../utils/auth';

const PROFILES_KEY = 'summit_crm_profiles';

// Default CD PIN hash for '6411' with salt 'summit_crm_salt_v1'
const DEFAULT_CD_PIN_HASH = 'ddd7f04a443bac4d755c75dd795e2e17f1fb4e12be086ab2dfeac34cd7557097';

function loadProfiles(): Record<string, unknown>[] {
  try {
    const raw = localStorage.getItem(PROFILES_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // Seed with default CD profile
  const seed = PROFILES.map(p => ({
    id: p.id,
    name: p.name,
    role: p.role,
    color: p.color,
    pin_hash: p.id === 'cd' ? DEFAULT_CD_PIN_HASH : null,
    created_at: new Date().toISOString(),
    last_login_at: null,
  }));
  localStorage.setItem(PROFILES_KEY, JSON.stringify(seed));
  return seed;
}

function saveProfiles(profiles: Record<string, unknown>[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
}

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

  useEffect(() => {
    const profiles = loadProfiles();
    const userList = profiles.map(profileToUser);
    setUsers(userList);

    const hashes: Record<string, string> = {};
    for (const p of profiles) {
      if (p.pin_hash) hashes[p.id as string] = p.pin_hash as string;
    }
    setProfileHashes(hashes);

    const sessionId = getSessionUserId();
    if (sessionId) {
      const u = userList.find(u => u.id === sessionId);
      if (u) setCurrentUser(u);
    }
    setLoading(false);
  }, []);

  const isProfileRegistered = useCallback((profileId: string): boolean => {
    return !!profileHashes[profileId];
  }, [profileHashes]);

  const registerWithPin = useCallback(async (profileId: string, pin: string): Promise<string | null> => {
    const profile = PROFILES.find(p => p.id === profileId);
    if (!profile) return 'Profile not found';
    if (profileHashes[profileId]) return 'Profile already registered';

    const hashedPin = await hashPin(pin);

    const profiles = loadProfiles();
    const idx = profiles.findIndex(p => p.id === profileId);
    if (idx >= 0) {
      profiles[idx].pin_hash = hashedPin;
      profiles[idx].last_login_at = new Date().toISOString();
    }
    saveProfiles(profiles);

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

    const now = new Date().toISOString();
    const profiles = loadProfiles();
    const idx = profiles.findIndex(p => p.id === profileId);
    if (idx >= 0) {
      profiles[idx].last_login_at = now;
      saveProfiles(profiles);
    }

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
    const profiles = loadProfiles();
    const idx = profiles.findIndex(p => p.id === userId);
    if (idx >= 0) { profiles[idx].role = role; saveProfiles(profiles); }
  }, []);

  const deactivateUser = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: false } : u));
  }, []);

  const reactivateUser = useCallback((userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: true } : u));
  }, []);

  const refreshUsers = useCallback(() => {
    const profiles = loadProfiles();
    setUsers(profiles.map(profileToUser));
    const hashes: Record<string, string> = {};
    for (const p of profiles) {
      if (p.pin_hash) hashes[p.id as string] = p.pin_hash as string;
    }
    setProfileHashes(hashes);
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
