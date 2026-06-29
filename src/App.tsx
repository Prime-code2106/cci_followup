import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, AppSettings, Member, Visitor, Attendance, PrayerRequest, FollowUp, RecentActivity, ChurchSession } from './types';

// Services
import { memberService } from './services/memberService';
import { visitorService } from './services/visitorService';
import { attendanceService } from './services/attendanceService';
import { prayerService } from './services/prayerService';
import { followUpService } from './services/followUpService';
import { activityService } from './services/activityService';
import { settingsService } from './services/settingsService';
import { authService } from './services/authService';
import { fellowshipService } from './services/fellowshipService';

// Base Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Subviews
import LandingPage from './components/views/LandingPage';
import MemberRegistration from './components/views/MemberRegistration';
import VisitorRegistration from './components/views/VisitorRegistration';
import PrayerSubmission from './components/views/PrayerSubmission';
import AdminLogin from './components/views/AdminLogin';
import DashboardView from './components/views/DashboardView';
import MembersView from './components/views/MembersView';
import MemberProfileView from './components/views/MemberProfileView';
import VisitorsView from './components/views/VisitorsView';
import AttendanceView from './components/views/AttendanceView';
import FollowUpView from './components/views/FollowUpView';
import BirthdayView from './components/views/BirthdayView';
import ReportsView from './components/views/ReportsView';
import SettingsView from './components/views/SettingsView';
import MemberLogin from './components/views/MemberLogin';
import MemberDashboardView from './components/views/MemberDashboardView';
import CheckInView from './components/views/CheckInView';

// Icons
import { Moon, Sun, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function App() {
  // Authentication Multi-Tenant State
  const [session, setSession] = useState<ChurchSession | null>(() => authService.getCurrentSession());
  const [memberSession, setMemberSession] = useState<any | null>(() => authService.getCurrentMemberSession());

  // Navigation state (SaaS routes)
  const [currentView, setCurrentView] = useState<string>(() => {
    // Check if URL query string or hash has check-in route
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam === 'check-in' || viewParam === 'checkin') {
      return 'check-in';
    }
    const hashVal = window.location.hash.toLowerCase().replace('#', '');
    if (hashVal === 'check-in' || hashVal === 'checkin') {
      return 'check-in';
    }

    // If a member is logged in, enter member portal, if admin logged in, enter dashboard, else land on public entry
    const activeMemberSession = authService.getCurrentMemberSession();
    if (activeMemberSession) {
      return 'member-dashboard';
    }
    const activeSession = authService.getCurrentSession();
    return activeSession ? 'dashboard' : 'landing';
  });
  
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<UserRole>(() => {
    const activeMemberSession = authService.getCurrentMemberSession();
    if (activeMemberSession) {
      return 'Member';
    }
    return 'Admin';
  }); // System admin access
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  // Keep track of the active public tenant/church shown on the Landing page
  const [selectedPublicChurchId, setSelectedPublicChurchId] = useState<string>(() => {
    return localStorage.getItem('last_selected_public_church') || 'futamap';
  });

  // App Settings, dynamically retrieved for the active tenant session or selected public church
  const [appSettings, setAppSettings] = useState<AppSettings>(() => 
    settingsService.getSettings(session?.churchId || selectedPublicChurchId)
  );

  // Reactively fetch settings details when session church or selected public church switches
  useEffect(() => {
    setAppSettings(settingsService.getSettings(session?.churchId || selectedPublicChurchId));
  }, [session, selectedPublicChurchId]);

  const handlePublicChurchChange = (churchId: string) => {
    setSelectedPublicChurchId(churchId);
    localStorage.setItem('last_selected_public_church', churchId);
  };

  // Data Store States (automatically filtered reactively by our multi-tenant services based on active session)
  const [members, setMembers] = useState<Member[]>([]);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequest[]>([]);
  const [followups, setFollowUps] = useState<FollowUp[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);

  // Refresh reactive data records
  const refreshAllData = useCallback(async () => {
    try {
      const activeMemberSession = authService.getCurrentMemberSession();
      const activeAdminSession = authService.getCurrentSession();
      const activeChurchId = activeMemberSession?.churchId || activeAdminSession?.churchId || 'futamap';

      const [m, v, a, p, f, act] = await Promise.all([
        memberService.fetchMembers(),
        visitorService.fetchVisitors(),
        attendanceService.fetchAttendance(),
        prayerService.fetchPrayerRequests(),
        followUpService.fetchFollowUps(),
        activityService.fetchActivities()
      ]);

      await fellowshipService.fetchFellowshipData(activeChurchId);

      setMembers(m);
      setVisitors(v);
      setAttendance(a);
      setPrayerRequests(p);
      setFollowUps(f);
      setRecentActivities(act);

      // Automated birthday trigger dispatch
      try {
        fetch('/api/birthdays/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ churchId: activeChurchId })
        }).then(res => {
          if (res.ok) {
            res.json().then(data => {
              if (data.triggeredCount > 0) {
                activityService.fetchActivities().then(newAct => setRecentActivities(newAct));
              }
            });
          }
        });
      } catch (bdayErr) {
        console.warn("Could not trigger automated birthday greeting dispatch", bdayErr);
      }
    } catch (err) {
      console.error("Error refreshing fullstack data from server:", err);
      // Fallback to synchronous cached reads
      setMembers(memberService.getMembers());
      setVisitors(visitorService.getVisitors());
      setAttendance(attendanceService.getAttendance());
      setPrayerRequests(prayerService.getPrayerRequests());
      setFollowUps(followUpService.getFollowUps());
      setRecentActivities(activityService.getActivities());
    }
  }, [session, memberSession]);

  // Run initial state loading
  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Darkmode sync
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Handle member selection dynamically (e.g. search suggestions)
  const handleSelectMemberByName = (name: string) => {
    const matched = members.find(m => m.fullName.toLowerCase() === name.toLowerCase());
    if (matched) {
      setSelectedMemberId(matched.id);
      setCurrentView('member-profile');
    }
  };

  const handleViewChange = (viewId: string) => {
    // Route guarding for protected dashboard views
    const publicViews = ['landing', 'register-member', 'register-visitor', 'prayer-request', 'admin-login', 'member-login', 'member-dashboard', 'check-in'];
    const isTargetPublic = publicViews.includes(viewId);

    if (!isTargetPublic && !authService.isAuthenticated()) {
      // Not logged in to a tenant - redirect straight to the admin credential gate
      setCurrentView('admin-login');
    } else {
      setCurrentView(viewId);
    }
  };

  // Safe login handler called by the Login component
  const handleLoginSuccess = (newSession: ChurchSession) => {
    setSession(newSession);
    setCurrentUserRole('Admin');
    // Switch to Dashboard immediately
    setCurrentView('dashboard');
    // Ensure accurate re-rendering of tenant settings
    setAppSettings(settingsService.getSettings(newSession.churchId));
  };

  // Safe member login handler
  const handleMemberLoginSuccess = (newMemberSession: any) => {
    setMemberSession(newMemberSession);
    setCurrentUserRole('Member');
    setCurrentView('member-dashboard');
    refreshAllData();
  };

  // Safe logout handler
  const handleLogout = () => {
    authService.logout();
    setSession(null);
    setCurrentView('landing');
  };

  const handleMemberLogout = () => {
    authService.logoutMember();
    setMemberSession(null);
    setCurrentUserRole('Admin');
    setCurrentView('landing');
  };

  // View switch render controller
  const renderViewContent = () => {
    switch (currentView) {
      case 'landing':
        return (
          <LandingPage
            onNavigate={handleViewChange}
            churchName={appSettings.churchName}
            mapName={appSettings.mapName}
            activeChurchId={selectedPublicChurchId}
            onChurchChange={handlePublicChurchChange}
          />
        );
      
      // Public facing gateways
      case 'register-member':
        return (
          <MemberRegistration
            onBackToPortal={() => handleViewChange('landing')}
            mapName={appSettings.mapName}
            defaultChurchId={selectedPublicChurchId}
          />
        );
      case 'register-visitor':
        return (
          <VisitorRegistration
            onBackToPortal={() => handleViewChange('landing')}
            mapName={appSettings.mapName}
            defaultChurchId={selectedPublicChurchId}
          />
        );
      case 'prayer-request':
        return (
          <PrayerSubmission
            onBackToPortal={() => handleViewChange('landing')}
            mapName={appSettings.mapName}
            defaultChurchId={selectedPublicChurchId}
          />
        );
      case 'check-in':
        return (
          <CheckInView
            onBackToPortal={() => handleViewChange('landing')}
            defaultChurchId={selectedPublicChurchId}
            onNavigate={handleViewChange}
          />
        );
      
      // Admin tenant authentication gate
      case 'admin-login':
        return (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onBackToPortal={() => handleViewChange('landing')}
          />
        );

      case 'register-church':
        return (
          <AdminLogin
            onLoginSuccess={handleLoginSuccess}
            onBackToPortal={() => handleViewChange('landing')}
            initialIsRegistering={true}
          />
        );

      case 'member-login':
        return (
          <MemberLogin
            onLoginSuccess={handleMemberLoginSuccess}
            onBackToPortal={() => handleViewChange('landing')}
          />
        );

      case 'member-dashboard':
        return memberSession ? (
          <MemberDashboardView
            memberId={memberSession.memberId}
            onLogout={handleMemberLogout}
            attendanceHistory={attendance}
          />
        ) : (
          <div className="p-8 text-center bg-white rounded-3xl">
            <p className="text-sm font-semibold text-slate-500">No member session found. Please log in.</p>
            <button
              onClick={() => handleViewChange('member-login')}
              className="mt-4 px-4 py-2 bg-blue-600 rounded-xl text-white font-bold"
            >
              Go to Login
            </button>
          </div>
        );

      // Dashboards/Leader views
      case 'dashboard':
        return (
          <DashboardView
            members={members}
            visitors={visitors}
            attendance={attendance}
            followups={followups}
            recentActivities={recentActivities}
            onNavigateToView={handleViewChange}
            onSelectMemberByName={handleSelectMemberByName}
          />
        );

      case 'members':
        return (
          <MembersView
            members={members}
            onSelectMember={(id) => {
              setSelectedMemberId(id);
              setCurrentView('member-profile');
            }}
            onNavigateToRegister={() => handleViewChange('register-member')}
          />
        );

      case 'member-profile':
        return selectedMemberId ? (
          <MemberProfileView
            memberId={selectedMemberId}
            onBack={() => {
              setSelectedMemberId(null);
              setCurrentView('members');
            }}
            attendanceHistory={attendance}
            prayerRequests={prayerRequests}
            onUpdateMember={refreshAllData}
          />
        ) : (
          <div className="p-4 bg-white rounded-xl">Please select a member first.</div>
        );

      case 'visitors':
        return (
          <VisitorsView
            visitors={visitors}
            onUpdateVisitors={refreshAllData}
            onNavigateToRegister={() => handleViewChange('register-visitor')}
          />
        );

      case 'attendance':
        return (
          <AttendanceView
            attendance={attendance}
            members={members}
            onUpdateAttendance={refreshAllData}
          />
        );

      case 'followup':
        return (
          <FollowUpView
            followups={followups}
            onUpdateFollowUp={refreshAllData}
          />
        );

      case 'birthdays':
        return (
          <BirthdayView
            members={members}
          />
        );

      case 'reports':
        return (
          <ReportsView
            members={members}
            visitors={visitors}
            attendance={attendance}
            prayerRequests={prayerRequests}
            followups={followups}
          />
        );

      case 'settings':
        return (
          <SettingsView
            settings={appSettings}
            onSave={(updated) => {
              settingsService.saveSettings(updated, session?.churchId);
              setAppSettings(updated);
              refreshAllData();
            }}
            onRefreshData={refreshAllData}
          />
        );

      default:
        return <div className="p-4 bg-white rounded-xl">Page view configuration not found.</div>;
    }
  };

  // Determine if showing public entry or credential gates
  const isPublicView = ['landing', 'register-member', 'register-visitor', 'prayer-request', 'admin-login', 'member-login', 'member-dashboard', 'check-in'].includes(currentView);

  if (isPublicView) {
    return (
      <div className={`${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} min-h-screen relative transition-colors duration-300`}>
        {/* Dark mode float trigger */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="fixed bottom-5 right-5 p-3 rounded-full bg-white dark:bg-slate-800 shadow-md border dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:scale-105 z-50 transition-all cursor-pointer"
          title="Toggle mode"
        >
          {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {renderViewContent()}
      </div>
    );
  }

  return (
    <div className={`flex h-screen overflow-hidden ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-200`}>
      {/* Sidebar Panel */}
      <Sidebar
        currentView={currentView}
        onViewChange={handleViewChange}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
        currentUserRole={currentUserRole}
        logoText={appSettings.logoName}
        onLogout={handleLogout}
      />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <Navbar
          onMobileMenuToggle={() => setIsMobileSidebarOpen(true)}
          currentUserRole={currentUserRole}
          onRoleChange={setCurrentUserRole}
          onQuickNav={handleViewChange}
          churchName={appSettings.churchName}
          prayerRequests={prayerRequests}
          followups={followups}
          onRefreshData={refreshAllData}
        />

        {/* Content Canvas Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderViewContent()}
        </main>
      </div>

      {/* Floating Dark Mode Trigger */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed bottom-5 right-5 p-3 rounded-full bg-slate-800 dark:bg-white text-white dark:text-slate-800 shadow-lg hover:scale-105 z-50 transition-all cursor-pointer"
        title="Toggle dark theme"
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>
    </div>
  );
}
