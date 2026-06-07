import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const runtime = 'nodejs'; // Edge runtime crashes with Supabase Node.js client

export async function GET() {
  try {
    const [infoRes, meritRes] = await Promise.all([
      supabase.from('college_info').select('*'),
      supabase.from('college_merit_list').select('exam_year, board_type').order('exam_year', { ascending: false })
    ]);

    // Calculate Merit metadata for context
    let meritSummary = "";
    if (meritRes.data && meritRes.data.length > 0) {
      const years = meritRes.data
        .map((m: any) => parseInt(m.exam_year))
        .filter((y: any) => !isNaN(y) && isFinite(y));
      // Guard: empty array causes Math.min/max to return Infinity/-Infinity
      const minYear = years.length > 0 ? Math.min(...years) : 1945;
      const maxYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear();
      const boards = Array.from(new Set(meritRes.data.map((m: any) => m.board_type))).slice(0, 10);
      meritSummary = `Hall of Fame Archive: Records available FROM ${minYear} TO ${maxYear} (minYear=${minYear}, maxYear=${maxYear}). IMPORTANT: If user asks for a year OUTSIDE ${minYear}-${maxYear}, tell them we don't have that year, and mention the available range and apologize. Boards: ${boards.join(', ')}. Total mapped records in active buffer: ${meritRes.data.length}.`;
    } else {
      meritSummary = "Archive Status: Historical toppers records are available via the search_merit_list tool starting from 1945.";
    }

    let context = '--- LOHIA COLLEGE COMPREHENSIVE KNOWLEDGE BASE ---\n\n';

    // SEED CORE FACTS (Fallback/Always Present)
    context += '## CORE COLLEGE FACTS\n';
    context += '- College Name: Lohia College, Churu (Rajasthan)\n';
    context += '- Established: 1945 (as Intermediate College), upgraded to Degree College in 1951.\n';
    context += '- Founder: Seth Kanhiya Lal Lohia.\n';
    context += '- Affiliation: Maharaja Ganga Singh University (MGSU), Bikaner.\n';
    context += '- Motto: Vidya Dharmena Shobhate (Knowledge is adorned by righteousness).\n';
    context += '- Departments: Science, Commerce, Arts, Computer Science, Geography, Sociology, Hindi, Urdu, Political Science, Economics, etc.\n';
    context += '- Infrastructure: Information Center, Smart Classrooms, Library, Sports Ground, NCC & NSS units, Hostel Facility.\n';
    context += `- Merit History: ${meritSummary}\n`;
    context += '- IMPORTANT: If the user asks for toppers from a specific year or board (like 1952 Commerce), YOU MUST USE THE search_merit_list tool to get the accurate historical data. Do not say you do not have it. The merit list date goes back to 1945.\n';
    
    context += '\n## URGENT: ADMISSION 2026-27 (IMPORTANT)\n';
    context += '- Topic: Regular Admission for B.A / B.Sc / B.Com 1st Year (Session 2026-27).\n';
    context += '- Start Date: 1 May 2026.\n';
    context += '- Last Date (Antim Tithi): 6 June 2026.\n';
    context += '- Nodal Officer UG Admission: Dr. Umed Singh Gothwal (Phone: 9414203821).\n';
    


    
    context += '\n- Required Documents for Application:\n';
    context += '  1. 10th & 12th Marksheets\n';
    context += '  2. Caste Certificate (Jati Praman Patra)\n';
    context += '  3. Domicile Certificate (Mool Niwas)\n';
    context += '  4. ABC ID / APAAR ID\n';
    context += '  5. Aadhaar Card & Jan Aadhaar Card\n';
    context += '  6. Passport Size Photo & Signature\n';
    context += '  7. Active E-mail ID & Mobile Number\n';
    context += '  8. SSO ID\n';
    context += '- Application Mode: Online (htedu.rajasthan.gov.in)\n';
    context += '- Help Desk / Form Filling WhatsApp: 9509932564\n\n';

    if (infoRes.data && infoRes.data.length > 0) {
      context += '## GENERAL INFO & PRINCIPAL\n';
      infoRes.data.forEach((i: any) => {
        context += `- ${i.key}: ${i.value}\n`;
      });
      context += '\n';
    }

    context += '## INSTRUCTIONS FOR AI (MANDATORY RAG TOOL USAGE)\n';
    context += 'To save API costs and improve speed, the system no longer pre-loads all data. YOU MUST USE THE FOLLOWING TOOLS TO ANSWER USER QUERIES:\n';
    context += '1. Faculty details: use search_faculty_chat\n';
    context += '2. Course details/seats: use search_courses\n';
    context += '3. College History, Milestones, Facilities, Exam Passing Rules: use get_college_info_sections\n';
    context += '4. General FAQs (Canteen, Library, Parking, NSS): use search_knowledge_base\n';
    context += '5. Exam Dates/Timetables: use search_main_exams or search_practical_batches\n';
    context += '6. Events/Notices: use search_events or searchAlertsChat\n';
    context += '7. Study Materials: use searchMaterialsChat\n';
    context += '8. Admin uploaded knowledge with attachments: use search_knowledge_items\n';
    context += '9. Past Principals: use get_past_principals\n';
    context += '10. Achievements: use get_achievements\n';
    context += 'DO NOT GUESS. ALWAYS CALL A TOOL if the data is not in the CORE COLLEGE FACTS above.\n\n    ';
    return NextResponse.json({ context });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
