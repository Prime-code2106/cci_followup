import { useState, useEffect } from 'react';
import { ArrowRight, Users, UserPlus, HeartHandshake, CalendarCheck, PhoneCall, Cake, Sparkles, QrCode } from 'lucide-react';
import { authService } from '../../services/authService';

interface LandingPageProps {
  onNavigate: (viewId: string) => void;
  churchName: string;
  mapName: string;
  activeChurchId: string;
  onChurchChange: (churchId: string) => void;
}

export default function LandingPage({ onNavigate, churchName, mapName, activeChurchId, onChurchChange }: LandingPageProps) {
  const [registeredChurches, setRegisteredChurches] = useState(() => authService.getChurchesList());

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
    return () => {
      active = false;
    };
  }, []);

  const features = [
    {
      title: "Member Management",
      description: "Securely register and organize member records, departments, and levels, moving away from easily misplaced journals.",
      icon: Users,
      color: "text-blue-600 bg-blue-50"
    },
    {
      title: "Visitor Tracking",
      description: "Instantly record first-time visitors, note down who invited them, and initiate immediate follow-up outreach workflows.",
      icon: UserPlus,
      color: "text-emerald-600 bg-emerald-50"
    },
    {
      title: "Attendance Monitoring",
      description: "Quickly mark and query attendance records for Sundays, Bible Studies, Prayer Meetings, and monthly MAP sessions.",
      icon: CalendarCheck,
      color: "text-indigo-600 bg-indigo-50"
    },
    {
      title: "Prayer Requests",
      description: "Log prayer requests in one centralized registry, supporting direct intercessory monitoring and updates as answered.",
      icon: HeartHandshake,
      color: "text-amber-600 bg-amber-50"
    },
    {
      title: "Follow-Up Care",
      description: "Identify and track individuals who need care, noting phone logs and home visits to ensure no one is left behind.",
      icon: PhoneCall,
      color: "text-rose-600 bg-rose-50"
    },
    {
      title: "Birthday Reminders",
      description: "Never miss a celebration! Highlighting today's and upcoming birthdays with single-click contact shortcuts.",
      icon: Cake,
      color: "text-purple-600 bg-purple-50"
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-between font-sans text-slate-800 dark:text-slate-100 transition-colors">
      {/* Top Banner Navigation */}
      <nav className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-4 px-4 sm:px-12 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-950 dark:text-white tracking-tight text-lg font-sans">AssemblyPortal</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-row items-stretch md:items-center gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => onNavigate('register-church')}
            className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-850 hover:bg-slate-50 border border-gray-200 px-3 py-2.5 rounded-xl transition-all cursor-pointer text-center"
          >
            Register Org / Church
          </button>
          <button
            onClick={() => onNavigate('member-login')}
            className="text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer text-center"
          >
            Member Login
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-all border border-blue-100 cursor-pointer text-center"
          >
            Leader Login
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-20 text-center space-y-6 sm:space-y-8">


          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl mx-auto break-words px-2">
            {churchName === 'Celebration Church International' ? (
              <>
                Celebration Church <span className="text-blue-600">International</span>
              </>
            ) : churchName === 'RCCG' ? (
              <>
                Redeemed Christian <span className="text-emerald-600">Church of God</span>
              </>
            ) : churchName === 'Winners Chapel' ? (
              <>
                Winners Chapel <span className="text-rose-600">International</span>
              </>
            ) : (
              <>
                {churchName}
              </>
            )}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-slate-500 max-w-2xl mx-auto font-medium leading-relaxed px-4">
            Helping us care for people intentionally. A platform for managing members, visitors, attendance and follow-up activities.
          </p>

          {/* Call To Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto pt-4 sm:pt-6">
            <button
              onClick={() => onNavigate('register-member')}
              className="flex items-center justify-between p-4 sm:p-5 bg-white border border-gray-100 hover:border-blue-400 rounded-2xl shadow-xs hover:shadow-md transition-all text-left cursor-pointer group"
            >
              <div>
                <span className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">New Member</span>
                <span className="block font-semibold text-slate-800 text-sm leading-tight">Register Profile</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
            </button>

            <button
              onClick={() => onNavigate('register-visitor')}
              className="flex items-center justify-between p-4 sm:p-5 bg-white border border-gray-100 hover:border-emerald-440 rounded-2xl shadow-xs hover:shadow-md transition-all text-left cursor-pointer group"
            >
              <div>
                <span className="block text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">Visitor</span>
                <span className="block font-semibold text-slate-800 text-sm leading-tight">First Timer Form</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-450 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
            </button>

            <button
              onClick={() => onNavigate('prayer-request')}
              className="flex items-center justify-between p-4 sm:p-5 bg-white border border-gray-100 hover:border-amber-440 rounded-2xl shadow-xs hover:shadow-md transition-all text-left cursor-pointer group"
            >
              <div>
                <span className="block text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">Intercession</span>
                <span className="block font-semibold text-slate-800 text-sm leading-tight">Submit Request</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-450 group-hover:translate-x-1 group-hover:text-amber-600 transition-all" />
            </button>

            <button
              onClick={() => onNavigate('check-in')}
              className="flex items-center justify-between p-4 sm:p-5 bg-white border border-gray-100 hover:border-indigo-400 rounded-2xl shadow-xs hover:shadow-md transition-all text-left cursor-pointer group"
            >
              <div>
                <span className="block text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">Attendance</span>
                <span className="block font-semibold text-slate-800 text-sm leading-tight">Express Check-In</span>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-450 group-hover:translate-x-1 group-hover:text-indigo-600 transition-all" />
            </button>
          </div>
        </div>

        {/* Features Grids */}
        <section className="bg-white border-t border-gray-100 py-16 sm:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center space-y-3 mb-12">
              <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight font-sans">
                Comprehensive Care Management
              </h2>
              <p className="text-gray-500 font-medium text-sm max-w-lg mx-auto leading-relaxed">
                Empowering leaders to transition from WhatsApp reminders and paper notebooks to a structured, integrated discipleship hub.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
              {features.map((feat, i) => {
                const Icon = feat.icon;
                return (
                  <div key={i} className="p-6 rounded-2xl border border-gray-100 bg-slate-50/50 hover:bg-white hover:shadow-md hover:border-blue-150 transition-all duration-300">
                    <div className={`p-3 w-12 h-12 rounded-xl mb-4 flex items-center justify-center ${feat.color}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-semibold text-slate-800 mb-2">{feat.title}</h3>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">{feat.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      {/* Footer Section */}
      <footer className="border-t border-gray-100 bg-slate-900 text-slate-400 py-12 px-6 text-sm font-sans">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center space-x-2 text-white font-bold text-base mb-1.5">
              <span>{churchName}</span>
            </div>
            <p className="text-xs text-slate-500 max-w-sm font-mono">
              Empowering our global community with automated, intentional care.
            </p>
          </div>
          
          <div className="flex items-center space-x-6 text-xs font-semibold text-slate-400">
            <span className="hover:text-blue-400 cursor-pointer">About {churchName}</span>
            <span className="hover:text-blue-400 cursor-pointer">Contact Care Team</span>
            <span className="hover:text-blue-400 cursor-pointer">Privacy Principles</span>
          </div>
        </div>
        <div className="max-w-5xl mx-auto border-t border-slate-800 text-center mt-8 pt-4 text-[10px] text-slate-600 font-semibold font-mono">
          {churchName} platform • All rights reserved © 2026.
        </div>
      </footer>
    </div>
  );
}
