'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Upload, CheckCircle2, Loader2, X, ChevronRight, User, GraduationCap, School, Calendar } from 'lucide-react';
import { StudentProfile } from '../types';
import { generateChatResponseStream } from '@/modules/chat/services/lohiacollegeai';
import { supabase } from '@/lib/supabase';

interface ProfileFormProps {
  initialData?: StudentProfile | null;
  onSave: (data: StudentProfile) => void;
  onCancel: () => void;
}

export const ProfileForm = ({ initialData, onSave, onCancel }: ProfileFormProps) => {
  const [formData, setFormData] = useState<Partial<StudentProfile>>(initialData || {
    status: 'Collegiate',
    level: 'Graduate',
    semester: '1'
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileAction = async (file: File) => {
    setIsProcessing(true);
    try {
      // OCR LAYER: Ask AI to extract details
      const stream = generateChatResponseStream(
        [],
        "EXTRACT_ID_CARD_INFO: Please look at this ID card and extract: Name, Collegiate/Non-Collegiate status, Graduate/Post Graduate level, and Semester/Year. Return ONLY a JSON object with these keys.",
        file
      );

      let fullText = "";
      for await (const chunk of stream) {
        if (chunk.text) fullText += chunk.text;
      }

      // Parse JSON from AI response
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        setFormData(prev => ({
          ...prev,
          name: extracted.name || prev.name,
          status: extracted.status || prev.status,
          level: extracted.level || prev.level,
          semester: extracted.semester?.toString() || prev.semester
        }));
      }
    } catch (error) {
      console.error('Lohia AI: Document scan failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.level || !formData.semester) return;

    const finalData: StudentProfile = {
      ...(formData as StudentProfile),
      lastUpdated: new Date().toISOString()
    };

    // Save to Supabase (Optional/Silent)
    try {
      await supabase.from('student_profiles').upsert([{
        full_name: finalData.name,
        college_status: finalData.status,
        level: finalData.level,
        semester: finalData.semester,
        user_email: 'anonymous@lohia.edu' // Fallback for now
      }], { onConflict: 'user_email' });
    } catch (e) {
      console.error('Lohia AI: Profile sync failed silently.');
    }

    onSave(finalData);
  };

  const getSemesterOptions = () => {
    return formData.level === 'Post Graduate' ? ['1', '2', '3', '4'] : ['1', '2', '3', '4', '5', '6'];
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-white dark:bg-[#171717] w-full min-h-full pb-8"
    >
      <div className="w-full p-6 md:p-12">
        <div className="flex items-center justify-between mb-12 pb-8 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-black dark:text-white tracking-tight">Student Profile</h2>
            <p className="text-sm text-zinc-500 mt-1">Manage your academic identity and basic details</p>
          </div>
          <button
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-full text-sm font-medium text-zinc-600 dark:text-zinc-300 transition-all"
          >
            <X className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Left Column: Smart Scan */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Identity Verification</h3>
              <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-950 dark:text-zinc-50 border border-zinc-200 dark:border-zinc-800">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-black dark:text-white block">Smart Identity Scan</span>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest">AI Document Analysis</span>
                  </div>
                </div>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full aspect-video border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl flex flex-col items-center justify-center gap-4 hover:border-black dark:hover:border-white hover:bg-zinc-50/50 dark:hover:bg-white/5 transition-all group overflow-hidden relative cursor-pointer"
                >
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-3 text-center px-4">
                      <Loader2 className="w-8 h-8 text-zinc-600 dark:text-zinc-400 animate-spin" />
                      <span className="text-xs text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-widest animate-pulse">Scanning Document...</span>
                    </div>
                  ) : (
                    <>
                      <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl group-hover:scale-110 transition-transform">
                        <Upload className="w-6 h-6 text-zinc-400 group-hover:text-black dark:group-hover:text-white" />
                      </div>
                      <div className="text-center px-4">
                        <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors">Upload ID Card</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">System will auto-populate the form</p>
                      </div>
                    </>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileAction(e.target.files[0])}
                  />
                </button>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4">
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                <strong className="text-zinc-900 dark:text-zinc-200 font-space">Why verify?</strong> Verified profiles get faster responses, customized exam resources, and priority support.
              </p>
            </div>
          </div>

          {/* Right Column: Manual Entry */}
          <div className="lg:col-span-7">
            <h3 className="text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Personal Details</h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Full Name</label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-zinc-950 dark:group-focus-within:text-zinc-50 transition-colors" />
                  <input
                    required
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    className="w-full bg-zinc-50 dark:bg-[#202020] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3.5 pl-12 pr-4 text-sm text-black dark:text-white focus:border-black dark:focus:border-white focus:ring-1 focus:ring-black dark:focus:ring-white outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-medium font-space"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">College Status</label>
                  <div className="relative">
                    <School className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full bg-zinc-50 dark:bg-[#202020] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3.5 pl-12 pr-10 text-sm text-black dark:text-white appearance-none focus:border-black dark:focus:border-white outline-none transition-all font-medium font-space"
                    >
                      <option value="Collegiate">Collegiate (Regular)</option>
                      <option value="Non-Collegiate">Non-Collegiate (Private)</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 rotate-90 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Academic Level</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                      className="w-full bg-zinc-50 dark:bg-[#202020] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3.5 pl-12 pr-10 text-sm text-black dark:text-white appearance-none focus:border-black dark:focus:border-white outline-none transition-all font-medium font-space"
                    >
                      <option value="Graduate">Under Graduate (UG)</option>
                      <option value="Post Graduate">Post Graduate (PG)</option>
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 rotate-90 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Current Semester / Year</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-[#202020] border border-zinc-200 dark:border-zinc-800 rounded-xl py-3.5 pl-12 pr-10 text-sm text-black dark:text-white appearance-none focus:border-black dark:focus:border-white outline-none transition-all font-medium font-space"
                    >
                      {getSemesterOptions().map(sem => (
                        <option key={sem} value={sem}>Semester/Year {sem}</option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 rotate-90 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 font-bold h-14 rounded-xl shadow-lg transition-all flex items-center justify-center gap-3 font-space uppercase tracking-wider cursor-pointer active:scale-[0.98]"
                >
                  <span>{initialData ? 'Update Profile' : 'Complete Setup'}</span>
                  <CheckCircle2 className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
