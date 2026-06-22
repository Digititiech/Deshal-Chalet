/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  TrendingUp, 
  Users, 
  Home, 
  DollarSign, 
  Star, 
  ArrowUpRight, 
  Bell, 
  Activity, 
  AlertCircle,
  CalendarDays,
  ShieldCheck
} from 'lucide-react';
import { Property, Booking, Notification, AuditLog } from '../types';
import { DatabaseService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);

  React.useEffect(() => {
    async function loadData() {
      const props = await DatabaseService.getProperties();
      const books = await DatabaseService.getBookings();
      const notifs = await DatabaseService.getNotifications();
      const logs = DatabaseService.getAuditLogs();
      
      setProperties(props);
      setBookings(books);
      setNotifications(notifs);
      setAuditLogs(logs);
    }
    loadData();
  }, []);

  const { profile } = useAuth();
  const currentUser = profile!;

  // Calculations
  const totalProperties = properties.length;
  const occupiedProperties = properties.filter(p => p.status === 'occupied').length;
  const maintenanceProperties = properties.filter(p => p.status === 'maintenance').length;
  
  const occupancyRate = totalProperties > 0 
    ? Math.round((occupiedProperties / totalProperties) * 100) 
    : 0;

  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  const averageRating = properties.length > 0
    ? (properties.reduce((sum, p) => sum + p.rating, 0) / properties.length).toFixed(2)
    : '5.00';

  // Role Translations
  const roleLabelsAr: Record<string, string> = {
    super_admin: 'المدير العام',
    company_manager: 'مدير الشركة',
    property_manager: 'مدير المرفق',
    booking_staff: 'موظف الحجوزات',
  };

  return (
    <div className="space-y-8 animate-fadeIn text-slate-100">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 frosted p-6 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <span className="text-xs font-bold text-blue-400 bg-blue-500/15 px-2.5 py-1 rounded-full border border-blue-500/25">
            نظام ذا ستار شاليه الذكي
          </span>
          <h2 className="text-2xl font-bold text-white mt-2">أهلاً بك، {currentUser.full_name} 👋</h2>
          <p className="text-slate-300 text-sm mt-1">تتمتع حالياً بصلاحيات <span className="font-semibold text-blue-300">{roleLabelsAr[currentUser.role]}</span>.</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('bookings')}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/10 hover:bg-blue-500 transition-all cursor-pointer border border-blue-500/35"
          >
            <CalendarDays className="w-4 h-4 ml-1" />
            إضافة حجز جديد
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <div id="kpi-revenue" className="frosted p-6 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">إجمالي الإيرادات المؤكدة</p>
            <h3 className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {totalRevenue.toLocaleString('ar-OM', { minimumFractionDigits: 2 })} ر.ع.
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/25">
              <TrendingUp className="w-3 h-3" /> +12.4% هذا الشهر
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/25">
            <DollarSign className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        {/* Occupancy Card */}
        <div id="kpi-occupancy" className="frosted p-6 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">نسبة الإشغال الحالية</p>
            <h3 className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {occupancyRate}%
            </h3>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-300">
              {occupiedProperties} مشغول من أصل {totalProperties}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 border border-blue-500/25">
            <Users className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        {/* Active Properties Card */}
        <div id="kpi-properties" className="frosted p-6 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">مرافق الشاليهات والمخيمات</p>
            <h3 className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {totalProperties} عقاراً
            </h3>
            <div className="flex gap-2 text-[11px]">
              <span className="text-emerald-400 font-semibold">{totalProperties - maintenanceProperties} نشط</span>
              <span className="text-slate-500">|</span>
              <span className="text-amber-400">{maintenanceProperties} صيانة</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 border border-indigo-500/25">
            <Home className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        {/* Rating Card */}
        <div id="kpi-rating" className="frosted p-6 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-400">متوسط تقييم النزلاء</p>
            <h3 className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {averageRating} / 5.0
            </h3>
            <div className="flex items-center gap-1 text-amber-400">
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400 border border-rose-500/25">
            <Star className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Main Column Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Custom Visual Analytics: Revenue Trend & Occupancy charts */}
        <div className="lg:col-span-2 frosted p-6 rounded-2xl border border-white/10 shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white">مؤشرات الأداء المالي والنزلاء</h3>
              <p className="text-slate-400 text-xs mt-0.5">توزيع الإيرادات والإشغال لجميع فروع السلطنة</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs bg-white/10 text-slate-200 px-3 py-1 rounded-full font-bold">
              تحديث مباشر <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            </span>
          </div>

          {/* Graphical Representation: SVG custom Chart */}
          <div className="space-y-5">
            <div>
              <h4 className="text-xs font-bold text-slate-300 mb-3 block text-right">معدل الإشغال وحجم العائد اليومي</h4>
              <div className="space-y-3.5">
                {[
                  { region: 'شاليه الرمال الذهبية (بدية)', rate: 85, color: 'bg-amber-500', amount: '450 ر.ع. / يوم' },
                  { region: 'شاليه الأفق العالي (الجبل الأخضر)', rate: 60, color: 'bg-blue-500', amount: '320 ر.ع. / يوم' },
                  { region: 'مخيم النجوم الملكي (الموج)', rate: 95, color: 'bg-emerald-500', amount: '580 ر.ع. / يوم' }
                ].map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-300">{item.region}</span>
                      <span className="text-white font-bold">{item.rate}% ({item.amount})</span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full transition-all duration-500`} style={{ width: `${item.rate}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom SVG line-chart representation for mock visualization */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-xs font-bold text-slate-300 mb-3 block text-right">مخطط تدفق الحجوزات النصف سنوي (ر.ع.)</h4>
              <div className="relative h-32 w-full bg-white/5 rounded-xl p-4 flex items-end justify-between overflow-hidden border border-white/5">
                {/* Simulated vertical grid line */}
                <div className="absolute inset-x-0 top-1/2 border-t border-white/10 pointer-events-none"></div>
                
                {[
                  { month: 'يناير', val: 4000, height: '40%' },
                  { month: 'فبراير', val: 4800, height: '55%' },
                  { month: 'مارس', val: 6200, height: '80%' },
                  { month: 'أبريل', val: 5100, height: '62%' },
                  { month: 'مايو', val: 7800, height: '95%' },
                  { month: 'يونيو', val: totalRevenue, height: `${Math.min(95, Math.max(30, (totalRevenue / 10000) * 100))}%` }
                ].map((m, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-2 z-10 w-full">
                    <span className="text-[10px] font-bold text-slate-300 font-mono">{m.val} ر.ع.</span>
                    <div className="w-8 bg-blue-500/10 rounded-t-lg hover:bg-blue-500/25 transition-colors duration-150 flex items-end overflow-hidden" style={{ height: '60px' }}>
                      <div className="w-full bg-blue-500 rounded-t-lg transition-all duration-300" style={{ height: m.height }}></div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-300">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Feed: Live Notifications & Audits */}
        <div className="space-y-6">
          {/* Notifications feed */}
          <div className="frosted p-6 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-400" /> الإشعارات العاجلة
              </h3>
              <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full font-bold">
                {notifications.filter(n => !n.is_read).length} نشطة
              </span>
            </div>
            <div className="divide-y divide-white/5 max-h-52 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">لا توجد إشعارات جديدة حالياً.</p>
              ) : (
                notifications.map((n) => (
                  <div key={n.id} className="py-3 flex gap-2.5">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white">{n.title}</h4>
                      <p className="text-slate-300 text-[11px] leading-relaxed break-words">{n.message}</p>
                      <span className="text-[9px] text-slate-400 block font-mono">{new Date(n.created_at).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit log preview */}
          <div className="frosted p-6 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> آخر عمليات التدقيق المالي
              </h3>
              <button 
                onClick={() => onNavigate('reports')}
                className="text-[11px] text-blue-400 hover:underline font-bold"
              >
                عرض سجل الأمان
              </button>
            </div>
            <div className="divide-y divide-white/5 max-h-52 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">لا توجد عمليات مسجلة بعد في دفتر التدقيق.</p>
              ) : (
                auditLogs.slice(0, 4).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-300">تعديل بـ `{log.table_name}`</span>
                      <span className="text-[10px] text-slate-400 font-mono">{new Date(log.created_at).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${
                      log.action_type === 'INSERT' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      log.action_type === 'UPDATE' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {log.action_type === 'INSERT' ? 'إدخال حقل' :
                       log.action_type === 'UPDATE' ? 'تحديث حقل' : 'حذف وإبقاء'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
