import React, { useState } from 'react';
import { authService } from '../../services/authService';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, User, Sparkles, ArrowLeft, AlertCircle, CheckCircle, RefreshCw, KeyRound, Key } from 'lucide-react';

interface MemberLoginProps {
  onLoginSuccess: (session: any) => void;
  onBackToPortal: () => void;
}

export default function MemberLogin({ onLoginSuccess, onBackToPortal }: MemberLoginProps) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forgot Password flow states
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailOrPhone, setResetEmailOrPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Quick Demo account choices (taken from members.ts)
  const demoAccounts = [
    { label: 'Samuel (Email)', value: 'samuel.adebayo@futa.edu.ng', pass: '+234 812 345 6789' },
    { label: 'Esther (Phone)', value: '+234 803 456 7890', pass: 'celebration2026' }
  ];

  const handleSuggestClick = (val: string, pass: string) => {
    setEmailOrPhone(val);
    setPassword(pass);
    setError('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim()) {
      setError('Please enter your Registered email address or phone number.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your account password.');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const session = await authService.memberLogin(emailOrPhone, password, rememberMe);
      setSuccess(`Welcome back, ${session.fullName}! Accessing your Member Dashboard...`);
      
      setTimeout(() => {
        onLoginSuccess(session);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmailOrPhone.trim()) {
      setError('Please enter your registered email or phone number.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setResetSuccess('');
    setIsLoading(true);

    try {
      await authService.resetMemberPassword(resetEmailOrPhone, newPassword);
      setResetSuccess('Password reset successfully! You can now log in with your new password.');
      setEmailOrPhone(resetEmailOrPhone);
      setPassword(newPassword);
      
      setTimeout(() => {
        setIsForgotPassword(false);
        setResetSuccess('');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error executing password reset.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Return to Landing shortcut */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center bg-transparent">
        <button
          onClick={onBackToPortal}
          className="flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-150 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-2" />
          Back to Public Portal
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-lg p-8 space-y-6 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700" />

        {/* Forgot Password View */}
        {isForgotPassword ? (
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
                <KeyRound className="w-5 h-5 animate-bounce" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight font-sans">Reset Member Password</h1>
                <p className="text-xs text-slate-400 font-medium">
                  Enter your credentials to claim or set a new password
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

            {resetSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2"
              >
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{resetSuccess}</span>
              </motion.div>
            )}

            <form onSubmit={handlePasswordResetSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Registered Phone or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={resetEmailOrPhone}
                    onChange={(e) => {
                      setResetEmailOrPhone(e.target.value);
                      setError('');
                    }}
                    placeholder="e.g. samuel.adebayo@futa.edu.ng or +234..."
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                  New Password (min 6 chars)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Create secure password"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="password"
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="Re-enter password"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center disabled:opacity-60 cursor-pointer"
              >
                {isLoading ? 'Resetting Password...' : 'Reset & Save Password'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setError('');
                  }}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-all cursor-pointer"
                >
                  Return to Member Login
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/10">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-sans">Member Login Portal</h1>
                <p className="text-xs text-slate-400 font-medium">
                  Log in to access your personal dashboard & history
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

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Phone or Email */}
              <div className="space-y-1.5">
                <label htmlFor="emailOrPhone" className="block text-xs font-bold text-gray-400 uppercase tracking-widest">
                  Phone Number or Email address
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    id="emailOrPhone"
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => {
                      setEmailOrPhone(e.target.value);
                      setError('');
                    }}
                    disabled={isLoading}
                    placeholder="e.g. +234 812 345... or email address"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <label htmlFor="password">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotPassword(true);
                      setError('');
                      setResetEmailOrPhone(emailOrPhone);
                    }}
                    className="text-[10px] text-blue-600 hover:text-blue-800 lowercase normal-case tracking-normal cursor-pointer"
                  >
                    Forgot Password?
                  </button>
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
                    placeholder="Enter account password"
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm transition-all focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-normal">
                  💡 Log in using the <strong>custom password</strong> you choose during registration. For older profiles, use your phone number (e.g. <code>+234 812 345 6789</code>) or the classic <code>celebration2026</code>.
                </p>
              </div>

              {/* Remember Me */}
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

              {/* Enter Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/10 cursor-pointer transition-all flex items-center justify-center disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="flex items-center space-x-2">
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Verifying Identity...</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Enter My Portal</span>
                  </span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Security Stamp info */}
        <p className="text-[10px] text-slate-400 font-semibold font-mono text-center">
          Secure End-To-End Authenticated Session • 2026
        </p>
      </motion.div>
    </div>
  );
}
