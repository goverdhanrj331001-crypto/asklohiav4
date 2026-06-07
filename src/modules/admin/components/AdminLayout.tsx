import React from 'react';
import { Users, Calendar, Settings, Sparkles, BookOpen, GraduationCap, Trophy, Info, FileText, Bell, Image as ImageIcon, LogOut, HelpCircle, Folder, Brain } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AdminLayout = ({ children, activeTab, setActiveTab }: AdminLayoutProps) => {
  const menuItems = [
    { id: 'faculty', label: 'Faculty', icon: Users },
    { id: 'admission', label: 'Admission & Courses', icon: BookOpen },
    { id: 'events', label: 'General Events', icon: Calendar },
    { id: 'exam-system', label: 'Exam System', icon: FileText },
    { id: 'knowledge-items', label: 'Add Information', icon: Brain },
    { id: 'materials', label: 'Study Materials', icon: Folder },
    { id: 'knowledge-base', label: 'Knowledge Base (FAQ)', icon: HelpCircle },
    { id: 'history', label: 'History & About', icon: BookOpen },
    { id: 'principals', label: 'Past Principals', icon: GraduationCap },
    { id: 'gallery', label: 'College Gallery', icon: ImageIcon },
    { id: 'achievements', label: 'Achievements', icon: Trophy },
    { id: 'info', label: 'Principal Desk', icon: Info },
    { id: 'alerts', label: 'Notifications', icon: Bell },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-zinc-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Lohia Admin</span>
        </div>
        
        <nav className="flex-grow p-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' 
                : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-blue-400' : ''}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-zinc-800 space-y-2">
          <button 
            onClick={() => setActiveTab('ai-management')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'ai-management' 
              ? 'bg-zinc-800 text-white shadow-lg border border-zinc-700' 
              : 'text-zinc-500 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <Settings className={`w-5 h-5 ${activeTab === 'ai-management' ? 'text-blue-400' : ''}`} />
            <span className="font-medium">AI Settings</span>
          </button>

          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-red-500 hover:bg-red-500/10"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-8 overflow-y-auto">
        <header className="mb-12 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">
              {menuItems.find(i => i.id === activeTab)?.label || 'Dashboard'}
            </h1>
            <p className="text-zinc-500">Manage Lohia College information and resources.</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold">A</div>
          </div>
        </header>

        <div className="max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
};
