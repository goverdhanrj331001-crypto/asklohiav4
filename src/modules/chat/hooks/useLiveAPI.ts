import { useState, useRef, useCallback, useEffect } from 'react';
import type { LiveServerMessage } from '@google/genai';
import { supabase } from '@/lib/supabase';
import {
  facultySearchTool, principalTool, collegeSectionsTool, pastPrincipalsTool, achievementsTool,
  mainExamsTool, studyMaterialTool, practicalExamsTool, practicalStudentSearchTool,
  gallerySearchTool, galleryCategoriesTool, eventSearchTool, coursesSearchTool,
  meritListTool, knowledgeBaseTool, knowledgeItemsTool, materialsChatSearchTool, alertsChatSearchTool, sportsTool
} from '../services/lohiacollegeai';
import {
  searchFaculty, getPrincipalInfo, getCollegeSections, getAllPastPrincipals, getAllAchievements,
  searchMeritList, searchMainExams, searchStudyMaterial, searchPracticalExams,
  searchPracticalStudentsByName, searchGallery, getGalleryCategories, searchEvents,
  searchCourses, searchKnowledgeBase, searchKnowledgeItems, searchMaterialsChat, searchAlertsChat, searchSports
} from '../services/collegeDataService';

let cachedFingerprint: string | null = null;
const getFingerprint = async () => {
  if (cachedFingerprint) return cachedFingerprint;
  try {
    const fpPromise = await import('@fingerprintjs/fingerprintjs');
    const fp = await fpPromise.load();
    const result = await fp.get();
    cachedFingerprint = result.visitorId;
    return cachedFingerprint;
  } catch (e) {
    console.warn("Fingerprint failed, fallback to local ID", e);
    return 'fallback_id_123';
  }
};


// Utility to convert Float32Array (from getUserMedia) to Int16Array (for Gemini)
function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return output;
}

// Utility to encode Int16Array to Base64
function bufferToBase64(buffer: Int16Array): string {
  let binary = '';
  const bytes = new Uint8Array(buffer.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Utility to decode Base64 to Int16Array
function base64ToBuffer(base64: string): Int16Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

const DAILY_LIMIT = 40;
// Voice engine config — fetched from server at runtime
const LIVE_MODEL = process.env.NEXT_PUBLIC_LC_VOICE_ENGINE || "gemini-live-2.5-flash-native-audio";
const LIVE_VOICE = process.env.NEXT_PUBLIC_LC_VOICE_PERSONA || "Kore";

const inferExamDepartment = (text: string) => {
  const lower = text.toLowerCase();
  if (/\bscience\b|\bb\.?sc\b|\bm\.?sc\b|science|बी\s*एससी|बीएससी|विज्ञान/i.test(lower)) return 'Science';
  if (/\barts\b|\bb\.?a\b|\bm\.?a\b|arts|बी\s*ए|बीए|कला|कला\s*वर्ग/i.test(lower)) return 'Arts';
  if (/\bcommerce\b|\bb\.?com\b|\bm\.?com\b|commerce|बी\s*कॉम|बीकॉम|वाणिज्य/i.test(lower)) return 'Commerce';
  return undefined;
};

const inferExamSubject = (text: string) => {
  const lower = text.toLowerCase();
  const subjects: Array<[RegExp, string]> = [
    [/physics|fijiks|फिजिक्स|भौतिक/, 'Physics'],
    [/chemistry|केमिस्ट्री|रसायन/, 'Chemistry'],
    [/zoology|जूओजी|प्राणी/, 'Zoology'],
    [/botany|बॉटनी|वनस्पति/, 'Botany'],
    [/mathematics|maths?|गणित/, 'Mathematics'],
    [/geography|geog|भूगोल/, 'Geography'],
    [/history|इतिहास/, 'History'],
    [/sociology|socio|समाजशास्त्र/, 'Sociology'],
    [/political|pol\s*science|राजनीति/, 'Political Science'],
    [/economics|eco|अर्थशास्त्र/, 'Economics'],
    [/hindi|हिंदी/, 'Hindi'],
    [/english|अंग्रेज़ी/, 'English'],
    [/sanskrit|संस्कृत/, 'Sanskrit'],
    [/public\s*administration|लोक\s*प्रशासन/, 'Public Administration'],
    [/psychology|मनोविज्ञान/, 'Psychology'],
    [/home\s*science|गृह\s*विज्ञान/, 'Home Science'],
    [/drawing|चित्रकला/, 'Drawing'],
    [/music|संगीत/, 'Music'],
    [/\babst\b|a\.b\.s\.t|account|accounts|accounting/, 'ABST'],
    [/\beafm\b|e\.a\.f\.m/, 'EAFM'],
    [/\bbadm\b|business\s*administration/, 'BADM'],
    [/computer|bca|cit/, 'Computer Science']
  ];
  return subjects.find(([pattern]) => pattern.test(lower))?.[1];
};

const inferExamStatus = (text: string) => {
  const lower = text.toLowerCase();
  if (/non|private|नॉन|एन\s*सी/.test(lower)) return 'Non-Collegiate';
  if (/col+eg|col+ig|col+egate|regular|रेगुलर|कॉले|कोले/.test(lower)) return 'Collegiate';
  return undefined;
};

const inferExamLevel = (text: string) => {
  const lower = text.toLowerCase();
  if (/\bpg\b|\bpost\s*grad(?:uate)?\b|\bm\.?sc\b|\bm\.?a\b|\bm\.?com\b|\bmsc\b|\bmcom\b|\bma\b|एम\s*ए|एम\s*एससी/i.test(lower)) return 'PG';
  if (/\bug\b|\bunder\s*grad(?:uate)?\b|\bgrad(?:uate)?\b|\bb\.?sc\b|\bb\.?a\b|\bb\.?com\b|\bbsc\b|\bbcom\b|\bba\b|बी\s*ए|बी\s*एससी/i.test(lower)) return 'UG';
  return undefined;
};

const inferExamSemester = (text: string) => {
  const lower = text.toLowerCase();
  const numeric = lower.match(/\bsem(?:ester)?\s*[-:]?\s*([1-6])\b|\b([1-6])(?:st|nd|rd|th)?\s*sem(?:ester)?\b/);
  if (numeric) return numeric[1] || numeric[2];
  const digitMatch = lower.match(/\b([1-6])\b/);
  if (digitMatch) return digitMatch[1];
  if (/first|1st|sem\s*one|semester\s*one|फर्स्ट|पहला|प्रथम/.test(lower)) return '1';
  if (/second|2nd|sem\s*two|semester\s*two|सेकंड|दूसरा|द्वितीय/.test(lower)) return '2';
  if (/third|3rd|sem\s*three|semester\s*three|थर्ड|तीसरा|तृतीय/.test(lower)) return '3';
  if (/fourth|4th|sem\s*four|semester\s*four|फोर्थ|चौथा/.test(lower)) return '4';
  if (/fifth|5th|sem\s*five|semester\s*five|फिफ्थ|पांचवां/.test(lower)) return '5';
  if (/sixth|6th|sem\s*six|semester\s*six|सिक्स्थ|छठा/.test(lower)) return '6';
  return undefined;
};

const inferExamSubjects = (text: string): string[] => {
  const lower = text.toLowerCase();
  const subjectsList: string[] = [];

  if (/physics|fijiks|फिजिक्स|भौतिक/.test(lower)) subjectsList.push('Physics');
  if (/chemistry|केमिस्ट्री|रसायन/.test(lower)) subjectsList.push('Chemistry');
  if (/zoology|जूओजी|प्राणी/.test(lower)) subjectsList.push('Zoology');
  if (/botany|बॉटनी|वनस्पति/.test(lower)) subjectsList.push('Botany');
  if (/mathematics|maths?|ganit|गणित/.test(lower)) subjectsList.push('Mathematics');
  if (/geography|geog|भूगोल/.test(lower)) subjectsList.push('Geography');
  if (/history|इतिहास/.test(lower)) subjectsList.push('History');
  if (/sociology|socio|समाजशास्त्र/.test(lower)) subjectsList.push('Sociology');
  if (/political|pol\s*sc|pol\s*science|politics|राजनीति/.test(lower)) subjectsList.push('Pol Sc');
  if (/economics|eco|अर्थशास्त्र/.test(lower)) subjectsList.push('Economics');
  if (/sanskrit|संस्कृत/.test(lower)) subjectsList.push('Sanskrit');
  if (/psychology|मनोविज्ञान/.test(lower)) subjectsList.push('Psychology');
  if (/computer|bca|cit/.test(lower)) subjectsList.push('Computer Sc');
  if (/\baccountancy\b|\babst\b|a\.b\.s\.t|account|accounts|accounting|लेखाशास्त्र/.test(lower)) subjectsList.push('Accountancy');
  if (/\beafm\b|e\.a\.f\.m/.test(lower)) subjectsList.push('EAFM');
  if (/marketing|विपणन/.test(lower)) subjectsList.push('Marketing');
  if (/management|प्रबंधन/.test(lower)) subjectsList.push('Management');
  if (/finance|वित्त/.test(lower)) subjectsList.push('Finance');
  if (/business\s*law|व्यावसायिक\s*कानून/.test(lower)) subjectsList.push('Business Law');
  if (/business\s*org|business\s*organization|व्यावसायिक\s*संगठन/.test(lower)) subjectsList.push('Business Org');
  if (/philosophy|दर्शनशास्त्र/.test(lower)) subjectsList.push('Philosophy');
  if (/biology|जीव\s*विज्ञान/.test(lower)) subjectsList.push('Biology');

  if (/hindi\s*lit|hindi\s*sahitya|हिंदी\s*साहित्य/.test(lower)) {
    subjectsList.push('Hindi Lit');
  } else if (/hindi|हिंदी/.test(lower)) {
    subjectsList.push('Hindi');
  }

  if (/english\s*lit|english\s*literature|अंग्रेजी\s*साहित्य|अंग्रेज़ी\s*साहित्य/.test(lower)) {
    subjectsList.push('English Lit');
  } else if (/english|अंग्रेज़ी|अंग्रेजी/.test(lower)) {
    subjectsList.push('English Lit');
  }

  return subjectsList;
};

const isAffirmative = (text: string): boolean => {
  const lower = text.toLowerCase().trim();
  return /\b(yes|haan|han|sure|ok|okay|batao|bataiye|batayein|dikhao|dikhiye|boliye|bolo|haa|hahn)\b/i.test(lower);
};

const hasLiveExamIntent = (text: string) =>
  /exam|paper|papers|timetable|schedule|date|kab|पेपर|परीक्षा|एग्जाम/i.test(text);

const hasEnoughExamDetails = (rows: any[]) =>
  rows.length > 0 && !rows.some((row: any) => row?.needs_clarification);

const formatDateForVoice = (date?: string) => {
  if (!date) return 'date available nahi hai';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatTimeForVoice = (time?: string) => {
  if (!time) return 'time available nahi hai';
  const [hourValue, minuteValue] = time.split(':').map(Number);
  if (Number.isNaN(hourValue) || Number.isNaN(minuteValue)) return time;
  const suffix = hourValue >= 12 ? 'PM' : 'AM';
  const hour = hourValue % 12 || 12;
  return `${hour}:${String(minuteValue).padStart(2, '0')} ${suffix}`;
};

const formatLiveExamAnswer = (rows: any[], originalQuery: string) => {
  const clarification = rows.find((row: any) => row?.needs_clarification);
  if (clarification) {
    return clarification.message || 'Exam schedule ke liye kripya batayein: aap Collegiate hain ya Non-Collegiate, UG hain ya PG, aur semester kaunsa hai.';
  }

  if (!rows.length) {
    return 'Maaf kijiye, is exam schedule ka exact record abhi available information me nahi mila. Kripya apna course, semester, status aur subject ek baar clear bata dein, main dobara check kar dungi.';
  }

  const first = rows[0];
  const subjectCount = new Set(rows.map((row: any) => row.subject).filter(Boolean)).size;
  const heading = `${first.department || ''} ${first.level || ''} semester ${first.semester || ''} ${first.status || ''}`.replace(/\s+/g, ' ').trim();
  const requestedSpecificPaper = /paper\s*(one|two|i|ii|1|2)|पेपर\s*(वन|टू|एक|दो|1|2)/i.test(originalQuery);
  const maxRows = requestedSpecificPaper ? 2 : Math.min(12, Math.max(8, subjectCount * 2));

  const lines = rows.slice(0, maxRows).map((row: any) =>
    `${row.subject || 'Subject'} ${row.paper || 'paper'}: ${formatDateForVoice(row.exam_date)}, ${formatTimeForVoice(row.exam_time)}`
  );

  const extra = rows.length > maxRows
    ? ` Is schedule me total ${rows.length} papers hain. Baaki papers ke liye subject ka naam bol dijiye.`
    : '';

  const intro = subjectCount > 1
    ? `${heading} ke available exam papers ye hain:`
    : `${heading} ka exam schedule ye hai:`;

  return `${intro} ${lines.join('. ')}.${extra}`;
};

export function useLiveAPI() {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<any>(null);
  const sessionRef = useRef<any>(null); // To store the live session
  const liveConnectionOpenRef = useRef(false);
  const examContextRef = useRef('');
  const examFlowStepRef = useRef(0);
  const lastExamAnswerKeyRef = useRef('');
  const reconnectAttemptsRef = useRef(0);
  const remainingExamsRef = useRef<any[]>([]);

  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);
  const activeSourceNodesRef = useRef<AudioBufferSourceNode[]>([]);

  // WebSocket proxy reference (replaces GoogleGenAI session)
  const proxyWsRef = useRef<WebSocket | null>(null);

  // Helper: send message to proxy server
  const proxySend = useCallback((obj: object) => {
    const ws = proxyWsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(obj));
      } catch (e) {
        console.error('[LiveAPI] proxySend error:', e);
      }
    }
  }, []);

  const stopAllAudio = useCallback(() => {
    activeSourceNodesRef.current.forEach(node => {
      try {
        node.stop();
        node.disconnect();
      } catch (e) {
        // Source might have already finished
      }
    });
    activeSourceNodesRef.current = [];
    nextPlayTimeRef.current = 0;
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
  }, []);

  const processAudioQueue = useCallback(() => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    while (audioQueueRef.current.length > 0) {
      const pcm16 = audioQueueRef.current.shift()!;

      // Convert Int16 back to Float32 for Web Audio API playback
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / 0x8000;
      }

      const buffer = ctx.createBuffer(1, float32.length, 24000); // Gemini output is 24kHz
      buffer.getChannelData(0).set(float32);

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      // Improved Scheduling Logic:
      // 1. If we are starting fresh or lagged behind, start with a tiny 100ms lookahead
      // 2. Otherwise, chain it exactly after the previous buffer
      let startTime = nextPlayTimeRef.current;
      const now = ctx.currentTime;

      if (startTime < now) {
        // Either starting fresh or we lagged. Add 100ms buffer to prevent immediate stutter.
        startTime = now + 0.1;
      }

      source.start(startTime);
      nextPlayTimeRef.current = startTime + buffer.duration;

      activeSourceNodesRef.current.push(source);

      isPlayingRef.current = true;
      setIsSpeaking(true);

      source.onended = () => {
        // Remove from active nodes
        activeSourceNodesRef.current = activeSourceNodesRef.current.filter(n => n !== source);

        // When a buffer ends, check if there's more to play
        if (audioQueueRef.current.length === 0 && ctx.currentTime >= nextPlayTimeRef.current - 0.05) {
          isPlayingRef.current = false;
          setIsSpeaking(false);
        }
      };
    }
  }, []);

  // Removed processAudioQueueRef.current and useEffect for processAudioQueue
  // since we'll call it directly from onmessage.

  const [dailyLimitReached, setDailyLimitReached] = useState(false);
  const [questionsRemaining, setQuestionsRemaining] = useState(DAILY_LIMIT);
  const [timeUntilReset, setTimeUntilReset] = useState<string | null>(null);

  useEffect(() => {
    const checkLimit = async () => {
      try {
        const fpId = await getFingerprint();

        const { data, error } = await supabase
          .from('voice_limits')
          .select('question_count, limit_reached_at')
          .eq('fingerprint_id', fpId)
          .maybeSingle();

        const now = Date.now();
        const COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

        if (data) {
          if (data.limit_reached_at) {
            const limitReachedTime = new Date(data.limit_reached_at).getTime();
            const timePassed = now - limitReachedTime;

            if (timePassed < COOLDOWN_MS) {
              setQuestionsRemaining(0);
              setDailyLimitReached(true);

              const diffMs = COOLDOWN_MS - timePassed;
              const hours = Math.floor(diffMs / (1000 * 60 * 60));
              const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
              setTimeUntilReset(`${hours}h ${mins}m`);
            } else {
              // 24 hours have passed, reset in DB
              await supabase
                .from('voice_limits')
                .update({ question_count: 0, limit_reached_at: null })
                .eq('fingerprint_id', fpId);
              setQuestionsRemaining(DAILY_LIMIT);
              setDailyLimitReached(false);
              setTimeUntilReset(null);
            }
          } else {
            // Not limited yet
            setQuestionsRemaining(Math.max(0, DAILY_LIMIT - (data.question_count || 0)));
            setDailyLimitReached(false);
            setTimeUntilReset(null);
          }
        } else {
          // No record yet, create one
          await supabase
            .from('voice_limits')
            .insert({ fingerprint_id: fpId, question_count: 0, limit_reached_at: null });
          setQuestionsRemaining(DAILY_LIMIT);
          setDailyLimitReached(false);
          setTimeUntilReset(null);
        }
      } catch (e) {
        console.error("Supabase limit check error:", e);
      }
    };
    checkLimit();
    const interval = setInterval(checkLimit, 60000);
    return () => clearInterval(interval);
  }, []);

  function stopConnection(closeSession = true) {
    liveConnectionOpenRef.current = false;
    setIsConnected(false);
    setIsSpeaking(false);
    stopAllAudio();

    if (processorRef.current) {
      if (processorRef.current.port) {
        processorRef.current.port.onmessage = null;
      }
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (closeSession && proxyWsRef.current) {
      try {
        if (proxyWsRef.current.readyState === WebSocket.OPEN ||
            proxyWsRef.current.readyState === WebSocket.CONNECTING) {
          proxyWsRef.current.close(1000, 'User stopped');
        }
      } catch (e) {}
      proxyWsRef.current = null;
    }

    // Legacy sessionRef cleanup (no longer used but kept for safety)
    if (closeSession && sessionRef.current) {
      sessionRef.current = null;
    }

    audioQueueRef.current = [];
    remainingExamsRef.current = [];
    examFlowStepRef.current = 0;
    examContextRef.current = '';
  }

  const incrementUsage = useCallback(async () => {
    try {
      const fpId = await getFingerprint();

      const { data } = await supabase
        .from('voice_limits')
        .select('question_count, limit_reached_at')
        .eq('fingerprint_id', fpId)
        .maybeSingle();

      if (data && !data.limit_reached_at) {
        let newCount = (data.question_count || 0) + 1;
        let limitReachedAt = null;

        if (newCount >= DAILY_LIMIT) {
          limitReachedAt = new Date().toISOString();
          setDailyLimitReached(true);
          const COOLDOWN_MS = 24 * 60 * 60 * 1000;
          const hours = Math.floor(COOLDOWN_MS / (1000 * 60 * 60));
          const mins = Math.floor((COOLDOWN_MS % (1000 * 60 * 60)) / (1000 * 60));
          setTimeUntilReset(`${hours}h ${mins}m`);
          stopConnection();
        }

        await supabase
          .from('voice_limits')
          .update({ question_count: newCount, limit_reached_at: limitReachedAt })
          .eq('fingerprint_id', fpId);

        setQuestionsRemaining(Math.max(0, DAILY_LIMIT - newCount));
      }
    } catch (e) {
      console.error("Increment usage error:", e);
    }
  }, []);

  const startConnection = async () => {
    if (dailyLimitReached) {
      setError(`Daily limit of ${DAILY_LIMIT} questions reached.`);
      return;
    }
    try {
      setError(null);
      remainingExamsRef.current = [];
      examFlowStepRef.current = 0;
      examContextRef.current = '';

      const apiKey = process.env.NEXT_PUBLIC_LOHIA_COLLEGE_VOICE_KEY;
      // Note: apiKey check removed — Vertex AI uses Service Account on server side

      // Fetch dynamic college comprehensive context
      let contextInfo = "College Name: Lohia College.\\n";
      try {
        const res = await fetch('/api/chat/live-context');
        if (res.ok) {
          const data = await res.json();
          if (data.context) {
            contextInfo = data.context;
          }
        }
      } catch {
        console.warn('Lohia AI: Could not fetch college context, using fallback.');
      }

      const dynamicSystemInstruction = `You are the Official Lohia College AI Assistant. You are a highly professional, intelligent, and helpful YOUNG INDIAN FEMALE representation of the college.
      
IDENTITY & PERSONA:
1. **Gender**: Strictly FEMALE. Use feminine grammar in Hindi/Hinglish (e.g., "bataungi", "kar sakti hoon").
2. **Tone**: Warm, welcoming, and academic yet approachable. Think of a senior counselor or a top-performing student leader.
3. **Language**: Greet in English. If the user speaks/asks in English, respond strictly and completely in English. If the user speaks in Hindi/Hinglish, respond in fluent Hinglish. Keep responses concise for voice interaction.
4. **Name Protocol**: ALWAYS pronounce "Prof." as "Professor". ALWAYS address EVERY person (faculty, principal, topper, alumni, or staff) with utmost respect by adding honorifics. In Hindi/Hinglish, ALWAYS add "Ji" after their name (e.g., "Amit Ji", "Dr. Sharma Ji") or use "Shri" / "Smt" before their name. For English, use "Mr.", "Ms.", "Dr.", or "Professor". NEVER take anyone's name plainly without an honorific.

MISSION:
- **Strict Scope Limitation (CRITICAL)**: You must ONLY answer questions directly related to Lohia College (admission, syllabus, exams, courses, faculty, events, materials, toppers, college history, sports, etc.). If the user asks ANY general knowledge, general history, news, math/coding, or any off-topic questions (e.g., 'Who is the Prime Minister of India', 'History of Churu', 'weather updates'), you MUST politely decline.
  * For English: "I can only assist you with questions related to Lohia College, such as faculty, admissions, syllabus, toppers, notifications, events, or sports. Please let me know how I can help you with these."
  * For Hindi/Hinglish: "Main aapki sahayata keval Lohia College se jude sawalon ke liye hi kar sakti hoon. Agar aap college se related queries jaise faculty, admission, syllabus, toppers, notification, events ya sports ke baare me jaanna chahte hain to mujhe bataye."
- You provide EXACT and ACCURATE information about Lohia College history, faculty, exams, events, and academics.
- Pay EXTRA attention to the difference between departments with similar names (e.g., Zoology vs Sociology).
- When asked for faculty in a department, check EVERY name listed in that department in the knowledge base.
- Always provide the specific qualification (e.g., Ph.D., M.Sc.) if requested, as it is listed for each faculty member.
- You use the COMPREHENSIVE KNOWLEDGE BASE provided below as your absolute source of truth. Do not omit names listed there.

ADVANCED CAPABILITIES:
- **Search & Synthesis**: When asked about a department, list the faculty members one by one clearly.
- **Qualification Expert**: If asked "What is the qualification of [Name]?", look specifically for the "Qualification" field in the faculty data.
- **Principal & Past Principals**: You have a dedicated list of current and past principals. Use it to answer questions about college leadership heritage.
- **History Expert**: Be proud of the college's heritage. Use the foundation details, vision, and founder precisely.
- **Founder Truth (Mandatory)**: The founder of Lohia College is Seth Kanhiya Lal Lohia. If the user asks "who is the founder of Lohia College", "what is founder/father of Lohia College", "what is founded by Lohia College", or similar, answer only Seth Kanhiya Lal Lohia as the founder. Never say Seth Budhmal Lohia as the founder.
- **Toppers & Merit Expert (IMPORTANT)**: You have access to the college's Hall of Fame (merit list). First, look at the merit summary in the knowledge base to see the available year range (min year to max year) — DO NOT use any hardcoded year range like 1945 or 1984-1995! If user asks for toppers from a year that is NOT in the available range (or after max year OR no records found): in Hindi/Hinglish, say "Maaf kijiye, mere paas us saal ke records nahi hain. Humare paas abhi tak [minYear] se [maxYear] tak ke toppers ke records available hain. Aap in saal ke liye pooch sakte hain. Aapko is pareshani ke liye hum kshama chahte hain." If user says BSc, B.Sc, MSc, M.Sc, science, scinece, Physics, Chemistry, Botany, Zoology, Biology, Maths, or Mathematics, treat it as Science merit records. If user says BA, Arts, Hindi, English, History, Geography, Sociology, Political Science, Economics, Sanskrit, Urdu, Public Administration, Drawing, or Home Science, treat it as Arts merit records. If user says BCom, Commerce, Accounts, ABST, EAFM, BADM, Business, or Banking, treat it as Commerce merit records.
- **Sports & Chess Expert (IMPORTANT)**: 
  - If user asks about football, kabaddi, volleyball, sports, medal, gold medalist, winner, or tournament, call 'search_sports'. If the exact word "gold" is not in the record but matching sport records exist, still speak the matching University Colour Holder or winning team records. If no year is given, give the matching sport records; if year is given, filter by that year.
  - If a student asks about participating in chess or the scope of chess, respond enthusiastically and say: "Haan, humare college me sports aur chess ka bohot achha scope hai!" and highlight the outstanding achievements or sports representatives who played chess in the college.
- **Exam Schedule Voice output (CRITICAL)**: If a tool call response contains a 'verified_answer', you MUST speak the 'verified_answer' EXACTLY as returned. Do not change it, ignore it, reformat it, or add any commentary.
- **Exam Schedule Clarifier (MANDATORY)**:
  - Whenever the user asks about exams, papers, or dates, or provides answers to your clarification questions (like telling you "Collegiate", "Non-Collegiate", their level, semester, or subject names), you MUST call the 'search_main_exams' tool with the accumulated arguments (query, department, subject, level, semester, status).
  - Do NOT try to answer on your own, do NOT say database records are not available on your own.
  - The tool will check the database and return a 'verified_answer'. You MUST speak the 'verified_answer' EXACTLY as returned. Do not change it, ignore it, reformat it, or add any commentary.
- **Complaint / Feedback Handling**: If the user complains about any teacher, faculty member, principal, staff, teaching quality, behaviour, or says someone teaches badly, do NOT show profiles, do NOT defend or insult anyone. Respond maturely: acknowledge their concern, ask for the specific issue, suggest first talking politely to the teacher, and if unresolved guide them to the college office or Principal Mam. Mention useful contacts when appropriate: Principal Mam +91-9414665955, principal email manjudinesh.8@gmail.com, college office 01562-250362, college email lohiacollegechuru@gmail.com.
- **Principal Image Rule**: If the user asks neutral information about principal mam, answer with details. If the user complains or gives negative feedback about principal mam, do not describe photos/images; respond with complaint guidance.
- **Gallery / Programme Photos (IMPORTANT)**: If user asks for photos/images of any programme/event: call search_gallery first, then clearly instruct them: "Is program ki photos gallery mein available hain. Aap gallery section mein jakar dekh sakte hain." Do NOT say you will open it.
- **Specific Field Rule**: If user asks only one detail of a person, like qualification, phone number, father name, email, joining date, or subject, answer only that field. Do not give full profile unless they ask for profile/full details.
- **Materials, Folders, & Notices**: Students will ask you about uploaded study materials, PDF/Excel files, PowerPoint slides, folders, or latest announcements, notices, and notifications in Hinglish, Hindi, or English. You MUST call 'search_materials_chat', 'search_knowledge_items', or 'search_alerts_chat' to fetch them and speak them out. Explain what notice or material was found and mention related attachments if present.
- **Admission Urgent Alert**: Admission session for 2026-27 is LIVE from May 1 to June 6, 2026. Nodal Officer UG Admission is Dr. Umed Singh Gothwal (9414203821). Stream-wise Course Contacts: B.A. (Mohd Javed Khan: 9785159841), B.Sc. Bio/Math (Dr. Mukesh Kumar Meena: 8005763754), B.Com./BBA (Dr. Mahendra Kumar Khardiya: 9928273463), AEDP (Dr. Madhu Sudan Pardhan: 9782582267). Always guide students to contact these respective stream conveners for specific questions, and Dr. Umed Gothwal as the central Nodal Officer. Mention the documents and the help WhatsApp number 9509932564 if they sound confused.
- **Handling Indirect/Related Info (CRITICAL)**: If a user asks a question for which there is no direct record (e.g., they want to participate in a specific event/sport or contact a specific staff), but you have indirect or related info (such as general sports achievements, contact numbers of nodal officers, or related departments), do NOT refuse directly. Enthusiastically say something positive (like "Haan, humare college me iska bohot achha scope hai!" or "Iske baare me related jaankari available hai!") and then present that related information to help them.
- **Unknown Information**: Only when there is absolutely no direct or indirect information at all, politely decline. For English queries, say: "I am sorry, I do not have this information. Please contact the college office or check the official website." For Hindi/Hinglish queries, say: "Maaf kijiye, mujhe is baare me abhi jankari nahi hai. Aap college office mein sampark kar sakte hain ya website check kar sakte hain."

INTERACTION FLOW:
- **Initial Greeting**: You MUST start with this EXACT English greeting: "Hello, I am Lohia College AI Assistant. How can I help you? What is your name sir?" (Do NOT translate this to Hindi or repeat it).
- **Language Strategy**: Greet in English. Dynamically adapt your language to match the user: if the user speaks or asks in English, reply strictly and entirely in English. If they speak in Hinglish or Hindi, reply in Hinglish. Never mix Hindi/Hinglish into the response when the user is speaking English.
- **Name Usage Protocol**: ONLY use the user's name the VERY FIRST TIME they tell you. DO NOT repeat their name in every subsequent response. Say it once to acknowledge, then talk normally.
- **Natural Conversation**: Never use internal technical/source words in spoken answers. Act like a real human who knows the information. Say "Unki details yeh hain..." instead of explaining where the details came from.
- **No Technical Words (CRITICAL)**: Do not mention database, system, knowledge base, records, API, tool, storage, helper calls, search process, or internal sources to the user. Never say "Yeh jankari database me nahi hai" or "Yeh records me mojud nahi hai". Instead, say "Mujhe abhi iski jaankari nahi hai" or "Is baare me mere paas abhi updates nahi hain". Always act like a real human assistant who is speaking naturally.

--- COMPREHENSIVE KNOWLEDGE BASE ---
${contextInfo}`;

      // ================================================================
      // AudioContext + Microphone Setup (must be before WebSocket proxy)
      // ================================================================
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = ctx;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      streamRef.current = stream;

      const source = ctx.createMediaStreamSource(stream);

      const workletCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          // 2048 samples @ 16kHz = ~128ms per chunk (was 4096=256ms)
          // Smaller buffer = AI hears user faster, less latency
          this.bufferSize = 2048;
          this.buffer = new Float32Array(this.bufferSize);
          this.framesWritten = 0;
        }
        process(inputs, outputs, parameters) {
          const input = inputs[0];
          if (input && input.length > 0) {
            const channelData = input[0];
            for (let i = 0; i < channelData.length; i++) {
              this.buffer[this.framesWritten++] = channelData[i];
              if (this.framesWritten >= this.bufferSize) {
                // Send a COPY of the buffer — never send the same reference
                // that will be overwritten on the next iteration
                this.port.postMessage(this.buffer.slice(0));
                this.buffer = new Float32Array(this.bufferSize);
                this.framesWritten = 0;
              }
            }
          }
          return true;
        }
      }
      registerProcessor('pcm-processor', PCMProcessor);
      `;
      const blob = new Blob([workletCode], { type: 'application/javascript' });
      const workletUrl = URL.createObjectURL(blob);
      await ctx.audioWorklet.addModule(workletUrl);

      const processor = new AudioWorkletNode(ctx, 'pcm-processor');
      processorRef.current = processor;

      source.connect(processor);
      // Do NOT connect processor to destination — that would cause microphone echo feedback
      // processor.connect(ctx.destination);

      // ================================================================
      // Vertex AI WebSocket Proxy Connection
      // Server.js pe connect karo jo Vertex AI se baat karta hai
      // ================================================================
      // Production mein: wss://voice.asklohia.online (standalone backend)
      // Local dev mein: ws://localhost:3000/api/live-proxy (same-host fallback)
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const voiceBackendUrl =
        process.env.NEXT_PUBLIC_VOICE_BACKEND_WS_URL ||
        `${wsProtocol}//${window.location.host}/api/live-proxy`;
      const proxyWs = new WebSocket(voiceBackendUrl);
      proxyWsRef.current = proxyWs;

      const sessionPromise = new Promise<any>((resolve, reject) => {
        proxyWs.onopen = () => {
          console.log('[LiveAPI] Proxy WebSocket connected, sending setup...');

          // ---- Setup message: server ko model + config bhejo ----
          proxyWs.send(JSON.stringify({
            type: 'setup',
            model: LIVE_MODEL,
            config: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: LIVE_VOICE } },
              },

              tools: [
                { functionDeclarations: [
                  facultySearchTool, principalTool, collegeSectionsTool, pastPrincipalsTool,
                  achievementsTool, mainExamsTool, studyMaterialTool, practicalExamsTool,
                  practicalStudentSearchTool, gallerySearchTool, galleryCategoriesTool,
                  eventSearchTool, coursesSearchTool, meritListTool, sportsTool,
                  knowledgeBaseTool, knowledgeItemsTool, materialsChatSearchTool, alertsChatSearchTool
                ]}
              ],
              systemInstruction: dynamicSystemInstruction,
              outputAudioTranscription: {},
              inputAudioTranscription: {},
            }
          }));
        };

        proxyWs.onmessage = async (event) => {
          let msg: any;
          try {
            msg = JSON.parse(event.data);
          } catch (e) {
            console.error('[LiveAPI] Invalid JSON from proxy:', e);
            return;
          }

          // ---- Vertex AI session ready ----
          if (msg.type === 'connected') {
            liveConnectionOpenRef.current = true;
            reconnectAttemptsRef.current = 0;
            setIsConnected(true);
            resolve(proxyWs); // session ready

            // Initial greeting
            setTimeout(() => {
              if (!liveConnectionOpenRef.current) return;
              proxyWs.send(JSON.stringify({
                type: 'clientContent',
                data: { turns: 'Hello', turnComplete: true }
              }));
            }, 500);

            // Audio capture shuru karo
            processor.port.onmessage = (e) => {
              if (!liveConnectionOpenRef.current) return;
              const inputData = e.data;
              const pcm16 = floatTo16BitPCM(inputData);
              const base64Data = bufferToBase64(pcm16);

              if (proxyWs.readyState === WebSocket.OPEN) {
                proxyWs.send(JSON.stringify({
                  type: 'realtimeInput',
                  // Vertex AI Live API requires exactly 'audio/pcm' — 16kHz s16le mono
                  // The AudioContext is created with sampleRate: 16000, so format matches
                  data: { audio: { data: base64Data, mimeType: 'audio/pcm' } }
                }));
              }
            };
            return;
          }

          // ---- Error from server ----
          if (msg.type === 'error') {
            console.error('[LiveAPI] Proxy error:', msg.message);
            setError(`Voice connection error: ${msg.message}`);
            stopConnection();
            return;
          }

          // ---- Session closed by server ----
          if (msg.type === 'closed') {
            liveConnectionOpenRef.current = false;
            const code   = msg.code;
            const reason = msg.reason || '';
            if (code && code !== 1000) {
              console.warn('[LiveAPI] Proxy closed:', code, reason);
              if (reason.toLowerCase().includes('suspended')) {
                setError('Lohia AI voice service temporarily unavailable. Please try again.');
              } else if (reason.includes('Permission denied') || reason.toLowerCase().includes('denied access')) {
                setError('Lohia AI voice service access error. Please contact support.');
              } else if (reason.toLowerCase().includes('invalid argument')) {
                setError(null);
                if (reconnectAttemptsRef.current < 2) {
                  reconnectAttemptsRef.current += 1;
                  window.setTimeout(() => {
                    if (!liveConnectionOpenRef.current) startConnection();
                  }, 800);
                }
              } else if (reason) {
                setError('Lohia AI voice connection was interrupted. Please reconnect.');
              }
            }
            stopConnection(false);
            return;
          }

          // ---- Vertex AI message (main message handler) ----
          if (msg.type === 'vertexMessage') {
            const message: LiveServerMessage = msg.payload;

            if (message.serverContent?.interrupted) {
              stopAllAudio();
            }

            const inputText = message.serverContent?.inputTranscription?.text?.trim();

            if (message.serverContent?.inputTranscription?.finished && inputText) {
              // Check if we are waiting for confirmation of remaining exams
              if (remainingExamsRef.current && remainingExamsRef.current.length > 0 && isAffirmative(inputText)) {
                const chunk = remainingExamsRef.current.slice(0, 5);
                const rest = remainingExamsRef.current.slice(5);
                remainingExamsRef.current = rest;

                const heading = `${chunk[0].department || ''} ${chunk[0].level || ''} semester ${chunk[0].semester || ''} ${chunk[0].status || ''}`.replace(/\s+/g, ' ').trim();
                const lines = chunk.map((row: any) =>
                  `${row.subject || 'Subject'} ${row.paper || 'paper'}: ${formatDateForVoice(row.exam_date)}, ${formatTimeForVoice(row.exam_time)}`
                );

                let answer = `Aage ke papers ye hain: ${lines.join('. ')}.`;
                if (rest.length > 0) {
                  answer += ` Aapne jo aur paper bole the, kya aap unke baare mein bhi jaanna chahte hain?`;
                } else {
                  examContextRef.current = '';
                }

                stopAllAudio();
                proxyWs.send(JSON.stringify({
                  type: 'clientContent',
                  data: {
                    turns: `User said yes. Reply in Hinglish speaking ONLY these remaining exam details: ${answer}`,
                    turnComplete: true
                  }
                }));
                return;
              } else if (remainingExamsRef.current && remainingExamsRef.current.length > 0) {
                remainingExamsRef.current = [];
              }

              const nextContext = `${examContextRef.current} ${inputText}`.replace(/\s+/g, ' ').trim();
              const shouldHandleExam = hasLiveExamIntent(inputText) || examFlowStepRef.current > 0;

              if (shouldHandleExam) {
                examContextRef.current = nextContext;
                const answerKey = nextContext.toLowerCase();

                if (answerKey !== lastExamAnswerKeyRef.current) {
                  try {
                    const status = inferExamStatus(examContextRef.current);
                    const level = inferExamLevel(examContextRef.current);
                    const semester = inferExamSemester(examContextRef.current);
                    const department = inferExamDepartment(examContextRef.current);

                    const hasAllDetails = status && level && semester;

                    let answer = '';
                    let shouldSend = false;

                    if (examFlowStepRef.current === 0) {
                      examFlowStepRef.current = 1;
                      answer = 'Kripya thodi aur jankari dein, main aapki madad karungi: Aap Collegiate student hain ya Non-Collegiate? Aap graduate (UG) hain ya postgraduate (PG)? Aur semester kaunsa hai?';
                      shouldSend = true;
                    } else if (examFlowStepRef.current === 1) {
                      if (hasAllDetails) {
                        examFlowStepRef.current = 2;
                        answer = 'Aap kaun se papers ke baare mein jaanna chahte hain? Kya aap mujhe bataengi?';
                        shouldSend = true;
                      } else {
                        answer = 'Kripya thodi aur jankari dein, main aapki madad karungi: Aap Collegiate student hain ya Non-Collegiate? Aap graduate (UG) hain ya postgraduate (PG)? Aur semester kaunsa hai?';
                        shouldSend = true;
                      }
                    } else if (examFlowStepRef.current === 2) {
                      const wantsAll = /all|sabhi|teeno|sabke|teeno\s*ke|all\s*three|sab\s*ke|poore|pure|saare|sare|तीनों|सारे|सभी|पूरे/i.test(inputText);
                      const currentSubjects = inferExamSubjects(inputText);

                      if (currentSubjects.length === 0 && !wantsAll) {
                        answer = 'Aap kaun se papers ke baare mein jaanna chahte hain? Kya aap mujhe bataengi?';
                        shouldSend = true;
                      } else {
                        let exams = await searchMainExams({ status, level, semester, department });
                        if (exams.length === 0) {
                          exams = await searchMainExams({ status, level, semester });
                        }

                        if (currentSubjects.length > 0) {
                          const foundRows: any[] = [];
                          const missingSubjects: string[] = [];

                          for (const reqSub of currentSubjects) {
                            const matches = exams.filter((row: any) =>
                              row.subject && row.subject.toLowerCase().includes(reqSub.toLowerCase())
                            );
                            if (matches.length > 0) {
                              foundRows.push(...matches);
                            } else {
                              missingSubjects.push(reqSub);
                            }
                          }

                          if (foundRows.length > 0) {
                            const first = foundRows[0];
                            const heading = `${first.department || ''} ${first.level || ''} semester ${first.semester || ''} ${first.status || ''}`.replace(/\s+/g, ' ').trim();

                            let rowsToShow = foundRows;
                            let hasMore = false;
                            if (foundRows.length > 5) {
                              rowsToShow = foundRows.slice(0, 5);
                              remainingExamsRef.current = foundRows.slice(5);
                              hasMore = true;
                            } else {
                              remainingExamsRef.current = [];
                            }

                            const lines = rowsToShow.map((row: any) =>
                              `${row.subject || 'Subject'} ${row.paper || 'paper'}: ${formatDateForVoice(row.exam_date)}, ${formatTimeForVoice(row.exam_time)}`
                            );

                            answer = `${heading} ke papers ye hain: ${lines.join('. ')}.`;
                            if (missingSubjects.length > 0) {
                              answer += ` Lekin hamare paas ${missingSubjects.join(', ')} ke papers ki detail database mein record maujood nahi hai.`;
                            }
                            if (hasMore) {
                              answer += ` Aapne jo aur paper bole the, kya aap unke baare mein bhi jaanna chahte hain?`;
                            }
                            shouldSend = true;
                            examFlowStepRef.current = 0;
                          } else {
                            answer = `Hamare paas ${missingSubjects.join(', ')} ke papers ki detail database mein record maujood nahi hai.`;
                            remainingExamsRef.current = [];
                            shouldSend = true;
                            examFlowStepRef.current = 0;
                          }
                        } else {
                          if (exams.length > 0) {
                            const first = exams[0];
                            const heading = `${first.department || ''} ${first.level || ''} semester ${first.semester || ''} ${first.status || ''}`.replace(/\s+/g, ' ').trim();

                            let rowsToShow = exams;
                            let hasMore = false;
                            if (exams.length > 5) {
                              rowsToShow = exams.slice(0, 5);
                              remainingExamsRef.current = exams.slice(5);
                              hasMore = true;
                            } else {
                              remainingExamsRef.current = [];
                            }

                            const lines = rowsToShow.map((row: any) =>
                              `${row.subject || 'Subject'} ${row.paper || 'paper'}: ${formatDateForVoice(row.exam_date)}, ${formatTimeForVoice(row.exam_time)}`
                            );

                            answer = `${heading} ke sabhi papers ye hain: ${lines.join('. ')}.`;
                            if (hasMore) {
                              answer += ` Aapne jo aur paper bole the, kya aap unke baare mein bhi jaanna chahte hain?`;
                            }
                            shouldSend = true;
                            examFlowStepRef.current = 0;
                          } else {
                            answer = 'Maaf kijiye, hamare paas ye database mein record maujood nahi hai.';
                            remainingExamsRef.current = [];
                            shouldSend = true;
                            examFlowStepRef.current = 0;
                          }
                        }
                      }
                    }

                    if (shouldSend) {
                      lastExamAnswerKeyRef.current = answerKey;
                      stopAllAudio();
                      proxyWs.send(JSON.stringify({
                        type: 'clientContent',
                        data: {
                          turns: `User asked this exam question/context: "${nextContext}". Reply in natural Hinglish using ONLY this verified college exam answer. Do not mention tools, database, temporary issue, connection, or internal errors. If details or papers are missing, speak only that. Verified answer: ${answer}`,
                          turnComplete: true
                        }
                      }));
                    }
                  } catch (err) {
                    console.error('Live deterministic exam answer failed:', err);
                    const fallback = 'Maaf kijiye, is exam schedule ka exact record abhi available information me nahi mila. Kripya course, semester, status aur subject clear bata dein, main help kar dungi.';
                    proxyWs.send(JSON.stringify({
                      type: 'clientContent',
                      data: { turns: fallback, turnComplete: true }
                    }));
                  }
                }
              }
            }

            if (message.serverContent?.turnComplete) {
              incrementUsage();
            }

            if (message.toolCall && message.toolCall.functionCalls) {
              const toolResponses: any[] = [];

              for (const call of message.toolCall.functionCalls) {
                let result;
                try {
                  switch (call.name) {
                    case 'search_faculty': result = await searchFaculty(call.args as any); break;
                    case 'get_principal_info': result = await getPrincipalInfo(); break;
                    case 'get_college_info_sections': result = await getCollegeSections((call.args as any).key); break;
                    case 'get_past_principals': result = await getAllPastPrincipals((call.args as any).query); break;
                    case 'get_achievements': result = await getAllAchievements((call.args as any).query); break;
                    case 'search_merit_list': result = await searchMeritList(call.args as any); break;
                    case 'search_main_exams': {
                      const args = call.args || {};
                      let { status, level, semester, subject, department, query } = args as any;

                      const fullQuery = query || examContextRef.current;

                      if (status) status = inferExamStatus(status) || status;
                      else status = inferExamStatus(fullQuery);

                      if (level) level = inferExamLevel(level) || level;
                      else level = inferExamLevel(fullQuery);

                      if (semester) {
                        const parsedSem = inferExamSemester(String(semester));
                        if (parsedSem) semester = Number(parsedSem);
                      } else {
                        const parsedSem = inferExamSemester(fullQuery);
                        if (parsedSem) semester = Number(parsedSem);
                      }

                      if (department) department = inferExamDepartment(department) || department;
                      else department = inferExamDepartment(fullQuery);

                      const hasAllDetails = status && level && semester;

                      if (examFlowStepRef.current === 0) {
                        examFlowStepRef.current = 1;
                        const msg2 = 'Kripya thodi aur jankari dein, main aapki madad karungi: Aap Collegiate student hain ya Non-Collegiate? Aap graduate (UG) hain ya postgraduate (PG)? Aur semester kaunsa hai?';
                        result = { error: 'Missing parameters', instruction_to_model: 'Ask the user exactly this question:', question_to_ask: msg2, verified_answer: msg2 };
                        break;
                      }

                      if (examFlowStepRef.current === 1) {
                        if (hasAllDetails) {
                          examFlowStepRef.current = 2;
                          const msg2 = 'Aap kaun se papers ke baare mein jaanna chahte hain? Kya aap mujhe bataengi?';
                          result = { instruction_to_model: 'Ask the user exactly this question:', question_to_ask: msg2, verified_answer: msg2 };
                          break;
                        } else {
                          const msg2 = 'Kripya thodi aur jankari dein, main aapki madad karungi: Aap Collegiate student hain ya Non-Collegiate? Aap graduate (UG) hain ya postgraduate (PG)? Aur semester kaunsa hai?';
                          result = { error: 'Missing parameters', instruction_to_model: 'Ask the user exactly this question:', question_to_ask: msg2, verified_answer: msg2 };
                          break;
                        }
                      }

                      const toolSubjects: string[] = [];
                      if (subject) {
                        const inferred = inferExamSubjects(subject);
                        if (inferred.length > 0) toolSubjects.push(...inferred);
                        else toolSubjects.push(subject);
                      }
                      const querySubjects = inferExamSubjects(fullQuery);
                      const requestedSubjects = Array.from(new Set([...toolSubjects, ...querySubjects]));

                      const wantsAll = /all|sabhi|teeno|sabke|teeno\s*ke|all\s*three|sab\s*ke|poore|pure|saare|sare|तीनों|सारे|सभी|पूरे/i.test(fullQuery);

                      if (requestedSubjects.length === 0 && !wantsAll) {
                        const msg2 = 'Aap kaun se papers ke baare mein jaanna chahte hain? Kya aap mujhe bataengi?';
                        result = { instruction_to_model: 'Ask the user exactly this question:', question_to_ask: msg2, verified_answer: msg2 };
                        break;
                      }

                      let exams = await searchMainExams({ status, level, semester, department });
                      if (exams.length === 0) exams = await searchMainExams({ status, level, semester });

                      let answer = '';
                      let foundRows: any[] = [];

                      if (requestedSubjects.length > 0) {
                        const missingSubjects: string[] = [];
                        for (const reqSub of requestedSubjects) {
                          const matches = exams.filter((row: any) =>
                            row.subject && row.subject.toLowerCase().includes(reqSub.toLowerCase())
                          );
                          if (matches.length > 0) foundRows.push(...matches);
                          else missingSubjects.push(reqSub);
                        }

                        if (foundRows.length > 0) {
                          const first = foundRows[0];
                          const heading = `${first.department || ''} ${first.level || ''} semester ${first.semester || ''} ${first.status || ''}`.replace(/\s+/g, ' ').trim();
                          let rowsToShow = foundRows;
                          let hasMore = false;
                          if (foundRows.length > 5) { rowsToShow = foundRows.slice(0, 5); remainingExamsRef.current = foundRows.slice(5); hasMore = true; }
                          else remainingExamsRef.current = [];
                          const lines = rowsToShow.map((row: any) => `${row.subject || 'Subject'} ${row.paper || 'paper'}: ${formatDateForVoice(row.exam_date)}, ${formatTimeForVoice(row.exam_time)}`);
                          answer = `${heading} ke papers ye hain: ${lines.join('. ')}.`;
                          if (missingSubjects.length > 0) answer += ` Lekin hamare paas ${missingSubjects.join(', ')} ke papers ki detail database mein record maujood nahi hai.`;
                          if (hasMore) answer += ` Aapne jo aur paper bole the, kya aap unke baare mein bhi jaanna chahte hain?`;
                        } else {
                          answer = `Hamare paas ${missingSubjects.join(', ')} ke papers ki detail database mein record maujood nahi hai.`;
                          remainingExamsRef.current = [];
                        }
                      } else {
                        foundRows = exams;
                        if (exams.length > 0) {
                          const first = exams[0];
                          const heading = `${first.department || ''} ${first.level || ''} semester ${first.semester || ''} ${first.status || ''}`.replace(/\s+/g, ' ').trim();
                          let rowsToShow = exams;
                          let hasMore = false;
                          if (exams.length > 5) { rowsToShow = exams.slice(0, 5); remainingExamsRef.current = exams.slice(5); hasMore = true; }
                          else remainingExamsRef.current = [];
                          const lines = rowsToShow.map((row: any) => `${row.subject || 'Subject'} ${row.paper || 'paper'}: ${formatDateForVoice(row.exam_date)}, ${formatTimeForVoice(row.exam_time)}`);
                          answer = `${heading} ke sabhi papers ye hain: ${lines.join('. ')}.`;
                          if (hasMore) answer += ` Aapne jo aur paper bole the, kya aap unke baare mein bhi jaanna chahte hain?`;
                        } else {
                          answer = 'Maaf kijiye, hamare paas ye database mein record maujood nahi hai.';
                          remainingExamsRef.current = [];
                        }
                      }

                      examFlowStepRef.current = 0;
                      result = { exams: foundRows, verified_answer: answer };
                      break;
                    }
                    case 'get_study_material': result = await searchStudyMaterial(call.args as any); break;
                    case 'search_practical_exams': result = await searchPracticalExams(call.args as any); break;
                    case 'search_practical_students': result = await searchPracticalStudentsByName(call.args as any); break;
                    case 'search_gallery': result = await searchGallery(call.args as any); break;
                    case 'get_gallery_categories': result = await getGalleryCategories(); break;
                    case 'search_events': result = await searchEvents(call.args as any); break;
                    case 'search_courses': result = await searchCourses((call.args as any).stream, (call.args as any).query); break;
                    case 'search_sports': result = await searchSports(call.args as any); break;
                    case 'search_knowledge_base': result = await searchKnowledgeBase(call.args as any); break;
                    case 'search_knowledge_items': result = await searchKnowledgeItems((call.args as any).query); break;
                    case 'search_materials_chat': result = await searchMaterialsChat((call.args as any).query); break;
                    case 'search_alerts_chat': result = await searchAlertsChat((call.args as any).query); break;
                    default: result = { error: 'Function not found' };
                  }
                } catch (e) {
                  console.error(`Error in Live API tool ${call.name}:`, e);
                  result = { error: 'Failed to execute function' };
                }

                toolResponses.push({
                  name: call.name,
                  response: { data: result ?? null },
                  id: call.id || call.name
                });
              }

              if (toolResponses.length > 0) {
                try {
                  proxyWs.send(JSON.stringify({
                    type: 'toolResponse',
                    data: { functionResponses: toolResponses }
                  }));
                } catch (err) {
                  console.error('Live API tool response failed:', err);
                  setTranscript(prev => `AI: Maaf kijiye, main available information ke basis par answer dungi. Aap apna exam question ek baar aur clear bol dijiye.\n${prev}`);
                }
              }
            }

            const parts = message.serverContent?.modelTurn?.parts;
            const base64Audio = (parts && parts.length > 0) ? parts.find((p: any) => p.inlineData)?.inlineData?.data : undefined;
            if (base64Audio) {
              const pcm16 = base64ToBuffer(base64Audio);
              audioQueueRef.current.push(pcm16);
              processAudioQueue();
            }
          }
        };

        proxyWs.onerror = (err) => {
          console.error('[LiveAPI] Proxy WebSocket error:', err);
          liveConnectionOpenRef.current = false;
          setError('Voice server se connection error. Server chal raha hai? (npm run dev)');
          stopConnection();
          reject(err);
        };

        proxyWs.onclose = (event) => {
          if (!liveConnectionOpenRef.current) return; // Already handled
          liveConnectionOpenRef.current = false;
          if (event.code !== 1000) {
            setError(`Proxy connection closed (${event.code}): ${event.reason || 'Unknown reason'}`);
          }
          stopConnection(false);
        };
      });

      sessionRef.current = sessionPromise;


    } catch (err: any) {
      console.error(err);
      let userErrorMessage = err.message || "Failed to start connection.";
      if (userErrorMessage.includes("Requested device not found")) {
        userErrorMessage = "Microphone nahi mila. Please check your mic connection.";
      } else if (userErrorMessage.includes("Permission denied")) {
        userErrorMessage = "Microphone access blocked. Please allow mic permission.";
      }
      setError(userErrorMessage);
      stopConnection();
    }
  };

  return {
    isConnected,
    isSpeaking,
    transcript,
    error,
    startConnection,
    stopConnection,
    dailyLimitReached,
    questionsRemaining,
    timeUntilReset
  };
}
