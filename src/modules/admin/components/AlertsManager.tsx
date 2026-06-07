'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '../services/authFetch';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Bell, 
  Upload, 
  Loader2, 
  X, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Presentation, 
  File, 
  Download, 
  ExternalLink 
} from 'lucide-react';

interface Attachment {
  name: string;
  url: string;
  type: string;
}

export const AlertsManager = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [newAlert, setNewAlert] = useState<{
    title: string;
    description: string;
    type: string;
    target_stream: string;
    attachments: Attachment[];
  }>({ 
    title: '', 
    description: '', 
    type: 'info', 
    target_stream: 'All', 
    attachments: [] 
  });

  const fetchAlerts = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('academic_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    setAlerts(data || []);
    setIsLoading(false);
  };

  useEffect(() => {
    const loadData = async () => {
      await fetchAlerts();
    };
    loadData();
  }, []);

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return 'other';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx', 'txt'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'excel';
    if (['ppt', 'pptx'].includes(ext)) return 'ppt';
    return 'other';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4 text-purple-400" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-400" />;
      case 'doc': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'excel': return <FileSpreadsheet className="w-4 h-4 text-emerald-400" />;
      case 'ppt': return <Presentation className="w-4 h-4 text-orange-400" />;
      default: return <File className="w-4 h-4 text-zinc-400" />;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newAttachments: Attachment[] = [...newAlert.attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append('file', file);

      try {
        const res = await authFetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        
        if (data.success && data.url) {
          newAttachments.push({
            name: file.name,
            url: data.url,
            type: getFileType(file.name),
          });
        }
      } catch (err) {
        console.error('Attachment upload failed for:', file.name, err);
      }
    }

    setNewAlert(prev => ({ ...prev, attachments: newAttachments }));
    setIsUploading(false);
  };

  const handleRemoveAttachment = (index: number) => {
    setNewAlert(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleAdd = async () => {
    if (!newAlert.title || !newAlert.description) return;
    
    // We send attachments array directly to DB as JSONB
    const { error } = await supabase.from('academic_alerts').insert([newAlert]);
    if (!error) {
      setNewAlert({ title: '', description: '', type: 'info', target_stream: 'All', attachments: [] });
      fetchAlerts();
    } else {
      console.error('Failed to save alert:', error);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('academic_alerts').delete().eq('id', id);
    fetchAlerts();
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Academic Alerts Manager</h2>
        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
          Live System Control
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-black text-emerald-400 uppercase tracking-widest">Create New Alert</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            placeholder="Alert Title"
            value={newAlert.title}
            onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
            className="bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none text-white"
          />
          <select
            value={newAlert.target_stream}
            onChange={(e) => setNewAlert({ ...newAlert, target_stream: e.target.value })}
            className="bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none text-zinc-400"
          >
            <option value="All">All Streams</option>
            <option value="Arts">Arts</option>
            <option value="Science">Science</option>
            <option value="Commerce">Commerce</option>
          </select>
          <textarea
            placeholder="Alert Description"
            value={newAlert.description}
            onChange={(e) => setNewAlert({ ...newAlert, description: e.target.value })}
            className="md:col-span-2 bg-black border border-zinc-800 rounded-xl p-3 text-sm focus:border-emerald-500 outline-none h-24 text-white"
          />

          {/* Attachment Upload Field */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-2.5 px-4 rounded-xl cursor-pointer border border-zinc-700 transition-colors text-xs">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Upload className="w-4 h-4" />}
                <span>{isUploading ? 'Uploading to R2...' : 'Attach Files'}</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
                />
              </label>
              {newAlert.attachments.length > 0 && (
                <span className="text-xs font-bold text-zinc-400">{newAlert.attachments.length} file(s) attached</span>
              )}
            </div>

            {/* Attached files queue */}
            {newAlert.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-black/40 border border-zinc-850 rounded-xl">
                {newAlert.attachments.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg max-w-xs">
                    {getFileIcon(file.type)}
                    <span className="text-[11px] text-zinc-300 truncate max-w-[120px] font-medium">{file.name}</span>
                    <button
                      onClick={() => handleRemoveAttachment(idx)}
                      className="p-0.5 text-zinc-500 hover:text-red-400 rounded transition-colors ml-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!newAlert.title || !newAlert.description || isUploading}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Broadcast Alert
        </button>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-zinc-900/50 border border-zinc-800 p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 group"
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className={`p-3 rounded-xl shrink-0 ${alert.type === 'warning' ? 'bg-orange-500/10 text-orange-400' : 'bg-emerald-600/10 text-emerald-400'}`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-base truncate">{alert.title}</span>
                      <span className="text-[8px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded font-black uppercase tracking-widest shrink-0">{alert.target_stream}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{alert.description}</p>
                    
                    {/* Render attachments on alert card */}
                    {alert.attachments && alert.attachments.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {alert.attachments.map((file: Attachment, fIdx: number) => (
                          <div key={fIdx} className="flex items-center gap-2 px-2 py-1 bg-black/40 border border-zinc-800/80 rounded-lg text-[11px] text-zinc-400">
                            {getFileIcon(file.type)}
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <div className="flex items-center gap-1 border-l border-zinc-800 pl-1.5 ml-1">
                              <a href={file.url} target="_blank" rel="noopener noreferrer" className="hover:text-white" title="Open attachment">
                                <ExternalLink className="w-3 h-3" />
                              </a>
                              <a href={file.url} download={file.name} className="hover:text-white" title="Download attachment">
                                <Download className="w-3 h-3" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end shrink-0">
                  <button
                    onClick={() => handleDelete(alert.id)}
                    className="p-2 text-zinc-600 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-all md:opacity-0 md:group-hover:opacity-100"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};
