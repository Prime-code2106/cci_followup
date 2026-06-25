import { FellowshipConnection, FellowshipNote, Member } from '../types';
import { memberService } from './memberService';

const CONNECTIONS_KEY = 'futamap_fellowship_connections';
const NOTES_KEY = 'futamap_fellowship_notes';

// Seeding standard initial database state for demonstration
const seedInitialConnections = (churchId: string, currentMemberId: string): FellowshipConnection[] => {
  // We'll dynamically find 2 members in the same church and make them pending/connected
  const siblings = memberService.getMembers().filter(m => m.id !== currentMemberId);
  const seeded: FellowshipConnection[] = [];

  if (siblings.length >= 2) {
    // 1 connected friend
    seeded.push({
      id: 'conn_1',
      churchId: churchId,
      senderId: siblings[0].id,
      receiverId: currentMemberId,
      status: 'connected',
      dateRequested: '2026-06-15'
    });
    // Another connected friend
    if (siblings[1]) {
      seeded.push({
        id: 'conn_2',
        churchId: churchId,
        senderId: siblings[1].id,
        receiverId: currentMemberId,
        status: 'connected',
        dateRequested: '2026-06-16'
      });
    }
    // 1 pending inward request they can choose to Accept or Decline
    if (siblings[2]) {
      seeded.push({
        id: 'conn_3',
        churchId: churchId,
        senderId: siblings[2].id,
        receiverId: currentMemberId,
        status: 'pending',
        dateRequested: '2026-06-18'
      });
    }
  }
  return seeded;
};

const seedInitialNotes = (churchId: string, currentMemberId: string, connections: FellowshipConnection[]): FellowshipNote[] => {
  const notes: FellowshipNote[] = [];
  const activeFriend = connections.find(c => c.status === 'connected');
  
  if (activeFriend) {
    const friendProfile = memberService.getMemberById(activeFriend.senderId);
    if (friendProfile) {
      notes.push({
        id: 'note_1',
        churchId: churchId,
        senderId: friendProfile.id,
        senderName: friendProfile.fullName,
        receiverId: currentMemberId,
        message: 'Brethren, standing with you in prayers regarding your semester exams. Keep shining the light!',
        dateSent: '2026-06-16',
        theme: 'Prayer'
      });
      notes.push({
        id: 'note_2',
        churchId: churchId,
        senderId: friendProfile.id,
        senderName: friendProfile.fullName,
        receiverId: currentMemberId,
        message: 'Amazing service yesterday! The teaching on spiritual alignment really aligned with what we touched on in our MAP meeting.',
        dateSent: '2026-06-17',
        theme: 'Encouragement'
      });
    }
  }
  return notes;
};

const getStoredConnections = (churchId: string, currentMemberId: string): FellowshipConnection[] => {
  const stored = localStorage.getItem(CONNECTIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
  }
  const seeded = seedInitialConnections(churchId, currentMemberId);
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(seeded));
  return seeded;
};

const getStoredNotes = (churchId: string, currentMemberId: string, connections: FellowshipConnection[]): FellowshipNote[] => {
  const stored = localStorage.getItem(NOTES_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
  }
  const seeded = seedInitialNotes(churchId, currentMemberId, connections);
  localStorage.setItem(NOTES_KEY, JSON.stringify(seeded));
  return seeded;
};

export const fellowshipService = {
  // TODO: Replace with Supabase table select / join queries
  
  getConnections(churchId: string, memberId: string): FellowshipConnection[] {
    return getStoredConnections(churchId, memberId);
  },

  getNotes(churchId: string, memberId: string): FellowshipNote[] {
    const conns = this.getConnections(churchId, memberId);
    return getStoredNotes(churchId, memberId, conns);
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
  sendConnectionRequest(churchId: string, senderId: string, receiverId: string): FellowshipConnection {
    const conns = getStoredConnections(churchId, senderId);
    
    // Check if duplicate
    const exists = conns.find(c => 
      (c.senderId === senderId && c.receiverId === receiverId) ||
      (c.senderId === receiverId && c.receiverId === senderId)
    );

    if (exists) {
      return exists;
    }

    const newConn: FellowshipConnection = {
      id: 'conn_' + Math.random().toString(36).substr(2, 9),
      churchId,
      senderId,
      receiverId,
      status: 'pending',
      dateRequested: new Date().toISOString().split('T')[0]
    };

    const updated = [...conns, newConn];
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(updated));
    return newConn;
  },

  // Accept fellowship invitation
  acceptConnectionRequest(churchId: string, connectionId: string): void {
    const conns = getStoredConnections(churchId, '');
    const index = conns.findIndex(c => c.id === connectionId);
    if (index !== -1) {
      conns[index].status = 'connected';
      localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(conns));
    }
  },

  // Decline or delete fellowship link
  removeConnection(churchId: string, connectionId: string): void {
    const conns = getStoredConnections(churchId, '');
    const filtered = conns.filter(c => c.id !== connectionId);
    localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(filtered));
  },

  // Send a custom spiritual encouragement message
  sendFellowshipNote(churchId: string, senderId: string, senderName: string, receiverId: string, message: string, theme: 'Prayer' | 'Encouragement' | 'Salutation' | 'Check-in'): FellowshipNote {
    const conns = getStoredConnections(churchId, senderId);
    const notes = getStoredNotes(churchId, senderId, conns);

    const newNote: FellowshipNote = {
      id: 'note_' + Math.random().toString(36).substr(2, 9),
      churchId,
      senderId,
      senderName,
      receiverId,
      message,
      dateSent: new Date().toISOString().split('T')[0],
      theme
    };

    const updated = [newNote, ...notes];
    localStorage.setItem(NOTES_KEY, JSON.stringify(updated));
    return newNote;
  }
};
