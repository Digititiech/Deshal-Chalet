/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, ArrowLeft, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type LoginView = 'login' | 'forgot_password' | 'forgot_success';

export const LoginPage: React.FC = () => {
  const { signIn, sendPasswordResetEmail } = useAuth();

  // Form state
  const [view, setView] = useState<LoginView>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // -------------------------------------------------------
  // Handle Login Submit
  // -------------------------------------------------------
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني.');
      return;
    }
    if (!password.trim()) {
      setError('يرجى إدخال كلمة المرور.');
      return;
    }

    setIsLoading(true);
    const { error: authError } = await signIn(email.trim(), password);
    setIsLoading(false);

    if (authError) {
      setError(authError);
    }
  };

  // -------------------------------------------------------
  // Handle Forgot Password Submit
  // -------------------------------------------------------
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني المرتبط بحسابك.');
      return;
    }

    setIsLoading(true);
    const { error: resetError } = await sendPasswordResetEmail(email.trim());
    setIsLoading(false);

    if (resetError) {
      setError(resetError);
    } else {
      setView('forgot_success');
    }
  };

  return (
    <div
      className="min-h-screen bg-[#0c1222] flex items-center justify-center p-4 relative overflow-hidden"
      dir="rtl"
    >
      {/* ═══════════════ Animated Background ═══════════════ */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Mesh gradient blobs */}
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-700/10 blur-[100px] animate-pulse" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full bg-amber-600/5 blur-[80px]" />

        {/* Subtle grid */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: `
              linear-gradient(rgba(148,163,184,1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(148,163,184,1) 1px, transparent 1px)
            `,
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating stars */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.5 + 0.1,
              animation: `pulse ${Math.random() * 3 + 2}s infinite`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* ═══════════════ Login Card ═══════════════ */}
      <div className="relative w-full max-w-md">

        {/* Brand Header above the card */}
        <div className="text-center mb-8 animate-fadeIn">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-2xl shadow-amber-900/30 ring-2 ring-amber-500/20">
              <img src="/logo.png" alt="شعار ذا ستار شاليه" className="w-full h-full object-cover" />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-l from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent tracking-tight">
            ذا ستار شاليه
          </h1>
          <p className="text-slate-400 text-sm mt-1 font-medium">نظام التشغيل الرقمي المتكامل</p>
        </div>

        {/* ── Glass Card ── */}
        <div
          className="rounded-3xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden"
          style={{
            background: 'rgba(15, 23, 42, 0.80)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
          }}
        >
          {/* Card Top Accent */}
          <div className="h-1 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

          <div className="p-8">

            {/* ══════════════ LOGIN VIEW ══════════════ */}
            {view === 'login' && (
              <>
                <div className="mb-7">
                  <h2 className="text-xl font-bold text-white">تسجيل الدخول</h2>
                  <p className="text-slate-400 text-sm mt-1">أدخل بيانات حسابك للوصول إلى النظام</p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="mb-5 flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                    <p className="text-rose-300 text-xs font-medium leading-relaxed">{error}</p>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-5" noValidate>

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="login-email" className="block text-xs font-bold text-slate-300">
                      البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(null); }}
                        placeholder="example@starchalet.com"
                        autoComplete="email"
                        dir="ltr"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:bg-white/8 transition-all pr-10 text-left"
                        style={{ direction: 'ltr', textAlign: 'left' }}
                        disabled={isLoading}
                      />
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="login-password" className="block text-xs font-bold text-slate-300">
                      كلمة المرور
                    </label>
                    <div className="relative">
                      <input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(null); }}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        dir="ltr"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:bg-white/8 transition-all text-left"
                        style={{ direction: 'ltr', textAlign: 'left', paddingRight: '2.75rem', paddingLeft: '2.75rem' }}
                        disabled={isLoading}
                      />
                      {/* Lock Icon (right) */}
                      <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                      {/* Show/Hide Toggle (left) */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(v => !v)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer"
                        tabIndex={-1}
                        aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        title={showPassword ? 'إخفاء' : 'إظهار'}
                      >
                        {showPassword
                          ? <EyeOff className="w-4.5 h-4.5" />
                          : <Eye className="w-4.5 h-4.5" />
                        }
                      </button>
                    </div>
                  </div>

                  {/* Remember Me + Forgot Password Row */}
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input
                        id="remember-me"
                        type="checkbox"
                        checked={rememberMe}
                        onChange={e => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border border-white/20 bg-white/5 accent-amber-400 cursor-pointer"
                      />
                      <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">تذكّرني</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => { setView('forgot_password'); setError(null); }}
                      className="text-xs text-amber-400 hover:text-amber-300 font-semibold transition-colors hover:underline cursor-pointer"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="login-submit-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-900/30 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer mt-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جارٍ تسجيل الدخول...</span>
                      </>
                    ) : (
                      <>
                        <span>دخول إلى النظام</span>
                      </>
                    )}
                  </button>

                </form>

              </>
            )}

            {/* ══════════════ FORGOT PASSWORD VIEW ══════════════ */}
            {view === 'forgot_password' && (
              <>
                <div className="mb-7">
                  <button
                    type="button"
                    onClick={() => { setView('login'); setError(null); }}
                    className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 text-xs font-semibold mb-5 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 rtl-flip" />
                    <span>العودة إلى تسجيل الدخول</span>
                  </button>
                  <h2 className="text-xl font-bold text-white">استعادة كلمة المرور</h2>
                  <p className="text-slate-400 text-sm mt-1 leading-relaxed">
                    أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
                  </p>
                </div>

                {/* Error Alert */}
                {error && (
                  <div className="mb-5 flex items-start gap-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 animate-fadeIn">
                    <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" />
                    <p className="text-rose-300 text-xs font-medium leading-relaxed">{error}</p>
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-5" noValidate>

                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-300">
                      البريد الإلكتروني
                    </label>
                    <div className="relative">
                      <input
                        id="forgot-email"
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(null); }}
                        placeholder="example@starchalet.com"
                        autoComplete="email"
                        dir="ltr"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/60 focus:bg-white/8 transition-all pr-10 text-left"
                        style={{ direction: 'ltr', textAlign: 'left' }}
                        disabled={isLoading}
                      />
                      <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    id="forgot-password-submit-btn"
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-900/30 transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>جارٍ الإرسال...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>إرسال رابط الاستعادة</span>
                      </>
                    )}
                  </button>

                </form>
              </>
            )}

            {/* ══════════════ FORGOT SUCCESS VIEW ══════════════ */}
            {view === 'forgot_success' && (
              <div className="text-center py-4 animate-fadeIn">
                <div className="flex justify-center mb-5">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center ring-2 ring-emerald-500/30">
                    <CheckCircle className="w-8 h-8 text-emerald-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-2">تم الإرسال بنجاح!</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">
                  إذا كان البريد الإلكتروني مسجلاً في النظام، سيصلك رابط إعادة تعيين كلمة المرور خلال دقائق.
                  <br />
                  <span className="text-slate-500 text-xs mt-2 block">تحقق من مجلد الرسائل غير المرغوب فيها إذا لم يصلك البريد.</span>
                </p>
                <button
                  type="button"
                  onClick={() => { setView('login'); setError(null); }}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 shadow-lg transition-all cursor-pointer"
                >
                  العودة إلى تسجيل الدخول
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-slate-600 mt-6 font-medium select-none">
          نظام ذا ستار شاليه © 2026 — جميع الحقوق محفوظة
        </p>

      </div>
    </div>
  );
};
