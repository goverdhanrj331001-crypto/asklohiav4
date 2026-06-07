import { supabase } from '@/lib/supabase';

export const adminService = {
  // Faculty CRUD
  getFaculty: async () => {
    const { data, error } = await supabase.from('faculty').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  addFaculty: async (faculty: any) => {
    const { data, error } = await supabase.from('faculty').insert([faculty]);
    if (error) throw error;
    return data;
  },
  updateFaculty: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('faculty').update(updates).eq('id', id);
    if (error) throw error;
    return data;
  },
  deleteFaculty: async (id: string) => {
    const { error } = await supabase.from('faculty').delete().eq('id', id);
    if (error) throw error;
  },

  // Events CRUD
  getEvents: async () => {
    const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (error) throw error;
    return data;
  },
  addEvent: async (event: any) => {
    const { data, error } = await supabase.from('events').insert([event]);
    if (error) throw error;
    return data;
  },
  updateEvent: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('events').update(updates).eq('id', id);
    if (error) throw error;
    return data;
  },
  deleteEvent: async (id: string) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  },

  // College Info CRUD
  getCollegeInfo: async () => {
    const { data, error } = await supabase.from('college_info').select('*');
    if (error) throw error;
    return data;
  },
  updateCollegeInfo: async (key: string, value: string, image_url?: string) => {
    const { data, error } = await supabase.from('college_info').upsert({ key, value, image_url }, { onConflict: 'key' });
    if (error) throw error;
    return data;
  },

  // College Knowledge (Long Text)
  getSections: async () => {
    const { data, error } = await supabase.from('college_knowledge').select('*');
    if (error) throw error;
    return data.map((d: any) => ({ ...d, key: d.search_key }));
  },
  updateSection: async (key: string, updates: any) => {
    const { data, error } = await supabase.from('college_knowledge').upsert({ search_key: key, category: 'General Info', title: updates.title, content: updates.content }, { onConflict: 'search_key' });
    if (error) throw error;
    return data;
  },

  // Past Principals
  getPastPrincipals: async () => {
    const { data, error } = await supabase.from('past_principals').select('*').order('order_index', { ascending: true });
    if (error) throw error;
    return data;
  },
  addPastPrincipal: async (principal: any) => {
    const { data, error } = await supabase.from('past_principals').insert([principal]);
    if (error) throw error;
    return data;
  },
  deletePastPrincipal: async (id: string) => {
    const { error } = await supabase.from('past_principals').delete().eq('id', id);
    if (error) throw error;
  },

  // Achievements
  getAchievements: async () => {
    const { data, error } = await supabase.from('achievements').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  addAchievement: async (achievement: any) => {
    const { data, error } = await supabase.from('achievements').insert([achievement]);
    if (error) throw error;
    return data;
  },
  deleteAchievement: async (id: string) => {
    const { error } = await supabase.from('achievements').delete().eq('id', id);
    if (error) throw error;
  },

  // EXAM SYSTEM
  getExamSubjects: async (department: string) => {
    const { data, error } = await supabase.from('exam_subjects').select('*').eq('department', department);
    if (error) throw error;
    return data;
  },

  // Main Exams
  getMainExams: async (filters: any) => {
    let query = supabase.from('main_exams').select('*');
    Object.keys(filters).forEach(key => {
      if (filters[key]) query = query.eq(key, filters[key]);
    });
    const { data, error } = await query.order('exam_date', { ascending: true }).order('exam_time', { ascending: true });
    if (error) throw error;
    return data;
  },
  addMainExam: async (exam: any) => {
    const { data, error } = await supabase.from('main_exams').insert([exam]);
    if (error) throw error;
    return data;
  },

  // Study Materials
  getStudyMaterials: async (filters: any) => {
    let query = supabase.from('study_materials').select('*');
    Object.keys(filters).forEach(key => {
      if (filters[key]) query = query.eq(key, filters[key]);
    });
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },
  addStudyMaterial: async (material: any) => {
    const { data, error } = await supabase.from('study_materials').insert([material]);
    if (error) throw error;
    return data;
  },

  // Practical Exam Batches
  getPracticalBatches: async (filters: any) => {
    let query = supabase.from('practical_batches').select('*');
    Object.keys(filters).forEach(key => {
      if (filters[key]) query = query.eq(key, filters[key]);
    });
    const { data, error } = await query.order('exam_date', { ascending: true });
    if (error) throw error;
    return data;
  },
  addPracticalBatch: async (batch: any) => {
    const { data, error } = await supabase.from('practical_batches').insert([batch]).select();
    if (error) throw error;
    return data[0];
  },

  // Practical Students
  getPracticalStudents: async (batchId: string) => {
    const { data, error } = await supabase.from('practical_students').select('*').eq('batch_id', batchId).order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },
  addPracticalStudent: async (student: any) => {
    const { data, error } = await supabase.from('practical_students').insert([student]);
    if (error) throw error;
    return data;
  },

  // Courses
  getCourses: async () => {
    const { data, error } = await supabase.from('courses').select('*').order('stream', { ascending: true });
    if (error) throw error;
    return data;
  },
  updateCourse: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('courses').update(updates).eq('id', id);
    if (error) throw error;
    return data;
  },

  // Admission Info removed as per user
  // Knowledge Base (FAQ) CRUD
  getKnowledgeBase: async () => {
    const { data, error } = await supabase.from('college_faqs').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  addKnowledgeBase: async (item: any) => {
    const { data, error } = await supabase.from('college_faqs').insert([item]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  updateKnowledgeBase: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('college_faqs').update(updates).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  deleteKnowledgeBase: async (id: string) => {
    const { error } = await supabase.from('college_faqs').delete().eq('id', id);
    if (error) throw error;
  },

  // Materials CRUD
  getMaterials: async () => {
    const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  addMaterial: async (material: any) => {
    const { data, error } = await supabase.from('materials').insert([material]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  deleteMaterial: async (id: string) => {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) throw error;
  },

  // AI Knowledge Items
  getKnowledgeItems: async () => {
    const { data, error } = await supabase.from('knowledge_items').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
  addKnowledgeItem: async (item: any) => {
    const { data, error } = await supabase.from('knowledge_items').insert([item]).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  updateKnowledgeItem: async (id: string, updates: any) => {
    const { data, error } = await supabase.from('knowledge_items').update(updates).eq('id', id).select();
    if (error) throw error;
    return data ? data[0] : null;
  },
  deleteKnowledgeItem: async (id: string) => {
    const { error } = await supabase.from('knowledge_items').delete().eq('id', id);
    if (error) throw error;
  }
};
