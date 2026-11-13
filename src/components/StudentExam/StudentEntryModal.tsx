import React, { useState, useEffect } from 'react';
import { Sparkles, Key, User, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ExamPackage, KelasSD } from '../../types/cbt';

interface StudentEntryModalProps {
  exams: ExamPackage[];
  onStartExam: (studentData: {
    nama: string;
    nisn: string;
    kelas: KelasSD;
    nomorAbsen: string;
    exam: ExamPackage;
  }) => void;
  onCancel: () => void;
  preselectedExam?: ExamPackage | null;
}

const KELAS_TABS: (KelasSD | 'Semua')[] = [
  'Semua',
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

export const StudentEntryModal: React.FC<StudentEntryModalProps> = ({
  exams,
  onStartExam,
  onCancel,
  preselectedExam,
}) => {
  const [nama, setNama] = useState('');
  const [nisn, setNisn] = useState('');
  const [nomorAbsen, setNomorAbsen] = useState('');
  const [selectedKelasFilter, setSelectedKelasFilter] = useState<KelasSD | 'Semua'>(
    preselectedExam ? preselectedExam.kelas : 'Semua'
  );
  const [selectedExamId, setSelectedExamId] = useState<string | null>(
    preselectedExam ? preselectedExam.id : null
  );
  const [tokenInput, setTokenInput] = useState(preselectedExam ? preselectedExam.token : '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync if preselectedExam changes
  useEffect(() => {
    if (preselectedExam) {
      setSelectedKelasFilter(preselectedExam.kelas);
      setSelectedExamId(preselectedExam.id);
      setTokenInput(preselectedExam.token);
    }
  }, [preselectedExam]);

  // Only exams that are active (published) and have at least 1 question
  const readyExams = exams.filter(
    (e) => e.isPublished !== false && Array.isArray(e.soalList) && e.soalList.length > 0
  );

  const visibleExams =
    selectedKelasFilter === 'Semua'
      ? readyExams
      : readyExams.filter((e) => e.kelas === selectedKelasFilter);

  // Resolve matched exam unambiguously: prefer explicit selectedExamId if token matches,
  // otherwise match token within selected class filter first, then across all ready exams
  const normalizedToken = tokenInput.trim().toUpperCase();
  const matchedExam =
    (selectedExamId
      ? readyExams.find(
          (e) => e.id === selectedExamId && e.token.trim().toUpperCase() === normalizedToken
        )
      : undefined) ||
    visibleExams.find((e) => e.token.trim().toUpperCase() === normalizedToken) ||
    readyExams.find((e) => e.token.trim().toUpperCase() === normalizedToken);

  const handleSelectQuickExam = (ex: ExamPackage) => {
    setSelectedExamId(ex.id);
    setTokenInput(ex.token);
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!nama.trim()) {
      setErrorMsg('Silakan masukkan nama lengkap siswa.');
      return;
    }

    if (!matchedExam) {
      setErrorMsg('Token ujian tidak valid atau paket soal belum diaktifkan.');
      return;
    }

    if (matchedExam.soalList.length === 0) {
      setErrorMsg('Paket soal ini belum memiliki butir soal.');
      return;
    }

    onStartExam({
      nama: nama.trim(),
      nisn: nisn.trim() || 'NISN-001',
      nomorAbsen: nomorAbsen.trim() || '01',
      kelas: matchedExam.kelas,
      exam: matchedExam,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-2xl mx-auto flex items-center justify-center mb-2">
            <Sparkles className="w-6 h-6 text-amber-200" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">Masuk Ruang Ujian</h2>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Lengkap Siswa
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                placeholder="Contoh: Muhammad Budi Pratama"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NISN (Opsional)
              </label>
              <input
                type="text"
                value={nisn}
                onChange={(e) => setNisn(e.target.value)}
                placeholder="0012345678"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Absen
              </label>
              <input
                type="number"
                value={nomorAbsen}
                onChange={(e) => setNomorAbsen(e.target.value)}
                placeholder="07"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Token Ujian dari Guru
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={tokenInput}
                onChange={(e) => {
                  setTokenInput(e.target.value.toUpperCase());
                  setSelectedExamId(null);
                }}
                placeholder="Masukkan Token (Misal: IPAS4, JUARA1)"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono font-bold tracking-wider uppercase"
              />
            </div>
          </div>

          {/* Class Filter + Quick Select Preset Tokens */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-slate-600">
                Paket Soal Aktif ({readyExams.length}):
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Semua kelas bisa serentak</span>
              </span>
            </div>

            {/* Class Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              {KELAS_TABS.map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSelectedKelasFilter(k)}
                  className={`px-2 py-0.5 text-[11px] font-semibold rounded-md whitespace-nowrap transition-colors ${
                    selectedKelasFilter === k
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            {visibleExams.length === 0 ? (
              <p className="text-[11px] text-slate-500 py-1">
                Belum ada paket soal aktif untuk {selectedKelasFilter}.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                {visibleExams.map((ex) => {
                  const isSelected = matchedExam?.id === ex.id;
                  return (
                    <button
                      key={ex.id}
                      type="button"
                      onClick={() => handleSelectQuickExam(ex)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      {ex.token} ({ex.kelas} - {ex.mataPelajaran})
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {matchedExam && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
              <div className="font-bold">{matchedExam.judul}</div>
              <div className="text-[11px] text-emerald-700">
                {matchedExam.kelas} · {matchedExam.soalList.length} Soal · Durasi: {matchedExam.durasiMenit} Menit
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>

            <button
              type="submit"
              disabled={!matchedExam || !nama.trim()}
              className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Mulai Ujian</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
