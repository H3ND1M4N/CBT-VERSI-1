import { ExamPackage, Question, StudentAnswerItem, StudentAttempt } from '../types/cbt';

/**
 * Normalizes string answer comparison for multiple choice
 */
export function normalizeOptionKey(key: string): string {
  if (!key) return '';
  const trimmed = key.trim();
  // Extract first letter if formatted like "A. Jawaban" -> "A"
  const match = trimmed.match(/^([A-Da-d])[\.\)\s]/);
  if (match) {
    return match[1].toUpperCase();
  }
  return trimmed.substring(0, 1).toUpperCase();
}

/**
 * Calculates raw scores, percentage final score (0-100), and completion status
 */
export function calculateExamScores(
  exam: ExamPackage,
  jawaban: Record<string, StudentAnswerItem>
): {
  nilaiPG: number;
  nilaiUraian: number;
  totalBobotDiperoleh: number;
  totalBobotMaksimal: number;
  nilaiAkhir: number;
  isAllGraded: boolean;
  statusKelulusan: 'Tuntas' | 'Perlu Remedial';
} {
  let nilaiPG = 0;
  let nilaiUraian = 0;
  let totalBobotMaksimal = 0;
  let isAllGraded = true;

  for (const q of exam.soalList) {
    totalBobotMaksimal += q.bobot;
    const ans = jawaban[q.id];

    if (q.jenis === 'pilihan_ganda') {
      const studentChoice = normalizeOptionKey(ans?.jawaban || '');
      const correctChoice = normalizeOptionKey(q.kunciJawaban || '');
      if (studentChoice && studentChoice === correctChoice) {
        nilaiPG += q.bobot;
      }
    } else {
      // Uraian
      if (ans && typeof ans.skorDiberikan === 'number') {
        nilaiUraian += Math.min(q.bobot, Math.max(0, ans.skorDiberikan));
      } else {
        isAllGraded = false;
      }
    }
  }

  const totalBobotDiperoleh = nilaiPG + nilaiUraian;
  const nilaiAkhir = totalBobotMaksimal > 0
    ? Math.round((totalBobotDiperoleh / totalBobotMaksimal) * 100)
    : 0;

  const statusKelulusan: 'Tuntas' | 'Perlu Remedial' =
    nilaiAkhir >= exam.kkm ? 'Tuntas' : 'Perlu Remedial';

  return {
    nilaiPG,
    nilaiUraian,
    totalBobotDiperoleh,
    totalBobotMaksimal,
    nilaiAkhir,
    isAllGraded,
    statusKelulusan,
  };
}

/**
 * Parse lines or text extracted from Word / Notepad documents into questions
 */
export function parseWordQuestionText(rawText: string, defaultKelas: string = 'Kelas 4'): Question[] {
  if (!rawText || !rawText.trim()) return [];

  const questions: Question[] = [];
  // Split by double newlines or question number pattern (e.g. 1. or Soal 1:)
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let currentQuestion: Partial<Question> | null = null;
  let currentOpsi: string[] = [];

  const isJuniorClass = defaultKelas.includes('1') || defaultKelas.includes('2') || defaultKelas.includes('3');

  function saveCurrent() {
    if (currentQuestion && currentQuestion.pertanyaan) {
      const jenis = currentOpsi.length > 0 ? 'pilihan_ganda' : 'uraian';
      const bobot = currentQuestion.bobot || (jenis === 'pilihan_ganda' ? 10 : 20);
      questions.push({
        id: `q-${Date.now()}-${questions.length + 1}`,
        jenis,
        pertanyaan: currentQuestion.pertanyaan,
        opsi: currentOpsi.length > 0 ? currentOpsi : undefined,
        kunciJawaban: currentQuestion.kunciJawaban || (jenis === 'pilihan_ganda' ? 'A' : ''),
        bobot,
        rubrikPenilaian: currentQuestion.rubrikPenilaian,
        penjelasan: currentQuestion.penjelasan,
      });
    }
    currentQuestion = null;
    currentOpsi = [];
  }

  for (const line of lines) {
    // Check if new question started (e.g., "1.", "1)", "Soal 1:", "[1]")
    const qMatch = line.match(/^(?:Soal\s*)?(\d+)[\.\)\]]\s*(.+)/i);
    if (qMatch) {
      saveCurrent();
      currentQuestion = {
        pertanyaan: qMatch[2],
      };
      continue;
    }

    // Check if option line (e.g. "A.", "B)", "a.")
    const optMatch = line.match(/^([A-Da-d])[\.\)\-]\s*(.+)/);
    if (optMatch && currentQuestion) {
      currentOpsi.push(`${optMatch[1].toUpperCase()}. ${optMatch[2]}`);
      continue;
    }

    // Check if key line (e.g. "Kunci: A", "Kunci Jawaban: B", "Jawaban: ...")
    const keyMatch = line.match(/^(?:Kunci(?:\s+Jawaban)?|Jawaban)\s*:\s*(.+)/i);
    if (keyMatch && currentQuestion) {
      currentQuestion.kunciJawaban = keyMatch[1].trim();
      continue;
    }

    // Check if bobot line (e.g. "Bobot: 15")
    const bobotMatch = line.match(/^Bobot\s*:\s*(\d+)/i);
    if (bobotMatch && currentQuestion) {
      currentQuestion.bobot = parseInt(bobotMatch[1], 10);
      continue;
    }

    // Check if pembahasan/rubrik
    const pembMatch = line.match(/^(?:Pembahasan|Rubrik|Penjelasan)\s*:\s*(.+)/i);
    if (pembMatch && currentQuestion) {
      currentQuestion.penjelasan = pembMatch[1].trim();
      continue;
    }

    // If it's a continuing question paragraph
    if (currentQuestion && currentOpsi.length === 0) {
      currentQuestion.pertanyaan += ' ' + line;
    }
  }

  saveCurrent();

  // If no questions parsed via numbering, fallback to splitting paragraphs
  if (questions.length === 0 && rawText.trim().length > 10) {
    questions.push({
      id: `q-${Date.now()}-1`,
      jenis: 'uraian',
      pertanyaan: rawText.trim(),
      kunciJawaban: 'Jawaban sesuai pemahaman siswa',
      bobot: 20,
      rubrikPenilaian: 'Ketepatan ide pokok dan bahasa yang santun',
    });
  }

  return questions;
}

/**
 * Parses raw JSON rows from XLSX / CSV file
 */
export function parseExcelRowsToQuestions(rows: any[]): { questions: Question[]; errors: string[] } {
  const questions: Question[] = [];
  const errors: string[] = [];

  if (!Array.isArray(rows) || rows.length === 0) {
    return { questions, errors: ['File Excel tidak memiliki data atau baris kosong.'] };
  }

  rows.forEach((row, index) => {
    // Find fields regardless of casing
    const findField = (keys: string[]) => {
      for (const k of keys) {
        for (const rowKey of Object.keys(row)) {
          if (rowKey.trim().toLowerCase() === k.toLowerCase()) {
            return row[rowKey];
          }
        }
      }
      return undefined;
    };

    const pertanyaan = findField(['pertanyaan', 'soal', 'isi_soal', 'question']);
    if (!pertanyaan || String(pertanyaan).trim() === '') {
      return; // Skip empty row
    }

    const jenisRaw = String(findField(['jenis', 'tipe', 'type', 'kategori']) || '').toLowerCase();
    const isUraian = jenisRaw.includes('uraian') || jenisRaw.includes('essay') || jenisRaw.includes('isian');

    const bobotRaw = findField(['bobot', 'poin', 'nilai', 'score', 'skor']);
    const bobot = Number(bobotRaw) > 0 ? Number(bobotRaw) : (isUraian ? 20 : 10);

    const kunci = String(findField(['kunci', 'kunci_jawaban', 'jawaban_benar', 'key', 'jawaban']) || '').trim();
    const penjelasan = String(findField(['penjelasan', 'pembahasan', 'rubrik', 'keterangan']) || '').trim();

    if (isUraian) {
      questions.push({
        id: `q-xls-${Date.now()}-${index + 1}`,
        jenis: 'uraian',
        pertanyaan: String(pertanyaan).trim(),
        kunciJawaban: kunci || 'Jawaban relevan dengan konsep yang diajarkan',
        bobot,
        rubrikPenilaian: penjelasan || 'Kesesuaian dengan kata kunci dan konsep',
        penjelasan,
      });
    } else {
      // Pilihan Ganda
      const opsiA = findField(['opsi_a', 'pilihan_a', 'a', 'opsi a']);
      const opsiB = findField(['opsi_b', 'pilihan_b', 'b', 'opsi b']);
      const opsiC = findField(['opsi_c', 'pilihan_c', 'c', 'opsi c']);
      const opsiD = findField(['opsi_d', 'pilihan_d', 'd', 'opsi d']);

      const opsiList: string[] = [];
      if (opsiA) opsiList.push(`A. ${String(opsiA).replace(/^[A-Da-d][\.\)]\s*/, '')}`);
      if (opsiB) opsiList.push(`B. ${String(opsiB).replace(/^[A-Da-d][\.\)]\s*/, '')}`);
      if (opsiC) opsiList.push(`C. ${String(opsiC).replace(/^[A-Da-d][\.\)]\s*/, '')}`);
      if (opsiD) opsiList.push(`D. ${String(opsiD).replace(/^[A-Da-d][\.\)]\s*/, '')}`);

      if (opsiList.length < 2) {
        // Fallback: if options weren't specified, treat as uraian
        questions.push({
          id: `q-xls-${Date.now()}-${index + 1}`,
          jenis: 'uraian',
          pertanyaan: String(pertanyaan).trim(),
          kunciJawaban: kunci || 'Jawaban lengkap dari siswa',
          bobot,
          rubrikPenilaian: 'Kelengkapan dan ketepatan penjelasan',
          penjelasan,
        });
      } else {
        const normalizedKey = normalizeOptionKey(kunci || 'A');
        questions.push({
          id: `q-xls-${Date.now()}-${index + 1}`,
          jenis: 'pilihan_ganda',
          pertanyaan: String(pertanyaan).trim(),
          opsi: opsiList,
          kunciJawaban: normalizedKey,
          bobot,
          penjelasan,
        });
      }
    }
  });

  return { questions, errors };
}

/**
 * Creates Excel template rows for teachers to fill in
 */
export function createExcelTemplateData() {
  return [
    {
      Nomor: 1,
      Jenis: 'pilihan_ganda',
      Pertanyaan: 'Manakah bagian tumbuhan yang berfungsi menyerap air dan mineral dari dalam tanah?',
      Opsi_A: 'Akar',
      Opsi_B: 'Batang',
      Opsi_C: 'Daun',
      Opsi_D: 'Bunga',
      Kunci_Jawaban: 'A',
      Bobot: 10,
      Pembahasan: 'Akar berfungsi menyerap air dan unsur hara dari dalam tanah serta menopang tumbuhan.',
    },
    {
      Nomor: 2,
      Jenis: 'pilihan_ganda',
      Pertanyaan: 'Hasil dari 45 + 38 adalah ...',
      Opsi_A: '73',
      Opsi_B: '83',
      Opsi_C: '85',
      Opsi_D: '93',
      Kunci_Jawaban: 'B',
      Bobot: 10,
      Pembahasan: '45 + 38 = 83.',
    },
    {
      Nomor: 3,
      Jenis: 'uraian',
      Pertanyaan: 'Jelaskan mengapa kita harus menjaga kebersihan lingkungan sekolah!',
      Opsi_A: '',
      Opsi_B: '',
      Opsi_C: '',
      Opsi_D: '',
      Kunci_Jawaban: 'Agar lingkungan sehat, terhindar dari penyakit, dan belajar menjadi nyaman.',
      Bobot: 20,
      Pembahasan: 'Siswa menyebutkan minimal 2 alasan: kesehatan/kebersihan dan kenyamanan belajar.',
    },
  ];
}
