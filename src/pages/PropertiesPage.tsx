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
import { DatabaseService, getCurrentlySimulatedUser } from '../services/db';

export const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editingProp, setEditingProp] = React.useState<Partial<Property> | null>(null);
  
  // Filters state
  const [cityFilter, setCityFilter] = React.useState<string>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [statusFilter, setStatusFilter] = React.useState<string>('all');

  const currentUser = getCurrentlySimulatedUser();
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'company_manager';
  const isPM = currentUser.role === 'property_manager';
  
  // Can modify anything
  const canManageFully = isAdmin;
  // Can only modify status
  const canManageStatusOnly = isPM;

  const loadProperties = async () => {
    const list = await DatabaseService.getProperties();
    setProperties(list);
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

    // Validate fields
    if (!editingProp.name || !editingProp.ref_code || !editingProp.city || !editingProp.type) {
      alert('يرجى ملأ جميع الخانات الإلزامية.');
      return;
    }

    try {
      if (editingProp.id) {
        await DatabaseService.updateProperty(editingProp as Property);
      } else {
        await DatabaseService.createProperty({
          name: editingProp.name,
          ref_code: editingProp.ref_code,
          city: editingProp.city,
          state_province: editingProp.state_province || '',
          country: editingProp.country || '',
          address_details: editingProp.address_details || '',
          type: editingProp.type as any,
          status: editingProp.status as any || 'available',
          price_full_day: Number(editingProp.price_full_day) || 200,
          price_half_day: Number(editingProp.price_half_day) || 120,
          rating: Number(editingProp.rating) || 5.0,
          rooms: Number(editingProp.rooms) || 2,
          amenities: editingProp.amenities || ['مكيف', 'صالة جلوس'],
          size_sqm: Number(editingProp.size_sqm) || 150,
          image_url: editingProp.image_url || 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=800',
          location_text: editingProp.location_text || 'مسقط، عمان'
        });
      }
      setIsEditing(false);
      setEditingProp(null);
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
                price_full_day: 0,
                price_half_day: 0,
                rating: 5.0,
                rooms: 1,
                amenities: [],
                size_sqm: 0,
                image_url: '',
                location_text: ''
              });
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
        <form onSubmit={handleSaveProperty} className="frosted p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5 animate-scaleUp">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="font-extrabold text-white text-sm">
              {editingProp.id ? `تعديل بطاقة العقار: ${editingProp.name}` : 'إدخال بطاقة عقار سياحي جديد'}
            </h3>
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setEditingProp(null); }}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">اسم العقار بالكامل *</label>
              <input 
                type="text" 
                required
                value={editingProp.name || ''} 
                onChange={(e) => setEditingProp({...editingProp, name: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">رمز المرجع الفريد *</label>
              <input 
                type="text" 
                required
                value={editingProp.ref_code || ''} 
                onChange={(e) => setEditingProp({...editingProp, ref_code: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">المنطقة الجغرافية للفلترة السريعة *</label>
              <select
                value={editingProp.city || 'muscat'}
                onChange={(e) => {
                  const val = e.target.value;
                  let state_p = '';
                  let ctry = 'سلطنة عمان';
                  if (val === 'muscat') state_p = 'محافظة مسقط';
                  else if (val === 'salalah') state_p = 'محافظة ظفار';
                  else if (val === 'nizwa') state_p = 'محافظة الداخلية';
                  else {
                    ctry = 'المملكة العربية السعودية';
                    if (val === 'riyadh') state_p = 'منطقة الرياض';
                    else if (val === 'abha') state_p = 'منطقة عسير';
                    else if (val === 'alula') state_p = 'منطقة المدينة المنورة';
                  }
                  setEditingProp({
                    ...editingProp,
                    city: val,
                    state_province: state_p,
                    country: ctry
                  });
                }}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="muscat" className="bg-slate-900 text-white">مسقط (محافظة مسقط)</option>
                <option value="salalah" className="bg-slate-900 text-white">صلالة (محافظة ظفار)</option>
                <option value="nizwa" className="bg-slate-900 text-white">نزوى (محافظة الداخلية)</option>
                <option value="riyadh" className="bg-slate-900 text-white">الرياض (منطقة الرياض)</option>
                <option value="abha" className="bg-slate-900 text-white">أبها (منطقة عسير)</option>
                <option value="alula" className="bg-slate-900 text-white">العلا (منطقة المدينة المنورة)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">نمط الإقامة *</label>
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
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">سعر الإيجار لليوم الكامل (ر.ع.) *</label>
              <input 
                type="number" 
                required
                value={editingProp.price_full_day || ''} 
                onChange={(e) => setEditingProp({...editingProp, price_full_day: Number(e.target.value)})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">سعر الإيجار لنصف اليوم (ر.ع.) *</label>
              <input 
                type="number" 
                required
                value={editingProp.price_half_day || ''} 
                onChange={(e) => setEditingProp({...editingProp, price_half_day: Number(e.target.value)})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">حجم المساحة (متر مربع) *</label>
              <input 
                type="number" 
                required
                value={editingProp.size_sqm || ''} 
                onChange={(e) => setEditingProp({...editingProp, size_sqm: Number(e.target.value)})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">عدد غرف النوم *</label>
              <input 
                type="number" 
                required
                value={editingProp.rooms || ''} 
                onChange={(e) => setEditingProp({...editingProp, rooms: Number(e.target.value)})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">رابط صورة المعاينة</label>
              <input 
                type="text" 
                value={editingProp.image_url || ''} 
                onChange={(e) => setEditingProp({...editingProp, image_url: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="bg-white/5 p-4.5 rounded-xl border border-white/10 space-y-3.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-blue-400 block border-b border-white/5 pb-1.5">مكونات العنوان التفصيلية (العنوان الجغرافي للعقار)</span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الدولة *</label>
                <input 
                  type="text" 
                  required
                  value={editingProp.country || ''} 
                  onChange={(e) => setEditingProp({...editingProp, country: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="مثال: سلطنة عمان"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الولاية أو المحافظة / المنطقة *</label>
                <input 
                  type="text" 
                  required
                  value={editingProp.state_province || ''} 
                  onChange={(e) => setEditingProp({...editingProp, state_province: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="مثال: محافظة مسقط، ظفار"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">المدينة *</label>
                <input 
                  type="text" 
                  required
                  value={editingProp.city || ''} 
                  onChange={(e) => setEditingProp({...editingProp, city: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="مثال: مسقط، صلالة"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">العنوان والقرية بالتفصيل / الشارع *</label>
                <input 
                  type="text" 
                  required
                  value={editingProp.address_details || ''} 
                  onChange={(e) => setEditingProp({...editingProp, address_details: e.target.value})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                  placeholder="مثال: السيب، سور آل حديد"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">نص الموقع البسيط للمعالجة السريعة</label>
              <input 
                type="text" 
                value={editingProp.location_text || ''} 
                onChange={(e) => setEditingProp({...editingProp, location_text: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
                placeholder="مثال: مسقط، السيب"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button 
              type="button" 
              onClick={() => { setIsEditing(false); setEditingProp(null); }}
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
                  {canManageFully && (
                    <button 
                      onClick={() => { setEditingProp(prop); setIsEditing(true); }}
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
