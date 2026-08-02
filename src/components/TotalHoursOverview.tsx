import React, { useState } from 'react';
import { SystemData, SessionData, ParentSessionData } from '../types';
import { Clock, UserCheck, HeartHandshake, Pencil, Check, Plus, Sparkles, Trophy } from 'lucide-react';

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

  // 1. 自动计算个案总会谈数/时长
  const autoCalculatedCaseCount = (systemData.records || []).reduce((acc, rec) => {
    let completedCount = 0;
    if (rec.sessions) {
      Object.values(rec.sessions).forEach((s: SessionData) => {
        if (s.completed || s.note || s.transcript) {
          completedCount++;
        }
      });
    }
    // 加上父母访谈已完成数
    if (rec.parentSessions) {
      Object.values(rec.parentSessions).forEach((ps: ParentSessionData) => {
        if (ps.completed || ps.note || ps.transcript) {
          completedCount++;
        }
      });
    }
    return acc + completedCount;
  }, 0);

  // 2. 自动计算督导总记录数
  const autoCalculatedSupervisionCount = (systemData.mentors || []).reduce((acc, mentor) => {
    return acc + (mentor.records ? mentor.records.length : 0);
  }, 0);

  // 3. 自动计算个人体验总记录数与时长
  const personalRecords = systemData.personalExperience?.records || [];
  const autoCalculatedPersonalCount = personalRecords.length;
  const autoCalculatedPersonalHours = personalRecords.reduce((acc, r) => acc + (r.duration || 1), 0);

  // 默认体验时数 (若有录入记录则取自动累加值，否则为50小时预设值)
  const defaultPersonalExpHours = autoCalculatedPersonalHours > 0 ? autoCalculatedPersonalHours : 50;

  // 实际展示值（优先取用户手动设置，否则取自动统计）
  const caseHours = overrides.caseHours !== undefined ? overrides.caseHours : autoCalculatedCaseCount;
  const supervisionHours = overrides.supervisionHours !== undefined ? overrides.supervisionHours : autoCalculatedSupervisionCount;
  const personalHours = overrides.personalExperienceHours !== undefined ? overrides.personalExperienceHours : defaultPersonalExpHours;

  // 编辑模态/行内弹窗状态
  const [editingKey, setEditingKey] = useState<'case' | 'supervision' | 'personal' | null>(null);
  const [inputValue, setInputValue] = useState<number | string>('');

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

  return (
    <div className="mb-5 bg-gradient-to-r from-rose-900 via-rose-800 to-indigo-900 text-white rounded-2xl p-4 sm:p-5 shadow-md border border-rose-700/60 relative overflow-hidden">
      {/* 装饰背景水纹与徽章 */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-6 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

      {/* 顶部标题行 */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5 pb-2 border-b border-white/10 relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-400/20 text-amber-300 rounded-lg border border-amber-400/30">
            <Trophy className="w-4 h-4" />
          </div>
          <h2 className="text-sm sm:text-base font-extrabold tracking-tight text-rose-50 flex items-center gap-1.5">
            <span>临床专业资历积累 · 核心时数总览</span>
          </h2>
        </div>

        <span className="text-[11px] font-semibold text-rose-200/90 flex items-center gap-1 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>支持实时记录与自定义微调</span>
        </span>
      </div>

      {/* 三大时数高亮卡片 Block Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 relative z-10">
        {/* 1. 个案总时数 */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3.5 flex flex-col justify-between hover:bg-white/15 transition group">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-rose-200 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-rose-300" />
              <span>个案总时数</span>
            </span>
            <button
              type="button"
              onClick={() => handleStartEdit('case', caseHours)}
              className="p-1 text-rose-300 hover:text-white hover:bg-white/10 rounded-md transition cursor-pointer"
              title="设置/微调个案总时数"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-baseline justify-between gap-2 mt-1">
            {editingKey === 'case' ? (
              <div className="flex items-center gap-1.5 w-full mt-1">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-20 px-2 py-0.5 text-sm font-bold text-slate-900 bg-white rounded-lg focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit('case')}
                  className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  保存
                </button>
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white drop-shadow-2xs">
                  {caseHours} <span className="text-xs font-bold text-rose-200">小时</span>
                </div>
                <span className="text-[10px] text-rose-200/80">
                  (已完结 {autoCalculatedCaseCount} 节)
                </span>
              </>
            )}
          </div>
        </div>

        {/* 2. 督导总时数 */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3.5 flex flex-col justify-between hover:bg-white/15 transition group">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-indigo-300" />
              <span>督导总时数</span>
            </span>
            <button
              type="button"
              onClick={() => handleStartEdit('supervision', supervisionHours)}
              className="p-1 text-indigo-300 hover:text-white hover:bg-white/10 rounded-md transition cursor-pointer"
              title="设置/微调督导总时数"
            >
              <Pencil className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-baseline justify-between gap-2 mt-1">
            {editingKey === 'supervision' ? (
              <div className="flex items-center gap-1.5 w-full mt-1">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-20 px-2 py-0.5 text-sm font-bold text-slate-900 bg-white rounded-lg focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit('supervision')}
                  className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  保存
                </button>
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white drop-shadow-2xs">
                  {supervisionHours} <span className="text-xs font-bold text-indigo-200">小时</span>
                </div>
                <span className="text-[10px] text-indigo-200/80">
                  (已记录 {autoCalculatedSupervisionCount} 次)
                </span>
              </>
            )}
          </div>
        </div>

        {/* 3. 个人体验总时数 */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl p-3.5 flex flex-col justify-between hover:bg-white/15 transition group">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
              <HeartHandshake className="w-3.5 h-3.5 text-amber-300" />
              <span>个人体验总时数</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleAddPersonalHours(1)}
                className="px-1.5 py-0.5 bg-amber-400/30 hover:bg-amber-400/50 text-amber-100 rounded-md text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5"
                title="快捷增加1小时个人体验"
              >
                <Plus className="w-2.5 h-2.5" />
                <span>1h</span>
              </button>
              <button
                type="button"
                onClick={() => handleStartEdit('personal', personalHours)}
                className="p-1 text-amber-300 hover:text-white hover:bg-white/10 rounded-md transition cursor-pointer"
                title="修改个人体验总时数"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-baseline justify-between gap-2 mt-1">
            {editingKey === 'personal' ? (
              <div className="flex items-center gap-1.5 w-full mt-1">
                <input
                  type="number"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-20 px-2 py-0.5 text-sm font-bold text-slate-900 bg-white rounded-lg focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => handleSaveEdit('personal')}
                  className="px-2 py-0.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  保存
                </button>
              </div>
            ) : (
              <>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white drop-shadow-2xs">
                  {personalHours} <span className="text-xs font-bold text-amber-200">小时</span>
                </div>
                <span className="text-[10px] text-amber-200/80">
                  (体验成长积累)
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
