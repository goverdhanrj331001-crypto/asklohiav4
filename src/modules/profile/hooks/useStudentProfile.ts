'use client';

import { useState, useEffect, useCallback } from 'react';
import { StudentProfile } from '../types';

const STORAGE_KEY = 'lohia_student_profile';

export function useStudentProfile() {
  const [profile, setProfile] = useState<StudentProfile | null>(null);

  useEffect(() => {
    const init = async () => {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          setProfile(JSON.parse(saved));
        } catch (e) {
          console.error('Failed to parse profile', e);
        }
      }
    };
    init();
  }, []);

  const updateProfile = useCallback((updates: Partial<StudentProfile>) => {
    setProfile(prev => {
      const updated = prev ? { ...prev, ...updates } : (updates as StudentProfile);
      updated.lastUpdated = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return { ...updated };
    });
  }, []);

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
  }, []);

  return {
    profile,
    updateProfile,
    clearProfile,
    isProfileSet: !!profile?.semester
  };
}
