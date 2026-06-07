'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { Plus, Trash2, Save, Upload, Loader2, BookOpen, Users, FileText, ExternalLink, Calendar, User, Edit2, Check, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AdmissionManager() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    total_seats: 0,
    convener_name: '',
    convener_contact: '',
    admission_start_date: '',
    admission_last_date: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const cData = await adminService.getCourses();
        setCourses(cData);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const refreshData = async () => {
    try {
      const cData = await adminService.getCourses();
      setCourses(cData);
    } catch (err) {
      console.error(err);
    }
  };

  const startEdit = (course: any) => {
    setEditingId(course.id);
    setEditForm({
      total_seats: course.total_seats || 0,
      convener_name: course.convener_name || '',
      convener_contact: course.convener_contact || '',
      admission_start_date: course.admission_start_date || '',
      admission_last_date: course.admission_last_date || ''
    });
  };

  const handleSaveCourse = async (id: string) => {
    try {
      await adminService.updateCourse(id, editForm);
      setEditingId(null);
      refreshData();
    } catch (err) {
      console.error(err);
      alert('Failed to update course');
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-blue-500" />
          Admission & Courses 2026-27
        </h3>
      </div>

      <div className="grid grid-cols-1 gap-6">
          {courses.map((course) => {
            const isEditing = editingId === course.id;
            return (
              <div key={course.id} className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 hover:border-blue-500/30 transition-all group">
                {isEditing ? (
                  // Edit Form Mode
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-xl font-bold text-white">Edit {course.name}</h4>
                      <span className="px-3 py-1 bg-blue-600/10 text-blue-400 text-[10px] font-bold uppercase rounded-full border border-blue-500/20">
                        {course.stream}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-400 font-bold uppercase">Total Seats</label>
                        <input 
                          type="number"
                          className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                          value={editForm.total_seats}
                          onChange={e => setEditForm({...editForm, total_seats: parseInt(e.target.value) || 0})}
                        />
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-400 font-bold uppercase">Convener Name</label>
                        <input 
                          type="text"
                          className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                          value={editForm.convener_name}
                          onChange={e => setEditForm({...editForm, convener_name: e.target.value})}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-400 font-bold uppercase">Convener Contact</label>
                        <input 
                          type="text"
                          className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                          value={editForm.convener_contact}
                          onChange={e => setEditForm({...editForm, convener_contact: e.target.value})}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-xs text-zinc-400 font-bold uppercase">Admission Start Date</label>
                        <input 
                          type="date"
                          className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                          value={editForm.admission_start_date}
                          onChange={e => setEditForm({...editForm, admission_start_date: e.target.value})}
                        />
                      </div>

                      <div className="flex flex-col gap-1 md:col-span-2">
                        <label className="text-xs text-zinc-400 font-bold uppercase">Admission Last Date</label>
                        <input 
                          type="date"
                          className="bg-zinc-900 border border-zinc-700 rounded-xl p-3 text-white outline-none focus:border-blue-500"
                          value={editForm.admission_last_date}
                          onChange={e => setEditForm({...editForm, admission_last_date: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-zinc-800">
                      <button 
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 rounded-xl text-xs font-bold text-zinc-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <X className="w-4 h-4" /> Cancel
                      </button>
                      <button 
                        onClick={() => handleSaveCourse(course.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" /> Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  // Display Mode
                  <div>
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h4 className="text-xl font-bold text-white">{course.name}</h4>
                          <span className="px-3 py-1 bg-blue-600/10 text-blue-400 text-[10px] font-bold uppercase rounded-full border border-blue-500/20">
                            {course.stream}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-500 text-sm">
                          <Users className="w-4 h-4" />
                          <span>{course.total_seats} Total Seats</span>
                        </div>
                      </div>
                      
                      <button 
                        onClick={() => startEdit(course)}
                        className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Course
                      </button>
                    </div>

                    {/* Convener & Admission Dates info boxes */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-zinc-800/25 border border-zinc-800/50 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center text-blue-400">
                          <User className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase">Convener Detail</div>
                          <div className="text-sm font-bold text-zinc-200">
                            {course.convener_name || 'Not Assigned'}
                          </div>
                          {course.convener_contact && (
                            <div className="text-xs text-zinc-400">{course.convener_contact}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-zinc-800 rounded-xl flex items-center justify-center text-blue-400">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-[10px] text-zinc-500 font-bold uppercase">Admission Schedule</div>
                          <div className="text-sm font-bold text-zinc-200">
                            {course.admission_start_date && course.admission_last_date ? (
                              <span>{new Date(course.admission_start_date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'})} - {new Date(course.admission_last_date).toLocaleDateString('en-IN', {day: 'numeric', month: 'short', year: 'numeric'})}</span>
                            ) : (
                              <span className="text-zinc-500 font-medium">Not Scheduled</span>
                            )}
                          </div>
                          {course.admission_last_date && (
                            <div className="text-xs text-rose-400 font-bold">Last Date: {new Date(course.admission_last_date).toLocaleDateString('en-IN')}</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-2">Optional Papers / Subjects</div>
                      <div className="flex flex-wrap gap-2">
                        {course.subjects?.map((sub: string, i: number) => (
                          <span key={i} className="px-3 py-1.5 bg-zinc-800/50 text-zinc-300 text-xs rounded-xl border border-zinc-700/50">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

    </div>
  );
}
