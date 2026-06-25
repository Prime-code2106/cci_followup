import React, { useState } from 'react';
import { memberService } from '../../services/memberService';
import { authService, hashPassword } from '../../services/authService';
import { CheckCircle2, User, Phone, BookOpen, GraduationCap, Building, MapPin, Calendar, Mail, Sparkles, ArrowLeft, Building2, Lock, Eye, EyeOff } from 'lucide-react';

interface MemberRegistrationProps {
  onBackToPortal: () => void;
  mapName: string;
  defaultChurchId?: string;
}

export default function MemberRegistration({ onBackToPortal, mapName: propMapName, defaultChurchId = 'futamap' }: MemberRegistrationProps) {
  // Available multi-tenant churches
  const [registeredChurches, setRegisteredChurches] = useState(() => authService.getChurchesList());

  // Form State
  const [formData, setFormData] = useState({
    churchId: defaultChurchId,
    fullName: '',
    phoneNumber: '',
    gender: 'Male' as 'Male' | 'Female',
    department: '',
    level: '100 Level',
    faculty: '',
    residence: '',
    birthday: '',
    dateJoined: new Date().toISOString().split('T')[0],
    email: '',
    password: '',
  });

  // Toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  // State for dynamic inline church registration
  const [isAddingNewChurch, setIsAddingNewChurch] = useState(false);
  const [newChurchName, setNewChurchName] = useState('');
  const [newChurchMapName, setNewChurchMapName] = useState('');
  const [churchError, setChurchError] = useState('');

  // Errors & Status
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const levels = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', 'Postgraduate'];
  const faculties = [
    'School of Computing (SOC)',
    'School of Sciences (SOS)',
    'School of Engineering & Engineering Technology (SEET)',
    'School of Environmental Technology (SET)',
    'School of Earth & Mineral Sciences (SEMS)',
    'School of Agriculture & Agricultural Technology (SAAT)',
    'School of Health & Health Technology (SHHT)'
  ];

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'churchId' && value === 'ADD_NEW_CHURCH') {
      setIsAddingNewChurch(true);
      return;
    }
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error
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
    if (!formData.fullName.trim()) newErrors.fullName = "Full Name is required";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone Number is required";
    if (!formData.department.trim()) newErrors.department = "Department is required";
    if (!formData.level) newErrors.level = "Level is required";
    if (!formData.birthday) newErrors.birthday = "Birthday is required";
    if (!formData.password.trim()) {
      newErrors.password = "Password is required for portal access";
    } else if (formData.password.length < 4) {
      newErrors.password = "Password must be at least 4 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    setTimeout(() => {
      try {
        memberService.addMember({
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          gender: formData.gender,
          department: formData.department,
          level: formData.level,
          faculty: formData.faculty || "Sciences",
          residence: formData.residence || "FUTA Off-Campus",
          birthday: formData.birthday,
          dateJoined: formData.dateJoined,
          email: formData.email,
          mapName: activeMapName,
          passwordHash: hashPassword(formData.password)
        }, formData.churchId);
        
        setIsSuccess(true);
        // Reset form but preserve churchId for consecutive edits
        setFormData(prev => ({
          ...prev,
          fullName: '',
          phoneNumber: '',
          gender: 'Male',
          department: '',
          level: '100 Level',
          faculty: '',
          residence: '',
          birthday: '',
          dateJoined: new Date().toISOString().split('T')[0],
          email: '',
          password: '',
        }));
      } catch (e) {
        console.error(e);
      } finally {
        setIsSubmitting(false);
      }
    }, 600);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-10 px-4 sm:px-6">
      {/* Container */}
      <div className="w-full max-w-xl bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all">
        {/* Banner header */}
        <div className="bg-slate-900 text-white p-6 sm:p-8 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-1 text-blue-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Register as Member</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-sans">
              Join {selectedChurchDetails?.name || 'Church'}
            </h2>
          </div>
          <button
            onClick={onBackToPortal}
            className="flex items-center text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 px-3.5 py-1.8 rounded-xl transition-all cursor-pointer"
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
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 font-sans">Registration Successful!</h3>
                <p className="text-sm text-gray-500 leading-relaxed max-w-md mx-auto">
                  Thank you for registering. Your information has been received successfully in the <strong className="text-slate-800">{activeMapName} ({selectedChurchDetails?.name})</strong> care directory.
                </p>
              </div>
              <div className="pt-6 flex flex-col sm:flex-row justify-center gap-3">
                <button
                  onClick={() => setIsSuccess(false)}
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-semibold rounded-xl hover:bg-blue-700 transition-all cursor-pointer"
                >
                  Register Another Member
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
                  <label htmlFor="churchId" className="flex items-center text-xs font-bold text-blue-600 uppercase tracking-wider">
                    <Building2 className="w-3.5 h-3.5 mr-1.5" />
                    Select Target Church
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
                          className="block w-full px-3 py-1.8 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-blue-500 text-slate-800 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">MAP ID / Group Name (Cell, Area, etc.)</label>
                        <input 
                          type="text" 
                          value={newChurchMapName} 
                          onChange={(e) => setNewChurchMapName(e.target.value)}
                          placeholder="e.g. Hope Group"
                          className="block w-full px-3 py-1.8 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:ring-blue-500 text-slate-800 font-medium"
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

                <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                  Your record will be securely isolated in {selectedChurchDetails?.name || 'the church'}'s private database group (<strong className="text-slate-600 font-semibold">{activeMapName}</strong>).
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
                      placeholder="e.g. Samuel Adebayo"
                      className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm transition-all text-gray-800 ${
                        errors.fullName ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-white'
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
                    className="block w-full px-3 py-2 border border-gray-200 rounded-xl text-sm transition-all focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
              </div>

              {/* Phone & Email */}
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
                      placeholder="e.g. +234 812..."
                      className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm transition-all text-gray-800 ${
                        errors.phoneNumber ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-white'
                      }`}
                    />
                  </div>
                  {errors.phoneNumber && <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Email Address <span className="text-gray-400">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. student@futa.edu.ng"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm transition-all focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Create Password */}
              <div className="p-4 bg-blue-50/45 border border-blue-100 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Create Portal Password <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">
                    For Secure Portal Login
                  </span>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create your custom password"
                    className={`block w-full pl-10 pr-10 py-2 border rounded-xl text-sm transition-all text-gray-800 ${
                      errors.password ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password ? (
                  <p className="text-xs text-red-500">{errors.password}</p>
                ) : (
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Choose a password to securely access your personal dashboard later.
                  </p>
                )}
              </div>

              {/* Department & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="department" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Department <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="department"
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      placeholder="e.g. Computer Science"
                      className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm transition-all text-gray-800 ${
                        errors.department ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-white'
                      }`}
                    />
                  </div>
                  {errors.department && <p className="text-xs text-red-500 mt-1">{errors.department}</p>}
                </div>

                <div>
                  <label htmlFor="level" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Level <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <select
                      id="level"
                      name="level"
                      value={formData.level}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm transition-all focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    >
                      {levels.map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Faculty & Residence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="faculty" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Faculty/School
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400 animate-none shrink-0" />
                    <select
                      id="faculty"
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm transition-all focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    >
                      <option value="">Select Faculty</option>
                      {faculties.map(f => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="residence" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Residence / Hostel Name
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="residence"
                      type="text"
                      name="residence"
                      value={formData.residence}
                      onChange={handleInputChange}
                      placeholder="e.g. FUTA Hostel A / Off-Campus"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm transition-all focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Birth & Date Joined MAP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="birthday" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Birthday <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="birthday"
                      type="date"
                      name="birthday"
                      value={formData.birthday}
                      onChange={handleInputChange}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-xl text-sm transition-all text-gray-800 ${
                        errors.birthday ? 'border-red-400 focus:ring-red-500 focus:border-red-500 bg-red-50/10' : 'border-gray-200 focus:ring-blue-500 focus:border-blue-500 bg-white'
                      }`}
                    />
                  </div>
                  {errors.birthday && <p className="text-xs text-red-500 mt-1">{errors.birthday}</p>}
                </div>

                <div>
                  <label htmlFor="dateJoined" className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Date Joined MAP / Cell Group
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="dateJoined"
                      type="date"
                      name="dateJoined"
                      value={formData.dateJoined}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl text-sm transition-all focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-500/10 active:scale-98 transition-all flex items-center justify-center cursor-pointer disabled:opacity-55"
                >
                  {isSubmitting ? 'Registering Member...' : `Submit Registration to ${selectedChurchDetails?.name || 'Church'}`}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
