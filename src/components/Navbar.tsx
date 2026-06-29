import React, { useState } from 'react';
import { Menu, ShieldAlert, Sparkles, UserPlus, HeartHandshake, User, Bell, Check, ExternalLink } from 'lucide-react';
import { UserRole, PrayerRequest, FollowUp } from '../types';
import { prayerService } from '../services/prayerService';
import { followUpService } from '../services/followUpService';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onQuickNav: (view: string) => void;
  churchName: string;
  prayerRequests: PrayerRequest[];
  followups: FollowUp[];
  onRefreshData: () => Promise<void>;
}

export default function Navbar({
  onMobileMenuToggle,
  currentUserRole,
  onRoleChange,
  onQuickNav,
  churchName,
  prayerRequests,
  followups,
  onRefreshData
}: NavbarProps) {
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'prayers' | 'followups'>('prayers');

  const todayStr = new Date().toISOString().split('T')[0];
  const pendingPrayers = prayerRequests.filter(p => p.status === 'Praying' || p.status === 'Ongoing');
  const pendingFollowups = followups.filter(f => 
    (f.status === 'Needs Follow Up' || f.status === 'Contacted') && (!f.remindDate || f.remindDate <= todayStr)
  );
  const totalNotifications = pendingPrayers.length + pendingFollowups.length;

  const showAlerts = currentUserRole === 'Admin' || currentUserRole === 'MAP Leader';

  const handleMarkPrayerAnswered = async (id: string) => {
    try {
      await prayerService.updatePrayerRequestStatus(id, 'Answered');
      await onRefreshData();
    } catch (err) {
      console.error("Error marking prayer answered:", err);
    }
  };

  const handleMarkFollowUpRestored = async (id: string) => {
    try {
      await followUpService.updateStatus(id, 'Restored');
      await onRefreshData();
    } catch (err) {
      console.error("Error marking follow-up restored:", err);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-xs">
      {/* Title / Mobile trigger */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMobileMenuToggle}
          className="p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <span className="hidden sm:inline font-semibold text-gray-900 text-sm tracking-tight font-sans">
            {churchName}
          </span>
          <span className="inline sm:hidden font-semibold text-gray-900 text-xs tracking-tight bg-blue-50 px-2 py-0.5 rounded-md">
            {currentUserRole === 'Member' ? 'Gateway' : 'Leader Board'}
          </span>
        </div>
      </div>

      {/* Role Picker & Core Forms Quick Launcher */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        {/* Quick Forms Trigger (only show for Member) */}
        {currentUserRole === 'Member' && (
          <div className="hidden md:flex items-center space-x-2 mr-2">
            <button
              onClick={() => onQuickNav('register-member')}
              className="flex items-center text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all shadow-2xs border border-blue-100 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 mr-1" />
              Join MAP
            </button>
            <button
              onClick={() => onQuickNav('register-visitor')}
              className="flex items-center text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all shadow-2xs border border-emerald-100 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              First-Timer
            </button>
            <button
              onClick={() => onQuickNav('prayer-request')}
              className="flex items-center text-xs font-semibold px-3 py-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-all shadow-2xs border border-amber-100 cursor-pointer"
            >
              <HeartHandshake className="w-3.5 h-3.5 mr-1" />
              Prayer Request
            </button>
          </div>
        )}

        {/* Notifications Bell Dropdown */}
        {showAlerts && (
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-slate-100 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative cursor-pointer"
              title="Admin Alerts"
            >
              <Bell className="w-5 h-5" />
              {totalNotifications > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-600 text-white font-bold text-[9px] rounded-full flex items-center justify-center animate-pulse">
                  {totalNotifications}
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsNotificationsOpen(false)} />
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 overflow-hidden text-sm animate-fade-in">
                  {/* Header */}
                  <div className="p-4 border-b border-gray-100 bg-slate-50 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">Admin Care Alerts</h3>
                      <p className="text-[10px] text-gray-505 font-medium mt-0.5">Real-time follow-up and prayer grids</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-50 text-blue-600 rounded-full">
                      {totalNotifications} Pending
                    </span>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-gray-100 text-xs">
                    <button
                      onClick={() => setActiveTab('prayers')}
                      className={`flex-1 py-2.5 text-center font-bold border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'prayers'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Prayers ({pendingPrayers.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('followups')}
                      className={`flex-1 py-2.5 text-center font-bold border-b-2 transition-colors cursor-pointer ${
                        activeTab === 'followups'
                          ? 'border-blue-600 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Follow-Ups ({pendingFollowups.length})
                    </button>
                  </div>

                  {/* Body List */}
                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 bg-white">
                    {activeTab === 'prayers' ? (
                      pendingPrayers.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-xs font-medium">
                          No pending prayer requests. All grids are covered!
                        </div>
                      ) : (
                        pendingPrayers.map(pr => (
                          <div key={pr.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-gray-900 text-xs">{pr.fullName}</span>
                              <span className="text-[9px] text-gray-400 font-mono font-medium">{pr.dateSubmitted}</span>
                            </div>
                            <p className="text-xs text-gray-650 mt-1 line-clamp-2 italic">
                              "{pr.request}"
                            </p>
                            <div className="flex justify-between items-center mt-3">
                              <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {pr.status}
                              </span>
                              <button
                                onClick={() => handleMarkPrayerAnswered(pr.id)}
                                className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-650 hover:text-emerald-500 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Mark Answered</span>
                              </button>
                            </div>
                          </div>
                        ))
                      )
                    ) : (
                      pendingFollowups.length === 0 ? (
                        <div className="p-6 text-center text-gray-500 text-xs font-medium">
                          No outstanding follow-ups. Outstanding care!
                        </div>
                      ) : (
                        pendingFollowups.map(f => (
                          <div key={f.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                            <div className="flex justify-between items-start">
                              <span className="font-semibold text-gray-900 text-xs">{f.name}</span>
                              <span className="text-[9px] text-gray-400 font-mono font-medium">{f.phoneNumber}</span>
                            </div>
                            <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                              <strong>Reason:</strong> {f.reason}
                            </p>
                            <div className="flex justify-between items-center mt-3">
                              <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                                {f.status}
                              </span>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleMarkFollowUpRestored(f.id)}
                                  className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-650 hover:text-emerald-500 cursor-pointer"
                                  title="Mark Completed"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    setIsNotificationsOpen(false);
                                    onQuickNav('followup');
                                  }}
                                  className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-600 hover:text-blue-500 cursor-pointer"
                                  title="Navigate to Follow-Up"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Dynamic Testing Tooltip indicator */}
        <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-50 border border-slate-100 rounded-xl">
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-[10px] sm:text-xs font-semibold text-gray-500 font-mono hidden xs:inline shrink-0">Role Sim:</span>
          <select
            value={currentUserRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="text-xs font-semibold text-blue-600 py-0.5 px-1 bg-transparent border-0 focus:ring-0 cursor-pointer font-sans"
          >
            <option value="Admin">Admin</option>
            <option value="MAP Leader">MAP Leader</option>
            <option value="Member">Member</option>
          </select>
        </div>
      </div>
    </header>
  );
}
