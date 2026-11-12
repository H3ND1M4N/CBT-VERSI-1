import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  XCircle,
  Sparkles,
  Download,
  Printer,
  ChevronRight,
  User,
  Clock,
  BookOpen,
  X,
  Check,
  RefreshCw,
  HelpCircle,
  Trash2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExamPackage, Question, StudentAttempt } from '../../types/cbt';
import { calculateExamScores } from '../../utils/cbtLogic';

interface GradingTabProps {
  exams: ExamPackage[];
  attempts: StudentAttempt[];
  onUpdateAttempt: (updated: StudentAttempt) => void;
  onDeleteAttempt?: (attemptId: string) => void;
  onClearAllAttempts?: () => void;
}

export const GradingTab: React.FC<GradingTabProps> = ({
  exams,
  attempts,
  onUpdateAttempt,
  onDeleteAttempt,
  onClearAllAttempts,
}) => {
  const [selectedExamFilter, setSelectedExamFilter] = useState<string>('all');
  const [activeAttemptForGrading, setActiveAttemptForGrading] = useState<StudentAttempt | null>(null);

  // AI Assist Grading State
  const [aiLoadingForQuestionId, setAiLoadingForQuestionId] = useState<string | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<
    Record<
      string,
      {
        skorDisarankan: number;
        statusKesesuaian: string;
        kataKunciDitemukan: string[];
        kataKunciBelumAda: string[];
        alasanPenskoran: string;
        umpanBalikPenyemangat: string;
      }
    >
  >({});

  const filteredAttempts = attempts.filter((att) => {
    if (selectedExamFilter === 'all') return true;
    return att.examId === selectedExamFilter;
  });

  const getExamById = (id: string) => exams.find((e) => e.id === id);

  // Handle Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const dataToExport = filteredAttempts.map((att, idx) => {
      const ex = getExamById(att.examId);
      return {
        No: idx + 1,
        'Nama Siswa': att.namaSiswa,
        NISN: att.nisn,
        Kelas: att.kelas,
        'Nomor Absen': att.nomorAbsen,
        'Paket Ujian': ex?.judul || att.examId,
        'Mata Pelajaran': ex?.mataPelajaran || '-',
        'Skor Pilihan Ganda': att.nilaiPG,
        'Skor Uraian': att.nilaiUraian,
        'Nilai Akhir (0-100)': att.nilaiAkhir,
        'Nilai KKM/KKTP': ex?.kkm || 75,
        'Status Kelulusan': att.statusKelulusan,
        'Waktu Selesai': att.waktuSelesai || '-',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [
      { wch: 6 },
      { wch: 22 },
      { wch: 14 },
      { wch: 10 },
      { wch: 12 },
      { wch: 32 },
      { wch: 18 },
      { wch: 18 },
      { wch: 14 },
      { wch: 18 },
      { wch: 14 },
      { wch: 16 },
      { wch: 20 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Rekapitulasi Nilai CBT');
    XLSX.writeFile(workbook, `Rekap_Nilai_CBT_SD_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Trigger AI essay evaluation
  const handleAskAIAssist = async (question: Question, studentAnswerText: string) => {
    setAiLoadingForQuestionId(question.id);
    try {
      const res = await fetch('/api/gemini/assist-grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pertanyaan: question.pertanyaan,
          kunciJawaban: question.kunciJawaban,
          rubrikPenilaian: question.rubrikPenilaian,
          kataKunciPenilaian: question.kataKunciPenilaian,
          jawabanSiswa: studentAnswerText,
          bobotMaksimal: question.bobot,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAiSuggestions((prev) => ({
          ...prev,
          [question.id]: data.data,
        }));
      }
    } catch (err) {
      console.error('Error fetching AI grade assist:', err);
    } finally {
      setAiLoadingForQuestionId(null);
    }
  };

  // Apply score to essay
  const handleScoreChange = (qId: string, score: number, feedback?: string) => {
    if (!activeAttemptForGrading) return;
    const currentExam = getExamById(activeAttemptForGrading.examId);
    if (!currentExam) return;

    const existingAns = activeAttemptForGrading.jawaban[qId] || {
      jawaban: '',
      ragu: false,
    };

    const updatedAnswers = {
      ...activeAttemptForGrading.jawaban,
      [qId]: {
        ...existingAns,
        skorDiberikan: score,
        feedbackGuru: feedback !== undefined ? feedback : existingAns.feedbackGuru,
      },
    };

    const scoreResults = calculateExamScores(currentExam, updatedAnswers);

    const updatedAttempt: StudentAttempt = {
      ...activeAttemptForGrading,
      jawaban: updatedAnswers,
      nilaiPG: scoreResults.nilaiPG,
      nilaiUraian: scoreResults.nilaiUraian,
      totalBobotDiperoleh: scoreResults.totalBobotDiperoleh,
      nilaiAkhir: scoreResults.nilaiAkhir,
      statusKelulusan: scoreResults.statusKelulusan,
      status: scoreResults.isAllGraded ? 'dinilai' : 'selesai',
    };

    setActiveAttemptForGrading(updatedAttempt);
    onUpdateAttempt(updatedAttempt);
  };

  return (
    <div className="space-y-6">
      {/* Top action strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-indigo-600" />
          <span>Rekapitulasi Nilai Siswa</span>
        </h2>

        <div className="flex items-center gap-2.5 flex-wrap">
          <select
            value={selectedExamFilter}
            onChange={(e) => setSelectedExamFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
          >
            <option value="all">Semua Paket Ujian ({attempts.length})</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.judul} ({ex.kelas})
              </option>
            ))}
          </select>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Ekspor Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 no-print"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF</span>
          </button>

          {onClearAllAttempts && attempts.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Yakin ingin menghapus seluruh data rekap nilai ujian siswa? Tindakan ini tidak dapat dibatalkan.')) {
                  onClearAllAttempts();
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5 no-print"
              title="Hapus Semua Nilai"
            >
              <Trash2 className="w-4 h-4" />
              <span>Hapus Semua</span>
            </button>
          )}
        </div>
      </div>

      {/* Attempts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 text-[11px]">
              <tr>
                <th className="py-3 px-4">Siswa</th>
                <th className="py-3 px-4">Paket Ujian & Kelas</th>
                <th className="py-3 px-4 text-center">Skor PG</th>
                <th className="py-3 px-4 text-center">Skor Uraian</th>
                <th className="py-3 px-4 text-center">Nilai Akhir</th>
                <th className="py-3 px-4 text-center">Status Kelulusan</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttempts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Belum ada data pengerjaan ujian siswa untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredAttempts.map((att) => {
                  const exam = getExamById(att.examId);
                  const isPassing = att.statusKelulusan === 'Tuntas';

                  return (
                    <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{att.namaSiswa}</div>
                        <div className="text-[11px] text-slate-500">
                          NISN: {att.nisn} · Absen: {att.nomorAbsen}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800 line-clamp-1">
                          {exam?.judul || att.examId}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {att.kelas} · {exam?.mataPelajaran || '-'}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-700">
                        {att.nilaiPG}
                      </td>

                      <td className="py-3 px-4 text-center font-mono font-medium text-slate-700">
                        {att.nilaiUraian}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-sm font-extrabold font-mono px-2.5 py-1 rounded-lg ${
                            isPassing
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {att.nilaiAkhir}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          KKM: {exam?.kkm || 75}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isPassing
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isPassing ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          )}
                          <span>{att.statusKelulusan}</span>
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setActiveAttemptForGrading(att)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors inline-flex items-center gap-1"
                            title="Periksa Lembar Jawaban"
                          >
                            <span>Periksa</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          {onDeleteAttempt && (
                            <button
                              onClick={() => {
                                if (confirm(`Hapus nilai ujian untuk siswa "${att.namaSiswa}"?`)) {
                                  onDeleteAttempt(att.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                              title="Hapus Nilai Siswa"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Grading & AI Assist Modal */}
      {activeAttemptForGrading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-indigo-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">
                  Lembar Pemeriksaan Jawaban: {activeAttemptForGrading.namaSiswa}
                </h3>
                <p className="text-xs text-slate-300">
                  NISN: {activeAttemptForGrading.nisn} · {activeAttemptForGrading.kelas} · Nilai Akhir:{' '}
                  <span className="font-mono font-bold text-amber-300">
                    {activeAttemptForGrading.nilaiAkhir}/100
                  </span>
                </p>
              </div>
              <button
                onClick={() => setActiveAttemptForGrading(null)}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Questions List & Grading Cards */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {(() => {
                const exam = getExamById(activeAttemptForGrading.examId);
                if (!exam) return <p className="text-xs text-slate-500">Paket ujian tidak ditemukan.</p>;

                return exam.soalList.map((question, qIdx) => {
                  const studentAns = activeAttemptForGrading.jawaban[question.id];
                  const isPG = question.jenis === 'pilihan_ganda';
                  const isCorrectPG =
                    isPG &&
                    studentAns?.jawaban?.trim().toUpperCase() ===
                      question.kunciJawaban?.trim().toUpperCase();

                  const aiSug = aiSuggestions[question.id];
                  const isLoadingAI = aiLoadingForQuestionId === question.id;

                  return (
                    <div
                      key={question.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900">
                          #{qIdx + 1}. {isPG ? 'Pilihan Ganda' : 'Uraian'}
                        </span>
                        <span className="px-2 py-0.5 bg-slate-200 text-slate-800 font-semibold rounded text-[11px]">
                          Bobot Maks: {question.bobot} Poin
                        </span>
                      </div>

                      {/* Pertanyaan */}
                      <p className="text-xs sm:text-sm text-slate-800 font-medium">
                        {question.pertanyaan}
                      </p>

                      {/* Konten PG vs Uraian */}
                      {isPG ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[11px]">Jawaban Siswa:</span>
                            <span
                              className={`font-bold text-sm ${
                                isCorrectPG ? 'text-emerald-700' : 'text-rose-600'
                              }`}
                            >
                              {studentAns?.jawaban ? `Opsi ${studentAns.jawaban}` : '(Tidak Dijawab)'}
                              {isCorrectPG ? ' ✓ (Tepat)' : ' ✗ (Kurang Tepat)'}
                            </span>
                          </div>

                          <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[11px]">Kunci Jawaban:</span>
                            <span className="font-bold text-sm text-emerald-800">
                              Opsi {question.kunciJawaban}
                            </span>
                          </div>
                        </div>
                      ) : (
                        /* Lembar Uraian */
                        <div className="space-y-3">
                          <div className="p-3 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-500 block text-[11px] font-semibold mb-1">
                              Jawaban Siswa:
                            </span>
                            <p className="text-xs text-slate-900 bg-slate-50 p-2.5 rounded border border-slate-200 font-normal leading-relaxed">
                              {studentAns?.jawaban || '(Siswa tidak mengisikan jawaban)'}
                            </p>
                          </div>

                          <div className="p-3 bg-amber-50/70 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
                            <div>
                              <strong className="font-semibold">Kunci Referensi:</strong> {question.kunciJawaban}
                            </div>
                            {question.rubrikPenilaian && (
                              <div>
                                <strong className="font-semibold">Rubrik Penskoran:</strong> {question.rubrikPenilaian}
                              </div>
                            )}
                            {question.kataKunciPenilaian && (
                              <div className="flex items-center gap-1 flex-wrap pt-0.5">
                                <span className="font-semibold">Kata Kunci Esensial:</span>
                                {question.kataKunciPenilaian.map((kw, i) => (
                                  <span
                                    key={i}
                                    className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px]"
                                  >
                                    {kw}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* AI Evaluation Suggestion Strip */}
                          {aiSug && (
                            <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-indigo-900 font-bold">
                                  <Sparkles className="w-4 h-4 text-indigo-600" />
                                  <span>Rekomendasi Penilaian AI: Skor {aiSug.skorDisarankan} / {question.bobot} Poin ({aiSug.statusKesesuaian})</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleScoreChange(
                                      question.id,
                                      aiSug.skorDisarankan,
                                      aiSug.umpanBalikPenyemangat
                                    )
                                  }
                                  className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors flex items-center gap-1"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Terapkan Rekomendasi AI</span>
                                </button>
                              </div>

                              <p className="text-slate-700">{aiSug.alasanPenskoran}</p>

                              <div className="text-xs text-indigo-800 bg-white p-2 rounded border border-indigo-100">
                                <strong>Penyemangat Siswa:</strong> "{aiSug.umpanBalikPenyemangat}"
                              </div>
                            </div>
                          )}

                          {/* Teacher Score Input & AI trigger */}
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                            <div className="flex items-center gap-2">
                              <label className="text-xs font-bold text-slate-700">
                                Berikan Skor:
                              </label>
                              <input
                                type="number"
                                min={0}
                                max={question.bobot}
                                value={studentAns?.skorDiberikan ?? ''}
                                placeholder="0"
                                onChange={(e) =>
                                  handleScoreChange(question.id, Number(e.target.value))
                                }
                                className="w-20 px-2.5 py-1 text-xs font-bold text-center bg-white border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500"
                              />
                              <span className="text-xs text-slate-500">/ {question.bobot} Poin</span>
                            </div>

                            <button
                              type="button"
                              disabled={isLoadingAI || !studentAns?.jawaban}
                              onClick={() => handleAskAIAssist(question, studentAns?.jawaban || '')}
                              className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-300 hover:bg-indigo-50 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1.5"
                            >
                              {isLoadingAI ? (
                                <>
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                  <span>Menganalisis...</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>Bantu Nilai dengan AI</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <div>
                {onDeleteAttempt && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        confirm(
                          `Hapus data nilai ujian untuk siswa "${activeAttemptForGrading.namaSiswa}"?`
                        )
                      ) {
                        onDeleteAttempt(activeAttemptForGrading.id);
                        setActiveAttemptForGrading(null);
                      }
                    }}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Nilai Siswa Ini</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveAttemptForGrading(null)}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
              >
                Selesai Memeriksa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
