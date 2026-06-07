'use client';

import React, { useState, useEffect } from 'react';
import { Save, Loader2, BookOpen, History as HistoryIcon, Target, Users } from 'lucide-react';
import { adminService } from '../services/adminService';

const SECTIONS = [
  { key: 'introduction', title: 'Introduction', icon: BookOpen },
  { key: 'history', title: 'College History', icon: HistoryIcon },
  { key: 'library', title: 'Library Details', icon: BookOpen },
  { key: 'founder', title: 'Founder Details', icon: Users },
  { key: 'mission', title: 'Goal & Mission', icon: Target },
];

export const HistoryManager = () => {
  const [sections, setSections] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const loadSections = async () => {
    try {
      const data = await adminService.getSections();
      const sectionMap: any = {};
      data.forEach((s: any) => {
        sectionMap[s.key] = s.content;
      });
      setSections(sectionMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadSections();
    };
    init();
  }, []);

  const handleUpdate = async (key: string, title: string) => {
    setSaving(key);
    try {
      await adminService.updateSection(key, {
        title,
        content: sections[key] || '',
      });
      alert(`${title} Updated!`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="p-10 text-center text-zinc-500">Loading Sections...</div>;

  return (
    <div className="space-y-8">
      {SECTIONS.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.key} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
            <div className="p-6 border-b border-zinc-800 bg-zinc-800/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="text-lg font-bold text-white">{s.title}</h3>
              </div>
              <button
                onClick={() => handleUpdate(s.key, s.title)}
                disabled={saving === s.key}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-2 rounded-xl transition-all font-bold text-sm shadow-lg shadow-blue-900/20"
              >
                {saving === s.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving === s.key ? 'Saving...' : 'Save Section'}
              </button>
            </div>
            <div className="p-6">
              <textarea
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl p-4 text-zinc-300 outline-none focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm leading-relaxed"
                rows={12}
                placeholder={`Enter ${s.title} content here (supports Markdown)...`}
                value={sections[s.key] || ''}
                onChange={(e) => setSections({ ...sections, [s.key]: e.target.value })}
              />
              <div className="mt-3 text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Tip: You can use Markdown to format text, add bold, or lists.</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
