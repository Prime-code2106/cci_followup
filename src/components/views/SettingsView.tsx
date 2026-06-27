import React, { useState, useRef } from 'react';
import { AppSettings } from '../../types';
import { settingsService } from '../../services/settingsService';
import { 
  Settings, 
  Save, 
  Sparkles, 
  Sliders, 
  ShieldCheck, 
  RefreshCw, 
  Download, 
  Upload, 
  Trash2, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Info,
  Server
} from 'lucide-react';

interface SettingsViewProps {
  settings: AppSettings;
  onSave: (updated: AppSettings) => void;
  onRefreshData?: () => void;
}

export default function SettingsView({ settings, onSave, onRefreshData }: SettingsViewProps) {
  const [formData, setFormData] = useState<AppSettings>({
    mapName: settings.mapName,
    churchName: settings.churchName,
    themeColor: settings.themeColor,
    logoName: settings.logoName
  });

  const [isSaved, setIsSaved] = useState(false);
  const [dbSuccessMessage, setDbSuccessMessage] = useState('');
  const [dbErrorMessage, setDbErrorMessage] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      settingsService.saveSettings(formData);
      onSave(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  // Export database backup file
  const handleExportBackup = () => {
    try {
      const backupData: Record<string, string | null> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('futamap_') || key.startsWith('last_selected_'))) {
          backupData[key] = localStorage.getItem(key);
        }
      }

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${formData.churchName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setDbSuccessMessage('Active database backup file downloaded successfully!');
      setTimeout(() => setDbSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setDbErrorMessage('Failed to compile and export database.');
      setTimeout(() => setDbErrorMessage(''), 4000);
    }
  };

  // Restore database backup file
  const handleImportRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const backupData = JSON.parse(result);

        if (typeof backupData !== 'object' || backupData === null) {
          throw new Error('Invalid database backup format.');
        }

        const keys = Object.keys(backupData);
        const hasChurchKeys = keys.some(key => key.startsWith('futamap_'));
        if (!hasChurchKeys) {
          throw new Error('Selected backup does not appear to contain valid church portal datasets.');
        }

        // Apply backup keys to localStorage
        keys.forEach(key => {
          const val = backupData[key];
          if (val !== null) {
            localStorage.setItem(key, val);
          }
        });

        setDbSuccessMessage('Database successfully restored! Instantly synchronizing tables and views...');
        if (onRefreshData) {
          onRefreshData();
        }
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        setTimeout(() => {
          setDbSuccessMessage('');
          window.location.reload();
        }, 1500);
      } catch (err: any) {
        console.error(err);
        setDbErrorMessage(err.message || 'Failed to parse database backup. Make sure the file is a valid JSON backup.');
        setTimeout(() => setDbErrorMessage(''), 5000);
      }
    };
    reader.readAsText(file);
  };

  // Clear database to pristine factory seeds
  const handleResetToFactory = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('futamap_') || key.startsWith('last_selected_'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      sessionStorage.clear();

      setDbSuccessMessage('Successfully restored pristine demonstration seeds! Reloading application container...');
      setConfirmReset(false);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error(err);
      setDbErrorMessage('Failed to trigger database seed factory.');
      setTimeout(() => setDbErrorMessage(''), 4000);
    }
  };

  // Complete data wipe for a blank production ready slate
  const handleClearDatabase = () => {
    try {
      localStorage.setItem('futamap_members', '[]');
      localStorage.setItem('futamap_visitors', '[]');
      localStorage.setItem('futamap_attendance', '[]');
      localStorage.setItem('futamap_prayer_requests', '[]');
      localStorage.setItem('futamap_activities', '[]');
      localStorage.setItem('futamap_followups', '[]');
      localStorage.setItem('futamap_fellowship_notes', '[]');
      
      setDbSuccessMessage('All directory registries and logs have been cleared! Your workspace is ready for live production deployment.');
      setConfirmClear(false);
      if (onRefreshData) {
        onRefreshData();
      }
      setTimeout(() => setDbSuccessMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setDbErrorMessage('Failed to wipe records.');
      setTimeout(() => setDbErrorMessage(''), 4000);
    }
  };

  const colorPresets = [
    { name: 'Classic Church Blue', value: '#2563eb' },
    { name: 'Eco Emerald Green', value: '#10b981' },
    { name: 'Royal Indigo', value: '#4f46e5' },
    { name: 'Sunset Amber', value: '#f59e0b' },
    { name: 'Deep Crimson', value: '#dc2626' }
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in font-sans">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold text-slate-150 tracking-tight font-sans">Platform Preferences Configuration</h1>
        <p className="text-xs text-gray-500 font-medium">Fine-tune church titles, default small grouping map identifiers, theme behaviors, and data backups.</p>
      </div>

      {/* Database Feedback Messages */}
      {dbSuccessMessage && (
        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-150 flex items-center space-x-2.5 text-xs font-semibold animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{dbSuccessMessage}</span>
        </div>
      )}

      {dbErrorMessage && (
        <div className="p-4 bg-rose-50 text-rose-800 rounded-2xl border border-rose-150 flex items-center space-x-2.5 text-xs font-semibold animate-fade-in shadow-xs">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{dbErrorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Core Settings Form */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6 h-fit">
          <div className="border-b border-gray-100 pb-4 flex items-center space-x-2">
            <Sliders className="w-5 h-5 text-gray-400 font-mono" />
            <h3 className="text-sm font-bold text-slate-900">Customizable Options Registry</h3>
          </div>

          {isSaved && (
            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 flex items-center space-x-2.5 text-xs font-semibold animate-fade-in">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Success! Platform preferences have been saved and applied system-wide.</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Logo Name & MAP small group name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="set-logoName" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Platform Branding Label</label>
                <input
                  id="set-logoName"
                  type="text"
                  value={formData.logoName}
                  onChange={(e) => setFormData(prev => ({ ...prev, logoName: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-gray-150 rounded-xl text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label htmlFor="set-mapName" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Primary MAP Identify</label>
                <input
                  id="set-mapName"
                  type="text"
                  value={formData.mapName}
                  onChange={(e) => setFormData(prev => ({ ...prev, mapName: e.target.value }))}
                  className="w-full px-3.5 py-2 border border-gray-150 rounded-xl text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Church assembly Name */}
            <div>
              <label htmlFor="set-churchName" className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5 font-mono">Corporate Church Assembly Name</label>
              <input
                id="set-churchName"
                type="text"
                value={formData.churchName}
                onChange={(e) => setFormData(prev => ({ ...prev, churchName: e.target.value }))}
                className="w-full px-3.5 py-2 border border-gray-150 rounded-xl text-xs font-semibold text-gray-800 bg-white focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                required
              />
            </div>

            {/* Theme choices */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest leading-none font-mono">Platform Color Styling</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {colorPresets.map((col, index) => (
                  <div
                    key={index}
                    onClick={() => setFormData(prev => ({ ...prev, themeColor: col.value }))}
                    className={`p-3 rounded-2xl border text-xs font-bold flex items-center space-x-2.5 cursor-pointer hover:border-gray-200 transition-all ${
                      formData.themeColor === col.value
                        ? 'border-blue-500 bg-blue-50/10 text-slate-900 ring-2 ring-blue-500/10'
                        : 'border-gray-100 text-slate-500 bg-gray-50/20'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full border border-gray-200 shrink-0" style={{ backgroundColor: col.value }} />
                    <span className="truncate">{col.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Save trigger button */}
            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                type="submit"
                className="px-4.5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center shadow-md shadow-blue-500/10 cursor-pointer transition-all"
              >
                <Save className="w-4 h-4 mr-1.5 shrink-0" />
                Apply Platform Changes
              </button>
            </div>
          </form>
        </div>

        {/* Database & Persistence Control Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6 h-fit">
          <div className="border-b border-gray-100 pb-4 flex items-center space-x-2">
            <Database className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-bold text-slate-900">Database & Backup Center</h3>
          </div>

          <p className="text-[11px] text-gray-500 leading-relaxed">
            All registered members, visitor directories, check-in records, follow-up timelines, and messages are compiled and cached locally inside your browser storage. Keep your data portable and safe using these backup and maintenance tools.
          </p>

          <div className="space-y-3 pt-1">
            {/* Download Backup */}
            <button
              type="button"
              onClick={handleExportBackup}
              className="w-full py-2.5 px-3.5 bg-slate-550 hover:bg-slate-600 text-white border border-slate-500 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <Download className="w-4 h-4 shrink-0 text-slate-200" />
              Download JSON Database
            </button>

            {/* Upload/Restore Backup */}
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImportRestore}
                accept=".json"
                className="hidden"
                id="database-restore-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-150 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4 shrink-0 text-indigo-500" />
                Restore Backup File
              </button>
            </div>

            <div className="pt-3 border-t border-gray-100 space-y-2.5">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">Maintenance Tasks</span>
              
              {/* Reset to Factory Seeds */}
              {confirmReset ? (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-150 space-y-2 text-center">
                  <span className="block text-[10px] font-semibold text-amber-800 leading-normal">
                    This will delete your active edits and reset the system with pristine demonstration profiles. Proceed?
                  </span>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={handleResetToFactory}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black rounded-lg cursor-pointer transition-all"
                    >
                      Yes, reset seeds
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="w-full py-2.5 px-3.5 bg-white hover:bg-amber-50 border border-gray-150 text-gray-650 hover:text-amber-800 hover:border-amber-250 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                  Restore Factory Seed Data
                </button>
              )}

              {/* Complete Production Wipe */}
              {confirmClear ? (
                <div className="p-3 bg-red-50 rounded-2xl border border-red-150 space-y-2 text-center">
                  <span className="block text-[10px] font-semibold text-red-800 leading-normal">
                    Warning! This completely empties all member registers, visitor lists, and logs. This action is irreversible.
                  </span>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={handleClearDatabase}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-[10px] font-black rounded-lg cursor-pointer transition-all"
                    >
                      Yes, clear records
                    </button>
                    <button
                      onClick={() => setConfirmClear(false)}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-[10px] font-bold rounded-lg cursor-pointer transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="w-full py-2.5 px-3.5 bg-white hover:bg-red-50 border border-gray-150 text-gray-650 hover:text-red-700 hover:border-red-250 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  Wipe Database for Production
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cloud Integration Guidance Panel */}
      <div className="p-5 bg-slate-50 border border-slate-100 rounded-3xl flex items-start space-x-3.5 text-xs text-slate-700 leading-relaxed font-sans">
        <Server className="w-6 h-6 text-slate-450 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-extrabold text-slate-800">Cloud API Integration & Live Persistence</p>
          <p className="text-slate-500 leading-relaxed font-medium">
            This platform is fully designed to scale. It comes with a modular <code>/src/services/*</code> structure matching standard SaaS specifications. You can easily plug in database solutions like Supabase, Firebase Firestore, or custom REST APIs by updating the fetch methods, while keeping the responsive visual components completely intact.
          </p>
        </div>
      </div>
    </div>
  );
}
