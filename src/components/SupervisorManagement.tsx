import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Supervisor, CaseRecord, SupervisionRecord, ResourceLink } from '../types';
import { Plus, Trash2, Calendar as CalendarIcon, CheckSquare, Square, Unlink, FileText, X, ChevronDown, ChevronUp, Search, Pencil, Link as LinkIcon, Lightbulb, Mic, Printer, User, Users, Sparkles } from 'lucide-react';
import { VoiceInputButton } from './VoiceInputButton';
import { ResourceLinkSection } from './ResourceLinkSection';
import { IdeasSection } from './IdeasSection';
import { RichTextEditor } from './RichTextEditor';
import { ExportSupervisionPdfModal } from './ExportSupervisionPdfModal';

interface SupervisorManagementProps {
  mentors: Supervisor[];
  cases: CaseRecord[];
  onAddMentor: (newMentor: Omit<Supervisor, 'id' | 'records' | 'boundCaseIds'>) => void;
  onDeleteMentor: (id: string) => void;
  onUpdateMentorCaseBinding: (mentorId: string, caseId: string, bind: boolean) => void;
  onUpdateMentorTotalSupervisions?: (mentorId: string, newTotal: number) => void;
  onAddSupervisionRecord: (mentorId: string, recordData: Omit<SupervisionRecord, 'id'>) => void;
  onDeleteSupervisionRecord: (mentorId: string, recordId: string) => void;
  onUpdateSupervisionRecord?: (mentorId: string, recordId: string, updatedData: Partial<SupervisionRecord>) => void;
  supervisionTypeFilter?: 'all' | 'individual' | 'group';
  onTypeFilterChange?: (filter: 'all' | 'individual' | 'group') => void;
}

export const SupervisorManagement: React.FC<SupervisorManagementProps> = ({
  mentors,
  cases,
  onAddMentor,
  onDeleteMentor,
  onUpdateMentorCaseBinding,
  onUpdateMentorTotalSupervisions,
  onAddSupervisionRecord,
  onDeleteSupervisionRecord,
  onUpdateSupervisionRecord,
  supervisionTypeFilter: propSupervisionTypeFilter,
  onTypeFilterChange,
}) => {
  // New Supervisor Form State
  const [name, setName] = useState('');
  const [gender, setGender] = useState('👨‍🏫 男导师');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-12-31');
  const [totalSupervisions, setTotalSupervisions] = useState<number | string>(20);

  // Manage Case Selection Modal for a Supervisor
  const [activeManageMentorId, setActiveManageMentorId] = useState<string | null>(null);

  // Add Supervision Record Modal State
  const [supervisionModal, setSupervisionModal] = useState<{
    mentorId: string;
    caseId: string;
  } | null>(null);

  const [supSessionNum, setSupSessionNum] = useState<number | string>(1);
  const [supDate, setSupDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [supType, setSupType] = useState<'individual' | 'group'>('individual');
  const [supStartTime, setSupStartTime] = useState('14:00');
  const [supEndTime, setSupEndTime] = useState('15:00');
  const [supReflection, setSupReflection] = useState('');
  const [supTranscript, setSupTranscript] = useState('');
  const [supIdeas, setSupIdeas] = useState<string[]>([]);
  const [supResources, setSupResources] = useState<ResourceLink[]>([]);
  const [supModalTab, setSupModalTab] = useState<'reflection' | 'transcript' | 'ideas' | 'resources'>('reflection');

  // Modal state for editing existing Supervision Record
  const [editingRecordModal, setEditingRecordModal] = useState<{
    mentorId: string;
    record: SupervisionRecord;
  } | null>(null);
  const [editTab, setEditTab] = useState<'reflection' | 'transcript' | 'ideas' | 'resources'>('reflection');

  // Expandable Reflection state for each record
  const [expandedReflectionIds, setExpandedReflectionIds] = useState<Record<string, boolean>>({});

  // 督导次数按钮多于15次时的折叠/展开状态
  const [expandedMentorSessions, setExpandedMentorSessions] = useState<Record<string, boolean>>({});
  // 个案下督导记录较多时的折叠/展开状态
  const [expandedCaseRecordLists, setExpandedCaseRecordLists] = useState<Record<string, boolean>>({});

  // Export PDF state for Supervisor Records
  const [exportingPdfSupervisorModal, setExportingPdfSupervisorModal] = useState<{
    supervisor: Supervisor;
    record?: SupervisionRecord;
  } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  // Local Supervision Type Filter state
  const [localSupervisionTypeFilter, setLocalSupervisionTypeFilter] = useState<'all' | 'individual' | 'group'>('all');

  // 督导次数批量编辑管理 Modal 状态
  const [batchSupervisionMentorId, setBatchSupervisionMentorId] = useState<string | null>(null);
  const [batchSupSelectedNums, setBatchSupSelectedNums] = useState<number[]>([]);
  const [batchSupCaseId, setBatchSupCaseId] = useState<string>('');
  const [batchSupType, setBatchSupType] = useState<'individual' | 'group'>('individual');
  const [batchSupStartDate, setBatchSupStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [batchSupIntervalDays, setBatchSupIntervalDays] = useState<number>(7);
  const [batchSupNote, setBatchSupNote] = useState<string>('');

  const activeTypeFilter = propSupervisionTypeFilter ?? localSupervisionTypeFilter;
  const setTypeFilter = (filter: 'all' | 'individual' | 'group') => {
    setLocalSupervisionTypeFilter(filter);
    onTypeFilterChange?.(filter);
  };

  const filteredMentors = mentors.filter((mentor) => {
    // Filter by supervision type if specified
    if (activeTypeFilter !== 'all') {
      const records = mentor.records || [];
      const hasTypeRecord = records.some((r) => r.type === activeTypeFilter);
      if (!hasTypeRecord && records.length > 0) {
        // If query doesn't match search either
      }
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchName = mentor.name.toLowerCase().includes(q);
    const matchGender = mentor.gender.toLowerCase().includes(q);
    const boundIds = mentor.boundCaseIds || [];
    const boundCases = cases.filter((c) => boundIds.includes(c.id));
    const matchCase = boundCases.some((c) => c.name.toLowerCase().includes(q) || c.caseNum.toLowerCase().includes(q));
    const records = mentor.records || [];
    const matchReflection = records.some((r) => r.reflection?.toLowerCase().includes(q) || r.transcript?.toLowerCase().includes(q));
    const matchResources = records.some((r) => r.resources?.some((res) => res.title.toLowerCase().includes(q) || res.url.toLowerCase().includes(q)));
    const matchIdeas = records.some((r) => r.ideas?.some((i) => i.toLowerCase().includes(q)));
    const matchDate = (mentor.startDate || '').includes(q) || (mentor.endDate || '').includes(q);
    return matchName || matchGender || matchCase || matchReflection || matchResources || matchIdeas || matchDate;
  });

  const handleCreateMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入督导师姓名！');
      return;
    }

    onAddMentor({
      name: name.trim(),
      gender,
      startDate: startDate || '2026-01-01',
      endDate: endDate || '2026-12-31',
      totalSupervisions: Number(totalSupervisions) || 20,
    });

    setName('');
  };

  const toggleReflectionExpand = (recordId: string) => {
    setExpandedReflectionIds((prev) => ({
      ...prev,
      [recordId]: !prev[recordId],
    }));
  };

  const handleOpenSupervisionModal = (mentorId: string, caseId: string) => {
    setSupervisionModal({ mentorId, caseId });
    setSupSessionNum(1);
    setSupDate(new Date().toISOString().split('T')[0]);
    setSupType('individual');
    setSupStartTime('14:00');
    setSupEndTime('15:00');
    setSupReflection('');
    setSupTranscript('');
    setSupIdeas([]);
    setSupResources([]);
    setSupModalTab('reflection');
  };

  const handleSaveSupervisionRecord = () => {
    if (!supervisionModal) return;
    onAddSupervisionRecord(supervisionModal.mentorId, {
      caseId: supervisionModal.caseId,
      sessionNum: Number(supSessionNum) || 1,
      date: supDate,
      timeRange: `${supStartTime}-${supEndTime}`,
      type: supType,
      reflection: supReflection,
      transcript: supTranscript,
      ideas: supIdeas,
      resources: supResources,
    });
    setSupervisionModal(null);
  };

  const handleOpenEditModal = (mentorId: string, record: SupervisionRecord) => {
    setEditingRecordModal({ mentorId, record: { ...record } });
    setEditTab('reflection');
  };

  const handleSaveEditedModal = () => {
    if (!editingRecordModal || !onUpdateSupervisionRecord) return;
    onUpdateSupervisionRecord(
      editingRecordModal.mentorId,
      editingRecordModal.record.id,
      editingRecordModal.record
    );
    setEditingRecordModal(null);
  };

  const handleApplyBatchSupervision = () => {
    if (!batchSupervisionMentorId) return;
    if (batchSupSelectedNums.length === 0) {
      alert('请至少勾选选择一个需要批量填报的督导次数！');
      return;
    }

    const mentor = mentors.find((m) => m.id === batchSupervisionMentorId);
    if (!mentor) return;

    const baseDate = new Date(batchSupStartDate);

    batchSupSelectedNums.forEach((num, index) => {
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + index * batchSupIntervalDays);
      const dateStr = targetDate.toISOString().split('T')[0];

      const existingRecord = mentor.records.find((r) => r.sessionNum === num);

      if (existingRecord) {
        if (onUpdateSupervisionRecord) {
          onUpdateSupervisionRecord(mentor.id, existingRecord.id, {
            caseId: batchSupCaseId || existingRecord.caseId,
            date: dateStr,
            type: batchSupType,
            reflection: batchSupNote ? `${existingRecord.reflection || ''}\n${batchSupNote}`.trim() : existingRecord.reflection,
          });
        }
      } else {
        onAddSupervisionRecord(mentor.id, {
          caseId: batchSupCaseId || (mentor.boundCaseIds[0] || ''),
          sessionNum: num,
          date: dateStr,
          timeRange: '14:00-15:00',
          type: batchSupType,
          reflection: batchSupNote || `第 ${num} 次督导记录`,
          transcript: '',
          ideas: [],
          resources: [],
        });
      }
    });

    alert(`已为导师【${mentor.name}】成功批量操作 ${batchSupSelectedNums.length} 次督导记录！`);
    setBatchSupervisionMentorId(null);
    setBatchSupSelectedNums([]);
  };

  return (
    <div className="space-y-6">
      {/* 顶部大标题 */}
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🎓</span>
              <h2 className="text-2xl font-black text-zinc-800 dark:text-slate-100 tracking-tight">
                督了个啥
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-full border border-rose-200 dark:border-rose-800">
                导师与案例绑定
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 font-medium">
              统一管理督导师档案、案例绑定、个体与团体督导反思逐字稿
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-3 py-1.5 bg-rose-50 dark:bg-slate-800 text-rose-800 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-slate-700">
              {activeTypeFilter === 'individual' ? '当前范围: 个体督导' : activeTypeFilter === 'group' ? '当前范围: 团体督导' : `共 ${mentors.length} 位督导师`}
            </span>
            {activeTypeFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setTypeFilter('all')}
                className="text-xs font-bold px-2.5 py-1.5 bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-300 rounded-xl hover:bg-zinc-200 transition cursor-pointer"
              >
                查看全部
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 新增督导师 */}
      <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-zinc-800 mb-4 flex items-center gap-2 border-b border-rose-100 pb-2">
          <Plus className="w-4 h-4 text-rose-500" />
          <span>动态新增督导师 (支持起止时间与额度)</span>
        </h3>
        <form onSubmit={handleCreateMentor} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">督导师姓名 *</label>
            <input
              type="text"
              placeholder="如: 张教授"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-xs p-2.5 bg-white border border-rose-200 rounded-xl text-zinc-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">性别 / 称谓</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="w-full text-xs p-2.5 bg-rose-50/40 border border-rose-200 rounded-xl text-zinc-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
            >
              <option value="👨‍🏫 男导师">👨‍🏫 男导师</option>
              <option value="👩‍🏫 女导师">👩‍🏫 女导师</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">督导起始时间 (YYYY-MM-DD)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-rose-200 rounded-xl text-zinc-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">督导终止时间 (YYYY-MM-DD)</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs p-2.5 bg-white border border-rose-200 rounded-xl text-zinc-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 mb-1">督导总次数额度</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={totalSupervisions}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setTotalSupervisions('');
                } else {
                  const num = parseInt(val, 10);
                  setTotalSupervisions(isNaN(num) ? '' : num);
                }
              }}
              onFocus={(e) => e.target.select()}
              className="w-full text-xs p-2.5 bg-white border border-rose-200 rounded-xl text-zinc-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div>
            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-95"
            >
              添加督导师
            </button>
          </div>
        </form>
      </div>

      {/* 搜索过滤栏 */}
      <div className="bg-white border border-rose-200 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="检索导师姓名、称谓、关联个案或督导反思..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 bg-rose-50/30 border border-rose-200 rounded-xl text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-zinc-500 font-medium">
          <button
            type="button"
            onClick={() => {
              const allKeys = filteredMentors.flatMap((m) => m.records.map((r) => r.id));
              const isAllExpanded = allKeys.length > 0 && allKeys.every((id) => expandedReflectionIds[id] !== false);
              const nextState: Record<string, boolean> = {};
              allKeys.forEach((id) => {
                nextState[id] = !isAllExpanded;
              });
              setExpandedReflectionIds(nextState);
            }}
            className="px-3 py-1.5 bg-rose-50 dark:bg-slate-800 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-slate-700 border border-rose-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
            title="一键展开或折叠所有关联个案下的督导反思与逐字稿文本"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>一键展开/折叠所有反思</span>
          </button>

          {searchQuery ? (
            <span>检索结果: <strong className="text-rose-600 font-bold">{filteredMentors.length}</strong> / {mentors.length} 位</span>
          ) : (
            <span>当前包含 <strong className="text-zinc-800 font-bold">{mentors.length}</strong> 位督导师</span>
          )}
        </div>
      </div>

      {/* 督导师列表 */}
      <div className="space-y-5">
        {filteredMentors.length === 0 ? (
          <div className="bg-white border border-rose-200 rounded-2xl p-8 text-center text-zinc-500 text-xs">
            {searchQuery ? '未找到符合检索条件的督导师。' : '暂无督导师信息，请在上方添加。'}
          </div>
        ) : (
          filteredMentors.map((mentor) => {
            // Filter bound cases for this supervisor
            const boundIds = mentor.boundCaseIds || [];
            const boundCases = cases.filter((c) => boundIds.includes(c.id));

            return (
              <div key={mentor.id} className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs space-y-4">
                {/* 督导师卡片头部 */}
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rose-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{mentor.gender.includes('男') ? '👨‍🏫' : '👩‍🏫'}</span>
                      <h3 className="font-bold text-zinc-800 text-base">{mentor.name} 导师</h3>
                      <span className="text-xs font-semibold px-2.5 py-0.5 bg-rose-50 text-rose-800 rounded-md border border-rose-200">
                        {mentor.gender}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 mt-1">
                      <span className="flex items-center gap-1 font-medium">
                        <CalendarIcon className="w-3.5 h-3.5 text-rose-400" />
                        督导周期 (YYYY-MM-DD): <strong className="text-zinc-800">{mentor.startDate}</strong> 至{' '}
                        <strong className="text-zinc-800">{mentor.endDate}</strong>
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <span>督导总额度: <strong className="text-rose-600 font-bold">{mentor.totalSupervisions || 20} 次</strong></span>
                        <button
                          type="button"
                          onClick={() => {
                            const input = window.prompt(`请输入导师【${mentor.name}】的最新督导总额度次数:`, String(mentor.totalSupervisions || 20));
                            if (input) {
                              const num = parseInt(input, 10);
                              if (!isNaN(num) && num > 0 && onUpdateMentorTotalSupervisions) {
                                onUpdateMentorTotalSupervisions(mentor.id, num);
                              }
                            }
                          }}
                          className="px-2 py-0.5 text-[11px] font-bold bg-white dark:bg-slate-800 hover:bg-rose-100 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-slate-700 rounded-md transition cursor-pointer flex items-center gap-1 shadow-2xs"
                          title="重新设置此导师的督导总额度次数"
                        >
                          <Pencil className="w-2.5 h-2.5" />
                          <span>设置额度</span>
                        </button>
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBatchSupervisionMentorId(mentor.id);
                        setBatchSupSelectedNums([]);
                        setBatchSupCaseId(boundCases[0]?.id || '');
                        setBatchSupType('individual');
                        setBatchSupStartDate(new Date().toISOString().split('T')[0]);
                        setBatchSupIntervalDays(7);
                        setBatchSupNote('');
                      }}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl transition cursor-pointer shadow-2xs active:scale-95"
                      title="批量选择、批量排程或批量编辑此导师的督导次数与反思记录"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-rose-200" />
                      <span>⚡ 批量管理督导次数</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportingPdfSupervisorModal({ supervisor: mentor })}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition cursor-pointer shadow-2xs"
                      title="导出此督导师的全套督导记录与反思档案为 PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>导出督导卷宗 PDF</span>
                    </button>

                    <button
                      onClick={() => setActiveManageMentorId(mentor.id)}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-rose-500" />
                      <span>勾选/关联个案 ({boundIds.length})</span>
                    </button>

                    <button
                      onClick={() => onDeleteMentor(mentor.id)}
                      className="flex items-center gap-1 text-[11px] px-3 py-1.5 text-zinc-500 hover:text-rose-600 bg-zinc-50 hover:bg-rose-50 border border-zinc-200 hover:border-rose-200 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>删除导师</span>
                    </button>
                  </div>
                </div>

                {/* 督导次数 (1~N次) 可视化网格与折叠控制 */}
                {(() => {
                  const totalSup = mentor.totalSupervisions || 20;
                  const isExpanded = Boolean(expandedMentorSessions[mentor.id]);
                  const displayLimit = 15;
                  const isLongList = totalSup > displayLimit;

                  return (
                    <div className="bg-rose-50/50 dark:bg-slate-800/80 border border-rose-200/80 dark:border-slate-700/80 rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-800 dark:text-slate-100 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                          <span>督导次数进度 (额度 {totalSup} 次，已记录 {mentor.records.length} 次):</span>
                        </span>
                        {isLongList && (
                          <button
                            type="button"
                            onClick={() => setExpandedMentorSessions((prev) => ({ ...prev, [mentor.id]: !prev[mentor.id] }))}
                            className="text-[11px] font-bold text-rose-700 dark:text-rose-300 hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <span>折叠次数按钮</span>
                                <ChevronUp className="w-3 h-3" />
                              </>
                            ) : (
                              <>
                                <span>展开全部 {totalSup} 次 (已折叠 {totalSup - displayLimit} 次)</span>
                                <ChevronDown className="w-3 h-3" />
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-1.5">
                        {Array.from({ length: totalSup }, (_, idx) => {
                          const supSessionNum = idx + 1;
                          const matchedRecord = mentor.records.find((r) => r.sessionNum === supSessionNum);
                          const hasRecord = Boolean(matchedRecord);

                          if (isLongList && !isExpanded && supSessionNum > displayLimit && !hasRecord) {
                            return null;
                          }

                          return (
                            <button
                              key={supSessionNum}
                              type="button"
                              onClick={() => {
                                if (matchedRecord) {
                                  handleOpenEditModal(mentor.id, matchedRecord);
                                } else if (boundCases.length > 0) {
                                  handleOpenSupervisionModal(mentor.id, boundCases[0].id);
                                  setSupSessionNum(supSessionNum);
                                } else {
                                  alert('请先勾选关联至少一个个案后再录入督导记录！');
                                }
                              }}
                              className={`p-1 min-h-10 border rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
                                hasRecord
                                  ? 'bg-rose-500 text-white border-rose-600 dark:bg-rose-600 dark:border-rose-500'
                                  : 'bg-white dark:bg-slate-900 border-rose-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800'
                              }`}
                              title={hasRecord ? `第 ${supSessionNum} 次督导已记录 (点击查看/编辑)` : `第 ${supSessionNum} 次督导未录入 (点击新增记录)`}
                            >
                              <span>{supSessionNum}次</span>
                              {hasRecord && <span className="text-[9px] opacity-90 scale-90">已录入</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* 仅在对应督导师下显示勾选的个案 */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-zinc-800 flex items-center justify-between">
                    <span>已勾选关联个案 ({boundCases.length} 个):</span>
                    <span className="text-[11px] font-normal text-zinc-500">
                      (仅在此导师下展示勾选的个案，点击“删除关联”即可解绑)
                    </span>
                  </div>

                  {boundCases.length === 0 ? (
                    <div className="bg-rose-50/40 border border-dashed border-rose-200 rounded-xl p-4 text-center text-xs text-zinc-500">
                      该导师下暂无关联的个案，请点击右上角【勾选/关联个案】进行勾选绑定。
                    </div>
                  ) : (
                    boundCases.map((caseItem) => {
                      const caseSupervisions = mentor.records.filter((r) => r.caseId === caseItem.id);
                      const key = `${mentor.id}_${caseItem.id}`;
                      const isRecordsExpanded = Boolean(expandedCaseRecordLists[key]);
                      const recordLimit = 5;
                      const hasManyRecords = caseSupervisions.length > recordLimit;
                      const displayedSupervisions = hasManyRecords && !isRecordsExpanded
                        ? caseSupervisions.slice(0, recordLimit)
                        : caseSupervisions;

                      return (
                        <div
                          key={caseItem.id}
                          className="border border-rose-200 rounded-xl bg-rose-50/30 p-3.5 space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-2 border-b border-rose-200/60 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{caseItem.avatar}</span>
                              <span className="font-bold text-zinc-800 text-sm">
                                {caseItem.caseNum} {caseItem.name}
                              </span>
                              <span className="text-[11px] text-zinc-500">
                                (已登记督导 {caseSupervisions.length} 次)
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenSupervisionModal(mentor.id, caseItem.id)}
                                className="text-xs font-bold px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition shadow-2xs cursor-pointer"
                              >
                                + 录入督导与反思
                              </button>

                              {/* 解绑关联按钮 */}
                              <button
                                onClick={() => onUpdateMentorCaseBinding(mentor.id, caseItem.id, false)}
                                className="text-[10px] uppercase font-bold px-2.5 py-1 bg-zinc-100 text-zinc-500 hover:bg-rose-500 hover:text-white border border-zinc-200 hover:border-rose-500 rounded-md transition flex items-center gap-1 cursor-pointer"
                                title="断开此个案与当前督导师的关联"
                              >
                                <Unlink className="w-3 h-3" />
                                <span>删除关联</span>
                              </button>
                            </div>
                          </div>

                          {/* 对应个案下的督导记录列表 */}
                          <div className="space-y-2 pl-1">
                            {caseSupervisions.length === 0 ? (
                              <div className="text-xs text-zinc-400 italic">暂无具体督导会谈记录</div>
                            ) : (
                              <>
                                {displayedSupervisions.map((sup) => {
                                  const isExpanded = expandedReflectionIds[sup.id] ?? true;
                                  const hasTranscript = Boolean(sup.transcript && sup.transcript.trim());
                                  const hasIdeas = Boolean(sup.ideas && sup.ideas.length > 0);
                                  const hasResources = Boolean(sup.resources && sup.resources.length > 0);

                                return (
                                  <div
                                    key={sup.id}
                                    className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-xl p-3.5 text-xs space-y-2.5 shadow-2xs"
                                  >
                                    <div className="flex items-center justify-between font-medium text-zinc-700 dark:text-slate-200">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="font-bold text-rose-800 dark:text-rose-400">
                                          📅 {sup.date} [{sup.timeRange}]
                                        </span>
                                        <span className="px-2 py-0.5 bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 font-bold rounded-md flex items-center gap-1 text-[11px]">
                                          <span className="flex items-center justify-center w-4 h-4 bg-rose-200 dark:bg-rose-800 text-rose-900 dark:text-rose-100 rounded-full text-[10px] font-bold italic">
                                            {sup.type === 'individual' ? '1' : '2'}
                                          </span>
                                          <span>{sup.type === 'individual' ? '1. 个体督导' : '2. 团体督导'}</span>
                                        </span>
                                        <span className="text-zinc-500 dark:text-slate-400">(针对第 {sup.sessionNum} 次咨询)</span>
                                      </div>

                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() => toggleReflectionExpand(sup.id)}
                                          className="text-zinc-500 hover:text-zinc-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-0.5 cursor-pointer text-[11px]"
                                        >
                                          {isExpanded ? (
                                            <>
                                              <span>收起详情</span>
                                              <ChevronUp className="w-3.5 h-3.5" />
                                            </>
                                          ) : (
                                            <>
                                              <span>展开详情</span>
                                              <ChevronDown className="w-3.5 h-3.5" />
                                            </>
                                          )}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => setExportingPdfSupervisorModal({ supervisor: mentor, record: sup })}
                                          className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 flex items-center gap-1 font-bold text-[11px] bg-emerald-50 dark:bg-slate-800 hover:bg-emerald-100 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-slate-700 transition cursor-pointer"
                                          title="导出当前此条督导会谈与逐字稿为 PDF"
                                        >
                                          <Printer className="w-3 h-3" />
                                          <span>导出此条 PDF</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => handleOpenEditModal(mentor.id, sup)}
                                          className="text-rose-700 dark:text-rose-300 hover:text-rose-900 flex items-center gap-1 font-bold text-[11px] bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 px-2.5 py-1 rounded-lg border border-rose-200 dark:border-slate-700 transition cursor-pointer"
                                          title="编辑反思、逐字稿、想法与WPS外链"
                                        >
                                          <Pencil className="w-3 h-3" />
                                          <span>编辑全功能档案</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => onDeleteSupervisionRecord(mentor.id, sup.id)}
                                          className="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer p-0.5"
                                          title="删除此条记录"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* 展开的主体内容 */}
                                    <AnimatePresence initial={false}>
                                      {isExpanded && (
                                        <motion.div
                                          key={`sup-detail-${sup.id}`}
                                          initial={{ opacity: 0, height: 0 }}
                                          animate={{ opacity: 1, height: 'auto' }}
                                          exit={{ opacity: 0, height: 0 }}
                                          transition={{ duration: 0.22, ease: 'easeInOut' }}
                                          className="overflow-hidden space-y-2.5 pt-1"
                                        >
                                          {/* 💡 反思要点 */}
                                        {sup.reflection ? (
                                          <div className="bg-rose-50/80 dark:bg-slate-800/70 border-l-3 border-rose-400 dark:border-rose-500 p-2.5 text-zinc-800 dark:text-slate-200 rounded-r-xl text-xs leading-relaxed">
                                            <strong className="text-rose-900 dark:text-rose-300 block font-bold mb-1">
                                              💡 督导反思与要点:
                                            </strong>
                                            {/<[a-z][\s\S]*>/i.test(sup.reflection) ? (
                                              <div dangerouslySetInnerHTML={{ __html: sup.reflection }} />
                                            ) : (
                                              <div className="whitespace-pre-wrap">{sup.reflection}</div>
                                            )}
                                          </div>
                                        ) : null}

                                        {/* 🎙️ 逐字稿 */}
                                        {hasTranscript && (
                                          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border-l-3 border-emerald-500 p-2.5 text-slate-800 dark:text-slate-200 rounded-r-xl text-xs space-y-1">
                                            <strong className="text-emerald-900 dark:text-emerald-300 font-bold flex items-center gap-1 mb-1">
                                              <Mic className="w-3.5 h-3.5 text-emerald-600" />
                                              <span>督导会谈逐字稿:</span>
                                            </strong>
                                            {/<[a-z][\s\S]*>/i.test(sup.transcript || '') ? (
                                              <div dangerouslySetInnerHTML={{ __html: sup.transcript || '' }} />
                                            ) : (
                                              <div className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                                                {sup.transcript}
                                              </div>
                                            )}
                                          </div>
                                        )}

                                        {/* 💭 插入的想法随记 */}
                                        {hasIdeas && (
                                          <IdeasSection
                                            ideas={sup.ideas || []}
                                            onAddIdea={(newIdea) => {
                                              if (onUpdateSupervisionRecord) {
                                                onUpdateSupervisionRecord(mentor.id, sup.id, {
                                                  ideas: [...(sup.ideas || []), newIdea],
                                                });
                                              }
                                            }}
                                            onDeleteIdea={(idx) => {
                                              if (onUpdateSupervisionRecord) {
                                                onUpdateSupervisionRecord(mentor.id, sup.id, {
                                                  ideas: (sup.ideas || []).filter((_, i) => i !== idx),
                                                });
                                              }
                                            }}
                                          />
                                        )}

                                        {/* 📎 资源外链 (WPS / 微信 / 小红书) */}
                                        {hasResources && (
                                          <ResourceLinkSection
                                            resources={sup.resources || []}
                                            onAddResource={(newLink) => {
                                              if (onUpdateSupervisionRecord) {
                                                onUpdateSupervisionRecord(mentor.id, sup.id, {
                                                  resources: [...(sup.resources || []), newLink],
                                                });
                                              }
                                            }}
                                            onDeleteResource={(id) => {
                                              if (onUpdateSupervisionRecord) {
                                                onUpdateSupervisionRecord(mentor.id, sup.id, {
                                                  resources: (sup.resources || []).filter((r) => r.id !== id),
                                                });
                                              }
                                            }}
                                          />
                                        )}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                );
                              })}

                              {hasManyRecords && (
                                <div className="mt-2 flex justify-center">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setExpandedCaseRecordLists((prev) => ({
                                        ...prev,
                                        [key]: !prev[key],
                                      }))
                                    }
                                    className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-rose-50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                                  >
                                    {isRecordsExpanded ? (
                                      <>
                                        <ChevronUp className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                        <span>折叠督导记录 (已展全 {caseSupervisions.length} 条)</span>
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                                        <span>展开剩余 {caseSupervisions.length - recordLimit} 条督导记录 (共 {caseSupervisions.length} 条)</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    );
                    })
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 勾选/关联个案 Modal */}
      {activeManageMentorId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between border-b border-rose-100 pb-3 mb-4">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-rose-600" />
                <span>勾选绑定个案 - {mentors.find((m) => m.id === activeManageMentorId)?.name} 导师</span>
              </h3>
              <button
                onClick={() => setActiveManageMentorId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              请勾选需要在该督导师下显示的个案，仅被勾选的个案会在此导师栏中列出。
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cases.length === 0 ? (
                <div className="text-xs text-slate-400 p-4 text-center">暂无任何个案，请先在个案模块创建个案。</div>
              ) : (
                cases.map((c) => {
                  const currentMentor = mentors.find((m) => m.id === activeManageMentorId);
                  const isChecked = currentMentor?.boundCaseIds.includes(c.id) || false;

                  return (
                    <div
                      key={c.id}
                      onClick={() => onUpdateMentorCaseBinding(activeManageMentorId, c.id, !isChecked)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        isChecked
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{c.avatar}</span>
                        <span>
                          {c.caseNum} {c.name}
                        </span>
                      </div>
                      <div>{isChecked ? <CheckSquare className="w-4 h-4 text-rose-600" /> : <Square className="w-4 h-4 text-slate-300" />}</div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-rose-100">
              <button
                onClick={() => setActiveManageMentorId(null)}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition shadow-2xs cursor-pointer"
              >
                完成选择
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 录入督导与反思 Modal */}
      {supervisionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                <span>录入全功能督导记录与资料</span>
              </h3>
              <button
                type="button"
                onClick={() => setSupervisionModal(null)}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">针对咨询次数 *</label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={supSessionNum}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '') {
                      setSupSessionNum('');
                    } else {
                      const num = parseInt(val, 10);
                      setSupSessionNum(isNaN(num) ? '' : num);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full p-2 border border-rose-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">督导类型 *</label>
                <select
                  value={supType}
                  onChange={(e) => setSupType(e.target.value as 'individual' | 'group')}
                  className="w-full p-2 bg-rose-50/50 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400 font-bold"
                >
                  <option value="individual">1. 个体督导</option>
                  <option value="group">2. 团体督导</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">督导日期 *</label>
                <input
                  type="date"
                  value={supDate}
                  onChange={(e) => setSupDate(e.target.value)}
                  className="w-full p-2 border border-rose-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">时间段</label>
                <div className="flex items-center gap-1">
                  <input
                    type="time"
                    value={supStartTime}
                    onChange={(e) => setSupStartTime(e.target.value)}
                    className="w-full p-1.5 border border-rose-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                  <span className="text-slate-400">-</span>
                  <input
                    type="time"
                    value={supEndTime}
                    onChange={(e) => setSupEndTime(e.target.value)}
                    className="w-full p-1.5 border border-rose-200 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setSupModalTab('reflection')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  supModalTab === 'reflection'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>督导反思要点</span>
              </button>

              <button
                type="button"
                onClick={() => setSupModalTab('transcript')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  supModalTab === 'transcript'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>督导逐字稿</span>
              </button>

              <button
                type="button"
                onClick={() => setSupModalTab('ideas')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  supModalTab === 'ideas'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>插入想法 ({supIdeas.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setSupModalTab('resources')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  supModalTab === 'resources'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>WPS/公众号/小红书 ({supResources.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {supModalTab === 'reflection' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    督导反思与要点总结 (支持文字编辑、加粗、居中对齐与文字颜色)
                  </label>
                  <RichTextEditor
                    value={supReflection}
                    onChange={(val) => setSupReflection(val)}
                    placeholder="在此撰写督导师针对该个案提出的反馈要点、反移情觉察与后续干预方向..."
                    minHeight="200px"
                    voiceButtonText="语音口述反思"
                  />
                </div>
              )}

              {supModalTab === 'transcript' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Mic className="w-4 h-4 text-emerald-600" />
                    <span>督导逐字稿内容 (支持富文本样式、居中对齐、文本颜色与实时语音转文字)</span>
                  </label>
                  <RichTextEditor
                    value={supTranscript}
                    onChange={(val) => setSupTranscript(val)}
                    placeholder="在此记录督导会谈录音或逐字稿文字，支持工具栏颜色对齐设置与语音按钮实时转文字..."
                    minHeight="240px"
                    voiceButtonText="语音口述逐字稿"
                  />
                </div>
              )}

              {supModalTab === 'ideas' && (
                <IdeasSection
                  ideas={supIdeas}
                  onAddIdea={(newIdea) => setSupIdeas((prev) => [...prev, newIdea])}
                  onDeleteIdea={(idx) => setSupIdeas((prev) => prev.filter((_, i) => i !== idx))}
                />
              )}

              {supModalTab === 'resources' && (
                <ResourceLinkSection
                  resources={supResources}
                  onAddResource={(newLink) => setSupResources((prev) => [...prev, newLink])}
                  onDeleteResource={(id) => setSupResources((prev) => prev.filter((r) => r.id !== id))}
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-rose-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSupervisionModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveSupervisionRecord}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-2xs cursor-pointer"
              >
                保存全套督导记录
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑全功能督导记录 Modal */}
      {editingRecordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <Pencil className="w-5 h-5 text-rose-600" />
                <span>编辑督导记录与关联档案</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const supervisorObj = mentors.find((m) => m.id === editingRecordModal.mentorId);
                    if (supervisorObj) {
                      setExportingPdfSupervisorModal({
                        supervisor: supervisorObj,
                        record: editingRecordModal.record,
                      });
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="导出此条督导记录与逐字稿为 PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>导出督导 PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRecordModal(null)}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setEditTab('reflection')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  editTab === 'reflection'
                    ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>督导反思要点</span>
              </button>

              <button
                type="button"
                onClick={() => setEditTab('transcript')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  editTab === 'transcript'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>督导逐字稿</span>
              </button>

              <button
                type="button"
                onClick={() => setEditTab('ideas')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  editTab === 'ideas'
                    ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>插入想法 ({(editingRecordModal.record.ideas || []).length})</span>
              </button>

              <button
                type="button"
                onClick={() => setEditTab('resources')}
                className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                  editTab === 'resources'
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>WPS/公众号/小红书 ({(editingRecordModal.record.resources || []).length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {editTab === 'reflection' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    督导反思与要点总结 (支持排版排样式、文本颜色与居中)
                  </label>
                  <RichTextEditor
                    value={editingRecordModal.record.reflection || ''}
                    onChange={(val) =>
                      setEditingRecordModal({
                        ...editingRecordModal,
                        record: { ...editingRecordModal.record, reflection: val },
                      })
                    }
                    placeholder="在此编辑督导师针对该个案提出的反馈要点、反移情觉察与后续干预方向..."
                    minHeight="200px"
                    voiceButtonText="语音口述反思"
                  />
                </div>
              )}

              {editTab === 'transcript' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                    <Mic className="w-4 h-4 text-emerald-600" />
                    <span>督导逐字稿内容 (支持格式样式、居中与文本颜色)</span>
                  </label>
                  <RichTextEditor
                    value={editingRecordModal.record.transcript || ''}
                    onChange={(val) =>
                      setEditingRecordModal({
                        ...editingRecordModal,
                        record: { ...editingRecordModal.record, transcript: val },
                      })
                    }
                    placeholder="在此编辑督导会谈录音或逐字稿文字..."
                    minHeight="240px"
                    voiceButtonText="语音口述逐字稿"
                  />
                </div>
              )}

              {editTab === 'ideas' && (
                <IdeasSection
                  ideas={editingRecordModal.record.ideas || []}
                  onAddIdea={(newIdea) =>
                    setEditingRecordModal({
                      ...editingRecordModal,
                      record: {
                        ...editingRecordModal.record,
                        ideas: [...(editingRecordModal.record.ideas || []), newIdea],
                      },
                    })
                  }
                  onDeleteIdea={(idx) =>
                    setEditingRecordModal({
                      ...editingRecordModal,
                      record: {
                        ...editingRecordModal.record,
                        ideas: (editingRecordModal.record.ideas || []).filter((_, i) => i !== idx),
                      },
                    })
                  }
                />
              )}

              {editTab === 'resources' && (
                <ResourceLinkSection
                  resources={editingRecordModal.record.resources || []}
                  onAddResource={(newLink) =>
                    setEditingRecordModal({
                      ...editingRecordModal,
                      record: {
                        ...editingRecordModal.record,
                        resources: [...(editingRecordModal.record.resources || []), newLink],
                      },
                    })
                  }
                  onDeleteResource={(id) =>
                    setEditingRecordModal({
                      ...editingRecordModal,
                      record: {
                        ...editingRecordModal.record,
                        resources: (editingRecordModal.record.resources || []).filter((r) => r.id !== id),
                      },
                    })
                  }
                />
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-rose-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setEditingRecordModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveEditedModal}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-2xs cursor-pointer"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 导出督导 PDF 卷宗 Modal */}
      {exportingPdfSupervisorModal && (
        <ExportSupervisionPdfModal
          supervisor={exportingPdfSupervisorModal.supervisor}
          record={exportingPdfSupervisorModal.record}
          cases={cases}
          onClose={() => setExportingPdfSupervisorModal(null)}
        />
      )}

      {/* ⚡ 督导次数批量编辑与填报 Modal */}
      {batchSupervisionMentorId && (() => {
        const targetMentor = mentors.find((m) => m.id === batchSupervisionMentorId);
        if (!targetMentor) return null;

        const totalQuota = targetMentor.totalSupervisions || 20;
        const boundCases = cases.filter((c) => targetMentor.boundCaseIds.includes(c.id));

        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-rose-600" />
                  <span>⚡ 批量管理督导次数 ({targetMentor.name})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setBatchSupervisionMentorId(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 dark:text-slate-300">勾选需要编辑填报的督导次数:</label>
                    <div className="flex gap-2 text-[10px]">
                      <button
                        type="button"
                        onClick={() => setBatchSupSelectedNums(Array.from({ length: totalQuota }, (_, i) => i + 1))}
                        className="text-rose-600 font-bold hover:underline cursor-pointer"
                      >
                        全选 ({totalQuota}次)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBatchSupSelectedNums([])}
                        className="text-slate-400 hover:underline cursor-pointer"
                      >
                        清空
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-6 gap-1 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    {Array.from({ length: totalQuota }, (_, i) => i + 1).map((num) => {
                      const isSelected = batchSupSelectedNums.includes(num);
                      const hasRec = targetMentor.records.some((r) => r.sessionNum === num);

                      return (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setBatchSupSelectedNums((prev) => prev.filter((n) => n !== num));
                            } else {
                              setBatchSupSelectedNums((prev) => [...prev, num].sort((a, b) => a - b));
                            }
                          }}
                          className={`p-1 rounded text-[11px] font-bold border transition flex flex-col items-center justify-center ${
                            isSelected
                              ? 'bg-rose-600 text-white border-rose-700'
                              : hasRec
                              ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-300 text-rose-900 dark:text-rose-200'
                              : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span>{num}次</span>
                          {hasRec && !isSelected && <span className="text-[8px] scale-80 opacity-80">已有</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">关联个案:</label>
                    <select
                      value={batchSupCaseId}
                      onChange={(e) => setBatchSupCaseId(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl"
                    >
                      <option value="">-- 选择关联个案 --</option>
                      {boundCases.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} ({c.type === 'teen' ? '青少年' : '成人'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">督导类型:</label>
                    <select
                      value={batchSupType}
                      onChange={(e) => setBatchSupType(e.target.value as 'individual' | 'group')}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl"
                    >
                      <option value="individual">1. 个体督导</option>
                      <option value="group">2. 团体督导</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">起始排程日期:</label>
                    <input
                      type="date"
                      value={batchSupStartDate}
                      onChange={(e) => setBatchSupStartDate(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">递增间隔天数:</label>
                    <select
                      value={batchSupIntervalDays}
                      onChange={(e) => setBatchSupIntervalDays(Number(e.target.value))}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl"
                    >
                      <option value={7}>7天 (每周一次)</option>
                      <option value={14}>14天 (每两周一次)</option>
                      <option value={1}>1天 (每天连续)</option>
                      <option value={30}>30天 (每月一次)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">批量补充督导要点 / 模板:</label>
                  <input
                    type="text"
                    placeholder="如: 完成个案概念化与反移情分析督导"
                    value={batchSupNote}
                    onChange={(e) => setBatchSupNote(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-rose-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setBatchSupervisionMentorId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleApplyBatchSupervision}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  一键批量生成排程
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
