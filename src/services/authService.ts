// Client auth service powered by PostgreSQL server-side routes.

import { Church, ChurchSession } from '../types';

// Deterministic hashing function representing bcrypt (same as server-side)
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `mock_bcrypt_pbkdf2_${Math.abs(hash).toString(16)}`;
}

const TENANTS_STORAGE_KEY = 'futamap_saas_tenants';
const SESSION_STORAGE_KEY = 'futamap_saas_session';
const MEMBER_SESSION_STORAGE_KEY = 'futamap_saas_member_session';

// Synchronizes the tenant registry from our server to LocalStorage
export async function syncChurches(): Promise<void> {
  try {
    const res = await fetch('/api/churches');
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(data));
    }
  } catch (err) {
    console.error('Failed to sync churches from backend:', err);
  }
}

// Proactive trigger to sync on load
syncChurches();

function getChurches(): Church[] {
  const stored = localStorage.getItem(TENANTS_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // Fallback
    }
  }
  return [];
}

export const authService = {
  getChurchesList(): { id: string; name: string; mapName: string }[] {
    return getChurches().map(c => ({ id: c.id, name: c.name, mapName: c.mapName }));
  },

  getChurchById(id: string): Church | undefined {
    return getChurches().find(c => c.id === id);
  },

  async registerChurch(name: string, mapName: string, logoName: string, passwordString: string): Promise<{ id: string; name: string }> {
    const id = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const passwordHash = hashPassword(passwordString || 'welcome2026');

    const res = await fetch('/api/churches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, name, mapName, logoName: logoName || `${name} Admin`, passwordHash })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'A church with this name is already registered.');
    }

    // Refresh memory cache
    await syncChurches();

    return { id, name };
  },

  async login(churchName: string, password: string, rememberMe = false): Promise<ChurchSession> {
    const passwordHash = hashPassword(password);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ churchName, passwordHash })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Login failed.');
    }

    const session: ChurchSession = await res.json();

    const sessionStr = JSON.stringify(session);
    if (rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionStr);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionStr);
    }

    return session;
  },

  getCurrentSession(): ChurchSession | null {
    const sessionLocal = localStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionLocal) {
      try {
        return JSON.parse(sessionLocal);
      } catch {
        // Fallback
      }
    }

    const sessionSession = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (sessionSession) {
      try {
        return JSON.parse(sessionSession);
      } catch {
        // Fallback
      }
    }

    return null;
  },

  isAuthenticated(): boolean {
    return this.getCurrentSession() !== null;
  },

  logout(): void {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  },

  async memberLogin(emailOrPhone: string, password: string, rememberMe = false): Promise<any> {
    const passwordHash = hashPassword(password);

    const res = await fetch('/api/auth/member-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, passwordHash, rawPassword: password })
    });

    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Authentication failed.');
    }

    const memberSession = await res.json();

    const sessionStr = JSON.stringify(memberSession);
    if (rememberMe) {
      localStorage.setItem(MEMBER_SESSION_STORAGE_KEY, sessionStr);
    } else {
      sessionStorage.setItem(MEMBER_SESSION_STORAGE_KEY, sessionStr);
    }

    return memberSession;
  },

  getCurrentMemberSession(): any | null {
    const sessionLocal = localStorage.getItem(MEMBER_SESSION_STORAGE_KEY);
    if (sessionLocal) {
      try {
        return JSON.parse(sessionLocal);
      } catch {}
    }

    const sessionSession = sessionStorage.getItem(MEMBER_SESSION_STORAGE_KEY);
    if (sessionSession) {
      try {
        return JSON.parse(sessionSession);
      } catch {}
    }

    return null;
  },

  isMemberAuthenticated(): boolean {
    return this.getCurrentMemberSession() !== null;
  },

  logoutMember(): void {
    localStorage.removeItem(MEMBER_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(MEMBER_SESSION_STORAGE_KEY);
  },

  async resetMemberPassword(emailOrPhone: string, newPassword: string): Promise<void> {
    const passwordHash = hashPassword(newPassword);

    // To reset, we find the member, then update their password hash
    // We can do a fetch to members list, find the match, then issue a PUT
    const membersRes = await fetch('/api/members');
    if (!membersRes.ok) throw new Error('Failed to retrieve system profiles.');

    const allMembers: any[] = await membersRes.json();
    const cleanInput = emailOrPhone.toLowerCase().trim().replace(/[\s\-\+\(\)]/g, '');

    const matched = allMembers.find(m => {
      const dbEmail = m.email ? m.email.toLowerCase().trim() : '';
      const dbPhoneClean = m.phoneNumber.replace(/[\s\-\+\(\)]/g, '');
      const isEmailMatch = m.email && dbEmail === emailOrPhone.toLowerCase().trim();
      const isPhoneMatch = dbPhoneClean.endsWith(cleanInput) || cleanInput.endsWith(dbPhoneClean);
      return isEmailMatch || isPhoneMatch;
    });

    if (!matched) {
      throw new Error('No existing member profile is linked to this phone number or email.');
    }

    const updateRes = await fetch(`/api/members/${matched.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passwordHash })
    });

    if (!updateRes.ok) {
      throw new Error('Failed to update member credentials.');
    }
  }
};
