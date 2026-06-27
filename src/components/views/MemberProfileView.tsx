import React, { useState, useMemo, useEffect } from 'react';
import { Member, Attendance, PrayerRequest, FollowUpNote, FellowshipNote } from '../../types';
import { memberService } from '../../services/memberService';
import { authService } from '../../services/authService';
import { fellowshipService } from '../../services/fellowshipService';
import StatusBadge from '../StatusBadge';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  Award,
  BookOpen,
  PlusCircle,
  FileText,
  User,
  Heart,
  ChevronRight,
  Sparkles,
  ClipboardCheck,
  Edit2,
  X,
  Check,
  MessageSquare,
  Send,
  ShieldAlert,
  Flame
} from 'lucide-react';

interface MemberProfileViewProps {
  memberId: string;
  onBack: () => void;
  attendanceHistory: Attendance[];
  prayerRequests: PrayerRequest[];
  onUpdateMember: () => void; // Trigger a state fetch in App.tsx
}

export default function MemberProfileView({
  memberId,
  onBack,
  attendanceHistory,
  prayerRequests,
  onUpdateMember
}: MemberProfileViewProps) {
  // Fetch current member
  const member = useMemo(() => {
    return memberService.getMemberById(memberId);
  }, [memberId]);

  // States
  const [isEditing, setIsEditing] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<FellowshipNote[]>([]);
  const [messageText, setMessageText] = useState('');
  const [selectedSenderId, setSelectedSenderId] = useState<string>('');

  const currentMemberSess = useMemo(() => {
    return authService.getCurrentMemberSession();
  }, []);

  const friendCount = useMemo(() => {
    if (!member) return 0;
    return fellowshipService.getConnectedBrethren(member.churchId || 'futamap', memberId).length;
  }, [member, memberId]);

  useEffect(() => {
    if (currentMemberSess) {
      setSelectedSenderId(currentMemberSess.memberId);
    } else {
      const firstAvailableMember = memberService.getMembers().find(m => m.id !== memberId);
      if (firstAvailableMember) {
        setSelectedSenderId(firstAvailableMember.id);
      } else {
        setSelectedSenderId('admin_support');
      }
    }
  }, [currentMemberSess, memberId]);

  const loadDMs = () => {
    if (!selectedSenderId) return;
    const stored = localStorage.getItem('futamap_fellowship_notes');
    if (!stored) {
      setChatMessages([]);
      return;
    }
    try {
      const allNotes: FellowshipNote[] = JSON.parse(stored);
      const filtered = allNotes.filter(n => 
        (n.senderId === selectedSenderId && n.receiverId === memberId) ||
        (n.senderId === memberId && n.receiverId === selectedSenderId)
      );
      filtered.sort((a,b) => new Date(a.dateSent).getTime() - new Date(b.dateSent).getTime());
      setChatMessages(filtered);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadDMs();
  }, [selectedSenderId, isChatOpen, memberId]);

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !selectedSenderId || !member) return;

    let senderName = "MAP Care Team";
    if (selectedSenderId === 'admin_support') {
      senderName = "MAP Care Team";
    } else {
      const s = memberService.getMemberById(selectedSenderId);
      if (s) {
        senderName = s.fullName;
      }
    }

    fellowshipService.sendFellowshipNote(
      member.churchId || 'futamap',
      selectedSenderId,
      senderName,
      memberId,
      messageText.trim(),
      'Encouragement'
    );

    setMessageText('');
    loadDMs();
    if (onUpdateMember) {
      onUpdateMember();
    }
  };

  const [notes, setNotes] = useState<FollowUpNote[]>(() => {
    const stored = localStorage.getItem(`member_notes_${memberId}`);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem(`member_notes_${memberId}`, JSON.stringify(notes));
  }, [notes, memberId]);

  // Form State for Editing
  const [editForm, setEditForm] = useState({
    fullName: member?.fullName || '',
    phoneNumber: member?.phoneNumber || '',
    email: member?.email || '',
    department: member?.department || '',
    level: member?.level || '',
    residence: member?.residence || '',
    status: member?.status || 'Active' as 'Active' | 'Inactive'
  });

  if (!member) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-gray-100 max-w-md mx-auto">
        <p className="text-gray-500 font-semibold mb-4">Member record not found.</p>
        <button onClick={onBack} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold">
          Back to Database
        </button>
      </div>
    );
  }

  // Filter attendance for this specific member
  const memberAttendance = useMemo(() => {
    return attendanceHistory.filter(a => a.memberId === memberId);
  }, [attendanceHistory, memberId]);

  // Filter prayer requests for this specific member
  const memberPrayers = useMemo(() => {
    return prayerRequests.filter(pr => pr.fullName.toLowerCase() === member.fullName.toLowerCase());
  }, [prayerRequests, member.fullName]);

  // Handles adding notes
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    const addedNote: FollowUpNote = {
      id: 'n_' + Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      text: newNote,
      author: "MAP Leader"
    };

    setNotes(prev => [addedNote, ...prev]);
    setNewNote('');
  };

  // Handles editing profile submit
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      memberService.updateMember(memberId, {
        fullName: editForm.fullName,
        phoneNumber: editForm.phoneNumber,
        email: editForm.email,
        department: editForm.department,
        level: editForm.level,
        residence: editForm.residence,
        status: editForm.status
      });
      setIsEditing(false);
      onUpdateMember(); // Notify parent element to refresh state!
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Top action row */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-xs font-semibold text-gray-500 hover:text-gray-900 bg-white border border-gray-150 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Back to Database
        </button>

        <button
          onClick={() => {
            setEditForm({
              fullName: member.fullName,
              phoneNumber: member.phoneNumber,
              email: member.email || '',
              department: member.department,
              level: member.level,
              residence: member.residence,
              status: member.status
            });
            setIsEditing(!isEditing);
          }}
          className={`flex items-center text-xs font-semibold px-4 py-2 rounded-xl transition-all border cursor-pointer ${
            isEditing 
              ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100' 
              : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
          }`}
        >
          {isEditing ? (
            <>
              <X className="w-4 h-4 mr-1.5" />
              Cancel Edits
            </>
          ) : (
            <>
              <Edit2 className="w-3.5 h-3.5 mr-1.5" />
              Edit Profile
            </>
          )}
        </button>
      </div>

      {isEditing ? (
        /* Edit Profile Mode Form */
        <form onSubmit={handleEditSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5 max-w-2xl mx-auto">
          <div className="border-b border-gray-100 pb-4 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Editing Profile: {member.fullName}</h2>
            <StatusBadge status={editForm.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-fullName" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Full Name</label>
              <input
                id="edit-fullName"
                type="text"
                value={editForm.fullName}
                onChange={(e) => setEditForm(prev => ({ ...prev, fullName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-blue-500 text-gray-800 bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-status" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Status Filter</label>
              <select
                id="edit-status"
                value={editForm.status}
                onChange={(e) => setEditForm(prev => ({ ...prev, status: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-blue-500 text-gray-850 bg-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="edit-phoneNumber" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Phone Number</label>
              <input
                id="edit-phoneNumber"
                type="tel"
                value={editForm.phoneNumber}
                onChange={(e) => setEditForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-blue-500 text-gray-800 bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-email" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Email Address</label>
              <input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-blue-500 text-gray-800 bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label htmlFor="edit-department" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Department</label>
              <input
                id="edit-department"
                type="text"
                value={editForm.department}
                onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-blue-500 text-gray-800 bg-white"
                required
              />
            </div>
            <div>
              <label htmlFor="edit-level" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Level</label>
              <input
                id="edit-level"
                type="text"
                value={editForm.level}
                onChange={(e) => setEditForm(prev => ({ ...prev, level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-blue-500 text-gray-850 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-residence" className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5">Hostel / Residence</label>
            <input
              id="edit-residence"
              type="text"
              value={editForm.residence}
              onChange={(e) => setEditForm(prev => ({ ...prev, residence: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-blue-500 text-gray-800 bg-white"
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-gray-55">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4.5 py-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-all flex items-center cursor-pointer shadow-xs"
            >
              <Check className="w-4 h-4 mr-1.5" />
              Save Updates
            </button>
          </div>
        </form>
      ) : (
        /* View Profile Grid layout */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Core Profile Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs text-center space-y-4">
              <div className="h-20 w-20 rounded-full bg-blue-50/75 border border-blue-105 text-blue-650 flex items-center justify-center font-bold text-2xl mx-auto uppercase">
                {member.fullName.charAt(0)}{member.fullName.split(' ')[1]?.charAt(0) || ''}
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">{member.fullName}</h2>
                <p className="text-xs text-slate-400 font-medium mt-1">{member.mapName}</p>
              </div>
              <div className="flex flex-wrap justify-center items-center gap-2">
                <StatusBadge status={member.status} />
                <span className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-750 bg-indigo-50 border border-indigo-150 rounded-full px-2.5 py-1 shadow-2xs" title="Total active social connections!">
                  <Flame className="w-3.5 h-3.5 text-indigo-500 fill-indigo-500 animate-pulse" />
                  <span>{friendCount} {friendCount === 1 ? 'Connection' : 'Connections'}</span>
                </span>
              </div>

              {/* Core Details list */}
              <div className="border-t border-gray-50 pt-4 text-left space-y-3.5 text-xs text-gray-650">
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                  <span className="font-semibold text-gray-800">{member.phoneNumber}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                  <span className="truncate">{member.email || "No email listed"}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                  <span>{member.residence}</span>
                </div>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-3 shrink-0" />
                  <span>
                    Celebrated: <strong className="text-gray-900">{new Date(member.birthday).toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</strong>
                  </span>
                </div>
              </div>

              {/* Send Direct Message CTA button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsChatOpen(true)}
                  className="w-full py-2.5 px-4 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-black tracking-wide transition-all flex items-center justify-center gap-1.5 shadow-sm hover:shadow-indigo-500/10 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  Send Message / Chat DMs
                </button>
              </div>
            </div>

            {/* Program / Levels information cards */}
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-xs space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">MAP Assembly Info</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <Layers className="w-4 h-4 text-blue-500 mb-1.5" />
                  <span className="block text-slate-400 leading-none mb-1">Level</span>
                  <span className="font-bold text-slate-800">{member.level}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl">
                  <BookOpen className="w-4 h-4 text-emerald-500 mb-1.5 animate-none shrink-0" />
                  <span className="block text-slate-400 leading-none mb-1">Join Date</span>
                  <span className="font-bold text-slate-800">{member.dateJoined}</span>
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-xs">
                <Award className="w-4 h-4 text-indigo-500 mb-1.5" />
                <span className="block text-slate-400 leading-none mb-1">Department</span>
                <span className="font-bold text-slate-800">{member.department} • {member.faculty}</span>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Tabs details (Attendance history, prayers list, intercessions, and leader logs) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Leader Care Logs Notes */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4.5 mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-550" />
                  <h3 className="text-sm font-bold text-slate-900">Leader Follow Up Feedback & Field Notes</h3>
                </div>
              </div>

              {/* Note Submission */}
              <form onSubmit={handleAddNote} className="flex gap-2 mb-5">
                <input
                  type="text"
                  placeholder="Record an update: e.g. Called and encouraged him regarding studies..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-150 rounded-xl text-xs focus:ring-blue-500 bg-white text-gray-800"
                />
                <button
                  type="submit"
                  className="flex items-center text-xs font-semibold px-4.5 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shrink-0 transition-all cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 mr-1" />
                  Post note
                </button>
              </form>

              {/* Notes List */}
              <div className="space-y-4 max-h-48 overflow-y-auto pr-1">
                {notes.map(note => (
                  <div key={note.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-lg bg-blue-50/70 text-blue-600 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono uppercase">
                      {note.author.substr(0, 2)}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-semibold font-mono">
                        <span>{note.author}</span>
                        <span>{note.date}</span>
                      </div>
                      <p className="text-xs text-gray-700 font-medium leading-relaxed">{note.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attendance History list */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
              <div className="border-b border-gray-100 pb-4.5 mb-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <ClipboardCheck className="w-4 h-4 text-violet-550RGB" />
                  <h3 className="text-sm font-bold text-slate-900">Historical Attendance Registry</h3>
                </div>
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-md">
                  {memberAttendance.length} meetings attended
                </span>
              </div>

              {memberAttendance.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-xs">
                  No attendance logged for this member. Use the Attendance panel to record today's session.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {memberAttendance.map(att => (
                    <div key={att.id} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                      <div>
                        <span className="block text-xs font-bold text-slate-800">{att.serviceType}</span>
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{att.date}</span>
                      </div>
                      <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Present
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prayers submitted by the member */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
              <div className="border-b border-gray-100 pb-4.5 mb-4 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-emerald-500 select-none pointer-events-none" />
                  <h3 className="text-sm font-bold text-slate-900">Intercessions & Thanksgivings</h3>
                </div>
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-md">
                  {memberPrayers.length} requests
                </span>
              </div>

              {memberPrayers.length === 0 ? (
                <div className="text-center py-6 text-gray-450 text-xs">
                  No intercessory request history recorded for this member.
                </div>
              ) : (
                <div className="space-y-3">
                  {memberPrayers.map(pr => (
                    <div key={pr.id} className="p-3.5 rounded-2xl bg-amber-50/20 border border-amber-100/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="space-y-1 flex-1">
                        <p className="text-xs text-gray-700 leading-relaxed font-sans italic">"{pr.request}"</p>
                        <span className="block text-[10px] text-gray-400 font-semibold font-mono">Submitted: {pr.dateSubmitted}</span>
                      </div>
                      <div>
                        <StatusBadge status={pr.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Messaging / Direct Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-100 shadow-2xl flex flex-col h-[520px] overflow-hidden animate-scale-up">
            {/* Header */}
            <div className="p-4.5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-indigo-550 text-white flex items-center justify-center font-bold text-sm shrink-0">
                  {member?.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 leading-none mb-0.5">Fellowship Messenger</h3>
                  <p className="text-[10px] text-slate-400 font-semibold leading-none mb-0">Direct line to <span className="text-indigo-600">{member?.fullName}</span> • 🤝 {friendCount} friends</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Admin Selector Tip if viewing as administrator */}
            {!currentMemberSess && (
              <div className="bg-amber-50/70 border-b border-amber-100 px-4.5 py-2 flex items-center justify-between shrink-0 text-[10px] text-amber-805 gap-2">
                <span className="font-medium flex items-center gap-1 shrink-0">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  No member login active. Simulated Sender:
                </span>
                <select
                  value={selectedSenderId}
                  onChange={(e) => setSelectedSenderId(e.target.value)}
                  className="px-2 py-1 border border-amber-200 bg-white rounded-lg font-bold text-[10px] text-amber-900 outline-none max-w-[180px] truncate"
                >
                  <option value="admin_support">MAP Care Team (System)</option>
                  {memberService.getMembers()
                    .filter(m => m.id !== memberId)
                    .map(m => (
                      <option key={m.id} value={m.id}>{m.fullName}</option>
                    ))
                  }
                </select>
              </div>
            )}

            {/* Chat Body containing thread */}
            <div className="flex-1 overflow-y-auto p-4.5 bg-slate-50/30 space-y-3.5 min-h-0">
              {chatMessages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-6">
                  <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-500 rounded-2xl">
                    <MessageSquare className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-800">No Messages Shared Yet</h4>
                    <p className="text-[10px] text-slate-400 max-w-[240px] leading-relaxed mx-auto mt-0.5">
                      Send a word of encouragement, prayer request, or virtual handshake to strengthen fellowship!
                    </p>
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isSentByMe = msg.senderId === selectedSenderId;
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex flex-col max-w-[85%] ${isSentByMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                    >
                      <span className="text-[9px] text-slate-400 font-bold font-mono px-1 mb-0.5">
                        {isSentByMe ? 'You' : msg.senderName}
                      </span>
                      <div className={`p-3 rounded-2xl leading-relaxed text-xs font-medium shadow-2xs ${
                        isSentByMe 
                          ? 'bg-indigo-600 border border-indigo-550 text-white rounded-br-none' 
                          : 'bg-white border border-slate-205 text-slate-800 rounded-bl-none'
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-[8px] text-slate-400 font-semibold font-mono mt-0.5 px-1">
                        {msg.theme && `🏷️ ${msg.theme} • `}{msg.dateSent}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Pills and Input Form */}
            <div className="p-4.5 border-t border-slate-100 bg-white space-y-3 shrink-0">
              {/* Quick Prompt Pills */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  { text: 'Standing in prayers with you!', theme: 'Prayer' },
                  { text: 'Great checking in yesterday! How are you doing?', theme: 'Check-in' },
                  { text: 'The Lord is your strength, brethren. Keep soaring!', theme: 'Encouragement' },
                  { text: 'We missed you at the last MAP Fellowship!', theme: 'Check-in' }
                ].map((pill, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMessageText(pill.text)}
                    className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-550 hover:text-white border border-slate-105 text-[10px] font-bold text-slate-650 rounded-full transition-all cursor-pointer"
                  >
                    {pill.text}
                  </button>
                ))}
              </div>

              {/* Message Typing Form */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Record note or type fellowship message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="block w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50/30 focus:bg-white focus:ring-2 focus:ring-indigo-100 outline-none text-slate-850 font-medium"
                />
                <button
                  type="submit"
                  className="px-4.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
