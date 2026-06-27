import { Member } from '../types';
import { authService } from './authService.ts';
import { activityService } from './activityService.ts';

const STORAGE_KEY = 'futamap_members';

export const memberService = {
  getMembers(): Member[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const all = JSON.parse(stored);
        const session = authService.getCurrentSession();
        if (session) {
          return all.filter((m: any) => m.churchId === session.churchId);
        }
        return all.filter((m: any) => m.churchId === 'futamap');
      } catch (e) {
        console.error("Error parsing members list from cache", e);
      }
    }
    return [];
  },

  async fetchMembers(): Promise<Member[]> {
    try {
      const session = authService.getCurrentSession();
      const url = session ? `/api/members?churchId=${session.churchId}` : '/api/members';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        // Update local storage cache (merge/save)
        const stored = localStorage.getItem(STORAGE_KEY);
        let allMembers: Member[] = [];
        if (stored) {
          try {
            allMembers = JSON.parse(stored);
          } catch {}
        }
        
        // Replace items from this churchId in our cache
        const churchIdFilter = session ? session.churchId : 'futamap';
        allMembers = allMembers.filter(m => m.churchId !== churchIdFilter);
        allMembers = [...data, ...allMembers];
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allMembers));
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch members from backend:', err);
    }
    return this.getMembers();
  },

  getMemberById(id: string): Member | undefined {
    const membersList = this.getMembers();
    return membersList.find(item => item.id === id);
  },

  async addMember(member: Omit<Member, 'id' | 'status' | 'churchId'>, chosenChurchId?: string): Promise<Member> {
    const currentChurchId = chosenChurchId || authService.getCurrentSession()?.churchId || 'futamap';
    const newMember: Member = {
      ...member,
      id: 'm_' + Math.random().toString(36).substring(2, 11),
      churchId: currentChurchId,
      status: 'Active'
    };

    // Save to server
    const res = await fetch('/api/members', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMember)
    });

    if (!res.ok) {
      throw new Error('Failed to register member on backend.');
    }

    // Register a system activity
    await activityService.addActivity({
      type: 'registration',
      description: `${newMember.fullName} registered as a new member of ${newMember.mapName}.`,
      timestamp: new Date().toISOString().split('T')[0],
      memberName: newMember.fullName
    }, currentChurchId);

    // Update cache
    await this.fetchMembers();

    return newMember;
  },

  async updateMember(id: string, updates: Partial<Member>): Promise<Member> {
    const res = await fetch(`/api/members/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });

    if (!res.ok) {
      throw new Error('Failed to update member details on backend.');
    }

    const updated = await res.json();
    await this.fetchMembers();
    return updated;
  }
};
