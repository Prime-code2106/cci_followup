import { FollowUp, FollowUpNote } from '../types';
import { authService } from './authService.ts';
import { activityService } from './activityService.ts';

const STORAGE_KEY = 'futamap_followups';

export const followUpService = {
  getFollowUps(): FollowUp[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const all = JSON.parse(stored);
        const session = authService.getCurrentSession();
        if (session) {
          return all.filter((f: any) => f.churchId === session.churchId);
        }
        return all.filter((f: any) => f.churchId === 'futamap');
      } catch (e) {
        console.error("Error parsing followups cache", e);
      }
    }
    return [];
  },

  async fetchFollowUps(): Promise<FollowUp[]> {
    try {
      const session = authService.getCurrentSession();
      const url = session ? `/api/follow-ups?churchId=${session.churchId}` : '/api/follow-ups';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        const stored = localStorage.getItem(STORAGE_KEY);
        let allFollowups: FollowUp[] = [];
        if (stored) {
          try {
            allFollowups = JSON.parse(stored);
          } catch {}
        }
        
        const churchIdFilter = session ? session.churchId : 'futamap';
        allFollowups = allFollowups.filter(f => f.churchId !== churchIdFilter);
        allFollowups = [...data, ...allFollowups];
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allFollowups));
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch followups:', err);
    }
    return this.getFollowUps();
  },

  async addFollowUp(followUp: FollowUp): Promise<FollowUp> {
    const list = this.getFollowUps();
    if (list.some(f => f.id === followUp.id)) {
      return followUp;
    }

    try {
      await fetch('/api/follow-ups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(followUp)
      });
      await this.fetchFollowUps();
    } catch (err) {
      console.error('Failed to save followUp on backend:', err);
    }

    return followUp;
  },

  async addNote(followUpId: string, text: string, author: string = "Leader"): Promise<FollowUpNote> {
    const list = this.getFollowUps();
    const current = list.find(f => f.id === followUpId);
    if (!current) {
      throw new Error(`Follow-up entry ${followUpId} not found.`);
    }

    const newNote: FollowUpNote = {
      id: 'n_' + Math.random().toString(36).substring(2, 11),
      date: new Date().toISOString().split('T')[0],
      text,
      author
    };

    const updatedNotes = [newNote, ...(current.notes || [])];

    const res = await fetch(`/api/follow-ups/${followUpId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: updatedNotes })
    });

    if (!res.ok) {
      throw new Error('Failed to save follow-up note on backend.');
    }

    // Register a system activity
    await activityService.addActivity({
      type: 'followup',
      description: `Added feedback note on ${current.name}'s details: "${text.substring(0, 40)}${text.length > 40 ? '...' : ''}"`,
      timestamp: new Date().toISOString().split('T')[0],
      memberName: current.name
    }, current.churchId);

    await this.fetchFollowUps();
    return newNote;
  },

  async updateStatus(id: string, status: FollowUp['status']): Promise<FollowUp> {
    const list = this.getFollowUps();
    const current = list.find(f => f.id === id);
    if (!current) {
      throw new Error(`Follow-up entry with id ${id} not found.`);
    }

    const res = await fetch(`/api/follow-ups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      throw new Error('Failed to update follow up status on backend.');
    }

    const updated = await res.json();

    // Log the update activity
    await activityService.addActivity({
      type: 'followup',
      description: `Updated follow up card status for ${updated.name} to "${status}".`,
      timestamp: new Date().toISOString().split('T')[0],
      memberName: updated.name
    }, updated.churchId);

    await this.fetchFollowUps();
    return updated;
  },

  async syncStatus(id: string, status: FollowUp['status']): Promise<void> {
    try {
      const list = this.getFollowUps();
      const current = list.find(f => f.id === id);
      if (current && current.status !== status) {
        await fetch(`/api/follow-ups/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status })
        });
        await this.fetchFollowUps();
      }
    } catch (e) {
      console.warn("syncStatus error", e);
    }
  }
};
