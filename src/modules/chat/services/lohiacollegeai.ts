import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { searchFaculty, getPrincipalInfo, getPrincipalFullInfo, getCollegeSections, getAllPastPrincipals, getAllAchievements, searchMainExams, searchStudyMaterial, searchPracticalExams, searchPracticalStudentsByName, searchGallery, getGalleryCategories, searchEvents, searchCourses, searchMeritList, getMeritBoards, searchKnowledgeBase, searchMaterialsChat, searchAlertsChat, searchSports, searchAllCollegeData, searchKnowledgeItems } from "./collegeDataService";
import { supabase } from "@/lib/supabase";
import { StudentProfile } from "@/modules/profile/types";
import Fuse from 'fuse.js';

// LOHIA SPEED CACHE (Config)
let cachedConfig: any = null;
let lastConfigFetch = 0;
const CONFIG_CACHE_TTL = 300000; // 5 minutes

export async function getActiveAIConfig() {
  // HYBRID CONFIG: Check in-memory cache first (Speed Mode)
  const now = Date.now();
  if (cachedConfig && (now - lastConfigFetch < CONFIG_CACHE_TTL)) {
    return cachedConfig;
  }

  // Try to fetch active config from Supabase
  try {
    const { data, error } = await supabase
      .from('ai_configurations')
      .select('*')
      .eq('is_active', true)
      .single();

    if (!error && data) {
      cachedConfig = data;
      lastConfigFetch = now;
      return data;
    }
  } catch (_) {
    // Network/DB failure - fall through to env-var default
  }

  // Fallback: Use environment variables (stale cache or hard default)
  if (cachedConfig) return cachedConfig; // stale but better than nothing

  const envDefault = {
    api_key: "server-proxy",
    model_id: process.env.NEXT_PUBLIC_LC_ENGINE_MODEL || "lc-pro-120b",
    base_url: "/api/openrouter",
    provider_name: "LC-Proxy",
    is_active: true
  };
  cachedConfig = envDefault;
  lastConfigFetch = now;
  return envDefault;
}

const defaultApiKey = process.env.NEXT_PUBLIC_LOHIA_COLLEGE_VOICE_KEY;

// ─── COLLEGE CONTACT CONSTANTS ──────────────────────────────────────────────
// Update these when college details change — do NOT hardcode elsewhere in this file.
const COLLEGE_CONTACTS = {
  principalName: 'Prof. Dr. Manju Sharma',
  principalMobile: '+91-9414665955',
  principalEmail: 'manjudinesh.8@gmail.com',
  officePhone: '01562-250362',
  officeEmail: 'lohiacollegechuru@gmail.com',
  collegeAddress: 'Opposite Railway Station, Station Road, Churu, Rajasthan - 331001',
  principalImageUrl: 'https://pub-8bc21fd3ffc042a79a7bf25ee57d61d1.r2.dev/1776921818854-principal-main-image.webp',
} as const;
// ────────────────────────────────────────────────────────────────────────────

// SUPER SPEED CACHE (In-Memory)
const RESPONSE_CACHE: Record<string, string> = {
  "college kab khulega": "Lohia College kulpati nirdeshon ke anusar somvar se shukravar subah 9 baje se sham 4 baje tak khulta hai.",
  "principal kaun hai": "Hamari college ki principal Prof. Dr. Manju Sharma hain.",
  "principal name": "The current principal is Prof. Dr. Manju Sharma.",
  "fees kaise bhare": "Fees bharne ke liye aapko hte.rajasthan.gov.in portal par jana hoga.",
  "scholarship details": "College mein PMS (Post Matric Scholarship) aur CM Higher Education scholarship available hai.",
  "admission last date": "Lohia College mein regular admission (B.A/B.Sc/B.Com Part 1) session 2026-27 ke liye online form 1 May se start ho chuke hain aur antim tithi 6 june 2026 hai.",
  "admission kab se start hai": "Lohia College regular admission (B.A/B.Sc/B.Com Part 1) 1 May 2026 se start ho chuke hain.",
  "college form kab start honge": "Lohia College (Session 2026-27) ke admission forms 1 May 2026 se start ho chuke hain aur antim tithi 6 june 2026 hai.",
  "college admission kab chalu honge": "Lohia College admission (Session 2026-27) 1 May 2026 se chalu ho chuke hain.",
  "admission documents": "Admission ke liye 10th-12th marksheet, Aadhaar, Jan Aadhaar, ABC ID, Caste & Domicile cert, photo aur SSO ID chahiye.",
  "admission contact": "Admission form bharne mein help ke liye aap 9509932564 par WhatsApp kar sakte hain.",
  "exam form": "Lohia College mein admission form aur exam form (for first year/part 1) ka ek hi matlab hai. Session 2026-27 ke liye online admission forms 1 May 2026 se start ho chuke hain aur antim tithi 6 June 2026 hai.",
  "exam form kab start honge": "Lohia College (Session 2026-27) ke admission forms 1 May 2026 se start ho chuke hain aur antim tithi 6 june 2026 hai. Lohia College mein admission form aur exam form (for first year) ka ek hi matlab hai.",
  "exam form kab bhare jayenge": "Lohia College (Session 2026-27) ke admission/exam forms 1 May 2026 se bhare ja rahe hain aur antim tithi 6 june 2026 hai. Lohia College mein admission form aur exam form ka ek hi matlab hai.",
  "exam form date": "Lohia College mein regular admission/exam form (Session 2026-27) bharne ki dates 1 May 2026 se 6 June 2026 tak hai.",
  "exam form last date": "Lohia College mein admission/exam form (Session 2026-27) bharne ki antim tithi 6 June 2026 hai.",
  "non collegiate exam kab hai": "Non-Collegiate (N.C.) students ke exams regular students ke saath ya unke turant baad hote hain. Specific schedule ke liye [[EXAM_EXPLORER]] check karein.",
  "hi": "Namaste! Main Lohia College AI Assistant hoon. Admission, exams, faculty, events, notices ya college ki kisi bhi jaankari me madad kar sakti hoon.",
  "hello": "Hello! I am Lohia College AI Assistant. How can I help you today with admissions, exams, or faculty information?",
  "namaste": "Namaste! Lohia College helpdesk me aapka swagat hai. Batayein, main kis jaankari me madad karun?",
  "kaisa hai": "Main badhiya hoon! Aap batayein, Lohia College se related kis cheez ki jaankari chahiye?",
  "cutoff kab aayegi": "Admission ki first merit list usually last date ke baad aati hai. Session 2026-27 ke liye admission ki last date 6 June 2026 hai.",
  "ncc join kaise kare": "NCC join karne ke liye aapko NCC office (New Building) mein contact karna hoga. Admission ke samay notification nikalta hai.",
  "nss join kaise kare": "NSS ke liye aap kisi bhi NSS programme officer se college campus mein contact kar sakte hain."
};

// Initialize Fuse for Smart Local Cache
const cacheEntries = Object.entries(RESPONSE_CACHE).map(([q, a]) => ({ q, a }));
const fuse = new Fuse(cacheEntries, {
  keys: ['q'],
  threshold: 0.35, // Adjust for sensitivity: lower is stricter
});

const FAST_CACHE_ALLOWED_KEYS = new Set(Object.keys(RESPONSE_CACHE));

function findFastAnswer(text: string) {
  const normalized = text.toLowerCase().trim();
  // Skip fast answer if prompt has multiple intents (and/aur/or/ya etc.)
  const hasMultiple = /\band\b|\baur\b|\bor\b|\bya\b|\bok\s*toh|\bthen\b|\bhai\b.*\bkya\b|\bkya\b.*\bkya\b/.test(normalized) || normalized.split(/\s+/).length > 8;
  if (hasMultiple) return null;
  if (!FAST_CACHE_ALLOWED_KEYS.has(normalized)) return null;
  const results = fuse.search(normalized);
  if (results.length > 0) {
    const bestMatch = results[0];
    // If exact key match exists, use it instantly regardless of fuse
    if (RESPONSE_CACHE[normalized]) return RESPONSE_CACHE[normalized];
    // Otherwise use fuse score (lower is better match)
    if (bestMatch.score !== undefined && bestMatch.score < 0.35) {
      return bestMatch.item.a;
    }
  }
  return null;
}


//  SEMANTIC BRAIN (TYPO CORRECTION & ALIASES)
const SEMANTIC_MAPPING: Record<string, string> = {
  "umesd": "Umed Singh Gothwal",
  "umesh": "Umed Singh Gothwal",
  "gothwla": "Gothwal",
  "manju mam": "Manju Sharma",
  "manju sharma": "Manju Sharma",
  "sharma ji": "Manju Sharma",
  "principal": "Manju Sharma",
  "history hod": "History Department Head",
  "practical kab hai": "Practical Exam Schedule",
  "literature": "litteture",
  "sahitya": "litteture",
  "hindi literature": "litteture",
  "ncc": "NCC",
  "library": "Library",
  "exam form": "admission form",
  "sociolgoy": "Sociology",
  "socio": "Sociology",
  "geog": "Geography",
  "pol": "Political Science",
  "eco": "Economics"
};

const normalizeText = (text: string) => text.toLowerCase().trim().replace(/[.,?!]/g, '');

const repairMojibake = (text: string) => {
  // Detect any common Devanagari mojibake pattern (à¤, à¥ prefixes)
  if (!/à[¤¥][^\s]/.test(text)) return text;
  try {
    const bytes = Array.from(text).map((char) => {
      const code = char.charCodeAt(0);
      if (code > 255) throw new Error('not latin1 mojibake');
      return `%${code.toString(16).padStart(2, '0')}`;
    }).join('');
    return decodeURIComponent(bytes);
  } catch {
    return text;
  }
};

const sanitizeUserText = (text: string) =>
  repairMojibake(text)
    .replace(/à¤¡à¥‡à¤Ÿà¤¾à¤¬à¥‡à¤¸|à¤¡à¤¾à¤Ÿà¤¾à¤¬à¥‡à¤¸/g, 'available information')
    .replace(/डेटाबेस|डाटाबेस/g, 'college records')
    .replace(/database\s*(me|mein|à¤®à¥‡à¤‚)/gi, 'college records me')
    .replace(/\bdatabase\b/gi, 'college records')
    .replace(/\bDB\b/g, 'college records')
    .replace(/\bquery\b/gi, 'request')
    .replace(/\bqueries\b/gi, 'requests')
    .replace(/\bfetched\b/gi, 'found')
    .replace(/\bfetch\b/gi, 'find')
    .replace(/\btechnical\b/gi, 'internal')
    .replace(/\btool\b/gi, 'helper');

const findSemanticMatch = (text: string) => {
  const normalized = normalizeText(text);
  for (const [key, value] of Object.entries(SEMANTIC_MAPPING)) {
    if (normalized.includes(key)) return value;
  }
  return null;
};

const isFounderIntent = (text: string) => {
  const lower = text.toLowerCase();
  return (
    lower.includes('founder') ||
    lower.includes('fouder') ||
    lower.includes('father of lohia') ||
    lower.includes('father name of lohia') ||
    lower.includes('lohia college father') ||
    lower.includes('college ke father') ||
    lower.includes('sthapit') ||
    lower.includes('kisne banaya') ||
    lower.includes('kanhiya') ||
    lower.includes('kanhaiya')
  );
};

const getRequestedFieldInstruction = (text: string) => {
  const lower = text.toLowerCase();
  const fields: string[] = [];
  if (lower.includes('qualification') || lower.includes('degree') || lower.includes('padhai') || lower.includes('à¤¶à¥ˆà¤•à¥à¤·à¤£à¤¿à¤•')) fields.push('qualification');
  if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact') || lower.includes('number') || lower.includes('whatsapp')) fields.push('mobile/contact');
  if (lower.includes('email') || lower.includes('mail')) fields.push('email');
  if (lower.includes('father') || lower.includes('pita') || lower.includes('à¤ªà¤¿à¤¤à¤¾')) fields.push('father_name');
  if (lower.includes('joining') || lower.includes('join') || lower.includes('college_join') || lower.includes('service')) fields.push('joining/service date');
  if (lower.includes('designation') || lower.includes('post') || lower.includes('pad')) fields.push('designation');
  if (lower.includes('subject') || lower.includes('department') || lower.includes('vishay')) fields.push('subject/department');
  if (fields.length === 0) return '';
  return `[REQUESTED_FIELDS_ONLY]: User asked for ${fields.join(', ')}. Answer only these field(s) for the matched record/person. Do not use FACULTY_EXPLORER, cards, or full profile unless the user explicitly asked for profile/photo/full details.`;
};

const getRequestedFacultyFields = (text: string) => {
  const lower = text.toLowerCase();
  const fields: Array<{ key: string; label: string }> = [];
  if (/qualification|degree|padhai|à¤¶à¥ˆà¤•à¥à¤·à¤£à¤¿à¤•/.test(lower)) fields.push({ key: 'qualification', label: 'Qualification' });
  if (/phone|mobile|contact|number|whatsapp|à¤«à¥‹à¤¨|à¤®à¥‹à¤¬à¤¾à¤‡à¤²|à¤¨à¤‚à¤¬à¤°/.test(lower)) fields.push({ key: 'mobile_no', label: 'Contact Number' });
  if (/email|mail/.test(lower)) fields.push({ key: 'email', label: 'Email' });
  if (/father|pita|à¤ªà¤¿à¤¤à¤¾/.test(lower)) fields.push({ key: 'father_name', label: 'Father Name' });
  if (/college\s*join|joining|join\s*date|service|à¤¸à¥‡à¤µà¤¾|à¤œà¥‰à¤‡à¤¨/.test(lower)) fields.push({ key: 'college_join_date', label: 'College Joining Date' });
  if (/designation|post|pad|à¤ªà¤¦/.test(lower)) fields.push({ key: 'designation', label: 'Designation' });
  if (/subject|department|vishay|à¤µà¤¿à¤·à¤¯|à¤µà¤¿à¤­à¤¾à¤—/.test(lower)) fields.push({ key: 'subject', label: 'Subject/Department' });
  return fields;
};

const hasFacultyFieldIntent = (text: string) => {
  const lower = text.toLowerCase();
  return getRequestedFacultyFields(text).length > 0 && (
    /sir|mam|madam|ma'am|teacher|faculty|professor|dr\.?|shri|smt|ms\.?|mrs\.?|ji/.test(lower) ||
    lower.split(/\s+/).length <= 8
  );
};

const formatFacultyFieldResponse = (faculty: any, fields: Array<{ key: string; label: string }>) => {
  const name = faculty?.name || 'Faculty';
  if (fields.length === 1) {
    const field = fields[0];
    const value = field.key === 'subject'
      ? [faculty.subject, faculty.department].filter(Boolean).join(' / ')
      : faculty[field.key];
    return `**${name}**\n\n${field.label}: **${value || 'available information me nahi mila'}**`;
  }

  const rows = fields.map(field => {
    const value = field.key === 'subject'
      ? [faculty.subject, faculty.department].filter(Boolean).join(' / ')
      : faculty[field.key];
    return `| ${field.label} | ${value || '-'} |`;
  });
  return `**${name} ki requested details:**\n\n| Field | Detail |\n|---|---|\n${rows.join('\n')}`;
};

const parsePrincipalInfoSection = (infoText: string, query: string): string => {
  const lowerQuery = query.toLowerCase();

  const sections = [
    {
      keywords: ['education', 'qualification', 'degree', 'padhai', 'educational'],
      title: 'Educational Qualifications:',
      alternateTitle: 'Qualification:'
    },
    {
      keywords: ['book', 'publication', 'publish', 'kitab', 'pustak', 'published'],
      title: 'Publications and Books:'
    },
    {
      keywords: ['research', 'phd', 'p.hd', 'project', 'academic work'],
      title: 'Research and Academic Work:'
    },
    {
      keywords: ['contribution', 'academic contribution', 'magazine', 'seminar', 'conference'],
      title: 'Academic Contributions:'
    },
    {
      keywords: ['activity', 'activities', 'social', 'plantation', 'radio', 'student welfare'],
      title: 'Social and Institutional Activities:'
    },
    {
      keywords: ['award', 'honor', 'samman', 'award and honor', 'nagar shri'],
      title: 'Awards and Honors:'
    },
    {
      keywords: ['editorial', 'editor', 'alok', 'magazine editor'],
      title: 'Editorial Work:'
    },
    {
      keywords: ['personal', 'dob', 'date of birth', 'father', 'email', 'mobile', 'phone', 'contact', 'specialization'],
      title: 'Personal Details:'
    }
  ];

  const lines = infoText.split(/\r?\n/);
  const matchedSections = sections.filter(sec =>
    sec.keywords.some(keyword => lowerQuery.includes(keyword))
  );

  if (matchedSections.length === 0) {
    const keywordsIndex = infoText.indexOf('Keywords:');
    if (keywordsIndex !== -1) {
      return infoText.substring(0, keywordsIndex).trim();
    }
    return infoText;
  }

  const results: string[] = [];
  const allHeaders = sections.map(s => s.title).concat(['Keywords:', 'Principal Information', 'Personal Details:']);

  for (const sec of matchedSections) {
    const header = sec.title;
    let startIndex = lines.findIndex(line => line.trim().startsWith(header));

    if (startIndex === -1 && sec.alternateTitle) {
      startIndex = lines.findIndex(line => line.trim().startsWith(sec.alternateTitle));
    }

    if (startIndex !== -1) {
      const sectionLines: string[] = [lines[startIndex]];
      let i = startIndex + 1;

      while (i < lines.length) {
        const line = lines[i].trim();
        if (allHeaders.some(h => line.startsWith(h))) {
          break;
        }
        sectionLines.push(lines[i]);
        i++;
      }
      results.push(sectionLines.join('\n').trim());
    }
  }

  if (results.length > 0) {
    return `**Prof. (Dr.) Manju Sharma (Principal) - Requested Details:**\n\n` + results.join('\n\n');
  }

  return infoText;
};

const extractYear = (text: string) => text.match(/\b(19\d{2}|20\d{2})\b/)?.[0];

const inferBoardType = (text: string) => {
  const lower = text.toLowerCase();
  if (/\bbsc\b|\bb\.sc\b|\bmsc\b|\bm\.sc\b|science|scinece|physics|chemistry|botany|zoology|biology|bio|maths?|mathematics/.test(lower)) return 'Science';
  if (/\bbcom\b|\bb\.com\b|commerce|account|accounts|accounting|abst|a\.b\.s\.t|eafm|e\.a\.f\.m|business|banking/.test(lower)) return 'Commerce';
  if (/\bba\b|\bb\.a\b|arts|hindi|english|history|geography|sociology|political|pol\s*science|economics|sanskrit|urdu|public\s*administration|drawing|home\s*science/.test(lower)) return 'Arts';
  if (/\bma\b|\bm\.a\b/.test(lower)) return 'M.A.';
  return undefined;
};

const hasMeritIntent = (text: string) => {
  const lower = text.toLowerCase();
  return (
    lower.includes('topper') ||
    lower.includes('toppers') ||
    lower.includes('merit') ||
    lower.includes('rank') ||
    lower.includes('position') ||
    lower.includes('gold medal') ||
    (!!extractYear(text) && !!inferBoardType(text))
  );
};

const formatMeritRows = (rows: any[], boardHint?: string, year?: string) => {
  if (!rows.length) {
    const requested = [year, boardHint].filter(Boolean).join(' ');
    return `${requested ? `${requested} ka` : 'Is'} merit-list record abhi mere paas nahi mila. Mere paas abhi jitna verified data available hai, main usi se jawab de raha hoon. Aapko hui takleef ke liye khed hai; details update hote hi main aur accurate answer de paunga.`;
  }

  const heading = year && boardHint
    ? `**${year} me ${boardHint} topper record:**`
    : `**Merit-list record:**`;
  const table = [
    '| Year | Board/Course | Student | Position | Division | Remarks |',
    '|---|---|---|---|---|---|',
    ...rows.map((row: any) => {
      const remarks = row.remarks ? String(row.remarks) : '-';
      return `| ${row.exam_year || '-'} | ${row.board_type || '-'} | **${row.student_name || '-'}** | ${row.position_in_college || '-'} | ${row.division || '-'} | ${remarks} |`;
    })
  ].join('\n');
  return `${heading}\n\n${table}`;
};

const formatSportsRows = (rows: any[], sport?: string) => {
  if (!rows.length) {
    return `${sport || 'Sports'} ka matching record abhi nahi mila. Agar aap year ya tournament ka naam bata denge to main aur accurately check kar dungi.`;
  }
  const columns = ['| Year | Sport | Event/Title | Name/Team | Achievement |'];
  const table = [
    ...columns,
    '|---|---|---|---|---|',
    ...rows.slice(0, 15).map((row: any) => `| ${row.year || row.session || row.exam_year || '-'} | ${row.sport || row.category || '-'} | ${row.title || row.event || row.tournament || '-'} | ${row.name || row.student_name || row.team || '-'} | ${row.achievement || row.description || row.position || row.remarks || '-'} |`)
  ].join('\n');
  return `**${sport ? sport : 'Sports'} records:**\n\n${table}`;
};

const inferSportName = (text: string) => {
  const lower = text.toLowerCase();
  if (/foot\s*-?\s*ball|football/.test(lower)) return 'football';
  if (/volley\s*-?\s*ball|volleyball/.test(lower)) return 'volleyball';
  if (/table\s*tennis/.test(lower)) return 'table tennis';
  if (/badminton/.test(lower)) return 'badminton';
  if (/\btennis\b/.test(lower)) return 'tennis';
  if (/kabaddi/.test(lower)) return 'kabaddi';
  if (/athletics?/.test(lower)) return 'athletics';
  return undefined;
};

const inferExamSubject = (text: string) => {
  const lower = text.toLowerCase();
  const subjects: Array<[RegExp, string]> = [
    [/physics|fijiks|à¤«à¤¿à¤œà¤¿à¤•à¥à¤¸|à¤­à¥Œà¤¤à¤¿à¤•/, 'Physics'],
    [/chemistry|à¤•à¥‡à¤®à¤¿à¤¸à¥à¤Ÿà¥à¤°à¥€|à¤°à¤¸à¤¾à¤¯à¤¨/, 'Chemistry'],
    [/zoology|à¤œà¥‚à¤²à¥‰à¤œà¥€|à¤ªà¥à¤°à¤¾à¤£à¥€/, 'Zoology'],
    [/botany|à¤¬à¥‰à¤Ÿà¤¨à¥€|à¤µà¤¨à¤¸à¥à¤ªà¤¤à¤¿/, 'Botany'],
    [/mathematics|maths?|à¤—à¤£à¤¿à¤¤/, 'Mathematics'],
    [/geography|geog|à¤­à¥‚à¤—à¥‹à¤²/, 'Geography'],
    [/history|à¤‡à¤¤à¤¿à¤¹à¤¾à¤¸/, 'History'],
    [/sociology|socio|à¤¸à¤®à¤¾à¤œà¤¶à¤¾à¤¸à¥à¤¤à¥à¤°/, 'Sociology'],
    [/political|pol\s*science|à¤°à¤¾à¤œà¤¨à¥€à¤¤à¤¿/, 'Political Science'],
    [/economics|eco|à¤…à¤°à¥à¤¥à¤¶à¤¾à¤¸à¥à¤¤à¥à¤°/, 'Economics'],
    [/hindi|à¤¹à¤¿à¤‚à¤¦à¥€/, 'Hindi'],
    [/english|à¤…à¤‚à¤—à¥à¤°à¥‡à¤œà¥€/, 'English'],
    [/sanskrit|à¤¸à¤‚à¤¸à¥à¤•à¥ƒà¤¤/, 'Sanskrit'],
    [/public\s*administration|à¤²à¥‹à¤•\s*à¤ªà¥à¤°à¤¶à¤¾à¤¸à¤¨/, 'Public Administration'],
    [/psychology|à¤®à¤¨à¥‹à¤µà¤¿à¤œà¥à¤žà¤¾à¤¨/, 'Psychology'],
    [/home\s*science|à¤—à¥ƒà¤¹\s*à¤µà¤¿à¤œà¥à¤žà¤¾à¤¨/, 'Home Science'],
    [/drawing|à¤šà¤¿à¤¤à¥à¤°à¤•à¤²à¤¾/, 'Drawing'],
    [/music|à¤¸à¤‚à¤—à¥€à¤¤/, 'Music'],
    [/\babst\b|a\.b\.s\.t|account|accounts|accounting/, 'ABST'],
    [/\beafm\b|e\.a\.f\.m/, 'EAFM'],
    [/\bbadm\b|business\s*administration/, 'BADM'],
    [/computer|bca|cit/, 'Computer Science']
  ];
  return subjects.find(([pattern]) => pattern.test(lower))?.[1];
};

const inferExamStatus = (text: string) => {
  const lower = text.toLowerCase();
  if (/non[-\s]?collegiate|non\s*college|noncollege|private|à¤\u0080à¤¨\s*à¤¸à¥€|à¤¨¥\u0089à¤¨/.test(lower)) return 'Non-Collegiate';
  if (/collegiate|regular|college student|regular student|à¤°à¥\u0087à¤—à¥\u0081à¤²à¤°/.test(lower)) return 'Collegiate';
  return undefined;
};

const inferExamLevel = (text: string) => {
  const lower = text.toLowerCase();
  if (/\bpg\b|post\s*graduate|postgraduate|m\.?sc|m\.?a|m\.?com|à¤ à¤®\s*à¤ |à¤ à¤®\s*à¤ à¤¸à¤¸à¥€/.test(lower)) return 'PG';
  if (/\bug\b|\bgraduate\b|under\s*graduate|undergraduate|b\.?sc|b\.?a|b\.?com|à¤¬à¥€\s*à¤ |à¤¬à¥€\s*à¤ à¤¸à¤¸à¥€/.test(lower)) return 'UG';
  return undefined;
};

const inferExamSemester = (text: string) => {
  const lower = text.toLowerCase();
  const numeric = lower.match(/\bsem(?:ester)?\s*[-:]?\s*([1-6])\b|\b([1-6])(?:st|nd|rd|th)?\s*sem(?:ester)?\b/);
  if (numeric) return numeric[1] || numeric[2];
  if (/first|1st|sem\s*one|semester\s*one|à¤«à¤°à¥ à¤¸à¥ à¤Ÿ|à¤ªà¤¹à¤²à¤¾|à¤ªà¥ à¤°à¤¥à¤®/.test(lower)) return '1';
  if (/second|2nd|sem\s*two|semester\s*two|à¤¸à¥‡à¤•à¤‚à¤¡|à¤¦à¥‚à¤¸à¤°à¤¾|à¤¦à¥ à¤µà¤¿à¤¤à¥€à¤¯/.test(lower)) return '2';
  if (/third|3rd|sem\s*three|semester\s*three|à¤¥à¤°à¥ à¤¡|à¤¤à¥€à¤¸à¤°à¤¾|à¤¤à¥ƒà¤¤à¥€à¤¯/.test(lower)) return '3';
  if (/fourth|4th|sem\s*four|semester\s*four|à¤«à¥‹à¤°à¥ à¤¥|à¤šà¥Œà¤¥à¤¾/.test(lower)) return '4';
  if (/fifth|5th|sem\s*five|semester\s*five|à¤«à¤¿à¤«à¥ à¤¥|à¤ªà¤¾à¤‚à¤šà¤µà¤¾/.test(lower)) return '5';
  if (/sixth|6th|sem\s*six|semester\s*six|à¤¸à¤¿à¤•à¥ à¤¸à¥ à¤¥|à¤›à¤ à¤¾/.test(lower)) return '6';
  return undefined;
};

const hasExamScheduleIntent = (text: string) => {
  const lower = text.toLowerCase();
  const asksDate = /paper|exam|timetable|schedule|date|kab|à¤•à¤¬|à¤ªà¥‡à¤ªà¤°|à¤ªà¤°à¥€à¤•à¥ à¤·à¤¾|à¤Ÿà¤¾à¤‡à¤®\s*à¤Ÿà¥‡à¤¬à¤²/.test(lower);
  const isAdmissionForm = /admission|à¤ªà¥ à¤°à¤µà¥‡à¤¶|form\s*start|exam\s*form|pariksha\s*form|परीक्षा\s*फ़ॉर्म|परीक्षा\s*फार्म/.test(lower);
  const isPersonDate = /joining|join\s*date|college\s*join|service\s*date|dob|date\s*of\s*birth|sir|mam|madam|teacher|faculty|professor/.test(lower);
  const isNonExamWhen = /marmat|repair|renovation|nirman|construction|bca|course|address|contact|phone|number|स्थापना|मरम्मत|निर्माण/.test(lower);
  return asksDate && !isAdmissionForm && !isPersonDate && !isNonExamWhen;
};

const hasCollegeDomainSignal = (text: string) => {
  const lower = text.toLowerCase();
  return /lohia|college|admission|exam|paper|timetable|faculty|teacher|principal|course|seat|fee|fees|scholarship|library|hostel|ncc|nss|sports|event|notice|notification|material|gallery|topper|merit|department|semester|ug|pg|b\.?\s*a|b\.?\s*sc|b\.?\s*com|m\.?\s*a|m\.?\s*sc|m\.?\s*com|kamra|room|building|classroom|lab|office|कालेज|कॉलेज|परीक्षा|पेपर|प्रवेश|शुल्क|पुस्तकालय|छात्रावास/.test(lower);
};

const hasLowValueCasualIntent = (text: string) => {
  const lower = text.toLowerCase().trim();
  const hasQuestionLikeShape = /kya|kay|kaun|kon|kab|kitna|kitni|bata|batao|tell|what|who|when|how|कौन|क्या|कब|कितना|कितनी/.test(lower);
  const nonsenseNames = /\b(papu|pappu|raju|golu|monu|sonu|chintu|pintu)\b/.test(lower);
  const personalOutcome = /pass|fail|paas|fail|ho gaya|hogaya|ho gya|result/.test(lower) && nonsenseNames;
  return hasQuestionLikeShape && (personalOutcome || (!hasCollegeDomainSignal(lower) && lower.split(/\s+/).length <= 10));
};

const getPoliteScopeFallback = (text: string) => {
  if (hasLowValueCasualIntent(text)) {
    return "Main Lohia College se related verified information me help kar sakti hoon, jaise admission, exam papers, timetable, faculty, notices, study material, events, sports ya college facilities. Is sawal ka college records se clear relation nahi mil raha, isliye main is par confirmed jawab nahi de paungi.";
  }

  if (hasCollegeDomainSignal(text)) {
    return "Maaf kijiye, is specific detail ki verified jankari abhi mere paas available records me nahi mil rahi. Main galat answer dene ke bajay clear bata rahi hoon: aap admission, exams, papers, faculty, notices, materials, events ya facilities se related detail thodi aur clear kar dein, main dobara check kar dungi.";
  }

  return "";
};

const hasGalleryPhotoIntent = (text: string) => {
  const lower = text.toLowerCase();
  const wantsMedia = /photo|photos|image|images|pic|pics|tasveer|à¤¤à¤¸à¥à¤µà¥€à¤°|à¤«à¥‹à¤Ÿà¥‹|à¤‡à¤®à¥‡à¤œ/.test(lower);
  const programLike = /program|programme|event|karyakram|à¤•à¤¾à¤°à¥à¤¯à¤•à¥à¤°à¤®|gallery|album|latest|lateset|recent|naya|last|alumni|welcome/.test(lower);
  return wantsMedia && programLike;
};

const getGalleryGridQuery = (text: string) => {
  const cleaned = text
    .replace(/\b(mujhe|please|pls|dikhao|show|photos?|images?|pics?|tasveer|gallery|me|mein|ki|ke|ka|koi|hua|haua|tha|the|do|de|latest|lateset|recent)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'latest program';
};

const hasEventIntent = (text: string) => {
  const lower = text.toLowerCase();
  return /event|events|program|programme|karyakram|कार्यक्रम/.test(lower) && !hasGalleryPhotoIntent(text);
};

const getEventQuery = (text: string) =>
  text
    .replace(/\b(mujhe|please|pls|dikhao|show|batao|koi|latest|lateset|recent|abhi|ke|ka|ki|me|mein|hai|gaya|event|events|program|programme)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'latest';

const hasNotificationIntent = (text: string) =>
  /notification|notifications|notice|notices|alert|alerts|announcement|suchna|सूचना|नोटिस/i.test(text);

const hasMaterialIntent = (text: string) =>
  /study\s*material|material|materials|notes|pdf|ppt|powerpoint|excel|doc|file|folder|slides|matter|अध्ययन|सामग्री/i.test(text);

const hasPrincipalContactIntent = (text: string) => {
  const lower = text.toLowerCase();
  return /principal|principal\s*mam|प्रिंसिपल|प्रधानाचार्य/.test(lower) && /phone|mobile|contact|number|email|mail|gmail|नंबर|फोन|ईमेल/.test(lower);
};

const hasCollegeBasicInfoIntent = (text: string) => {
  const lower = text.toLowerCase();
  return /lohia|college|address|contact|phone|number|email|gmail|location|pata|sampark|पता|संपर्क|फोन|नंबर|ईमेल/.test(lower) &&
    /address|contact|phone|number|email|gmail|location|pata|sampark|पता|संपर्क|फोन|नंबर|ईमेल/.test(lower) &&
    !/principal|sir|mam|teacher|faculty/.test(lower);
};

type CollegeInfoField = 'address' | 'phone' | 'email';

const getRequestedCollegeInfoFields = (text: string): CollegeInfoField[] => {
  const lower = text.toLowerCase();
  const fields: CollegeInfoField[] = [];
  if (/address|location|pata|पता|स्थान/.test(lower)) fields.push('address');
  if (/contact|phone|number|mobile|sampark|फोन|नंबर|संपर्क/.test(lower)) fields.push('phone');
  if (/email|gmail|mail|ईमेल/.test(lower)) fields.push('email');
  return fields.length > 0 ? fields : ['address', 'phone', 'email'];
};

const getRequestedCourseName = (text: string) => {
  const lower = text.toLowerCase();
  if (/\bbca\b|b\.c\.a|bachelor\s*of\s*computer/.test(lower)) return 'BCA';
  if (/\bmca\b|m\.c\.a|master\s*of\s*computer/.test(lower)) return 'MCA';
  if (/\bbba\b|b\.b\.a/.test(lower)) return 'BBA';
  if (/\bbsc\b|b\.sc/.test(lower)) return 'B.Sc';
  if (/\bmsc\b|m\.sc/.test(lower)) return 'M.Sc';
  if (/\bbcom\b|b\.com/.test(lower)) return 'B.Com';
  if (/\bba\b|b\.a/.test(lower)) return 'B.A';
  return '';
};

const hasFutureCourseIntent = (text: string) => {
  const lower = text.toLowerCase();
  return !!getRequestedCourseName(text) && /kab|aayegi|ayega|ayegi|start|shuru|admission|available|आएगी|आएगा|कब|शुरू/.test(lower);
};

const hasRepairInfoIntent = (text: string) =>
  /marmat|repair|renovation|nirman|construction|मरम्मत|निर्माण|renovate/i.test(text);

const hasStaffCountIntent = (text: string) =>
  /how\s*many|kitne|total|number|count|कितने/i.test(text) && /people|staff|faculty|teacher|working|काम|members/i.test(text);

const hasTeacherComparisonIntent = (text: string) => {
  const lower = text.toLowerCase();
  return /sir|mam|teacher|faculty|professor|ji/.test(lower) && /better|best|ache|acche|acha|compare|kon|kaun|कौन|अच्छ/i.test(lower) && /\b(aur|or|vs|and)\b/i.test(lower);
};

const hasChatbotComparisonIntent = (text: string) => {
  const lower = text.toLowerCase();
  // Ensure both parts are present: chatbot/AI mention AND comparison
  return (
    /\bchatbot\b|\bai\b|\bassistant\b/i.test(lower) &&
    /kaise|better|acha|accha|acche|alag|different|best|kyu|why/i.test(lower)
  );
};

const getCollegeSectionIntent = (text: string) => {
  const lower = text.toLowerCase();
  if (/history|इतिहास/.test(lower)) return 'history';
  if (/vision|विजन|दृष्टि/.test(lower)) return 'vision';
  if (/mission|मिशन/.test(lower)) return 'mission';
  if (/library|पुस्तकालय/.test(lower)) return 'library';
  if (/hostel|छात्रावास/.test(lower)) return 'hostel';
  return '';
};

const getCollegeSectionIntents = (text: string) => {
  const lower = text.toLowerCase();
  const keys: string[] = [];
  if (/history|इतिहास/.test(lower)) keys.push('history');
  if (/vision|विजन|दृष्टि/.test(lower)) keys.push('vision');
  if (/mission|मिशन/.test(lower)) keys.push('mission');
  if (/library|पुस्तकालय/.test(lower)) keys.push('library');
  if (/hostel|छात्रावास/.test(lower)) keys.push('hostel');
  return keys;
};

const isInappropriateOrVulgar = (text: string) => {
  const lower = text.toLowerCase();
  return /(sexy|hot|gandu|gãndu|saale|salaa|bc\b|mc\b|cotiya|chutiya|bhadwa|saala|randi|gali|gaali|bastard|fuck|asshole|bitch|slut|harami|haramee)/i.test(lower);
};

const isHarmfulOrViolent = (text: string) => {
  const lower = text.toLowerCase();
  return /(mar dunga|maar dunga|maar doonga|mar doonga|murder|kill|hate|hinsa|à¤¹à¤¿à¤‚à¤¸à¤¾|hatred|attack|nuksan|à¤¨à¥à¤•à¤¸à¤¾à¤¨|harm|hurt)/i.test(lower);
};

const hasNegativeFeedbackIntent = (text: string) => {
  const lower = text.toLowerCase();
  if (isHarmfulOrViolent(text)) return false;
  return /kharab|bura|bur[a-z]*|bekar|bad|worst|poor|ghatiya|achha\s+nahi|acha\s+nahi|nahi\s+padhate|à¤¨à¤•à¤¼à¤°à¤¾à¤¬|à¤–à¤°à¤¾à¤¬|à¤¬à¥à¤°à¤¾|à¤¬à¥‡à¤•à¤¾à¤°|à¤˜à¤Ÿà¤¿à¤¯à¤¾|complaint|shikayat|à¤¶à¤¿à¤•à¤¾à¤¯à¤¤|problem|issue/.test(lower);
};

const hasPersonFeedbackIntent = (text: string) => {
  const lower = text.toLowerCase();
  if (isHarmfulOrViolent(text)) return false;
  return hasNegativeFeedbackIntent(text) && /sir|mam|ma'am|madam|teacher|faculty|professor|principal|padhate|padate|teach|teaching|ji|à¤¸à¤°|à¤®à¥ˆà¤¡à¤®|à¤¶à¤¿à¤•à¥à¤·à¤•|à¤ªà¤¢à¤¼à¤¾à¤¤à¥‡|à¤ªà¥à¤°à¤¿à¤‚à¤¸à¤¿à¤ªà¤²/.test(lower);
};

const formatExamRows = (rows: any[], subject?: string) => {
  const clarification = rows.find((row: any) => row?.needs_clarification);
  if (clarification) {
    return clarification.message || 'Exam schedule ke liye kripya status, level aur semester batayein.';
  }

  if (!rows.length) {
    return `${subject || 'Is subject'} ke matching exam records abhi available information me nahi mile. Kripya status, level aur semester check karke dobara search karein.`;
  }
  const table = [
    '| Subject | Paper | Status | Level | Semester | Date | Time |',
    '|---|---|---|---|---|---|---|',
    ...rows.map((row: any) => `| ${row.subject || '-'} | ${row.paper || '-'} | ${row.status || '-'} | ${row.level || '-'} | ${row.semester || '-'} | ${row.exam_date || '-'} | ${row.exam_time || '-'} |`)
  ].join('\n');
  return `**Exam schedule:**\n\n${table}`;
};

const formatKnowledgeItemResponse = (items: any[]) => {
  const usefulItems = (items || []).slice(0, 3);
  if (usefulItems.length === 0) return '';

  const blocks = usefulItems.map((item: any) => {
    const answer = item.answer_text || item.summary || item.title;
    const files = [
      item.main_file,
      ...((Array.isArray(item.attachments) ? item.attachments : []) || [])
    ].filter(Boolean);

    const fileLines = files.slice(0, 6).map((file: any) => {
      const label = file?.name || file?.type || 'Attachment';
      return file?.url ? `- [${label}](${file.url})` : '';
    }).filter(Boolean);

    return [
      `**${item.title || 'Information'}**`,
      answer,
      fileLines.length > 0 ? `\nRelated files:\n${fileLines.join('\n')}` : ''
    ].filter(Boolean).join('\n\n');
  });

  return blocks.join('\n\n---\n\n');
};

const formatPrincipalContactResponse = async () => {
  const [principal, principalMobile, principalEmail, collegePhone, collegeEmail] = await Promise.all([
    getPrincipalInfo(),
    supabase.from('college_info').select('value').eq('key', 'principal_mobile').maybeSingle(),
    supabase.from('college_info').select('value').eq('key', 'principal_email').maybeSingle(),
    supabase.from('college_info').select('value').eq('key', 'college_phone').maybeSingle(),
    supabase.from('college_info').select('value').eq('key', 'college_email').maybeSingle()
  ]);

  return `**Principal Mam contact details:**\n\n| Detail | Information |\n|---|---|\n| Name | ${principal?.value || COLLEGE_CONTACTS.principalName} |\n| Mobile | ${principalMobile.data?.value || COLLEGE_CONTACTS.principalMobile} |\n| Email | ${principalEmail.data?.value || COLLEGE_CONTACTS.principalEmail} |\n| College Office | ${collegePhone.data?.value || COLLEGE_CONTACTS.officePhone} |\n| College Email | ${collegeEmail.data?.value || COLLEGE_CONTACTS.officeEmail} |`;
};

const formatCollegeBasicInfoResponse = async (prompt: string) => {
  const requestedFields = getRequestedCollegeInfoFields(prompt);
  const [address, phone, email] = await Promise.all([
    supabase.from('college_info').select('value').eq('key', 'college_address').maybeSingle(),
    supabase.from('college_info').select('value').eq('key', 'college_phone').maybeSingle(),
    supabase.from('college_info').select('value').eq('key', 'college_email').maybeSingle()
  ]);

  const values = {
    address: { label: 'Address', value: address.data?.value || COLLEGE_CONTACTS.collegeAddress },
    phone: { label: 'Contact Number', value: phone.data?.value || COLLEGE_CONTACTS.officePhone },
    email: { label: 'Email', value: email.data?.value || COLLEGE_CONTACTS.officeEmail }
  };

  if (requestedFields.length === 1) {
    const field = values[requestedFields[0]];
    return `Lohia College ka ${field.label.toLowerCase()}: **${field.value}**`;
  }

  const rows = requestedFields.map(field => `| ${values[field].label} | ${values[field].value} |`);
  return `**Lohia College details:**\n\n| Detail | Information |\n|---|---|\n${rows.join('\n')}`;
};

const formatFutureCourseResponse = async (prompt: string) => {
  const courseName = getRequestedCourseName(prompt);
  const [allCourses, courseMatches, computerMatches, knowledgeMatches, universalMatches] = await Promise.all([
    searchCourses(undefined, ''),
    searchCourses(undefined, courseName),
    searchCourses(undefined, 'computer BCA CIT'),
    searchKnowledgeItems(`${prompt} ${courseName} course admission approval start date`),
    searchAllCollegeData(`${prompt} ${courseName} course admission approval start date computer`)
  ]);

  const normalize = (value: any) => String(value || '').toLowerCase();
  const exactCourses = (courseMatches || []).filter((course: any) =>
    normalize(`${course.name} ${course.subjects} ${course.stream}`).includes(courseName.toLowerCase())
  );

  if (exactCourses.length > 0) {
    const rows = exactCourses.slice(0, 5).map((course: any) =>
      `| ${course.name || courseName} | ${course.stream || '-'} | ${course.total_seats || '-'} | ${course.admission_start_date || '-'} | ${course.admission_last_date || '-'} | ${course.convener_name || '-'} | ${course.convener_contact || '-'} |`
    );
    return [
      `**${courseName} se related available course details:**`,
      '',
      '| Course | Stream | Seats | Admission Start | Last Date | Convener | Contact |',
      '|---|---|---|---|---|---|---|',
      ...rows
    ].join('\n');
  }

  const exactKnowledge = (knowledgeMatches || []).filter((item: any) =>
    normalize(`${item.title} ${item.summary} ${item.answer_text} ${item.extracted_text}`).includes(courseName.toLowerCase())
  );
  if (exactKnowledge.length > 0) {
    const answer = formatKnowledgeItemResponse(exactKnowledge);
    if (answer) return answer;
  }

  const relatedCourses = [
    ...(computerMatches || []),
    ...(allCourses || []).filter((course: any) => /computer|bca|cit|b\.c\.a/i.test(`${course.name} ${course.subjects} ${course.stream}`))
  ].filter((course: any, index: number, arr: any[]) =>
    index === arr.findIndex((item: any) => item.id === course.id || item.name === course.name)
  ).slice(0, 5);

  const relatedRows = relatedCourses.map((course: any) =>
    `| ${course.name || '-'} | ${course.stream || '-'} | ${course.total_seats || '-'} | ${course.admission_start_date || '-'} | ${course.admission_last_date || '-'} |`
  );

  const hasAnyRelatedSignal = relatedRows.length > 0 || (universalMatches || []).length > 0;
  const relatedBlock = relatedRows.length > 0
    ? `\n\nRelated course/admission entries jo abhi visible hain:\n\n| Course | Stream | Seats | Admission Start | Last Date |\n|---|---|---|---|---|\n${relatedRows.join('\n')}`
    : '';

  return `${courseName} kab start hoga, iski confirmed official date abhi mujhe nahi mili. Maine course/admission information me ${courseName} ka exact active entry check kiya, lekin exact start date ya approval notice nahi दिख रहा.${relatedBlock}\n\nIsliye is par final confirmation ke liye college office se contact karna better rahega. Jaise hi ${courseName} se related official notice/course entry add hogi, main uske hisaab se direct date aur details bata paunga.${hasAnyRelatedSignal ? '' : ' Aapko hui takleef ke liye khed hai.'}`;
};

const formatAlertsResponse = (alerts: any[]) => {
  const rows = (alerts || []).slice(0, 8);
  if (!rows.length) {
    return 'Abhi koi matching notification nahi mili. Bell icon par full notifications feed check kar sakte hain.';
  }
  return [
    '**Latest notifications:**',
    '',
    '| Date | Title | Detail | File |',
    '|---|---|---|---|',
    ...rows.map((alert: any) => {
      const attachmentLinks = Array.isArray(alert.attachments)
        ? alert.attachments.slice(0, 3).map((file: any) => file?.url ? `[${file.name || 'File'}](${file.url})` : '').filter(Boolean)
        : [];
      const file = alert.file_url ? `[Open](${alert.file_url})` : (attachmentLinks.length ? attachmentLinks.join(', ') : '-');
      return `| ${alert.date || alert.created_at?.slice?.(0, 10) || '-'} | **${alert.title || '-'}** | ${alert.description || '-'} | ${file} |`;
    })
  ].join('\n');
};

const formatMaterialsResponse = (materials: any[]) => {
  const rows = (materials || []).slice(0, 8);
  if (!rows.length) {
    return 'Study material ke matching files abhi nahi mili. Agar aap subject ya material ka naam bata denge to main us hisaab se dobara check kar dungi.';
  }
  const lines = rows.map((mat: any) => {
    const files = Array.isArray(mat.files) ? mat.files : [];
    const links = files.slice(0, 5).map((file: any) => file?.url ? `[${file.name || 'File'}](${file.url})` : '').filter(Boolean);
    if (mat.file_url) links.push(`[${mat.title || 'File'}](${mat.file_url})`);
    return `- **${mat.title || 'Study Material'}**${links.length ? `: ${links.join(', ')}` : ''}`;
  });
  return `**Study material found:**\n\n${lines.join('\n')}`;
};

const formatPastPrincipalRows = (rows: any[], query: string) => {
  if (!rows.length) return 'Is year ke principal ki matching jaankari abhi nahi mili.';
  return [
    `**${query} ke principal record:**`,
    '',
    '| Name | From | To | Notes |',
    '|---|---|---|---|',
    ...rows.slice(0, 10).map((row: any) => `| **${row.name || '-'}** | ${row.from_date || '-'} | ${row.to_date || '-'} | ${row.bio || row.tenure || '-'} |`)
  ].join('\n');
};

const formatCollegeSectionRows = (rows: any[], key: string) => {
  if (!rows.length) {
    return 'Yeh jaankari abhi mere paas poori tarah available nahi hai. Details update hote hi main aapko better answer de paunga.';
  }
  return rows.slice(0, 3).map((row: any) => `**${row.title || key}**\n\n${row.content || row.description || ''}`).join('\n\n');
};

const buildPersonFeedbackResponse = async (prompt: string, semanticCorrection: string | null) => {
  const [principalMobile, principalEmail, collegePhone, collegeEmail, facultyMatches] = await Promise.all([
    supabase.from('college_info').select('value').eq('key', 'principal_mobile').maybeSingle(),
    supabase.from('college_info').select('value').eq('key', 'principal_email').maybeSingle(),
    supabase.from('college_info').select('value').eq('key', 'college_phone').maybeSingle(),
    supabase.from('college_info').select('value').eq('key', 'college_email').maybeSingle(),
    searchFaculty({ name: semanticCorrection || prompt })
  ]);

  const person = facultyMatches?.[0]?.name || (prompt.toLowerCase().includes('principal') ? 'Principal Mam' : 'sir/mam');
  const principalContact = principalMobile.data?.value || COLLEGE_CONTACTS.principalMobile;
  const principalMail = principalEmail.data?.value || COLLEGE_CONTACTS.principalEmail;
  const officePhone = collegePhone.data?.value || COLLEGE_CONTACTS.officePhone;
  const officeMail = collegeEmail.data?.value || COLLEGE_CONTACTS.officeEmail;

  return `Aapki baat samajh raha hoon. Agar ${person} ki teaching ya behaviour se related koi real problem hai, to sabse pehle issue ko specific points me note karein, jaise topic samajh nahi aa raha, class timing, notes, language, ya doubt-clearing.

Behtar rahega ki aap pehle politely unse apni difficulty share karein. Agar phir bhi problem solve na ho, to Lohia College office ya Principal Mam se formal guidance le sakte hain.

**Contact for guidance:**

| Channel | Detail |
|---|---|
| Principal Mam | ${principalContact} |
| Principal Email | ${principalMail} |
| College Office | ${officePhone} |
| College Email | ${officeMail} |

Complaint likhte time personal language ke bajay exact issue likhein, taaki college side se sahi action ya support mil sake.`;
};

// GLOBAL REDIS CACHE HELPERS
async function getGlobalCache(key: string): Promise<string | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 800); // 800ms timeout for cache

  try {
    const res = await fetch('/api/chat/cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get', key: `global_cache:${normalizeText(key)}` }),
      signal: controller.signal
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.value || null;
  } catch (e) {
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function setGlobalCache(key: string, value: string) {
  try {
    await fetch('/api/chat/cache', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'set', key: `global_cache:${normalizeText(key)}`, value, ttl: 86400 }) // 24h
    });
  } catch (e) {
    // Ignore errors for cache setting
  }
}

if (!defaultApiKey) {
  console.warn('Lohia AI: Switching to fallback engine for text processing.');
}


export const CHAT_MODEL = "gemini-2.0-flash";

export interface Message {
  role: "user" | "model" | "assistant" | "tool";
  content: string | null;
  image?: File;
  provider?: string;
  tool_calls?: any[];
  tool_call_id?: string;
  name?: string;
}

export const facultySearchTool: FunctionDeclaration = {
  name: "search_faculty",
  description: "Search for faculty members by name, department, or designation. Returns a list of matching faculty. If the user asks for a specific detail like qualification, contact, etc., DO NOT use the [[FACULTY_EXPLORER:...]] marker, simply answer the question in text. Only use the marker if they ask for the full profile, photo, or general information without a specific question.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      department: { type: Type.STRING, description: "e.g. 'Hindi', 'Physics', 'Arts'" },
      name: { type: Type.STRING, description: "Full or partial name of the professor" },
      designation: { type: Type.STRING, description: "e.g. 'Professor', 'Assistant Professor'" }
    }
  }
};

export const principalTool: FunctionDeclaration = {
  name: "get_principal_info",
  description: "Get current principal details and image."
};

export const collegeSectionsTool: FunctionDeclaration = {
  name: "get_college_info_sections",
  description: "Get detailed text sections about college history, library, founder, vision, mission, hostel, and MGSU examination rules.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      key: { type: Type.STRING, description: "Key of section. Must be one of: 'history', 'library', 'founder', 'vision', 'mission', 'hostel', 'exam_general', 'exam_theory', 'exam_practical', 'exam_passing', 'exam_cbc_grading'" }
    }
  }
};

export const pastPrincipalsTool: FunctionDeclaration = {
  name: "get_past_principals",
  description: "Retrieve historical records for Lohia College principals. ALWAYS call this tool when the user provides or asks about a year (e.g. 1995, 1980, 1945). College records start from 1945 onwards. Do not assume data is narrow.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Year (e.g. '1995') or name of the principal" }
    },
    required: ["query"]
  }
};

export const achievementsTool: FunctionDeclaration = {
  name: "get_achievements",
  description: "Get list of academic achievements, research projects, and publications by students and faculty.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Search query to find a specific achievement" }
    }
  }
};

export const mainExamsTool: FunctionDeclaration = {
  name: "search_main_exams",
  description: "Search verified main exam schedules from college database. Use query for the user's original wording. If status, level, or semester are missing, this tool returns a clarification request instead of guessing.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "The user's full original exam/paper question in their own words" },
      department: { type: Type.STRING, description: "Optional: broad department/stream such as Science, Arts, Commerce" },
      subject: { type: Type.STRING, description: "Optional: specific subject such as Physics, Chemistry, Hindi, ABST" },
      level: { type: Type.STRING, description: "UG or PG if the user has provided it" },
      semester: { type: Type.NUMBER, description: "Semester number between 1 and 6 if provided" },
      status: { type: Type.STRING, description: "Collegiate or Non-Collegiate if provided" }
    }
  }
};

export const studyMaterialTool: FunctionDeclaration = {
  name: "get_study_material",
  description: "Search for practical files, charts, and study materials for download.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Search term for the title of the notes/file" },
      department: { type: Type.STRING },
      level: { type: Type.STRING },
      semester: { type: Type.NUMBER },
      material_type: { type: Type.STRING }
    }
  }
};

export const gallerySearchTool: FunctionDeclaration = {
  name: "search_gallery",
  description: "Search for images and videos in the college gallery. If no category or query is provided, it returns the most recent items. Always use this to find media for the user.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING, description: "Gallery category like 'NCC', 'Sports', 'Cultural'. Use 'General' if unsure or looking for recent ones." },
      query: { type: Type.STRING, description: "Search query for title" }
    }
  }
};

export const galleryCategoriesTool: FunctionDeclaration = {
  name: "get_gallery_categories",
  description: "List all existing gallery categories to help the user choose one."
};

export const eventSearchTool: FunctionDeclaration = {
  name: "search_events",
  description: "Search for college events. Useful for finding latest events, events by name, or events in a specific timeframe.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Name or topic of the event" },
      timeframe: { type: Type.STRING, description: "Can be 'latest', 'upcoming', 'past_7_days', 'past'" }
    }
  }
};

export const coursesSearchTool: FunctionDeclaration = {
  name: "search_courses",
  description: "Search for courses, seats, and optional subjects by stream.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      stream: { type: Type.STRING, description: "e.g. 'Arts', 'Science', 'Commerce', 'Management'" },
      query: { type: Type.STRING, description: "Search query for course names or subjects" }
    }
  }
};

// Removed admissionInfoTool as admission info is now in courses

// Removed examPassingRulesTool as it is now handled by collegeSectionsTool

export const knowledgeBaseTool: FunctionDeclaration = {
  name: "search_knowledge_base",
  description: "Search for general college FAQs, rules, facilities, canteen, parking, library rules, or miscellaneous info NOT covered by faculty, exams, or courses.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "The general query or topic to search for" }
    }
  }
};

export const knowledgeItemsTool: FunctionDeclaration = {
  name: "search_knowledge_items",
  description: "Search admin-uploaded college knowledge items with short ready answers and related attachments such as PDFs, images, docs, Excel, PPT, or videos. Use this for any uploaded notice, circular, programme information, document, or miscellaneous college question.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "User question or topic to search uploaded knowledge items for" }
    }
  }
};

export const practicalExamsTool: FunctionDeclaration = {
  name: "search_practical_exams",
  description: "Search for practical exam dates and batch timings.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      department: { type: Type.STRING },
      level: { type: Type.STRING },
      semester: { type: Type.NUMBER }
    }
  }
};

export const practicalStudentSearchTool: FunctionDeclaration = {
  name: "search_practical_students",
  description: "Search for specific student schedule and seat number in practical exams.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      department: { type: Type.STRING },
      status: { type: Type.STRING },
      level: { type: Type.STRING },
      semester: { type: Type.NUMBER }
    },
    required: ["name"]
  }
};

export const meritListTool: FunctionDeclaration = {
  name: "search_merit_list",
  description: "Search for college toppers and merit list records (academic) by student name, year, or board type. Map BSc/B.Sc/MSC/M.Sc/science to Science records; BA/arts to Arts; BCom/commerce to Commerce. If user gives a year and course, pass both year and board/course terms.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      student_name: { type: Type.STRING, description: "Name of the student to search for" },
      exam_year: { type: Type.STRING, description: "e.g. '1947', '2023'" },
      board_type: { type: Type.STRING, description: "e.g. 'Degree Exam (Science)'" }
    }
  }
};

export const sportsTool: FunctionDeclaration = {
  name: "search_sports",
  description: "Search for sports records, tournament winners, University Colour Holders, and medal-like sports achievements. ALWAYS call this if the user asks about sports history, football, kabaddi, medals, winners, or gold medalists. If the user says football/foot-ball, search sport=football and return all football records; do not require the words gold/medalist to exist in the record.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Search query like student name or achievement" },
      sport: { type: Type.STRING, description: "Specific sport like 'Football', 'Kabaddi', 'Volleyball'" },
      year: { type: Type.STRING, description: "Year of the achievement" }
    }
  }
};

export const materialsChatSearchTool: FunctionDeclaration = {
  name: "search_materials_chat",
  description: "Search for college study materials, notes, PDFs, PowerPoint files, Excel sheets, files, slides, uploads, or folders by title/keyword.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Topic, folder title, subject, or filename to search study materials for" }
    }
  }
};

export const alertsChatSearchTool: FunctionDeclaration = {
  name: "search_alerts_chat",
  description: "Search for academic notifications, college notices, announcements, broadcasts, and alerts.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: "Keyword or topic to find matching notifications or announcements" }
    }
  }
};

const SEARCH_KEYWORDS = {
  academic: ['exam', 'paper', 'result', 'study', 'semester', 'exam form', 'timetable', 'pariksha', 'kabs', 'material', 'papers', 'notification', 'notifications', 'notice', 'notices', 'announcement', 'announcements', 'broadcast', 'alert', 'alerts'],
  faculty: ['teacher', 'faculty', 'professor', 'hod', 'principal', 'staff', 'gothwal', 'sharma', 'balai', 'sir', 'madam', 'profile', 'dikhao', 'show', 'photo'],
  admin: ['fees', 'scholarship', 'hostel', 'admission', 'college info', 'nss', 'ncc', 'complaint', 'naye form', 'new form', 'entry form', 'document', 'form'],
  vision: ['extract', 'id card', 'slip', 'marksheet', 'upload'],
  gallery: ['photo', 'image', 'video', 'gallery', 'album', 'tasveer', 'dikhao', 'pics', 'media', 'program'],
  event: ['event', 'karyakram', 'program', 'festival', 'latest event', 'upcoming event'],
  toppers: ['topper', 'toppers', 'merit', 'gold medal', 'medal', 'rank', 'first position', '1st rank', 'position holder']
};

const AGENT_PERSONAS = {
  orchestrator: `You are the Coordinator for Lohia College AI. Bridge the gap between student and experts.`,
  academic: `Expert: Academic Agent. FOCUS: Exams, Timetables, Study Material, and Academic Alerts/Notifications. Goal: Provide specific dates, PDFs, folder files, and notices instantly.`,
  faculty: `Expert: Faculty Agent. FOCUS: Teachers, HODs, and Profiles. Goal: Show WhatsApp-style cards with photos.`,
  admin: `Expert: Admin Agent. FOCUS: Fees, Scholarship, & Admissions Info. Goal: Direct links to government portals.`,
  vision: `Expert: Vision Agent. FOCUS: OCR and Identity Extraction. Goal: Confirm data accuracy from uploaded images.`,
  gallery: `Expert: Gallery Specialist. FOCUS: Visual Media, Albums, and Event Records. Goal: Proactively find and present relevant photos and videos. If the user asks for photos of a specific person or event (e.g., 'Alumni'), search for it and use [[GALLERY_GRID:Query]] to show a summary grid. If they just want a general view, use [[GALLERY_SLIDER:Category]]. You are "Ultra Smart" â€“ you ignore minor typos and find related media automatically. CRITICAL: If the [SEMANTIC_HINT] or [Context] provides any media results, you MUST use the grid or slider marker. Never apologize for missing photos if data is present in the context.`,
  event: `Expert: Event Manager. FOCUS: Events, schedules, speakers, and event images. Goal: Always use [[EVENT_EXPLORER:optionalQuery]] to show the rich event UI. If query has typos, suggest the closest match.`,
  toppers: `Expert: Toppers & Merit Specialist. FOCUS: College toppers, gold medalists, and merit lists from archives. DO NOT use ANY hardcoded year ranges like 1984-1995 or 1945 — ALWAYS get the actual min/max years from the search_merit_list results. Goal: Always use [[TOPPERS_EXPLORER:Board:SearchQuery]] (e.g., [[TOPPERS_EXPLORER:Degree Exam (Science):1985]] or [[TOPPERS_EXPLORER::1985]]) using colons to show the Hall of Fame UI. ALWAYS call 'search_merit_list' to find names from college records, present their names in the text response, and append the explorer.`
};

const SYSTEM_PROMPT = `You are "Lohia College AI", a High-Performance Multi-Agent System. 

### LIGHTNING SPEED RULES (MANDATORY):
- **NO FLUFF**: Skip "I can help with that", "Sure", or "Based on your query".
- **NO INTERNAL REASONING LEAKS**: Never output words like "analysis", "tool", "system", "need to", "we need", or your private reasoning. Only output the final user-facing answer.
- **NO TECHNICAL WORDS TO USER**: Never say internal/source words such as storage names, helper names, or search process words in the final answer. Use natural words like "available information", "college records", "official notice", "details", or "updates".
- **ZERO LATENCY START**: State the answer or show the UI marker in the VERY FIRST sentence.
- **SHORT-CIRCUIT**: If [Context] provides a definitive answer or marker, USE IT IMMEDIATELY.
- **TONE**: Senior Assistant. Fast, accurate, and proactive.
- **LANGUAGE**: Respond in the EXACT language of the user (Hinglish/Hindi/English).
- **FORMATTING**: Use Markdown Tables for structured data like timetables or merit records EXCEPT for Events. NEVER output a markdown table or list of events in the chat message. For event schedule/details queries, use the [[EVENT_EXPLORER:Query]] marker and provide a brief greeting. If the user asks for photos/images of an event/programme, use [[GALLERY_GRID:Query]] instead of EVENT_EXPLORER.
- **FIELD-ONLY ANSWERS**: If the user asks for one specific field of a person or record (qualification, phone/mobile/contact, email, father name, joining date, designation, subject, seat number, date), answer ONLY that requested field plus the person's name for clarity. Do NOT open a full profile/card/explorer. If they ask for two or more fields, provide only those fields in a small Markdown table.
- **COMPLAINT / NEGATIVE FEEDBACK**: If the user complains about a teacher, principal, staff member, teaching quality, behaviour, or says someone is bad/worst/not teaching well, DO NOT show forms, profile cards, or images. Respond like a mature human: acknowledge the concern, avoid insulting anyone, ask for specific issue, and provide college/principal contact or grievance guidance.

### MULTI-AGENT PROTOCOL:
- **Academic Specialist**: Use [[EXAM_RESULTS]], [[EXAM_FORM]], or [[EXAM_EXPLORER]]. 
- **Faculty Specialist**: Use [[FACULTY_LIST]] or [[FACULTY_EXPLORER]].
- **Admin Specialist**: Provide direct links and info about fees/scholarships.
- **Gallery/Event Specialist**: Use [[GALLERY_GRID]] for event/program photos and [[EVENT_EXPLORER]] only for event details/schedules.
- **Toppers Specialist**: Return clean Markdown tables from college records.

### DOMAIN RESTRICTION:
- Answer ONLY Lohia College related questions. Polite refusal for others.
- **TECHNOLOGY/DEVELOPER QUERIES**: If the user asks how you were made, what technology was used (like Google, Gemini, OpenRouter, React), who developed/created you, or who made this project, YOU MUST reply exactly with: "Main is project ko banane wale ya developer ke baare mein jaankari nahi de sakti. Agar aap sach mein madad karna chahte hain, to jo share ka button hai usme Google form hai, usme agar aapke paas college se related koi bhi jaankari hai to de sakte hain jisse hum is Lohia College AI ko aur behtar aur smart bana sake. Thank you. Agar aapki college se related query hai to aap pooch sakte hain." DO NOT name any technologies, developers, or companies.
- **CRITICAL FACT**: Admission 2026-27 (Regular B.A/B.Sc/B.Com Part 1) started on **May 1, 2026** and the LAST DATE is **June 6, 2026**. Nodal Officer UG Admission is **Dr. Umed Singh Gothwal** (Phone: **9414203821**). Stream-wise Course Contacts & Conveners: B.A. (Mohd Javed Khan - 9785159841), B.Sc. Bio/Math (Dr. Mukesh Kumar Meena - 8005763754), B.Com./BBA (Dr. Mahendra Kumar Khardiya - 9928273463), AEDP (Dr. Madhu Sudan Pardhan - 9782582267). *NOTE: For detailed faculty information like qualifications, father's name, or full profile, YOU MUST ALWAYS call the 'search_faculty' tool even if their name is listed here.*
- **COLLEGE GENERAL INFO & SPECIAL SECTIONS**: For questions about college history, library (including number of books in the library), founder (Seth Kanhiya Lal Lohia), vision, mission, hostel facilities, or other general FAQ topics or facilities, YOU MUST call 'get_college_info_sections' (specifying key: 'library', 'hostel', 'founder', 'history', 'vision', 'mission' etc.) or 'search_knowledge_base' to get the actual authoritative content first. Never state you do not have this information or guess without checking.
- **FOUNDER INTENT**: If the user says "father of Lohia College", "college ke father", "founder", "kisne sthapit kiya", or similar, understand it as founder. Do NOT search faculty father_name for this. Start the answer with [[FOUNDER_CARD:Seth Kanhiya Lal Lohia:/founder.png]], then give the founder details from college context.
- **CURRENT PRINCIPAL INTENT**: If the user asks neutral information about the current principal or principal mam (name, who is, photo, profile, details), start with [[PRINCIPAL_CARD:Prof. Dr. Manju Sharma:${COLLEGE_CONTACTS.principalImageUrl}]], then answer the requested details. If the user is complaining, criticizing, or saying negative feedback about the principal, DO NOT show image/card; respond calmly and respectfully like a human, acknowledge their concern, and guide them to share a specific issue or contact the proper college office/grievance channel.
- **EXAM FACT**: Main Exams for 2026 are usually scheduled for March-May. Only refer the user to the [[EXAM_EXPLORER]] tool or [[EXAM_FORM]] if they specifically ask for a schedule, timetable, or dates. DO NOT show them for general greetings.
- **STUDY MATERIAL & UPLOADS**: If asked about study materials, PowerPoint files, PDFs, Excel sheets, notes, slides or folder structures, call 'search_materials_chat' tool and list the matches. Present files clearly with download links if available.
- **UPLOADED KNOWLEDGE ITEMS**: For admin-uploaded notices, circulars, documents, images, PDFs, Office files, videos, or general college information, call 'search_knowledge_items'. Use answer_text first for a short answer. If main_file or attachments exist, include clear links in the answer. Do not paste long extracted text unless the user asks for full detail.
- **NOTIFICATIONS & NOTICES**: If asked about notices, notifications, alerts, or broadcasts, call 'search_alerts_chat' tool and share the notices. Present the title, date, description, and any file attachments/downloads clearly. Remind them that they can view the full notifications feed by clicking the Bell icon at the top of the screen.

###  INTELLIGENCE:
- Fix typos automatically (e.g., "umesd" -> Dr. Umed Singh Gothwal).
- If context has a matched person, answer the user's requested field(s) first. Show a profile/explorer only when the user explicitly asks for photo, profile, full details, card, or "dikhao".
- For Vision/Mission/Hostel/Exam Rules: If user asks a SPECIFIC QUESTION (like "how many rooms in hostel?", "how many books in library?"), extract ONLY the exact answer they asked for from the available data. If they ask for GENERAL INFORMATION, provide the full relevant context.
- For "passing marks" or "score" queries, ALWAYS check the 'customRules' from context or call 'get_exam_passing_rules' and provide detailed, accurate information based ONLY on that data.
- **EXAM FORM**: Use this ONLY if the user has NOT provided subject, status, level, or semester. If they have already searched (as in [Context]) and results were missing, DO NOT show this form. Marker: [[EXAM_FORM:SubjectName]]. CRITICAL: Do NOT output the interactive exam form ('[[EXAM_FORM:...]]') or exam explorer ('[[EXAM_EXPLORER:...]]') if the user is asking about "exam form" (परीक्षा फॉर्म). At Lohia College, "exam form" for first year/part 1 means the admission form. Give the regular admission details instead (online admission starts 1 May 2026, last date 6 June 2026, Nodal Officer Dr. Umed Singh Gothwal).
- **ADMISSION FORM**: If they ask for "admission form" or "new entry form", show the admission details.
- **NO REPETITIVE FORMS**: If [Context] says results were not found or if the user already provided all details, DO NOT show any form again. Use the guidance in [Context] to explain the situation. For simple greetings like "hi", "hello", DO NOT show any forms.
- **TOPPERS**: For questions about gold medalists, toppers, or merit list, ALWAYS call the merit search or use [COLLEGE_CONTEXT]. Do NOT use [[TOPPERS_EXPLORER]] unless the user explicitly asks to open/show the interactive topper explorer. Answer in a polished Markdown table with columns like Year, Board/Course, Student, Position, Division/Remarks. If 2+ records match, show all relevant rows in the table.
- **BSC/MSC MEANING**: If user says BSc, B.Sc, MSc, M.Sc, or misspells science as "scinece", treat it as Science merit records.
- **SPORTS BROAD MATCHING**: If user asks "football me gold medalist kaun hai" but the matching information is University Colour Holders or winning team records for football, give those football records. Do not answer "no gold medalist" merely because the exact word gold is absent. If no year is given, show all matching sport records; if a year is given, show that year's matching records.
- **PAST PRINCIPALS**: For year-based principal questions, answer in a polished Markdown table with Name, From, To, and Tenure/Notes. Do NOT use cards for past principals unless the user asks for photo/profile.
- **SMART SYNTHESIS & INDIRECT INFORMATION (CRITICAL)**: If the exact question is not a direct record (e.g., they ask about participating in a specific event/sport or contact a specific staff), but you have indirect or related info (such as general sports achievements, contact numbers of nodal officers, or related departments), do NOT refuse directly. Enthusiastically say something positive in their language (like "Haan, humare college me iska bohot achha scope hai!" or "Iske baare me related jaankari available hai!") and then present that related/indirect information to help them. Never say information is missing when related facts exist.
- **MISSING SPECIFIC DETAILS**: Only when there is absolutely no direct or indirect information at all, respond positively saying that you don't have the specific update yet but will update it soon, or guide them to check with the college office. Never apologize unnecessarily or say "this is not in the database".

### UI MARKERS (RAW TEXT, NO BACKTICKS):
- [[FACULTY_LIST:Department]] (Show ONLY if asked for a list of teachers in a department)
- [[FACULTY_EXPLORER:Name]] (Show ONLY if explicitly asked for profile, photo, or full details. DO NOT use if user asks for specific info like qualification, email, or contact)
- [[EXAM_RESULTS:Dept:Status:Level:Sem:Type]]
- [[EXAM_FORM:Subject:Status:Level:Sem]]
- [[EXAM_EXPLORER:Dept:Status:Level:Sem]]
- [[PRINCIPAL_CARD:Name:Img]]
- [[FOUNDER_CARD:Name:Img]]
- [[GALLERY_SLIDER:Category]]
- [[GALLERY_GRID:Query]]
- [[EVENT_EXPLORER:Query]]
- [[TOPPERS_EXPLORER:Board:SearchQuery]] (Use only when explicitly asked to open/show the topper explorer UI; normal topper answers should be Markdown tables)`;

// LOHIA DATA PRE-FETCH AGENT (Highly Optimized / Lazy)
async function prefetchCollegeContext(prompt: string, semanticCorrection: string | null, profile?: StudentProfile) {
  const lowerPrompt = prompt.toLowerCase();
  // Skip ALL pre-fetching and hardcoded responses for harmful/violent queries! Let the AI model handle it naturally!
  if (isHarmfulOrViolent(prompt)) {
    return null;
  }
  // Use shared constant instead of repeating the URL here
  const principalImageUrl = COLLEGE_CONTACTS.principalImageUrl;
  const hasFounderIntent = isFounderIntent(prompt);

  if (hasFounderIntent) {
    const [sections, matches] = await Promise.all([
      getCollegeSections('founder'),
      searchAllCollegeData(`${prompt} founder Seth Kanhiya Lal Lohia history`)
    ]);
    return `Context: Founder intent detected. Treat "father of Lohia College" as founder, not faculty father_name.
Response must start with [[FOUNDER_CARD:Seth Kanhiya Lal Lohia:/founder.png]]
[FOUNDER_COLLEGE_SECTIONS]: ${JSON.stringify(sections || []).substring(0, 3000)}
[UNIVERSAL_COLLEGE_MATCHES]: ${JSON.stringify(matches || []).substring(0, 5000)}`;
  }

  const synthesisIntent =
    lowerPrompt.includes('kaise acha') ||
    lowerPrompt.includes('kaise accha') ||
    lowerPrompt.includes('better') ||
    lowerPrompt.includes('different') ||
    lowerPrompt.includes('alag') ||
    lowerPrompt.includes('special') ||
    lowerPrompt.includes('khas') ||
    lowerPrompt.includes('best') ||
    lowerPrompt.includes('kyu') ||
    lowerPrompt.includes('why');

  if (synthesisIntent) {
    const matches = await searchAllCollegeData(`${prompt} history library courses seats faculty achievements sports events facilities scholarship hostel ncc nss`);
    return `[SYNTHESIS_COLLEGE_MATCHES]: ${JSON.stringify(matches || []).substring(0, 9000)}
Instruction: The user is asking a reasoning/comparison question. Build a smart answer by combining related college facts. Do not refuse just because no single row exactly matches.`;
  }

  const hasTopperIntent = hasMeritIntent(prompt);
  if (hasTopperIntent) {
    const meritRows = await searchMeritList({
      exam_year: extractYear(prompt),
      board_type: inferBoardType(prompt),
      student_name: prompt
    });
    return `[MERIT_COLLEGE_MATCHES]: ${JSON.stringify(meritRows || []).substring(0, 7000)}
Instruction: Answer topper/merit questions from these rows in a clean Markdown table. BSc/MSc means Science. If rows exist, never say no data found. Do not output TOPPERS_EXPLORER unless the user explicitly asks to open/show explorer.`;
  }

  // Sports intent is handled directly in generateChatResponseStream via formatSportsRows.
  // Do NOT also fetch here — it causes a duplicate DB call for every sports query.

  // 1. Current Principal Info (Keep this for the visual Principal card) - only for neutral, explicit queries
  const refersToPrincipal = lowerPrompt.includes('principal') || lowerPrompt.includes('mukhyadhyapak') || lowerPrompt.includes('manju sharma') || semanticCorrection === 'Manju Sharma';
  
  if (refersToPrincipal) {
    const isPastQuery = lowerPrompt.includes('past') || lowerPrompt.includes('purane') || lowerPrompt.includes('former') || lowerPrompt.match(/\b(19\d{2}|20\d{2})\b/);
    const isNegativeFeedback = hasNegativeFeedbackIntent(prompt);
    if (isNegativeFeedback) {
      return `Context: User is giving negative feedback/complaint about the principal. Do NOT show PRINCIPAL_CARD or image. Respond respectfully and humanly: acknowledge the concern, avoid agreeing with insulting language, ask for the specific issue, and guide them to the proper college office/grievance channel if needed.`;
    }
    if (!isPastQuery) {
      const [principal, principalInfo] = await Promise.all([
        getPrincipalInfo(),
        getPrincipalFullInfo()
      ]);
      
      let contextAddition = "";
      if (principal) {
        contextAddition += `\n[PRINCIPAL_NAME]: Current principal is ${principal.value}. Photo: ${principalImageUrl}`;
      }
      if (principalInfo?.value) {
        contextAddition += `\n[PRINCIPAL_INFO_DETAILS]: ${principalInfo.value}`;
      }
      
      const hasFieldOnlyQuery = hasFacultyFieldIntent(prompt);
      const isExplicitPrincipalQuery = 
        !hasFieldOnlyQuery &&
        (
          /who is|kaun hai|kon hai|name kya|kya name|profile|photo|image|details|kya ha|kaise hain/i.test(lowerPrompt) ||
          lowerPrompt.trim() === "principal" || 
          lowerPrompt.trim() === "principal mam" ||
          lowerPrompt.trim() === "प्रिंసిపల్" ||
          lowerPrompt.trim() === "ప్రధానాచార్య"
        );
      
      if (isExplicitPrincipalQuery && principal) {
        return `Context: Principal is ${principal.value}. Photo: ${principalImageUrl}. Response: Hamari college ki principal ${principal.value} hain. [[PRINCIPAL_CARD:${principal.value}:${principalImageUrl}]]\n${contextAddition}`;
      }
      
      return contextAddition;
    }
  }

  // 2. Admission 2026-27 Metadata (Keep this high-level - let tool fetch courses lazily!)
  if (
    lowerPrompt.includes('admission') || 
    lowerPrompt.includes('pravesh') || 
    lowerPrompt.includes('naye form') || 
    lowerPrompt.includes('new form') ||
    lowerPrompt.includes('exam form') ||
    lowerPrompt.includes('pariksha form') ||
    lowerPrompt.includes('परीक्षा फॉर्म') ||
    lowerPrompt.includes('परीक्षा फार्म')
  ) {
    const allMatches = await searchAllCollegeData(`${prompt} admission courses seats`);
    const matchesContext = allMatches.length > 0
      ? `\n\n[UNIVERSAL_COLLEGE_MATCHES]: ${JSON.stringify(allMatches).substring(0, 7000)}`
      : "";
    return `Context: 
- UG Admission 2026-27 is LIVE from May 1 to June 6, 2026.
- Nodal Officer UG Admission: Dr. Umed Singh Gothwal (Phone: 9414203821).
- Lohia College mein admission form aur exam form (for first year/part 1) ka ek hi matlab hai. Jab koi user exam form ke baare me puche, to use regular admission details hi dein aur koi bhi interactive exam form (EXAM_FORM or EXAM_EXPLORER) open na karein.
- For specific stream contacts, conveners, courses seats, or admission procedures, use the college matches below first and call 'search_courses' or 'get_college_info_sections' if more detail is needed.${matchesContext}`;
  }

  const genericMatches = await searchAllCollegeData([prompt, semanticCorrection, profile?.level, profile?.semester].filter(Boolean).join(' '));
  if (genericMatches.length === 0) return "";

  const requestedFieldInstruction = getRequestedFieldInstruction(prompt);
  return `[UNIVERSAL_COLLEGE_MATCHES]: ${JSON.stringify(genericMatches).substring(0, 9000)}
${requestedFieldInstruction}
Instruction: These are college information rows matched from the uploaded records. If any row answers the user's question, answer from it directly with exact names, dates, contacts, files, marks, seats, ranks, or links. Mention only useful rows, do not dump raw JSON.`;
}

export async function* generateChatResponseStream(
  history: Message[],
  prompt: string,
  imageFile?: File,
  profile?: StudentProfile, signal?: AbortSignal): AsyncGenerator<{ text: string; provider?: string }> {
  try {
    if (isInappropriateOrVulgar(prompt)) {
      const isEnglish = /^[a-zA-Z0-9\s\?\.\!\,\'\"]+$/.test(prompt) && !/ya|ko|se|me|ke|ki|hai|hain|kya|kaun|kab|kitna|he|gandu|saala|chutiya/i.test(prompt);
      if (isEnglish) {
        yield { text: "I'm sorry, but I can only help with requests related to Lohia College. If you have any questions about the college, feel free to ask!" };
      } else {
        yield { text: "Maaf kijiye, main keval Lohia College se jude sawalon ke liye hi aapki sahayata kar sakti hoon. Agar aapka college se related koi sawal hai, to kripya poochiye." };
      }
      return;
    }
    // FIX: Fast cache check must happen FIRST — before any DB/async calls
    // BUT SKIP CACHE FOR TOPPER/MERIT QUERIES, NEGATIVE QUERIES, OR HARMFUL QUERIES
    const isMeritQuery = hasMeritIntent(prompt);
    const isHarmfulOrNegative = 
      isHarmfulOrViolent(prompt) ||
      hasNegativeFeedbackIntent(prompt) || 
      hasPersonFeedbackIntent(prompt);
      
    if (!isMeritQuery && !isHarmfulOrNegative) {
      const fastAnswer = findFastAnswer(prompt);
      if (fastAnswer) {
        yield { text: fastAnswer, provider: "Lohia-Speed-Cache" };
        return;
      }
    }

    const semanticCorrection = findSemanticMatch(prompt);

    // Collect all matching responses instead of returning early
    const responses: string[] = [];

    // Only use college-specific helpers for neutral, college-related queries
    if (!isHarmfulOrNegative && hasCollegeDomainSignal(prompt)) {
      if (hasPrincipalContactIntent(prompt)) {
        responses.push(await formatPrincipalContactResponse());
      } else {
      // Only show principal card for neutral, explicit queries about principal (name, who is, profile, photo)
      const lowerPrompt = prompt.toLowerCase();
      const isFieldOnlyQuery = hasFacultyFieldIntent(prompt);
      const isNeutralPrincipalQuery = 
        !isFieldOnlyQuery &&
        (/principal|principal\s*mam|ప్రింసిపల్|ప్రధానాచార్య/i.test(prompt)) &&
        (
          /who is|what is|kaun hai|kon hai|name|profile|photo|image|details|kya ha|kaise hain/i.test(lowerPrompt) ||
          // Exact short queries like "principal" or "principal mam"
          lowerPrompt.trim() === "principal" || 
          lowerPrompt.trim() === "principal mam" ||
          lowerPrompt.trim() === "ప్రింసిపల్" ||
          lowerPrompt.trim() === "ప్రధానాచార్య"
        ) &&
        // NOT if it's negative feedback or harmful query
        !hasNegativeFeedbackIntent(prompt) &&
        !hasPersonFeedbackIntent(prompt);
        
      if (isNeutralPrincipalQuery) {
        const principalInfo = await getPrincipalInfo();
        responses.push(`[[PRINCIPAL_CARD:${principalInfo?.value || COLLEGE_CONTACTS.principalName}:${COLLEGE_CONTACTS.principalImageUrl}]]\n\nHamari college ki principal **${principalInfo?.value || COLLEGE_CONTACTS.principalName}** hain.`);
      }
    }

    if (hasCollegeBasicInfoIntent(prompt)) {
      responses.push(await formatCollegeBasicInfoResponse(prompt));
    }

    if (hasFutureCourseIntent(prompt)) {
      responses.push(await formatFutureCourseResponse(prompt));
    }

    if (hasRepairInfoIntent(prompt)) {
      const matches = await searchAllCollegeData(`${prompt} renovation repair construction building marmat`);
      if (matches.length === 0) {
        responses.push("Maaf kijiye, college ki marammat/renovation kab hui thi iski confirmed jaankari abhi mere paas nahi hai. Aapko hui takleef ke liye khed hai. Is type ki exact building-record detail ke liye college office se contact karna best rahega.");
      }
    }

    if (hasStaffCountIntent(prompt)) {
      const facultyRows = await searchFaculty({});
      responses.push(`Mere anusar Lohia College me **${facultyRows.length} faculty members** listed hain. Actual working staff count isse thoda kam-jyada ho sakta hai, kyunki office/non-teaching staff aur recent updates alag ho sakte hain.`);
    }

    if (hasTeacherComparisonIntent(prompt)) {
      responses.push("Sabhi teachers apni jagah respected aur important hain. Main kisi ek teacher ko doosre se better ya worse choose nahi kar sakti. Agar aapko kisi subject, teaching style, timing, notes ya doubt-clearing se related specific help chahiye, to issue bata dijiye, main us hisaab se practical guidance de dungi.");
    }

    if (hasChatbotComparisonIntent(prompt)) {
      responses.push("Lohia College AI ka fayda yeh hai ki yeh college ki practical zarooraton par focused hai: admission dates, notices, exam schedules, faculty contacts, study material, events, gallery photos, toppers aur sports records jaise answers jaldi aur clear format me dene ki koshish karta hai. General chatbot aksar broad jawab dete hain; yeh assistant college ke students aur visitors ke daily questions ke hisaab se banaya gaya hai.");
    }

    if (hasPersonFeedbackIntent(prompt)) {
      responses.push(await buildPersonFeedbackResponse(prompt, semanticCorrection));
    }

    if (isFounderIntent(prompt)) {
      const sections = await getCollegeSections('founder');
      const founderContent = sections?.[0]?.content || sections?.[0]?.title || 'Lohia College ke founder Seth Kanhiya Lal Lohia hain.';
      responses.push(`[[FOUNDER_CARD:Seth Kanhiya Lal Lohia:/founder.png]]\n\n**Founder:** Seth Kanhiya Lal Lohia\n\n${founderContent}`);
    }

    if (hasNegativeFeedbackIntent(prompt) && /principal|mukhyadhyapak|à¤ªà¥à¤°à¤¿à¤‚à¤¸à¤¿à¤ªà¤²|à¤ªà¥à¤°à¤§à¤¾à¤¨à¤¾à¤šà¤¾à¤°à¥à¤¯/i.test(prompt)) {
      responses.push("Aapki baat samajh raha hoon. Agar Principal Mam se related koi specific issue ya complaint hai, to kripya detail batayein taaki sahi guidance di ja sake. Vyakti ke liye apmaanjanak language use karne ke bajay exact issue clearly likhna behtar rahega. Formal complaint ke liye college office ya grievance channel se sampark karein.");
    }

    const lowerPrompt = prompt.toLowerCase();
    const isPrincipalFieldQuery = 
      (lowerPrompt.includes('principal') || lowerPrompt.includes('mukhyadhyapak') || semanticCorrection === 'Manju Sharma') &&
      hasFacultyFieldIntent(prompt);
    
    if (isPrincipalFieldQuery) {
      // Try to get detailed info from principal_info row in college_info table
      const principalInfo = await getPrincipalFullInfo();
      if (principalInfo?.value) {
        const parsedDetails = parsePrincipalInfoSection(principalInfo.value, prompt);
        responses.push(parsedDetails);
      } else {
        // Handle principal field queries separately - search specifically for Manju Sharma from faculty table
        const requestedFields = getRequestedFacultyFields(prompt);
        const facultyMatches = await searchFaculty({ name: 'Manju Sharma' });
        // Strictly filter to only Manju Sharma
        const strictPrincipalMatches = facultyMatches.filter(f => {
          const lowerName = f.name.toLowerCase();
          return lowerName.includes('manju') && lowerName.includes('sharma') && !lowerName.includes('karuna');
        });
        
        if (strictPrincipalMatches.length > 0) {
          responses.push(formatFacultyFieldResponse(strictPrincipalMatches[0], requestedFields));
        } else {
          responses.push("Principal Mam ki exact qualification details abhi update kar rahe hain. Jaldi hi yeh information available ho jayegi!");
        }
      }
    } else if (hasFacultyFieldIntent(prompt)) {
      const requestedFields = getRequestedFacultyFields(prompt);
      const facultyMatches = await searchFaculty({ name: semanticCorrection || prompt });
      if (facultyMatches.length > 0) {
        responses.push(formatFacultyFieldResponse(facultyMatches[0], requestedFields));
      }
    }

    if (hasMeritIntent(prompt)) {
      const year = extractYear(prompt);
      const boardType = inferBoardType(prompt);
      if (year || boardType) {
        const rows = await searchMeritList({
          exam_year: year,
          board_type: boardType,
          student_name: ''
        });
        let minYear: number | undefined;
        let maxYear: number | undefined;
        if (rows.length === 0 && year) {
          const latestRows = await searchMeritList({ board_type: boardType, student_name: '' });
          const years = latestRows.map((row: any) => Number(row.exam_year)).filter(Boolean);
          minYear = years.length ? Math.min(...years) : undefined;
          maxYear = years.length ? Math.max(...years) : undefined;
          if (year && ((minYear && Number(year) < minYear) || (maxYear && Number(year) > maxYear))) {
            responses.push(`${year} ka merit-list record abhi mere paas nahi mila. Mere paas abhi ${minYear} se ${maxYear} tak ka verified topper data mil raha hai. Aapko hui takleef ke liye khed hai; records update hote hi main aur accurate answer de paunga.`);
          }
        }
        if (!(rows.length === 0 && year && ((minYear && Number(year) < minYear) || (maxYear && Number(year) > maxYear)))) {
          responses.push(formatMeritRows(rows, boardType, year));
        }
      }
    }

    const pastPrincipalYear = extractYear(prompt);
    if (pastPrincipalYear && /principal|प्रिंसिपल|प्रधानाचार्य/i.test(prompt)) {
      const rows = await getAllPastPrincipals(pastPrincipalYear);
      responses.push(formatPastPrincipalRows(rows, pastPrincipalYear));
    }

    const sportName = inferSportName(prompt);
    if (sportName) {
      const sportsRows = await searchSports({
        year: extractYear(prompt),
        sport: sportName,
        query: prompt
      });
      responses.push(formatSportsRows(sportsRows, sportName));
    }

    if (hasNotificationIntent(prompt)) {
      const alerts = await searchAlertsChat(prompt);
      responses.push(formatAlertsResponse(alerts));
    }

    if (hasMaterialIntent(prompt) && !hasExamScheduleIntent(prompt)) {
      const materials = await searchMaterialsChat(prompt);
      responses.push(formatMaterialsResponse(materials));
    }

    if (hasExamScheduleIntent(prompt)) {
      const subject = inferExamSubject(prompt);
      const status = inferExamStatus(prompt);
      const level = inferExamLevel(prompt);
      const semester = inferExamSemester(prompt);

      if (!status || !level || !semester) {
        const marker = `[[EXAM_FORM:${subject || ''}:${status || ''}:${level || ''}:${semester || ''}]]`;
        const missing = [
          !status ? 'college status (Collegiate/Non-Collegiate)' : null,
          !level ? 'level (UG/PG)' : null,
          !semester ? 'semester' : null
        ].filter(Boolean).join(', ');
        responses.push(`${marker}\n\nPaper schedule ke liye ${missing} select karke search karein.`);
      } else {
        const rows = await searchMainExams({ query: prompt, subject, status, level, semester: Number(semester) });
        responses.push(formatExamRows(rows, subject));
      }
    }

    if (hasGalleryPhotoIntent(prompt)) {
      const gridQuery = getGalleryGridQuery(prompt);
      responses.push(`[[GALLERY_GRID:${gridQuery}]]\n\nGallery se matching programme ki photos yahan hain. Kisi photo par click karke full slideshow dekh sakte hain.`);
    }

    if (hasEventIntent(prompt)) {
      responses.push(`[[EVENT_EXPLORER:${getEventQuery(prompt)}]]\n\nMatching events yahan dekh sakte hain.`);
    }

      const uploadedKnowledgeMatches = await searchKnowledgeItems(prompt);
      if (uploadedKnowledgeMatches.length > 0) {
        const response = formatKnowledgeItemResponse(uploadedKnowledgeMatches);
        if (response) {
          responses.push(response);
        }
      }
    }

    // If we collected any specific college responses, yield them! Otherwise, let AI model handle it naturally!
    if (responses.length > 0) {
      yield {
        text: responses.join('\n\n---\n\n'),
        provider: "Lohia College AI"
      };
      return;
    }

    // PARALLEL EXECUTION (Start all async tasks at once)
    const [config, globalCacheHit, prefetchData] = await Promise.all([
      getActiveAIConfig(),
      getGlobalCache(prompt),
      prefetchCollegeContext(prompt, semanticCorrection, profile)
    ]);

    const provider = config?.provider_name || "LohiaCollege AI";
    const providerKey = (config?.provider_name || 'Gemini').toLowerCase();
    const modelId = config?.model_id || CHAT_MODEL;
    // CRITICAL: Fallback to defaultApiKey if config doesn't have one
    const apiKey = config?.api_key || defaultApiKey || "";
    const baseUrl = config?.base_url;

    // Yield provider info immediately
    yield { text: "", provider };

    const lowerPrompt = prompt.toLowerCase();

    if (globalCacheHit && !isMeritQuery && !isHarmfulOrNegative) {
      yield { text: sanitizeUserText(globalCacheHit), provider: "Lohia-Global-Cache" };
      return;
    }

    // Function to convert file to base64
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]); // Just the base64 part
        reader.onerror = error => reject(error);
      });
    };

    // Profile Context Layer
    let profileContext = "";
    if (profile) {
      profileContext = `\n[STUDENT_CONTEXT]: Name: ${profile.name}, Status: ${profile.status}, Level: ${profile.level}, Semester: ${profile.semester}. Always use this context for exam/paper queries. If specifically asked about a paper, look for EXAM_FORM or similar results filtering by this context.`;
    }

    // OCR Logic Check
    let finalPrompt = prompt;
    if (prompt.startsWith('EXTRACT_ID_CARD_INFO:')) {
      finalPrompt = `${prompt}\nReturn JSON format: {"name": "...", "status": "Collegiate/Non-Collegiate", "level": "Graduate/Post Graduate", "semester": "1-6"}`;
    }

    //  NEURAL ROUTER: Select the best specialist agent
    let activePersona = AGENT_PERSONAS.orchestrator;
    let semanticHint = "";
    if (semanticCorrection) {
      console.log(`Semantic Match Found: ${semanticCorrection}`);
      semanticHint = `\n[SEMANTIC_HINT]: Found related entity "${semanticCorrection}". Use this term if the direct search fails. Note for Gallery: Folders might be named '${semanticCorrection}'.`;
    }

    if (SEARCH_KEYWORDS.toppers.some(k => lowerPrompt.includes(k))) activePersona = AGENT_PERSONAS.toppers;
    else if (SEARCH_KEYWORDS.academic.some(k => lowerPrompt.includes(k))) activePersona = AGENT_PERSONAS.academic;
    else if (SEARCH_KEYWORDS.faculty.some(k => lowerPrompt.includes(k))) activePersona = AGENT_PERSONAS.faculty;
    else if (SEARCH_KEYWORDS.admin.some(k => lowerPrompt.includes(k))) activePersona = AGENT_PERSONAS.admin;
    else if (SEARCH_KEYWORDS.gallery.some(k => lowerPrompt.includes(k))) activePersona = AGENT_PERSONAS.gallery;
    else if (SEARCH_KEYWORDS.event.some(k => lowerPrompt.includes(k))) activePersona = AGENT_PERSONAS.event;
    else if (imageFile || SEARCH_KEYWORDS.vision.some(k => lowerPrompt.includes(k))) activePersona = AGENT_PERSONAS.vision;

    const safePrefetch = (prefetchData || "").substring(0, 8000);
    const safeHint = (semanticHint || "").substring(0, 1000);

    const fullSystemInstruction = SYSTEM_PROMPT + `\n\n[ROUTING]: ${activePersona}${safeHint}${profileContext}\n\n[COLLEGE_CONTEXT]: ${safePrefetch}\nNote: You are currently running on ${provider} (${modelId}). Always check [COLLEGE_CONTEXT] for answers before saying you don't have information.`;

    const currentPrompt = finalPrompt;

    let fullResponseAccumulated = "";

    if (providerKey === 'gemini') {
      if (!apiKey) {
        throw new Error('Lohia AI engine key is not configured.');
      }
      const genAI = new GoogleGenAI({ apiKey });
      const config = {
        systemInstruction: fullSystemInstruction,
        tools: [{ functionDeclarations: [facultySearchTool, principalTool, collegeSectionsTool, pastPrincipalsTool, achievementsTool, mainExamsTool, studyMaterialTool, practicalExamsTool, practicalStudentSearchTool, gallerySearchTool, galleryCategoriesTool, eventSearchTool, coursesSearchTool, meritListTool, sportsTool, knowledgeBaseTool, knowledgeItemsTool, materialsChatSearchTool, alertsChatSearchTool] }],
        toolConfig: { includeServerSideToolInvocations: true },
        generationConfig: { temperature: 0.1 }
      };

      const contents: any[] = [
        ...history
          .filter(m => m.role === 'user' || m.role === 'model') // Gemini only wants user/model
          .slice(-6) // Keep last 3 exchanges (6 messages) for conversational context
          .map(m => ({
            role: m.role,
            parts: [{ text: (m.content || "").substring(0, 3000) }] // Hard limit per message
          }))
      ];

      const userParts: any[] = [{ text: currentPrompt }];
      if (imageFile) {
        const base64Data = await fileToBase64(imageFile);
        userParts.push({
          inlineData: {
            data: base64Data,
            mimeType: imageFile.type
          }
        });
      }
      contents.push({ role: 'user', parts: userParts });

      const stream = await genAI.models.generateContentStream({
        model: modelId,
        contents,
        config
      });

      let toolCalls: any[] = [];
      let firstMessageContent: any = null;

      for await (const chunk of stream) {
        const calls = chunk.functionCalls;
        if (calls && calls.length > 0) {
          toolCalls.push(...calls);
          if (!firstMessageContent && chunk.candidates?.[0]?.content) {
            firstMessageContent = chunk.candidates[0].content;
          }
        } else {
          // Extract text parts safely string
          const chunkText = chunk.candidates?.[0]?.content?.parts
            ?.filter(part => part.text)
            ?.map(part => part.text)
            ?.join('') || '';
          if (chunkText) {
            const safeChunkText = sanitizeUserText(chunkText);
            fullResponseAccumulated += safeChunkText;
            yield { text: safeChunkText };
          }
        }
      }

      if (toolCalls.length > 0) {
        const toolResults = [];
        for (const call of toolCalls) {
          let results;
          switch (call.name) {
            case 'search_faculty': results = await searchFaculty(call.args as any); break;
            case 'get_principal_info': results = await getPrincipalInfo(); break;
            case 'get_college_info_sections': results = await getCollegeSections((call.args as any).key); break;
            case 'get_past_principals': results = await getAllPastPrincipals((call.args as any).query); break;
            case 'get_achievements': results = await getAllAchievements((call.args as any).query); break;
            case 'search_main_exams': results = await searchMainExams(call.args as any); break;
            case 'get_study_material': results = await searchStudyMaterial(call.args as any); break;
            case 'search_practical_exams': results = await searchPracticalExams(call.args as any); break;
            case 'search_practical_students': results = await searchPracticalStudentsByName(call.args as any); break;
            case 'search_gallery': results = await searchGallery(call.args as any); break;
            case 'get_gallery_categories': results = await getGalleryCategories(); break;
            case 'search_events': results = await searchEvents(call.args as any); break;
            case 'search_courses': results = await searchCourses((call.args as any).stream, (call.args as any).query); break;
            // removed admission info
            // removed get_exam_passing_rules
            case 'search_merit_list': results = await searchMeritList(call.args as any); break;
            case 'search_sports': results = await searchSports(call.args as any); break;
            case 'search_knowledge_base': results = await searchKnowledgeBase(call.args as any); break;
            case 'search_knowledge_items': results = await searchKnowledgeItems((call.args as any).query); break;
            case 'search_materials_chat': results = await searchMaterialsChat((call.args as any).query); break;
            case 'search_alerts_chat': results = await searchAlertsChat((call.args as any).query); break;
          }
          let resultsJson = JSON.stringify(results || []);
          // HARD LIMIT: If tool result is massive, truncate it to avoid token explosion
          if (resultsJson.length > 5000) {
            resultsJson = resultsJson.substring(0, 5000) + "... (truncated)";
          }

          toolResults.push({
            role: "function",
            parts: [{ functionResponse: { name: call.name, response: { data: resultsJson } } }]
          });
        }

        const finalStream = await genAI.models.generateContentStream({
          model: modelId,
          contents: [...contents, firstMessageContent, ...toolResults as any],
          config: { systemInstruction: fullSystemInstruction }
        });

        for await (const chunk of finalStream) {
          const chunkText = chunk.candidates?.[0]?.content?.parts
            ?.filter(part => part.text)
            ?.map(part => part.text)
            ?.join('') || '';
          if (chunkText) {
            const safeChunkText = sanitizeUserText(chunkText);
            fullResponseAccumulated += safeChunkText;
            yield { text: safeChunkText };
          }
        }
      }
    } else {
      // Generic OpenAI-compatible stream with Tool Calling Support
      const cleanBaseUrl = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, "");
      const url = `${cleanBaseUrl}/chat/completions`;

      // Helper to convert our tools to OpenAI format
      const openaiTools = [
        facultySearchTool, principalTool, collegeSectionsTool,
        pastPrincipalsTool, achievementsTool, mainExamsTool,
        studyMaterialTool, practicalExamsTool, practicalStudentSearchTool,
        gallerySearchTool, galleryCategoriesTool, eventSearchTool,
        coursesSearchTool,
        meritListTool, sportsTool, knowledgeBaseTool, knowledgeItemsTool, materialsChatSearchTool, alertsChatSearchTool
      ].map(t => ({
        type: 'function',
        function: {
          name: t.name,
          description: t.description,
          parameters: t.parameters || { type: 'object', properties: {}, required: [] }
        }
      }));

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      };

      let userContent: any = currentPrompt;
      if (imageFile) {
        const base64Data = await fileToBase64(imageFile);
        userContent = [
          { type: 'text', text: currentPrompt || "Analyze this academic document." },
          {
            type: 'image_url',
            image_url: {
              url: `data:${imageFile.type};base64,${base64Data}`
            }
          }
        ];
      }

      const messages = [
        { role: 'system', content: fullSystemInstruction },
        ...history.slice(-6).map(m => ({ // Keep last 3 exchanges for conversational context
          role: m.role === 'model' ? 'assistant' : m.role,
          content: (m.content || "").substring(0, 1500)
        })),
        { role: 'user', content: userContent }
      ];

      if (providerKey.includes('openrouter') || providerKey.includes('lc-proxy') || providerKey.includes('lc-engine')) {
        // Guard: window only exists in browser, not in SSR/Edge
        headers['HTTP-Referer'] = typeof window !== 'undefined' ? window.location.origin : 'https://asklohia.online';
        headers['X-Title'] = 'Lohia College AI';
      }

      const fetchResponse = async (currentMessages: any[], useTools: boolean = true) => {
        const body: any = {
          model: modelId,
          messages: currentMessages,
          stream: true,
        };

        // Only add tools if requested and likely supported
        if (useTools) {
          body.tools = openaiTools;
          body.tool_choice = 'auto';
        }

        return fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });
      };

      let response = await fetchResponse(messages, true);

      // FALLBACK: If tools cause a 400 error (common for Free models), retry without tools
      if (!response.ok && response.status === 400) {
        console.warn(`Model ${modelId} might not support tools. Retrying without tools...`);
        response = await fetchResponse(messages, false);
      }

      if (!response.ok) {
        let errorMessage = response.statusText || 'Unknown Provider Error';
        try {
          const errData = await response.json();
          // Extract specific error message from OpenRouter/OpenAI response
          errorMessage = errData.error?.message || errData.message || JSON.stringify(errData);
        } catch (e) {
          // If not JSON, it might be an HTML error page or raw text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(`AI Provider Error (${provider}): ${errorMessage}`);
      }

      const processStream = async function* (res: Response): AsyncGenerator<{ text?: string; tool_calls?: any[] }> {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) throw new Error('No response body');

        let toolCallsBuffer: any[] = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const json = JSON.parse(data);
                const delta = json.choices[0]?.delta;

                if (delta?.content) {
                  yield { text: delta.content };
                }

                if (delta?.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    if (!toolCallsBuffer[tc.index]) {
                      toolCallsBuffer[tc.index] = { ...tc, function: { ...tc.function } };
                    } else {
                      if (tc.function?.arguments) {
                        toolCallsBuffer[tc.index].function.arguments += tc.function.arguments;
                      }
                    }
                  }
                }
              } catch (e) { }
            }
          }
        }
        if (toolCallsBuffer.length > 0) {
          yield { tool_calls: toolCallsBuffer.filter(Boolean) };
        }
      };

      let finalToolCalls: any[] = [];
      for await (const chunk of processStream(response)) {
        if (chunk.text) {
          const safeChunkText = sanitizeUserText(chunk.text);
          fullResponseAccumulated += safeChunkText;
          yield { text: safeChunkText };
        } else if (chunk.tool_calls) {
          finalToolCalls = chunk.tool_calls;
        }
      }

      // If tools were called, execute them and get final response
      if (finalToolCalls.length > 0) {
        const sanitizedToolCalls = finalToolCalls.map(tc => ({
          id: tc.id,
          type: 'function',
          function: {
            name: tc.function.name,
            arguments: tc.function.arguments || '{}'
          }
        }));
        const assistantMsg: any = { role: 'assistant', tool_calls: sanitizedToolCalls };
        const toolMessages: any[] = [...messages, assistantMsg];

        for (const tc of finalToolCalls) {
          let args = {};
          try {
            args = JSON.parse(tc.function.arguments || '{}');
          } catch (e) {
            console.error("Failed to parse tool arguments:", tc.function.arguments);
          }
          let results;
          switch (tc.function.name) {
            case 'search_faculty': results = await searchFaculty(args); break;
            case 'get_principal_info': results = await getPrincipalInfo(); break;
            case 'get_college_info_sections': results = await getCollegeSections((args as any).key); break;
            case 'get_past_principals': results = await getAllPastPrincipals((args as any).query); break;
            case 'get_achievements': results = await getAllAchievements((args as any).query); break;
            case 'search_main_exams': results = await searchMainExams(args); break;
            case 'get_study_material': results = await searchStudyMaterial(args); break;
            case 'search_practical_exams': results = await searchPracticalExams(args); break;
            case 'search_practical_students': results = await searchPracticalStudentsByName(args as any); break;
            case 'search_gallery': results = await searchGallery(args); break;
            case 'get_gallery_categories': results = await getGalleryCategories(); break;
            case 'search_events': results = await searchEvents(args); break;
            case 'search_courses': results = await searchCourses((args as any).stream, (args as any).query); break;
            // Exam rules are now handled by get_college_info_sections
            case 'search_merit_list': results = await searchMeritList(args); break;
            case 'search_sports': results = await searchSports(args); break;
            case 'search_knowledge_items': results = await searchKnowledgeItems((args as any).query); break;
            case 'search_materials_chat': results = await searchMaterialsChat((args as any).query); break;
            case 'search_alerts_chat': results = await searchAlertsChat((args as any).query); break;
            case 'search_knowledge_base': results = await searchKnowledgeBase(args); break;
            // removed admission info
            // removed get_college_milestones
            case 'get_merit_boards': results = await getMeritBoards(); break;
          }

          let contentString = JSON.stringify(results || []);
          // Truncate large payloads to stay within token budget.
          // 6000 chars ≈ ~1500 tokens — enough for most structured results without exploding context.
          if (contentString.length > 6000) {
            contentString = contentString.substring(0, 6000) + '... (additional results omitted)';
          }

          if (contentString === '[]' || !results) {
            contentString = "No results found.";
          }

          toolMessages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: contentString
          });
        }

        // Final turn (Stream again)
        const finalRes = await fetch(url, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: modelId,
            messages: toolMessages,
            stream: true,
          }),
        });

        if (finalRes.ok) {
          for await (const chunk of processStream(finalRes)) {
            if (chunk.text) {
              const safeChunkText = sanitizeUserText(chunk.text);
              fullResponseAccumulated += safeChunkText;
              yield { text: safeChunkText };
            }
          }
        } else {
          const errText = await finalRes.text();
          console.error('Lohia AI: Tool response submission failed:', errText);
          throw new Error(`Tool Submission Error: ${finalRes.status} - ${errText}`);
        }
      }
    }

    // SAVE TO GLOBAL CACHE
    // Only cache if it's a general query (no private profile context) and we have a response
    if (fullResponseAccumulated && !profileContext && prompt.length < 100) {
      await setGlobalCache(prompt, fullResponseAccumulated);
    }
  } catch (error) {
    console.error('Lohia AI: Streaming error occurred.');
    throw error;
  }
}
