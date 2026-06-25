import { Menu, ShieldAlert, Sparkles, UserPlus, HeartHandshake, User } from 'lucide-react';
import { UserRole } from '../types';

interface NavbarProps {
  onMobileMenuToggle: () => void;
  currentUserRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onQuickNav: (view: string) => void;
  churchName: string;
}

export default function Navbar({
  onMobileMenuToggle,
  currentUserRole,
  onRoleChange,
  onQuickNav,
  churchName
}: NavbarProps) {
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
