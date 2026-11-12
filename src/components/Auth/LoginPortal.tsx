import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  User,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface LoginPortalProps {
  onSelectRole: (role: 'guru' | 'siswa') => void;
  examCount: number;
}

export const LoginPortal: React.FC<LoginPortalProps> = ({
  onSelectRole,
  examCount,
}) => {
  const [guruPin, setGuruPin] = useState('');
  const [showPinError, setShowPinError] = useState(false);
  const [needPin, setNeedPin] = useState(false);

  const handleTeacherLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (needPin && guruPin.trim() !== '1234' && guruPin.trim() !== '') {
      setShowPinError(true);
      return;
    }
    onSelectRole('guru');
  };

  const handleStudentLogin = () => {
    onSelectRole('siswa');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-indigo-50/20 to-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      {/* Top Bar Branding */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 leading-tight">
              CBT SDN GUNUNGSARI 04
            </h1>
            <p className="text-[11px] font-semibold text-slate-500">
              Platform Ujian Berbasis Komputer Ramah Anak SD
            </p>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-600 shadow-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Tersedia {examCount} Paket Ujian
        </span>
      </div>

      {/* Main Role Selection Center */}
      <div className="max-w-4xl mx-auto w-full my-auto py-8 space-y-8">
        <div className="text-center space-y-2 max-w-lg mx-auto">
          <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-extrabold uppercase tracking-wider rounded-full">
            Selamat Datang di Portal CBT
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Pilih Peran Anda untuk Masuk
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Silakan pilih akses sebagai Guru untuk mengelola soal & nilai, atau sebagai Siswa untuk langsung memulai ujian.
          </p>
        </div>

        {/* 2 Big Choice Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {/* CARD 1: GURU */}
          <div className="relative bg-white rounded-3xl border-2 border-indigo-200/80 hover:border-indigo-500 transition-all duration-300 shadow-md hover:shadow-xl p-6 sm:p-8 flex flex-col justify-between group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <BookOpen className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  Pendidik & Admin
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Masuk Sebagai Guru
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Akses Studio Guru untuk menyusun soal, memanfaatkan AI generator, impor dokumen, dan merekap nilai.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Bank Soal Kelas 1–6 (PG & Uraian)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Buat Soal Instan dengan AI Gemini</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Impor Berkas Excel & Word (.docx)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Pemeriksaan Jawaban & Ekspor Nilai</span>
                </div>
              </div>

              {needPin && (
                <div className="pt-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    PIN Keamanan Guru (Opsional, Default: 1234)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      placeholder="Ketik 1234 atau biarkan kosong"
                      value={guruPin}
                      onChange={(e) => {
                        setGuruPin(e.target.value);
                        setShowPinError(false);
                      }}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                  {showPinError && (
                    <span className="text-[11px] text-rose-600 mt-1 block">
                      PIN salah! Gunakan PIN default 1234 atau kosongkan.
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="pt-6 space-y-2">
              <button
                onClick={() => handleTeacherLogin()}
                className="w-full py-3.5 px-4 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Masuk ke Studio Guru</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <button
                  type="button"
                  onClick={() => setNeedPin(!needPin)}
                  className="hover:text-indigo-600 transition-colors"
                >
                  {needPin ? 'Sembunyikan PIN' : 'Gunakan PIN Keamanan'}
                </button>
                <span>Akses Penuh Pendidik</span>
              </div>
            </div>
          </div>

          {/* CARD 2: SISWA */}
          <div className="relative bg-white rounded-3xl border-2 border-emerald-200/80 hover:border-emerald-500 transition-all duration-300 shadow-md hover:shadow-xl p-6 sm:p-8 flex flex-col justify-between group overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform"></div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Sparkles className="w-7 h-7" />
                </div>
                <span className="text-[11px] font-bold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Peserta Ujian SD
                </span>
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Masuk Sebagai Siswa
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Langsung masuk ke ruang ujian berbasis komputer untuk mengerjakan asesmen dengan token dari guru.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Akses Mudah dengan Token Soal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Tampilan Huruf Besar & Ramah Anak SD</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Fitur Dengarkan Suara Pembaca Soal</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Hasil Skor Langsung Keluar Otomatis</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-900">
                <span className="font-bold">Tips Siswa:</span> Siapkan token ujian yang telah dibagikan oleh bapak/ibu guru di kelas.
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handleStudentLogin}
                className="w-full py-3.5 px-4 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-2xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 group-hover:gap-3"
              >
                <span>Masuk ke Ruang Ujian</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="text-center text-[11px] text-slate-400 mt-2">
                Pengerjaan Asesmen Kelas 1–6 SD
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-5xl mx-auto w-full text-center py-4 text-xs text-slate-400 border-t border-slate-200/60">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© CBT SDN GUNUNGSARI 04 · SD Kelas 1–6</span>
          <span>Kurikulum Merdeka · Generator AI & Koreksi Otomatis</span>
        </div>
      </footer>
    </div>
  );
};
