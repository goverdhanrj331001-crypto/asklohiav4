import React from 'react';
import { useTheme } from 'next-themes';
import { 
  Menu, 
  UserCircle, 
  Bell, 
  Grid, 
  X, 
  BookOpen, 
  Users, 
  Calendar, 
  Library, 
  Sun, 
  Moon, 
  Trophy, 
  Folder, 
  FileText, 
  Download, 
  ExternalLink,
  Image as ImageIcon,
  FileSpreadsheet,
  Presentation,
  File
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

import { useStudentProfile } from '@/modules/profile/hooks/useStudentProfile';
import { ProfileCard } from '@/modules/profile/components/ProfileCard';
import { ProfileForm } from '@/modules/profile/components/ProfileForm';
import { supabase } from '@/lib/supabase';

export const ThemeToggle = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <div className="w-8 h-8 shrink-0" />;
  }

  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === 'dark';

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors shrink-0 flex items-center justify-center"
      aria-label="Toggle theme"
    >
      {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
};

interface ChatHeaderProps {
  onMenuAction?: (label: string) => void;
}

export const ChatHeader = ({ onMenuAction }: ChatHeaderProps = {}) => {
  const { profile, updateProfile, clearProfile } = useStudentProfile();
  const [showProfile, setShowProfile] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [alerts, setAlerts] = React.useState<any[]>([]);

  React.useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const { data, error } = await supabase.from('academic_alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20);
        if (error) throw error;
        if (data) {
          // Filter in-memory for active status (if column exists, it won't be false)
          const activeAlerts = data.filter((item: any) => item.is_active !== false);
          setAlerts(activeAlerts.slice(0, 5));
        }
      } catch (err) {
        console.error('Error fetching header alerts:', err);
      }
    };
    fetchAlerts();
  }, [profile]);

  return (
    <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-zinc-950 text-black dark:text-white sticky top-0 z-[60] border-b border-zinc-200 dark:border-zinc-800 relative transition-colors duration-300">
      <div className="flex items-center gap-4 relative">
        <button 
          onClick={() => setShowMenu(!showMenu)}
          className={`lg:hidden p-2.5 rounded-xl transition-all active:scale-95 z-[70] relative ${showMenu ? 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}
        >
          {showMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        <AnimatePresence>
          {showMenu && (
            <>
              {/* Overlay for dismissing menu */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowMenu(false)}
                className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[65]"
              />
              {/* Dropdown Menu */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="lg:hidden absolute top-14 left-0 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-3 shadow-2xl z-[70] overflow-hidden flex flex-col gap-1"
              >
                {[
                  { icon: BookOpen, label: 'Exams' },
                  { icon: Folder, label: 'Materials' },
                  { icon: Users, label: 'Faculty' },
                  { icon: Calendar, label: 'Events' },
                  { icon: Library, label: 'Gallery' },
                  { icon: Trophy, label: 'Toppers' },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setShowMenu(false);
                      if (onMenuAction) onMenuAction(item.label);
                    }}
                    className="flex items-center gap-4 w-full p-3 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-2xl transition-all group text-left"
                  >
                    <div className="w-10 h-10 bg-white dark:bg-zinc-800 rounded-xl flex items-center justify-center border border-zinc-200 dark:border-zinc-700/30 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-700 transition-colors shrink-0">
                      <item.icon className="w-5 h-5 text-zinc-500 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
                    </div>
                    <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors tracking-wide">{item.label}</span>
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <div className="lg:hidden flex items-center gap-2 group cursor-pointer" onClick={() => onMenuAction && onMenuAction('chat')}>
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden border-2 border-white group-hover:scale-110 transition-transform shadow-md relative">
            <Image 
              src="/lohia-logo.webp" 
              alt="Lohia College Logo" 
              fill
              sizes="32px"
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-black text-xl tracking-tighter uppercase hidden sm:inline-block">Lohia College AI</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Notifications Alert - ALWAYS VISIBLE (Triggers full screen view) */}
        <button 
          onClick={() => onMenuAction && onMenuAction('Notifications')}
          className="p-2.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all relative group"
          aria-label="View notifications"
        >
          <Bell className="w-6 h-6 text-zinc-500 dark:text-zinc-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400" />
          {alerts.length > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-zinc-950 animate-pulse"></span>
          )}
        </button>

        {/* Profile Control */}
        <div className="relative">
          <button 
            onClick={() => setShowProfile(!showProfile)}
            className={`flex items-center gap-2 p-1.5 pr-3 rounded-full transition-all border ${
              profile ? 'bg-zinc-900 border-emerald-500/30' : 'bg-transparent border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-750'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              profile ? 'bg-emerald-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
            }`}>
              {profile ? profile.name?.[0] : <UserCircle className="w-5 h-5" />}
            </div>
            {profile && <span className="text-xs font-black uppercase tracking-tight hidden md:inline-block">{profile.name}</span>}
          </button>

          <AnimatePresence>
            {showProfile && (
              <div className="absolute right-0 mt-3 w-64 z-[70]">
                {profile ? (
                  <ProfileCard 
                    profile={profile} 
                    onClear={() => { clearProfile(); setShowProfile(false); }} 
                    onEdit={() => { setIsFormOpen(true); setShowProfile(false); }}
                  />
                ) : (
                  <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-4 text-center shadow-2xl backdrop-blur-xl">
                    <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-2">No Profile Found</div>
                    <p className="text-[11px] text-zinc-400 italic mb-4">Complete your profile to get personalized academic help.</p>
                    <button 
                      onClick={() => { setIsFormOpen(true); setShowProfile(false); }}
                      className="w-full bg-white text-zinc-950 font-black uppercase tracking-wider py-2.5 rounded-xl text-[10px] font-space hover:bg-zinc-200 transition-colors cursor-pointer"
                    >
                      Setup Profile Now
                    </button>
                  </div>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Global Profile Form Modal */}
        <AnimatePresence>
          {isFormOpen && (
            <div className="fixed inset-0 z-[100] bg-black">
              <ProfileForm 
                initialData={profile}
                onSave={(data) => {
                  updateProfile(data);
                  setIsFormOpen(false);
                }}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
};
