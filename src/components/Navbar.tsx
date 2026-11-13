import React from 'react';
import { BookOpen, GraduationCap, Sparkles, FileText, BarChart3, HelpCircle, LogOut } from 'lucide-react';

interface NavbarProps {
  activeView: 'guru' | 'siswa' | 'panduan';
  onViewChange: (view: 'guru' | 'siswa' | 'panduan') => void;
  examCount: number;
  currentRole?: 'guru' | 'siswa' | null;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onViewChange,
  examCount,
  currentRole,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-sky-500 to-emerald-400 flex items-center justify-center text-white shadow-sm">
            <GraduationCap className="w-5 h-5" />
          </div>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onLogout) onLogout();
              else onViewChange('guru');
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-indigo-600 transition-colors"
          >
            CBT SDN GUNUNGSARI 04
          </a>
          {currentRole === 'guru' && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-md">
              Guru
            </span>
          )}
          {currentRole === 'siswa' && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-md">
              Siswa
            </span>
          )}
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          {currentRole !== 'siswa' && (
            <button
              onClick={() => onViewChange('guru')}
              className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                activeView === 'guru'
                  ? 'border-indigo-600 text-indigo-600 font-semibold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Studio Guru</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">
                {examCount}
              </span>
            </button>
          )}

          <button
            onClick={() => onViewChange('siswa')}
            className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeView === 'siswa'
                ? 'border-emerald-600 text-emerald-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ruang Ujian Siswa</span>
          </button>

          <button
            onClick={() => onViewChange('panduan')}
            className={`flex items-center gap-2 py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
              activeView === 'panduan'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Panduan & Format</span>
          </button>
        </nav>

        {/* Zone 3: 1 primary action button + Ganti Peran */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              title="Ganti Peran / Keluar ke Halaman Awal"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ganti Peran</span>
            </button>
          )}

          {currentRole !== 'siswa' && activeView === 'siswa' ? (
            <button
              onClick={() => onViewChange('guru')}
              className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Mode Guru
            </button>
          ) : (
            <button
              onClick={() => onViewChange('siswa')}
              className="px-3.5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 rounded-lg shadow-sm transition-all whitespace-nowrap shrink-0 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentRole === 'siswa' ? 'Masuk Ujian' : 'Simulasi Siswa'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
