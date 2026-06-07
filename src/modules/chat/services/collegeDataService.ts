import { supabase } from '@/lib/supabase';

export interface Faculty {
  id: string;
  name: string;
  father_name?: string;
  designation: string;
  subject?: string;
  qualification?: string;
  dob?: string;
  seniority_no?: string;
  email?: string;
  mobile_no?: string;
  specialization?: string;
  department: string;
  service_start_date?: string;
  college_join_date?: string;
  image_url?: string;
}

export interface CollegeEvent {
  id: string;
  title: string;
  date: string;
  description: string;
}

export interface CollegeInfo {
  key: string;
  value: string;
  image_url?: string;
}

import Fuse from 'fuse.js';

const FACULTY_QUERY_STOP_WORDS = new Set([
  'what', 'whats', 'is', 'the', 'of', 'for', 'sir', 'mam', 'madam', 'maam', 'ji',
  'dr', 'prof', 'professor', 'sh', 'shri', 'smt', 'ms', 'mrs', 'mr', 'teacher',
  'faculty', 'qualification', 'degree', 'contact', 'number', 'phone', 'mobile',
  'email', 'mail', 'joining', 'join', 'date', 'college', 'service', 'father',
  'name', 'subject', 'department', 'designation', 'batao', 'kya', 'hai', 'ka',
  'ki', 'ke', 'kon', 'kaun', 'mam', 'of', 'ol', 'waht', 'hat', 'tell', 'me'
]);

const cleanFacultyNameQuery = (value: string) => {
  const normalized = value
    .replace(/[?.,:;()"'`]/g, ' ')
    .replace(/\b(qualification|degree|contact number|contact|phone number|phone|mobile number|mobile|email|mail|joining date|joining|join date|college join date|service start date|service date|father name|father|subject|department|designation)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const words = normalized
    .split(/\s+/)
    .filter(word => word.length > 1 && !FACULTY_QUERY_STOP_WORDS.has(word.toLowerCase()));

  return words.join(' ').trim() || value.trim();
};

const GENERIC_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'about', 'batao', 'bataiye', 'college', 'de', 'detail',
  'details', 'do', 'for', 'hai', 'hain', 'he', 'in', 'is', 'ka', 'ke', 'ki', 'ko',
  'lohia', 'me', 'mein', 'mujhe', 'of', 'on', 'please', 'show', 'the', 'to', 'what',
  'who', 'with', 'ya', 'ye', 'yeh', 'kya', 'kaun', 'kon', 'kab', 'kaha', 'kahan',
  'list', 'search', 'find', 'info', 'information', 'name', 'naam'
]);

const cleanForPostgrest = (value: string) =>
  value.replace(/[%,().:"'\\]/g, ' ').replace(/\s+/g, ' ').trim();

const getSearchTerms = (query: string) => {
  const clean = cleanForPostgrest(query).toLowerCase();
  const words = clean.split(/\s+/).filter(word => word.length > 2 && !GENERIC_STOP_WORDS.has(word));
  const yearMatches = query.match(/\b(19\d{2}|20\d{2})\b/g) || [];
  return Array.from(new Set([...yearMatches, ...words])).slice(0, 7);
};

const buildOrFilter = (columns: string[], terms: string[]) =>
  terms.flatMap(term => columns.map(column => `${column}.ilike.%${term}%`)).join(',');

const compactRows = (rows: any[] | null | undefined, table: string, fields: string[]) =>
  (rows || []).map((row: any) => {
    const item: Record<string, any> = { table };
    fields.forEach(field => {
      const value = row?.[field];
      if (value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)) {
        item[field] = value;
      }
    });
    return item;
  });

const runSearch = async (
  table: string,
  columns: string[],
  selectFields: string,
  terms: string[],
  outputFields: string[],
  order?: { column: string; ascending?: boolean },
  limit = 12
) => {
  if (terms.length === 0) return [];

  try {
    let query = supabase.from(table).select(selectFields).or(buildOrFilter(columns, terms));
    if (order) query = query.order(order.column, { ascending: order.ascending ?? false });
    const { data, error } = await query.limit(limit);
    if (error) {
      console.error(`Universal search failed for ${table}:`, error);
      return [];
    }
    return compactRows(data, table, outputFields);
  } catch (error) {
    console.error(`Universal search crashed for ${table}:`, error);
    return [];
  }
};

export const searchAllCollegeData = async (query: string) => {
  const terms = getSearchTerms(query);
  if (terms.length === 0) return [];

  const searches = await Promise.all([
    runSearch('college_faqs', ['question', 'answer', 'category'], 'id, question, answer, category, created_at', terms, ['question', 'answer', 'category']),
    runSearch('college_knowledge', ['title', 'content', 'category', 'search_key'], 'id, category, search_key, title, content, image_url, created_at', terms, ['category', 'search_key', 'title', 'content', 'image_url']),
    runSearch('knowledge_items', ['title', 'summary', 'answer_text', 'search_text', 'category'], 'id, title, summary, answer_text, category, tags, main_file, attachments, created_at', terms, ['title', 'summary', 'answer_text', 'category', 'tags', 'main_file', 'attachments'], { column: 'created_at', ascending: false }, 8),
    runSearch('faculty', ['name', 'department', 'designation', 'subject', 'qualification', 'specialization'], 'id, name, father_name, department, designation, subject, qualification, mobile_no, email, specialization, image_url', terms, ['name', 'father_name', 'department', 'designation', 'subject', 'qualification', 'mobile_no', 'email', 'specialization', 'image_url']),
    runSearch('courses', ['name', 'stream', 'convener_name'], 'id, name, stream, subjects, total_seats, admission_start_date, admission_last_date, convener_name, convener_contact', terms, ['name', 'stream', 'subjects', 'total_seats', 'admission_start_date', 'admission_last_date', 'convener_name', 'convener_contact']),
    runSearch('main_exams', ['department', 'status', 'level', 'subject', 'paper'], 'id, department, status, level, semester, subject, paper, exam_date, exam_time', terms, ['department', 'status', 'level', 'semester', 'subject', 'paper', 'exam_date', 'exam_time'], { column: 'exam_date', ascending: true }),
    runSearch('study_materials', ['department', 'status', 'level', 'material_type', 'title'], 'id, department, status, level, semester, material_type, title, file_url, file_type, created_at', terms, ['department', 'status', 'level', 'semester', 'material_type', 'title', 'file_url', 'file_type']),
    runSearch('materials', ['title'], 'id, title, files, created_at', terms, ['title', 'files']),
    runSearch('academic_alerts', ['title', 'description', 'target_stream', 'type'], 'id, title, description, type, target_stream, attachments, created_at', terms, ['title', 'description', 'type', 'target_stream', 'attachments', 'created_at']),
    runSearch('events', ['title', 'description', 'category', 'speakers'], 'id, title, date, time, category, speakers, description, image_url', terms, ['title', 'date', 'time', 'category', 'speakers', 'description', 'image_url'], { column: 'date', ascending: false }),
    runSearch('gallery', ['title', 'category', 'type'], 'id, title, category, type, media_url, media_urls, created_at', terms, ['title', 'category', 'type', 'media_url', 'media_urls']),
    runSearch('achievements', ['title', 'student_name', 'description', 'category', 'year'], 'id, category, title, student_name, description, year, image_url, created_at', terms, ['category', 'title', 'student_name', 'description', 'year', 'image_url']),
    runSearch('college_merit_list', ['student_name', 'board_type', 'exam_year', 'division', 'position_in_college', 'remarks'], 'id, board_type, exam_year, student_name, division, position_in_college, remarks', terms, ['board_type', 'exam_year', 'student_name', 'division', 'position_in_college', 'remarks'], { column: 'exam_year', ascending: false }),
    runSearch('sports', ['student_name', 'sport', 'category', 'year', 'division', 'position_in_college', 'remarks'], 'id, category, year, student_name, sport, division, position_in_college, remarks', terms, ['category', 'year', 'student_name', 'sport', 'division', 'position_in_college', 'remarks'], { column: 'year', ascending: false }),
    runSearch('past_principals', ['name', 'from_date', 'to_date', 'bio'], 'id, name, from_date, to_date, bio, image_url, order_index', terms, ['name', 'from_date', 'to_date', 'bio', 'image_url', 'order_index'], { column: 'order_index', ascending: true }),
    runSearch('practical_batches', ['department', 'status', 'level', 'batch_no'], 'id, department, status, level, semester, batch_no, exam_date, exam_time', terms, ['department', 'status', 'level', 'semester', 'batch_no', 'exam_date', 'exam_time'], { column: 'exam_date', ascending: true }),
    runSearch('practical_students', ['roll_no', 'name', 'father_name', 'seat_no', 'category'], 'id, roll_no, name, father_name, seat_no, category, batch_id', terms, ['roll_no', 'name', 'father_name', 'seat_no', 'category', 'batch_id'])
  ]);

  const combined = searches.flat();
  if (combined.length <= 1) return combined;

  const fuse = new Fuse(combined, {
    keys: [
      'question', 'answer', 'title', 'content', 'category', 'search_key', 'name',
      'student_name', 'department', 'designation', 'subject', 'paper', 'sport',
      'board_type', 'exam_year', 'remarks', 'description', 'stream', 'summary',
      'answer_text', 'tags'
    ],
    threshold: 0.65,
    ignoreLocation: true
  });

  const ranked = fuse.search(query).map(result => result.item);
  return (ranked.length > 0 ? ranked : combined).slice(0, 30);
};

export const searchKnowledgeItems = async (query?: string) => {
  try {
    let queryBuilder = supabase
      .from('knowledge_items')
      .select('id, title, summary, answer_text, category, tags, main_file, attachments, created_at')
      .eq('is_active', true);

    if (query && query.trim().length > 0) {
      const terms = getSearchTerms(query);
      if (terms.length > 0) {
        queryBuilder = queryBuilder.or(buildOrFilter(['title', 'summary', 'answer_text', 'search_text', 'category'], terms));
      }
    }

    const { data, error } = await queryBuilder.order('created_at', { ascending: false }).limit(12);
    if (error) throw error;
    if (!data) return [];

    if (query && query.trim().length > 0 && data.length > 1) {
      const fuse = new Fuse(data, {
        keys: ['title', 'summary', 'answer_text', 'category', 'tags'],
        threshold: 0.55,
        ignoreLocation: true
      });
      const ranked = fuse.search(query).map(result => result.item);
      return (ranked.length > 0 ? ranked : data).slice(0, 8);
    }

    return data;
  } catch (error) {
    console.error("Error searching knowledge items:");
    return [];
  }
};

export const searchFaculty = async (params: { department?: string, subject?: string, designation?: string, name?: string }) => {
  try {
    let query = supabase.from('faculty').select('id, name, father_name, department, designation, subject, qualification, dob, seniority_no, image_url, mobile_no, email, specialization, service_start_date, college_join_date');
    
    if (params.department) {
      query = query.ilike('department', `%${params.department}%`);
    }
    if (params.designation) {
      query = query.ilike('designation', `%${params.designation}%`);
    }
    if (params.subject) {
      query = query.or(`subject.ilike.%${params.subject}%,department.ilike.%${params.subject}%`);
    }

    // Apply semantic mapping to clean up physical queries
    let searchName = params.name ? cleanFacultyNameQuery(params.name) : '';
    if (searchName) {
      const lower = searchName.toLowerCase();
      if (lower.includes('umesh') || lower.includes('umesd') || lower.includes('umed')) {
        searchName = 'Umed Singh Gothwal';
      } else if (lower.includes('gotwal')) {
        searchName = searchName.replace(/gotwal/gi, 'Gothwal');
      } else if (lower.includes('manju')) {
        searchName = 'Manju Sharma';
      }
    }

    // If a name is searched, we query-level constraint to select only likely matches
    if (searchName) {
      const parts = searchName.split(/\s+/).filter(Boolean);
      if (parts.length > 0) {
        const orClauses = parts.map(p => `name.ilike.%${p}%,specialization.ilike.%${p}%,department.ilike.%${p}%,subject.ilike.%${p}%`).join(',');
        query = query.or(orClauses);
      }
    }

    const { data: faculty, error } = await query.limit(100);
    if (error) {
      console.error("Supabase error searching faculty:", error);
      throw error;
    }
    if (!faculty) return [];

    let results = faculty;

    if (searchName) {
      const fuse = new Fuse(results, {
        keys: [
          { name: 'name', weight: 0.75 },
          { name: 'department', weight: 0.1 },
          { name: 'subject', weight: 0.1 },
          { name: 'specialization', weight: 0.05 }
        ],
        threshold: 0.52,
        distance: 120,
        ignoreLocation: true
      });
      results = fuse.search(searchName).map(r => r.item);
    }
    
    if (params.subject && results.length > 0) {
      results = results.filter(f => 
        (f.subject || '').toLowerCase().includes(params.subject!.toLowerCase()) ||
        (f.department || '').toLowerCase().includes(params.subject!.toLowerCase())
      );
    }

    return results.slice(0, 15);
  } catch (error) {
    console.error("Error searching faculty:", error);
    return [];
  }
};

export const getDepartments = async () => {
  try {
    const { data, error } = await supabase.from('faculty').select('department');
    if (error) throw error;
    
    // Extract unique departments
    const uniqueDepartments = Array.from(new Set(data.map(item => item.department)));
    return uniqueDepartments.sort() || [];
  } catch (error) {
    console.error("Error fetching departments:");
    return [];
  }
};

export const getPrincipalInfo = async () => {
  try {
    const { data, error } = await supabase.from('college_info').select('key, value, image_url').eq('key', 'principal').maybeSingle();
    if (error) {
      console.error("Supabase error fetching principal info:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error fetching principal info:", error);
    return null;
  }
};

export const getPrincipalFullInfo = async () => {
  try {
    const { data, error } = await supabase.from('college_info').select('key, value, image_url').eq('key', 'principal_info').maybeSingle();
    if (error) {
      console.error("Supabase error fetching principal full info:", error);
      throw error;
    }
    return data;
  } catch (error) {
    console.error("Error fetching principal full info:", error);
    return null;
  }
};

export const getCollegeSections = async (key?: string) => {
  try {
    let query = supabase.from('college_knowledge').select('id, category, search_key, title, content, updated_at');
    if (key) query = query.ilike('search_key', key);
    const { data, error } = await query.limit(5); // Safety limit
    if (error) {
      console.error("Supabase error fetching sections:", error);
      throw error;
    }
    return data || [];
  } catch (error) {
    console.error("Error fetching sections:", error);
    return [];
  }
};

export const getAllPastPrincipals = async (searchQuery?: string) => {
  try {
    const { data, error } = await supabase.from('past_principals').select('name, from_date, to_date, bio, image_url').order('order_index', { ascending: true }).limit(50);
    if (error) {
      console.error("Supabase error fetching past principals:", error);
      throw error;
    }
    if (!data) return [];

    let results = data.map((p: any) => {
      const formatDescriptiveDate = (dateStr: string) => {
        if (!dateStr) return null;
        if (dateStr.toLowerCase().includes('till')) return 'Till Date';
        
        // Handle DD/MM/YYYY
        if (dateStr.includes('/')) {
          const parts = dateStr.split('/');
          if (parts.length === 3) {
            const day = parts[0];
            const month = parseInt(parts[1]);
            const year = parts[2];
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            if (month >= 1 && month <= 12) {
              return `${day} ${months[month-1]} ${year}`;
            }
          }
        }
        return dateStr;
      };

      const from = formatDescriptiveDate(p.from_date);
      const to = formatDescriptiveDate(p.to_date) || 'Till Date';
      
      return {
        ...p,
        tenure: (from || to) ? `${from || '?'} से ${to} तक` : undefined
      };
    });
    if (searchQuery && searchQuery.trim().length > 0) {
      const q = searchQuery.trim();
      // Year-based search: if query contains a 4-digit year, filter by tenure range
      const yearMatch = q.match(/\b(1[89]\d\d|20\d\d)\b/);
      if (yearMatch) {
        const year = parseInt(yearMatch[1]);
        const byYear = results.filter((p: any) => {
          const parseYear = (dateStr: string) => {
            if (!dateStr || dateStr.toLowerCase().includes('till')) return null;
            const cleanStr = dateStr.trim();
            
            // 1. Matches 4-digit year at the end, like DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
            const endYearMatch = cleanStr.match(/\b(1[89]\d{2}|20\d{2})\b$/);
            if (endYearMatch) {
              return parseInt(endYearMatch[1]);
            }
            
            // 2. Matches 4-digit year at the beginning, like YYYY-MM-DD
            const startYearMatch = cleanStr.match(/^\b(1[89]\d{2}|20\d{2})\b/);
            if (startYearMatch) {
              return parseInt(startYearMatch[1]);
            }

            // 3. Fallback: try to extract any 4-digit year from the string
            const generalYearMatch = cleanStr.match(/\b(1[89]\d{2}|20\d{2})\b/);
            if (generalYearMatch) {
              return parseInt(generalYearMatch[1]);
            }

            return null;
          };
          const from = parseYear(p.from_date);
          const toValue = parseYear(p.to_date);
          const to = toValue === null ? new Date().getFullYear() : toValue;
          if (from === null) return false;
          return year >= from && year <= to;
        });
        // If year filter found results, return them; else fall back to fuzzy search
        results = byYear.length > 0 ? byYear : results;
      } else {
        // Name/bio fuzzy search
        const fuse = new Fuse(results, { keys: ['name', 'bio', 'from_date', 'to_date'], threshold: 0.4 });
        results = fuse.search(q).map(r => r.item);
      }
    }
    return results.slice(0, 50);
  } catch (error) {
    console.error("Error fetching past principals:", error);
    return [];
  }
};

export const getAllAchievements = async (searchQuery?: string) => {
  try {
    let query = supabase.from('achievements').select('*');
    let fuseQuery = "";

    if (searchQuery && searchQuery.trim().length > 0) {
      // Clean query for better fuzzy matching
      fuseQuery = searchQuery.toLowerCase().trim();
      const stopWords = ['ka', 'naam', 'batao', 'me', 'kya', 'hai', 'kon', 'tha', 'the', 'bhi', 'jo', 'mujhe', 'kese', 'kaise', 'tell', 'me', 'about', 'who', 'is', 'was', 'in', 'of', 'and', 'or', 'medlist', 'medal', 'gold', 'medalist', 'winner', 'college', 'lohia', 'churu', 'vidyalaya', 'mahavidyalaya', 'student', 'ladka', 'ladki'];
      stopWords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        fuseQuery = fuseQuery.replace(regex, '');
      });
      fuseQuery = fuseQuery.trim();

      if (fuseQuery.length > 2) {
        query = query.or(`title.ilike.%${fuseQuery}%,student_name.ilike.%${fuseQuery}%,description.ilike.%${fuseQuery}%,category.ilike.%${fuseQuery}%`);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    if (!data) return [];

    let results = data;
    if (fuseQuery && fuseQuery.length > 2) {
      const fuse = new Fuse(results, { keys: ['title', 'student_name', 'description', 'category', 'year'], threshold: 0.5 });
      results = fuse.search(fuseQuery).map(r => r.item);
    }
    return results.slice(0, 20);
  } catch (error) {
    console.error("Error fetching achievements:");
    return [];
  }
};

export const searchMainExams = async (params: any) => {
  try {
    let query = supabase.from('main_exams').select('*');
    
    if (params.department) {
      // If department is provided, it might be the broad category (Arts/Science) or the specific subject (Sociology)
      // So we use an OR filter if possible, but Supabase doesn't easily do OR across columns with ilike in a simple chain
      // Instead, we'll fetch then filter or just use a more inclusive query
      query = query.or(`department.ilike.%${params.department}%,subject.ilike.%${params.department}%`);
    }
    
    if (params.level) query = query.eq('level', params.level);
    if (params.semester) query = query.eq('semester', params.semester);
    if (params.status) query = query.eq('status', params.status);
    if (params.subject && !params.department) query = query.ilike('subject', `%${params.subject}%`);
    else if (params.subject && params.department) {
      // If both provided, refine by subject specifically
      query = query.ilike('subject', `%${params.subject}%`);
    }

    const { data: exams, error } = await query.order('exam_date', { ascending: true }).limit(50);
    if (error) throw error;
    return exams || [];
  } catch (error) {
    console.error("Error fetching main exams:");
    return [];
  }
};

export const searchStudyMaterial = async (params: any) => {
  try {
    let query = supabase.from('study_materials').select('*');
    
    const searchParams = { ...params };
    if (searchParams.stream && !searchParams.department) {
      searchParams.department = searchParams.stream;
      delete searchParams.stream;
    }

    if (searchParams.department) {
      query = query.ilike('department', `%${searchParams.department}%`);
    }
    if (searchParams.level) {
      query = query.eq('level', searchParams.level);
    }
    if (searchParams.semester) {
      query = query.eq('semester', searchParams.semester);
    }
    if (searchParams.material_type) {
      query = query.eq('material_type', searchParams.material_type);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return [];

    let results = data;
    if (searchParams.title) {
      const fuse = new Fuse(results, { keys: ['title', 'department', 'material_type'], threshold: 0.5 });
      results = fuse.search(searchParams.title).map(r => r.item);
    }
    return results.slice(0, 15);
  } catch (error) {
    console.error("Error fetching study materials:");
    return [];
  }
};

export const searchPracticalExams = async (params: any) => {
  try {
    let query = supabase.from('practical_batches').select('*');
    Object.keys(params).forEach(key => {
      if (params[key]) {
        if (['department'].includes(key)) {
          query = query.ilike(key, `%${params[key]}%`);
        } else {
          query = query.eq(key, params[key]);
        }
      }
    });
    const { data, error } = await query.order('exam_date', { ascending: true }).limit(20);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching practical exams:");
    return [];
  }
};

export const searchPracticalStudentsByName = async (params: { 
  name: string, 
  department?: string, 
  status?: string, 
  level?: string, 
  semester?: number 
}) => {
  try {
    // Join logic: We need to find students but also their batch info (date, time)
    let query = supabase
      .from('practical_students')
      .select(`
        *,
        practical_batches!inner (*)
      `)
      .ilike('name', `%${params.name}%`);

    if (params.department) query = query.eq('practical_batches.department', params.department);
    if (params.status) query = query.eq('practical_batches.status', params.status);
    if (params.level) query = query.eq('practical_batches.level', params.level);
    if (params.semester) query = query.eq('practical_batches.semester', params.semester);

    const { data, error } = await query.limit(20);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error searching practical students:");
    return [];
  }
};

export interface CollegeEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  category?: string;
  speakers?: string;
  image_url?: string;
  description: string;
  created_at?: string;
}

export const searchEvents = async (filters: { query?: string; timeframe?: string }) => {
  try {
    let queryBuilder = supabase.from('events').select('*');
    const today = new Date().toISOString().split('T')[0];
    
    let timeframe = filters.timeframe;
    const cleanQuery = filters.query?.trim().toLowerCase() || '';

    // Intent detection for future/upcoming events
    const futureKeywords = ['upcoming', 'future', 'aage', 'next', 'hone wale', 'aanewale', 'agle mahine', 'agla mahina', 'next month', 'coming', 'upcoming'];
    const pastKeywords = ['past', 'purane', 'ho gaye', 'history', 'abhi hue', 'abhi huye', 'recently happened'];
    
    const hasFutureIntent = futureKeywords.some(kw => cleanQuery.includes(kw));
    const hasPastIntent = pastKeywords.some(kw => cleanQuery.includes(kw));

    if (!timeframe) {
      if (hasFutureIntent) {
        timeframe = 'upcoming';
      } else if (hasPastIntent) {
        timeframe = 'past';
      }
    }

    // Timeframe filter implementation
    if (timeframe === 'latest' || timeframe === 'upcoming') {
      queryBuilder = queryBuilder.gte('date', today).order('date', { ascending: true });
    } else if (timeframe === 'past_7_days') {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 7);
      queryBuilder = queryBuilder.gte('date', pastDate.toISOString().split('T')[0]).lte('date', today).order('date', { ascending: false });
    } else if (timeframe === 'past') {
      queryBuilder = queryBuilder.lt('date', today).order('date', { ascending: false });
    } else {
      // Default: If a year is mentioned like "2026" and it's current/future, and no past intent, default to upcoming if current date is in that year
      const yearMatch = cleanQuery.match(/\b(20\d{2})\b/);
      const currentYear = new Date().getFullYear();
      if (yearMatch && parseInt(yearMatch[0]) >= currentYear && !hasPastIntent) {
        // If they ask for "2026" specifically, they might want all events in 2026, 
        // but if they said "upcoming", we already handled it.
        // To be safe and follow user request, if it's the current year or future, default to showing from today onwards if they didn't specify "past"
        queryBuilder = queryBuilder.gte('date', today).order('date', { ascending: true });
      } else {
        queryBuilder = queryBuilder.order('date', { ascending: false });
      }
    }

    const { data: allEvents, error } = await queryBuilder.limit(100);
    if (error) throw error;
    if (!allEvents) return [];

    let results = allEvents;
    
    // We clean the query for Fuse to avoid matching the metadata keywords
    let fuseQuery = cleanQuery;
    const stopWordsForFuse = ['lohia', 'college', 'me', 'mein', 'aaj', 'ke', 'ka', 'ki', 'ko', 'wale', 'wala', 'wali', 'mahine', 'mahina', 'agle', 'agla', 'hone', 'baad', 'event', 'events', 'program', 'programme', 'batao', 'show', 'tell', 'about', 'the', 'in', 'of', 'happening', 'kya', 'hai', 'dikhao', 'dikhaiye', 'list', 'all', 'any', '2024', '2025', '2026', '2027', '2028', 'after', 'today', 'tomorrow', 'yesterday', 'now', 'current', 'next', 'month'];
    [...futureKeywords, ...pastKeywords, ...stopWordsForFuse].forEach(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'gi');
      fuseQuery = fuseQuery.replace(regex, '');
    });
    fuseQuery = fuseQuery.trim();

    if (fuseQuery.length > 2) {
      const fuse = new Fuse(results, { keys: ['title', 'description', 'category', 'speakers'], threshold: 0.5 });
      const fuzzyResults = fuse.search(fuseQuery).map(r => r.item);
      // For natural time queries like "agle mahine ke hone wale event", do not erase valid upcoming/past results.
      if (fuzzyResults.length > 0 || (!timeframe && !hasFutureIntent && !hasPastIntent)) {
        results = fuzzyResults;
      }
    }
    
    return results.slice(0, 20);
  } catch (error) {
    console.error("Error searching events:");
    return [];
  }
};

export const getCollegeContext = async (query: string) => {
  // Existing context fetcher for general fallback
  // ... (keeping for backward compatibility if needed, but Gemini will prefer tools)
  try {
    // This is a simple context fetcher. In a real app, you might use vector search (pgvector)
    // but for now, we'll fetch general info based on keywords.
    
    let context = "Information about Lohia College:\n";

    if (query.toLowerCase().includes('principal')) {
      const { data } = await supabase.from('college_info').select('*').eq('key', 'principal').single();
      if (data) {
        context += `Principal: ${data.value}. Image: ${data.image_url || 'N/A'}\n`;
      }
    }

    if (query.toLowerCase().includes('faculty') || query.toLowerCase().includes('professor') || query.toLowerCase().includes('hindi')) {
      const { data: faculty } = await supabase.from('faculty').select('*');
      if (faculty && faculty.length > 0) {
        context += "Faculty Members:\n" + faculty.map(f => `- ${f.name} (${f.designation}) in ${f.department} department.`).join('\n') + '\n';
      }
    }

    if (query.toLowerCase().includes('event') || query.toLowerCase().includes('events') || query.toLowerCase().includes('karyakram')) {
      context += "For events, do NOT list them as text. ALWAYS use the marker [[EVENT_EXPLORER:Query]].\n";
    }

    return context;
  } catch (error) {
    console.error("Error fetching college context:");
    return ""; // Fallback to no local context
  }
};

export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  type?: string;
  media_urls: string[];
  created_at: string;
  event_date: string | null;
}

export const getGalleryCategories = async () => {
  const { data, error } = await supabase
    .from('gallery')
    .select('category')
    .order('category');
  
  if (error) {
    console.error('Error fetching gallery categories:');
    return [];
  }
  
  const uniqueCategories = Array.from(new Set(data.map(item => item.category)));
  return uniqueCategories;
};

export const searchGallery = async (filters: { category?: string; query?: string }) => {
  // If searching for something specific like "alumni", we want more diversity
  const limit = 40; 
  
  let { data: allItems, error } = await supabase.from('gallery').select('*').order('created_at', { ascending: false }).limit(limit);

  if (error) {
    console.error('Error searching gallery:');
    return [];
  }
  if (!allItems) return [];

  let results = (allItems as any[]).map((item: any) => {
    const urls = Array.isArray(item.media_urls)
      ? item.media_urls
      : (typeof item.media_urls === 'string' ? [item.media_urls] : []);
    if (item.media_url && !urls.includes(item.media_url)) urls.unshift(item.media_url);
    return { ...item, media_urls: urls.filter(Boolean) } as GalleryItem;
  });
  
  const cleanCategory = filters.category?.trim();
  const cleanQuery = filters.query?.trim();

  // Combine query and category for fuzzy search
  let searchWord = "";
  if (cleanCategory && cleanCategory.toLowerCase() !== 'general') {
    searchWord = cleanCategory;
  } else if (cleanQuery) {
    searchWord = cleanQuery;
  }

  if (searchWord) {
    const normalizedSearch = searchWord.toLowerCase();
    const broadLatestPhotoIntent =
      /(latest|lateset|recent|naya|last|abhi\s*h[au]e|abhi\s*huye|abhi\s*hua)/.test(normalizedSearch) &&
      /(program|programme|programe|event|photo|photos|image|images|gallery)/.test(normalizedSearch);
    const latestProgramIntent =
      (normalizedSearch.includes('latest') || normalizedSearch.includes('lateset') || normalizedSearch.includes('recent') || normalizedSearch.includes('naya') || normalizedSearch.includes('last')) &&
      (normalizedSearch.includes('program') || normalizedSearch.includes('programme') || normalizedSearch.includes('event') || normalizedSearch.includes('photo') || normalizedSearch.includes('image'));

    if (latestProgramIntent || broadLatestPhotoIntent) {
      return results.filter(item => item.media_urls.length > 0).slice(0, 15);
    }

    let fuzzyWord = searchWord
      .replace(/\b(latest|lateset|recent|naya|last|abhi|haue|hua|huye|hue|photo|photos|image|images|gallery|dikhao|show|program|programme|programe|event|karyakram|mujhe|ki|ka|ke|me|mein)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (!fuzzyWord) fuzzyWord = searchWord;

    // Increased threshold slightly to be more inclusive of related terms
    const fuse = new Fuse(results, { 
      keys: ['category', 'title'], 
      threshold: 0.6, 
      distance: 100,
      ignoreLocation: true 
    });
    results = fuse.search(fuzzyWord).map(r => r.item);

    if (results.length === 0) {
      const normalizedFuzzy = fuzzyWord.toLowerCase();
      if (normalizedFuzzy.includes('alumni') || normalizedFuzzy.includes('welcome')) {
        results = (allItems as any[])
          .map((item: any) => {
            const urls = Array.isArray(item.media_urls)
              ? item.media_urls
              : (typeof item.media_urls === 'string' ? [item.media_urls] : []);
            if (item.media_url && !urls.includes(item.media_url)) urls.unshift(item.media_url);
            return { ...item, media_urls: urls.filter(Boolean) } as GalleryItem;
          })
          .filter(item => `${item.title} ${item.category}`.toLowerCase().includes('alumni') || `${item.title} ${item.category}`.toLowerCase().includes('welcome'));
      }
    }
  }

  // If we have a specific query, we want to return a healthy amount for the grid/slider
  return results.filter(item => item.media_urls.length > 0).slice(0, 15);
};

export const searchCourses = async (stream?: string, queryStr?: string) => {
  try {
    let query = supabase.from('courses').select('*');
    
    if (stream) {
      query = query.ilike('stream', `%${stream}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    if (!data) return [];

    let results = data;
    if (queryStr && queryStr.trim().length > 0) {
      const fuse = new Fuse(results, { keys: ['name', 'subjects'], threshold: 0.5 });
      results = fuse.search(queryStr.trim()).map(r => r.item);
    }
    return results;
  } catch (error) {
    console.error("Error searching courses:");
    return [];
  }
};





export interface SportsRecord {
  id: number;
  category: string;
  year: string;
  student_name: string;
  sport?: string;
  division?: string;
  position_in_college?: string;
  remarks?: string;
  created_at?: string;
}

export interface MeritRecord {
  id: number;
  board_type: string;
  exam_year: string;
  student_name: string;
  division?: string;
  position_in_college?: string;
  remarks?: string;
  created_at?: string;
}

export const searchSports = async (params: { query?: string; sport?: string; year?: string }) => {
  try {
    let query = supabase.from('sports').select('*');

    if (params.year) {
      query = query.eq('year', params.year);
    }
    
    const rawSport = params.sport?.trim() || '';
    const rawQuery = params.query?.trim() || '';
    const combinedIntent = `${rawSport} ${rawQuery}`.toLowerCase();
    let sportSearch = rawSport;

    if (!sportSearch) {
      const sportAliases: Array<[RegExp, string]> = [
        [/\bfoot\s*-?\s*ball\b|\bfootball\b/, 'Foot'],
        [/\bvolley\s*-?\s*ball\b|\bvolleyball\b/, 'Volley'],
        [/\btable\s*tennis\b/, 'Table Tennis'],
        [/\bbadminton\b/, 'Badminton'],
        [/\btennis\b/, 'Tennis'],
        [/\bkabaddi\b/, 'Kabaddi'],
        [/\bathletics?\b/, 'Athletics']
      ];
      const match = sportAliases.find(([pattern]) => pattern.test(combinedIntent));
      if (match) sportSearch = match[1];
    } else if (/football|foot\s*-?\s*ball/i.test(sportSearch)) {
      sportSearch = 'Foot';
    } else if (/volleyball|volley\s*-?\s*ball/i.test(sportSearch)) {
      sportSearch = 'Volley';
    }

    if (sportSearch) {
      query = query.or(`sport.ilike.%${sportSearch}%,student_name.ilike.%${sportSearch}%,remarks.ilike.%${sportSearch}%`);
    }

    const { data, error } = await query.order('year', { ascending: false }).limit(200);
    if (error) throw error;
    
    let results = data || [];
    
    if (rawQuery.length > 0 && results.length > 0) {
      let fuseQuery = rawQuery.toLowerCase();
      const noiseWords = [
        'gold', 'medal', 'medalist', 'medlist', 'winner', 'winners', 'kon', 'kaun',
        'who', 'is', 'tha', 'the', 'hai', 'me', 'mein', 'lohia', 'college',
        'sports', 'sport', 'record', 'records', 'batao', 'naam'
      ];
      noiseWords.forEach(word => {
        fuseQuery = fuseQuery.replace(new RegExp(`\\b${word}\\b`, 'gi'), '');
      });
      if (sportSearch) {
        fuseQuery = fuseQuery.replace(new RegExp(`\\b${sportSearch}\\b`, 'gi'), '');
      }
      fuseQuery = fuseQuery.replace(/foot\s*-?\s*ball|football|volley\s*-?\s*ball|volleyball/gi, '').trim();

      if (fuseQuery.length <= 2) {
        return results.slice(0, 15);
      }

      const fuse = new Fuse(results, { 
        keys: ['student_name', 'sport', 'category', 'remarks'], 
        threshold: 0.6,
        ignoreLocation: true
      });
      results = fuse.search(fuseQuery).map(r => r.item);
    }

    return results.slice(0, 15);
  } catch (error) {
    console.error("Error searching sports:");
    return [];
  }
};

export const getMeritBoards = async () => {
  try {
    const { data, error } = await supabase
      .from('college_merit_list')
      .select('board_type')
      .order('board_type');
    
    if (error) throw error;
    
    const uniqueBoards = Array.from(new Set(data.map(item => item.board_type)));
    return uniqueBoards;
  } catch (error) {
    console.error("Error fetching merit boards:");
    return [];
  }
};

export const searchMeritList = async (params: { board_type?: string; exam_year?: string; student_name?: string }) => {
  try {
    let boardQuery = params.board_type || '';
    let searchName = params.student_name ? params.student_name.trim() : '';
    let searchYear = params.exam_year ? params.exam_year.trim() : '';
    const combinedQuery = `${boardQuery} ${searchName} ${searchYear}`.trim();

    // If student_name looks like a year, move it to exam_year if not already provided
    if (!searchYear) {
      const yearMatch = combinedQuery.match(/\b(19\d{2}|20\d{2})\b/);
      if (yearMatch) {
        searchYear = yearMatch[0];
      }
    }
    if (searchYear) {
      searchName = searchName.replace(new RegExp(`\\b${searchYear}\\b`, 'g'), '').trim();
    }

    // Auto-detect degree type from search name or board query and map to official DB board types
    const lowerName = `${searchName} ${combinedQuery}`.toLowerCase();
    const lowerBoard = `${boardQuery} ${combinedQuery}`.toLowerCase();
    
    if (lowerName.includes('bsc') || lowerName.includes('b.sc') || lowerName.includes('science') || lowerBoard.includes('bsc') || lowerBoard.includes('science')) {
      boardQuery = 'Science';
    } else if (lowerName.includes('bcom') || lowerName.includes('b.com') || lowerName.includes('commerce') || lowerBoard.includes('bcom') || lowerBoard.includes('commerce')) {
      boardQuery = 'Commerce';
    } else if (lowerName.includes('ba') || lowerName.includes('b.a') || lowerName.includes('arts') || lowerBoard.includes('ba') || lowerBoard.includes('arts')) {
      boardQuery = 'Arts';
    } else if (lowerName.includes('msc') || lowerName.includes('m.sc') || lowerBoard.includes('msc')) {
      boardQuery = 'M.Sc.';
    } else if (lowerName.includes('ma') || lowerName.includes('m.a') || lowerBoard.includes('ma')) {
      boardQuery = 'M.A.';
    }

    let query = supabase.from('college_merit_list').select('*');

    if (boardQuery) {
      query = query.ilike('board_type', `%${boardQuery}%`);
    }

    if (searchYear) {
      query = query.eq('exam_year', searchYear);
    }

    const { data, error } = await query.order('exam_year', { ascending: false }).order('id', { ascending: true });
    if (error) throw error;
    
    let results = data || [];
    
    // Fuzzy search names if specified
    if (searchName && searchName.trim().length > 0 && results.length > 0) {
      let fuseQuery = searchName.toLowerCase().trim();
      
      // Remove degree terms so they don't spoil student name search
      const degreeTerms = ['bsc', 'b.sc', 'bcom', 'b.com', 'ba', 'b.a', 'msc', 'm.sc', 'ma', 'm.a', 'science', 'scinece', 'commerce', 'arts', 'topper', 'toppers', 'physics', 'chemistry', 'botany', 'zoology', 'biology', 'bio', 'math', 'maths', 'mathematics', 'hindi', 'english', 'history', 'geography', 'sociology', 'political', 'economics', 'sanskrit', 'urdu', 'accounts', 'accounting', 'abst', 'eafm', 'business'];
      degreeTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        fuseQuery = fuseQuery.replace(regex, '');
      });

      const stopWords = ['ka', 'naam', 'batao', 'me', 'kya', 'hai', 'kon', 'tha', 'the', 'bhi', 'jo', 'mujhe', 'kese', 'kaise', 'tell', 'me', 'about', 'who', 'is', 'was', 'in', 'of', 'and', 'or', 'medlist', 'medal', 'gold', 'medalist', 'winner', 'college', 'lohia', 'churu', 'vidyalaya', 'mahavidyalaya', 'student', 'ladka', 'ladki'];
      stopWords.forEach(kw => {
        const regex = new RegExp(`\\b${kw}\\b`, 'gi');
        fuseQuery = fuseQuery.replace(regex, '');
      });
      
      fuseQuery = fuseQuery.trim();

      // If we have a genuine student name remaining after removing degree/stop words
      if (fuseQuery.length > 2) {
        const fuse = new Fuse(results, { 
          keys: ['student_name', 'board_type', 'remarks'], 
          threshold: 0.8, // extremely lenient
          ignoreLocation: true,
          useExtendedSearch: true
        });
        results = fuse.search(fuseQuery).map(r => r.item);
      }
    }

    return results;
  } catch (error) {
    console.error("Error searching merit list:");
    return [];
  }
};



export const searchKnowledgeBase = async (params: { query?: string }) => {
  try {
    let faqPromise = supabase.from('college_faqs').select('*');
    let knowledgePromise = supabase.from('college_knowledge').select('*');

    const cleanQuery = params.query?.trim() || '';
    if (cleanQuery.length > 0) {
      faqPromise = faqPromise.or(`question.ilike.%${cleanQuery}%,answer.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%`);
      knowledgePromise = knowledgePromise.or(`title.ilike.%${cleanQuery}%,content.ilike.%${cleanQuery}%,category.ilike.%${cleanQuery}%,search_key.ilike.%${cleanQuery}%`);
    }

    const [faqResult, knowledgeResult] = await Promise.all([
      faqPromise.order('created_at', { ascending: false }).limit(20),
      knowledgePromise.order('created_at', { ascending: false }).limit(20)
    ]);

    if (faqResult.error) console.error("Error querying college_faqs:", faqResult.error);
    if (knowledgeResult.error) console.error("Error querying college_knowledge:", knowledgeResult.error);

    const faqs = (faqResult.data || []).map((f: any) => ({
      type: 'FAQ',
      category: f.category,
      question: f.question,
      answer: f.answer,
      id: f.id
    }));

    const knowledgeItems = (knowledgeResult.data || []).map((k: any) => ({
      type: 'Knowledge Record',
      category: k.category,
      key: k.search_key,
      title: k.title,
      content: k.content,
      image_url: k.image_url,
      id: k.id
    }));

    const combined = [...knowledgeItems, ...faqs];

    if (cleanQuery.length > 0 && combined.length > 0) {
      const fuse = new Fuse(combined, {
        keys: ['question', 'answer', 'title', 'content', 'category', 'key'],
        threshold: 0.6,
        ignoreLocation: true
      });
      return fuse.search(cleanQuery).map(r => r.item).slice(0, 20);
    }

    return combined.slice(0, 20);
  } catch (error) {
    console.error("Error searching knowledge base:", error);
    return [];
  }
};

export const getMaterialsChat = async () => {
  try {
    const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Error fetching materials for chat:");
    return [];
  }
};

export const searchMaterialsChat = async (query?: string) => {
  try {
    const { data, error } = await supabase.from('materials').select('*').order('created_at', { ascending: false }).limit(50);
    if (error) throw error;
    let results = data || [];
    if (query && query.trim().length > 0 && results.length > 0) {
      let q = query.trim().toLowerCase();
      const genericWords = ['study', 'material', 'materials', 'notes', 'pdf', 'ppt', 'powerpoint', 'excel', 'doc', 'file', 'folder', 'matter', 'mojud', 'maujood', 'hai', 'kuch', 'dikhao', 'batao', 'open', 'khol'];
      genericWords.forEach(word => {
        q = q.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
      });
      q = q.replace(/\s+/g, ' ').trim();
      if (q) {
        const searchable = results.map((item: any) => ({
          ...item,
          file_names: Array.isArray(item.files) ? item.files.map((file: any) => file?.name).filter(Boolean).join(' ') : ''
        }));
        const fuse = new Fuse(searchable, {
          keys: ['title', 'file_names'],
          threshold: 0.55,
          ignoreLocation: true
        });
        results = fuse.search(q).map(r => r.item);
      }
    }
    return results.slice(0, 20);
  } catch (error) {
    console.error("Error searching materials for chat:");
    return [];
  }
};

export const searchAlertsChat = async (query?: string) => {
  try {
    const { data, error } = await supabase
      .from('academic_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    if (!data) return [];

    // Filter in-memory for active status to prevent 400 Bad Request if is_active column doesn't exist
    const activeAlerts = data.filter(item => item.is_active !== false);

    if (query && query.trim().length > 0) {
      let q = query.trim().toLowerCase();
      const genericWords = ['koi', 'any', 'latest', 'lateset', 'recent', 'new', 'naya', 'notification', 'notifications', 'notice', 'notices', 'alert', 'alerts', 'college', 'lohia', 'se', 'related', 'hai', 'gaya', 'kya', 'dikhao', 'batao'];
      genericWords.forEach(word => {
        q = q.replace(new RegExp(`\\b${word}\\b`, 'gi'), ' ');
      });
      q = q.replace(/\s+/g, ' ').trim();
      if (!q) return activeAlerts;
      const fuse = new Fuse(activeAlerts, {
        keys: ['title', 'description', 'stream'],
        threshold: 0.55,
        ignoreLocation: true
      });
      return fuse.search(q).map(r => r.item);
    }
    return activeAlerts;
  } catch (error) {
    console.error("Error searching alerts for chat:");
    return [];
  }
};
