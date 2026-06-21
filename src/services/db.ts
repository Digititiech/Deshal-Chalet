/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Property, Booking, Profile, Settings, Notification, AuditLog, BookingLog, UserRole } from '../types';

// Default initial profiles matching requested SaaS roles
const DEFAULT_PROFILES: Profile[] = [
  {
    id: 'p-1',
    full_name: 'أحمد بن سعيد الحارثي',
    email: 'admin@starchalet.com',
    role: 'super_admin',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=120',
    password: '111',
    assigned_property_ids: [],
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'p-2',
    full_name: 'سالم بن خليفة البلوشي',
    email: 'manager@starchalet.com',
    role: 'company_manager',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=120',
    password: '222',
    assigned_property_ids: [],
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'p-3',
    full_name: 'ماجد بن محمد المعمري',
    email: 'pm_riyadh@starchalet.com',
    role: 'property_manager',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
    password: '333',
    assigned_property_ids: ['prop-1'],
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: 'p-4',
    full_name: 'فاطمة بنت يوسف الجابري',
    email: 'staff@starchalet.com',
    role: 'booking_staff',
    status: 'active',
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=120',
    password: '444',
    assigned_property_ids: ['prop-1', 'prop-2'],
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  }
];

// Initial properties corresponding closely to Stitch design specs
const DEFAULT_PROPERTIES: Property[] = [
  {
    id: 'prop-1',
    name: 'منتجع الرمال الذهبية',
    ref_code: 'REF-1042',
    city: 'riyadh',
    state_province: 'منطقة الرياض',
    country: 'المملكة العربية السعودية',
    address_details: 'حي الثمامة، شارع الثمامة العام',
    type: 'resort',
    status: 'available',
    price_full_day: 450,
    price_half_day: 250,
    rating: 4.90,
    rooms: 4,
    amenities: ['مسبح خاص', 'شاشة عملاقة', 'موقف خاص', 'مطبخ مجهز', 'إنترنت سريع'],
    size_sqm: 850,
    image_url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
    location_text: 'الثمامة، الرياض',
    created_at: new Date().toISOString(),
  },
  {
    id: 'prop-2',
    name: 'شاليه الأفق العالي',
    ref_code: 'REF-2291',
    city: 'abha',
    state_province: 'منطقة عسير',
    country: 'المملكة العربية السعودية',
    address_details: 'منتزه السودة، طريق السحاب',
    type: 'chalet',
    status: 'occupied',
    price_full_day: 320,
    price_half_day: 180,
    rating: 4.70,
    rooms: 3,
    amenities: ['مدفأة شتوية', 'إطلالة جبلية', 'جلسة خارجية', 'حديقة خاصة', 'منطقة شواء'],
    size_sqm: 420,
    image_url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=800',
    location_text: 'السودة، أبها',
    created_at: new Date().toISOString(),
  },
  {
    id: 'prop-3',
    name: 'مخيم النجوم الملكي',
    ref_code: 'REF-3005',
    city: 'alula',
    state_province: 'منطقة المدينة المنورة',
    country: 'المملكة العربية السعودية',
    address_details: 'منطقة الحجر، العلا القديمة',
    type: 'camp',
    status: 'available',
    price_full_day: 580,
    price_half_day: 350,
    rating: 5.00,
    rooms: 1,
    amenities: ['تلسكوب النجوم', 'حوض جاكوزي خارجي', 'منطقة إشعال النار', 'شواء فاخر', 'مروحة تبريد'],
    size_sqm: 200,
    image_url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&q=80&w=800',
    location_text: 'صحراء العلا، العلا',
    created_at: new Date().toISOString(),
  }
];

// Initial bookings designed to populate charts and calendars realistically
const DEFAULT_BOOKINGS: Booking[] = [
  {
    id: 'b-1',
    ref_code: '#CH-892',
    property_id: 'prop-2',
    guest_name: 'سليمان الرشيدي',
    guest_phone: '+966 50 123 4567',
    guest_email: 'suleiman@gmail.com',
    check_in: new Date(Date.now() - 3600000 * 24).toISOString(), // Yesterday
    check_out: new Date(Date.now() + 3600000 * 48).toISOString(), // Tomorrow
    booking_type: 'full_day',
    status: 'confirmed',
    total_price: 960,
    created_by: 'p-4',
    created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
  {
    id: 'b-2',
    ref_code: '#CH-905',
    property_id: 'prop-1',
    guest_name: 'خلود العتيبي',
    guest_phone: '+966 55 987 6543',
    guest_email: 'kholoud@yahoo.com',
    check_in: new Date(Date.now() + 3600000 * 72).toISOString(), // In 3 days
    check_out: new Date(Date.now() + 3600000 * 96).toISOString(),
    booking_type: 'half_day',
    status: 'pending',
    total_price: 250,
    created_by: 'p-3',
    created_at: new Date().toISOString(),
  },
  {
    id: 'b-3',
    ref_code: '#CH-114',
    property_id: 'prop-3',
    guest_name: 'عبدالرحمن بن سعود',
    guest_phone: '+968 9988 7766',
    guest_email: 'saud-h@muscat.om',
    check_in: new Date(Date.now() + 3600000 * 120).toISOString(), // In 5 days
    check_out: new Date(Date.now() + 3600000 * 168).toISOString(),
    booking_type: 'full_day',
    status: 'confirmed',
    total_price: 1160,
    created_by: 'p-2',
    created_at: new Date(Date.now() - 3600000 * 96).toISOString(),
  }
];

const DEFAULT_SETTINGS: Settings = {
  id: 'set-1',
  company_name: 'The Star Chalet',
  currency_code: 'OMR',
  currency_name: 'ر.ع.',
  tax_rate: 5.00,
  price_multiplier: 1.00,
  updated_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
};

const DEFAULT_NOTIFICATIONS: Notification[] = [
  {
    id: 'n-1',
    title: 'تأكيد حجز جديد',
    message: 'تم تأكيد الحجز #CH-114 لمخيم النجوم الملكي للعميل عبدالرحمن بن سعود.',
    type: 'success',
    is_read: false,
    created_at: new Date().toISOString(),
  },
  {
    id: 'n-2',
    title: 'حجز قيد المراجعة',
    message: 'الحجز #CH-905 لمنتجع الرمال الذهبية يتطلب الموافقة والتحقق المالي.',
    type: 'warning',
    is_read: false,
    created_at: new Date(Date.now() - 60000 * 30).toISOString(),
  }
];

// Helper to write/read to localStorage with fallback safety
const getStorageObj = <T>(key: string, defaultVal: T): T => {
  try {
    const val = localStorage.getItem(key);
    if (!val) {
      localStorage.setItem(key, JSON.stringify(defaultVal));
      return defaultVal;
    }
    return JSON.parse(val) as T;
  } catch {
    return defaultVal;
  }
};

const setStorageObj = <T>(key: string, val: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error('Storage quota exceeded or unavailable', e);
  }
};

// State storage variables
class LocalDatabase {
  getProfiles() { return getStorageObj<Profile[]>('tsc_profiles', DEFAULT_PROFILES); }
  setProfiles(profiles: Profile[]) { setStorageObj('tsc_profiles', profiles); }

  getProperties() { return getStorageObj<Property[]>('tsc_properties', DEFAULT_PROPERTIES); }
  setProperties(projs: Property[]) { setStorageObj('tsc_properties', projs); }

  getBookings() { return getStorageObj<Booking[]>('tsc_bookings', DEFAULT_BOOKINGS); }
  setBookings(bookings: Booking[]) { setStorageObj('tsc_bookings', bookings); }

  getSettings() { return getStorageObj<Settings>('tsc_settings', DEFAULT_SETTINGS); }
  setSettings(settings: Settings) { setStorageObj('tsc_settings', settings); }

  getNotifications() { return getStorageObj<Notification[]>('tsc_notifications', DEFAULT_NOTIFICATIONS); }
  setNotifications(notifs: Notification[]) { setStorageObj('tsc_notifications', notifs); }

  getAuditLogs() { return getStorageObj<AuditLog[]>('tsc_audit_logs', []); }
  setAuditLogs(logs: AuditLog[]) { setStorageObj('tsc_audit_logs', logs); }
}

const localDB = new LocalDatabase();

// Current User State simulation (for beautiful staff/admin switching inside preview)
let CURRENT_USER_PROFILE: Profile = DEFAULT_PROFILES[0]; // Admin by default

export function getCurrentlySimulatedUser(): Profile {
  try {
    const cached = localStorage.getItem('tsc_current_sim_user');
    if (cached) {
      const parsed = JSON.parse(cached);
      const matches = localDB.getProfiles().find(p => p.id === parsed.id);
      if (matches) return matches;
    }
  } catch {}
  return CURRENT_USER_PROFILE;
}

export function setCurrentlySimulatedUser(profile: Profile) {
  CURRENT_USER_PROFILE = profile;
  localStorage.setItem('tsc_current_sim_user', JSON.stringify(profile));
}

// Global Conflict Checker for Riyadh, Abha, and AlUla Properties (Safety Loop)
export function checkOverlappingBookings(
  propertyId: string, 
  checkInDateStr: string, 
  checkOutDateStr: string, 
  excludeBookingId?: string
): { hasOverlap: boolean; reasonAr: string; reasonEn: string } {
  const checkIn = new Date(checkInDateStr);
  const checkOut = new Date(checkOutDateStr);
  
  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    return { hasOverlap: false, reasonAr: '', reasonEn: '' };
  }
  
  if (checkIn >= checkOut) {
    return { 
      hasOverlap: true, 
      reasonAr: 'خطأ: تاريخ المغادرة يجب أن يكون بعد تاريخ الدخول.', 
      reasonEn: 'Error: Check-out must be after check-in date.' 
    };
  }

  const allBookings = localDB.getBookings();
  const property = localDB.getProperties().find(p => p.id === propertyId);
  const propName = property ? property.name : 'العقار المحدد';

  // Conflict is defined as: confirmed/pending booking on same property, whose slot intersects
  const conflict = allBookings.find(b => {
    if (b.property_id !== propertyId) return false;
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (b.status === 'cancelled' || b.status === 'completed') return false;

    const bIn = new Date(b.check_in);
    const bOut = new Date(b.check_out);

    // Overlap formula: (StartA < EndB) and (EndA > StartB)
    return checkIn < bOut && checkOut > bIn;
  });

  if (conflict) {
    const formattedConflictIn = new Date(conflict.check_in).toLocaleDateString('ar-OM', { month: 'short', day: 'numeric' });
    const formattedConflictOut = new Date(conflict.check_out).toLocaleDateString('ar-OM', { month: 'short', day: 'numeric' });
    return {
      hasOverlap: true,
      reasonAr: `تعذر تأكيد الحجز: تداخل مع حجز العميل (${conflict.guest_name}) من تاريخ ${formattedConflictIn} إلى ${formattedConflictOut} في ${propName}.`,
      reasonEn: `Cannot book: Overlaps with booking of (${conflict.guest_name}) from ${formattedConflictIn} to ${formattedConflictOut} at ${property?.name || 'Selected Property'}.`
    };
  }

  return { hasOverlap: false, reasonAr: '', reasonEn: '' };
}

// ---------------------------------------------------------------------------------------
// EXPORTED COMPREHENSIVE DATA OPERATIONS LAYER WITH AUTOMATIC SUPABASE SYNC / FAILSAFE
// ---------------------------------------------------------------------------------------

export const DatabaseService = {
  // Config Status
  isLiveSupabase(): boolean {
    return isSupabaseConfigured;
  },

  // 1. Settings Operations
  async getSettings(): Promise<Settings> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('settings').select('*').single();
      if (!error && data) return data as Settings;
    }
    return localDB.getSettings();
  },

  async updateSettings(settings: Settings): Promise<Settings> {
    const updated = { ...settings, updated_at: new Date().toISOString() };
    if (isSupabaseConfigured && supabase) {
      await supabase.from('settings').update(updated).eq('id', settings.id);
    }
    localDB.setSettings(updated);
    this.createAuditLog('settings', 'UPDATE', settings.id, updated);
    return updated;
  },

  // 2. Profiles / Users Operations
  async getProfiles(): Promise<Profile[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_properties (
            property_id
          )
        `);
      if (!error && data) {
        return data.map((p: any) => ({
          ...p,
          assigned_property_ids: p.user_properties?.map((up: any) => up.property_id) || []
        })) as Profile[];
      }
    }
    return localDB.getProfiles();
  },

  async createProfile(profile: Omit<Profile, 'id' | 'created_at'>): Promise<Profile> {
    let id = 'p-' + Math.random().toString(36).substr(2, 9);
    let newProfile: Profile = {
      ...profile,
      id,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      // 1. Call database RPC function to create the user in auth.users & trigger profiles
      const { data: newUserId, error } = await supabase.rpc('admin_create_user', {
        u_email: profile.email,
        u_password: profile.password || '123',
        u_full_name: profile.full_name,
        u_role: profile.role,
        u_avatar_url: profile.avatar_url || ''
      });
      if (error) {
        throw new Error(error.message);
      }
      if (newUserId) {
        id = newUserId;
        newProfile = {
          ...profile,
          id,
          created_at: new Date().toISOString()
        };
        // 2. Link properties in user_properties mapping table
        if (profile.assigned_property_ids && profile.assigned_property_ids.length > 0) {
          const insertData = profile.assigned_property_ids.map(propId => ({
            profile_id: id,
            property_id: propId
          }));
          await supabase.from('user_properties').insert(insertData);
        }
      }
    } else {
      const current = localDB.getProfiles();
      localDB.setProfiles([...current, newProfile]);
    }
    this.createAuditLog('profiles', 'INSERT', id, newProfile);
    return newProfile;
  },

  async updateProfile(profile: Profile): Promise<Profile> {
    const updated = { ...profile, updated_at: new Date().toISOString() };
    if (isSupabaseConfigured && supabase) {
      // 1. Fetch current profile to check password changes
      const { data: oldProfile } = await supabase.from('profiles').select('password').eq('id', profile.id).single();
      
      // 2. Update profiles table (omitting assigned_property_ids)
      const { error: updateError } = await supabase.from('profiles').update({
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        status: profile.status,
        avatar_url: profile.avatar_url,
        updated_at: updated.updated_at
      }).eq('id', profile.id);
      if (updateError) {
        throw new Error(updateError.message);
      }

      // 3. Reset password in auth.users if changed
      if (profile.password && (!oldProfile || oldProfile.password !== profile.password)) {
        const { error: pwdError } = await supabase.rpc('admin_reset_password', {
          u_user_id: profile.id,
          u_new_password: profile.password
        });
        if (pwdError) {
          throw new Error(pwdError.message);
        }
      }

      // 4. Update user_properties mappings
      await supabase.from('user_properties').delete().eq('profile_id', profile.id);
      if (profile.assigned_property_ids && profile.assigned_property_ids.length > 0) {
        const insertData = profile.assigned_property_ids.map(propId => ({
          profile_id: profile.id,
          property_id: propId
        }));
        await supabase.from('user_properties').insert(insertData);
      }
    } else {
      const current = localDB.getProfiles();
      localDB.setProfiles(current.map(p => p.id === profile.id ? updated : p));
    }
    this.createAuditLog('profiles', 'UPDATE', profile.id, updated);
    return updated;
  },

  // 3. Properties Operations
  async getProperties(): Promise<Property[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('properties').select('*');
      if (!error && data) return data as Property[];
    }
    const list = localDB.getProperties();
    const u = getCurrentlySimulatedUser();
    if (u.role === 'super_admin' || u.role === 'company_manager') {
      return list;
    }
    if (u.assigned_property_ids && u.assigned_property_ids.length > 0) {
      return list.filter(p => u.assigned_property_ids!.includes(p.id));
    }
    // legacy fallbacks
    if (u.id === 'p-3') {
      return list.filter(p => p.id === 'prop-1');
    }
    if (u.id === 'p-4') {
      return list.filter(p => p.id === 'prop-1' || p.id === 'prop-2');
    }
    return list;
  },

  async createProperty(prop: Omit<Property, 'id' | 'created_at'>): Promise<Property> {
    const id = 'prop-' + Math.random().toString(36).substr(2, 9);
    const newProp: Property = {
      ...prop,
      id,
      created_at: new Date().toISOString()
    };
    if (isSupabaseConfigured && supabase) {
      await supabase.from('properties').insert(newProp);
    }
    const current = localDB.getProperties();
    localDB.setProperties([...current, newProp]);
    this.createAuditLog('properties', 'INSERT', id, newProp);
    return newProp;
  },

  async updateProperty(prop: Property): Promise<Property> {
    const updated = { ...prop, updated_at: new Date().toISOString() };
    if (isSupabaseConfigured && supabase) {
      await supabase.from('properties').update(updated).eq('id', prop.id);
    }
    const current = localDB.getProperties();
    localDB.setProperties(current.map(p => p.id === prop.id ? updated : p));
    this.createAuditLog('properties', 'UPDATE', prop.id, updated);
    return updated;
  },

  // 4. Bookings Operations + Security Roles
  async getBookings(): Promise<Booking[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.from('bookings').select('*');
      if (!error && data) return data as Booking[];
    }
    
    // Filter bookings based on simulation role for authentic testing:
    // Staff and Property managers can only see properties assigned to them
    const u = getCurrentlySimulatedUser();
    const list = localDB.getBookings();
    if (u.role === 'super_admin' || u.role === 'company_manager') {
      return list;
    }
    
    if (u.assigned_property_ids && u.assigned_property_ids.length > 0) {
      return list.filter(b => u.assigned_property_ids!.includes(b.property_id));
    }
    
    // Simulating access filters for security mock
    // Staff p-4 works with Golden Sands and High Horizon. PM p-3 owns Riyadh resort Golden Sands.
    if (u.id === 'p-3') {
      return list.filter(b => b.property_id === 'prop-1');
    }
    if (u.id === 'p-4') {
      return list.filter(b => b.property_id === 'prop-1' || b.property_id === 'prop-2');
    }
    return list;
  },

  async createBooking(booking: Omit<Booking, 'id' | 'ref_code' | 'created_at'>): Promise<Booking> {
    // Perform safety check
    const check = checkOverlappingBookings(booking.property_id, booking.check_in, booking.check_out);
    if (check.hasOverlap) {
      throw new Error(check.reasonAr);
    }

    const id = 'b-' + Math.random().toString(36).substr(2, 9);
    const ref_code = '#CH-' + Math.floor(100 + Math.random() * 900);
    const newBooking: Booking = {
      ...booking,
      id,
      ref_code,
      created_at: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('bookings').insert(newBooking);
      if (error) {
        throw new Error(error.message);
      }
    }

    const current = localDB.getBookings();
    localDB.setBookings([newBooking, ...current]);
    this.createAuditLog('bookings', 'INSERT', id, newBooking);

    // Notify of new booking
    const propName = localDB.getProperties().find(p => p.id === booking.property_id)?.name || 'العقار بـ ' + ref_code;
    this.createNotification(
      'حجز جديد مضاف',
      `تم إدخال حجز جديد للعميل ${booking.guest_name} في ${propName} بقيمة ${booking.total_price} ر.ع.`,
      'success'
    );

    return newBooking;
  },

  async updateBooking(booking: Booking): Promise<Booking> {
    // Overlap check
    const check = checkOverlappingBookings(booking.property_id, booking.check_in, booking.check_out, booking.id);
    if (check.hasOverlap) {
      throw new Error(check.reasonAr);
    }

    const updated = { ...booking, updated_at: new Date().toISOString() };
    if (isSupabaseConfigured && supabase) {
      await supabase.from('bookings').update(updated).eq('id', booking.id);
    }
    const current = localDB.getBookings();
    localDB.setBookings(current.map(b => b.id === booking.id ? updated : b));
    this.createAuditLog('bookings', 'UPDATE', booking.id, updated);

    // Dynamic state logs
    const propName = localDB.getProperties().find(p => p.id === booking.property_id)?.name || 'عقار';
    if (booking.status === 'confirmed') {
      this.createNotification(
        'تأكيد حالة الحجز',
        `تم تغيير حالة الحجز لـ ${booking.guest_name} في ${propName} إلى مؤكد.`,
        'success'
      );
    } else if (booking.status === 'cancelled') {
       this.createNotification(
        'إلغاء حجز',
        `تم إلغاء حجز ${booking.guest_name} في ${propName} بنجاح.`,
        'warning'
      );
    }

    return updated;
  },

  async deleteBooking(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase.from('bookings').delete().eq('id', id);
    }
    const current = localDB.getBookings();
    localDB.setBookings(current.filter(b => b.id !== id));
    this.createAuditLog('bookings', 'DELETE', id, { id });
  },

  // 5. Notifications
  async getNotifications(): Promise<Notification[]> {
    return localDB.getNotifications();
  },

  async markNotificationRead(id: string): Promise<void> {
    const list = localDB.getNotifications();
    localDB.setNotifications(list.map(n => n.id === id ? { ...n, is_read: true } : n));
  },

  async createNotification(title: string, message: string, type: Notification['type']): Promise<Notification> {
    const newNotif: Notification = {
      id: 'n-' + Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    const list = localDB.getNotifications();
    localDB.setNotifications([newNotif, ...list]);
    return newNotif;
  },

  // 6. Audit Logging (Audits all edits to meet system design standards)
  getAuditLogs(): AuditLog[] {
    return localDB.getAuditLogs();
  },

  createAuditLog(tableName: string, actionType: AuditLog['action_type'], recordId: string, payload: any) {
    const newLog: AuditLog = {
      id: 'audit-' + Math.random().toString(36).substr(2, 9),
      table_name: tableName,
      action_type: actionType,
      record_id: recordId,
      payload,
      performed_by: getCurrentlySimulatedUser().id,
      created_at: new Date().toISOString(),
    };
    const currentLogs = localDB.getAuditLogs();
    localDB.setAuditLogs([newLog, ...currentLogs]);
  }
};
