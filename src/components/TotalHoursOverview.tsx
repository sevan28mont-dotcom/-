import React, { useState } from 'react';
import { SystemData, SessionData, ParentSessionData } from '../types';
import { Clock, UserCheck, HeartHandshake, Pencil, Check, Plus, Sparkles, Trophy, FileText, Printer, Download, Copy, X, User, Users, Filter, ArrowRight } from 'lucide-react';

export type ViewCategory =
  | 'all'
  | 'shortTermPersonal'
  | 'shortTermAgency'
  | 'longTermActive'
  | 'longTermEnded'
  | 'individualSupervision'
  | 'groupSupervision'
  | 'individualExperience'
  | 'groupExperience';

interface TotalHoursOverviewProps {
  systemData: SystemData;
  onUpdateTotalHoursOverrides?: (newOverrides: Record<string, any>) => void;
  onNavigateTab?: (tab: string) => void;
}

export const TotalHoursOverview: React.FC<TotalHoursOverviewProps> = ({
  systemData,
  onUpdateTotalHoursOverrides,
  onNavigateTab,
}) => {
  const overrides = systemData.totalHoursOverrides || {};
  const [activeViewCategory, setActiveViewCategory] = useState<ViewCategory>('all');

  // 1. 分解计算各个细分个案的会谈数与时长
  const allRecords = systemData.records || [];
  const longTermRecords = allRecords.filter((r) => r.category === 'longTerm' || !r.category);
  const shortTermRecords = allRecords.filter((r) => r.category === 'shortTerm');

  const longTermActiveRecords = longTermRecords.filter((r) => r.status === 'active' || !r.status);
  const longTermEndedRecords = longTermRecords.filter((r) => r.status === 'ended');

  const shortTermPersonalRecords = shortTermRecords.filter((r) => r.shortTermType === 'personal' || !r.shortTermType);
  const shortTermAgencyRecords = shortTermRecords.filter((r) => r.shortTermType === 'agency');

  const calcCaseStats = (recordsList: typeof allRecords) => {
    return recordsList.reduce(
      (acc, rec) => {
        let recSessionCount = 0;
        let recSessionHours = 0;

        if (rec.sessions) {
          Object.values(rec.sessions).forEach((s: SessionData) => {
            if (s.completed || (s.note && s.note.trim()) || (s.transcript && s.transcript.trim()) || (s.ideas && s.ideas.length > 0) || (s.resources && s.resources.length > 0)) {
              recSessionCount++;
              recSessionHours += s.durationMinutes ? s.durationMinutes / 60 : 1;
            }
          });
        }
        if (rec.parentSessions) {
          Object.values(rec.parentSessions).forEach((ps: ParentSessionData) => {
            if (ps.completed !== false && (ps.date || (ps.note && ps.note.trim()) || (ps.transcript && ps.transcript.trim()))) {
              recSessionCount++;
              recSessionHours += ps.durationMinutes ? ps.durationMinutes / 60 : 1;
            }
          });
        }

        const targetSessions = rec.totalSessions || 0;
        const effectiveCount = Math.max(targetSessions, recSessionCount);
        const effectiveHours = Math.max(targetSessions, recSessionHours);

        acc.count += effectiveCount;
        acc.hours += effectiveHours;
        return acc;
      },
      { count: 0, hours: 0 }
    );
  };

  const { count: longTermActiveSessionsCount, hours: autoLongTermActiveHours } = calcCaseStats(longTermActiveRecords);
  const { count: longTermEndedSessionsCount, hours: autoLongTermEndedHours } = calcCaseStats(longTermEndedRecords);
  const { count: shortTermPersonalSessionsCount, hours: autoShortTermPersonalHours } = calcCaseStats(shortTermPersonalRecords);
  const { count: shortTermAgencySessionsCount, hours: autoShortTermAgencyHours } = calcCaseStats(shortTermAgencyRecords);

  const autoLongTermHours = autoLongTermActiveHours + autoLongTermEndedHours;
  const autoShortTermHours = autoShortTermPersonalHours + autoShortTermAgencyHours;
  const autoCalculatedCaseCount = longTermActiveSessionsCount + longTermEndedSessionsCount + shortTermPersonalSessionsCount + shortTermAgencySessionsCount;
  const autoCalculatedCaseHours = autoLongTermHours + autoShortTermHours;

  // 2. 自动计算督导总记录数与时长 (严格区分个体与团体督导类型)
  let individualSupervisionCount = 0;
  let groupSupervisionCount = 0;
  let individualSupervisionHours = 0;
  let groupSupervisionHours = 0;

  (systemData.mentors || []).forEach((mentor) => {
    let mGroupCount = 0;
    let mGroupHours = 0;
    let mIndivCount = 0;
    let mIndivHours = 0;

    (mentor.records || []).forEach((r) => {
      const dur = (r as any).durationMinutes
        ? (r as any).durationMinutes / 60
        : ((r as any).durationHours ? Number((r as any).durationHours) : 1);

      const isGroupRecord = r.type === 'group' || (!r.type && mentor.type === 'group');
      if (isGroupRecord) {
        mGroupCount++;
        mGroupHours += dur;
      } else {
        mIndivCount++;
        mIndivHours += dur;
      }
    });

    const targetQuota = mentor.totalSupervisions || 0;
    const hasRecords = (mentor.records || []).length > 0;

    if (!hasRecords) {
      if (mentor.type === 'group') {
        groupSupervisionCount += targetQuota;
        groupSupervisionHours += targetQuota;
      } else {
        individualSupervisionCount += targetQuota;
        individualSupervisionHours += targetQuota;
      }
    } else {
      if (mGroupCount > 0) {
        const effGroupCount = mentor.type === 'group' ? Math.max(mGroupCount, targetQuota) : mGroupCount;
        const effGroupHours = mentor.type === 'group' ? Math.max(mGroupHours, targetQuota) : mGroupHours;
        groupSupervisionCount += effGroupCount;
        groupSupervisionHours += effGroupHours;
      }
      if (mIndivCount > 0) {
        const effIndivCount = mentor.type !== 'group' ? Math.max(mIndivCount, targetQuota) : mIndivCount;
        const effIndivHours = mentor.type !== 'group' ? Math.max(mIndivHours, targetQuota) : mIndivHours;
        individualSupervisionCount += effIndivCount;
        individualSupervisionHours += effIndivHours;
      }
    }
  });
  const autoCalculatedSupervisionHours = individualSupervisionHours + groupSupervisionHours;
  const autoCalculatedSupervisionCount = individualSupervisionCount + groupSupervisionCount;

  // 3. 自动计算个人体验与团体体验总记录数与时长
  const expData = systemData.experienceData || systemData.personalExperience || {};
  const personalRecords = expData.records || [];
  const individualTherapists = expData.individualTherapists || [];
  const groupOptions = expData.groupOptions || [];

  let individualPunchedHours = 0;
  let individualPunchedCount = 0;
  let groupPunchedHours = 0;
  let groupPunchedCount = 0;

  personalRecords.forEach((r: any) => {
    const dur = r.durationMinutes ? r.durationMinutes / 60 : 1;
    if (r.type === 'group') {
      groupPunchedCount++;
      groupPunchedHours += dur;
    } else {
      individualPunchedCount++;
      individualPunchedHours += dur;
    }
  });

  const sumTherapistsHours = individualTherapists.reduce((sum: number, t: any) => sum + (Number(t.totalHours) || 0), 0);
  const totalIndivQuota = Number(expData.totalIndividualHours) || 0;
  const individualPersonalHours = Math.max(individualPunchedHours, sumTherapistsHours, totalIndivQuota);
  const individualPersonalCount = Math.max(individualPunchedCount, sumTherapistsHours, totalIndivQuota);

  const sumGroupHours = groupOptions.reduce((sum: number, g: any) => sum + (Number(g.totalHours) || 0), 0);
  const totalGroupQuota = Number(expData.totalGroupHours) || 0;
  const groupPersonalHours = Math.max(groupPunchedHours, sumGroupHours, totalGroupQuota);
  const groupPersonalCount = Math.max(groupPunchedCount, sumGroupHours, totalGroupQuota);

  const autoCalculatedPersonalHours = individualPersonalHours + groupPersonalHours;

  // 全局汇总展示值 (合并个案总时数，响应用户需求)
  const caseHours = overrides.caseHours !== undefined ? overrides.caseHours : (autoCalculatedCaseHours || autoCalculatedCaseCount);
  const supervisionHours = overrides.supervisionHours !== undefined ? overrides.supervisionHours : (autoCalculatedSupervisionHours || autoCalculatedSupervisionCount);
  const personalHours = overrides.personalExperienceHours !== undefined ? overrides.personalExperienceHours : autoCalculatedPersonalHours;

  // 细分独立的特定显示值
  const getCategoryStats = (categoryKey: ViewCategory) => {
    switch (categoryKey) {
      case 'shortTermPersonal': {
        const h = overrides.shortTermPersonalCaseHours !== undefined ? overrides.shortTermPersonalCaseHours : (autoShortTermPersonalHours || shortTermPersonalSessionsCount);
        return {
          title: '个人短程案例',
          hours: h,
          countLabel: '已登记档案',
          countValue: shortTermPersonalRecords.length,
          sessionsCount: shortTermPersonalSessionsCount,
          overrideKey: 'shortTermPersonalCaseHours',
          tabName: 'shortTermPersonal',
          colorBg: 'bg-purple-50 dark:bg-purple-950/40',
          colorBorder: 'border-purple-200 dark:border-purple-800',
          colorText: 'text-purple-900 dark:text-purple-200',
          badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-200',
        };
      }
      case 'shortTermAgency': {
        const h = overrides.shortTermAgencyCaseHours !== undefined ? overrides.shortTermAgencyCaseHours : (autoShortTermAgencyHours || shortTermAgencySessionsCount);
        return {
          title: '医院/机构短程案例',
          hours: h,
          countLabel: '已登记档案',
          countValue: shortTermAgencyRecords.length,
          sessionsCount: shortTermAgencySessionsCount,
          overrideKey: 'shortTermAgencyCaseHours',
          tabName: 'shortTermAgency',
          colorBg: 'bg-blue-50 dark:bg-blue-950/40',
          colorBorder: 'border-blue-200 dark:border-blue-800',
          colorText: 'text-blue-900 dark:text-blue-200',
          badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200',
        };
      }
      case 'longTermActive': {
        const h = overrides.longTermActiveCaseHours !== undefined ? overrides.longTermActiveCaseHours : (autoLongTermActiveHours || longTermActiveSessionsCount);
        return {
          title: '正在进行长程个案',
          hours: h,
          countLabel: '活跃档案人次',
          countValue: longTermActiveRecords.length,
          sessionsCount: longTermActiveSessionsCount,
          overrideKey: 'longTermActiveCaseHours',
          tabName: 'longTermActive',
          colorBg: 'bg-emerald-50 dark:bg-emerald-950/40',
          colorBorder: 'border-emerald-200 dark:border-emerald-800',
          colorText: 'text-emerald-900 dark:text-emerald-200',
          badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200',
        };
      }
      case 'longTermEnded': {
        const h = overrides.longTermEndedCaseHours !== undefined ? overrides.longTermEndedCaseHours : (autoLongTermEndedHours || longTermEndedSessionsCount);
        return {
          title: '终止/暂停个案',
          hours: h,
          countLabel: '结案/暂停人次',
          countValue: longTermEndedRecords.length,
          sessionsCount: longTermEndedSessionsCount,
          overrideKey: 'longTermEndedCaseHours',
          tabName: 'longTermEnded',
          colorBg: 'bg-amber-50 dark:bg-amber-950/40',
          colorBorder: 'border-amber-200 dark:border-amber-800',
          colorText: 'text-amber-900 dark:text-amber-200',
          badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200',
        };
      }
      case 'individualSupervision': {
        const h = overrides.individualSupervisionHours !== undefined ? overrides.individualSupervisionHours : individualSupervisionHours;
        return {
          title: '个体督导',
          hours: h,
          countLabel: '个体督导次数',
          countValue: individualSupervisionCount,
          sessionsCount: individualSupervisionCount,
          overrideKey: 'individualSupervisionHours',
          tabName: 'mentor',
          colorBg: 'bg-indigo-50 dark:bg-indigo-950/40',
          colorBorder: 'border-indigo-200 dark:border-indigo-800',
          colorText: 'text-indigo-900 dark:text-indigo-200',
          badgeColor: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/60 dark:text-indigo-200',
        };
      }
      case 'groupSupervision': {
        const h = overrides.groupSupervisionHours !== undefined ? overrides.groupSupervisionHours : groupSupervisionHours;
        return {
          title: '团体督导',
          hours: h,
          countLabel: '团体督导次数',
          countValue: groupSupervisionCount,
          sessionsCount: groupSupervisionCount,
          overrideKey: 'groupSupervisionHours',
          tabName: 'mentor',
          colorBg: 'bg-sky-50 dark:bg-sky-950/40',
          colorBorder: 'border-sky-200 dark:border-sky-800',
          colorText: 'text-sky-900 dark:text-sky-200',
          badgeColor: 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200',
        };
      }
      case 'individualExperience': {
        const h = overrides.individualExperienceHours !== undefined ? overrides.individualExperienceHours : individualPersonalHours;
        return {
          title: '个体体验',
          hours: h,
          countLabel: '个体体验次数',
          countValue: individualPersonalCount,
          sessionsCount: individualPersonalCount,
          overrideKey: 'individualExperienceHours',
          tabName: 'personalExperience',
          colorBg: 'bg-rose-50 dark:bg-rose-950/40',
          colorBorder: 'border-rose-200 dark:border-rose-800',
          colorText: 'text-rose-900 dark:text-rose-200',
          badgeColor: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200',
        };
      }
      case 'groupExperience': {
        const h = overrides.groupExperienceHours !== undefined ? overrides.groupExperienceHours : groupPersonalHours;
        return {
          title: '团体体验',
          hours: h,
          countLabel: '团体体验次数',
          countValue: groupPersonalCount,
          sessionsCount: groupPersonalCount,
          overrideKey: 'groupExperienceHours',
          tabName: 'personalExperience',
          colorBg: 'bg-pink-50 dark:bg-pink-950/40',
          colorBorder: 'border-pink-200 dark:border-pink-800',
          colorText: 'text-pink-900 dark:text-pink-200',
          badgeColor: 'bg-pink-100 text-pink-800 dark:bg-pink-900/60 dark:text-pink-200',
        };
      }
      default:
        return null;
    }
  };

  // 编辑模态/行内弹窗状态
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState<number | string>('');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleStartEdit = (key: string, currentValue: number) => {
    setEditingKey(key);
    setInputValue(currentValue);
  };

  const handleSaveEdit = (key: string) => {
    const num = Number(inputValue);
    if (isNaN(num) || num < 0) return;

    if (onUpdateTotalHoursOverrides) {
      onUpdateTotalHoursOverrides({ ...overrides, [key]: num });
    }
    setEditingKey(null);
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

  const selectedStats = getCategoryStats(activeViewCategory);

  return (
    <div className="mb-5 bg-gradient-to-r from-rose-100/90 via-pink-100/80 to-purple-100/90 dark:from-slate-800 dark:via-rose-950/40 dark:to-slate-900 text-zinc-900 dark:text-rose-100 rounded-2xl p-4 sm:p-5 shadow-sm border border-rose-200/90 dark:border-slate-700 relative overflow-hidden transition-colors">
      {/* 装饰背景 */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-rose-200/30 dark:bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-6 w-40 h-40 bg-purple-200/30 dark:bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* 顶部标题行与年度导出按钮 */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b border-rose-200/80 dark:border-slate-700 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-200/90 dark:bg-amber-400/20 text-rose-800 dark:text-amber-300 rounded-xl border border-rose-300/80 dark:border-amber-400/30 shadow-2xs">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-rose-950 dark:text-rose-50">
              总时数
            </h2>
            <p className="text-[11px] text-rose-700 dark:text-rose-300 font-medium">
              支持点击下方独立分类实时查看对应累计时长
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:flex text-xs font-semibold text-rose-800 dark:text-rose-200/90 items-center gap-1.5 bg-white/70 dark:bg-slate-800/80 px-3 py-1 rounded-full border border-rose-200/80 dark:border-slate-700">
            <Sparkles className="w-3.5 h-3.5 text-rose-500 dark:text-amber-300" />
            <span>实时独立计算</span>
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

      {/* 视图模式/分类快速切换选项 Bar */}
      <div className="relative z-10 mb-3.5">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs font-bold">
          <span className="text-[11px] text-rose-800 dark:text-rose-300 shrink-0 font-extrabold flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            <span>查看模式:</span>
          </span>

          <button
            type="button"
            onClick={() => setActiveViewCategory('all')}
            className={`px-3 py-1 rounded-full border transition shrink-0 cursor-pointer flex items-center gap-1 ${
              activeViewCategory === 'all'
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs font-black'
                : 'bg-white/80 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 border-rose-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700'
            }`}
          >
            <span>🌐 累计全局总时数</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewCategory('shortTermPersonal')}
            className={`px-2.5 py-1 rounded-full border transition shrink-0 cursor-pointer flex items-center gap-1 ${
              activeViewCategory === 'shortTermPersonal'
                ? 'bg-purple-600 text-white border-purple-600 shadow-2xs font-black'
                : 'bg-white/80 dark:bg-slate-800/80 text-purple-900 dark:text-purple-300 border-purple-200 dark:border-slate-700 hover:bg-purple-50'
            }`}
          >
            <span>👤 个人短程</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewCategory('shortTermAgency')}
            className={`px-2.5 py-1 rounded-full border transition shrink-0 cursor-pointer flex items-center gap-1 ${
              activeViewCategory === 'shortTermAgency'
                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-black'
                : 'bg-white/80 dark:bg-slate-800/80 text-blue-900 dark:text-blue-300 border-blue-200 dark:border-slate-700 hover:bg-blue-50'
            }`}
          >
            <span>🏥 医院机构短程</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewCategory('longTermActive')}
            className={`px-2.5 py-1 rounded-full border transition shrink-0 cursor-pointer flex items-center gap-1 ${
              activeViewCategory === 'longTermActive'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-black'
                : 'bg-white/80 dark:bg-slate-800/80 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-slate-700 hover:bg-emerald-50'
            }`}
          >
            <span>🟢 正在进行长程</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewCategory('longTermEnded')}
            className={`px-2.5 py-1 rounded-full border transition shrink-0 cursor-pointer flex items-center gap-1 ${
              activeViewCategory === 'longTermEnded'
                ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-black'
                : 'bg-white/80 dark:bg-slate-800/80 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-slate-700 hover:bg-amber-50'
            }`}
          >
            <span>⏸️ 终止/暂停个案</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewCategory('individualSupervision')}
            className={`px-2.5 py-1 rounded-full border transition shrink-0 cursor-pointer flex items-center gap-1 ${
              activeViewCategory === 'individualSupervision'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs font-black'
                : 'bg-white/80 dark:bg-slate-800/80 text-indigo-900 dark:text-indigo-300 border-indigo-200 dark:border-slate-700 hover:bg-indigo-50'
            }`}
          >
            <span>👨‍🏫 个体督导</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewCategory('groupSupervision')}
            className={`px-2.5 py-1 rounded-full border transition shrink-0 cursor-pointer flex items-center gap-1 ${
              activeViewCategory === 'groupSupervision'
                ? 'bg-sky-600 text-white border-sky-600 shadow-2xs font-black'
                : 'bg-white/80 dark:bg-slate-800/80 text-sky-900 dark:text-sky-300 border-sky-200 dark:border-slate-700 hover:bg-sky-50'
            }`}
          >
            <span>👥 团体督导</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewCategory('individualExperience')}
            className={`px-2.5 py-1 rounded-full border transition shrink-0 cursor-pointer flex items-center gap-1 ${
              activeViewCategory === 'individualExperience'
                ? 'bg-rose-600 text-white border-rose-600 shadow-2xs font-black'
                : 'bg-white/80 dark:bg-slate-800/80 text-rose-900 dark:text-rose-300 border-rose-200 dark:border-slate-700 hover:bg-rose-50'
            }`}
          >
            <span>🧘 个体体验</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveViewCategory('groupExperience')}
            className={`px-2.5 py-1 rounded-full border transition shrink-0 cursor-pointer flex items-center gap-1 ${
              activeViewCategory === 'groupExperience'
                ? 'bg-pink-600 text-white border-pink-600 shadow-2xs font-black'
                : 'bg-white/80 dark:bg-slate-800/80 text-pink-900 dark:text-pink-300 border-pink-200 dark:border-slate-700 hover:bg-pink-50'
            }`}
          >
            <span>👥 团体体验</span>
          </button>
        </div>
      </div>

      {/* 视图展现 Block */}
      {activeViewCategory === 'all' ? (
        /* 全局三项汇总 (个案总时数合并展示) */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 relative z-10">
          {/* 1. 个案总时数 */}
          <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-rose-200/80 dark:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between hover:border-rose-300 dark:hover:border-slate-600 transition shadow-2xs group min-h-[125px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>个案总时数</span>
              </span>
              <button
                type="button"
                onClick={() => handleStartEdit('caseHours', caseHours)}
                className="p-1 text-rose-600 dark:text-rose-300 hover:text-rose-900 hover:bg-rose-100 dark:hover:bg-slate-700 rounded-md transition cursor-pointer"
                title="设置/微调个案总时数"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-2">
              {editingKey === 'caseHours' ? (
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
                    onClick={() => handleSaveEdit('caseHours')}
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

                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-300 pt-1.5 border-t border-rose-100/80 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setActiveViewCategory('longTermActive')}
                      className="flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 cursor-pointer"
                    >
                      🟢 进行中: <strong className="font-mono">{longTermActiveRecords.length}</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveViewCategory('longTermEnded')}
                      className="flex items-center gap-1 text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 cursor-pointer"
                    >
                      ⏸️ 终止/暂停: <strong className="font-mono">{longTermEndedRecords.length}</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveViewCategory('shortTermPersonal')}
                      className="flex items-center gap-1 text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 cursor-pointer"
                    >
                      👤 个人短程: <strong className="font-mono">{shortTermPersonalRecords.length}</strong>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveViewCategory('shortTermAgency')}
                      className="flex items-center gap-1 text-blue-700 dark:text-blue-300 font-bold bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-800/60 hover:bg-blue-100 cursor-pointer"
                    >
                      🏥 机构短程: <strong className="font-mono">{shortTermAgencyRecords.length}</strong>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 2. 督导 */}
          <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-indigo-200/80 dark:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-slate-600 transition shadow-2xs group min-h-[125px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5 whitespace-nowrap">
                <UserCheck className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>督导总时数</span>
              </span>
              <button
                type="button"
                onClick={() => handleStartEdit('supervisionHours', supervisionHours)}
                className="p-1 text-indigo-600 dark:text-indigo-300 hover:text-indigo-900 hover:bg-indigo-100 dark:hover:bg-slate-700 rounded-md transition cursor-pointer"
                title="设置/微调督导总时数"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-2">
              {editingKey === 'supervisionHours' ? (
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
                    onClick={() => handleSaveEdit('supervisionHours')}
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

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 pt-1.5 border-t border-indigo-100/80 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setActiveViewCategory('individualSupervision')}
                      className="flex items-center gap-1 text-indigo-800 dark:text-indigo-300 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800/60 hover:bg-indigo-100 cursor-pointer"
                    >
                      个体督导: <strong className="font-mono">{individualSupervisionCount}</strong>次 ({individualSupervisionHours}h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveViewCategory('groupSupervision')}
                      className="flex items-center gap-1 text-sky-800 dark:text-sky-300 font-bold bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800/60 hover:bg-sky-100 cursor-pointer"
                    >
                      团体督导: <strong className="font-mono">{groupSupervisionCount}</strong>次 ({groupSupervisionHours}h)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3. 个人体验 */}
          <div className="bg-white/85 dark:bg-slate-800/85 backdrop-blur-md border border-amber-200/80 dark:border-slate-700 rounded-xl p-3.5 flex flex-col justify-between hover:border-amber-300 dark:hover:border-slate-600 transition shadow-2xs group min-h-[125px]">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 whitespace-nowrap">
                <HeartHandshake className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>个人体验总时数</span>
              </span>
              <button
                type="button"
                onClick={() => handleStartEdit('personalExperienceHours', personalHours)}
                className="p-1 text-amber-700 dark:text-amber-300 hover:text-amber-900 hover:bg-amber-100 dark:hover:bg-slate-700 rounded-md transition cursor-pointer"
                title="修改个人体验总时数"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>

            <div className="mt-2">
              {editingKey === 'personalExperienceHours' ? (
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
                    onClick={() => handleSaveEdit('personalExperienceHours')}
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

                  <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-slate-600 dark:text-slate-300 pt-1.5 border-t border-amber-100/80 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setActiveViewCategory('individualExperience')}
                      className="flex items-center gap-1 text-rose-800 dark:text-rose-300 font-bold bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-800/60 hover:bg-rose-100 cursor-pointer"
                    >
                      个体体验: <strong className="font-mono">{individualPersonalCount}</strong>次 ({individualPersonalHours}h)
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveViewCategory('groupExperience')}
                      className="flex items-center gap-1 text-pink-800 dark:text-pink-300 font-bold bg-pink-50 dark:bg-pink-950/60 px-1.5 py-0.5 rounded border border-pink-200 dark:border-pink-800/60 hover:bg-pink-100 cursor-pointer"
                    >
                      团体体验: <strong className="font-mono">{groupPersonalCount}</strong>次 ({groupPersonalHours}h)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : selectedStats ? (
        /* 选中单个分类独立呈现 block */
        <div className={`relative z-10 rounded-2xl p-4 border shadow-sm transition-all ${selectedStats.colorBg} ${selectedStats.colorBorder}`}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-black ${selectedStats.badgeColor}`}>
                当前独立分类视图
              </span>
              <h3 className={`text-lg font-black ${selectedStats.colorText}`}>
                {selectedStats.title}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStartEdit(selectedStats.overrideKey, selectedStats.hours)}
                className="px-3 py-1 bg-white/90 dark:bg-slate-800/90 hover:bg-white text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <Pencil className="w-3 h-3 text-rose-500" />
                <span>微调该分类专属累计时数</span>
              </button>

              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => onNavigateTab(selectedStats.tabName)}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <span>前往该模块明细</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-baseline gap-6 border-t border-slate-200/60 dark:border-slate-700/60 pt-3">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-0.5">
                【{selectedStats.title}】独立累计总时长
              </span>
              {editingKey === selectedStats.overrideKey ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-28 px-2 py-1 text-base font-bold text-slate-900 bg-white border border-rose-400 rounded-xl focus:outline-none"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(selectedStats.overrideKey)}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    保存修改
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingKey(null)}
                    className="px-2 py-1 bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    取消
                  </button>
                </div>
              ) : (
                <div className="text-3xl font-black font-mono text-slate-900 dark:text-white flex items-baseline gap-1">
                  {selectedStats.hours}
                  <span className="text-xs font-extrabold italic text-rose-600 dark:text-rose-400">小时</span>
                </div>
              )}
            </div>

            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-0.5">
                {selectedStats.countLabel}
              </span>
              <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
                {selectedStats.countValue} <span className="text-xs font-semibold text-slate-500">名/次</span>
              </div>
            </div>

            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block font-semibold mb-0.5">
                自动统计会谈记录总数
              </span>
              <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100">
                {selectedStats.sessionsCount} <span className="text-xs font-semibold text-slate-500">节</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

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

              {/* 四、自我体验概况 */}
              <div className="space-y-2">
                <h5 className="font-bold text-sm text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-amber-500" />
                  <span>四、自我体验与个人成长</span>
                </h5>
                <p>
                  个人体验记录总量: <strong className="font-bold">{personalRecords.length}</strong> 条 (其中个体体验: <strong className="text-amber-600">{individualPersonalCount}</strong> 次，团体体验: <strong className="text-amber-600">{groupPersonalCount}</strong> 次)。
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-rose-100 dark:border-slate-800 mt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadMarkdownReport}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>导出 Markdown (.md)</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
