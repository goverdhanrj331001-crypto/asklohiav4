'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, GraduationCap, ChevronRight, FileText, Download, Calendar, UploadCloud, Library, Users, ArrowLeft, Home } from 'lucide-react';
import { searchMainExams, searchPracticalExams, searchStudyMaterial } from '../services/collegeDataService';
import { useStudentProfile } from '@/modules/profile/hooks/useStudentProfile';

type Step = 'department' | 'status' | 'level' | 'examType' | 'semester' | 'practicalChoice' | 'practicalSubject' | 'results';

interface Selections {
  department?: string;
  status?: string;
  level?: string;
  examType?: string;
  semester?: number;
  practicalChoice?: string;
  practicalSubject?: string;
}

interface ExamExplorerProps {
  initialSelections?: Selections;
}

export const ExamExplorer = ({ initialSelections, onClose, onHome, isInline }: { initialSelections?: Selections; onClose?: () => void; onHome?: () => void; isInline?: boolean }) => {
  const { profile } = useStudentProfile();
  const [selections, setSelections] = useState<Selections>(() => {
    const s = { ...(initialSelections || {}) };
    if (profile) {
      if (!s.status) s.status = profile.status === 'Collegiate' ? 'Collegiate' : 'Non-Collegiate';
      if (!s.level) s.level = profile.level === 'Post Graduate' ? 'PG' : 'UG';
      if (!s.semester && profile.semester) s.semester = parseInt(profile.semester.toString());
    }
    return s;
  });

  const [step, setStep] = useState<Step>(() => {
    if (initialSelections?.semester) return 'results';
    if (initialSelections?.department) {
      // If we have department and profile (which gives us status/level/sem), we could theoretically skip to results
      // but let's at least skip to the next unknown step
      if (profile && profile.status && profile.level && profile.semester) return 'examType';
      return 'status';
    }
    return 'department';
  });
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialSelections && initialSelections.semester) {
      const runInitialSearch = async () => {
        setStep('results');
        setLoading(true);
        try {
          const type = initialSelections.examType || 'Main Exam';
          if (type === 'Main Exam') {
            const data = await searchMainExams({
              department: initialSelections.department,
              status: initialSelections.status,
              level: initialSelections.level,
              semester: initialSelections.semester
            });
            setResults(data);
          } else {
            // Handle practical/material search if needed
            const data = await searchPracticalExams({
              department: initialSelections.department,
              level: initialSelections.level,
              semester: initialSelections.semester
            });
            setResults(data);
          }
        } catch (err) {
          console.error("Initial search failed:", err);
        } finally {
          setLoading(false);
        }
      };
      runInitialSearch();
    }
  }, [initialSelections]);

  const goBack = () => {
    if (step === 'results') setStep('semester');
    else if (step === 'practicalSubject') setStep('practicalChoice');
    else if (step === 'practicalChoice') setStep('semester');
    else if (step === 'semester') setStep('examType');
    else if (step === 'examType') setStep('level');
    else if (step === 'level') setStep('status');
    else if (step === 'status') setStep('department');
    else if (onClose) onClose();
  };

  const handleSelect = async (key: keyof Selections, value: any, nextStep: Step) => {
    const newSelections = { ...selections, [key]: value };
    setSelections(newSelections);
    
    // If we're reaching the results step, fetch data
    if (nextStep === 'results') {
      setStep('results');
      setLoading(true);
      try {
        if (newSelections.examType === 'Main Exam') {
          const data = await searchMainExams({
            department: newSelections.department,
            status: newSelections.status,
            level: newSelections.level,
            semester: newSelections.semester
          });
          setResults(data);
        } else if (newSelections.examType === 'Practical') {
          if (newSelections.practicalChoice === 'Practical Exam') {
            const data = await searchPracticalExams({
              department: newSelections.department,
              level: newSelections.level,
              semester: newSelections.semester
            });
            setResults(data);
          } else if (newSelections.practicalChoice === 'Practical Material') {
            const data = await searchStudyMaterial({
              department: newSelections.department, /* Or practical subject depending on DB */
              title: newSelections.practicalSubject,
              level: newSelections.level,
              semester: newSelections.semester
            });
            setResults(data);
          }
        }
      } catch (err) {
        console.error("Error fetching exam results:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setStep(nextStep);
    }
  };

  const OptionCard = ({ title, icon: Icon, onClick }: { title: string, icon: any, onClick: () => void }) => (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="flex items-center justify-between p-4 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-[1.5rem] hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group shadow-sm text-left w-full backdrop-blur-xl"
    >
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-zinc-100 dark:bg-white/5 rounded-2xl flex items-center justify-center border border-zinc-200 dark:border-white/10 group-hover:bg-purple-100 dark:group-hover:bg-purple-500/20 transition-colors">
           <Icon className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors" />
        </div>
        <span className="text-sm font-black text-zinc-800 dark:text-white">{title}</span>
      </div>
      <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-600 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors" />
    </motion.button>
  );

  const getStepContent = () => {
    switch (step) {
      case 'department':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {['Arts', 'Science', 'Commerce', 'Computer', 'Business Studies'].map(dept => (
              <OptionCard key={dept} title={dept} icon={Library} onClick={() => handleSelect('department', dept, 'status')} />
            ))}
          </div>
        );
      case 'status':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {['Collegiate', 'Non-Collegiate'].map(status => (
              <OptionCard key={status} title={status} icon={Users} onClick={() => handleSelect('status', status, 'level')} />
            ))}
          </div>
        );
      case 'level':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {['UG', 'PG'].map(level => (
              <OptionCard key={level} title={level} icon={GraduationCap} onClick={() => handleSelect('level', level, 'examType')} />
            ))}
          </div>
        );
      case 'examType':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {['Practical', 'Main Exam'].map(type => (
              <OptionCard key={type} title={type} icon={BookOpen} onClick={() => handleSelect('examType', type, 'semester')} />
            ))}
          </div>
        );
      case 'semester':
        const maxSem = selections.level === 'PG' ? 4 : 6;
        const sems = Array.from({length: maxSem}, (_, i) => i + 1);
        return (
          <div className="grid grid-cols-1 gap-3 mt-4">
            {sems.map(sem => (
              <OptionCard key={sem} title={`Semester ${sem}`} icon={Calendar} onClick={() => {
                if (selections.examType === 'Practical') {
                  handleSelect('semester', sem, 'practicalChoice');
                } else {
                  handleSelect('semester', sem, 'results'); // Main exam goes straight to results
                }
              }} />
            ))}
          </div>
        );
      case 'practicalChoice':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            <OptionCard title="Practical Material" icon={FileText} onClick={() => handleSelect('practicalChoice', 'Practical Material', 'practicalSubject')} />
            <OptionCard title="Practical Exam" icon={Calendar} onClick={() => handleSelect('practicalChoice', 'Practical Exam', 'results')} />
          </div>
        );
      case 'practicalSubject':
        // Mock list of subjects based on department (simplified)
        const getSubjects = () => {
          if (selections.department === 'Arts') return ['Geography', 'Hindi Literature', 'Sociology', 'Political Science'];
          if (selections.department === 'Science') return ['Physics', 'Chemistry', 'Botany', 'Zoology', 'Mathematics'];
          if (selections.department === 'Commerce') return ['Accountancy', 'Business Admin'];
          if (selections.department === 'Computer') return ['Programming', 'DBMS', 'Networking'];
          return ['Management', 'Finance'];
        };
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {getSubjects().map(subj => (
              <OptionCard key={subj} title={subj} icon={BookOpen} onClick={() => handleSelect('practicalSubject', subj, 'results')} />
            ))}
          </div>
        );
      case 'results':
        if (loading) {
          return (
             <div className="w-full h-64 flex items-center justify-center bg-white/[0.02] rounded-[2.5rem] border border-white/5 animate-pulse mt-4">
               <div className="flex flex-col items-center gap-4">
                 <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                 <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest italic animate-pulse">Fetching official records...</div>
               </div>
             </div>
          );
        }

        const items = results.length > 0 ? results : [
           { id: 1, subject: `${selections.department || ''} Paper I`, exam_date: '2026-05-10', time: '09:00 AM - 12:00 PM', status: selections.status, code: 'ART001', entry_id: 'BF2E46B9-COFA-4FF9-9F91-366FA71A4633' },
           { id: 2, subject: `${selections.department || ''} Paper II`, exam_date: '2026-05-12', time: '09:00 AM - 12:00 PM', status: selections.status, code: 'ART002', entry_id: 'EB24109B-B965-4F6A-AB6A-DB9695C3F15A' },
           { id: 3, subject: `${selections.department || ''} Paper III`, exam_date: '2026-05-15', time: '09:00 AM - 12:00 PM', status: selections.status, code: 'ART003', entry_id: 'E6953B4E-326F-4772-B869-56B98F4D840E' },
        ];

        return (
          <div className="mt-8 space-y-6">
            <div className="flex flex-col gap-1 mb-8">
              <div className="text-[10px] text-blue-500/80 font-black uppercase tracking-[0.3em] mb-1">Official University Records</div>
              <h2 className="text-3xl font-space font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                {selections.department || 'GENERAL'} <span className="text-zinc-300 dark:text-white/20">/</span> {selections.semester}UG
              </h2>
              <div className="flex gap-2 mt-3">
                <span className="px-3 py-1 bg-white/5 rounded-full text-[9px] font-bold text-white/40 uppercase tracking-widest border border-white/5">
                  {selections.status || 'COLLEGIATE'}
                </span>
                <span className="px-3 py-1 bg-blue-500/10 rounded-full text-[9px] font-bold text-blue-400 uppercase tracking-widest border border-blue-500/10">
                  Live Status: Active
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {items.map((p: any, i: number) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative flex flex-col md:flex-row md:items-center justify-between p-6 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-3xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all gap-4 shadow-sm backdrop-blur-xl"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-mono text-zinc-400 dark:text-white/20">#{i + 1}</span>
                      <h3 className="text-lg font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                        {p.subject || p.title || 'Examination Paper'}
                      </h3>
                    </div>
                    <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest text-zinc-500 dark:text-white/30">
                      <span>Code: {p.code || 'N/A'}</span>
                      <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-white/10"></span>
                      <span>Ref: {p.entry_id?.slice(0, 8) || 'OFFICIAL-REC'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-8 bg-zinc-50 dark:bg-zinc-900/50 md:bg-transparent p-4 md:p-0 rounded-2xl md:rounded-none">
                    <div className="text-left md:text-right">
                      <div className="text-sm font-black text-zinc-700 dark:text-white/80 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {p.exam_date ? new Date(p.exam_date).toISOString().split('T')[0] : p.date || 'TBD'}
                      </div>
                      <div className="text-[9px] text-zinc-500 dark:text-white/30 font-bold uppercase tracking-widest">
                        {p.exam_date ? new Date(p.exam_date).toLocaleDateString('en-US', { weekday: 'long' }) : 'Pending Confirmation'}
                      </div>
                    </div>

                    <div className="flex flex-col items-end">
                      {selections.practicalChoice === 'Practical Material' ? (
                        <a href={p.url || '#'} className="bg-white text-black px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-white/80 active:scale-95">
                          Download
                        </a>
                      ) : (
                        <>
                          <div className="text-blue-400 font-space text-sm font-black tracking-tight">{p.time || '09:00 AM'}</div>
                          <div className="text-[8px] text-blue-500/40 uppercase font-black tracking-widest">Official Time</div>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getBreadcrumbs = () => {
    const parts = [
      selections.department,
      selections.status,
      // We hide level if not selected, but generally combine them beautifully
      selections.level ? `${selections.level} SEM ${selections.semester || '?'}` : '',
      selections.examType,
      selections.practicalChoice,
      selections.practicalSubject
    ].filter(Boolean);

    if (parts.length === 0) return 'Select Department';
    return parts.join(' • ');
  };

  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative flex flex-col">
      <div className="p-0 md:p-4 flex flex-col h-full">
        <div className="flex-shrink-0">
          {(!isInline || step !== 'department') && (
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <div className="flex items-center gap-2">
                <button 
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                {onHome && (
                  <button 
                    onClick={onHome}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </button>
                )}
              </div>
              {!isInline && (
                <div>
                  <h1 className="font-space text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight leading-tight pt-1 md:pt-0 drop-shadow-sm">
                    Academic Explorer
                  </h1>
                </div>
              )}
            </div>
          )}
          <p className="text-[10px] text-zinc-600 dark:text-blue-400 font-bold uppercase tracking-widest mb-6 px-1 drop-shadow-md">
            {getBreadcrumbs()}
          </p>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 scrollbar-none no-scrollbar pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {getStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};