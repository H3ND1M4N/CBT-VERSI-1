export type QuestionType = 'pilihan_ganda' | 'uraian';

export type KelasSD =
  | 'Kelas 1'
  | 'Kelas 2'
  | 'Kelas 3'
  | 'Kelas 4'
  | 'Kelas 5'
  | 'Kelas 6';

export type MataPelajaran =
  | 'Pendidikan Pancasila'
  | 'Bahasa Indonesia'
  | 'Matematika'
  | 'IPAS'
  | 'Pendidikan Agama'
  | 'Seni Budaya'
  | 'PJOK'
  | 'Bahasa Inggris';

export interface Question {
  id: string;
  jenis: QuestionType;
  pertanyaan: string;
  opsi?: string[]; // Hanya untuk pilihan ganda (3 opsi utk kelas 1-3, 4 opsi utk kelas 4-6)
  kunciJawaban: string; // Misal "A" untuk PG, atau teks panduan/contoh untuk uraian
  kataKunciPenilaian?: string[]; // Kata kunci esensial untuk penilaian uraian
  rubrikPenilaian?: string; // Panduan penskoran uraian (misal: "Sebutkan 3 contoh...")
  bobot: number; // Nilai skor maksimal (misal: 10, 20)
  penjelasan?: string; // Pembahasan/solusi
  gambarUrl?: string; // Opsional ilustrasi kontekstual
}

export interface ExamPackage {
  id: string;
  judul: string;
  deskripsi: string;
  kelas: KelasSD;
  mataPelajaran: MataPelajaran;
  durasiMenit: number;
  kkm: number; // Kriteria Ketercapaian Tujuan Pembelajaran (misal: 75)
  acakSoal: boolean;
  acakOpsi: boolean;
  tampilkanHasil: boolean; // Apakah siswa langsung melihat nilai setelah selesai
  token: string; // Token ujian masuk (misal: "PINTAR12")
  tanggalDibuat: string;
  totalBobot: number;
  soalList: Question[];
  ownerId?: string;
  isPublished?: boolean;
}

export interface StudentAnswerItem {
  jawaban: string; // Huruf "A", "B", etc. atau teks jawaban uraian
  ragu: boolean;
  skorDiberikan?: number; // Skor hasil penilaian
  feedbackGuru?: string; // Catatan guru atau umpan balik AI
  statusKesesuaian?: 'Sempurna' | 'Sebagian Tepat' | 'Perlu Peningkatan' | 'Tidak Relevan';
}

export interface StudentAttempt {
  id: string;
  examId: string;
  examOwnerId?: string;
  studentUid?: string;
  namaSiswa: string;
  nisn: string;
  kelas: KelasSD;
  nomorAbsen: string;
  waktuMulai: string;
  waktuSelesai?: string;
  jawaban: Record<string, StudentAnswerItem>;
  nilaiPG: number;
  nilaiUraian: number;
  nilaiAkhir: number; // Skala 0 - 100
  totalBobotDiperoleh: number;
  totalBobotMaksimal: number;
  status: 'mengerjakan' | 'selesai' | 'dinilai';
  statusKelulusan: 'Tuntas' | 'Perlu Remedial';
}

export interface AIGenerateRequest {
  kelas: KelasSD;
  mataPelajaran: MataPelajaran;
  topik: string;
  jumlahPG: number;
  jumlahUraian: number;
  tingkatKesulitan: 'Mudah' | 'Sedang' | 'Menantang (HOTS)';
  instruksiKhusus?: string;
  bobotPGBawaan: number;
  bobotUraianBawaan: number;
}
