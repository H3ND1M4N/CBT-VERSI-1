import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  ArrowRight,
  LogOut,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import firebaseConfig from '../../../firebase-applet-config.json';

interface LoginPortalProps {
  onSelectRole: (role: 'guru' | 'siswa', preferRedirect?: boolean) => Promise<void> | void;
  firebaseUser: User | null;
  authReady: boolean;
  onGoogleSignOut?: () => Promise<void>;
  initialError?: string | null;
}

function detectInAppBrowser(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|WhatsApp|Line\/|Telegram|; wv\)/i.test(ua);
}

function detectIframe(): boolean {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onSelectRole,
  firebaseUser,
  authReady,
  onGoogleSignOut,
  initialError = null,
}) => {
  const [loadingRole, setLoadingRole] = useState<'guru' | 'siswa' | null>(null);
  const [lastAttemptedRole, setLastAttemptedRole] = useState<'guru' | 'siswa' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(initialError);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const isInAppWebView = detectInAppBrowser();
  const inIframe = detectIframe();

  useEffect(() => {
    if (initialError) {
      setErrorMsg(initialError);
    }
  }, [initialError]);

  const handleRoleClick = async (role: 'guru' | 'siswa', preferRedirect = false) => {
    setErrorMsg(null);
    setIsUnauthorizedDomain(false);
    setLoadingRole(role);
    setLastAttemptedRole(role);

    try {
      await onSelectRole(role, preferRedirect);
    } catch (err: any) {
      const code = err?.code || '';
      const msg = err?.message || '';

      if (code === 'auth/popup-closed-by-user' || msg.includes('popup-closed-by-user')) {
        setErrorMsg(
          'Jendela login Google tertutup sebelum selesai. Silakan coba lagi atau gunakan Mode Redirect di HP.'
        );
      } else if (code === 'auth/cancelled-popup-request') {
        setErrorMsg('Permintaan login dibatalkan. Silakan tekan tombol masuk sekali saja.');
      } else if (code === 'auth/popup-blocked' || msg.includes('popup-blocked')) {
        setErrorMsg(
          'Pop-up login diblokir oleh browser HP. Izinkan pop-up atau gunakan tombol Login Mode Redirect di bawah.'
        );
      } else if (code === 'auth/unauthorized-domain' || msg.includes('unauthorized-domain')) {
        setIsUnauthorizedDomain(true);
        setErrorMsg(
          `Domain (${window.location.hostname}) belum diizinkan pada pengaturan Firebase Auth (${code || 'auth/unauthorized-domain'}).`
        );
      } else if (code === 'auth/network-request-failed') {
        setErrorMsg('Koneksi internet bermasalah. Periksa jaringan seluler/Wi-Fi Anda lalu coba lagi.');
      } else {
        setErrorMsg(
          `Gagal masuk dengan akun Google${code ? ` (${code})` : ''}. Jika dibuka di HP, gunakan Chrome/Safari atau coba Mode Redirect.`
        );
      }
    } finally {
      setLoadingRole(null);
    }
  };

  const handleCopyUrl = () => {
    try {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {}
  };

  const handleCopyDomain = () => {
    try {
      navigator.clipboard.writeText(window.location.hostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar Branding */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
            CBT SDN GUNUNGSARI 04
          </h1>
        </div>

        {firebaseUser && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-xs">
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[140px] sm:max-w-[220px]">
              {firebaseUser.displayName || firebaseUser.email}
            </span>
            {onGoogleSignOut && (
              <button
                type="button"
                onClick={onGoogleSignOut}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 pl-2 border-l border-slate-200"
                title="Keluar Akun Google"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Role Selection Center */}
      <div className="max-w-4xl mx-auto w-full my-auto py-8 space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Masuk Portal CBT
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Pilih peran untuk masuk. Seluruh soal dan nilai tersimpan real-time di cloud.
          </p>
        </div>

        {/* In-App Browser Warning on Mobile (WhatsApp / Telegram / IG) */}
        {isInAppWebView && (
          <div className="max-w-xl mx-auto p-4 bg-amber-50 border border-amber-300 rounded-2xl space-y-2.5 text-xs text-amber-900">
            <div className="flex items-start gap-2 font-semibold">
              <ExternalLink className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Terdeteksi browser dalam aplikasi (WhatsApp/Media Sosial). Login Google sering diblokir di sini — buka link di <strong>Google Chrome</strong> atau <strong>Safari</strong>.
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Tersalin! Tempel di Chrome/Safari' : 'Salin Link Aplikasi'}</span>
            </button>
          </div>
        )}

        {/* Auth Error + Unauthorized Domain Guide / Mobile Redirect Fallback */}
        {errorMsg && (
          <div className="max-w-xl mx-auto p-3.5 bg-rose-50 border border-rose-200 rounded-2xl space-y-2.5 text-xs text-rose-700">
            <div className="flex items-start gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>

            {isUnauthorizedDomain ? (
              <div className="pl-6 space-y-2 text-[11px] text-rose-900 bg-white/80 p-3 rounded-xl border border-rose-200">
                <p className="font-semibold">Cara Mengizinkan Domain Ini:</p>
                <ol className="list-decimal list-inside space-y-1">
                  <li>
                    Buka{' '}
                    <a
                      href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/authentication/settings`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-bold text-indigo-700 hover:text-indigo-900"
                    >
                      Firebase Console → Authentication → Settings
                    </a>
                  </li>
                  <li>Pilih tab <strong>Authorized domains</strong> lalu klik <strong>Add domain</strong>.</li>
                  <li>Masukkan <code className="px-1 py-0.5 bg-rose-100 rounded font-mono">{window.location.hostname}</code> lalu simpan.</li>
                </ol>
                <button
                  type="button"
                  onClick={handleCopyDomain}
                  className="mt-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors"
                >
                  {copiedDomain ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDomain ? 'Domain Tersalin!' : `Salin ${window.location.hostname}`}</span>
                </button>
              </div>
            ) : (
              !inIframe &&
              lastAttemptedRole && (
                <div className="flex flex-wrap items-center gap-2 pl-6">
                  <button
                    type="button"
                    disabled={loadingRole !== null}
                    onClick={() => handleRoleClick(lastAttemptedRole, true)}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Coba Login Mode Redirect (Khusus HP)</span>
                  </button>
                </div>
              )
            )}
          </div>
        )}

        {/* 2 Clean Role Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CARD 1: GURU */}
          <div className="bg-white rounded-3xl border-2 border-indigo-200/80 hover:border-indigo-500 transition-all duration-300 shadow-md hover:shadow-xl p-6 sm:p-7 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700">
                  Pendidik
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Sebagai Guru
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Kelola bank soal, buat soal AI, impor Excel/Word, dan periksa rekap nilai.
                </p>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                type="button"
                disabled={!authReady || loadingRole !== null}
                onClick={() => handleRoleClick('guru', false)}
                className="w-full py-3.5 px-4 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
              >
                {loadingRole === 'guru' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghubungkan...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {firebaseUser ? 'Masuk ke Studio Guru' : 'Masuk dengan Google (Guru)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {!firebaseUser && !inIframe && (
                <button
                  type="button"
                  disabled={!authReady || loadingRole !== null}
                  onClick={() => handleRoleClick('guru', true)}
                  className="w-full py-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Login Alternatif HP (Tanpa Pop-up)
                </button>
              )}
            </div>
          </div>

          {/* CARD 2: SISWA */}
          <div className="bg-white rounded-3xl border-2 border-emerald-200/80 hover:border-emerald-500 transition-all duration-300 shadow-md hover:shadow-xl p-6 sm:p-7 flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  Peserta Ujian
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Sebagai Siswa
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Masuk ke ruang ujian menggunakan token dari guru untuk mengerjakan soal.
                </p>
              </div>
            </div>

            <div className="pt-6 space-y-2">
              <button
                type="button"
                disabled={!authReady || loadingRole !== null}
                onClick={() => handleRoleClick('siswa', false)}
                className="w-full py-3.5 px-4 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-60 rounded-2xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2"
              >
                {loadingRole === 'siswa' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menghubungkan...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {firebaseUser ? 'Masuk ke Ruang Ujian' : 'Masuk dengan Google (Siswa)'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {!firebaseUser && !inIframe && (
                <button
                  type="button"
                  disabled={!authReady || loadingRole !== null}
                  onClick={() => handleRoleClick('siswa', true)}
                  className="w-full py-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors"
                >
                  Login Alternatif HP (Tanpa Pop-up)
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-3 text-xs text-slate-400 border-t border-slate-200/60">
        <div className="flex items-center justify-between">
          <span>CBT SDN GUNUNGSARI 04 · SD Kelas 1–6</span>
          <span>Tersinkronisasi Real-Time</span>
        </div>
      </footer>
    </div>
  );
};
