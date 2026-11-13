import React, { useState } from 'react';
import {
  Sparkles,
  UploadCloud,
  Plus,
  Play,
  BookOpen,
  Clock,
  Award,
  Key,
  Layers,
  Trash2,
  Edit3,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Power,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ExamPackage, KelasSD, MataPelajaran, Question } from '../../types/cbt';

interface ExamListTabProps {
  exams: ExamPackage[];
  onOpenAIGenerator: () => void;
  onOpenFileImport: () => void;
  onOpenManualCreate: () => void;
  onEditExamQuestions: (exam: ExamPackage) => void;
  onDeleteExam: (examId: string) => void;
  onStartStudentTest: (exam: ExamPackage) => void;
  onToggleExamPublish?: (exam: ExamPackage) => void;
  onActivateAllExams?: () => void;
}

const KELAS_FILTER_LIST: (KelasSD | 'Semua')[] = [
  'Semua',
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

export const ExamListTab: React.FC<ExamListTabProps> = ({
  exams,
  onOpenAIGenerator,
  onOpenFileImport,
  onOpenManualCreate,
  onEditExamQuestions,
  onDeleteExam,
  onStartStudentTest,
  onToggleExamPublish,
  onActivateAllExams,
}) => {
  const [selectedKelas, setSelectedKelas] = useState<KelasSD | 'Semua'>('Semua');
  const [searchQuery, setSearchQuery] = useState('');

  const inactiveCount = exams.filter((ex) => ex.isPublished === false).length;

  const filteredExams = exams.filter((ex) => {
    const matchKelas = selectedKelas === 'Semua' || ex.kelas === selectedKelas;
    const matchSearch =
      ex.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.mataPelajaran.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.token.toLowerCase().includes(searchQuery.toLowerCase());
    return matchKelas && matchSearch;
  });

  // Export questions from an exam to Excel
  const handleExportQuestionsToExcel = (exam: ExamPackage) => {
    const rows = exam.soalList.map((q, idx) => ({
      Nomor: idx + 1,
      Jenis: q.jenis,
      Pertanyaan: q.pertanyaan,
      Opsi_A: q.opsi?.[0] ? q.opsi[0].replace(/^[A-Da-d][\.\)]\s*/, '') : '',
      Opsi_B: q.opsi?.[1] ? q.opsi[1].replace(/^[A-Da-d][\.\)]\s*/, '') : '',
      Opsi_C: q.opsi?.[2] ? q.opsi[2].replace(/^[A-Da-d][\.\)]\s*/, '') : '',
      Opsi_D: q.opsi?.[3] ? q.opsi[3].replace(/^[A-Da-d][\.\)]\s*/, '') : '',
      Kunci_Jawaban: q.kunciJawaban,
      Bobot: q.bobot,
      Rubrik: q.rubrikPenilaian || '',
      Pembahasan: q.penjelasan || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Soal Ujian');
    XLSX.writeFile(workbook, `Soal_${exam.mataPelajaran}_${exam.kelas}_${exam.token}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Sleek Action Header */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-sky-600 text-white p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight">
            Bank Soal CBT SD
          </h1>
          <p className="text-xs text-indigo-100 mt-0.5">
            Manajemen soal ujian Kelas 1–6 SD (Pilihan Ganda & Uraian)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={onOpenAIGenerator}
            className="px-3.5 py-2 text-xs font-bold text-slate-900 bg-amber-300 hover:bg-amber-400 rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-900" />
            <span>Buat Soal AI</span>
          </button>

          <button
            onClick={onOpenFileImport}
            className="px-3.5 py-2 text-xs font-bold text-white bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/25 rounded-xl transition-all flex items-center gap-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Impor Excel / Word</span>
          </button>

          <button
            onClick={onOpenManualCreate}
            className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-950/50 hover:bg-indigo-950/70 rounded-xl transition-all flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Paket Manual</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
        {/* Kelas Filter Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
          </span>
          {KELAS_FILTER_LIST.map((k) => (
            <button
              key={k}
              onClick={() => setSelectedKelas(k)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                selectedKelas === k
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {k}
            </button>
          ))}
        </div>

        {/* Search Input + Activate All */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {inactiveCount > 0 && onActivateAllExams && (
            <button
              type="button"
              onClick={onActivateAllExams}
              className="px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Aktifkan semua paket soal agar semua kelas bisa mengerjakan serentak"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Aktifkan Semua ({inactiveCount})</span>
            </button>
          )}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari mapel, judul, token..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Exam Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExams.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200 p-6">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-bold text-slate-700">Tidak ada paket soal</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik "Buat Soal AI" atau "Impor Excel / Word" untuk menambahkan.
            </p>
          </div>
        ) : (
          filteredExams.map((exam) => {
            const pgCount = exam.soalList.filter((q) => q.jenis === 'pilihan_ganda').length;
            const uraianCount = exam.soalList.filter((q) => q.jenis === 'uraian').length;
            const totalPoints = exam.soalList.reduce((acc, q) => acc + (q.bobot || 0), 0);

            const isEarlyGrade =
              exam.kelas.includes('1') || exam.kelas.includes('2') || exam.kelas.includes('3');
            const isActive = exam.isPublished !== false;
            const hasQuestions = exam.soalList.length > 0;

            return (
              <div
                key={exam.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 ${
                  isActive ? 'border-slate-200' : 'border-amber-200 bg-amber-50/20'
                }`}
              >
                <div className="space-y-2.5">
                  {/* Card Badges */}
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-0.5 rounded-md font-bold text-[11px] ${
                          isEarlyGrade
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {exam.kelas}
                      </span>
                      <span className="font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md text-[11px]">
                        {exam.mataPelajaran}
                      </span>
                    </div>

                    {onToggleExamPublish && (
                      <button
                        type="button"
                        onClick={() => onToggleExamPublish(exam)}
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                        }`}
                        title={
                          isActive
                            ? 'Soal Aktif (Klik untuk nonaktifkan)'
                            : 'Soal Nonaktif (Klik untuk aktifkan)'
                        }
                      >
                        <Power className="w-3 h-3" />
                        <span>{isActive ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {exam.judul}
                  </h3>

                  {/* Clean Metadata Line */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 pt-1 flex-wrap">
                    <span className={!hasQuestions ? 'text-rose-600 font-semibold' : ''}>
                      {exam.soalList.length} Soal ({pgCount} PG, {uraianCount} Uraian)
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{exam.durasiMenit} Menit</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono font-semibold text-slate-800">
                      Token: {exam.token}
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditExamQuestions(exam)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Kelola & Tambah Soal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleExportQuestionsToExcel(exam)}
                      className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Unduh Excel"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Hapus paket "${exam.judul}"?`)) {
                          onDeleteExam(exam.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onStartStudentTest(exam)}
                    disabled={!hasQuestions}
                    title={!hasQuestions ? 'Tambahkan soal terlebih dahulu' : 'Uji Soal sebagai Siswa'}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Uji Soal</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
