/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  Plus, 
  X, 
  User, 
  Phone, 
  Mail, 
  CalendarDays, 
  Clock, 
  Tag, 
  Trash2,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Info,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Booking, Property, Settings } from '../types';
import { DatabaseService, checkOverlappingBookings, getCurrentlySimulatedUser } from '../services/db';

interface BookingsPageProps {
  forceOpenAdd?: number;
  initialPropertyId?: string;
}

const parseTimeToFloat = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h + (m || 0) / 60;
};

// TimeRangeSlider: Allows selecting check-in and check-out times via a dual-thumb slider.
// Uses two synchronized range inputs (0-24 hours) to simulate a range slider.
// startTime and endTime are strings in "HH:MM" format.
const TimeRangeSlider: React.FC<{
  startTime: string;
  endTime: string;
  onChange: (start: string, end: string) => void;
}> = ({ startTime, endTime, onChange }) => {
  // Convert "HH:MM" to number of minutes for easier handling.
  const timeToMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + (m || 0);
  };
  const minutesToTime = (min: number) => {
    const h = Math.floor(min / 60)
      .toString()
      .padStart(2, '0');
    const m = (min % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const [startMin, setStartMin] = React.useState(timeToMinutes(startTime));
  const [endMin, setEndMin] = React.useState(timeToMinutes(endTime));

  // Ensure start never exceeds end.
  const handleStartChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.min(Number(e.target.value), endMin);
    setStartMin(val);
    onChange(minutesToTime(val), minutesToTime(endMin));
  };
  const handleEndChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Math.max(Number(e.target.value), startMin);
    setEndMin(val);
    onChange(minutesToTime(startMin), minutesToTime(val));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span>وقت الدخول: {minutesToTime(startMin)}</span>
        <span>وقت المغادرة: {minutesToTime(endMin)}</span>
      </div>
      <div className="relative h-6">
        {/* Slider track */}
        <div className="absolute inset-0 flex items-center">
          <div className="flex-1 h-2 bg-white/10 rounded" />
        </div>
        {/* Start thumb */}
        <input
          type="range"
          min={0}
          max={1440}
          step={15}
          value={startMin}
          onChange={handleStartChange}
          className="absolute w-full h-6 appearance-none bg-transparent cursor-pointer thumb-thumb-left"
        />
        {/* End thumb */}
        <input
          type="range"
          min={0}
          max={1440}
          step={15}
          value={endMin}
          onChange={handleEndChange}
          className="absolute w-full h-6 appearance-none bg-transparent cursor-pointer thumb-thumb-right"
        />
      </div>
    </div>
  );
};

const VisualTimeline: React.FC<{
  dateStr: string;
  bookedRanges: Array<{ guestName: string; startHour: number; endHour: number }>;
  selectedStartHour: number;
  selectedEndHour: number;
}> = ({ dateStr, bookedRanges, selectedStartHour, selectedEndHour }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div className="space-y-2 select-none text-right">
      <span className="text-[11px] text-slate-300 font-bold block">مخطط إشغال اليوم المختار ({dateStr}):</span>
      <div className="flex border border-white/10 rounded-xl overflow-hidden h-8 bg-slate-900/50">
        {hours.map(h => {
          const isBooked = bookedRanges.some(r => h >= r.startHour && h < r.endHour);
          const isSelected = h >= selectedStartHour && h < selectedEndHour;
          
          let bgClass = "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400/40";
          if (isBooked) {
            bgClass = "bg-rose-500/30 text-rose-350 border-r border-rose-500/20";
          } else if (isSelected) {
            bgClass = "bg-blue-600 text-white font-bold";
          }
          
          return (
            <div 
              key={h} 
              className={`flex-1 flex items-center justify-center text-[9px] font-mono border-l border-white/5 transition-all ${bgClass}`}
              title={isBooked ? "فترة محجوزة مسبقاً" : isSelected ? "اختيارك الحالي" : `الساعة ${h}:00 متاحة`}
            >
              {h}
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-[9px] text-slate-400 px-1 font-mono">
        <span>00:00</span>
        <span>06:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>24:00</span>
      </div>
      <div className="flex gap-4 justify-end text-[9px] font-semibold">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-blue-600" /> اختيارك الحالي</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/30" /> محجوز مسبقاً</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/10" /> متاح شاغر</span>
      </div>
    </div>
  );
};

export const BookingsPage: React.FC<BookingsPageProps> = ({ forceOpenAdd, initialPropertyId }) => {
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [settings, setSettings] = React.useState<Settings | null>(null);
  
  // Controls
  const [isAdding, setIsAdding] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [propertyFilter, setPropertyFilter] = React.useState<string>('all');

  // New Booking State
  const [newBooking, setNewBooking] = React.useState({
    property_id: '',
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    check_in: '',
    check_out: '',
    booking_type: 'full_day' as 'full_day' | 'half_day',
    check_in_time: '08:00',
    check_out_time: '18:00',
  });

  const [validationError, setValidationError] = React.useState<{ ar: string; en: string } | null>(null);
  const [estimatedPrice, setEstimatedPrice] = React.useState<number>(0);

  // Custom pricing schemas states
  const [useHolidayRate, setUseHolidayRate] = React.useState<boolean>(false);
  const [discountInput, setDiscountInput] = React.useState<number>(0);

  // Questionnaire Wizard states
  const [wizardStep, setWizardStep] = React.useState<number>(1);
  const [selectedCity, setSelectedCity] = React.useState<string>('');
  const [customPriceMode, setCustomPriceMode] = React.useState<'auto' | 'manual'>('auto');
  const [manualPrice, setManualPrice] = React.useState<number>(0);
  const [calendarViewDate, setCalendarViewDate] = React.useState<Date>(new Date());
  
  // Main view preference for bookings history
  const [mainViewMode, setMainViewMode] = React.useState<'table' | 'calendar'>('table');
  const [mainCalendarDate, setMainCalendarDate] = React.useState<Date>(new Date());
  const [mainSelectedDayBookings, setMainSelectedDayBookings] = React.useState<Booking[] | null>(null);
  const [mainSelectedDayDate, setMainSelectedDayDate] = React.useState<Date | null>(null);

  const currentUser = getCurrentlySimulatedUser();
  const isBookingStaff = currentUser.role === 'booking_staff';
  const currencySymbol = settings?.currency_name || 'ر.ع.';

  const loadData = async () => {
    const props = await DatabaseService.getProperties();
    const books = await DatabaseService.getBookings();
    const settingsData = await DatabaseService.getSettings();
    setProperties(props);
    setBookings(books);
    setSettings(settingsData);

    // Initial property ID for form if empty
    if (props.length > 0 && !newBooking.property_id) {
      setNewBooking(prev => ({ ...prev, property_id: props[0].id }));
    }
  };

  React.useEffect(() => {
    if (forceOpenAdd && forceOpenAdd > 0) {
      setIsAdding(true);
      setValidationError(null);
      if (initialPropertyId && properties.length > 0) {
        const prop = properties.find(p => p.id === initialPropertyId);
        if (prop) {
          setNewBooking(prev => ({
            ...prev,
            property_id: initialPropertyId,
            booking_type: 'full_day',
            check_in: '',
            check_out: ''
          }));
          setSelectedCity(prop.city);
          setWizardStep(3); // Start directly at booking type select
        }
      }
    }
  }, [forceOpenAdd, initialPropertyId, properties]);

  React.useEffect(() => {
    loadData();
  }, []);

  // Sync first available property in selected city automatically 
  React.useEffect(() => {
    if (selectedCity && properties.length > 0) {
      const filtered = properties.filter(p => p.city === selectedCity);
      if (filtered.length > 0) {
        setNewBooking(prev => ({ ...prev, property_id: filtered[0].id }));
      }
    }
  }, [selectedCity, properties]);

  // Sync estimated price to manual price initially so it matches
  React.useEffect(() => {
    if (estimatedPrice > 0) {
      setManualPrice(estimatedPrice);
    }
  }, [estimatedPrice]);

  // Sync default property discount and reset holiday rate on property selection
  React.useEffect(() => {
    if (newBooking.property_id && properties.length > 0) {
      const prop = properties.find(p => p.id === newBooking.property_id);
      if (prop) {
        setDiscountInput(prop.discount_amount || 0);
        setUseHolidayRate(false);
      }
    }
  }, [newBooking.property_id, properties]);

  // Helper to determine the status of a specific date for selected property
  const getDateBookingStatus = (dateStr: string): 'available' | 'partial' | 'booked' => {
    if (!newBooking.property_id) return 'available';
    const targetDate = new Date(dateStr);
    targetDate.setHours(0, 0, 0, 0);

    const dayBookings = bookings.filter(b => {
      if (b.property_id !== newBooking.property_id) return false;
      if (b.status === 'cancelled') return false;

      const checkInDate = new Date(b.check_in);
      checkInDate.setHours(0, 0, 0, 0);

      const checkOutDate = new Date(b.check_out);
      checkOutDate.setHours(0, 0, 0, 0);

      return targetDate >= checkInDate && targetDate <= checkOutDate;
    });

    if (dayBookings.length === 0) return 'available';

    // If any booking on this day is a full day booking, it is fully booked
    if (dayBookings.some(b => b.booking_type === 'full_day')) {
      return 'booked';
    }

    return 'partial';
  };

  const isDateBooked = (dateStr: string) => {
    return getDateBookingStatus(dateStr) === 'booked';
  };

  // Recalculate price estimation and validate date overlaps in real-time
  React.useEffect(() => {
    if (!newBooking.property_id || !newBooking.check_in || !newBooking.check_out) {
      setEstimatedPrice(0);
      setValidationError(null);
      return;
    }

    const prop = properties.find(p => p.id === newBooking.property_id);
    if (!prop) return;

    const startStr = newBooking.booking_type === 'half_day'
      ? `${newBooking.check_in}T${newBooking.check_in_time || '08:00'}:00`
      : `${newBooking.check_in}T00:00:00`;
    const endStr = newBooking.booking_type === 'half_day'
      ? `${newBooking.check_out}T${newBooking.check_out_time || '18:00'}:00`
      : `${newBooking.check_out}T00:00:00`;

    const start = new Date(startStr);
    const end = new Date(endStr);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setValidationError(null);
      return;
    }

    if (start >= end) {
      setValidationError({
        ar: 'خطأ: تاريخ المغادرة والوقت يجب أن يكون لاحقاً لتاريخ الدخول والوقت.',
        en: 'Error: Check-out must be after check-in.'
      });
      setEstimatedPrice(0);
      return;
    }

    // Check overlaps
    const overlapResult = checkOverlappingBookings(
      newBooking.property_id, 
      startStr, 
      endStr
    );

    if (overlapResult.hasOverlap) {
      setValidationError({
        ar: overlapResult.reasonAr,
        en: overlapResult.reasonEn
      });
    } else {
      setValidationError(null);
    }

    // Calculate nights / days count
    const diffTime = Math.abs(end.getTime() - start.getTime());
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays < 1) diffDays = 1;

    let baseRate = 0;
    if (newBooking.booking_type === 'half_day') {
      if (useHolidayRate) {
        const holidayRate = prop.price_holiday || prop.price_half_day || 0;
        baseRate = diffDays * holidayRate;
      } else {
        // Calculate weekdays vs weekends
        let weekdaysCount = 0;
        let weekendsCount = 0;
        let temp = new Date(start);
        for (let i = 0; i < diffDays; i++) {
          const day = temp.getDay();
          // Weekends in GCC/Oman chalets: Thursday, Friday, Saturday
          if (day === 4 || day === 5 || day === 6) {
            weekendsCount++;
          } else {
            weekdaysCount++;
          }
          temp.setDate(temp.getDate() + 1);
        }
        const halfWeekdayRate = prop.price_half_day_weekday || prop.price_half_day || 0;
        const halfWeekendRate = prop.price_half_day_weekend || prop.price_half_day || 0;
        baseRate = (weekdaysCount * halfWeekdayRate) + (weekendsCount * halfWeekendRate);
      }
    } else {
      if (useHolidayRate) {
        const holidayRate = prop.price_holiday || prop.price_full_day || 0;
        baseRate = diffDays * holidayRate;
      } else {
        // Calculate weekdays vs weekends
        let weekdaysCount = 0;
        let weekendsCount = 0;
        let temp = new Date(start);
        for (let i = 0; i < diffDays; i++) {
          const day = temp.getDay();
          // Weekends in GCC/Oman chalets: Thursday, Friday, Saturday
          if (day === 4 || day === 5 || day === 6) {
            weekendsCount++;
          } else {
            weekdaysCount++;
          }
          temp.setDate(temp.getDate() + 1);
        }
        const weekdayRate = prop.price_weekday || prop.price_full_day || 0;
        const weekendRate = prop.price_weekend || prop.price_full_day || 0;
        baseRate = (weekdaysCount * weekdayRate) + (weekendsCount * weekendRate);
      }
    }

    // Apply discount
    const finalPrice = Math.max(0, baseRate - (discountInput || 0));
    setEstimatedPrice(finalPrice);

  }, [newBooking, properties, useHolidayRate, discountInput]);

  const handleCreateBookingSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (validationError) {
      alert(validationError.ar);
      return;
    }

    const finalPrice = customPriceMode === 'manual' ? manualPrice : estimatedPrice;

    const startISO = newBooking.booking_type === 'half_day'
      ? new Date(`${newBooking.check_in}T${newBooking.check_in_time || '08:00'}:00`).toISOString()
      : new Date(`${newBooking.check_in}T00:00:00`).toISOString();
    const endISO = newBooking.booking_type === 'half_day'
      ? new Date(`${newBooking.check_out}T${newBooking.check_out_time || '18:00'}:00`).toISOString()
      : new Date(`${newBooking.check_out}T00:00:00`).toISOString();

    try {
      await DatabaseService.createBooking({
        property_id: newBooking.property_id,
        guest_name: newBooking.guest_name,
        guest_phone: newBooking.guest_phone,
        guest_email: newBooking.guest_email,
        check_in: startISO,
        check_out: endISO,
        booking_type: newBooking.booking_type,
        status: 'pending',
        total_price: finalPrice,
        created_by: currentUser.id
      });

      // Clear state
      setIsAdding(false);
      setNewBooking({
        property_id: properties[0]?.id || '',
        guest_name: '',
        guest_phone: '',
        guest_email: '',
        check_in: '',
        check_out: '',
        booking_type: 'full_day',
        check_in_time: '08:00',
        check_out_time: '18:00',
      });
      setValidationError(null);
      
      // Reset Wizard parameters
      setWizardStep(1);
      setSelectedCity('');
      setCustomPriceMode('auto');
      setManualPrice(0);

      await loadData();
    } catch (err: any) {
      alert(err.message || 'فشلت عملية إنشاء الحجز.');
    }
  };

  const handleUpdateStatus = async (booking: Booking, nextStatus: Booking['status']) => {
    try {
      const updated = { ...booking, status: nextStatus };
      await DatabaseService.updateBooking(updated);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'فشلت عملية تغيير الحالة لقاعدة البيانات.');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('هل أنت متأكد من رغبتك في حذف هذا الملف نهائياً من أرشيف النظام؟')) {
      await DatabaseService.deleteBooking(id);
      await loadData();
    }
  };

  // Filters calculation
  const filteredBookings = bookings.filter(b => {
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const nameMatch = b.guest_name.toLowerCase().includes(term);
      const phoneMatch = b.guest_phone.toLowerCase().includes(term);
      const emailMatch = b.guest_email.toLowerCase().includes(term);
      const refMatch = b.ref_code.toLowerCase().includes(term);
      if (!nameMatch && !phoneMatch && !emailMatch && !refMatch) return false;
    }

    // Status filter
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;

    // Property filter
    if (propertyFilter !== 'all' && b.property_id !== propertyFilter) return false;

    return true;
  });

  const getPropName = (id: string) => {
    return properties.find(p => p.id === id)?.name || 'عقار غير معرف';
  };

  const statusBadgeAr: Record<Booking['status'], { label: string; style: string }> = {
    pending: { label: 'قيد الانتظار', style: 'bg-amber-500/20 text-amber-300 border border-amber-500/30' },
    confirmed: { label: 'مؤكد ونشط', style: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' },
    cancelled: { label: 'ملغي', style: 'bg-rose-500/20 text-rose-300 border border-rose-500/30' },
    completed: { label: 'مكتمل وسابق', style: 'bg-white/10 text-slate-300 border border-white/10' },
  };

  return (
    <div className="space-y-6 text-slate-100 animate-fadeIn">
      
      {/* Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 frosted p-5 rounded-2xl border border-white/10 shadow-lg animate-slideLeft">
        <div>
          <h2 className="text-xl font-extrabold text-white">سجل ومنصة الحجوزات الآمنة</h2>
          <p className="text-xs text-slate-300 mt-1">تتبع تداخل التواريخ المانع للأخطاء، تعديل الحالات والعملاء، ومطابقة الرسوم</p>
        </div>
        
        <button 
          id="btn-add-booking"
          onClick={() => {
            setIsAdding(!isAdding);
            setValidationError(null);
          }}
          className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-650/10 hover:bg-blue-500 transition-all cursor-pointer border border-blue-500/25"
        >
          {isAdding ? <X className="w-4.5 h-4.5 ml-1" /> : <Plus className="w-4.5 h-4.5 ml-1" />}
          {isAdding ? 'إغلاق نافذة الحجز' : 'إدراج حجز جديد مباشر'}
        </button>
      </div>

      {/* Overlapping alert indicator context for testing */}
      <div className="p-3.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl flex items-start gap-2.5 text-xs">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold text-white block mb-0.5">منع حجز الفواصل الذكي (Riyadh, Abha, AlUla):</span>
          <span>يقوم النظام بفحص التواريخ والتحقق من عدم تداخل الحجوزات لذات العقار قبل التسجيل لمنع الحجوزات المزدوجة.</span>
        </div>
      </div>

      {/* Add New Booking Panel - Independent Popup Modal */}
      {isAdding && (
        <div id="booking-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn" dir="rtl">
          <div className="relative w-full max-w-4xl bg-[#0b0f19] frosted text-slate-100 rounded-2xl p-6 md:p-8 shadow-2xl space-y-6 border border-white/15 max-h-[90vh] overflow-y-auto animate-scaleUp">
            
            {/* Close button */}
            <button 
              type="button"
              onClick={() => setIsAdding(false)}
              className="absolute top-4 left-4 p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-all cursor-pointer border border-white/5"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header & Stepper Status bar */}
            <div className="border-b border-white/10 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-3 pt-6 md:pt-2">
            <div>
              <h3 className="font-extrabold text-sm text-blue-400">استبيان الحجز التفاعلي الذكي (Wizard Checklist)</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">خطوة بخطوة لسهولة حجز وجدولة المرفق الفندقي</p>
            </div>
            {/* Steps indicator */}
            <div className="flex items-center gap-1.5 overflow-x-auto select-none py-1">
              {[
                { s: 1, name: 'المدينة' },
                { s: 2, name: 'العقار' },
                { s: 3, name: 'النمط' },
                { s: 4, name: 'التقويم والتواريخ' },
                { s: 5, name: 'النزيل' },
                { s: 6, name: 'المراجع والرسوم' }
              ].map((stepItem) => (
                <div key={stepItem.s} className="flex items-center gap-1 shrink-0">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-extrabold transition-all ${
                    wizardStep === stepItem.s 
                      ? 'bg-blue-600 text-white font-mono scale-110 shadow-md ring-2 ring-blue-400/35'
                      : wizardStep > stepItem.s
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-white/5 text-slate-400 border border-white/10'
                  }`}>
                    {stepItem.s}
                  </span>
                  <span className={`text-[10px] font-bold ${wizardStep === stepItem.s ? 'text-white' : 'text-slate-400'}`}>
                    {stepItem.s === 1 && 'المدينة'}
                    {stepItem.s === 2 && 'العقار'}
                    {stepItem.s === 3 && 'نوع الحجز'}
                    {stepItem.s === 4 && 'التاريخ'}
                    {stepItem.s === 5 && 'النزيل'}
                    {stepItem.s === 6 && 'السعر'}
                  </span>
                  {stepItem.s < 6 && <span className="text-slate-500 text-[10px]">←</span>}
                </div>
              ))}
            </div>
          </div>

          {/* QUESTIONNAIRE BODY STEPS */}
          
          {/* STEP 1: CITY BUTTONS SELECTION */}
          {wizardStep === 1 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-right">
                <span className="text-[10px] bg-blue-600/20 text-blue-300 px-2.5 py-1 rounded-full font-bold">المرحلة الأولى</span>
                <h4 className="text-sm font-extrabold text-white mt-1.5">في أي مدينة ترغب بجدولة وحجز العقار؟</h4>
                <p className="text-xs text-slate-350">اختر إحدى المدن المسجلة حالياً في النظام لتصفية المجمعات والشاليهات المتاحة فيها:</p>
              </div>

              {properties.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-bold bg-white/5 rounded-xl border border-white/10">
                  لا توجد عقارات مسجلة حالياً لتحديد المدن.
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {(Array.from(new Set(properties.map(p => p.city))) as string[]).map((city) => {
                    const count = properties.filter(p => p.city === city).length;
                    const cityLabelsAr: Record<string, string> = {
                      riyadh: 'الرياض',
                      abha: 'أبها',
                      alula: 'العلا',
                      muscat: 'مسقط',
                      salalah: 'صلالة',
                      nizwa: 'نزوى'
                    };
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setSelectedCity(city);
                          setWizardStep(2);
                        }}
                        className={`p-5 rounded-2xl border text-center transition-all group flex flex-col items-center justify-center cursor-pointer ${
                          selectedCity === city 
                            ? 'bg-blue-600 text-white border-blue-500 shadow-xl' 
                            : 'bg-white/5 border-white/10 hover:border-blue-500/50 hover:bg-white/10'
                        }`}
                      >
                        <span className="block text-sm font-black mb-1 group-hover:text-blue-300 transition-colors">
                          {cityLabelsAr[city] || city}
                        </span>
                        <span className={`block text-[10px] font-bold ${selectedCity === city ? 'text-white/80' : 'text-slate-400'}`}>
                          {count} شاليهات / مرافق متوفرة
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: PROPERTY SELECTION */}
          {wizardStep === 2 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-right flex items-center justify-between">
                <div>
                  <span className="text-[10px] bg-blue-600/20 text-blue-300 px-2.5 py-1 rounded-full font-bold">المرحلة الثانية</span>
                  <h4 className="text-sm font-extrabold text-white mt-1.5">
                    اختر الشاليه أو المرفق المفضل في مدينة ({
                      ({ riyadh: 'الرياض', abha: 'أبها', alula: 'العلا', muscat: 'مسقط', salalah: 'صلالة', nizwa: 'نزوى' } as Record<string, string>)[selectedCity] || selectedCity
                    }):
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="text-xs text-slate-400 hover:text-white underline font-semibold cursor-pointer"
                >
                  تغيير المدينة ←
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {properties.filter(p => p.city === selectedCity).map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setNewBooking(prev => ({ ...prev, property_id: p.id }));
                      setWizardStep(3);
                    }}
                    className={`p-4 rounded-2xl border cursor-pointer select-none transition-all flex gap-4 items-center ${
                      newBooking.property_id === p.id
                        ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/5'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
                    }`}
                  >
                    <img 
                      src={p.image_url} 
                      alt={p.name} 
                      className="w-16 h-16 rounded-xl object-cover shrink-0 border border-white/5" 
                      referrerPolicy="no-referrer"
                    />
                    <div className="space-y-1 min-w-0 text-right flex-1">
                      <h4 className="font-extrabold text-xs text-white truncate">{p.name}</h4>
                      <p className="text-[10px] text-slate-350 truncate">{p.location_text}</p>
                      <div className="flex gap-2.5 items-center text-[10px] font-bold text-slate-450 mt-1 select-none">
                        <span className="text-blue-300 font-mono font-bold">{p.price_full_day} {currencySymbol} يوم كامل</span>
                        <span>|</span>
                        <span className="text-purple-300 font-mono font-bold">{p.price_half_day} {currencySymbol} نصف يوم</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {properties.filter(p => p.city === selectedCity).length === 0 && (
                <div className="p-8 text-center text-slate-400 font-bold bg-white/5 rounded-xl border border-white/10">
                  لا توجد مرافق أو شاليهات في هذه المدينة حالياً.
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setWizardStep(1)}
                  className="px-4 py-2 bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  السابق (المدينة)
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: BOOKING TYPE SELECTION */}
          {wizardStep === 3 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-right flex items-center justify-between">
                <div>
                  <span className="text-[10px] bg-blue-600/20 text-blue-300 px-2.5 py-1 rounded-full font-bold">المرحلة الثالثة</span>
                  <h4 className="text-sm font-extrabold text-white mt-1.5">ما هو تفضيل ونمط الحجوزات المطلوبة؟</h4>
                </div>
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="text-xs text-slate-400 hover:text-white underline font-semibold cursor-pointer"
                >
                  تغيير العقار ←
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div
                  onClick={() => {
                    setNewBooking(prev => ({ ...prev, booking_type: 'full_day' }));
                    setWizardStep(4);
                  }}
                  className={`p-6 rounded-2xl border text-center cursor-pointer select-none transition-all space-y-3 ${
                    newBooking.booking_type === 'full_day'
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <CalendarDays className="w-8 h-8 text-blue-400 mx-auto animate-pulse" />
                  <h4 className="font-extrabold text-sm text-white">يوم كامل ومبيت (Full Day)</h4>
                  <p className="text-[11px] text-slate-300 font-medium max-w-xs mx-auto leading-relaxed">
                    حجز المرفق الفندقي بالكامل شامل المبيت والمغادرة في صبيحة اليوم التالي طبقاً للبروتوكول.
                  </p>
                  {properties.find(p => p.id === newBooking.property_id) && (
                    <span className="inline-block text-[11px] bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full font-mono font-bold">
                      التعرفة: {properties.find(p => p.id === newBooking.property_id)?.price_full_day} {currencySymbol} / يوم
                    </span>
                  )}
                </div>

                <div
                  onClick={() => {
                    setNewBooking(prev => ({ ...prev, booking_type: 'half_day' }));
                    setWizardStep(4);
                  }}
                  className={`p-6 rounded-2xl border text-center cursor-pointer select-none transition-all space-y-3 ${
                    newBooking.booking_type === 'half_day'
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <Clock className="w-8 h-8 text-purple-400 mx-auto" />
                  <h4 className="font-extrabold text-sm text-white">نصف يوم وبدون مبيت (Half Day)</h4>
                  <p className="text-[11px] text-slate-300 font-medium max-w-xs mx-auto leading-relaxed">
                    استخدام سريع للاستجمام أو المناسبات القصيرة دون المبيت، بأسعار اقتصادية مرنة ومخفضة.
                  </p>
                  {properties.find(p => p.id === newBooking.property_id) && (
                    <span className="inline-block text-[11px] bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full font-mono font-bold">
                      التعرفة: {properties.find(p => p.id === newBooking.property_id)?.price_half_day} {currencySymbol} / يوم
                    </span>
                  )}
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setWizardStep(2)}
                  className="px-4 py-2 bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  السابق (العقار)
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: CALENDAR OCCUPANCY SCHEDULER */}
          {wizardStep === 4 && (() => {
            const year = calendarViewDate.getFullYear();
            const month = calendarViewDate.getMonth();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday is 0, ...
            
            const daysOfWeek = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
            const arabicMonthNames = [
              'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
              'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
            ];

            const cells: (number | null)[] = [];
            for (let i = 0; i < firstDayIndex; i++) {
              cells.push(null);
            }
            for (let d = 1; d <= daysInMonth; d++) {
              cells.push(d);
            }

            const currentProp = properties.find(p => p.id === newBooking.property_id);

            const handleCalendarDayClick = (dayNum: number) => {
              const mm = String(month + 1).padStart(2, '0');
              const dd = String(dayNum).padStart(2, '0');
              const dateStr = `${year}-${mm}-${dd}`;

              if (isDateBooked(dateStr)) {
                alert('عذراً، هذا التاريخ تم حجزه مسبقاً لعقارات هذا المعمل. يرجى اختيار تاريخ شاغر آخر.');
                return;
              }

              if (newBooking.booking_type === 'half_day') {
                setNewBooking(prev => ({
                  ...prev,
                  check_in: dateStr,
                  check_out: dateStr
                }));
                return;
              }

              if (!newBooking.check_in || (newBooking.check_in && newBooking.check_out)) {
                setNewBooking(prev => ({
                  ...prev,
                  check_in: dateStr,
                  check_out: ''
                }));
              } else {
                if (dateStr < newBooking.check_in) {
                  setNewBooking(prev => ({
                    ...prev,
                    check_in: dateStr,
                    check_out: ''
                  }));
                } else if (dateStr === newBooking.check_in) {
                  setNewBooking(prev => ({
                    ...prev,
                    check_in: '',
                    check_out: ''
                  }));
                } else {
                  // Validate middle overlaps
                  let hasOver = false;
                  let cursor = new Date(newBooking.check_in);
                  const end = new Date(dateStr);
                  while (cursor <= end) {
                    const cursorStr = cursor.toISOString().split('T')[0];
                    if (isDateBooked(cursorStr)) {
                      hasOver = true;
                      break;
                    }
                    cursor.setDate(cursor.getDate() + 1);
                  }

                  if (hasOver) {
                    alert('عذراً، لا يمكن اختيار تاريخ مغادرة يضم فترات محجوزة مسبقاً بالداخل.');
                    return;
                  }

                  setNewBooking(prev => ({
                    ...prev,
                    check_out: dateStr
                  }));
                }
              }
            };

            const dayBookings = newBooking.check_in
              ? bookings
                  .filter(b => {
                    if (b.property_id !== newBooking.property_id) return false;
                    if (b.status === 'cancelled') return false;

                    const targetDate = new Date(newBooking.check_in);
                    targetDate.setHours(0, 0, 0, 0);

                    const checkInDate = new Date(b.check_in);
                    checkInDate.setHours(0, 0, 0, 0);

                    const checkOutDate = new Date(b.check_out);
                    checkOutDate.setHours(0, 0, 0, 0);

                    return targetDate >= checkInDate && targetDate <= checkOutDate;
                  })
                  .map(b => {
                    const start = new Date(b.check_in);
                    const end = new Date(b.check_out);
                    const startHour = start.getHours() + start.getMinutes() / 60;
                    const endHour = end.getHours() + end.getMinutes() / 60;
                    return {
                      guestName: b.guest_name,
                      startHour,
                      endHour
                    };
                  })
              : [];

            return (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-right flex items-center justify-between">
                  <div>
                    <span className="text-[10px] bg-blue-600/20 text-blue-300 px-2.5 py-1 rounded-full font-bold">المرحلة الرابعة (نمط التقويم والشاغر المباشر)</span>
                    <h4 className="text-sm font-extrabold text-white mt-1.5">جدول الحجوزات للعقار والتواريخ المتوفرة:</h4>
                    <p className="text-[11px] text-slate-300">
                      {newBooking.booking_type === 'half_day'
                        ? 'انقر على اليوم الذي تود حجزه، ثم حدد أوقات الدخول والخروج بالأسفل:'
                        : 'انقر على يوم الدخول، ثم انقر على يوم الخروج لتظليل فترة الإقامة:'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="text-xs text-slate-400 hover:text-white underline font-semibold cursor-pointer"
                  >
                    تغيير نمط الحجز ←
                  </button>
                </div>

                <div className="p-4 bg-slate-950/40 rounded-2xl border border-white/10 space-y-4">
                  {/* Month header controls */}
                  <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5 select-none text-xs">
                    <button
                      type="button"
                      onClick={() => setCalendarViewDate(new Date(year, month - 1, 1))}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 font-bold transition-all text-[10px] cursor-pointer"
                    >
                      ← الشهر السابق
                    </button>
                    <span className="font-extrabold text-white text-[12px] font-mono">
                      {arabicMonthNames[month]} {year}
                    </span>
                    <button
                      type="button"
                      onClick={() => setCalendarViewDate(new Date(year, month + 1, 1))}
                      className="px-2.5 py-1 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 font-bold transition-all text-[10px] cursor-pointer"
                    >
                      الشهر التالي →
                    </button>
                  </div>

                  {/* Calendar main grid */}
                  <div className="grid grid-cols-7 gap-1 bg-black/10 p-2.5 rounded-xl border border-white/5 text-center">
                    {daysOfWeek.map(dName => (
                      <div key={dName} className="text-[10px] font-bold text-slate-400 py-1">
                        {dName}
                      </div>
                    ))}
                    {cells.map((dayNum, cellIdx) => {
                      if (dayNum === null) {
                        return <div key={`empty-${cellIdx}`} className="aspect-square bg-transparent" />;
                      }

                      const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                      const status = getDateBookingStatus(cellDateStr);
                      const booked = status === 'booked';
                      const partial = status === 'partial';
                      
                      const selected = newBooking.check_in && (
                        newBooking.check_out
                          ? (cellDateStr >= newBooking.check_in && cellDateStr <= newBooking.check_out)
                          : cellDateStr === newBooking.check_in
                      );

                      const checkInActive = cellDateStr === newBooking.check_in;
                      const checkOutActive = cellDateStr === newBooking.check_out;

                      let classColors = "bg-white/5 text-slate-100 hover:bg-white/10 border-white/5";
                      if (booked) {
                        classColors = "bg-rose-500/10 text-rose-300 border-rose-500/10 line-through cursor-not-allowed opacity-80";
                      } else if (selected) {
                        classColors = "bg-blue-600/90 text-white border-blue-500 font-black shadow-lg shadow-blue-650/40";
                      } else if (partial) {
                        classColors = "bg-purple-500/25 text-purple-300 border-purple-500/30 hover:bg-purple-500/35";
                      }

                      return (
                        <button
                          key={`day-btn-${dayNum}`}
                          type="button"
                          disabled={booked}
                          onClick={() => handleCalendarDayClick(dayNum)}
                          className={`relative aspect-square rounded-xl border text-[11px] font-mono font-bold flex flex-col items-center justify-center cursor-pointer transition-all ${classColors}`}
                        >
                          <span>{dayNum}</span>
                          {checkInActive && <span className="absolute bottom-0.5 text-[7px] font-sans font-black bg-emerald-500 text-white px-1 py-0.5 rounded-md leading-none scale-90">وصول</span>}
                          {checkOutActive && <span className="absolute bottom-0.5 text-[7px] font-sans font-black bg-amber-500 text-white px-1 py-0.5 rounded-md leading-none scale-90">مغادرة</span>}
                          {booked && <span className="absolute bottom-0.5 text-[7px] font-sans font-black bg-rose-500/20 text-rose-400 px-1 py-0.5 rounded-md leading-none scale-90 select-none">محجوز</span>}
                          {(!checkInActive && !checkOutActive && !booked && partial) && <span className="absolute bottom-0.5 text-[7px] font-sans font-black bg-purple-500 text-white px-1 py-0.5 rounded-md leading-none scale-90 select-none">جزئي</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Range visual checkouts output logs or timeline details */}
                  {newBooking.booking_type === 'half_day' && newBooking.check_in && (
                    <div className="space-y-4 p-3.5 bg-white/5 rounded-xl border border-white/5 text-right">
                      <VisualTimeline
                        dateStr={newBooking.check_in}
                        bookedRanges={dayBookings}
                        selectedStartHour={parseTimeToFloat(newBooking.check_in_time)}
                        selectedEndHour={parseTimeToFloat(newBooking.check_out_time)}
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                    <TimeRangeSlider
                      startTime={newBooking.check_in_time}
                      endTime={newBooking.check_out_time}
                      onChange={(start, end) =>
                        setNewBooking(prev => ({
                          ...prev,
                          check_in_time: start,
                          check_out_time: end,
                        }))
                      }
                    />
                      </div>
                    </div>
                  )}

                  {!(newBooking.booking_type === 'half_day') && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 bg-white/5 rounded-xl border border-white/5 text-right select-none">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 font-semibold block">تاريخ الدخول والوصول:</span>
                        <span className="text-xs font-mono font-extrabold text-blue-300">
                          {newBooking.check_in ? newBooking.check_in : 'انقر يوما للشروع'}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-400 font-semibold block">تاريخ الخروج والمغادرة:</span>
                        <span className="text-xs font-mono font-extrabold text-blue-300">
                          {newBooking.check_out ? newBooking.check_out : 'شغّل المغادرة متمماً النطاق'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {validationError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{validationError.ar}</span>
                  </div>
                )}

                <div className="flex justify-between pt-2 border-t border-white/10 gap-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(3)}
                    className="px-4 py-2 bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    السابق (نمط الحجز)
                  </button>

                  <button
                    type="button"
                    disabled={!newBooking.check_in || !newBooking.check_out || Boolean(validationError)}
                    onClick={() => setWizardStep(5)}
                    className={`px-5 py-2 rounded-lg text-xs font-extrabold cursor-pointer ${
                      (!newBooking.check_in || !newBooking.check_out || Boolean(validationError))
                        ? 'bg-slate-800 text-slate-450 border-white/5 cursor-not-allowed'
                        : 'bg-blue-600 text-white border-blue-500/20 hover:bg-blue-500'
                    }`}
                  >
                    التالي (بيانات النزيل) ←
                  </button>
                </div>
              </div>
            );
          })()}

          {/* STEP 5: REGISTRATION CUSTOMER INFO (NAME & PHONE MANDATORY, EMAIL OPTIONAL) */}
          {wizardStep === 5 && (
            <div className="space-y-4 animate-fadeIn">
              <div className="text-right flex items-center justify-between">
                <div>
                  <span className="text-[10px] bg-blue-600/20 text-blue-300 px-2.5 py-1 rounded-full font-bold">المرحلة الخامسة (المفتاح القانوني والأمني)</span>
                  <h4 className="text-sm font-extrabold text-white mt-1.5">أدخل معلومات الضيف والنزيل المسجل:</h4>
                  <p className="text-[11px] text-slate-300">الاسم والمسؤولية الهاتفية إجباريين لجدولة النظام لمتابعة السجلات</p>
                </div>
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="text-xs text-slate-400 hover:text-white underline font-semibold cursor-pointer"
                >
                  الرجوع للتقويم ←
                </button>
              </div>

              <div className="space-y-4 max-w-xl mx-auto">
                {/* Guest Name */}
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-black text-slate-350">اسم النزيل بالكامل * <span className="text-rose-400">(إجباري)</span></label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-405 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="عبدالله بن راشد المعمري"
                      value={newBooking.guest_name}
                      onChange={(e) => setNewBooking({ ...newBooking, guest_name: e.target.value })}
                      className="w-full bg-slate-950/40 border border-white/10 text-white pl-4 pr-10 rounded-xl text-xs py-2.5 font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Guest Phone */}
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-black text-slate-350">رقم هاتف النزيل المعتمد * <span className="text-rose-400">(إجباري)</span></label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-400 font-bold font-mono text-[10px] pointer-events-none">968+</span>
                    <input
                      type="tel"
                      required
                      placeholder="99554433"
                      value={newBooking.guest_phone}
                      onChange={(e) => setNewBooking({ ...newBooking, guest_phone: e.target.value })}
                      className="w-full bg-slate-950/40 border border-white/10 text-white pl-4 pr-12 rounded-xl text-xs py-2.5 font-mono font-bold focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Guest Email */}
                <div className="space-y-1.5 text-right">
                  <label className="block text-xs font-black text-slate-350">البريد الإلكتروني للنزيل <span className="text-slate-400 font-normal hover:text-white">(اختياري)</span></label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3 flex items-center text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      placeholder="customer@domain.om"
                      value={newBooking.guest_email}
                      onChange={(e) => setNewBooking({ ...newBooking, guest_email: e.target.value })}
                      className="w-full bg-slate-950/40 border border-white/10 text-white pl-4 pr-10 rounded-xl text-xs py-2.5 font-bold font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-white/10 gap-2">
                <button
                  type="button"
                  onClick={() => setWizardStep(4)}
                  className="px-4 py-2 bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  السابق (التقويم)
                </button>

                <button
                  type="button"
                  disabled={!newBooking.guest_name.trim() || !newBooking.guest_phone.trim()}
                  onClick={() => setWizardStep(6)}
                  className={`px-5 py-2 rounded-lg text-xs font-extrabold cursor-pointer ${
                    (!newBooking.guest_name.trim() || !newBooking.guest_phone.trim())
                      ? 'bg-slate-800 text-slate-450 border-white/5 cursor-not-allowed'
                      : 'bg-blue-600 text-white border-blue-500/20 hover:bg-blue-500'
                  }`}
                >
                  التالي (مراجعة السعر والرسوم) ←
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: PRICE CALCULATION & CONFIRMATION (AUTO OR CUSTOM MANUAL AMOUNT) */}
          {wizardStep === 6 && (() => {
            const currentProp = properties.find(p => p.id === newBooking.property_id);
            return (
              <div className="space-y-4 animate-fadeIn">
                <div className="text-right flex items-center justify-between">
                  <div>
                    <span className="text-[10px] bg-blue-600/20 text-blue-300 px-2.5 py-1 rounded-full font-bold">المرحلة السادسة والأخيرة (المطابقة والترسيس)</span>
                    <h4 className="text-sm font-extrabold text-white mt-1.5 font-sans">تأكيد ومراجعة الرسوم وتفاصيل العملية:</h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWizardStep(5)}
                    className="text-xs text-slate-400 hover:text-white underline font-semibold cursor-pointer"
                  >
                    تعديل الاسم أو الهاتف ←
                  </button>
                </div>

                {/* Overviews checklist */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-950/40 rounded-xl border border-white/10 text-right space-y-2 select-none">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">موجز الحجز الملحق</span>
                    <div className="space-y-1 text-xs text-slate-300 leading-relaxed font-semibold">
                      <p>• العقار: <span className="text-white font-extrabold">{currentProp?.name}</span></p>
                      <p>• المدينة: <span className="text-white font-extrabold">{
                        selectedCity === 'riyadh' ? 'الرياض' : selectedCity === 'abha' ? 'أبها' : selectedCity === 'alula' ? 'العلا' : selectedCity
                      }</span></p>
                      <p>• نمط الحجز: <span className="text-blue-300">{newBooking.booking_type === 'full_day' ? 'يوم كامل ومبيت' : 'نصف يوم بدون مبيت'}</span></p>
                      <p>• الفترات: {newBooking.booking_type === 'half_day' ? (
                        <>
                          <span className="text-slate-100 font-mono font-bold">{newBooking.check_in}</span>
                          <span className="text-purple-400 font-mono font-bold text-xs mr-2">({newBooking.check_in_time} - {newBooking.check_out_time})</span>
                        </>
                      ) : (
                        <>من <span className="text-slate-100 font-mono font-bold">{newBooking.check_in}</span> إلى <span className="text-slate-100 font-mono font-bold">{newBooking.check_out}</span></>
                      )}</p>
                      {(() => {
                        if (!newBooking.check_in || !newBooking.check_out || !currentProp) return null;
                        const start = new Date(newBooking.check_in);
                        const end = new Date(newBooking.check_out);
                        const diffTime = Math.abs(end.getTime() - start.getTime());
                        let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        if (diffDays < 1) diffDays = 1;

                        let weekdaysCount = 0;
                        let weekendsCount = 0;
                        let temp = new Date(start);
                        for (let i = 0; i < diffDays; i++) {
                          const day = temp.getDay();
                          if (day === 4 || day === 5 || day === 6) {
                            weekendsCount++;
                          } else {
                            weekdaysCount++;
                          }
                          temp.setDate(temp.getDate() + 1);
                        }

                        const wdayRate = currentProp.price_weekday || currentProp.price_full_day || 0;
                        const wendRate = currentProp.price_weekend || currentProp.price_full_day || 0;
                        const holRate = currentProp.price_holiday || currentProp.price_full_day || 0;

                        return (
                          <div className="mt-2 space-y-1 bg-white/5 p-2 rounded-lg border border-white/5 text-[11px] text-slate-350">
                            <div className="flex justify-between">
                              <span>• عدد الأيام:</span>
                              <span className="text-emerald-400 font-extrabold">{diffDays} يوم</span>
                            </div>
                            {newBooking.booking_type === 'full_day' ? (
                              <>
                                <div className="flex justify-between">
                                  <span>• أيام وسط الأسبوع:</span>
                                  <span>{weekdaysCount} يوم × {wdayRate} {currencySymbol}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>• عطلة نهاية الأسبوع:</span>
                                  <span>{weekendsCount} يوم × {wendRate} {currencySymbol}</span>
                                </div>
                                {useHolidayRate && (
                                  <div className="flex justify-between text-amber-400 font-bold border-t border-white/5 pt-1 mt-1">
                                    <span>• سعر الإجازات/المواسم المطبق:</span>
                                    <span>{holRate} {currencySymbol}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <>
                                {useHolidayRate ? (
                                  <div className="flex justify-between text-amber-400 font-bold border-t border-white/5 pt-1 mt-1">
                                    <span>• سعر الإجازات/المواسم المطبق:</span>
                                    <span>{currentProp.price_holiday || currentProp.price_half_day || 0} {currencySymbol}</span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex justify-between">
                                      <span>• أيام وسط الأسبوع (نصف يوم):</span>
                                      <span>{weekdaysCount} يوم × {currentProp.price_half_day_weekday || currentProp.price_half_day || 0} {currencySymbol}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>• عطلة نهاية الأسبوع (نصف يوم):</span>
                                      <span>{weekendsCount} يوم × {currentProp.price_half_day_weekend || currentProp.price_half_day || 0} {currencySymbol}</span>
                                    </div>
                                  </>
                                )}
                              </>
                            )}
                            {discountInput > 0 && (
                              <div className="flex justify-between text-rose-400 font-bold border-t border-white/5 pt-1 mt-1">
                                <span>• الخصم المباشر المطبق:</span>
                                <span>-{discountInput} {currencySymbol}</span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/40 rounded-xl border border-white/10 text-right space-y-2 select-none">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">معلومات الاتصال بالنزيل</span>
                    <div className="space-y-1 text-xs text-slate-300 leading-relaxed font-semibold">
                      <p>• الاسم: <span className="text-white font-extrabold">{newBooking.guest_name}</span></p>
                      <p>• الهاتف: <span className="text-white font-mono font-bold">{newBooking.guest_phone}</span></p>
                      <p>• البريد: <span className="text-white font-mono font-bold">{newBooking.guest_email || 'لا يوجد'}</span></p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-4">
                  {/* Custom pricing schema fields: holiday pricing & discount */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-white/5">
                    {/* Holiday Rate Toggle */}
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-200 block">تفعيل تسعيرة الأعياد والمناسبات</span>
                        <span className="text-[10px] text-slate-400">تطبيق سعر الإجازات الخاص بالعقار</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setUseHolidayRate(!useHolidayRate)}
                        className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${
                          useHolidayRate ? 'bg-blue-600' : 'bg-slate-800'
                        }`}
                      >
                        <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                          useHolidayRate ? 'right-7' : 'right-1'
                        }`} />
                      </button>
                    </div>

                    {/* Discount Input */}
                    <div className="space-y-1.5 text-right">
                      <label className="block text-xs font-bold text-slate-350">الخصم المباشر المطبق ({currencySymbol})</label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 font-bold text-xs pointer-events-none">{currencySymbol}</span>
                        <input
                          type="number"
                          min="0"
                          value={discountInput || ''}
                          onChange={(e) => setDiscountInput(e.target.value ? Number(e.target.value) : 0)}
                          placeholder="مثال: 15"
                          className="w-full bg-slate-950/40 border border-white/10 text-white rounded-lg text-xs py-1.5 pl-9 pr-3 outline-none focus:border-blue-500 font-mono font-bold text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400">تعديل أو قبول المبلغ المستحق مخصصاً</span>
                    <p className="text-[11px] text-slate-300">حدد ما إذا كنت تريد اعتماد المبلغ التلقائي المسعر للعقار (المحسوب أعلاه)، أو إدخال مبلغ مخصص يدوياً مخصوماً أو معدلاً:</p>
                  </div>

                  {/* Mode Buttons selection */}
                  <div className="flex flex-col md:flex-row gap-3">
                    <button
                      type="button"
                      onClick={() => setCustomPriceMode('auto')}
                      className={`flex-1 p-3.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        customPriceMode === 'auto'
                          ? 'bg-blue-600 text-white border-blue-500 shadow-lg'
                          : 'bg-slate-950/40 text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      أوتوماتيكي (تلقائي للعقار): {estimatedPrice} {currencySymbol}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomPriceMode('manual')}
                      className={`flex-1 p-3.5 rounded-xl border text-xs font-bold text-center transition-all ${
                        customPriceMode === 'manual'
                          ? 'bg-purple-600 text-white border-purple-500 shadow-lg'
                          : 'bg-slate-950/40 text-slate-300 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      إدخال مبلغ مخصص يدوياً (يدوي)
                    </button>
                  </div>

                  {/* Manual price inputs box */}
                  {customPriceMode === 'manual' && (
                    <div className="p-3 bg-black/25 rounded-xl border border-purple-500/20 text-right space-y-1.5 animate-fadeIn">
                      <label className="block text-xs font-bold text-slate-300">عيّن قيمة الحساب اليدوي الكلية ({currencySymbol}) *</label>
                      <div className="relative max-w-xs">
                        <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 font-bold text-xs select-none">{currencySymbol}</span>
                        <input
                          type="number"
                          required
                          min="0"
                          value={manualPrice}
                          onChange={(e) => setManualPrice(Number(e.target.value))}
                          className="w-full bg-slate-950/50 border border-white/15 text-white pl-9 pr-3 rounded-xl text-xs py-2 focus:outline-none focus:border-purple-500 font-mono font-bold text-center"
                        />
                      </div>
                    </div>
                  )}

                  {/* Final computed/defined outputs summary */}
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-center justify-between text-right">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-400 font-bold block">إجمالي القيمة الفائزة النهائية المعتمدة:</span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-black text-rose-400 font-mono">
                          {customPriceMode === 'manual' ? manualPrice : estimatedPrice}
                        </span>
                        <span className="text-xs text-slate-300 font-black">{currencySymbol}</span>
                        <span className="text-[9px] text-slate-400 mr-1 select-none">({customPriceMode === 'auto' ? 'حساب تلقائي حسب الجدول' : 'تخصيص يدوي مباشر'})</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsAdding(false)}
                        className="px-4 py-2 bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold cursor-pointer hover:bg-white/20"
                      >
                        إلغاء تماماً
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCreateBookingSubmit()}
                        className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-extrabold hover:bg-emerald-500 border border-emerald-500/20 cursor-pointer shadow-lg shadow-emerald-500/10 transition-colors"
                      >
                        تأكيد وحفظ الحجز وجدولة المرفق
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setWizardStep(5)}
                    className="px-4 py-2 bg-white/10 text-slate-300 hover:text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    السابق (بيانات النزيل)
                  </button>
                </div>
              </div>
            );
          })()}

          </div>
        </div>
      )}

      {/* Main List & Filters Controls */}
      <div className="frosted rounded-2xl shadow-lg border border-white/10 overflow-hidden text-slate-100">
        
        {/* Search controls inside list card */}
        <div className="p-4 bg-white/5 border-b border-white/10 flex flex-col xl:flex-row gap-4 justify-between items-center">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full xl:w-auto">
            <div className="relative w-full md:w-72">
              <span className="absolute inset-y-0 right-3 flex items-center text-slate-450">
                <Search className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                placeholder="البحث باسم النزيل، الهاتف، رمز الحجز..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/10 text-white rounded-xl text-xs py-2 pl-3 pr-10 outline-none focus:border-blue-500 font-medium"
              />
            </div>

            <div className="flex gap-2.5 w-full md:w-auto">
              {/* Filter by status */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950/40 border border-white/10 text-white text-[11px] py-1.5 px-3 rounded-lg outline-none focus:border-blue-500 cursor-pointer font-bold"
              >
                <option value="all" className="bg-slate-900 text-white">كل الحالات الحجزية</option>
                <option value="pending" className="bg-slate-900 text-white">قيد الانتظار</option>
                <option value="confirmed" className="bg-slate-900 text-white">المؤكدة الفعالة</option>
                <option value="cancelled" className="bg-slate-900 text-white">الملغاة لتوفير الشاغر</option>
                <option value="completed" className="bg-slate-900 text-white">المكتملة السابقة</option>
              </select>

              {/* Filter by properties */}
              <select
                value={propertyFilter}
                onChange={(e) => setPropertyFilter(e.target.value)}
                className="bg-slate-950/40 border border-white/10 text-white text-[11px] py-1.5 px-3 rounded-lg outline-none focus:border-blue-500 cursor-pointer font-bold font-sans"
              >
                <option value="all" className="bg-slate-900 text-white">كل الشاليهات الفندقية</option>
                {properties.map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Toggle buttons between table list and month calendar */}
          <div className="flex bg-slate-950/60 border border-white/10 rounded-xl overflow-hidden p-0.5 select-none w-full md:w-auto shrink-0 font-sans">
            <button
              type="button"
              onClick={() => {
                setMainViewMode('table');
                setMainSelectedDayDate(null);
                setMainSelectedDayBookings(null);
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                mainViewMode === 'table' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>سجل قائمة الحجوزات</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMainViewMode('calendar');
                // Auto pre-populate current date bookings
                const today = new Date();
                today.setHours(0,0,0,0);
                const todaysBookings = bookings.filter(b => {
                  const chIn = new Date(b.check_in);
                  chIn.setHours(0,0,0,0);
                  const chOut = new Date(b.check_out);
                  chOut.setHours(0,0,0,0);
                  return today >= chIn && today <= chOut;
                });
                setMainSelectedDayDate(today);
                setMainSelectedDayBookings(todaysBookings);
              }}
              className={`flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                mainViewMode === 'calendar' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>تقويم الحجوزات (Calendar View)</span>
            </button>
          </div>
        </div>

        {mainViewMode === 'table' ? (
          /* Desktop Bookings Table */
          <div className="overflow-x-auto min-h-64">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/5 text-slate-300 text-[10px] font-bold tracking-wider border-b border-white/10 select-none">
                  <th className="py-4 px-6">رمز المرجع</th>
                  <th className="py-4 px-6">تفاصيل النزيل</th>
                  <th className="py-4 px-6">المرفق المحجوز</th>
                  <th className="py-4 px-6">فترة الإقامة</th>
                  <th className="py-4 px-6">النمط</th>
                  <th className="py-4 px-6">القيمة الكلية</th>
                  <th className="py-4 px-6">الحالة المالية</th>
                  <th className="py-4 px-6 text-left">التحكم والإدارة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 text-xs">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-bold">
                      لا توجد حجوزات تطابق المعايير النشطة حالياً.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-white text-[11px]">
                        {b.ref_code}
                      </td>
                      <td className="py-4 px-6 space-y-0.5">
                        <p className="font-extrabold text-white text-sm">{b.guest_name}</p>
                        <div className="flex flex-col text-[10px] text-slate-400 font-mono font-bold leading-relaxed space-y-0.5 select-none">
                          <span>{b.guest_phone}</span>
                          <span>{b.guest_email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-300">
                        {getPropName(b.property_id)}
                      </td>
                      <td className="py-4 px-6 font-mono text-[11px] font-bold text-slate-300">
                        {b.booking_type === 'half_day' ? (
                          <>
                            <div>{new Date(b.check_in).toLocaleDateString('ar-OM', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-[9px] text-purple-400 block mt-0.5 font-bold">
                              {new Date(b.check_in).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit', hour12: false })} - {new Date(b.check_out).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit', hour12: false })}
                            </div>
                          </>
                        ) : (
                          <>
                            <div>{new Date(b.check_in).toLocaleDateString('ar-OM', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-[9px] text-slate-400 block mt-0.5">إلى {new Date(b.check_out).toLocaleDateString('ar-OM', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                          </>
                        )}
                      </td>
                      <td className="py-4 px-6 font-bold text-slate-400">
                        {b.booking_type === 'full_day' ? 'يوم مبيت' : 'نصف يوم'}
                      </td>
                      <td className="py-4 px-6 font-mono font-extrabold text-blue-300">
                        {b.total_price} {currencySymbol}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-block px-2.5 py-1 text-[10px] font-bold rounded-full ${statusBadgeAr[b.status]?.style}`}>
                          {statusBadgeAr[b.status]?.label}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-left">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Transitions */}
                          {b.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateStatus(b, 'confirmed')}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer border border-emerald-500/25 transition-all shadow-md shadow-emerald-600/10"
                            >
                              تأكيد الحجز
                            </button>
                          )}

                          {b.status === 'confirmed' && (
                            <button
                              onClick={() => handleUpdateStatus(b, 'completed')}
                              className="bg-white/10 text-slate-150 hover:bg-white/20 border border-white/10 px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all"
                            >
                              إتمام
                            </button>
                          )}

                          {/* Allowed to cancel bookings in list */}
                          {(b.status === 'pending' || b.status === 'confirmed') && (
                            <button
                              onClick={() => handleUpdateStatus(b, 'cancelled')}
                              className="bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/25 px-2.5 py-1 rounded text-[10px] font-bold cursor-pointer transition-all"
                            >
                              إلغاء حجز
                            </button>
                          )}

                          {/* Delete Booking Entirely */}
                          {!isBookingStaff && (
                            <button
                              onClick={() => handleDeleteBooking(b.id)}
                              className="p-1 px-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/25 transition-all"
                              title="شطب السجل نهائيا"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isBookingStaff && (
                            <span className="text-[10px] font-semibold text-slate-400/80">مقرر</span>
                          )}

                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (() => {
          const year = mainCalendarDate.getFullYear();
          const month = mainCalendarDate.getMonth();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday is 0

          const arabicMonthNames = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
          ];
          const weekdaysAr = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

          const cells: (number | null)[] = [];
          for (let i = 0; i < firstDayIndex; i++) {
            cells.push(null);
          }
          for (let d = 1; d <= daysInMonth; d++) {
            cells.push(d);
          }

          return (
            <div className="p-4 sm:p-6 space-y-6">
              {/* Calendar control header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center gap-2 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setMainCalendarDate(new Date(year, month - 1, 1));
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-350 hover:text-white border border-white/5 bg-white/5 transition-all cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" /> {/* Right arrow inside RTL context means heading to previous month! */}
                  </button>
                  
                  <span className="text-sm font-black text-white shrink-0 min-w-[120px] text-center font-sans">
                    {arabicMonthNames[month]} {year}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setMainCalendarDate(new Date(year, month + 1, 1));
                    }}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-slate-350 hover:text-white border border-white/5 bg-white/5 transition-all cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> {/* Left arrow inside RTL context means heading to next month! */}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2.5 text-[10px] sm:text-xs">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    مؤكد ونشط
                  </span>
                  <span className="flex items-center gap-1.5 text-amber-400 font-extrabold bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    قيد الانتظار
                  </span>
                  <span className="flex items-center gap-1.5 text-blue-400 font-extrabold bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    مكتمل
                  </span>
                  <span className="flex items-center gap-1.5 text-rose-450 font-extrabold bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    ملغي
                  </span>
                </div>
              </div>

              {/* Day Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {/* Weekday labels */}
                {weekdaysAr.map((wk, idx) => (
                  <span key={idx} className="text-[10px] sm:text-xs font-black text-slate-400 select-none pb-2 text-center">
                    {wk}
                  </span>
                ))}

                {/* Day Grid Cells */}
                {cells.map((dayNum, cellIdx) => {
                  if (dayNum === null) {
                    return (
                      <div 
                        key={`cell-empty-${cellIdx}`} 
                        className="bg-slate-950/10 rounded-xl h-20 sm:h-28 border border-transparent opacity-20 select-none" 
                      />
                    );
                  }

                  const cellDate = new Date(year, month, dayNum);
                  cellDate.setHours(0,0,0,0);

                  // Find bookings overlapping this day
                  const dayBookings = filteredBookings.filter(b => {
                    const start = new Date(b.check_in);
                    start.setHours(0,0,0,0);
                    const end = new Date(b.check_out);
                    end.setHours(0,0,0,0);
                    return cellDate >= start && cellDate <= end;
                  });

                  const isToday = new Date().toDateString() === cellDate.toDateString();
                  const isSelected = mainSelectedDayDate && mainSelectedDayDate.toDateString() === cellDate.toDateString();

                  return (
                    <button
                      key={`cell-day-${dayNum}`}
                      type="button"
                      onClick={() => {
                        setMainSelectedDayDate(cellDate);
                        setMainSelectedDayBookings(dayBookings);
                      }}
                      className={`min-h-[80px] sm:min-h-[110px] text-right p-1.5 rounded-xl border flex flex-col justify-between transition-all group overflow-hidden select-none cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/20 border-blue-500 shadow-lg shadow-blue-500/15 ring-2 ring-blue-500/50'
                          : isToday
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-md shadow-amber-500/5'
                          : 'bg-slate-950/30 border-white/10 hover:bg-white/[0.05] hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className={`text-[10px] sm:text-[11px] font-black w-5 h-5 flex items-center justify-center rounded-full ${
                          isToday ? 'bg-amber-500 text-slate-950 font-black' : isSelected ? 'bg-blue-500 text-white font-bold' : 'text-slate-300'
                        }`}>
                          {dayNum}
                        </span>
                        {dayBookings.length > 0 && (
                          <span className="text-[8px] sm:text-[9px] bg-white/10 text-slate-300 px-1 py-0.5 rounded font-black font-mono">
                            {dayBookings.length}
                          </span>
                        )}
                      </div>

                      {/* Overlapping bookings visual elements inside each cell */}
                      <div className="flex-1 mt-1.5 flex flex-col gap-0.5 w-full overflow-hidden">
                        {dayBookings.slice(0, 3).map(b => {
                          let labelStyle = "bg-amber-500/20 text-amber-300 border-amber-500/30";
                          if (b.status === 'confirmed') labelStyle = "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
                          if (b.status === 'completed') labelStyle = "bg-blue-500/20 text-blue-300 border-blue-500/30";
                          if (b.status === 'cancelled') labelStyle = "bg-rose-500/15 text-rose-300/80 border-rose-500/20 line-through";

                          const cleanPropName = getPropName(b.property_id)
                            .replace('شاليه', '')
                            .replace('منتجع', '')
                            .replace('مخيم', '')
                            .trim();

                          return (
                            <div
                              key={b.id}
                              className={`text-[7px] sm:text-[8.5px] truncate px-1 py-0.5 rounded border leading-tight font-bold font-sans ${labelStyle}`}
                              title={`${b.guest_name} • ${getPropName(b.property_id)}`}
                            >
                              {b.guest_name.split(' ')[0]} ⊷ {cleanPropName}
                            </div>
                          );
                        })}
                        {dayBookings.length > 3 && (
                          <div className="text-[7px] text-slate-400 font-extrabold text-center pt-0.5">
                            +{dayBookings.length - 3} حجوزات أخرى
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Detailed view panel for selected day */}
              {mainSelectedDayDate && (
                <div className="bg-[#121c32]/40 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-blue-500/30 shadow-2xl space-y-4 animate-scaleUp">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-blue-400 shrink-0" />
                      <h4 className="font-extrabold text-white text-xs sm:text-sm select-none">
                        جدول الحجوزات النشطة ليوم المعاينة: <span className="text-blue-300 font-black">{mainSelectedDayDate.toLocaleDateString('ar-OM', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setMainSelectedDayDate(null);
                        setMainSelectedDayBookings(null);
                      }}
                      className="text-slate-405 hover:text-white p-1 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {!mainSelectedDayBookings || mainSelectedDayBookings.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 font-bold text-xs select-none">
                      لا توجد حجوزات مجدولة للنشاط في هذا اليوم المحدد. يمكنك تجربة اختيار يوم آخر يحتوي حجز لتفصيل بياناته.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mainSelectedDayBookings.map(b => (
                        <div 
                          key={b.id} 
                          className="bg-slate-950/45 p-4 rounded-xl border border-white/10 flex flex-col justify-between space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400">
                                <span className="font-mono text-blue-300 font-bold bg-blue-500/15 px-1.5 py-0.5 rounded text-[9px] border border-blue-500/20 shrink-0">
                                  {b.ref_code}
                                </span>
                                <span className="truncate font-bold text-slate-300">{getPropName(b.property_id)}</span>
                              </div>
                              <span className="block font-black text-sm text-white truncate">{b.guest_name}</span>
                              <span className="block text-[10px] text-slate-400 font-mono font-bold leading-relaxed">{b.guest_phone} ♦ {b.guest_email}</span>
                            </div>
                            <span className={`px-2.5 py-1 text-[9px] font-black rounded-full select-none shrink-0 ${statusBadgeAr[b.status]?.style}`}>
                              {statusBadgeAr[b.status]?.label}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] bg-white/[0.02] p-2.5 rounded-lg border border-white/5 gap-2 select-none">
                            <div>
                              <span className="text-slate-400 font-bold block">{b.booking_type === 'half_day' ? 'وقت الدخول' : 'تاريخ الدخول'}</span>
                              <span className="text-slate-100 font-mono font-black block mt-0.5">
                                {new Date(b.check_in).toLocaleDateString('ar-OM', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {b.booking_type === 'half_day' && (
                                  <span className="text-purple-400 block text-[9px] mt-0.5 font-bold">
                                    {new Date(b.check_in).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block">{b.booking_type === 'half_day' ? 'وقت الخروج' : 'تاريخ المغادرة'}</span>
                              <span className="text-slate-100 font-mono font-black block mt-0.5">
                                {new Date(b.check_out).toLocaleDateString('ar-OM', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {b.booking_type === 'half_day' && (
                                  <span className="text-purple-400 block text-[9px] mt-0.5 font-bold">
                                    {new Date(b.check_out).toLocaleTimeString('ar-OM', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                  </span>
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-slate-400 font-bold block">التعرفة الإجمالية</span>
                              <span className="text-blue-300 font-mono font-black block mt-0.5 text-xs">
                                {b.total_price} {currencySymbol}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-end gap-1.5 pt-2 border-t border-white/5">
                            {b.status === 'pending' && (
                              <button
                                onClick={async () => {
                                  await handleUpdateStatus(b, 'confirmed');
                                  // Live refresh modal bookings list
                                  setMainSelectedDayBookings(prev => prev ? prev.map(item => item.id === b.id ? {...item, status: 'confirmed'} : item) : null);
                                }}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer border border-emerald-500/25 transition-all shadow-md shadow-emerald-500/15"
                              >
                                تأكيد الحجز ونشره
                              </button>
                            )}
                            {b.status === 'confirmed' && (
                              <button
                                onClick={async () => {
                                  await handleUpdateStatus(b, 'completed');
                                  setMainSelectedDayBookings(prev => prev ? prev.map(item => item.id === b.id ? {...item, status: 'completed'} : item) : null);
                                }}
                                className="bg-white/10 text-slate-150 hover:bg-white/20 border border-white/10 px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                              >
                                إتمام الإقامة بنجاح
                              </button>
                            )}
                            {(b.status === 'pending' || b.status === 'confirmed') && (
                              <button
                                onClick={async () => {
                                  await handleUpdateStatus(b, 'cancelled');
                                  setMainSelectedDayBookings(prev => prev ? prev.map(item => item.id === b.id ? {...item, status: 'cancelled'} : item) : null);
                                }}
                                className="bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/25 px-3 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all"
                              >
                                إلغاء هذا الحجز
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })()}

      </div>

    </div>
  );
};
