import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, FileText, Download, Check, AlertCircle, X, Info } from 'lucide-react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { ExamPackage, KelasSD, MataPelajaran, Question } from '../../types/cbt';
import { createExcelTemplateData, parseExcelRowsToQuestions, parseWordQuestionText } from '../../utils/cbtLogic';

interface FileImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportQuestions: (importedQuestions: Question[], packageMeta?: { judul: string; kelas: KelasSD; mataPelajaran: MataPelajaran }) => void;
  existingExams: ExamPackage[];
}

export const FileImportModal: React.FC<FileImportModalProps> = ({
  isOpen,
  onClose,
  onImportQuestions,
  existingExams,
}) => {
  const [activeTab, setActiveTab] = useState<'excel' | 'word'>('excel');
  const [selectedExamId, setSelectedExamId] = useState<string>('new');
  const [newTitle, setNewTitle] = useState('Paket Soal Hasil Impor');
  const [newKelas, setNewKelas] = useState<KelasSD>('Kelas 4');
  const [newMapel, setNewMapel] = useState<MataPelajaran>('IPAS');

  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([]);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle downloading the Excel Template (.xlsx)
  const handleDownloadExcelTemplate = () => {
    const templateRows = createExcelTemplateData();
    const worksheet = XLSX.utils.json_to_sheet(templateRows);

    // Set column widths for readability
    worksheet['!cols'] = [
      { wch: 8 },  // Nomor
      { wch: 16 }, // Jenis
      { wch: 45 }, // Pertanyaan
      { wch: 18 }, // Opsi_A
      { wch: 18 }, // Opsi_B
      { wch: 18 }, // Opsi_C
      { wch: 18 }, // Opsi_D
      { wch: 14 }, // Kunci_Jawaban
      { wch: 10 }, // Bobot
      { wch: 35 }, // Pembahasan
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Soal SD');
    XLSX.writeFile(workbook, 'Template_Soal_CBT_SD.xlsx');
  };

  // Handle Excel (.xlsx, .xls, .csv) upload
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorNotice(null);
    setParsedQuestions([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonRows = XLSX.utils.sheet_to_json(sheet);

        const { questions, errors } = parseExcelRowsToQuestions(jsonRows);

        if (errors.length > 0) {
          setErrorNotice(errors.join(', '));
        } else if (questions.length === 0) {
          setErrorNotice('Tidak ada baris soal valid yang ditemukan dalam file ini.');
        } else {
          setParsedQuestions(questions);
        }
      } catch (err: any) {
        setErrorNotice('Gagal membaca file Excel: ' + (err.message || 'Format tidak sesuai'));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Handle Word (.docx, .txt) upload
  const handleWordUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrorNotice(null);
    setParsedQuestions([]);

    try {
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        const text = result.value;
        const questions = parseWordQuestionText(text, newKelas);
        if (questions.length === 0) {
          setErrorNotice('Tidak dapat mendeteksi pola nomor soal dalam dokumen Word.');
        } else {
          setParsedQuestions(questions);
        }
      } else {
        // Plain text (.txt)
        const text = await file.text();
        const questions = parseWordQuestionText(text, newKelas);
        if (questions.length === 0) {
          setErrorNotice('Tidak ada butir soal yang berhasil diparsing.');
        } else {
          setParsedQuestions(questions);
        }
      }
    } catch (err: any) {
      setErrorNotice('Gagal membaca file dokumen: ' + (err.message || 'File tidak valid'));
    }
  };

  // Commit imported questions
  const handleConfirmImport = () => {
    if (parsedQuestions.length === 0) return;

    if (selectedExamId === 'new') {
      onImportQuestions(parsedQuestions, {
        judul: newTitle || `Paket Soal (${fileName || 'Impor File'})`,
        kelas: newKelas,
        mataPelajaran: newMapel,
      });
    } else {
      onImportQuestions(parsedQuestions);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-emerald-700 to-teal-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-emerald-100" />
            <h2 className="text-base font-bold">Impor Soal Excel & Word</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2">
          <button
            onClick={() => {
              setActiveTab('excel');
              setParsedQuestions([]);
              setFileName(null);
              setErrorNotice(null);
            }}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'excel'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Format Excel (.xlsx / .csv)</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('word');
              setParsedQuestions([]);
              setFileName(null);
              setErrorNotice(null);
            }}
            className={`pb-3 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'word'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-600" />
            <span>Format Word (.docx / .txt)</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'excel' ? (
            <div className="space-y-4">
              {/* Template Download Card */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-emerald-900">Belum punya template Excel?</h4>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Gunakan template resmi kami yang sudah dilengkapi kolom nomor, jenis (PG/uraian), opsi A-D, kunci jawaban, dan bobot nilai.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadExcelTemplate}
                  className="px-3 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Template Excel</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pilih File Excel (.xlsx, .xls, .csv)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-6 text-center bg-slate-50/50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleExcelUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    {fileName ? fileName : 'Klik atau seret file Excel ke sini'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Mendukung file .xlsx dan .csv standar
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Word Guide Card */}
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-sky-900 font-bold text-xs">
                  <Info className="w-4 h-4" />
                  <span>Format Penulisan Soal di Microsoft Word / Teks</span>
                </div>
                <p className="text-xs text-sky-800">
                  Pastikan dokumen Anda memuat nomor soal (misal: <code>1.</code> atau <code>1)</code>), opsi pilihan jawaban (<code>A.</code>, <code>B.</code>), baris kunci jawaban (<code>Kunci: A</code>), dan bobot nilai (<code>Bobot: 10</code>).
                </p>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Pilih File Word (.docx atau .txt)
                </label>
                <div className="border-2 border-dashed border-slate-300 hover:border-sky-500 rounded-xl p-6 text-center bg-slate-50/50 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept=".docx,.txt"
                    onChange={handleWordUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  <FileText className="w-8 h-8 mx-auto text-sky-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-700">
                    {fileName ? fileName : 'Klik atau seret file Word (.docx) ke sini'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Format .docx dan .txt akan diparsing otomatis
                  </p>
                </div>
              </div>
            </div>
          )}

          {errorNotice && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorNotice}</span>
            </div>
          )}

          {/* Destination Package Settings */}
          {parsedQuestions.length > 0 && (
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tujuan Penyimpanan Hasil Impor ({parsedQuestions.length} Soal Ditemukan)
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Simpan Ke:
                  </label>
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md"
                  >
                    <option value="new">+ Buat Paket Ujian Baru</option>
                    {existingExams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.judul} ({ex.kelas})
                      </option>
                    ))}
                  </select>
                </div>

                {selectedExamId === 'new' && (
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Judul Paket Ujian
                    </label>
                    <input
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md"
                    />
                  </div>
                )}
              </div>

              {selectedExamId === 'new' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Kelas SD
                    </label>
                    <select
                      value={newKelas}
                      onChange={(e) => setNewKelas(e.target.value as KelasSD)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md"
                    >
                      {['Kelas 1', 'Kelas 2', 'Kelas 3', 'Kelas 4', 'Kelas 5', 'Kelas 6'].map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Mata Pelajaran
                    </label>
                    <select
                      value={newMapel}
                      onChange={(e) => setNewMapel(e.target.value as MataPelajaran)}
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-md"
                    >
                      {['IPAS', 'Matematika', 'Bahasa Indonesia', 'Pendidikan Pancasila', 'Pendidikan Agama', 'Seni Budaya', 'PJOK'].map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Preview Table of Parsed Questions */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-700">
                  Pratinjau Butir Soal Terdeteksi:
                </span>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100 bg-white">
                  {parsedQuestions.map((q, idx) => (
                    <div key={q.id || idx} className="p-3 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-bold text-slate-800">
                          #{idx + 1}. {q.jenis === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Uraian'}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                          Bobot: {q.bobot} Poin
                        </span>
                      </div>
                      <p className="text-slate-700 line-clamp-2">{q.pertanyaan}</p>
                      {q.opsi && (
                        <div className="text-[11px] text-slate-500">
                          {q.opsi.length} Pilihan Jawaban · Kunci: <strong className="text-emerald-600">{q.kunciJawaban}</strong>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Tutup
          </button>
          <button
            type="button"
            disabled={parsedQuestions.length === 0}
            onClick={handleConfirmImport}
            className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Masukkan {parsedQuestions.length} Soal ke CBT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
