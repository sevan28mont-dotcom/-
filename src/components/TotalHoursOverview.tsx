import React, { useState } from 'react';
import { SystemData, SessionData, ParentSessionData } from '../types';
import { Clock, UserCheck, HeartHandshake, Pencil, Check, Plus, Sparkles, Trophy, FileText, Printer, Download, Copy, X, User, Users } from 'lucide-react';

interface TotalHoursOverviewProps {
  systemData: SystemData;
  onUpdateTotalHoursOverrides?: (newOverrides: {
    caseHours?: number;
    supervisionHours?: number;
    personalExperienceHours?: number;
  }) => void;
}

export const TotalHoursOverview: React.FC<TotalHoursOverviewProps> = ({
  systemData,
  onUpdateTotalHoursOverrides,
}) => {
  const overrides = systemData.totalHoursOverrides || {};

  // 1. 自动计算个案总会谈数与时长 (精确计算所有已录入/已完成个体访谈与父母访谈之和)
  const { autoCalculatedCaseCount, autoCalculatedCaseHours } = (systemData.records || []).reduce(
    (acc, rec) => {
      if (rec.sessions) {
        Object.values(rec.sessions).forEach((s: SessionData) => {
          if (s.completed || s.note || s.transcript) {
            acc.autoCalculatedCaseCount++;
            acc.autoCalculatedCaseHours += s.durationMinutes ? s.durationMinutes / 60 : 1;
          }
        });
      }
      if (rec.parentSessions) {
        Object.values(rec.parentSessions).forEach((ps: ParentSessionData) => {
          if (ps.completed || ps.note || ps.transcript || ps.date) {
            acc.autoCalculatedCaseCount++;
            acc.autoCalculatedCaseHours += ps.durationMinutes ? ps.durationMinutes / 60 : 1;
          }
        });
      }
      return acc;
    },
    { autoCalculatedCaseCount: 0, autoCalculatedCaseHours: 0 }
  );

  // 2. 自动计算督导总记录数与时长 (自动汇总全系统个体督导与团体督导)
  let individualSupervisionCount = 0;
  let groupSupervisionCount = 0;
  let individualSupervisionHours = 0;
  let groupSupervisionHours = 0;

  (systemData.mentors || []).forEach((mentor) => {
    (mentor.records || []).forEach((r) => {
      const dur = (r as any).durationMinutes ? (r as any).durationMinutes / 60 : 1;
      if (r.type === 'group') {
        groupSupervisionCount++;
        groupSupervisionHours += dur;
      } else {
        individualSupervisionCount++;
        individualSupervisionHours += dur;
      }
    });
  });
  const autoCalculatedSupervisionHours = individualSupervisionHours + groupSupervisionHours;
  const autoCalculatedSupervisionCount = individualSupervisionCount + groupSupervisionCount;

  // 3. 自动计算个人体验总记录数与时长
  const personalRecords = systemData.personalExperience?.records || [];
  let individualPersonalHours = 0;
  let groupPersonalHours = 0;
  personalRecords.forEach((r) => {
    const dur = r.durationMinutes ? r.durationMinutes / 60 : 1;
    if (r.type === 'group') {
      groupPersonalHours += dur;
    } else {
      individualPersonalHours += dur;
    }
  });
  const autoCalculatedPersonalHours = individualPersonalHours + groupPersonalHours;

  // 实际展示值（优先取用户手动微调设置，否则根据系统所有实际记录全自动计算累加总和）
  const caseHours = overrides.caseHours !== undefined ? overrides.caseHours : (autoCalculatedCaseHours || autoCalculatedCaseCount);
  const supervisionHours = overrides.supervisionHours !== undefined ? overrides.supervisionHours : (autoCalculatedSupervisionHours || autoCalculatedSupervisionCount);
  const personalHours = overrides.personalExperienceHours !== undefined ? overrides.personalExperienceHours : autoCalculatedPersonalHours;

  // 编辑模态/行内弹窗状态
  const [editingKey, setEditingKey] = useState<'case' | 'supervision' | 'personal' | null>(null);
  const [inputValue, setInputValue] = useState<number | string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleStartEdit = (key: 'case' | 'supervision' | 'personal', currentValue: number) => {
    setEditingKey(key);
    setInputValue(currentValue);
  };

  const handleSaveEdit = (key: 'case' | 'supervision' | 'personal') => {
    const num = Number(inputValue);
    if (isNaN(num) || num < 0) return;

    if (onUpdateTotalHoursOverrides) {
      if (key === 'case') {
        onUpdateTotalHoursOverrides({ ...overrides, caseHours: num });
      } else if (key === 'supervision') {
        onUpdateTotalHoursOverrides({ ...overrides, supervisionHours: num });
      } else if (key === 'personal') {
        onUpdateTotalHoursOverrides({ ...overrides, personalExperienceHours: num });
      }
    }
    setEditingKey(null);
  };

  const handleAddPersonalHours = (delta: number) => {
    const newHours = Math.max(0, personalHours + delta);
    if (onUpdateTotalHoursOverrides) {
      onUpdateTotalHoursOverrides({ ...overrides, personalExperienceHours: newHours });
    }
  };

  // 生成年度 Markdown 总结报告
  const generateAnnualReportMarkdown = () => {
    const activeCases = (systemData.records || []).filter((r) => r.status === 'active');
    const endedCases = (systemData.records || []).filter((r) => r.status === 'ended');
    const mentorsCount = (systemData.mentors || []).length;
    const notesCount = (systemData.thinking || []).length;

    return `# 心理咨询师年度执业与专业成长总结报告

**生成时间**: ${new Date().toLocaleDateString('zh-CN')}  

---

## 📊 一、核心临床资历统计

- **个案咨询总时数**: ${caseHours} 小时 (${autoCalculatedCaseCount} 节次)
- **督导研讨总时数**: ${supervisionHours} 小时 (其中 **个体督导**: ${individualSupervisionCount} 次，**团体督导**: ${groupSupervisionCount} 次)
- **个人体验总时数**: ${personalHours} 小时 (其中 **个体体验**: ${individualPersonalHours} 小时，**团体体验**: ${groupPersonalHours} 小时)
- **记录心理反思随笔**: ${notesCount} 篇

---

## 📁 二、个案临床工作概况

- **活跃个案总数**: ${activeCases.length} 名
- **结案/暂停个案**: ${endedCases.length} 名
- **长程/短程个案汇总**: 共有 ${systemData.records?.length || 0} 名个案登记档案

---

## 👨‍🏫 三、督导与胜任力提升

- **合作督导导师数**: ${mentorsCount} 位
- **督导记录总条数**: ${autoCalculatedSupervisionCount} 条

---

## 🧘 四、自我体验与个人成长

- **个人体验总记录数**: ${personalRecords.length} 条
- **个体体验记录**: ${personalRecords.filter((r) => r.type === 'individual').length} 次
- **团体体验记录**: ${personalRecords.filter((r) => r.type === 'group').length} 次

---

## 💡 五、年度心理反思与顿悟摘录 (最新 5 篇)

${(systemData.thinking || [])
  .slice(0, 5)
  .map(
    (n, idx) => `### ${idx + 1}. ${n.title || '反思随笔'} (${n.time})
${n.content}
`
  )
  .join('\n')}

---
*本报告由心理咨询师工作区智能系统自动汇总生成*
`;
  };

  const handlePrintAnnualReport = () => {
    window.print();
  };

  const handleDownloadMarkdownReport = () => {
    const mdText = generateAnnualReportMarkdown();
    const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `心理咨询师年度执业总结报告_${new Date().toISOString().split('T')[0]}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mb-5 bg-gradient-to-r from-rose-100/90 via-pink-100/80 to-purple-100/90 dark:from-slate-800 dark:via-rose-950/40 dark:to-slate-900 text-zinc-900 dark:text-rose-100 rounded-2xl p-4 sm:p-5 shadow-sm border border-rose-200/90 dark:border-slate-700 relative overflow-hidden transition-colors">
      {/* 装饰背景 */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-rose-200/30 dark:bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-6 w-40 h-40 bg-purple-200/30 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* 顶部标题行与年度导出按钮 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-rose-200/80 dark:border-slate-700 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-200/90 dark:bg-amber-400/20 text-rose-800 dark:text-amber-300 rounded-xl border border-rose-300/80 dark:border-amber-400/30 shadow-2xs">
            <Trophy className="w-5 h-5" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-rose-950 dark:text-rose-50">
            总时数
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex text-xs font-semibold text-rose-800 dark:text-rose-200/90 items-center gap-1.5 bg-white/70 dark:bg-slate-800/80 px-3 py-1 rounded-full border border-rose-200/80 dark:border-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 dark:text-amber-300" />
            <span>实时数据汇总</span>
          </span>

          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
            title="自动汇总个案、督导、体验与反思笔记生成年度述职总结报告"
          >
            <FileText className="w-3.5 h-3.5 text-rose-100" />
            <span>📄 年度述职报告导出</span>
          </button>
        </div>
      </div>

      {/* 三大时数高亮卡片 Block Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative z-10">
        {/* 1. 个案 */}
        <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-rose-200/80 dark:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between hover:border-rose-300 dark:hover:border-slate-600 transition shadow-2xs group min-h-[105px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 whitespace-nowrap">
              <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>个案</span>
            </span>
            <button
              type="button"
              onClick={() => handleStartEdit('case', caseHours)}
              className="p-1 text-rose-600 dark:text-rose-300 hover:text-rose-900 hover:bg-rose-100 dark:hover:bg-slate-700 rounded-md transition cursor-pointer"
              title="设置/微调个案总时数"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-2">
            {editingKey === 'case' ? (
              <div className="flex items-center gap-1.5 w-full">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-20 px-2 py-0.5 text-sm font-bold text-slate-900 bg-white border border-rose-300 rounded-lg focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit('case')}
                  className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  保存
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-rose-950 dark:text-white flex items-baseline gap-1">
                  {caseHours}<span className="text-xs font-extrabold italic text-rose-700 dark:text-rose-300">/小时</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 2. 督导 */}
        <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-indigo-200/80 dark:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-slate-600 transition shadow-2xs group min-h-[105px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 whitespace-nowrap">
              <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span>督导</span>
            </span>
            <button
              type="button"
              onClick={() => handleStartEdit('supervision', supervisionHours)}
              className="p-1 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 hover:bg-indigo-100 dark:hover:bg-slate-700 rounded-md transition cursor-pointer"
              title="设置/微调督导总时数"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-2">
            {editingKey === 'supervision' ? (
              <div className="flex items-center gap-1.5 w-full">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-20 px-2 py-0.5 text-sm font-bold text-slate-900 bg-white border border-indigo-300 rounded-lg focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit('supervision')}
                  className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  保存
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-indigo-950 dark:text-white flex items-baseline gap-1">
                  {supervisionHours}<span className="text-xs font-extrabold italic text-indigo-700 dark:text-indigo-300">/小时</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 pt-1 border-t border-indigo-100/80 dark:border-slate-700/60">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                    <span>个体督导 <strong className="font-mono font-bold text-indigo-950 dark:text-indigo-200">{individualSupervisionCount}</strong>次</span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-300 dark:bg-indigo-600 shrink-0" />
                    <span>团体督导 <strong className="font-mono font-bold text-indigo-950 dark:text-indigo-200">{groupSupervisionCount}</strong>次</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. 个人体验 */}
        <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-amber-200/80 dark:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between hover:border-amber-300 dark:hover:border-slate-600 transition shadow-2xs group min-h-[105px]">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 whitespace-nowrap">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>个人体验</span>
            </span>
            <button
              type="button"
              onClick={() => handleStartEdit('personal', personalHours)}
              className="p-1 text-amber-700 dark:text-amber-300 hover:text-amber-900 hover:bg-amber-100 dark:hover:bg-slate-700 rounded-md transition cursor-pointer"
              title="修改个人体验总时数"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>

          <div className="mt-2">
            {editingKey === 'personal' ? (
              <div className="flex items-center gap-1.5 w-full">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-20 px-2 py-0.5 text-sm font-bold text-slate-900 bg-white border border-amber-300 rounded-lg focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit('personal')}
                  className="px-2.5 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  保存
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-amber-950 dark:text-white flex items-baseline gap-1">
                  {personalHours}<span className="text-xs font-extrabold italic text-amber-700 dark:text-amber-300">/小时</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 dark:text-slate-300 pt-1 border-t border-amber-100/80 dark:border-slate-700/60">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0" />
                    <span>个体体验 <strong className="font-mono font-bold text-amber-950 dark:text-amber-200">{individualPersonalHours}</strong></span>
                  </span>
                  <span className="text-slate-300 dark:text-slate-600">|</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-300 dark:bg-amber-600 shrink-0" />
                    <span>团体体验 <strong className="font-mono font-bold text-amber-950 dark:text-amber-200">{groupPersonalHours}</strong></span>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 年度述职总结报告 Modal */}
      {isExportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-slate-800 rounded-2xl p-5 sm:p-6 max-w-3xl w-full shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  年度述职与执业总结报告预览
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scroll Content (Print Target) */}
            <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-xs text-slate-800 dark:text-slate-200">
              <div className="p-4 bg-rose-50/60 dark:bg-slate-800/60 border border-rose-200 dark:border-slate-700 rounded-2xl space-y-2">
                <h4 className="text-base font-black text-rose-950 dark:text-rose-200 text-center border-b border-rose-200/60 dark:border-slate-700 pb-2">
                  心理咨询师年度执业与专业成长总结报告
                </h4>
                <p className="text-[11px] text-zinc-500 dark:text-slate-400 text-center">
                  统计周期: 年度汇总 · 生成时间: {new Date().toLocaleDateString('zh-CN')}
                </p>
              </div>

              {/* 核心数据总结 Table */}
              <div className="space-y-2">
                <h5 className="font-bold text-sm text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span>一、核心临床专业资历</span>
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-zinc-500 block">个案咨询总时数</span>
                    <strong className="text-base text-rose-600 font-mono">{caseHours} 小时</strong>
                    <span className="text-[10px] text-zinc-400 block">({autoCalculatedCaseCount} 节已记录)</span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-zinc-500 block">督导研讨总时数</span>
                    <strong className="text-base text-indigo-600 font-mono">{supervisionHours} 小时</strong>
                    <span className="text-[10px] text-zinc-400 block">
                      (个体: {individualSupervisionCount} 次 / 团体: {groupSupervisionCount} 次)
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="text-zinc-500 block">个人体验总时数</span>
                    <strong className="text-base text-amber-600 font-mono">{personalHours} 小时</strong>
                    <span className="text-[10px] text-zinc-400 block">
                      (个体: {individualPersonalHours}h / 团体: {groupPersonalHours}h)
                    </span>
                  </div>
                </div>
              </div>

              {/* 二、个案临床概况 */}
              <div className="space-y-2">
                <h5 className="font-bold text-sm text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-500" />
                  <span>二、个案临床工作发展概况</span>
                </h5>
                <p>
                  年度登记个案总量: <strong className="font-bold">{systemData.records?.length || 0}</strong> 名 (其中正在进行/活跃: <strong className="text-emerald-600">{systemData.records?.filter((r) => r.status === 'active').length || 0}</strong> 名，已结案/暂停: <strong className="text-amber-600">{systemData.records?.filter((r) => r.status === 'ended').length || 0}</strong> 名)。
                </p>
              </div>

              {/* 三、督导概况 */}
              <div className="space-y-2">
                <h5 className="font-bold text-sm text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-indigo-500" />
                  <span>三、督导与胜任力提升概况</span>
                </h5>
                <p>
                  绑定合作督导导师: <strong className="font-bold">{systemData.mentors?.length || 0}</strong> 位，累计进行督导研讨 <strong className="font-bold">{autoCalculatedSupervisionCount}</strong> 条档案。
                </p>
              </div>

              {/* 四、个人体验概况 */}
              <div className="space-y-2">
                <h5 className="font-bold text-sm text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-amber-500" />
                  <span>四、自我体验与个人成长</span>
                </h5>
                <p>
                  完成个体体验与团体体验记录共 <strong className="font-bold">{personalRecords.length}</strong> 条。
                </p>
              </div>

              {/* 五、心理反思与专业顿悟摘要 */}
              <div className="space-y-2">
                <h5 className="font-bold text-sm text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>五、心理反思与顿悟随笔精华 ({systemData.thinking?.length || 0} 篇)</span>
                </h5>
                <div className="space-y-2">
                  {(systemData.thinking || []).slice(0, 3).map((note) => (
                    <div key={note.id} className="p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                      <div className="font-bold text-zinc-800 dark:text-slate-100 mb-1 flex justify-between">
                        <span>{note.title || '无标题反思'}</span>
                        <span className="text-[10px] text-zinc-400 font-normal">{note.time}</span>
                      </div>
                      <p className="line-clamp-3 text-[11px] text-zinc-600 dark:text-slate-300 leading-relaxed">
                        {note.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-rose-100 dark:border-slate-800 pt-3 mt-3">
              <button
                type="button"
                onClick={handleDownloadMarkdownReport}
                className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-blue-500" />
                <span>下载 Markdown 报告</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={handlePrintAnnualReport}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-rose-100" />
                  <span>打印 / 导出 PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

