import React, { useState, useEffect } from 'react';
import { Member, Attendance, PrayerRequest, ChurchEvent, FellowshipNote, FellowshipConnection } from '../../types';
import { memberService } from '../../services/memberService';
import { prayerService } from '../../services/prayerService';
import { settingsService } from '../../services/settingsService';
import { fellowshipService } from '../../services/fellowshipService';
import { motion } from 'motion/react';
import {
  User, Check, Phone, Mail, Calendar, Compass, MapPin, 
  Plus, Edit, Clipboard, Sparkles, LogOut, CheckCircle, AlertCircle, HeartHandshake,
  Clock, ShieldAlert, Award, FileText, Gift, Info, QrCode, Bell,
  Users2, UserCheck, Send, MessageSquare, Heart, Search, CheckCircle2, RefreshCw
} from 'lucide-react';

interface MemberDashboardViewProps {
  memberId: string;
  onLogout: () => void;
  attendanceHistory: Attendance[];
  onNavigate?: (viewId: string) => void;
}

export default function MemberDashboardView({ memberId, onLogout, attendanceHistory, onNavigate }: MemberDashboardViewProps) {
  const [member, setMember] = useState<Member | null>(null);
  const [prayers, setPrayers] = useState<PrayerRequest[]>([]);
  const [allAttendance, setAllAttendance] = useState<Attendance[]>([]);
  
  // Tab control: 'dashboard' | 'prayers' | 'profile' | 'events' | 'fellowship'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'prayers' | 'profile' | 'events' | 'fellowship'>('dashboard');

  // Fellowship states
  const [connections, setConnections] = useState<Member[]>([]);
  const [pendingRequests, setPendingRequests] = useState<{ connectionId: string; sender: Member }[]>([]);
  const [incomingNotes, setIncomingNotes] = useState<FellowshipNote[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [discoverableMembers, setDiscoverableMembers] = useState<Member[]>([]);
  const [expandedDirectoryMember, setExpandedDirectoryMember] = useState<string | null>(null);
  const [expandedConnectionMember, setExpandedConnectionMember] = useState<string | null>(null);
  
  // Send Note state
  const [noteToBrethren, setNoteToBrethren] = useState<string | null>(null); // Member ID chosen
  const [noteMessage, setNoteMessage] = useState('');
  const [noteTheme, setNoteTheme] = useState<'Prayer' | 'Encouragement' | 'Salutation' | 'Check-in'>('Encouragement');
  const [noteSuccess, setNoteSuccess] = useState('');

  // Input states for new prayer request
  const [newRequestText, setNewRequestText] = useState('');
  const [isSubmittingPrayer, setIsSubmittingPrayer] = useState(false);
  const [prayerSuccess, setPrayerSuccess] = useState('');

  // Editing profile details states
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editResidence, setEditResidence] = useState('');
  const [editPicture, setEditPicture] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editInterests, setEditInterests] = useState('');
  const [editMinistryInvolvement, setEditMinistryInvolvement] = useState('');
  const [editSocialVisibilityOptIn, setEditSocialVisibilityOptIn] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Sample Upcoming Events
  const events: ChurchEvent[] = [
    {
      id: 'e1',
      title: 'Global Communion Service',
      date: '2026-07-05',
      time: '09:00 AM',
      location: 'Celebration Dome, General HQ',
      category: 'program'
    },
    {
      id: 'e2',
      title: 'Departmental Strategy & Alignment',
      date: '2026-06-25',
      time: '06:00 PM',
      location: 'Main Auditorium / Zoom',
      category: 'meeting'
    },
    {
      id: 'e3',
      title: 'Believers Convention 2026',
      date: '2026-08-10',
      time: '05:00 PM',
      location: 'Eko Convention Centre & Virtual',
      category: 'special'
    },
    {
      id: 'e4',
      title: 'MAP Cell Intercessory Gathering',
      date: '2026-07-01',
      time: '06:30 PM',
      location: 'Centennial Hall',
      category: 'program'
    }
  ];

  // Load member and prayer requests
  useEffect(() => {
    loadMemberData();
  }, [memberId]);

  const loadMemberData = () => {
    const mem = memberService.getMemberById(memberId);
    if (mem) {
      setMember(mem);
      setEditPhone(mem.phoneNumber);
      setEditEmail(mem.email || '');
      setEditResidence(mem.residence);
      setEditPicture(mem.profilePicture || '');
      setEditBio(mem.bio || '');
      setEditInterests((mem.interests || []).join(', '));
      setEditMinistryInvolvement((mem.ministryInvolvement || []).join(', '));
      setEditSocialVisibilityOptIn(mem.socialVisibilityOptIn ?? false);
      
      // Load prayers linked by phone number or email match
      const allPrayersStr = localStorage.getItem('futamap_prayer_requests') || '[]';
      try {
        const parsedPrayers: PrayerRequest[] = JSON.parse(allPrayersStr);
        // Match prayers belonging matching this member
        const matched = parsedPrayers.filter(p => {
          const cleanMemPhone = mem.phoneNumber.replace(/[^0-9]/g, '');
          const cleanPrPhone = p.phoneNumber.replace(/[^0-9]/g, '');
          const isPhoneMatch = cleanMemPhone === cleanPrPhone;
          const isEmailMatch = mem.email && p.fullName.toLowerCase().includes(mem.fullName.toLowerCase());
          return isPhoneMatch || p.fullName.toLowerCase() === mem.fullName.toLowerCase();
        });
        setPrayers(matched);
      } catch (e) {
        console.error('Error fetching member prayers', e);
      }

      // Filter attendance history
      const memberAttendance = attendanceHistory.filter(att => att.memberId === mem.id);
      setAllAttendance(memberAttendance);

      // Fellowship data synchronization
      const targetChurchId = mem.churchId || 'futamap';
      const myConns = fellowshipService.getConnectedBrethren(targetChurchId, mem.id);
      setConnections(myConns);

      const incoming = fellowshipService.getPendingIncomingRequests(targetChurchId, mem.id);
      setPendingRequests(incoming);

      const notesList = fellowshipService.getNotes(targetChurchId, mem.id).filter(n => n.receiverId === mem.id);
      setIncomingNotes(notesList);

      // Identify people we can discover to send connection requests to
      const allMembersInTenant = memberService.getMembers().filter(m => m.id !== mem.id);
      const pendingOutgoing = fellowshipService.getPendingOutgoingRequests(targetChurchId, mem.id);
      const pendingIncomingUserIds = incoming.map(r => r.sender.id);
      const connectedUserIds = myConns.map(c => c.id);

      const discoverable = allMembersInTenant.filter(m => 
        m.socialVisibilityOptIn === true &&
        !connectedUserIds.includes(m.id) &&
        !pendingOutgoing.includes(m.id) &&
        !pendingIncomingUserIds.includes(m.id)
      );
      setDiscoverableMembers(discoverable);
    }
  };

  const handleSendRequest = (receiverId: string) => {
    if (!member) return;
    const targetChurchId = member.churchId || 'futamap';
    fellowshipService.sendConnectionRequest(targetChurchId, member.id, receiverId);
    loadMemberData();
  };

  const handleAcceptRequest = (connectionId: string) => {
    if (!member) return;
    const targetChurchId = member.churchId || 'futamap';
    fellowshipService.acceptConnectionRequest(targetChurchId, connectionId);
    loadMemberData();
  };

  const handleDeclineRequest = (connectionId: string) => {
    if (!member) return;
    const targetChurchId = member.churchId || 'futamap';
    fellowshipService.removeConnection(targetChurchId, connectionId);
    loadMemberData();
  };

  const handleSendNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!member || !noteToBrethren || !noteMessage.trim()) return;
    const targetChurchId = member.churchId || 'futamap';
    
    fellowshipService.sendFellowshipNote(
      targetChurchId,
      member.id,
      member.fullName,
      noteToBrethren,
      noteMessage.trim(),
      noteTheme
    );

    setNoteMessage('');
    setNoteToBrethren(null);
    setNoteSuccess('Spiritual encouragement sent successfully! They will see it in their Fellowship Feed immediately.');
    
    setTimeout(() => {
      setNoteSuccess('');
    }, 4000);

    loadMemberData();
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    setIsSavingProfile(true);

    try {
      if (!editPhone.trim()) {
        throw new Error('Phone number is required.');
      }
      
      const interestsArray = editInterests
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const ministryArray = editMinistryInvolvement
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Save changes using memberService
      memberService.updateMember(memberId, {
        phoneNumber: editPhone,
        email: editEmail,
        residence: editResidence,
        profilePicture: editPicture,
        bio: editBio,
        interests: interestsArray,
        ministryInvolvement: ministryArray,
        socialVisibilityOptIn: editSocialVisibilityOptIn
      });

      setProfileSuccess('Profile details saved successfully!');
      
      // Reload updated info
      const updated = memberService.getMemberById(memberId);
      if (updated) setMember(updated);
    } catch (err: any) {
      setProfileError(err.message || 'Error updating profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSubmitPrayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequestText.trim()) return;

    setIsSubmittingPrayer(true);
    setPrayerSuccess('');

    try {
      // Simulate API latency
      await new Promise(resolve => setTimeout(resolve, 600));

      const newPr: PrayerRequest = {
        id: 'pr_' + Math.random().toString(36).substr(2, 9),
        churchId: member?.churchId || 'futamap',
        fullName: member?.fullName || 'Anonymous Member',
        phoneNumber: member?.phoneNumber || '',
        request: newRequestText,
        dateSubmitted: new Date().toISOString().split('T')[0],
        status: 'Praying'
      };

      // Read, append, write to localStorage
      const allPrayersStr = localStorage.getItem('futamap_prayer_requests') || '[]';
      const parsedPrayers = JSON.parse(allPrayersStr);
      parsedPrayers.unshift(newPr);
      localStorage.setItem('futamap_prayer_requests', JSON.stringify(parsedPrayers));

      // Update state
      setPrayers(prev => [newPr, ...prev]);
      setNewRequestText('');
      setPrayerSuccess('Your prayer request has been submitted to the intercessors team. We are praying with you!');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingPrayer(false);
    }
  };

  if (!member) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mb-2 animate-pulse" />
        <p className="text-sm font-semibold text-slate-600">Access Denied: Member profile could not be loaded.</p>
        <button onClick={onLogout} className="mt-4 px-4 py-2 bg-slate-200 rounded-xl text-xs font-bold hover:bg-slate-350 cursor-pointer">
          Go Log Out
        </button>
      </div>
    );
  }

  // Count attendance stats
  const sunServicesCount = allAttendance.filter(a => a.serviceType === 'Sunday Service').length;
  const midweekCount = allAttendance.filter(a => a.serviceType === 'Bible Study' || a.serviceType === 'MAP Meeting').length;
  const prayerMeetCount = allAttendance.filter(a => a.serviceType === 'Prayer Meeting').length;

  const churchSettings = settingsService.getSettings(member.churchId || 'futamap');

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col justify-between">
      {/* Top Banner Header */}
      <header className="bg-slate-900 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div>
              <span className="block font-bold text-sm tracking-wide text-blue-400 uppercase leading-none">{churchSettings.mapName} Personal Portal</span>
              <span className="block font-semibold text-white text-base font-sans mt-0.5">{churchSettings.churchName}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden sm:flex items-center space-x-2 text-right">
              <span className="block text-xs font-bold text-slate-300">{member.fullName}</span>
              <span className="block text-[10px] text-emerald-400 font-mono font-semibold">MID: {member.id}</span>
            </div>

            {member.profilePicture ? (
              <img
                src={member.profilePicture}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-800 text-blue-400 font-bold flex items-center justify-center border-2 border-slate-700">
                {member.fullName.charAt(0)}
              </div>
            )}

            <button
              onClick={onLogout}
              className="p-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-xl transition-all cursor-pointer border border-slate-700"
              title="Logout Session"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Profile Quick Strip */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 text-slate-50/40 font-mono font-bold text-7xl select-none leading-none z-0">
            CCI
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 relative z-10 w-full sm:w-auto">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl">
              {member.profilePicture ? (
                <img src={member.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
              ) : member.fullName.charAt(0)}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center justify-center sm:justify-start gap-1.5">
                {member.fullName}
                <Award className="w-4 h-4 text-emerald-500" />
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {member.department} • {member.level}
              </p>
            </div>
          </div>

          {/* Quick tab toggle bar */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl w-full md:w-auto relative z-10">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 sm:flex-auto px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'dashboard' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('prayers')}
              className={`flex-1 sm:flex-auto px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'prayers' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              My Prayers ({prayers.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 sm:flex-auto px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profile' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('events')}
              className={`flex-1 sm:flex-auto px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'events' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Events
            </button>
            <button
              onClick={() => setActiveTab('fellowship')}
              className={`flex-1 sm:flex-auto px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === 'fellowship' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users2 className="w-3.5 h-3.5" />
              Fellowship Net
              {pendingRequests.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Tab content renderer */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* 1. PERSONAL INFORMATION CARD (Read-only list representation) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Care Notifications & Engagement Reminders */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-amber-50/70 border border-amber-100 rounded-3xl p-5 flex items-start gap-3 shadow-2xs relative overflow-hidden">
                  <div className="p-2.5 bg-amber-100/70 text-amber-700 rounded-2xl shrink-0">
                    <Bell className="w-5 h-5 animate-bounce-slow" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Attendance Status</span>
                      <span className="text-[8px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full select-none">Reminder</span>
                    </div>
                    <p className="text-xs text-amber-700 font-semibold leading-relaxed">
                      "We missed you last Sunday!"
                    </p>
                    <p className="text-[10px] text-amber-600/90 font-medium leading-relaxed">
                      Let your cell leader or pastor know if you require any virtual links, transport, or personalized care.
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50/70 border border-blue-105 rounded-3xl p-5 flex items-start gap-3 shadow-2xs relative overflow-hidden">
                  <div className="p-2.5 bg-blue-100/70 text-blue-700 rounded-2xl shrink-0">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider">Cell Agenda</span>
                      <span className="text-[8px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full select-none font-mono">Today</span>
                    </div>
                    <p className="text-xs text-blue-700 font-semibold leading-relaxed">
                      "Don’t forget MAP Meeting today!"
                    </p>
                    <p className="text-[10px] text-blue-600/90 font-medium leading-relaxed">
                      Your cell group <strong>{member.mapName || 'Centennial'}</strong> is meeting at 06:30 PM. Stand in prayer with brethren!
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" />
                    Personal Directory Info
                  </h3>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-bold select-none font-mono">
                    Official Record
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Full Name</span>
                    <span className="text-sm font-semibold text-slate-800 block">{member.fullName}</span>
                  </div>
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Unique Member ID</span>
                    <span className="text-sm font-mono font-bold text-indigo-600 block">{member.id}</span>
                  </div>
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Contact Phone</span>
                    <span className="text-sm font-semibold text-slate-800 block">{member.phoneNumber}</span>
                  </div>
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Email Address</span>
                    <span className="text-sm font-semibold text-slate-800 block">{member.email || 'None Registered'}</span>
                  </div>
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Birthday</span>
                    <span className="text-sm font-semibold text-slate-800 block flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5 text-purple-500" />
                      {member.birthday}
                    </span>
                  </div>
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Faculty & Major</span>
                    <span className="text-sm font-semibold text-slate-800 block">{member.faculty} • {member.level}</span>
                  </div>
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Hostel Residence</span>
                    <span className="text-sm font-semibold text-slate-800 block flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {member.residence}
                    </span>
                  </div>
                  <div className="space-y-1 p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block">Date Joined Fellowship</span>
                    <span className="text-sm font-semibold text-slate-800 block flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      {member.dateJoined}
                    </span>
                  </div>
                </div>

                {/* Locked Administrative Alert */}
                <div className="p-3.5 bg-slate-55 border border-gray-150 rounded-2xl flex items-start space-x-3 text-xs text-slate-500">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-700 block">Strict Security Isolations Active</span>
                    Some fields (such as your <strong>Member ID</strong>, <strong>Joined Date</strong>, and <strong>Leadership Notes</strong>) can only be managed by administrators and church coordinators.
                  </div>
                </div>
              </div>

              {/* 2. ATTENDANCE HISTORY COMPONENT */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    <Clipboard className="w-4 h-4 text-blue-600" />
                    My Attendance Summary
                  </h3>
                  <span className="text-xs text-slate-400 font-bold">{allAttendance.length} Total Services</span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl text-center">
                    <span className="block text-2xl font-black text-teal-600">{sunServicesCount}</span>
                    <span className="block text-[10px] text-teal-700 font-bold uppercase tracking-wider mt-0.5">Sunday Services</span>
                  </div>
                  <div className="p-4 bg-purple-50 border border-purple-100 rounded-2xl text-center">
                    <span className="block text-2xl font-black text-purple-600">{midweekCount}</span>
                    <span className="block text-[10px] text-purple-700 font-bold uppercase tracking-wider mt-0.5">Midweek Meetings</span>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-center">
                    <span className="block text-2xl font-black text-amber-600">{prayerMeetCount}</span>
                    <span className="block text-[10px] text-amber-700 font-bold uppercase tracking-wider mt-0.5">Prayer Gatherings</span>
                  </div>
                </div>

                {/* Actual attendance logs */}
                {allAttendance.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
                    No logged attendance records found. Ensure to check in with the ushers during services!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {allAttendance.map((att, i) => (
                      <div key={i} className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex justify-between items-center transition-all">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-xs font-bold text-slate-700">{att.serviceType}</span>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-slate-400">{att.date}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* UPCOMING EVENTS & CARE PANEL */}
            <div className="space-y-6">
              
              {/* Express Attendance Check-In Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 dark:from-blue-750 dark:to-indigo-850 text-white rounded-3xl shadow-lg p-6 space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                  <QrCode className="w-24 h-24" />
                </div>
                <div className="flex items-center space-x-2 border-b border-white/10 pb-3 relative z-10">
                  <QrCode className="w-5 h-5 text-blue-200 animate-pulse" />
                  <span className="font-bold text-xs tracking-wide uppercase">Express Self Check-In</span>
                </div>
                <p className="text-xs text-blue-100 leading-relaxed font-medium relative z-10">
                  Quickly register yourself present for Sunday Service, Midweek Service, MAP meetings, or Special church programs.
                </p>
                <div className="pt-1.5 relative z-10">
                  <button
                    onClick={() => onNavigate && onNavigate('check-in')}
                    className="w-full py-2.5 bg-white hover:bg-blue-50 text-blue-700 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    Express Check-In Now
                  </button>
                </div>
              </div>

              {/* Leader Note Read-only display */}
              <div className="bg-slate-900 text-slate-200 rounded-3xl border border-slate-800 shadow-md p-6 space-y-4">
                <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-sm tracking-wide uppercase text-white">Leadership Care Remarks</span>
                </div>
                <p className="text-xs text-slate-400 font-mono leading-relaxed bg-slate-950 p-4 rounded-xl border border-slate-800">
                  "Samuel is currently active in the Believers Academy. Continue supporting him with materials and prayer. He has a promising call."
                </p>
                <div className="flex items-center space-x-1 text-[9px] text-slate-500 font-medium">
                  <Info className="w-3.5 h-3.5 shrink-0" />
                  <span>Only visible to you and your assigned cell coordinators.</span>
                </div>
              </div>

              {/* Sample Events List */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
                <div className="flex justify-between items-center border-b border-gray-50 pb-3">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-blue-600" />
                    Upcoming Events
                  </h3>
                  <button onClick={() => setActiveTab('events')} className="text-xs font-bold text-blue-650 hover:underline cursor-pointer">
                    View All
                  </button>
                </div>

                <div className="space-y-3">
                  {events.slice(0, 3).map((item) => (
                    <div key={item.id} className="p-3 bg-slate-50 hover:bg-white border hover:border-blue-150 rounded-xl transition-all space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-bold text-slate-800 line-clamp-1">{item.title}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${
                          item.category === 'program' ? 'bg-blue-50 text-blue-600' :
                          item.category === 'meeting' ? 'bg-purple-50 text-purple-600' : 'bg-rose-50 text-rose-600'
                        }`}>
                          {item.category}
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400 font-semibold font-mono">
                        <span>{item.date} • {item.time}</span>
                        <span className="text-[9px] max-w-28 truncate">{item.location}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRAYER REQUESTS SUBMISSION & HISTORY */}
        {activeTab === 'prayers' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Submission Form */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-blue-600" />
                  New Intercession Request
                </h3>
                <p className="text-xs text-slate-400 mt-1">Our prayer partners and intercessory leaders lift every request up with devotion.</p>
              </div>

              {prayerSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{prayerSuccess}</span>
                </div>
              )}

              <form onSubmit={handleSubmitPrayer} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="prayerText" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Your Request Detail
                  </label>
                  <textarea
                    id="prayerText"
                    value={newRequestText}
                    onChange={(e) => setNewRequestText(e.target.value)}
                    placeholder="Write details about your prayer point, thanksgiving or testimony..."
                    rows={4}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPrayer || !newRequestText.trim()}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingPrayer ? 'Registering request...' : 'Submit Request'}
                </button>
              </form>
            </div>

            {/* Previous Requests List */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <Clipboard className="w-4 h-4 text-blue-600" />
                  Prayers History & Tracker
                </h3>
                <p className="text-xs text-slate-400 mt-1">Monitor active follow-up intercession remarks.</p>
              </div>

              {prayers.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl">
                  You haven't logger any prayer requests yet. Click on the left form to submit your first intercessions!
                </div>
              ) : (
                <div className="space-y-4 max-h-[450px] overflow-y-auto pr-1">
                  {prayers.map((pr) => (
                    <div key={pr.id} className="p-4 bg-slate-50 hover:bg-slate-55 border border-slate-100 rounded-2xl space-y-2 transition-all">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-slate-400">Submitted: {pr.dateSubmitted}</span>
                        
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          pr.status === 'Answered' ? 'bg-emerald-50 text-emerald-700' :
                          pr.status === 'Ongoing' ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          <Clock className="w-3.5 h-3.5 animate-spin-slow" />
                          {pr.status}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 leading-relaxed font-sans">{pr.request}</p>
                      <div className="text-[10px] text-emerald-600 font-bold flex items-center gap-1.5 p-2 bg-white border border-slate-100 rounded-xl">
                        <Check className="w-3.5 h-3.5" />
                        <span>Prayer intercessor updated status to: <strong>{pr.status}</strong>. Currently lifting you up.</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: PERSONAL SETTINGS & UPDATES */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Editable Profile Information Form */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <Edit className="w-4 h-4 text-blue-600" />
                  Mutable Profile Parameters
                </h3>
                <p className="text-xs text-slate-400 mt-1">Keep contact info updated so pastors and care volunteers can reach you successfully.</p>
              </div>

              {profileSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span className="font-semibold">{profileError}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="editPhone" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Active Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        id="editPhone"
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="editEmail" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        id="editEmail"
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="editResidence" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Physical Residence / Hostel Address
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        id="editResidence"
                        type="text"
                        value={editResidence}
                        onChange={(e) => setEditResidence(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="editPicture" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Profile Picture Image URL
                    </label>
                    <div className="relative">
                      <Compass className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        id="editPicture"
                        type="text"
                        value={editPicture}
                        onChange={(e) => setEditPicture(e.target.value)}
                        placeholder="https://example.com/avatar.jpg"
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 sm:col-span-2">
                    <label htmlFor="editBio" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Personal Bio / Spiritual Testimony
                    </label>
                    <textarea
                      id="editBio"
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value)}
                      rows={3}
                      placeholder="Briefly tell the brethren about yourself, your faith journey, or encouraging words..."
                      className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="editInterests" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Interests & Areas of Zeal (Comma separated)
                    </label>
                    <input
                      id="editInterests"
                      type="text"
                      value={editInterests}
                      onChange={(e) => setEditInterests(e.target.value)}
                      placeholder="e.g. Software Dev, Academic Excellence, Leadership"
                      className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="editMinistry" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                      Ministry & Departmental Involvement
                    </label>
                    <input
                      id="editMinistry"
                      type="text"
                      value={editMinistryInvolvement}
                      onChange={(e) => setEditMinistryInvolvement(e.target.value)}
                      placeholder="e.g. CCI Media, Sound Unit, Campus Evangelism"
                      className="block w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 p-4 bg-blue-50/40 border border-blue-105 rounded-2xl">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <span className="block text-xs font-bold text-slate-800">Directory Social Visibility Opt-In</span>
                        <p className="text-[11px] text-slate-505 leading-relaxed">
                          When checked, other registered FUTA brethren can discover your profile, join your spiritual fellowship network, and swap prayer updates with you.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                        <input
                          type="checkbox"
                          checked={editSocialVisibilityOptIn}
                          onChange={(e) => setEditSocialVisibilityOptIn(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-50">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSavingProfile ? 'Saving updates...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>

            {/* Read-only Information Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
              <div className="border-b border-gray-50 pb-3">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  Locked Fellowship Fields
                </h3>
                <p className="text-xs text-slate-400 mt-1">These parameters are governed strictly by the church database registers.</p>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Member ID Code</span>
                  <span className="block text-xs font-mono font-bold text-indigo-700">{member.id}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Date Joined Registry</span>
                  <span className="block text-xs font-bold text-slate-700">{member.dateJoined}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Assigned MAP Cell</span>
                  <span className="block text-xs font-bold text-slate-700">{member.mapName || 'Pending Assignment'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl space-y-0.5">
                  <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Leadership Care Notes</span>
                  <p className="block text-xs italic text-slate-500 font-medium">"Restricted. Contact administrative leader if coordinates change."</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: UPCOMING EVENTS */}
        {activeTab === 'events' && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-6">
            <div className="border-b border-gray-50 pb-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Church Programs & Activities
              </h3>
              <p className="text-xs text-slate-400 mt-1">Participating in the local life of Celebration Church International ensures constant growth in Christ.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {events.map((ev) => (
                <div key={ev.id} className="p-5 bg-slate-50/70 border border-slate-100 hover:border-blue-150 rounded-2xl relative overflow-hidden transition-all flex flex-col justify-between h-40">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        ev.category === 'program' ? 'bg-blue-100 text-blue-700' :
                        ev.category === 'meeting' ? 'bg-purple-100 text-purple-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {ev.category}
                      </span>
                      <span className="text-xs text-slate-400 font-mono font-bold">{ev.date}</span>
                    </div>
                    <h4 className="text-base font-bold text-slate-800 tracking-tight mt-2.5 leading-snug">{ev.title}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">🕒 {ev.time}</p>
                  </div>

                  <div className="text-xs font-bold text-slate-400 mt-3 flex items-center gap-1 truncate border-t border-slate-200/50 pt-2 pb-0.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span className="truncate">{ev.location}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: FELLOWSHIP SOCIAL NETWORK (Brethren Connection Engine) */}
        {activeTab === 'fellowship' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in relative">
            <div className="lg:col-span-2 space-y-6">
              
              {/* Note Composer Success feedback toast */}
              {noteSuccess && (
                <div className="p-4 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>{noteSuccess}</div>
                </div>
              )}

              {/* Active Brethren Fellowship Connections Card */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
                <div className="border-b border-gray-50 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                      <Users2 className="w-5 h-5 text-indigo-600" />
                      Brethren Fellowship Connections ({connections.length})
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Strengthen, stand in faith, and hold each other accountable through regular fellowship tracking.
                    </p>
                  </div>
                  <button 
                    onClick={() => loadMemberData()} 
                    className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                    title="Refresh connections"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {connections.length === 0 ? (
                  <div className="py-12 text-center space-y-3">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mx-auto">
                      <Users2 className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-800">No Fellowship Connections Yet</p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                        Send a fellowship link request to members in your department or MAP cell to share mutual encouragements & prayer points!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {connections.map((friend) => {
                      // Generate a mock checking rate or attendance streak for friendly social peer support
                      const attendanceRate = friend.fullName.length % 2 === 1 ? '90%' : '80%';
                      const checkedInStatus = friend.fullName.length % 3 === 0 ? 'Checked In' : 'Not Checked In';
                      const isExpanded = expandedConnectionMember === friend.id;

                      return (
                        <div key={friend.id} className="p-4 bg-slate-50/70 border border-slate-100 hover:border-indigo-150 rounded-2xl flex flex-col justify-between transition-all space-y-3">
                          <div 
                            className="flex items-start gap-3 cursor-pointer"
                            onClick={() => setExpandedConnectionMember(isExpanded ? null : friend.id)}
                          >
                            <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center text-sm shrink-0">
                              {friend.profilePicture ? (
                                <img src={friend.profilePicture} alt="Pic" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                              ) : friend.fullName.charAt(0)}
                            </div>
                             <div className="space-y-0.5 min-w-0">
                               <span className="block text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors truncate">{friend.fullName}</span>
                               <span className="block text-[10px] text-slate-400 font-semibold truncate flex items-center gap-1">
                                 <span>{friend.department} • Level {friend.level}</span>
                                 <span className="inline-flex items-center gap-0.5 text-[8.5px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1 rounded font-bold shrink-0" title="Active social connections">
                                   🤝 {fellowshipService.getConnectedBrethren(friend.churchId || 'futamap', friend.id).length}
                                 </span>
                               </span>
                             </div>
                          </div>

                          {/* Expanded detail inside Connection */}
                          {isExpanded && (
                            <div className="p-2.5 bg-white border border-indigo-50 rounded-xl text-[10px] space-y-2 animate-fade-in">
                              {friend.bio ? (
                                <p className="text-slate-650 italic">
                                  "{friend.bio}"
                                </p>
                              ) : (
                                <p className="text-slate-400 italic">No bio written yet.</p>
                              )}
                              {friend.interests && friend.interests.length > 0 && (
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-black uppercase text-indigo-400">Zeal/Interests</span>
                                  <div className="flex flex-wrap gap-1">
                                    {friend.interests.map((it, idx) => (
                                      <span key={idx} className="bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded text-[8px] font-extrabold">{it}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {friend.ministryInvolvement && friend.ministryInvolvement.length > 0 && (
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-black uppercase text-rose-400">Ministry Group</span>
                                  <div className="flex flex-wrap gap-1">
                                    {friend.ministryInvolvement.map((min, idx) => (
                                      <span key={idx} className="bg-rose-50 text-rose-700 px-1 py-0.2 rounded text-[8px] font-extrabold">{min}</span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Social Spiritual Status Box */}
                          <div className="p-2.5 bg-white border border-gray-150/50 rounded-xl text-[10px] space-y-1">
                            <div className="flex justify-between items-center text-slate-500">
                              <span>Attendance Streak:</span>
                              <span className="font-extrabold text-slate-800">{attendanceRate} Ratios</span>
                            </div>
                            <div className="flex justify-between items-center text-slate-500">
                              <span>Active Service:</span>
                              <span className={`font-semibold px-1 rounded-sm ${checkedInStatus === 'Checked In' ? 'bg-emerald-50 text-emerald-600 font-bold' : 'bg-amber-50 text-amber-600 font-bold'}`}>
                                {checkedInStatus}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1.5 pt-1">
                            <button
                              onClick={() => {
                                setNoteToBrethren(friend.id);
                                setNoteMessage('');
                              }}
                              className="flex-1 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold text-[10px] rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <MessageSquare className="w-3 h-3" />
                              Encourage
                            </button>
                            <button
                              onClick={() => setExpandedConnectionMember(isExpanded ? null : friend.id)}
                              className="px-2 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg text-[10px] shrink-0 font-medium cursor-pointer"
                              title={isExpanded ? "Hide bio details" : "Show bio details"}
                            >
                              {isExpanded ? "▲ Hide" : "▼ Bio"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Spiritual Encouragement Feed (Received notes) */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
                <div className="border-b border-gray-50 pb-3">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-5 h-5 text-amber-500" />
                    Encouragement Board / Spiritual Feed
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Spiritual exhortations, salutations, or stand-in-gap prayer notes sent to you by connected brethren.
                  </p>
                </div>

                {incomingNotes.length === 0 ? (
                  <div className="py-12 bg-slate-50/40 rounded-2xl text-center space-y-2">
                    <p className="text-xs font-bold text-slate-400">Board is quiet right now</p>
                    <p className="text-[11px] text-slate-400/80 max-w-xs mx-auto">
                      Notes will appear here when your brethren send words of spiritual alignment or stand-in-faith greetings.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incomingNotes.map((note) => {
                      // Custom theme color coding
                      const themeMap = {
                        'Prayer': {
                          bg: 'from-amber-50 to-orange-50/50 border-amber-200/60 text-amber-900',
                          badge: 'bg-amber-100 text-amber-800 border-amber-200',
                          title: 'Standing in Faith'
                        },
                        'Encouragement': {
                          bg: 'from-blue-50 to-indigo-50/50 border-blue-200/60 text-blue-900',
                          badge: 'bg-blue-100 text-blue-800 border-blue-200',
                          title: 'Spiritual Alignment'
                        },
                        'Salutation': {
                          bg: 'from-purple-50 to-fuchsia-50/50 border-purple-200/60 text-purple-900',
                          badge: 'bg-purple-100 text-purple-800 border-purple-200',
                          title: 'Brethren Greetings'
                        },
                        'Check-in': {
                          bg: 'from-emerald-50 to-teal-50/50 border-emerald-200/60 text-emerald-955',
                          badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                          title: 'Check-In Praise'
                        }
                      };

                      const design = themeMap[note.theme || 'Encouragement'];

                      return (
                        <div 
                          key={note.id} 
                          className={`p-5 bg-gradient-to-br border rounded-2xl space-y-3 ${design.bg} position-relative overflow-hidden`}
                        >
                          <div className="flex justify-between items-center border-b border-slate-205/30 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">From Brethren:</span>
                              <span className="text-xs font-bold text-slate-800">{note.senderName}</span>
                            </div>
                            <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded-full border ${design.badge}`}>
                              {note.theme || 'Fellowship'}
                            </span>
                          </div>

                          <div className="text-xs italic leading-relaxed text-slate-700 font-medium whitespace-pre-wrap">
                            "{note.message}"
                          </div>

                          <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold font-mono pt-1">
                            <span>Status: Shared Spiritually</span>
                            <span>{note.dateSent}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Invites & Discovery */}
            <div className="space-y-6">
              
              {/* PENDING NOTIFICATION SECTION */}
              {pendingRequests.length > 0 && (
                <div className="bg-rose-50/60 border border-rose-100 rounded-3xl p-6 space-y-4">
                  <div className="border-b border-rose-100 pb-2 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shrink-0" />
                    <h3 className="text-sm font-black text-rose-905">Inward Fellowship Invitations</h3>
                  </div>

                  <div className="space-y-3">
                    {pendingRequests.map((req) => (
                      <div key={req.connectionId} className="bg-white p-3.5 border border-rose-100 rounded-2xl space-y-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-full font-bold flex items-center justify-center text-xs">
                            {req.sender.fullName.charAt(0)}
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-slate-800">{req.sender.fullName}</span>
                            <span className="block text-[9px] text-slate-400 font-semibold">
                              MAP: {req.sender.mapName || 'Alpha Cell'}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 pt-1.5 border-t border-rose-50">
                          <button
                            onClick={() => handleAcceptRequest(req.connectionId)}
                            className="py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                          >
                            Accept Link
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(req.connectionId)}
                            className="py-1 bg-slate-105 hover:bg-slate-200 text-slate-600 font-semibold text-[10px] rounded-lg transition-all cursor-pointer"
                          >
                            Ignore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* DISCOVER BRETHREN DIRECTORY (Searchable list of fellow members) */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 space-y-4">
                <div className="border-b border-gray-50 pb-1">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Search className="w-4 h-4 text-slate-500" />
                    Discover Brethren Directory
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    Search and connect with other active members of your church who registered in CCI.
                  </p>
                </div>

                {/* Directory Search inputs */}
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by name, dept or cell..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-3 py-1.5 border border-gray-150 rounded-xl text-xs bg-slate-50/50 font-medium focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
                  />
                </div>

                {/* Directory profiles lists */}
                <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
                  {discoverableMembers.length === 0 ? (
                    <p className="text-[10px] text-slate-400 text-center py-6 font-medium">All registered congregation members are connected.</p>
                  ) : (
                    discoverableMembers
                      .filter(m => {
                        const term = searchQuery.toLowerCase();
                        return (
                          m.fullName.toLowerCase().includes(term) ||
                          m.department.toLowerCase().includes(term) ||
                          m.mapName.toLowerCase().includes(term)
                        );
                      })
                      .slice(0, 10) // Limit count to avoid page length blowout
                      .map((p) => {
                        const isExpanded = expandedDirectoryMember === p.id;
                        return (
                          <div 
                            key={p.id} 
                            className="bg-slate-50/40 hover:bg-slate-50 border border-slate-100 rounded-2xl p-3.5 transition-all space-y-2.5"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div 
                                className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
                                onClick={() => setExpandedDirectoryMember(isExpanded ? null : p.id)}
                              >
                                <div className="w-8.5 h-8.5 rounded-full bg-slate-100 text-slate-650 flex items-center justify-center font-bold text-xs shrink-0 relative">
                                  {p.profilePicture ? (
                                    <img src={p.profilePicture} alt="" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                                  ) : (
                                    p.fullName.charAt(0)
                                  )}
                                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-white" title="Social visibility enabled!" />
                                </div>
                                <div className="min-w-0">
                                  <span className="block text-xs font-bold text-slate-800 hover:text-indigo-600 transition-colors truncate">{p.fullName}</span>
                                  <span className="block text-[9px] text-slate-400 font-semibold truncate leading-none mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span>MAP: {p.mapName} • Level {p.level}</span>
                                    <span className="inline-flex items-center gap-0.5 text-[8px] bg-indigo-50 border border-indigo-100 text-indigo-700 px-1 py-0.2 rounded font-black shrink-0" title="Active connections">
                                      🤝 {fellowshipService.getConnectedBrethren(p.churchId || 'futamap', p.id).length}
                                    </span>
                                  </span>
                                </div>
                              </div>

                              <button
                                onClick={() => handleSendRequest(p.id)}
                                className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[9px] rounded-lg shadow-2xs transition-all shrink-0 cursor-pointer flex items-center gap-0.5"
                              >
                                <Plus className="w-3 h-3" /> Connect
                              </button>
                            </div>

                            {/* Collapsible Info Drawer segment */}
                            {isExpanded && (
                              <div className="pt-2 border-t border-slate-100 space-y-2 text-[11px] animate-fade-in">
                                {p.bio ? (
                                  <p className="text-slate-650 italic leading-relaxed bg-white border border-slate-105 p-2.5 rounded-xl">
                                    "{p.bio}"
                                  </p>
                                ) : (
                                  <p className="text-slate-400 italic">No bio written yet.</p>
                                )}

                                {p.interests && p.interests.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block">Interests & Zeals</span>
                                    <div className="flex flex-wrap gap-1">
                                      {p.interests.map((interest, idx) => (
                                        <span key={idx} className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded text-[9px]">
                                          {interest}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {p.ministryInvolvement && p.ministryInvolvement.length > 0 && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block">Ministry Involvement</span>
                                    <div className="flex flex-wrap gap-1">
                                      {p.ministryInvolvement.map((min, idx) => (
                                        <span key={idx} className="px-1.5 py-0.5 bg-rose-50 border border-rose-100 text-rose-700 font-bold rounded text-[9px]">
                                          {min}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Little helper clicker hint */}
                            <div className="text-center border-t border-slate-50 pt-1.5">
                              <button 
                                onClick={() => setExpandedDirectoryMember(isExpanded ? null : p.id)}
                                className="text-[9px] font-black text-indigo-500 hover:text-indigo-750 transition-colors uppercase tracking-wider cursor-pointer font-mono"
                              >
                                {isExpanded ? '▲ Hide Details' : '▼ View Bio & Ministries'}
                              </button>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>
              </div>
            </div>

            {/* Note Encouragement Composer Modal/Overlay */}
            {noteToBrethren && (() => {
              const buddy = memberService.getMemberById(noteToBrethren);
              return (
                <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
                  <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 border border-slate-100">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">Encourage Brethren</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">Share greetings, thanksgiving reminders, or spiritual updates.</p>
                      </div>
                      <button 
                        onClick={() => setNoteToBrethren(null)} 
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-100 px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full text-indigo-700 flex items-center justify-center font-bold text-xs">
                        {buddy?.fullName.charAt(0)}
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">{buddy?.fullName}</span>
                        <span className="block text-[10px] text-slate-400 font-semibold">Department: {buddy?.department}</span>
                      </div>
                    </div>

                    <form onSubmit={handleSendNote} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Select Theme Category</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {(['Encouragement', 'Prayer', 'Salutation', 'Check-in'] as const).map((theme) => (
                            <button
                              key={theme}
                              type="button"
                              onClick={() => setNoteTheme(theme)}
                              className={`py-1 rounded-lg text-[10px] font-bold border transition-all text-center cursor-pointer ${
                                noteTheme === theme 
                                  ? 'bg-indigo-600 border-indigo-600 text-white' 
                                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {theme}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor="noteMessage" className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest">Your Message</label>
                        <textarea
                          id="noteMessage"
                          rows={3}
                          value={noteMessage}
                          onChange={(e) => setNoteMessage(e.target.value)}
                          placeholder="Brethren, standing with you in intercessions. Rest assured in the grace of..."
                          className="block w-full px-3 py-2 border border-slate-200 rounded-2xl text-xs bg-white outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!noteMessage.trim()}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-200 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Send className="w-3.5 h-3.5" /> Send Encouragement Note
                      </button>
                    </form>
                  </div>
                </div>
              );
            })()}

          </div>
        )}

      </main>

      {/* Footer Care Credits */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-center text-slate-550 text-xs">
        <p className="font-semibold text-slate-400">Celebration Church International • Secure Portal Access</p>
        <p className="text-[10px] text-slate-600 mt-1">All database registers are isolated for tenant privacy protection.</p>
      </footer>
    </div>
  );
}
