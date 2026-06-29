import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, User, Phone, MapPin, Calendar, Clock, ArrowLeft, QrCode, AlertCircle, Building, Check, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { authService } from '../../services/authService';
import { memberService } from '../../services/memberService';
import { settingsService } from '../../services/settingsService';
import { attendanceService } from '../../services/attendanceService';
import { ServiceType } from '../../types';

interface CheckInViewProps {
  onBackToPortal: () => void;
  defaultChurchId?: string;
  onNavigate?: (viewId: string) => void;
}

export default function CheckInView({ onBackToPortal, defaultChurchId = 'futamap', onNavigate }: CheckInViewProps) {
  // Query state (for QR detection simulation)
  const [detectedChurchId, setDetectedChurchId] = useState('');
  const [detectedServiceType, setDetectedServiceType] = useState<ServiceType>('Sunday Service');
  const [detectedDate, setDetectedDate] = useState('');
  
  // Member lookup & login state
  const [memberPhone, setMemberPhone] = useState('');
  const [checkedMember, setCheckedMember] = useState<any>(null);
  const [searchError, setSearchError] = useState('');

  // Status state
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [latestRecord, setLatestRecord] = useState<any>(null);

  // Active member session (if already logged in)
  const [activeSession, setActiveSession] = useState<any>(null);

  // QR Generator State
  const [activeTab, setActiveTab] = useState<'check-in' | 'qr-generator'>('check-in');
  const [qrChurchId, setQrChurchId] = useState(defaultChurchId);
  const [qrServiceType, setQrServiceType] = useState<ServiceType>('Sunday Service');
  const [qrDate, setQrDate] = useState(new Date().toISOString().split('T')[0]);
  const [registeredChurches, setRegisteredChurches] = useState(() => authService.getChurchesList());

  // Sync latest church list & parse incoming query parameters
  useEffect(() => {
    let active = true;
    const fetchLatest = async () => {
      try {
        await authService.syncChurches();
        if (active) {
          setRegisteredChurches(authService.getChurchesList());
        }
      } catch (err) {
        console.error('Error syncing churches on mount:', err);
      }
    };
    fetchLatest();

    // Check if member is already authenticated
    const memberSess = authService.getCurrentMemberSession();
    if (memberSess) {
      setActiveSession(memberSess);
      const memObj = memberService.getMemberById(memberSess.memberId);
      if (memObj) {
        setCheckedMember(memObj);
      }
    }

    // Parse query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const qChurch = urlParams.get('church') || urlParams.get('churchId');
    const qService = urlParams.get('service') || urlParams.get('serviceType');
    const qDate = urlParams.get('date');

    const finalChurch = qChurch || defaultChurchId || 'futamap';
    
    // Service Type mapping & validation
    let finalService: ServiceType = 'Sunday Service';
    if (qService) {
      const decodedService = decodeURIComponent(qService);
      if ([
        'Sunday Service', 'Bible Study', 'Prayer Meeting', 'MAP Meeting', 'Midweek Service', 'Special Program'
      ].includes(decodedService)) {
        finalService = decodedService as ServiceType;
      }
    }

    const finalDate = qDate || new Date().toISOString().split('T')[0];

    setDetectedChurchId(finalChurch);
    setDetectedServiceType(finalService);
    setDetectedDate(finalDate);

    // Sync QR defaults to parsed inputs
    setQrChurchId(finalChurch);
    setQrServiceType(finalService);
    setQrDate(finalDate);

    return () => {
      active = false;
    };
  }, [defaultChurchId]);

  // Generate QR Url and Image using dynamic QR server API
  const checkInUrl = `${window.location.origin}/?view=check-in&churchId=${qrChurchId}&serviceType=${encodeURIComponent(qrServiceType)}&date=${qrDate}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(checkInUrl)}`;

  const handlePrintQR = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const selectedChurch = registeredChurches.find(c => c.id === qrChurchId);
      const churchName = selectedChurch ? selectedChurch.name : 'Celebration Church International';
      printWindow.document.write(`
        <html>
          <head>
            <title>Attendance QR Code - ${churchName}</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                text-align: center;
                padding: 40px;
                color: #0f172a;
              }
              .card {
                max-width: 500px;
                margin: 0 auto;
                border: 2px solid #e2e8f0;
                border-radius: 24px;
                padding: 40px;
                box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              }
              .title {
                font-size: 24px;
                font-weight: 800;
                margin-bottom: 8px;
                letter-spacing: -0.05em;
              }
              .subtitle {
                font-size: 14px;
                color: #64748b;
                margin-bottom: 24px;
                font-weight: 500;
              }
              .details {
                background-color: #f8fafc;
                border-radius: 16px;
                padding: 16px;
                font-size: 13px;
                font-weight: 600;
                margin-bottom: 24px;
                color: #1e293b;
              }
              .qr-container {
                margin: 0 auto 24px;
                width: 250px;
                height: 250px;
                border: 4px solid #2563eb;
                border-radius: 16px;
                padding: 8px;
              }
              .qr-container img {
                width: 100%;
                height: 100%;
              }
              .instructions {
                font-size: 12px;
                color: #475569;
                line-height: 1.6;
              }
              @media print {
                body { padding: 0; }
                .card { border: none; box-shadow: none; }
              }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="title">${churchName}</div>
              <div class="subtitle">Express Attendance Check-In</div>
              
              <div class="qr-container">
                <img src="${qrImageUrl}" />
              </div>

              <div class="details">
                <div>Session: ${qrServiceType}</div>
                <div style="margin-top: 4px;">Date: ${qrDate}</div>
              </div>

              <div class="instructions">
                <strong>How to check in:</strong><br/>
                1. Open your smartphone camera or scan app.<br/>
                2. Point at the QR Code to load the check-in form.<br/>
                3. Enter your phone number or verify your profile to log attendance instantly!
              </div>
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  // Handle phone number verification lookup
  const handleVerifyMember = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    setIsLoading(true);

    if (!memberPhone.trim()) {
      setSearchError('Please enter your phone number.');
      setIsLoading(false);
      return;
    }

    try {
      // Find member in database by matching raw/formatted phone number
      const members = memberService.getMembers().filter(m => m.churchId === detectedChurchId);
      const cleanInput = memberPhone.replace(/[^0-9]/g, '');
      
      const found = members.find(m => {
        const cleanMem = m.phoneNumber.replace(/[^0-9]/g, '');
        return cleanMem.includes(cleanInput) || cleanInput.includes(cleanMem) || m.phoneNumber.trim() === memberPhone.trim();
      });

      if (found) {
        setCheckedMember(found);
      } else {
        setSearchError('No member profile found with this phone number. Would you like to register or double-check?');
      }
    } catch (err: any) {
      setSearchError(err.message || 'Error looking up details.');
    } finally {
      setIsLoading(false);
    }
  };

  // Perform full attendance check-in
  const handleCheckInNow = async () => {
    if (!checkedMember) return;
    setIsLoading(true);

    try {
      // Simulate small check-in server latency for polished UI experience
      await new Promise(resolve => setTimeout(resolve, 800));

      const record = attendanceService.addAttendance(
        checkedMember.id,
        checkedMember.fullName,
        detectedServiceType,
        detectedDate,
        detectedChurchId
      );

      setLatestRecord(record);
      setIsCheckedIn(true);
      setIsSuccess(true);
    } catch (e) {
      console.error(e);
      setSearchError('Failed to record check-in. Please contact admin.');
    } finally {
      setIsLoading(false);
    }
  };

  const activeChurchSettings = settingsService.getSettings(detectedChurchId || 'futamap');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between font-sans relative overflow-hidden">
      {/* Decorative backdrop elements */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-1050/10 rounded-full filter blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-purple-1050/10 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header bar */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-150 py-4 px-6 sm:px-12 flex justify-between items-center relative z-10">
        <button
          onClick={onBackToPortal}
          className="flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
        <div className="flex items-center space-x-2">
          <QrCode className="w-4 h-4 text-blue-600 animate-pulse" />
          <span className="text-xs font-mono font-bold dark:text-slate-300">Express Check-In Portal</span>
        </div>
      </header>

      {/* Main Form container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8 relative z-10">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-gray-200/60 dark:border-slate-800 rounded-3xl shadow-xl overflow-hidden">
          
          {/* Header Banner info */}
          <div className="p-6 bg-slate-900 text-white relative">
            <div className="absolute top-4 right-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full text-[10px] uppercase font-mono font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Kiosk
            </div>
            <div className="space-y-1">
              <span className="block text-[10px] text-blue-400 uppercase tracking-widest font-black">
                {activeTab === 'check-in' ? 'Attendance Check-In' : 'Admin: Session QR Poster'}
              </span>
              <h2 className="text-xl font-bold tracking-tight">
                {activeTab === 'check-in' ? activeChurchSettings.churchName : 'Configure Session QR'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {activeTab === 'check-in'
                  ? 'Please verify your details below to mark yourself present.'
                  : 'Select session parameters to project or print dynamic QR codes.'}
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-gray-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-xs">
            <button
              onClick={() => setActiveTab('check-in')}
              className={`flex-1 py-3 text-center font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'check-in'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              Express Check-In
            </button>
            <button
              onClick={() => setActiveTab('qr-generator')}
              className={`flex-1 py-3 text-center font-bold border-b-2 transition-colors cursor-pointer ${
                activeTab === 'qr-generator'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-slate-200'
              }`}
            >
              Session QR Poster
            </button>
          </div>

          <div className="p-6 space-y-6">
            {activeTab === 'check-in' ? (
              !isSuccess ? (
                <>
                  {/* Active Service Detection specs */}
                  <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-2xl flex items-start gap-3">
                    <Clock className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Service details detect</span>
                      <span className="block text-sm font-black text-slate-800 dark:text-slate-200">{detectedServiceType}</span>
                      <span className="block text-xs text-slate-500 font-mono font-bold">
                        Date: {detectedDate}
                      </span>
                    </div>
                  </div>

                  {/* Step Content: lookup if not found */}
                  {!checkedMember ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Identify Yourself</p>
                        <p className="text-xs text-slate-500 font-sans mt-1">Enter the phone number you registered with to retrieve your fellowship profile.</p>
                      </div>

                      <form onSubmit={handleVerifyMember} className="space-y-3">
                        <div className="relative">
                          <Phone className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-405 dark:text-slate-500" />
                          <input
                            type="tel"
                            value={memberPhone}
                            onChange={(e) => setMemberPhone(e.target.value)}
                            placeholder="e.g. +234 812 345 6789"
                            className="block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-slate-800 rounded-2xl text-sm transition-all focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white dark:bg-slate-900 dark:text-white"
                          />
                        </div>

                        {searchError && (
                          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-250 dark:border-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-xl flex items-start space-x-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <div className="space-y-1.5 flex-1">
                              <p className="font-semibold">{searchError}</p>
                              {/* Option to register as a new member if not found */}
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => onNavigate && onNavigate('register-member')}
                                  className="text-[10px] text-blue-700 dark:text-blue-400 font-bold hover:underline underline-offset-2 flex items-center gap-1"
                                >
                                  <UserPlus className="w-3 h-3" /> Register Member
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isLoading ? 'Searching...' : 'Find Profile & Verify'}
                        </button>
                      </form>
                    </div>
                  ) : (
                    /* Verified Check-In Click */
                    <div className="space-y-5 text-center">
                      <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border-4 border-white dark:border-slate-800 shadow">
                        {checkedMember.profilePicture ? (
                          <img src={checkedMember.profilePicture} alt="Profile" className="w-full h-full rounded-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-7 h-7" />
                        )}
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] text-emerald-500 font-mono font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">Profile Verified</span>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mt-1.5">{checkedMember.fullName}</h3>
                        <p className="text-xs text-slate-400 font-medium">Department: {checkedMember.department} | MAP: {checkedMember.mapName || 'Active Cell'}</p>
                      </div>

                      {/* Change profile trigger if auto login fetched wrong person */}
                      {!activeSession && (
                        <button
                          onClick={() => {
                            setCheckedMember(null);
                            setMemberPhone('');
                            setSearchError('');
                          }}
                          className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 underline uppercase tracking-widest cursor-pointer"
                        >
                          Not you? Switch profile
                        </button>
                      )}

                      <button
                        onClick={handleCheckInNow}
                        disabled={isLoading}
                        className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 animate-pulse"
                      >
                        <Check className="w-4 h-4" />
                        {isLoading ? 'Recording Attendance...' : 'Confirm and Check-In'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                /* Check-In Success State */
                <div className="text-center space-y-6 py-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-4 border-white dark:border-slate-800 shadow">
                    <CheckCircle2 className="w-10 h-10 animate-scale-up" />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Attendance Recorded Successfully!</span>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {latestRecord?.id || 'att_ok'}</p>
                    <h3 className="text-lg font-black text-slate-900 dark:text-white">“You’ve been marked present”</h3>
                    <p className="text-xs text-slate-500 font-medium max-w-sm mx-auto leading-relaxed mt-2">
                      Thank you for checking in to <strong>{detectedServiceType}</strong> today. Your attendance history in your personal member dashboard has been automatically updated.
                    </p>
                  </div>

                  {/* Mock Attendance Digital Pass Badge */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-150 dark:border-slate-700 rounded-3xl text-left space-y-3 font-sans relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                      <QrCode className="w-24 h-24" />
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-150 dark:border-slate-700 pb-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sunday Fellowship pass</span>
                      <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">Active Present</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Cared For Member</span>
                        <span className="font-bold text-slate-800 dark:text-white line-clamp-1">{checkedMember?.fullName}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Assigned MAP Cell</span>
                        <span className="font-mono text-[10px] font-black text-indigo-600 dark:text-indigo-400 truncate">{checkedMember?.mapName || 'Futa Cell'}</span>
                      </div>
                      <div className="mt-1">
                        <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Time Registered</span>
                        <span className="text-slate-700 dark:text-slate-300 font-semibold">{detectedDate} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                      </div>
                      <div className="mt-1">
                        <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mb-1">Church Tenant</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300 line-clamp-1">{activeChurchSettings.churchName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={onBackToPortal}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      Go Back Home
                    </button>
                    {checkedMember && onNavigate && (
                      <button
                        onClick={() => onNavigate('member-login')}
                        className="flex-1 py-2.5 bg-blue-50 hover:bg-blue-105 border border-blue-100 text-blue-600 font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <LogIn className="w-3.5 h-3.5" />
                        View Dashboard
                      </button>
                    )}
                  </div>
                </div>
              )
            ) : (
              /* Session QR Generator Poster View */
              <div className="space-y-5">
                {/* QR Config Controls */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-150 dark:border-slate-800 text-xs">
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Configure Session</span>
                  
                  <div className="grid grid-cols-1 gap-3 text-xs">
                    {/* Church Select */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Church Tenant</label>
                      <select
                        value={qrChurchId}
                        onChange={(e) => setQrChurchId(e.target.value)}
                        className="block w-full px-3 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 dark:text-white cursor-pointer"
                      >
                        {registeredChurches.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Service Type Select */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Service Type</label>
                      <select
                        value={qrServiceType}
                        onChange={(e) => setQrServiceType(e.target.value as ServiceType)}
                        className="block w-full px-3 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 dark:text-white cursor-pointer"
                      >
                        <option value="Sunday Service">Sunday Service</option>
                        <option value="Bible Study">Bible Study</option>
                        <option value="Prayer Meeting">Prayer Meeting</option>
                        <option value="MAP Meeting">MAP Meeting</option>
                        <option value="Midweek Service">Midweek Service</option>
                        <option value="Special Program">Special Program</option>
                      </select>
                    </div>

                    {/* Date select */}
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1.5">Date</label>
                      <input
                        type="date"
                        value={qrDate}
                        onChange={(e) => setQrDate(e.target.value)}
                        className="block w-full px-3 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl text-xs bg-white dark:bg-slate-900 dark:text-white cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* QR Display Card */}
                <div className="border border-slate-150 dark:border-slate-800 rounded-3xl p-5 text-center bg-slate-50 dark:bg-slate-950 flex flex-col items-center">
                  <div className="p-3 bg-white rounded-2xl shadow-md border-2 border-blue-100">
                    <img
                      src={qrImageUrl}
                      alt="Session QR Code"
                      className="w-48 h-48 block"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  
                  <div className="mt-4 space-y-1">
                    <h4 className="text-sm font-black text-slate-850 dark:text-white">Scan to Check-In</h4>
                    <p className="text-[10px] text-gray-500 font-medium">Allows members to instantly log attendance via mobile</p>
                  </div>

                  <div className="mt-4 w-full flex gap-2">
                    <button
                      onClick={handlePrintQR}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Print Poster</span>
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(checkInUrl);
                        alert('Check-in link copied to clipboard!');
                      }}
                      className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>Copy Link</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer credits */}
      <footer className="py-6 text-center text-slate-400 dark:text-slate-500 text-[10px] font-semibold font-mono relative z-10 border-t border-gray-150/40">
        <div>{activeChurchSettings.churchName} • Secure Multi-Tenant Architecture</div>
        <div className="text-[9px] text-slate-400/60 mt-0.5">Scanned dynamically via local QR tracking registers © 2026.</div>
      </footer>
    </div>
  );
}
