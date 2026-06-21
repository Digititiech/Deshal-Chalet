/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { PropertiesPage } from './pages/PropertiesPage';
import { BookingsPage } from './pages/BookingsPage';
import { UsersPage } from './pages/UsersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { LoginPage } from './pages/LoginPage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import {
  Bell,
  Menu,
  X,
  Calendar,
  Clock,
  Sparkles,
  RefreshCw,
  CalendarPlus,
  LogOut,
  Loader2
} from 'lucide-react';
import { getCurrentlySimulatedUser, setCurrentlySimulatedUser, DatabaseService } from './services/db';
import { Notification } from './types';

// ─────────────────────────────────────────────────────────
// Inner Dashboard Shell (rendered after auth is confirmed)
// ─────────────────────────────────────────────────────────
function DashboardShell() {
  const { profile, signOut, isLoading } = useAuth();

  const [currentTab, setCurrentTab] = React.useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState<boolean>(false);
  const [sessionKey, setSessionKey] = React.useState<number>(0);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = React.useState(false);
  const [timeStr, setTimeStr] = React.useState<string>('');
  const [forceOpenBookingAdd, setForceOpenBookingAdd] = React.useState<number>(0);
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const currentUser = getCurrentlySimulatedUser();

  // Sync the simulated user to the authenticated profile on first load
  React.useEffect(() => {
    if (profile) {
      setCurrentlySimulatedUser(profile);
      setSessionKey(k => k + 1);
    }
  }, [profile?.id]);

  const selectTab = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  const handleUserChanged = () => {
    setSessionKey(prev => prev + 1);
    setMobileMenuOpen(false);
    loadNotifications();
  };

  const loadNotifications = async () => {
    const list = await DatabaseService.getNotifications();
    setNotifications(list);
  };

  React.useEffect(() => {
    loadNotifications();
    const timer = setInterval(() => {
      const date = new Date();
      setTimeStr(date.toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, [sessionKey]);

  const handleMarkNotifRead = async (id: string) => {
    await DatabaseService.markNotificationRead(id);
    loadNotifications();
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut();
    setIsSigningOut(false);
  };

  const currentGregorianDate = new Date().toLocaleDateString('ar-OM', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage key={sessionKey} onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'properties':
        return <PropertiesPage key={sessionKey} />;
      case 'bookings':
        return <BookingsPage key={sessionKey} forceOpenAdd={forceOpenBookingAdd} />;
      case 'users':
        return <UsersPage key={sessionKey} />;
      case 'reports':
        return <ReportsPage key={sessionKey} />;
      case 'settings':
        return <SettingsPage key={sessionKey} />;
      default:
        return <DashboardPage key={sessionKey} onNavigate={(tab) => setCurrentTab(tab)} />;
    }
  };

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c1222] flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-amber-500/20">
            <img src="/logo.png" alt="شعار ذا ستار شاليه" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>جارٍ تحميل النظام...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c1222] text-slate-100 flex relative overflow-x-hidden" dir="rtl">

      {/* Mesh background gradient */}
      <div className="mesh-gradient" />

      {/* 1. Desktop & Mobile Sidebar */}
      <div className={`fixed inset-y-0 right-0 w-64 frosted border-l border-white/10 text-slate-100 flex flex-col z-40 transition-transform duration-300 shadow-2xl ${
        mobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
      }`}>
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={selectTab}
          onUserChanged={handleUserChanged}
        />
      </div>

      {/* Mobile Back-drop overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-950/60 z-30 md:hidden animate-fadeIn backdrop-blur-sm"
        />
      )}

      {/* 2. Main Content container wrapper */}
      <div className="flex-1 flex flex-col md:mr-64 min-w-0 z-10">

        {/* Top bar Area */}
        <header className="frosted border-b border-white/10 px-6 py-4 flex items-center justify-between sticky top-0 z-20 select-none text-slate-100">

          {/* Right Area: Mobile toggle & date/time */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:bg-white/10 rounded-xl md:hidden cursor-pointer"
              aria-label="قائمة التنقل"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-[11px] font-extrabold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" /> {currentGregorianDate}
              </span>
              <span className="text-[10px] font-mono text-slate-400 font-bold mt-0.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-blue-400" /> توقيت مسقط: {timeStr || '...'}
              </span>
            </div>
          </div>

          {/* Center System Title */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-bold text-slate-300">
            <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>نظام "ذا ستار شاليه" الرقمي لإدارة المرافق والتشغيل</span>
          </div>

          {/* Left area: Actions + Notifications + User badge */}
          <div className="flex items-center gap-2">

            {/* Quick Booking Button */}
            <button
              onClick={() => {
                setCurrentTab('bookings');
                setForceOpenBookingAdd(prev => prev + 1);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-[11px] font-extrabold shadow-md shadow-blue-900/40 hover:shadow-lg transition-all cursor-pointer border border-blue-400/20 active:scale-95 shrink-0"
              title="إجراء حجز جديد فوري"
            >
              <CalendarPlus className="w-4 h-4" />
              <span className="hidden sm:inline">+ حجز سريع</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => handleUserChanged()}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl transition-all cursor-pointer"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl transition-all relative cursor-pointer"
                aria-label="الإشعارات"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -left-1 w-5 h-5 bg-rose-500 border-2 border-[#0c1222] rounded-full text-[9px] font-black text-white flex items-center justify-center animate-bounce">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute left-0 mt-2 w-80 frosted border border-white/10 rounded-2xl shadow-xl z-50 py-3 overflow-hidden text-right">
                  <div className="px-4 pb-2 border-b border-white/10 flex items-center justify-between">
                    <h4 className="text-xs font-black text-white">سجل الإشعارات</h4>
                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-blue-400 font-bold">تنبيهات حية</span>
                  </div>
                  <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-xs py-6 text-center">لا توجد تنبيهات حتى اللحظة.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3.5 hover:bg-white/5 flex flex-col gap-1 transition-colors ${!n.is_read ? 'bg-blue-500/[0.04]' : ''}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-white">{n.title}</span>
                            {!n.is_read && (
                              <button
                                onClick={() => handleMarkNotifRead(n.id)}
                                className="text-[9px] text-blue-400 font-bold hover:underline cursor-pointer"
                              >
                                تحديد كمقروء
                              </button>
                            )}
                          </div>
                          <p className="text-slate-300 text-[11px] leading-relaxed select-text">{n.message}</p>
                          <span className="text-[8.5px] text-slate-400 font-mono mt-1">{new Date(n.created_at).toLocaleTimeString('ar-OM')}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Badge + Sign Out */}
            <div className="hidden md:flex items-center gap-1.5 p-1.5 bg-white/5 border border-white/10 rounded-xl">
              <div className="w-7 h-7 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                <img
                  src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=40'}
                  alt={currentUser.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xs font-bold text-slate-200 px-1 max-w-[120px] truncate">{currentUser.full_name}</span>
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all cursor-pointer disabled:opacity-50"
                title="تسجيل الخروج"
                aria-label="تسجيل الخروج"
              >
                {isSigningOut
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <LogOut className="w-3.5 h-3.5" />
                }
              </button>
            </div>

          </div>

        </header>

        {/* 3. Dynamic Page Content */}
        <main id="applet-main-stage" className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          {renderActiveTab()}
        </main>

        {/* Footer */}
        <footer className="py-4 text-center text-[10px] text-slate-400 font-semibold border-t border-white/10 select-none bg-[#0c1222]/40 backdrop-blur-md">
          <span>نظام "ذا ستار شاليه" لإدارة الضيافة والمخيمات الفلكية © 2026. جميع الحقوق محفوظة.</span>
        </footer>

      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Root Guard: show Login or Dashboard based on auth state
// ─────────────────────────────────────────────────────────
function AppGuard() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0c1222] flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-2xl ring-2 ring-amber-500/20">
            <img src="/logo.png" alt="شعار ذا ستار شاليه" className="w-full h-full object-cover" />
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            <span>جارٍ تحميل النظام...</span>
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <DashboardShell /> : <LoginPage />;
}

// ─────────────────────────────────────────────────────────
// Default Export: App Root with Auth Provider
// ─────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <AppGuard />
    </AuthProvider>
  );
}
