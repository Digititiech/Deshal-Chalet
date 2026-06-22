/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Settings as SettingsIcon,
  Building,
  DollarSign,
  Percent,
  TrendingDown,
  Lock,
  Save,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Settings } from '../types';
import { DatabaseService } from '../services/db';
import { useAuth } from '../contexts/AuthContext';

export const SettingsPage: React.FC = () => {
  const [settings, setSettings] = React.useState<Settings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saveSuccess, setSaveSuccess] = React.useState(false);

  const { profile } = useAuth();
  const currentUser = profile!;
  const isAdmin = currentUser.role === 'super_admin' || currentUser.role === 'company_manager';

  React.useEffect(() => {
    async function fetchSettings() {
      const data = await DatabaseService.getSettings();
      setSettings(data);
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    if (!isAdmin) {
      alert('خطأ فني: أنت لا تملك الصلاحيات الإدارية المطلوبة لتحديث إعدادات النظام المالية.');
      return;
    }

    try {
      await DatabaseService.updateSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch {
      alert('حدث خطأ أثناء تعديل وحفظ إعدادات النظام.');
    }
  };

  if (loading || !settings) {
    return <div className="p-8 text-center text-slate-400 font-bold">جاري تحميل إعدادات النظام والمحددات الضريبية...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto text-slate-150 text-slate-100 animate-fadeIn">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 frosted p-5 rounded-2xl border border-white/10 shadow-lg">
        <div>
          <h2 className="text-xl font-extrabold text-white">محددات وإعدادات النظام الموحدة</h2>
          <p className="text-xs text-slate-300 mt-1">تحديد الضرائب البلدية، الأسماء الرسمية وضبط المعامل المالي للمضاعفة السعرية</p>
        </div>
      </div>

      {/* Warning banner if not admin */}
      {!isAdmin && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl flex items-start gap-3 text-xs">
          <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-extrabold text-white block">وصول مقيد (أنت حالياً بمحاكاة موظف):</span>
            <span>بناءً على سياسات الأمان المحددة، فإن حسابك الحالي لا يمتلك صلاحية كتابة أو تعديل الإعدادات والضرائب. يمكنك فقط معاينة القيم الافتراضية. لتعديلها، يرجى تبديل المستخدم من القائمة الجانبية إلى "أحمد بن سعيد" (Super Admin).</span>
          </div>
        </div>
      )}

      {settings && (
        <form onSubmit={handleSaveSettings} className="frosted rounded-2xl border border-white/10 shadow-2xl overflow-hidden space-y-6 p-6 text-slate-100 animate-fadeIn">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building className="w-4.5 h-4.5 text-blue-400" /> الهوية الرسمية للشركة المضيفة
            </h3>
            <span className="text-[10px] bg-slate-950/40 border border-white/10 text-slate-300 px-2 py-0.5 rounded font-mono font-bold select-none">ID: {settings.id}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Name */}
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-2">الاسم التجاري للمنصة (بالعربي أو الإنجليزي)</label>
              <input 
                type="text"
                disabled={!isAdmin}
                value={settings.company_name}
                onChange={(e) => setSettings({...settings, company_name: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl text-xs py-2.5 px-3.5 text-white font-bold focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Currency Code */}
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-2">رمز العملة (ISO Code)</label>
              <input 
                type="text"
                disabled={!isAdmin}
                value={settings.currency_code}
                onChange={(e) => setSettings({...settings, currency_code: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl text-xs py-2.5 px-3.5 text-white font-bold font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Currency Symbol */}
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-2">رمز العملة كعينة نصية (مثل ر.ع.)</label>
              <input 
                type="text"
                disabled={!isAdmin}
                value={settings.currency_name}
                onChange={(e) => setSettings({...settings, currency_name: e.target.value})}
                className="w-full bg-slate-950/40 border border-white/10 rounded-xl text-xs py-2.5 px-3.5 text-white font-bold focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Tax rate */}
            <div>
              <label className="block text-xs font-bold text-slate-350 mb-2">نسبة ضريبة القيمة المضافة ومصروفات البلدية (%)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                  <Percent className="w-4 h-4" />
                </span>
                <input 
                  type="number"
                  step="0.01"
                  disabled={!isAdmin}
                  value={settings.tax_rate}
                  onChange={(e) => setSettings({...settings, tax_rate: Number(e.target.value)})}
                  className="w-full bg-slate-950/40 border border-white/10 rounded-xl text-xs py-2.5 px-3.5 text-white font-bold font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
              <TrendingDown className="w-4.5 h-4.5 text-blue-400" />
              مضاعف التسعير الفصلي والموسمي (Multiplier Factor)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2 space-y-1.5">
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  يسمح لك نظام المضاعفة بضبط ورفع أو خفض جميع أسعار الشاليهات والمخيمات بنسبة مئوية مرنة طبقاً للمواسم (مثل مهرجان خريف صلالة، أو العطلات الشتوية).
                </p>
                <div className="bg-white/5 rounded-lg text-[10px] text-slate-300 border border-white/5 font-bold leading-relaxed space-y-1 select-none p-3">
                  <p>• القيمة 1.00 تعني السعر العادي دون خفض أو زيادة</p>
                  <p>• القيمة 1.25 تعني رفع الأسعار لجميع الفروع بنسبة 25%+ تلقائياً</p>
                  <p>• القيمة 0.85 تعني تفعيل خصومات العافية بنسبة 15%- على الدخول</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-350 mb-2">عامل المضاعفة الفعال</label>
                <input 
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="3.0"
                  disabled={!isAdmin}
                  value={settings.price_multiplier}
                  onChange={(e) => setSettings({...settings, price_multiplier: Number(e.target.value)})}
                  className="w-full bg-slate-950/45 border-2 border-white/15 rounded-xl text-sm py-2.5 px-3.5 text-white font-extrabold font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Save Status controls */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            {saveSuccess && (
              <span className="text-[11px] font-black text-emerald-300 bg-emerald-500/20 border border-emerald-500/25 px-3 py-1.5 rounded-full flex items-center gap-1.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> تم تحديث إعدادات النظام الموحدة وتعميم الضريبة بنجاح.
              </span>
            )}
            {!saveSuccess && <span></span>}

            {isAdmin && (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-md transition-colors border border-blue-500/25 cursor-pointer"
              >
                <Save className="w-4 h-4 ml-1" />
                حفظ التعديلات والتغييرات الضريبية
              </button>
            )}
          </div>
        </form>
      )}

    </div>
  );
};
