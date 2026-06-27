import React, { useState } from 'react';
import { prayerService } from '../../services/prayerService';
import { authService } from '../../services/authService';
import { HeartHandshake, CheckCircle, User, Phone, ClipboardCheck, MessageSquare, ArrowLeft, Sparkles, Building2 } from 'lucide-react';

interface PrayerSubmissionProps {
  onBackToPortal: () => void;
  mapName: string;
  defaultChurchId?: string;
}

export default function PrayerSubmission({ onBackToPortal, mapName: propMapName, defaultChurchId = 'futamap' }: PrayerSubmissionProps) {
  // Available multi-tenant churches
  const [registeredChurches, setRegisteredChurches] = useState(() => authService.getChurchesList());

  const [formData, setFormData] = useState({
    churchId: defaultChurchId,
    fullName: '',
    phoneNumber: '',
    request: '',
  });

  // State for dynamic inline church registration
  const [isAddingNewChurch, setIsAddingNewChurch] = useState(false);
  const [newChurchName, setNewChurchName] = useState('');
  const [newChurchMapName, setNewChurchMapName] = useState('');
  const [churchError, setChurchError] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Resolve active map name based on chosen church
  const selectedChurchDetails = registeredChurches.find(c => c.id === formData.churchId);
  const activeMapName = selectedChurchDetails ? selectedChurchDetails.mapName : 'MAP Alpha';

  const handleAddNewChurchSubmit = async () => {
    if (!newChurchName.trim()) {
      setChurchError('Church name is required.');
      return;
    }
    try {
      const created = await authService.registerChurch(
        newChurchName.trim(), 
        newChurchMapName.trim() || `${newChurchName.trim()} Group`,
        '', 
        'welcome2026'
      );
      const updatedList = authService.getChurchesList();
      setRegisteredChurches(updatedList);
      
      setFormData(prev => ({ ...prev, churchId: created.id }));
      setIsAddingNewChurch(false);
      setNewChurchName('');
      setNewChurchMapName('');
      setChurchError('');
    } catch (err: any) {
      setChurchError(err.message || 'Error occurred.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'churchId' && value === 'ADD_NEW_CHURCH') {
      setIsAddingNewChurch(true);
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Please provide your name";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Please provide your phone number";
    if (!formData.request.trim()) newErrors.request = "Please type your prayer request";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        prayerService.addPrayerRequest({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          request: formData.request,
        }, formData.churchId);

        setIsSuccess(true);
        // Reset form but preserve churchId for consecutive edits
        setFormData(prev => ({
          ...prev,
          fullName: '',
          phoneNumber: '',
          request: '',
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-10 px-4 sm:px-6 font-sans">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1 text-slate-400 mb-1">
              <HeartHandshake className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Intercessory Support Registry</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans">
              Log Intercessory Request
            </h2>
          </div>
          <button
            onClick={onBackToPortal}
            className="flex items-center text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Home
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto border border-amber-100 shadow-2xs">
                <ClipboardCheck className="w-9 h-9" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 font-sans">Prayer Request Logged</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
                  Your intercession card has been logged successfully. The prayer team at <strong className="text-slate-800">{selectedChurchDetails?.name}</strong> will be interceding for you.
                </p>
              </div>
              <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => setIsSuccess(false)}
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-all cursor-pointer"
                >
                  Submit Another Request
                </button>
                <button
                  onClick={onBackToPortal}
                  className="px-5 py-2.5 bg-gray-100 fallback-accent hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Return to Homepage
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Info alert */}
              <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start space-x-3 text-amber-800">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs font-semibold leading-relaxed">
                  "Confess your faults one to another, and pray one for another, that ye may be healed. The effectual fervent prayer of a righteous man availeth much." — James 5:16
                </p>
              </div>

              {/* Church Selector (Multi-Tenant Hub Gateway) */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="churchId" className="flex items-center text-xs font-bold text-blue-600 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 mr-1.5" />
                    Select Target Church for Prayers
                  </label>
                  {!isAddingNewChurch && (
                    <button 
                      type="button" 
                      onClick={() => setIsAddingNewChurch(true)}
                      className="text-[10px] text-blue-600 font-extrabold hover:underline"
                    >
                      + Add New Church
                    </button>
                  )}
                </div>
                
                {!isAddingNewChurch && (
                  <select
                    id="churchId"
                    name="churchId"
                    value={formData.churchId}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm transition-all focus:ring-blue-500 focus:border-blue-500 bg-white text-slate-800 font-semibold"
                  >
                    {registeredChurches.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="ADD_NEW_CHURCH" className="text-blue-600 font-bold bg-blue-50/20">+ Add Your New Church...</option>
                  </select>
                )}

                {isAddingNewChurch && (
                  <div className="p-3.5 bg-white border border-blue-100 rounded-xl space-y-3.5 shadow-2xs mt-1 animate-fade-in">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                      <span className="text-xs font-bold text-slate-800">Register Custom Church</span>
                      <button 
                        type="button" 
                        onClick={() => {
                          setIsAddingNewChurch(false);
                          setFormData(prev => ({ ...prev, churchId: defaultChurchId }));
                        }}
                        className="text-[10px] text-red-500 font-bold hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Church Name *</label>
                        <input 
                          type="text" 
                          value={newChurchName} 
                          onChange={(e) => setNewChurchName(e.target.value)}
                          placeholder="e.g. Daystar Christian Centre"
                          className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-blue-500 text-slate-800 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">MAP ID / Group Name (Cell, Area, etc.)</label>
                        <input 
                          type="text" 
                          value={newChurchMapName} 
                          onChange={(e) => setNewChurchMapName(e.target.value)}
                          placeholder="e.g. Hope Group"
                          className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-blue-500 text-slate-800 font-medium"
                        />
                      </div>
                      {churchError && <p className="text-[10px] text-red-500 font-semibold">{churchError}</p>}
                      <button
                        type="button"
                        onClick={handleAddNewChurchSubmit}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs"
                      >
                        Create & Select Church
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 font-medium animate-fade-in">
                  Your intercession request will be confidentially stored inside {selectedChurchDetails?.name || 'the church'}'s directory structure.
                </p>
              </div>

              {/* Full Name */}
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="fullName"
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="e.g. Samuel Adebayo"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm transition-all text-gray-800 ${
                      errors.fullName ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-white'
                    }`}
                  />
                </div>
                {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
              </div>

              {/* Phone Number */}
              <div>
                <label htmlFor="phoneNumber" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="phoneNumber"
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. +234 812 345..."
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm transition-all text-gray-800 ${
                      errors.phoneNumber ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-white'
                    }`}
                  />
                </div>
                {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
              </div>

              {/* Long Prayer request */}
              <div>
                <label htmlFor="request" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Your Prayer Request <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  <textarea
                    id="request"
                    name="request"
                    value={formData.request}
                    onChange={handleInputChange}
                    rows={6}
                    placeholder="Feel free to express your exact prayer points or thanksgivings in detail..."
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-xl text-sm transition-all text-gray-800 ${
                      errors.request ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-white'
                    }`}
                  />
                </div>
                {errors.request && <p className="text-xs text-red-500 mt-1">{errors.request}</p>}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/10 active:scale-98 transition-all flex items-center justify-center cursor-pointer disabled:opacity-55"
                >
                  {isSubmitting ? 'Logging intercessory request...' : `Log Prayer Request with ${selectedChurchDetails?.name}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
