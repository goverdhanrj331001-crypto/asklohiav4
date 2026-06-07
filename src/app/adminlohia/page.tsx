'use client';

import React, { useState } from 'react';
import { AdminLayout } from '@/modules/admin/components/AdminLayout';
import { FacultyManager } from '@/modules/admin/components/FacultyManager';
import { EventsManager } from '@/modules/admin/components/EventsManager';
import { InfoManager } from '@/modules/admin/components/InfoManager';
import { HistoryManager } from '@/modules/admin/components/HistoryManager';
import { PastPrincipalsManager } from '@/modules/admin/components/PastPrincipalsManager';
import { AchievementsManager } from '@/modules/admin/components/AchievementsManager';
import { ExamManager } from '@/modules/admin/components/ExamManager';
import { GalleryManager } from '@/modules/admin/components/GalleryManager';
import { AiConfigManager } from '@/modules/admin/components/AiConfigManager';
import { AlertsManager } from '@/modules/admin/components/AlertsManager';
import AdmissionManager from '@/modules/admin/components/AdmissionManager';
import { KnowledgeBaseManager } from '@/modules/admin/components/KnowledgeBaseManager';
import { MaterialsManager } from '@/modules/admin/components/MaterialsManager';
import { KnowledgeItemsManager } from '@/modules/admin/components/KnowledgeItemsManager';
import { AdminGuard } from '@/modules/admin/components/AdminGuard';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('faculty');

  return (
    <AdminGuard>
      <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
        {activeTab === 'info' && <InfoManager />}
        {activeTab === 'faculty' && <FacultyManager />}
        {activeTab === 'admission' && <AdmissionManager />}
        {activeTab === 'events' && <EventsManager />}
        {activeTab === 'exam-system' && <ExamManager />}
        {activeTab === 'knowledge-items' && <KnowledgeItemsManager />}
        {activeTab === 'materials' && <MaterialsManager />}
        {activeTab === 'knowledge-base' && <KnowledgeBaseManager />}
        {activeTab === 'history' && <HistoryManager />}
        {activeTab === 'principals' && <PastPrincipalsManager />}
        {activeTab === 'gallery' && <GalleryManager />}
        {activeTab === 'achievements' && <AchievementsManager />}
        {activeTab === 'alerts' && <AlertsManager />}
        {activeTab === 'ai-management' && <AiConfigManager />}
      </AdminLayout>
    </AdminGuard>
  );
}
