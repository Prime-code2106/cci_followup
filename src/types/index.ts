export interface Member {
  id: string;
  churchId?: string; // Data Isolation Tenant ID
  fullName: string;
  phoneNumber: string;
  gender: 'Male' | 'Female';
  department: string;
  level: string; // e.g., 100, 200, 300
  faculty: string;
  residence: string; // e.g., Hostel/Residence
  birthday: string; // YYYY-MM-DD
  dateJoined: string; // YYYY-MM-DD
  email?: string;
  status: 'Active' | 'Inactive';
  mapName: string; // For MAP association, e.g. "MAP Alpha", "MAP Omega"
  passwordHash?: string; // Authenticated portal access
  profilePicture?: string; // Upload link or symbol
  bio?: string;
  interests?: string[];
  ministryInvolvement?: string[];
  socialVisibilityOptIn?: boolean;
}

export interface Visitor {
  id: string;
  churchId?: string; // Data Isolation Tenant ID
  fullName: string;
  phoneNumber: string;
  gender: 'Male' | 'Female';
  invitedBy: string;
  dateVisited: string; // YYYY-MM-DD
  prayerRequest?: string;
  status: 'Pending' | 'Contacted' | 'Integrated';
}

export type ServiceType = 'Sunday Service' | 'Bible Study' | 'Prayer Meeting' | 'MAP Meeting' | 'Midweek Service' | 'Special Program';

export interface Attendance {
  id: string;
  churchId?: string; // Data Isolation Tenant ID
  memberId: string;
  date: string; // YYYY-MM-DD
  serviceType: ServiceType;
}

export interface PrayerRequest {
  id: string;
  churchId?: string; // Data Isolation Tenant ID
  fullName: string;
  phoneNumber: string;
  request: string;
  dateSubmitted: string; // YYYY-MM-DD
  status: 'Praying' | 'Answered' | 'Ongoing';
}

export interface FollowUpNote {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  author: string;
}

export interface FollowUp {
  id: string; // Matches core entity ID, such as a Visitor ID or Member ID
  churchId?: string; // Data Isolation Tenant ID
  name: string;
  phoneNumber: string;
  reason: string;
  lastAttendanceDate?: string;
  status: 'Needs Follow Up' | 'Contacted' | 'Visited' | 'Restored';
  notes: FollowUpNote[];
}

export interface Church {
  id: string;
  name: string;
  passwordHash: string;
  mapName: string;
  logoName: string;
}

export interface ChurchSession {
  churchId: string;
  churchName: string;
  mapName: string;
  logoName: string;
  authenticatedAt: string;
}

export interface MemberSession {
  memberId: string;
  fullName: string;
  churchId: string;
  phoneNumber: string;
  email?: string;
  authenticatedAt: string;
}

export interface RecentActivity {
  id: string;
  churchId?: string; // Tenant separation
  type: 'attendance' | 'prayer' | 'registration' | 'followup';
  description: string;
  timestamp: string; // YYYY-MM-DD
  memberName?: string;
}

export interface BirthdayReminder {
  memberId: string;
  fullName: string;
  birthday: string; // MM-DD or YYYY-MM-DD
  daysRemaining: number;
  isToday: boolean;
}

export interface FellowshipConnection {
  id: string;
  churchId?: string;
  senderId: string;
  receiverId: string;
  status: 'pending' | 'connected';
  dateRequested: string; // YYYY-MM-DD
}

export interface FellowshipNote {
  id: string;
  churchId?: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  message: string;
  dateSent: string; // YYYY-MM-DD
  theme?: 'Prayer' | 'Encouragement' | 'Salutation' | 'Check-in';
}

export interface ChurchEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string;
  location: string;
  category: 'program' | 'meeting' | 'special';
}

export type UserRole = 'Admin' | 'MAP Leader' | 'Member';

export interface AppSettings {
  mapName: string;
  churchName: string;
  themeColor: string; // Hex color
  logoName: string;
}
