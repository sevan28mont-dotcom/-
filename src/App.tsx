import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SystemData, CaseRecord, Supervisor, ScheduleItem, ThinkingNote, ReminderItem, SessionData, SupervisionRecord, ParentSessionData, CounselorCredential } from './types';
import { loadDataFromLocalStorage, saveDataToLocalStorage, saveDataToBackend, fetchBackendData, getDefaultSampleSystemData, integrityCheck, deepCleanExpiredCaches } from './services/storage';
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
import { CredentialManagement } from './components/CredentialManagement';
import { PrivacySecurityModal } from './components/PrivacySecurityModal';
import { ReminderModal } from './components/ReminderModal';
import { SyncCenterModal } from './components/SyncCenterModal';
import { TodayScheduleOverview } from './components/TodayScheduleOverview';
import { TotalHoursOverview } from './components/TotalHoursOverview';
import { ErrorBoundary } from './components/ErrorBoundary';

export type DeviceType = 'mobile' | 'pad' | 'desktop';
export type OrientationType = 'portrait' | 'landscape';

export interface DeviceOrientationState {
  deviceType: DeviceType;
  orientation: OrientationType;
  screenWidth: number;
  screenHeight: number;
  isTouchDevice: boolean;
  isPad: boolean;
  isMobile: boolean;
  isDesktop: boolean;
}

/**
 * detectDeviceOrientation 自定义 Hook
 * 动态检测 Pad / 手机 / PC 端屏幕宽度与横竖屏方向
 */
export function detectDeviceOrientation(): DeviceOrientationState {
  const [deviceState, setDeviceState] = useState<DeviceOrientationState>(() => {
    if (typeof window === 'undefined') {
      return {
        deviceType: 'desktop',
        orientation: 'landscape',
        screenWidth: 1024,
        screenHeight: 768,
        isTouchDevice: false,
        isPad: false,
        isMobile: false,
        isDesktop: true,
      };
    }

    const w = window.innerWidth;
    const h = window.innerHeight;
    const deviceType: DeviceType = w < 768 ? 'mobile' : w < 1024 ? 'pad' : 'desktop';
    const orientation: OrientationType = h > w ? 'portrait' : 'landscape';
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return {
      deviceType,
      orientation,
      screenWidth: w,
      screenHeight: h,
      isTouchDevice,
      isPad: deviceType === 'pad',
      isMobile: deviceType === 'mobile',
      isDesktop: deviceType === 'desktop',
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const deviceType: DeviceType = w < 768 ? 'mobile' : w < 1024 ? 'pad' : 'desktop';
      const orientation: OrientationType = h > w ? 'portrait' : 'landscape';
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

      setDeviceState({
        deviceType,
        orientation,
        screenWidth: w,
        screenHeight: h,
        isTouchDevice,
        isPad: deviceType === 'pad',
        isMobile: deviceType === 'mobile',
        isDesktop: deviceType === 'desktop',
      });
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return deviceState;
}

export const useDeviceOrientation = detectDeviceOrientation;

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => getCurrentUser());
  const [activeTab, setActiveTab] = useState<ActiveTab>('longTerm');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 动态屏幕设备与方向检测
  const deviceInfo = detectDeviceOrientation();

  // 针对 Pad 和 手机端的屏幕差异，屏幕宽度或方向变化时动态调整 Sidebar 的展开与收起行为
  useEffect(() => {
    if (deviceInfo.screenWidth < 1024) {
      setIsMobileMenuOpen(false);
    }
  }, [deviceInfo.deviceType, deviceInfo.orientation, deviceInfo.screenWidth]);
  const [supervisionTypeFilter, setSupervisionTypeFilter] = useState<'all' | 'individual' | 'group'>('all');
  const [personalExperienceFilter, setPersonalExperienceFilter] = useState<'all' | 'individual' | 'group'>('all');
  const [trainingTypeFilter, setTrainingTypeFilter] = useState<'all' | 'psychodynamics' | 'longShort' | 'otherSchools' | 'ethicsCrisis'>('all');
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [privacyModalTab, setPrivacyModalTab] = useState<'privacy' | 'backup' | 'clear' | 'layout'>('privacy');
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [isSyncCenterModalOpen, setIsSyncCenterModalOpen] = useState(false);
  const [hasConflict, setHasConflict] = useState(false);
  const [cloudSnapshotData, setCloudSnapshotData] = useState<SystemData | null>(null);

  const [workspaceLayout, setWorkspaceLayout] = useState<WorkspaceLayoutConfig>(() => loadWorkspaceLayout());

  const [forceRefreshKey, setForceRefreshKey] = useState<number>(Date.now());
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<string>('已自动本地缓存');

  const [systemData, setRawSystemData] = useState<SystemData>(() =>
    integrityCheck(loadDataFromLocalStorage(currentUser?.id))
  );

  // 自定义 setSystemData，确保本地变更时自动打上递增版本号 stamp (versioning)
  const setSystemData = useCallback((updater: SystemData | ((prev: SystemData) => SystemData), isFromCloud = false) => {
    if (isFromCloud) {
      setRawSystemData(updater as SystemData);
    } else {
      hasUserMutatedInSessionRef.current = true;
      setRawSystemData((prev) => {
        const nextState = typeof updater === 'function' ? updater(prev) : updater;
        const newVersion = Math.max((prev.versioning || 0) + 1, Date.now());
        return {
          ...nextState,
          versioning: newVersion,
        };
      });
    }
  }, []);

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

  // 初始化流程：自动执行“深度清理”，扫描并清除 localStorage 中超过 30 天未访问或过期的临时 UI 缓存，维持轻量运行
  useEffect(() => {
    try {
      const res = deepCleanExpiredCaches();
      if (res.cleanedKeys.length > 0) {
        console.log(`[App Init] Auto deep-cleaned ${res.cleanedKeys.length} stale localStorage cache items.`);
      }
    } catch (err) {
      console.warn('[App Init] Deep clean routine encountered a minor issue:', err);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  const [isCloudSyncDone, setIsCloudSyncDone] = useState<boolean>(false);
  const hasUserMutatedInSessionRef = useRef<boolean>(false);
  const deleteDebounceRef = useRef<Record<string, number>>({});

  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsCloudSyncDone(false);
    hasUserMutatedInSessionRef.current = false;
    const localData = loadDataFromLocalStorage(user.id);
    setSystemData(localData, true);
    setForceRefreshKey(localData.versioning || Date.now());
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setIsCloudSyncDone(false);
    hasUserMutatedInSessionRef.current = false;
    const sampleData = getDefaultSampleSystemData();
    setSystemData(sampleData, true);
    setForceRefreshKey(Date.now());
  };

  // Sync cloud data when user logs in or mounts
  useEffect(() => {
    if (!currentUser?.id) {
      setIsCloudSyncDone(false);
      return;
    }

    let isMounted = true;
    setIsCloudSyncDone(false);

    fetchBackendData(currentUser.id).then((cloudData) => {
      if (!isMounted) return;
      if (cloudData) {
        // Priority to cloud data on login / mount if user hasn't mutated state in this session
        if (!hasUserMutatedInSessionRef.current) {
          setSystemData(cloudData, true);
          saveDataToLocalStorage(cloudData, currentUser.id);
          setForceRefreshKey(cloudData.versioning || Date.now());
          setSyncStatus('success');
          setLastSyncTime(`☁️ 跨设备云端数据已全量对齐 (v${cloudData.versioning || '1'})`);
          setTimeout(() => setSyncStatus('idle'), 3000);
        }
      } else {
        // If user has no data on backend yet, upload current local state once
        saveDataToBackend(systemData, currentUser.id).then((res) => {
          if (res.success) {
            setLastSyncTime(`☁️ 初次数据云端建档 ${res.timestamp}`);
          }
        });
      }
      setIsCloudSyncDone(true);
    });

    return () => {
      isMounted = false;
    };
  }, [currentUser?.id]);

  // Periodic polling & window focus listener for multi-device sync (PC / Phone / Pad / IE / Safari)
  useEffect(() => {
    if (!currentUser?.id || !isCloudSyncDone) return;

    const syncFromCloud = async () => {
      try {
        const cloudData = await fetchBackendData(currentUser.id);
        if (cloudData) {
          const localVersion = systemData.versioning || 0;
          const cloudVersion = cloudData.versioning || 0;
          const currentStr = JSON.stringify(systemData);
          const cloudStr = JSON.stringify(cloudData);

          // 核心控制：当本地与云端存在数据内容差异，且当前终端未处于正在编辑输入的状态时，强行重绘对齐
          if (currentStr !== cloudStr) {
            if (cloudVersion >= localVersion || !hasUserMutatedInSessionRef.current) {
              console.log(`[Version Sync] Aligning newer cloud data: local=v${localVersion}, cloud=v${cloudVersion}`);
              setSystemData(cloudData, true);
              saveDataToLocalStorage(cloudData, currentUser.id);
              
              // 强制触发 UI 刷新机制与重绘
              setForceRefreshKey(cloudVersion || Date.now());

              setSyncStatus('success');
              setLastSyncTime(`☁️ 已接收 4 端最新节点自动重绘 (v${cloudVersion || 'latest'})`);
              setTimeout(() => setSyncStatus('idle'), 3000);
            }
          }
        }
      } catch (err) {
        console.warn('Background sync check warning:', err);
      }
    };

    // Poll every 3 seconds for immediate updates from other devices (PC / Phone / Pad / IE)
    const intervalId = setInterval(syncFromCloud, 3000);

    // Refresh immediately when switching tabs, focusing window, coming back online, or localStorage storage event
    const handleFocus = () => syncFromCloud();
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('online', handleFocus);
    window.addEventListener('storage', handleFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('online', handleFocus);
      window.removeEventListener('storage', handleFocus);
    };
  }, [currentUser?.id, isCloudSyncDone, systemData]);

  // Auto save to LocalStorage & Backend ONLY when systemData is mutated by user on THIS device
  useEffect(() => {
    saveDataToLocalStorage(systemData, currentUser?.id);
    if (currentUser?.id && isCloudSyncDone && hasUserMutatedInSessionRef.current) {
      setSyncStatus('syncing');
      saveDataToBackend(systemData, currentUser.id).then((res) => {
        if (res.success) {
          hasUserMutatedInSessionRef.current = false;
          setSyncStatus('success');
          setLastSyncTime(`☁️ 变动已实时推送云端 (v${systemData.versioning || ''} ${res.timestamp})`);
          setTimeout(() => setSyncStatus('idle'), 3000);
        } else {
          setSyncStatus('error');
          setTimeout(() => setSyncStatus('idle'), 3000);
        }
      });
    }
  }, [systemData, currentUser?.id, isCloudSyncDone]);

  const handleUpdateWorkspaceLayout = (newLayout: WorkspaceLayoutConfig) => {
    setWorkspaceLayout(newLayout);
    saveWorkspaceLayout(newLayout);
  };

  const handleOpenPrivacyModal = (initialTab: 'privacy' | 'backup' | 'clear' | 'layout' = 'privacy') => {
    setPrivacyModalTab(initialTab);
    setIsPrivacyModalOpen(true);
  };

  // 手动调出“数据冲突检测与同步控制台”
  const handleManualBackendSync = async () => {
    if (!currentUser?.id) return;
    setSyncStatus('syncing');
    try {
      const cloudData = await fetchBackendData(currentUser.id);
      setCloudSnapshotData(cloudData);
      const localVersion = systemData.versioning || 0;
      const cloudVersion = cloudData?.versioning || 0;
      const currentStr = JSON.stringify(systemData);
      const cloudStr = JSON.stringify(cloudData || {});

      // 判定是否存在版本号冲突或端间字段不一致
      if (cloudData && (cloudVersion !== localVersion || (currentStr !== cloudStr && hasUserMutatedInSessionRef.current))) {
        setHasConflict(true);
      }

      setIsSyncCenterModalOpen(true);
      setSyncStatus('idle');
    } catch (err) {
      console.error('Manual sync error:', err);
      setSyncStatus('error');
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // 冲突解决 - 保留本地版本并全端同步
  const handleKeepLocal = async () => {
    if (!currentUser?.id) return;
    const localVer = systemData.versioning || 0;
    const cloudVer = cloudSnapshotData?.versioning || 0;
    const nextVersion = Math.max(localVer, cloudVer) + 1;
    const updated = { ...systemData, versioning: nextVersion };

    hasUserMutatedInSessionRef.current = false;
    setSystemData(updated, true);
    saveDataToLocalStorage(updated, currentUser.id);
    setForceRefreshKey(nextVersion);
    setHasConflict(false);
    setIsSyncCenterModalOpen(false);

    setSyncStatus('syncing');
    const res = await saveDataToBackend(updated, currentUser.id);
    if (res.success) {
      setSyncStatus('success');
      setLastSyncTime(`☁️ 已保留本地版本并强行云端对齐 (v${nextVersion})`);
      setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  // 冲突解决 - 强制使用云端覆盖本地
  const handleUseCloud = async () => {
    if (!currentUser?.id || !cloudSnapshotData) return;
    hasUserMutatedInSessionRef.current = false;
    setSystemData(cloudSnapshotData, true);
    saveDataToLocalStorage(cloudSnapshotData, currentUser.id);
    setForceRefreshKey(cloudSnapshotData.versioning || Date.now());
    setHasConflict(false);
    setIsSyncCenterModalOpen(false);
    setSyncStatus('success');
    setLastSyncTime(`☁️ 强制使用云端覆盖本地成功 (v${cloudSnapshotData.versioning || 'latest'})`);
    setTimeout(() => setSyncStatus('idle'), 3000);
  };

  // 冲突解决 - 智能无损双向合并
  const handleMergeBoth = async () => {
    if (!currentUser?.id || !cloudSnapshotData) return;
    const mergeById = <T extends { id: string }>(arr1: T[] = [], arr2: T[] = []): T[] => {
      const map = new Map<string, T>();
      arr1.forEach((item) => item && item.id && map.set(item.id, item));
      arr2.forEach((item) => {
        if (item && item.id && !map.has(item.id)) {
          map.set(item.id, item);
        }
      });
      return Array.from(map.values());
    };

    const localVer = systemData.versioning || 0;
    const cloudVer = cloudSnapshotData?.versioning || 0;
    const mergedVersion = Math.max(localVer, cloudVer) + 1;

    const mergedData: SystemData = {
      versioning: mergedVersion,
      records: mergeById(systemData.records, cloudSnapshotData.records),
      mentors: mergeById(systemData.mentors, cloudSnapshotData.mentors),
      thinking: mergeById(systemData.thinking, cloudSnapshotData.thinking),
      schedules: mergeById(systemData.schedules, cloudSnapshotData.schedules),
      reminders: mergeById(systemData.reminders, cloudSnapshotData.reminders),
      trainings: mergeById(systemData.trainings, cloudSnapshotData.trainings),
      credentials: mergeById(systemData.credentials, cloudSnapshotData.credentials),
      personalExperience: systemData.personalExperience || cloudSnapshotData.personalExperience,
      totalHoursOverrides: systemData.totalHoursOverrides || cloudSnapshotData.totalHoursOverrides,
    };

    hasUserMutatedInSessionRef.current = false;
    setSystemData(mergedData, true);
    saveDataToLocalStorage(mergedData, currentUser.id);
    setForceRefreshKey(mergedVersion);
    setHasConflict(false);
    setIsSyncCenterModalOpen(false);

    setSyncStatus('syncing');
    const res = await saveDataToBackend(mergedData, currentUser.id);
    if (res.success) {
      setSyncStatus('success');
      setLastSyncTime(`☁️ 智能无损双向合并完成 (v${mergedVersion})`);
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
    hasUserMutatedInSessionRef.current = true;
    const fullRecord: CaseRecord = {
      id: `case_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessions: {},
      pinned: false,
      ...newRecordInput,
    };
    setSystemData((prev) => ({
      ...prev,
      versioning: (prev.versioning || 1) + 1,
      records: [fullRecord, ...(prev.records || [])],
    }));
  };

  const handleUpdateCase = (caseId: string, updatedFields: Partial<CaseRecord>) => {
    hasUserMutatedInSessionRef.current = true;
    setSystemData((prev) => ({
      ...prev,
      versioning: (prev.versioning || 1) + 1,
      records: (prev.records || []).map((r) => {
        if (!r || r.id !== caseId) return r;
        return {
          ...r,
          ...updatedFields,
        };
      }),
    }));
  };

  const handleDeleteCase = useCallback((id: string) => {
    if (!id || typeof id !== 'string') return;
    const key = `case_${id}`;
    const now = Date.now();
    if (deleteDebounceRef.current[key] && now - deleteDebounceRef.current[key] < 300) return;
    deleteDebounceRef.current[key] = now;

    hasUserMutatedInSessionRef.current = true;
    setSystemData((prev) => {
      const records = prev.records || [];
      const targetExists = records.some((r) => r && r.id === id);
      if (!targetExists) return prev;

      return {
        ...prev,
        records: records.filter((r) => r && r.id !== id),
        mentors: (prev.mentors || []).map((m) => {
          if (!m) return m;
          return {
            ...m,
            boundCaseIds: (m.boundCaseIds || []).filter((cid) => cid && cid !== id),
            activeCaseId: m.activeCaseId === id ? null : m.activeCaseId,
            records: (m.records || []).filter((r) => r && r.caseId !== id),
          };
        }),
        schedules: (prev.schedules || []).filter(
          (s) => !(s && s.relatedType === 'case' && s.relatedId === id)
        ),
      };
    });
  }, []);

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
          completed: false,
          note: '',
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
    setSystemData((prev) => {
      const updatedRecords = (prev.records || []).map((r) => {
        if (r.id !== caseId) return r;
        const currentParentSessions = { ...(r.parentSessions || {}) };
        if (parentSessionData === null) {
          if (parentSessionNum === -1) {
            // 批量清空全部父母访谈记录
            return {
              ...r,
              parentSessions: {},
            };
          }
          // 直接彻底移除指定序号的父母访谈记录
          delete currentParentSessions[parentSessionNum];
          delete currentParentSessions[String(parentSessionNum)];
          delete currentParentSessions[Number(parentSessionNum)];
        } else {
          const currentParentSession = currentParentSessions[parentSessionNum] || { completed: true, note: '' };
          currentParentSessions[parentSessionNum] = {
            ...currentParentSession,
            ...parentSessionData,
          };
        }
        return {
          ...r,
          parentSessions: { ...currentParentSessions },
        };
      });

      return {
        ...prev,
        records: updatedRecords,
      };
    });
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
            completed: false,
            note: '',
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

  const handleBatchDeleteCases = useCallback((ids: string[]) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    const validIds = ids.filter((id) => id && typeof id === 'string');
    if (validIds.length === 0) return;

    const key = `batch_case_${validIds.join('_')}`;
    const now = Date.now();
    if (deleteDebounceRef.current[key] && now - deleteDebounceRef.current[key] < 300) return;
    deleteDebounceRef.current[key] = now;

    hasUserMutatedInSessionRef.current = true;
    const idSet = new Set(validIds);
    setSystemData((prev) => {
      const records = prev.records || [];
      const hasAny = records.some((r) => r && idSet.has(r.id));
      if (!hasAny) return prev;

      return {
        ...prev,
        records: records.filter((r) => r && !idSet.has(r.id)),
        mentors: (prev.mentors || []).map((m) => {
          if (!m) return m;
          return {
            ...m,
            boundCaseIds: (m.boundCaseIds || []).filter((cid) => cid && !idSet.has(cid)),
            activeCaseId: m.activeCaseId && idSet.has(m.activeCaseId) ? null : m.activeCaseId,
            records: (m.records || []).filter((r) => r && r.caseId && !idSet.has(r.caseId)),
          };
        }),
        schedules: (prev.schedules || []).filter(
          (s) => !(s && s.relatedType === 'case' && s.relatedId && idSet.has(s.relatedId))
        ),
      };
    });
  }, []);

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

  const handleDeleteMentor = useCallback((id: string) => {
    if (!id || typeof id !== 'string') return;
    const key = `mentor_${id}`;
    const now = Date.now();
    if (deleteDebounceRef.current[key] && now - deleteDebounceRef.current[key] < 300) return;
    deleteDebounceRef.current[key] = now;

    hasUserMutatedInSessionRef.current = true;
    setSystemData((prev) => {
      const mentors = prev.mentors || [];
      const targetExists = mentors.some((m) => m && m.id === id);
      if (!targetExists) return prev;

      return {
        ...prev,
        mentors: mentors.filter((m) => m && m.id !== id),
        schedules: (prev.schedules || []).filter(
          (s) => !(s && s.relatedType === 'supervisor' && s.relatedId === id)
        ),
      };
    });
  }, []);

  const handleUpdateMentorCaseBinding = (mentorId: string, caseId: string | string[], bind?: boolean) => {
    setSystemData((prev) => ({
      ...prev,
      mentors: (prev.mentors || []).map((m) => {
        if (m.id !== mentorId) return m;
        if (Array.isArray(caseId)) {
          return { ...m, boundCaseIds: caseId };
        }
        const currentBound = m.boundCaseIds || [];
        const nextBound = bind !== false
          ? Array.from(new Set([...currentBound, caseId]))
          : currentBound.filter((id) => id !== caseId);
        return { ...m, boundCaseIds: nextBound };
      }),
    }));
  };

  const handleUpdateMentorTotalSupervisions = (mentorId: string, newTotal: number) => {
    setSystemData((prev) => ({
      ...prev,
      mentors: (prev.mentors || []).map((m) => (m.id === mentorId ? { ...m, totalSupervisions: newTotal } : m)),
    }));
  };

  const handleUpdateMentor = (mentorId: string, updatedData: Partial<Supervisor>) => {
    setSystemData((prev) => ({
      ...prev,
      mentors: (prev.mentors || []).map((m) => (m.id === mentorId ? { ...m, ...updatedData } : m)),
    }));
  };

  const handleAddSupervisionRecord = (mentorId: string, recordInput: Omit<SupervisionRecord, 'id'> & Partial<SupervisionRecord>) => {
    hasUserMutatedInSessionRef.current = true;
    setSystemData((prev) => ({
      ...prev,
      mentors: (prev.mentors || []).map((m) => {
        if (m.id !== mentorId) return m;

        const isGroup = recordInput.type === 'group' || m.type === 'group';
        const determinedType: 'individual' | 'group' = isGroup ? 'group' : (recordInput.type || 'individual');

        const fullRecord: SupervisionRecord = {
          id: `sup_rec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          caseId: '',
          sessionNum: 1,
          date: new Date().toISOString().split('T')[0],
          timeRange: '14:00-15:00',
          reflection: '',
          ...recordInput,
          type: determinedType,
        };

        let updatedBoundCaseIds = m.boundCaseIds || [];
        if (fullRecord.caseId && !updatedBoundCaseIds.includes(fullRecord.caseId)) {
          updatedBoundCaseIds = [...updatedBoundCaseIds, fullRecord.caseId];
        }

        return {
          ...m,
          boundCaseIds: updatedBoundCaseIds,
          type: isGroup && m.type !== 'both' ? 'group' : m.type,
          records: [fullRecord, ...(m.records || [])],
        };
      }),
    }));
  };

  const handleDeleteSupervisionRecord = useCallback((mentorId: string, recordId: string) => {
    if (!mentorId || !recordId || typeof mentorId !== 'string' || typeof recordId !== 'string') return;
    const key = `suprec_${mentorId}_${recordId}`;
    const now = Date.now();
    if (deleteDebounceRef.current[key] && now - deleteDebounceRef.current[key] < 300) return;
    deleteDebounceRef.current[key] = now;

    hasUserMutatedInSessionRef.current = true;
    setSystemData((prev) => {
      const mentors = prev.mentors || [];
      const targetMentor = mentors.find((m) => m && m.id === mentorId);
      if (!targetMentor || !Array.isArray(targetMentor.records)) return prev;

      const recordExists = targetMentor.records.some((r) => r && r.id === recordId);
      if (!recordExists) return prev;

      return {
        ...prev,
        mentors: mentors.map((m) => {
          if (!m || m.id !== mentorId) return m;
          return {
            ...m,
            records: (m.records || []).filter((r) => r && r.id !== recordId),
          };
        }),
      };
    });
  }, []);

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

  const handleDeleteThinkingNote = useCallback((id: string) => {
    if (!id || typeof id !== 'string') return;
    const key = `thinking_${id}`;
    const now = Date.now();
    if (deleteDebounceRef.current[key] && now - deleteDebounceRef.current[key] < 300) return;
    deleteDebounceRef.current[key] = now;

    hasUserMutatedInSessionRef.current = true;
    setSystemData((prev) => {
      const thinking = prev.thinking || [];
      const targetExists = thinking.some((t) => t && t.id === id);
      if (!targetExists) return prev;

      return {
        ...prev,
        thinking: thinking.filter((t) => t && t.id !== id),
      };
    });
  }, []);

  const handleTogglePinCase = (id: string) => {
    setSystemData((prev) => ({
      ...prev,
      records: prev.records.map((r) => (r.id === id ? { ...r, pinned: !r.pinned } : r)),
    }));
  };

  const handleReorderCases = (newCases: CaseRecord[]) => {
    setSystemData((prev) => ({
      ...prev,
      records: newCases,
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

  const handleDeleteSchedule = useCallback((id: string) => {
    if (!id || typeof id !== 'string') return;
    const key = `sch_${id}`;
    const now = Date.now();
    if (deleteDebounceRef.current[key] && now - deleteDebounceRef.current[key] < 300) return;
    deleteDebounceRef.current[key] = now;

    hasUserMutatedInSessionRef.current = true;
    setSystemData((prev) => {
      const schedules = prev.schedules || [];
      const targetExists = schedules.some((s) => s && s.id === id);
      if (!targetExists) return prev;

      return {
        ...prev,
        schedules: schedules.filter((s) => s && s.id !== id),
      };
    });
  }, []);

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

  const handleDeleteReminder = useCallback((id: string) => {
    if (!id || typeof id !== 'string') return;
    const key = `rem_${id}`;
    const now = Date.now();
    if (deleteDebounceRef.current[key] && now - deleteDebounceRef.current[key] < 300) return;
    deleteDebounceRef.current[key] = now;

    hasUserMutatedInSessionRef.current = true;
    setSystemData((prev) => {
      const reminders = prev.reminders || [];
      const targetExists = reminders.some((r) => r && r.id === id);
      if (!targetExists) return prev;

      return {
        ...prev,
        reminders: reminders.filter((r) => r && r.id !== id),
      };
    });
  }, []);

  const handleAddCredential = (cred: Omit<CounselorCredential, 'id'>) => {
    hasUserMutatedInSessionRef.current = true;
    const newCred: CounselorCredential = {
      ...cred,
      id: `cred_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    setSystemData((prev) => ({
      ...prev,
      credentials: [newCred, ...(prev.credentials || [])],
    }));
  };

  const handleUpdateCredential = (id: string, updated: Partial<CounselorCredential>) => {
    hasUserMutatedInSessionRef.current = true;
    setSystemData((prev) => ({
      ...prev,
      credentials: (prev.credentials || []).map((c) => (c.id === id ? { ...c, ...updated } : c)),
    }));
  };

  const handleDeleteCredential = useCallback((id: string) => {
    if (!id || typeof id !== 'string') return;
    const key = `cred_${id}`;
    const now = Date.now();
    if (deleteDebounceRef.current[key] && now - deleteDebounceRef.current[key] < 300) return;
    deleteDebounceRef.current[key] = now;

    hasUserMutatedInSessionRef.current = true;
    setSystemData((prev) => {
      const credentials = prev.credentials || [];
      const targetExists = credentials.some((c) => c && c.id === id);
      if (!targetExists) return prev;

      return {
        ...prev,
        credentials: credentials.filter((c) => c && c.id !== id),
      };
    });
  }, []);

  if (!currentUser) {
    return <AuthPortal onLoginSuccess={handleLoginSuccess} isDarkMode={isDarkMode} onToggleTheme={toggleDarkMode} />;
  }

  return (
    <div key={forceRefreshKey} className={`flex flex-col h-screen w-screen transition-colors duration-300 ${
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
        onOpenSyncModal={handleManualBackendSync}
        syncStatus={syncStatus}
        lastSyncTime={lastSyncTime}
        hasConflict={hasConflict}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* 主界面 (左侧精美侧边栏 + 右侧主内容区) */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 左侧侧边栏 (集成数据控制、导入导出、提醒中心、隐私说明、后台同步、自定义工作区布局) */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (deviceInfo.screenWidth < 1024) {
              setIsMobileMenuOpen(false);
            }
          }}
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
            <ErrorBoundary fallbackTitle="统计面板加载异常">
              {/* 顶置：个案总时数、督导总时数、个人体验总时数统计板 */}
              <TotalHoursOverview
                systemData={systemData}
                onUpdateTotalHoursOverrides={handleUpdateTotalHoursOverrides}
                onNavigateTab={(tab) => setActiveTab(tab as any)}
              />
            </ErrorBoundary>

            <ErrorBoundary fallbackTitle="日程概览加载异常">
              {/* 今日日程概览（精美紧凑顶置，方便在主界面自动筛选并快速查看所有安排好的咨询/督导任务） */}
              <TodayScheduleOverview
                schedules={systemData.schedules || []}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onToggleComplete={handleToggleScheduleComplete}
              />
            </ErrorBoundary>

            <ErrorBoundary fallbackTitle="个案管理模块加载异常">
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
                  onUpdateCase={handleUpdateCase}
                  onDeleteCase={handleDeleteCase}
                  onUpdateSessionNote={handleUpdateSessionNote}
                  onUpdateParentSessionNote={handleUpdateParentSessionNote}
                  onBatchUpdateSessions={handleBatchUpdateSessions}
                  onBatchUpdateCases={handleBatchUpdateCases}
                  onBatchDeleteCases={handleBatchDeleteCases}
                  onUpdateCaseTotalSessions={handleUpdateCaseTotalSessions}
                  onSaveToThinkingNotes={handleAddThinkingNote}
                  onTogglePinCase={handleTogglePinCase}
                  onReorderCases={handleReorderCases}
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
                  onUpdateCase={handleUpdateCase}
                  onDeleteCase={handleDeleteCase}
                  onUpdateSessionNote={handleUpdateSessionNote}
                  onUpdateParentSessionNote={handleUpdateParentSessionNote}
                  onBatchUpdateSessions={handleBatchUpdateSessions}
                  onBatchUpdateCases={handleBatchUpdateCases}
                  onBatchDeleteCases={handleBatchDeleteCases}
                  onUpdateCaseTotalSessions={handleUpdateCaseTotalSessions}
                  onSaveToThinkingNotes={handleAddThinkingNote}
                  onTogglePinCase={handleTogglePinCase}
                  onReorderCases={handleReorderCases}
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
                  onUpdateCase={handleUpdateCase}
                  onDeleteCase={handleDeleteCase}
                  onUpdateSessionNote={handleUpdateSessionNote}
                  onUpdateParentSessionNote={handleUpdateParentSessionNote}
                  onBatchUpdateSessions={handleBatchUpdateSessions}
                  onBatchUpdateCases={handleBatchUpdateCases}
                  onBatchDeleteCases={handleBatchDeleteCases}
                  onUpdateCaseTotalSessions={handleUpdateCaseTotalSessions}
                  onSaveToThinkingNotes={handleAddThinkingNote}
                  onTogglePinCase={handleTogglePinCase}
                  onReorderCases={handleReorderCases}
                />
              )}
            </ErrorBoundary>

            {activeTab === 'mentor' && (
              <ErrorBoundary fallbackTitle="督导管理模块加载异常">
                <SupervisorManagement
                  mentors={systemData.mentors}
                  cases={systemData.records}
                  totalHoursOverrides={systemData.totalHoursOverrides}
                  onUpdateTotalHoursOverrides={handleUpdateTotalHoursOverrides}
                  onAddMentor={handleAddMentor}
                  onDeleteMentor={handleDeleteMentor}
                  onUpdateMentor={handleUpdateMentor}
                  onUpdateMentorCaseBinding={handleUpdateMentorCaseBinding}
                  onUpdateMentorTotalSupervisions={handleUpdateMentorTotalSupervisions}
                  onAddSupervisionRecord={handleAddSupervisionRecord}
                  onDeleteSupervisionRecord={handleDeleteSupervisionRecord}
                  onUpdateSupervisionRecord={handleUpdateSupervisionRecord}
                  supervisionTypeFilter={supervisionTypeFilter}
                  onTypeFilterChange={setSupervisionTypeFilter}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'personalExperience' && (
              <ErrorBoundary fallbackTitle="个人体验模块加载异常">
                <PersonalExperienceManagement
                  experienceData={systemData.personalExperience}
                  totalHoursOverrides={systemData.totalHoursOverrides}
                  onUpdateTotalHoursOverrides={handleUpdateTotalHoursOverrides}
                  onUpdateExperienceData={(updated) => {
                    hasUserMutatedInSessionRef.current = true;
                    setSystemData((prev) => ({
                      ...prev,
                      personalExperience: updated,
                    }));
                  }}
                  experienceTypeFilter={personalExperienceFilter}
                  onTypeFilterChange={setPersonalExperienceFilter}
                />
              </ErrorBoundary>
            )}

            {(activeTab === 'training' || activeTab === 'trainingPsychodynamics' || activeTab === 'trainingLongShort' || activeTab === 'trainingOtherSchools' || activeTab === 'trainingEthicsCrisis') && (
              <ErrorBoundary fallbackTitle="培训经历模块加载异常">
                <TrainingManagement
                  trainings={systemData.trainings || []}
                  onUpdateTrainings={(updatedTrainings) => {
                    hasUserMutatedInSessionRef.current = true;
                    setSystemData((prev) => ({
                      ...prev,
                      trainings: updatedTrainings,
                    }));
                  }}
                  trainingTypeFilter={trainingTypeFilter}
                  onTypeFilterChange={setTrainingTypeFilter}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'credentials' && (
              <ErrorBoundary fallbackTitle="资质证书模块加载异常">
                <CredentialManagement
                  credentials={systemData.credentials || []}
                  onAddCredential={handleAddCredential}
                  onUpdateCredential={handleUpdateCredential}
                  onDeleteCredential={handleDeleteCredential}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'thinking' && (
              <ErrorBoundary fallbackTitle="反思笔记模块加载异常">
                <ThinkingNotes
                  notes={systemData.thinking}
                  onAddNote={handleAddThinkingNote}
                  onUpdateNote={handleUpdateThinkingNote}
                  onDeleteNote={handleDeleteThinkingNote}
                />
              </ErrorBoundary>
            )}

            {activeTab === 'schedule' && (
              <ErrorBoundary fallbackTitle="日程管理模块加载异常">
                <ScheduleManagement
                  schedules={systemData.schedules}
                  cases={systemData.records}
                  mentors={systemData.mentors}
                  onAddSchedule={handleAddSchedule}
                  onUpdateSchedule={handleUpdateSchedule}
                  onDeleteSchedule={handleDeleteSchedule}
                  onReorderSchedules={handleReorderSchedules}
                />
              </ErrorBoundary>
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

      {/* 数据冲突检测与多端同步控制台 Modal */}
      <SyncCenterModal
        isOpen={isSyncCenterModalOpen}
        onClose={() => setIsSyncCenterModalOpen(false)}
        systemData={systemData}
        cloudData={cloudSnapshotData}
        onKeepLocal={handleKeepLocal}
        onUseCloud={handleUseCloud}
        onMergeBoth={handleMergeBoth}
        onTriggerCheck={handleManualBackendSync}
        onApplyCloudData={(cloudData) => setSystemData(cloudData, true)}
        lastSyncTime={lastSyncTime}
        setLastSyncTime={setLastSyncTime}
        hasConflict={hasConflict}
        setHasConflict={setHasConflict}
      />
    </div>
  );
}
