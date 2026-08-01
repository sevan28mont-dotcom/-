import React, { useRef, useState } from 'react';
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
} from 'lucide-react';
import { SystemData } from '../types';
import { WorkspaceLayoutConfig, DEFAULT_WORKSPACE_LAYOUT } from '../services/layout';

export type ActiveTab = 'longTerm' | 'shortTerm' | 'mentor' | 'thinking' | 'schedule';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  supervisionTypeFilter?: 'all' | 'individual' | 'group';
  onSelectSupervisionFilter?: (filter: 'all' | 'individual' | 'group') => void;
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
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCasesDropdownOpen, setIsCasesDropdownOpen] = useState(true);
  const [isMentorDropdownOpen, setIsMentorDropdownOpen] = useState(true);

  const pendingRemindersCount = (systemData.reminders || []).filter((r) => !r.completed).length;

  const visibleNavItems = (layoutConfig?.navItems || DEFAULT_WORKSPACE_LAYOUT.navItems).filter(
    (item) => item.visible
  );

  const widgets = layoutConfig?.widgets || DEFAULT_WORKSPACE_LAYOUT.widgets;

  const longTermItem = visibleNavItems.find((i) => i.id === 'longTerm');
  const shortTermItem = visibleNavItems.find((i) => i.id === 'shortTerm');
  const hasCasesGroup = Boolean(longTermItem || shortTermItem);
  const isCasesActive = activeTab === 'longTerm' || activeTab === 'shortTerm';

  const mentorItem = visibleNavItems.find((i) => i.id === 'mentor');

  const otherNavItems = visibleNavItems.filter(
    (i) => i.id !== 'longTerm' && i.id !== 'shortTerm' && i.id !== 'mentor'
  );

  return (
    <aside className="w-72 max-sm:landscape:w-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-r border-rose-200 dark:border-slate-800 text-zinc-800 dark:text-slate-100 flex flex-col justify-between shrink-0 p-4 max-sm:landscape:p-2 shadow-xs transition-all duration-300 overflow-y-auto">
      {/* Upper Navigation Sections */}
      <div className="space-y-5 max-sm:landscape:space-y-3">
        <div className="px-3 py-1 flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-2 max-sm:landscape:hidden">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-rose-500 dark:text-rose-400">
            Navigation / 功能导航
          </p>
          <button
            onClick={() => onOpenPrivacyModal('layout')}
            className="text-[10px] font-bold px-2 py-0.5 bg-rose-50 dark:bg-slate-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-slate-700 rounded-md transition flex items-center gap-1 cursor-pointer border border-rose-200/50 dark:border-slate-700"
            title="自定义工作区布局（重排或隐藏板块）"
          >
            <Sliders className="w-3 h-3 text-rose-500" />
            <span>自定义布局</span>
          </button>
        </div>

        {/* 动态排列渲染菜单项 */}
        <div className="space-y-2">
          {visibleNavItems.length > 0 ? (
            <>
              {/* 说了个啥 (分组卡片及下拉菜单) */}
              {hasCasesGroup && (
                <div className="rounded-xl border border-rose-200/80 dark:border-slate-800 bg-rose-50/40 dark:bg-slate-800/40 overflow-hidden transition-all shadow-2xs">
                  {/* 下拉总标题: 说了个啥 */}
                  <button
                    onClick={() => {
                      setIsCasesDropdownOpen((prev) => !prev);
                      if (!isCasesActive) {
                        if (longTermItem) setActiveTab('longTerm');
                        else if (shortTermItem) setActiveTab('shortTerm');
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      isCasesActive
                        ? 'bg-rose-100/90 dark:bg-slate-800 text-rose-800 dark:text-rose-300 border-b border-rose-200/80 dark:border-slate-700/80'
                        : 'text-zinc-700 dark:text-slate-200 hover:bg-rose-100/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-rose-200/70 dark:bg-slate-700 text-rose-700 dark:text-rose-300">
                        <MessageSquare className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-extrabold tracking-tight">说了个啥</span>
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
                  {isCasesDropdownOpen && (
                    <div className="p-1.5 space-y-1 bg-white/80 dark:bg-slate-900/80 border-t border-rose-100/80 dark:border-slate-800">
                      {longTermItem && (
                        <button
                          onClick={() => setActiveTab('longTerm')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'longTerm'
                              ? 'bg-rose-500 text-white dark:bg-rose-600 font-bold shadow-xs'
                              : 'text-zinc-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-800 dark:hover:text-rose-300'
                          }`}
                        >
                          <FolderOpen className={`w-3.5 h-3.5 ${activeTab === 'longTerm' ? 'text-white' : 'text-rose-400'}`} />
                          <div className="flex flex-col text-left">
                            <span className="font-bold">{longTermItem.label || '长程（下周见）'}</span>
                          </div>
                        </button>
                      )}

                      {shortTermItem && (
                        <button
                          onClick={() => setActiveTab('shortTerm')}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            activeTab === 'shortTerm'
                              ? 'bg-rose-500 text-white dark:bg-rose-600 font-bold shadow-xs'
                              : 'text-zinc-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 hover:text-rose-800 dark:hover:text-rose-300'
                          }`}
                        >
                          <Folder className={`w-3.5 h-3.5 ${activeTab === 'shortTerm' ? 'text-white' : 'text-pink-400'}`} />
                          <div className="flex flex-col text-left">
                            <span className="font-bold">{shortTermItem.label || '短程（拜拜了）'}</span>
                          </div>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 督了个啥 (分组卡片及下拉菜单) */}
              {mentorItem && (
                <div className="rounded-xl border border-rose-200/80 dark:border-slate-800 bg-rose-50/40 dark:bg-slate-800/40 overflow-hidden transition-all shadow-2xs">
                  {/* 下拉总标题: 督了个啥 */}
                  <button
                    onClick={() => {
                      setIsMentorDropdownOpen((prev) => !prev);
                      if (activeTab !== 'mentor') {
                        setActiveTab('mentor');
                        onSelectSupervisionFilter?.('all');
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-bold transition-all cursor-pointer ${
                      activeTab === 'mentor'
                        ? 'bg-rose-100/90 dark:bg-slate-800 text-rose-800 dark:text-rose-300 border-b border-rose-200/80 dark:border-slate-700/80'
                        : 'text-zinc-700 dark:text-slate-200 hover:bg-rose-100/60 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-rose-200/70 dark:bg-slate-700 text-rose-700 dark:text-rose-300">
                        <UserCheck className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-extrabold tracking-tight">督了个啥</span>
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
                  {isMentorDropdownOpen && (
                    <div className="p-1.5 space-y-1 bg-white/80 dark:bg-slate-900/80 border-t border-rose-100/80 dark:border-slate-800">
                      <button
                        onClick={() => {
                          setActiveTab('mentor');
                          onSelectSupervisionFilter?.('individual');
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
                          setActiveTab('mentor');
                          onSelectSupervisionFilter?.('group');
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
                    </div>
                  )}
                </div>
              )}

              {/* 其余菜单项: 想出来个啥、出了个门儿 */}
              {otherNavItems.map((item) => {
                const IconComponent = ICON_MAP[item.iconName] || FolderOpen;
                const isActive = activeTab === item.id;
                
                let cleanLabel = item.label;
                if (item.id === 'thinking') cleanLabel = '想出来个啥';
                if (item.id === 'schedule') cleanLabel = '出了个门儿';

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all cursor-pointer ${
                      isActive
                        ? 'bg-rose-500 text-white dark:bg-rose-600 dark:text-white font-extrabold shadow-md shadow-rose-200/80 dark:shadow-none'
                        : 'bg-rose-50/40 dark:bg-slate-800/40 border border-rose-200/80 dark:border-slate-800 text-zinc-700 dark:text-slate-200 hover:bg-rose-100/60 dark:hover:bg-slate-800/60 font-bold'
                    }`}
                  >
                    <div className={`p-1.5 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-200/70 dark:bg-slate-700 text-rose-700 dark:text-rose-300'
                    }`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-extrabold tracking-tight">{cleanLabel}</span>
                  </button>
                );
              })}
            </>
          ) : (
            <div className="p-4 text-center text-xs text-zinc-400 dark:text-slate-500 bg-rose-50/50 dark:bg-slate-800/50 rounded-xl space-y-2">
              <p>所有菜单项均已被隐藏</p>
              <button
                onClick={() => onOpenPrivacyModal('layout')}
                className="px-3 py-1 bg-rose-500 text-white text-[11px] font-bold rounded-lg shadow-2xs cursor-pointer"
              >
                前往恢复布局
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Data & Security Control Panel (精美侧边栏控制中枢) */}
      <div className="mt-6 pt-4 border-t border-rose-200/80 dark:border-slate-800 space-y-3 shrink-0">
        <div className="px-2 flex items-center justify-between">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-zinc-400 dark:text-slate-500 flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-rose-500" />
            <span>数据控制与系统工具</span>
          </span>
          <button
            onClick={() => onOpenPrivacyModal('layout')}
            className="p-1 hover:bg-rose-100 dark:hover:bg-slate-800 rounded-md text-zinc-400 hover:text-rose-600 transition"
            title="设置/控制此处的板块显隐"
          >
            <Sliders className="w-3 h-3" />
          </button>
        </div>

        {/* 1. 提醒中心按钮 */}
        {widgets.showRemindersWidget && (
          <button
            onClick={onOpenReminderModal}
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
            onClick={() => onOpenPrivacyModal('privacy')}
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
  );
};
