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
import { 
  Bell, 
  Menu, 
  X, 
  Calendar, 
  Clock, 
  ShieldAlert, 
  Settings as SettingsIcon,
  HelpCircle,
  Sparkles,
  RefreshCw,
  CalendarPlus
} from 'lucide-react';
import { getCurrentlySimulatedUser, setCurrentlySimulatedUser, DatabaseService } from './services/db';
import { Notification } from './types';

export default function App() {
  const [currentTab, setCurrentTab] = React.useState<string>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState<boolean>(false);
  
  // State to force-reload pages when simulated user role changes
  const [sessionKey, setSessionKey] = React.useState<number>(0);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [showNotificationsDropdown, setShowNotificationsDropdown] = React.useState(false);
  const [timeStr, setTimeStr] = React.useState<string>('');
  const [forceOpenBookingAdd, setForceOpenBookingAdd] = React.useState<number>(0);

  const currentUser = getCurrentlySimulatedUser();
  
  const selectTab = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  const handleUserChanged = () => {
    // Reset key to re-trigger useEffect on all child pages with new mock roles!
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
    
    // Dynamic Clock
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
          
          {/* Right Area: Mobile sandwich toggle & quick status */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-300 hover:bg-white/10 rounded-xl md:hidden cursor-pointer"
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

          {/* Center Title or quick switch notice if not Super user */}
          <div className="hidden lg:flex items-center gap-2 text-[11px] font-bold text-slate-300">
            <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>نظام "ذا ستار شاليه" الرقمي لإدارة المرافق والتشغيل</span>
          </div>

          {/* Left area: Notification Center with dropdown */}
          <div className="flex items-center gap-3">
            
            {/* Quick booking trigger */}
            <button 
              onClick={() => {
                setCurrentTab('bookings');
                setForceOpenBookingAdd(prev => prev + 1);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-[11px] font-extrabold shadow-md shadow-blue-900/40 hover:shadow-lg transition-all cursor-pointer border border-blue-400/20 active:scale-95 shrink-0"
              title="إجراء حجز جديد فوري"
            >
              <CalendarPlus className="w-4 h-4" />
              <span>+ حجز سريع</span>
            </button>

            {/* Quick reload state button */}
            <button 
              onClick={() => handleUserChanged()}
              className="p-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl transition-all cursor-pointer"
              title="تحديث البيانات يدبوي"
            >
              <RefreshCw className="w-4.5 h-4.5" />
            </button>

            {/* Notification Menu */}
            <div className="relative">
              <button 
                onClick={() => setShowNotificationsDropdown(!showNotificationsDropdown)}
                className="p-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl transition-all relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1 -left-1 w-5 h-5 bg-rose-500 border-2 border-[#0c1222] rounded-full text-[9px] font-black text-white flex items-center justify-center animate-bounce">
                    {unreadNotifCount}
                  </span>
                )}
              </button>

              {showNotificationsDropdown && (
                <div className="absolute left-0 mt-2 w-80 frosted border border-white/10 rounded-2xl shadow-xl z-50 py-3 overflow-hidden text-right">
                  <div className="px-4 pb-2 border-b border-white/10 flex items-center justify-between">
                    <h4 className="text-xs font-black text-white">سجل الإشعارات المستلمة</h4>
                    <span className="text-[9px] bg-white/10 px-2 py-0.5 rounded text-blue-400 font-bold">تنبيهات حية</span>
                  </div>
                  
                  <div className="divide-y divide-white/5 max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-slate-400 text-xs py-6 text-center">لا توجد تنبيهات مستلمة حتى اللحظة.</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3.5 hover:bg-white/5 flex flex-col gap-1 transition-colors ${!n.is_read ? 'bg-blue-500/[0.04]' : ''}`}>
                          <div className="flex items-center justify-between">
                            <span className="font-extrabold text-xs text-white">{n.title}</span>
                            {!n.is_read && (
                              <button 
                                onClick={() => handleMarkNotifRead(n.id)}
                                className="text-[9px] text-blue-400 font-bold hover:underline"
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

            {/* Simulated environment state badge */}
            <div className="hidden md:flex items-center gap-2 p-1.5 bg-white/5 border border-white/10 rounded-xl pr-3.5">
              <span className="text-xs font-bold text-slate-200"> {currentUser.full_name} </span>
              <div className="w-8 h-8 rounded-lg overflow-hidden bg-white/10">
                <img 
                  src={currentUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=40'} 
                  alt={currentUser.full_name} 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>

          </div>

        </header>

        {/* 3. Dynamic Page Content stage */}
        <main id="applet-main-stage" className="flex-1 p-6 md:p-8 overflow-y-auto space-y-6">
          {renderActiveTab()}
        </main>

        {/* Minimal professional credit footer */}
        <footer className="py-4 text-center text-[10px] text-slate-400 font-semibold border-t border-white/10 select-none bg-[#0c1222]/40 backdrop-blur-md">
          <span>نظام "ذا ستار شاليه" لإدارة الضيافة والمخيمات الفلكية © 2026. جميع الحقوق محفوظة لوزارة السياحة العمانية.</span>
        </footer>

      </div>

    </div>
  );
}
