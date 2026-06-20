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
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';
import { Profile } from '../types';
import { getCurrentlySimulatedUser, setCurrentlySimulatedUser, DatabaseService } from '../services/db';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onUserChanged: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, onUserChanged }) => {
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [activeUser, setActiveUser] = React.useState<Profile>(getCurrentlySimulatedUser());
  const [isLive, setIsLive] = React.useState(DatabaseService.isLiveSupabase());

  React.useEffect(() => {
    DatabaseService.getProfiles().then(setProfiles);
  }, [currentTab, activeUser]);

  const handleSimUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const match = profiles.find(p => p.id === selectedId);
    if (match) {
      setCurrentlySimulatedUser(match);
      setActiveUser(match);
      onUserChanged();
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
    { id: 'properties', label: 'المرافق الشاليهات', icon: Home },
    { id: 'bookings', label: 'سجل الحجوزات', icon: CalendarDays },
    { id: 'users', label: 'إدارة الصلاحيات', icon: Users },
    { id: 'reports', label: 'التقارير والتدقيق', icon: FilePieChart },
    { id: 'settings', label: 'إعدادات النظام', icon: SettingsIcon },
  ];

  const roleLabelsAr: Record<string, string> = {
    super_admin: 'المدير العام (Super)',
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
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl shadow-lg shadow-blue-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight bg-gradient-to-l from-blue-200 to-white bg-clip-text text-transparent">ذا ستار شاليه</h1>
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

      {/* Simulation/Role switcher Footer */}
      <div className="p-4 bg-white/5 border-t border-white/10">
        <div className="mb-3">
          <p className="text-[11px] text-slate-400 mb-1 font-semibold flex items-center gap-1 justify-between">
            <span className="flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400" /> محاكي الصلاحيات النشط:
            </span>
          </p>
          <select
            id="role-simulator-select"
            value={activeUser.id}
            onChange={handleSimUserChange}
            className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-1.5 px-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                {p.full_name} ({p.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Current Active User Profile summary */}
        <div className="flex items-center gap-3 p-2 bg-white/5 rounded-xl border border-white/10">
          <img
            src={activeUser.avatar_url || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=60'}
            alt={activeUser.full_name}
            className="w-9 h-9 rounded-full object-cover border border-white/10"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-200 truncate">{activeUser.full_name}</h4>
            <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded-full font-bold mt-1 ${roleColors[activeUser.role] || 'bg-slate-800 text-slate-300'}`}>
              {roleLabelsAr[activeUser.role] || activeUser.role}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
