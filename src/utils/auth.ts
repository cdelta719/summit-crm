import type { User } from '../types';
import { PROFILES } from '../types';

const SESSION_KEY = 'summit_crm_session';
const REMEMBER_KEY = 'summit_crm_remember';

// Simple hash for PIN-based auth
export async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'summit_crm_salt_v1');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export { hashPin as hashPassword };

export function getSessionUserId(): string | null {
  return sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(REMEMBER_KEY);
}

export function setSession(userId: string, remember: boolean) {
  sessionStorage.setItem(SESSION_KEY, userId);
  if (remember) {
    localStorage.setItem(REMEMBER_KEY, userId);
  } else {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

export function clearSession() {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function getTeamMemberNames(): string[] {
  return PROFILES.map(p => p.name);
}

// Convert a Supabase profile row to a User object
export function profileToUser(profile: Record<string, unknown>): User {
  return {
    id: profile.id as string,
    name: (profile.name as string) || '',
    email: `${profile.id}@summitcrm.local`,
    passwordHash: (profile.pin_hash as string) || '',
    role: (profile.role as User['role']) || 'Sales Rep',
    avatarColor: (profile.color as string) || '#5e5e72',
    active: true,
    createdAt: (profile.created_at as string) || '',
    lastLoginAt: (profile.last_login_at as string) || '',
  };
}
