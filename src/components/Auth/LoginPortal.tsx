import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  ArrowRight,
  LogOut,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface LoginPortalProps {
  onSelectRole: (role: 'guru' | 'siswa') => Promise<void> | void;
  firebaseUser: User | null;
  authReady: boolean;
  onGoogleSignOut?: () => Promise<void>;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onSelectRole,
  firebaseUser,
  authReady,
  onGoogleSignOut,
}) => {
  const [loadingRole, setLoadingRole] = useState<'guru' | 'siswa' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleRoleClick = async (role: 'guru' | 'siswa') => {
    setErrorMsg(null);
    setLoadingRole(role);
    try {
      await onSelectRole(role);
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('popup-closed-by-user')) {
        setErrorMsg('Login dibatalkan. Silakan pilih akun Google Anda untuk melanjutkan.');
      } else if (msg.includes('popup-blocked')) {
        setErrorMsg('Pop-up login terblokir oleh browser. Izinkan pop-up untuk situs ini lalu coba lagi.');
      } else {
        setErrorMsg('Gagal masuk dengan akun Google. Silakan coba lagi.');
      }
    } finally {
      setLoadingRole(null);
    }
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
            <span className="text-xs font-semibold text-slate-700 truncate max-w-[160px] sm:max-w-[220px]">
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

        {errorMsg && (
          <div className="max-w-xl mx-auto p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
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

            <div className="pt-6">
              <button
                type="button"
                disabled={!authReady || loadingRole !== null}
                onClick={() => handleRoleClick('guru')}
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

            <div className="pt-6">
              <button
                type="button"
                disabled={!authReady || loadingRole !== null}
                onClick={() => handleRoleClick('siswa')}
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
