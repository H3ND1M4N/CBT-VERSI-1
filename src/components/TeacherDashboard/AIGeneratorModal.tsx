import React, { useState } from 'react';
import { Sparkles, X, Check, AlertCircle, RefreshCw, Layers, Award, FileQuestion } from 'lucide-react';
import { ExamPackage, KelasSD, MataPelajaran, Question } from '../../types/cbt';

interface AIGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveExam: (newExam: ExamPackage) => void;
}

const KELAS_OPTIONS: KelasSD[] = [
  'Kelas 1',
  'Kelas 2',
  'Kelas 3',
  'Kelas 4',
  'Kelas 5',
  'Kelas 6',
];

const MAPEL_OPTIONS: MataPelajaran[] = [
  'IPAS',
  'Matematika',
  'Bahasa Indonesia',
  'Pendidikan Pancasila',
  'Pendidikan Agama',
  'Seni Budaya',
  'PJOK',
  'Bahasa Inggris',
];

const TOPIK_SUGGESTIONS: Record<string, string[]> = {
  IPAS: [
    'Siklus Air & Perubahan Cuaca',
    'Bagian Tumbuhan & Fotosintesis',
    'Rantai Makanan & Ekosistem',
    'Perubahan Wujud Zat di Sekitar Kita',
    'Energi dan Perubahannya',
  ],
  Matematika: [
    'Operasi Hitung Penjumlahan & Pengurangan',
    'Perkalian & Pembagian Bilangan Cacah',
    'Mengenal Bangun Datar & Sifatnya',
    'Pecahan Senilai Sederhana',
    'Pengukuran Panjang, Berat, dan Waktu',
  ],
  'Bahasa Indonesia': [
    'Ide Pokok & Kalimat Utama dalam Paragraf',
    'Membedakan Teks Fiksi dan Nonfiksi',
    'Penggunaan Tanda Baca & Huruf Kapital',
    'Menulis Cerita Pengalaman Sehari-hari',
    'Menemukan Informasi Penting dalam Teks',
  ],
  'Pendidikan Pancasila': [
    'Penerapan Sila Pancasila di Sekolah',
    'Hak dan Kewajiban Anak di Rumah & Sekolah',
    'Keberagaman Budaya & Suku Bangsa',
    'Musyawarah untuk Mencapai Mufakat',
    'Gotong Royong dalam Kehidupan Bermasyarakat',
  ],
};

export const AIGeneratorModal: React.FC<AIGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSaveExam,
}) => {
  const [kelas, setKelas] = useState<KelasSD>('Kelas 4');
  const [mataPelajaran, setMataPelajaran] = useState<MataPelajaran>('IPAS');
  const [topik, setTopik] = useState('Siklus Air & Perubahan Cuaca');
  const [jumlahPG, setJumlahPG] = useState<number>(4);
  const [jumlahUraian, setJumlahUraian] = useState<number>(2);
  const [tingkatKesulitan, setTingkatKesulitan] = useState<'Mudah' | 'Sedang' | 'Menantang (HOTS)'>('Sedang');
  const [bobotPG, setBobotPG] = useState<number>(15);
  const [bobotUraian, setBobotUraian] = useState<number>(20);
  const [instruksiKhusus, setInstruksiKhusus] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<{
    judulPaket: string;
    deskripsi: string;
    soalList: Question[];
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setGeneratedResult(null);

    try {
      const response = await fetch('/api/gemini/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kelas,
          mataPelajaran,
          topik,
          jumlahPG,
          jumlahUraian,
          tingkatKesulitan,
          instruksiKhusus,
          bobotPGBawaan: bobotPG,
          bobotUraianBawaan: bobotUraian,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Gagal menghasilkan soal dari AI');
      }

      const resData = data.data;
      setGeneratedResult({
        judulPaket: resData.judulPaket || `Asesmen ${mataPelajaran} ${kelas}: ${topik}`,
        deskripsi: resData.deskripsi || `Paket soal CBT Kurikulum Merdeka untuk ${kelas} SD.`,
        soalList: resData.soalList || [],
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses generator AI.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToBank = () => {
    if (!generatedResult) return;

    const totalBobot = generatedResult.soalList.reduce((acc, q) => acc + (q.bobot || 10), 0);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const token = `${mataPelajaran.substring(0, 3).toUpperCase()}${kelas.replace(/\D/g, '') || 'SD'}`;

    const newExam: ExamPackage = {
      id: `exam-ai-${Date.now()}`,
      judul: generatedResult.judulPaket,
      deskripsi: generatedResult.deskripsi,
      kelas,
      mataPelajaran,
      durasiMenit: Math.max(20, (jumlahPG * 2) + (jumlahUraian * 5)),
      kkm: 75,
      acakSoal: false,
      acakOpsi: false,
      tampilkanHasil: true,
      token,
      tanggalDibuat: new Date().toISOString().split('T')[0],
      totalBobot,
      soalList: generatedResult.soalList,
    };

    onSaveExam(newExam);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-700 to-sky-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-200" />
            <h2 className="text-base font-bold">Buat Soal dengan AI</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {!generatedResult ? (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tingkat Kelas */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Kelas
                  </label>
                  <select
                    value={kelas}
                    onChange={(e) => setKelas(e.target.value as KelasSD)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {KELAS_OPTIONS.map((k) => (
                      <option key={k} value={k}>
                        {k} (SD)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Mata Pelajaran */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    value={mataPelajaran}
                    onChange={(e) => {
                      const newMapel = e.target.value as MataPelajaran;
                      setMataPelajaran(newMapel);
                      if (TOPIK_SUGGESTIONS[newMapel]?.length) {
                        setTopik(TOPIK_SUGGESTIONS[newMapel][0]);
                      }
                    }}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    {MAPEL_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topik / Materi Pokok */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Materi Pokok / Capaian Pembelajaran
                </label>
                <input
                  type="text"
                  value={topik}
                  onChange={(e) => setTopik(e.target.value)}
                  placeholder="Contoh: Siklus Air, Penjumlahan 1-20, Norma Sekolah"
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                {TOPIK_SUGGESTIONS[mataPelajaran] && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[11px] text-slate-400 py-0.5">Saran topik:</span>
                    {TOPIK_SUGGESTIONS[mataPelajaran].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setTopik(s)}
                        className={`text-xs px-2.5 py-0.5 rounded-md transition-colors ${
                          topik === s
                            ? 'bg-indigo-100 text-indigo-700 font-medium'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Jumlah Soal & Kesulitan */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Pilihan Ganda (PG)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={15}
                    value={jumlahPG}
                    onChange={(e) => setJumlahPG(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Bobot per soal: {bobotPG} poin
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Soal Uraian / Isian
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={jumlahUraian}
                    onChange={(e) => setJumlahUraian(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Bobot per soal: {bobotUraian} poin
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tingkat Kognitif
                  </label>
                  <select
                    value={tingkatKesulitan}
                    onChange={(e) => setTingkatKesulitan(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Mudah">Mudah (Pemahaman Dasar)</option>
                    <option value="Sedang">Sedang (Penerapan / Kontekstual)</option>
                    <option value="Menantang (HOTS)">Menantang (HOTS / Analisis)</option>
                  </select>
                </div>
              </div>

              {/* Atur Bobot Nilai */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-indigo-600" />
                    <span>Pengaturan Pembobotan Nilai Otomatis</span>
                  </h3>
                  <span className="text-xs font-bold text-indigo-600">
                    Estimasi Total: {(jumlahPG * bobotPG) + (jumlahUraian * bobotUraian)} Poin
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      Bobot Soal Pilihan Ganda (poin)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={bobotPG}
                      onChange={(e) => setBobotPG(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">
                      Bobot Soal Uraian (poin)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={bobotUraian}
                      onChange={(e) => setBobotUraian(Number(e.target.value))}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              {/* Instruksi Khusus */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan atau Konteks Khusus (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={instruksiKhusus}
                  onChange={(e) => setInstruksiKhusus(e.target.value)}
                  placeholder="Contoh: Masukkan cerita bergaya fabel untuk soal nomor 1, gunakan nama tokoh lokal Indonesia..."
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* Result Review State */
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-emerald-900">{generatedResult.judulPaket}</h3>
                  <p className="text-xs text-emerald-700 mt-0.5">{generatedResult.deskripsi}</p>
                  <div className="flex items-center gap-3 text-xs text-emerald-800 font-medium mt-2">
                    <span>{kelas}</span>
                    <span>·</span>
                    <span>{mataPelajaran}</span>
                    <span>·</span>
                    <span>{generatedResult.soalList.length} Soal</span>
                    <span>·</span>
                    <span>Total Bobot: {generatedResult.soalList.reduce((acc, q) => acc + q.bobot, 0)} Poin</span>
                  </div>
                </div>
                <button
                  onClick={() => setGeneratedResult(null)}
                  className="px-3 py-1.5 text-xs font-medium text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Generate Ulang</span>
                </button>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Daftar Soal yang Dihasilkan:
                </h4>
                {generatedResult.soalList.map((soal, index) => (
                  <div
                    key={soal.id || index}
                    className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">
                        Soal #{index + 1} ({soal.jenis === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Uraian'})
                      </span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-semibold rounded text-[11px]">
                        Bobot: {soal.bobot} Poin
                      </span>
                    </div>

                    <p className="text-sm text-slate-800 font-medium">{soal.pertanyaan}</p>

                    {soal.jenis === 'pilihan_ganda' && soal.opsi && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1">
                        {soal.opsi.map((opt, oIdx) => {
                          const optKey = opt.trim().substring(0, 1).toUpperCase();
                          const isCorrect = optKey === soal.kunciJawaban?.toUpperCase();
                          return (
                            <div
                              key={oIdx}
                              className={`px-3 py-1.5 text-xs rounded-lg border ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700'
                              }`}
                            >
                              {opt} {isCorrect && ' ✓ (Kunci)'}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {soal.jenis === 'uraian' && (
                      <div className="text-xs space-y-1 bg-amber-50/60 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                        <div>
                          <span className="font-semibold">Kunci Referensi:</span> {soal.kunciJawaban}
                        </div>
                        {soal.rubrikPenilaian && (
                          <div>
                            <span className="font-semibold">Rubrik Penskoran:</span> {soal.rubrikPenilaian}
                          </div>
                        )}
                      </div>
                    )}

                    {soal.penjelasan && (
                      <p className="text-xs text-slate-500 italic pt-1">
                        Pembahasan: {soal.penjelasan}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Batal
          </button>

          {!generatedResult ? (
            <button
              type="button"
              disabled={isLoading || !topik.trim()}
              onClick={handleGenerate}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-all flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sedang Membuat Soal AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Generate Paket Soal</span>
                </>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setGeneratedResult(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Ubah Parameter
              </button>
              <button
                type="button"
                onClick={handleApplyToBank}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Simpan ke Bank Soal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
