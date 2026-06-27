import { pgTable, text, boolean, jsonb } from 'drizzle-orm/pg-core';

// 1. Churches (Tenants) Table
export const churches = pgTable('churches', {
  id: text('id').primaryKey(), // Tenant ID (e.g. 'futamap')
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  mapName: text('map_name').notNull(),
  logoName: text('logo_name').notNull()
});

// 2. Members Table
export const members = pgTable('members', {
  id: text('id').primaryKey(),
  churchId: text('church_id').references(() => churches.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  gender: text('gender').notNull(), // 'Male' | 'Female'
  department: text('department').notNull(),
  level: text('level').notNull(),
  faculty: text('faculty').notNull(),
  residence: text('residence').notNull(),
  birthday: text('birthday').notNull(), // YYYY-MM-DD
  dateJoined: text('date_joined').notNull(), // YYYY-MM-DD
  email: text('email'),
  status: text('status').notNull(), // 'Active' | 'Inactive'
  mapName: text('map_name').notNull(),
  passwordHash: text('password_hash'),
  profilePicture: text('profile_picture'),
  bio: text('bio'),
  interests: jsonb('interests').$type<string[]>(),
  ministryInvolvement: jsonb('ministry_involvement').$type<string[]>(),
  socialVisibilityOptIn: boolean('social_visibility_opt_in').default(true)
});

// 3. Visitors Table
export const visitors = pgTable('visitors', {
  id: text('id').primaryKey(),
  churchId: text('church_id').references(() => churches.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  gender: text('gender').notNull(), // 'Male' | 'Female'
  invitedBy: text('invited_by').notNull(),
  dateVisited: text('date_visited').notNull(), // YYYY-MM-DD
  prayerRequest: text('prayer_request'),
  status: text('status').notNull() // 'Pending' | 'Contacted' | 'Integrated'
});

// 4. Attendance Table
export const attendance = pgTable('attendance', {
  id: text('id').primaryKey(),
  churchId: text('church_id').references(() => churches.id, { onDelete: 'cascade' }),
  memberId: text('member_id').references(() => members.id, { onDelete: 'cascade' }),
  date: text('date').notNull(), // YYYY-MM-DD
  serviceType: text('service_type').notNull()
});

// 5. Prayer Requests Table
export const prayerRequests = pgTable('prayer_requests', {
  id: text('id').primaryKey(),
  churchId: text('church_id').references(() => churches.id, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  request: text('request').notNull(),
  dateSubmitted: text('date_submitted').notNull(), // YYYY-MM-DD
  status: text('status').notNull() // 'Praying' | 'Answered' | 'Ongoing'
});

// 6. Follow Ups Table
export const followUps = pgTable('follow_ups', {
  id: text('id').primaryKey(),
  churchId: text('church_id').references(() => churches.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  phoneNumber: text('phone_number').notNull(),
  reason: text('reason').notNull(),
  lastAttendanceDate: text('last_attendance_date'),
  status: text('status').notNull(), // 'Needs Follow Up' | 'Contacted' | 'Visited' | 'Restored'
  notes: jsonb('notes').$type<Array<{ id: string; date: string; text: string; author: string }>>()
});

// 7. Recent Activities Table
export const recentActivities = pgTable('recent_activities', {
  id: text('id').primaryKey(),
  churchId: text('church_id').references(() => churches.id, { onDelete: 'cascade' }),
  type: text('type').notNull(), // 'attendance' | 'prayer' | 'registration' | 'followup'
  description: text('description').notNull(),
  timestamp: text('timestamp').notNull(), // YYYY-MM-DD
  memberName: text('member_name')
});

// 8. Fellowship Connections Table
export const fellowshipConnections = pgTable('fellowship_connections', {
  id: text('id').primaryKey(),
  churchId: text('church_id').references(() => churches.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').references(() => members.id, { onDelete: 'cascade' }),
  receiverId: text('receiver_id').references(() => members.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // 'pending' | 'connected'
  dateRequested: text('date_requested').notNull() // YYYY-MM-DD
});

// 9. Fellowship Notes Table
export const fellowshipNotes = pgTable('fellowship_notes', {
  id: text('id').primaryKey(),
  churchId: text('church_id').references(() => churches.id, { onDelete: 'cascade' }),
  senderId: text('sender_id').references(() => members.id, { onDelete: 'cascade' }),
  senderName: text('sender_name').notNull(),
  receiverId: text('receiver_id').references(() => members.id, { onDelete: 'cascade' }),
  message: text('message').notNull(),
  dateSent: text('date_sent').notNull(), // YYYY-MM-DD
  theme: text('theme') // 'Prayer' | 'Encouragement' | 'Salutation' | 'Check-in'
});

// 10. App Settings Table (SaaS Tenant-Specific Preferences)
export const appSettings = pgTable('app_settings', {
  id: text('id').primaryKey(), // Maps to churchId
  mapName: text('map_name').notNull(),
  churchName: text('church_name').notNull(),
  themeColor: text('theme_color').notNull(),
  logoName: text('logo_name').notNull()
});
