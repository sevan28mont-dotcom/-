import React, { useState } from 'react';
import { PersonalExperienceSetting, PersonalExperienceRecord, ResourceLink } from '../types';
import {
  Sparkles,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Search,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  FileText,
  Mic,
  Lightbulb,
  Link as LinkIcon,
  CheckCircle2,
  Sliders,
  Printer,
  Clock,
} from 'lucide-react';
import { VoiceInputButton } from './VoiceInputButton';
import { RichTextEditor } from './RichTextEditor';
import { IdeasSection } from './IdeasSection';
import { ResourceLinkSection } from './ResourceLinkSection';

interface PersonalExperienceManagementProps {
  experienceData?: PersonalExperienceSetting;
  onUpdateExperienceData: (updated: PersonalExperienceSetting) => void;
  experienceTypeFilter?: 'all' | 'individual' | 'group';
  onTypeFilterChange?: (filter: 'all' | 'individual' | 'group') => void;
}

export const PersonalExperienceManagement: React.FC<PersonalExperienceManagementProps> = ({
  experienceData = { totalIndividualHours: 20, totalGroupHours: 30, records: [] },
  onUpdateExperienceData,
  experienceTypeFilter: propTypeFilter,
  onTypeFilterChange,
}) => {
  const [localTypeFilter, setLocalTypeFilter] = useState<'all' | 'individual' | 'group'>('all');
  const activeTypeFilter = propTypeFilter ?? localTypeFilter;

  const setFilter = (filter: 'all' | 'individual' | 'group') => {
    setLocalTypeFilter(filter);
    onTypeFilterChange?.(filter);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRecordIds, setExpandedRecordIds] = useState<Record<string, boolean>>({});

  // Modal State for adding/editing a Personal Experience Record
  const [modalRecord, setModalRecord] = useState<{
    id?: string;
    sessionNum: number;
    type: 'individual' | 'group';
    date: string;
    timeRange: string;
    facilitator: string;
    note: string;
    transcript: string;
    ideas: string[];
    resources: ResourceLink[];
    completed: boolean;
  } | null>(null);

  const [modalTab, setModalTab] = useState<'note' | 'transcript' | 'ideas' | 'resources'>('note');

  // Batch Management Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTargetType, setBatchTargetType] = useState<'individual' | 'group'>('individual');
  const [batchSelectedNums, setBatchSelectedNums] = useState<number[]>([]);
  const [batchDateStart, setBatchDateStart] = useState(() => new Date().toISOString().split('T')[0]);
  const [batchIntervalDays, setBatchIntervalDays] = useState(7);
  const [batchFacilitator, setBatchFacilitator] = useState('');
  const [batchNote, setBatchNote] = useState('');

  const records = experienceData.records || [];
  const individualRecords = records.filter((r) => r.type === 'individual');
  const groupRecords = records.filter((r) => r.type === 'group');

  const totalIndividualCount = experienceData.totalIndividualHours || 20;
  const totalGroupCount = experienceData.totalGroupHours || 30;

  const filteredRecords = records.filter((rec) => {
    if (activeTypeFilter !== 'all' && rec.type !== activeTypeFilter) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchFacilitator = (rec.facilitator || '').toLowerCase().includes(q);
    const matchNote = (rec.note || '').toLowerCase().includes(q);
    const matchTranscript = (rec.transcript || '').toLowerCase().includes(q);
    const matchDate = (rec.date || '').includes(q);
    return matchFacilitator || matchNote || matchTranscript || matchDate;
  });

  const handleOpenAddModal = (type: 'individual' | 'group', sessionNum?: number) => {
    const typeRecords = type === 'individual' ? individualRecords : groupRecords;
    const nextNum = sessionNum || typeRecords.length + 1;
    const existing = typeRecords.find((r) => r.sessionNum === nextNum);

    if (existing) {
      setModalRecord({
        id: existing.id,
        sessionNum: existing.sessionNum,
        type: existing.type,
        date: existing.date || new Date().toISOString().split('T')[0],
        timeRange: existing.timeRange || '14:00-15:00',
        facilitator: existing.facilitator || '',
        note: existing.note || '',
        transcript: existing.transcript || '',
        ideas: existing.ideas || [],
        resources: existing.resources || [],
        completed: existing.completed !== false,
      });
    } else {
      setModalRecord({
        sessionNum: nextNum,
        type,
        date: new Date().toISOString().split('T')[0],
        timeRange: '14:00-15:00',
        facilitator: '',
        note: '',
        transcript: '',
        ideas: [],
        resources: [],
        completed: true,
      });
    }
    setModalTab('note');
  };

  const handleOpenEditModal = (rec: PersonalExperienceRecord) => {
    setModalRecord({
      id: rec.id,
      sessionNum: rec.sessionNum,
      type: rec.type,
      date: rec.date || new Date().toISOString().split('T')[0],
      timeRange: rec.timeRange || '14:00-15:00',
      facilitator: rec.facilitator || '',
      note: rec.note || '',
      transcript: rec.transcript || '',
      ideas: rec.ideas || [],
      resources: rec.resources || [],
      completed: rec.completed !== false,
    });
    setModalTab('note');
  };

  const handleSaveModalRecord = () => {
    if (!modalRecord) return;

    let updatedList = [...records];
    if (modalRecord.id) {
      updatedList = updatedList.map((r) =>
        r.id === modalRecord.id
          ? {
              ...r,
              sessionNum: modalRecord.sessionNum,
              type: modalRecord.type,
              date: modalRecord.date,
              timeRange: modalRecord.timeRange,
              facilitator: modalRecord.facilitator,
              note: modalRecord.note,
              transcript: modalRecord.transcript,
              ideas: modalRecord.ideas,
              resources: modalRecord.resources,
              completed: modalRecord.completed,
            }
          : r
      );
    } else {
      const newRec: PersonalExperienceRecord = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sessionNum: modalRecord.sessionNum,
        type: modalRecord.type,
        date: modalRecord.date,
        timeRange: modalRecord.timeRange,
        facilitator: modalRecord.facilitator,
        note: modalRecord.note,
        transcript: modalRecord.transcript,
        ideas: modalRecord.ideas,
        resources: modalRecord.resources,
        completed: modalRecord.completed,
      };
      updatedList.push(newRec);
    }

    onUpdateExperienceData({
      ...experienceData,
      records: updatedList,
    });
    setModalRecord(null);
  };

  const handleDeleteRecord = (id: string) => {
    if (!window.confirm('确定要删除此条个人体验记录吗？')) return;
    const updatedList = records.filter((r) => r.id !== id);
    onUpdateExperienceData({
      ...experienceData,
      records: updatedList,
    });
  };

  const handleUpdateTotalHours = (type: 'individual' | 'group') => {
    const currentVal = type === 'individual' ? totalIndividualCount : totalGroupCount;
    const nameStr = type === 'individual' ? '个体体验' : '团体体验';
    const input = window.prompt(`请输入【${nameStr}】的总设置额度/次数:`, String(currentVal));
    if (input !== null) {
      const num = parseInt(input, 10);
      if (!isNaN(num) && num > 0) {
        onUpdateExperienceData({
          ...experienceData,
          totalIndividualHours: type === 'individual' ? num : experienceData.totalIndividualHours,
          totalGroupHours: type === 'group' ? num : experienceData.totalGroupHours,
        });
      }
    }
  };

  // Batch fill operations
  const handleApplyBatchFill = () => {
    if (batchSelectedNums.length === 0) {
      alert('请至少勾选选择一个需要批量填报的体验次数！');
      return;
    }

    let currentRecords = [...records];
    const baseDate = new Date(batchDateStart);

    batchSelectedNums.forEach((num, index) => {
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + index * batchIntervalDays);
      const dateStr = targetDate.toISOString().split('T')[0];

      const existingIndex = currentRecords.findIndex(
        (r) => r.type === batchTargetType && r.sessionNum === num
      );

      if (existingIndex >= 0) {
        currentRecords[existingIndex] = {
          ...currentRecords[existingIndex],
          date: dateStr,
          facilitator: batchFacilitator || currentRecords[existingIndex].facilitator,
          note: batchNote ? `${currentRecords[existingIndex].note}\n${batchNote}` : currentRecords[existingIndex].note,
          completed: true,
        };
      } else {
        currentRecords.push({
          id: `exp_batch_${Date.now()}_${num}`,
          sessionNum: num,
          type: batchTargetType,
          date: dateStr,
          timeRange: '14:00-15:00',
          facilitator: batchFacilitator || (batchTargetType === 'individual' ? '体验分析师' : '团体带领者'),
          note: batchNote || `第 ${num} 次${batchTargetType === 'individual' ? '个体' : '团体'}体验记录`,
          completed: true,
        });
      }
    });

    onUpdateExperienceData({
      ...experienceData,
      records: currentRecords,
    });

    alert(`已成功为 ${batchSelectedNums.length} 次【${batchTargetType === 'individual' ? '个体体验' : '团体体验'}】批量排程与填报记录！`);
    setIsBatchModalOpen(false);
    setBatchSelectedNums([]);
  };

  return (
    <div className="space-y-6">
      {/* 1. 顶部大标题卡片 */}
      <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🧘</span>
              <h2 className="text-2xl font-black text-zinc-800 dark:text-slate-100 tracking-tight">
                个人体验
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
                自我体验与分析档案
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 font-medium">
              包含【个体体验】与【团体体验】两大核心板块，记录体验分析师、反思悟道、会谈逐字稿与学习资源
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Sliders className="w-4 h-4 text-purple-200" />
              <span>⚡ 批量管理体验次数</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 板块统计与核心额度控制卡片 (两大板块: 1. 个体体验 2. 团体体验) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 板块 1: 个体体验 */}
        <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-sky-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-300 rounded-lg">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-zinc-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>1. 个体体验板块</span>
                  <span className="text-[10px] px-2 py-0.2 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-bold rounded border border-sky-200 dark:border-sky-800">
                    一针对一体验
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-slate-400">
                  与体验分析师的深度个体体验 sessions
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleUpdateTotalHours('individual')}
                className="px-2 py-1 text-[11px] font-bold bg-sky-50 dark:bg-slate-800 hover:bg-sky-100 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1"
                title="修改个体体验的目标总次数/额度"
              >
                <Pencil className="w-2.5 h-2.5" />
                <span>额度: {totalIndividualCount} 次</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-700 dark:text-slate-300">
              已录入完成: <strong className="text-sky-600 dark:text-sky-400 font-black text-sm">{individualRecords.length}</strong> / {totalIndividualCount} 次
            </span>
            <button
              type="button"
              onClick={() => handleOpenAddModal('individual')}
              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ 录入个体体验</span>
            </button>
          </div>

          {/* 个体体验可视化次数按钮 */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 pt-1">
            {Array.from({ length: totalIndividualCount }, (_, idx) => {
              const num = idx + 1;
              const rec = individualRecords.find((r) => r.sessionNum === num);
              const hasRec = Boolean(rec);

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleOpenAddModal('individual', num)}
                  className={`p-1 min-h-9 border rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
                    hasRec
                      ? 'bg-sky-600 text-white border-sky-700 dark:bg-sky-600 dark:border-sky-500'
                      : 'bg-white dark:bg-slate-900 border-sky-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-800'
                  }`}
                  title={hasRec ? `第 ${num} 次个体体验已记录 (点击查看/编辑)` : `第 ${num} 次个体体验未录入 (点击新增记录)`}
                >
                  <span>{num}次</span>
                  {hasRec && <span className="text-[9px] opacity-90 scale-90">已录入</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* 板块 2: 团体体验 */}
        <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-purple-100 dark:border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 rounded-lg">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-zinc-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>2. 团体体验板块</span>
                  <span className="text-[10px] px-2 py-0.2 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold rounded border border-purple-200 dark:border-purple-800">
                    小组/团体成长
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-slate-400">
                  参加心理成长团体或体验小组记录
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleUpdateTotalHours('group')}
                className="px-2 py-1 text-[11px] font-bold bg-purple-50 dark:bg-slate-800 hover:bg-purple-100 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1"
                title="修改团体体验的目标总次数/额度"
              >
                <Pencil className="w-2.5 h-2.5" />
                <span>额度: {totalGroupCount} 次</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-700 dark:text-slate-300">
              已录入完成: <strong className="text-purple-600 dark:text-purple-400 font-black text-sm">{groupRecords.length}</strong> / {totalGroupCount} 次
            </span>
            <button
              type="button"
              onClick={() => handleOpenAddModal('group')}
              className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ 录入团体体验</span>
            </button>
          </div>

          {/* 团体体验可视化次数按钮 */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 pt-1">
            {Array.from({ length: totalGroupCount }, (_, idx) => {
              const num = idx + 1;
              const rec = groupRecords.find((r) => r.sessionNum === num);
              const hasRec = Boolean(rec);

              return (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleOpenAddModal('group', num)}
                  className={`p-1 min-h-9 border rounded-xl text-[11px] font-bold transition flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
                    hasRec
                      ? 'bg-purple-600 text-white border-purple-700 dark:bg-purple-600 dark:border-purple-500'
                      : 'bg-white dark:bg-slate-900 border-purple-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-800'
                  }`}
                  title={hasRec ? `第 ${num} 次团体体验已记录 (点击查看/编辑)` : `第 ${num} 次团体体验未录入 (点击新增记录)`}
                >
                  <span>{num}次</span>
                  {hasRec && <span className="text-[9px] opacity-90 scale-90">已录入</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. 搜索与板块筛选 Filter Bar */}
      <div className="bg-white border border-purple-200 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-700 dark:text-slate-200">板块筛选:</span>
          <div className="flex items-center gap-1 bg-purple-50/60 dark:bg-slate-800 p-1 rounded-xl border border-purple-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTypeFilter === 'all'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-300'
              }`}
            >
              全部体验 ({records.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('individual')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTypeFilter === 'individual'
                  ? 'bg-sky-600 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-300'
              }`}
            >
              👤 个体体验 ({individualRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('group')}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                activeTypeFilter === 'group'
                  ? 'bg-purple-600 text-white shadow-2xs'
                  : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-300'
              }`}
            >
              👥 团体体验 ({groupRecords.length})
            </button>
          </div>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="检索体验记录、分析师/带领者或体会..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 bg-purple-50/30 border border-purple-200 rounded-xl text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
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
      </div>

      {/* 4. 体验档案列表 */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white border border-purple-200 rounded-2xl p-8 text-center text-zinc-500 text-xs">
            {searchQuery ? '未找到符合检索条件的体验记录。' : '暂无个人体验记录，点击上方【+ 录入个体体验】或【+ 录入团体体验】进行新增。'}
          </div>
        ) : (
          filteredRecords.map((rec) => {
            const isIndividual = rec.type === 'individual';
            const isExpanded = expandedRecordIds[rec.id] ?? true;

            return (
              <div
                key={rec.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 shadow-2xs space-y-3 transition ${
                  isIndividual
                    ? 'border-sky-200 dark:border-slate-800'
                    : 'border-purple-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 dark:border-slate-800 pb-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-md flex items-center gap-1 ${
                        isIndividual
                          ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300'
                          : 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300'
                      }`}
                    >
                      {isIndividual ? <User className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                      <span>{isIndividual ? '1. 个体体验' : '2. 团体体验'} · 第 {rec.sessionNum} 次</span>
                    </span>

                    <span className="text-xs font-bold text-zinc-800 dark:text-slate-100 flex items-center gap-1">
                      <CalendarIcon className="w-3.5 h-3.5 text-purple-500" />
                      <span>{rec.date} [{rec.timeRange || '14:00-15:00'}]</span>
                    </span>

                    {rec.facilitator && (
                      <span className="text-xs text-zinc-600 dark:text-slate-300 font-medium">
                        (导师/带领者: <strong className="text-purple-900 dark:text-purple-300">{rec.facilitator}</strong>)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedRecordIds((prev) => ({
                          ...prev,
                          [rec.id]: !prev[rec.id],
                        }))
                      }
                      className="text-zinc-500 hover:text-zinc-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-0.5 cursor-pointer text-xs"
                    >
                      {isExpanded ? (
                        <>
                          <span>收起</span>
                          <ChevronUp className="w-3.5 h-3.5" />
                        </>
                      ) : (
                        <>
                          <span>展开</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(rec)}
                      className="text-xs font-bold px-2.5 py-1 bg-purple-50 dark:bg-slate-800 hover:bg-purple-100 text-purple-800 dark:text-purple-300 border border-purple-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                    >
                      <Pencil className="w-3 h-3" />
                      <span>编辑</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteRecord(rec.id)}
                      className="text-zinc-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="删除记录"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-2.5">
                    {/* 反思/笔记 */}
                    {rec.note ? (
                      <div className="bg-purple-50/70 dark:bg-slate-800/60 border-l-3 border-purple-400 p-3 rounded-r-xl text-xs text-zinc-800 dark:text-slate-200 leading-relaxed">
                        <strong className="text-purple-900 dark:text-purple-300 block font-bold mb-1">
                          💡 体验悟道与总结:
                        </strong>
                        {/<[a-z][\s\S]*>/i.test(rec.note) ? (
                          <div dangerouslySetInnerHTML={{ __html: rec.note }} />
                        ) : (
                          <div className="whitespace-pre-wrap">{rec.note}</div>
                        )}
                      </div>
                    ) : null}

                    {/* 逐字稿 */}
                    {rec.transcript ? (
                      <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border-l-3 border-emerald-500 p-3 rounded-r-xl text-xs text-slate-800 dark:text-slate-200">
                        <strong className="text-emerald-900 dark:text-emerald-300 font-bold flex items-center gap-1 mb-1">
                          <Mic className="w-3.5 h-3.5 text-emerald-600" />
                          <span>会谈逐字稿:</span>
                        </strong>
                        <div className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                          {rec.transcript}
                        </div>
                      </div>
                    ) : null}

                    {/* 想法 */}
                    {rec.ideas && rec.ideas.length > 0 && (
                      <IdeasSection
                        ideas={rec.ideas}
                        onAddIdea={(newIdea) => {
                          const updated = records.map((r) =>
                            r.id === rec.id ? { ...r, ideas: [...(r.ideas || []), newIdea] } : r
                          );
                          onUpdateExperienceData({ ...experienceData, records: updated });
                        }}
                        onDeleteIdea={(idx) => {
                          const updated = records.map((r) =>
                            r.id === rec.id
                              ? { ...r, ideas: (r.ideas || []).filter((_, i) => i !== idx) }
                              : r
                          );
                          onUpdateExperienceData({ ...experienceData, records: updated });
                        }}
                      />
                    )}

                    {/* 外链 */}
                    {rec.resources && rec.resources.length > 0 && (
                      <ResourceLinkSection
                        resources={rec.resources}
                        onAddResource={(newLink) => {
                          const updated = records.map((r) =>
                            r.id === rec.id ? { ...r, resources: [...(r.resources || []), newLink] } : r
                          );
                          onUpdateExperienceData({ ...experienceData, records: updated });
                        }}
                        onDeleteResource={(id) => {
                          const updated = records.map((r) =>
                            r.id === rec.id
                              ? { ...r, resources: (r.resources || []).filter((res) => res.id !== id) }
                              : r
                          );
                          onUpdateExperienceData({ ...experienceData, records: updated });
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal for Single Record Add/Edit */}
      {modalRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-purple-100 dark:border-slate-800 pb-3 mb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <span>🧘</span>
                <span>
                  {modalRecord.type === 'individual' ? '个体体验' : '团体体验'} · 第 {modalRecord.sessionNum} 次档案
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setModalRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meta bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/70 dark:bg-purple-950/60 p-3 rounded-xl border border-purple-200 dark:border-purple-800 mb-4 text-xs">
              <label className="flex items-center gap-1.5 font-bold text-purple-950 dark:text-purple-200">
                <span>体验类型:</span>
                <select
                  value={modalRecord.type}
                  onChange={(e) =>
                    setModalRecord((prev) =>
                      prev ? { ...prev, type: e.target.value as 'individual' | 'group' } : null
                    )
                  }
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-purple-200 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="individual">1. 个体体验</option>
                  <option value="group">2. 团体体验</option>
                </select>
              </label>

              <label className="flex items-center gap-1.5 font-bold text-purple-950 dark:text-purple-200">
                <CalendarIcon className="w-4 h-4 text-purple-600" />
                <span>日期:</span>
                <input
                  type="date"
                  value={modalRecord.date}
                  onChange={(e) =>
                    setModalRecord((prev) => (prev ? { ...prev, date: e.target.value } : null))
                  }
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-purple-200 rounded-lg text-slate-800 dark:text-slate-100 font-normal"
                />
              </label>

              <label className="flex items-center gap-1.5 font-bold text-purple-950 dark:text-purple-200">
                <span>分析师/带领者:</span>
                <input
                  type="text"
                  placeholder="如: 李分析师"
                  value={modalRecord.facilitator}
                  onChange={(e) =>
                    setModalRecord((prev) => (prev ? { ...prev, facilitator: e.target.value } : null))
                  }
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-purple-200 rounded-lg text-slate-800 dark:text-slate-100 font-normal"
                />
              </label>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-purple-100 dark:border-slate-800 mb-4 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab('note')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'note'
                    ? 'border-purple-600 text-purple-600 font-bold bg-purple-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>体验体会与反思</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('transcript')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'transcript'
                    ? 'border-purple-600 text-purple-600 font-bold bg-purple-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <Mic className="w-4 h-4 text-emerald-600" />
                <span>逐字稿 (微信语音大模型)</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('ideas')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'ideas'
                    ? 'border-purple-600 text-purple-600 font-bold bg-purple-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>体悟想法 ({modalRecord.ideas.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('resources')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'resources'
                    ? 'border-purple-600 text-purple-600 font-bold bg-purple-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-blue-500" />
                <span>绑定外链 ({modalRecord.resources.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[260px]">
              {modalTab === 'note' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      体验感悟与心理成长体会:
                    </label>
                    <VoiceInputButton
                      currentText={modalRecord.note}
                      onTranscript={(text) =>
                        setModalRecord((prev) => (prev ? { ...prev, note: prev.note ? `${prev.note}\n${text}` : text } : null))
                      }
                      buttonText="微信语音口述"
                    />
                  </div>
                  <RichTextEditor
                    value={modalRecord.note}
                    onChange={(val) => setModalRecord((prev) => (prev ? { ...prev, note: val } : null))}
                    placeholder="录入本次自我体验反思、情绪觉察、移情/反移情觉察或总结..."
                  />
                </div>
              )}

              {modalTab === 'transcript' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      体验会谈逐字稿:
                    </label>
                    <VoiceInputButton
                      currentText={modalRecord.transcript}
                      onTranscript={(text) =>
                        setModalRecord((prev) => (prev ? { ...prev, transcript: prev.transcript ? `${prev.transcript}\n${text}` : text } : null))
                      }
                      buttonText="微信语音录制逐字稿"
                    />
                  </div>
                  <textarea
                    rows={10}
                    value={modalRecord.transcript}
                    onChange={(e) =>
                      setModalRecord((prev) => (prev ? { ...prev, transcript: e.target.value } : null))
                    }
                    placeholder="录入会谈逐字稿或现场录音整理..."
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-400 font-mono leading-relaxed"
                  />
                </div>
              )}

              {modalTab === 'ideas' && (
                <IdeasSection
                  ideas={modalRecord.ideas}
                  onAddIdea={(newIdea) =>
                    setModalRecord((prev) => (prev ? { ...prev, ideas: [...prev.ideas, newIdea] } : null))
                  }
                  onDeleteIdea={(idx) =>
                    setModalRecord((prev) => (prev ? { ...prev, ideas: prev.ideas.filter((_, i) => i !== idx) } : null))
                  }
                />
              )}

              {modalTab === 'resources' && (
                <ResourceLinkSection
                  resources={modalRecord.resources}
                  onAddResource={(newLink) =>
                    setModalRecord((prev) => (prev ? { ...prev, resources: [...prev.resources, newLink] } : null))
                  }
                  onDeleteResource={(id) =>
                    setModalRecord((prev) => (prev ? { ...prev, resources: prev.resources.filter((r) => r.id !== id) } : null))
                  }
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-purple-100 dark:border-slate-800 pt-3 mt-3">
              <button
                type="button"
                onClick={() => setModalRecord(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveModalRecord}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
              >
                保存体验档案
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Batch Management Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                <span>⚡ 个人体验次数批量填报与管理</span>
              </h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">目标体验类型:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchTargetType('individual');
                      setBatchSelectedNums([]);
                    }}
                    className={`flex-1 py-1.5 rounded-lg border font-bold cursor-pointer transition ${
                      batchTargetType === 'individual'
                        ? 'bg-sky-600 text-white border-sky-700'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    1. 个体体验
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchTargetType('group');
                      setBatchSelectedNums([]);
                    }}
                    className={`flex-1 py-1.5 rounded-lg border font-bold cursor-pointer transition ${
                      batchTargetType === 'group'
                        ? 'bg-purple-600 text-white border-purple-700'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    2. 团体体验
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">勾选需要填报的次数:</label>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        const total = batchTargetType === 'individual' ? totalIndividualCount : totalGroupCount;
                        setBatchSelectedNums(Array.from({ length: total }, (_, i) => i + 1));
                      }}
                      className="text-purple-600 font-bold hover:underline cursor-pointer"
                    >
                      全选
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchSelectedNums([])}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      清空
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-1 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200">
                  {Array.from(
                    { length: batchTargetType === 'individual' ? totalIndividualCount : totalGroupCount },
                    (_, i) => i + 1
                  ).map((num) => {
                    const isSelected = batchSelectedNums.includes(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setBatchSelectedNums((prev) => prev.filter((n) => n !== num));
                          } else {
                            setBatchSelectedNums((prev) => [...prev, num].sort((a, b) => a - b));
                          }
                        }}
                        className={`p-1 rounded text-[11px] font-bold border transition ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-700'
                            : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {num}次
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">起始排程日期:</label>
                  <input
                    type="date"
                    value={batchDateStart}
                    onChange={(e) => setBatchDateStart(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">递增间隔天数:</label>
                  <select
                    value={batchIntervalDays}
                    onChange={(e) => setBatchIntervalDays(Number(e.target.value))}
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
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">分析师 / 团体带领者:</label>
                <input
                  type="text"
                  placeholder="如: 王带领者"
                  value={batchFacilitator}
                  onChange={(e) => setBatchFacilitator(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">统一体悟备注 / 模板:</label>
                <input
                  type="text"
                  placeholder="如: 完成标准自我体验成长小时数"
                  value={batchNote}
                  onChange={(e) => setBatchNote(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-purple-100">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleApplyBatchFill}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                一键批量生成排程
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
