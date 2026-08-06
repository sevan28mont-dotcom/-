import React, { useEffect, useState, useRef } from 'react';
import { Bell, LogOut, Sun, Moon, Search, X, FolderOpen, FileText, UserCheck, Brain, ArrowRight, Feather, Sparkles, Cloud, AlertTriangle, GitMerge, Menu, RefreshCw, CheckCircle2, Info, Laptop, ShieldCheck, Clock, Tag } from 'lucide-react';
import { SystemData, ReminderItem, SessionData } from '../types';
import { ReminderModal } from './ReminderModal';
import { UserAccount } from '../services/auth';
import { ActiveTab } from './Sidebar';

interface HeaderProps {
  systemData: SystemData;
  currentUser?: UserAccount | null;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
  onLogout?: () => void;
  onAddReminder?: (rem: Omit<ReminderItem, 'id' | 'createdAt'>) => void;
  onToggleReminder?: (id: string) => void;
  onDeleteReminder?: (id: string) => void;
  onOpenReminderModal?: () => void;
  onOpenSyncModal?: () => void;
  syncStatus?: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncTime?: string;
  hasConflict?: boolean;
  onNavigateTab?: (tab: ActiveTab) => void;
  onToggleMobileMenu?: () => void;
}

interface SearchResultItem {
  id: string;
  type: 'case' | 'session' | 'supervision' | 'thinking';
  title: string;
  subtitle: string;
  snippet: string;
  targetTab: ActiveTab;
  badge: string;
}

export const Header: React.FC<HeaderProps> = ({
  systemData,
  currentUser,
  isDarkMode = false,
  onToggleTheme,
  onLogout,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
  onOpenReminderModal,
  onOpenSyncModal,
  syncStatus = 'idle',
  lastSyncTime,
  hasConflict = false,
  onNavigateTab,
  onToggleMobileMenu,
}) => {
  const [beijingTime, setBeijingTime] = useState<string>('');
  const [isReminderOpenInternal, setIsReminderOpenInternal] = useState(false);

  // 全局搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // 同步详情日志 Popover 状态
  const [isSyncDetailsOpen, setIsSyncDetailsOpen] = useState(false);
  const syncPopoverRef = useRef<HTMLDivElement>(null);

  const getDeviceInfo = () => {
    if (typeof window === 'undefined') return 'Web Client';
    const ua = navigator.userAgent;
    let os = '桌面终端';
    if (ua.includes('Macintosh')) os = 'macOS Desktop';
    else if (ua.includes('Windows')) os = 'Windows PC';
    else if (ua.includes('Android')) os = 'Android Mobile';
    else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Touch';
    else if (ua.includes('Linux')) os = 'Linux Terminal';

    let browser = 'Web App';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edg')) browser = 'Edge';

    return `${browser} (${os} · 当前客户端)`;
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat('zh-CN', {
        timeZone: 'Asia/Shanghai',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'short',
        hour12: false,
      });
      setBeijingTime(formatter.format(now));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 快捷键 Ctrl+K 或 Cmd+K 聚焦全局搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchOpen(true);
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (syncPopoverRef.current && !syncPopoverRef.current.contains(e.target as Node)) {
        setIsSyncDetailsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 生成全局检索结果
  const getSearchResults = (): SearchResultItem[] => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    const results: SearchResultItem[] = [];

    // 1. 搜索个案档案及逐字稿
    (systemData.records || []).forEach((rec) => {
      const nameMatch = rec.name?.toLowerCase().includes(q);
      const numMatch = rec.caseNum?.toLowerCase().includes(q);

      if (nameMatch || numMatch) {
        results.push({
          id: `case_${rec.id}`,
          type: 'case',
          title: rec.name,
          subtitle: `个案编号: ${rec.caseNum} | 开始时间: ${rec.startDate || '未填写'} | 状态: ${rec.status === 'active' ? '进行中' : '已结案'}`,
          snippet: `已开展 ${rec.totalSessions || 0} 次会谈记录`,
          targetTab: rec.category === 'shortTerm' ? 'shortTerm' : 'longTerm',
          badge: rec.category === 'shortTerm' ? '短程个案' : '长程个案',
        });
      }

      // 搜索该个案下每一集的会谈与逐字稿
      if (rec.sessions) {
        Object.entries(rec.sessions).forEach(([sNum, sData]) => {
          const sessionItem = sData as SessionData;
          const noteMatch = sessionItem.note?.toLowerCase().includes(q);
          const transcriptMatch = sessionItem.transcript?.toLowerCase().includes(q);
          const ideasMatch = sessionItem.ideas?.some((i) => i.toLowerCase().includes(q));

          if (noteMatch || transcriptMatch || ideasMatch) {
            const rawText = ((sessionItem.note || '') + ' ' + (sessionItem.transcript || '') + ' ' + (sessionItem.ideas?.join(' ') || '')).replace(/<[^>]*>/g, '');
            let snippet = rawText;
            const matchIdx = rawText.toLowerCase().indexOf(q);
            if (matchIdx !== -1) {
              const start = Math.max(0, matchIdx - 20);
              const end = Math.min(rawText.length, matchIdx + 40);
              snippet = (start > 0 ? '...' : '') + rawText.slice(start, end) + (end < rawText.length ? '...' : '');
            } else if (snippet.length > 60) {
              snippet = snippet.slice(0, 60) + '...';
            }

            results.push({
              id: `session_${rec.id}_${sNum}`,
              type: 'session',
              title: `${rec.name} — 第 ${sNum} 次会谈记录/逐字稿`,
              subtitle: `关联个案: ${rec.name} (${rec.caseNum})`,
              snippet: snippet || '会谈笔记与记录',
              targetTab: rec.category === 'shortTerm' ? 'shortTerm' : 'longTerm',
              badge: `第 ${sNum} 次会谈`,
            });
          }
        });
      }
    });

    // 2. 搜索督导记录
    (systemData.mentors || []).forEach((mentor) => {
      (mentor.records || []).forEach((sup) => {
        const boundCase = systemData.records?.find((r) => r.id === sup.caseId);
        const caseName = boundCase ? boundCase.name : '个案督导';

        const supMatch =
          mentor.name?.toLowerCase().includes(q) ||
          caseName.toLowerCase().includes(q) ||
          sup.reflection?.toLowerCase().includes(q) ||
          sup.transcript?.toLowerCase().includes(q) ||
          sup.ideas?.some((i) => i.toLowerCase().includes(q));

        if (supMatch) {
          const rawText = ((sup.reflection || '') + ' ' + (sup.transcript || '') + ' ' + (sup.ideas?.join(' ') || '')).replace(/<[^>]*>/g, '');
          let snippet = rawText;
          const matchIdx = rawText.toLowerCase().indexOf(q);
          if (matchIdx !== -1) {
            const start = Math.max(0, matchIdx - 20);
            const end = Math.min(rawText.length, matchIdx + 40);
            snippet = (start > 0 ? '...' : '') + rawText.slice(start, end) + (end < rawText.length ? '...' : '');
          } else if (snippet.length > 60) {
            snippet = snippet.slice(0, 60) + '...';
          }

          results.push({
            id: `sup_${sup.id}`,
            type: 'supervision',
            title: `督导记录: ${caseName}`,
            subtitle: `督导师: ${mentor.name} | 日期: ${sup.date}`,
            snippet: snippet || '核心督导要点与反思',
            targetTab: 'mentor',
            badge: '督导记录',
          });
        }
      });
    });

    // 3. 搜索思考随笔笔记
    (systemData.thinking || []).forEach((note) => {
      const titleMatch = note.title?.toLowerCase().includes(q);
      const contentMatch = note.content?.toLowerCase().includes(q);
      const tagsMatch = note.tags?.some((t) => t.toLowerCase().includes(q));

      if (titleMatch || contentMatch || tagsMatch) {
        let snippet = note.content || '';
        const matchIdx = snippet.toLowerCase().indexOf(q);
        if (matchIdx !== -1) {
          const start = Math.max(0, matchIdx - 20);
          const end = Math.min(snippet.length, matchIdx + 40);
          snippet = (start > 0 ? '...' : '') + snippet.slice(start, end) + (end < snippet.length ? '...' : '');
        } else if (snippet.length > 60) {
          snippet = snippet.slice(0, 60) + '...';
        }

        results.push({
          id: `thinking_${note.id}`,
          type: 'thinking',
          title: note.title || '无标题反思',
          subtitle: `标签: ${note.tags?.join(', ') || '反思'} | 时间: ${note.time}`,
          snippet,
          targetTab: 'thinking',
          badge: '反思随笔',
        });
      }
    });

    return results;
  };

  const searchResults = getSearchResults();

  const handleSelectResult = (item: SearchResultItem) => {
    if (onNavigateTab) {
      onNavigateTab(item.targetTab);
    }
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const pendingRemindersCount = (systemData.reminders || []).filter((r) => !r.completed).length;

  const handleBellClick = () => {
    if (onOpenReminderModal) {
      onOpenReminderModal();
    } else {
      setIsReminderOpenInternal(true);
    }
  };

  const getItemIcon = (type: SearchResultItem['type']) => {
    switch (type) {
      case 'case':
        return <FolderOpen className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'session':
        return <FileText className="w-4 h-4 text-emerald-500 shrink-0" />;
      case 'supervision':
        return <UserCheck className="w-4 h-4 text-amber-500 shrink-0" />;
      case 'thinking':
        return <Brain className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
  };

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-rose-200 dark:border-slate-800 px-3 sm:px-6 py-2.5 sm:py-3 flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 shadow-2xs z-30 transition-colors duration-300">
      {/* 左侧标头标题 */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* 手机端 Drawer 菜单 Toggle 按钮 */}
        {onToggleMobileMenu && (
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="p-2 -ml-1 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-slate-800 rounded-xl md:hidden transition-colors cursor-pointer border border-rose-200/80 dark:border-slate-700/80 shadow-2xs flex items-center justify-center shrink-0 active:scale-95"
            title="打开/关闭导航菜单"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div className="p-2 sm:p-2.5 bg-gradient-to-br from-rose-100 via-pink-50 to-amber-100 dark:from-rose-950 dark:via-slate-800 dark:to-slate-900 border border-rose-200/80 dark:border-slate-700/80 rounded-2xl shadow-2xs flex items-center justify-center shrink-0 group transition-transform hover:scale-105">
          <Feather className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500 dark:text-rose-400 group-hover:rotate-12 transition-transform duration-300" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight bg-gradient-to-r from-rose-800 via-rose-900 to-zinc-800 dark:from-rose-200 dark:via-rose-100 dark:to-slate-200 bg-clip-text text-transparent drop-shadow-2xs">
              记了个屁
            </h1>
            <span className="text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 rounded-full bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 shadow-2xs flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-rose-500" />
              <span>闹心工作台</span>
            </span>
          </div>
          <p className="text-[11px] sm:text-xs font-semibold text-rose-600/90 dark:text-rose-400/90 flex items-center gap-1.5 mt-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>北京时间: {beijingTime || '加载中...'}</span>
          </p>
        </div>
      </div>

      {/* 中间：全局搜索栏 (支持检索个案、逐字稿、督导记录、反思笔记) */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-md min-w-[200px] order-3 md:order-2 w-full md:w-auto">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-rose-400 dark:text-slate-400 absolute left-3 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="搜索个案名称、逐字稿、督导记录、反思随笔..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full pl-9 pr-16 py-1.5 text-xs font-medium bg-rose-50/60 dark:bg-slate-800/80 border border-rose-200 dark:border-slate-700/80 rounded-xl text-zinc-800 dark:text-slate-100 placeholder-zinc-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-400/50 dark:focus:ring-slate-600 transition-all shadow-2xs"
          />
          {searchQuery ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setIsSearchOpen(false);
              }}
              className="absolute right-3 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-200 rounded-full"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="absolute right-2.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-zinc-400 dark:text-slate-500 bg-white/80 dark:bg-slate-900/80 border border-rose-200 dark:border-slate-700 rounded-md select-none pointer-events-none">
              Ctrl+K
            </kbd>
          )}
        </div>

        {/* 搜索结果浮动弹出面板 */}
        {isSearchOpen && searchQuery.trim() !== '' && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 overflow-hidden max-h-96 flex flex-col transition-all">
            <div className="px-4 py-2.5 bg-rose-50/80 dark:bg-slate-800/80 border-b border-rose-100 dark:border-slate-700/80 text-[11px] font-bold text-zinc-500 dark:text-slate-400 flex items-center justify-between">
              <span>找到 {searchResults.length} 条检索结果</span>
              <span className="text-[10px] font-normal text-zinc-400">点击结果直达页面</span>
            </div>

            <div className="overflow-y-auto p-2 space-y-1 divide-y divide-rose-50 dark:divide-slate-800/60">
              {searchResults.length > 0 ? (
                searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectResult(item)}
                    className="p-2.5 rounded-xl hover:bg-rose-50/80 dark:hover:bg-slate-800/90 transition-all cursor-pointer group flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-slate-800 group-hover:scale-105 transition-transform">
                        {getItemIcon(item.type)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-zinc-800 dark:text-slate-100 truncate group-hover:text-rose-600 dark:group-hover:text-rose-400">
                            {item.title}
                          </h4>
                          <span className="shrink-0 px-2 py-0.2 bg-rose-100/80 dark:bg-slate-800 text-rose-700 dark:text-rose-300 text-[10px] font-bold rounded-md">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-400 dark:text-slate-400 truncate mt-0.5 font-mono">
                          {item.subtitle}
                        </p>
                        {item.snippet && (
                          <p className="text-[11px] text-zinc-600 dark:text-slate-300 mt-1 line-clamp-1 bg-white/80 dark:bg-slate-800/50 p-1 rounded border border-rose-100/50 dark:border-slate-700/50 font-mono">
                            "{item.snippet}"
                          </p>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300 dark:text-slate-600 group-hover:text-rose-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-zinc-400 dark:text-slate-500 space-y-1">
                  <p className="font-bold">未找到相关档案或笔记内容</p>
                  <p className="text-[11px]">尝试更换关键词重新搜索（例: 个案姓名, 关键词, 督导师）</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 右侧控制栏 (主题切换、提醒中心、账号信息) */}
      <div className="flex flex-wrap items-center gap-3">
        {/* 日间/夜间主题切换 */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer border active:scale-95 shadow-2xs ${
              isDarkMode
                ? 'bg-slate-800 text-amber-300 border-amber-500/40 hover:bg-slate-700 hover:border-amber-400'
                : 'bg-rose-50 text-zinc-700 border-rose-200 hover:bg-rose-100 hover:text-rose-900'
            }`}
            title={isDarkMode ? '当前：夜间深色模式 (点击切换至日间浅色模式)' : '当前：日间浅色模式 (点击切换至夜间深色模式)'}
          >
            {isDarkMode ? (
              <>
                <Moon className="w-4 h-4 text-amber-300 fill-amber-300/30" />
                <span className="hidden sm:inline">夜间深色</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="hidden sm:inline">日间浅色</span>
              </>
            )}
          </button>
        )}

        {/* 顶部数据同步状态指示器 / 同步按钮 + 详情日志悬浮层 */}
        {onOpenSyncModal && (
          <div className="relative flex items-center" ref={syncPopoverRef}>
            <div className={`flex items-center rounded-xl overflow-hidden shadow-2xs border transition-all duration-300 ${
              hasConflict
                ? 'bg-amber-500 border-amber-400 text-white animate-pulse'
                : syncStatus === 'syncing'
                ? 'bg-rose-100/90 dark:bg-rose-950/80 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                : syncStatus === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                : syncStatus === 'error'
                ? 'bg-rose-50 dark:bg-slate-800 border-rose-300 dark:border-slate-700 text-rose-700 dark:text-rose-400'
                : 'bg-rose-50 dark:bg-slate-800/90 border-rose-200 dark:border-slate-700 text-zinc-700 dark:text-slate-200'
            }`}>
              {/* 主同步控制按钮 */}
              <button
                type="button"
                onClick={onOpenSyncModal}
                disabled={syncStatus === 'syncing'}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold transition-colors cursor-pointer active:scale-95"
                title={
                  hasConflict
                    ? '⚠️ 检测到本地与后台版本冲突，点击进行合并！'
                    : syncStatus === 'syncing'
                    ? '正在与云端实时同步数据...'
                    : syncStatus === 'success'
                    ? '云端数据同步成功 (已全端同步)'
                    : lastSyncTime || '点击手动触发全端云同步'
                }
              >
                {hasConflict ? (
                  <GitMerge className="w-4 h-4 text-white animate-bounce" />
                ) : syncStatus === 'syncing' ? (
                  <RefreshCw className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-spin shrink-0" />
                ) : syncStatus === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 scale-110" />
                ) : syncStatus === 'error' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                ) : (
                  <Cloud className="w-4 h-4 text-rose-500 dark:text-rose-400 shrink-0" />
                )}

                <span className="hidden sm:inline-flex items-center gap-1">
                  {hasConflict
                    ? '冲突待合并'
                    : syncStatus === 'syncing'
                    ? '同步中...'
                    : syncStatus === 'success'
                    ? '已同步云端'
                    : syncStatus === 'error'
                    ? '同步异常'
                    : '同步中心'}
                </span>

                {syncStatus === 'success' && (
                  <span className="flex h-2 w-2 relative ml-0.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}

                {hasConflict && (
                  <span className="ml-0.5 px-1.5 py-0.2 bg-rose-600 text-white font-extrabold text-[10px] rounded-full shadow-2xs">
                    待合并
                  </span>
                )}
              </button>

              {/* 详情日志 悬浮层触发按钮 */}
              <button
                type="button"
                onClick={() => setIsSyncDetailsOpen(!isSyncDetailsOpen)}
                className={`p-1.5 border-l transition-colors cursor-pointer ${
                  hasConflict
                    ? 'border-amber-400/50 hover:bg-amber-600 text-white'
                    : 'border-rose-200 dark:border-slate-700 text-zinc-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 hover:bg-rose-100 dark:hover:bg-slate-700'
                } ${isSyncDetailsOpen ? 'bg-rose-200/60 dark:bg-slate-700 text-rose-700 dark:text-rose-200' : ''}`}
                title="点击展开详情日志悬浮层：查看具体同步时间戳、设备终端与版本号"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 详情日志 悬浮层 (Popover Panel) */}
            {isSyncDetailsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 p-4 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-xs space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-rose-50 dark:bg-slate-800 rounded-lg text-rose-600 dark:text-rose-400">
                      <Cloud className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-zinc-800 dark:text-slate-100">
                        跨端同步详情日志
                      </h4>
                      <p className="text-[10px] text-zinc-400 dark:text-slate-400">
                        时间戳 / 设备终端 / 数据版本号
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSyncDetailsOpen(false)}
                    className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-200 rounded-lg transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Details List */}
                <div className="space-y-2 text-[11px]">
                  {/* 1. 具体同步时间戳 */}
                  <div className="p-2.5 bg-rose-50/70 dark:bg-slate-800/70 border border-rose-100/80 dark:border-slate-750 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-slate-200">
                        <Clock className="w-3.5 h-3.5 text-rose-500" />
                        <span>具体同步时间戳</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400">
                        {syncStatus === 'syncing' ? '同步中...' : '已对齐'}
                      </span>
                    </div>
                    <div className="text-zinc-800 dark:text-slate-200 font-mono font-bold truncate pl-5 text-[10px]">
                      {lastSyncTime || '已同步至本地快照 (实时上云就绪)'}
                    </div>
                  </div>

                  {/* 2. 最后操作设备信息 */}
                  <div className="p-2.5 bg-rose-50/70 dark:bg-slate-800/70 border border-rose-100/80 dark:border-slate-750 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-slate-200">
                        <Laptop className="w-3.5 h-3.5 text-blue-500" />
                        <span>最后操作设备终端</span>
                      </span>
                      <span className="text-[10px] font-mono font-bold text-blue-600 dark:text-blue-400">
                        ONLINE
                      </span>
                    </div>
                    <div className="text-zinc-800 dark:text-slate-200 font-mono font-bold truncate pl-5 text-[10px]">
                      {getDeviceInfo()}
                    </div>
                  </div>

                  {/* 3. 数据版本号与一致性校验 */}
                  <div className="p-2.5 bg-rose-50/70 dark:bg-slate-800/70 border border-rose-100/80 dark:border-slate-750 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 font-bold text-zinc-700 dark:text-slate-200">
                        <Tag className="w-3.5 h-3.5 text-emerald-500" />
                        <span>数据版本号 (Versioning)</span>
                      </span>
                      <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold rounded-md text-[10px]">
                        v{systemData.versioning || 1}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pl-5 pt-0.5">
                      <span className="text-zinc-500 dark:text-slate-400 text-[10px]">
                        跨端一致性校验:
                      </span>
                      <span className={`font-bold text-[10px] ${hasConflict ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {hasConflict ? '⚠️ 发现差异需处理' : '✅ 跨端版本号高度一致'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Button */}
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setIsSyncDetailsOpen(false);
                      onOpenSyncModal();
                    }}
                    className="w-full py-2 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-extrabold rounded-xl shadow-2xs transition cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>打开同步中心控制台</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 顶部提醒事项中心按钮 */}
        <button
          onClick={handleBellClick}
          className="relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold text-zinc-700 dark:text-slate-200 bg-rose-50 dark:bg-slate-800/90 hover:bg-rose-100 dark:hover:bg-slate-700 border border-rose-200 dark:border-slate-700 rounded-xl transition cursor-pointer active:scale-95 shadow-2xs"
          title="打开工作提醒与智能事项通知中心"
        >
          <Bell className="w-4 h-4 text-rose-500 dark:text-rose-400" />
          <span className="hidden sm:inline">提醒中心</span>
          {pendingRemindersCount > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 bg-rose-500 text-white font-extrabold text-[10px] rounded-full animate-pulse shadow-2xs">
              {pendingRemindersCount}
            </span>
          )}
        </button>

        {/* 当前登录用户身份标识卡片 */}
        {currentUser && (() => {
          const isPhoto = currentUser.avatar && (currentUser.avatar.startsWith('data:') || currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('https'));
          const displayName = currentUser.username || currentUser.name;
          return (
            <div className="flex items-center gap-2 bg-rose-50/80 dark:bg-slate-800/90 border border-rose-200 dark:border-slate-700 pl-2 pr-1.5 py-1 rounded-2xl shadow-2xs ml-1">
              {isPhoto ? (
                <img
                  src={currentUser.avatar}
                  alt={displayName}
                  className="w-7 h-7 rounded-full object-cover border border-rose-300 dark:border-rose-500 shadow-2xs"
                />
              ) : (
                <span className="text-base select-none">{currentUser.avatar || '🩺'}</span>
              )}
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-zinc-800 dark:text-slate-100 flex items-center gap-1 leading-tight">
                  <span>{displayName}</span>
                </div>
                <div className="text-[10px] text-rose-800 dark:text-rose-300 font-medium leading-tight">
                  {currentUser.title || '心理咨询师'}
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="ml-1 p-1.5 text-zinc-500 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition cursor-pointer border border-transparent hover:border-rose-200 dark:hover:border-slate-600"
                  title="退出当前登录账号"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })()}
      </div>

      {/* 提醒中心 Modal */}
      <ReminderModal
        isOpen={isReminderOpenInternal}
        onClose={() => setIsReminderOpenInternal(false)}
        systemData={systemData}
        onAddReminder={onAddReminder || (() => {})}
        onToggleReminder={onToggleReminder || (() => {})}
        onDeleteReminder={onDeleteReminder || (() => {})}
      />
    </header>
  );
};
