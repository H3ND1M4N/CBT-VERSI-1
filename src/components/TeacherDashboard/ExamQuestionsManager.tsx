import React, { useState } from 'react';
import {
  ArrowLeft,
  Plus,
  Sparkles,
  Edit,
  Trash2,
  Clock,
  Award,
  Key,
  Layers,
  CheckCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';
import { ExamPackage, Question } from '../../types/cbt';
import { QuestionEditorModal } from './QuestionEditorModal';

interface ExamQuestionsManagerProps {
  exam: ExamPackage;
  onBack: () => void;
  onUpdateExam: (updated: ExamPackage) => void;
  onOpenAIGenerator: () => void;
}

export const ExamQuestionsManager: React.FC<ExamQuestionsManagerProps> = ({
  exam,
  onBack,
  onUpdateExam,
  onOpenAIGenerator,
}) => {
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const totalPoints = exam.soalList.reduce((acc, q) => acc + (q.bobot || 0), 0);

  const handleSaveQuestion = (savedQ: Question) => {
    let updatedList: Question[];
    const exists = exam.soalList.some((q) => q.id === savedQ.id);

    if (exists) {
      updatedList = exam.soalList.map((q) => (q.id === savedQ.id ? savedQ : q));
    } else {
      updatedList = [...exam.soalList, savedQ];
    }

    const updatedTotal = updatedList.reduce((acc, q) => acc + (q.bobot || 0), 0);
    onUpdateExam({
      ...exam,
      soalList: updatedList,
      totalBobot: updatedTotal,
    });
  };

  const handleDeleteQuestion = (qId: string) => {
    if (!confirm('Hapus butir soal ini dari paket?')) return;
    const updatedList = exam.soalList.filter((q) => q.id !== qId);
    const updatedTotal = updatedList.reduce((acc, q) => acc + (q.bobot || 0), 0);
    onUpdateExam({
      ...exam,
      soalList: updatedList,
      totalBobot: updatedTotal,
    });
  };

  const handleUpdateMeta = (field: keyof ExamPackage, value: any) => {
    onUpdateExam({
      ...exam,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with back button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-600 transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-bold rounded">
                {exam.kelas}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {exam.mataPelajaran}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 mt-0.5">{exam.judul}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAIGenerator}
            className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>Generate Tambahan AI</span>
          </button>

          <button
            onClick={() => {
              setEditingQuestion(null);
              setIsEditorOpen(true);
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tambah Butir Soal</span>
          </button>
        </div>
      </div>

      {/* Settings Strip */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <label className="block text-slate-500 font-semibold mb-1">Durasi Ujian (Menit)</label>
          <input
            type="number"
            min={5}
            max={180}
            value={exam.durasiMenit}
            onChange={(e) => handleUpdateMeta('durasiMenit', Number(e.target.value))}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-800"
          />
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">KKM / Kriteria Kelulusan</label>
          <input
            type="number"
            min={10}
            max={100}
            value={exam.kkm}
            onChange={(e) => handleUpdateMeta('kkm', Number(e.target.value))}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-bold text-slate-800"
          />
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Token Akses Siswa</label>
          <input
            type="text"
            value={exam.token}
            onChange={(e) => handleUpdateMeta('token', e.target.value.toUpperCase())}
            className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-md font-mono font-bold text-slate-800 uppercase"
          />
        </div>

        <div>
          <label className="block text-slate-500 font-semibold mb-1">Total Bobot Nilai</label>
          <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold rounded-md font-mono">
            {totalPoints} Poin
          </div>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Daftar Butir Soal ({exam.soalList.length} Soal)
        </h3>

        {exam.soalList.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
            <BookOpen className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-semibold text-slate-600">
              Paket ini belum memiliki butir soal.
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik "+ Tambah Butir Soal" atau gunakan "Generate Tambahan AI" untuk mengisi.
            </p>
          </div>
        ) : (
          exam.soalList.map((q, idx) => (
            <div
              key={q.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center font-mono">
                    {idx + 1}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded">
                    {q.jenis === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Uraian'}
                  </span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Bobot: {q.bobot} Poin
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setEditingQuestion(q);
                      setIsEditorOpen(true);
                    }}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Soal"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Teks Pertanyaan */}
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {q.pertanyaan}
              </p>

              {/* Opsi / Kunci */}
              {q.jenis === 'pilihan_ganda' && q.opsi && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                  {q.opsi.map((opt, oIdx) => {
                    const optKey = opt.trim().substring(0, 1).toUpperCase();
                    const isKey = optKey === q.kunciJawaban?.toUpperCase();
                    return (
                      <div
                        key={oIdx}
                        className={`p-2 rounded-lg border ${
                          isKey
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        {opt} {isKey && ' ✓ (Kunci)'}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.jenis === 'uraian' && (
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                  <div>
                    <span className="font-semibold">Kunci Referensi:</span> {q.kunciJawaban}
                  </div>
                  {q.rubrikPenilaian && (
                    <div>
                      <span className="font-semibold">Rubrik Penskoran:</span> {q.rubrikPenilaian}
                    </div>
                  )}
                  {q.kataKunciPenilaian && (
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="font-semibold">Kata Kunci Esensial:</span>
                      {q.kataKunciPenilaian.map((k, i) => (
                        <span key={i} className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px]">
                          {k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {q.penjelasan && (
                <div className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  Pembahasan: {q.penjelasan}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Question Editor Modal */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onSaveQuestion={handleSaveQuestion}
        initialQuestion={editingQuestion}
        targetKelas={exam.kelas}
      />
    </div>
  );
};
