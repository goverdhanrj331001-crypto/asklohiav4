'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Award, Search, GraduationCap, Calendar, User, Star, ArrowLeft, Home, BookOpen, ChevronRight, Medal } from 'lucide-react';
import { searchMeritList, MeritRecord } from '../services/collegeDataService';

const DEFAULT_BOARDS = [
  'Degree Exam (Arts)',
  'Degree Exam (Science)',
  'Degree Exam (Commerce)',
  'M.A. Examinations',
  'M.Sc. Examinations',
  'M.Com Examinations',
  'Inter/Pre-Univ Exam (Arts) - Intermediate',
  'Inter/Pre-Univ Exam (Arts) - Pre-University',
  'Inter/Pre-Univ Exam (Science) - Intermediate',
  'Inter/Pre-Univ Exam (Science) - Pre-University',
  'Inter/Pre-Univ Exam (Commerce) - Intermediate',
  'Inter/Pre-Univ Exam (Commerce) - Pre-University',
  'University Colour Holders',
  'Inter University Proficiency'
];

export const ToppersExplorer = ({ 
  initialBoard, 
  initialSearchQuery,
  onClose, 
  onHome, 
  isInline 
}: { 
  initialBoard?: string; 
  initialSearchQuery?: string;
  onClose?: () => void; 
  onHome?: () => void; 
  isInline?: boolean 
}) => {
  const [view, setView] = useState<'boards' | 'list' | 'profile'>(initialSearchQuery ? 'list' : (initialBoard ? 'list' : 'boards'));
  const [selectedBoard, setSelectedBoard] = useState<string>(initialBoard || (initialSearchQuery ? 'Search Results' : ''));
  const [meritList, setMeritList] = useState<MeritRecord[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<MeritRecord | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery || '');
  const [visibleCount, setVisibleCount] = useState(5);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && visibleCount < meritList.length) {
        setVisibleCount(prev => Math.min(prev + 5, meritList.length));
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, visibleCount, meritList.length]);

  useEffect(() => {
    setVisibleCount(5);
  }, [meritList]);

  const handleBoardSelection = async (board: string) => {
    setSelectedBoard(board);
    setLoading(true);
    setView('list');
    const results = await searchMeritList({ board_type: board });
    setMeritList(results);
    setLoading(false);
  };

  useEffect(() => {
    const loadInitialBoard = async () => {
      if (initialSearchQuery) {
        setLoading(true);
        setView('list');
        setSelectedBoard('Search Results');
        const results = await searchMeritList({ student_name: initialSearchQuery });
        setMeritList(results);
        setLoading(false);
      } else if (initialBoard) {
        setSelectedBoard(initialBoard);
        setLoading(true);
        setView('list');
        const results = await searchMeritList({ board_type: initialBoard });
        setMeritList(results);
        setLoading(false);
      }
    };
    loadInitialBoard();
  }, [initialBoard, initialSearchQuery]);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setView('list');
    setSelectedBoard('Search Results');
    const results = await searchMeritList({ student_name: query });
    setMeritList(results);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      // Avoid searching on the very initial load if initialSearchQuery was already handled by the first useEffect
      if (searchQuery.trim()) {
        if (searchQuery.trim() !== initialSearchQuery) {
          handleSearch(searchQuery);
        }
      } else if (initialBoard) {
        // Carry on with initial board if search is empty
        handleBoardSelection(initialBoard);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, initialBoard, initialSearchQuery]);

  const handleStudentClick = (student: MeritRecord) => {
    setSelectedStudent(student);
    setView('profile');
  };

  const goBack = () => {
    if (view === 'profile') setView('list');
    else if (view === 'list') setView('boards');
    else if (onClose) onClose();
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <div className={`w-full max-w-4xl mx-auto h-full flex flex-col ${isInline ? '' : 'p-4'}`}>
      <div className="flex flex-col h-full gap-6">
        {/* Header - Matches FacultyExplorer Header Logic */}
        {view !== 'profile' && (!isInline || !initialBoard) && (
          <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              {view !== 'boards' && (
                <button 
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-700 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              {!isInline && (
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
              {view === 'boards' ? 'Academic Toppers' : selectedBoard}
            </h1>
          </div>
        )}

        {/* Search Bar - Real-time typing without search button */}
        {view !== 'profile' && (
          <div className="relative group flex-shrink-0">
            <input 
              type="text"
              placeholder="Search by student name or year..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/50 dark:bg-zinc-900/50 border-2 border-zinc-200 dark:border-white/10 rounded-[14px] px-6 py-4 pl-14 outline-none focus:border-zinc-500 transition-all font-space font-bold text-zinc-800 dark:text-white backdrop-blur-xl"
            />
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-zinc-500 transition-colors" />
          </div>
        )}

        <div className="flex-grow overflow-y-auto pr-2 no-scrollbar scrollbar-none pb-12">
          <AnimatePresence mode="wait">
            {view === 'boards' ? (
                  <motion.div 
                    key="boards-grid"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {DEFAULT_BOARDS.map((board) => (
                      <motion.button
                        key={board}
                        variants={itemVariants}
                        onClick={() => handleBoardSelection(board)}
                        className="flex items-center justify-between p-5 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-3xl shadow-sm text-left backdrop-blur-xl cursor-pointer"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl">
                            <GraduationCap className="w-6 h-6 text-zinc-600 dark:text-zinc-400" />
                          </div>
                          <span className="font-space font-bold text-sm uppercase tracking-tight dark:text-white leading-tight pr-4">
                            {board}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300" />
                      </motion.button>
                    ))}
                  </motion.div>
            ) : view === 'list' ? (
              <motion.div 
                key="list-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="flex items-center justify-center">
                  <span className="bg-zinc-100 dark:bg-[#18181d] text-zinc-500 dark:text-[#71717b] text-[10px] font-space font-bold uppercase tracking-widest rounded-lg flex items-center justify-center h-[30px] w-[305px] pr-3">
                    {meritList.length} Students Found
                  </span>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Searching Archives...</p>
                  </div>
                ) : meritList.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {meritList.slice(0, visibleCount).map((record, index) => (
                        <motion.div 
                          key={record.id}
                          ref={index === visibleCount - 1 ? lastElementRef : null}
                          initial={{ opacity: 0, y: 15 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-20px" }}
                          transition={{ duration: 0.4, ease: "easeOut" }}
                          onClick={() => handleStudentClick(record)}
                          className="w-full flex items-center gap-4 p-4 pr-5 bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-lg shadow-xl backdrop-blur-xl cursor-pointer max-w-[305px] md:max-w-full mx-auto md:mx-0"
                        >
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-zinc-100 dark:border-white/10 flex-shrink-0 bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center shadow-inner">
                            <User className="w-7 h-7 text-zinc-400 dark:text-zinc-500" />
                            {record.division === 'I' && (
                              <div className="absolute top-1 right-1 p-0.5 bg-green-500 rounded-full border border-zinc-900 shadow-sm">
                                <Star className="w-2 h-2 text-white fill-white" />
                              </div>
                            )}
                          </div>
  
                          <div className="flex-grow min-w-0">
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-white truncate font-space uppercase tracking-tight">
                              {record.student_name}
                            </h3>
                            
                            <div className="flex items-center gap-2 text-zinc-500 dark:text-[#71717b] font-space font-bold uppercase tracking-[0.2em] text-[10px]">
                              {record.position_in_college && (
                                <span className="text-zinc-500 dark:text-[#71717b]">RANK {record.position_in_college}</span>
                              )}
                              {record.position_in_college && <span>•</span>}
                              <span>SESSION {record.exam_year}</span>
                            </div>
                          </div>
  
                          <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-[#eeeeef] transition-colors" />
                        </motion.div>
                      ))}
                      {visibleCount < meritList.length && (
                        <div className="flex items-center justify-center py-4">
                          <div className="w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="p-5 bg-zinc-100 dark:bg-white/5 rounded-full">
                      <Search className="w-10 h-10 text-zinc-300" />
                    </div>
                    <div>
                      <h4 className="font-black text-lg uppercase tracking-tighter dark:text-white">No records found</h4>
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mt-1">Try a different year or broader name</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="profile-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="space-y-6"
              >
                {/* Profile Header */}
                <div className="flex items-center gap-3 mb-4">
                  <button 
                    onClick={goBack}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>
                  <h2 className="text-lg sm:text-lg md:text-2xl font-space font-bold text-zinc-900 dark:text-white uppercase tracking-tighter leading-tight">
                    Merit Profile
                  </h2>
                </div>

                {/* Profile Card - Exact Match to Faculty Profile Styling */}
                <div className="relative group/profile">
                  <div className="w-full aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/5 relative bg-zinc-900 flex items-center justify-center">
                    <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-950"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-transparent"></div>
                    
                    {/* Topper image as profile avatar filling the container */}
                    <img 
                      src="/topper.jpg" 
                      alt={selectedStudent?.student_name}
                      className="w-full h-full object-cover relative z-10"
                    />
                    
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40 z-20"></div>
                  </div>
                </div>

                {/* Achievement Details */}
                <div className="grid grid-cols-1 gap-4">
                  {[
                    { icon: User, label: "Full Name", value: selectedStudent?.student_name, color: 'text-zinc-400' },
                    { icon: Award, label: "Merit Position", value: selectedStudent?.position_in_college ? `College Rank ${selectedStudent.position_in_college}` : null, color: 'text-amber-400' },
                    { icon: Trophy, label: 'Performance Summary', value: selectedStudent?.remarks, color: 'text-zinc-400' },
                    { icon: Calendar, label: 'Exam Session', value: selectedStudent?.exam_year, color: 'text-zinc-400' },
                    { icon: Medal, label: 'Division', value: selectedStudent?.division ? `${selectedStudent.division} Division` : null, color: 'text-emerald-400' },
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
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest leading-none mb-1">{item.label}</div>
                        <div className="text-sm font-bold text-zinc-900 dark:text-white tracking-tight font-space">{item.value}</div>
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

// Helper inside components
function BadgeCheck({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.74z"></path><path d="m9 12 2 2 4-4"></path></svg>
  );
}
