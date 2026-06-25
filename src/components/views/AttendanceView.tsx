import React, { useState, useMemo } from 'react';
import { Member, Attendance, ServiceType } from '../../types';
import { attendanceService } from '../../services/attendanceService';
import { Calendar, CheckCircle2, Filter, Plus, ListFilter, HelpCircle, UserCheck, QrCode, ExternalLink } from 'lucide-react';

interface AttendanceViewProps {
  attendance: Attendance[];
  members: Member[];
  onUpdateAttendance: () => void; // Refresh trigger
}

export default function AttendanceView({
  attendance,
  members,
  onUpdateAttendance
}: AttendanceViewProps) {
  // Input State
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('Sunday Service');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  // Filter State
  const [activeFilter, setActiveFilter] = useState<'All' | 'Today' | 'This Week' | 'This Month'>('All');
  const [selectedServiceFilter, setSelectedServiceFilter] = useState('All');

  // Load member mapping easily
  const memberMap = useMemo(() => {
    const map = new Map<string, Member>();
    members.forEach(m => map.set(m.id, m));
    return map;
  }, [members]);

  // Handles submitting single attendance
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;

    const member = memberMap.get(selectedMemberId);
    if (!member) return;

    try {
      attendanceService.addAttendance(selectedMemberId, member.fullName, serviceType, date);
      onUpdateAttendance();
      setSelectedMemberId(''); // Reset selector
    } catch (err) {
      console.error(err);
    }
  };

  // Filter calculations
  const filteredAttendance = useMemo(() => {
    const now = new Date('2026-06-17'); // Keep aligned relative to metadata local time
    
    return attendance.filter(record => {
      const recordDate = new Date(record.date);
      let matchesTime = true;

      if (activeFilter === 'Today') {
        matchesTime = record.date === '2026-06-17'; // Match metadata exact local time or date
      } else if (activeFilter === 'This Week') {
        const diffDays = Math.abs(now.getTime() - recordDate.getTime()) / (1000 * 60 * 60 * 24);
        matchesTime = diffDays <= 7;
      } else if (activeFilter === 'This Month') {
        matchesTime = record.date.startsWith('2026-06'); // Match June 2026
      }

      const matchesService = selectedServiceFilter === 'All' || record.serviceType === selectedServiceFilter;

      return matchesTime && matchesService;
    });
  }, [attendance, activeFilter, selectedServiceFilter]);

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-150 tracking-tight font-sans">Corporate Attendance Register</h1>
        <p className="text-xs text-gray-500 font-medium">Record check-ins and review analytical summaries for Sunday, weekly, and MAP meetings.</p>
      </div>

      {/* Grid: Columns 1: Log Attendance Form, Column 2: History Register List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Log Attendance Form */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs h-fit space-y-4">
          <div className="border-b border-gray-100 pb-3 flex items-center space-x-2">
            <Plus className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Record New Check-In</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="att-memberSelect" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Select Attendee</label>
              <select
                id="att-memberSelect"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-blue-500 bg-white text-gray-800"
                required
              >
                <option value="">-- Click to choose member --</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.fullName} ({m.mapName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="att-serviceType" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Service Type</label>
              <select
                id="att-serviceType"
                value={serviceType}
                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-blue-500 bg-white text-gray-850"
              >
                <option value="Sunday Service">Sunday Service</option>
                <option value="Midweek Service">Midweek Service</option>
                <option value="Bible Study">Bible Study</option>
                <option value="Prayer Meeting">Prayer Meeting</option>
                <option value="MAP Meeting">MAP Meeting</option>
                <option value="Special Program">Special Program</option>
              </select>
            </div>

            <div>
              <label htmlFor="att-date" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Check-In Date</label>
              <input
                id="att-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full px-w py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:ring-blue-500 bg-white text-gray-800"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer"
            >
              <UserCheck className="w-4 h-4 mr-1.5" />
              Mark Checked-In
            </button>
          </form>
        </div>

        {/* Dynamic QR Code Generator for Services */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          <div className="border-b border-gray-100 pb-3 flex items-center space-x-2">
            <QrCode className="w-5 h-5 text-indigo-600 animate-pulse" />
            <h3 className="text-sm font-bold text-slate-900">Church QR Code Generator</h3>
          </div>
          
          <p className="text-xs text-slate-500 leading-relaxed font-medium">
            Project these QR codes in church or print them for the entrance. When scanned, they automatically detect the church, date, and service details.
          </p>

          <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border rounded-2xl flex flex-col items-center text-center space-y-3 relative overflow-hidden">
            <div className="w-28 h-28 bg-white border-4 border-slate-100 rounded-xl p-1 shadow flex items-center justify-center relative">
              {/* SVG Mock of a real QR Code structure */}
              <svg className="w-24 h-24 text-slate-905" viewBox="0 0 100 100" fill="currentColor">
                <path d="M5,5 h25 v25 h-25 z M12,12 h11 v11 h-11 z" />
                <path d="M70,5 h25 v25 h-25 z M77,12 h11 v11 h-11 z" />
                <path d="M5,70 h25 v25 h-25 z M12,77 h11 v11 h-11 z" />
                <path d="M45,45 h10 v10 h-10 z" />
                {/* Random QR code pixels block */}
                <path d="M40,5 h5 v5 h-5 z M50,15 h10 v5 h-10 z M65,10 h5 v15 h-5 z M5,40 h15 v5 h-15 z M25,45 h5 v10 h-5 z M15,55 h15 v5 h-15 z M70,40 h10 v10 h-10 z M85,50 h10 v5 h-10 z M75,60 h10 v10 h-10 z M40,75 h20 v5 h-20 z M55,85 h15 v10 h-15 z M80,80 h15 v5 h-15 z M45,65 h5 v5 h-5 z" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center bg-blue-105/90 opacity-0 hover:opacity-100 transition-opacity rounded-xl cursor-pointer">
                <span className="text-[10px] font-black text-blue-700 uppercase bg-white px-2 py-1 rounded shadow">CCI Code</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">
                Active: {serviceType}
              </span>
              <span className="block text-xs font-bold text-slate-800">Dynamic Scan link URL</span>
            </div>

            <div className="grid grid-cols-1 gap-2 w-full pt-1">
              <a
                href={`?view=check-in&service=${encodeURIComponent(serviceType)}&date=${date}`}
                onClick={(e) => {
                  e.preventDefault();
                  // Simulate scanning by manipulating the path and triggering a route reload
                  window.history.pushState({}, '', `?view=check-in&service=${encodeURIComponent(serviceType)}&date=${date}`);
                  window.dispatchEvent(new Event('popstate'));
                }}
                className="py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[11px] rounded-xl flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Simulate QR Code Scan
              </a>
              <span className="text-[9px] text-slate-400 font-semibold font-mono">
                Opens check-in page with parameters automatically filled
              </span>
            </div>
          </div>
        </div>

        {/* History Register List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4.5">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-bold text-slate-900">Checked-In logs</h3>
            </div>

            {/* Quick date filters */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveFilter('All')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all ${
                  activeFilter === 'All' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setActiveFilter('Today')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all ${
                  activeFilter === 'Today' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setActiveFilter('This Week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all ${
                  activeFilter === 'This Week' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => setActiveFilter('This Month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all ${
                  activeFilter === 'This Month' ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                This Month
              </button>
            </div>
          </div>

          {/* Service Filters */}
          <div className="flex items-center space-x-2 text-xs text-gray-600 select-none bg-slate-50/50 p-2 border border-slate-100 rounded-xl">
            <ListFilter className="w-4 h-4 text-gray-400" />
            <span className="font-bold font-mono">Service:</span>
            <select
              value={selectedServiceFilter}
              onChange={(e) => setSelectedServiceFilter(e.target.value)}
              className="text-xs font-semibold bg-transparent border-0 focus:ring-0 text-blue-600 cursor-pointer"
            >
              <option value="All">All configurations</option>
              <option value="Sunday Service">Sunday Service</option>
              <option value="Bible Study">Bible Study</option>
              <option value="Prayer Meeting">Prayer Meeting</option>
              <option value="MAP Meeting">MAP Meeting</option>
            </select>
          </div>

          {/* List display */}
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-12 text-gray-400 space-y-2">
              <HelpCircle className="w-8 h-8 text-gray-300 mx-auto" />
              <p className="text-xs font-semibold">No attendance entries matched the active filters.</p>
              <p className="text-[11px]">Select a member on the left panel to log their attendance today.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead>
                  <tr className="text-left text-[11px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50/50">
                    <th scope="col" className="px-4 py-3">Member</th>
                    <th scope="col" className="px-4 py-3">Service</th>
                    <th scope="col" className="px-4 py-3">Date</th>
                    <th scope="col" className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-xs">
                  {filteredAttendance.map(record => {
                    const attendee = memberMap.get(record.memberId);
                    return (
                      <tr key={record.id} className="hover:bg-slate-50/40">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-gray-800">{attendee?.fullName || "Database Member"}</div>
                          <div className="text-[10px] text-gray-400">{attendee?.mapName || ""}</div>
                        </td>
                        <td className="px-4 py-3.5 text-gray-600 font-semibold">{record.serviceType}</td>
                        <td className="px-4 py-3.5 font-mono text-gray-500">{record.date}</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                            Checked-In
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="text-right text-[10px] text-slate-400 font-semibold font-mono pb-1">
            Total Displayed: {filteredAttendance.length} records
          </div>

        </div>

      </div>
    </div>
  );
}
