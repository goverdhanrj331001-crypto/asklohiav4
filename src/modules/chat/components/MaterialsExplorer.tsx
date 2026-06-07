'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';
import { 
  Folder, 
  FolderOpen, 
  ArrowLeft, 
  Search, 
  ChevronRight, 
  Home, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Presentation, 
  File, 
  Download, 
  ExternalLink 
} from 'lucide-react';
import { getMaterialsChat } from '../services/collegeDataService';

interface Attachment {
  name: string;
  url: string;
  type: string; // 'image' | 'pdf' | 'doc' | 'excel' | 'ppt' | 'other'
}

interface MaterialItem {
  id: string;
  title: string;
  files: Attachment[];
  created_at: string;
}

export const MaterialsExplorer = ({ 
  onClose, 
  onHome, 
  isInline 
}: { 
  onClose?: () => void; 
  onHome?: () => void; 
  isInline?: boolean;
}) => {
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<MaterialItem | null>(null);

  useEffect(() => {
    const loadInit = async () => {
      setLoading(true);
      try {
        const data = await getMaterialsChat();
        setMaterials(data || []);
      } catch (err) {
        console.error('Error loading materials:', err);
      } finally {
        setLoading(false);
      }
    };
    loadInit();
  }, []);

  const filteredMaterials = useMemo(() => {
    return materials.filter(item => 
      item.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [materials, searchQuery]);

  const handleFolderClick = (item: MaterialItem) => {
    setSelectedMaterial(item);
  };

  const handleBackToFolders = () => {
    setSelectedMaterial(null);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />;
      case 'pdf': return <FileText className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />;
      case 'doc': return <FileText className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />;
      case 'excel': return <FileSpreadsheet className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />;
      case 'ppt': return <Presentation className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />;
      default: return <File className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />;
    }
  };

  if (loading && materials.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center bg-zinc-950/80 rounded-[2.5rem] border border-zinc-800/50">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] animate-pulse">Accessing Cloud Drive</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full bg-transparent overflow-hidden relative flex flex-col">
      <div className="p-0 md:p-4 flex flex-col h-full">
        <div className="flex flex-col h-full space-y-6">
          <div className="flex-shrink-0 space-y-6">
            {!isInline && (
              <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={selectedMaterial ? handleBackToFolders : onClose}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {selectedMaterial ? 'Back to Folders' : 'Back'}
                  </button>
                  {onHome && (
                    <button 
                      onClick={onHome}
                      className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                    >
                      <Home className="w-4 h-4" />
                      Home
                    </button>
                  )}
                </div>
                <h1 className="font-space text-lg sm:text-xl md:text-2xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight leading-tight pt-1 md:pt-0">
                  {selectedMaterial ? selectedMaterial.title : 'Study Materials'}
                </h1>
              </div>
            )}

            {/* Folder breadcrumbs */}
            {selectedMaterial && (
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <button onClick={handleBackToFolders} className="hover:text-emerald-500 transition-colors">Study Materials</button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-zinc-900 dark:text-white font-bold truncate max-w-[200px]">{selectedMaterial.title}</span>
              </div>
            )}

            {/* Search, only if NOT showing folder content */}
            {!selectedMaterial && (
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-zinc-400 dark:text-white/20" />
                </div>
                <input 
                  type="text"
                  placeholder="Search folders or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-6 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-white/20 transition-all font-medium text-sm shadow-sm backdrop-blur-xl"
                />
              </div>
            )}
          </div>

          <div className="flex-grow overflow-y-auto pr-2 scrollbar-none no-scrollbar pb-10">
            <AnimatePresence mode="wait">
              {selectedMaterial ? (
                <motion.div 
                  key="folder-files-view"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-6"
                >
                  {/* File section with different views for images vs other files */}
                  {(!selectedMaterial.files || selectedMaterial.files.length === 0) ? (
                    <div className="py-20 text-center opacity-50">
                      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">This folder is empty</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedMaterial.files.map((file, fileIdx) => {
                        const isDocOrPdf = ['pdf', 'doc'].includes(file.type);
                        const isImage = file.type === 'image';

                        return (
                          <motion.div
                            key={fileIdx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: fileIdx * 0.04 }}
                            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4 flex flex-col justify-between transition-all shadow-sm hover:shadow-md"
                          >
                            <div className="flex items-start gap-4">
                              {/* Left icon or Image Preview */}
                              {isImage ? (
                                <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800 bg-zinc-150 dark:bg-zinc-800 relative group/img select-none">
                                  <Image
                                    src={file.url}
                                    alt={file.name}
                                    fill
                                    className="object-cover transition-transform duration-300 group-hover/img:scale-105"
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 shrink-0 select-none">
                                  {getFileIcon(file.type)}
                                </div>
                              )}

                              {/* Text Details */}
                              <div className="min-w-0 flex-1">
                                <h3 className="font-space font-bold text-zinc-900 dark:text-white text-sm line-clamp-2 tracking-tight">
                                  {file.name}
                                </h3>
                                <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mt-1">
                                  {file.type} Format
                                </p>
                              </div>
                            </div>

                            {/* Actions footer */}
                            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end gap-2">
                              {isDocOrPdf ? (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>View in New Tab</span>
                                </a>
                              ) : isImage ? (
                                <a
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                  <span>View Fullscreen</span>
                                </a>
                              ) : null}
                              
                              <a
                                href={file.url}
                                download={file.name}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all border border-zinc-200/50 dark:border-transparent"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                              </a>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="folders-list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {filteredMaterials.length === 0 ? (
                    <div className="py-20 text-center opacity-50">
                      <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No study materials found</p>
                    </div>
                  ) : (
                    filteredMaterials.map((item, idx) => (
                        <motion.button
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                        onClick={() => handleFolderClick(item)}
                        className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800/80 rounded-2xl p-4.5 flex items-center gap-4 cursor-pointer group shadow-sm hover:shadow-md transition-all text-left"
                      >
                        {/* Folder Representation */}
                        <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 shrink-0 group-hover:scale-105 transition-transform duration-300">
                          <Folder className="w-7 h-7" />
                        </div>
                        <div className="flex-grow min-w-0">
                          <h3 className="font-space font-bold text-zinc-900 dark:text-white text-base truncate tracking-tight mb-1">
                            {item.title}
                          </h3>
                          <div className="text-zinc-500 dark:text-zinc-400 text-xs font-semibold flex items-center gap-2">
                             <span>{item.files?.length || 0} Files</span>
                             <span className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></span>
                             <span>Published on {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-400 dark:text-zinc-500 transition-colors" />
                      </motion.button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
