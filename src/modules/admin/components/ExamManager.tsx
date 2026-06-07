'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  ChevronRight, 
  BookOpen, 
  FlaskConical, 
  FileText, 
  Users, 
  Calendar, 
  Clock, 
  Plus, 
  Trash2, 
  Upload, 
  Download,
  Search,
  LayoutGrid,
  ChevronLeft,
  Loader2
} from 'lucide-react';
import { adminService } from '../services/adminService';
import { authFetch } from '../services/authFetch';

const DEPARTMENTS = ['Arts', 'Commerce', 'Science', 'Computer'];
const STATUSES = ['Collegiate', 'Non-Collegiate'];
const LEVELS = ['Graduate', 'Post Graduate'];

const SelectionCard = ({ options, onSelect, activeVal }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4">
    {options.map((opt: any) => (
      <button
        key={opt}
        onClick={() => onSelect(opt)}
        className={`p-6 rounded-2xl border transition-all text-left group ${
          activeVal === opt 
          ? 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-900/40' 
          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:bg-zinc-800'
        }`}
      >
        <div className="text-lg font-black uppercase tracking-tight group-hover:scale-105 transition-transform">{opt}</div>
        <div className="mt-2 opacity-50 text-[10px] font-bold">SELECT [ {opt} ]</div>
      </button>
    ))}
  </div>
);

export const ExamManager = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Selection State
  const [selection, setSelection] = useState<any>({
    department: '',
    status: '',
    level: '',
    semester: null,
    section: '', // 'Practical' | 'Main Exam'
    subSection: '', // 'Study Material' | 'Practical Exam'
  });

  // Data States
  const [subjects, setSubjects] = useState<any[]>([]);
  const [mainExams, setMainExams] = useState<any[]>([]);
  const [studyMaterials, setStudyMaterials] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [batchStudents, setBatchStudents] = useState<any[]>([]);

  // Forms
  const [mainExamForm, setMainExamForm] = useState({ subject: '', paper: 'First', exam_date: '', exam_time: '' });
  const [studyMaterialForm, setStudyMaterialForm] = useState({ material_type: 'File', title: '', file_url: '' });
  const [practicalRange, setPracticalRange] = useState({ start: '', end: '' });
  const [generatedDates, setGeneratedDates] = useState<string[]>([]);
  const [newBatch, setNewBatch] = useState({ batch_no: '', exam_time: '09:00' });
  const [newStudent, setNewStudent] = useState({ roll_no: '', name: '', father_name: '', seat_no: '' });
  const [uploading, setUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await authFetch('/api/admin/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.url) {
        setStudyMaterialForm({ ...studyMaterialForm, file_url: data.url });
      }
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploading(false);
    }
  };

  const loadSubjects = useCallback(async () => {
    const data = await adminService.getExamSubjects(selection.department);
    setSubjects(data);
  }, [selection.department]);

  const loadMainExams = useCallback(async () => {
    const data = await adminService.getMainExams({
      department: selection.department,
      status: selection.status,
      level: selection.level,
      semester: selection.semester
    });
    setMainExams(data);
  }, [selection.department, selection.status, selection.level, selection.semester]);

  const loadStudyMaterials = useCallback(async () => {
    const data = await adminService.getStudyMaterials({
      department: selection.department,
      status: selection.status,
      level: selection.level,
      semester: selection.semester
    });
    setStudyMaterials(data);
  }, [selection.department, selection.status, selection.level, selection.semester]);

  // Load Initial Data when reaching relevant steps
  useEffect(() => {
    if (step === 5) {
      const load = async () => {
        if (selection.section === 'Main Exam') await loadMainExams();
        if (selection.subSection === 'Study Material') await loadStudyMaterials();
        if (selection.section === 'Main Exam') await loadSubjects();
      };
      load();
    }
  }, [step, selection, loadMainExams, loadStudyMaterials, loadSubjects]);

  const loadBatches = async (date: string) => {
    const data = await adminService.getPracticalBatches({
      department: selection.department,
      status: selection.status,
      level: selection.level,
      semester: selection.semester,
      exam_date: date
    });
    setBatches(data);
  };

  const loadStudents = async (batchId: string) => {
    const data = await adminService.getPracticalStudents(batchId);
    setBatchStudents(data);
  };

  // Logic Helpers
  const handleDateRangeSubmit = () => {
    if (!practicalRange.start || !practicalRange.end) return;
    const start = new Date(practicalRange.start);
    const end = new Date(practicalRange.end);
    const dates = [];
    for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split('T')[0]);
    }
    setGeneratedDates(dates);
  };

  const resetEntry = () => {
    setStep(0);
    setSelection({ department: '', status: '', level: '', semester: null, section: '', subSection: '' });
  };

  const goBack = () => setStep(prev => Math.max(0, prev - 1));

  return (
    <div className="min-h-screen">
      {/* Breadcrumb / Progress */}
      <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide text-[10px] uppercase font-black tracking-widest">
        <button onClick={resetEntry} className="text-blue-400 hover:underline">Root</button>
        {selection.department && <><ChevronRight className="w-3 h-3 text-zinc-700" /> <span className="text-zinc-500">{selection.department}</span></>}
        {selection.status && <><ChevronRight className="w-3 h-3 text-zinc-700" /> <span className="text-zinc-500">{selection.status}</span></>}
        {selection.level && <><ChevronRight className="w-3 h-3 text-zinc-700" /> <span className="text-zinc-500">{selection.level}</span></>}
        {selection.section && <><ChevronRight className="w-3 h-3 text-zinc-700" /> <span className="text-zinc-500">{selection.section}</span></>}
        {selection.semester && <><ChevronRight className="w-3 h-3 text-zinc-700" /> <span className="text-white">Sem {selection.semester}</span></>}
      </div>

      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">
          {step === 0 && "Select Department"}
          {step === 1 && "Select Student Category"}
          {step === 2 && "Select Academic Level"}
          {step === 3 && "Exam Type Selection"}
          {step === 4 && "Select Semester"}
          {step >= 5 && selection.section }
        </h2>
        {step > 0 && <button onClick={goBack} className="p-2 text-zinc-500 hover:text-white"><ChevronLeft /></button>}
      </div>

      {/* Step 0: Department */}
      {step === 0 && (
        <SelectionCard 
          options={DEPARTMENTS} 
          onSelect={(opt: string) => { setSelection({...selection, department: opt}); setStep(1); }} 
        />
      )}

      {/* Step 1: Status */}
      {step === 1 && (
        <SelectionCard 
          options={STATUSES} 
          onSelect={(opt: string) => { setSelection({...selection, status: opt}); setStep(2); }} 
        />
      )}

      {/* Step 2: Level */}
      {step === 2 && (
        <SelectionCard 
          options={LEVELS} 
          onSelect={(opt: string) => { setSelection({...selection, level: opt}); setStep(3); }} 
        />
      )}

      {/* Step 3: Section Type */}
      {step === 3 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button 
            onClick={() => { setSelection({...selection, section: 'Practical'}); setStep(4); }}
            className="p-10 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-emerald-500/50 transition-all group text-left"
          >
            <FlaskConical className="w-10 h-10 text-emerald-400 mb-4 group-hover:rotate-12 transition-transform" />
            <div className="text-xl font-black text-white uppercase">Practical</div>
            <p className="text-zinc-500 text-sm mt-2">Manage study files, survey reports and lab batches.</p>
          </button>
          <button 
            onClick={() => { setSelection({...selection, section: 'Main Exam'}); setStep(4); }}
            className="p-10 bg-zinc-900 border border-zinc-800 rounded-3xl hover:border-blue-500/50 transition-all group text-left"
          >
            <Calendar className="w-10 h-10 text-blue-400 mb-4 group-hover:-rotate-12 transition-transform" />
            <div className="text-xl font-black text-white uppercase">Main Exam</div>
            <p className="text-zinc-500 text-sm mt-2">Schedule theory papers, dates and timings.</p>
          </button>
        </div>
      )}

      {/* Step 4: Semester */}
      {step === 4 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: selection.level === 'Graduate' ? 6 : 4 }).map((_, i) => (
            <button
              key={i}
              onClick={() => { setSelection({...selection, semester: i+1}); setStep(5); }}
              className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl text-center hover:bg-zinc-800 transition-all group"
            >
              <div className="text-3xl font-black text-white group-hover:scale-110 transition-transform">{i+1}</div>
              <div className="text-[10px] text-zinc-500 uppercase mt-2 font-bold tracking-widest">Semester</div>
            </button>
          ))}
        </div>
      )}

      {/* Step 5: Practical Selection */}
      {step === 5 && selection.section === 'Practical' && !selection.subSection && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button 
            onClick={() => { setSelection({...selection, subSection: 'Study Material'}); setStep(6); }}
            className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 group"
          >
            <FileText className="w-8 h-8 text-blue-400 mb-2 mx-auto" />
            <div className="font-bold text-white uppercase">Study Material</div>
            <div className="text-xs text-zinc-500">Files, Surveys, Charts</div>
          </button>
          <button 
            onClick={() => { setSelection({...selection, subSection: 'Practical Exam'}); setStep(6); }}
            className="p-8 bg-zinc-900 border border-zinc-800 rounded-2xl hover:bg-zinc-800 group"
          >
            <Users className="w-8 h-8 text-emerald-400 mb-2 mx-auto" />
            <div className="font-bold text-white uppercase">Practical Exam</div>
            <div className="text-xs text-zinc-500">Date Range, Batches, Seats</div>
          </button>
        </div>
      )}

      {/* MAIN EXAM FORM & LIST */}
      {step === 5 && selection.section === 'Main Exam' && (
        <div className="space-y-6">
          <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <select 
                 className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none"
                 value={mainExamForm.subject}
                 onChange={e => setMainExamForm({...mainExamForm, subject: e.target.value})}
               >
                 <option value="">Select Subject</option>
                 {subjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
               </select>
               <select 
                 className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none"
                 value={mainExamForm.paper}
                 onChange={e => setMainExamForm({...mainExamForm, paper: e.target.value})}
               >
                 <option value="First">First Paper</option>
                 <option value="Second">Second Paper</option>
                 <option value="Third">Third Paper</option>
               </select>
               <input 
                 type="date"
                 className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none"
                 value={mainExamForm.exam_date}
                 onChange={e => setMainExamForm({...mainExamForm, exam_date: e.target.value})}
               />
               <input 
                 type="time"
                 className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white outline-none"
                 value={mainExamForm.exam_time}
                 onChange={e => setMainExamForm({...mainExamForm, exam_time: e.target.value})}
               />
             </div>
             <button 
               onClick={async () => {
                 const { section, subSection, ...dbSelection } = selection;
                await adminService.addMainExam({...mainExamForm, ...dbSelection});
                 loadMainExams();
                 setMainExamForm({ subject: '', paper: 'First', exam_date: '', exam_time: '' });
               }}
               className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl uppercase tracking-widest shadow-xl shadow-blue-900/20"
             >
               Schedule Exam
             </button>
          </div>

          <div className="bg-zinc-900 rounded-3xl border border-zinc-800 overflow-hidden">
            <div className="p-6 border-b border-zinc-800 bg-zinc-800/20 font-black text-xs uppercase tracking-widest text-zinc-500">Time Table</div>
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-zinc-500 uppercase font-black border-b border-zinc-800">
                  <th className="p-6">Date</th>
                  <th className="p-6">Subject</th>
                  <th className="p-6">Paper</th>
                  <th className="p-6">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {mainExams.map(ex => (
                  <tr key={ex.id} className="hover:bg-zinc-800/30 transition-colors">
                    <td className="p-6 text-white font-bold">{ex.exam_date}</td>
                    <td className="p-6 text-white">{ex.subject}</td>
                    <td className="p-6 text-zinc-400">{ex.paper}</td>
                    <td className="p-6 text-blue-400 font-mono">{ex.exam_time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STUDY MATERIAL SECTION */}
      {step === 6 && selection.subSection === 'Study Material' && (
        <div className="space-y-6">
           <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 max-w-4xl mx-auto">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select 
                   className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white"
                   value={studyMaterialForm.material_type}
                   onChange={e => setStudyMaterialForm({...studyMaterialForm, material_type: e.target.value})}
                >
                  <option value="File">Practical File</option>
                  <option value="Survey File">Survey File</option>
                  <option value="Chart">Reference Chart</option>
                </select>
                <input 
                  placeholder="Material Title" 
                  className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-white"
                  value={studyMaterialForm.title}
                  onChange={e => setStudyMaterialForm({...studyMaterialForm, title: e.target.value})}
                />
                <div className="flex gap-2">
                  <label className="flex-grow flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white p-3 rounded-xl cursor-pointer border border-zinc-700">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    {studyMaterialForm.file_url ? 'File Ready' : 'Upload File'}
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                  {studyMaterialForm.file_url && <div className="bg-emerald-500/20 text-emerald-500 p-3 rounded-xl border border-emerald-500/30 font-bold text-xs uppercase flex items-center">OK</div>}
                </div>
             </div>
             <button 
               onClick={async () => {
                 const { section, subSection, ...dbSelection } = selection;
                 await adminService.addStudyMaterial({...studyMaterialForm, ...dbSelection});
                 loadStudyMaterials();
                 setStudyMaterialForm({ material_type: 'File', title: '', file_url: '' });
               }}
               className="mt-6 w-full bg-emerald-600 font-black py-4 rounded-xl text-white uppercase"
             >Save Material</button>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {studyMaterials.map(mat => (
               <div key={mat.id} className="bg-zinc-900 p-5 rounded-2xl border border-zinc-800 flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="p-3 bg-zinc-800 rounded-xl"><Download className="w-4 h-4 text-zinc-500" /></div>
                   <div>
                     <div className="text-white font-bold text-sm">{mat.title}</div>
                     <div className="text-[10px] text-zinc-500 uppercase">{mat.material_type}</div>
                   </div>
                 </div>
                 <a href={mat.file_url} target="_blank" className="text-blue-400 hover:text-blue-300"><LayoutGrid className="w-4 h-4" /></a>
               </div>
             ))}
           </div>
        </div>
      )}

      {/* PRACTICAL EXAM CALENDAR & BATCHES */}
      {step === 6 && selection.subSection === 'Practical Exam' && (
        <div className="space-y-8">
           <div className="flex gap-4 items-center bg-zinc-900 p-6 rounded-2xl border border-zinc-800">
             <input type="date" className="bg-zinc-950 text-white p-3 rounded-xl border border-zinc-800" value={practicalRange.start} onChange={e => setPracticalRange({...practicalRange, start: e.target.value})} />
             <span className="text-zinc-600">to</span>
             <input type="date" className="bg-zinc-950 text-white p-3 rounded-xl border border-zinc-800" value={practicalRange.end} onChange={e => setPracticalRange({...practicalRange, end: e.target.value})} />
             <button onClick={handleDateRangeSubmit} className="bg-white text-black px-8 py-3 rounded-xl font-black uppercase text-xs">Generate Timeline</button>
           </div>

           <div className="flex gap-4 overflow-x-auto pb-6">
             {generatedDates.map(date => (
               <button 
                 key={date}
                 onClick={() => loadBatches(date)}
                 className="flex-shrink-0 w-32 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-emerald-500 transition-all text-center"
               >
                 <div className="text-xs text-zinc-500 font-bold uppercase">{new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                 <div className="text-xl font-black text-white mt-1">{new Date(date).getDate()}</div>
               </button>
             ))}
           </div>

           {/* Batch List */}
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800">
                 <h4 className="text-white font-black uppercase mb-6 flex items-center gap-2"><Clock className="w-5 h-5 text-emerald-400" /> Manage Batches</h4>
                 <div className="flex gap-2 mb-6">
                    <input placeholder="Batch No" className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-white flex-grow" value={newBatch.batch_no} onChange={e => setNewBatch({...newBatch, batch_no: e.target.value})} />
                    <input type="time" className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-white" value={newBatch.exam_time} onChange={e => setNewBatch({...newBatch, exam_time: e.target.value})} />
                    <button 
                      onClick={async () => {
                        const { section, subSection, ...dbSelection } = selection;
                        const batch = await adminService.addPracticalBatch({
                          ...newBatch, 
                          ...dbSelection, 
                          exam_date: generatedDates[0] || new Date().toISOString().split('T')[0]
                        });
                        loadBatches(batch.exam_date);
                      }}
                      className="p-3 bg-emerald-600 rounded-xl text-white"><Plus /></button>
                 </div>
                 <div className="space-y-3">
                   {batches.map(b => (
                     <button 
                       key={b.id} 
                       onClick={() => { setActiveBatch(b); loadStudents(b.id); }}
                       className={`w-full p-6 rounded-2xl border transition-all flex justify-between items-center ${activeBatch?.id === b.id ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-zinc-950 border-zinc-800 text-zinc-400'}`}
                     >
                       <div className="font-black text-lg">BATCH {b.batch_no}</div>
                       <div className="font-mono text-sm opacity-70">{b.exam_time}</div>
                     </button>
                   ))}
                 </div>
              </div>

              {/* Student Entry */}
              {activeBatch && (
                <div className="bg-zinc-900 p-8 rounded-3xl border border-emerald-500/20">
                   <h4 className="text-white font-black uppercase mb-6">Batch {activeBatch.batch_no} Students</h4>
                   <div className="grid grid-cols-2 gap-4 mb-6">
                     <input placeholder="Roll No" className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-white" value={newStudent.roll_no} onChange={e => setNewStudent({...newStudent, roll_no: e.target.value})} />
                     <input placeholder="Seat No" className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-white" value={newStudent.seat_no} onChange={e => setNewStudent({...newStudent, seat_no: e.target.value})} />
                     <input placeholder="Name" className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-white col-span-2" value={newStudent.name} onChange={e => setNewStudent({...newStudent, name: e.target.value})} />
                     <input placeholder="Father Name" className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-white col-span-2" value={newStudent.father_name} onChange={e => setNewStudent({...newStudent, father_name: e.target.value})} />
                   </div>
                   <button 
                     onClick={async () => {
                        await adminService.addPracticalStudent({...newStudent, batch_id: activeBatch.id, category: selection.status});
                        loadStudents(activeBatch.id);
                        setNewStudent({ roll_no: '', name: '', father_name: '', seat_no: '' });
                     }}
                     className="w-full bg-emerald-600 py-4 rounded-xl text-white font-black uppercase"
                   >Add Student Data</button>

                   <div className="mt-8 overflow-hidden rounded-xl border border-zinc-800">
                     <table className="w-full text-left text-xs">
                       <thead className="bg-zinc-950 text-zinc-500 uppercase font-black">
                         <tr><th className="p-4">Roll</th><th className="p-4">Name</th><th className="p-4">Seat</th></tr>
                       </thead>
                       <tbody className="divide-y divide-zinc-800">
                         {batchStudents.map(s => (
                           <tr key={s.id}><td className="p-4 text-white font-bold">{s.roll_no}</td><td className="p-4 text-zinc-400">{s.name}</td><td className="p-4 text-emerald-400 font-mono">{s.seat_no}</td></tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}

    </div>
  );
};
