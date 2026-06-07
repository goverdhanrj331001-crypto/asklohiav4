'use client';

import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, Calendar, GraduationCap, FileText, UserCircle } from 'lucide-react';
import { StudentProfile } from '@/modules/profile/types';

interface PredictiveActionsProps {
  profile?: StudentProfile;
  onAction: (query: string) => void;
}

export const PredictiveActions = ({ profile, onAction }: PredictiveActionsProps) => {
  const actions = [
    { id: 'principal', label: 'Principal Kaun Hai?', icon: UserCircle, query: 'College ki principal kaun hai?' },
    { id: 'exams', label: 'Exam Dates', icon: Calendar, query: 'Main exam 2026 kab hai?' },
    { id: 'material', label: 'Study Material', icon: BookOpen, query: 'Study material aur practical files download' },
  ];

  // Contextual suggestions based on profile
  if (profile) {
    if (profile.semester === '1' || profile.semester === '2') {
      actions.unshift({ id: 'sem1', label: 'Sem 1 Syllabus', icon: FileText, query: `${profile.level} semester ${profile.semester} ka syllabus dikhao` });
    }
    if (profile.level === 'Graduate') {
      actions.push({ id: 'scholarship', label: 'Scholarship Schemes', icon: GraduationCap, query: 'Merit scholarship aur Scooty vittaran ki jankari' });
    }
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
      {actions.map((action, index) => (
        <motion.button
          key={action.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          onClick={() => onAction(action.query)}
          className="flex items-center gap-2 md:gap-3 p-1 md:p-1.5 pr-3 md:pr-4 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800/50 rounded-2xl whitespace-nowrap hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all group shadow-xl"
        >
          <div className="w-8 h-8 md:w-10 md:h-10 bg-zinc-100/50 dark:bg-zinc-800/50 rounded-xl flex items-center justify-center border border-zinc-200/30 dark:border-zinc-700/30 group-hover:bg-zinc-200/50 dark:group-hover:bg-zinc-700/50 transition-colors">
            <action.icon className="w-4 h-4 md:w-5 md:h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
          </div>
          <span className="text-xs md:text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors tracking-tight">{action.label}</span>
        </motion.button>
      ))}
    </div>
  );
};
