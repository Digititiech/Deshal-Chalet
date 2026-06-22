/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  UserPlus, 
  Shield, 
  Activity, 
  MapPin, 
  Mail, 
  Calendar, 
  CheckCircle2, 
  X,
  Edit,
  UserCheck,
  Lock,
  Building,
  Check,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { Profile, UserRole, Property } from '../types';
import { DatabaseService, setCurrentlySimulatedUser } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

export const UsersPage: React.FC = () => {
  const [profiles, setProfiles] = React.useState<Profile[]>([]);
  const [properties, setProperties] = React.useState<Property[]>([]);
  const [isAdding, setIsAdding] = React.useState(false);
  const [editingProfile, setEditingProfile] = React.useState<Profile | null>(null);
  
  const [showPasswords, setShowPasswords] = React.useState<Record<string, boolean>>({});

  const [newProfile, setNewProfile] = React.useState({
    full_name: '',
    email: '',
    role: 'booking_staff' as UserRole,
    status: 'active' as 'active' | 'inactive',
    avatar_url: '',
    password: '',
    assigned_property_ids: [] as string[]
  });

  const { profile } = useAuth();
  const currentUser = profile!;
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'company_manager';

  const loadData = async () => {
    const list = await DatabaseService.getProfiles();
    setProfiles(list);
    const propsList = await DatabaseService.getProperties();
    setProperties(propsList);
  };

  React.useEffect(() => {
    loadData();
  }, []);

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAdmin) {
      alert('خطأ في الصلاحيات: المدير العام أو مدير الشركة فقط من يمكنهم إضافة مستخدمين جدد.');
      return;
    }

    if (!newProfile.full_name || !newProfile.email) {
      alert('الرجاء ملء جميع الحقول المطلوبة.');
      return;
    }

    try {
      // Pick random elegant fallback avatar
      const avatarNum = Math.floor(Math.random() * 70);
      const avatarUrl = newProfile.avatar_url || `https://i.pravatar.cc/150?img=${avatarNum}`;

      await DatabaseService.createProfile({
        full_name: newProfile.full_name,
        email: newProfile.email,
        role: newProfile.role,
        status: newProfile.status,
        avatar_url: avatarUrl,
        password: newProfile.password || '123',
        assigned_property_ids: newProfile.assigned_property_ids,
        last_login_at: new Date().toISOString()
      });

      setIsAdding(false);
      setNewProfile({
        full_name: '',
        email: '',
        role: 'booking_staff',
        status: 'active',
        avatar_url: '',
        password: '',
        assigned_property_ids: []
      });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'فشلت عملية إنشاء ملف المستخدم.');
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;

    if (!editingProfile.full_name || !editingProfile.email) {
      alert('الرجاء ملء جميع الحقول المطلوبة.');
      return;
    }

    try {
      await DatabaseService.updateProfile(editingProfile);
      setEditingProfile(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'فشلت عملية تعديل المستخدم.');
    }
  };

  const handleToggleStatus = async (profile: Profile) => {
    if (!isAdmin) {
      alert('عذراً، المدير العام فقط يستطيع تنشيط أو تعطيل الحسابات.');
      return;
    }

    const nextStatus: 'active' | 'inactive' = profile.status === 'active' ? 'inactive' : 'active';
    const updated: Profile = { ...profile, status: nextStatus };
    await DatabaseService.updateProfile(updated);
    await loadData();
  };

  const handlePropertyToggle = (propertyId: string, isForEdit: boolean = false) => {
    if (isForEdit && editingProfile) {
      const currentIds = editingProfile.assigned_property_ids || [];
      const updatedIds = currentIds.includes(propertyId)
        ? currentIds.filter(id => id !== propertyId)
        : [...currentIds, propertyId];
      setEditingProfile({
        ...editingProfile,
        assigned_property_ids: updatedIds
      });
    } else {
      const currentIds = newProfile.assigned_property_ids;
      const updatedIds = currentIds.includes(propertyId)
        ? currentIds.filter(id => id !== propertyId)
        : [...currentIds, propertyId];
      setNewProfile({
        ...newProfile,
        assigned_property_ids: updatedIds
      });
    }
  };

  const togglePasswordVisibility = (profileId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [profileId]: !prev[profileId]
    }));
  };

  const roleLabelsAr: Record<UserRole, string> = {
    super_admin: 'المدير العام (Super)',
    company_manager: 'مدير الشركة (Manager)',
    property_manager: 'مدير المرفق (PM)',
    booking_staff: 'موظف حجز (Staff)',
  };

  const roleDescriptions: Record<UserRole, string> = {
    super_admin: 'التحكم الكامل بكافة جوانب ومرافق الشركة، الإعدادات المالية، الموظفين والحجوزات.',
    company_manager: 'إدارة وتعديل الشاليهات والمخيمات، تعيين الرسوم، واعتماد الميزانيات المالية.',
    property_manager: 'الإشراف على فروع أو شاليهات معينة فحسب، تحديث حالتها التشغيلية ومراقبة الحجوزات الخاصة بها.',
    booking_staff: 'إدخال الحجوزات اليومية واستقبال المكالمات، وإتمام الإجراءات دون حق تعديل الهياكل أو شطب السجلات.',
  };

  const roleColors: Record<UserRole, string> = {
    super_admin: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    company_manager: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    property_manager: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    booking_staff: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
  };

  return (
    <div className="space-y-6 text-slate-100 animate-fadeIn" dir="rtl">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 frosted p-5 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            <span>إدارة صلاحيات الموظفين والمستخدمين</span>
          </h2>
          <p className="text-xs text-slate-300 mt-1">تحديد المسميات الإشرافية، تعيين الرموز السرية، وربط الموظفين بعقارات محددة للوصول</p>
        </div>
        
        {isAdmin && (
          <button 
            id="btn-add-user"
            onClick={() => {
              setIsAdding(!isAdding);
              setEditingProfile(null);
            }}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-650/10 hover:bg-blue-500 transition-colors cursor-pointer border border-blue-500/25"
          >
            {isAdding ? <X className="w-4.5 h-4.5 ml-1" /> : <UserPlus className="w-4.5 h-4.5 ml-1" />}
            {isAdding ? 'إغلاق الاستمارة' : 'إضافة موظف حساب جديد'}
          </button>
        )}
      </div>

      {/* Access restrictions guideline banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 frosted p-4 rounded-xl border border-white/10 shadow-lg">
        {(Object.keys(roleDescriptions) as UserRole[]).map((rKey) => (
          <div key={rKey} className="bg-white/5 p-3.5 rounded-lg border border-white/5 space-y-1.5">
            <span className={`inline-block font-black px-2 py-0.5 rounded-full text-[10px] ${roleColors[rKey]}`}>
              {roleLabelsAr[rKey]}
            </span>
            <p className="text-slate-300 leading-relaxed text-[11px] font-medium">{roleDescriptions[rKey]}</p>
          </div>
        ))}
      </div>

      {/* Add form */}
      {isAdding && (
        <form onSubmit={handleCreateProfile} className="frosted p-6 rounded-2xl border border-white/10 shadow-2xl space-y-5 animate-scaleUp">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <h3 className="font-extrabold text-white text-sm">إنشاء ملف وظيفي جديد</h3>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 px-2.5 py-1 rounded-full font-bold">بموافقة المدير العام</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-1">اسم الموظف بالكامل *</label>
              <input 
                type="text"
                required
                placeholder="خالد بن يحيى السعدي"
                value={newProfile.full_name}
                onChange={(e) => setNewProfile({...newProfile, full_name: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-1">البريد الإلكتروني المعتمر *</label>
              <input 
                type="email"
                required
                placeholder="khalid@starchalet.om"
                value={newProfile.email}
                onChange={(e) => setNewProfile({...newProfile, email: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-1">الدور الوظيفي والصلاحيات *</label>
              <select
                value={newProfile.role}
                onChange={(e) => setNewProfile({...newProfile, role: e.target.value as UserRole})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2.5 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="super_admin" className="bg-slate-900 text-white">المدير العام (Super Admin)</option>
                <option value="company_manager" className="bg-slate-900 text-white">مدير الشركة (Company Manager)</option>
                <option value="property_manager" className="bg-slate-900 text-white">مدير المرفق (Property Manager)</option>
                <option value="booking_staff" className="bg-slate-900 text-white">موظف الحجوزات (Booking Staff)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>الرمز السري المخصص للوصول (Password) *</span>
              </label>
              <input 
                type="text"
                required
                placeholder="أدخل رمز سري، مثلاً: 4321"
                value={newProfile.password}
                onChange={(e) => setNewProfile({...newProfile, password: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-350 mb-2 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span>ربط الموظف بالعقارات المتاحة (صلاحية تحكم مخصصة)</span>
              </label>
              <div className="bg-slate-950/40 p-3 rounded-lg border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {properties.map(prop => {
                  const isChecked = newProfile.assigned_property_ids.includes(prop.id);
                  return (
                    <button
                      type="button"
                      key={prop.id}
                      onClick={() => handlePropertyToggle(prop.id, false)}
                      className={`flex items-center justify-between p-2 rounded-md border text-right transition-all cursor-pointer text-xs ${
                        isChecked 
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{prop.name}</span>
                        <span className="text-[9px] text-slate-405 font-medium">{prop.location_text}</span>
                      </div>
                      <div className={`w-4.5 h-4.5 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button 
              type="button" 
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-white/5"
            >
              إلغاء
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border border-blue-500/25"
            >
              تسجيل الموظف الجديد
            </button>
          </div>
        </form>
      )}

      {/* Edit Form / Modal */}
      {editingProfile && (
        <form onSubmit={handleEditProfileSubmit} className="frosted p-6 rounded-2xl border border-blue-500/30 bg-[#0c1223]/95 shadow-2xl space-y-5 animate-scaleUp">
          <div className="border-b border-white/10 pb-3 flex items-center justify-between">
            <h3 className="font-extrabold text-blue-450 text-sm flex items-center gap-2">
              <Edit className="w-4.5 h-4.5" />
              <span>تعديل بيانات وصلاحيات الحساب: {editingProfile.full_name}</span>
            </h3>
            <button 
              type="button"
              onClick={() => setEditingProfile(null)}
              className="text-slate-450 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-1">اسم الموظف بالكامل *</label>
              <input 
                type="text"
                required
                value={editingProfile.full_name}
                onChange={(e) => setEditingProfile({...editingProfile, full_name: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-1">البريد الإلكتروني *</label>
              <input 
                type="email"
                required
                value={editingProfile.email}
                onChange={(e) => setEditingProfile({...editingProfile, email: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-1">الدور الوظيفي والصلاحيات *</label>
              <select
                value={editingProfile.role}
                onChange={(e) => setEditingProfile({...editingProfile, role: e.target.value as UserRole})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2.5 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              >
                <option value="super_admin" className="bg-slate-900 text-white">المدير العام (Super Admin)</option>
                <option value="company_manager" className="bg-slate-900 text-white">مدير الشركة (Company Manager)</option>
                <option value="property_manager" className="bg-slate-900 text-white">مدير المرفق (Property Manager)</option>
                <option value="booking_staff" className="bg-slate-900 text-white">موظف الحجوزات (Booking Staff)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                <span>الرمز السري المخصص للوصول (Password) *</span>
              </label>
              <input 
                type="text"
                required
                value={editingProfile.password || ''}
                placeholder="أدخل رمز سري جديد"
                onChange={(e) => setEditingProfile({...editingProfile, password: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-lg text-xs py-2 px-3 text-white font-semibold focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-350 mb-2 flex items-center gap-1">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                <span>تعديل العقارات المرتبطة بالحساب</span>
              </label>
              <div className="bg-slate-950/40 p-3 rounded-lg border border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {properties.map(prop => {
                  const currentIds = editingProfile.assigned_property_ids || [];
                  const isChecked = currentIds.includes(prop.id);
                  return (
                    <button
                      type="button"
                      key={prop.id}
                      onClick={() => handlePropertyToggle(prop.id, true)}
                      className={`flex items-center justify-between p-2 rounded-md border text-right transition-all cursor-pointer text-xs ${
                        isChecked 
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold' 
                          : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span>{prop.name}</span>
                        <span className="text-[9px] text-slate-405 font-medium">{prop.location_text}</span>
                      </div>
                      <div className={`w-4.5 h-4.5 rounded flex items-center justify-center border ${
                        isChecked ? 'bg-blue-500 border-blue-500 text-white' : 'border-white/20'
                      }`}>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-white/10">
            <button 
              type="button" 
              onClick={() => setEditingProfile(null)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold rounded-lg transition-colors cursor-pointer border border-white/5"
            >
              إلغاء التعديل
            </button>
            <button 
              type="submit" 
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer border border-emerald-500/25"
            >
              حفظ التعديلات والتغييرات
            </button>
          </div>
        </form>
      )}

      {/* Grid view inside users card */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {profiles.map((p) => {
          const isCurrentUser = p.id === currentUser.id;
          const showPass = showPasswords[p.id] || false;
          
          // Get linked properties names
          const linkedProps = properties.filter(prop => p.assigned_property_ids?.includes(prop.id));

          return (
            <div 
              key={p.id} 
              id={`user-card-${p.id}`}
              className={`frosted p-5 rounded-2xl border ${
                isCurrentUser ? 'border-blue-500/60 shadow-blue-550/15 scale-[1.01] bg-blue-500/[0.02]' : 'border-white/10'
              } shadow-lg flex flex-col justify-between space-y-4`}
            >
              <div className="space-y-4">
                {/* Header Profile with status indicator */}
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    <img 
                      src={p.avatar_url || `https://i.pravatar.cc/150?img=${p.id.charCodeAt(3) || 5}`} 
                      alt={p.full_name} 
                      className="w-12 h-12 rounded-full object-cover border border-white/20 shadow-sm"
                    />
                    <span className={`absolute -bottom-0.5 -left-0.5 block w-3.5 h-3.5 rounded-full border-2 border-[#0c1223] ${
                      p.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}></span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-white text-sm truncate">{p.full_name}</h3>
                    <p className="text-slate-400 text-[10px] truncate leading-relaxed">{p.email}</p>
                  </div>
                </div>

                {/* Role with badged metadata */}
                <div className="space-y-2.5">
                  <span className={`inline-block font-extrabold text-[9px] px-2 py-0.5 rounded-full ${roleColors[p.role]}`}>
                    {roleLabelsAr[p.role]}
                  </span>
                  
                  {/* Password section */}
                  <div className="bg-white/[0.03] border border-white/5 p-2 rounded-xl flex items-center justify-between text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Lock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span className="text-[10px] text-slate-400 font-bold">الرمز السري:</span>
                      <span className="font-mono font-bold tracking-wider text-slate-100 truncate">
                        {showPass ? (p.password || '123') : '••••'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(p.id)}
                      className="p-1 hover:bg-white/10 rounded transition-colors text-slate-400 hover:text-slate-100 cursor-pointer"
                      title={showPass ? "إخفاء الرمز السري" : "إظهار الرمز السري"}
                    >
                      {showPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Property assign list */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-450 font-extrabold flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-blue-400" />
                      <span>العقارات المرتبطة بالحساب:</span>
                    </span>
                    {linkedProps.length === 0 ? (
                      <span className="block text-[10px] text-slate-450 italic bg-white/5 py-1 px-2.5 rounded-lg border border-white/5">
                        {p.role === 'super_admin' || p.role === 'company_manager' ? 'كامل عقارات الشركة (مدير عام)' : 'لم يتم ربط أي عقار بعد'}
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {linkedProps.map(prop => (
                          <span 
                            key={prop.id} 
                            className="text-[9px] bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded font-extrabold hover:bg-blue-500/20 transition-all"
                            title={prop.location_text}
                          >
                            • {prop.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-[10px] text-slate-400 leading-relaxed font-semibold pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>تاريخ الانضمام: {new Date(p.created_at || '').toLocaleDateString('ar-OM')}</span>
                    </div>
                    {p.last_login_at && (
                      <div className="flex items-center gap-1 mt-1">
                        <Activity className="w-3.5 h-3.5 text-slate-450" />
                        <span>آخر دخول نشط: {new Date(p.last_login_at).toLocaleDateString('ar-OM')}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons inside Profile Card */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-1.5 text-xs">
                {isCurrentUser ? (
                  <span className="text-[10px] font-extrabold text-blue-300 bg-blue-500/20 border border-blue-500/25 px-2.5 py-1 rounded-full">
                    أنت مسجل حالياً
                  </span>
                ) : isAdmin ? (
                  <div className="flex items-center gap-2 w-full justify-between">
                    <button
                      onClick={() => handleToggleStatus(p)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer border ${
                        p.status === 'active' 
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/20 hover:bg-rose-500/25' 
                          : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/25'
                      }`}
                    >
                      {p.status === 'active' ? 'تعطيل' : 'تنشيط'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setEditingProfile({
                          ...p,
                          assigned_property_ids: p.assigned_property_ids || []
                        });
                        setIsAdding(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold transition-all cursor-pointer border bg-blue-500/15 text-blue-300 border-blue-500/20 hover:bg-blue-500/25 flex items-center gap-1"
                      title="تعديل بيانات الحساب وصلاحياته"
                    >
                      <Edit className="w-3 h-3" />
                      <span>تعديل</span>
                    </button>
                  </div>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-400">عرض فقط</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
