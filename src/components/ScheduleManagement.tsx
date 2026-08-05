import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScheduleItem, ScheduleType, CaseRecord, Supervisor, ScheduleCategory, SessionData } from '../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2, Clock, X, Search, Tag, Settings, Sparkles, Palette, Users, UserCheck, ChevronDown, ChevronUp, Layers, Bookmark, CheckCircle2, Repeat, GripVertical, Pencil, Umbrella, CalendarX, CalendarCheck, Check } from 'lucide-react';
import { COLOR_GROUPS, parseColorToStyle, getHexColor } from '../data/colorPalette';
import { VoiceInputButton } from './VoiceInputButton';

// 格式化 Date 为 YYYY-MM-DD
const formatDateKey = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

// 中国法定节假日识别 Helper (覆盖 2025-2027 年国定假期与公历固定节日)
export interface HolidayInfo {
  isHoliday: boolean;
  name?: string;
}

export const getChineseHolidayInfo = (dateStr: string): HolidayInfo => {
  if (!dateStr) return { isHoliday: false };
  const parts = dateStr.split('-');
  if (parts.length !== 3) return { isHoliday: false };
  const [y, m, d] = parts;
  const mmdd = `${m}-${d}`;

  // 通用固定公历节假日
  if (mmdd === '01-01') return { isHoliday: true, name: '元旦' };
  if (mmdd === '05-01') return { isHoliday: true, name: '劳动节' };
  if (mmdd >= '10-01' && mmdd <= '10-07') return { isHoliday: true, name: '国庆节' };

  // 2025 年法定节假日
  if (y === '2025') {
    if (dateStr === '2025-01-01') return { isHoliday: true, name: '元旦' };
    if (dateStr >= '2025-01-28' && dateStr <= '2025-02-04') return { isHoliday: true, name: '春节' };
    if (dateStr >= '2025-04-04' && dateStr <= '2025-04-06') return { isHoliday: true, name: '清明节' };
    if (dateStr >= '2025-05-01' && dateStr <= '2025-05-05') return { isHoliday: true, name: '劳动节' };
    if (dateStr >= '2025-05-31' && dateStr <= '2025-06-02') return { isHoliday: true, name: '端午节' };
    if (dateStr >= '2025-10-01' && dateStr <= '2025-10-08') return { isHoliday: true, name: '中秋/国庆' };
  }

  // 2026 年法定节假日
  if (y === '2026') {
    if (dateStr === '2026-01-01') return { isHoliday: true, name: '元旦' };
    if (dateStr >= '2026-02-16' && dateStr <= '2026-02-23') return { isHoliday: true, name: '春节' };
    if (dateStr >= '2026-04-04' && dateStr <= '2026-04-06') return { isHoliday: true, name: '清明节' };
    if (dateStr >= '2026-05-01' && dateStr <= '2026-05-05') return { isHoliday: true, name: '劳动节' };
    if (dateStr >= '2026-06-19' && dateStr <= '2026-06-21') return { isHoliday: true, name: '端午节' };
    if (dateStr >= '2026-09-25' && dateStr <= '2026-09-27') return { isHoliday: true, name: '中秋节' };
    if (dateStr >= '2026-10-01' && dateStr <= '2026-10-07') return { isHoliday: true, name: '国庆节' };
  }

  // 2027 年法定节假日
  if (y === '2027') {
    if (dateStr === '2027-01-01') return { isHoliday: true, name: '元旦' };
    if (dateStr >= '2027-02-06' && dateStr <= '2027-02-13') return { isHoliday: true, name: '春节' };
    if (dateStr >= '2027-04-04' && dateStr <= '2027-04-06') return { isHoliday: true, name: '清明节' };
    if (dateStr >= '2027-05-01' && dateStr <= '2027-05-05') return { isHoliday: true, name: '劳动节' };
    if (dateStr >= '2027-06-09' && dateStr <= '2027-06-11') return { isHoliday: true, name: '端午节' };
    if (dateStr >= '2027-09-15' && dateStr <= '2027-09-17') return { isHoliday: true, name: '中秋节' };
    if (dateStr >= '2027-10-01' && dateStr <= '2027-10-07') return { isHoliday: true, name: '国庆节' };
  }

  return { isHoliday: false };
};

export interface PauseRange {
  id: string;
  start: string;
  end: string;
  label: string;
}

export interface ExcludedDateReason {
  dateStr: string;
  reason: string;
  type: 'holiday' | 'range' | 'manual';
}

export type RepeatMode = 'none' | 'daily' | 'weekly' | 'workdays' | 'monthly' | 'custom';

// 扩展版重复日期计算与排除过滤引擎
export const calculateRepeatDatesDetailed = (
  baseDateStr: string,
  mode: RepeatMode,
  selectedDays: number[],
  interval: number,
  endType: 'count' | 'untilDate',
  count: number,
  untilDateStr: string,
  customDates: string[],
  excludeHolidays: boolean,
  excludedDates: string[],
  excludeRanges: PauseRange[]
): { validDates: string[]; excludedInfo: ExcludedDateReason[] } => {
  if (!baseDateStr || mode === 'none') {
    return { validDates: [baseDateStr], excludedInfo: [] };
  }

  let rawCandidates: string[] = [];

  if (mode === 'custom') {
    // 自定义跳选日历选日模式: 使用用户点击的 customDates
    const setOfDates = new Set(customDates);
    if (baseDateStr && !setOfDates.has(baseDateStr)) {
      setOfDates.add(baseDateStr);
    }
    rawCandidates = Array.from(setOfDates).sort();
  } else {
    const parts = baseDateStr.split('-').map(Number);
    if (parts.length !== 3) return { validDates: [baseDateStr], excludedInfo: [] };

    const startObj = new Date(parts[0], parts[1] - 1, parts[2]);
    let curr = new Date(startObj);

    const maxItems = endType === 'count' ? Math.max(1, Math.min(count, 100)) : 100;
    const targetUntil = endType === 'untilDate' && untilDateStr ? new Date(untilDateStr + 'T23:59:59') : null;

    let daysLimit = 365;

    if (mode === 'daily') {
      while (rawCandidates.length < maxItems && daysLimit > 0) {
        if (targetUntil && curr > targetUntil) break;
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        rawCandidates.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
        daysLimit--;
      }
    } else if (mode === 'workdays') {
      while (rawCandidates.length < maxItems && daysLimit > 0) {
        if (targetUntil && curr > targetUntil) break;
        const dayOfWeek = curr.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, '0');
          const d = String(curr.getDate()).padStart(2, '0');
          rawCandidates.push(`${y}-${m}-${d}`);
        }
        curr.setDate(curr.getDate() + 1);
        daysLimit--;
      }
    } else if (mode === 'weekly') {
      const validDays = selectedDays.length > 0 ? selectedDays : [startObj.getDay()];
      const startWeekTime = new Date(startObj);
      const startDay = startWeekTime.getDay() === 0 ? 7 : startWeekTime.getDay();
      startWeekTime.setDate(startWeekTime.getDate() - (startDay - 1));

      while (rawCandidates.length < maxItems && daysLimit > 0) {
        if (targetUntil && curr > targetUntil) break;

        const currDayOfWeek = curr.getDay();
        const currWeekStart = new Date(curr);
        const currDay = currWeekStart.getDay() === 0 ? 7 : currWeekStart.getDay();
        currWeekStart.setDate(currWeekStart.getDate() - (currDay - 1));

        const weekDiff = Math.round((currWeekStart.getTime() - startWeekTime.getTime()) / (1000 * 60 * 60 * 24 * 7));

        if (weekDiff >= 0 && weekDiff % (interval || 1) === 0 && validDays.includes(currDayOfWeek)) {
          if (curr >= startObj) {
            const y = curr.getFullYear();
            const m = String(curr.getMonth() + 1).padStart(2, '0');
            const d = String(curr.getDate()).padStart(2, '0');
            rawCandidates.push(`${y}-${m}-${d}`);
          }
        }

        curr.setDate(curr.getDate() + 1);
        daysLimit--;
      }
    } else if (mode === 'monthly') {
      const targetDateNum = startObj.getDate();
      while (rawCandidates.length < maxItems && daysLimit > 0) {
        if (targetUntil && curr > targetUntil) break;

        if (curr.getDate() === targetDateNum) {
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, '0');
          const d = String(curr.getDate()).padStart(2, '0');
          rawCandidates.push(`${y}-${m}-${d}`);
          curr.setMonth(curr.getMonth() + 1);
        } else {
          curr.setDate(curr.getDate() + 1);
        }
        daysLimit--;
      }
    }
  }

  // 二次过滤：检查手动排除、休假/旅游暂停区间、节假日
  const validDates: string[] = [];
  const excludedInfo: ExcludedDateReason[] = [];

  for (const d of rawCandidates) {
    // 1. 手动点选排除
    if (excludedDates.includes(d)) {
      excludedInfo.push({ dateStr: d, reason: '手动点选排除', type: 'manual' });
      continue;
    }

    // 2. 检查是否落在休假/旅游暂停区间
    const matchedRange = excludeRanges.find((r) => d >= r.start && d <= r.end);
    if (matchedRange) {
      excludedInfo.push({
        dateStr: d,
        reason: `休假暂停 (${matchedRange.label || '休假/旅游'})`,
        type: 'range',
      });
      continue;
    }

    // 3. 检查是否为国家法定节假日
    if (excludeHolidays) {
      const hInfo = getChineseHolidayInfo(d);
      if (hInfo.isHoliday) {
        excludedInfo.push({
          dateStr: d,
          reason: `法定节假日 (${hInfo.name || '节假日'})`,
          type: 'holiday',
        });
        continue;
      }
    }

    validDates.push(d);
  }

  return { validDates, excludedInfo };
};

export const formatRepeatRuleLabel = (ruleStr?: string): string => {
  if (!ruleStr || ruleStr === 'none') return '';
  if (ruleStr === 'daily') return '每天';
  if (ruleStr === 'workdays') return '工作日';
  if (ruleStr === 'monthly') return '每月';
  if (ruleStr === 'biweekly') return '隔周';

  if (ruleStr.startsWith('weekly')) {
    const weekNames: Record<number, string> = { 1: '一', 2: '二', 3: '三', 4: '四', 5: '五', 6: '六', 0: '日' };
    let intervalPrefix = '每周';
    let daysSuffix = '';

    const intervalMatch = ruleStr.match(/interval=(\d+)/);
    if (intervalMatch) {
      const val = parseInt(intervalMatch[1], 10);
      if (val === 2) intervalPrefix = '隔周';
      else if (val > 2) intervalPrefix = `每${val}周`;
    }

    const daysMatch = ruleStr.match(/days=([0-9,]+)/);
    if (daysMatch) {
      const days = daysMatch[1].split(',').map(Number);
      daysSuffix = days.map((d) => weekNames[d] || d).join('、');
    }

    if (daysSuffix) {
      return `${intervalPrefix}周${daysSuffix}`;
    }
    return `${intervalPrefix}`;
  }

  return '重复';
};

interface ScheduleManagementProps {
  schedules: ScheduleItem[];
  cases: CaseRecord[];
  mentors: Supervisor[];
  onAddSchedule: (newItem: Omit<ScheduleItem, 'id'>) => void;
  onUpdateSchedule: (id: string, updated: Omit<ScheduleItem, 'id'>) => void;
  onDeleteSchedule: (id: string) => void;
  onReorderSchedules?: (newSchedules: ScheduleItem[]) => void;
}

type Dimension = 'day' | 'week' | 'month' | 'year';

const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const PRESET_TIME_SLOTS = [
  { label: '09:00 - 10:00', start: '09:00', end: '10:00' },
  { label: '09:30 - 10:30', start: '09:30', end: '10:30' },
  { label: '10:00 - 11:00', start: '10:00', end: '11:00' },
  { label: '10:30 - 11:30', start: '10:30', end: '11:30' },
  { label: '11:00 - 12:00', start: '11:00', end: '12:00' },
  { label: '14:00 - 15:00', start: '14:00', end: '15:00' },
  { label: '14:30 - 15:30', start: '14:30', end: '15:30' },
  { label: '15:00 - 16:00', start: '15:00', end: '16:00' },
  { label: '16:00 - 17:00', start: '16:00', end: '17:00' },
  { label: '16:30 - 17:30', start: '16:30', end: '17:30' },
  { label: '19:00 - 20:00', start: '19:00', end: '20:00' },
  { label: '19:30 - 20:30', start: '19:30', end: '20:30' },
  { label: '20:00 - 21:00', start: '20:00', end: '21:00' },
];

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
  onReorderSchedules,
}) => {
  const [dimension, setDimension] = useState<Dimension>('week');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const wheelCooldownRef = useRef(false);

  // 拖拽排序状态与 Handler
  const [draggedScheduleId, setDraggedScheduleId] = useState<string | null>(null);
  const [dragOverScheduleId, setDragOverScheduleId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedScheduleId(id);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverScheduleId !== targetId) {
      setDragOverScheduleId(targetId);
    }
  };

  const handleDragEnd = () => {
    setDraggedScheduleId(null);
    setDragOverScheduleId(null);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedScheduleId;
    if (sourceId && sourceId !== targetId) {
      handleReorderItems(sourceId, targetId);
    }
    setDraggedScheduleId(null);
    setDragOverScheduleId(null);
  };

  const handleDropToSlot = (e: React.DragEvent, targetDateStr: string, targetHour: number) => {
    e.preventDefault();
    e.stopPropagation();
    const sourceId = e.dataTransfer.getData('text/plain') || draggedScheduleId;
    if (!sourceId) return;

    const sourceIndex = schedules.findIndex((s) => s.id === sourceId);
    if (sourceIndex === -1) return;

    const sourceItem = schedules[sourceIndex];

    const updatedSourceItem: ScheduleItem = {
      ...sourceItem,
      dateStr: targetDateStr,
      hour: targetHour,
    };

    const newSchedules = [...schedules];
    newSchedules[sourceIndex] = updatedSourceItem;

    if (onReorderSchedules) {
      onReorderSchedules(newSchedules);
    } else {
      onUpdateSchedule(sourceId, {
        dateStr: updatedSourceItem.dateStr,
        hour: updatedSourceItem.hour,
        timeStr: updatedSourceItem.timeStr,
        type: updatedSourceItem.type,
        clientName: updatedSourceItem.clientName,
        detail: updatedSourceItem.detail,
        completed: updatedSourceItem.completed,
        repeatRule: updatedSourceItem.repeatRule,
      });
    }
    setDraggedScheduleId(null);
    setDragOverScheduleId(null);
  };

  const handleReorderItems = (sourceId: string, targetId: string) => {
    const sourceIndex = schedules.findIndex((s) => s.id === sourceId);
    const targetIndex = schedules.findIndex((s) => s.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const targetItem = schedules[targetIndex];
    const sourceItem = schedules[sourceIndex];

    const updatedSourceItem: ScheduleItem = {
      ...sourceItem,
      dateStr: targetItem.dateStr,
      hour: targetItem.hour,
    };

    const newSchedules = [...schedules];
    newSchedules.splice(sourceIndex, 1);
    const newTargetIndex = newSchedules.findIndex((s) => s.id === targetId);
    newSchedules.splice(newTargetIndex, 0, updatedSourceItem);

    if (onReorderSchedules) {
      onReorderSchedules(newSchedules);
    } else {
      onUpdateSchedule(sourceId, {
        dateStr: updatedSourceItem.dateStr,
        hour: updatedSourceItem.hour,
        timeStr: updatedSourceItem.timeStr,
        type: updatedSourceItem.type,
        clientName: updatedSourceItem.clientName,
        detail: updatedSourceItem.detail,
        completed: updatedSourceItem.completed,
        repeatRule: updatedSourceItem.repeatRule,
      });
    }
  };

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

  // 日历按日折叠/展开状态
  const [expandedCalendarDays, setExpandedCalendarDays] = useState<Record<string, boolean>>({});

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

  // 灵活时间与精确时段状态
  const [formStartTime, setFormStartTime] = useState<string>('10:00');
  const [formEndTime, setFormEndTime] = useState<string>('11:00');
  const [formTimeStr, setFormTimeStr] = useState<string>('10:00 - 11:00');

  // 日程类型与关联对象
  const [formType, setFormType] = useState<ScheduleType>('consult');
  const [formClientName, setFormClientName] = useState('');
  const [formDetail, setFormDetail] = useState('');

  // 周期性重复安排状态
  const [formRepeatMode, setFormRepeatMode] = useState<RepeatMode>('none');
  const [formSelectedWeekDays, setFormSelectedWeekDays] = useState<number[]>([1]); // 0=日, 1=一, 2=二, 3=三, 4=四, 5=五, 6=六
  const [formWeekInterval, setFormWeekInterval] = useState<number>(1); // 1=每周, 2=每2周(隔周)
  const [formRepeatEndType, setFormRepeatEndType] = useState<'count' | 'untilDate'>('count');
  const [formRepeatCount, setFormRepeatCount] = useState<number>(4);
  const [formRepeatUntilDate, setFormRepeatUntilDate] = useState<string>('');

  // 1. 新增: 自定义跳选日期列表与选日日历导航
  const [formCustomDates, setFormCustomDates] = useState<string[]>([]);
  const [customCalendarMonth, setCustomCalendarMonth] = useState<Date>(new Date());

  // 2. 新增: 自动去除法定节假日选项
  const [formExcludeHolidays, setFormExcludeHolidays] = useState<boolean>(false);

  // 3. 新增: 排除/暂停指定日期与区间 (如外出旅游、出差暂停)
  const [formExcludedDates, setFormExcludedDates] = useState<string[]>([]);
  const [formExcludeRanges, setFormExcludeRanges] = useState<PauseRange[]>([]);
  const [newPauseStart, setNewPauseStart] = useState<string>('');
  const [newPauseEnd, setNewPauseEnd] = useState<string>('');
  const [newPauseLabel, setNewPauseLabel] = useState<string>('旅游休假');
  const [showAddPauseRange, setShowAddPauseRange] = useState<boolean>(false);

  // 关联对象下拉选择器状态
  const [showObjectPicker, setShowObjectPicker] = useState<boolean>(false);
  const objectPickerRef = useRef<HTMLDivElement>(null);

  // 计算周期性重复日期序列 helper
  const calculateRepeatDates = (
    baseDateStr: string,
    mode: RepeatMode,
    selectedDays: number[],
    interval: number,
    endType: 'count' | 'untilDate',
    count: number,
    untilDateStr: string
  ): string[] => {
    if (!baseDateStr || mode === 'none') return [baseDateStr];

    const parts = baseDateStr.split('-').map(Number);
    if (parts.length !== 3) return [baseDateStr];

    const results: string[] = [];
    const startObj = new Date(parts[0], parts[1] - 1, parts[2]);
    let curr = new Date(startObj);

    const maxItems = endType === 'count' ? Math.max(1, Math.min(count, 100)) : 100;
    const targetUntil = endType === 'untilDate' && untilDateStr ? new Date(untilDateStr + 'T23:59:59') : null;

    let daysLimit = 365;

    if (mode === 'daily') {
      while (results.length < maxItems && daysLimit > 0) {
        if (targetUntil && curr > targetUntil) break;
        const y = curr.getFullYear();
        const m = String(curr.getMonth() + 1).padStart(2, '0');
        const d = String(curr.getDate()).padStart(2, '0');
        results.push(`${y}-${m}-${d}`);
        curr.setDate(curr.getDate() + 1);
        daysLimit--;
      }
    } else if (mode === 'workdays') {
      while (results.length < maxItems && daysLimit > 0) {
        if (targetUntil && curr > targetUntil) break;
        const dayOfWeek = curr.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, '0');
          const d = String(curr.getDate()).padStart(2, '0');
          results.push(`${y}-${m}-${d}`);
        }
        curr.setDate(curr.getDate() + 1);
        daysLimit--;
      }
    } else if (mode === 'weekly') {
      const validDays = selectedDays.length > 0 ? selectedDays : [startObj.getDay()];
      const startWeekTime = new Date(startObj);
      const startDay = startWeekTime.getDay() === 0 ? 7 : startWeekTime.getDay();
      startWeekTime.setDate(startWeekTime.getDate() - (startDay - 1));

      while (results.length < maxItems && daysLimit > 0) {
        if (targetUntil && curr > targetUntil) break;

        const currDayOfWeek = curr.getDay();
        const currWeekStart = new Date(curr);
        const currDay = currWeekStart.getDay() === 0 ? 7 : currWeekStart.getDay();
        currWeekStart.setDate(currWeekStart.getDate() - (currDay - 1));

        const weekDiff = Math.round((currWeekStart.getTime() - startWeekTime.getTime()) / (1000 * 60 * 60 * 24 * 7));

        if (weekDiff >= 0 && weekDiff % (interval || 1) === 0 && validDays.includes(currDayOfWeek)) {
          if (curr >= startObj) {
            const y = curr.getFullYear();
            const m = String(curr.getMonth() + 1).padStart(2, '0');
            const d = String(curr.getDate()).padStart(2, '0');
            results.push(`${y}-${m}-${d}`);
          }
        }

        curr.setDate(curr.getDate() + 1);
        daysLimit--;
      }
    } else if (mode === 'monthly') {
      const targetDateNum = startObj.getDate();
      while (results.length < maxItems && daysLimit > 0) {
        if (targetUntil && curr > targetUntil) break;

        if (curr.getDate() === targetDateNum) {
          const y = curr.getFullYear();
          const m = String(curr.getMonth() + 1).padStart(2, '0');
          const d = String(curr.getDate()).padStart(2, '0');
          results.push(`${y}-${m}-${d}`);
          curr.setMonth(curr.getMonth() + 1);
        } else {
          curr.setDate(curr.getDate() + 1);
        }
        daysLimit--;
      }
    }

    return results.length > 0 ? results : [baseDateStr];
  };

  // 点击组件外部自动关闭关联对象选择弹层
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (objectPickerRef.current && !objectPickerRef.current.contains(e.target as Node)) {
        setShowObjectPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    setShowObjectPicker(false);

    const startH = hour < 10 ? `0${hour}:00` : `${hour}:00`;
    const endH = (hour + 1) < 10 ? `0${hour + 1}:00` : `${hour + 1}:00`;

    const baseD = dateStr ? new Date(dateStr) : new Date();
    const baseDay = baseD.getDay();

    if (scheduleId) {
      const existing = schedules.find((s) => s.id === scheduleId);
      if (existing) {
        setSelectedScheduleId(scheduleId);
        setFormType(existing.type);
        setFormClientName(existing.clientName || '');
        setFormDetail(existing.detail || '');

        // 反解析重复规则
        const rule = existing.repeatRule;
        if (rule) {
          if (rule === 'daily' || rule === 'workdays' || rule === 'monthly' || rule === 'custom') {
            setFormRepeatMode(rule as RepeatMode);
          } else if (rule.startsWith('weekly')) {
            setFormRepeatMode('weekly');
            const daysMatch = rule.match(/days=([0-9,]+)/);
            if (daysMatch) {
              setFormSelectedWeekDays(daysMatch[1].split(',').map(Number));
            } else {
              setFormSelectedWeekDays([baseDay]);
            }
            const intervalMatch = rule.match(/interval=(\d+)/);
            if (intervalMatch) {
              setFormWeekInterval(Number(intervalMatch[1]));
            } else {
              setFormWeekInterval(1);
            }
          } else if (rule === 'biweekly') {
            setFormRepeatMode('weekly');
            setFormWeekInterval(2);
            setFormSelectedWeekDays([baseDay]);
          } else {
            setFormRepeatMode('none');
          }
        } else {
          setFormRepeatMode('none');
          setFormSelectedWeekDays([baseDay]);
          setFormWeekInterval(1);
        }

        setFormCustomDates([existing.dateStr]);
        setCustomCalendarMonth(new Date(existing.dateStr));
        setFormExcludeHolidays(false);
        setFormExcludedDates([]);
        setFormExcludeRanges([]);
        setShowAddPauseRange(false);

        const timeVal = existing.timeStr || `${startH} - ${endH}`;
        setFormTimeStr(timeVal);

        // 尝试解析开始与结束时间
        const parts = timeVal.split('-').map((p) => p.trim());
        if (parts[0] && /^([01]?\d|2[0-3]):[0-5]\d$/.test(parts[0])) {
          setFormStartTime(parts[0].padStart(5, '0'));
        } else {
          setFormStartTime(startH);
        }
        if (parts[1] && /^([01]?\d|2[0-3]):[0-5]\d$/.test(parts[1])) {
          setFormEndTime(parts[1].padStart(5, '0'));
        } else {
          setFormEndTime(endH);
        }
      }
    } else {
      setSelectedScheduleId(null);
      setFormType('consult');
      setFormClientName('');
      setFormDetail('');
      setFormStartTime(startH);
      setFormEndTime(endH);
      setFormTimeStr(`${startH} - ${endH}`);
      setFormRepeatMode('none');
      setFormSelectedWeekDays([baseDay]);
      setFormWeekInterval(1);
      setFormRepeatEndType('count');
      setFormRepeatCount(4);

      // 重置自定义选日与排除规则
      setFormCustomDates([dateStr || formatDateKey(new Date())]);
      setCustomCalendarMonth(dateStr ? new Date(dateStr) : new Date());
      setFormExcludeHolidays(false);
      setFormExcludedDates([]);
      setFormExcludeRanges([]);
      setNewPauseStart('');
      setNewPauseEnd('');
      setNewPauseLabel('旅游休假');
      setShowAddPauseRange(false);

      // 计算默认 2 个月后的截止日期
      const d = new Date(dateStr ? dateStr : new Date());
      d.setMonth(d.getMonth() + 2);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      setFormRepeatUntilDate(`${y}-${m}-${day}`);
    }

    setModalOpen(true);
  };

  // 一键应用快捷预设时间
  const handleApplyPresetTimeSlot = (start: string, end: string) => {
    setFormStartTime(start);
    setFormEndTime(end);
    setFormTimeStr(`${start} - ${end}`);

    // 同步计算对应的基准整点卡槽
    const parsed = parseInt(start.split(':')[0], 10);
    if (!isNaN(parsed)) {
      setFormHour(parsed);
    }
  };

  // 修改开始/结束时间时自动刷新时间段字符串
  const handleTimePickerChange = (newStart: string, newEnd: string) => {
    setFormStartTime(newStart);
    setFormEndTime(newEnd);
    setFormTimeStr(`${newStart} - ${newEnd}`);

    const parsed = parseInt(newStart.split(':')[0], 10);
    if (!isNaN(parsed)) {
      setFormHour(parsed);
    }
  };

  const handleSaveModal = () => {
    if (!formDateStr) {
      alert('请选择有效的日期！');
      return;
    }

    // 从开始时间或时间文本解析准确的小时位作为网格槽位基准
    let computedHour = formHour;
    if (formStartTime && formStartTime.includes(':')) {
      const parsed = parseInt(formStartTime.split(':')[0], 10);
      if (!isNaN(parsed)) computedHour = parsed;
    } else if (formTimeStr && formTimeStr.includes(':')) {
      const match = formTimeStr.match(/(\d{1,2}):/);
      if (match && match[1]) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed)) computedHour = parsed;
      }
    }

    const computedRepeatRule = formRepeatMode === 'none'
      ? undefined
      : formRepeatMode === 'weekly'
      ? `weekly:days=${[...formSelectedWeekDays].sort((a, b) => a - b).join(',')}:interval=${formWeekInterval}`
      : formRepeatMode;

    const itemData: Omit<ScheduleItem, 'id'> = {
      dateStr: formDateStr,
      hour: computedHour,
      timeStr: formTimeStr.trim() || `${computedHour < 10 ? '0' + computedHour : computedHour}:00`,
      type: formType,
      clientName: formClientName,
      detail: formDetail,
      repeatRule: computedRepeatRule,
    };

    if (selectedScheduleId) {
      onUpdateSchedule(selectedScheduleId, itemData);
    } else {
      if (formRepeatMode === 'none') {
        onAddSchedule(itemData);
      } else {
        const { validDates } = calculateRepeatDatesDetailed(
          formDateStr,
          formRepeatMode,
          formSelectedWeekDays,
          formWeekInterval,
          formRepeatEndType,
          formRepeatCount,
          formRepeatUntilDate,
          formCustomDates,
          formExcludeHolidays,
          formExcludedDates,
          formExcludeRanges
        );

        if (validDates.length === 0) {
          alert('在当前所选的重复规则与暂停/节假日排除规则下，未生成任何有效日期，请重新检查规则设置。');
          return;
        }

        validDates.forEach((dStr) => {
          onAddSchedule({
            ...itemData,
            dateStr: dStr,
            repeatRule: formRepeatMode === 'custom' ? 'custom' : computedRepeatRule,
          });
        });
      }
    }

    setModalOpen(false);
  };

  const handleDeleteCurrentModalSchedule = () => {
    if (selectedScheduleId) {
      if (window.confirm('确定要删除选中的此条日程安排吗？')) {
        onDeleteSchedule(selectedScheduleId);
        setModalOpen(false);
      }
    }
  };

  // Render Schedule Grid according to view dimension
  const renderScheduleGrid = () => {
    if (dimension === 'day') {
      const dateStr = formatDateKey(currentDate);
      const dayHoliday = getChineseHolidayInfo(dateStr);

      return (
        <div className="space-y-3">
          {dayHoliday.isHoliday && (
            <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500 text-white p-3 rounded-2xl font-bold text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2">
                <Umbrella className="w-4 h-4 shrink-0" />
                <span>🎉 今日为国家法定节假日：<strong className="text-amber-200 text-sm">【{dayHoliday.name}】</strong>（放假休息）</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-extrabold tracking-wider">休·法定假日</span>
            </div>
          )}

          <div className="bg-white rounded-xl border border-rose-200 overflow-hidden shadow-2xs space-y-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-rose-100/80 border-b border-rose-200 text-rose-950 font-bold">
                  <th className="p-3 w-28 text-center border-r border-rose-200">时间段</th>
                  <th className="p-3">日程安排 (点击空白添加，可按住左侧 ⠇图标拖拽调整先后执行顺序)</th>
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
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDropToSlot(e, dateStr, hour)}
                        className="p-2 cursor-pointer min-h-[50px] align-top hover:bg-rose-50/20"
                      >
                        <div className="space-y-1.5">
                          {hourItems.map((item) => {
                            const { style, label } = getTypeStyleAndLabel(item.type);
                            const displayTime = item.timeStr || (item.hour < 10 ? `0${item.hour}:00` : `${item.hour}:00`);
                            const isDragging = draggedScheduleId === item.id;
                            const isDragOver = dragOverScheduleId === item.id;

                            return (
                              <div
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, item.id)}
                                onDragOver={(e) => handleDragOver(e, item.id)}
                                onDrop={(e) => handleDrop(e, item.id)}
                                onDragEnd={handleDragEnd}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenModal(dateStr, hour, item.id);
                                }}
                                style={style}
                                className={`p-2.5 rounded-xl text-xs shadow-2xs font-medium cursor-pointer transition-all border group relative ${
                                  isDragOver ? 'ring-2 ring-rose-500 border-rose-400 scale-[1.01]' : 'border-black/5 hover:border-black/20'
                                } ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
                              >
                                <div className="flex items-center justify-between gap-2 mb-1">
                                  <div className="font-bold flex items-center gap-1.5 text-xs flex-wrap min-w-0 flex-1">
                                    <span
                                      className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-800 p-0.5 shrink-0"
                                      title="按住拖拽可调整排序或移动时间段"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </span>
                                    <span>[{label}]</span>
                                    <span className="truncate">{item.clientName || '自定对象'}</span>
                                    {item.repeatRule && item.repeatRule !== 'none' && (
                                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-200/80 dark:bg-amber-900/60 text-amber-950 dark:text-amber-100 border border-amber-300 dark:border-amber-700 flex items-center gap-0.5 shrink-0" title={`重复规则: ${item.repeatRule}`}>
                                        <Repeat className="w-2.5 h-2.5" />
                                        <span>{formatRepeatRuleLabel(item.repeatRule)}</span>
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <div className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded-lg bg-white/80 dark:bg-black/40 backdrop-blur-xs flex items-center gap-1 border border-black/10 shadow-2xs">
                                      <Clock className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                      <span>{displayTime}</span>
                                    </div>

                                    {/* 修改按钮 */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenModal(dateStr, hour, item.id);
                                      }}
                                      className="p-1 rounded-lg bg-white/90 dark:bg-slate-800/90 hover:bg-sky-50 dark:hover:bg-sky-950 text-slate-700 dark:text-slate-200 hover:text-sky-600 border border-black/10 shadow-2xs transition cursor-pointer"
                                      title="修改/编辑日程"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                    </button>

                                    {/* 删除按钮 */}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        if (window.confirm(`确定要删除日程 “${label}: ${item.clientName || '自定对象'}” 吗？`)) {
                                          onDeleteSchedule(item.id);
                                        }
                                      }}
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onTouchStart={(e) => e.stopPropagation()}
                                      className="p-1.5 rounded-lg bg-white/90 dark:bg-slate-800/90 hover:bg-rose-100 dark:hover:bg-rose-950 text-rose-600 hover:text-rose-700 border border-black/10 shadow-2xs transition cursor-pointer select-none touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
                                      title="删除日程"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                {item.detail && <div className="text-[11px] opacity-85 mt-1 border-t border-black/5 pt-1 pl-5">{item.detail}</div>}
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
                {weekDates.map((d, idx) => {
                  const dateStr = formatDateKey(d);
                  const holiday = getChineseHolidayInfo(dateStr);
                  const isToday = dateStr === formatDateKey(new Date());

                  return (
                    <th
                      key={idx}
                      className={`p-2 border-r border-rose-200 last:border-r-0 ${
                        holiday.isHoliday ? 'bg-amber-100/90 dark:bg-amber-950/60' : ''
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 font-bold">
                        <span>{DAYS[d.getDay()]}</span>
                        {holiday.isHoliday && (
                          <span className="px-1.5 py-0.2 text-[10px] bg-rose-600 text-white rounded font-bold shadow-2xs flex items-center gap-0.5" title={`法定节假日: ${holiday.name}`}>
                            <Umbrella className="w-2.5 h-2.5" />
                            <span>{holiday.name}</span>
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] font-medium ${isToday ? 'text-rose-600 font-extrabold' : 'text-rose-800'}`}>
                        {d.getMonth() + 1}/{d.getDate()}
                      </div>
                    </th>
                  );
                })}
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
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => handleDropToSlot(e, dateStr, hour)}
                          className="p-1.5 border-r border-rose-100 last:border-r-0 align-top cursor-pointer min-h-[50px] hover:bg-rose-50/40"
                        >
                          <div className="space-y-1">
                            {items.map((item) => {
                              const { style, label } = getTypeStyleAndLabel(item.type);
                              const displayTime = item.timeStr || (item.hour < 10 ? `0${item.hour}:00` : `${item.hour}:00`);
                              const isDragging = draggedScheduleId === item.id;
                              const isDragOver = dragOverScheduleId === item.id;

                              return (
                                <div
                                  key={item.id}
                                  draggable
                                  onDragStart={(e) => handleDragStart(e, item.id)}
                                  onDragOver={(e) => handleDragOver(e, item.id)}
                                  onDrop={(e) => handleDrop(e, item.id)}
                                  onDragEnd={handleDragEnd}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenModal(dateStr, hour, item.id);
                                  }}
                                  style={style}
                                  className={`p-1.5 rounded-lg text-[11px] text-left leading-tight shadow-2xs font-semibold cursor-pointer transition-all border group relative ${
                                    isDragOver ? 'ring-2 ring-rose-500 border-rose-400 scale-[1.02]' : 'border-black/5 hover:border-black/20'
                                  } ${isDragging ? 'opacity-40 scale-95' : 'opacity-100'}`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-mono opacity-90 mb-0.5 border-b border-black/5 pb-0.5 gap-1">
                                    <div className="flex items-center gap-0.5 min-w-0">
                                      <span
                                        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-800 shrink-0"
                                        title="拖拽排序"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <GripVertical className="w-2.5 h-2.5" />
                                      </span>
                                      <span className="truncate font-bold">[{label}]</span>
                                      {item.repeatRule && item.repeatRule !== 'none' && <Repeat className="w-2.5 h-2.5 shrink-0 text-amber-700 dark:text-amber-300" title={`重复: ${item.repeatRule}`} />}
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0">
                                      <span className="shrink-0 font-bold">{displayTime}</span>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenModal(dateStr, hour, item.id);
                                        }}
                                        className="p-0.5 rounded bg-white/80 hover:bg-white text-slate-700 hover:text-sky-600 transition cursor-pointer"
                                        title="修改"
                                      >
                                        <Pencil className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (window.confirm('确定要删除此日程吗？')) {
                                            onDeleteSchedule(item.id);
                                          }
                                        }}
                                        className="p-1 rounded bg-white/90 hover:bg-rose-100 text-rose-600 hover:text-rose-800 transition cursor-pointer select-none touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
                                        title="删除"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="truncate font-bold mt-0.5 pl-3">{item.clientName || item.detail || '已安排'}</div>
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
              const holiday = getChineseHolidayInfo(dateStr);
              const dayItems = filteredSchedules.filter((s) => s.dateStr === dateStr);
              const isToday = dateStr === formatDateKey(new Date());

              const isDayExpanded = Boolean(expandedCalendarDays[dateStr]);
              const visibleDayItems = isDayExpanded ? dayItems : dayItems.slice(0, 3);

              return (
                <div
                  key={day}
                  onClick={() => handleOpenModal(dateStr, 9)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => handleDropToSlot(e, dateStr, 9)}
                  className={`min-h-[85px] p-2 border rounded-lg hover:bg-rose-50/40 cursor-pointer transition space-y-1 relative ${
                    holiday.isHoliday
                      ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700'
                      : isToday
                      ? 'bg-rose-50/60 border-rose-400 ring-2 ring-rose-300'
                      : 'bg-white border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-xs ${isToday ? 'text-rose-700 font-extrabold' : 'text-slate-800'}`}>{day} 日</span>
                    {holiday.isHoliday && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 bg-rose-600 text-white rounded-md shadow-2xs flex items-center gap-0.5 shrink-0" title={`法定节假日：${holiday.name}`}>
                        <Umbrella className="w-2.5 h-2.5" />
                        <span>{holiday.name}</span>
                      </span>
                    )}
                  </div>
                  <div className="space-y-1">
                    {visibleDayItems.map((item) => {
                      const { style, label } = getTypeStyleAndLabel(item.type);
                      const displayTime = item.timeStr || (item.hour < 10 ? `0${item.hour}:00` : `${item.hour}:00`);
                      const isDragging = draggedScheduleId === item.id;
                      const isDragOver = dragOverScheduleId === item.id;

                      return (
                        <div
                          key={item.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, item.id)}
                          onDragOver={(e) => handleDragOver(e, item.id)}
                          onDrop={(e) => handleDrop(e, item.id)}
                          onDragEnd={handleDragEnd}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenModal(dateStr, item.hour, item.id);
                          }}
                          style={style}
                          className={`p-1 rounded-md text-[10px] font-bold truncate flex items-center justify-between gap-1 shadow-2xs border transition cursor-pointer ${
                            isDragOver ? 'ring-2 ring-rose-500 border-rose-400 scale-[1.01]' : 'border-black/5'
                          } ${isDragging ? 'opacity-40' : 'opacity-100'}`}
                        >
                          <div className="flex items-center gap-0.5 truncate min-w-0">
                            <span
                              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-800 shrink-0"
                              title="拖拽排序"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <GripVertical className="w-2.5 h-2.5" />
                            </span>
                            <span className="truncate">[{label}] {item.clientName || '已安排'}</span>
                          </div>

                          <div className="flex items-center gap-0.5 shrink-0">
                            <span className="font-mono opacity-85 text-[9px] font-bold">{displayTime}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenModal(dateStr, item.hour, item.id);
                              }}
                              className="p-0.5 rounded hover:bg-black/10 text-slate-700 transition cursor-pointer"
                              title="修改"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm('确定要删除此日程吗？')) {
                                  onDeleteSchedule(item.id);
                                }
                              }}
                              className="p-1 rounded hover:bg-rose-100 text-rose-600 transition cursor-pointer select-none touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
                              title="删除"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {dayItems.length > 3 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedCalendarDays((prev) => ({ ...prev, [dateStr]: !prev[dateStr] }));
                        }}
                        className="w-full text-center py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-100/90 dark:bg-rose-950/80 hover:bg-rose-200 border border-rose-300 dark:border-rose-800 rounded cursor-pointer transition flex items-center justify-center gap-0.5 mt-1 shadow-2xs"
                      >
                        {isDayExpanded ? (
                          <>
                            <span>折叠 ({dayItems.length} 项)</span>
                            <ChevronUp className="w-2.5 h-2.5" />
                          </>
                        ) : (
                          <>
                            <span>展开剩余 ({dayItems.length - 3} 项)</span>
                            <ChevronDown className="w-2.5 h-2.5" />
                          </>
                        )}
                      </button>
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
                    const holiday = getChineseHolidayInfo(dateStr);
                    const hasItem = filteredSchedules.some((s) => s.dateStr === dateStr);

                    return (
                      <button
                        key={dayNum}
                        onClick={() => {
                          setCurrentDate(new Date(year, mIdx, dayNum));
                          setDimension('day');
                        }}
                        title={holiday.isHoliday ? `法定节假日: ${holiday.name}` : undefined}
                        className={`p-1 rounded-full font-medium transition cursor-pointer relative ${
                          hasItem
                            ? 'bg-rose-600 text-white font-bold shadow-xs'
                            : holiday.isHoliday
                            ? 'bg-amber-200 text-amber-950 font-extrabold border border-amber-300'
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
            className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 text-rose-900 dark:text-rose-200 rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center"
            title="上一周期 (上一月 / 上一周 / 上一天)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* 快捷年份与月份选择下拉框 (极速跳转，无需频繁点击) */}
          <div className="flex items-center gap-1 bg-rose-50/90 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 p-1 rounded-xl">
            <select
              value={currentDate.getFullYear()}
              onChange={(e) => {
                const newY = parseInt(e.target.value, 10);
                const next = new Date(currentDate);
                next.setFullYear(newY);
                setCurrentDate(next);
              }}
              className="bg-white dark:bg-slate-900 text-rose-950 dark:text-rose-200 font-black text-xs px-2 py-1 rounded-lg border border-rose-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              title="选择年份"
            >
              {Array.from({ length: 13 }, (_, i) => 2020 + i).map((y) => (
                <option key={y} value={y}>{y} 年</option>
              ))}
            </select>

            <select
              value={currentDate.getMonth()}
              onChange={(e) => {
                const newM = parseInt(e.target.value, 10);
                const next = new Date(currentDate);
                next.setMonth(newM);
                setCurrentDate(next);
              }}
              className="bg-white dark:bg-slate-900 text-rose-950 dark:text-rose-200 font-black text-xs px-2 py-1 rounded-lg border border-rose-200 dark:border-slate-700 focus:outline-none cursor-pointer"
              title="选择月份"
            >
              {Array.from({ length: 12 }, (_, i) => i).map((m) => (
                <option key={m} value={m}>{m + 1} 月</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleGoToToday}
              className="px-3.5 py-1.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 font-bold text-xs rounded-xl transition border border-rose-300 dark:border-rose-800 cursor-pointer active:scale-95"
            >
              今天
            </button>
            <span className="text-xs font-bold text-rose-900 dark:text-rose-200 bg-rose-50/80 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 px-2.5 py-1 rounded-lg">
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
            className="p-2 bg-rose-50 hover:bg-rose-100 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 text-rose-900 dark:text-rose-200 rounded-xl transition cursor-pointer active:scale-95 flex items-center justify-center"
            title="下一周期 (下一月 / 下一周 / 下一天)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold text-zinc-600 dark:text-slate-300 ml-1">
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

      {/* 拖拽与快捷操作提示条 */}
      <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-2.5 flex items-center justify-between text-xs text-rose-900 gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs text-rose-700">
            <GripVertical className="w-3.5 h-3.5 text-rose-600" />
            拖拽与快捷操作
          </span>
          <span>按住任务卡片左侧 <GripVertical className="w-3 h-3 inline text-slate-400" /> 图标可手调执行顺序或跨时段放置；鼠标移至卡片点击 <Pencil className="w-3 h-3 inline text-sky-600" /> 可修改日程，点击 <Trash2 className="w-3 h-3 inline text-rose-600" /> 可删除日程。</span>
        </div>
      </div>

      {/* Render Active View with Smooth Scroll & Motion */}
      <div
        onWheel={(e) => {
          if (wheelCooldownRef.current) return;
          if (Math.abs(e.deltaY) > 35) {
            wheelCooldownRef.current = true;
            if (e.deltaY < 0) {
              navigatePeriod(-1);
            } else {
              navigatePeriod(1);
            }
            setTimeout(() => {
              wheelCooldownRef.current = false;
            }, 300);
          }
        }}
        className="relative"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${dimension}_${currentDate.getFullYear()}_${currentDate.getMonth()}_${currentDate.getDate()}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {renderScheduleGrid()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Schedule Edit / Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
            {/* 顶部固定 Header */}
            <div className="shrink-0 p-4 pb-3 border-b border-rose-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 rounded-t-2xl">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-rose-600" />
                <span>{selectedScheduleId ? '编辑 / 修改日程安排' : '添加新日程安排'}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 可向上/向下平滑滑动表单区域 Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* 日期与灵活精准时间设置 */}
              <div className="bg-rose-50/50 dark:bg-slate-800/50 p-3 rounded-xl border border-rose-200 dark:border-slate-700 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-1">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-rose-600" />
                      <span>日期 (YYYY-MM-DD)*</span>
                    </label>
                    <input
                      type="date"
                      value={formDateStr}
                      onChange={(e) => setFormDateStr(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>开始时间</span>
                    </label>
                    <input
                      type="time"
                      value={formStartTime}
                      onChange={(e) => handleTimePickerChange(e.target.value, formEndTime)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>

                  <div className="sm:col-span-1">
                    <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-rose-600" />
                      <span>结束时间</span>
                    </label>
                    <input
                      type="time"
                      value={formEndTime}
                      onChange={(e) => handleTimePickerChange(formStartTime, e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>
                </div>

                {/* 快捷推荐常用时段 */}
                <div>
                  <div className="text-[11px] font-bold text-rose-900 dark:text-rose-300 mb-1.5 flex items-center justify-between">
                    <span>⚡ 常用推荐时间段快捷点击：</span>
                    <span className="text-[10px] font-normal text-slate-500">（点击一键填入）</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-white dark:bg-slate-900 rounded-lg border border-rose-200/80 dark:border-slate-700">
                    {PRESET_TIME_SLOTS.map((slot) => {
                      const isSelected = formTimeStr === slot.label;
                      return (
                        <button
                          key={slot.label}
                          type="button"
                          onClick={() => handleApplyPresetTimeSlot(slot.start, slot.end)}
                          className={`px-2 py-1 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                            isSelected
                              ? 'bg-rose-600 text-white shadow-2xs'
                              : 'bg-rose-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-rose-100 dark:hover:bg-slate-700'
                          }`}
                        >
                          {slot.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 精准/自定义时间描述文本 */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    显示时间格式 / 自定义手填时间描述（将精准体现在日程表上）
                  </label>
                  <input
                    type="text"
                    placeholder="例如: 09:30 - 10:30 或 14:15 - 15:00 或 全天"
                    value={formTimeStr}
                    onChange={(e) => setFormTimeStr(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-400"
                  />
                </div>
              </div>

              {/* 周期性与多日期重复安排设置 */}
              <div className="bg-amber-50/60 dark:bg-slate-800/80 p-3 rounded-xl border border-amber-200/80 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Repeat className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>周期重复与自定义多日期安排 (支持跳选日期、剔除节假日与旅游暂停)</span>
                  </label>
                  {selectedScheduleId && (
                    <span className="text-[10px] font-bold text-slate-500 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                      编辑单次日程
                    </span>
                  )}
                </div>

                {/* 6 种重复/多日模式选择 */}
                <div className="flex flex-wrap gap-1.5">
                  {[
                    { id: 'none', label: '🚫 单次 (不重复)' },
                    { id: 'custom', label: '📆 自定义日历选日 (跳选/指定多日)' },
                    { id: 'weekly', label: '🔁 自定义周/星期重复' },
                    { id: 'daily', label: '☀️ 每天重复' },
                    { id: 'workdays', label: '💼 工作日 (周一至周五)' },
                    { id: 'monthly', label: '📅 每月同日重复' },
                  ].map((rule) => {
                    const isSelected = formRepeatMode === rule.id;
                    return (
                      <button
                        key={rule.id}
                        type="button"
                        onClick={() => setFormRepeatMode(rule.id as RepeatMode)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-2xs ring-2 ring-amber-400/50'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-amber-100/80 dark:hover:bg-slate-700 border border-amber-200/60 dark:border-slate-700'
                        }`}
                      >
                        {rule.label}
                      </button>
                    );
                  })}
                </div>

                {/* 1. 如果选择了“自定义日历选日 (跳选)”，展开嵌入式交互月历 */}
                {!selectedScheduleId && formRepeatMode === 'custom' && (
                  <div className="p-3 bg-white dark:bg-slate-900/90 rounded-xl border border-amber-300/80 dark:border-slate-700 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-amber-950 dark:text-amber-200 text-xs flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5 text-amber-600" />
                          <span>点击日历格直接跳选/取消日期:</span>
                        </span>
                        <span className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-md border border-amber-300">
                          已自定义勾选 {formCustomDates.length} 天
                        </span>
                      </div>

                      {/* 月份导航 */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setCustomCalendarMonth(new Date(customCalendarMonth.getFullYear(), customCalendarMonth.getMonth() - 1, 1))}
                          className="p-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-slate-800 text-amber-900 dark:text-amber-200 text-xs font-bold cursor-pointer"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-bold text-xs text-slate-800 dark:text-slate-100 font-mono px-1">
                          {customCalendarMonth.getFullYear()}年 {customCalendarMonth.getMonth() + 1}月
                        </span>
                        <button
                          type="button"
                          onClick={() => setCustomCalendarMonth(new Date(customCalendarMonth.getFullYear(), customCalendarMonth.getMonth() + 1, 1))}
                          className="p-1 rounded bg-amber-100 hover:bg-amber-200 dark:bg-slate-800 text-amber-900 dark:text-amber-200 text-xs font-bold cursor-pointer"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 快捷选日工具栏 */}
                    <div className="flex flex-wrap items-center gap-1 pt-0.5 pb-1 border-b border-amber-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold">本月快捷:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const year = customCalendarMonth.getFullYear();
                          const month = customCalendarMonth.getMonth();
                          const daysInM = new Date(year, month + 1, 0).getDate();
                          const newDates = new Set(formCustomDates);
                          for (let day = 1; day <= daysInM; day++) {
                            const d = new Date(year, month, day);
                            if (d.getDay() === 1) newDates.add(formatDateKey(d));
                          }
                          setFormCustomDates(Array.from(newDates).sort());
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100/80 hover:bg-amber-200 dark:bg-slate-800 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-slate-700 cursor-pointer"
                      >
                        🎯 选本月周一
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const year = customCalendarMonth.getFullYear();
                          const month = customCalendarMonth.getMonth();
                          const daysInM = new Date(year, month + 1, 0).getDate();
                          const newDates = new Set(formCustomDates);
                          for (let day = 1; day <= daysInM; day++) {
                            const d = new Date(year, month, day);
                            if (d.getDay() === 5) newDates.add(formatDateKey(d));
                          }
                          setFormCustomDates(Array.from(newDates).sort());
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100/80 hover:bg-amber-200 dark:bg-slate-800 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-slate-700 cursor-pointer"
                      >
                        🎯 选本月周五
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const year = customCalendarMonth.getFullYear();
                          const month = customCalendarMonth.getMonth();
                          const daysInM = new Date(year, month + 1, 0).getDate();
                          const newDates = new Set(formCustomDates);
                          for (let day = 1; day <= daysInM; day++) {
                            const d = new Date(year, month, day);
                            if (d.getDay() >= 1 && d.getDay() <= 5) newDates.add(formatDateKey(d));
                          }
                          setFormCustomDates(Array.from(newDates).sort());
                        }}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100/80 hover:bg-amber-200 dark:bg-slate-800 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-slate-700 cursor-pointer"
                      >
                        💼 选本月工作日
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormCustomDates([])}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 cursor-pointer ml-auto"
                      >
                        🧹 清空自选
                      </button>
                    </div>

                    {/* Mini Calendar Grid */}
                    {(() => {
                      const year = customCalendarMonth.getFullYear();
                      const month = customCalendarMonth.getMonth();
                      const firstDay = new Date(year, month, 1);
                      let startingDay = firstDay.getDay();
                      startingDay = startingDay === 0 ? 6 : startingDay - 1;
                      const daysInM = new Date(year, month + 1, 0).getDate();

                      return (
                        <div className="space-y-1">
                          <div className="grid grid-cols-7 text-center font-bold text-[10px] text-slate-500 bg-amber-50 dark:bg-slate-800/80 p-1 rounded-md">
                            <div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div><div>日</div>
                          </div>
                          <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: startingDay }).map((_, i) => (
                              <div key={`empty-${i}`} className="h-7 rounded bg-slate-50/50 dark:bg-slate-900/40 opacity-30" />
                            ))}
                            {Array.from({ length: daysInM }).map((_, i) => {
                              const dayNum = i + 1;
                              const dateObj = new Date(year, month, dayNum);
                              const dateKey = formatDateKey(dateObj);
                              const isSelected = formCustomDates.includes(dateKey);
                              const isBaseDate = dateKey === formDateStr;

                              return (
                                <button
                                  key={dayNum}
                                  type="button"
                                  onClick={() => {
                                    if (isSelected) {
                                      setFormCustomDates(formCustomDates.filter((d) => d !== dateKey));
                                    } else {
                                      setFormCustomDates([...formCustomDates, dateKey].sort());
                                    }
                                  }}
                                  className={`h-7 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                                    isSelected
                                      ? 'bg-amber-600 text-white shadow-2xs ring-2 ring-amber-400/60'
                                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100/60 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  <span>{dayNum}</span>
                                  {isBaseDate && (
                                    <span className="text-[7px] leading-none opacity-80">
                                      首日
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 2. 如果选择了“自定义周/星期重复”，展开星期勾选与周频间隔设置 */}
                {!selectedScheduleId && formRepeatMode === 'weekly' && (
                  <div className="p-2.5 bg-white dark:bg-slate-900/90 rounded-xl border border-amber-300/80 dark:border-slate-700 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1">
                        <span>📅 请选择重复的星期几 (可多选):</span>
                      </span>

                      {/* 快捷勾选组合 */}
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setFormSelectedWeekDays([1, 2, 3, 4])}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition cursor-pointer"
                        >
                          周一至周四
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormSelectedWeekDays([1, 2, 3, 4, 5])}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition cursor-pointer"
                        >
                          工作日(一至五)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormSelectedWeekDays([6, 0])}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition cursor-pointer"
                        >
                          周末(六、日)
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormSelectedWeekDays([1, 2, 3, 4, 5, 6, 0])}
                          className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 transition cursor-pointer"
                        >
                          全选(一至日)
                        </button>
                      </div>
                    </div>

                    {/* 7 个星期选择块 */}
                    <div className="grid grid-cols-7 gap-1">
                      {[
                        { id: 1, label: '周一' },
                        { id: 2, label: '周二' },
                        { id: 3, label: '周三' },
                        { id: 4, label: '周四' },
                        { id: 5, label: '周五' },
                        { id: 6, label: '周六' },
                        { id: 0, label: '周日' },
                      ].map((item) => {
                        const isChecked = formSelectedWeekDays.includes(item.id);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (isChecked) {
                                if (formSelectedWeekDays.length > 1) {
                                  setFormSelectedWeekDays(formSelectedWeekDays.filter((d) => d !== item.id));
                                }
                              } else {
                                setFormSelectedWeekDays([...formSelectedWeekDays, item.id]);
                              }
                            }}
                            className={`py-1.5 rounded-lg text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer ${
                              isChecked
                                ? 'bg-amber-600 text-white shadow-2xs ring-2 ring-amber-400/50'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-amber-100/60'
                            }`}
                          >
                            <span>{item.label}</span>
                            <span className="text-[9px] opacity-80">{isChecked ? '✓' : '+'}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* 周频间隔（每周 / 隔周 / 每3周） */}
                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">周数间隔:</span>
                      <div className="flex items-center gap-1">
                        {[
                          { val: 1, label: '每周' },
                          { val: 2, label: '每 2 周 (隔周)' },
                          { val: 3, label: '每 3 周' },
                          { val: 4, label: '每 4 周' },
                        ].map((intvl) => (
                          <button
                            key={intvl.val}
                            type="button"
                            onClick={() => setFormWeekInterval(intvl.val)}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                              formWeekInterval === intvl.val
                                ? 'bg-amber-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {intvl.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. 排除与暂停规则设置（节假日剔除 & 旅游休假暂停区间） */}
                {!selectedScheduleId && formRepeatMode !== 'none' && (
                  <div className="space-y-2 pt-1">
                    {/* A. 自动去除节假日开关 */}
                    <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-rose-200/80 dark:border-slate-700 shadow-2xs">
                      <label className="flex items-center gap-2 font-bold text-xs text-slate-800 dark:text-slate-200 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formExcludeHolidays}
                          onChange={(e) => setFormExcludeHolidays(e.target.checked)}
                          className="w-4 h-4 rounded text-rose-600 accent-rose-600 cursor-pointer"
                        />
                        <span className="flex items-center gap-1">
                          <span>🎉 自动去除/跳过法定节假日 (国庆节、春节、劳动节、元旦等)</span>
                        </span>
                      </label>
                      <span className="text-[10px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                        {formExcludeHolidays ? '已启用节假日剔除' : '未启用'}
                      </span>
                    </div>

                    {/* B. 暂停/休假/旅游区间设置 */}
                    <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200/80 dark:border-slate-700 space-y-2 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-xs">
                          <Umbrella className="w-3.5 h-3.5 text-amber-600" />
                          <span>休假/暂停/旅游区间 (如外出旅游暂停两周)</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowAddPauseRange(!showAddPauseRange)}
                          className="text-[10px] font-bold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950 px-2 py-1 rounded-lg border border-amber-300 dark:border-amber-700 hover:bg-amber-200 transition cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>添加休假暂停区间</span>
                        </button>
                      </div>

                      {/* 已添加的休假区间清单 */}
                      {formExcludeRanges.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {formExcludeRanges.map((range) => (
                            <span
                              key={range.id}
                              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 flex items-center gap-1.5 shadow-2xs"
                            >
                              <span>🏖️ {range.label || '暂停'}: {range.start} ~ {range.end}</span>
                              <button
                                type="button"
                                onClick={() => setFormExcludeRanges(formExcludeRanges.filter((r) => r.id !== range.id))}
                                className="text-amber-700 dark:text-amber-300 hover:text-rose-600 p-0.5 rounded cursor-pointer"
                                title="删除此休假暂停区间"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* 展开新增休假区间表单 */}
                      {showAddPauseRange && (
                        <div className="p-2 bg-amber-50 dark:bg-slate-800/90 rounded-lg border border-amber-300 dark:border-slate-700 space-y-2 animate-fadeIn">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">休假开始日期</label>
                              <input
                                type="date"
                                value={newPauseStart}
                                onChange={(e) => setNewPauseStart(e.target.value)}
                                className="w-full p-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 rounded text-xs font-bold text-slate-800 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">休假结束日期</label>
                              <input
                                type="date"
                                value={newPauseEnd}
                                onChange={(e) => setNewPauseEnd(e.target.value)}
                                className="w-full p-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 rounded text-xs font-bold text-slate-800 dark:text-slate-100"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 mb-0.5">休假/暂停备注说明</label>
                              <input
                                type="text"
                                placeholder="例如: 外出旅游两周"
                                value={newPauseLabel}
                                onChange={(e) => setNewPauseLabel(e.target.value)}
                                className="w-full p-1 bg-white dark:bg-slate-900 border border-amber-300 dark:border-slate-700 rounded text-xs font-bold text-slate-800 dark:text-slate-100"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowAddPauseRange(false)}
                              className="px-2 py-1 text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                            >
                              取消
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (!newPauseStart || !newPauseEnd) {
                                  alert('请选择有效的休假/暂停起止日期！');
                                  return;
                                }
                                if (newPauseStart > newPauseEnd) {
                                  alert('休假开始日期不能晚于结束日期！');
                                  return;
                                }
                                const newRange: PauseRange = {
                                  id: 'pause_' + Date.now(),
                                  start: newPauseStart,
                                  end: newPauseEnd,
                                  label: newPauseLabel.trim() || '休假/旅游',
                                };
                                setFormExcludeRanges([...formExcludeRanges, newRange]);
                                setNewPauseStart('');
                                setNewPauseEnd('');
                                setShowAddPauseRange(false);
                              }}
                              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-bold text-[11px] cursor-pointer shadow-2xs"
                            >
                              保存休假区间
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. 终止条件 (非 custom 模式下) 与 实时生成日期序列预览 */}
                {!selectedScheduleId && formRepeatMode !== 'none' && (
                  <div className="pt-2 border-t border-amber-200/60 dark:border-slate-700 space-y-2">
                    {formRepeatMode !== 'custom' && (
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">终止规则:</span>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="repeatEndType"
                              checked={formRepeatEndType === 'count'}
                              onChange={() => setFormRepeatEndType('count')}
                              className="accent-amber-600"
                            />
                            <span>按重复次数</span>
                          </label>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="radio"
                              name="repeatEndType"
                              checked={formRepeatEndType === 'untilDate'}
                              onChange={() => setFormRepeatEndType('untilDate')}
                              className="accent-amber-600"
                            />
                            <span>按截止日期</span>
                          </label>
                        </div>

                        {formRepeatEndType === 'count' ? (
                          <div className="flex items-center gap-1 text-xs">
                            {[2, 4, 8, 12, 24].map((cnt) => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => setFormRepeatCount(cnt)}
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition cursor-pointer ${
                                  formRepeatCount === cnt
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-amber-200 dark:border-slate-700'
                                }`}
                              >
                                {cnt}次
                              </button>
                            ))}
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={formRepeatCount}
                              onChange={(e) => setFormRepeatCount(parseInt(e.target.value, 10) || 1)}
                              className="w-12 p-0.5 border border-amber-300 dark:border-slate-700 rounded text-center font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                            />
                            <span>期</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs">
                            <span>截止到:</span>
                            <input
                              type="date"
                              value={formRepeatUntilDate}
                              onChange={(e) => setFormRepeatUntilDate(e.target.value)}
                              className="p-1 border border-amber-300 dark:border-slate-700 rounded font-bold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* 实时生成日期序列与二次点选剔除/恢复预览 */}
                    {(() => {
                      const { validDates, excludedInfo } = calculateRepeatDatesDetailed(
                        formDateStr,
                        formRepeatMode,
                        formSelectedWeekDays,
                        formWeekInterval,
                        formRepeatEndType,
                        formRepeatCount,
                        formRepeatUntilDate,
                        formCustomDates,
                        formExcludeHolidays,
                        formExcludedDates,
                        formExcludeRanges
                      );
                      const weekMap = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

                      return (
                        <div className="p-2.5 bg-amber-100/50 dark:bg-slate-900/80 rounded-xl border border-amber-300/80 dark:border-slate-700/80 space-y-2">
                          <div className="text-[11px] font-bold text-amber-950 dark:text-amber-200 flex items-center justify-between">
                            <span>⚡ 将自动生成 {validDates.length} 期重复日程卡片：</span>
                            {validDates.length > 0 && (
                              <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                                跨度: {validDates[0]} ~ {validDates[validDates.length - 1]}
                              </span>
                            )}
                          </div>

                          {/* 有效日期列表 */}
                          {validDates.length === 0 ? (
                            <div className="p-3 text-center text-xs text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 rounded-lg border border-rose-200">
                              ⚠️ 当前规则与休假/节假日排除条件叠加后无有效生成日期，请调整规则设置。
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1 max-h-32 overflow-y-auto p-1 bg-white/70 dark:bg-slate-800/70 rounded-lg border border-amber-200 dark:border-slate-700">
                              {validDates.map((d, idx) => {
                                const dObj = new Date(d);
                                const wName = !isNaN(dObj.getTime()) ? weekMap[dObj.getDay()] : '';
                                return (
                                  <span
                                    key={d + idx}
                                    className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-white dark:bg-slate-900 text-amber-950 dark:text-amber-200 border border-amber-300 dark:border-slate-700 shadow-2xs flex items-center gap-1 group"
                                  >
                                    <span>#{idx + 1} {d} <span className="opacity-75">({wName})</span></span>
                                    <button
                                      type="button"
                                      onClick={() => setFormExcludedDates([...formExcludedDates, d])}
                                      className="text-amber-700 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 p-0.5 rounded cursor-pointer opacity-60 group-hover:opacity-100 transition"
                                      title="点此单独立即排除此日期"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                );
                              })}
                            </div>
                          )}

                          {/* 排除/跳过日期提示 */}
                          {excludedInfo.length > 0 && (
                            <div className="pt-2 border-t border-amber-200 dark:border-slate-700/80 space-y-1">
                              <div className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                <span>🎉 已跳过 / 剔除 {excludedInfo.length} 个不安排日期：</span>
                              </div>
                              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                {excludedInfo.map((ex) => (
                                  <span
                                    key={ex.dateStr}
                                    className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center gap-1"
                                  >
                                    <span>{ex.dateStr} ({ex.reason})</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormExcludedDates(formExcludedDates.filter((d) => d !== ex.dateStr));
                                        if (formRepeatMode === 'custom' && !formCustomDates.includes(ex.dateStr)) {
                                          setFormCustomDates([...formCustomDates, ex.dateStr].sort());
                                        }
                                      }}
                                      className="text-xs text-sky-600 dark:text-sky-400 underline hover:text-sky-800 ml-1 cursor-pointer font-bold"
                                      title="恢复纳入生成"
                                    >
                                      恢复
                                    </button>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* 日程类型：自主添加与快捷选框 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block font-bold text-slate-800 dark:text-slate-200">
                    选择日程类型（支持自主选择与新增分类）*
                  </label>
                  <button
                    type="button"
                    onClick={() => setCategoryModalOpen(true)}
                    className="text-[11px] text-rose-700 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    <Settings className="w-3 h-3" />
                    <span>管理分类类型</span>
                  </button>
                </div>

                {/* 快捷选分类按钮组 */}
                <div className="flex flex-wrap gap-2 p-2.5 bg-rose-50/50 dark:bg-slate-800/50 border border-rose-200 dark:border-slate-700 rounded-xl">
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
                            : 'bg-white dark:bg-slate-800 text-zinc-700 dark:text-slate-200 border border-rose-200 dark:border-slate-700 hover:bg-rose-100/70'
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
                    className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-100 dark:bg-slate-700 hover:bg-rose-200 text-rose-900 dark:text-slate-100 border border-dashed border-rose-300 dark:border-slate-600 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>自主添加类型...</span>
                  </button>
                </div>
              </div>

              {/* 关联对象组：多维选择（个体咨询/个体督导/团体督导）+ 自定义自由手填 (完全可选) */}
              <div className="relative" ref={objectPickerRef}>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-rose-600" />
                    <span>关联对象 / 个案 / 督导师 / 参与者 (可选，可不选)</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowObjectPicker((prev) => !prev)}
                    className="text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 px-2 py-1 rounded-lg border border-rose-200 dark:border-slate-700 flex items-center gap-1 transition cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>快捷选择对象</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showObjectPicker ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <div className="relative flex items-center">
                  <input
                    type="text"
                    placeholder="可选填对象名称；也可留空不填（如团体活动、研讨会等）"
                    value={formClientName}
                    onChange={(e) => setFormClientName(e.target.value)}
                    className="w-full p-2.5 pr-28 border border-rose-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-400 font-bold"
                  />
                  {formClientName && (
                    <button
                      type="button"
                      onClick={() => setFormClientName('')}
                      className="absolute right-20 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
                      title="清空选择"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowObjectPicker((prev) => !prev)}
                    className="absolute right-1.5 px-2.5 py-1 text-[11px] font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition cursor-pointer flex items-center gap-1"
                  >
                    <span>选择对象</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-between">
                  <span>💡 可自由手动打字，也可选择“个体个案”、“督导”或直接留空不选。</span>
                  {formClientName && (
                    <button
                      type="button"
                      onClick={() => setFormClientName('')}
                      className="text-rose-600 dark:text-rose-400 underline font-bold cursor-pointer hover:text-rose-700"
                    >
                      清空关联对象
                    </button>
                  )}
                </div>

                {/* 多维快捷对象下拉选框 Floating Dropdown */}
                {showObjectPicker && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-2xl shadow-xl z-50 p-3 max-h-80 overflow-y-auto space-y-3 divide-y divide-rose-100 dark:divide-slate-700">
                    {/* 0. 顶部一键留空 / 不关联对象选项 */}
                    <div className="pb-1">
                      <button
                        type="button"
                        onClick={() => {
                          setFormClientName('');
                          setShowObjectPicker(false);
                        }}
                        className="w-full p-2 text-center bg-rose-50 dark:bg-slate-700/80 hover:bg-rose-100 dark:hover:bg-slate-700 rounded-xl text-rose-800 dark:text-rose-200 font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-rose-200 dark:border-slate-600"
                      >
                        <X className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                        <span>不选择/清空关联对象（保持留空）</span>
                      </button>
                    </div>

                    {/* 1. 个体咨询对象组 */}
                    <div className="pt-2">
                      <div className="text-[11px] font-bold text-rose-800 dark:text-rose-300 mb-1.5 flex items-center gap-1.5 px-1">
                        <Users className="w-3.5 h-3.5 text-rose-600" />
                        <span>👥 选择个体咨询对象 (当前案例库)</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {cases.length > 0 ? (
                          cases.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => {
                                setFormClientName(`${c.caseNum} ${c.name}`);
                                setFormType('consult');
                                setShowObjectPicker(false);
                              }}
                              className="p-2 text-left bg-rose-50/60 dark:bg-slate-700/60 hover:bg-rose-100 dark:hover:bg-slate-700 rounded-xl border border-rose-100 dark:border-slate-600 transition flex items-center justify-between cursor-pointer"
                            >
                              <div>
                                <div className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                  {c.caseNum} {c.name}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  {c.category === 'longTerm' ? '长程个案' : '短程个案'} · 已做{(Object.values(c.sessions || {}) as SessionData[]).filter((s) => s.completed).length}次
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-rose-600 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-rose-200 dark:border-slate-600">
                                咨询
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="text-[11px] text-slate-400 p-2 col-span-2">暂无个案数据</div>
                        )}
                      </div>
                    </div>

                    {/* 2. 个体督导导师与对象组 */}
                    <div className="pt-2">
                      <div className="text-[11px] font-bold text-sky-800 dark:text-sky-300 mb-1.5 flex items-center gap-1.5 px-1">
                        <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                        <span>👨‍🏫 选择个体督导导师 / 案主</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {mentors.length > 0 ? (
                          mentors.map((m) => (
                            <button
                              key={`ind_${m.id}`}
                              type="button"
                              onClick={() => {
                                setFormClientName(`${m.name} (个体督导)`);
                                setFormType('individual_supervision');
                                setShowObjectPicker(false);
                              }}
                              className="p-2 text-left bg-sky-50/60 dark:bg-slate-700/60 hover:bg-sky-100 dark:hover:bg-slate-700 rounded-xl border border-sky-100 dark:border-slate-600 transition flex items-center justify-between cursor-pointer"
                            >
                              <div>
                                <div className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                  {m.name} {m.gender}
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  个体督导 · 包含{m.records?.filter((r) => r.type === 'individual').length || 0}条记录
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-sky-600 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-sky-200 dark:border-slate-600">
                                个体督导
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="text-[11px] text-slate-400 p-2 col-span-2">暂无督导师数据</div>
                        )}
                      </div>
                    </div>

                    {/* 3. 团体督导小组组 */}
                    <div className="pt-2">
                      <div className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 mb-1.5 flex items-center gap-1.5 px-1">
                        <Users className="w-3.5 h-3.5 text-indigo-600" />
                        <span>👥 选择团体督导小组 / 导师</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {mentors.length > 0 ? (
                          mentors.map((m) => (
                            <button
                              key={`grp_${m.id}`}
                              type="button"
                              onClick={() => {
                                setFormClientName(`${m.name} 团体督导小组`);
                                setFormType('group_supervision');
                                setShowObjectPicker(false);
                              }}
                              className="p-2 text-left bg-indigo-50/60 dark:bg-slate-700/60 hover:bg-indigo-100 dark:hover:bg-slate-700 rounded-xl border border-indigo-100 dark:border-slate-600 transition flex items-center justify-between cursor-pointer"
                            >
                              <div>
                                <div className="font-bold text-xs text-slate-800 dark:text-slate-100">
                                  {m.name} 团体督导小组
                                </div>
                                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                  团体督导 · 包含{m.records?.filter((r) => r.type === 'group').length || 0}条记录
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-indigo-600 bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-slate-600">
                                团督小组
                              </span>
                            </button>
                          ))
                        ) : (
                          <div className="text-[11px] text-slate-400 p-2 col-span-2">暂无督导师数据</div>
                        )}
                      </div>
                    </div>

                    {/* 4. 常见通用主题 (可选设类型且不限关联对象) */}
                    <div className="pt-2">
                      <div className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 mb-1.5 flex items-center gap-1.5 px-1">
                        <Bookmark className="w-3.5 h-3.5 text-emerald-600" />
                        <span>🎯 常见快捷通用类型（可填关联人，也可留空）</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { name: '动力团体小组', type: 'dynamic_group' },
                          { name: '心理学术读书会', type: 'course' },
                          { name: '案例督导研讨会', type: 'individual_supervision' },
                          { name: '个人体验咨询', type: 'consult' },
                          { name: '伦理与督导研讨', type: 'group_supervision' },
                        ].map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormType(item.type);
                              setShowObjectPicker(false);
                            }}
                            className="px-2.5 py-1 text-xs font-bold bg-emerald-50 dark:bg-slate-700 hover:bg-emerald-100 dark:hover:bg-slate-600 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-slate-600 rounded-lg transition cursor-pointer"
                          >
                            + 切换为【{item.name}】类型
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
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

            {/* 底部固定 Footer 操作区 (保证保存与取消按钮永不脱离视口) */}
            <div className="shrink-0 p-4 pt-3 border-t border-rose-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl flex items-center justify-between z-10 shadow-lg">
              {selectedScheduleId ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCurrentModalSchedule();
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onTouchStart={(e) => e.stopPropagation()}
                  className="px-3.5 py-2 text-xs font-bold text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl border border-rose-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer select-none touch-manipulation active:scale-95 shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>删除日程</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveModal}
                  className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>保存日程</span>
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
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleDeleteCategory(cat.id);
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="text-slate-600 hover:text-rose-900 p-1 rounded-full hover:bg-white/80 transition cursor-pointer select-none touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
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
