import React, { useState, useEffect } from 'react';
import {
  Clock,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Flag,
  CheckCircle2,
  AlertTriangle,
  Send,
  HelpCircle,
  Type,
  Award,
} from 'lucide-react';
import { ExamPackage, Question, StudentAnswerItem, StudentAttempt } from '../../types/cbt';
import { calculateExamScores } from '../../utils/cbtLogic';

interface StudentExamViewProps {
  exam: ExamPackage;
  studentData: {
    nama: string;
    nisn: string;
    kelas: string;
    nomorAbsen: string;
  };
  onSubmitExam: (attempt: StudentAttempt) => void;
  onExitExam: () => void;
}

export const StudentExamView: React.FC<StudentExamViewProps> = ({
  exam,
  studentData,
  onSubmitExam,
  onExitExam,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentAnswerItem>>({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(exam.durasiMenit * 60);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fontSizeLevel, setFontSizeLevel] = useState<'normal' | 'large' | 'xlarge'>('large');
  const [isReadingAudio, setIsReadingAudio] = useState(false);
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);

  const currentQuestion = exam.soalList[currentIndex];

  // Timer countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Text-to-Speech Read Aloud for Kids
  const handleReadAloud = () => {
    if (!('speechSynthesis' in window)) {
      alert('Fitur suara tidak didukung di peramban ini.');
      return;
    }

    if (isReadingAudio) {
      window.speechSynthesis.cancel();
      setIsReadingAudio(false);
      return;
    }

    const q = currentQuestion;
    let textToSpeak = `Soal nomor ${currentIndex + 1}. ${q.pertanyaan}. `;

    if (q.jenis === 'pilihan_ganda' && q.opsi) {
      textToSpeak += `Pilihan jawaban: ${q.opsi.join('. ')}.`;
    } else {
      textToSpeak += 'Jawablah dengan uraian singkat dan jelas.';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'id-ID';
    utterance.rate = 0.88; // Gentle kid-friendly pace

    utterance.onend = () => setIsReadingAudio(false);
    utterance.onerror = () => setIsReadingAudio(false);

    setIsReadingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  // Stop audio if navigating question
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsReadingAudio(false);
    }
  }, [currentIndex]);

  // Answer handler for multiple choice
  const handleSelectOption = (optionLetter: string) => {
    const qId = currentQuestion.id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { ragu: false }),
        jawaban: optionLetter,
      },
    }));
  };

  // Answer handler for essay
  const handleEssayChange = (text: string) => {
    const qId = currentQuestion.id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { ragu: false }),
        jawaban: text,
      },
    }));
  };

  // Toggle Ragu-ragu
  const handleToggleRagu = () => {
    const qId = currentQuestion.id;
    setAnswers((prev) => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { jawaban: '' }),
        ragu: !prev[qId]?.ragu,
      },
    }));
  };

  // Count answered, doubtful, unanswered
  const answeredCount = exam.soalList.filter(
    (q) => answers[q.id]?.jawaban && answers[q.id].jawaban.trim() !== ''
  ).length;

  const raguCount = exam.soalList.filter((q) => answers[q.id]?.ragu).length;
  const unansweredCount = exam.soalList.length - answeredCount;

  // Submit test
  const handleFinalSubmit = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    const scores = calculateExamScores(exam, answers);

    const now = new Date();
    const formattedDate = now.toISOString().replace('T', ' ').substring(0, 16);

    const attempt: StudentAttempt = {
      id: `att-${Date.now()}`,
      examId: exam.id,
      namaSiswa: studentData.nama,
      nisn: studentData.nisn,
      kelas: exam.kelas,
      nomorAbsen: studentData.nomorAbsen,
      waktuMulai: formattedDate,
      waktuSelesai: formattedDate,
      jawaban: answers,
      nilaiPG: scores.nilaiPG,
      nilaiUraian: scores.nilaiUraian,
      totalBobotDiperoleh: scores.totalBobotDiperoleh,
      totalBobotMaksimal: scores.totalBobotMaksimal,
      nilaiAkhir: scores.nilaiAkhir,
      statusKelulusan: scores.statusKelulusan,
      status: scores.isAllGraded ? 'dinilai' : 'selesai',
    };

    onSubmitExam(attempt);
  };

  const handleAutoSubmit = () => {
    handleFinalSubmit();
  };

  // Text size classes
  const fontClass =
    fontSizeLevel === 'xlarge'
      ? 'text-xl leading-relaxed'
      : fontSizeLevel === 'large'
      ? 'text-lg leading-relaxed'
      : 'text-base leading-normal';

  const isLowTime = timeLeftSeconds <= 300; // < 5 mins

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Bar for Student Exam */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Identity info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold shadow-sm">
              {studentData.nomorAbsen || 'SD'}
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                {studentData.nama}
              </h1>
              <p className="text-xs text-slate-500">
                {exam.kelas} · {exam.mataPelajaran} · Token: {exam.token}
              </p>
            </div>
          </div>

          {/* Center: Timer Countdown */}
          <div
            className={`flex items-center gap-2 px-4 py-1.5 rounded-xl font-mono text-base font-bold border transition-colors ${
              isLowTime
                ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                : 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <Clock className={`w-4 h-4 ${isLowTime ? 'text-rose-600' : 'text-slate-600'}`} />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          {/* Right Tools: Voice, Text Size, Fullscreen */}
          <div className="flex items-center gap-2">
            {/* Audio Read Aloud */}
            <button
              onClick={handleReadAloud}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isReadingAudio
                  ? 'bg-amber-400 text-slate-900 ring-2 ring-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
              title="Dengarkan soal dibacakan dengan suara ramah anak"
            >
              {isReadingAudio ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span className="hidden sm:inline">
                {isReadingAudio ? 'Hentikan Suara' : 'Dengarkan Soal'}
              </span>
            </button>

            {/* Font Size Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setFontSizeLevel('normal')}
                className={`px-2 py-1 rounded-lg font-bold ${
                  fontSizeLevel === 'normal' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'
                }`}
                title="Ukuran Standar"
              >
                A
              </button>
              <button
                onClick={() => setFontSizeLevel('large')}
                className={`px-2 py-1 rounded-lg font-bold ${
                  fontSizeLevel === 'large' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'
                }`}
                title="Ukuran Sedang"
              >
                A+
              </button>
              <button
                onClick={() => setFontSizeLevel('xlarge')}
                className={`px-2 py-1 rounded-lg font-bold ${
                  fontSizeLevel === 'xlarge' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-500'
                }`}
                title="Ukuran Besar"
              >
                A++
              </button>
            </div>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
              title="Layar Penuh"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Layout: 2-Zone (Question Card & Palette) */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Question Card (8 Cols on desktop) */}
        <section className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between min-h-[500px]">
          <div className="space-y-6">
            {/* Top Question Info */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-extrabold flex items-center justify-center font-mono">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-semibold px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                  {currentQuestion.jenis === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Uraian'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Bobot: {currentQuestion.bobot} Poin</span>
                </span>
              </div>
            </div>

            {/* Question Text */}
            <div className={`text-slate-900 font-semibold ${fontClass}`}>
              {currentQuestion.pertanyaan}
            </div>

            {/* Multiple Choice Options */}
            {currentQuestion.jenis === 'pilihan_ganda' && currentQuestion.opsi && (
              <div className="space-y-3 pt-2">
                {currentQuestion.opsi.map((opsi, oIdx) => {
                  const letter = String.fromCharCode(65 + oIdx);
                  const isSelected = answers[currentQuestion.id]?.jawaban === letter;
                  const cleanOpsiText = opsi.replace(/^[A-Da-d][\.\)]\s*/, '');

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => handleSelectOption(letter)}
                      className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                        isSelected
                          ? 'bg-emerald-50/80 border-emerald-500 shadow-sm ring-2 ring-emerald-200'
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 font-mono transition-colors ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {letter}
                      </div>

                      <span
                        className={`font-medium ${
                          fontSizeLevel === 'xlarge'
                            ? 'text-lg'
                            : fontSizeLevel === 'large'
                            ? 'text-base'
                            : 'text-sm'
                        } ${isSelected ? 'text-emerald-950 font-bold' : 'text-slate-800'}`}
                      >
                        {cleanOpsiText}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Essay Input */}
            {currentQuestion.jenis === 'uraian' && (
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-700">
                  Tuliskan Jawaban Uraian Kamu di Bawah Ini:
                </label>
                <textarea
                  rows={6}
                  value={answers[currentQuestion.id]?.jawaban || ''}
                  onChange={(e) => handleEssayChange(e.target.value)}
                  placeholder="Ketik jawabanmu dengan kalimat yang lengkap dan jelas..."
                  className={`w-full p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:border-emerald-500 focus:bg-white focus:outline-none transition-all ${fontClass}`}
                />
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Jumlah Karakter: {(answers[currentQuestion.id]?.jawaban || '').length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Bar */}
          <div className="pt-6 border-t border-slate-200 mt-8 flex flex-wrap items-center justify-between gap-3">
            {/* Previous Button */}
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            {/* Ragu-ragu Checkbox */}
            <button
              type="button"
              onClick={handleToggleRagu}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 ${
                answers[currentQuestion.id]?.ragu
                  ? 'bg-amber-400 text-slate-900 border-amber-500 shadow-sm'
                  : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span>
                {answers[currentQuestion.id]?.ragu ? '✓ Bertanda Ragu-Ragu' : 'Tandai Ragu-Ragu'}
              </span>
            </button>

            {/* Next / Submit */}
            {currentIndex < exam.soalList.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(exam.soalList.length - 1, prev + 1))}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsConfirmSubmitOpen(true)}
                className="px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Kumpulkan Jawaban</span>
              </button>
            )}
          </div>
        </section>

        {/* Right Column: Question Palette (4 Cols on desktop) */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Quick Palette Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800">Nomor Soal Ujian</h2>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                {answeredCount}/{exam.soalList.length} Terjawab
              </span>
            </div>

            {/* Question numbers grid */}
            <div className="grid grid-cols-5 gap-2">
              {exam.soalList.map((q, idx) => {
                const ans = answers[q.id];
                const isAnswered = ans?.jawaban && ans.jawaban.trim() !== '';
                const isRagu = ans?.ragu;
                const isCurrent = currentIndex === idx;

                let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200';

                if (isRagu) {
                  colorClasses = 'bg-amber-400 text-slate-900 border-amber-500 font-bold';
                } else if (isAnswered) {
                  colorClasses = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-11 rounded-xl text-xs font-mono font-bold border-2 transition-all flex items-center justify-center relative ${colorClasses} ${
                      isCurrent ? 'ring-4 ring-indigo-400 ring-offset-2' : ''
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isRagu && (
                      <span className="w-2 h-2 rounded-full bg-slate-900 absolute top-1 right-1" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block" />
                <span>Hijau: Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-amber-400 inline-block" />
                <span>Kuning: Ragu-ragu</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded bg-slate-100 border border-slate-300 inline-block" />
                <span>Abu-abu: Belum Dijawab</span>
              </div>
            </div>

            {/* Finish exam button */}
            <button
              onClick={() => setIsConfirmSubmitOpen(true)}
              className="w-full py-3 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>Selesai & Kumpulkan</span>
            </button>
          </div>
        </aside>
      </main>

      {/* Confirmation Modal before Submit */}
      {isConfirmSubmitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden p-6 space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-700 rounded-2xl mx-auto flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">
                Apakah Kamu Yakin Ingin Mengumpulkan?
              </h3>
              <p className="text-xs text-slate-500">
                Setelah dikumpulkan, jawaban tidak dapat diubah lagi.
              </p>
            </div>

            {/* Summary statistics */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Total Soal:</span>
                <span className="font-bold text-slate-900">{exam.soalList.length} Soal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-700 font-semibold">Sudah Dijawab:</span>
                <span className="font-bold text-emerald-700">{answeredCount} Soal</span>
              </div>
              {raguCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-amber-700 font-semibold">Masih Ragu-ragu:</span>
                  <span className="font-bold text-amber-700">{raguCount} Soal</span>
                </div>
              )}
              {unansweredCount > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-rose-700 font-semibold">Belum Dijawab:</span>
                  <span className="font-bold text-rose-700">{unansweredCount} Soal</span>
                </div>
              )}
            </div>

            {unansweredCount > 0 && (
              <p className="text-xs text-rose-600 font-medium text-center">
                Perhatian: Ada {unansweredCount} butir soal yang belum kamu jawab.
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmSubmitOpen(false)}
                className="w-1/2 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Cek Lagi
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="w-1/2 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition-colors"
              >
                Ya, Kumpulkan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
