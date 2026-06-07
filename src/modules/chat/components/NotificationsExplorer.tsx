'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
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
  ExternalLink,
  Calendar,
  Filter
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useStudentProfile } from '@/modules/profile/hooks/useStudentProfile';

interface Attachment {
  name: string;
  url: string;
  type: string;
}

interface AlertItem {
  id: string;
  title: string;
  description: string;
  type: string;
  target_stream: string;
  attachments: Attachment[];
  created_at: string;
}

export const NotificationsExplorer = ({ 
  onClose, 
  onHome, 
  isInline 
}: { 
  onClose?: () => void; 
  onHome?: () => void; 
  isInline?: boolean;
}) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStream, setSelectedStream] = useState('All');
  const [loading, setLoading] = useState(false);
  const { profile } = useStudentProfile();

  useEffect(() => {
    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('academic_alerts')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        if (data) {
          // Filter in-memory for active status (if column exists, it won't be false)
          const activeAlerts = data.filter((item: any) => item.is_active !== false);
          setAlerts(activeAlerts);
        }
      } catch (err) {
        console.error('Error fetching alerts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, []);

  const streams = ['All', 'Arts', 'Science', 'Commerce'];

  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           alert.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStream = selectedStream === 'All' || 
                            alert.target_stream === 'All' ||
                            alert.target_stream.toLowerCase() === selectedStream.toLowerCase();

      return matchesSearch && matchesStream;
    });
  }, [alerts, searchQuery, selectedStream]);

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <ImageIcon className="w-4 h-4 text-purple-500 dark:text-purple-400 shrink-0" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />;
      case 'doc': return <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400 shrink-0" />;
      case 'excel': return <FileSpreadsheet className="w-4 h-4 text-emerald-500 dark:text-emerald-400 shrink-0" />;
      case 'ppt': return <Presentation className="w-4 h-4 text-orange-500 dark:text-orange-400 shrink-0" />;
      default: return <File className="w-4 h-4 text-zinc-500 dark:text-zinc-400 shrink-0" />;
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <div className="w-full h-80 flex flex-col items-center justify-center bg-zinc-950/80 rounded-[2.5rem] border border-zinc-800/50">
        <div className="relative w-12 h-12 mb-4">
          <div className="absolute inset-0 border-4 border-zinc-800 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em] animate-pulse">Syncing Broadcast Feed</div>
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
                    onClick={onClose}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 hover:text-black dark:hover:text-white hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all shadow-sm text-sm font-bold tracking-tight"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
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
                  Academic Notifications
                </h1>
              </div>
            )}

            {/* Folder breadcrumbs */}
            {selectedStream !== 'All' && (
              <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                <button onClick={() => setSelectedStream('All')} className="hover:text-emerald-500 transition-colors">Notifications</button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-zinc-900 dark:text-white font-bold truncate">{selectedStream} Stream</span>
              </div>
            )}

            {/* Search and Stream filters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 relative">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="w-5 h-5 text-zinc-400 dark:text-white/20" />
                </div>
                <input 
                  type="text"
                  placeholder="Search announcements..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 pl-12 pr-6 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-white/20 transition-all font-medium text-sm shadow-sm backdrop-blur-xl"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                  <Filter className="w-4 h-4 text-zinc-400 dark:text-white/20" />
                </div>
                <select
                  value={selectedStream}
                  onChange={(e) => setSelectedStream(e.target.value)}
                  className="w-full bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 pl-10 pr-6 text-zinc-700 dark:text-zinc-300 placeholder-zinc-500 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-zinc-300 dark:focus:ring-white/20 transition-all font-medium text-sm shadow-sm backdrop-blur-xl outline-none appearance-none"
                >
                  {streams.map(stream => (
                    <option key={stream} value={stream}>{stream === 'All' ? 'All Streams' : `${stream} Stream`}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* List layout */}
          <div className="flex-grow overflow-y-auto pr-2 scrollbar-none no-scrollbar pb-10">
            <AnimatePresence mode="popLayout">
              {filteredAlerts.length === 0 ? (
                <div className="py-20 text-center opacity-50">
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No notifications matching filters</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAlerts.map((alert, idx) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="bg-white/90 dark:bg-zinc-900/90 border border-zinc-200 dark:border-white/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-start gap-4 backdrop-blur-xl"
                    >
                      <div className={`p-3 rounded-xl shrink-0 ${alert.type === 'warning' ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-850 dark:text-zinc-100'}`}>
                        <Bell className="w-6 h-6" />
                      </div>
                      
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-space font-bold text-zinc-900 dark:text-white text-base tracking-tight leading-snug">
                            {alert.title}
                          </h3>
                          <span className="text-[9px] bg-zinc-150 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-zinc-250 dark:border-transparent shrink-0">
                            {alert.target_stream} Stream
                          </span>
                        </div>
                        
                        <p className="text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed font-normal whitespace-pre-line">
                          {alert.description}
                        </p>

                        <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-bold">
                          <Calendar className="w-3.5 h-3.5 opacity-60" />
                          <span>Published on {new Date(alert.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>

                        {/* Rendering attachments of notification */}
                        {alert.attachments && alert.attachments.length > 0 && (
                          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:text-zinc-500">Alert Attachments ({alert.attachments.length})</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {alert.attachments.map((file, fIdx) => (
                                <div 
                                  key={fIdx} 
                                  className="flex items-center justify-between p-2.5 bg-zinc-50 dark:bg-black/40 border border-zinc-200 dark:border-zinc-800/60 rounded-xl"
                                >
                                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                    {getFileIcon(file.type)}
                                    <span className="text-xs text-zinc-700 dark:text-zinc-300 truncate font-semibold">{file.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    {['pdf', 'doc', 'image'].includes(file.type) && (
                                      <a 
                                        href={file.url} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="p-1.5 text-zinc-400 hover:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                                        title="Open file"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                    <a 
                                      href={file.url} 
                                      download={file.name} 
                                      className="p-1.5 text-zinc-400 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors"
                                      title="Download file"
                                    >
                                      <Download className="w-3.5 h-3.5" />
                                    </a>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
