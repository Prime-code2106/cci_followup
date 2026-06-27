import { Visitor } from '../types';
import { authService } from './authService.ts';
import { activityService } from './activityService.ts';
import { followUpService } from './followUpService.ts';

const STORAGE_KEY = 'futamap_visitors';

export const visitorService = {
  getVisitors(): Visitor[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const all = JSON.parse(stored);
        const session = authService.getCurrentSession();
        if (session) {
          return all.filter((v: any) => v.churchId === session.churchId);
        }
        return all.filter((v: any) => v.churchId === 'futamap');
      } catch (e) {
        console.error("Error parsing visitors cache", e);
      }
    }
    return [];
  },

  async fetchVisitors(): Promise<Visitor[]> {
    try {
      const session = authService.getCurrentSession();
      const url = session ? `/api/visitors?churchId=${session.churchId}` : '/api/visitors';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        const stored = localStorage.getItem(STORAGE_KEY);
        let allVisitors: Visitor[] = [];
        if (stored) {
          try {
            allVisitors = JSON.parse(stored);
          } catch {}
        }
        
        const churchIdFilter = session ? session.churchId : 'futamap';
        allVisitors = allVisitors.filter(v => v.churchId !== churchIdFilter);
        allVisitors = [...data, ...allVisitors];
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allVisitors));
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch visitors:', err);
    }
    return this.getVisitors();
  },

  async addVisitor(visitor: Omit<Visitor, 'id' | 'status' | 'churchId'>, chosenChurchId?: string): Promise<Visitor> {
    const currentChurchId = chosenChurchId || authService.getCurrentSession()?.churchId || 'futamap';
    const newVisitor: Visitor = {
      ...visitor,
      id: 'v_' + Math.random().toString(36).substring(2, 11),
      churchId: currentChurchId,
      status: 'Pending'
    };

    const res = await fetch('/api/visitors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newVisitor)
    });

    if (!res.ok) {
      throw new Error('Failed to save visitor on backend.');
    }

    // Register a system activity
    await activityService.addActivity({
      type: 'registration',
      description: `Visitor ${newVisitor.fullName} registered, invited by ${newVisitor.invitedBy}.`,
      timestamp: new Date().toISOString().split('T')[0],
      memberName: newVisitor.fullName
    }, currentChurchId);

    // Auto-create a Follow Up record for this visitor
    await followUpService.addFollowUp({
      id: newVisitor.id,
      churchId: currentChurchId,
      name: newVisitor.fullName,
      phoneNumber: newVisitor.phoneNumber,
      reason: `First-time visitor on ${newVisitor.dateVisited}. Invited by ${newVisitor.invitedBy}.`,
      status: 'Needs Follow Up',
      notes: newVisitor.prayerRequest ? [{
        id: 'n_' + Math.random().toString(36).substring(2, 11),
        date: new Date().toISOString().split('T')[0],
        text: `Initial Prayer Request: ${newVisitor.prayerRequest}`,
        author: 'System'
      }] : []
    });

    await this.fetchVisitors();
    return newVisitor;
  },

  async updateVisitorStatus(id: string, status: Visitor['status']): Promise<Visitor> {
    const all = this.getVisitors();
    const current = all.find(v => v.id === id);
    if (!current) throw new Error('Visitor not found.');

    const res = await fetch(`/api/visitors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      throw new Error('Failed to update visitor status on backend.');
    }

    const updatedVisitor = await res.json();

    // Keep the follow up entry status in sync!
    try {
      const followUpStatusMap: Record<Visitor['status'], 'Needs Follow Up' | 'Contacted' | 'Visited' | 'Restored'> = {
        'Pending': 'Needs Follow Up',
        'Contacted': 'Contacted',
        'Integrated': 'Restored'
      };
      
      await followUpService.syncStatus(id, followUpStatusMap[status]);
    } catch (e) {
      console.warn("Could not sync follow up status", e);
    }

    await activityService.addActivity({
      type: 'followup',
      description: `Updated visitor ${updatedVisitor.fullName} status to ${status}.`,
      timestamp: new Date().toISOString().split('T')[0],
      memberName: updatedVisitor.fullName
    }, updatedVisitor.churchId);

    await this.fetchVisitors();
    return updatedVisitor;
  }
};
