/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'super_admin' | 'company_manager' | 'property_manager' | 'booking_staff';

export interface Settings {
  id: string;
  company_name: string;
  currency_code: string;
  currency_name: string;
  tax_rate: number;
  price_multiplier: number;
  updated_at?: string;
  created_at?: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  avatar_url?: string | null;
  last_login_at?: string | null;
  password?: string;
  assigned_property_ids?: string[];
  updated_at?: string;
  created_at?: string;
}

export interface Property {
  id: string;
  name: string;
  ref_code: string;
  city: string; // e.g. muscat, salalah, nizwa, riyadh, alula, abha
  state_province?: string; // الولاية أو المحافظة
  country?: string; // الدولة
  address_details?: string; // العنوان التفصيلي
  type: 'resort' | 'chalet' | 'camp';
  status: 'available' | 'occupied' | 'maintenance';
  price_full_day: number;
  price_half_day: number;
  price_weekday?: number;
  price_weekend?: number;
  price_holiday?: number;
  discount_amount?: number;
  rating: number;
  rooms: number;
  amenities: string[];
  size_sqm: number;
  image_url: string;
  location_text: string;
  updated_at?: string;
  created_at?: string;
}

export interface UserProperty {
  profile_id: string;
  property_id: string;
}

export interface Booking {
  id: string;
  ref_code: string;
  property_id: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  check_in: string; // ISO String
  check_out: string; // ISO String
  booking_type: 'full_day' | 'half_day';
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed';
  total_price: number;
  created_by?: string | null;
  updated_at?: string;
  created_at?: string;
}

export interface BookingLog {
  id: string;
  booking_id: string;
  action: string;
  performed_by: string;
  notes?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  created_at: string;
}

export interface AuditLog {
  id: string;
  table_name: string;
  action_type: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id: string;
  payload: any;
  performed_by?: string | null;
  created_at: string;
}
