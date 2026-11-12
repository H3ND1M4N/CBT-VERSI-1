import React, { useState } from 'react';
import {
  Sparkles,
  FileSpreadsheet,
  FileText,
  Copy,
  Check,
} from 'lucide-react';

export const GuideTab: React.FC = () => {
  const [copiedWord, setCopiedWord] = useState(false);

  const sampleWordText = `1. Zat hijau daun yang berfungsi dalam fotosintesis adalah ...
A. Klorofil
B. Stomata
C. Floem
D. Xilem
Kunci: A
Bobot: 10
Pembahasan: Klorofil menyerap cahaya untuk fotosintesis.

2. Sebutkan 2 manfaat tumbuhan bagi manusia!
Kunci: Menghasilkan oksigen dan menyediakan sumber makanan.
Bobot: 20
Rubrik: Skor 20 jika memuat 2 manfaat. Skor 10 jika 1.`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleWordText);
    setCopiedWord(true);
    setTimeout(() => setCopiedWord(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold text-slate-900">
          Panduan Format & Fitur
        </h1>
        <p className="text-xs text-slate-500">
          Pedoman praktis pembuatan soal AI, impor dokumen, dan penilaian CBT SD.
        </p>
      </div>

      {/* Grid of guidance cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: AI */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">1. Generator AI</h2>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Kelas 1–3: 3 Opsi (A–C)</li>
            <li>• Kelas 4–6: 4 Opsi (A–D)</li>
            <li>• Otomatis kunci & rubrik penskoran</li>
          </ul>
        </div>

        {/* Card 2: Excel */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <FileSpreadsheet className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">2. Impor Excel (.xlsx)</h2>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Unduh template tabel bawaan</li>
            <li>• Isi pertanyaan, opsi A–D, kunci</li>
            <li>• Tentukan bobot poin per soal</li>
          </ul>
        </div>

        {/* Card 3: Word */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center">
            <FileText className="w-4 h-4" />
          </div>
          <h2 className="text-sm font-bold text-slate-900">3. Impor Word (.docx)</h2>
          <ul className="text-xs text-slate-600 space-y-1">
            <li>• Format bernomor (1., 2.)</li>
            <li>• Opsi berhuruf (A., B., C.)</li>
            <li>• Baris "Kunci:" & "Bobot:"</li>
          </ul>
        </div>
      </div>

      {/* Format Word Example */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 uppercase tracking-wide">
              <FileText className="w-3.5 h-3.5 text-sky-600" />
              <span>Contoh Format Naskah Word (.docx)</span>
            </h2>
          </div>

          <button
            onClick={copyToClipboard}
            className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1"
          >
            {copiedWord ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            <span>{copiedWord ? 'Tersalin' : 'Salin Contoh'}</span>
          </button>
        </div>

        <pre className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs font-mono overflow-x-auto whitespace-pre leading-relaxed">
          {sampleWordText}
        </pre>
      </div>
    </div>
  );
};
