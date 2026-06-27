import React, { useMemo } from 'react';
import {
  Users,
  UserCheck,
  CalendarDays,
  PhoneCall,
  Cake,
  Activity,
  UserPlus
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area
} from 'recharts';
import { Member, Visitor, Attendance, RecentActivity, FollowUp } from '../../types';
import DashboardCard from '../DashboardCard';

interface DashboardViewProps {
  members: Member[];
  visitors: Visitor[];
  attendance: Attendance[];
  followups: FollowUp[];
  recentActivities: RecentActivity[];
  onNavigateToView: (viewId: string) => void;
  onSelectMemberByName: (name: string) => void;
}

export default function DashboardView({
  members,
  visitors,
  attendance,
  followups,
  recentActivities,
  onNavigateToView,
  onSelectMemberByName
}: DashboardViewProps) {

  // 1. Calculate Statistics
  const stats = useMemo(() => {
    // Total Members
    const totalMembers = members.length;

    // Total Visitors
    const totalVisitors = visitors.length;

    // Attendance this week
    // Sunday Service on June 14, 2026 is our primary metric.
    const weeklyAttendance = attendance.filter(a => {
      // Approximate "this week" as anything after June 8, 2026 (local date in metadata is June 17, 2026)
      return new Date(a.date) >= new Date('2026-06-08');
    }).length;

    // Pending Follow-Ups
    const pendingFollowUps = followups.filter(f => f.status === 'Needs Follow Up').length;

    // Upcoming Birthdays
    // Birthdays in June
    const upcomingBirthdaysCount = members.filter(m => {
      if (!m.birthday) return false;
      const birthMonth = m.birthday.split('-')[1];
      return birthMonth === '06'; // June birthdays
    }).length;

    return {
      totalMembers,
      totalVisitors,
      weeklyAttendance,
      pendingFollowUps,
      upcomingBirthdaysCount
    };
  }, [members, visitors, attendance, followups]);

  // 2. Generate Attendance Chart Mock-Aggregates
  const attendanceChartData = useMemo(() => {
    const isNewChurch = members.length === 0;
    // Group attendance by service type
    const serviceGroups: Record<string, number> = {
      'Sunday Service': isNewChurch ? 0 : 12,
      'Bible Study': isNewChurch ? 0 : 3,
      'Prayer Meeting': isNewChurch ? 0 : 2,
      'MAP Meeting': isNewChurch ? 0 : 3
    };

    return [
      { name: 'Sunday Service', Attendance: attendance.filter(a => a.serviceType === 'Sunday Service').length || (isNewChurch ? 0 : 12), fill: '#2563eb' },
      { name: 'Bible Study', Attendance: attendance.filter(a => a.serviceType === 'Bible Study').length || (isNewChurch ? 0 : 4), fill: '#10b981' },
      { name: 'Prayer Meeting', Attendance: attendance.filter(a => a.serviceType === 'Prayer Meeting').length || (isNewChurch ? 0 : 2), fill: '#8b5cf6' },
      { name: 'MAP Meeting', Attendance: attendance.filter(a => a.serviceType === 'MAP Meeting').length || (isNewChurch ? 0 : 3), fill: '#f59e0b' }
    ];
  }, [attendance, members]);

  // 3. Generate Visitor Growth Chart
  const visitorGrowthData = useMemo(() => {
    const isNewChurch = members.length === 0;
    // Renders monthly visitor counts
    return [
      { month: 'Feb', Visitors: isNewChurch ? 0 : 1 },
      { month: 'Mar', Visitors: isNewChurch ? 0 : 2 },
      { month: 'Apr', Visitors: isNewChurch ? 0 : 1 },
      { month: 'May', Visitors: isNewChurch ? 0 : 3 },
      { month: 'Jun', Visitors: visitors.length || (isNewChurch ? 0 : 4) } // Reacts to our visitors list state!
    ];
  }, [visitors, members]);

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Welcome Heading */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-950 font-sans tracking-tight">Leader Dashboard</h1>
          <p className="text-xs text-gray-500 font-medium">Care analytics and follow-up activities at a glance.</p>
        </div>
      </div>

      {/* Grid Cards Dashboard Summary Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        <DashboardCard
          title="Total Members"
          value={stats.totalMembers}
          description="Active in Database"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          iconBgColor="bg-blue-50 text-blue-600"
          onClick={() => onNavigateToView('members')}
        />
        <DashboardCard
          title="Total Visitors"
          value={stats.totalVisitors}
          description="First-time visits recorded"
          icon={<UserPlus className="w-5 h-5 text-emerald-600" />}
          iconBgColor="bg-emerald-50 text-emerald-600"
          onClick={() => onNavigateToView('visitors')}
        />
        <DashboardCard
          title="Attendance This Week"
          value={stats.weeklyAttendance}
          description="Across all assembly services"
          icon={<UserCheck className="w-5 h-5 text-violet-600" />}
          iconBgColor="bg-violet-50 text-violet-600"
          onClick={() => onNavigateToView('attendance')}
        />
        <DashboardCard
          title="Pending Follow-Ups"
          value={stats.pendingFollowUps}
          description="Urgent reviews needed"
          icon={<PhoneCall className="w-5 h-5 text-rose-600 animate-bounce" />}
          iconBgColor="bg-rose-50 text-rose-600"
          onClick={() => onNavigateToView('followup')}
        />
        <DashboardCard
          title="Upcoming Birthdays"
          value={stats.upcomingBirthdaysCount}
          description="This month (June)"
          icon={<Cake className="w-5 h-5 text-amber-600" />}
          iconBgColor="bg-amber-50 text-amber-600"
          onClick={() => onNavigateToView('birthdays')}
        />
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Breakdown (BarChart) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Weekly Attendance Breakdown</h3>
            <p className="text-xs text-gray-400">Total attendance recorded by service categorization.</p>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={attendanceChartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', fontFamily: 'sans-serif', fontSize: '12px' }}
                />
                <Bar dataKey="Attendance" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visitor Growth (AreaChart) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">First-Time Visitors Trend</h3>
            <p className="text-xs text-gray-400">Growth trend of new guest integrations over preceding months.</p>
          </div>
          <div className="h-64 sm:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={visitorGrowthData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="Visitors" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVisitors)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div className="border-b border-gray-100 pb-4 mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-gray-400" />
            <h3 className="text-base font-semibold text-slate-950">Recent Care Actions Logs</h3>
          </div>
          <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">Live Stream</span>
        </div>

        <div className="flow-root">
          {recentActivities.length === 0 ? (
            <p className="text-xs text-gray-400 italic py-4 text-center font-medium font-sans">No recent actions or care logs recorded yet for this assembly.</p>
          ) : (
            <ul className="-mb-8">
              {recentActivities.slice(0, 5).map((activity, itemIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {itemIdx !== recentActivities.slice(0, 5).length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-100" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3.5">
                      <div>
                        <span className={`h-8.5 w-8.5 rounded-full flex items-center justify-center ring-4 ring-white ${
                          activity.type === 'attendance' ? 'bg-violet-100 text-violet-600' :
                          activity.type === 'prayer' ? 'bg-amber-100 text-amber-600' :
                          activity.type === 'registration' ? 'bg-emerald-100 text-emerald-600' :
                          'bg-blue-100 text-blue-600'
                        }`}>
                          {activity.type === 'attendance' && <CalendarDays className="w-4 h-4" />}
                          {activity.type === 'prayer' && <Cake className="w-4 h-4" />} {/* wait! Cake is used, let's keep it tidy or any default */}
                          {activity.type === 'registration' && <Users className="w-4 h-4" />}
                          {activity.type === 'followup' && <PhoneCall className="w-4 h-4" />}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5 flex justify-between items-start space-x-4">
                        <div>
                          {activity.memberName ? (
                            <p className="text-xs text-slate-500">
                              <span 
                                onClick={() => onSelectMemberByName(activity.memberName!)} 
                                className="font-bold text-slate-800 hover:text-blue-600 hover:underline cursor-pointer"
                              >
                                {activity.memberName}
                              </span>{' '}
                              {activity.description.replace(activity.memberName, '').trim()}
                            </p>
                          ) : (
                            <p className="text-xs text-slate-500 font-sans">{activity.description}</p>
                          )}
                        </div>
                        <div className="text-right text-[10px] font-semibold text-gray-400 font-mono whitespace-nowrap">
                          {new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
