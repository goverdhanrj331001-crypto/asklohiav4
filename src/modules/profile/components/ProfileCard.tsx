'use client';

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { StudentProfile } from '../types';
import { Settings, LogOut, Edit3 } from 'lucide-react';

interface ProfileCardProps {
  profile: StudentProfile | null;
  onClear: () => void;
  onEdit: () => void;
}

export const ProfileCard = ({ profile, onClear, onEdit }: ProfileCardProps) => {
  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: 20 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className="bg-zinc-900/80 backdrop-blur-xl border border-blue-500/20 rounded-[2rem] p-5 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-[50px] -z-10"></div>
      
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">
            {profile.name?.[0] || 'S'}
          </div>
          <div>
            <div className="text-[10px] text-blue-400 font-black uppercase tracking-widest leading-none mb-1">Authenticated Student</div>
            <div className="text-base font-black text-white uppercase tracking-tight truncate max-w-[140px]">
              {profile.name || 'Student'}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onEdit}
            className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500 hover:text-blue-400"
            title="Edit Profile"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button 
            onClick={onClear}
            className="p-2 hover:bg-zinc-800 rounded-xl transition-colors text-zinc-500 hover:text-red-400"
            title="Clear Profile"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-2.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/30">
          <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Status</div>
          <div className="text-[10px] text-zinc-200 font-black uppercase">{profile.status}</div>
        </div>
        <div className="p-2.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/30">
          <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Semester</div>
          <div className="text-[10px] text-zinc-200 font-black uppercase">SEM {profile.semester}</div>
        </div>
        <div className="p-2.5 rounded-2xl bg-zinc-800/40 border border-zinc-700/30 col-span-2">
          <div className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Course Level</div>
          <div className="text-[10px] text-white font-black uppercase">{profile.level}</div>
        </div>
      </div>

      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></div>
          <span className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Active Profile</span>
        </div>
        <div className="text-[8px] text-zinc-600 font-bold">
          {new Date(profile.lastUpdated).toLocaleDateString()}
        </div>
      </div>
    </motion.div>
  );
};
