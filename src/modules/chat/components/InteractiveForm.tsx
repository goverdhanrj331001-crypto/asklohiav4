'use client';

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, GraduationCap, Calendar, Search, ArrowRight, ClipboardList } from 'lucide-react';
import { useStudentProfile } from '@/modules/profile/hooks/useStudentProfile';

interface InteractiveFormProps {
  type: 'exam' | 'resource';
  initialSubject?: string;
  initialStatus?: string;
  initialLevel?: string;
  initialSemester?: string;
  onSearch: (query: string) => void;
}

export const InteractiveForm = ({ type, initialSubject, initialStatus, initialLevel, initialSemester, onSearch }: InteractiveFormProps) => {
  const { profile } = useStudentProfile();
  const [status, setStatus] = useState(initialStatus || (profile?.status === 'Non-Collegiate' ? 'Non-Collegiate' : 'Collegiate'));
  const parsedLevel = initialLevel === 'UG' ? 'Graduate' : (initialLevel === 'PG' ? 'Post Graduate' : initialLevel);
  const [level, setLevel] = useState(parsedLevel || (profile?.level === 'Post Graduate' ? 'Post Graduate' : 'Graduate'));
  const [semester, setSemester] = useState(initialSemester || profile?.semester?.toString() || '1');
  const [paper, setPaper] = useState('All');
  const [subject, setSubject] = useState(initialSubject || 'All');
  const [mode, setMode] = useState('Practical Exam');
  const [materialType, setMaterialType] = useState('All');

  const scienceSubjects = ['Physics', 'Chemistry', 'Zoology', 'Botany', 'Microbiology', 'Geology', 'Mathematics', 'Geography'];
  const artsSubjects = ['Geography', 'Drawing', 'Music', 'Psychology', 'Economics', 'History', 'Home Science', 'Geology', 'Hindi', 'Hindi Literature', 'English', 'Sanskrit', 'Political Science', 'Sociology', 'Public Administration', 'Philosophy'];
  const commerceSubjects = ['ABST', 'BADM', 'EAFM'];
  const computerSubjects = ['Computer Science', 'BCA', 'CIT'];

  const allSubjects = Array.from(new Set([...scienceSubjects, ...artsSubjects, ...commerceSubjects, ...computerSubjects])).sort();

  const getLevelLabels = () => {
    const s = subject.toLowerCase();
    const isArts = artsSubjects.some(as => as.toLowerCase() === s) || s.includes('hindi') || s.includes('sahitya') || s.includes('art');
    const isScience = scienceSubjects.some(ss => ss.toLowerCase() === s) || s.includes('science') || s.includes('vigyan');
    const isCommerce = commerceSubjects.some(cs => cs.toLowerCase() === s) || s.includes('commerce') || s.includes('vanijya');

    if (isArts && !isScience) return { ug: 'UG', ugSub: '(B.A.)', pg: 'PG', pgSub: '(M.A.)' };
    if (isScience && !isArts) return { ug: 'UG', ugSub: '(B.Sc)', pg: 'PG', pgSub: '(M.Sc)' };
    if (isCommerce) return { ug: 'UG', ugSub: '(B.Com)', pg: 'PG', pgSub: '(M.Com)' };
    
    return { ug: 'UG', ugSub: '(B.A/B.Sc)', pg: 'PG', pgSub: '(M.A/M.Sc)' };
  };

  const labels = getLevelLabels();

  const handleSearch = () => {
    let query = '';
    if (type === 'exam') {
      query = `${subject} Main Exam ${status} ${level} Semester ${semester} ${paper}`;
    } else {
      const modeText = mode === 'Both' ? 'Practical and Study Material' : mode;
      query = `${subject} ${modeText} ${status} ${level} Semester ${semester} ${mode !== 'Practical Exam' ? materialType : ''}`.trim();
    }
    onSearch(query);
  };

  return (
    <div className="w-full max-w-[800px] mx-auto space-y-8 font-sans antialiased text-zinc-800 dark:text-[#e5e2e1]">
      {/* Form Container */}
      <div className="grid grid-cols-1 gap-6">
        {/* Section 1: College Status */}
        <div className="bg-zinc-100/50 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-zinc-400 dark:text-white/40" />
            <span className="text-[12px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest font-space">College Status</span>
          </div>
          <div className="bg-zinc-200/50 dark:bg-white/[0.05] p-1 rounded-full flex border border-zinc-300/50 dark:border-white/5">
            {['Collegiate', 'Non-Collegiate'].map((opt) => (
              <button
                key={opt}
                onClick={() => setStatus(opt)}
                className={`flex-1 py-3 text-sm font-bold rounded-full transition-all duration-300 ${
                  status === opt 
                  ? 'bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 dark:shadow-[0_4px_12px_rgba(255,255,255,0.3)]' 
                  : 'text-zinc-500 dark:text-white/40 hover:text-zinc-800 dark:hover:text-white'
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Section 2: Academic Level */}
        <div className="bg-zinc-100/50 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-zinc-400 dark:text-white/40" />
            <span className="text-[12px] font-bold text-zinc-500 dark:text-white/60 uppercase tracking-widest font-space">Academic Level</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'Graduate', primary: labels.ug, secondary: labels.ugSub },
              { id: 'Post Graduate', primary: labels.pg, secondary: labels.pgSub }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => setLevel(opt.id)}
                className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 active:scale-95 ${
                  level === opt.id
                  ? 'border-zinc-300 dark:border-white/20 bg-white shadow-xl dark:shadow-none dark:bg-white/10' 
                  : 'border-zinc-200/50 dark:border-white/5 bg-transparent opacity-60 dark:opacity-40 hover:opacity-100'
                }`}
              >
                <span className="text-2xl font-bold text-zinc-900 dark:text-white font-space">{opt.primary}</span>
                <span className="text-[10px] text-zinc-500 dark:text-white/60 font-bold uppercase tracking-widest">{opt.secondary}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Subject Selector (Always show) */}
          <div className="bg-zinc-100/50 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-4 rounded-xl space-y-2">
            <label className="text-[12px] font-bold text-zinc-500 dark:text-white/40 uppercase tracking-widest font-space block px-1">Subject</label>
            <div className="relative">
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 rounded-lg p-3 text-sm font-medium text-zinc-900 dark:text-white appearance-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors focus:outline-none"
              >
                <option value="All" className="bg-white dark:bg-[#131313]">All Subjects</option>
                {allSubjects.map((s) => (
                  <option key={s} value={s} className="bg-white dark:bg-[#131313]">{s}</option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-white/40">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Semester */}
          <div className="bg-zinc-100/50 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-4 rounded-xl space-y-2">
            <label className="text-[12px] font-bold text-zinc-500 dark:text-white/40 uppercase tracking-widest font-space block px-1">Semester</label>
            <div className="relative">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full bg-white dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 rounded-lg p-3 text-sm font-medium text-zinc-900 dark:text-white appearance-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num.toString()} disabled={level === 'Post Graduate' && num > 4} className="bg-white dark:bg-[#131313]">
                    Semester {num}
                  </option>
                ))}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-white/40">
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>

          {/* Additional Detail Selection */}
          <div className="bg-zinc-100/50 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/10 p-4 rounded-xl space-y-2">
            <label className="text-[12px] font-bold text-zinc-500 dark:text-white/40 uppercase tracking-widest font-space block px-1">
              {type === 'exam' ? 'Paper Selection' : 'Resource Type'}
            </label>
            <div className="relative">
              {type === 'exam' ? (
                <select
                  value={paper}
                  onChange={(e) => setPaper(e.target.value)}
                  className="w-full bg-white dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 rounded-lg p-3 text-sm font-medium text-zinc-900 dark:text-white appearance-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors focus:outline-none"
                >
                  <option value="All" className="bg-white dark:bg-[#131313]">All Papers</option>
                  <option value="First" className="bg-white dark:bg-[#131313]">First Paper</option>
                  <option value="Second" className="bg-white dark:bg-[#131313]">Second Paper</option>
                  <option value="Third" className="bg-white dark:bg-[#131313]">Third Paper</option>
                </select>
              ) : (
                <select
                  value={materialType}
                  onChange={(e) => setMaterialType(e.target.value)}
                  className="w-full bg-white dark:bg-white/[0.05] border border-zinc-200 dark:border-white/10 rounded-lg p-3 text-sm font-medium text-zinc-900 dark:text-white appearance-none cursor-pointer hover:bg-zinc-50 dark:hover:bg-white/10 transition-colors focus:outline-none"
                >
                  <option value="All" className="bg-white dark:bg-[#131313]">All Materials</option>
                  <option value="Practical File" className="bg-white dark:bg-[#131313]">Practical File</option>
                  <option value="Notes" className="bg-white dark:bg-[#131313]">Study Notes</option>
                  <option value="Other" className="bg-white dark:bg-[#131313]">Other Resources</option>
                </select>
              )}
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-white/40">
                <ArrowRight className="w-4 h-4 rotate-90" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="pt-2">
        <motion.button
          whileHover={{ scale: 1.01, backgroundColor: '#fefefe' }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSearch}
          className="w-full bg-zinc-900 dark:bg-white text-white dark:text-black py-4 rounded-2xl font-bold text-base flex justify-center items-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-200 group font-space border border-zinc-800 dark:border-white/10"
        >
          <span className="uppercase tracking-[0.15em] font-black">Search Details</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </motion.button>
      </div>

      {/* Connection Status */}
      <div className="pt-2 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
        <p className="text-[10px] text-zinc-400 dark:text-white/30 font-bold uppercase tracking-[0.2em] font-space text-center">
          Secure college information connection active
        </p>
      </div>
    </div>
  );
};
