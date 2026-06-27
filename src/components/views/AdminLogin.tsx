import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, Building2, Sparkles, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

interface AdminLoginProps {
  onLoginSuccess: (session: { churchId: string; churchName: string; mapName: string; logoName: string }) => void;
  onBackToPortal: () => void;
  initialIsRegistering?: boolean;
}

export default function AdminLogin({ onLoginSuccess, onBackToPortal, initialIsRegistering }: AdminLoginProps) {
  const [isRegistering, setIsRegistering] = useState(initialIsRegistering || false);
  const [churchName, setChurchName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Registration Specific States
  const [regChurchName, setRegChurchName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regMapName, setRegMapName] = useState('MAP');
  const [regLogoName, setRegLogoName] = useState('');

  const registeredChurches = authService.getChurchesList();

  const handleSuggestClick = (name: string) => {
    setChurchName(name);
    setError('');
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regChurchName.trim()) {
      setError('Please enter your Organization / Church name.');
      return;
    }
    if (regChurchName.trim().length < 3) {
      setError('Organization name must be at least 3 characters.');
      return;
    }
    if (!regPassword.trim()) {
      setError('Please set an administrator password.');
      return;
    }
    if (regPassword.length < 4) {
      setError('Password must be at least 4 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!regMapName.trim()) {
      setError('Please specify a small group mapping identifier (e.g. MAP, Cell, Group).');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const regResult = await authService.registerChurch(
        regChurchName,
        regMapName,
        regLogoName || `${regChurchName} Admin`,
        regPassword
      );

      setSuccess(`Organization "${regResult.name}" registered successfully! Setting up isolated tenant...`);

      // Auto-login immediately
      setTimeout(async () => {
        try {
          const session = await authService.login(regChurchName, regPassword, rememberMe);
          setSuccess(`Welcome to your new portal! Logging into ${session.churchName}...`);
          setTimeout(() => {
            onLoginSuccess(session);
          }, 1000);
        } catch (loginErr: any) {
          setError('Church registered, but failed auto-login. Please sign in manually.');
          setIsRegistering(false);
          setChurchName(regChurchName);
          setIsLoading(false);
        }
      }, 1200);

    } catch (err: any) {
      setError(err.message || 'Failed to register organization.');
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchName.trim()) {
      setError('Please enter your Church Name.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your administrator password.');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const session = await authService.login(churchName, password, rememberMe);
      setSuccess(`Welcome back! Successfully logged into ${session.churchName}.`);
      
      // Delay success transfer to let user see success state/toast
      setTimeout(() => {
        onLoginSuccess(session);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Return to Landing shortcut */}
      <div className="w-full max-w-md mb-4 flex justify-start">
        <button
          onClick={onBackToPortal}
          className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-150 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-2" />
          Back to Public Portal
        </button>
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-lg p-8 space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-emerald-600 to-indigo-600" />

        {/* Logo / Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">
              {isRegistering ? 'Register Organization' : 'Leader Admin Login'}
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              {isRegistering 
                ? 'Create a private, isolated tenant system for your assembly'
                : 'Access your church\'s care and follow-up dashboard'
              }
            </p>
          </div>
        </div>

        {/* Error / Success Notifications */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{error}</span>
          </motion.div>
        )}

        {success && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2 animate-pulse"
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{success}</span>
          </motion.div>
        )}

        {isRegistering ? (
          /* REGISTRATION FORM */
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Church/Organization Name */}
            <div className="space-y-1.5">
              <label htmlFor="regChurchName" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                Organization / Church Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="regChurchName"
                  type="text"
                  value={regChurchName}
                  onChange={(e) => {
                    setRegChurchName(e.target.value);
                    setError('');
                  }}
                  disabled={isLoading}
                  placeholder="e.g. Glory Center, Hope Church, Fellowship Hub"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm transition-all text-gray-850 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Small Group Identifier */}
            <div className="space-y-1.5">
              <label htmlFor="regMapName" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                Small Group Name (e.g. MAP, Cell, Care Group)
              </label>
              <input
                id="regMapName"
                type="text"
                value={regMapName}
                onChange={(e) => {
                  setRegMapName(e.target.value);
                  setError('');
                }}
                disabled={isLoading}
                placeholder="e.g. Life Cell, MAP Group, Care Unit"
                className="block w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm transition-all text-gray-850 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
              />
            </div>

            {/* Admin Password */}
            <div className="space-y-1.5">
              <label htmlFor="regPassword" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                Administrator Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="regPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={regPassword}
                  onChange={(e) => {
                    setRegPassword(e.target.value);
                    setError('');
                  }}
                  disabled={isLoading}
                  placeholder="Set custom password"
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm transition-all text-gray-850 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <label htmlFor="regConfirmPassword" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="regConfirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={regConfirmPassword}
                  onChange={(e) => {
                    setRegConfirmPassword(e.target.value);
                    setError('');
                  }}
                  disabled={isLoading}
                  placeholder="Re-enter password"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm transition-all text-gray-850 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
                />
              </div>
            </div>

            {/* Register Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-sm rounded-xl focus:outline-hidden shadow-md shadow-emerald-500/10 cursor-pointer transition-all flex items-center justify-center disabled:opacity-60 disabled:pointer-events-none"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Provisioning Account...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Register & Auto Login</span>
                </span>
              )}
            </button>

            {/* Toggle back to Login */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(false);
                  setError('');
                  setSuccess('');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-all cursor-pointer underline decoration-dotted"
              >
                Already have an account? Sign in here
              </button>
            </div>
          </form>
        ) : (
          /* LOGIN FORM */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Church Name */}
            <div className="space-y-1.5">
              <label htmlFor="churchName" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                Church / Organization Tenant Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="churchName"
                  type="text"
                  value={churchName}
                  onChange={(e) => {
                    setChurchName(e.target.value);
                    setError('');
                  }}
                  disabled={isLoading}
                  placeholder="e.g. Celebration Church, RCCG, Winners Chapel"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm transition-all text-gray-850 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
                />
              </div>
              {/* Quick Suggestions Helper */}
              {registeredChurches.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] text-gray-400 font-medium">Registered:</span>
                  {registeredChurches.slice(0, 5).map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => handleSuggestClick(ch.name)}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-all cursor-pointer font-mono font-bold"
                    >
                      {ch.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                <label htmlFor="password">Administrator Password</label>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  disabled={isLoading}
                  placeholder="Enter password"
                  className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm transition-all text-gray-850 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-lg cursor-pointer"
                />
                <label htmlFor="rememberMe" className="ml-2 block text-xs font-semibold text-slate-500 cursor-pointer select-none">
                  Remember my session
                </label>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 mt-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-xl focus:outline-hidden shadow-md shadow-blue-500/10 cursor-pointer transition-all flex items-center justify-center disabled:opacity-60 disabled:pointer-events-none"
            >
              {isLoading ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>Authenticating Tenant...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>Verify & Enter Dashboard</span>
                </span>
              )}
            </button>

            {/* Toggle back to Register */}
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRegistering(true);
                  setError('');
                  setSuccess('');
                }}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-all cursor-pointer underline decoration-dotted"
              >
                Register a new Church or Organization
              </button>
            </div>
          </form>
        )}

        {/* Security Warning Label */}
        <p className="text-[10px] text-slate-400 font-semibold font-mono text-center">
          Multi-Tenant Isolation Protocol Active • AssemblyPortal v22.1
        </p>
      </motion.div>
    </div>
  );
}
