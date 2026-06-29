import React, { useMemo } from 'react';
import { Member, Visitor, Attendance, PrayerRequest, FollowUp } from '../../types';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { BarChart3, Users, HeartHandshake, PhoneCall, TrendingUp, Sparkles, Download } from 'lucide-react';

interface ReportsViewProps {
  members: Member[];
  visitors: Visitor[];
  attendance: Attendance[];
  prayerRequests: PrayerRequest[];
  followups: FollowUp[];
}

export default function ReportsView({
  members,
  visitors,
  attendance,
  prayerRequests,
  followups
}: ReportsViewProps) {
  // 1. Calculate active vs inactive counts for member stats
  const memberActivityStats = useMemo(() => {
    const active = members.filter(m => m.status === 'Active').length;
    const inactive = members.filter(m => m.status === 'Inactive').length;
    return [
      { name: 'Active Members', value: active, fill: '#10b981' }, // emerald index
      { name: 'Inactive Members', value: inactive, fill: '#cbd5e1' } // slate silver
    ];
  }, [members]);

  // 2. Visitor status breakdown (Pending vs Contacted vs Integrated)
  const visitorStatusBreakdown = useMemo(() => {
    const pending = visitors.filter(v => v.status === 'Pending').length;
    const contacted = visitors.filter(v => v.status === 'Contacted').length;
    const integrated = visitors.filter(v => v.status === 'Integrated').length;

    return [
      { name: 'Pending follow-up', count: pending, fill: '#f59e0b' },
      { name: 'Contacted', count: contacted, fill: '#2563eb' },
      { name: 'Integrated', count: integrated, fill: '#10b981' }
    ];
  }, [visitors]);

  // Total summary aggregates
  const reportsSummary = useMemo(() => {
    const totalMembers = members.length;
    const activeCount = members.filter(m => m.status === 'Active').length;
    const activePercent = totalMembers > 0 ? Math.round((activeCount / totalMembers) * 100) : 0;

    return {
      totalMembers,
      activePercent,
      totalVisitors: visitors.length,
      prayerCount: prayerRequests.length,
      answeredPrayers: prayerRequests.filter(p => p.status === 'Answered').length,
      completedFollowups: followups.filter(f => f.status === 'Restored').length
    };
  }, [members, visitors, prayerRequests, followups]);

  // CSV Export utility
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row =>
        headers.map(fieldName => {
          const val = row[fieldName];
          const valStr = val === undefined || val === null ? '' : String(val);
          const escaped = valStr.replace(/"/g, '""');
          return `"${escaped}"`;
        }).join(',')
      )
    ];

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportMembers = () => {
    const dataToExport = members.map(m => ({
      'ID': m.id,
      'Full Name': m.fullName,
      'Email': m.email || '',
      'Phone Number': m.phoneNumber,
      'Gender': m.gender,
      'Department': m.department,
      'Level': m.level,
      'Faculty': m.faculty,
      'Residence': m.residence,
      'Birthday': m.birthday,
      'Date Joined': m.dateJoined,
      'Status': m.status,
      'MAP Association': m.mapName,
      'Bio': m.bio || '',
      'Interests': m.interests?.join(', ') || '',
      'Ministry Involvement': m.ministryInvolvement?.join(', ') || ''
    }));
    exportToCSV(dataToExport, `members_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportAttendance = () => {
    const dataToExport = attendance.map(a => {
      const member = members.find(m => m.id === a.memberId);
      return {
        'Attendance ID': a.id,
        'Member ID': a.memberId,
        'Member Name': member ? member.fullName : 'Unknown Member',
        'Member Email': member?.email || '',
        'Member Phone': member?.phoneNumber || '',
        'MAP Association': member?.mapName || '',
        'Date': a.date,
        'Service Type': a.serviceType
      };
    });
    exportToCSV(dataToExport, `attendance_report_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-150 tracking-tight font-sans">Care & Discipleship Reports</h1>
          <p className="text-xs text-gray-500 font-medium">Analytical reports tracking active retention, prayer intercession grids, and outreach benchmarks.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportMembers}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors rounded-xl border border-slate-700/50 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Members CSV</span>
          </button>
          <button
            onClick={handleExportAttendance}
            className="inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors rounded-xl border border-blue-500/50 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Attendance CSV</span>
          </button>
        </div>
      </div>

      {/* Bento Stats Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">MAP Core Registry</span>
            <span className="block text-2xl font-bold text-slate-900 leading-none">{reportsSummary.totalMembers}</span>
            <span className="block text-xs text-emerald-600 font-medium mt-1.5">{reportsSummary.activePercent}% active retention</span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Intercession Grids</span>
            <span className="block text-2xl font-bold text-slate-900 leading-none">{reportsSummary.prayerCount}</span>
            <span className="block text-xs text-amber-600 font-medium mt-1.5">{reportsSummary.answeredPrayers} answered requests</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <HeartHandshake className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">First-Timer Registry</span>
            <span className="block text-2xl font-bold text-slate-900 leading-none">{reportsSummary.totalVisitors}</span>
            <span className="block text-xs text-blue-600 font-medium mt-1.5">{reportsSummary.completedFollowups} integrated completely</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Care Benchmarks</span>
            <span className="block text-2xl font-bold text-slate-900 leading-none">{followups.length}</span>
            <span className="block text-xs text-rose-600 font-medium mt-1.5">Active monitoring</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <PhoneCall className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Charts breakdown Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Piechart Member states */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Member Activity Ratios</h3>
            <p className="text-[11px] text-gray-450 mt-1 lead-relaxed">Reviewing active versus flagged/inactive discipleship states.</p>
          </div>
          
          <div className="h-56 mt-4 flex justify-center items-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={memberActivityStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {memberActivityStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center annotation */}
            <div className="absolute text-center">
              <span className="block text-xl font-bold text-slate-800">{reportsSummary.totalMembers}</span>
              <span className="block text-[9px] text-gray-400 uppercase tracking-wider font-mono">Members</span>
            </div>
          </div>

          <div className="space-y-2 border-t border-gray-50 pt-3">
            {memberActivityStats.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.fill }} />
                  <span className="text-slate-600 font-medium">{item.name}</span>
                </div>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Barchart visitor integrations */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Outreach Conversion Funnel</h3>
            <p className="text-[11px] text-gray-450 mt-1 lead-relaxed">Tracking first-time visitor integrations across progressive stages (Pending → Contacted → Integrated).</p>
          </div>

          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={visitorStatusBreakdown} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={50}>
                  {visitorStatusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-right text-[10px] text-gray-400 font-semibold font-mono border-t border-gray-50 pt-3">
            Total Target Cohort: {reportsSummary.totalVisitors} visitors
          </div>
        </div>

      </div>

      {/* Discipleship benchmarks logs summary */}
      <div className="p-4 bg-emerald-50/20 border border-emerald-100 rounded-2xl flex items-start space-x-3 text-xs text-emerald-800 font-medium">
        <TrendingUp className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong>Outreach Benchmark Active:</strong> Outstanding integration conversion rate of <strong>{reportsSummary.totalVisitors > 0 ? Math.round((reportsSummary.completedFollowups / reportsSummary.totalVisitors) * 100) : 0}%</strong> of registered first-time visitors fully transitioned into active MAP small grouping participants. Keep checking in with families weekly!
        </p>
      </div>

    </div>
  );
}
