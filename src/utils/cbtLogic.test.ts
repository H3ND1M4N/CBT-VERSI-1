import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeOptionKey,
  calculateExamScores,
  parseWordQuestionText,
  parseExcelRowsToQuestions,
} from './cbtLogic';
import { ExamPackage, Question } from '../types/cbt';

test('normalizeOptionKey correctly extracts option letters', () => {
  assert.equal(normalizeOptionKey('A'), 'A');
  assert.equal(normalizeOptionKey('a'), 'A');
  assert.equal(normalizeOptionKey('B. Fotosintesis'), 'B');
  assert.equal(normalizeOptionKey('c) Jawaban Benar'), 'C');
  assert.equal(normalizeOptionKey(''), '');
});

test('calculateExamScores calculates multiple choice and essay scores with correct passing status', () => {
  const dummyQuestions: Question[] = [
    {
      id: 'q1',
      jenis: 'pilihan_ganda',
      pertanyaan: 'Ibu kota Indonesia adalah...',
      opsi: ['A. Surabaya', 'B. Jakarta', 'C. Bandung'],
      kunciJawaban: 'B',
      bobot: 20,
    },
    {
      id: 'q2',
      jenis: 'pilihan_ganda',
      pertanyaan: '2 x 3 = ...',
      opsi: ['A. 5', 'B. 6', 'C. 7'],
      kunciJawaban: 'B',
      bobot: 30,
    },
    {
      id: 'q3',
      jenis: 'uraian',
      pertanyaan: 'Sebutkan contoh benda padat!',
      kunciJawaban: 'Batu, kayu, meja',
      bobot: 50,
      rubrikPenilaian: 'Menyebutkan minimal 2 benda padat',
    },
  ];

  const dummyExam: ExamPackage = {
    id: 'exam-1',
    judul: 'Ujian Uji Coba',
    deskripsi: 'Deskripsi',
    kelas: 'Kelas 3',
    mataPelajaran: 'IPAS',
    durasiMenit: 30,
    kkm: 70,
    acakSoal: false,
    acakOpsi: false,
    tampilkanHasil: true,
    token: 'TEST12',
    tanggalDibuat: '2026-05-01',
    totalBobot: 100,
    soalList: dummyQuestions,
  };

  // Case 1: Student gets q1 right (20), q2 wrong (0), q3 graded 40/50 -> Total 60/100 -> Perlu Remedial (<70)
  const result1 = calculateExamScores(dummyExam, {
    q1: { jawaban: 'B', ragu: false },
    q2: { jawaban: 'A', ragu: false },
    q3: { jawaban: 'Batu dan meja', ragu: false, skorDiberikan: 40 },
  });

  assert.equal(result1.nilaiPG, 20);
  assert.equal(result1.nilaiUraian, 40);
  assert.equal(result1.totalBobotDiperoleh, 60);
  assert.equal(result1.totalBobotMaksimal, 100);
  assert.equal(result1.nilaiAkhir, 60);
  assert.equal(result1.statusKelulusan, 'Perlu Remedial');
  assert.equal(result1.isAllGraded, true);

  // Case 2: Student gets both PG right (50) and q3 30/50 -> Total 80/100 -> Tuntas (>=70)
  const result2 = calculateExamScores(dummyExam, {
    q1: { jawaban: 'B', ragu: false },
    q2: { jawaban: 'B', ragu: false },
    q3: { jawaban: 'Batu dan kayu', ragu: false, skorDiberikan: 30 },
  });

  assert.equal(result2.nilaiPG, 50);
  assert.equal(result2.nilaiUraian, 30);
  assert.equal(result2.nilaiAkhir, 80);
  assert.equal(result2.statusKelulusan, 'Tuntas');
});

test('parseWordQuestionText parses numbered questions, options, keys, and weights', () => {
  const sampleDocText = `
1. Lambang sila pertama Pancasila adalah ...
A. Bintang
B. Rantai
C. Pohon Beringin
D. Kepala Banteng
Kunci: A
Bobot: 10
Pembahasan: Bintang melambangkan Ketuhanan Yang Maha Esa.

2. Sebutkan sila kedua Pancasila!
Kunci: Kemanusiaan yang adil dan beradab
Bobot: 20
Rubrik: Menuliskan teks sila kedua dengan benar
`;

  const parsed = parseWordQuestionText(sampleDocText, 'Kelas 4');
  assert.equal(parsed.length, 2);

  assert.equal(parsed[0].jenis, 'pilihan_ganda');
  assert.ok(parsed[0].pertanyaan.includes('Lambang sila pertama'));
  assert.equal(parsed[0].opsi?.length, 4);
  assert.equal(parsed[0].kunciJawaban, 'A');
  assert.equal(parsed[0].bobot, 10);

  assert.equal(parsed[1].jenis, 'uraian');
  assert.ok(parsed[1].pertanyaan.includes('Sebutkan sila kedua'));
  assert.equal(parsed[1].kunciJawaban, 'Kemanusiaan yang adil dan beradab');
  assert.equal(parsed[1].bobot, 20);
});

test('parseExcelRowsToQuestions parses spreadsheet rows into structured questions', () => {
  const excelRows = [
    {
      Nomor: 1,
      Jenis: 'pilihan_ganda',
      Pertanyaan: 'Berapakah 10 + 15?',
      Opsi_A: '20',
      Opsi_B: '25',
      Opsi_C: '30',
      Kunci_Jawaban: 'B',
      Bobot: 15,
    },
    {
      Nomor: 2,
      Jenis: 'uraian',
      Pertanyaan: 'Tuliskan nama lengkap sekolahmu!',
      Kunci_Jawaban: 'SD Negeri 01 Pintar',
      Bobot: 25,
      Pembahasan: 'Kesesuaian nama sekolah',
    },
  ];

  const { questions, errors } = parseExcelRowsToQuestions(excelRows);
  assert.equal(errors.length, 0);
  assert.equal(questions.length, 2);
  assert.equal(questions[0].jenis, 'pilihan_ganda');
  assert.equal(questions[0].bobot, 15);
  assert.equal(questions[0].kunciJawaban, 'B');
  assert.equal(questions[1].jenis, 'uraian');
  assert.equal(questions[1].bobot, 25);
});
