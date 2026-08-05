import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UserCheck,
  Calendar,
  Brain,
  FolderOpen,
  Folder,
  ShieldCheck,
  Bell,
  Download,
  Upload,
  Cloud,
  RefreshCw,
  CheckCircle2,
  HardDrive,
  Sliders,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  User,
  Users,
  Feather,
  GraduationCap,
  X,
} from 'lucide-react';
import { SystemData } from '../types';
import { WorkspaceLayoutConfig, DEFAULT_WORKSPACE_LAYOUT } from '../services/layout';

export type ActiveTab =
  | 'longTerm'
  | 'longTermActive'
  | 'longTermEnded'
  | 'shortTerm'
  | 'shortTermPersonal'
  | 'shortTermAgency'
  | 'mentor'
  | 'personalExperience'
  | 'training'
  | 'trainingPsychodynamics'
  | 'trainingLongShort'
  | 'trainingOtherSchools'
  | 'trainingEthicsCrisis'
  | 'credentials'
  | 'thinking'
  | 'schedule';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  supervisionTypeFilter?: 'all' | 'individual' | 'group';
  onSelectSupervisionFilter?: (filter: 'all' | 'individual' | 'group') => void;
  personalExperienceFilter?: 'all' | 'individual' | 'group';
  onSelectPersonalExperienceFilter?: (filter: 'all' | 'individual' | 'group') => void;
  trainingTypeFilter?: 'all' | 'psychodynamics' | 'longShort' | 'otherSchools' | 'ethicsCrisis';
  onSelectTrainingFilter?: (filter: 'all' | 'psychodynamics' | 'longShort' | 'otherSchools' | 'ethicsCrisis') => void;
  systemData: SystemData;
  onOpenPrivacyModal: (initialTab?: 'privacy' | 'backup' | 'clear' | 'layout') => void;
  onOpenReminderModal: () => void;
  onOpenSyncModal?: () => void;
  hasConflict?: boolean;
  onExportData: () => void;
  onImportDataChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onManualSync: () => void;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime: string;
  layoutConfig?: WorkspaceLayoutConfig;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  FolderOpen,
  Folder,
  UserCheck,
  Brain,
  Calendar,
};

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  supervisionTypeFilter = 'all',
  onSelectSupervisionFilter,
  personalExperienceFilter = 'all',
  onSelectPersonalExperienceFilter,
  trainingTypeFilter = 'all',
  onSelectTrainingFilter,
  systemData,
  onOpenPrivacyModal,
  onOpenReminderModal,
  onOpenSyncModal,
  hasConflict = false,
  onExportData,
  onImportDataChange,
  onManualSync,
  syncStatus,
  lastSyncTime,
  layoutConfig = DEFAULT_WORKSPACE_LAYOUT,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCasesDropdownOpen, setIsCasesDropdownOpen] = useState(true);
  const [isLongTermSubOpen, setIsLongTermSubOpen] = useState(true);
  const [isShortTermSubOpen, setIsShortTermSubOpen] = useState(true);
  const [isMentorDropdownOpen, setIsMentorDropdownOpen] = useState(true);
  const [isPersonalExpDropdownOpen, setIsPersonalExpDropdownOpen] = useState(true);
  const [isTrainingDropdownOpen, setIsTrainingDropdownOpen] = useState(true);

  const pendingRemindersCount = (systemData.reminders || []).filter((r) => !r.completed).length;

  const visibleNavItems = (layoutConfig?.navItems || DEFAULT_WORKSPACE_LAYOUT.navItems).filter(
    (item) => item.visible
  );

  const widgets = layoutConfig?.widgets || DEFAULT_WORKSPACE_LAYOUT.widgets;

  const longTermItem = visibleNavItems.find((i) => i.id === 'longTerm');
  const shortTermItem = visibleNavItems.find((i) => i.id === 'shortTerm');
  const hasCasesGroup = Boolean(longTermItem || shortTermItem);
  const isCasesActive = activeTab === 'longTerm' || activeTab === 'longTermActive' || activeTab === 'longTermEnded' || activeTab === 'shortTerm' || activeTab === 'shortTermPersonal' || activeTab === 'shortTermAgency';

  const mentorItem = visibleNavItems.find((i) => i.id === 'mentor');

  const otherNavItems = visibleNavItems.filter(
    (i) => i.id !== 'longTerm' && i.id !== 'shortTerm' && i.id !== 'mentor'
  );

  const handleItemSelect = (action: () => void) => {
    action();
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* 手机端半透明背景遮罩 */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-rose-200 dark:border-slate-800 text-zinc-800 dark:text-slate-100 flex flex-col justify-between shrink-0 p-4 shadow-2xl md:shadow-xs transition-transform duration-300 overflow-y-auto md:static md:z-auto md:w-72 md:max-w-none md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* 手机端 Drawer 顶部关闭栏 */}
        <div className="flex items-center justify-between md:hidden border-b border-rose-100 dark:border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <Feather className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-black text-rose-800 dark:text-rose-300">导航功能菜单</span>
          </div>
          <button
            onClick={onCloseMobile}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-slate-200 hover:bg-rose-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Upper Navigation Sections */}
        <div className="space-y-5">
          <div className="px-3 py-1 flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-2">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-rose-500 dark:text-rose-400">
              Navigation / 功能导航
            </p>
            <button
              onClick={() => {
                onOpenPrivacyModal('layout');
                if (onCloseMobile) onCloseMobile();
              }}
              className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 dark:bg-slate-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-slate-700 rounded-md transition flex items-center gap-1 cursor-pointer border border-rose-200/50 dark:border-slate-700"
              title="自定义工作区布局（重排或隐藏板块）"
            >
              <Sliders className="w-3 h-3 text-rose-500" />
              <span>自定义布局</span>
            </button>
          </div>

          {/* 动态排列渲染菜单项 */}
          <div className="space-y-2.5">
            {visibleNavItems.length > 0 ? (
              <>
                {/* 1. 说了个啥 (分组卡片及下拉菜单) */}
                {hasCasesGroup && (
                  <div className="rounded-xl border border-rose-200/80 dark:border-slate-800 bg-rose-50/40 dark:bg-slate-800/40 overflow-hidden transition-all shadow-2xs">
                    {/* 下拉总标题: 说了个啥 */}
                    <button
                      onClick={() => {
                        setIsCasesDropdownOpen((prev) => !prev);
                        if (!isCasesActive) {
                          if (longTermItem) handleItemSelect(() => setActiveTab('longTerm'));
                          else if (shortTermItem) handleItemSelect(() => setActiveTab('shortTerm'));
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 text-xs font-bold transition-all cursor-pointer ${
                        isCasesActive
                          ? 'bg-rose-100/90 dark:bg-slate-800 text-rose-800 dark:text-rose-300 border-b border-rose-200/80 dark:border-slate-700/80'
                          : 'text-zinc-700 dark:text-slate-200 hover:bg-rose-100/60 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-rose-200/70 dark:bg-slate-700 text-rose-700 dark:text-rose-300 shrink-0">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <span className="text-base sm:text-lg font-black tracking-wide text-zinc-900 dark:text-slate-100">说了个啥</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-500 dark:text-slate-400">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-200/60 dark:bg-slate-700 text-rose-700 dark:text-rose-300">
                          案例专区
                        </span>
                        {isCasesDropdownOpen ? (
                          <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                        )}
                      </div>
                    </button>

                    {/* 下拉展开子菜单 */}
                    <AnimatePresence initial={false}>
                      {isCasesDropdownOpen && (
                        <motion.div
                          key="cases-dropdown"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden p-1.5 space-y-2 bg-white/80 dark:bg-slate-900/80 border-t border-rose-100/80 dark:border-slate-800"
                        >
                          {/* 第一级菜单 1: 长程个案 */}
                          {longTermItem && (
                            <div className="rounded-lg border border-emerald-100 dark:border-slate-800 bg-emerald-50/30 dark:bg-slate-800/30 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setIsLongTermSubOpen((prev) => !prev)}
                                className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-bold text-emerald-950 dark:text-emerald-300 hover:bg-emerald-100/50 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5">
                                  <FolderOpen className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span>长程个案</span>
                                </div>
                                {isLongTermSubOpen ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                              </button>

                              {/* 长程个案下设的二级下拉项 */}
                              <AnimatePresence initial={false}>
                                {isLongTermSubOpen && (
                                  <motion.div
                                    key="longterm-sub"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                                    className="overflow-hidden p-1 space-y-1 bg-white/90 dark:bg-slate-900/90 border-t border-emerald-100/60 dark:border-slate-800"
                                  >
                                    <button
                                      onClick={() => handleItemSelect(() => setActiveTab('longTermActive'))}
                                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        activeTab === 'longTermActive' || activeTab === 'longTerm'
                                          ? 'bg-emerald-600 text-white font-bold shadow-xs'
                                          : 'text-zinc-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === 'longTermActive' || activeTab === 'longTerm' ? 'bg-white' : 'bg-emerald-500'}`} />
                                      <div className="flex flex-col text-left leading-tight">
                                        <span className="font-bold">1. 正在进行中</span>
                                        <span className="text-[9px] opacity-80 font-normal">长程活跃咨询中个案</span>
                                      </div>
                                    </button>

                                    <button
                                      onClick={() => handleItemSelect(() => setActiveTab('longTermEnded'))}
                                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        activeTab === 'longTermEnded'
                                          ? 'bg-amber-600 text-white font-bold shadow-xs'
                                          : 'text-zinc-700 dark:text-slate-300 hover:bg-amber-50 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === 'longTermEnded' ? 'bg-white' : 'bg-amber-500'}`} />
                                      <div className="flex flex-col text-left leading-tight">
                                        <span className="font-bold">2. 终止，暂停</span>
                                        <span className="text-[9px] opacity-80 font-normal">结案/暂告一段落个案</span>
                                      </div>
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}

                          {/* 第一级菜单 2: 短程咨询 */}
                          {shortTermItem && (
                            <div className="rounded-lg border border-rose-100 dark:border-slate-800 bg-rose-50/30 dark:bg-slate-800/30 overflow-hidden">
                              <button
                                type="button"
                                onClick={() => setIsShortTermSubOpen((prev) => !prev)}
                                className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-bold text-rose-950 dark:text-rose-300 hover:bg-rose-100/50 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                <div className="flex items-center gap-1.5">
                                  <Folder className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                  <span>短程个案</span>
                                </div>
                                {isShortTermSubOpen ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-rose-600" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-rose-600" />
                                )}
                              </button>

                              {/* 短程咨询下设的二级下拉项 */}
                              <AnimatePresence initial={false}>
                                {isShortTermSubOpen && (
                                  <motion.div
                                    key="shortterm-sub"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                                    className="overflow-hidden p-1 space-y-1 bg-white/90 dark:bg-slate-900/90 border-t border-rose-100/60 dark:border-slate-800"
                                  >
                                    <button
                                      onClick={() => handleItemSelect(() => setActiveTab('shortTermPersonal'))}
                                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        activeTab === 'shortTermPersonal' || activeTab === 'shortTerm'
                                          ? 'bg-rose-600 text-white font-bold shadow-xs'
                                          : 'text-zinc-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === 'shortTermPersonal' || activeTab === 'shortTerm' ? 'bg-white' : 'bg-rose-500'}`} />
                                      <div className="flex flex-col text-left leading-tight">
                                        <span className="font-bold">1. 个人短程案例</span>
                                        <span className="text-[9px] opacity-80 font-normal">独立接诊/私行单次个案</span>
                                      </div>
                                    </button>

                                    <button
                                      onClick={() => handleItemSelect(() => setActiveTab('shortTermAgency'))}
                                      className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        activeTab === 'shortTermAgency'
                                          ? 'bg-purple-600 text-white font-bold shadow-xs'
                                          : 'text-zinc-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800'
                                      }`}
                                    >
                                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === 'shortTermAgency' ? 'bg-white' : 'bg-purple-500'}`} />
                                      <div className="flex flex-col text-left leading-tight">
                                        <span className="font-bold">2. 医院或机构短程案例</span>
                                        <span className="text-[9px] opacity-80 font-normal">医院门诊/平台/机构派单</span>
                                      </div>
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* 2. 督导了个啥 (分组卡片及下拉菜单) */}
                {mentorItem && (
                  <div className="rounded-xl border border-rose-200/80 dark:border-slate-800 bg-rose-50/40 dark:bg-slate-800/40 overflow-hidden transition-all shadow-2xs">
                    {/* 下拉总标题: 督导了个啥 */}
                    <button
                      onClick={() => {
                        setIsMentorDropdownOpen((prev) => !prev);
                        if (activeTab !== 'mentor') {
                          handleItemSelect(() => {
                            setActiveTab('mentor');
                            onSelectSupervisionFilter?.('all');
                          });
                        }
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-3 text-xs font-bold transition-all cursor-pointer ${
                        activeTab === 'mentor'
                          ? 'bg-rose-100/90 dark:bg-slate-800 text-rose-800 dark:text-rose-300 border-b border-rose-200/80 dark:border-slate-700/80'
                          : 'text-zinc-700 dark:text-slate-200 hover:bg-rose-100/60 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-rose-200/70 dark:bg-slate-700 text-rose-700 dark:text-rose-300 shrink-0">
                          <UserCheck className="w-4 h-4" />
                        </div>
                        <span className="text-base sm:text-lg font-black tracking-wide text-zinc-900 dark:text-slate-100">督导了个啥</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-rose-500 dark:text-slate-400">
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-200/60 dark:bg-slate-700 text-rose-700 dark:text-rose-300">
                          督导研讨
                        </span>
                        {isMentorDropdownOpen ? (
                          <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                        ) : (
                          <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                        )}
                      </div>
                    </button>

                    {/* 下拉展开子菜单 */}
                    <AnimatePresence initial={false}>
                      {isMentorDropdownOpen && (
                        <motion.div
                          key="mentor-dropdown"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2, ease: 'easeInOut' }}
                          className="overflow-hidden p-1.5 space-y-1 bg-white/80 dark:bg-slate-900/80 border-t border-rose-100/80 dark:border-slate-800"
                        >
                          <button
                            onClick={() => {
                              handleItemSelect(() => {
                                setActiveTab('mentor');
                                onSelectSupervisionFilter?.('individual');
                              });
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              activeTab === 'mentor' && supervisionTypeFilter === 'individual'
                                ? 'bg-rose-500 text-white dark:bg-rose-600 font-bold shadow-xs'
                                : 'text-zinc-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-800 dark:hover:text-rose-300'
                            }`}
                          >
                            <User className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'mentor' && supervisionTypeFilter === 'individual' ? 'text-white' : 'text-rose-500'}`} />
                            <div className="flex flex-col text-left leading-tight">
                              <span className="font-bold">个体督导</span>
                            </div>
                          </button>

                          <button
                            onClick={() => {
                              handleItemSelect(() => {
                                setActiveTab('mentor');
                                onSelectSupervisionFilter?.('group');
                              });
                            }}
                            className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              activeTab === 'mentor' && supervisionTypeFilter === 'group'
                                ? 'bg-rose-500 text-white dark:bg-rose-600 font-bold shadow-xs'
                                : 'text-zinc-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-800 dark:hover:text-rose-300'
                            }`}
                          >
                            <Users className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'mentor' && supervisionTypeFilter === 'group' ? 'text-white' : 'text-rose-500'}`} />
                            <div className="flex flex-col text-left leading-tight">
                              <span className="font-bold">团体督导</span>
                            </div>
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* 3. 自我成长 (大标题: 自我成长) */}
                <div className="rounded-xl border border-rose-200/80 dark:border-slate-800 bg-rose-50/40 dark:bg-slate-800/40 overflow-hidden transition-all shadow-2xs">
                  {/* 下拉总标题: 自我成长 */}
                  <button
                    onClick={() => {
                      setIsPersonalExpDropdownOpen((prev) => !prev);
                      if (activeTab !== 'personalExperience') {
                        handleItemSelect(() => {
                          setActiveTab('personalExperience');
                          onSelectPersonalExperienceFilter?.('all');
                        });
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'personalExperience'
                        ? 'bg-rose-100/90 dark:bg-slate-800 text-rose-800 dark:text-rose-300 border-b border-rose-200/80 dark:border-slate-700/80'
                        : 'text-zinc-700 dark:text-slate-200 hover:bg-rose-100/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-rose-200/70 dark:bg-slate-700 text-rose-700 dark:text-rose-300 shrink-0">
                        <Feather className="w-4 h-4" />
                      </div>
                      <span className="text-base sm:text-lg font-black tracking-wide text-zinc-900 dark:text-slate-100">自我成长</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-500 dark:text-slate-400">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-rose-200/60 dark:bg-slate-700 text-rose-700 dark:text-rose-300">
                        体验与分析
                      </span>
                      {isPersonalExpDropdownOpen ? (
                        <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                      )}
                    </div>
                  </button>

                  {/* 下拉展开子菜单: 1. 个人体验 2. 团体体验 */}
                  <AnimatePresence initial={false}>
                    {isPersonalExpDropdownOpen && (
                      <motion.div
                        key="personalexp-dropdown"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden p-1.5 space-y-1 bg-white/80 dark:bg-slate-900/80 border-t border-rose-100/80 dark:border-slate-800"
                      >
                        <button
                          onClick={() => {
                            handleItemSelect(() => {
                              setActiveTab('personalExperience');
                              onSelectPersonalExperienceFilter?.('individual');
                            });
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'personalExperience' && personalExperienceFilter === 'individual'
                              ? 'bg-rose-600 text-white font-bold shadow-xs'
                              : 'text-zinc-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-800 dark:hover:text-rose-300'
                          }`}
                        >
                          <User className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'personalExperience' && personalExperienceFilter === 'individual' ? 'text-white' : 'text-rose-500'}`} />
                          <div className="flex flex-col text-left leading-tight">
                            <span className="font-bold">1. 个人体验</span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            handleItemSelect(() => {
                              setActiveTab('personalExperience');
                              onSelectPersonalExperienceFilter?.('group');
                            });
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'personalExperience' && personalExperienceFilter === 'group'
                              ? 'bg-rose-600 text-white font-bold shadow-xs'
                              : 'text-zinc-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-800 dark:hover:text-rose-300'
                          }`}
                        >
                          <Users className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'personalExperience' && personalExperienceFilter === 'group' ? 'text-white' : 'text-rose-500'}`} />
                          <div className="flex flex-col text-left leading-tight">
                            <span className="font-bold">2. 团体体验</span>
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 4. 学习培训 (大栏: 学习培训) */}
                <div className="rounded-xl border border-indigo-200/80 dark:border-slate-800 bg-indigo-50/40 dark:bg-slate-800/40 overflow-hidden transition-all shadow-2xs">
                  {/* 下拉总标题: 学习培训 */}
                  <button
                    onClick={() => {
                      setIsTrainingDropdownOpen((prev) => !prev);
                      if (activeTab !== 'training' && activeTab !== 'trainingPsychodynamics' && activeTab !== 'trainingLongShort' && activeTab !== 'trainingOtherSchools' && activeTab !== 'trainingEthicsCrisis') {
                        handleItemSelect(() => {
                          setActiveTab('training');
                          onSelectTrainingFilter?.('all');
                        });
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'training' || activeTab === 'trainingPsychodynamics' || activeTab === 'trainingLongShort' || activeTab === 'trainingOtherSchools' || activeTab === 'trainingEthicsCrisis'
                        ? 'bg-indigo-100/90 dark:bg-slate-800 text-indigo-900 dark:text-indigo-300 border-b border-indigo-200/80 dark:border-slate-700/80'
                        : 'text-zinc-700 dark:text-slate-200 hover:bg-indigo-100/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-indigo-200/70 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shrink-0">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <span className="text-base sm:text-lg font-black tracking-wide text-zinc-900 dark:text-slate-100">学习培训</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-indigo-500 dark:text-slate-400">
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-indigo-200/60 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300">
                        专业培训
                      </span>
                      {isTrainingDropdownOpen ? (
                        <ChevronDown className="w-4 h-4 transition-transform duration-200" />
                      ) : (
                        <ChevronRight className="w-4 h-4 transition-transform duration-200" />
                      )}
                    </div>
                  </button>

                  {/* 下拉展开子菜单: 1. 长程动力学培训 2. 长程短程培训 3. 其他流派培训 4. 伦理及危机干预培训 */}
                  <AnimatePresence initial={false}>
                    {isTrainingDropdownOpen && (
                      <motion.div
                        key="training-dropdown"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden p-1.5 space-y-1 bg-white/80 dark:bg-slate-900/80 border-t border-indigo-100/80 dark:border-slate-800"
                      >
                        <button
                          onClick={() => {
                            handleItemSelect(() => {
                              setActiveTab('trainingPsychodynamics');
                              onSelectTrainingFilter?.('psychodynamics');
                            });
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'trainingPsychodynamics' || (activeTab === 'training' && trainingTypeFilter === 'psychodynamics')
                              ? 'bg-indigo-600 text-white font-bold shadow-xs'
                              : 'text-zinc-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-800 dark:hover:text-indigo-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === 'trainingPsychodynamics' ? 'bg-white' : 'bg-indigo-500'}`} />
                          <div className="flex flex-col text-left leading-tight">
                            <span className="font-bold">1. 长程动力学培训</span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            handleItemSelect(() => {
                              setActiveTab('trainingLongShort');
                              onSelectTrainingFilter?.('longShort');
                            });
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'trainingLongShort' || (activeTab === 'training' && trainingTypeFilter === 'longShort')
                              ? 'bg-sky-600 text-white font-bold shadow-xs'
                              : 'text-zinc-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800 hover:text-sky-800 dark:hover:text-sky-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === 'trainingLongShort' ? 'bg-white' : 'bg-sky-500'}`} />
                          <div className="flex flex-col text-left leading-tight">
                            <span className="font-bold">2. 动力学短程培训</span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            handleItemSelect(() => {
                              setActiveTab('trainingOtherSchools');
                              onSelectTrainingFilter?.('otherSchools');
                            });
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'trainingOtherSchools' || (activeTab === 'training' && trainingTypeFilter === 'otherSchools')
                              ? 'bg-purple-600 text-white font-bold shadow-xs'
                              : 'text-zinc-600 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800 hover:text-purple-800 dark:hover:text-purple-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === 'trainingOtherSchools' ? 'bg-white' : 'bg-purple-500'}`} />
                          <div className="flex flex-col text-left leading-tight">
                            <span className="font-bold">3. 其他流派培训</span>
                          </div>
                        </button>

                        <button
                          onClick={() => {
                            handleItemSelect(() => {
                              setActiveTab('trainingEthicsCrisis');
                              onSelectTrainingFilter?.('ethicsCrisis');
                            });
                          }}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'trainingEthicsCrisis' || (activeTab === 'training' && trainingTypeFilter === 'ethicsCrisis')
                              ? 'bg-rose-600 text-white font-bold shadow-xs'
                              : 'text-zinc-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-800 dark:hover:text-rose-300'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeTab === 'trainingEthicsCrisis' ? 'bg-white' : 'bg-rose-500'}`} />
                          <div className="flex flex-col text-left leading-tight">
                            <span className="font-bold">4. 伦理及危机干预培训</span>
                          </div>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 5. 心理咨询师证件 (国家级资质、心理治疗、社工、CPS 3级/2级等) */}
                <div className="rounded-xl border border-emerald-200/80 dark:border-slate-800 bg-emerald-50/40 dark:bg-slate-800/40 overflow-hidden transition-all shadow-2xs">
                  <button
                    onClick={() => {
                      handleItemSelect(() => {
                        setActiveTab('credentials');
                      });
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-3 text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'credentials'
                        ? 'bg-emerald-500 text-white dark:bg-emerald-600 font-black shadow-md shadow-emerald-200/80 dark:shadow-none'
                        : 'text-zinc-700 dark:text-slate-200 hover:bg-emerald-100/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                          activeTab === 'credentials'
                            ? 'bg-white/20 text-white'
                            : 'bg-emerald-200/70 dark:bg-slate-700 text-emerald-800 dark:text-emerald-300'
                        }`}
                      >
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <span className="text-base sm:text-lg font-black tracking-wide text-zinc-900 dark:text-slate-100">
                        心理咨询师证件
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        activeTab === 'credentials'
                          ? 'bg-white/20 text-white'
                          : 'bg-emerald-200/60 dark:bg-slate-700 text-emerald-800 dark:text-emerald-300'
                      }`}
                    >
                      国家资质
                    </span>
                  </button>
                </div>

                {/* 6. 其余一级菜单项: 想出来个啥、出了个门儿 */}
                {otherNavItems.map((item) => {
                  const IconComponent = ICON_MAP[item.iconName] || FolderOpen;
                  const isActive = activeTab === item.id;

                  let cleanLabel = item.label;
                  if (item.id === 'thinking') cleanLabel = '想出来个啥';
                  if (item.id === 'schedule') cleanLabel = '出了个门儿';

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleItemSelect(() => setActiveTab(item.id))}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-rose-500 text-white dark:bg-rose-600 dark:text-white font-extrabold shadow-md shadow-rose-200/80 dark:shadow-none'
                          : 'bg-rose-50/40 dark:bg-slate-800/40 border border-rose-200/80 dark:border-slate-800 text-zinc-700 dark:text-slate-200 hover:bg-rose-100/60 dark:hover:bg-slate-800/60 font-bold'
                      }`}
                    >
                      <div
                        className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-rose-200/70 dark:bg-slate-700 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="text-base sm:text-lg font-black tracking-wide text-zinc-900 dark:text-slate-100">
                        {cleanLabel}
                      </span>
                    </button>
                  );
                })}
              </>
            ) : (
              <div className="p-4 text-center text-xs text-zinc-400 dark:text-slate-500 bg-rose-50/50 dark:bg-slate-800/50 rounded-xl space-y-2">
                <p>所有菜单项均已被隐藏</p>
                <button
                  onClick={() => {
                    onOpenPrivacyModal('layout');
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className="px-3 py-1 bg-rose-500 text-white text-[11px] font-bold rounded-lg shadow-2xs cursor-pointer"
                >
                  前往恢复布局
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Data & Security Control Panel */}
        <div className="mt-6 pt-4 border-t border-rose-200/80 dark:border-slate-800 space-y-3 shrink-0">
          <div className="px-2 flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-slate-500 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-rose-500" />
              <span>数据控制与系统工具</span>
            </span>
            <button
              onClick={() => {
                onOpenPrivacyModal('layout');
                if (onCloseMobile) onCloseMobile();
              }}
              className="p-1 hover:bg-rose-100 dark:hover:bg-slate-800 rounded-md text-zinc-400 hover:text-rose-600 transition"
              title="设置/控制此处的板块显隐"
            >
              <Sliders className="w-3 h-3" />
            </button>
          </div>

          {/* 1. 提醒中心按钮 */}
          {widgets.showRemindersWidget && (
            <button
              onClick={() => {
                onOpenReminderModal();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-rose-50/80 dark:bg-slate-800/90 hover:bg-rose-100 dark:hover:bg-slate-700/80 border border-rose-200/80 dark:border-slate-700/80 rounded-xl text-xs font-bold text-zinc-700 dark:text-slate-200 transition-all cursor-pointer group shadow-2xs active:scale-98"
            >
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-lg group-hover:scale-110 transition-transform">
                  <Bell className="w-3.5 h-3.5" />
                </span>
                <span>工作提醒通知中心</span>
              </div>
              {pendingRemindersCount > 0 ? (
                <span className="px-2 py-0.5 bg-rose-500 text-white font-extrabold text-[10px] rounded-full animate-pulse shadow-2xs">
                  {pendingRemindersCount} 待办
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-zinc-400 dark:text-slate-500">无未完成</span>
              )}
            </button>
          )}

          {/* 2. 数据备份与恢复 (导出/导入 双按钮) */}
          {widgets.showBackupWidget && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onExportData}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 border border-rose-200 dark:border-slate-700 rounded-xl text-xs font-bold text-zinc-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="导出全部数据为 JSON 文件备份"
              >
                <Download className="w-3.5 h-3.5 text-rose-500" />
                <span>导出备份</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 border border-rose-200 dark:border-slate-700 rounded-xl text-xs font-bold text-zinc-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs active:scale-95"
                title="从 JSON 备份文件恢复导入数据"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-500" />
                <span>导入恢复</span>
              </button>

              <input
                type="file"
                ref={fileInputRef}
                onChange={onImportDataChange}
                accept=".json"
                className="hidden"
              />
            </div>
          )}

          {/* 3. 后台数据同步面板 */}
          {widgets.showSyncWidget && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>状态:</span>
                </span>
                <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]">
                  {lastSyncTime}
                </span>
              </div>

              <button
                onClick={onManualSync}
                disabled={syncStatus === 'syncing'}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white bg-zinc-800 hover:bg-zinc-700 dark:bg-rose-700 dark:hover:bg-rose-600 rounded-lg transition-all active:scale-95 disabled:opacity-60 cursor-pointer shadow-2xs"
              >
                {syncStatus === 'syncing' ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-rose-300" />
                ) : (
                  <Cloud className="w-3.5 h-3.5 text-rose-300" />
                )}
                <span>{syncStatus === 'syncing' ? '正在与后台同步...' : '一键同步至后台'}</span>
              </button>
            </div>
          )}

          {/* 4. 数据隐私说明 Banner */}
          {widgets.showPrivacyWidget && (
            <div
              onClick={() => {
                onOpenPrivacyModal('privacy');
                if (onCloseMobile) onCloseMobile();
              }}
              className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 hover:bg-emerald-100/80 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 space-y-1 transition-all cursor-pointer group shadow-2xs"
              title="点击查看数据隐私说明、LocalStorage 加密及清空缓存"
            >
              <div className="flex items-center justify-between font-bold">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>数据隐私说明与安全</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.5 bg-emerald-200/80 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded font-semibold">
                  伦理保障
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90 leading-tight">
                全量数据 LocalStorage 离线保密，点此了解防外泄与加密机制
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

