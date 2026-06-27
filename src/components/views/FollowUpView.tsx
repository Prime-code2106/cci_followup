import React, { useState, useMemo } from 'react';
import { FollowUp, FollowUpNote } from '../../types';
import { followUpService } from '../../services/followUpService';
import StatusBadge from '../StatusBadge';
import SearchBar from '../SearchBar';
import {
  Phone,
  MessageSquare,
  PlusCircle,
  FileText,
  CalendarCheck,
  CheckCircle,
  AlertTriangle,
  User,
  Activity,
  UserX,
  PhoneCall
} from 'lucide-react';

interface FollowUpViewProps {
  followups: FollowUp[];
  onUpdateFollowUp: () => void; // State refresh trigger
}

export default function FollowUpView({
  followups,
  onUpdateFollowUp
}: FollowUpViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedFollowUpId, setSelectedFollowUpId] = useState<string | null>(
    followups[0]?.id || null
  );
  const [newNoteText, setNewNoteText] = useState('');

  // Filter list
  const filteredFollowUps = useMemo(() => {
    return followups.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
                            item.phoneNumber.includes(search);
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [followups, search, statusFilter]);

  // Loaded active follow up card details
  const activeEntry = useMemo(() => {
    if (!selectedFollowUpId) return null;
    return followups.find(f => f.id === selectedFollowUpId) || null;
  }, [followups, selectedFollowUpId]);

  // Adjust status
  const handleStatusUpdate = (status: FollowUp['status']) => {
    if (!activeEntry) return;
    try {
      followUpService.updateStatus(activeEntry.id, status);
      onUpdateFollowUp();
    } catch (err) {
      console.error(err);
    }
  };

  // Add notes logs
  const handlePostNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEntry || !newNoteText.trim()) return;

    try {
      followUpService.addNote(activeEntry.id, newNoteText.trim(), 'MAP Leader');
      setNewNoteText('');
      onUpdateFollowUp();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-150 tracking-tight">Outreach & Follow-Up Care Hub</h1>
        <p className="text-xs text-gray-500 font-medium">Care for first-time visitors and members who have missed corporate assemblies.</p>
      </div>

      {/* Grid Layout: Column 1: List summary, Column 2: Selected Follow up details panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card listing and search */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4.5 rounded-2xl border border-gray-100 shadow-xs space-y-3.5">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by name or phone..."
            />

            <div>
              <label htmlFor="fu-filter" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Outreach status</label>
              <select
                id="fu-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-150 rounded-xl bg-white text-xs font-semibold text-gray-700"
              >
                <option value="All">All statuses</option>
                <option value="Needs Follow Up">Needs Follow Up</option>
                <option value="Contacted">Contacted</option>
                <option value="Visited">Pastor Visited</option>
                <option value="Restored">Restored</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
            {filteredFollowUps.length === 0 ? (
              <div className="bg-white p-6 rounded-2xl text-center border text-gray-400 text-xs font-medium">
                No active outreach records match.
              </div>
            ) : (
              filteredFollowUps.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedFollowUpId(item.id)}
                  className={`bg-white p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 hover:shadow-xs ${
                    selectedFollowUpId === item.id
                      ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/5'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                      <p className="text-[10px] font-mono font-bold text-gray-400 mt-0.5">{item.phoneNumber}</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                  
                  <p className="text-[11px] text-gray-500 font-medium truncate">{item.reason}</p>

                  <div className="flex justify-between items-center text-[10px] text-gray-450 border-t border-gray-50/70 pt-2 font-mono">
                    <span>Attendance: <strong className="text-gray-700">{item.lastAttendanceDate || "Never"}</strong></span>
                    <span>{item.notes.length} log notes</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected target details and notes panel */}
        <div className="lg:col-span-2">
          {activeEntry ? (
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 space-y-6 shadow-xs animate-fade-in">
              
              {/* Header profile of follow up */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b border-gray-50">
                <div className="flex items-center">
                  <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg shrink-0 uppercase border border-rose-100">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="ml-3.5">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">{activeEntry.name}</h3>
                    <div className="flex items-center text-xs text-gray-500 font-mono mt-1 space-x-2">
                      <span>{activeEntry.phoneNumber}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-gray-450 font-mono">Status:</span>
                  <StatusBadge status={activeEntry.status} />
                </div>
              </div>

              {/* Status Action Buttons */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Process Outreach State</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleStatusUpdate('Needs Follow Up')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeEntry.status === 'Needs Follow Up'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-100'
                    }`}
                  >
                    Needs Follow Up
                  </button>

                  <button
                    onClick={() => handleStatusUpdate('Contacted')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeEntry.status === 'Contacted'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-100'
                    }`}
                  >
                    Contacted / Called
                  </button>

                  <button
                    onClick={() => handleStatusUpdate('Visited')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeEntry.status === 'Visited'
                        ? 'bg-indigo-650 bg-indigo-650 text-white bg-indigo-600 shadow-xs'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-100'
                    }`}
                  >
                    Home Visited
                  </button>

                  <button
                    onClick={() => handleStatusUpdate('Restored')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      activeEntry.status === 'Restored'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-100'
                    }`}
                  >
                    Restored / Integrated
                  </button>
                </div>
              </div>

              {/* Context Reasons Card */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Trigger Context / Reason</h4>
                <div className="p-4 bg-rose-50/20 border border-rose-100 rounded-2xl flex items-start space-x-3 text-xs text-rose-800 font-medium">
                  <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="leading-relaxed font-sans">{activeEntry.reason}</p>
                    <p className="text-[10px] text-rose-600/70 mt-1 font-mono">Last visible attendance: {activeEntry.lastAttendanceDate || "Never"}</p>
                  </div>
                </div>
              </div>

              {/* Feedback History log notes */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">Action Notes History</h4>
                  <span className="text-[10px] font-bold text-gray-450 font-mono">{activeEntry.notes.length} history items</span>
                </div>

                {/* Form to submit note */}
                <form onSubmit={handlePostNoteSubmit} className="space-y-3.5">
                  <textarea
                    rows={2}
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    placeholder="Log care feedback here: e.g. Called on Tuesday evening. Promised to attend next Sunday..."
                    className="block w-full px-3 py-2 border border-gray-150 rounded-xl text-xs focus:ring-blue-500 bg-white text-gray-800"
                    required
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center shadow-2xs cursor-pointer transition-all"
                    >
                      <PlusCircle className="w-4 h-4 mr-1.5" />
                      Post Outreach Update Note
                    </button>
                  </div>
                </form>

                {/* Feed list */}
                {activeEntry.notes.length === 0 ? (
                  <p className="text-center py-4 bg-slate-50/50 rounded-xl text-gray-450 text-[11px] font-medium leading-none">
                    No historical feedback notes submitted for this care review.
                  </p>
                ) : (
                  <div className="space-y-3.5 max-h-48 overflow-y-auto pr-1">
                    {activeEntry.notes.map(note => (
                      <div key={note.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start space-x-3 text-xs leading-relaxed">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold font-mono">
                            <span>{note.author}</span>
                            <span>{note.date}</span>
                          </div>
                          <p className="text-gray-700 font-medium font-sans">"{note.text}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 p-8 text-center text-gray-400 space-y-2 h-64 flex flex-col justify-center items-center">
              <PhoneCall className="w-8 h-8 text-slate-350" />
              <p className="text-xs font-semibold bg-transparent">Select a care card from the left panel to record outreach feedback logs.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
