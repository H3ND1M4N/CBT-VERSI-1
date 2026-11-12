import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db, handleFirestoreError, isAdminEmail, OperationType } from '../firebase';
import { ExamPackage, StudentAttempt } from '../types/cbt';
import { INITIAL_ATTEMPTS, INITIAL_EXAMS } from '../data/sampleExams';

// Recursively remove undefined fields so Firestore serialization never fails
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        cleaned[k] = stripUndefined(v);
      }
    }
    return cleaned as T;
  }
  return value;
}

// Sanitize and enforce blueprint volumetric boundaries before writing ExamPackage
function sanitizeExamPayload(exam: ExamPackage, ownerId: string) {
  const safeId = (exam.id || `exam-${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
  const safeJudul = (exam.judul || 'Paket Ujian').trim().slice(0, 200);
  const safeDeskripsi = (exam.deskripsi || '').trim().slice(0, 1000);
  const safeMapel = (exam.mataPelajaran || 'IPAS').trim().slice(0, 80);
  const safeToken = (exam.token || 'CBT04').trim().toUpperCase().slice(0, 30);
  const safeTanggal = (exam.tanggalDibuat || new Date().toISOString().split('T')[0]).slice(0, 30);
  const safeSoalList = stripUndefined((exam.soalList || []).slice(0, 100));

  return {
    id: safeId,
    judul: safeJudul,
    deskripsi: safeDeskripsi,
    kelas: exam.kelas,
    mataPelajaran: safeMapel,
    durasiMenit: Math.max(1, Math.min(300, Number(exam.durasiMenit) || 30)),
    kkm: Math.max(0, Math.min(100, Number(exam.kkm) || 75)),
    acakSoal: Boolean(exam.acakSoal),
    acakOpsi: Boolean(exam.acakOpsi),
    tampilkanHasil: exam.tampilkanHasil !== false,
    token: safeToken,
    tanggalDibuat: safeTanggal,
    totalBobot: Math.max(0, Math.min(10000, Number(exam.totalBobot) || 0)),
    soalList: safeSoalList,
    ownerId,
    isPublished: exam.isPublished !== false,
  };
}

// Sanitize and enforce blueprint volumetric boundaries before writing StudentAttempt
function sanitizeAttemptPayload(
  attempt: StudentAttempt,
  examOwnerId: string,
  studentUid: string
) {
  const safeId = (attempt.id || `att-${Date.now()}`).replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);
  const safeExamId = (attempt.examId || '').replace(/[^a-zA-Z0-9_\-]/g, '-').slice(0, 128);

  return {
    id: safeId,
    examId: safeExamId,
    examOwnerId,
    studentUid,
    namaSiswa: (attempt.namaSiswa || 'Siswa').trim().slice(0, 120),
    nisn: (attempt.nisn || '-').trim().slice(0, 40),
    kelas: attempt.kelas,
    nomorAbsen: (attempt.nomorAbsen || '01').trim().slice(0, 20),
    waktuMulai: (attempt.waktuMulai || '').slice(0, 40),
    waktuSelesai: (attempt.waktuSelesai || attempt.waktuMulai || '').slice(0, 40),
    jawaban: stripUndefined(attempt.jawaban || {}),
    nilaiPG: Math.max(0, Number(attempt.nilaiPG) || 0),
    nilaiUraian: Math.max(0, Number(attempt.nilaiUraian) || 0),
    nilaiAkhir: Math.max(0, Math.min(100, Number(attempt.nilaiAkhir) || 0)),
    totalBobotDiperoleh: Math.max(0, Number(attempt.totalBobotDiperoleh) || 0),
    totalBobotMaksimal: Math.max(0, Number(attempt.totalBobotMaksimal) || 0),
    status: attempt.status,
    statusKelulusan: attempt.statusKelulusan,
  };
}

// Seed initial sample exams & attempts ONCE into Firestore (never re-seeds after deletion)
export async function seedInitialDataIfNeeded(user: User): Promise<void> {
  const seedRef = doc(db, 'schoolMeta', 'seed');
  let seedSnap;
  try {
    seedSnap = await getDoc(seedRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'schoolMeta/seed');
  }

  if (seedSnap.exists()) {
    return;
  }

  // Also check if exams already exist so we don't overwrite anything
  let existingExamsSnap;
  try {
    const q = isAdminEmail(user.email)
      ? collection(db, 'exams')
      : query(collection(db, 'exams'), where('isPublished', '==', true));
    existingExamsSnap = await getDocs(q);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, 'exams');
  }

  const batch = writeBatch(db);

  if (existingExamsSnap.empty) {
    for (const exam of INITIAL_EXAMS) {
      const payload = sanitizeExamPayload(exam, user.uid);
      batch.set(doc(db, 'exams', payload.id), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    for (const att of INITIAL_ATTEMPTS) {
      const payload = sanitizeAttemptPayload(att, user.uid, user.uid);
      batch.set(doc(db, 'attempts', payload.id), {
        ...payload,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  }

  batch.set(seedRef, {
    initialized: true,
    initializedBy: user.uid,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'schoolMeta/seed');
  }
}

// Subscribe to Exams collection in real time
export function subscribeToExams(
  user: User,
  onData: (exams: ExamPackage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const examsQuery = isAdminEmail(user.email)
    ? collection(db, 'exams')
    : query(collection(db, 'exams'), where('isPublished', '==', true));

  return onSnapshot(
    examsQuery,
    (snapshot) => {
      const list: ExamPackage[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: d.id || docSnap.id,
          judul: d.judul,
          deskripsi: d.deskripsi || '',
          kelas: d.kelas,
          mataPelajaran: d.mataPelajaran,
          durasiMenit: d.durasiMenit,
          kkm: d.kkm,
          acakSoal: Boolean(d.acakSoal),
          acakOpsi: Boolean(d.acakOpsi),
          tampilkanHasil: d.tampilkanHasil !== false,
          token: d.token,
          tanggalDibuat: d.tanggalDibuat,
          totalBobot: d.totalBobot,
          soalList: Array.isArray(d.soalList) ? d.soalList : [],
          ownerId: d.ownerId,
          isPublished: d.isPublished !== false,
        } as ExamPackage;
      });

      // Sort newest first by tanggalDibuat / id
      list.sort((a, b) => (b.tanggalDibuat || '').localeCompare(a.tanggalDibuat || ''));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'exams');
      } catch {}
    }
  );
}

// Subscribe to Student Attempts collection in real time
export function subscribeToAttempts(
  user: User,
  role: 'guru' | 'siswa',
  onData: (attempts: StudentAttempt[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const attemptsQuery = isAdminEmail(user.email)
    ? collection(db, 'attempts')
    : role === 'guru'
    ? query(collection(db, 'attempts'), where('examOwnerId', '==', user.uid))
    : query(collection(db, 'attempts'), where('studentUid', '==', user.uid));

  return onSnapshot(
    attemptsQuery,
    (snapshot) => {
      const list: StudentAttempt[] = snapshot.docs.map((docSnap) => {
        const d = docSnap.data();
        return {
          id: d.id || docSnap.id,
          examId: d.examId,
          examOwnerId: d.examOwnerId,
          studentUid: d.studentUid,
          namaSiswa: d.namaSiswa,
          nisn: d.nisn,
          kelas: d.kelas,
          nomorAbsen: d.nomorAbsen,
          waktuMulai: d.waktuMulai,
          waktuSelesai: d.waktuSelesai,
          jawaban: d.jawaban || {},
          nilaiPG: d.nilaiPG ?? 0,
          nilaiUraian: d.nilaiUraian ?? 0,
          nilaiAkhir: d.nilaiAkhir ?? 0,
          totalBobotDiperoleh: d.totalBobotDiperoleh ?? 0,
          totalBobotMaksimal: d.totalBobotMaksimal ?? 0,
          status: d.status || 'selesai',
          statusKelulusan: d.statusKelulusan || 'Perlu Remedial',
        } as StudentAttempt;
      });

      // Sort newest attempts first
      list.sort((a, b) => (b.waktuMulai || '').localeCompare(a.waktuMulai || ''));
      onData(list);
    },
    (error) => {
      if (onError) onError(error);
      try {
        handleFirestoreError(error, OperationType.LIST, 'attempts');
      } catch {}
    }
  );
}

// Save (create or update) an Exam Package to Cloud Firestore
export async function saveExamToCloud(
  exam: ExamPackage,
  user: User,
  isExisting: boolean
): Promise<void> {
  const payload = sanitizeExamPayload(exam, exam.ownerId || user.uid);
  const examRef = doc(db, 'exams', payload.id);

  if (isExisting) {
    try {
      await updateDoc(examRef, {
        judul: payload.judul,
        deskripsi: payload.deskripsi,
        kelas: payload.kelas,
        mataPelajaran: payload.mataPelajaran,
        durasiMenit: payload.durasiMenit,
        kkm: payload.kkm,
        acakSoal: payload.acakSoal,
        acakOpsi: payload.acakOpsi,
        tampilkanHasil: payload.tampilkanHasil,
        token: payload.token,
        tanggalDibuat: payload.tanggalDibuat,
        totalBobot: payload.totalBobot,
        soalList: payload.soalList,
        isPublished: payload.isPublished,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `exams/${payload.id}`);
    }
  } else {
    try {
      await setDoc(examRef, {
        ...payload,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `exams/${payload.id}`);
    }
  }
}

// Delete an Exam Package from Cloud Firestore
export async function deleteExamFromCloud(examId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'exams', examId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `exams/${examId}`);
  }
}

// Create a new Student Attempt in Cloud Firestore
export async function createAttemptInCloud(
  attempt: StudentAttempt,
  exam: ExamPackage,
  studentUser: User
): Promise<void> {
  const examOwnerId = exam.ownerId || studentUser.uid;
  const payload = sanitizeAttemptPayload(attempt, examOwnerId, studentUser.uid);

  try {
    await setDoc(doc(db, 'attempts', payload.id), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `attempts/${payload.id}`);
  }
}

// Update graded Student Attempt in Cloud Firestore
export async function updateAttemptInCloud(attempt: StudentAttempt): Promise<void> {
  try {
    await updateDoc(doc(db, 'attempts', attempt.id), {
      jawaban: stripUndefined(attempt.jawaban || {}),
      nilaiPG: Math.max(0, Number(attempt.nilaiPG) || 0),
      nilaiUraian: Math.max(0, Number(attempt.nilaiUraian) || 0),
      nilaiAkhir: Math.max(0, Math.min(100, Number(attempt.nilaiAkhir) || 0)),
      totalBobotDiperoleh: Math.max(0, Number(attempt.totalBobotDiperoleh) || 0),
      status: attempt.status,
      statusKelulusan: attempt.statusKelulusan,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `attempts/${attempt.id}`);
  }
}

// Delete a single Student Attempt from Cloud Firestore
export async function deleteAttemptFromCloud(attemptId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, 'attempts', attemptId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `attempts/${attemptId}`);
  }
}

// Clear all visible Student Attempts from Cloud Firestore
export async function clearAttemptsInCloud(attemptIds: string[]): Promise<void> {
  if (attemptIds.length === 0) return;
  const batch = writeBatch(db);
  for (const id of attemptIds) {
    batch.delete(doc(db, 'attempts', id));
  }
  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'attempts/*');
  }
}
