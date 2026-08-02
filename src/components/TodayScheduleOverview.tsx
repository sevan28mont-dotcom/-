import React, { useState } from 'react';
import { ScheduleItem, ScheduleType, ScheduleCategory } from '../types';
import { Calendar, Clock, ChevronDown, ChevronUp, Plus, ArrowRight, CheckCircle2, Circle, Sparkles, ChevronLeft, ChevronRight, User, Check, Repeat } from 'lucide-react';
import { parseColorToStyle, getHexColor } from '../data/colorPalette';
import { ActiveTab } from './Sidebar';
import { formatRepeatRuleLabel } from './ScheduleManagement';

interface TodayScheduleOverviewProps {
  schedules: ScheduleItem[];
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenAddModal?: (dateStr: string) => void;
  onToggleComplete?: (id: string) => void;
}

const DEFAULT_CATEGORIES_MAP: Record<string, { label: string; color: string }> = {
  consult: { label: '个体咨询', color: '#f43f5e' },
  individual_supervision: { label: '个体督导', color: '#0284c7' },
  group_supervision: { label: '团体督导', color: '#4f46e5' },
  dynamic_group: { label: '动力团体', color: '#059669' },
  course: { label: '课程学习', color: '#d97706' },
};

export const TodayScheduleOverview: React.FC<TodayScheduleOverviewProps> = ({
  schedules = [],
  onNavigateTab,
  onOpenAddModal,
  onToggleComplete,
}) => {
  // 获取本地当前日期字符串 YYYY-MM-DD
  const getTodayLocalStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [selectedDateStr, setSelectedDateStr] = useState<string>(getTodayLocalStr);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const todayLocalStr = getTodayLocalStr();
  const isToday = selectedDateStr === todayLocalStr;

  // 格式化顶部显示日期与星期
  const getFormattedDateTitle = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const dateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        const weekDay = weekDays[dateObj.getDay()];
        return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日 ${weekDay}`;
      }
    } catch {
      // fallback
    }
    return dateStr;
  };

  // 切换日期 helper
  const handleShiftDate = (days: number) => {
    try {
      const parts = selectedDateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      d.setDate(d.getDate() + days);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setSelectedDateStr(`${y}-${m}-${day}`);
    } catch {
      setSelectedDateStr(getTodayLocalStr());
    }
  };

  // 筛选所选日期的日程
  const targetDaySchedules = schedules
    .filter((s) => s.dateStr === selectedDateStr)
    .sort((a, b) => {
      // 未完成排在前面，按时间排序
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      const timeA = a.timeStr || `${a.hour}:00`;
      const timeB = b.timeStr || `${b.hour}:00`;
      return timeA.localeCompare(timeB);
    });

  const completedCount = targetDaySchedules.filter((s) => s.completed).length;
  const totalCount = targetDaySchedules.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const getItemStyleAndLabel = (typeKey: ScheduleType) => {
    const matchedDef = DEFAULT_CATEGORIES_MAP[typeKey];
    if (matchedDef) {
      const { style, hex } = parseColorToStyle(matchedDef.color);
      return { label: matchedDef.label, style, hex };
    }
    // 自定义类型 fallback
    const { style, hex } = parseColorToStyle('#f43f5e');
    return { label: typeKey, style, hex };
  };

  return (
    <div className="mb-5 bg-white dark:bg-slate-800/90 border border-rose-200/80 dark:border-slate-700/80 rounded-2xl shadow-xs overflow-hidden transition-all duration-300">
      {/* 顶部标题卡片 Head Banner */}
      <div className="p-3 sm:p-4 bg-gradient-to-r from-rose-50/90 via-rose-100/40 to-white dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900 border-b border-rose-100 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
        {/* 左侧：日期标题与切换 */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-rose-500 text-white rounded-xl shadow-xs shrink-0 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>{isToday ? '今日日程概览' : '日程快速查看'}</span>
                {isToday && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-full shadow-2xs">
                    Today
                  </span>
                )}
              </h2>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 hidden sm:inline-block">
                ({getFormattedDateTitle(selectedDateStr)})
              </span>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>
                共 <strong className="text-rose-600 dark:text-rose-400 font-bold">{totalCount}</strong> 项
              </span>
              {totalCount > 0 && (
                <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/50">
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  已完成 {completedCount}/{totalCount} ({progressPercent}%)
                </span>
              )}
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                className="hover:text-rose-600 dark:hover:text-rose-400 px-1 py-0.5 rounded transition cursor-pointer flex items-center"
                title="前一天"
              >
                <ChevronLeft className="w-3 h-3" /> 前一天
              </button>
              {!isToday && (
                <button
                  type="button"
                  onClick={() => setSelectedDateStr(getTodayLocalStr())}
                  className="text-rose-600 dark:text-rose-400 font-bold hover:underline px-1 py-0.5 rounded transition cursor-pointer"
                >
                  回到今天
                </button>
              )}
              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                className="hover:text-rose-600 dark:hover:text-rose-400 px-1 py-0.5 rounded transition cursor-pointer flex items-center"
                title="后一天"
              >
                后一天 <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* 右侧：快捷按钮与折叠 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              onNavigateTab('schedule');
              if (onOpenAddModal) onOpenAddModal(selectedDateStr);
            }}
            className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-2xs transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>新增日程</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigateTab('schedule')}
            className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-rose-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl border border-rose-200 dark:border-slate-600 transition flex items-center gap-1 cursor-pointer"
          >
            <span>全量日程表</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-rose-100/50 dark:hover:bg-slate-700 rounded-lg transition cursor-pointer"
            title={isExpanded ? '折叠概览' : '展开概览'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 展开内容区列表 List */}
      {isExpanded && (
        <div className="p-3 sm:p-4">
          {targetDaySchedules.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {targetDaySchedules.map((item) => {
                const { label, hex } = getItemStyleAndLabel(item.type);
                const displayTime = item.timeStr || (item.hour < 10 ? `0${item.hour}:00` : `${item.hour}:00`);
                const isDone = Boolean(item.completed);

                return (
                  <div
                    key={item.id}
                    onClick={() => onNavigateTab('schedule')}
                    className={`p-3 rounded-xl border transition cursor-pointer group flex items-start justify-between gap-3 ${
                      isDone
                        ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                        : 'bg-white dark:bg-slate-800 hover:bg-rose-50/40 dark:hover:bg-slate-700/60 border-rose-100 dark:border-slate-700/80 shadow-2xs hover:shadow-md'
                    }`}
                  >
                    {/* 左侧勾选按钮 */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onToggleComplete) {
                          onToggleComplete(item.id);
                        }
                      }}
                      className={`mt-0.5 p-1 rounded-lg transition shrink-0 cursor-pointer flex items-center justify-center ${
                        isDone
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-2xs scale-105'
                          : 'text-slate-300 dark:text-slate-600 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                      title={isDone ? '标记为未完成' : '一键标记已完成'}
                    >
                      {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Circle className="w-4 h-4" />}
                    </button>

                    {/* 中间信息 */}
                    <div className="flex-1 min-w-0">
                      {/* 顶部分类 Badge 与时间卡片 */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[11px] font-bold text-white shadow-2xs flex items-center gap-1 shrink-0 ${
                              isDone ? 'line-through opacity-70' : ''
                            }`}
                            style={{ backgroundColor: hex }}
                          >
                            {label}
                          </span>
                          {item.repeatRule && item.repeatRule !== 'none' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-0.5 shrink-0" title={`重复规则: ${item.repeatRule}`}>
                              <Repeat className="w-2.5 h-2.5" />
                              <span>{formatRepeatRuleLabel(item.repeatRule)}</span>
                            </span>
                          )}
                        </div>

                        <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-200 bg-rose-50 dark:bg-slate-900/80 px-2 py-0.5 rounded-md border border-rose-200/60 dark:border-slate-700 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3 text-rose-500" />
                          <span>{displayTime}</span>
                        </span>
                      </div>

                      {/* 关联对象与主题 */}
                      <div className="flex items-center justify-between gap-1">
                        <div
                          className={`font-bold text-xs flex items-center gap-1.5 transition truncate ${
                            isDone
                              ? 'text-slate-400 dark:text-slate-500 line-through'
                              : 'text-slate-800 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400'
                          }`}
                        >
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{item.clientName || '自定对象 / 暂无指定'}</span>
                        </div>

                        {isDone && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-800 shrink-0">
                            已完成
                          </span>
                        )}
                      </div>

                      {/* 备注细节 */}
                      {item.detail && (
                        <p
                          className={`text-[11px] mt-1 line-clamp-2 pl-4 border-l-2 ${
                            isDone
                              ? 'text-slate-400 dark:text-slate-600 border-slate-300 dark:border-slate-800 line-through'
                              : 'text-slate-500 dark:text-slate-400 border-rose-200 dark:border-slate-700'
                          }`}
                        >
                          {item.detail}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 sm:p-6 text-center bg-rose-50/30 dark:bg-slate-900/30 rounded-xl border border-dashed border-rose-200 dark:border-slate-700/80 flex flex-col items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-rose-400 animate-pulse" />
              <div className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                {isToday ? '🎉 今天暂无已安排的咨询或督导任务' : `📅 ${selectedDateStr} 暂无排班记录`}
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                保持充实有序的高效节奏，点击上方“新增日程”按钮即可快速进行时间规划！
              </p>
              <button
                type="button"
                onClick={() => {
                  onNavigateTab('schedule');
                  if (onOpenAddModal) onOpenAddModal(selectedDateStr);
                }}
                className="mt-1 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>立即安排新任务</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

