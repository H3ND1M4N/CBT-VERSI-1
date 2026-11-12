import React, { useState, useEffect } from 'react';
import { X, Check, Plus, Trash2, HelpCircle } from 'lucide-react';
import { Question, QuestionType } from '../../types/cbt';

interface QuestionEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveQuestion: (question: Question) => void;
  initialQuestion?: Question | null;
  targetKelas: string;
}

export const QuestionEditorModal: React.FC<QuestionEditorModalProps> = ({
  isOpen,
  onClose,
  onSaveQuestion,
  initialQuestion,
  targetKelas,
}) => {
  const isEarlyGrade = targetKelas.includes('1') || targetKelas.includes('2') || targetKelas.includes('3');

  const [jenis, setJenis] = useState<QuestionType>('pilihan_ganda');
  const [pertanyaan, setPertanyaan] = useState('');
  const [opsiList, setOpsiList] = useState<string[]>(['A. ', 'B. ', 'C. ', 'D. ']);
  const [kunciJawaban, setKunciJawaban] = useState('A');
  const [bobot, setBobot] = useState(10);
  const [rubrikPenilaian, setRubrikPenilaian] = useState('');
  const [kataKunciRaw, setKataKunciRaw] = useState('');
  const [penjelasan, setPenjelasan] = useState('');

  useEffect(() => {
    if (initialQuestion) {
      setJenis(initialQuestion.jenis);
      setPertanyaan(initialQuestion.pertanyaan);
      if (initialQuestion.opsi && initialQuestion.opsi.length > 0) {
        setOpsiList([...initialQuestion.opsi]);
      } else {
        setOpsiList(isEarlyGrade ? ['A. ', 'B. ', 'C. '] : ['A. ', 'B. ', 'C. ', 'D. ']);
      }
      setKunciJawaban(initialQuestion.kunciJawaban || 'A');
      setBobot(initialQuestion.bobot || 10);
      setRubrikPenilaian(initialQuestion.rubrikPenilaian || '');
      setKataKunciRaw((initialQuestion.kataKunciPenilaian || []).join(', '));
      setPenjelasan(initialQuestion.penjelasan || '');
    } else {
      setJenis('pilihan_ganda');
      setPertanyaan('');
      setOpsiList(isEarlyGrade ? ['A. ', 'B. ', 'C. '] : ['A. ', 'B. ', 'C. ', 'D. ']);
      setKunciJawaban('A');
      setBobot(10);
      setRubrikPenilaian('');
      setKataKunciRaw('');
      setPenjelasan('');
    }
  }, [initialQuestion, isOpen, isEarlyGrade]);

  if (!isOpen) return null;

  const handleOptionChange = (idx: number, val: string) => {
    const updated = [...opsiList];
    const prefix = String.fromCharCode(65 + idx) + '. ';
    if (!val.startsWith(prefix)) {
      updated[idx] = prefix + val.replace(/^[A-Da-d][\.\)]\s*/, '');
    } else {
      updated[idx] = val;
    }
    setOpsiList(updated);
  };

  const addOption = () => {
    if (opsiList.length >= 5) return;
    const nextChar = String.fromCharCode(65 + opsiList.length);
    setOpsiList([...opsiList, `${nextChar}. `]);
  };

  const removeOption = (idx: number) => {
    if (opsiList.length <= 2) return;
    const filtered = opsiList.filter((_, i) => i !== idx);
    // Renumber
    const renumbered = filtered.map((item, i) => {
      const char = String.fromCharCode(65 + i);
      return `${char}. ${item.replace(/^[A-Da-d][\.\)]\s*/, '')}`;
    });
    setOpsiList(renumbered);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pertanyaan.trim()) return;

    const keywords = kataKunciRaw
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    const q: Question = {
      id: initialQuestion ? initialQuestion.id : `q-${Date.now()}`,
      jenis,
      pertanyaan: pertanyaan.trim(),
      opsi: jenis === 'pilihan_ganda' ? opsiList : undefined,
      kunciJawaban: kunciJawaban.trim(),
      kataKunciPenilaian: keywords.length > 0 ? keywords : undefined,
      rubrikPenilaian: rubrikPenilaian.trim() || undefined,
      bobot: Number(bobot) > 0 ? Number(bobot) : 10,
      penjelasan: penjelasan.trim() || undefined,
    };

    onSaveQuestion(q);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-700 to-indigo-600 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold">
              {initialQuestion ? 'Edit Butir Soal' : 'Tambah Soal Baru'}
            </h2>
            <p className="text-xs text-indigo-100 font-medium">
              {targetKelas} SD
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Tipe Soal & Bobot */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bentuk / Jenis Soal
              </label>
              <select
                value={jenis}
                onChange={(e) => {
                  const newJenis = e.target.value as QuestionType;
                  setJenis(newJenis);
                  if (newJenis === 'uraian' && bobot === 10) setBobot(20);
                }}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="pilihan_ganda">Pilihan Ganda (PG)</option>
                <option value="uraian">Uraian / Esai / Isian</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Bobot Nilai (Poin)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={bobot}
                onChange={(e) => setBobot(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Isi Pertanyaan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Teks Pertanyaan / Stimulus
            </label>
            <textarea
              rows={3}
              required
              value={pertanyaan}
              onChange={(e) => setPertanyaan(e.target.value)}
              placeholder="Tuliskan butir soal dengan bahasa yang jelas dan ramah anak..."
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Bagian Pilihan Ganda */}
          {jenis === 'pilihan_ganda' ? (
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">
                  Opsi Pilihan Jawaban ({opsiList.length} Pilihan)
                </span>
                {opsiList.length < 5 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Opsi</span>
                  </button>
                )}
              </div>

              <div className="space-y-2">
                {opsiList.map((opsi, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  const isChecked = kunciJawaban.toUpperCase() === letter;
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700 shrink-0">
                        <input
                          type="radio"
                          name="kunciPG"
                          checked={isChecked}
                          onChange={() => setKunciJawaban(letter)}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className={isChecked ? 'text-emerald-700' : 'text-slate-600'}>
                          {letter}
                        </span>
                      </label>
                      <input
                        type="text"
                        value={opsi}
                        onChange={(e) => handleOptionChange(idx, e.target.value)}
                        placeholder={`Jawaban pilihan ${letter}...`}
                        className={`flex-1 px-3 py-1.5 text-xs bg-white border rounded-md focus:outline-none ${
                          isChecked
                            ? 'border-emerald-400 ring-1 ring-emerald-400'
                            : 'border-slate-300 focus:ring-1 focus:ring-indigo-500'
                        }`}
                      />
                      {opsiList.length > 2 && (
                        <button
                          type="button"
                          onClick={() => removeOption(idx)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                          title="Hapus opsi ini"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Bagian Uraian */
            <div className="space-y-3 bg-amber-50/50 p-4 rounded-xl border border-amber-200">
              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Kunci Jawaban Referensi
                </label>
                <textarea
                  rows={2}
                  value={kunciJawaban}
                  onChange={(e) => setKunciJawaban(e.target.value)}
                  placeholder="Contoh jawaban ideal..."
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Kata Kunci Esensial (Pisahkan koma)
                </label>
                <input
                  type="text"
                  value={kataKunciRaw}
                  onChange={(e) => setKataKunciRaw(e.target.value)}
                  placeholder="oksigen, makanan, klorofil"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-amber-900 mb-1">
                  Rubrik Penskoran
                </label>
                <input
                  type="text"
                  value={rubrikPenilaian}
                  onChange={(e) => setRubrikPenilaian(e.target.value)}
                  placeholder="Skor penuh jika ada 2 kata kunci"
                  className="w-full px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Pembahasan / Penjelasan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pembahasan / Ulasan Edukasi (Muncul setelah ujian selesai)
            </label>
            <textarea
              rows={2}
              value={penjelasan}
              onChange={(e) => setPenjelasan(e.target.value)}
              placeholder="Berikan penjelasan edukatif yang memperkuat pemahaman siswa..."
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Footer buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Butir Soal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
