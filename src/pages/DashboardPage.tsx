/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Home,
  DollarSign,
  Star,
  Bell,
  Activity,
  CalendarDays,
  ShieldCheck,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Property, Booking, Notification, AuditLog, Settings } from '../types';
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
  const [settings, setSettings] = React.useState<Settings | null>(null);

  React.useEffect(() => {
    async function loadData() {
      const props = await DatabaseService.getProperties();
      const books = await DatabaseService.getBookings();
      const notifs = await DatabaseService.getNotifications();
      const logs = DatabaseService.getAuditLogs();
      const sets = await DatabaseService.getSettings();

      setProperties(props);
      setBookings(books);
      setNotifications(notifs);
      setAuditLogs(logs);
      setSettings(sets);
    }
    loadData();
  }, []);

  const { profile } = useAuth();
  const currentUser = profile!;
  const currencySymbol = settings?.currency_name || 'ر.ع.';

  // ── KPI Calculations from real data ──────────────────────────
  const totalProperties = properties.length;
  const occupiedProperties = properties.filter(p => p.status === 'occupied').length;
  const maintenanceProperties = properties.filter(p => p.status === 'maintenance').length;
  const availableProperties = properties.filter(p => p.status === 'available').length;

  const occupancyRate = totalProperties > 0
    ? Math.round((occupiedProperties / totalProperties) * 100)
    : 0;

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  const confirmedOrCompleted = (b: Booking) =>
    b.status === 'confirmed' || b.status === 'completed';

  const totalRevenue = bookings
    .filter(confirmedOrCompleted)
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  const thisMonthRevenue = bookings
    .filter(confirmedOrCompleted)
    .filter(b => new Date(b.check_in) >= thisMonthStart)
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  const lastMonthRevenue = bookings
    .filter(confirmedOrCompleted)
    .filter(b => {
      const d = new Date(b.check_in);
      return d >= lastMonthStart && d <= lastMonthEnd;
    })
    .reduce((sum, b) => sum + Number(b.total_price), 0);

  const revenueChange = lastMonthRevenue > 0
    ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
    : null;

  const averageRating = properties.length > 0
    ? (properties.reduce((sum, p) => sum + p.rating, 0) / properties.length).toFixed(1)
    : null;

  // ── Per-property occupancy stats for chart ────────────────────
  const propertyStats = properties.map(prop => {
    const propBookings = bookings.filter(
      b => b.property_id === prop.id && confirmedOrCompleted(b)
    );
    const propRevenue = propBookings.reduce((s, b) => s + Number(b.total_price), 0);
    const propBookingCount = propBookings.length;

    // Occupancy rate = days booked / days in last 30 days
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentBookings = propBookings.filter(b => new Date(b.check_in) >= thirtyDaysAgo);
    let bookedDays = 0;
    recentBookings.forEach(b => {
      const ci = new Date(b.check_in);
      const co = new Date(b.check_out);
      const diff = Math.max(1, Math.round((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24)));
      bookedDays += diff;
    });
    const occRate = Math.min(100, Math.round((bookedDays / 30) * 100));

    return {
      id: prop.id,
      name: prop.name,
      status: prop.status,
      revenue: propRevenue,
      bookingCount: propBookingCount,
      occRate,
      dailyRate: prop.price_full_day,
    };
  }).sort((a, b) => b.revenue - a.revenue); // sort by highest revenue

  // ── Monthly bookings chart (last 6 months real data) ──────────
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return {
      month: d.toLocaleDateString('ar-OM', { month: 'short' }),
      year: d.getFullYear(),
      monthNum: d.getMonth(),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  });

  const monthlyData = last6Months.map(m => {
    const rev = bookings
      .filter(confirmedOrCompleted)
      .filter(b => {
        const d = new Date(b.check_in);
        return d >= m.start && d <= m.end;
      })
      .reduce((s, b) => s + Number(b.total_price), 0);
    return { month: m.month, revenue: rev };
  });

  const maxMonthlyRevenue = Math.max(...monthlyData.map(m => m.revenue), 1);

  // ── Booking status counts ─────────────────────────────────────
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;
  const completedCount = bookings.filter(b => b.status === 'completed').length;
  const cancelledCount = bookings.filter(b => b.status === 'cancelled').length;

  // ── Role labels ───────────────────────────────────────────────
  const roleLabelsAr: Record<string, string> = {
    super_admin: 'المدير العام',
    company_manager: 'مدير الشركة',
    property_manager: 'مدير المرفق',
    booking_staff: 'موظف الحجوزات',
  };

  const barColors = ['bg-amber-500', 'bg-blue-500', 'bg-emerald-500', 'bg-indigo-500', 'bg-rose-400', 'bg-purple-400'];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Revenue Card */}
        <div id="kpi-revenue" className="frosted p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-400">إجمالي الإيرادات المؤكدة</p>
            <h3 className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {totalRevenue.toLocaleString('ar-OM', { minimumFractionDigits: 2 })} {currencySymbol}
            </h3>
            {revenueChange !== null ? (
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                revenueChange >= 0
                  ? 'text-emerald-400 bg-emerald-500/15 border-emerald-500/25'
                  : 'text-rose-400 bg-rose-500/15 border-rose-500/25'
              }`}>
                {revenueChange >= 0
                  ? <TrendingUp className="w-3 h-3" />
                  : <TrendingDown className="w-3 h-3" />
                }
                {revenueChange >= 0 ? '+' : ''}{revenueChange}% مقارنة بالشهر الماضي
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                إيرادات هذا الشهر: {thisMonthRevenue.toLocaleString('ar-OM', { minimumFractionDigits: 2 })} {currencySymbol}
              </span>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 flex items-center justify-center text-amber-400 border border-amber-500/25 flex-shrink-0">
            <DollarSign className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        {/* Occupancy Card */}
        <div id="kpi-occupancy" className="frosted p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-400">نسبة الإشغال الحالية</p>
            <h3 className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {occupancyRate}%
            </h3>
            <div className="flex flex-col gap-0.5 text-[11px]">
              <span className="text-rose-400 font-semibold">{occupiedProperties} مشغول</span>
              <span className="text-slate-400">{availableProperties} متاح | {maintenanceProperties} صيانة</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center text-blue-400 border border-blue-500/25 flex-shrink-0">
            <Users className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        {/* Active Properties Card */}
        <div id="kpi-properties" className="frosted p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-400">مرافق الشاليهات والمخيمات</p>
            <h3 className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {totalProperties} عقار
            </h3>
            <div className="flex gap-2 text-[11px]">
              <span className="text-emerald-400 font-semibold">{availableProperties} متاح</span>
              <span className="text-slate-500">|</span>
              <span className="text-amber-400">{maintenanceProperties} صيانة</span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400 border border-indigo-500/25 flex-shrink-0">
            <Home className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>

        {/* Rating Card */}
        <div id="kpi-rating" className="frosted p-5 rounded-2xl border border-white/10 shadow-lg flex items-center justify-between hover:scale-[1.01] transition-transform">
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-slate-400">متوسط تقييم النزلاء</p>
            <h3 className="text-2xl font-extrabold text-white font-mono tracking-tight">
              {averageRating !== null ? `${averageRating} / 5.0` : '—'}
            </h3>
            {averageRating !== null ? (
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i <= Math.round(Number(averageRating)) ? 'text-amber-400 fill-current' : 'text-slate-600'}`}
                  />
                ))}
              </div>
            ) : (
              <span className="text-[11px] text-slate-400">لا توجد عقارات بعد</span>
            )}
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/15 flex items-center justify-center text-rose-400 border border-rose-500/25 flex-shrink-0">
            <Star className="w-6 h-6 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* Booking Status Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'حجوزات مؤكدة', count: confirmedCount, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'قيد الانتظار', count: pendingCount, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'مكتملة', count: completedCount, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'ملغاة', count: cancelledCount, icon: XCircle, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
        ].map(({ label, count, icon: Icon, color, bg }) => (
          <div key={label} className={`frosted p-4 rounded-xl border flex items-center gap-3 ${bg}`}>
            <Icon className={`w-5 h-5 flex-shrink-0 ${color}`} />
            <div>
              <p className="text-xl font-extrabold text-white font-mono">{count}</p>
              <p className="text-[11px] text-slate-400 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Real Charts Section */}
        <div className="lg:col-span-2 frosted p-6 rounded-2xl border border-white/10 shadow-lg space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-amber-400" />
                مؤشرات الأداء المالي
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">بيانات حقيقية من قاعدة البيانات</p>
            </div>
            <span className="flex items-center gap-1.5 text-xs bg-white/10 text-slate-200 px-3 py-1 rounded-full font-bold">
              مباشر <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
            </span>
          </div>

          {/* Per-property performance bars (real data) */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 mb-4">أداء كل عقار — الإيرادات والحجوزات</h4>
            {propertyStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-600" />
                <p className="text-sm font-semibold">لا توجد عقارات مضافة بعد</p>
              </div>
            ) : (
              <div className="space-y-3.5">
                {propertyStats.slice(0, 5).map((prop, idx) => {
                  const maxRevenue = Math.max(...propertyStats.map(p => p.revenue), 1);
                  const barWidth = Math.max(4, Math.round((prop.revenue / maxRevenue) * 100));
                  return (
                    <div key={prop.id} className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-300 font-medium truncate max-w-[55%]">{prop.name}</span>
                        <span className="text-white font-bold font-mono">
                          {prop.revenue.toLocaleString('ar-OM', { minimumFractionDigits: 2 })} {currencySymbol}
                          <span className="text-slate-400 font-normal ms-2">({prop.bookingCount} حجز)</span>
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColors[idx % barColors.length]} rounded-full transition-all duration-700`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly revenue chart (real 6-month data) */}
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-xs font-bold text-slate-300 mb-3 block text-right">
              الإيرادات الشهرية — آخر 6 أشهر ({currencySymbol})
            </h4>
            <div className="relative h-32 w-full bg-white/5 rounded-xl p-4 flex items-end justify-between gap-1 overflow-hidden border border-white/5">
              <div className="absolute inset-x-0 top-1/2 border-t border-white/10 pointer-events-none" />
              {monthlyData.map((m, idx) => {
                const heightPct = Math.max(4, Math.round((m.revenue / maxMonthlyRevenue) * 100));
                return (
                  <div key={idx} className="flex flex-col items-center gap-1 z-10 flex-1">
                    <span className="text-[9px] font-bold text-slate-300 font-mono">
                      {m.revenue > 0 ? m.revenue.toLocaleString('ar-OM') : '—'}
                    </span>
                    <div
                      className="w-full bg-blue-500/10 rounded-t-md hover:bg-blue-500/25 transition-colors duration-150 flex items-end overflow-hidden"
                      style={{ height: '56px' }}
                    >
                      <div
                        className="w-full bg-blue-500 rounded-t-md transition-all duration-500"
                        style={{ height: m.revenue > 0 ? `${heightPct}%` : '4%', opacity: m.revenue > 0 ? 1 : 0.2 }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-400">{m.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sidebar Feed */}
        <div className="space-y-6">
          {/* Notifications feed */}
          <div className="frosted p-5 rounded-2xl border border-white/10 shadow-lg">
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
                notifications.slice(0, 5).map((n) => (
                  <div key={n.id} className="py-3 flex gap-2.5">
                    <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${
                      n.type === 'error' ? 'bg-rose-400' :
                      n.type === 'warning' ? 'bg-amber-400' :
                      n.type === 'success' ? 'bg-emerald-400' : 'bg-blue-400'
                    }`} />
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white">{n.title}</h4>
                      <p className="text-slate-300 text-[11px] leading-relaxed break-words">{n.message}</p>
                      <span className="text-[9px] text-slate-400 block font-mono">
                        {new Date(n.created_at).toLocaleString('ar-OM', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit log preview */}
          <div className="frosted p-5 rounded-2xl border border-white/10 shadow-lg">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> آخر عمليات النظام
              </h3>
              <button
                onClick={() => onNavigate('reports')}
                className="text-[11px] text-blue-400 hover:underline font-bold cursor-pointer"
              >
                عرض الكل
              </button>
            </div>
            <div className="divide-y divide-white/5 max-h-52 overflow-y-auto">
              {auditLogs.length === 0 ? (
                <p className="text-slate-400 text-xs py-4 text-center">لا توجد عمليات مسجلة بعد.</p>
              ) : (
                auditLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="font-bold text-slate-300 truncate">{log.table_name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.created_at).toLocaleString('ar-OM', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                      </span>
                    </div>
                    <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[9px] border flex-shrink-0 ${
                      log.action_type === 'INSERT' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                      log.action_type === 'UPDATE' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                      'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}>
                      {log.action_type === 'INSERT' ? 'إضافة' :
                       log.action_type === 'UPDATE' ? 'تعديل' : 'حذف'}
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
