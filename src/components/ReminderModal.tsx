import React, { useState } from 'react';
import { SystemData, ReminderItem } from '../types';
import { Bell, CheckCircle2, Clock, Plus, Trash2, X, AlertCircle, Calendar, ShieldAlert } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemData: SystemData;
  onAddReminder: (rem: Omit<ReminderItem, 'id' | 'createdAt'>) => void;
  onToggleReminder: (id: string) => void;
  onDeleteReminder: (id: string) => void;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  systemData,
  onAddReminder,
  onToggleReminder,
  onDeleteReminder,
}) => {
  const [activeTab, setActiveTab] = useState<'custom' | 'system'>('custom');

  // Form State for new custom reminder
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(() => new Date().toISOString().split('T')[0]);
  const [timeStr, setTimeStr] = useState('10:00');
  const [priority, setPriority] = useState<'high' | 'normal' | 'low'>('normal');
  const [category, setCategory] = useState<'case' | 'supervision' | 'admin' | 'general'>('case');

  if (!isOpen) return null;

  const reminders = systemData.reminders || [];
  const pendingReminders = reminders.filter((r) => !r.completed);
  const completedReminders = reminders.filter((r) => r.completed);

  // System dynamic schedule & case alerts
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySchedules = systemData.schedules.filter((s) => s.dateStr === todayStr);
  const upcomingSchedules = systemData.schedules.filter((s) => s.dateStr > todayStr).slice(0, 5);

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddReminder({
      title: title.trim(),
      dateStr: dateStr || todayStr,
      timeStr: timeStr || '09:00',
      completed: false,
      priority,
      category,
    });

    setTitle('');
  };

  const getPriorityBadge = (p: 'high' | 'normal' | 'low') => {
    if (p === 'high') {
      return <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-700 rounded-md border border-rose-200">🔴 高优先级</span>;
    }
    if (p === 'normal') {
      return <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-md border border-amber-200">🟡 普通</span>;
    }
    return <span className="px-2 py-0.5 text-[10px] font-bold bg-zinc-100 text-zinc-600 rounded-md border border-zinc-200">🟢 低优先级</span>;
  };

  const getCategoryLabel = (c: string) => {
    switch (c) {
      case 'case':
        return '📂 个案议题';
      case 'supervision':
        return '🎓 督导研讨';
      case 'admin':
        return '📝 行政归档';
      default:
        return '💡 综合提醒';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 transition-colors">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-rose-50 to-white dark:from-slate-900 dark:to-slate-800 border-b border-rose-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500 text-white rounded-2xl shadow-xs">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-800 dark:text-slate-100 flex items-center gap-2">
                <span>提醒事项中心</span>
                {pendingReminders.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-extrabold bg-rose-500 text-white rounded-full">
                    {pendingReminders.length} 待办
                  </span>
                )}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-slate-400">智能同步日程冲突、会谈督导与自定义备忘提醒</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-200 hover:bg-rose-100/60 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-2 flex items-center gap-3 border-b border-rose-100 dark:border-slate-800 bg-rose-50/30 dark:bg-slate-900/50">
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'custom'
                ? 'bg-zinc-800 dark:bg-rose-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-slate-300 hover:bg-rose-100/60 dark:hover:bg-slate-800'
            }`}
          >
            <span>📝 自定义工作提醒</span>
            <span className="text-[10px] opacity-80">({reminders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'system'
                ? 'bg-zinc-800 dark:bg-rose-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-slate-300 hover:bg-rose-100/60 dark:hover:bg-slate-800'
            }`}
          >
            <span>⚡ 智能动态警示</span>
            <span className="text-[10px] opacity-80">
              ({todaySchedules.length + upcomingSchedules.length})
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'custom' && (
            <>
              {/* Form to create reminder */}
              <form onSubmit={handleCreateReminder} className="bg-rose-50/50 dark:bg-slate-800/60 border border-rose-200 dark:border-slate-700 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-rose-500" />
                    <span>快速添加新提醒事项</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="提醒内容 (例: 准备李先生依恋模式讨论材料)..."
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-slate-300 mb-1">提醒日期</label>
                    <input
                      type="date"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-slate-300 mb-1">提醒时间</label>
                    <input
                      type="time"
                      value={timeStr}
                      onChange={(e) => setTimeStr(e.target.value)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-slate-300 mb-1">分类</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100"
                    >
                      <option value="case">📂 个案议题</option>
                      <option value="supervision">🎓 督导研讨</option>
                      <option value="admin">📝 行政归档</option>
                      <option value="general">💡 综合提醒</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-600 dark:text-slate-300 mb-1">优先级</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100"
                    >
                      <option value="high">🔴 高优先级</option>
                      <option value="normal">🟡 普通</option>
                      <option value="low">🟢 低优先级</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="px-5 py-2 bg-zinc-800 dark:bg-rose-600 hover:bg-zinc-700 dark:hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5 text-rose-300" />
                    <span>确认添加</span>
                  </button>
                </div>
              </form>

              {/* Reminders List */}
              <div className="space-y-4">
                <div className="text-xs font-bold text-zinc-700 dark:text-slate-300 flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-2">
                  <span>待办事项列表 ({reminders.length})</span>
                </div>

                {reminders.length === 0 ? (
                  <div className="text-center py-8 bg-rose-50/30 dark:bg-slate-800/40 rounded-2xl border border-rose-100 dark:border-slate-800 text-xs text-zinc-500 dark:text-slate-400">
                    目前暂无任何工作提醒，请在上方创建。
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {reminders.map((rem) => (
                      <div
                        key={rem.id}
                        className={`p-3.5 rounded-2xl border transition flex items-start justify-between gap-3 ${
                          rem.completed
                            ? 'bg-zinc-50 dark:bg-slate-900 border-zinc-200 dark:border-slate-800 opacity-60'
                            : 'bg-white dark:bg-slate-800/90 border-rose-200 dark:border-slate-700 shadow-2xs hover:border-rose-300'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => onToggleReminder(rem.id)}
                            className="mt-0.5 cursor-pointer text-zinc-400 hover:text-rose-600"
                          >
                            <CheckCircle2
                              className={`w-5 h-5 transition ${
                                rem.completed ? 'text-emerald-500 fill-emerald-100 dark:fill-emerald-950' : 'text-zinc-300 dark:text-slate-600 hover:text-rose-500'
                              }`}
                            />
                          </button>

                          <div>
                            <p
                              className={`text-xs font-bold ${
                                rem.completed ? 'line-through text-zinc-400 dark:text-slate-500' : 'text-zinc-800 dark:text-slate-100'
                              }`}
                            >
                              {rem.title}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-zinc-500 dark:text-slate-400">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-rose-400" />
                                {rem.dateStr} {rem.timeStr || ''}
                              </span>
                              <span>•</span>
                              <span>{getCategoryLabel(rem.category)}</span>
                              <span>•</span>
                              {getPriorityBadge(rem.priority)}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            if (window.confirm('确定要删除此提醒项吗？')) {
                              onDeleteReminder(rem.id);
                            }
                          }}
                          onMouseDown={(e) => e.stopPropagation()}
                          onTouchStart={(e) => e.stopPropagation()}
                          className="p-2 text-zinc-400 dark:text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer select-none touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
                          title="删除此提醒"
                        >
                          <Trash2 className="w-4 h-4 text-rose-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'system' && (
            <div className="space-y-5">
              {/* Today's Schedules Alert */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2 border-b border-rose-100 dark:border-slate-800 pb-2">
                  <Calendar className="w-4 h-4 text-rose-500" />
                  <span>今日日程排班 ({todaySchedules.length} 项)</span>
                </h3>

                {todaySchedules.length === 0 ? (
                  <div className="text-xs text-zinc-500 dark:text-slate-400 bg-rose-50/40 dark:bg-slate-800/40 p-4 rounded-xl text-center border border-rose-100 dark:border-slate-800">
                    今日暂未排班安排。
                  </div>
                ) : (
                  <div className="space-y-2">
                    {todaySchedules.map((sch) => (
                      <div
                        key={sch.id}
                        className="bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between text-xs shadow-2xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-1 bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 font-bold rounded-lg text-[11px]">
                            {sch.hour}:00
                          </span>
                          <div>
                            <span className="font-bold text-zinc-800 dark:text-slate-100">{sch.clientName || sch.detail || '会谈事项'}</span>
                            {sch.detail && <p className="text-[11px] text-zinc-500 dark:text-slate-400 mt-0.5">{sch.detail}</p>}
                          </div>
                        </div>
                        <span className="text-[11px] font-semibold px-2 py-0.5 bg-zinc-100 dark:bg-slate-700 text-zinc-600 dark:text-slate-300 rounded-md">
                          {sch.type === 'consult'
                            ? '个案咨询'
                            : sch.type === 'individual_supervision'
                            ? '个体督导'
                            : sch.type === 'group_supervision'
                            ? '团体督导'
                            : '专业课程'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upcoming Schedules Alert */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-zinc-800 dark:text-slate-200 flex items-center gap-2 border-b border-rose-100 dark:border-slate-800 pb-2">
                  <Clock className="w-4 h-4 text-rose-500" />
                  <span>近期预定排班 ({upcomingSchedules.length} 项)</span>
                </h3>

                {upcomingSchedules.length === 0 ? (
                  <div className="text-xs text-zinc-500 dark:text-slate-400 bg-zinc-50 dark:bg-slate-800/40 p-4 rounded-xl text-center border border-zinc-200 dark:border-slate-800">
                    近期无预定安排。
                  </div>
                ) : (
                  <div className="space-y-2">
                    {upcomingSchedules.map((sch) => (
                      <div
                        key={sch.id}
                        className="bg-zinc-50 dark:bg-slate-800/80 border border-zinc-200 dark:border-slate-700 p-3 rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-zinc-600 dark:text-slate-400 font-bold">{sch.dateStr} {sch.hour}:00</span>
                          <span className="font-semibold text-zinc-800 dark:text-slate-200">{sch.clientName || sch.detail}</span>
                        </div>
                        <span className="text-[10px] text-zinc-500 dark:text-slate-400">{sch.type}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-rose-50/50 dark:bg-slate-900 border-t border-rose-100 dark:border-slate-800 flex items-center justify-between text-xs text-zinc-500 dark:text-slate-400">
          <span>提示: 所有提醒数据将实时保存在本地，便于随时跟进</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-800 dark:bg-rose-600 text-white font-bold rounded-xl hover:bg-zinc-700 dark:hover:bg-rose-500 transition cursor-pointer"
          >
            关闭窗口
          </button>
        </div>
      </div>
    </div>
  );
};
