'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { adminService } from '../services/adminService';
import { authFetch } from '../services/authFetch';
import {
  Brain,
  CheckCircle2,
  Download,
  ExternalLink,
  File,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  Presentation,
  Save,
  Sparkles,
  Trash2,
  Upload,
  Video,
  X
} from 'lucide-react';

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size?: number;
  mime_type?: string;
}

const initialForm = {
  title: '',
  category: 'General',
  summary: '',
  answer_text: '',
  extracted_text: '',
  tagsInput: ''
};

const getFileType = (fileName: string, mimeType?: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (mimeType?.startsWith('image/')) return 'image';
  if (mimeType?.startsWith('video/')) return 'video';
  if (!ext) return 'other';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return 'doc';
  if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'excel';
  if (['ppt', 'pptx', 'odp'].includes(ext)) return 'ppt';
  if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext)) return 'video';
  return 'other';
};

const getFileIcon = (type: string) => {
  switch (type) {
    case 'image': return <ImageIcon className="w-4 h-4 text-purple-400" />;
    case 'video': return <Video className="w-4 h-4 text-pink-400" />;
    case 'pdf': return <FileText className="w-4 h-4 text-red-400" />;
    case 'doc': return <FileText className="w-4 h-4 text-blue-400" />;
    case 'excel': return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
    case 'ppt': return <Presentation className="w-4 h-4 text-orange-400" />;
    default: return <File className="w-4 h-4 text-zinc-400" />;
  }
};

const buildSearchText = (form: typeof initialForm, mainFile: UploadedFile | null, attachments: UploadedFile[]) =>
  [
    form.title,
    form.category,
    form.summary,
    form.answer_text,
    form.extracted_text,
    form.tagsInput,
    mainFile?.name,
    ...attachments.map(file => file.name)
  ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

export const KnowledgeItemsManager = () => {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processingMain, setProcessingMain] = useState(false);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [mainFile, setMainFile] = useState<UploadedFile | null>(null);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [error, setError] = useState('');

  const tags = useMemo(
    () => form.tagsInput.split(',').map(tag => tag.trim()).filter(Boolean),
    [form.tagsInput]
  );

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await adminService.getKnowledgeItems();
      setItems(data || []);
    } catch (err: any) {
      console.error('Failed to load knowledge items:', err);
      setError(err?.message || 'Unable to load knowledge items. Please run the table SQL first.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchItems();
    };
    load();
  }, []);

  const uploadToR2 = async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await authFetch('/api/admin/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok || !data.success || !data.url) {
      throw new Error(data.error || `Upload failed for ${file.name}`);
    }
    return {
      name: file.name,
      url: data.url,
      type: getFileType(file.name, file.type),
      size: file.size,
      mime_type: file.type
    };
  };

  const extractWithAI = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('notes', form.tagsInput);
    const res = await authFetch('/api/admin/knowledge-extract', { method: 'POST', body: formData });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'AI extraction failed');
    }
    return data;
  };

  const handleMainFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setProcessingMain(true);
    try {
      const [uploaded, extracted] = await Promise.all([
        uploadToR2(file),
        extractWithAI(file)
      ]);
      setMainFile(uploaded);
      setForm(prev => ({
        ...prev,
        title: extracted.title || prev.title || file.name,
        category: extracted.category || prev.category,
        summary: extracted.summary || prev.summary,
        answer_text: extracted.answer_text || prev.answer_text,
        extracted_text: extracted.extracted_text || prev.extracted_text,
        tagsInput: Array.isArray(extracted.tags) ? extracted.tags.join(', ') : prev.tagsInput
      }));
    } catch (err: any) {
      console.error('Main file processing failed:', err);
      setError(err?.message || 'File processing failed. You can fill details manually.');
      try {
        const uploaded = await uploadToR2(file);
        setMainFile(uploaded);
        setForm(prev => ({ ...prev, title: prev.title || file.name }));
      } catch (uploadErr: any) {
        setError(uploadErr?.message || 'Upload failed.');
      }
    } finally {
      setProcessingMain(false);
      event.target.value = '';
    }
  };

  const handleAttachments = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    setUploadingAttachments(true);
    setError('');
    try {
      const uploaded: UploadedFile[] = [];
      for (const file of files) {
        uploaded.push(await uploadToR2(file));
      }
      setAttachments(prev => [...prev, ...uploaded]);
    } catch (err: any) {
      console.error('Attachment upload failed:', err);
      setError(err?.message || 'Attachment upload failed.');
    } finally {
      setUploadingAttachments(false);
      event.target.value = '';
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError('Title is required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category.trim() || 'General',
        summary: form.summary.trim(),
        answer_text: form.answer_text.trim(),
        extracted_text: form.extracted_text.trim(),
        tags,
        source_type: mainFile?.type || 'manual',
        main_file: mainFile,
        attachments,
        search_text: buildSearchText(form, mainFile, attachments),
        is_active: true
      };
      await adminService.addKnowledgeItem(payload);
      setForm(initialForm);
      setMainFile(null);
      setAttachments([]);
      await fetchItems();
    } catch (err: any) {
      console.error('Failed to save knowledge item:', err);
      setError(err?.message || 'Save failed. Please check Supabase table.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this knowledge item?')) return;
    try {
      await adminService.deleteKnowledgeItem(id);
      await fetchItems();
    } catch (err: any) {
      setError(err?.message || 'Delete failed.');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Add Information</h2>
          <p className="text-sm text-zinc-500 mt-1">Upload a notice, image, PDF, document, sheet, PPT, or video and convert it into chatbot knowledge.</p>
        </div>
        <div className="text-[10px] text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          AI Extraction + R2
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-sm rounded-2xl p-4">
          {error}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-6">
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Main file for AI analysis</label>
              <label className="min-h-40 border border-dashed border-zinc-700 hover:border-blue-500 bg-black/50 rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors p-6 text-center">
                {processingMain ? <Loader2 className="w-8 h-8 animate-spin text-blue-400" /> : <Brain className="w-8 h-8 text-blue-400" />}
                <div>
                  <div className="text-sm font-bold text-white">{processingMain ? 'Uploading and analyzing...' : 'Upload Image / PDF / Doc / Excel / PPT'}</div>
                  <div className="text-xs text-zinc-500 mt-1">AI will extract title, summary, answer text, tags, and details.</div>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleMainFile}
                  disabled={processingMain}
                  accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv,.ppt,.pptx"
                />
              </label>
            </div>

            {mainFile && (
              <div className="flex items-center justify-between gap-3 p-3 bg-black/60 border border-zinc-800 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  {getFileIcon(mainFile.type)}
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{mainFile.name}</div>
                    <a href={mainFile.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-400 hover:text-blue-300 uppercase font-black tracking-wider">Open main file</a>
                  </div>
                </div>
                <button onClick={() => setMainFile(null)} className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Extra attachments</label>
              <label className="flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3 px-5 rounded-xl cursor-pointer border border-zinc-700 transition-colors">
                {uploadingAttachments ? <Loader2 className="w-5 h-5 animate-spin text-emerald-400" /> : <Upload className="w-5 h-5" />}
                <span>{uploadingAttachments ? 'Uploading...' : 'Attach Files'}</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleAttachments}
                  disabled={uploadingAttachments}
                  accept=".png,.jpg,.jpeg,.gif,.webp,.pdf,.doc,.docx,.txt,.rtf,.xls,.xlsx,.csv,.ppt,.pptx,.mp4,.webm,.mov"
                />
              </label>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto no-scrollbar">
                {attachments.map((file, index) => (
                  <div key={`${file.url}-${index}`} className="flex items-center justify-between gap-3 p-3 bg-black/50 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0">
                      {getFileIcon(file.type)}
                      <span className="text-xs text-zinc-300 truncate">{file.name}</span>
                    </div>
                    <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))} className="p-1 text-zinc-500 hover:text-red-400">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Title</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none" placeholder="e.g. Admission notice 2026-27" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Category</label>
                <input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Summary</label>
              <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} rows={3} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none resize-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Chatbot answer text</label>
              <textarea value={form.answer_text} onChange={e => setForm({ ...form, answer_text: e.target.value })} rows={5} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none resize-none" placeholder="This short answer is used first to save tokens." />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Extracted details</label>
              <textarea value={form.extracted_text} onChange={e => setForm({ ...form, extracted_text: e.target.value })} rows={5} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none resize-none" />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Tags, comma separated</label>
              <input value={form.tagsInput} onChange={e => setForm({ ...form, tagsInput: e.target.value })} className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-sm text-white focus:border-blue-500 outline-none" placeholder="admission, form, last date" />
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || processingMain || !form.title.trim()}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Knowledge Item
        </button>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Saved Knowledge Items</h3>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 border border-zinc-800 rounded-2xl bg-zinc-900/20 text-zinc-500 italic text-sm">No knowledge items saved yet.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map(item => (
              <div key={item.id} className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{item.category || 'General'}</span>
                    </div>
                    <h4 className="font-bold text-white text-base leading-tight">{item.title}</h4>
                    <p className="text-xs text-zinc-400 mt-2 line-clamp-3">{item.summary || item.answer_text}</p>
                  </div>
                  <button onClick={() => handleDelete(item.id)} className="p-2 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-xl">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {item.main_file?.url && (
                    <a href={item.main_file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Main file
                    </a>
                  )}
                  {(item.attachments || []).map((file: UploadedFile, index: number) => (
                    <a key={`${file.url}-${index}`} href={file.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg">
                      {getFileIcon(file.type)}
                      <span className="max-w-32 truncate">{file.name}</span>
                    </a>
                  ))}
                  {item.main_file?.url && (
                    <a href={item.main_file.url} download={item.main_file.name} className="inline-flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg">
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
