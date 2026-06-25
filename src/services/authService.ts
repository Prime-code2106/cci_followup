// Future Supabase Auth integration here.
// In Supabase, we would import { createClient } from '@supabase/supabase-low-level-sdk'
// and perform client.auth.signInWithPassword or similar custom session routing.

import { Church, ChurchSession } from '../types';

// Deterministic hashing function representing bcrypt
export function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `mock_bcrypt_pbkdf2_${Math.abs(hash).toString(16)}`;
}

// Default multi-tenant database for churches
const DEFAULT_CHURCHES: Church[] = [
  {
    id: 'futamap',
    name: 'Celebration Church International',
    passwordHash: hashPassword('celebration2026'),
    mapName: 'Celebration Group',
    logoName: 'CCI Admin'
  },
  {
    id: 'rccg',
    name: 'RCCG',
    passwordHash: hashPassword('rccg2026'),
    mapName: 'RCCG Area',
    logoName: 'RCCG Admin'
  },
  {
    id: 'winners',
    name: 'Winners Chapel',
    passwordHash: hashPassword('winners2026'),
    mapName: 'Winners Cell',
    logoName: 'Winners Admin'
  }
];

const TENANTS_STORAGE_KEY = 'futamap_saas_tenants';
const SESSION_STORAGE_KEY = 'futamap_saas_session';

// Initialize the tenant registry once
function getChurches(): Church[] {
  const stored = localStorage.getItem(TENANTS_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Migrate tenant record if "FUTA MAP" still exists in active storage
      const hasFuta = parsed.some((c: any) => c.name === 'FUTA MAP');
      if (hasFuta) {
        localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(DEFAULT_CHURCHES));
        return DEFAULT_CHURCHES;
      }
      return parsed;
    } catch (e) {
      console.error('Error fetching tenants', e);
    }
  }
  localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(DEFAULT_CHURCHES));
  return DEFAULT_CHURCHES;
}

export const authService = {
  getChurchesList(): { id: string; name: string; mapName: string }[] {
    return getChurches().map(c => ({ id: c.id, name: c.name, mapName: c.mapName }));
  },

  getChurchById(id: string): Church | undefined {
    return getChurches().find(c => c.id === id);
  },

  registerChurch(name: string, mapName: string, logoName: string, passwordString: string): { id: string; name: string } {
    const id = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
    const passwordHash = hashPassword(passwordString || 'welcome2026');
    const newChurch: Church = {
      id,
      name,
      mapName,
      logoName: logoName || `${name} Admin`,
      passwordHash
    };
    const current = getChurches();
    if (current.some(c => c.name.toLowerCase().trim() === name.toLowerCase().trim())) {
      throw new Error('A church with this name is already registered.');
    }
    const updated = [...current, newChurch];
    localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(updated));
    return { id, name };
  },

  async login(churchName: string, password: string, rememberMe = false): Promise<ChurchSession> {
    // Artificial latency for a premium loading feel
    await new Promise(resolve => setTimeout(resolve, 800));

    const churches = getChurches();
    
    // Check case-insensitive match for church name
    const foundChurch = churches.find(
      c => c.name.toLowerCase().trim() === churchName.toLowerCase().trim()
    );

    if (!foundChurch) {
      throw new Error('Church not registered.');
    }

    // Hash the input password and compare with saved password hash
    const inputHash = hashPassword(password);
    if (foundChurch.passwordHash !== inputHash) {
      throw new Error('Invalid password.');
    }

    const session: ChurchSession = {
      churchId: foundChurch.id,
      churchName: foundChurch.name,
      mapName: foundChurch.mapName,
      logoName: foundChurch.logoName,
      authenticatedAt: new Date().toISOString()
    };

    // Session persistence
    const sessionStr = JSON.stringify(session);
    if (rememberMe) {
      localStorage.setItem(SESSION_STORAGE_KEY, sessionStr);
    } else {
      sessionStorage.setItem(SESSION_STORAGE_KEY, sessionStr);
    }

    // Future Supabase Auth integration:
    // const { data, error } = await supabase.auth.signInWithPassword({
    //   email: `${foundChurch.id}@church-tenant.futamap.com`,
    //   password: password
    // });
    // if (error) throw error;
    // return data.session;

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
    
    // Future Supabase Auth integration:
    // supabase.auth.signOut();
  },

  async memberLogin(emailOrPhone: string, password: string, rememberMe = false): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 800)); // elite premium transition delay

    const membersStr = localStorage.getItem('futamap_members');
    if (!membersStr) {
      throw new Error('No registered members found. Please contact administration or register first.');
    }

    let members: any[] = [];
    try {
      members = JSON.parse(membersStr);
    } catch {
      throw new Error('Error processing members directory.');
    }

    const cleanInput = emailOrPhone.toLowerCase().trim().replace(/[\s\-\+\(\)]/g, '');

    // Match by email or clean phone matches
    const matchedMember = members.find(m => {
      const dbEmail = m.email ? m.email.toLowerCase().trim() : '';
      const dbPhoneClean = m.phoneNumber.replace(/[\s\-\+\(\)]/g, '');
      
      const isEmailMatch = m.email && dbEmail === emailOrPhone.toLowerCase().trim();
      const isPhoneMatch = dbPhoneClean.endsWith(cleanInput) || cleanInput.endsWith(dbPhoneClean);
      
      return isEmailMatch || isPhoneMatch;
    });

    if (!matchedMember) {
      throw new Error('Member profile not found with this phone number or email address.');
    }

    const inputHash = hashPassword(password);
    
    // Check password hash
    if (matchedMember.passwordHash) {
      if (matchedMember.passwordHash !== inputHash) {
        throw new Error('Incorrect password.');
      }
    } else {
      // If no passwordHash is set yet, check if they used their phone number digits or 'celebration2026' as default
      const defaultPhonePass = matchedMember.phoneNumber.replace(/[^0-9]/g, '');
      const defaultThemePass = 'celebration2026';
      
      const isPhonePass = password === defaultPhonePass || password === matchedMember.phoneNumber.trim();
      const isThemePass = password === defaultThemePass;

      if (!isPhonePass && !isThemePass) {
        throw new Error('Incorrect password. (Tip: For your first login, use your phone number digits or "celebration2026" as your password, or click Forgot Password to set a custom one).');
      }

      // Automatically set the password hash for subsequent secure logins
      matchedMember.passwordHash = inputHash;
      localStorage.setItem('futamap_members', JSON.stringify(members));
    }

    const memberSession = {
      memberId: matchedMember.id,
      fullName: matchedMember.fullName,
      churchId: matchedMember.churchId || 'futamap',
      phoneNumber: matchedMember.phoneNumber,
      email: matchedMember.email,
      authenticatedAt: new Date().toISOString()
    };

    const sessionStr = JSON.stringify(memberSession);
    const MEMBER_SESSION_STORAGE_KEY = 'futamap_saas_member_session';
    if (rememberMe) {
      localStorage.setItem(MEMBER_SESSION_STORAGE_KEY, sessionStr);
    } else {
      sessionStorage.setItem(MEMBER_SESSION_STORAGE_KEY, sessionStr);
    }

    return memberSession;
  },

  getCurrentMemberSession(): any | null {
    const MEMBER_SESSION_STORAGE_KEY = 'futamap_saas_member_session';
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
    const MEMBER_SESSION_STORAGE_KEY = 'futamap_saas_member_session';
    localStorage.removeItem(MEMBER_SESSION_STORAGE_KEY);
    sessionStorage.removeItem(MEMBER_SESSION_STORAGE_KEY);
  },

  async resetMemberPassword(emailOrPhone: string, newPassword: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Reset action artificial load delay

    const membersStr = localStorage.getItem('futamap_members');
    if (!membersStr) {
      throw new Error('No registered members found in the system database.');
    }

    let members: any[] = [];
    try {
      members = JSON.parse(membersStr);
    } catch {
      throw new Error('Error processing members list.');
    }

    const cleanInput = emailOrPhone.toLowerCase().trim().replace(/[\s\-\+\(\)]/g, '');

    const matchedIndex = members.findIndex(m => {
      const dbEmail = m.email ? m.email.toLowerCase().trim() : '';
      const dbPhoneClean = m.phoneNumber.replace(/[\s\-\+\(\)]/g, '');
      const isEmailMatch = m.email && dbEmail === emailOrPhone.toLowerCase().trim();
      const isPhoneMatch = dbPhoneClean.endsWith(cleanInput) || cleanInput.endsWith(dbPhoneClean);
      return isEmailMatch || isPhoneMatch;
    });

    if (matchedIndex === -1) {
      throw new Error('No existing member profile is linked to this phone number or email.');
    }

    // Set the password hash
    members[matchedIndex].passwordHash = hashPassword(newPassword);
    localStorage.setItem('futamap_members', JSON.stringify(members));
  }
};
