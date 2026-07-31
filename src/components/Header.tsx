import React, { useEffect, useState, useRef } from 'react';
import { Bell, LogOut, Sun, Moon, Search, X, FolderOpen, FileText, UserCheck, Brain, ArrowRight, Feather, Sparkles, Cloud, AlertTriangle, GitMerge } from 'lucide-react';
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
  hasConflict?: boolean;
  onNavigateTab?: (tab: ActiveTab) => void;
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
  hasConflict = false,
  onNavigateTab,
}) => {
  const [beijingTime, setBeijingTime] = useState<string>('');
  const [isReminderOpenInternal, setIsReminderOpenInternal] = useState(false);

  // 全局搜索状态
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

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
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-rose-200 dark:border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shadow-2xs z-30 transition-colors duration-300">
      {/* 左侧标头标题 */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-rose-100 via-pink-50 to-amber-100 dark:from-rose-950 dark:via-slate-800 dark:to-slate-900 border border-rose-200/80 dark:border-slate-700/80 rounded-2xl shadow-2xs flex items-center justify-center shrink-0 group transition-transform hover:scale-105">
          <Feather className="w-5 h-5 text-rose-500 dark:text-rose-400 group-hover:rotate-12 transition-transform duration-300" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-rose-800 via-rose-900 to-zinc-800 dark:from-rose-200 dark:via-rose-100 dark:to-slate-200 bg-clip-text text-transparent drop-shadow-2xs">
              记了个屁
            </h1>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100/90 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/80 shadow-2xs flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-rose-500" />
              <span>闹心工作台</span>
            </span>
          </div>
          <p className="text-xs font-semibold text-rose-600/90 dark:text-rose-400/90 flex items-center gap-1.5 mt-0.5">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>北京时间: {beijingTime || '加载中...'}</span>
          </p>
        </div>
      </div>

      {/* 中间：全局搜索栏 (支持检索个案、逐字稿、督导记录、反思笔记) */}
      <div ref={searchContainerRef} className="relative flex-1 max-w-md min-w-[260px]">
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

        {/* 顶部数据同步中心按钮 (包含冲突高亮提醒) */}
        {onOpenSyncModal && (
          <button
            onClick={onOpenSyncModal}
            className={`relative flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl transition cursor-pointer active:scale-95 shadow-2xs ${
              hasConflict
                ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse ring-2 ring-amber-400/60'
                : 'text-zinc-700 dark:text-slate-200 bg-rose-50 dark:bg-slate-800/90 hover:bg-rose-100 dark:hover:bg-slate-700 border border-rose-200 dark:border-slate-700'
            }`}
            title={hasConflict ? '⚠️ 检测到本地与后台版本冲突，点击进行合并！' : '打开云端同步中心与版本管理'}
          >
            {hasConflict ? (
              <GitMerge className="w-4 h-4 text-white animate-bounce" />
            ) : (
              <Cloud className="w-4 h-4 text-rose-500 dark:text-rose-400" />
            )}
            <span className="hidden sm:inline">
              {hasConflict ? '冲突待合并' : '同步中心'}
            </span>
            {hasConflict && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-rose-600 text-white font-extrabold text-[10px] rounded-full shadow-2xs">
                3 处
              </span>
            )}
          </button>
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
