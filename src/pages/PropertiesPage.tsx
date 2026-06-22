/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Building, 
  MapPin, 
  Layers, 
  Plus, 
  Edit3, 
  Star, 
  Settings2,
  DollarSign,
  Maximize2,
  Bed,
  Check,
  X,
  AlertOctagon
} from 'lucide-react';
import { Property, UserRole } from '../types';
import { DatabaseService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

interface PropertiesPageProps {
  onBookProperty?: (propertyId: string) => void;
}

export const PropertiesPage: React.FC<PropertiesPageProps> = ({ onBookProperty }) => {
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingProp, setEditingProp] = React.useState<Partial<Property> | null>(null);
  const [amenitiesText, setAmenitiesText] = React.useState('');
  const [featuresText, setFeaturesText] = React.useState('');
  
  // Profiles and Property-User Assignments states
  const [profiles, setProfiles] = React.useState<any[]>([]);
  const [assignments, setAssignments] = React.useState<Record<string, string>>({});
  const [selectedProfileId, setSelectedProfileId] = React.useState<string>('');

  // Filters state
  const [cityFilter, setCityFilter] = React.useState<string>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const { profile } = useAuth();
  const currentUser = profile!;
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'company_manager';
  const isPM = currentUser.role === 'property_manager';
  
  // Can modify anything
  const canManageFully = isAdmin;
  // Can only modify status
  const canManageStatusOnly = isPM;

  const loadProperties = async () => {
    const list = await DatabaseService.getProperties();
    setProperties(list);
    
    try {
      const profs = await DatabaseService.getProfiles();
      setProfiles(profs);
      const assigns = await DatabaseService.getPropertyUserAssignments();
      setAssignments(assigns);
    } catch (err) {
      console.error('Error loading profiles or assignments', err);
    }
  };

  React.useEffect(() => {
    loadProperties();
  }, []);

  const handleStatusQuickToggle = async (prop: Property, newStatus: Property['status']) => {
    // If PM, check if they own the property. For simplicity, PM 1 (p-3) owns Golden Sands (prop-1).
    if (isPM && currentUser.id === 'p-3' && prop.id !== 'prop-1') {
      alert('خطأ في الصلاحيات: يمكنك فقط تحديث حالة عقار منتجع الرمال الذهبية الخاص بك.');
      return;
    }
    
    const updated: Property = { ...prop, status: newStatus };
    await DatabaseService.updateProperty(updated);
    await loadProperties();
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProp) return;

    const finalCity = editingProp.city || editingProp.state_province || '';

    // Validate fields
    if (!editingProp.name || !editingProp.ref_code || !finalCity || !editingProp.type) {
      alert('يرجى ملأ جميع الخانات الإلزامية.');
      return;
    }

    const amenitiesList = amenitiesText
      .split(/,|\t/)
      .map(s => s.trim())
      .filter(Boolean);
    const featuresList = featuresText
      .split(/,|\t/)
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const finalProp: Property = {
        ...(editingProp as Property),
        city: finalCity,
        amenities: amenitiesList,
        features: featuresList
      };

      if (editingProp.id) {
        await DatabaseService.updateProperty(finalProp, selectedProfileId);
      } else {
        await DatabaseService.createProperty({
          name: editingProp.name,
          ref_code: editingProp.ref_code,
          city: finalCity,
          state_province: editingProp.state_province || '',
          country: editingProp.country || '',
          address_details: editingProp.address_details || '',
          type: editingProp.type as any,
          status: editingProp.status as any || 'available',
          price_full_day: (editingProp.price_full_day !== undefined && editingProp.price_full_day !== null && editingProp.price_full_day !== '') ? Number(editingProp.price_full_day) : 0,
          price_half_day: (editingProp.price_half_day !== undefined && editingProp.price_half_day !== null && editingProp.price_half_day !== '') ? Number(editingProp.price_half_day) : 0,
          price_weekday: (editingProp.price_weekday !== undefined && editingProp.price_weekday !== null && editingProp.price_weekday !== '') ? Number(editingProp.price_weekday) : undefined,
          price_weekend: (editingProp.price_weekend !== undefined && editingProp.price_weekend !== null && editingProp.price_weekend !== '') ? Number(editingProp.price_weekend) : undefined,
          price_half_day_weekday: (editingProp.price_half_day_weekday !== undefined && editingProp.price_half_day_weekday !== null && editingProp.price_half_day_weekday !== '') ? Number(editingProp.price_half_day_weekday) : undefined,
          price_half_day_weekend: (editingProp.price_half_day_weekend !== undefined && editingProp.price_half_day_weekend !== null && editingProp.price_half_day_weekend !== '') ? Number(editingProp.price_half_day_weekend) : undefined,
          price_holiday: (editingProp.price_holiday !== undefined && editingProp.price_holiday !== null && editingProp.price_holiday !== '') ? Number(editingProp.price_holiday) : undefined,
          discount_amount: (editingProp.discount_amount !== undefined && editingProp.discount_amount !== null && editingProp.discount_amount !== '') ? Number(editingProp.discount_amount) : 0,
          rating: (editingProp.rating !== undefined && editingProp.rating !== null && editingProp.rating !== '') ? Number(editingProp.rating) : 5.0,
          rooms: (editingProp.rooms !== undefined && editingProp.rooms !== null && editingProp.rooms !== '') ? Number(editingProp.rooms) : 1,
          amenities: amenitiesList,
          features: featuresList,
          images: editingProp.images || [],
          owner_info: editingProp.owner_info || {},
          custom_rates: editingProp.custom_rates || [],
          size_sqm: (editingProp.size_sqm !== undefined && editingProp.size_sqm !== null && editingProp.size_sqm !== '') ? Number(editingProp.size_sqm) : 0,
          image_url: editingProp.image_url || '',
          location_text: editingProp.location_text || ''
        }, selectedProfileId);
      }
      setIsEditing(false);
      setEditingProp(null);
      setAmenitiesText('');
      setFeaturesText('');
      setSelectedProfileId('');
      await loadProperties();
    } catch (err: any) {
      alert(err.message || 'فشلت كليا عملية الحفظ.');
    }
  };

  const filteredProperties = properties.filter(p => {
    if (cityFilter !== 'all' && p.city !== cityFilter) return false;
    if (typeFilter !== 'all' && p.type !== typeFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const uniqueCities: string[] = Array.from(new Set(properties.map(p => p.city).filter(Boolean))) as string[];

  const cityLabels: Record<string, string> = {
    all: 'كل الفروع والمناطق',
    muscat: 'مسقط',
    salalah: 'صلالة',
    nizwa: 'نزوى',
    riyadh: 'الرياض',
    abha: 'أبها',
    alula: 'العلا',
  };

  const typeLabels: Record<string, string> = {
    resort: 'منتجع صحراوي',
    chalet: 'شاليه جبلي',
    camp: 'مخيم فخم',
  };

  const statusColors: Record<Property['status'], string> = {
    available: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    occupied: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    maintenance: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
  };

  const statusLabelsAr: Record<Property['status'], string> = {
    available: 'متاح الآن',
    occupied: 'محجوز/مشغول',
    maintenance: 'تحت الصيانة',
  };

  return (
    <div className="space-y-6 text-slate-100">
      
      {/* Upper bar with filters and adding utilities */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 frosted p-5 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h2 className="text-xl font-extrabold text-white">إدارة المرافق والشاليهات</h2>
          <p className="text-xs text-slate-300 mt-1">تحدد الحالة، تعديل الأسعار وعرض الغرف المتوفرة عبر الفروع الثلاثة</p>
        </div>
        {canManageFully && (
          <button 
            id="btn-add-property"
            onClick={() => {
              setEditingProp({
                name: '',
                ref_code: 'REF-' + Math.floor(1000 + Math.random() * 9000),
                city: '',
                state_province: '',
                country: 'سلطنة عمان',
                address_details: '',
                type: 'chalet',
                status: 'available',
                price_full_day: undefined,
                price_half_day: undefined,
                price_weekday: undefined,
                price_weekend: undefined,
                price_half_day_weekday: undefined,
                price_half_day_weekend: undefined,
                price_holiday: undefined,
                discount_amount: undefined,
                rating: undefined,
                rooms: undefined,
                amenities: [],
                features: [],
                images: [],
                owner_info: { name: '', phone: '', email: '' },
                custom_rates: [],
                size_sqm: undefined,
                image_url: '',
                location_text: ''
              });
              setAmenitiesText('');
              setFeaturesText('');
              setSelectedProfileId('');
              setIsEditing(true);
            }}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-650/10 hover:bg-blue-500 transition-colors cursor-pointer border border-blue-500/25"
          >
            <Plus className="w-4 h-4" />
            إضافة مرفق جديد
          </button>
        )}
      </div>

      {/* Grid Filters Control */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 frosted p-4 rounded-xl border border-white/10">
        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1">تصفية حسب المنطقة</label>
          <select 
            id="filter-city"
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-2.5 font-semibold text-white outline-none focus:border-blue-500"
          >
            <option value="all" className="bg-slate-900 text-white">كل المحافظات والمناطق</option>
            {uniqueCities.map(city => (
              <option key={city} value={city} className="bg-slate-900 text-white">
                {cityLabels[city] || city}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1">نوع العقار</label>
          <select 
            id="filter-type"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-2.5 font-semibold text-white outline-none focus:border-blue-500"
          >
            <option value="all" className="bg-slate-900 text-white">كل الأنواع والمظاهر</option>
            <option value="resort" className="bg-slate-900 text-white">المنتجعات السياحية</option>
            <option value="chalet" className="bg-slate-900 text-white">الشاليهات الجبلية</option>
            <option value="camp" className="bg-slate-900 text-white">المخيمات البرية والنجوم</option>
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-bold text-slate-300 mb-1">حالة الحجز الميداني</label>
          <select 
            id="filter-status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-2.5 font-semibold text-white outline-none focus:border-blue-500"
          >
            <option value="all" className="bg-slate-900 text-white">كل الحالات التشغيلية</option>
            <option value="available" className="bg-slate-900 text-white">متاح الآن للنزلاء</option>
            <option value="occupied" className="bg-slate-900 text-white">مشغول أو مؤجر</option>
            <option value="maintenance" className="bg-slate-900 text-white">تحت الصيانة والصباغة</option>
          </select>
        </div>
      </div>

      {/* Editor Modal/Form */}
      {isEditing && editingProp && (
        <form onSubmit={handleSaveProperty} className="frosted p-6 rounded-2xl border border-white/10 shadow-2xl space-y-6 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-extrabold text-white text-sm">
              {editingProp.id ? `تعديل بطاقة العقار: ${editingProp.name}` : 'إدخال بطاقة عقار سياحي جديد'}
            </h3>
            <button 
              type="button" 
              onClick={() => { 
                setIsEditing(false); 
                setEditingProp(null); 
                setAmenitiesText('');
                setFeaturesText('');
              }}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section 1: Basic Info */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
            <span className="text-xs font-bold text-blue-450 block border-b border-white/5 pb-1">المعلومات الأساسية للمرفق</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">
                  اسم العقار بالكامل <span className="text-red-500 font-bold mx-0.5">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={editingProp.name || ''} 
                  onChange={(e) => setEditingProp({...editingProp, name: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="مثال: شاليه النجوم المضيئة"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-355 mb-1">
                  رمز المرجع الفريد <span className="text-red-500 font-bold mx-0.5">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={editingProp.ref_code || ''} 
                  onChange={(e) => setEditingProp({...editingProp, ref_code: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-355 mb-1">
                  نمط الإقامة <span className="text-red-500 font-bold mx-0.5">*</span>
                </label>
                <select
                  value={editingProp.type || 'chalet'}
                  onChange={(e) => setEditingProp({...editingProp, type: e.target.value as any})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="chalet" className="bg-slate-900 text-white">شاليه فخم وطبيعي</option>
                  <option value="resort" className="bg-slate-900 text-white">منتجع ترفيهي متكامل</option>
                  <option value="camp" className="bg-slate-900 text-white">مخيم فلكي مفتوح</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">
                  عدد غرف النوم <span className="text-red-500 font-bold mx-0.5">*</span>
                </label>
                <input 
                  type="number" 
                  required
                  value={editingProp.rooms || ''} 
                  onChange={(e) => setEditingProp({...editingProp, rooms: Number(e.target.value)})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="مثال: 3"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">حجم المساحة (متر مربع) (اختياري)</label>
                <input 
                  type="number" 
                  value={editingProp.size_sqm || ''} 
                  onChange={(e) => setEditingProp({...editingProp, size_sqm: e.target.value ? Number(e.target.value) : undefined})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="مثال: 450"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Media Gallery */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-3">
            <span className="text-xs font-bold text-blue-450 block border-b border-white/5 pb-1">صور المرفق (أكثر من صورة)</span>
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-1">روابط الصور (رابط في كل سطر - سيتم اعتماد الرابط الأول كصورة رئيسية)</label>
              <textarea 
                rows={3}
                value={editingProp.images?.join('\n') || ''} 
                onChange={(e) => {
                  const urls = e.target.value.split(/\n|,/).map(s => s.trim()).filter(Boolean);
                  setEditingProp({
                    ...editingProp,
                    images: urls,
                    image_url: urls[0] || ''
                  });
                }}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500 h-24"
                placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
              />
            </div>
          </div>

          {/* Section 3: Amenities & Features */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
            <span className="text-xs font-bold text-blue-450 block border-b border-white/5 pb-1">الملحقات والمميزات</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">الملحقات (أدخلها مفصولة بفاصلة أو Tab)</label>
                <input 
                  type="text" 
                  value={amenitiesText} 
                  onChange={(e) => setAmenitiesText(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="مثال: مسبح خاص، صالة ألعاب، شاشة ذكية"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">المميزات (أدخلها مفصولة بفاصلة أو Tab)</label>
                <input 
                  type="text" 
                  value={featuresText} 
                  onChange={(e) => setFeaturesText(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="مثال: إطلالة جبلية، رمال بيضاء، هدوء تام"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Address Details */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
            <span className="text-xs font-bold text-blue-450 block border-b border-white/5 pb-1">موقع المرفق وتفاصيل العنوان (الدولة &gt; المحافظة &gt; العنوان)</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">
                  الدولة <span className="text-red-500 font-bold mx-0.5">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={editingProp.country || ''} 
                  onChange={(e) => setEditingProp({...editingProp, country: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="سلطنة عمان"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">
                  الولاية أو المحافظة <span className="text-red-500 font-bold mx-0.5">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={editingProp.state_province || ''} 
                  onChange={(e) => {
                    const val = e.target.value;
                    let cityVal = val.trim().toLowerCase();
                    if (val.includes('مسقط')) cityVal = 'muscat';
                    else if (val.includes('ظفار') || val.includes('صلالة')) cityVal = 'salalah';
                    else if (val.includes('الداخلية') || val.includes('نزوى')) cityVal = 'nizwa';
                    else if (val.includes('الرياض')) cityVal = 'riyadh';
                    else if (val.includes('عسير') || val.includes('أبها')) cityVal = 'abha';
                    else if (val.includes('العلا') || val.includes('المدينة')) cityVal = 'alula';
                    
                    setEditingProp({
                      ...editingProp,
                      state_province: val,
                      city: cityVal
                    });
                  }}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="محافظة مسقط"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">
                  العنوان التفصيلي / الشارع <span className="text-red-500 font-bold mx-0.5">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={editingProp.address_details || ''} 
                  onChange={(e) => setEditingProp({...editingProp, address_details: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="السيب، سور آل حديد"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-1">نص بسيط للموقع (فلترة سريعة)</label>
              <input 
                type="text" 
                value={editingProp.location_text || ''} 
                onChange={(e) => setEditingProp({...editingProp, location_text: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                placeholder="مسقط، السيب"
              />
            </div>
          </div>

          {/* Section 5: Owner Details */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
            <span className="text-xs font-bold text-blue-450 block border-b border-white/5 pb-1">بيانات مالك العقار</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">اسم المالك</label>
                <input 
                  type="text" 
                  value={editingProp.owner_info?.name || ''} 
                  onChange={(e) => setEditingProp({
                    ...editingProp,
                    owner_info: { ...(editingProp.owner_info || {}), name: e.target.value }
                  })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="عبدالله اليعربي"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">رقم هاتف المالك</label>
                <input 
                  type="text" 
                  value={editingProp.owner_info?.phone || ''} 
                  onChange={(e) => setEditingProp({
                    ...editingProp,
                    owner_info: { ...(editingProp.owner_info || {}), phone: e.target.value }
                  })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="+968 9912 3456"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">البريد الإلكتروني للمالك</label>
                <input 
                  type="email" 
                  value={editingProp.owner_info?.email || ''} 
                  onChange={(e) => setEditingProp({
                    ...editingProp,
                    owner_info: { ...(editingProp.owner_info || {}), email: e.target.value }
                  })}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="owner@example.com"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Pricing Schema */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
            <span className="text-xs font-bold text-blue-450 block border-b border-white/5 pb-1">هيكل الأسعار والتسعير المخصص</span>
            
            {/* Full Day rates */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-300 block">سعر الإيجار لليوم الكامل:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/30 p-3 rounded-lg border border-white/5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    السعر الأساسي (ر.ع.) <span className="text-red-500 font-bold mx-0.5">*</span>
                  </label>
                  <input 
                    type="number" 
                    required
                    value={editingProp.price_full_day || ''} 
                    onChange={(e) => setEditingProp({...editingProp, price_full_day: Number(e.target.value)})}
                    className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-1.5 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">سعر منتصف الأسبوع (ر.ع.)</label>
                  <input 
                    type="number" 
                    value={editingProp.price_weekday || ''} 
                    placeholder="تلقائي (السعر الأساسي)"
                    onChange={(e) => setEditingProp({...editingProp, price_weekday: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-1.5 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">سعر عطلة نهاية الأسبوع (ر.ع.)</label>
                  <input 
                    type="number" 
                    value={editingProp.price_weekend || ''} 
                    placeholder="تلقائي (السعر الأساسي)"
                    onChange={(e) => setEditingProp({...editingProp, price_weekend: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-1.5 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Half Day rates */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-bold text-slate-300 block">سعر الإيجار لنصف اليوم:</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/30 p-3 rounded-lg border border-white/5">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    السعر الأساسي (ر.ع.) <span className="text-red-500 font-bold mx-0.5">*</span>
                  </label>
                  <input 
                    type="number" 
                    required
                    value={editingProp.price_half_day || ''} 
                    onChange={(e) => setEditingProp({...editingProp, price_half_day: Number(e.target.value)})}
                    className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-1.5 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">سعر منتصف الأسبوع (ر.ع.)</label>
                  <input 
                    type="number" 
                    value={editingProp.price_half_day_weekday || ''} 
                    placeholder="تلقائي (السعر الأساسي)"
                    onChange={(e) => setEditingProp({...editingProp, price_half_day_weekday: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-1.5 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">سعر عطلة نهاية الأسبوع (ر.ع.)</label>
                  <input 
                    type="number" 
                    value={editingProp.price_half_day_weekend || ''} 
                    placeholder="تلقائي (السعر الأساسي)"
                    onChange={(e) => setEditingProp({...editingProp, price_half_day_weekend: e.target.value ? Number(e.target.value) : undefined})}
                    className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-1.5 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Custom Manual Rates */}
            <div className="bg-slate-950/40 p-4 rounded-xl border border-white/5 space-y-3">
              <span className="text-[11px] font-bold text-blue-400 block border-b border-white/5 pb-1">أسعار مواسم وأعياد إضافية (تُعرف يدوياً)</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  id="custom-rate-label"
                  placeholder="اسم الموسم (مثال: عرض عيد الأضحى)" 
                  className="bg-slate-900/60 border border-white/10 rounded-lg text-xs py-1.5 px-3 text-white font-semibold flex-1 outline-none focus:border-blue-500"
                />
                <input 
                  type="number" 
                  id="custom-rate-price"
                  placeholder="السعر (ر.ع.)" 
                  className="bg-slate-900/60 border border-white/10 rounded-lg text-xs py-1.5 px-3 text-white font-semibold w-24 outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const lblEl = document.getElementById('custom-rate-label') as HTMLInputElement;
                    const prcEl = document.getElementById('custom-rate-price') as HTMLInputElement;
                    if (lblEl && prcEl && lblEl.value && prcEl.value) {
                      const rates = [...(editingProp.custom_rates || [])];
                      rates.push({ label: lblEl.value, price: Number(prcEl.value) });
                      setEditingProp({ ...editingProp, custom_rates: rates });
                      lblEl.value = '';
                      prcEl.value = '';
                    }
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors border border-blue-500/25 shrink-0"
                >
                  إضافة السعر
                </button>
              </div>

              {editingProp.custom_rates && editingProp.custom_rates.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {editingProp.custom_rates.map((cr, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/[0.03] border border-white/5 py-1.5 px-3 rounded-lg text-xs">
                      <span>{cr.label} : <span className="font-mono text-blue-300 font-bold">{cr.price} ر.ع.</span></span>
                      <button
                        type="button"
                        onClick={() => {
                          const rates = [...(editingProp.custom_rates || [])];
                          rates.splice(idx, 1);
                          setEditingProp({ ...editingProp, custom_rates: rates });
                        }}
                        className="text-rose-450 hover:text-rose-300 font-bold text-xs"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 7: Management & Status */}
          <div className="bg-white/5 p-4 rounded-xl border border-white/10 space-y-4">
            <span className="text-xs font-bold text-blue-450 block border-b border-white/5 pb-1">التحكم والإدارة</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">تعيين مستخدم / مدير المرفق (اختياري)</label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="" className="bg-slate-900 text-slate-400">غير معين (بدون تحديد)</option>
                  {profiles.map((prof) => (
                    <option key={prof.id} value={prof.id} className="bg-slate-900 text-white">
                      {prof.full_name} ({prof.role === 'property_manager' ? 'مدير مرفق' : prof.role === 'booking_staff' ? 'موظف حجز' : prof.role === 'company_manager' ? 'مدير شركة' : 'مدير عام'})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">حالة المرفق التشغيلية</label>
                <select
                  value={editingProp.status || 'available'}
                  onChange={(e) => setEditingProp({...editingProp, status: e.target.value as any})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                >
                  <option value="available" className="bg-slate-900 text-white">متاح للنزلاء</option>
                  <option value="occupied" className="bg-slate-900 text-white">مشغول / محجوز</option>
                  <option value="maintenance" className="bg-slate-900 text-white">تحت الصيانة</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">التقييم الأولي (نجوم)</label>
                <input 
                  type="number" 
                  step="0.1"
                  min="1"
                  max="5"
                  value={editingProp.rating || ''} 
                  onChange={(e) => setEditingProp({...editingProp, rating: e.target.value ? Number(e.target.value) : undefined})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="5.0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-350 mb-1">قيمة الخصم المباشر الافتراضية (إن وجد)</label>
                <input 
                  type="number" 
                  value={editingProp.discount_amount || ''} 
                  onChange={(e) => setEditingProp({...editingProp, discount_amount: e.target.value ? Number(e.target.value) : undefined})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="مثال: 15"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button 
              type="button" 
              onClick={() => { 
                setIsEditing(false); 
                setEditingProp(null); 
                setSelectedProfileId(''); 
                setAmenitiesText('');
                setFeaturesText('');
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-white/5"
            >
              إلغاء الأمر
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border border-blue-500/25"
            >
              حفظ بطاقة المرفق
            </button>
          </div>
        </form>
      )}

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((prop) => (
          <div 
            key={prop.id} 
            id={`property-card-${prop.id}`}
            className="frosted rounded-2xl overflow-hidden border border-white/10 shadow-lg flex flex-col hover:shadow-xl transition-shadow relative text-slate-100"
          >
            {/* Quick Status banner */}
            <div className="absolute top-4 left-4 z-10">
              <span className={`inline-block px-3 py-1 text-xs font-extrabold rounded-full border ${statusColors[prop.status]}`}>
                {statusLabelsAr[prop.status]}
              </span>
            </div>

            {/* Image banner */}
            <div className="h-48 w-full overflow-hidden relative bg-white/5">
              <img 
                src={prop.image_url} 
                alt={prop.name} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 to-transparent"></div>
              
              {/* Badge Area */}
              <div className="absolute bottom-4 right-4 text-white">
                <span className="text-[10px] font-bold text-blue-300 bg-blue-505/10 border border-blue-500/20 px-2 py-0.5 rounded">
                  {prop.ref_code}
                </span>
                <h3 className="font-bold text-base mt-2">{prop.name}</h3>
              </div>
            </div>

            {/* Card Info Area */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-medium">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate font-extrabold text-blue-300">
                        {prop.country ? `${prop.country}، ` : ''}
                        {prop.state_province ? `${prop.state_province}، ` : ''}
                        {cityLabels[prop.city] || prop.city}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 font-bold shrink-0 font-mono">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {prop.rating}
                    </span>
                  </div>

                  {(prop.address_details || prop.location_text) && (
                    <div className="text-[11px] text-slate-300 bg-white/[0.03] border border-white/5 py-1 px-2.5 rounded-lg font-medium leading-relaxed">
                      <span className="text-blue-400 ml-1 font-bold">العنوان:</span>
                      {prop.address_details || prop.location_text}
                    </div>
                  )}
                </div>

                {/* Technical specifications */}
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/10 text-[11px] text-slate-300 font-bold bg-white/5 p-2 rounded-xl">
                  <div className="flex items-center gap-1">
                    <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                    <span>{prop.size_sqm} م²</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-blue-400" />
                    <span>{prop.rooms} غرف</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                    <span className="truncate">{typeLabels[prop.type] || prop.type}</span>
                  </div>
                </div>

                {/* Amenities checklist */}
                <div className="flex flex-wrap gap-1">
                  {prop.amenities.map((amen, aIdx) => (
                    <span key={aIdx} className="text-[10px] bg-white/10 text-slate-300 font-semibold px-2 py-0.5 rounded-md border border-white/5">
                      • {amen}
                    </span>
                  ))}
                </div>
              </div>

              {/* Lower rate & controls details */}
              <div className="mt-2 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">الأسعار الموسمية المعتمدة</p>
                  <p className="text-sm font-extrabold text-white font-mono mt-0.5">
                    {prop.price_full_day} ر.ع. <span className="text-[10px] font-medium text-slate-400">/ يوم كامل</span>
                  </p>
                  <p className="text-xs font-semibold text-slate-300 font-mono">
                    {prop.price_half_day} ر.ع. <span className="text-[10px] font-medium text-slate-400">/ نصف يوم</span>
                  </p>
                </div>

                {/* Operations check buttons based on roles */}
                <div className="flex gap-1.5">
                  {prop.status === 'available' && (
                    <button 
                      onClick={() => { 
                        if (onBookProperty) onBookProperty(prop.id);
                      }}
                      className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 border border-emerald-500/25 cursor-pointer shadow-md active:scale-95 transition-all"
                      title="حجز المرفق الآن"
                    >
                      <Plus className="w-3.5 h-3.5" /> حجز
                    </button>
                  )}

                  {canManageFully && (
                    <button 
                      onClick={() => { 
                        setEditingProp(prop); 
                        setAmenitiesText(prop.amenities?.join(', ') || '');
                        setFeaturesText(prop.features?.join(', ') || '');
                        setSelectedProfileId(assignments[prop.id] || '');
                        setIsEditing(true); 
                      }}
                      className="p-2 text-white bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl transition-colors cursor-pointer"
                      title="تعديل مواصفات العقار"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}

                  {/* Quick toggle status selector accessible by Super/Manager OR PM */}
                  {(canManageFully || canManageStatusOnly) ? (
                    <div className="relative group">
                      <button 
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-bold flex items-center gap-1 border border-blue-500/25 cursor-pointer"
                        title="تغيير سريع للحالة"
                      >
                        <Settings2 className="w-3.5 h-3.5" /> الحالة
                      </button>
                      
                      {/* Popover options list */}
                      <div className="absolute bottom-full left-0 mb-1 w-32 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-20 py-1 hidden group-hover:block transition-all text-slate-200 text-[11px] font-semibold">
                        <button 
                          onClick={() => handleStatusQuickToggle(prop, 'available')}
                          className="w-full text-right px-3 py-1.5 hover:bg-white/5 hover:text-emerald-300 flex items-center gap-1 text-emerald-450"
                        >
                          <Check className="w-3 h-3 text-emerald-400" /> متاح الآن
                        </button>
                        <button 
                          onClick={() => handleStatusQuickToggle(prop, 'occupied')}
                          className="w-full text-right px-3 py-1.5 hover:bg-white/5 hover:text-rose-300 flex items-center gap-1 text-rose-450"
                        >
                          <Check className="w-3 h-3 text-rose-400" /> محجوز/مشغول
                        </button>
                        <button 
                          onClick={() => handleStatusQuickToggle(prop, 'maintenance')}
                          className="w-full text-right px-3 py-1.5 hover:bg-white/5 hover:text-amber-300 flex items-center gap-1 text-amber-450"
                        >
                          <Check className="w-3 h-3 text-amber-400" /> تحت الصيانة
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Just basic indicator message
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                      <AlertOctagon className="w-3.5 h-3.5 text-slate-500" /> عرض فقط
                    </span>
                  )}
                </div>
              </div>

            </div>
          </div>
        ))}
      </div>

    </div>
  );
};
