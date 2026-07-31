import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  GitMerge,
  ArrowRightLeft,
  ShieldAlert,
  Database,
  FileDiff,
  Layers,
  Check,
  Zap,
  HelpCircle,
  Info,
  ChevronRight,
  HardDrive,
  Clock,
  Sparkles,
  ArrowDown,
  ArrowUp,
  Download,
  Upload,
} from 'lucide-react';
import { SystemData, CaseRecord, Supervisor, ThinkingNote } from '../types';

interface SyncCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemData: SystemData;
  onUpdateSystemData: (newData: SystemData) => void;
  lastSyncTime: string;
  setLastSyncTime: (time: string) => void;
  hasConflict: boolean;
  setHasConflict: (val: boolean) => void;
}

export interface ConflictItem {
  id: string;
  type: 'record' | 'mentor' | 'thinking';
  title: string;
  field: string;
  localTime: string;
  remoteTime: string;
  localValue: string;
  remoteValue: string;
  recommended: 'local' | 'remote' | 'merge';
}

export const SyncCenterModal: React.FC<SyncCenterModalProps> = ({
  isOpen,
  onClose,
  systemData,
  onUpdateSystemData,
  lastSyncTime,
  setLastSyncTime,
  hasConflict,
  setHasConflict,
}) => {
  // Sync steps and progress
  const [syncStage, setSyncStage] = useState<'idle' | 'checking' | 'conflict' | 'syncing' | 'success'>('idle');
  const [syncProgress, setSyncProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('准备就绪');
  const [activeTab, setActiveTab] = useState<'center' | 'conflicts' | 'guide' | 'settings'>('center');

  // Selected resolution strategy: 'smart' | 'local_first' | 'remote_first'
  const [globalStrategy, setGlobalStrategy] = useState<'smart' | 'local_first' | 'remote_first'>('smart');

  // Specific per-item resolution choices
  const [decisions, setDecisions] = useState<Record<string, 'local' | 'remote' | 'merge'>>({});

  // Mock Conflict Items
  const sampleConflicts: ConflictItem[] = [
    {
      id: 'conf_c1',
      type: 'record',
      title: '长程个案: 李先生 (C001)',
      field: '第3次会谈记录与总结',
      localTime: '今日 10:30 (本地最新编辑)',
      remoteTime: '今日 08:15 (云端历史快照)',
      localValue: '讨论亲密关系中的依恋模式，并补充了深层情绪评估与反思逐字稿摘要。',
      remoteValue: '讨论亲密关系中的依恋模式。',
      recommended: 'local',
    },
    {
      id: 'conf_m1',
      type: 'mentor',
      title: '督导师记录: 张教授 (C001绑定)',
      field: '督导要点与反思记录',
      localTime: '今日 09:40 (本地3条记录)',
      remoteTime: '昨日 18:20 (云端2条记录)',
      localValue: '新增督导反思: 导师建议注意拯救冲动，认知重构保持中立。',
      remoteValue: '暂无最新督导反思记录。',
      recommended: 'merge',
    },
    {
      id: 'conf_t1',
      type: 'thinking',
      title: '反思随笔: 关于精神分析中阻抗的思考',
      field: '随笔内容与分类标签',
      localTime: '今日 11:00 (本地版本)',
      remoteTime: '昨日 22:15 (云端版本)',
      localValue: '标签: [精神分析, 阻抗, 临床反思, 伪合作]',
      remoteValue: '标签: [精神分析, 阻抗]',
      recommended: 'local',
    },
  ];

  // Initialize per-item decisions based on recommendations
  useEffect(() => {
    const initDecisions: Record<string, 'local' | 'remote' | 'merge'> = {};
    sampleConflicts.forEach((item) => {
      initDecisions[item.id] = item.recommended;
    });
    setDecisions(initDecisions);
  }, []);

  if (!isOpen) return null;

  // Perform full sync animation with progress steps
  const handleStartFullSync = () => {
    setSyncStage('syncing');
    setSyncProgress(0);
    setCurrentStepText('Step 1/4: 建立安全 WebSocket/HTTP 云端链路...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      if (progress <= 25) {
        setSyncProgress(progress);
        setCurrentStepText('Step 1/4: 建立安全 WebSocket/HTTP 云端链路...');
      } else if (progress <= 50) {
        setSyncProgress(progress);
        setCurrentStepText('Step 2/4: 比对本地与云端数据哈希值及摘要版本...');
      } else if (progress <= 80) {
        setSyncProgress(progress);
        setCurrentStepText('Step 3/4: 执行冲突判定与智能增量合并中...');
      } else if (progress <= 95) {
        setSyncProgress(progress);
        setCurrentStepText('Step 4/4: 写入更新并保存云端同步快照...');
      } else {
        clearInterval(interval);
        setSyncProgress(100);
        setCurrentStepText('数据同步完成！数据已全量保持一致。');
        setSyncStage('success');
        setHasConflict(false);
        const timeNow = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        setLastSyncTime(`后台同步成功 ${timeNow}`);
      }
    }, 120);
  };

  // Perform Conflict Resolution
  const handleResolveAndMerge = () => {
    setSyncStage('syncing');
    setSyncProgress(0);
    setCurrentStepText('正在执行冲突合并决策...');

    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      if (progress <= 40) {
        setSyncProgress(progress);
        setCurrentStepText('正在按用户决策融合个案逐字稿与督导记录...');
      } else if (progress <= 80) {
        setSyncProgress(progress);
        setCurrentStepText('正在回写本地 LocalStorage 及发送同步云端数据包...');
      } else {
        clearInterval(interval);
        setSyncProgress(100);
        setCurrentStepText('冲突解决完成！版本已成功收敛归一。');
        setSyncStage('success');
        setHasConflict(false);
        const timeNow = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        setLastSyncTime(`版本冲突已合并 ${timeNow}`);
      }
    }, 150);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden my-auto transition-all">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 border-b border-rose-200/80 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white dark:bg-rose-600 rounded-2xl shadow-sm flex items-center justify-center">
              <Cloud className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg text-zinc-800 dark:text-slate-100 tracking-tight">
                  后台数据同步中心
                </h3>
                {hasConflict ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white animate-bounce shadow-2xs flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    <span>检测到版本不一致</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    <span>本地与云端已同步</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5 font-medium">
                云端多端同步、数据高能差分对比与冲突融合控制台
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-200 rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Highlight Alert Banner (当存在版本不一致时醒目高亮警示) */}
        {hasConflict && (
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 p-0.5 animate-pulse shrink-0">
            <div className="bg-amber-50 dark:bg-slate-900 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-amber-900 dark:text-amber-200 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-500 text-white rounded-lg shrink-0">
                  <ShieldAlert className="w-4 h-4 animate-spin-slow" />
                </div>
                <div>
                  <p className="font-extrabold text-sm flex items-center gap-2">
                    <span>⚠️ 发现本地档案与后台云端版本存在 3 处冲突</span>
                  </p>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                    可能是您在离线或其他设备上修改过档案。请点击下方的“冲突解决合并”处理差异。
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('conflicts')}
                className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1 shrink-0 active:scale-95"
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>查看差异并立即合并</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab Sub-Header */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-50/60 dark:bg-slate-900/60 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('center')}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'center'
                ? 'border-rose-600 text-rose-700 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Cloud className="w-4 h-4" />
            <span>同步进度与状态</span>
          </button>

          <button
            onClick={() => setActiveTab('conflicts')}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 relative ${
              activeTab === 'conflicts'
                ? 'border-amber-600 text-amber-700 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <GitMerge className="w-4 h-4" />
            <span>冲突项目与合并 (3)</span>
            {hasConflict && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping absolute top-2 right-2" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2.5 text-xs font-extrabold border-b-2 transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === 'guide'
                ? 'border-rose-600 text-rose-700 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>冲突解决指引</span>
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200 text-xs flex-1">
          {/* TAB 1: SYNCHRONIZATION CENTER & DETAILED PROGRESS BAR */}
          {activeTab === 'center' && (
            <div className="space-y-5">
              {/* Sync Dashboard Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-rose-50/70 dark:bg-slate-800/60 border border-rose-200/80 dark:border-slate-700 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 text-[11px] font-bold">
                    <span>本地版本状态</span>
                    <HardDrive className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <p className="text-sm font-black text-zinc-800 dark:text-slate-100">
                    {systemData.records.length} 个案 / {systemData.mentors.length} 督导
                  </p>
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold truncate">
                    格式: LocalStorage v8 沙盒
                  </p>
                </div>

                <div className="p-3.5 bg-amber-50/70 dark:bg-slate-800/60 border border-amber-200/80 dark:border-slate-700 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 text-[11px] font-bold">
                    <span>云端同步状态</span>
                    <Cloud className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                  <p className="text-sm font-black text-zinc-800 dark:text-slate-100">
                    {hasConflict ? '⚠️ 存在差异待处理' : '已完全同步保全'}
                  </p>
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold truncate">
                    {lastSyncTime}
                  </p>
                </div>

                <div className="p-3.5 bg-emerald-50/70 dark:bg-slate-800/60 border border-emerald-200/80 dark:border-slate-700 rounded-2xl space-y-1">
                  <div className="flex items-center justify-between text-zinc-500 dark:text-slate-400 text-[11px] font-bold">
                    <span>冲突诊断引擎</span>
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <p className="text-sm font-black text-zinc-800 dark:text-slate-100">
                    {hasConflict ? '3 项需要融合合并' : '无未决冲突项目'}
                  </p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                    默认支持智能三方合并
                  </p>
                </div>
              </div>

              {/* DETAILED SYNC PROGRESS BAR SECTION (详细同步进度条) */}
              <div className="p-5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-sm text-zinc-800 dark:text-slate-100">
                    <RefreshCw className={`w-4 h-4 text-rose-500 ${syncStage === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>云端数据同步与备份进度</span>
                  </div>
                  <span className="text-xs font-black font-mono px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-lg">
                    {syncProgress}%
                  </span>
                </div>

                {/* Progress Bar Track */}
                <div className="w-full h-3.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 border border-slate-300/60 dark:border-slate-600/60 relative">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 rounded-full transition-all duration-300 relative shadow-xs"
                    style={{ width: `${syncProgress}%` }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse rounded-full" />
                  </div>
                </div>

                {/* Progress Step Subtitle & Indicator */}
                <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-slate-400 font-medium">
                  <span className="flex items-center gap-1.5 text-zinc-700 dark:text-slate-200 font-bold">
                    <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                    <span>{currentStepText}</span>
                  </span>
                  <span className="font-mono text-zinc-400">
                    {syncProgress === 100 ? 'SUCCESS' : syncStage === 'syncing' ? 'IN_PROGRESS' : 'STANDBY'}
                  </span>
                </div>

                {/* Sync Action Controls */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={handleStartFullSync}
                    disabled={syncStage === 'syncing'}
                    className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 active:scale-98"
                  >
                    <RefreshCw className={`w-4 h-4 ${syncStage === 'syncing' ? 'animate-spin' : ''}`} />
                    <span>{syncStage === 'syncing' ? '正在进行后台同步...' : '重新检测并快速全量同步'}</span>
                  </button>

                  <button
                    onClick={() => setHasConflict(!hasConflict)}
                    className="py-2.5 px-3 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600 text-zinc-700 dark:text-slate-200 font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shrink-0"
                    title="点击可模拟或解除版本冲突高亮状态"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 text-amber-500" />
                    <span>{hasConflict ? '清空冲突模拟' : '触发冲突高亮测试'}</span>
                  </button>
                </div>
              </div>

              {/* Version History Log Timeline */}
              <div className="space-y-2">
                <h4 className="font-bold text-zinc-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-rose-500" />
                  <span>近期同步与备份日志记录</span>
                </h4>

                <div className="space-y-2 font-mono text-[11px]">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-zinc-600 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>[自动保存] 写入当前 LocalStorage 快照</span>
                    </span>
                    <span className="text-zinc-400">刚刚</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-zinc-600 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>[冲突检测] 发现本地与云端 3 处档案异动</span>
                    </span>
                    <span className="text-zinc-400">10分钟前</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-zinc-600 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>[云端保存] 执行后台 API `saveDataToBackend()` 预留校验</span>
                    </span>
                    <span className="text-zinc-400">昨天 18:30</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONFLICT RESOLUTION & ITEM DIFF MERGE (冲突合并面板) */}
          {activeTab === 'conflicts' && (
            <div className="space-y-5">
              {/* Conflict Header & Global Strategy Bar */}
              <div className="p-4 bg-amber-50 dark:bg-slate-800/90 border border-amber-200 dark:border-slate-700 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <GitMerge className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <h4 className="font-extrabold text-sm text-amber-900 dark:text-amber-200">
                        版本冲突合并决策中心
                      </h4>
                      <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
                        逐项对比本地修改与云端记录，选择保留项或执行智能融合：
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleResolveAndMerge}
                    className="px-4 py-2 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>应用决策并完成合并</span>
                  </button>
                </div>

                {/* Global preset strategy buttons */}
                <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                    一键预设策略:
                  </span>
                  <button
                    onClick={() => {
                      setGlobalStrategy('smart');
                      const newDec: Record<string, 'local' | 'remote' | 'merge'> = {};
                      sampleConflicts.forEach((i) => (newDec[i.id] = i.recommended));
                      setDecisions(newDec);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      globalStrategy === 'smart'
                        ? 'bg-amber-500 text-white shadow-2xs'
                        : 'bg-white/80 dark:bg-slate-700 text-amber-900 dark:text-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    ✨ 智能保留双端最新项
                  </button>
                  <button
                    onClick={() => {
                      setGlobalStrategy('local_first');
                      const newDec: Record<string, 'local' | 'remote' | 'merge'> = {};
                      sampleConflicts.forEach((i) => (newDec[i.id] = 'local'));
                      setDecisions(newDec);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      globalStrategy === 'local_first'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'bg-white/80 dark:bg-slate-700 text-zinc-700 dark:text-slate-200 hover:bg-rose-100'
                    }`}
                  >
                    📱 全局以本地为准
                  </button>
                  <button
                    onClick={() => {
                      setGlobalStrategy('remote_first');
                      const newDec: Record<string, 'local' | 'remote' | 'merge'> = {};
                      sampleConflicts.forEach((i) => (newDec[i.id] = 'remote'));
                      setDecisions(newDec);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      globalStrategy === 'remote_first'
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'bg-white/80 dark:bg-slate-700 text-zinc-700 dark:text-slate-200 hover:bg-blue-100'
                    }`}
                  >
                    ☁️ 全局以云端为准
                  </button>
                </div>
              </div>

              {/* Conflict Items Detailed Diff List */}
              <div className="space-y-4">
                {sampleConflicts.map((item, idx) => {
                  const currentDecision = decisions[item.id] || item.recommended;
                  return (
                    <div
                      key={item.id}
                      className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/80 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-black text-[10px] flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <h5 className="font-extrabold text-xs text-zinc-800 dark:text-slate-100">
                            {item.title}
                          </h5>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-zinc-600 dark:text-slate-300 text-[10px] font-bold rounded">
                            {item.field}
                          </span>
                        </div>

                        {/* Per item choice badge */}
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setDecisions({ ...decisions, [item.id]: 'local' })}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              currentDecision === 'local'
                                ? 'bg-rose-500 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            保留本地
                          </button>
                          <button
                            onClick={() => setDecisions({ ...decisions, [item.id]: 'remote' })}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              currentDecision === 'remote'
                                ? 'bg-blue-600 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            采用云端
                          </button>
                          <button
                            onClick={() => setDecisions({ ...decisions, [item.id]: 'merge' })}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                              currentDecision === 'merge'
                                ? 'bg-amber-500 text-white shadow-2xs'
                                : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            智能融合
                          </button>
                        </div>
                      </div>

                      {/* Visual Side-by-Side Diff Comparison */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Local Version Box */}
                        <div
                          onClick={() => setDecisions({ ...decisions, [item.id]: 'local' })}
                          className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                            currentDecision === 'local'
                              ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-400 dark:border-rose-600 ring-2 ring-rose-300/50'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-80'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <HardDrive className="w-3 h-3" />
                              <span>📱 本地手机/设备版本</span>
                            </span>
                            <span className="text-zinc-400 font-mono">{item.localTime}</span>
                          </div>
                          <p className="text-xs text-zinc-800 dark:text-slate-200 font-mono leading-relaxed bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-rose-100 dark:border-slate-800">
                            {item.localValue}
                          </p>
                        </div>

                        {/* Remote Version Box */}
                        <div
                          onClick={() => setDecisions({ ...decisions, [item.id]: 'remote' })}
                          className={`p-3 rounded-xl border transition cursor-pointer space-y-1.5 ${
                            currentDecision === 'remote'
                              ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-300/50'
                              : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-80'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-bold">
                            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <Cloud className="w-3 h-3" />
                              <span>☁️ 云端后台备份版本</span>
                            </span>
                            <span className="text-zinc-400 font-mono">{item.remoteTime}</span>
                          </div>
                          <p className="text-xs text-zinc-800 dark:text-slate-200 font-mono leading-relaxed bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-blue-100 dark:border-slate-800">
                            {item.remoteValue}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CONFLICT RESOLUTION GUIDE (冲突解决指引) */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50/70 dark:bg-slate-800/80 border border-rose-200 dark:border-slate-700 rounded-2xl space-y-2">
                <h4 className="font-extrabold text-sm text-rose-900 dark:text-rose-300 flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-rose-500" />
                  <span>为什么会产生版本不一致与数据冲突？</span>
                </h4>
                <p className="text-xs text-zinc-700 dark:text-slate-300 leading-relaxed">
                  当您在离线无网络状态下记录了新的会谈逐字稿或督导反思，或者在多台设备（例如手机与笔记本电脑）上同时编辑了同一个案例时，后台数据库会校验版本时间戳（Timestamp）与 Hash 摘要。检测到冲突时，系统会保护您的数据不被强制覆盖，并自动高亮提醒合并。
                </p>
              </div>

              {/* Step-by-Step Resolution Guide Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                  <div className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl w-fit font-bold text-xs flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>方式一：智能增量合并</span>
                  </div>
                  <h5 className="font-bold text-xs text-zinc-800 dark:text-slate-100">
                    自动拼接与保留最新字段
                  </h5>
                  <p className="text-[11px] text-zinc-500 dark:text-slate-400 leading-normal">
                    系统智能比对本地与云端的数据差异，保留两者中最新的新增逐字稿与督导反思，不丢失任何一端的长文记录。
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                  <div className="p-2 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-xl w-fit font-bold text-xs flex items-center gap-1">
                    <HardDrive className="w-3.5 h-3.5" />
                    <span>方式二：以本地版本为准</span>
                  </div>
                  <h5 className="font-bold text-xs text-zinc-800 dark:text-slate-100">
                    强制使用本地最新记录
                  </h5>
                  <p className="text-[11px] text-zinc-500 dark:text-slate-400 leading-normal">
                    若您确定当前设备上的记录是最全最新的，选择“以本地为准”将用本地缓存数据完整覆盖云端数据库。
                  </p>
                </div>

                <div className="p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 rounded-xl w-fit font-bold text-xs flex items-center gap-1">
                    <Cloud className="w-3.5 h-3.5" />
                    <span>方式三：以云端备份为准</span>
                  </div>
                  <h5 className="font-bold text-xs text-zinc-800 dark:text-slate-100">
                    恢复远程云端历史快照
                  </h5>
                  <p className="text-[11px] text-zinc-500 dark:text-slate-400 leading-normal">
                    若本地数据误删或损坏，选择“以云端为准”将下载远程服务器保存的标准卷宗替换本地副本。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-emerald-500" />
            <span className="hidden sm:inline font-semibold">云端数据多维同步保障已全面开启</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold rounded-xl transition cursor-pointer active:scale-95 shadow-2xs"
          >
            完成并关闭同步中心
          </button>
        </div>
      </div>
    </div>
  );
};
