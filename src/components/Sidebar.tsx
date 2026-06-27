import {
  LayoutDashboard,
  Users,
  UserPlus,
  CalendarCheck,
  HeartHandshake,
  PhoneCall,
  Cake,
  BarChart3,
  Settings,
  X,
  Sparkles,
  LogOut
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: UserRole;
  logoText: string;
  onLogout?: () => void;
}

export default function Sidebar({
  currentView,
  onViewChange,
  isOpen,
  onClose,
  currentUserRole,
  logoText,
  onLogout
}: SidebarProps) {
  // Define menu items
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'MAP Leader'] },
    { id: 'members', name: 'Members', icon: Users, roles: ['Admin', 'MAP Leader'] },
    { id: 'visitors', name: 'Visitors', icon: UserPlus, roles: ['Admin', 'MAP Leader'] },
    { id: 'attendance', name: 'Attendance', icon: CalendarCheck, roles: ['Admin', 'MAP Leader'] },
    { id: 'followup', name: 'Follow-Up Care', icon: PhoneCall, roles: ['Admin', 'MAP Leader'] },
    { id: 'prayer-requests', name: 'Prayer Requests', icon: HeartHandshake, roles: ['Admin', 'MAP Leader', 'Member'] },
    { id: 'birthdays', name: 'Birthdays', icon: Cake, roles: ['Admin', 'MAP Leader'] },
    { id: 'reports', name: 'Reports', icon: BarChart3, roles: ['Admin'] },
    { id: 'settings', name: 'Settings', icon: Settings, roles: ['Admin'] },
  ];

  // Filter menu items by user role
  const allowedMenuItems = menuItems.filter(item => item.roles.includes(currentUserRole));

  const handleNavClick = (viewId: string) => {
    onViewChange(viewId);
    onClose(); // Close mobile drawer on item tap
  };

  return (
    <>
      {/* Mobile Sidebar backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar Wrapper */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col justify-between transition-all duration-300 z-50 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:static lg:block shrink-0'
        }`}
      >
        <div>
          {/* Header */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="font-bold text-white tracking-tight text-sm font-sans">
                {logoText}
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Role Banner */}
          <div className="mx-4 my-3 px-3 py-2.5 bg-slate-800/60 rounded-xl flex items-center space-x-2.5">
            <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center font-bold text-[10px] text-blue-400 uppercase">
              {currentUserRole.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Logged In As</p>
              <p className="text-xs font-semibold text-slate-200 mt-1">{currentUserRole}</p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="px-3 py-3 space-y-1 overflow-y-auto">
            {allowedMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id || (item.id === 'members' && currentView === 'member-profile');
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/10 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 mr-3 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                  {item.name}
                </button>
              );
            })}
          </nav>
          
          {onLogout && (
            <div className="px-3 pb-3">
              <button
                onClick={() => {
                  onLogout();
                  onClose();
                }}
                className="w-full flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold text-red-400 hover:text-red-350 hover:bg-red-950/20 transition-all cursor-pointer group"
              >
                <LogOut className="w-4 h-4 mr-3 shrink-0 text-red-500 group-hover:text-red-400" />
                Logout Admin
              </button>
            </div>
          )}
        </div>

        {/* Footer / Credits */}
        <div className="p-4 border-t border-slate-800 text-center">
          <p className="text-[10px] text-slate-500 font-medium font-mono">
            Celebration Church International © 2026
          </p>
          <p className="text-[9px] text-slate-600 mt-0.5 leading-none">
            Caring for people intentionally.
          </p>
        </div>
      </aside>
    </>
  );
}
