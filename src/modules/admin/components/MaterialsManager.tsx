'use client';

import React, { useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { authFetch } from '../services/authFetch';
import { 
  Plus, 
  Trash2, 
  Folder, 
  FolderOpen, 
  Upload, 
  Loader2, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Presentation, 
  File, 
  Download, 
  ExternalLink,
  CheckCircle2,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UploadedFile {
  name: string;
  url: string;
  type: string; // 'image' | 'pdf' | 'doc' | 'excel' | 'ppt' | 'other'
}

export const MaterialsManager = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [expandedFolder, setExpandedFolder] = useState<string | null>(null);

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getMaterials();
      setMaterials(data || []);
    } catch (err) {
      console.error('Error fetching materials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      await fetchMaterials();
    };
    load();
  }, []);

  const getFileType = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (!ext) return 'other';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(ext)) return 'doc';
    if (['xls', 'xlsx', 'csv', 'ods'].includes(ext)) return 'excel';
    if (['ppt', 'pptx', 'odp'].includes(ext)) return 'ppt';
    return 'other';
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5 text-purple-400" />;
      case 'pdf': return <FileText className="w-5 h-5 text-red-400" />;
      case 'doc': return <FileText className="w-5 h-5 text-blue-400" />;
      case 'excel': return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'ppt': return <Presentation className="w-5 h-5 text-orange-400" />;
      default: return <File className="w-5 h-5 text-zinc-400" />;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const newFiles: UploadedFile[] = [...uploadedFiles];

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
          newFiles.push({
            name: file.name,
            url: data.url,
            type: getFileType(file.name),
          });
        } else {
          console.error('Upload failed for file:', file.name, data.error);
        }
      } catch (err) {
        console.error('Error uploading file:', file.name, err);
      }
    }

    setUploadedFiles(newFiles);
    setIsUploading(false);
  };

  const handleRemoveUploadedFile = (index: number) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleCreateMaterial = async () => {
    if (!title.trim()) return;
    if (uploadedFiles.length === 0) {
      alert('Please upload at least one file.');
      return;
    }

    try {
      await adminService.addMaterial({
        title: title.trim(),
        files: uploadedFiles,
      });
      setTitle('');
      setUploadedFiles([]);
      fetchMaterials();
    } catch (err) {
      console.error('Failed to create material folder:', err);
    }
  };

  const handleDeleteMaterial = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this material package?')) return;
    
    try {
      await adminService.deleteMaterial(id);
      if (expandedFolder === id) setExpandedFolder(null);
      fetchMaterials();
    } catch (err) {
      console.error('Failed to delete material:', err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Study Material Manager</h2>
        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
          Cloud Storage (R2) Integration
        </div>
      </div>

      {/* Creation form */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 shadow-xl space-y-6">
        <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest">Create New Material Folder</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Folder / Topic Title</label>
            <input
              type="text"
              placeholder="e.g. B.Sc Part I - Physics Practical Notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black border border-zinc-800 rounded-xl p-3.5 text-sm text-white focus:border-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">Upload Files (Images, PDF, Word, Excel, PPT)</label>
            <div className="flex items-center gap-4">
              <label className="flex-grow md:flex-grow-0 flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold py-3.5 px-6 rounded-xl cursor-pointer border border-zinc-700 transition-colors">
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-blue-400" /> : <Upload className="w-5 h-5" />}
                <span>{isUploading ? 'Uploading to R2...' : 'Select & Upload Files'}</span>
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  accept=".png,.jpg,.jpeg,.gif,.webp,.svg,.pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx"
                />
              </label>
              {uploadedFiles.length > 0 && (
                <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/20">
                  {uploadedFiles.length} file(s) ready
                </div>
              )}
            </div>
          </div>

          {/* Uploaded files preview list */}
          {uploadedFiles.length > 0 && (
            <div className="border border-zinc-800 rounded-2xl p-4 bg-black/40 space-y-2">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Queue for Upload</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto no-scrollbar">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {getFileIcon(file.type)}
                      <span className="text-xs text-zinc-300 truncate font-medium">{file.name}</span>
                    </div>
                    <button
                      onClick={() => handleRemoveUploadedFile(idx)}
                      className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handleCreateMaterial}
          disabled={!title.trim() || uploadedFiles.length === 0 || isUploading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          Create Material Package
        </button>
      </div>

      {/* Materials List */}
      <div className="space-y-4">
        <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Active Material Packages</h3>
        
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {!isLoading && materials.length === 0 && (
          <div className="text-center py-12 border border-zinc-800 rounded-2xl bg-zinc-900/20 text-zinc-500 italic text-sm">
            No material packages created yet. Use the form above to add folders with study materials.
          </div>
        )}

        <div className="space-y-3">
          {materials.map((mat) => {
            const isExpanded = expandedFolder === mat.id;
            return (
              <div 
                key={mat.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-2xl overflow-hidden transition-all duration-300"
              >
                {/* Header / Folder representation */}
                <div
                  onClick={() => setExpandedFolder(isExpanded ? null : mat.id)}
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-zinc-900 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-blue-600/10 text-blue-400">
                      {isExpanded ? <FolderOpen className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-base">{mat.title}</h4>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {mat.files?.length || 0} file(s) • Created on {new Date(mat.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => handleDeleteMaterial(mat.id, e)}
                      className="p-2.5 text-zinc-500 hover:text-red-400 hover:bg-zinc-800 rounded-xl transition-all"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Sub-files layout */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden border-t border-zinc-800/80 bg-black/40"
                    >
                      <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-3">
                        {mat.files && mat.files.map((file: UploadedFile, fileIdx: number) => (
                          <div
                            key={fileIdx}
                            className="p-3 bg-zinc-900/80 border border-zinc-800/80 rounded-xl flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-zinc-800 shrink-0">
                                {getFileIcon(file.type)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold text-zinc-200 truncate">{file.name}</p>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">{file.type}</p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1.5 shrink-0">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                title="Open in new tab"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <a
                                href={file.url}
                                download={file.name}
                                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all"
                                title="Download file"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
