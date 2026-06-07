'use client';

import React, { useState } from 'react';
import { ChatHeader, ThemeToggle } from './ChatHeader';
import { ChatHero } from './ChatHero';
import { ChatInput } from './ChatInput';
import { ChatMessages } from './ChatMessages';
import { useLohiaCollegeChat } from '../hooks/lohiacollegechat';
import { PredictiveActions } from './PredictiveActions';
import { useStudentProfile } from '@/modules/profile/hooks/useStudentProfile';
import { ProfileCard } from '@/modules/profile/components/ProfileCard';
import { ProfileForm } from '@/modules/profile/components/ProfileForm';
import { FacultyExplorer } from './FacultyExplorer';
import { GalleryExplorer } from './GalleryExplorer';
import { EventExplorer } from './EventExplorer';
import { ExamExplorer } from './ExamExplorer';
import { ToppersExplorer } from './ToppersExplorer';
import { MaterialsExplorer } from './MaterialsExplorer';
import { NotificationsExplorer } from './NotificationsExplorer';
import { LiveConversationModal } from './LiveConversationModal';
import { BookOpen, Users, Calendar, Library, Trophy, MessageSquarePlus, MessageSquare, Sun, Moon, Bell, UserCircle, Settings, X, Folder, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';
import { AnimatePresence, motion } from 'motion/react';

const DesktopSidebar = ({ activeView, onAction, onProfileOpen }: { activeView: string, onAction: (l: string) => void, onProfileOpen: () => void }) => {
  const navItems = [
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'exams', label: 'Exams', icon: BookOpen },
    { id: 'materials', label: 'Materials', icon: Folder },
    { id: 'faculty', label: 'Faculty', icon: Users },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'gallery', label: 'Gallery', icon: Library },
    { id: 'toppers', label: 'Toppers', icon: Trophy },
  ];
  const { profile, clearProfile } = useStudentProfile();
  const [showProfile, setShowProfile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className={`hidden lg:flex flex-col ${isCollapsed ? 'w-[80px]' : 'w-[260px]'} bg-[#f9f9f9] dark:bg-[#171717] h-screen sticky top-0 shrink-0 select-none text-black dark:text-white border-r border-[#e5e5e5] dark:border-transparent transition-all duration-300 z-50`}>
      <div className={`p-3 flex flex-col h-full ${isCollapsed ? 'items-center' : ''}`}>
        {/* Logo and New Chat */}
        <div className={`flex items-center ${isCollapsed ? 'justify-center flex-col gap-4' : 'justify-between'} px-2 py-2 mb-2`}>
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => onAction('chat')}>
            <div className="shrink-0 flex items-center justify-center">
              <Image
                src="/lohia-logo.webp"
                alt="Lohia College"
                width={24}
                height={24}
                className="object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            {!isCollapsed && <span className="font-semibold text-base tracking-tight text-black dark:text-white">Lohia AI</span>}
          </div>
          <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1.5 hover:bg-black/5 dark:hover:bg-[#2f2f2f] rounded-lg text-zinc-500 hover:text-black dark:hover:text-white transition-colors">
            {isCollapsed ? <Menu className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        <button
          onClick={() => onAction('chat')}
          className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-3 px-3'} w-full py-2.5 mb-4 bg-transparent hover:bg-black/5 dark:hover:bg-[#2f2f2f] text-black dark:text-white rounded-lg transition-colors font-medium text-sm`}
          title="New Chat"
        >
          <div className="w-6 h-6 flex items-center justify-center">
            <MessageSquarePlus className="w-4 h-4" />
          </div>
          {!isCollapsed && "New Chat"}
        </button>

        <div className={`flex-1 overflow-y-auto overflow-x-hidden ${isCollapsed ? 'no-scrollbar' : ''}`}>
          {!isCollapsed && <div className="text-xs text-zinc-500 dark:text-zinc-400 font-semibold mb-2 px-3 pt-2">Explorers</div>}
          <div className="space-y-1 w-full">
            {navItems.map(item => (
              <button
                key={item.id}
                title={item.label}
                onClick={() => onAction(item.label === 'Chat' ? 'chat' : item.label)}
                className={`flex items-center ${isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'gap-3 w-full px-3 py-2'} rounded-lg transition-colors text-sm font-medium text-left ${activeView === item.id
                  ? 'bg-black/10 dark:bg-[#2f2f2f] text-black dark:text-white'
                  : 'text-zinc-600 dark:text-zinc-300 hover:bg-black/5 dark:hover:bg-[#2f2f2f]/50 hover:text-black dark:hover:text-white'
                  }`}
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4" />
                </div>
                {!isCollapsed && item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Section: Profile & Theme */}
        <div className={`mt-auto pt-4 border-t border-black/10 dark:border-[#2f2f2f] flex flex-col gap-1 ${isCollapsed ? 'items-center' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'justify-center w-12 h-12' : 'gap-2 px-2 pb-2'}`}>
            <ThemeToggle />
            {!isCollapsed && <span className="text-sm font-medium text-zinc-600 dark:text-zinc-300">Theme</span>}
          </div>

          <div className="relative w-full">
            <button
              onClick={() => setShowProfile(!showProfile)}
              title={profile ? profile.name : 'Setup Profile'}
              className={`flex items-center ${isCollapsed ? 'justify-center w-12 h-12 mx-auto' : 'gap-3 w-full p-2'} hover:bg-black/5 dark:hover:bg-[#2f2f2f] rounded-lg transition-colors text-left`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-xs ${profile ? 'bg-blue-600 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                }`}>
                {profile ? profile.name?.[0] : <UserCircle className="w-5 h-5" />}
              </div>
              {!isCollapsed && <span className="text-sm font-medium text-black dark:text-white line-clamp-1">{profile ? profile.name : 'Setup Profile'}</span>}
            </button>

            <AnimatePresence>
              {showProfile && (
                <div className={`absolute bottom-full ${isCollapsed ? 'left-full ml-4' : 'left-0 ml-2'} mb-2 w-64 z-[70]`}>
                  {profile ? (
                    <ProfileCard
                      profile={profile}
                      onClear={() => { clearProfile(); setShowProfile(false); }}
                      onEdit={() => { onProfileOpen(); setShowProfile(false); }}
                    />
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4 text-center shadow-xl">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">No Profile Found</div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Complete your profile to get personalized academic help.</p>
                      <button
                        onClick={() => { onProfileOpen(); setShowProfile(false); }}
                        className="w-full bg-black dark:bg-white text-white dark:text-black hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors font-bold py-2 rounded-lg text-xs font-space uppercase tracking-wider cursor-pointer"
                      >
                        Setup Profile
                      </button>
                    </div>
                  )}
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ChatInterface = () => {
  const { messages, isLoading, sendMessage, stopMessage, clearChat } = useLohiaCollegeChat();
  const { profile, updateProfile } = useStudentProfile();
  const [activeView, setActiveView] = useState<'chat' | 'faculty' | 'gallery' | 'events' | 'exams' | 'toppers' | 'profile' | 'materials' | 'notifications'>('chat');
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  const handleHeroAction = (label: string) => {
    if (label === 'Faculty') {
      setActiveView('faculty');
    } else if (label === 'Gallery') {
      setActiveView('gallery');
    } else if (label === 'Events') {
      setActiveView('events');
    } else if (label === 'Exams') {
      setActiveView('exams');
    } else if (label === 'Toppers') {
      setActiveView('toppers');
    } else if (label === 'Materials') {
      setActiveView('materials');
    } else if (label === 'Notifications') {
      setActiveView('notifications');
    } else if (label === 'profile') {
      setActiveView('profile');
    } else if (label === 'chat') {
      clearChat();
      setActiveView('chat');
    } else {
      sendMessage(label);
    }
  };

  const handleClose = () => {
    setActiveView('chat');
  };

  const handleHome = () => {
    clearChat();
    setActiveView('chat');
  };

  const isFormActive = messages.length > 0 &&
    messages[messages.length - 1].role === 'model' &&
    !!(messages[messages.length - 1].content?.includes('[[EXAM_FORM') ||
      messages[messages.length - 1].content?.includes('[[RESOURCE_FORM'));

  return (
    <div
      suppressHydrationWarning
      className="flex flex-col min-h-screen text-black dark:text-[#ececec] selection:bg-zinc-200 dark:selection:bg-zinc-700 transition-colors duration-300 relative bg-zinc-50 dark:bg-[#121212] app-background"
    >
      {/* Background Overlay */}
      <div
        suppressHydrationWarning
        className="absolute inset-0 bg-white/20 dark:bg-black/50 pointer-events-none transition-colors duration-300 z-0"
      />

      {/* Main Content Wrapper */}
      <div className="relative z-10 flex min-h-screen w-full">
        <DesktopSidebar
          activeView={activeView}
          onAction={handleHeroAction}
          onProfileOpen={() => setActiveView('profile')}
        />

        <div className="flex-1 flex flex-col min-h-screen min-w-0">
          <ChatHeader onMenuAction={handleHeroAction} />

          <main className="flex-grow relative flex flex-col min-h-0 overflow-hidden">
            <div className={`flex-grow overflow-x-hidden relative pb-32 ${activeView === 'chat' ? 'overflow-y-auto' : 'flex flex-col overflow-hidden'}`}>
              {activeView === 'faculty' ? (
                <div className="max-w-2xl mx-auto w-full px-4 pt-4 flex flex-col h-full min-h-0">
                  <FacultyExplorer onClose={handleClose} onHome={handleHome} />
                </div>
              ) : activeView === 'gallery' ? (
                <div className="max-w-2xl mx-auto w-full px-4 pt-4 flex flex-col h-full min-h-0">
                  <GalleryExplorer onClose={handleClose} onHome={handleHome} />
                </div>
              ) : activeView === 'events' ? (
                <div className="max-w-2xl mx-auto w-full px-4 pt-4 flex flex-col h-full min-h-0">
                  <EventExplorer onClose={handleClose} onHome={handleHome} />
                </div>
              ) : activeView === 'exams' ? (
                <div className="max-w-3xl mx-auto w-full px-4 pt-4 flex flex-col h-full min-h-0">
                  <ExamExplorer onClose={handleClose} onHome={handleHome} />
                </div>
              ) : activeView === 'materials' ? (
                <div className="max-w-3xl mx-auto w-full px-4 pt-4 flex flex-col h-full min-h-0">
                  <MaterialsExplorer onClose={handleClose} onHome={handleHome} />
                </div>
              ) : activeView === 'notifications' ? (
                <div className="max-w-3xl mx-auto w-full px-4 pt-4 flex flex-col h-full min-h-0">
                  <NotificationsExplorer onClose={handleClose} onHome={handleHome} />
                </div>
              ) : activeView === 'toppers' ? (
                <div className="max-w-3xl mx-auto w-full px-4 pt-4 flex flex-col h-full min-h-0">
                  <ToppersExplorer onClose={handleClose} onHome={handleHome} />
                </div>
              ) : activeView === 'profile' ? (
                <div className="absolute inset-0 w-full h-full overflow-y-auto bg-white dark:bg-[#171717] z-30">
                  <ProfileForm
                    initialData={profile}
                    onSave={(data) => {
                      updateProfile(data);
                      setActiveView('chat');
                    }}
                    onCancel={() => setActiveView('chat')}
                  />
                </div>
              ) : messages.length === 0 ? (
                <ChatHero onAction={handleHeroAction} />
              ) : (
                <ChatMessages messages={messages} isLoading={isLoading} onButtonClick={sendMessage} />
              )}
            </div>

            {activeView !== 'profile' && (
              <div className="fixed bottom-0 left-0 right-0 lg:left-[260px] z-50 flex flex-col items-center pointer-events-none transition-all duration-300 pb-6 px-4">
                <div className="max-w-3xl mx-auto w-full pointer-events-auto">
                  <ChatInput
                    onSend={(text) => {
                      setActiveView('chat');
                      sendMessage(text);
                    }}
                    isLoading={isLoading || isFormActive}
                    onLiveClick={() => setIsLiveModalOpen(true)}
                    onStop={stopMessage}
                  />
                </div>
              </div>
            )}

            {isFormActive && (
              <div className="absolute bottom-[160px] left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm text-[11px] text-zinc-600 dark:text-white/70 font-black uppercase tracking-[0.15em] bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-zinc-200 dark:border-white/10 shadow-2xl text-center z-50 font-space transition-colors">
                Please complete the selection form above to proceed
              </div>
            )}
          </main>

          <LiveConversationModal
            isOpen={isLiveModalOpen}
            onClose={() => setIsLiveModalOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};
