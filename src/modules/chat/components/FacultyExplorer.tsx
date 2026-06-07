'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { Users, GraduationCap, ArrowLeft, UserCircle, BadgeCheck, Mail, MapPin, Award, ChevronRight, Book, Phone, Calendar, BookOpen, Star, Briefcase, Home } from 'lucide-react';
import { searchFaculty, Faculty } from '../services/collegeDataService';

const STREAM_DEPARTMENTS: Record<string, string[]> = {
  'Arts': [
    'HINDI', 'HISTORY', 'SANSKRIT', 'POLITICAL SCIENCE', 'ECONOMICS', 
    'SOCIOLOGY', 'ENGLISH', 'PHYSICAL EDUCATION', 'GEOGRAPHY', 'URDU', 
    'PUBLIC ADMINISTRATION'
  ],
  'Science': [
    'BOTANY', 'PHYSICS', 'MATHEMATICS', 'CHEMISTRY', 'ZOOLOGY'
  ],
  'Commerce': [
    'BUSINESS ADMINISTRATION', 'ACCOUNTING & BUSINESS STATISTICS (COMMERCE)', 'E.A.F.M'
  ]
};

export const FacultyExplorer = ({ initialTeacherName, initialDepartment, onClose, onHome, isInline }: { initialTeacherName?: string; initialDepartment?: string; onClose?: () => void; onHome?: () => void; isInline?: boolean }) => {
  const [isInitialProfile] = useState(!!initialTeacherName);
  const [view, setView] = useState<'streams' | 'departments' | 'teachers' | 'profile'>(
    initialTeacherName ? 'profile' : initialDepartment ? 'teachers' : 'streams'
  );
  
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(initialDepartment || null);
  const [teachers, setTeachers] = useState<Faculty[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Faculty | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);

      if (initialTeacherName) {
        const results = await searchFaculty({ name: initialTeacherName });
        if (results && results.length > 0) {
          setSelectedTeacher(results[0]);
          setSelectedDept(results[0].department);
          setView('profile');
        } else {
          setView('streams');
        }
      } else if (initialDepartment) {
        const isStream = Object.keys(STREAM_DEPARTMENTS).includes(initialDepartment);
        if (isStream) {
          setSelectedStream(initialDepartment);
          setView('departments');
        } else {
          const results = await searchFaculty({ subject: initialDepartment });
          // Sort by rank/designation
          const sorted = results.sort((a, b) => {
            const order: Record<string, number> = { 
              'Professor': 1, 
              'Associate Professor': 2, 
              'Assistant Professor': 3,
              'Lecturer': 4
            };
            const rankA = order[a.designation] || 5;
            const rankB = order[b.designation] || 5;
            return rankA - rankB;
          });
          setTeachers(sorted);
          setView('teachers');
        }
      }
      setLoading(false);
    };
    loadData();
  }, [initialTeacherName, initialDepartment]);

  const handleStreamClick = (stream: string) => {
    setSelectedStream(stream);
    setView('departments');
  };

  const handleDeptClick = async (dept: string) => {
    setLoading(true);
    setSelectedDept(dept);
    const results = await searchFaculty({ subject: dept });
    // Sort by rank/designation (Professor > Associate Professor > Assistant Professor)
    const sorted = results.sort((a, b) => {
      const order: Record<string, number> = { 
        'Professor': 1, 
        'Associate Professor': 2, 
        'Assistant Professor': 3,
        'Lecturer': 4
      };
      const rankA = order[a.designation] || 5;
      const rankB = order[b.designation] || 5;
      return rankA - rankB;
    });
    setTeachers(sorted);
    setView('teachers');
    setLoading(false);
  };

  const handleTeacherClick = (teacher: Faculty) => {
    setSelectedTeacher(teacher);
    setView('profile');
  };

  const goBack = () => {
    if (view === 'profile') setView('teachers');
    else if (view === 'teachers') setView('departments');
    else if (view === 'departments') setView('streams');
    else if (onClose) onClose();
  };

  if (loading && (view === 'departments' || view === 'streams')) {
    return (
      <div className="w-full h-40 flex items-center justify-center bg-zinc-900 rounded-[2.5rem] border border-zinc-800 animate-pulse">
        <div className="text-xs text-zinc-500 font-bold uppercase tracking-widest italic">Loading departments...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative flex flex-col">
      <div className="p-0 md:p-4 flex flex-col h-full">
        <div className="flex-shrink-0">
          {view === 'streams' && !isInline && (
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  {onHome && (
                    <button 
                      onClick={onHome}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                    >
                      <Home className="w-4 h-4" />
                      Home
                    </button>
                  )}
                </div>
                <h1 className="font-space text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight leading-tight pt-1 md:pt-0 drop-shadow-sm">
                  College Streams
                </h1>
              </div>
          )}

          {view === 'departments' && (!isInline || !initialDepartment) && (
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-6">
              <div className="flex items-center gap-2">
                <button 
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                {onHome && (
                  <button 
                    onClick={onHome}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                    title="Home"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </button>
                )}
              </div>
              <h1 className="font-space text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight leading-tight pt-1 md:pt-0 drop-shadow-sm">
                {selectedStream} Subjects
              </h1>
            </div>
          )}
          
          {view === 'teachers' && (!isInline || !initialDepartment) && (
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-6">
              <div className="flex items-center gap-2">
                <button 
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                {onHome && (
                  <button 
                    onClick={onHome}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                    title="Home"
                  >
                    <Home className="w-4 h-4" />
                    Home
                  </button>
                )}
              </div>
              <h1 className="font-space text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight leading-tight pt-1 md:pt-0 drop-shadow-sm">
                {selectedDept} Faculty
              </h1>
            </div>
          )}
        </div>

        <div className="flex-grow overflow-y-auto pr-2 scrollbar-none no-scrollbar pb-6">
          <AnimatePresence mode="wait">
            {view === 'streams' && (
              <motion.div 
                key="streams"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
              {Object.keys(STREAM_DEPARTMENTS).map((stream, index) => (
                <motion.button
                  key={stream}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleStreamClick(stream)}
                  className="flex items-center gap-4 w-full p-2.5 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group text-left shadow-sm backdrop-blur-xl"
                >
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-white/5 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-white/10 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
                    <GraduationCap className="w-6 h-6 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-lg font-medium text-zinc-800 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors tracking-tight font-space">{stream}</span>
                </motion.button>
              ))}
              </motion.div>
            )}

            {view === 'departments' && selectedStream && (
              <motion.div 
                key="depts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
              {STREAM_DEPARTMENTS[selectedStream]?.map((dept, index) => (
                <motion.button
                  key={dept}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleDeptClick(dept)}
                  className="flex items-center gap-4 w-full p-2.5 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group text-left shadow-sm backdrop-blur-xl"
                >
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-white/5 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-white/10 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800 transition-colors">
                    <GraduationCap className="w-6 h-6 text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-lg font-medium text-zinc-800 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors tracking-tight font-space">{dept}</span>
                </motion.button>
              ))}
            </motion.div>
          )}

          {view === 'teachers' && (
            <motion.div 
              key="teachers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-3">
                {teachers.map((teacher, idx) => (
                  <motion.div
                    key={teacher.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => handleTeacherClick(teacher)}
                    className="w-full flex items-center gap-4 p-4 bg-white/95 border border-zinc-200 dark:border-white/10 dark:bg-zinc-900/95 rounded-2xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all group cursor-pointer shadow-sm backdrop-blur-xl"
                  >
                    <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/10 flex-shrink-0">
                      <Image 
                        src={teacher.image_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name)}&background=random&color=fff&size=128`} 
                        alt={teacher.name}
                        fill
                        className="object-cover transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-grow min-w-0">
                      <h3 className="text-lg font-bold text-zinc-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate font-space">
                        {teacher.name}
                      </h3>
                      <div className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest">
                        {teacher.designation}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-white/30 group-hover:text-zinc-800 dark:group-hover:text-white transition-colors" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {view === 'profile' && selectedTeacher && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 pb-12"
            >
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-4">
                {(!isInline || (!initialTeacherName && (!initialDepartment || view !== 'profile'))) && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={goBack}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Back
                    </button>
                    {onClose && (
                      <button 
                        onClick={onClose}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                        title="Home"
                      >
                        <Home className="w-4 h-4" />
                        Home
                      </button>
                    )}
                  </div>
                )}
                {(!isInline || (!initialTeacherName && (!initialDepartment || view !== 'profile'))) && (
                  <h2 className="text-lg sm:text-xl md:text-2xl font-space font-bold text-zinc-900 dark:text-white uppercase tracking-tighter leading-tight pt-1 md:pt-0">
                    Faculty Profile
                  </h2>
                )}
              </div>

              <div className="relative group/profile">
                <div className="w-full aspect-square rounded-3xl overflow-hidden shadow-2xl border border-white/5 relative">
                  <Image 
                    src={selectedTeacher.image_url || 'https://images.unsplash.com/photo-1544717297-fa95b3ee51f3?q=80&w=600&auto=format&fit=crop'} 
                    alt={selectedTeacher.name}
                    fill
                    priority
                    referrerPolicy="no-referrer"
                    className="object-cover object-top transition-all duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="px-3 py-1 bg-white text-black text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-3 inline-block shadow-lg">
                      {selectedTeacher.designation}
                    </span>
                    <h2 className="text-3xl font-space font-bold text-white uppercase tracking-tighter">
                      {selectedTeacher.name}
                    </h2>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { icon: UserCircle, label: "Father's Name", value: selectedTeacher.father_name, color: 'text-zinc-400' },
                  { icon: Book, label: 'Subject', value: selectedTeacher.subject || selectedTeacher.department, color: 'text-purple-400' },
                  { icon: GraduationCap, label: 'Qualification', value: selectedTeacher.qualification, color: 'text-emerald-400' },
                  { icon: Star, label: 'Area of Specialization', value: selectedTeacher.specialization, color: 'text-amber-400' },
                  { icon: Award, label: 'Seniority No. / Year', value: selectedTeacher.seniority_no, color: 'text-orange-400' },
                  { icon: Mail, label: 'Email Address', value: selectedTeacher.email, color: 'text-blue-400' },
                  { icon: Phone, label: 'Mobile No. / Phone No.', value: selectedTeacher.mobile_no, color: 'text-green-400' },
                  { icon: Calendar, label: 'Date of Birth', value: selectedTeacher.dob, color: 'text-pink-400' },
                  { icon: Briefcase, label: 'Department Service Date', value: selectedTeacher.service_start_date, color: 'text-indigo-400' },
                  { icon: MapPin, label: 'Join this College Date', value: selectedTeacher.college_join_date, color: 'text-rose-400' },
                ].filter(item => Boolean(item.value)).map((item, i) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-4 w-full p-4 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-2xl shadow-sm backdrop-blur-xl"
                  >
                    <div className="w-12 h-12 bg-zinc-100 dark:bg-white/5 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-white/10">
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>
                    <div>
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">{item.label}</div>
                      <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tracking-tight font-space">{item.value}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
