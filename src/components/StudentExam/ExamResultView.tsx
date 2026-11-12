import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ExamPackage, StudentAttempt } from '../../types/cbt';

interface ExamResultViewProps {
  attempt: StudentAttempt;
  exam: ExamPackage;
  onBackToHome: () => void;
  onRetakeExam: () => void;
}

export const ExamResultView: React.FC<ExamResultViewProps> = ({
  attempt,
  exam,
  onBackToHome,
  onRetakeExam,
}) => {
  const [showPembahasan, setShowPembahasan] = useState(false);
  const isPassing = attempt.statusKelulusan === 'Tuntas';

  useEffect(() => {
    if (isPassing) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  }, [isPassing]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Celebration Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm text-center space-y-5">
          <div
            className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
              isPassing
                ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950'
                : 'bg-gradient-to-tr from-sky-400 to-indigo-500 text-white'
            }`}
          >
            {isPassing ? <Award className="w-10 h-10" /> : <Sparkles className="w-10 h-10" />}
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Hasil Ujian Berbasis Komputer
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {isPassing ? 'Luar Biasa, Kamu Hebat!' : 'Semangat, Terus Berlatih!'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              {attempt.namaSiswa} ({attempt.kelas}) · {exam.mataPelajaran}
            </p>
          </div>

          {/* Big Score Card */}
          <div className="max-w-xs mx-auto p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-indigo-50/50 border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-500">Nilai Akhir Ujian</span>
            <div className="text-5xl font-black font-mono text-indigo-700 tracking-tight">
              {attempt.nilaiAkhir}
            </div>
            <div className="flex items-center justify-center gap-1.5 pt-1">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  isPassing
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {attempt.statusKelulusan} (KKM: {exam.kkm})
              </span>
            </div>
          </div>

          {/* Breakdown Stats */}
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div>
              <span className="text-slate-500 block">Pilihan Ganda</span>
              <strong className="text-sm font-bold text-slate-800 font-mono">
                {attempt.nilaiPG} Poin
              </strong>
            </div>

            <div>
              <span className="text-slate-500 block">Uraian / Esai</span>
              <strong className="text-sm font-bold text-slate-800 font-mono">
                {attempt.nilaiUraian} Poin
              </strong>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={onBackToHome}
              className="px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Beranda</span>
            </button>

            <button
              onClick={() => setShowPembahasan(!showPembahasan)}
              className="px-5 py-2.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <BookOpen className="w-4 h-4" />
              <span>{showPembahasan ? 'Tutup Pembahasan' : 'Lihat Kunci & Pembahasan'}</span>
              {showPembahasan ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            <button
              onClick={onRetakeExam}
              className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Coba Lagi</span>
            </button>
          </div>
        </div>

        {/* Discussion / Pembahasan Accordion */}
        {showPembahasan && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                <span>Kunci Jawaban & Pembahasan Edukasi</span>
              </h2>
              <span className="text-xs text-slate-500 font-medium">
                {exam.soalList.length} Soal
              </span>
            </div>

            <div className="space-y-4">
              {exam.soalList.map((q, idx) => {
                const ans = attempt.jawaban[q.id];
                const isPG = q.jenis === 'pilihan_ganda';
                const isCorrect =
                  isPG &&
                  ans?.jawaban?.trim().toUpperCase() === q.kunciJawaban?.trim().toUpperCase();

                return (
                  <div
                    key={q.id}
                    className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">Soal #{idx + 1}</span>
                        <span className="text-slate-500">
                          ({isPG ? 'Pilihan Ganda' : 'Uraian'})
                        </span>
                      </div>
                      <span className="font-bold text-slate-700 font-mono">
                        Bobot: {q.bobot} Poin
                      </span>
                    </div>

                    <p className="text-sm text-slate-900 font-semibold">{q.pertanyaan}</p>

                    {isPG ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                        <div
                          className={`p-2.5 rounded-xl border font-medium ${
                            isCorrect
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-rose-50 border-rose-300 text-rose-900'
                          }`}
                        >
                          <span className="block text-[11px] text-slate-500">Jawaban Kamu:</span>
                          <span className="font-bold">
                            {ans?.jawaban ? `Opsi ${ans.jawaban}` : '(Tidak dijawab)'}{' '}
                            {isCorrect ? '✓' : '✗'}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800">
                          <span className="block text-[11px] text-slate-500">Kunci Jawaban:</span>
                          <span className="font-bold text-emerald-700">
                            Opsi {q.kunciJawaban}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 text-xs pt-1">
                        <div className="p-3 bg-white rounded-xl border border-slate-200">
                          <span className="block text-[11px] text-slate-500 font-semibold mb-0.5">
                            Jawaban Kamu:
                          </span>
                          <p className="text-slate-800">
                            {ans?.jawaban || '(Tidak menuliskan jawaban)'}
                          </p>
                        </div>

                        <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-amber-900">
                          <span className="block text-[11px] text-amber-800 font-semibold mb-0.5">
                            Kunci Jawaban Referensi:
                          </span>
                          <p className="font-medium">{q.kunciJawaban}</p>
                        </div>
                      </div>
                    )}

                    {q.penjelasan && (
                      <div className="text-xs bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 text-indigo-950">
                        <span className="font-bold block text-indigo-800 mb-0.5">
                          💡 Pembahasan Singkat:
                        </span>
                        {q.penjelasan}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
