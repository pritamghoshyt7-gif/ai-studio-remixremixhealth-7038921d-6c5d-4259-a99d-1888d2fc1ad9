import React, { useState } from 'react';
import { UserProfile, UserRole } from '../types';
import {
  Activity,
  Bell,
  Shield,
  Radio,
  Building2,
  ChevronDown,
  User,
  LogOut,
  Sparkles,
  X,
  CheckCircle2,
} from 'lucide-react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';

interface NavbarProps {
  currentUser: UserProfile;
  onChangeUserRole: (role: UserRole) => void;
  onlineGpsCount: number;
  pendingAlertsCount: number;
  onOpenNotifications: () => void;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  onChangeUserRole,
  onlineGpsCount,
  pendingAlertsCount,
  onOpenNotifications,
  onToggleSidebar,
}) => {
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);

  const availableRoles: UserRole[] = [
    'Super Admin',
    'Admin',
    'Centre Operator',
    'Collector',
    'Lab Receiver',
    'Accounts Manager',
  ];

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error('Google Sign-in popup cancelled or error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-md sm:px-6">
      {/* Brand & Left Elements */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-700 to-indigo-600 shadow-md shadow-blue-500/20 text-white font-black text-lg">
            HP
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm tracking-tight text-slate-900">HEALTH POINT</span>
              <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[9px] font-black uppercase text-blue-700">
                ERP
              </span>
            </div>
            <p className="hidden text-[10px] font-semibold text-slate-400 sm:block">
              Diagnostic Sample Logistics Management System
            </p>
          </div>
        </div>
      </div>

      {/* Middle Status Indicators */}
      <div className="hidden items-center gap-3 md:flex">
        {/* Firestore Connection */}
        <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
          </span>
          Firestore Live Sync
        </div>

        {/* GPS Hardware Telemetry */}
        <div className="flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-1 text-xs font-semibold text-purple-700 border border-purple-200/60">
          <Radio className="h-3 w-3" />
          {onlineGpsCount} GPS Units Online
        </div>

        {/* Central Hub Pin */}
        <div className="flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          <Building2 className="h-3 w-3 text-blue-600" />
          Kolkata Central Hub
        </div>
      </div>

      {/* Right User & Role Switcher Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          className="relative rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 transition"
          title="Notifications"
        >
          <Bell className="h-4 w-4" />
          {pendingAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-xs">
              {pendingAlertsCount}
            </span>
          )}
        </button>

        {/* Role Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-2.5 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition"
          >
            <Shield className="h-3.5 w-3.5 text-blue-600" />
            <span className="max-w-[100px] truncate sm:max-w-none">{currentUser.role}</span>
            <ChevronDown className="h-3 w-3 opacity-60" />
          </button>

          {isRoleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl z-50">
              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Switch Operational Role
              </div>
              {availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => {
                    onChangeUserRole(role);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-semibold text-left transition ${
                    currentUser.role === role
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{role}</span>
                  {currentUser.role === role && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Account / Google Login Profile */}
        <div className="relative">
          <button
            onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
            className="flex items-center gap-2 rounded-xl p-1 text-slate-700 hover:bg-slate-100 transition"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
              {currentUser.name.charAt(0)}
            </div>
            <span className="hidden text-xs font-bold sm:block">{currentUser.name}</span>
          </button>

          {isProfileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl z-50">
              <div className="border-b border-slate-100 pb-2 mb-2">
                <div className="font-bold text-xs text-slate-900">{currentUser.name}</div>
                <div className="text-[11px] text-slate-500 truncate">{currentUser.email}</div>
                <div className="mt-1 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold text-blue-700">
                  {currentUser.role}
                </div>
              </div>

              <button
                onClick={handleGoogleSignIn}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <User className="h-4 w-4 text-blue-600" />
                Google Account Sync
              </button>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
