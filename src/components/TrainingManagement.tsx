import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  X,
  BookOpen,
  Award,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  FileText,
} from 'lucide-react';
import { TrainingCourse, TrainingCategory, TrainingSessionRecord } from '../types';

interface TrainingManagementProps {
  trainings?: TrainingCourse[];
  onUpdateTrainings: (updated: TrainingCourse[]) => void;
  trainingTypeFilter?: 'all' | TrainingCategory;
  onTypeFilterChange?: (filter: 'all' | TrainingCategory) => void;
}

const CATEGORY_MAP: Record<TrainingCategory, { label: string; bg: string; text: string; border: string }> = {
  psychodynamics: {
    label: '长程动力学培训',
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-200 dark:border-indigo-800',
  },
  longShort: {
    label: '动力学短程培训',
    bg: 'bg-sky-50 dark:bg-sky-950/50',
    text: 'text-sky-700 dark:text-sky-300',
    border: 'border-sky-200 dark:border-sky-800',
  },
  otherSchools: {
    label: '其他流派培训',
    bg: 'bg-purple-50 dark:bg-purple-950/50',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-200 dark:border-purple-800',
  },
  ethicsCrisis: {
    label: '伦理及危机干预培训',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
  },
};

export const TrainingManagement: React.FC<TrainingManagementProps> = ({
  trainings = [],
  onUpdateTrainings,
  trainingTypeFilter: propTypeFilter,
  onTypeFilterChange,
}) => {
  const [localTypeFilter, setLocalTypeFilter] = useState<'all' | TrainingCategory>('all');
  const activeTypeFilter = propTypeFilter ?? localTypeFilter;

  const setFilter = (filter: 'all' | TrainingCategory) => {
    setLocalTypeFilter(filter);
    onTypeFilterChange?.(filter);
  };

  // Add/Edit Course Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);

  // Form Fields
  const [formCategory, setFormCategory] = useState<TrainingCategory>('psychodynamics');
  const [formName, setFormName] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formTotalHours, setFormTotalHours] = useState('60');
  const [formStatus, setFormStatus] = useState<'ongoing' | 'completed'>('ongoing');
  const [formOrganization, setFormOrganization] = useState('');
  const [formInstructor, setFormInstructor] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Expand Session Details Map
  const [expandedCourseIds, setExpandedCourseIds] = useState<Record<string, boolean>>({});

  // Add Session Modal State
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [activeCourseForSession, setActiveCourseForSession] = useState<string | null>(null);
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionTitle, setSessionTitle] = useState('');
  const [sessionHours, setSessionHours] = useState('4');
  const [sessionNote, setSessionNote] = useState('');

  // Open modal to create
  const handleOpenAddModal = (defaultCat?: TrainingCategory) => {
    setEditingCourseId(null);
    setFormCategory(defaultCat || (activeTypeFilter !== 'all' ? activeTypeFilter : 'psychodynamics'));
    setFormName('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormEndDate('');
    setFormTotalHours('60');
    setFormStatus('ongoing');
    setFormOrganization('');
    setFormInstructor('');
    setFormDescription('');
    setIsModalOpen(true);
  };

  // Open modal to edit
  const handleOpenEditModal = (course: TrainingCourse) => {
    setEditingCourseId(course.id);
    setFormCategory(course.category);
    setFormName(course.name);
    setFormStartDate(course.startDate || '');
    setFormEndDate(course.endDate || '');
    setFormTotalHours(String(course.totalHours || 0));
    setFormStatus(course.status);
    setFormOrganization(course.organization || '');
    setFormInstructor(course.instructor || '');
    setFormDescription(course.description || '');
    setIsModalOpen(true);
  };

  // Save course
  const handleSaveCourse = () => {
    if (!formName.trim()) {
      alert('请填写培训项目名称！');
      return;
    }

    const hours = Math.max(0, Number(formTotalHours) || 0);

    if (editingCourseId) {
      // Update existing
      const updated = trainings.map((c) => {
        if (c.id === editingCourseId) {
          return {
            ...c,
            category: formCategory,
            name: formName.trim(),
            startDate: formStartDate,
            endDate: formEndDate,
            totalHours: hours,
            status: formStatus,
            organization: formOrganization.trim(),
            instructor: formInstructor.trim(),
            description: formDescription.trim(),
          };
        }
        return c;
      });
      onUpdateTrainings(updated);
    } else {
      // Create new
      const newCourse: TrainingCourse = {
        id: `tr_${Date.now()}`,
        category: formCategory,
        name: formName.trim(),
        startDate: formStartDate,
        endDate: formEndDate,
        totalHours: hours,
        status: formStatus,
        organization: formOrganization.trim(),
        instructor: formInstructor.trim(),
        description: formDescription.trim(),
        sessions: [],
      };
      onUpdateTrainings([newCourse, ...trainings]);
    }

    setIsModalOpen(false);
  };

  // Toggle Ongoing Status directly on card
  const handleToggleStatus = (courseId: string) => {
    const updated = trainings.map((c) => {
      if (c.id === courseId) {
        const nextStatus: 'ongoing' | 'completed' = c.status === 'ongoing' ? 'completed' : 'ongoing';
        return { ...c, status: nextStatus };
      }
      return c;
    });
    onUpdateTrainings(updated);
  };

  // Delete course
  const handleDeleteCourse = (courseId: string, courseName: string) => {
    if (confirm(`确认要删除培训项目“${courseName}”吗？此操作无法撤销。`)) {
      onUpdateTrainings(trainings.filter((c) => c.id !== courseId));
    }
  };

  // Filtered trainings
  const filteredTrainings = activeTypeFilter === 'all'
    ? trainings
    : trainings.filter((t) => t.category === activeTypeFilter);

  // Statistics
  const ongoingCount = trainings.filter((t) => t.status === 'ongoing').length;
  const completedCount = trainings.filter((t) => t.status === 'completed').length;
  const totalHoursSum = trainings.reduce((acc, t) => acc + (t.totalHours || 0), 0);

  // Toggle sessions view
  const toggleExpandCourse = (id: string) => {
    setExpandedCourseIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Add Session to Course
  const handleSaveSession = () => {
    if (!activeCourseForSession) return;
    if (!sessionTitle.trim()) {
      alert('请输入讲座或课程主题！');
      return;
    }

    const newSession: TrainingSessionRecord = {
      id: `ts_${Date.now()}`,
      date: sessionDate,
      title: sessionTitle.trim(),
      hours: Math.max(0, Number(sessionHours) || 0),
      note: sessionNote.trim(),
      completed: true,
    };

    const updated = trainings.map((c) => {
      if (c.id === activeCourseForSession) {
        const existingSessions = c.sessions || [];
        return { ...c, sessions: [...existingSessions, newSession] };
      }
      return c;
    });

    onUpdateTrainings(updated);
    setIsSessionModalOpen(false);
    setSessionTitle('');
    setSessionNote('');
  };

  // Delete Session
  const handleDeleteSession = (courseId: string, sessionId: string) => {
    if (!confirm('确定要删除此打卡记录吗？')) return;
    const updated = trainings.map((c) => {
      if (c.id === courseId) {
        return { ...c, sessions: (c.sessions || []).filter((s) => s.id !== sessionId) };
      }
      return c;
    });
    onUpdateTrainings(updated);
  };

  return (
    <div className="space-y-6">
      {/* 1. 顶部主标题与分类筛选 */}
      <div className="bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-indigo-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500 text-white rounded-2xl shadow-md">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>学习培训主页</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  专业进修
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                长程动力学、长短程、其他流派及伦理危机干预系统培训档案
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleOpenAddModal()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>新增培训项目</span>
          </button>
        </div>

        {/* 顶部统计卡片 */}
        <div className="grid grid-cols-3 gap-3 my-4">
          <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-center">
            <div className="text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>正在持续中项目</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-emerald-900 dark:text-emerald-100 mt-0.5">
              {ongoingCount} <span className="text-xs font-normal">项</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl text-center">
            <div className="text-xs text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-slate-500" />
              <span>已结业项目</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-slate-800 dark:text-slate-100 mt-0.5">
              {completedCount} <span className="text-xs font-normal">项</span>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-xl text-center">
            <div className="text-xs text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" />
              <span>累计培训总时数</span>
            </div>
            <div className="text-lg sm:text-xl font-black text-indigo-900 dark:text-indigo-100 mt-0.5">
              {totalHoursSum} <span className="text-xs font-normal">小时</span>
            </div>
          </div>
        </div>

        {/* 分类 Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTypeFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            全部培训 ({trainings.length})
          </button>

          <button
            type="button"
            onClick={() => setFilter('psychodynamics')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTypeFilter === 'psychodynamics'
                ? 'bg-indigo-600 text-white font-bold shadow-xs'
                : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900'
            }`}
          >
            <span>1. 长程动力学培训</span>
            <span className="opacity-80">({trainings.filter((t) => t.category === 'psychodynamics').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('longShort')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTypeFilter === 'longShort'
                ? 'bg-sky-600 text-white font-bold shadow-xs'
                : 'bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900'
            }`}
          >
            <span>2. 动力学短程培训</span>
            <span className="opacity-80">({trainings.filter((t) => t.category === 'longShort').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('otherSchools')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTypeFilter === 'otherSchools'
                ? 'bg-purple-600 text-white font-bold shadow-xs'
                : 'bg-purple-50 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900'
            }`}
          >
            <span>3. 其他流派培训</span>
            <span className="opacity-80">({trainings.filter((t) => t.category === 'otherSchools').length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('ethicsCrisis')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTypeFilter === 'ethicsCrisis'
                ? 'bg-rose-600 text-white font-bold shadow-xs'
                : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900'
            }`}
          >
            <span>4. 伦理及危机干预培训</span>
            <span className="opacity-80">({trainings.filter((t) => t.category === 'ethicsCrisis').length})</span>
          </button>
        </div>
      </div>

      {/* 2. 培训项目主页列表展示 */}
      {filteredTrainings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-10 text-center space-y-3">
          <GraduationCap className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
          <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
            暂无当前分类的培训项目记录
          </p>
          <button
            type="button"
            onClick={() => handleOpenAddModal(activeTypeFilter !== 'all' ? activeTypeFilter : undefined)}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700 transition cursor-pointer"
          >
            添加一个培训项目
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {filteredTrainings.map((course) => {
            const catInfo = CATEGORY_MAP[course.category] || CATEGORY_MAP.psychodynamics;
            const isExpanded = Boolean(expandedCourseIds[course.id]);
            const sessionList = course.sessions || [];
            const loggedHours = sessionList.reduce((acc, s) => acc + (s.hours || 0), 0);

            return (
              <div
                key={course.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-all hover:shadow-md"
              >
                {/* 培训主页 Banner/Header */}
                <div className="p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold border ${catInfo.bg} ${catInfo.text} ${catInfo.border}`}>
                          {catInfo.label}
                        </span>
                        {course.organization && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            <span>{course.organization}</span>
                          </span>
                        )}
                      </div>

                      <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 pt-1">
                        <BookOpen className="w-5 h-5 text-indigo-500 shrink-0" />
                        <span>{course.name}</span>
                      </h2>
                    </div>

                    {/* 必须核心需求: 状态切换按钮 (“正在持续当中”) */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      {course.status === 'ongoing' ? (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(course.id)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer group"
                          title="点击切换项目状态为：已结业"
                        >
                          <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse shrink-0" />
                          <span>正在持续当中</span>
                          <span className="text-[10px] bg-emerald-700/80 px-1.5 py-0.2 rounded font-normal opacity-90 group-hover:bg-emerald-800">
                            切换为已结业
                          </span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(course.id)}
                          className="px-3.5 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-xs font-black shadow-md transition active:scale-95 flex items-center gap-2 cursor-pointer group"
                          title="点击恢复项目状态为：正在持续当中"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>已结业</span>
                          <span className="text-[10px] bg-slate-700/80 px-1.5 py-0.2 rounded font-normal opacity-90 group-hover:bg-slate-800">
                            恢复持续中
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(course)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
                        title="编辑培训信息"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCourse(course.id, course.name);
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="p-2 text-rose-600 dark:text-rose-400 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-slate-800 dark:hover:bg-rose-600 border border-rose-200 dark:border-slate-700 rounded-xl transition cursor-pointer select-none touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
                        title="删除此培训"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 核心三要件信息网格: 1.培训名称 2.起始时间 3.培训总时数 */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    {/* 1. 起始时间 */}
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white dark:bg-slate-800 text-indigo-500 rounded-lg shadow-2xs">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500">培训起始时间</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                          {course.startDate || '未设置起始时间'}
                          {course.endDate ? ` 至 ${course.endDate}` : ' (持续进行)'}
                        </div>
                      </div>
                    </div>

                    {/* 2. 培训总时数 */}
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white dark:bg-slate-800 text-amber-500 rounded-lg shadow-2xs">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500">培训总时数</div>
                        <div className="text-xs font-black text-amber-600 dark:text-amber-400 mt-0.5">
                          {course.totalHours || 0} 小时
                        </div>
                      </div>
                    </div>

                    {/* 3. 主讲导师 / 进修进度 */}
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-white dark:bg-slate-800 text-purple-500 rounded-lg shadow-2xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-500">主讲导师 / 讲师</div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate max-w-[160px]">
                          {course.instructor || '未指定导师'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 课程简介或感悟描述 */}
                  {course.description && (
                    <div className="text-xs text-slate-600 dark:text-slate-300 bg-amber-50/40 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 p-3 rounded-xl flex items-start gap-2">
                      <FileText className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{course.description}</p>
                    </div>
                  )}

                  {/* 课程打卡与细节打卡展开栏 */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <Award className="w-4 h-4 text-indigo-500" />
                      <span>课时打卡记录 ({sessionList.length} 讲 · 已打卡 {loggedHours} / {course.totalHours} 小时)</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCourseForSession(course.id);
                          setIsSessionModalOpen(true);
                        }}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold cursor-pointer transition flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>记录一讲/打卡</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpandCourse(course.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer flex items-center gap-1"
                      >
                        <span>{isExpanded ? '收起打卡明细' : '展开打卡明细'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* 可展开的课时/讲座打卡列表 */}
                  {isExpanded && (
                    <div className="space-y-2 pt-2 animate-fadeIn border-t border-slate-100 dark:border-slate-800">
                      {sessionList.length === 0 ? (
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl text-center text-xs text-slate-400">
                          暂无详细课时打卡记录，点击上方的“记录一讲/打卡”添加课程明细
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {sessionList.map((s, idx) => (
                            <div
                              key={s.id}
                              className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex items-start justify-between gap-3 text-xs"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-100">
                                  <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-[10px] rounded font-mono">
                                    第 {idx + 1} 讲
                                  </span>
                                  <span>{s.title}</span>
                                  <span className="text-slate-400 font-normal">({s.date})</span>
                                  <span className="text-amber-600 dark:text-amber-400 font-bold ml-1">{s.hours} 小时</span>
                                </div>
                                {s.note && (
                                  <p className="text-slate-600 dark:text-slate-300 pl-2 border-l-2 border-indigo-300 dark:border-indigo-700 text-[11px]">
                                    {s.note}
                                  </p>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeleteSession(course.id, s.id);
                                }}
                                onMouseDown={(e) => e.stopPropagation()}
                                onTouchStart={(e) => e.stopPropagation()}
                                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 p-1.5 rounded-lg cursor-pointer shrink-0 transition select-none touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
                                title="删除此打卡记录"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. 新增 / 编辑 培训项目 Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <span>{editingCourseId ? '编辑培训项目档案' : '新建培训项目档案'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* 所属分类 */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  培训所属分类:
                </label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value as TrainingCategory)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="psychodynamics">1. 长程动力学培训</option>
                  <option value="longShort">2. 动力学短程培训</option>
                  <option value="otherSchools">3. 其他流派培训</option>
                  <option value="ethicsCrisis">4. 伦理及危机干预培训</option>
                </select>
              </div>

              {/* 培训名称 */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  培训名称 <span className="text-rose-500">*</span>:
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="例如: 经典长程动力学心理咨询连续培训"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* 起始时间 & 结束时间 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    培训起始时间:
                  </label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={(e) => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    结业/预计结束时间:
                  </label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={(e) => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 培训总时数 & 培训状态 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    培训总时数 (小时):
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formTotalHours}
                    onChange={(e) => setFormTotalHours(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    当前持续状态:
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as 'ongoing' | 'completed')}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="ongoing">🟢 正在持续当中</option>
                    <option value="completed">⚪ 已结业完结</option>
                  </select>
                </div>
              </div>

              {/* 主办机构 & 授课导师 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    培训机构/主办方:
                  </label>
                  <input
                    type="text"
                    value={formOrganization}
                    onChange={(e) => setFormOrganization(e.target.value)}
                    placeholder="例如: 中国心理学会"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    主讲导师/专家:
                  </label>
                  <input
                    type="text"
                    value={formInstructor}
                    onChange={(e) => setFormInstructor(e.target.value)}
                    placeholder="例如: 张教授"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* 简介与感悟 */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  培训大纲或心得简介:
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="可录入课程学习目标、重点讲座主题或收获..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-indigo-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveCourse}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
              >
                保存培训项目
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 打卡记录讲座 Modal */}
      {isSessionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>记录一讲/培训打卡</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSessionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  上课/打卡日期:
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  讲座/课程主题:
                </label>
                <input
                  type="text"
                  value={sessionTitle}
                  onChange={(e) => setSessionTitle(e.target.value)}
                  placeholder="例如: 阻抗识别与反移情觉察"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  本次课时 (小时):
                </label>
                <input
                  type="number"
                  min="0"
                  value={sessionHours}
                  onChange={(e) => setSessionHours(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  课堂笔记/感悟备忘:
                </label>
                <textarea
                  rows={2}
                  value={sessionNote}
                  onChange={(e) => setSessionNote(e.target.value)}
                  placeholder="记录课堂要点或感悟..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-indigo-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsSessionModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveSession}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-2xs"
              >
                保存打卡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
