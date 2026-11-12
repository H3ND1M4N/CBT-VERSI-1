/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from 'firebase/auth';
import { Navbar } from './components/Navbar';
import { ExamListTab } from './components/TeacherDashboard/ExamListTab';
import { ExamQuestionsManager } from './components/TeacherDashboard/ExamQuestionsManager';
import { GradingTab } from './components/TeacherDashboard/GradingTab';
import { AIGeneratorModal } from './components/TeacherDashboard/AIGeneratorModal';
import { FileImportModal } from './components/TeacherDashboard/FileImportModal';
import { StudentEntryModal } from './components/StudentExam/StudentEntryModal';
import { StudentExamView } from './components/StudentExam/StudentExamView';
import { ExamResultView } from './components/StudentExam/ExamResultView';
import { GuideTab } from './components/GuideTab';
import { LoginPortal } from './components/Auth/LoginPortal';
import { ExamPackage, Question, StudentAttempt, KelasSD, MataPelajaran } from './types/cbt';
import { auth, googleProvider } from './firebase';
import {
  clearAttemptsInCloud,
  createAttemptInCloud,
  deleteAttemptFromCloud,
  deleteExamFromCloud,
  saveExamToCloud,
  seedInitialDataIfNeeded,
  subscribeToAttempts,
  subscribeToExams,
  updateAttemptInCloud,
} from './services/cbtFirestore';
import { BookOpen, Award, Sparkles, GraduationCap, Loader2 } from 'lucide-react';

export default function App() {
  // Firebase Auth State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authRedirectError, setAuthRedirectError] = useState<string | null>(null);

  // User Role Selection State: 'guru' | 'siswa' | null (portal login)
  const [currentRole, setCurrentRole] = useState<'guru' | 'siswa' | null>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode === 'guru') return 'guru';
      if (mode === 'siswa') return 'siswa';
      const saved = localStorage.getItem('cbt_user_role');
      if (saved === 'guru' || saved === 'siswa') return saved;
      return null;
    } catch {
      return null;
    }
  });

  // Navigation State
  const [activeNav, setActiveNav] = useState<'guru' | 'siswa' | 'panduan'>('guru');
  const [teacherSubTab, setTeacherSubTab] = useState<'bank' | 'rekap'>('bank');

  // Real-time Cloud Firestore State
  const [exams, setExams] = useState<ExamPackage[]>([]);
  const [attempts, setAttempts] = useState<StudentAttempt[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);

  // Managing specific exam's questions by ID (always synced with latest snapshot)
  const [managingExamId, setManagingExamId] = useState<string | null>(null);
  const managingExam = managingExamId
    ? exams.find((e) => e.id === managingExamId) || null
    : null;

  // Modals state
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isFileImportOpen, setIsFileImportOpen] = useState(false);

  // Student testing session state
  const [studentSession, setStudentSession] = useState<{
    nama: string;
    nisn: string;
    kelas: string;
    nomorAbsen: string;
    exam: ExamPackage;
  } | null>(null);

  const [completedAttempt, setCompletedAttempt] = useState<StudentAttempt | null>(null);
  const [isStudentEntryModalOpen, setIsStudentEntryModalOpen] = useState(false);
  const [examToTestDirectly, setExamToTestDirectly] = useState<ExamPackage | null>(null);

  // Listen to Firebase Auth state & handle mobile redirect login result
  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          const pendingRole = localStorage.getItem('cbt_pending_role');
          if (pendingRole === 'guru' || pendingRole === 'siswa') {
            localStorage.removeItem('cbt_pending_role');
            setCurrentRole(pendingRole);
            if (pendingRole === 'guru') {
              setActiveNav('guru');
            } else {
              setActiveNav('siswa');
              setIsStudentEntryModalOpen(true);
            }
          }
        }
      })
      .catch((err: any) => {
        console.error('Redirect login error:', err);
        const code = err?.code || '';
        setAuthRedirectError(
          code
            ? `Login Google gagal (${code}). Jika Anda di HP, coba buka langsung melalui aplikasi Chrome atau Safari.`
            : 'Login Google gagal saat kembali dari halaman autentikasi.'
        );
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setAuthReady(true);
      if (user) {
        try {
          const pendingRole = localStorage.getItem('cbt_pending_role');
          if (pendingRole === 'guru' || pendingRole === 'siswa') {
            localStorage.removeItem('cbt_pending_role');
            setCurrentRole(pendingRole);
            if (pendingRole === 'guru') {
              setActiveNav('guru');
            } else {
              setActiveNav('siswa');
              setIsStudentEntryModalOpen(true);
            }
          }
        } catch {}
      } else {
        setExams([]);
        setAttempts([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Persist selected role locally
  useEffect(() => {
    try {
      if (currentRole) {
        localStorage.setItem('cbt_user_role', currentRole);
      } else {
        localStorage.removeItem('cbt_user_role');
      }
    } catch {}
  }, [currentRole]);

  // Handle URL query parameters for deep links
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const autoStartParam = params.get('autostart');

    if (modeParam === 'siswa' || autoStartParam === '1') {
      setCurrentRole('siswa');
      setActiveNav('siswa');
      setIsStudentEntryModalOpen(true);
    } else if (modeParam === 'guru') {
      setCurrentRole('guru');
      setActiveNav('guru');
    } else if (modeParam === 'panduan') {
      setActiveNav('panduan');
    }
  }, []);

  // Attach real-time Firestore listeners ONLY when authenticated
  useEffect(() => {
    if (!authReady || !firebaseUser) return;

    let unsubExams: (() => void) | undefined;
    let unsubAttempts: (() => void) | undefined;
    let active = true;

    const initRealtimeSync = async () => {
      setCloudLoading(true);
      try {
        await seedInitialDataIfNeeded(firebaseUser);
      } catch (err) {
        console.error('Seed check error:', err);
      }

      if (!active) return;

      unsubExams = subscribeToExams(
        firebaseUser,
        (syncedExams) => {
          setExams(syncedExams);
          setCloudLoading(false);
        },
        () => setCloudLoading(false)
      );

      unsubAttempts = subscribeToAttempts(
        firebaseUser,
        currentRole || 'guru',
        (syncedAttempts) => {
          setAttempts(syncedAttempts);
        }
      );
    };

    initRealtimeSync();

    return () => {
      active = false;
      if (unsubExams) unsubExams();
      if (unsubAttempts) unsubAttempts();
    };
  }, [authReady, firebaseUser, currentRole]);

  // Handlers for Role & Auth Portal (supports popup + mobile redirect fallback)
  const handleSelectRole = async (role: 'guru' | 'siswa', preferRedirect = false) => {
    setAuthRedirectError(null);
    if (!firebaseUser) {
      const inIframe = (() => {
        try {
          return window.self !== window.top;
        } catch {
          return true;
        }
      })();

      if (preferRedirect && !inIframe) {
        try {
          localStorage.setItem('cbt_pending_role', role);
        } catch {}
        await signInWithRedirect(auth, googleProvider);
        return;
      }

      try {
        await signInWithPopup(auth, googleProvider);
      } catch (err: any) {
        const code = err?.code || '';
        if (
          !inIframe &&
          (code === 'auth/popup-blocked' ||
            code === 'auth/operation-not-supported-in-this-environment')
        ) {
          try {
            localStorage.setItem('cbt_pending_role', role);
          } catch {}
          await signInWithRedirect(auth, googleProvider);
          return;
        }
        throw err;
      }
    }

    setCurrentRole(role);
    if (role === 'guru') {
      setActiveNav('guru');
    } else {
      setActiveNav('siswa');
      setIsStudentEntryModalOpen(true);
    }
  };

  const handleLogoutRole = () => {
    setCurrentRole(null);
    setIsStudentEntryModalOpen(false);
    setManagingExamId(null);
    setExamToTestDirectly(null);
  };

  const handleGoogleSignOut = async () => {
    await signOut(auth);
    handleLogoutRole();
  };

  // Handler: Add or update exam in Cloud Firestore
  const handleSaveExam = async (newExam: ExamPackage) => {
    if (!firebaseUser) return;
    const isExisting = exams.some((e) => e.id === newExam.id);
    // Optimistic update for snappy UI while Firestore syncs
    setExams((prev) => {
      if (isExisting) {
        return prev.map((e) => (e.id === newExam.id ? newExam : e));
      }
      return [newExam, ...prev];
    });

    try {
      await saveExamToCloud(newExam, firebaseUser, isExisting);
    } catch (err) {
      console.error('Failed to save exam to Firestore:', err);
    }
  };

  // Handler: Delete exam from Cloud Firestore
  const handleDeleteExam = async (examId: string) => {
    setExams((prev) => prev.filter((e) => e.id !== examId));
    if (managingExamId === examId) {
      setManagingExamId(null);
    }
    try {
      await deleteExamFromCloud(examId);
    } catch (err) {
      console.error('Failed to delete exam from Firestore:', err);
    }
  };

  // Handler: Import questions from Excel / Word
  const handleImportQuestions = async (
    importedQuestions: Question[],
    packageMeta?: { judul: string; kelas: KelasSD; mataPelajaran: MataPelajaran }
  ) => {
    if (!firebaseUser) return;

    if (packageMeta) {
      const totalBobot = importedQuestions.reduce((acc, q) => acc + (q.bobot || 10), 0);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const token = `${packageMeta.mataPelajaran.substring(0, 3).toUpperCase()}${randomSuffix}`;

      const newExam: ExamPackage = {
        id: `exam-imported-${Date.now()}`,
        judul: packageMeta.judul,
        deskripsi: `Paket soal ${packageMeta.mataPelajaran} ${packageMeta.kelas}.`,
        kelas: packageMeta.kelas,
        mataPelajaran: packageMeta.mataPelajaran,
        durasiMenit: Math.max(25, importedQuestions.length * 3),
        kkm: 75,
        acakSoal: false,
        acakOpsi: false,
        tampilkanHasil: true,
        token,
        tanggalDibuat: new Date().toISOString().split('T')[0],
        totalBobot,
        soalList: importedQuestions,
        ownerId: firebaseUser.uid,
        isPublished: true,
      };

      await handleSaveExam(newExam);
      setManagingExamId(newExam.id);
    } else if (managingExam) {
      const updatedList = [...managingExam.soalList, ...importedQuestions];
      const updatedTotal = updatedList.reduce((acc, q) => acc + (q.bobot || 10), 0);
      const updatedExam: ExamPackage = {
        ...managingExam,
        soalList: updatedList,
        totalBobot: updatedTotal,
      };
      await handleSaveExam(updatedExam);
    }
  };

  // Handler: Start test from Teacher Exam List card
  const handleStartStudentTest = (exam: ExamPackage) => {
    setExamToTestDirectly(exam);
    setIsStudentEntryModalOpen(true);
  };

  // Handler: Student finishes exam -> save to Cloud Firestore
  const handleStudentSubmitExam = async (attempt: StudentAttempt) => {
    setAttempts((prev) => [attempt, ...prev]);
    const submittedExam = studentSession?.exam;
    setStudentSession(null);
    setCompletedAttempt(attempt);

    if (firebaseUser && submittedExam) {
      try {
        await createAttemptInCloud(attempt, submittedExam, firebaseUser);
      } catch (err) {
        console.error('Failed to save attempt to Firestore:', err);
      }
    }
  };

  // Handler: Update attempt from teacher grading
  const handleUpdateAttempt = async (updated: StudentAttempt) => {
    setAttempts((prev) => prev.map((att) => (att.id === updated.id ? updated : att)));
    try {
      await updateAttemptInCloud(updated);
    } catch (err) {
      console.error('Failed to update attempt grade in Firestore:', err);
    }
  };

  // Handler: Delete single student attempt from grading
  const handleDeleteAttempt = async (attemptId: string) => {
    setAttempts((prev) => prev.filter((att) => att.id !== attemptId));
    try {
      await deleteAttemptFromCloud(attemptId);
    } catch (err) {
      console.error('Failed to delete attempt from Firestore:', err);
    }
  };

  // Handler: Clear all student attempts
  const handleClearAllAttempts = async () => {
    const idsToDelete = attempts.map((a) => a.id);
    setAttempts([]);
    try {
      await clearAttemptsInCloud(idsToDelete);
    } catch (err) {
      console.error('Failed to clear attempts from Firestore:', err);
    }
  };

  // Show boot splash while auth state initializes
  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs font-semibold text-slate-500">
          Memuat CBT SDN GUNUNGSARI 04...
        </p>
      </div>
    );
  }

  // If in active student testing mode
  if (studentSession) {
    return (
      <StudentExamView
        exam={studentSession.exam}
        studentData={studentSession}
        onSubmitExam={handleStudentSubmitExam}
        onExitExam={() => setStudentSession(null)}
      />
    );
  }

  // If viewing exam completion celebration
  if (completedAttempt) {
    const matchedExam =
      exams.find((e) => e.id === completedAttempt.examId) || exams[0];
    if (matchedExam) {
      return (
        <ExamResultView
          attempt={completedAttempt}
          exam={matchedExam}
          onBackToHome={() => {
            setCompletedAttempt(null);
            if (currentRole === 'siswa') {
              setActiveNav('siswa');
              setIsStudentEntryModalOpen(true);
            } else {
              setActiveNav('guru');
            }
          }}
          onRetakeExam={() => {
            setCompletedAttempt(null);
            handleStartStudentTest(matchedExam);
          }}
        />
      );
    }
  }

  // If not authenticated or no role selected yet, show Login Portal
  if (!firebaseUser || !currentRole) {
    return (
      <LoginPortal
        onSelectRole={handleSelectRole}
        firebaseUser={firebaseUser}
        authReady={authReady}
        onGoogleSignOut={handleGoogleSignOut}
        initialError={authRedirectError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar
        activeView={activeNav}
        onViewChange={(view) => {
          setActiveNav(view);
          if (view === 'siswa') {
            setIsStudentEntryModalOpen(true);
          }
        }}
        examCount={exams.length}
        currentRole={currentRole}
        onLogout={handleLogoutRole}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {cloudLoading && exams.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-500">
              Menyinkronkan bank soal dari cloud...
            </p>
          </div>
        ) : (
          <>
            {/* VIEW: Mode Guru (Teacher Studio) */}
            {activeNav === 'guru' && (
              <div className="space-y-6">
                {!managingExam ? (
                  <>
                    {/* Sub-tab navigation (Bank Soal vs Rekapitulasi Nilai) */}
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
                      <button
                        onClick={() => setTeacherSubTab('bank')}
                        className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                          teacherSubTab === 'bank'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Bank Soal & Asesmen ({exams.length})</span>
                      </button>

                      <button
                        onClick={() => setTeacherSubTab('rekap')}
                        className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center gap-2 ${
                          teacherSubTab === 'rekap'
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <Award className="w-4 h-4 text-emerald-500" />
                        <span>Penilaian & Rekap Nilai ({attempts.length})</span>
                      </button>
                    </div>

                    {teacherSubTab === 'bank' ? (
                      <ExamListTab
                        exams={exams}
                        onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
                        onOpenFileImport={() => setIsFileImportOpen(true)}
                        onOpenManualCreate={async () => {
                          const newId = `exam-manual-${Date.now()}`;
                          const freshExam: ExamPackage = {
                            id: newId,
                            judul: 'Paket Asesmen Baru',
                            deskripsi: 'Asesmen harian SDN GUNUNGSARI 04.',
                            kelas: 'Kelas 4',
                            mataPelajaran: 'IPAS',
                            durasiMenit: 30,
                            kkm: 75,
                            acakSoal: false,
                            acakOpsi: false,
                            tampilkanHasil: true,
                            token: `SD${Math.floor(100 + Math.random() * 900)}`,
                            tanggalDibuat: new Date().toISOString().split('T')[0],
                            totalBobot: 0,
                            soalList: [],
                            ownerId: firebaseUser.uid,
                            isPublished: true,
                          };
                          await handleSaveExam(freshExam);
                          setManagingExamId(freshExam.id);
                        }}
                        onEditExamQuestions={(ex) => setManagingExamId(ex.id)}
                        onDeleteExam={handleDeleteExam}
                        onStartStudentTest={handleStartStudentTest}
                      />
                    ) : (
                      <GradingTab
                        exams={exams}
                        attempts={attempts}
                        onUpdateAttempt={handleUpdateAttempt}
                        onDeleteAttempt={handleDeleteAttempt}
                        onClearAllAttempts={handleClearAllAttempts}
                      />
                    )}
                  </>
                ) : (
                  /* Specific Exam's Question Manager */
                  <ExamQuestionsManager
                    exam={managingExam}
                    onBack={() => setManagingExamId(null)}
                    onUpdateExam={handleSaveExam}
                    onOpenAIGenerator={() => setIsAIGeneratorOpen(true)}
                  />
                )}
              </div>
            )}

            {/* VIEW: Mode Siswa Landing (when modal closed) */}
            {activeNav === 'siswa' && (
              <div className="max-w-md mx-auto py-12 text-center space-y-5">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-2xl mx-auto flex items-center justify-center shadow-sm">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-slate-900">
                    Ruang Ujian Siswa
                  </h1>
                  <p className="text-xs text-slate-500">
                    Masukkan token ujian untuk mulai mengerjakan soal.
                  </p>
                </div>
                <button
                  onClick={() => setIsStudentEntryModalOpen(true)}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-sm transition-all inline-flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-200" />
                  <span>Buka Formulir Masuk</span>
                </button>
              </div>
            )}

            {/* VIEW: Panduan Praktis */}
            {activeNav === 'panduan' && <GuideTab />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3.5 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
          <span>CBT SDN GUNUNGSARI 04 · SD Kelas 1–6</span>
          <span className="text-slate-400">AI · Excel · Word</span>
        </div>
      </footer>

      {/* AI Generator Modal */}
      <AIGeneratorModal
        isOpen={isAIGeneratorOpen}
        onClose={() => setIsAIGeneratorOpen(false)}
        onSaveExam={async (newExam) => {
          await handleSaveExam({
            ...newExam,
            ownerId: firebaseUser.uid,
            isPublished: true,
          });
          setManagingExamId(newExam.id);
        }}
      />

      {/* File Import Modal */}
      <FileImportModal
        isOpen={isFileImportOpen}
        onClose={() => setIsFileImportOpen(false)}
        onImportQuestions={handleImportQuestions}
        existingExams={exams}
      />

      {/* Student Entry Modal */}
      {isStudentEntryModalOpen && (
        <StudentEntryModal
          exams={exams}
          preselectedExam={examToTestDirectly}
          onStartExam={(session) => {
            setStudentSession(session);
            setIsStudentEntryModalOpen(false);
            setExamToTestDirectly(null);
          }}
          onCancel={() => {
            setIsStudentEntryModalOpen(false);
            setExamToTestDirectly(null);
          }}
        />
      )}
    </div>
  );
}
