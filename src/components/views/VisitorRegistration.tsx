import React, { useState } from 'react';
import { visitorService } from '../../services/visitorService';
import { authService } from '../../services/authService';
import { CheckCircle, Heart, User, Phone, Sparkles, MessageCircle, Calendar, ArrowLeft, Building2 } from 'lucide-react';

interface VisitorRegistrationProps {
  onBackToPortal: () => void;
  mapName: string;
  defaultChurchId?: string;
}

export default function VisitorRegistration({ onBackToPortal, mapName: propMapName, defaultChurchId = 'futamap' }: VisitorRegistrationProps) {
  // Available multi-tenant churches
  const [registeredChurches, setRegisteredChurches] = useState(() => authService.getChurchesList());

  // Form State
  const [formData, setFormData] = useState({
    churchId: defaultChurchId,
    fullName: '',
    phoneNumber: '',
    gender: 'Male' as 'Male' | 'Female',
    invitedBy: '',
    dateVisited: new Date().toISOString().split('T')[0],
    prayerRequest: '',
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

  const handleAddNewChurchSubmit = () => {
    if (!newChurchName.trim()) {
      setChurchError('Church name is required.');
      return;
    }
    try {
      const created = authService.registerChurch(
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
    if (!formData.fullName.trim()) newErrors.fullName = "Visitors need a Full Name";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone Number is required";
    if (!formData.invitedBy.trim()) newErrors.invitedBy = "Please mention who invited you (write 'Self' if none)";
    if (!formData.dateVisited) newErrors.dateVisited = "Visit Date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        visitorService.addVisitor({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          invitedBy: formData.invitedBy,
          dateVisited: formData.dateVisited,
          prayerRequest: formData.prayerRequest || undefined,
        }, formData.churchId);

        setIsSuccess(true);
        // Reset form but preserve churchId for consecutive entries
        setFormData(prev => ({
          ...prev,
          fullName: '',
          phoneNumber: '',
          gender: 'Male',
          invitedBy: '',
          dateVisited: new Date().toISOString().split('T')[0],
          prayerRequest: '',
        }));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSubmitting(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all">
        {/* Banner header */}
        <div className="bg-emerald-800 text-white p-6 sm:p-8 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1 text-emerald-300 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-355" />
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none">First-Time Visitor Portal</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans">
              Welcome to {selectedChurchDetails?.name || 'our Fellowship'}!
            </h2>
          </div>
          <button
            onClick={onBackToPortal}
            className="flex items-center text-xs font-semibold text-emerald-100 hover:text-white bg-emerald-950 px-3.5 py-1.8 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Home
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 sm:p-8">
          {isSuccess ? (
            <div className="text-center py-8 space-y-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
                <Heart className="w-9 h-9 fill-current" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 font-sans">Welcome Home!</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
                  We are extremely happy to have you worship with us. Someone from our <strong className="text-emerald-700">{selectedChurchDetails?.name}</strong> care team will connect with you soon.
                </p>
              </div>
              <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => setIsSuccess(false)}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
                >
                  Register Another Visitor
                </button>
                <button
                  onClick={onBackToPortal}
                  className="px-5 py-2.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl hover:bg-gray-200 transition-all cursor-pointer"
                >
                  Return to Homepage
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Church Selector (Multi-Tenant Hub Gateway) */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="churchId" className="flex items-center text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 mr-1.5" />
                    Select Church You Visited
                  </label>
                  {!isAddingNewChurch && (
                    <button 
                      type="button" 
                      onClick={() => setIsAddingNewChurch(true)}
                      className="text-[10px] text-emerald-700 font-extrabold hover:underline"
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
                    className="block w-full px-3 py-2 border border-slate-200 rounded-xl text-sm transition-all focus:ring-emerald-500 focus:border-emerald-500 bg-white text-slate-800 font-semibold"
                  >
                    {registeredChurches.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                    <option value="ADD_NEW_CHURCH" className="text-emerald-700 font-bold bg-emerald-50/20">+ Add Your New Church...</option>
                  </select>
                )}

                {isAddingNewChurch && (
                  <div className="p-3.5 bg-white border border-emerald-100 rounded-xl space-y-3.5 shadow-2xs mt-1 animate-fade-in">
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
                          className="block w-full px-3 py-1.8 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-emerald-500 text-slate-800 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">MAP ID / Group Name (Cell, Area, etc.)</label>
                        <input 
                          type="text" 
                          value={newChurchMapName} 
                          onChange={(e) => setNewChurchMapName(e.target.value)}
                          placeholder="e.g. Hope Group"
                          className="block w-full px-3 py-1.8 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-emerald-500 text-slate-800 font-medium"
                        />
                      </div>
                      {churchError && <p className="text-[10px] text-red-500 font-semibold">{churchError}</p>}
                      <button
                        type="button"
                        onClick={handleAddNewChurchSubmit}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-2xs"
                      >
                        Create & Select Church
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-[10px] text-slate-400 font-medium animate-fade-in">
                  Your tracking record will be securely routed in {selectedChurchDetails?.name || 'the church'}'s separate directory (<strong className="text-slate-600 font-semibold">{activeMapName}</strong>).
                </p>
              </div>

              {/* Name & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
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
                      placeholder="e.g. Tunde Bakare"
                      className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm transition-all text-gray-800 ${
                        errors.fullName ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 bg-white'
                      }`}
                    />
                  </div>
                  {errors.fullName && <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="gender" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Gender
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-sm transition-all focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Phone & Date Visited */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      placeholder="e.g. +234 815..."
                      className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm transition-all text-gray-800 ${
                        errors.phoneNumber ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 bg-white'
                      }`}
                    />
                  </div>
                  {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
                </div>

                <div>
                  <label htmlFor="dateVisited" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Date Visited <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="dateVisited"
                      type="date"
                      name="dateVisited"
                      value={formData.dateVisited}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm transition-all text-gray-800 ${
                        errors.dateVisited ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 bg-white'
                      }`}
                    />
                  </div>
                  {errors.dateVisited && <p className="text-xs text-red-500 mt-1">{errors.dateVisited}</p>}
                </div>
              </div>

              {/* Invited By */}
              <div>
                <label htmlFor="invitedBy" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Who Invited You? <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="invitedBy"
                    type="text"
                    name="invitedBy"
                    value={formData.invitedBy}
                    onChange={handleInputChange}
                    placeholder="e.g. Samuel Adebayo, write 'Self' if you came on your own"
                    className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm transition-all text-gray-800 ${
                      errors.invitedBy ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-emerald-500 focus:border-emerald-500 bg-white'
                    }`}
                  />
                </div>
                {errors.invitedBy && <p className="text-xs text-red-500 mt-1">{errors.invitedBy}</p>}
              </div>

              {/* Prayer Request (optional) */}
              <div>
                <label htmlFor="prayerRequest" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  Are there any prayer requests you would like our team to join you in? <span className="text-gray-450">(Optional)</span>
                </label>
                <div className="relative">
                  <MessageCircle className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <textarea
                    id="prayerRequest"
                    name="prayerRequest"
                    value={formData.prayerRequest}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="e.g. Healing, wisdom, provision, academic guidance..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm transition-all focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-800 placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-lg shadow-emerald-500/10 active:scale-98 transition-all flex items-center justify-center cursor-pointer disabled:opacity-55"
                >
                  {isSubmitting ? 'Sending details to follow-up team...' : `Submit Welcome Registration to ${selectedChurchDetails?.name}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
