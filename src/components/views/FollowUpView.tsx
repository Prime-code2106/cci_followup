import React, { useState, useMemo, useEffect } from 'react';
import { FollowUp, FollowUpNote, Member } from '../../types';
import { followUpService } from '../../services/followUpService';
import StatusBadge from '../StatusBadge';
import SearchBar from '../SearchBar';
import {
  Phone,
  MessageSquare,
  MessageCircle,
  PlusCircle,
  FileText,
  CalendarCheck,
  CheckCircle,
  AlertTriangle,
  User,
  Activity,
  UserX,
  PhoneCall,
  Clock,
  BellOff,
  Mail,
  Send
} from 'lucide-react';

interface EmailTemplate {
  subject: string;
  body: string;
}

const getEmailTemplate = (name: string, status: FollowUp['status']): EmailTemplate => {
  switch (status) {
    case 'Needs Follow Up':
      return {
        subject: `Thinking of You & Checking In - FUTA MAP`,
        body: `Hello ${name},\n\nWe missed you at our recent fellowship gatherings! We wanted to check in and see how you are doing.\n\nPlease let us know if there is anything we can support you with, or if you have any prayer requests.\n\nWarm regards,\nFUTA MAP Team`
      };
    case 'Contacted':
      return {
        subject: `Great Connecting with You! - FUTA MAP`,
        body: `Hello ${name},\n\nIt was wonderful connecting with you recently! We are so glad to have you as part of our fellowship community.\n\nIf you have any questions, need guidance, or would like to get more involved, feel free to reach out.\n\nBlessings,\nFUTA MAP Team`
      };
    case 'Visited':
      return {
        subject: `Thank You for Welcoming Us! - FUTA MAP`,
        body: `Hello ${name},\n\nThank you so much for welcoming us into your home during our recent pastoral visit! It was a true blessing spending time with you.\n\nWe are praying for you and look forward to seeing you at our next corporate assembly.\n\nWarm regards,\nFUTA MAP Team`
      };
    case 'Restored':
      return {
        subject: `Welcome Back! - FUTA MAP`,
        body: `Hello ${name},\n\nWe are absolutely overjoyed to see you active in fellowship again! Your presence brings so much light and encouragement to our church family.\n\nLet's continue to grow together in faith and love.\n\nWith love and blessings,\nFUTA MAP Team`
      };
    default:
      return {
        subject: `Checking In - FUTA MAP`,
        body: `Hello ${name},\n\nWe wanted to reach out, check in, and see how you are doing. Hope you are having a wonderful week!\n\nBest regards,\nFUTA MAP Team`
      };
  }
};

interface FollowUpViewProps {
  followups: FollowUp[];
  members?: Member[];
  onUpdateFollowUp: () => void; // State refresh trigger
}

export default function FollowUpView({
  followups,
  members = [],
  onUpdateFollowUp
}: FollowUpViewProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedFollowUpId, setSelectedFollowUpId] = useState<string | null>(
    followups[0]?.id || null
  );
  const [newNoteText, setNewNoteText] = useState('');

  // Email Composer states
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

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

  // Find associated member to look up email
  const associatedMember = useMemo(() => {
    if (!activeEntry || !members) return null;
    return members.find(m => m.id === activeEntry.id || m.fullName.toLowerCase() === activeEntry.name.toLowerCase()) || null;
  }, [activeEntry, members]);

  // Load selected template details on target change or status update
  useEffect(() => {
    if (activeEntry) {
      const email = associatedMember?.email || '';
      setRecipientEmail(email);

      const template = getEmailTemplate(activeEntry.name, activeEntry.status);
      setEmailSubject(template.subject);
      setEmailBody(template.body);
    }
  }, [activeEntry, associatedMember]);

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

  // Snooze notification to tomorrow
  const handleRemindTomorrow = async () => {
    if (!activeEntry) return;
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      await followUpService.setRemindDate(activeEntry.id, tomorrowStr);
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
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-gray-900 text-sm truncate">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono font-bold text-gray-400">{item.phoneNumber}</span>
                        <a
                          href={`https://wa.me/${item.phoneNumber.replace(/[^0-9]/g, '').replace(/^0/, '234')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-0.5 text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-bold border border-emerald-100/50 hover:bg-emerald-100"
                          title="Message on WhatsApp"
                        >
                          <MessageCircle className="w-2.5 h-2.5 text-emerald-600 fill-emerald-600/20" />
                          <span>WA</span>
                        </a>
                      </div>
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
                    <div className="flex items-center text-xs text-gray-500 mt-1.5 gap-2.5 flex-wrap">
                      <span className="font-mono">{activeEntry.phoneNumber}</span>
                      <a
                        href={`https://wa.me/${activeEntry.phoneNumber.replace(/[^0-9]/g, '').replace(/^0/, '234')}?text=${encodeURIComponent(`Hello ${activeEntry.name},`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg font-bold border border-emerald-150 hover:bg-emerald-100 transition-colors"
                        title="Message on WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20 shrink-0" />
                        <span>Chat on WhatsApp</span>
                      </a>

                      <button
                        onClick={() => setShowEmailComposer(!showEmailComposer)}
                        className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg font-bold border transition-colors cursor-pointer ${
                          showEmailComposer
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-blue-50 text-blue-700 border-blue-150 hover:bg-blue-100'
                        }`}
                        title="Compose Outreach Email"
                      >
                        <Mail className={`w-3.5 h-3.5 shrink-0 ${showEmailComposer ? 'text-white' : 'text-blue-600'}`} />
                        <span>{showEmailComposer ? 'Close Email Composer' : 'Compose Email'}</span>
                      </button>
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

                  {activeEntry.status !== 'Restored' && (
                    <button
                      onClick={handleRemindTomorrow}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-550 hover:bg-amber-600 bg-amber-500 text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Remind me tomorrow</span>
                    </button>
                  )}
                </div>

                {activeEntry.remindDate && (
                  <div className="mt-2 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100/60 p-2.5 rounded-xl flex items-center gap-1.5 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0 animate-pulse" />
                    <span>Notification re-queued! Snoozed until: {activeEntry.remindDate}</span>
                  </div>
                )}
              </div>

              {/* Email Composer Panel */}
              {showEmailComposer && (
                <div className="p-5 bg-blue-50/15 border border-blue-100 rounded-2xl space-y-4 animate-fade-in shadow-xs">
                  <div className="flex items-center justify-between border-b border-blue-100/30 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-blue-100/50 text-blue-600 rounded-lg">
                        <Mail className="w-4 h-4" />
                      </div>
                      <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider">Outreach Email Composer</h4>
                    </div>
                    <span className="text-[10px] font-bold text-blue-650 bg-blue-50/70 px-2 py-0.5 rounded-md font-mono">
                      Stage: {activeEntry.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <label htmlFor="email-recipient" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 font-mono">Recipient Email</label>
                      <input
                        id="email-recipient"
                        type="email"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        placeholder="e.g. member@domain.com"
                        className="block w-full px-3 py-1.5 border border-gray-150 rounded-xl text-xs focus:ring-blue-500 bg-white text-gray-850 font-medium"
                      />
                      {!associatedMember?.email && (
                        <p className="text-[9px] text-amber-650 mt-1 font-medium">⚠️ No email registered for this member in directory. Enter manually.</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email-subject" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 font-mono">Email Subject</label>
                      <input
                        id="email-subject"
                        type="text"
                        value={emailSubject}
                        onChange={(e) => setEmailSubject(e.target.value)}
                        placeholder="Subject..."
                        className="block w-full px-3 py-1.5 border border-gray-150 rounded-xl text-xs focus:ring-blue-500 bg-white text-gray-850 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email-body" className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 font-mono">Email Body (Pre-filled template)</label>
                    <textarea
                      id="email-body"
                      rows={5}
                      value={emailBody}
                      onChange={(e) => setEmailBody(e.target.value)}
                      placeholder="Write email body..."
                      className="block w-full px-3 py-2 border border-gray-150 rounded-xl text-xs focus:ring-blue-500 bg-white text-gray-850 font-sans leading-relaxed"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1">
                    <p className="text-[10px] text-gray-450 font-medium max-w-full sm:max-w-[65%]">
                      Clicking "Open in Mail Client" will open your browser's default email program pre-loaded with this template.
                    </p>
                    <a
                      href={`mailto:${recipientEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`}
                      className="inline-flex px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl items-center shadow-xs transition-all cursor-pointer select-none"
                    >
                      <Send className="w-3.5 h-3.5 mr-1.5" />
                      <span>Open in Mail Client</span>
                    </a>
                  </div>
                </div>
              )}

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
