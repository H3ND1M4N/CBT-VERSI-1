import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Helper to get GoogleGenAI client
function getGenAIClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in environment variables');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Endpoint to generate questions for SD Kelas 1-6
app.post('/api/gemini/generate-questions', async (req, res) => {
  try {
    const {
      kelas = 'Kelas 4',
      mataPelajaran = 'IPAS',
      topik = 'Siklus Air dan Cuaca',
      jumlahPG = 5,
      jumlahUraian = 2,
      tingkatKesulitan = 'Sedang', // Mudah, Sedang, Menantang
      instruksiKhusus = '',
      bobotPGBawaan = 10,
      bobotUraianBawaan = 25,
    } = req.body;

    const ai = getGenAIClient();

    const prompt = `Bertindaklah sebagai Pakar Kurikulum & Praktisi Pendidikan Sekolah Dasar (SD) Indonesia (Kurikulum Merdeka).
Buatkan paket soal ujian Computer-Based Testing (CBT) yang berkualitas, ramah anak, dan mendidik dengan rincian berikut:
- Sasaran: ${kelas} SD (Perhatikan usia psikologis dan tingkat kosa kata anak)
- Mata Pelajaran: ${mataPelajaran}
- Topik / Materi: ${topik}
- Tingkat Kesulitan: ${tingkatKesulitan}
- Format Soal:
  * ${jumlahPG} butir Soal Pilihan Ganda (PG)
    (Catatan untuk Kelas 1, 2, 3 SD: Opsi pilihan jawaban cukup 3 pilihan yaitu A, B, C agar tidak membebani kognitif anak. Untuk Kelas 4, 5, 6 SD: 4 pilihan yaitu A, B, C, D).
  * ${jumlahUraian} butir Soal Uraian / Isian Singkat
- Bobot Nilai Standar: PG masing-masing ${bobotPGBawaan} poin, Uraian masing-masing ${bobotUraianBawaan} poin.
- Instruksi Tambahan: ${instruksiKhusus || 'Sajikan soal dengan stimulus cerita/kontekstual kehidupan sehari-hari anak Indonesia, bahasa santun, jelas, dan tidak ambigu.'}

Kembalikan jawaban berupa JSON terstruktur persis dengan schema:
- judulPaket: string
- deskripsi: string
- kelas: string
- mataPelajaran: string
- topik: string
- totalBobot: number
- soalList: array objek soal dengan field:
  * id: string unik (misal: "q-1", "q-2")
  * jenis: "pilihan_ganda" | "uraian"
  * pertanyaan: string (jelas dan komunikatif untuk anak SD)
  * opsi: array string (hanya untuk pilihan_ganda, misal ["A. Evaporasi", "B. Kondensasi", "C. Presipitasi", "D. Transpirasi"])
  * kunciJawaban: string (huruf kunci untuk PG misal "A", atau contoh jawaban lengkap untuk uraian)
  * kataKunciPenilaian: array string (untuk uraian, kata kunci esensial untuk penilaian otomatis/manual)
  * rubrikPenilaian: string (panduan penskoran uraian)
  * bobot: number (skor maksimal untuk soal ini)
  * penjelasan: string (pembahasan singkat yang mendidik)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Kamu adalah pakar evaluasi pembelajaran SD di Indonesia. Selalu berikan output format JSON valid sesuai skema yang diminta, tidak ada markdown pembungkus di luar JSON.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            judulPaket: { type: Type.STRING },
            deskripsi: { type: Type.STRING },
            kelas: { type: Type.STRING },
            mataPelajaran: { type: Type.STRING },
            topik: { type: Type.STRING },
            totalBobot: { type: Type.NUMBER },
            soalList: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  jenis: { type: Type.STRING, description: 'pilihan_ganda atau uraian' },
                  pertanyaan: { type: Type.STRING },
                  opsi: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  kunciJawaban: { type: Type.STRING },
                  kataKunciPenilaian: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  rubrikPenilaian: { type: Type.STRING },
                  bobot: { type: Type.NUMBER },
                  penjelasan: { type: Type.STRING },
                },
                required: ['id', 'jenis', 'pertanyaan', 'kunciJawaban', 'bobot'],
              },
            },
          },
          required: ['judulPaket', 'kelas', 'mataPelajaran', 'soalList'],
        },
      },
    });

    const parsedData = JSON.parse(response.text ?? '{}');
    return res.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('Error generating questions with Gemini:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal membuat soal dengan AI',
    });
  }
});

// Endpoint to assist teacher in grading an essay answer
app.post('/api/gemini/assist-grade', async (req, res) => {
  try {
    const { pertanyaan, kunciJawaban, rubrikPenilaian, kataKunciPenilaian, jawabanSiswa, bobotMaksimal } = req.body;

    const ai = getGenAIClient();

    const prompt = `Bertindaklah sebagai Asisten Penilai Guru SD yang objektif, teliti, dan mengapresiasi usaha siswa.
Evaluasilah jawaban uraian siswa Sekolah Dasar berikut:

Pertanyaan: "${pertanyaan}"
Kunci Jawaban Referensi: "${kunciJawaban}"
Rubrik Penskoran: "${rubrikPenilaian || 'Kesesuaian konsep dengan kata kunci utama'}"
Kata Kunci yang diharapkan: ${JSON.stringify(kataKunciPenilaian || [])}
Bobot Maksimal: ${bobotMaksimal || 20}
Jawaban Siswa: "${jawabanSiswa || '(Kosong / tidak dijawab)'}"

Berikan penilaian objektif dalam format JSON:
- skorDisarankan: number (antara 0 sampai ${bobotMaksimal})
- statusKesesuaian: "Sempurna" | "Sebagian Tepat" | "Perlu Peningkatan" | "Tidak Relevan"
- kataKunciDitemukan: array string kata kunci yang ada dalam jawaban siswa
- kataKunciBelumAda: array string kata kunci yang luput
- alasanPenskoran: string (penjelasan singkat mengapa nilai ini diberikan)
- umpanBalikPenyemangat: string (kalimat apresiasi dan motivasi yang ramah dan suportif untuk anak SD)`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            skorDisarankan: { type: Type.NUMBER },
            statusKesesuaian: { type: Type.STRING },
            kataKunciDitemukan: { type: Type.ARRAY, items: { type: Type.STRING } },
            kataKunciBelumAda: { type: Type.ARRAY, items: { type: Type.STRING } },
            alasanPenskoran: { type: Type.STRING },
            umpanBalikPenyemangat: { type: Type.STRING },
          },
          required: ['skorDisarankan', 'statusKesesuaian', 'alasanPenskoran', 'umpanBalikPenyemangat'],
        },
      },
    });

    const assessment = JSON.parse(response.text ?? '{}');
    return res.json({ success: true, data: assessment });
  } catch (error: any) {
    console.error('Error assisting grading with Gemini:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Gagal mengevaluasi jawaban dengan AI',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

startServer();
