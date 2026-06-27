import { Attendance, ServiceType } from '../types';
import { authService } from './authService.ts';
import { activityService } from './activityService.ts';

const STORAGE_KEY = 'futamap_attendance';

export const attendanceService = {
  getAttendance(): Attendance[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const all = JSON.parse(stored);
        const session = authService.getCurrentSession();
        if (session) {
          return all.filter((a: any) => a.churchId === session.churchId);
        }
        return all.filter((a: any) => a.churchId === 'futamap');
      } catch (e) {
        console.error("Error parsing attendance cache", e);
      }
    }
    return [];
  },

  async fetchAttendance(): Promise<Attendance[]> {
    try {
      const session = authService.getCurrentSession();
      const url = session ? `/api/attendance?churchId=${session.churchId}` : '/api/attendance';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        const stored = localStorage.getItem(STORAGE_KEY);
        let allRecords: Attendance[] = [];
        if (stored) {
          try {
            allRecords = JSON.parse(stored);
          } catch {}
        }
        
        const churchIdFilter = session ? session.churchId : 'futamap';
        allRecords = allRecords.filter(a => a.churchId !== churchIdFilter);
        allRecords = [...data, ...allRecords];
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(allRecords));
        return data;
      }
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
    }
    return this.getAttendance();
  },

  getAttendanceHistoryForMember(memberId: string): Attendance[] {
    const records = this.getAttendance();
    return records.filter(r => r.memberId === memberId);
  },

  async addAttendance(
    memberId: string, 
    memberName: string, 
    serviceType: ServiceType, 
    date: string,
    chosenChurchId?: string
  ): Promise<Attendance> {
    const currentChurchId = chosenChurchId || authService.getCurrentSession()?.churchId || 'futamap';
    
    const newRecord: Attendance = {
      id: 'att_' + Math.random().toString(36).substring(2, 11),
      churchId: currentChurchId,
      memberId,
      date,
      serviceType
    };

    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });

    if (res.status === 409) {
      // Already registered, return existing
      return newRecord;
    }

    if (!res.ok) {
      throw new Error('Failed to record attendance on backend.');
    }

    // Log the recent activity
    await activityService.addActivity({
      type: 'attendance',
      description: `${memberName} attended ${serviceType}.`,
      timestamp: date,
      memberName: memberName
    }, currentChurchId);

    await this.fetchAttendance();
    return newRecord;
  },

  async removeAttendance(id: string): Promise<void> {
    const res = await fetch(`/api/attendance/${id}`, {
      method: 'DELETE'
    });

    if (!res.ok) {
      throw new Error('Failed to delete attendance on backend.');
    }

    await this.fetchAttendance();
  }
};
