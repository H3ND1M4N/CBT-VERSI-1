/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ExamListTab } from './components/TeacherDashboard/ExamListTab';
import { ExamQuestionsManager } from './components/TeacherDashboard/ExamQuestionsManager';
import { GradingTab } from './components/TeacherDashboard/GradingTab';
import { AIGeneratorModal } from './components/TeacherDashboard/AIGeneratorModal';
import { FileImportModal } from './components/TeacherDashboard/FileImportModal';
import { QuestionEditorModal } from './components/TeacherDashboard/QuestionEditorModal';
import { StudentEntryModal } from './components/StudentExam/StudentEntryModal';
import { StudentExamView } from './components/StudentExam/StudentExamView';
import { ExamResultView } from './components/StudentExam/ExamResultView';
import { GuideTab } from './components/GuideTab';
import { LoginPortal } from './components/Auth/LoginPortal';
import { INITIAL_EXAMS, INITIAL_ATTEMPTS } from './data/sampleExams';
import { ExamPackage, Question, StudentAttempt, KelasSD, MataPelajaran } from './types/cbt';
import { BookOpen, Award, Sparkles, Plus, GraduationCap } from 'lucide-react';

export default function App() {
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

  // Persistence State
  const [exams, setExams] = useState<ExamPackage[]>(() => {
    try {
      const saved = localStorage.getItem('cbt_exams_data');
      return saved ? JSON.parse(saved) : INITIAL_EXAMS;
    } catch {
      return INITIAL_EXAMS;
    }
  });

  const [attempts, setAttempts] = useState<StudentAttempt[]>(() => {
    try {
      const saved = localStorage.getItem('cbt_attempts_data');
      return saved ? JSON.parse(saved) : INITIAL_ATTEMPTS;
    } catch {
      return INITIAL_ATTEMPTS;
    }
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cbt_exams_data', JSON.stringify(exams));
    } catch {}
  }, [exams]);

  useEffect(() => {
    try {
      localStorage.setItem('cbt_attempts_data', JSON.stringify(attempts));
    } catch {}
  }, [attempts]);

  useEffect(() => {
    try {
      if (currentRole) {
        localStorage.setItem('cbt_user_role', currentRole);
      } else {
        localStorage.removeItem('cbt_user_role');
      }
    } catch {}
  }, [currentRole]);

  // Managing specific exam's questions
  const [managingExam, setManagingExam] = useState<ExamPackage | null>(null);

  // Modals state
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isFileImportOpen, setIsFileImportOpen] = useState(false);
  const [isManualCreateOpen, setIsManualCreateOpen] = useState(false);

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

  // Handle URL query parameters for test automation & deep links
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

  // Handlers for Role & Auth Portal
  const handleSelectRole = (role: 'guru' | 'siswa') => {
    setCurrentRole(role);
    if (role === 'guru') {
      setActiveNav('guru');
    } else {
      setActiveNav('siswa');
      setIsStudentEntryModalOpen(true);
    }
  };

  const handleLogout = () => {
    setCurrentRole(null);
    setIsStudentEntryModalOpen(false);
    setManagingExam(null);
    setExamToTestDirectly(null);
  };

  // Handler: Add or update exam
  const handleSaveExam = (newExam: ExamPackage) => {
    setExams((prev) => {
      const index = prev.findIndex((e) => e.id === newExam.id);
      if (index >= 0) {
        const copy = [...prev];
        copy[index] = newExam;
        return copy;
      }
      return [newExam, ...prev];
    });

    if (managingExam && managingExam.id === newExam.id) {
      setManagingExam(newExam);
    }
  };

  // Handler: Delete exam
  const handleDeleteExam = (examId: string) => {
    setExams((prev) => prev.filter((e) => e.id !== examId));
    if (managingExam?.id === examId) {
      setManagingExam(null);
    }
  };

  // Handler: Import questions from Excel / Word
  const handleImportQuestions = (
    importedQuestions: Question[],
    packageMeta?: { judul: string; kelas: KelasSD; mataPelajaran: MataPelajaran }
  ) => {
    if (packageMeta) {
      // Create new exam
      const totalBobot = importedQuestions.reduce((acc, q) => acc + (q.bobot || 10), 0);
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const token = `${packageMeta.mataPelajaran.substring(0, 3).toUpperCase()}${randomSuffix}`;

      const newExam: ExamPackage = {
        id: `exam-imported-${Date.now()}`,
        judul: packageMeta.judul,
        deskripsi: `Paket soal ${packageMeta.mataPelajaran} ${packageMeta.kelas} diimpor dari file dokumen.`,
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
      };

      setExams((prev) => [newExam, ...prev]);
      setManagingExam(newExam);
    } else if (managingExam) {
      // Append to current managing exam
      const updatedList = [...managingExam.soalList, ...importedQuestions];
      const updatedTotal = updatedList.reduce((acc, q) => acc + (q.bobot || 10), 0);
      const updatedExam = {
        ...managingExam,
        soalList: updatedList,
        totalBobot: updatedTotal,
      };
      handleSaveExam(updatedExam);
    }
  };

  // Handler: Start test from Teacher Exam List card
  const handleStartStudentTest = (exam: ExamPackage) => {
    setExamToTestDirectly(exam);
    setIsStudentEntryModalOpen(true);
  };

  // Handler: Student finishes exam
  const handleStudentSubmitExam = (attempt: StudentAttempt) => {
    setAttempts((prev) => [attempt, ...prev]);
    setStudentSession(null);
    setCompletedAttempt(attempt);
  };

  // Handler: Update attempt from teacher grading
  const handleUpdateAttempt = (updated: StudentAttempt) => {
    setAttempts((prev) => prev.map((att) => (att.id === updated.id ? updated : att)));
  };

  // Handler: Delete single student attempt from grading
  const handleDeleteAttempt = (attemptId: string) => {
    setAttempts((prev) => prev.filter((att) => att.id !== attemptId));
  };

  // Handler: Clear all student attempts
  const handleClearAllAttempts = () => {
    setAttempts([]);
  };

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
      exams.find((e) => e.id === completedAttempt.examId) || INITIAL_EXAMS[0];
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

  // If no role chosen yet, show initial Login / Role Selection Portal
  if (!currentRole) {
    return (
      <LoginPortal
        onSelectRole={handleSelectRole}
        examCount={exams.length}
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
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
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
                    onOpenManualCreate={() => {
                      const newId = `exam-manual-${Date.now()}`;
                      const freshExam: ExamPackage = {
                        id: newId,
                        judul: 'Paket Asesmen Baru',
                        deskripsi: 'Deskripsi dan tujuan pembelajaran asesmen.',
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
                      };
                      setExams((prev) => [freshExam, ...prev]);
                      setManagingExam(freshExam);
                    }}
                    onEditExamQuestions={(ex) => setManagingExam(ex)}
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
                onBack={() => setManagingExam(null)}
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
        onSaveExam={(newExam) => {
          handleSaveExam(newExam);
          setManagingExam(newExam);
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
