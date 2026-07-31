import React, { useState, useEffect } from 'react';
import { ScheduleItem, ScheduleType, CaseRecord, Supervisor, ScheduleCategory } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Clock, X, Search, Tag, Settings, Sparkles, Palette } from 'lucide-react';
import { COLOR_GROUPS, parseColorToStyle, getHexColor } from '../data/colorPalette';
import { VoiceInputButton } from './VoiceInputButton';

interface ScheduleManagementProps {
  schedules: ScheduleItem[];
  cases: CaseRecord[];
  mentors: Supervisor[];
  onAddSchedule: (newItem: Omit<ScheduleItem, 'id'>) => void;
  onUpdateSchedule: (id: string, updated: Omit<ScheduleItem, 'id'>) => void;
  onDeleteSchedule: (id: string) => void;
}

type Dimension = 'day' | 'week' | 'month' | 'year';

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const DEFAULT_CATEGORIES: ScheduleCategory[] = [
  { id: 'consult', name: '个体咨询', color: '#f43f5e', isSystem: true },
  { id: 'individual_supervision', name: '个体督导', color: '#0284c7', isSystem: true },
  { id: 'group_supervision', name: '团体督导', color: '#4f46e5', isSystem: true },
  { id: 'course', name: '团体督导上课', color: '#059669', isSystem: true },
  { id: 'dynamic_group', name: '动力团体', color: '#d97706', isSystem: false },
];

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({
  schedules,
  cases,
  mentors,
  onAddSchedule,
  onUpdateSchedule,
  onDeleteSchedule,
}) => {
  const [dimension, setDimension] = useState<Dimension>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');

  // 时间范围筛选器 ('all' | 'this_week' | 'this_month' | 'next_7_days')
  type TimeRangeFilter = 'all' | 'this_week' | 'this_month' | 'next_7_days';
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('all');

  // 计算时间范围对应的起止日期 (YYYY-MM-DD)
  const getTimeRangeBounds = () => {
    if (timeRange === 'all') return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (timeRange === 'this_week') {
      const dayOfWeek = today.getDay(); // 0 是周日
      const monday = new Date(today);
      monday.setDate(today.getDate() - ((dayOfWeek + 6) % 7));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return {
        start: formatDateKey(monday),
        end: formatDateKey(sunday),
      };
    }

    if (timeRange === 'this_month') {
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      return {
        start: formatDateKey(startOfMonth),
        end: formatDateKey(endOfMonth),
      };
    }

    if (timeRange === 'next_7_days') {
      const end7Days = new Date(today);
      end7Days.setDate(today.getDate() + 6);
      return {
        start: formatDateKey(today),
        end: formatDateKey(end7Days),
      };
    }

    return null;
  };

  // 自定义日程类型持久化
  const [categories, setCategories] = useState<ScheduleCategory[]>(() => {
    try {
      const raw = localStorage.getItem('psy_schedule_categories_v2');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load categories', e);
    }
    return DEFAULT_CATEGORIES;
  });

  useEffect(() => {
    try {
      localStorage.setItem('psy_schedule_categories_v2', JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to save categories', e);
    }
  }, [categories]);

  // 分类管理 Modal 状态
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#f43f5e');
  const [activePaletteTab, setActivePaletteTab] = useState(0);

  // 添加新日程分类处理
  const handleAddCategory = () => {
    if (!newCatName.trim()) return;
    const trimmed = newCatName.trim();
    if (categories.some((c) => c.name === trimmed)) {
      alert('已存在相同名称的日程类型！');
      return;
    }
    const created: ScheduleCategory = {
      id: 'cat_' + Date.now(),
      name: trimmed,
      color: newCatColor || '#f43f5e',
      isSystem: false,
    };
    setCategories((prev) => [...prev, created]);
    setNewCatName('');
  };

  const handleDeleteCategory = (catId: string) => {
    const target = categories.find((c) => c.id === catId);
    if (!target) return;
    if (target.isSystem) {
      alert('系统默认基础分类无法删除！');
      return;
    }
    if (confirm(`确定要删除“${target.name}”分类吗？历史日程中使用的分类名称依然会保留。`)) {
      setCategories((prev) => prev.filter((c) => c.id !== catId));
    }
  };

  // 根据类型 key 或 名称 获取色彩与标签
  const getTypeStyleAndLabel = (type: ScheduleType) => {
    // 匹配 key 或 名称
    const matched = categories.find((c) => c.id === type || c.name === type);
    const label = matched ? matched.name : type;
    const colorKey = matched ? matched.color : '#f43f5e';
    const { style, hex } = parseColorToStyle(colorKey);

    return { style, label, hex };
  };

  // 搜索和时间范围筛选
  const rangeBounds = getTimeRangeBounds();

  const filteredSchedules = schedules.filter((s) => {
    // 1. 时间范围筛选
    if (rangeBounds) {
      if (s.dateStr < rangeBounds.start || s.dateStr > rangeBounds.end) {
        return false;
      }
    }

    // 2. 关键词搜索
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const clientNameMatch = s.clientName?.toLowerCase().includes(q);
    const detailMatch = s.detail?.toLowerCase().includes(q);

    // 匹配分类名称
    const categoryInfo = getTypeStyleAndLabel(s.type);
    const typeMatch = categoryInfo.label.toLowerCase().includes(q) || s.type.toLowerCase().includes(q);

    const caseMatch = cases.some(
      (c) =>
        (c.name.toLowerCase().includes(q) || c.caseNum.toLowerCase().includes(q)) &&
        s.clientName?.includes(c.name)
    );

    const mentorMatch = mentors.some(
      (m) =>
        m.name.toLowerCase().includes(q) &&
        (s.clientName?.includes(m.name) || s.detail?.includes(m.name))
    );

    return clientNameMatch || detailMatch || typeMatch || caseMatch || mentorMatch;
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
  const [formDateStr, setFormDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [formHour, setFormHour] = useState<number>(10);
  const [formType, setFormType] = useState<ScheduleType>('consult');
  const [formClientName, setFormClientName] = useState('');
  const [formDetail, setFormDetail] = useState('');

  const formatDateKey = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const navigatePeriod = (direction: number) => {
    const d = new Date(currentDate);
    if (dimension === 'day') {
      d.setDate(d.getDate() + direction);
    } else if (dimension === 'week') {
      d.setDate(d.getDate() + direction * 7);
    } else if (dimension === 'month') {
      d.setMonth(d.getMonth() + direction);
    } else if (dimension === 'year') {
      d.setFullYear(d.getFullYear() + direction);
    }
    setCurrentDate(d);
  };

  const handleGoToToday = () => {
    setCurrentDate(new Date());
  };

  const handleOpenModal = (dateStr: string, hour: number, scheduleId?: string) => {
    setFormDateStr(dateStr);
    setFormHour(hour);

    if (scheduleId) {
      const existing = schedules.find((s) => s.id === scheduleId);
      if (existing) {
        setSelectedScheduleId(scheduleId);
        setFormType(existing.type);
        setFormClientName(existing.clientName || '');
        setFormDetail(existing.detail || '');
      }
    } else {
      setSelectedScheduleId(null);
      setFormType('consult');
      setFormClientName(cases[0] ? `${cases[0].caseNum} ${cases[0].name}` : '');
      setFormDetail('');
    }

    setModalOpen(true);
  };

  const handleSaveModal = () => {
    if (!formDateStr) {
      alert('请选择有效的日期！');
      return;
    }

    const itemData = {
      dateStr: formDateStr,
      hour: formHour,
      type: formType,
      clientName: formType === 'consult' ? formClientName : formClientName,
      detail: formDetail,
    };

    if (selectedScheduleId) {
      onUpdateSchedule(selectedScheduleId, itemData);
    } else {
      onAddSchedule(itemData);
    }

    setModalOpen(false);
  };

  const handleDeleteCurrentModalSchedule = () => {
    if (selectedScheduleId) {
      onDeleteSchedule(selectedScheduleId);
      setModalOpen(false);
    }
  };

  // Render Schedule Grid according to view dimension
  const renderScheduleGrid = () => {
    if (dimension === 'day') {
      const dateStr = formatDateKey(currentDate);
      return (
        <div className="bg-white rounded-xl border border-rose-200 overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-rose-100/80 border-b border-rose-200 text-rose-950 font-bold">
                <th className="p-3 w-28 text-center border-r border-rose-200">时间段</th>
                <th className="p-3">日程安排 (点击空白添加)</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 14 }, (_, i) => i + 8).map((hour) => {
                const hourStr = hour < 10 ? `0${hour}:00` : `${hour}:00`;
                const hourItems = filteredSchedules.filter((s) => s.dateStr === dateStr && s.hour === hour);

                return (
                  <tr key={hour} className="border-b border-rose-100 hover:bg-rose-50/40 transition">
                    <td className="p-3 font-bold text-slate-700 bg-rose-50/30 text-center border-r border-rose-200">
                      {hourStr}
                    </td>
                    <td
                      onClick={() => handleOpenModal(dateStr, hour)}
                      className="p-2 cursor-pointer min-h-[50px] align-top"
                    >
                      <div className="space-y-1.5">
                        {hourItems.map((item) => {
                          const { style, label } = getTypeStyleAndLabel(item.type);
                          return (
                            <div
                              key={item.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(dateStr, hour, item.id);
                              }}
                              style={style}
                              className="p-2 rounded-lg text-xs shadow-2xs font-medium cursor-pointer hover:opacity-90 transition"
                            >
                              <div className="font-bold">
                                [{label}] {item.clientName || '自定对象'}
                              </div>
                              {item.detail && <div className="text-[11px] opacity-80 mt-0.5">{item.detail}</div>}
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (dimension === 'week') {
      const curr = new Date(currentDate);
      const day = curr.getDay();
      const diffToMonday = curr.getDate() - day + (day === 0 ? -6 : 1);

      const monday = new Date(curr.setDate(diffToMonday));
      const weekDates: Date[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        weekDates.push(d);
      }

      return (
        <div className="bg-white rounded-xl border border-rose-200 overflow-x-auto shadow-2xs">
          <table className="w-full text-center text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-rose-100/80 border-b border-rose-200 text-rose-950 font-bold">
                <th className="p-2.5 w-20 border-r border-rose-200">时间</th>
                {weekDates.map((d, idx) => (
                  <th key={idx} className="p-2 border-r border-rose-200 last:border-r-0">
                    <div>{DAYS[d.getDay()]}</div>
                    <div className="text-[11px] font-normal text-rose-800">
                      {d.getMonth() + 1}/{d.getDate()}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 14 }, (_, i) => i + 8).map((hour) => {
                const hourStr = hour < 10 ? `0${hour}:00` : `${hour}:00`;

                return (
                  <tr key={hour} className="border-b border-rose-100 hover:bg-rose-50/20 transition">
                    <td className="p-2 font-bold text-slate-700 bg-rose-50/30 border-r border-rose-200">
                      {hourStr}
                    </td>

                    {weekDates.map((d, idx) => {
                      const dateStr = formatDateKey(d);
                      const items = filteredSchedules.filter((s) => s.dateStr === dateStr && s.hour === hour);

                      return (
                        <td
                          key={idx}
                          onClick={() => handleOpenModal(dateStr, hour)}
                          className="p-1.5 border-r border-rose-100 last:border-r-0 align-top cursor-pointer min-h-[50px] hover:bg-rose-50/40"
                        >
                          <div className="space-y-1">
                            {items.map((item) => {
                              const { style, label } = getTypeStyleAndLabel(item.type);
                              return (
                                <div
                                  key={item.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenModal(dateStr, hour, item.id);
                                  }}
                                  style={style}
                                  className="p-1.5 rounded text-[11px] text-left leading-tight shadow-2xs font-semibold cursor-pointer hover:opacity-90"
                                >
                                  <div>[{label}]</div>
                                  <div className="truncate">{item.clientName || item.detail || '已安排'}</div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (dimension === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);

      let startingDay = firstDay.getDay();
      startingDay = startingDay === 0 ? 6 : startingDay - 1; // Align Mon -> Sun

      const monthLength = lastDay.getDate();

      return (
        <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-2xs space-y-2">
          <div className="grid grid-cols-7 text-center font-bold text-xs bg-rose-100/70 p-2 rounded-lg text-rose-900 border border-rose-200">
            <div>周一</div><div>周二</div><div>周三</div><div>周四</div><div>周五</div><div>周六</div><div>周日</div>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[85px] bg-slate-50/50 rounded-lg border border-dashed border-slate-200" />
            ))}

            {Array.from({ length: monthLength }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(year, month, day);
              const dateStr = formatDateKey(dateObj);
              const dayItems = filteredSchedules.filter((s) => s.dateStr === dateStr);

              return (
                <div
                  key={day}
                  onClick={() => handleOpenModal(dateStr, 9)}
                  className="min-h-[85px] p-2 bg-white border border-rose-200 rounded-lg hover:bg-rose-50/40 cursor-pointer transition space-y-1"
                >
                  <div className="font-bold text-xs text-slate-800">{day} 日</div>
                  <div className="space-y-1">
                    {dayItems.slice(0, 3).map((item) => {
                      const { style, label } = getTypeStyleAndLabel(item.type);
                      return (
                        <div
                          key={item.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(dateStr, item.hour, item.id);
                          }}
                          style={style}
                          className="p-1 rounded text-[10px] font-bold truncate"
                        >
                          {item.hour}:00 [{label}]
                        </div>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <div className="text-[10px] font-bold text-rose-700">+{dayItems.length - 3} 更多</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (dimension === 'year') {
      const year = currentDate.getFullYear();
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, mIdx) => {
            const firstDay = new Date(year, mIdx, 1);
            const monthLength = new Date(year, mIdx + 1, 0).getDate();
            let startingDay = firstDay.getDay();
            startingDay = startingDay === 0 ? 6 : startingDay - 1;

            return (
              <div key={mIdx} className="bg-white border border-rose-200 rounded-xl p-3 shadow-2xs space-y-2">
                <div className="font-bold text-sm text-center text-rose-800 border-b border-rose-100 pb-1">
                  {mIdx + 1} 月
                </div>
                <div className="grid grid-cols-7 text-center text-[10px] font-semibold text-slate-400">
                  <span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span><span>日</span>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[11px]">
                  {Array.from({ length: startingDay }).map((_, i) => (
                    <span key={`emp-${i}`} />
                  ))}
                  {Array.from({ length: monthLength }).map((_, dIdx) => {
                    const dayNum = dIdx + 1;
                    const dateStr = formatDateKey(new Date(year, mIdx, dayNum));
                    const hasItem = filteredSchedules.some((s) => s.dateStr === dateStr);

                    return (
                      <button
                        key={dayNum}
                        onClick={() => {
                          setCurrentDate(new Date(year, mIdx, dayNum));
                          setDimension('day');
                        }}
                        className={`p-1 rounded-full font-medium transition cursor-pointer ${
                          hasItem
                            ? 'bg-rose-600 text-white font-bold shadow-xs'
                            : 'hover:bg-rose-100 text-slate-700'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-rose-200 pb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold text-zinc-800 border-l-4 border-rose-400 pl-3 flex items-center gap-2">
            <span>📅</span>
            <span>多维日程安排表</span>
          </h2>

          {/* 时间范围快捷筛选器（本周、本月、未来七天） */}
          <div className="flex items-center gap-1 bg-rose-50/80 p-1 rounded-xl border border-rose-200 shadow-2xs">
            <span className="text-[11px] font-bold text-rose-800 px-2 flex items-center gap-1 shrink-0">
              <Clock className="w-3.5 h-3.5 text-rose-600" />
              <span>时间范围:</span>
            </span>
            <button
              onClick={() => setTimeRange('all')}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                timeRange === 'all'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-zinc-700 hover:bg-rose-100/80'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => {
                setTimeRange('this_week');
                setCurrentDate(new Date());
                setDimension('week');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                timeRange === 'this_week'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-zinc-700 hover:bg-rose-100/80'
              }`}
            >
              本周
            </button>
            <button
              onClick={() => {
                setTimeRange('this_month');
                setCurrentDate(new Date());
                setDimension('month');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                timeRange === 'this_month'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-zinc-700 hover:bg-rose-100/80'
              }`}
            >
              本月
            </button>
            <button
              onClick={() => {
                setTimeRange('next_7_days');
                setCurrentDate(new Date());
                if (dimension === 'year') setDimension('week');
              }}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                timeRange === 'next_7_days'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-zinc-700 hover:bg-rose-100/80'
              }`}
            >
              未来七天
            </button>
          </div>
        </div>

        {/* 维度切换按钮 */}
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-rose-200 shadow-2xs">
          <span className="text-[11px] font-bold text-zinc-500 px-1.5">视图:</span>
          {(['day', 'week', 'month', 'year'] as Dimension[]).map((dim) => {
            const labels = { day: '日', week: '周', month: '月', year: '年' };
            return (
              <button
                key={dim}
                onClick={() => setDimension(dim)}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  dimension === dim
                    ? 'bg-zinc-800 text-white shadow-2xs'
                    : 'text-zinc-600 hover:bg-rose-50'
                }`}
              >
                {labels[dim]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 日程工具栏控制 */}
      <div className="bg-white border border-rose-200 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => navigatePeriod(-1)}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 rounded-xl transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleGoToToday}
              className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs rounded-xl transition border border-rose-200 cursor-pointer"
            >
              今天
            </button>
            <span className="text-xs font-bold text-rose-900 bg-rose-50/80 border border-rose-200 px-2.5 py-1 rounded-lg">
              {(() => {
                const now = new Date();
                const y = now.getFullYear();
                const m = String(now.getMonth() + 1).padStart(2, '0');
                const d = String(now.getDate()).padStart(2, '0');
                const wk = DAYS[now.getDay()];
                return `${y}年${m}月${d}日 ${wk}`;
              })()}
            </span>
          </div>

          <button
            onClick={() => navigatePeriod(1)}
            className="p-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-900 rounded-xl transition cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-zinc-600 ml-1">
            ({formatDateKey(currentDate)})
          </span>
        </div>

        {/* 快速搜索栏 */}
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-rose-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索个案姓名、督导师或日程内容..."
              className="w-full pl-9 pr-8 py-1.5 bg-rose-50/50 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400 placeholder:text-zinc-400 transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-rose-600 p-0.5 cursor-pointer"
                title="清空搜索"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <VoiceInputButton
            buttonText="语音检索"
            onTranscript={(text) => setSearchQuery(text)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* 时间范围筛选激活指示标签 */}
          {timeRange !== 'all' && rangeBounds && (
            <span className="text-xs font-bold bg-rose-100 text-rose-950 border border-rose-300 px-2.5 py-1 rounded-lg flex items-center gap-1.5">
              <span>
                {timeRange === 'this_week' ? '本周' : timeRange === 'this_month' ? '本月' : '未来七天'}
                ({rangeBounds.start} ~ {rangeBounds.end})
              </span>
              <button
                onClick={() => setTimeRange('all')}
                className="text-rose-700 hover:text-rose-950 p-0.5 cursor-pointer rounded-full hover:bg-rose-200 transition"
                title="清除时间范围筛选"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          )}

          {searchQuery.trim() !== '' && (
            <span className="text-xs font-bold bg-rose-100 text-rose-900 border border-rose-300 px-2.5 py-1 rounded-lg">
              已筛选出 {filteredSchedules.length} 项
            </span>
          )}

          <button
            onClick={() => setCategoryModalOpen(true)}
            className="flex items-center gap-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold text-xs rounded-xl border border-rose-200 transition cursor-pointer shrink-0"
            title="自主添加与管理日程类型标签（如动力团体等）"
          >
            <Tag className="w-3.5 h-3.5 text-rose-600" />
            <span>分类管理</span>
          </button>

          <button
            onClick={() => handleOpenModal(formatDateKey(currentDate), 10)}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>添加日程事件</span>
          </button>
        </div>
      </div>

      {/* Render Active View */}
      {renderScheduleGrid()}

      {/* Schedule Edit / Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-rose-600" />
                <span>{selectedScheduleId ? '编辑日程安排' : '添加日程安排'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">日期 (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={formDateStr}
                    onChange={(e) => setFormDateStr(e.target.value)}
                    className="w-full p-2 border border-rose-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">整点小时</label>
                  <select
                    value={formHour}
                    onChange={(e) => setFormHour(Number(e.target.value))}
                    className="w-full p-2 border border-rose-200 rounded-lg text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-400 font-bold"
                  >
                    {Array.from({ length: 14 }, (_, i) => i + 8).map((h) => (
                      <option key={h} value={h}>
                        {h < 10 ? `0${h}:00` : `${h}:00`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 日程类型：自主添加与快捷选框 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-800">
                    选择日程类型（支持自主选择与新增分类）*
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(true)}
                    className="text-[11px] text-rose-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Settings className="w-3 h-3" />
                    <span>管理分类类型</span>
                  </button>
                </div>

                {/* 快捷选分类按钮组 */}
                <div className="flex flex-wrap gap-2 p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl">
                  {categories.map((cat) => {
                    const isSelected = formType === cat.id || formType === cat.name;
                    const { style } = parseColorToStyle(cat.color);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setFormType(cat.id)}
                        style={isSelected ? style : undefined}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
                          isSelected
                            ? 'shadow-xs ring-2 ring-rose-400 scale-105'
                            : 'bg-white text-zinc-700 border border-rose-200 hover:bg-rose-100/70'
                        }`}
                      >
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: getHexColor(cat.color) }} />
                        <span>{cat.name}</span>
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(true)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-100 hover:bg-rose-200 text-rose-900 border border-dashed border-rose-300 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>自主添加类型...</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">关联对象 / 个案 / 督导师 / 参与者</label>
                <input
                  type="text"
                  placeholder="例如: C001 李先生 / 张督导 / 动力团体成员A组"
                  value={formClientName}
                  onChange={(e) => setFormClientName(e.target.value)}
                  className="w-full p-2 border border-rose-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-700 dark:text-slate-300">备注 / 详情说明</label>
                  <VoiceInputButton
                    buttonText="语音口述备注"
                    onTranscript={(text) => setFormDetail((prev) => (prev ? prev + ' ' + text : text))}
                  />
                </div>
                <input
                  type="text"
                  placeholder="例如: 案例讨论、动力团体第3次研讨、读书会..."
                  value={formDetail}
                  onChange={(e) => setFormDetail(e.target.value)}
                  className="w-full p-2 border border-rose-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-rose-100">
              {selectedScheduleId ? (
                <button
                  onClick={handleDeleteCurrentModalSchedule}
                  className="px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除日程</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveModal}
                  className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-2xs cursor-pointer"
                >
                  保存日程
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 自主添加与管理日程类型分类 Modal (100+ 色板 & 调色盘) */}
      {categoryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 max-w-2xl w-full shadow-xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Palette className="w-5 h-5 text-rose-600" />
                <span>全色系日程类型管理与色板库 (120+ 精选色 & 调色盘)</span>
              </h3>
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 当前已有分类展示 */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-800 flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-rose-600" />
                <span>当前已有日程分类标签：</span>
              </label>
              <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2.5 bg-rose-50/50 border border-rose-200 rounded-xl">
                {categories.map((cat) => {
                  const { style, label } = getTypeStyleAndLabel(cat.id);
                  return (
                    <div
                      key={cat.id}
                      style={style}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs border border-rose-200"
                    >
                      <span>{label}</span>
                      {!cat.isSystem && (
                        <button
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="text-slate-600 hover:text-rose-900 p-0.5 rounded-full hover:bg-white/80 transition cursor-pointer"
                          title="删除此分类"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 添加新类型表单 */}
            <div className="space-y-4 pt-3 border-t border-rose-100">
              <label className="block text-xs font-bold text-zinc-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-rose-600" />
                <span>自主添加新分类与选择配色：</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">1. 输入分类名称</label>
                  <input
                    type="text"
                    placeholder="如: 动力团体 / 家庭治疗 / 沙盘体验 / 个人体验"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    className="w-full p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>

                {/* 实时效果预览 */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-600 mb-1">2. 标签实时视觉效果预览</label>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                    <div
                      style={parseColorToStyle(newCatColor).style}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs"
                    >
                      [{newCatName.trim() || '分类标签'}] 10:00 张心理师
                    </div>
                    <span className="text-[10px] font-bold text-slate-500">{newCatColor}</span>
                  </div>
                </div>
              </div>

              {/* 100+ 色板选择库与 HTML5 调色盘 */}
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-1 text-xs font-bold text-slate-800">
                    <Palette className="w-4 h-4 text-rose-600" />
                    <span>选择配色 (120+ 种精选色卡或自定义 HEX)</span>
                  </div>

                  {/* HTML5 调色盘与 HEX 输入 */}
                  <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600">自定义调色盘:</span>
                    <input
                      type="color"
                      value={getHexColor(newCatColor)}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-6 h-6 rounded border border-slate-300 cursor-pointer p-0"
                    />
                    <input
                      type="text"
                      value={newCatColor}
                      onChange={(e) => setNewCatColor(e.target.value)}
                      className="w-20 px-1.5 py-0.5 border border-slate-200 rounded text-xs font-mono font-bold uppercase text-slate-800"
                    />
                  </div>
                </div>

                {/* 色系 Tabs */}
                <div className="flex flex-wrap gap-1 border-b border-slate-200 pb-2">
                  {COLOR_GROUPS.map((group, gIdx) => (
                    <button
                      key={gIdx}
                      type="button"
                      onClick={() => setActivePaletteTab(gIdx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                        activePaletteTab === gIdx
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                      }`}
                    >
                      {group.groupName}
                    </button>
                  ))}
                </div>

                {/* 色块 Grid */}
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5 max-h-48 overflow-y-auto p-1 bg-white rounded-xl border border-slate-200">
                  {COLOR_GROUPS[activePaletteTab]?.colors.map((c, cIdx) => {
                    const isSelected = newCatColor.toLowerCase() === c.hex.toLowerCase();
                    return (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setNewCatColor(c.hex)}
                        title={`${c.name} (${c.hex})`}
                        className={`group relative h-8 rounded-lg transition cursor-pointer flex items-center justify-center border ${
                          isSelected ? 'ring-2 ring-rose-500 ring-offset-1 scale-105 z-10 shadow-xs' : 'border-black/10 hover:scale-105'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      >
                        {isSelected && <span className="w-2 h-2 rounded-full bg-white shadow-xs" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!newCatName.trim()}
                className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>确认添加“{newCatName.trim() || '新分类'}”</span>
              </button>
            </div>

            <div className="pt-2 border-t border-rose-100 flex justify-end">
              <button
                onClick={() => setCategoryModalOpen(false)}
                className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition cursor-pointer"
              >
                完成设置
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
