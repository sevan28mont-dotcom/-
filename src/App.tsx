import React, { useState, useEffect } from 'react';
import { SystemData, CaseRecord, Supervisor, ScheduleItem, ThinkingNote, ReminderItem, SessionData, SupervisionRecord, ParentSessionData } from './types';
import { loadDataFromLocalStorage, saveDataToLocalStorage, saveDataToBackend, fetchBackendData } from './services/storage';
import { getCurrentUser, logoutUser, UserAccount } from './services/auth';
import { loadWorkspaceLayout, saveWorkspaceLayout, WorkspaceLayoutConfig } from './services/layout';
import { AuthPortal } from './components/AuthPortal';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { CaseManagement } from './components/CaseManagement';
import { SupervisorManagement } from './components/SupervisorManagement';
import { ScheduleManagement } from './components/ScheduleManagement';
import { ThinkingNotes } from './components/ThinkingNotes';
import { PersonalExperienceManagement } from './components/PersonalExperienceManagement';
import { TrainingManagement } from './components/TrainingManagement';
import { PrivacySecurityModal } from './components/PrivacySecurityModal';
import { ReminderModal } from './components/ReminderModal';
import { TodayScheduleOverview } from './components/TodayScheduleOverview';
import { TotalHoursOverview } from './components/TotalHoursOverview';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('longTerm');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [supervisionTypeFilter, setSupervisionTypeFilter] = useState<'all' | 'individual' | 'group'>('all');
  const [personalExperienceFilter, setPersonalExperienceFilter] = useState<'all' | 'individual' | 'group'>('all');
  const [trainingTypeFilter, setTrainingTypeFilter] = useState<'all' | 'psychodynamics' | 'longShort' | 'otherSchools' | 'ethicsCrisis'>('all');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [privacyModalTab, setPrivacyModalTab] = useState<'privacy' | 'backup' | 'clear' | 'layout'>('privacy');
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  const [workspaceLayout, setWorkspaceLayout] = useState<WorkspaceLayoutConfig>(() => loadWorkspaceLayout());

  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('已自动本地缓存');

  const [systemData, setSystemData] = useState<SystemData>(() =>
    loadDataFromLocalStorage(currentUser?.id)
  );

  // 全局深色/浅色主题模式状态 (持久化存储在 localStorage)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('psy_theme_is_dark');
      if (saved !== null) return JSON.parse(saved);
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  // 同步 HTML 根元素的 dark class 属性
  useEffect(() => {
    try {
      localStorage.setItem('psy_theme_is_dark', JSON.stringify(isDarkMode));
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {
      console.error(e);
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    const localData = loadDataFromLocalStorage(user.id);
    setSystemData(localData);

    // Attempt fetching cloud data
    fetchBackendData(user.id).then((cloudData) => {
      if (cloudData && (cloudData.records?.length > 0 || cloudData.mentors?.length > 0)) {
        setSystemData(cloudData);
      }
    });
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Auto save to LocalStorage whenever systemData or currentUser changes
  useEffect(() => {
    if (currentUser) {
      saveDataToLocalStorage(systemData, currentUser.id);
      saveDataToBackend(systemData, currentUser.id);
    }
  }, [systemData, currentUser]);

  const handleUpdateWorkspaceLayout = (newLayout: WorkspaceLayoutConfig) => {
    setWorkspaceLayout(newLayout);
    saveWorkspaceLayout(newLayout);
  };

  const handleOpenPrivacyModal = (initialTab: 'privacy' | 'backup' | 'clear' | 'layout' = 'privacy') => {
    setPrivacyModalTab(initialTab);
    setIsPrivacyModalOpen(true);
  };

  // 手动同步后台数据
  const handleManualBackendSync = async () => {
    setSyncStatus('syncing');
    try {
      const result = await saveDataToBackend(systemData, currentUser?.id || 'default');
      if (result.success) {
        setSyncStatus('success');
        setLastSyncTime(`账号全量云端同步成功 ${result.timestamp}`);
        setTimeout(() => setSyncStatus('idle'), 3000);
      }
    } catch {
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // 导出 JSON 备份
  const handleExportData = () => {
    const jsonString = JSON.stringify(systemData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `心理咨询督导数据备份_${dateStr}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 从 JSON 备份导入
  const handleImportDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const rawContent = event.target?.result as string;
        const parsed = JSON.parse(rawContent);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.records)) {
          if (window.confirm('确定导入此数据备份吗？这将覆盖当前保存的全部记录。')) {
            setSystemData(parsed as SystemData);
            alert('数据恢复导入成功！');
          }
        } else {
          alert('数据格式不合法，请使用正确的 JSON 备份文件！');
        }
      } catch (err) {
        alert('解析文件失败，文件可能损坏。');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Handlers for systemData mutations
  const handleAddCase = (newRecordInput: Omit<CaseRecord, 'id' | 'sessions'> & Partial<CaseRecord>) => {
    const fullRecord: CaseRecord = {
      id: `case_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessions: {},
      pinned: false,
      ...newRecordInput,
    };
    setSystemData((prev) => ({
      ...prev,
      records: [fullRecord, ...(prev.records || [])],
    }));
  };

  const handleDeleteCase = (id: string) => {
    setSystemData((prev) => ({
      ...prev,
      records: (prev.records || []).filter((r) => r.id !== id),
      // 解绑导师关联
      mentors: (prev.mentors || []).map((m) => ({
        ...m,
        boundCaseIds: (m.boundCaseIds || []).filter((cid) => cid !== id),
        records: (m.records || []).filter((r) => r.caseId !== id),
      })),
    }));
  };

  const handleUpdateSessionNote = (
    caseId: string,
    sessionNum: number,
    sessionData: Partial<SessionData>
  ) => {
    setSystemData((prev) => ({
      ...prev,
      records: (prev.records || []).map((r) => {
        if (r.id !== caseId) return r;
        const currentSessions = r.sessions || {};
        const currentSession = currentSessions[sessionNum] || {};
        const updatedSession: SessionData = {
          ...currentSession,
          ...sessionData,
        };
        return {
          ...r,
          sessions: {
            ...currentSessions,
            [sessionNum]: updatedSession,
          },
        };
      }),
    }));
  };

  const handleUpdateParentSessionNote = (
    caseId: string,
    parentSessionNum: number,
    parentSessionData: Partial<ParentSessionData> | null
  ) => {
    setSystemData((prev) => ({
      ...prev,
      records: (prev.records || []).map((r) => {
        if (r.id !== caseId) return r;
        const currentParentSessions = { ...(r.parentSessions || {}) };
        if (parentSessionData === null) {
          if (parentSessionNum === -1) {
            // 清空全部
            return {
              ...r,
              parentSessions: {},
            };
          }
          Object.keys(currentParentSessions).forEach((k) => {
            if (Number(k) === Number(parentSessionNum) || k === String(parentSessionNum)) {
              delete currentParentSessions[k];
            }
          });
        } else {
          const currentParentSession = currentParentSessions[parentSessionNum] || { completed: true, note: '' };
          currentParentSessions[parentSessionNum] = {
            ...currentParentSession,
            ...parentSessionData,
          };
        }
        return {
          ...r,
          parentSessions: currentParentSessions,
        };
      }),
    }));
  };

  const handleUpdateTotalHoursOverrides = (newOverrides: {
    caseHours?: number;
    supervisionHours?: number;
    personalExperienceHours?: number;
  }) => {
    setSystemData((prev) => ({
      ...prev,
      totalHoursOverrides: newOverrides,
    }));
  };

  const handleBatchUpdateSessions = (
    caseId: string,
    sessionUpdates: { sessionNum: number; sessionData: Partial<SessionData> }[]
  ) => {
    setSystemData((prev) => ({
      ...prev,
      records: (prev.records || []).map((r) => {
        if (r.id !== caseId) return r;
        const currentSessions = { ...(r.sessions || {}) };
        sessionUpdates.forEach(({ sessionNum, sessionData }) => {
          const current = currentSessions[sessionNum] || {};
          currentSessions[sessionNum] = {
            ...current,
            ...sessionData,
          };
        });
        return {
          ...r,
          sessions: currentSessions,
        };
      }),
    }));
  };

  const handleBatchUpdateCases = (
    caseUpdates: { id: string; status?: 'active' | 'ended'; totalSessions?: number }[]
  ) => {
    const updateMap = new Map(caseUpdates.map((u) => [u.id, u]));
    setSystemData((prev) => ({
      ...prev,
      records: (prev.records || []).map((r) => {
        const update = updateMap.get(r.id);
        if (!update) return r;
        return {
          ...r,
          ...(update.status ? { status: update.status, endDate: update.status === 'ended' ? new Date().toISOString().split('T')[0] : r.endDate } : {}),
          ...(update.totalSessions !== undefined ? { totalSessions: update.totalSessions } : {}),
        };
      }),
    }));
  };

  const handleBatchDeleteCases = (ids: string[]) => {
    const idSet = new Set(ids);
    setSystemData((prev) => ({
      ...prev,
      records: (prev.records || []).filter((r) => !idSet.has(r.id)),
      mentors: (prev.mentors || []).map((m) => ({
        ...m,
        boundCaseIds: (m.boundCaseIds || []).filter((cid) => !idSet.has(cid)),
        records: (m.records || []).filter((r) => !idSet.has(r.caseId)),
      })),
    }));
  };

  const handleUpdateCaseTotalSessions = (caseId: string, newTotal: number) => {
    setSystemData((prev) => ({
      ...prev,
      records: (prev.records || []).map((r) => (r.id === caseId ? { ...r, totalSessions: newTotal } : r)),
    }));
  };

  const handleAddMentor = (newMentorInput: Omit<Supervisor, 'id' | 'records' | 'boundCaseIds'> & Partial<Supervisor>) => {
    const fullMentor: Supervisor = {
      id: `mentor_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      records: [],
      boundCaseIds: [],
      ...newMentorInput,
    };
    setSystemData((prev) => ({
      ...prev,
      mentors: [fullMentor, ...(prev.mentors || [])],
    }));
  };

  const handleDeleteMentor = (id: string) => {
    setSystemData((prev) => ({
      ...prev,
      mentors: (prev.mentors || []).filter((m) => m.id !== id),
    }));
  };

  const handleUpdateMentorCaseBinding = (mentorId: string, boundCaseIds: string[]) => {
    setSystemData((prev) => ({
      ...prev,
      mentors: (prev.mentors || []).map((m) => (m.id === mentorId ? { ...m, boundCaseIds } : m)),
    }));
  };

  const handleUpdateMentorTotalSupervisions = (mentorId: string, newTotal: number) => {
    setSystemData((prev) => ({
      ...prev,
      mentors: (prev.mentors || []).map((m) => (m.id === mentorId ? { ...m, totalSupervisions: newTotal } : m)),
    }));
  };

  const handleAddSupervisionRecord = (mentorId: string, recordInput: Omit<SupervisionRecord, 'id'> & Partial<SupervisionRecord>) => {
    const fullRecord: SupervisionRecord = {
      id: `sup_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      caseId: '',
      sessionNum: 1,
      date: new Date().toISOString().split('T')[0],
      timeRange: '14:00-15:00',
      type: 'individual',
      reflection: '',
      ...recordInput,
    };
    setSystemData((prev) => ({
      ...prev,
      mentors: (prev.mentors || []).map((m) => {
        if (m.id !== mentorId) return m;
        return {
          ...m,
          records: [fullRecord, ...(m.records || [])],
        };
      }),
    }));
  };

  const handleDeleteSupervisionRecord = (mentorId: string, recordId: string) => {
    setSystemData((prev) => ({
      ...prev,
      mentors: prev.mentors.map((m) => {
        if (m.id !== mentorId) return m;
        return {
          ...m,
          records: m.records.filter((r) => r.id !== recordId),
        };
      }),
    }));
  };

  const handleUpdateSupervisionRecord = (
    mentorId: string,
    recordId: string,
    updated: Partial<SupervisionRecord>
  ) => {
    setSystemData((prev) => ({
      ...prev,
      mentors: prev.mentors.map((m) => {
        if (m.id !== mentorId) return m;
        return {
          ...m,
          records: m.records.map((r) => (r.id === recordId ? { ...r, ...updated } : r)),
        };
      }),
    }));
  };

  const handleAddThinkingNote = (newNote: ThinkingNote) => {
    setSystemData((prev) => ({
      ...prev,
      thinking: [newNote, ...prev.thinking],
    }));
  };

  const handleUpdateThinkingNote = (updatedNote: ThinkingNote) => {
    setSystemData((prev) => ({
      ...prev,
      thinking: prev.thinking.map((t) => (t.id === updatedNote.id ? updatedNote : t)),
    }));
  };

  const handleDeleteThinkingNote = (id: string) => {
    setSystemData((prev) => ({
      ...prev,
      thinking: prev.thinking.filter((t) => t.id !== id),
    }));
  };

  const handleTogglePinCase = (id: string) => {
    setSystemData((prev) => ({
      ...prev,
      records: prev.records.map((r) => (r.id === id ? { ...r, pinned: !r.pinned } : r)),
    }));
  };

  const handleAddSchedule = (newItemData: Omit<ScheduleItem, 'id'> | ScheduleItem) => {
    const newItem: ScheduleItem = {
      ...newItemData,
      id: ('id' in newItemData && newItemData.id) ? newItemData.id : `sch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setSystemData((prev) => ({
      ...prev,
      schedules: [newItem, ...(prev.schedules || [])],
    }));
  };

  const handleUpdateSchedule = (idOrItem: string | ScheduleItem, updatedData?: Omit<ScheduleItem, 'id'>) => {
    let targetId: string = '';
    let patchObj: Partial<ScheduleItem> = {};

    if (typeof idOrItem === 'string') {
      targetId = idOrItem;
      patchObj = updatedData || {};
    } else if (idOrItem && typeof idOrItem === 'object') {
      targetId = idOrItem.id || '';
      patchObj = idOrItem;
    }

    if (!targetId) return;

    setSystemData((prev) => ({
      ...prev,
      schedules: (prev.schedules || []).map((s) => {
        if (!s || typeof s !== 'object') return s;
        if (s.id === targetId) {
          return { ...s, ...patchObj, id: targetId };
        }
        return s;
      }),
    }));
  };

  const handleDeleteSchedule = (id: string) => {
    if (!id) return;
    setSystemData((prev) => ({
      ...prev,
      schedules: (prev.schedules || []).filter((s) => s && typeof s === 'object' && s.id && s.id !== id),
    }));
  };

  const handleReorderSchedules = (newSchedules: ScheduleItem[]) => {
    setSystemData((prev) => ({
      ...prev,
      schedules: newSchedules,
    }));
  };

  const handleToggleScheduleComplete = (id: string) => {
    setSystemData((prev) => ({
      ...prev,
      schedules: (prev.schedules || []).map((s) =>
        s.id === id ? { ...s, completed: !s.completed } : s
      ),
    }));
  };

  const handleAddReminder = (reminder: Omit<ReminderItem, 'id' | 'createdAt'>) => {
    const newRem: ReminderItem = {
      ...reminder,
      id: `rem_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setSystemData((prev) => ({
      ...prev,
      reminders: [newRem, ...(prev.reminders || [])],
    }));
  };

  const handleToggleReminder = (id: string) => {
    setSystemData((prev) => ({
      ...prev,
      reminders: (prev.reminders || []).map((r) =>
        r.id === id ? { ...r, completed: !r.completed } : r
      ),
    }));
  };

  const handleDeleteReminder = (id: string) => {
    setSystemData((prev) => ({
      ...prev,
      reminders: (prev.reminders || []).filter((r) => r.id !== id),
    }));
  };

  if (!currentUser) {
    return <AuthPortal onLoginSuccess={handleLoginSuccess} isDarkMode={isDarkMode} onToggleTheme={toggleDarkMode} />;
  }

  return (
    <div className={`flex flex-col h-screen w-screen transition-colors duration-300 ${
      isDarkMode
        ? 'bg-slate-950 text-slate-100 dark'
        : 'bg-[#fce4ec] text-[#212121]'
    } overflow-hidden font-sans`}>
      {/* 顶部 Header */}
      <Header
        systemData={systemData}
        currentUser={currentUser}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleDarkMode}
        onLogout={handleLogout}
        onAddReminder={handleAddReminder}
        onToggleReminder={handleToggleReminder}
        onDeleteReminder={handleDeleteReminder}
        onOpenReminderModal={() => setIsReminderModalOpen(true)}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* 主界面 (左侧精美侧边栏 + 右侧主内容区) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 左侧侧边栏 (集成数据控制、导入导出、提醒中心、隐私说明、后台同步、自定义工作区布局) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          supervisionTypeFilter={supervisionTypeFilter}
          onSelectSupervisionFilter={setSupervisionTypeFilter}
          personalExperienceFilter={personalExperienceFilter}
          onSelectPersonalExperienceFilter={setPersonalExperienceFilter}
          trainingTypeFilter={trainingTypeFilter}
          onSelectTrainingFilter={setTrainingTypeFilter}
          systemData={systemData}
          onOpenPrivacyModal={handleOpenPrivacyModal}
          onOpenReminderModal={() => setIsReminderModalOpen(true)}
          onExportData={handleExportData}
          onImportDataChange={handleImportDataChange}
          onManualSync={handleManualBackendSync}
          syncStatus={syncStatus}
          lastSyncTime={lastSyncTime}
          layoutConfig={workspaceLayout}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* 主内容展示区 */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-rose-50/40 dark:bg-slate-900/60 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            {/* 顶置：个案总时数、督导总时数、个人体验总时数统计板 */}
            <TotalHoursOverview
              systemData={systemData}
              onUpdateTotalHoursOverrides={handleUpdateTotalHoursOverrides}
            />

            {/* 今日日程概览（精美紧凑顶置，方便在主界面自动筛选并快速查看所有安排好的咨询/督导任务） */}
            <TodayScheduleOverview
              schedules={systemData.schedules || []}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onToggleComplete={handleToggleScheduleComplete}
            />

            {(activeTab === 'longTerm' || activeTab === 'longTermActive') && (
              <CaseManagement
                category="longTerm"
                statusFilter="active"
                records={systemData.records}
                mentors={systemData.mentors}
                thinkingNotes={systemData.thinking}
                totalHoursOverrides={systemData.totalHoursOverrides}
                onUpdateTotalHoursOverrides={handleUpdateTotalHoursOverrides}
                onAddCase={handleAddCase}
                onDeleteCase={handleDeleteCase}
                onUpdateSessionNote={handleUpdateSessionNote}
                onUpdateParentSessionNote={handleUpdateParentSessionNote}
                onBatchUpdateSessions={handleBatchUpdateSessions}
                onBatchUpdateCases={handleBatchUpdateCases}
                onBatchDeleteCases={handleBatchDeleteCases}
                onUpdateCaseTotalSessions={handleUpdateCaseTotalSessions}
                onSaveToThinkingNotes={handleAddThinkingNote}
                onTogglePinCase={handleTogglePinCase}
              />
            )}

            {activeTab === 'longTermEnded' && (
              <CaseManagement
                category="longTerm"
                statusFilter="ended"
                records={systemData.records}
                mentors={systemData.mentors}
                thinkingNotes={systemData.thinking}
                totalHoursOverrides={systemData.totalHoursOverrides}
                onUpdateTotalHoursOverrides={handleUpdateTotalHoursOverrides}
                onAddCase={handleAddCase}
                onDeleteCase={handleDeleteCase}
                onUpdateSessionNote={handleUpdateSessionNote}
                onUpdateParentSessionNote={handleUpdateParentSessionNote}
                onBatchUpdateSessions={handleBatchUpdateSessions}
                onBatchUpdateCases={handleBatchUpdateCases}
                onBatchDeleteCases={handleBatchDeleteCases}
                onUpdateCaseTotalSessions={handleUpdateCaseTotalSessions}
                onSaveToThinkingNotes={handleAddThinkingNote}
                onTogglePinCase={handleTogglePinCase}
              />
            )}

            {(activeTab === 'shortTerm' || activeTab === 'shortTermPersonal' || activeTab === 'shortTermAgency') && (
              <CaseManagement
                category="shortTerm"
                shortTermSubtypeFilter={activeTab === 'shortTermPersonal' ? 'personal' : activeTab === 'shortTermAgency' ? 'agency' : 'all'}
                records={systemData.records}
                mentors={systemData.mentors}
                thinkingNotes={systemData.thinking}
                totalHoursOverrides={systemData.totalHoursOverrides}
                onUpdateTotalHoursOverrides={handleUpdateTotalHoursOverrides}
                onAddCase={handleAddCase}
                onDeleteCase={handleDeleteCase}
                onUpdateSessionNote={handleUpdateSessionNote}
                onUpdateParentSessionNote={handleUpdateParentSessionNote}
                onBatchUpdateSessions={handleBatchUpdateSessions}
                onBatchUpdateCases={handleBatchUpdateCases}
                onBatchDeleteCases={handleBatchDeleteCases}
                onUpdateCaseTotalSessions={handleUpdateCaseTotalSessions}
                onSaveToThinkingNotes={handleAddThinkingNote}
                onTogglePinCase={handleTogglePinCase}
              />
            )}

            {activeTab === 'mentor' && (
              <SupervisorManagement
                mentors={systemData.mentors}
                cases={systemData.records}
                totalHoursOverrides={systemData.totalHoursOverrides}
                onUpdateTotalHoursOverrides={handleUpdateTotalHoursOverrides}
                onAddMentor={handleAddMentor}
                onDeleteMentor={handleDeleteMentor}
                onUpdateMentorCaseBinding={handleUpdateMentorCaseBinding}
                onUpdateMentorTotalSupervisions={handleUpdateMentorTotalSupervisions}
                onAddSupervisionRecord={handleAddSupervisionRecord}
                onDeleteSupervisionRecord={handleDeleteSupervisionRecord}
                onUpdateSupervisionRecord={handleUpdateSupervisionRecord}
                supervisionTypeFilter={supervisionTypeFilter}
                onTypeFilterChange={setSupervisionTypeFilter}
              />
            )}

            {activeTab === 'personalExperience' && (
              <PersonalExperienceManagement
                experienceData={systemData.personalExperience}
                totalHoursOverrides={systemData.totalHoursOverrides}
                onUpdateTotalHoursOverrides={handleUpdateTotalHoursOverrides}
                onUpdateExperienceData={(updated) =>
                  setSystemData((prev) => ({
                    ...prev,
                    personalExperience: updated,
                  }))
                }
                experienceTypeFilter={personalExperienceFilter}
                onTypeFilterChange={setPersonalExperienceFilter}
              />
            )}

            {(activeTab === 'training' || activeTab === 'trainingPsychodynamics' || activeTab === 'trainingLongShort' || activeTab === 'trainingOtherSchools' || activeTab === 'trainingEthicsCrisis') && (
              <TrainingManagement
                trainings={systemData.trainings || []}
                onUpdateTrainings={(updatedTrainings) =>
                  setSystemData((prev) => ({
                    ...prev,
                    trainings: updatedTrainings,
                  }))
                }
                trainingTypeFilter={trainingTypeFilter}
                onTypeFilterChange={setTrainingTypeFilter}
                activeTab={activeTab}
              />
            )}

            {activeTab === 'thinking' && (
              <ThinkingNotes
                notes={systemData.thinking}
                onAddNote={handleAddThinkingNote}
                onUpdateNote={handleUpdateThinkingNote}
                onDeleteNote={handleDeleteThinkingNote}
              />
            )}

            {activeTab === 'schedule' && (
              <ScheduleManagement
                schedules={systemData.schedules}
                cases={systemData.records}
                mentors={systemData.mentors}
                onAddSchedule={handleAddSchedule}
                onUpdateSchedule={handleUpdateSchedule}
                onDeleteSchedule={handleDeleteSchedule}
                onReorderSchedules={handleReorderSchedules}
              />
            )}
          </div>
        </main>
      </div>

      {/* 提醒事项中心 Modal */}
      <ReminderModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        systemData={systemData}
        onAddReminder={handleAddReminder}
        onToggleReminder={handleToggleReminder}
        onDeleteReminder={handleDeleteReminder}
      />

      {/* 数据隐私说明与自定义布局 Modal */}
      <PrivacySecurityModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        systemData={systemData}
        userId={currentUser?.id}
        onImportData={(importedData) => setSystemData(importedData)}
        onResetToDefault={() => setSystemData(loadDataFromLocalStorage(currentUser?.id))}
        layoutConfig={workspaceLayout}
        onUpdateLayoutConfig={handleUpdateWorkspaceLayout}
        initialTab={privacyModalTab}
      />
    </div>
  );
}
