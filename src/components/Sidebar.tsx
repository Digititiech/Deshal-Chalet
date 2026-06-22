/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  LayoutDashboard,
  Home,
  CalendarDays,
  Users,
  FilePieChart,
  Settings as SettingsIcon,
  Database,
  Wifi,
  WifiOff,
  UserCircle2,
} from 'lucide-react';
import { Profile } from '../types';
import { DatabaseService } from '../services/db';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: Profile;
  onEditProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, currentUser, onEditProfile }) => {
  const [isLive] = React.useState(DatabaseService.isLiveSupabase());

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'properties', label: 'المرافق الشاليهات', icon: Home },
    { id: 'bookings', label: 'سجل الحجوزات', icon: CalendarDays },
    ...(currentUser.role === 'super_admin' ? [{ id: 'users', label: 'إدارة الصلاحيات', icon: Users }] : []),
    { id: 'reports', label: 'التقارير والتدقيق', icon: FilePieChart },
    { id: 'settings', label: 'إعدادات النظام', icon: SettingsIcon },
  ];

  const roleLabelsAr: Record<string, string> = {
    super_admin: 'المدير العام',
    company_manager: 'مدير الشركة',
    property_manager: 'مدير المرفق',
    booking_staff: 'موظف الحجوزات',
  };

  const roleColors: Record<string, string> = {
    super_admin: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    company_manager: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    property_manager: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    booking_staff: 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
  };

  return (
    <aside id="sidebar-container" className="w-full h-full text-slate-100 flex flex-col justify-between">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shadow-amber-900/20 ring-1 ring-amber-500/20 flex-shrink-0">
            <img src="/logo.png" alt="شعار ذا ستار شاليه" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-l from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent">ذا ستار شاليه</h1>
            <p className="text-[10px] text-slate-400 font-medium">نظام التشغيل الرقمي v2.5</p>
          </div>
        </div>
      </div>

      {/* Connection Indicator */}
      <div className="px-6 py-2 bg-white/5 border-b border-white/10 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-blue-400" />
          <span>حالة الاتصال بالبيانات</span>
        </div>
        {isLive ? (
          <span className="flex items-center gap-1 text-emerald-400 font-semibold animate-pulse">
            <Wifi className="w-3 h-3" /> قاعدة لايف
          </span>
        ) : (
          <span className="flex items-center gap-1 text-amber-300 font-medium font-mono">
            <WifiOff className="w-3 h-3" /> تخزين محلي
          </span>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-link-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white/10 text-white font-bold border border-white/10 shadow-lg scale-[1.02]'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              <IconComponent className={`w-4.5 h-4.5 ${isActive ? 'text-blue-400 stroke-[2.5]' : 'opacity-80'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Current User Profile Card (replaces role simulator) */}
      <div className="p-4 bg-white/5 border-t border-white/10">
        <button
          onClick={onEditProfile}
          className="w-full flex items-center gap-3 p-2.5 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group text-right"
          title="تعديل الملف الشخصي"
        >
          <div className="relative flex-shrink-0">
            {currentUser.avatar_url ? (
              <img
                src={currentUser.avatar_url}
                alt={currentUser.full_name}
                className="w-9 h-9 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
                <UserCircle2 className="w-5 h-5 text-slate-400" />
              </div>
            )}
            <span className="absolute bottom-0 left-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0f172a] rounded-full" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-200 truncate">{currentUser.full_name}</h4>
            <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-bold mt-0.5 ${roleColors[currentUser.role] || 'bg-slate-800 text-slate-300'}`}>
              {roleLabelsAr[currentUser.role] || currentUser.role}
            </span>
          </div>
          <UserCircle2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
        </button>
      </div>
    </aside>
  );
};
