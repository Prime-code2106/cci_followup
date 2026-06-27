import { FellowshipConnection, FellowshipNote, Member } from '../types';
import { memberService } from './memberService.ts';

const CONNECTIONS_KEY = 'futamap_fellowship_connections';
const NOTES_KEY = 'futamap_fellowship_notes';

export const fellowshipService = {
  // Sync all fellowship data from Postgres to client cache
  async fetchFellowshipData(churchId: string): Promise<void> {
    try {
      const [connRes, notesRes] = await Promise.all([
        fetch(`/api/fellowship/connections?churchId=${churchId}`),
        fetch(`/api/fellowship/notes?churchId=${churchId}`)
      ]);

      if (connRes.ok) {
        const conns = await connRes.json();
        localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(conns));
      }
      if (notesRes.ok) {
        const notes = await notesRes.json();
        localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
      }
    } catch (err) {
      console.error('Failed to sync fellowship data from server:', err);
    }
  },

  getConnections(churchId: string, memberId: string): FellowshipConnection[] {
    const stored = localStorage.getItem(CONNECTIONS_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return [];
  },

  getNotes(churchId: string, memberId: string): FellowshipNote[] {
    const stored = localStorage.getItem(NOTES_KEY);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return [];
  },

  // Get active friend profiles of a member
  getConnectedBrethren(churchId: string, memberId: string): Member[] {
    const conns = this.getConnections(churchId, memberId);
    const connectedIds = conns
      .filter(c => c.status === 'connected')
      .map(c => c.senderId === memberId ? c.receiverId : c.senderId);
      
    return connectedIds
      .map(id => memberService.getMemberById(id))
      .filter((m): m is Member => !!m);
  },

  // Get pending connection requests incoming to the member
  getPendingIncomingRequests(churchId: string, memberId: string): { connectionId: string, sender: Member }[] {
    const conns = this.getConnections(churchId, memberId);
    return conns
      .filter(c => c.status === 'pending' && c.receiverId === memberId)
      .map(c => {
        const sender = memberService.getMemberById(c.senderId);
        return sender ? { connectionId: c.id, sender } : null;
      })
      .filter((x): x is { connectionId: string, sender: Member } => !!x);
  },

  // Get pending connection requests outgoing from the member
  getPendingOutgoingRequests(churchId: string, memberId: string): string[] {
    const conns = this.getConnections(churchId, memberId);
    return conns
      .filter(c => c.status === 'pending' && c.senderId === memberId)
      .map(c => c.receiverId);
  },

  // Send a new fellowship invitation
  async sendConnectionRequest(churchId: string, senderId: string, receiverId: string): Promise<FellowshipConnection> {
    const conns = this.getConnections(churchId, senderId);
    const exists = conns.find(c => 
      (c.senderId === senderId && c.receiverId === receiverId) ||
      (c.senderId === receiverId && c.receiverId === senderId)
    );

    if (exists) {
      return exists;
    }

    const newConn: FellowshipConnection = {
      id: 'conn_' + Math.random().toString(36).substring(2, 11),
      churchId,
      senderId,
      receiverId,
      status: 'pending',
      dateRequested: new Date().toISOString().split('T')[0]
    };

    const res = await fetch('/api/fellowship/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newConn)
    });

    if (res.ok) {
      await this.fetchFellowshipData(churchId);
    }

    return newConn;
  },

  // Accept fellowship invitation
  async acceptConnectionRequest(churchId: string, connectionId: string): Promise<void> {
    const res = await fetch(`/api/fellowship/connections/${connectionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'connected' })
    });

    if (res.ok) {
      await this.fetchFellowshipData(churchId);
    }
  },

  // Decline or delete fellowship link
  async removeConnection(churchId: string, connectionId: string): Promise<void> {
    const res = await fetch(`/api/fellowship/connections/${connectionId}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      await this.fetchFellowshipData(churchId);
    }
  },

  // Send a custom spiritual encouragement message
  async sendFellowshipNote(
    churchId: string, 
    senderId: string, 
    senderName: string, 
    receiverId: string, 
    message: string, 
    theme: 'Prayer' | 'Encouragement' | 'Salutation' | 'Check-in'
  ): Promise<FellowshipNote> {
    const newNote: FellowshipNote = {
      id: 'note_' + Math.random().toString(36).substring(2, 11),
      churchId,
      senderId,
      senderName,
      receiverId,
      message,
      dateSent: new Date().toISOString().split('T')[0],
      theme
    };

    const res = await fetch('/api/fellowship/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNote)
    });

    if (res.ok) {
      await this.fetchFellowshipData(churchId);
    }

    return newNote;
  }
};
