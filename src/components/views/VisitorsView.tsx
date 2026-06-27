import React, { useState, useMemo } from 'react';
import { Visitor } from '../../types';
import { visitorService } from '../../services/visitorService';
import StatusBadge from '../StatusBadge';
import SearchBar from '../SearchBar';
import { Calendar, Phone, UsersIcon, Sparkles, MessageSquare, ChevronRight, UserPlus } from 'lucide-react';

interface VisitorsViewProps {
  visitors: Visitor[];
  onUpdateVisitors: () => void; // State refresh trigger
  onNavigateToRegister: () => void;
}

export default function VisitorsView({
  visitors,
  onUpdateVisitors,
  onNavigateToRegister
}: VisitorsViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Filter visitors
  const filteredVisitors = useMemo(() => {
    return visitors.filter(visitor => {
      const matchesSearch = visitor.fullName.toLowerCase().includes(search.toLowerCase()) ||
                            visitor.invitedBy.toLowerCase().includes(search.toLowerCase()) ||
                            visitor.phoneNumber.includes(search);
      const matchesStatus = statusFilter === 'All' || visitor.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [visitors, search, statusFilter]);

  const handleStatusUpdate = (id: string, status: Visitor['status']) => {
    try {
      visitorService.updateVisitorStatus(id, status);
      onUpdateVisitors();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-150 tracking-tight">First-Time Visitors Registry</h1>
          <p className="text-xs text-gray-500 font-medium">Record, call, and integrate guests into host families and MAP assignments.</p>
        </div>
        <button
          onClick={onNavigateToRegister}
          className="flex items-center text-xs font-semibold px-4.5 py-2.5 bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 shadow-sm transition-all cursor-pointer text-center"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add First-Time Visitor
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search visitors, phone, or invited by..."
        />

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <span className="text-xs font-semibold text-gray-400 font-mono">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full md:w-44 px-3 py-2 border border-gray-150 bg-white rounded-xl text-xs font-semibold text-gray-700"
          >
            <option value="All">All statuses</option>
            <option value="Pending">Pending follow up</option>
            <option value="Contacted">Contacted</option>
            <option value="Integrated">Integrated / Restored</option>
          </select>
        </div>
      </div>

      {/* Responsive Visitors Cards & Table list */}
      {filteredVisitors.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl text-center border border-dashed border-gray-200">
          <p className="text-gray-400 text-sm font-semibold mb-2">No visitors found.</p>
          <p className="text-gray-400 text-xs text-sans">Clear filters or submit a "First-Timer Visitor" welcome form.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredVisitors.map((visitor) => (
            <div
              key={visitor.id}
              className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs hover:border-emerald-350 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Profile Card Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm shrink-0 uppercase">
                    {visitor.fullName.charAt(0)}{visitor.fullName.split(' ')[1]?.charAt(0) || ''}
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-bold text-gray-900">{visitor.fullName}</h3>
                    <p className="text-[10px] text-gray-450 font-bold uppercase tracking-wider font-mono">ID: {visitor.id}</p>
                  </div>
                </div>
                <StatusBadge status={visitor.status} />
              </div>

              {/* Invitation logs */}
              <div className="space-y-2 pt-2 border-t border-gray-50 text-xs text-gray-650">
                <div className="flex items-center">
                  <Phone className="w-3.5 h-3.5 mr-2.5 text-gray-400 shrink-0" />
                  <span className="font-semibold text-gray-800">{visitor.phoneNumber}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-2.5 text-gray-400 shrink-0" />
                  <span>Visited on: <strong className="text-gray-900 font-mono">{visitor.dateVisited}</strong></span>
                </div>
                <div className="flex items-center">
                  <UsersIcon className="w-3.5 h-3.5 mr-2.5 text-gray-400 shrink-0" />
                  <span>Invited by: <strong className="text-slate-800 bg-slate-50 px-2 py-0.5 rounded-md font-sans">{visitor.invitedBy}</strong></span>
                </div>

                {visitor.prayerRequest && (
                  <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-gray-500 leading-relaxed font-sans">
                    <span className="font-bold text-gray-700 block mb-0.5">Prayer request:</span>
                    "{visitor.prayerRequest}"
                  </div>
                )}
              </div>

              {/* Status Update Quick Toggles */}
              <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest font-mono">Stage:</span>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => handleStatusUpdate(visitor.id, 'Pending')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all ${
                      visitor.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-gray-50 text-gray-650 hover:bg-gray-100'
                    }`}
                  >
                    Pending
                  </button>

                  <button
                    onClick={() => handleStatusUpdate(visitor.id, 'Contacted')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all ${
                      visitor.status === 'Contacted'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-50 text-gray-650 hover:bg-gray-100'
                    }`}
                  >
                    Contacted
                  </button>

                  <button
                    onClick={() => handleStatusUpdate(visitor.id, 'Integrated')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none cursor-pointer transition-all ${
                      visitor.status === 'Integrated'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-gray-50 text-gray-650 hover:bg-gray-100'
                    }`}
                  >
                    Integrated
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
