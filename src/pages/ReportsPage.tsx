/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FileSpreadsheet, 
  ShieldCheck, 
  ArrowUpRight, 
  DollarSign, 
  Calendar, 
  HelpCircle,
  FileText,
  Clock,
  UserCheck,
  Printer
} from 'lucide-react';
import { AuditLog, Booking, Profile, Property } from '../types';
import { DatabaseService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

const getDateRange = (preset: string, customStart?: string, customEnd?: string) => {
  const now = new Date();
  let start: Date | null = null;
  let end: Date | null = null;

  switch (preset) {
    case 'today': {
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);
      start = todayStart;
      end = todayEnd;
      break;
    }
    case 'yesterday': {
      const yesterdayStart = new Date(now);
      yesterdayStart.setDate(now.getDate() - 1);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(now);
      yesterdayEnd.setDate(now.getDate() - 1);
      yesterdayEnd.setHours(23, 59, 59, 999);
      start = yesterdayStart;
      end = yesterdayEnd;
      break;
    }
    case 'this-week': {
      const startOfWeek = new Date(now);
      const day = now.getDay();
      startOfWeek.setDate(now.getDate() - day);
      startOfWeek.setHours(0, 0, 0, 0);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);
      start = startOfWeek;
      end = endOfWeek;
      break;
    }
    case 'last-week': {
      const startOfLastWeek = new Date(now);
      const day = now.getDay();
      startOfLastWeek.setDate(now.getDate() - day - 7);
      startOfLastWeek.setHours(0, 0, 0, 0);
      const endOfLastWeek = new Date(startOfLastWeek);
      endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
      endOfLastWeek.setHours(23, 59, 59, 999);
      start = startOfLastWeek;
      end = endOfLastWeek;
      break;
    }
    case 'this-month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      start = startOfMonth;
      end = endOfMonth;
      break;
    }
    case 'last-month': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      start = startOfLastMonth;
      end = endOfLastMonth;
      break;
    }
    case 'custom': {
      if (customStart) {
        start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
      }
      if (customEnd) {
        end = new Date(customEnd);
        end.setHours(23, 59, 59, 999);
      }
      break;
    }
    default:
      break;
  }
  return { start, end };
};

export const ReportsPage: React.FC = () => {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);

  // Date Filter states
  const [datePreset, setDatePreset] = React.useState<string>('all');
  const [startDateStr, setStartDateStr] = React.useState<string>(new Date().toISOString().slice(0, 10));
  const [endDateStr, setEndDateStr] = React.useState<string>(new Date().toISOString().slice(0, 10));

  const { profile } = useAuth();
  const activeUser = profile;

  React.useEffect(() => {
    async function loadData() {
      const books = await DatabaseService.getBookings();
      const profs = await DatabaseService.getProfiles();
      const props = await DatabaseService.getProperties();
      const logs = DatabaseService.getAuditLogs();

      setBookings(books);
      setProfiles(profs);
      setProperties(props);
      setAuditLogs(logs);
    }
    loadData();
  }, []);

  const { start, end } = React.useMemo(() => {
    return getDateRange(datePreset, startDateStr, endDateStr);
  }, [datePreset, startDateStr, endDateStr]);

  const filteredBookings = React.useMemo(() => {
    return bookings.filter(b => {
      if (!start && !end) return true;
      const compDate = new Date(b.check_in);
      if (start && compDate < start) return false;
      if (end && compDate > end) return false;
      return true;
    });
  }, [bookings, start, end]);

  const filteredAuditLogs = React.useMemo(() => {
    return auditLogs.filter(log => {
      if (!start && !end) return true;
      const compDate = new Date(log.created_at);
      if (start && compDate < start) return false;
      if (end && compDate > end) return false;
      return true;
    });
  }, [auditLogs, start, end]);

  const getPresetLabel = (preset: string) => {
    switch (preset) {
      case 'all': return 'كل الأوقات';
      case 'today': return 'اليوم';
      case 'yesterday': return 'الأمس';
      case 'this-week': return 'هذا الأسبوع';
      case 'last-week': return 'الأسبوع الماضي';
      case 'this-month': return 'هذا الشهر';
      case 'last-month': return 'الشهر الماضي';
      case 'custom': return 'فترة مخصصة';
      default: return '';
    }
  };

  // Compute stats
  const totalBookings = filteredBookings.length;
  const confirmedCount = filteredBookings.filter(b => b.status === 'confirmed').length;
  const completedCount = filteredBookings.filter(b => b.status === 'completed').length;
  const cancelledCount = filteredBookings.filter(b => b.status === 'cancelled').length;
  const pendingCount = filteredBookings.filter(b => b.status === 'pending').length;

  const totalRevenue = filteredBookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((add, b) => add + Number(b.total_price), 0);

  const getActorName = (id?: string | null) => {
    if (!id) return 'النظام التلقائي';
    return profiles.find(p => p.id === id)?.full_name || 'موظف مجهول البديل';
  };

  const getPropertyName = (id: string) => {
    return properties.find(p => p.id === id)?.name || 'مرفق فندقي';
  };

  const handleExportExcel = () => {
    const BOM = "\uFEFF";
    
    // Headers list for reservations
    const headers = [
      "رمز الحجز",
      "اسم النزيل",
      "رقم الاتصال",
      "البريد الإلكتروني",
      "المرفق المحجوز",
      "تاريخ الدخول",
      "تاريخ المغادرة",
      "نوع الإقامة",
      "القيمة الكلية (ر.ع.)",
      "الحالة الحالية"
    ];
    
    const rows = filteredBookings.map(b => {
      const propName = getPropertyName(b.property_id);
      const cleanPropName = propName.replace(/,/g, ' ');
      const typeLabel = b.booking_type === 'full_day' ? 'يوم كامل مبيت' : 'نصف يوم';
      let statusLabel = 'قيد الانتظار';
      if (b.status === 'confirmed') statusLabel = 'مؤكد ونشط';
      else if (b.status === 'completed') statusLabel = 'مكتمل';
      else if (b.status === 'cancelled') statusLabel = 'ملغي';
      
      return [
        b.ref_code,
        b.guest_name,
        b.guest_phone,
        b.guest_email,
        cleanPropName,
        b.check_in,
        b.check_out,
        typeLabel,
        b.total_price,
        statusLabel
      ];
    });
    
    let csvContent = BOM + headers.join(",") + "\n";
    rows.forEach(row => {
      const cleanRow = row.map(val => {
        const text = String(val ?? '').trim();
        return `"${text.replace(/"/g, '""')}"`;
      });
      csvContent += cleanRow.join(",") + "\n";
    });
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تقرير_الإيرادات_والحجوزات_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    const todayStr = new Date().toLocaleDateString('ar-OM', { year: 'numeric', month: 'long', day: 'numeric' });
    const timeStr = new Date().toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' });
    
    // Generate bookings table rows
    const bookingsRows = filteredBookings.map(b => {
      const typeLabel = b.booking_type === 'full_day' ? 'يوم كامل' : 'نصف يوم';
      let statusLabel = 'قيد الانتظار';
      let statusClass = 'text-amber-600 bg-amber-50';
      if (b.status === 'confirmed') {
        statusLabel = 'مؤكد ونشط';
        statusClass = 'text-emerald-600 bg-emerald-50';
      } else if (b.status === 'completed') {
        statusLabel = 'مكتمل';
        statusClass = 'text-blue-600 bg-blue-50';
      } else if (b.status === 'cancelled') {
        statusLabel = 'ملغي';
        statusClass = 'text-rose-600 bg-rose-50';
      }

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-family: monospace; font-weight: bold; font-size: 11px;">${b.ref_code}</td>
          <td style="padding: 10px 12px; font-weight: bold;">${b.guest_name}</td>
          <td style="padding: 10px 12px; font-family: monospace; font-size: 11px;">${b.guest_phone}</td>
          <td style="padding: 10px 12px;">${getPropertyName(b.property_id)}</td>
          <td style="padding: 10px 12px; font-family: monospace; font-size: 11px;">${b.check_in}</td>
          <td style="padding: 10px 12px; font-family: monospace; font-size: 11px;">${b.check_out}</td>
          <td style="padding: 10px 12px;">${typeLabel}</td>
          <td style="padding: 10px 12px; font-weight: 900; color: #047857; font-family: monospace;">${b.total_price} ر.ع.</td>
          <td style="padding: 10px 12px;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: bold;" class="${statusClass}">
              ${statusLabel}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    // Generate logs table rows
    const logsRows = filteredAuditLogs.map(log => {
      let typeLabel = 'تعديل';
      let typeClass = 'text-amber-600 bg-amber-50';
      if (log.action_type === 'INSERT') {
        typeLabel = 'إضافة جديد';
        typeClass = 'text-emerald-600 bg-emerald-50';
      } else if (log.action_type === 'DELETE') {
        typeLabel = 'حذف';
        typeClass = 'text-rose-600 bg-rose-50';
      }

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 8px 12px; font-family: monospace; font-size: 10px; color: #64748b;">${log.id}</td>
          <td style="padding: 8px 12px; font-weight: bold;">${getActorName(log.performed_by)}</td>
          <td style="padding: 8px 12px; font-family: monospace; font-size: 11px; color: #1d4ed8;">${log.table_name}</td>
          <td style="padding: 8px 12px;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold;" class="${typeClass}">
              ${typeLabel}
            </span>
          </td>
          <td style="padding: 8px 12px; font-family: monospace; font-size: 10px;">${new Date(log.created_at).toLocaleString('ar-OM')}</td>
          <td style="padding: 8px 12px; font-family: monospace; font-size: 9px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            ${JSON.stringify(log.payload)}
          </td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>تقرير الضيافة المالي والرقابة الفنية</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;900&display=swap" rel="stylesheet">
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #ffffff;
      color: #1e293b;
      padding: 40px;
      line-height: 1.6;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 3px solid #1e293b;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .company-title {
      font-size: 11px;
      font-weight: 900;
      color: #2563eb;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .main-title {
      font-size: 24px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 5px;
    }
    .sub-title {
      font-size: 12px;
      color: #64748b;
      font-weight: 600;
    }
    .meta-box {
      text-align: left;
      font-size: 12px;
      font-weight: bold;
    }
    .meta-box div {
      margin-bottom: 4px;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 35px;
    }
    .stat-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 15px;
      background-color: #f8fafc;
    }
    .stat-label {
      font-size: 10px;
      font-weight: bold;
      color: #64748b;
      display: block;
    }
    .stat-value {
      font-size: 20px;
      font-weight: 900;
      color: #0f172a;
      margin-top: 5px;
      display: block;
    }
    .stat-desc {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 3px;
      display: block;
    }
    .section-title {
      font-size: 14px;
      font-weight: 950;
      color: #0f172a;
      border-right: 4px solid #2563eb;
      padding-right: 10px;
      margin-bottom: 15px;
      margin-top: 30px;
    }
    .section-title.audit {
      border-right-color: #f59e0b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 20px;
    }
    th {
      background-color: #f1f5f9;
      color: #475569;
      font-weight: bold;
      text-align: right;
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
    }
    td {
      padding: 10px 12px;
      border: 1px solid #cbd5e1;
      text-align: right;
    }
    .text-emerald-600 { color: #059669; }
    .bg-emerald-50 { background-color: #ecfdf5; }
    .text-amber-600 { color: #d97706; }
    .bg-amber-50 { background-color: #fffbeb; }
    .text-blue-600 { color: #2563eb; }
    .bg-blue-50 { background-color: #eff6ff; }
    .text-rose-600 { color: #e11d48; }
    .bg-rose-50 { background-color: #fff1f2; }
    
    .stamps-block {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
      margin-top: 50px;
      padding-top: 30px;
      border-top: 2px dashed #e2e8f0;
      text-align: center;
      font-size: 12px;
    }
    .stamp-space {
      margin-top: 40px;
      font-weight: bold;
    }
    .stamp-circle {
      width: 75px;
      height: 75px;
      border: 2px dashed #3b82f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 8px;
      color: #3b82f6;
      font-weight: bold;
      transform: rotate(12deg);
      margin: 15px auto 5px auto;
    }
    
    .print-banner {
      background-color: #2563eb;
      color: #ffffff;
      padding: 12px;
      border-radius: 6px;
      text-align: center;
      margin-bottom: 25px;
      font-size: 13px;
      font-weight: bold;
    }

    @media print {
      .print-banner {
        display: none;
      }
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>

  <div class="print-banner">
    🖨️ تم تجهيز التقرير الطباعي بنجاح! يمكنك الآن الضغط على (Ctrl + P) أو (Cmd + P) على الكيبورد لحفظ مستند PDF بجودة عالية.
  </div>

  <div class="header">
    <div>
      <span class="company-title">نظام نجم السحابي لإدارة الضيافة ChaletCloud</span>
      <h1 class="main-title">التقرير المالي الفني الشامل وسجل الرقابة</h1>
      <p class="sub-title">سند رسمي لتفاصيل الإيرادات وحركات التدقيق في الحجوزات</p>
    </div>
    <div class="meta-box">
      <div>التاريخ: ${todayStr}</div>
      <div>الوقت: ${timeStr}</div>
      <div>المشغل: ${activeUser?.full_name || 'المدير المسؤول'}</div>
      <div style="color: #2563eb; margin-bottom: 4px;">الصفة: ${activeUser?.role === 'super_admin' ? 'المدير العام المالك' : 'مسؤول النظام'}</div>
      <div style="color: #10b981; font-weight: bold;">الفترة المحددة: ${getPresetLabel(datePreset)} ${datePreset === 'custom' ? `(من ${startDateStr} إلى ${endDateStr})` : ''}</div>
    </div>
  </div>

  <div class="stats-grid">
    <div class="stat-card">
      <span class="stat-label">إجمالي الإيرادات الفعلية</span>
      <span class="stat-value">${totalRevenue} ر.ع.</span>
      <span class="stat-desc">مؤكد وعمليات منتهية فقط</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">إجمالي عدد الحجوزات</span>
      <span class="stat-value">${totalBookings} حجز</span>
      <span class="stat-desc">موزعة على كافة الحالات</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">الحجوزات النشطة المؤكدة</span>
      <span class="stat-value">${confirmedCount} حجز</span>
      <span class="stat-desc">جاهزة للاستعمال</span>
    </div>
    <div class="stat-card">
      <span class="stat-label">الطلبات قيد المراجعة</span>
      <span class="stat-value">${pendingCount} طلب</span>
      <span class="stat-desc">تحتاج قرار مباشر</span>
    </div>
  </div>

  <h3 class="section-title">أولاً: تفاصيل كشف الحجوزات والإيرادات للنزلاء</h3>
  <table>
    <thead>
      <tr>
        <th>رمز الحجز</th>
        <th>النزيل الكريم</th>
        <th>بيانات الاتصال</th>
        <th>المرفق المحجوز</th>
        <th>تاريخ الدخول</th>
        <th>تاريخ المغادرة</th>
        <th>نوع الإقامة</th>
        <th>المبلغ المقبوض</th>
        <th>الحالة</th>
      </tr>
    </thead>
    <tbody>
      ${bookingsRows || '<tr><td colspan="9" style="text-align: center; color: #64748b;">لا توجد حجوزات مسجلة ضمن الفترة المحددة</td></tr>'}
    </tbody>
  </table>

  <h3 class="section-title audit">ثانياً: سجل تعقب وتدقيق العمليات الإدارية الفنية</h3>
  <table>
    <thead>
      <tr>
        <th>رقم الحركة</th>
        <th>الموظف المسؤول</th>
        <th>الجدول المستهدف</th>
        <th>نوع الحركة</th>
        <th>تاريخ وساعة التعديل</th>
        <th>ملخص العملية</th>
      </tr>
    </thead>
    <tbody>
      ${logsRows || '<tr><td colspan="6" style="text-align: center; color: #64748b;">لا توجد حركات مدونة في سجل التدقيق ضمن الفترة المحددة</td></tr>'}
    </tbody>
  </table>

  <div class="stamps-block">
    <div>
      <p style="font-weight: bold;">توقيع المدقق المالي المسؤول</p>
      <div class="stamp-space">_______________________</div>
      <p style="font-size: 10px; color: #64748b; margin-top: 5px;">${activeUser?.full_name}</p>
    </div>
    <div>
      <p style="font-weight: bold;">ختم المؤسسة والاعتماد الرسمي</p>
      <div class="stamp-circle">
        STAR CHALET CO
      </div>
      <p style="font-size: 10px; color: #64748b; margin-top: 5px;">STAR CHALET SAAS</p>
    </div>
    <div>
      <p style="font-weight: bold;">اعتماد الإدارة العامة للنظام</p>
      <div class="stamp-space">_______________________</div>
      <p style="font-size: 10px; color: #64748b; margin-top: 5px;">إدارة ChaletCloud الموحدة</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 700);
    };
  </script>
</body>
</html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `تقرير_الضيافة_المالي_والرقابة_${new Date().toISOString().slice(0, 10)}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="space-y-6 text-slate-100 animate-fadeIn print:hidden">
        
        {/* Upper header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 frosted p-5 rounded-2xl border border-white/10 shadow-lg">
          <div>
            <h2 className="text-xl font-extrabold text-white">التقارير وسجل التدقيق الفني (Auditing)</h2>
            <p className="text-xs text-slate-300 mt-1">تتبع التدفقات النقدية والعمليات الإدارية المنفذة لحظياً من قبل المسؤولين</p>
          </div>
          
          {/* Export button group */}
          <div className="flex flex-wrap gap-2.5">
            {/* Excel Export */}
            <button 
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500/25 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-4.5 h-4.5" />
              تصدير تقرير Excel (CSV)
            </button>

            {/* PDF Export / Print */}
            <button 
              onClick={handlePrintPDF}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 border border-blue-500/25 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-colors"
            >
              <Printer className="w-4.5 h-4.5" />
              تحميل / طباعة تقرير PDF
            </button>
          </div>
        </div>

        {/* Date Filter presets */}
        <div className="frosted p-5 rounded-2xl border border-white/10 shadow-lg space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/15">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-white">تصفية نطاق التقرير والتدقيق</h3>
                <p className="text-[11px] text-slate-350">اختر أحد الفترات الزمنية الجاهزة أو قم بتحديد نطاق مخصص لعرض البيانات الفنية المصفاة بدقة</p>
              </div>
            </div>
            
            {/* Quick Presets Buttons */}
            <div className="flex flex-wrap gap-1 bg-slate-950/45 p-1 rounded-xl border border-white/5">
              {[
                { id: 'all', label: 'كل الأوقات' },
                { id: 'today', label: 'اليوم' },
                { id: 'yesterday', label: 'الأمس' },
                { id: 'this-week', label: 'هذا الأسبوع' },
                { id: 'last-week', label: 'الأسبوع الماضي' },
                { id: 'this-month', label: 'هذا الشهر' },
                { id: 'last-month', label: 'الشهر الماضي' },
                { id: 'custom', label: 'تحديد مخصص 📅' },
              ].map(preset => (
                <button
                  key={preset.id}
                  onClick={() => setDatePreset(preset.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    datePreset === preset.id
                      ? 'bg-blue-600 text-white shadow-md font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Range calendar pickers */}
          {datePreset === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950/20 rounded-xl border border-white/5 animate-fadeIn">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 block">من تاريخ البدء</label>
                <div className="relative">
                  <input
                    type="date"
                    value={startDateStr}
                    onChange={(e) => setStartDateStr(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 block">إلى تاريخ النهاية</label>
                <div className="relative">
                  <input
                    type="date"
                    value={endDateStr}
                    onChange={(e) => setEndDateStr(e.target.value)}
                    className="w-full bg-slate-950/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Numerical Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="frosted p-5 rounded-xl border border-white/10 shadow-lg space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">إجمالي الحجوزات</span>
            <p className="text-2xl font-extrabold text-white font-mono">{totalBookings} حجزاً</p>
            <div className="flex justify-between text-[11px] font-bold text-slate-300">
              <span className="text-emerald-405 text-emerald-400 font-extrabold">{confirmedCount} مؤكد</span>
              <span className="text-rose-450 text-rose-400 font-extrabold">{cancelledCount} ملغي</span>
            </div>
          </div>

          <div className="frosted p-5 rounded-xl border border-white/10 shadow-lg space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">الإيرادات الفعلية (ر.ع.)</span>
            <p className="text-2xl font-extrabold text-white font-mono">{totalRevenue} ر.ع.</p>
            <p className="text-[10px] text-emerald-400 font-bold">لا تشمل العمليات الملغية</p>
          </div>

          <div className="frosted p-5 rounded-xl border border-white/10 shadow-lg space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">طلب الحجوزات المعلقة</span>
            <p className="text-2xl font-extrabold text-amber-300 font-mono">{pendingCount} طلبات</p>
            <p className="text-[10px] text-slate-300">معدل الفحص وتفادي التدخل نشط 100%</p>
          </div>

          <div className="frosted p-5 rounded-xl border border-white/10 shadow-lg space-y-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">الحجوزات منتهية الصلاحية</span>
            <p className="text-2xl font-extrabold text-white font-mono">{completedCount} إقامات</p>
            <p className="text-[10px] text-slate-300 font-semibold">تاريخ التحديث: {new Date().toLocaleDateString('ar-OM')}</p>
          </div>
        </div>

        {/* Audit Trails Logs Section */}
        <div className="frosted rounded-2xl border border-white/10 shadow-lg overflow-hidden">
          <div className="p-5 border-b border-white/10 flex items-center justify-between bg-white/5 text-slate-100 select-none">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-450 text-amber-400 animate-pulse" />
              <div>
                <h3 className="font-extrabold text-sm text-slate-50">سجل تعقب التدقيق (Comprehensive Audit Trail Log)</h3>
                <p className="text-[10px] text-slate-300">تطبيق معايير التدقيق الفني - يتتبع كافة البيانات المدخلة والمعدلة على مستوى النظام</p>
              </div>
            </div>
            <span className="text-[10px] bg-slate-950/40 border border-white/10 text-slate-300 px-2.5 py-1 rounded-full font-bold font-mono">
              المجموع: {filteredAuditLogs.length} عمليات تتبع
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-300 text-[10px] font-bold tracking-wider border-b border-white/10 select-none">
                  <th className="py-4 px-6">المعرف الفريد للمستند</th>
                  <th className="py-4 px-6">المنفذ للعملية</th>
                  <th className="py-4 px-6">الجدول المستهدف</th>
                  <th className="py-4 px-6">نوع العملية</th>
                  <th className="py-4 px-6">توقيت العملية بالتفصيل</th>
                  <th className="py-4 px-6">البيانات الفنية الفائزة (Payload)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-bold">
                      سجل التدقيق فارغ حالياً ضمن هذه الفترة المحددة.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-400 text-[10px]">
                        {log.id}
                      </td>
                      <td className="py-4 px-6 font-bold text-white">
                        {getActorName(log.performed_by)}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] font-bold text-blue-300">
                        `{log.table_name}`
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[9px] border ${
                          log.action_type === 'INSERT' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          log.action_type === 'UPDATE' ? 'bg-amber-500/20 text-amber-300 border-emerald-500/30' :
                          'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {log.action_type === 'INSERT' ? 'إدخال INSERT' :
                           log.action_type === 'UPDATE' ? 'تحديث UPDATE' : 'حذف DELETE'}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-mono font-bold text-slate-300 text-[11px]">
                        {new Date(log.created_at).toLocaleString('ar-OM', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit'
                        })}
                      </td>
                      <td className="py-4 px-6">
                        <pre className="p-2 bg-slate-950/40 border border-white/10 rounded-lg text-[10px] text-slate-300 font-mono max-w-sm overflow-x-auto">
                          {JSON.stringify(log.payload, null, 2)}
                        </pre>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>

      {/* ========================================================= */}
      {/* PRINT-ONLY AUDIT & FINANCIAL REPORT COVER SHEET (A4 PDF)  */}
      {/* ========================================================= */}
      <div className="hidden print:block bg-white text-slate-900 p-8 rtl text-right font-sans" dir="rtl">
        {/* Header Block */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5 mb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest block">نظام نجم السحابي لإدارة الضيافة ChaletCloud</span>
            <h1 className="text-xl font-black text-slate-950">التقرير المالي الفني الشامل وسجل الرقابة</h1>
            <p className="text-xs text-slate-500 font-medium">سند رسمي لتفاصيل الإيرادات وحركات التدقيق في الحجوزات</p>
          </div>
          <div className="text-left text-xs font-mono font-bold text-slate-900 space-y-1">
            <div>التاريخ: {new Date().toLocaleDateString('ar-OM', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
            <div>الوقت: {new Date().toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit' })}</div>
            <div>المشغل: {activeUser?.full_name || 'المدير المسؤول'}</div>
            <div className="text-[10px] text-blue-600">الصفة: {activeUser?.role === 'super_admin' ? 'المدير العام المالك' : 'مسؤول النظام'}</div>
          </div>
        </div>

        {/* Corporate Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="border border-slate-300 p-3.5 rounded-lg bg-slate-50">
            <span className="text-[9px] font-bold text-slate-500 block">إجمالي الإيرادات الفعلية</span>
            <span className="text-[16px] font-black text-emerald-700 font-mono block mt-1">{totalRevenue} ر.ع.</span>
            <span className="text-[8px] text-slate-400 block mt-0.5">مؤكد وعمليات منتهية فقط</span>
          </div>
          <div className="border border-slate-300 p-3.5 rounded-lg bg-slate-50">
            <span className="text-[9px] font-bold text-slate-500 block">إجمالي عدد الحجوزات</span>
            <span className="text-[16px] font-black text-slate-950 font-mono block mt-1">{totalBookings} حجز</span>
            <span className="text-[8px] text-slate-400 block mt-0.5">موزعة على كافة الحالات</span>
          </div>
          <div className="border border-slate-300 p-3.5 rounded-lg bg-slate-50">
            <span className="text-[9px] font-bold text-slate-300 block">الحجوزات النشطة المؤكدة</span>
            <span className="text-[16px] font-black text-blue-700 font-mono block mt-1">{confirmedCount} حجز</span>
            <span className="text-[8px] text-slate-400 block mt-0.5">جاهزة للاستعمال</span>
          </div>
          <div className="border border-slate-300 p-3.5 rounded-lg bg-slate-50">
            <span className="text-[9px] font-bold text-slate-500 block">الطلبات قيد المراجعة</span>
            <span className="text-[16px] font-black text-amber-700 font-mono block mt-1">{pendingCount} طلب</span>
            <span className="text-[8px] text-slate-400 block mt-0.5">تحتاج قرار مباشر</span>
          </div>
        </div>

        {/* Section 1: Detailed List */}
        <div className="space-y-3 mb-8">
          <h3 className="text-xs font-black text-slate-950 border-r-4 border-blue-600 pr-2 pb-0.5">أولاً: تفاصيل كشف الحجوزات والإيرادات للنزلاء</h3>
          <table className="w-full text-right border-collapse border border-slate-200 text-[10px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-2 border border-slate-200">رمز الحجز</th>
                <th className="p-2 border border-slate-200">النزيل الكريم</th>
                <th className="p-2 border border-slate-200">بيانات الاتصال</th>
                <th className="p-2 border border-slate-200">المرفق المحجوز</th>
                <th className="p-2 border border-slate-200">تاريخ الدخول</th>
                <th className="p-2 border border-slate-200">تاريخ المغادرة</th>
                <th className="p-2 border border-slate-200">نوع الإقامة</th>
                <th className="p-2 border border-slate-200">المبلغ المقبوض</th>
                <th className="p-2 border border-slate-200">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-4 text-center text-slate-400 font-bold">لا توجد حجوزات مسجلة للفترة المحددة</td>
                </tr>
              ) : (
                filteredBookings.map(b => (
                  <tr key={b.id} className="border-b border-slate-200 text-slate-800">
                    <td className="p-2 border border-slate-200 font-bold font-mono text-[9px]">{b.ref_code}</td>
                    <td className="p-2 border border-slate-200 font-bold">{b.guest_name}</td>
                    <td className="p-2 border border-slate-200 font-mono text-[9px]">{b.guest_phone}</td>
                    <td className="p-2 border border-slate-200">{getPropertyName(b.property_id)}</td>
                    <td className="p-2 border border-slate-200 font-mono text-[9px]">{b.check_in}</td>
                    <td className="p-2 border border-slate-200 font-mono text-[9px]">{b.check_out}</td>
                    <td className="p-2 border border-slate-200">
                      {b.booking_type === 'full_day' ? 'يوم كامل' : 'نصف يوم'}
                    </td>
                    <td className="p-2 border border-slate-200 font-bold font-mono text-slate-950 text-emerald-700">{b.total_price} ر.ع.</td>
                    <td className="p-2 border border-slate-200 font-semibold">
                      {b.status === 'confirmed' ? 'مؤكد ونشط' :
                       b.status === 'completed' ? 'مكتمل' :
                       b.status === 'pending' ? 'قيد الانتظار' : 'ملغي'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Section 2: Audit Logs */}
        <div className="space-y-3 mb-8" style={{ pageBreakBefore: 'always' }}>
          <h3 className="text-xs font-black text-slate-950 border-r-4 border-amber-500 pr-2 pb-0.5">ثانياً: سجل تعقب وتدقيق العمليات الإدارية الفنية</h3>
          <table className="w-full text-right border-collapse border border-slate-200 text-[9px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 font-bold">
                <th className="p-2 border border-slate-200">رقم الحركة</th>
                <th className="p-2 border border-slate-200">الموظف المسؤول</th>
                <th className="p-2 border border-slate-200">الجدول المستهدف</th>
                <th className="p-2 border border-slate-200">نوع الحركة</th>
                <th className="p-2 border border-slate-200">تاريخ وساعة التعديل</th>
                <th className="p-2 border border-slate-200">ملخص العملية</th>
              </tr>
            </thead>
            <tbody>
              {filteredAuditLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-slate-400 font-bold">لا توجد عمليات تدقيق مسجلة للفترة المحددة</td>
                </tr>
              ) : (
                filteredAuditLogs.map(log => (
                  <tr key={log.id} className="border-b border-slate-200 text-slate-800">
                    <td className="p-2 border border-slate-200 font-mono text-[8px] text-slate-500">{log.id}</td>
                    <td className="p-2 border border-slate-200 font-bold">{getActorName(log.performed_by)}</td>
                    <td className="p-2 border border-slate-200 font-mono text-blue-700 text-[9px]">`{log.table_name}`</td>
                    <td className="p-2 border border-slate-200 font-bold">
                      {log.action_type === 'INSERT' ? 'إضافة جديد [INSERT]' :
                       log.action_type === 'UPDATE' ? 'تعديل [UPDATE]' : 'حذف [DELETE]'}
                    </td>
                    <td className="p-2 border border-slate-200 font-mono text-[9px]">{new Date(log.created_at).toLocaleString('ar-OM')}</td>
                    <td className="p-2 border border-slate-200 font-mono text-[8px] truncate max-w-xs">{JSON.stringify(log.payload)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Corporate Stamps and Validation block */}
        <div className="grid grid-cols-3 gap-6 pt-12 text-center text-xs text-slate-700 mt-12 border-t border-dashed border-slate-300">
          <div className="space-y-12">
            <p className="font-extrabold">توقيع المدقق المالي المسؤول</p>
            <div className="w-40 border-b border-slate-400 mx-auto"></div>
            <p className="text-[10px] text-slate-400 font-mono">{activeUser?.full_name}</p>
          </div>
          <div className="space-y-12">
            <p className="font-extrabold">ختم المؤسسة والاعتماد الرسمي</p>
            <div className="w-20 h-20 border-2 border-dashed border-blue-400/50 rounded-full flex items-center justify-center text-[9px] text-blue-500 font-bold uppercase rotate-12 mx-auto select-none">
              STAR CHALET CO
            </div>
            <p className="text-[10px] text-slate-450 font-mono">STAR CHALET SAAS</p>
          </div>
          <div className="space-y-12">
            <p className="font-extrabold">اعتماد الإدارة العامة للنظام</p>
            <div className="w-40 border-b border-slate-400 mx-auto"></div>
            <p className="text-[10px] text-slate-400">إدارة ChaletCloud الموحدة</p>
          </div>
        </div>
      </div>
    </>
  );
};
