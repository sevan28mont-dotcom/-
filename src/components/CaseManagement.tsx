import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CaseCategory, CaseRecord, SessionData, ParentSessionData, ResourceLink, Supervisor, ThinkingNote } from '../types';
import { Plus, Minus, Pencil, Trash2, Calendar as CalendarIcon, CheckCircle, Clock, FileText, X, Search, Link as LinkIcon, Lightbulb, Mic, Eye, Download, Printer, Sparkles, Pin, PinOff, BarChart2, CheckSquare, Square, Layers, ListChecks, Zap, ChevronUp, ChevronDown, Users, HeartHandshake, GripVertical, FolderOpen } from 'lucide-react';
import { VoiceInputButton } from './VoiceInputButton';
import { ResourceLinkSection } from './ResourceLinkSection';
import { IdeasSection } from './IdeasSection';
import { RichTextEditor } from './RichTextEditor';
import { LinkPreviewModal } from './LinkPreviewModal';
import { ExportCasePdfModal } from './ExportCasePdfModal';
import { ExportTranscriptPdfModal } from './ExportTranscriptPdfModal';
import { AiCaseSummaryModal } from './AiCaseSummaryModal';
import { CaseProgressCharts } from './CaseProgressCharts';

interface CaseManagementProps {
  category: CaseCategory;
  statusFilter?: 'all' | 'active' | 'ended';
  shortTermSubtypeFilter?: 'all' | 'personal' | 'agency';
  records: CaseRecord[];
  mentors?: Supervisor[];
  thinkingNotes?: ThinkingNote[];
  totalHoursOverrides?: any;
  onUpdateTotalHoursOverrides?: (newOverrides: any) => void;
  onAddCase: (newCase: Omit<CaseRecord, 'id' | 'sessions'>) => void;
  onDeleteCase: (id: string) => void;
  onUpdateSessionNote: (caseId: string, sessionNum: number, sessionData: SessionData) => void;
  onUpdateParentSessionNote?: (caseId: string, parentSessionNum: number, parentSessionData: ParentSessionData | null) => void;
  onBatchUpdateSessions?: (caseId: string, updates: { sessionNum: number; sessionData: Partial<SessionData> }[]) => void;
  onBatchUpdateCases?: (updates: { id: string; status?: 'active' | 'ended'; totalSessions?: number }[]) => void;
  onBatchDeleteCases?: (ids: string[]) => void;
  onUpdateCaseTotalSessions?: (caseId: string, newTotalSessions: number) => void;
  onSaveToThinkingNotes?: (note: ThinkingNote) => void;
  onTogglePinCase?: (id: string) => void;
  onReorderCases?: (newCases: CaseRecord[]) => void;
}

export const CaseManagement: React.FC<CaseManagementProps> = ({
  category,
  statusFilter = 'all',
  shortTermSubtypeFilter = 'all',
  records,
  mentors = [],
  thinkingNotes = [],
  totalHoursOverrides,
  onUpdateTotalHoursOverrides,
  onAddCase,
  onDeleteCase,
  onUpdateSessionNote,
  onUpdateParentSessionNote,
  onBatchUpdateSessions,
  onBatchUpdateCases,
  onBatchDeleteCases,
  onUpdateCaseTotalSessions,
  onSaveToThinkingNotes,
  onTogglePinCase,
  onReorderCases,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedCaseId, setDraggedCaseId] = useState<string | null>(null);
  const [dragOverCaseId, setDragOverCaseId] = useState<string | null>(null);

  const handleMoveCase = (caseId: string, direction: 'up' | 'down') => {
    const index = records.findIndex((r) => r.id === caseId);
    if (index < 0) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= records.length) return;

    const newRecords = [...records];
    const [moved] = newRecords.splice(index, 1);
    newRecords.splice(targetIndex, 0, moved);
    onReorderCases?.(newRecords);
  };

  const handleDragStart = (e: React.DragEvent, caseId: string) => {
    setDraggedCaseId(caseId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', caseId);
  };

  const handleDragOver = (e: React.DragEvent, caseId: string) => {
    e.preventDefault();
    if (draggedCaseId && draggedCaseId !== caseId) {
      setDragOverCaseId(caseId);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverCaseId(null);
    if (!draggedCaseId || draggedCaseId === targetId) return;

    const sourceIndex = records.findIndex((r) => r.id === draggedCaseId);
    const targetIndex = records.findIndex((r) => r.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const newRecords = [...records];
    const [moved] = newRecords.splice(sourceIndex, 1);
    newRecords.splice(targetIndex, 0, moved);

    onReorderCases?.(newRecords);
    setDraggedCaseId(null);
  };
  const [internalStatusFilter, setInternalStatusFilter] = useState<'all' | 'active' | 'ended'>(statusFilter);
  const [summaryModalCase, setSummaryModalCase] = useState<CaseRecord | null>(null);
  const [showChartsCaseId, setShowChartsCaseId] = useState<string | null>(null);

  // 个案模块时数修改 Modal
  const [isEditHoursModalOpen, setIsEditHoursModalOpen] = useState(false);
  const [hoursInputValue, setHoursInputValue] = useState('');

  // 个案列表批量编辑状态
  const [batchCaseMode, setBatchCaseMode] = useState(false);
  const [selectedCaseIds, setSelectedCaseIds] = useState<string[]>([]);

  // 节次按钮（1~N次）批量编辑状态
  const [batchSessionModes, setBatchSessionModes] = useState<Record<string, boolean>>({});
  const [selectedSessionsMap, setSelectedSessionsMap] = useState<Record<string, number[]>>({});
  // 节次按钮多于15次时的折叠/展开状态
  const [expandedCaseSessions, setExpandedCaseSessions] = useState<Record<string, boolean>>({});

  // --- 节次 (1~N次) 批量编辑辅助方法 ---
  const handleQuickSetTopNSessions = (caseId: string, totalSessions: number, topN: number, targetCompleted: boolean) => {
    const limit = Math.min(topN, totalSessions);
    const updates: { sessionNum: number; sessionData: Partial<SessionData> }[] = [];
    for (let i = 1; i <= limit; i++) {
      updates.push({
        sessionNum: i,
        sessionData: { completed: targetCompleted },
      });
    }
    if (onBatchUpdateSessions) {
      onBatchUpdateSessions(caseId, updates);
    } else {
      updates.forEach(({ sessionNum, sessionData }) => {
        onUpdateSessionNote(caseId, sessionNum, sessionData as SessionData);
      });
    }
  };

  const toggleBatchSessionMode = (caseId: string) => {
    setBatchSessionModes((prev) => ({ ...prev, [caseId]: !prev[caseId] }));
    if (!selectedSessionsMap[caseId]) {
      setSelectedSessionsMap((prev) => ({ ...prev, [caseId]: [] }));
    }
  };

  const handleToggleSelectSession = (caseId: string, sessionNum: number) => {
    setSelectedSessionsMap((prev) => {
      const current = prev[caseId] || [];
      if (current.includes(sessionNum)) {
        return { ...prev, [caseId]: current.filter((n) => n !== sessionNum) };
      } else {
        return { ...prev, [caseId]: [...current, sessionNum] };
      }
    });
  };

  const handleSelectAllSessions = (caseId: string, totalSessions: number) => {
    const allNums = Array.from({ length: totalSessions }, (_, i) => i + 1);
    setSelectedSessionsMap((prev) => ({ ...prev, [caseId]: allNums }));
  };

  const handleClearSelectedSessions = (caseId: string) => {
    setSelectedSessionsMap((prev) => ({ ...prev, [caseId]: [] }));
  };

  const handleApplyBatchSessionStatus = (caseId: string, targetCompleted: boolean) => {
    const selectedNums = selectedSessionsMap[caseId] || [];
    if (selectedNums.length === 0) {
      alert('请先勾选需要批量操作的咨询节次！');
      return;
    }
    const updates = selectedNums.map((num) => ({
      sessionNum: num,
      sessionData: { completed: targetCompleted },
    }));
    if (onBatchUpdateSessions) {
      onBatchUpdateSessions(caseId, updates);
    } else {
      updates.forEach(({ sessionNum, sessionData }) => {
        onUpdateSessionNote(caseId, sessionNum, sessionData as SessionData);
      });
    }
    setSelectedSessionsMap((prev) => ({ ...prev, [caseId]: [] }));
  };

  // --- 个案列表多选批量处理方法 ---
  const handleToggleSelectCase = (id: string) => {
    setSelectedCaseIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleSelectAllFilteredCases = () => {
    const allIds = filteredRecords.map((r) => r.id);
    setSelectedCaseIds(allIds);
  };

  const handleClearSelectedCases = () => {
    setSelectedCaseIds([]);
  };

  const handleBatchChangeCasesStatus = (targetStatus: 'active' | 'ended') => {
    if (selectedCaseIds.length === 0) return;
    const statusText = targetStatus === 'active' ? '【正在进行】' : '【终止和暂停】';
    if (!window.confirm(`确定要将选中的 ${selectedCaseIds.length} 个个案档案批量设置为 ${statusText} 状态吗？`)) return;

    if (onBatchUpdateCases) {
      onBatchUpdateCases(selectedCaseIds.map((id) => ({ id, status: targetStatus })));
    }
    setSelectedCaseIds([]);
  };

  const handleBatchChangeCasesTotal = () => {
    if (selectedCaseIds.length === 0) return;
    const input = window.prompt(`请输入要批量统一设置的计划咨询总次数 (例如: 20 或 50):`, '20');
    if (!input) return;
    const num = parseInt(input, 10);
    if (isNaN(num) || num <= 0) {
      alert('请输入有效的总次数数字！');
      return;
    }
    if (onBatchUpdateCases) {
      onBatchUpdateCases(selectedCaseIds.map((id) => ({ id, totalSessions: num })));
    }
    setSelectedCaseIds([]);
  };

  const handleBatchDeleteSelectedCases = () => {
    if (selectedCaseIds.length === 0) return;
    if (!window.confirm(`⚠️ 危险操作警告：确定要彻底删除选中的 ${selectedCaseIds.length} 个个案档案及其所有会谈数据吗？`)) return;
    if (onBatchDeleteCases) {
      onBatchDeleteCases(selectedCaseIds);
    } else {
      selectedCaseIds.forEach((id) => onDeleteCase(id));
    }
    setSelectedCaseIds([]);
  };

  React.useEffect(() => {
    setInternalStatusFilter(statusFilter);
    if (statusFilter === 'ended') {
      setStatus('ended');
    } else {
      setStatus('active');
    }
  }, [statusFilter]);

  const categoryRecords = records.filter((r) => {
    if (r.category !== category) return false;
    if (category === 'shortTerm' && shortTermSubtypeFilter !== 'all') {
      if (shortTermSubtypeFilter === 'personal') {
        return !r.shortTermType || r.shortTermType === 'personal';
      }
      if (shortTermSubtypeFilter === 'agency') {
        return r.shortTermType === 'agency';
      }
    }
    return true;
  });

  const statusFilteredRecords = categoryRecords.filter((item) => {
    if (category === 'shortTerm') {
      // 短程个案（个人短程案例/医院机构短程案例）不设“正在进行”与“已结案”隐形卡顿限制，全部直接自由建立与呈现
      return true;
    }
    if (internalStatusFilter === 'active') {
      return item.status === 'active' || !item.status;
    }
    if (internalStatusFilter === 'ended') {
      return item.status === 'ended';
    }
    return true;
  });

  const filteredRecords = statusFilteredRecords.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchName = item.name.toLowerCase().includes(q);
    const matchNum = item.caseNum.toLowerCase().includes(q);
    const matchDiagnosis = (item.diagnosis || '').toLowerCase().includes(q);
    const matchNotes = Object.values(item.sessions || {}).some((s: SessionData) => s.note?.toLowerCase().includes(q));
    const matchTranscript = Object.values(item.sessions || {}).some((s: SessionData) => s.transcript?.toLowerCase().includes(q));
    const matchIdeas = Object.values(item.sessions || {}).some((s: SessionData) => s.ideas?.some((idea) => idea.toLowerCase().includes(q)));
    const matchResources = Object.values(item.sessions || {}).some((s: SessionData) => s.resources?.some((res) => res.title.toLowerCase().includes(q) || res.url.toLowerCase().includes(q)));
    const matchDate = (item.startDate || '').includes(q) || (item.endDate && item.endDate.includes(q));
    return matchName || matchNum || matchDiagnosis || matchNotes || matchTranscript || matchIdeas || matchResources || matchDate;
  });

  // 重要个案优先置顶
  const sortedRecords = [...filteredRecords].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  // New Case Form State
  const [avatar, setAvatar] = useState('👨‍💼');
  const [caseNum, setCaseNum] = useState('');
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'active' | 'ended'>('active');
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [totalSessions, setTotalSessions] = useState<number | string>(30);
  const [isTeenager, setIsTeenager] = useState(false);

  const handleApplyQuickTemplate = (templateType: 'personal' | 'agency') => {
    const isPersonal = templateType === 'personal';
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const todayStr = new Date().toISOString().split('T')[0];

    if (isPersonal) {
      setAvatar('👨‍💼');
      setCaseNum(`S-PER-${randomSuffix}`);
      setName(`个人短程案主_${randomSuffix}`);
      setStartDate(todayStr);
      setStatus('active');
      setTotalSessions(10);
      setIsTeenager(false);
    } else {
      setAvatar('👩‍💼');
      setCaseNum(`HOSP-S-${randomSuffix}`);
      setName(`机构转介案主_${randomSuffix}`);
      setStartDate(todayStr);
      setStatus('active');
      setTotalSessions(12);
      setIsTeenager(false);
    }
  };

  // Parent Session Modal State
  const [selectedParentCaseId, setSelectedParentCaseId] = useState<string | null>(null);
  const [selectedParentSessionNum, setSelectedParentSessionNum] = useState<number | null>(null);
  const [parentModalNote, setParentModalNote] = useState('');
  const [parentModalDate, setParentModalDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [parentModalCompleted, setParentModalCompleted] = useState(true);
  const [parentModalTranscript, setParentModalTranscript] = useState('');
  const [parentModalIdeas, setParentModalIdeas] = useState<string[]>([]);
  const [parentModalResources, setParentModalResources] = useState<ResourceLink[]>([]);
  const [parentModalAfterSessionNum, setParentModalAfterSessionNum] = useState<number>(4);
  const [parentModalTab, setParentModalTab] = useState<'note' | 'transcript' | 'ideas' | 'resources'>('note');

  // Toggle Parent Section Expansion per case
  const [expandedParentSection, setExpandedParentSection] = useState<Record<string, boolean>>({});
  const [expandedCaseIds, setExpandedCaseIds] = useState<Record<string, boolean>>({});

  const openParentSessionModal = (caseRecord: CaseRecord, pNum: number) => {
    const parentSessions = caseRecord.parentSessions || {};
    const pData = parentSessions[pNum] || { completed: true, note: '', date: new Date().toISOString().split('T')[0] };
    setSelectedParentCaseId(caseRecord.id);
    setSelectedParentSessionNum(pNum);
    setParentModalNote(pData.note || '');
    setParentModalDate(pData.date || new Date().toISOString().split('T')[0]);
    setParentModalCompleted(pData.completed !== false);
    setParentModalTranscript(pData.transcript || '');
    setParentModalIdeas(pData.ideas || []);
    setParentModalResources(pData.resources || []);
    setParentModalAfterSessionNum(pData.afterSessionNum ?? (pNum * 4));
    setParentModalTab('note');
  };

  const closeParentSessionModal = () => {
    setSelectedParentCaseId(null);
    setSelectedParentSessionNum(null);
  };

  const handleSaveParentSession = () => {
    if (selectedParentCaseId && selectedParentSessionNum !== null && onUpdateParentSessionNote) {
      onUpdateParentSessionNote(selectedParentCaseId, selectedParentSessionNum, {
        completed: parentModalCompleted,
        date: parentModalDate,
        note: parentModalNote,
        transcript: parentModalTranscript,
        ideas: parentModalIdeas,
        resources: parentModalResources,
        afterSessionNum: parentModalAfterSessionNum,
      });
      closeParentSessionModal();
    }
  };

  // Session Modal State
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedSessionNum, setSelectedSessionNum] = useState<number | null>(null);
  const [modalNote, setModalNote] = useState('');
  const [modalCompleted, setModalCompleted] = useState(false);
  const [modalTranscript, setModalTranscript] = useState('');
  const [modalIdeas, setModalIdeas] = useState<string[]>([]);
  const [modalResources, setModalResources] = useState<ResourceLink[]>([]);
  const [modalTab, setModalTab] = useState<'note' | 'transcript' | 'ideas' | 'resources'>('note');

  // Preview resource modal state directly from session grid
  const [sessionResourcePreview, setSessionResourcePreview] = useState<{
    resource: ResourceLink;
    allResources: ResourceLink[];
  } | null>(null);

  // PDF Export modal state
  const [exportingPdfCase, setExportingPdfCase] = useState<CaseRecord | null>(null);
  const [exportingTranscriptSession, setExportingTranscriptSession] = useState<{
    caseRecord: CaseRecord;
    sessionNum: number;
    sessionData: SessionData;
  } | null>(null);

  // Inline Total Sessions Editor State
  const [editingTotalCaseId, setEditingTotalCaseId] = useState<string | null>(null);
  const [editingTotalValue, setEditingTotalValue] = useState<number | string>(30);

  const activeRecords = sortedRecords.filter((item) => item.status === 'active' || !item.status);
  const endedRecords = sortedRecords.filter((item) => item.status === 'ended');

  const renderCaseCard = (item: CaseRecord) => {
    const sessions = item.sessions || {};
    let completedCount = 0;
    let recordedCount = 0;
    for (let i = 1; i <= item.totalSessions; i++) {
      const sess = sessions[i];
      if (sess) {
        if (sess.completed) completedCount++;
        const hasContent = Boolean(
          sess.completed ||
          (sess.note && sess.note.trim()) ||
          (sess.transcript && sess.transcript.trim()) ||
          (sess.ideas && sess.ideas.length > 0) ||
          (sess.resources && sess.resources.length > 0)
        );
        if (hasContent) recordedCount++;
      }
    }
    const progressPercent = item.totalSessions > 0 ? Math.min(100, Math.round((recordedCount / item.totalSessions) * 100)) : 0;
    const isCaseSelected = selectedCaseIds.includes(item.id);

    // Parent Sessions logic (单独统计，父母访谈不计入个体访谈的总咨询次数)
    const parentSessions = item.parentSessions || {};
    const parentSessionKeys = Object.keys(parentSessions).map(Number);
    const parentCompletedCount = parentSessionKeys.filter(
      (k) => parentSessions[k]?.completed !== false && (parentSessions[k]?.note || parentSessions[k]?.transcript || parentSessions[k]?.completed)
    ).length;
    const parentTotalCount = parentSessionKeys.length;
    const nextParentNum = parentSessionKeys.length > 0 ? Math.max(...parentSessionKeys) + 1 : 1;
    const isParentSectionOpen = Boolean(expandedParentSection[item.id]);

    // 4:1 访谈节奏智能提醒: 每进行 4 次个体访谈，推荐安排 1 次父母访谈
    const needParentRecommend = recordedCount >= 4 && recordedCount >= parentCompletedCount * 4 + 4;

    const isBeingDraggedOver = dragOverCaseId === item.id;

    return (
      <div
        key={item.id}
        draggable
        onDragStart={(e) => {
          const target = e.target as HTMLElement;
          if (target && target.closest('button, input, select, textarea, a, .no-drag')) {
            e.preventDefault();
            return;
          }
          handleDragStart(e, item.id);
        }}
        onDragOver={(e) => handleDragOver(e, item.id)}
        onDragLeave={() => setDragOverCaseId(null)}
        onDrop={(e) => handleDrop(e, item.id)}
        className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition ${
          isBeingDraggedOver
            ? 'ring-4 ring-rose-400 border-rose-500 scale-[1.01] bg-rose-100/50 dark:bg-slate-800'
            : isCaseSelected
            ? 'ring-2 ring-rose-500 border-rose-500 bg-rose-50/30 dark:bg-slate-900'
            : item.pinned
            ? 'border-amber-300 dark:border-amber-700/80 ring-2 ring-amber-400/20 bg-amber-50/20 dark:bg-slate-900/90'
            : 'border-rose-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-slate-700'
        }`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rose-100 dark:border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-3">
            {/* 拖拽控制手柄与排序调整按钮 */}
            <div className="flex items-center gap-0.5 text-zinc-400 dark:text-slate-500 hover:text-rose-600 shrink-0 group">
              <div
                className="p-1 cursor-grab active:cursor-grabbing hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                title="按住此图标可上下拖拽调动个案排序"
              >
                <GripVertical className="w-5 h-5 text-rose-400 group-hover:text-rose-600 transition" />
              </div>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveCase(item.id, 'up');
                  }}
                  className="p-0.5 hover:bg-rose-100 dark:hover:bg-slate-800 rounded text-zinc-500 dark:text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="向上移一位"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveCase(item.id, 'down');
                  }}
                  className="p-0.5 hover:bg-rose-100 dark:hover:bg-slate-800 rounded text-zinc-500 dark:text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  title="向下移一位"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            {batchCaseMode && (
              <button
                type="button"
                onClick={() => handleToggleSelectCase(item.id)}
                className="p-1 cursor-pointer hover:scale-110 transition shrink-0"
                title={isCaseSelected ? '取消勾选该个案' : '勾选该个案'}
              >
                {isCaseSelected ? (
                  <CheckSquare className="w-5 h-5 text-rose-600 dark:text-rose-400 fill-rose-100" />
                ) : (
                  <Square className="w-5 h-5 text-zinc-400 dark:text-slate-500" />
                )}
              </button>
            )}
            <div className="text-3xl p-2.5 bg-rose-50 dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700">
              {item.avatar}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                {item.pinned && (
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 rounded-md border border-amber-300 dark:border-amber-700 flex items-center gap-1 shadow-2xs">
                    <Pin className="w-3 h-3 fill-amber-500 text-amber-600 shrink-0" />
                    <span>重要个案</span>
                  </span>
                )}
                {item.isTeenager && (
                  <span className="text-[11px] font-bold px-2.5 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 rounded-md border border-indigo-300 dark:border-indigo-700 flex items-center gap-1 shadow-2xs">
                    👶 青少年个案
                  </span>
                )}
                <span className="font-bold text-zinc-800 dark:text-slate-100 text-base">
                  {item.caseNum} {item.name}
                </span>
                {category === 'longTerm' && (
                  item.status === 'active' ? (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800">
                      进行中
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-md border border-rose-200 dark:border-rose-800">
                      已结案 ({item.endDate || '未设'})
                    </span>
                  )
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 dark:text-slate-400 mt-1.5">
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-rose-400" />
                  起始日期: YYYY-MM-DD ({item.startDate})
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-rose-400" />
                  已完成进度: <strong className="text-rose-600 dark:text-rose-400">{completedCount}</strong> / {item.totalSessions} 次
                </span>

                {/* 个案管理次数: 减1次、加1次、精准行内数字直接修改 */}
                {editingTotalCaseId === item.id ? (
                  <div className="flex items-center gap-1.5 bg-rose-100 dark:bg-slate-800 p-1.5 rounded-xl border border-rose-300 dark:border-slate-600 text-xs shadow-xs animate-fadeIn">
                    <span className="font-bold text-rose-900 dark:text-rose-300 text-[11px]">设置管理总次数:</span>
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={editingTotalValue}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setEditingTotalValue('');
                        } else {
                          const num = parseInt(val, 10);
                          setEditingTotalValue(isNaN(num) ? '' : num);
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const num = Number(editingTotalValue);
                          if (num > 0) {
                            onUpdateCaseTotalSessions?.(item.id, num);
                          }
                          setEditingTotalCaseId(null);
                        } else if (e.key === 'Escape') {
                          setEditingTotalCaseId(null);
                        }
                      }}
                      className="w-16 p-1 text-center font-bold text-xs bg-white dark:bg-slate-900 border border-rose-300 dark:border-slate-700 rounded-lg text-rose-700 dark:text-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      autoFocus
                    />
                    <span className="text-xs font-bold text-zinc-600 dark:text-slate-300">次</span>
                    <button
                      type="button"
                      onClick={() => {
                        const num = Number(editingTotalValue);
                        if (num > 0) {
                          onUpdateCaseTotalSessions?.(item.id, num);
                        }
                        setEditingTotalCaseId(null);
                      }}
                      className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shadow-2xs"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTotalCaseId(null)}
                      className="px-1.5 py-1 text-zinc-500 dark:text-slate-400 hover:text-zinc-700 dark:hover:text-slate-200 text-[11px] cursor-pointer"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-rose-50/80 dark:bg-slate-800 p-1 rounded-xl border border-rose-200 dark:border-slate-700 text-xs">
                    <span className="font-bold text-rose-900 dark:text-rose-300 px-1 text-[11px]">个案管理次数:</span>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.totalSessions > 1) {
                          onUpdateCaseTotalSessions?.(item.id, item.totalSessions - 1);
                        }
                      }}
                      className="p-1 hover:bg-rose-200 dark:hover:bg-slate-700 rounded-lg text-rose-700 dark:text-rose-300 transition cursor-pointer"
                      title="减少1次管理节次"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTotalCaseId(item.id);
                        setEditingTotalValue(item.totalSessions);
                      }}
                      className="px-1.5 py-0.5 hover:bg-white dark:hover:bg-slate-900 rounded-md font-bold text-rose-700 dark:text-rose-300 text-xs border border-transparent hover:border-rose-300 dark:hover:border-slate-600 transition cursor-pointer"
                      title="点击直接修改设置总次数"
                    >
                      {item.totalSessions}次
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateCaseTotalSessions?.(item.id, item.totalSessions + 1);
                      }}
                      className="p-1 hover:bg-rose-200 dark:hover:bg-slate-700 rounded-lg text-rose-700 dark:text-rose-300 transition cursor-pointer"
                      title="增加1次管理节次"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 父母访谈专属高亮按钮: 仅在勾选或选择“青少年个案”时显示 */}
            {item.isTeenager && (
              <button
                type="button"
                onClick={() =>
                  setExpandedParentSection((prev) => ({
                    ...prev,
                    [item.id]: !prev[item.id],
                  }))
                }
                className={`flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-lg transition cursor-pointer shadow-2xs border ${
                  isParentSectionOpen
                    ? 'bg-indigo-700 text-white border-indigo-800'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600'
                }`}
                title="父母访谈专区 (独立计次，不计入个体访谈总咨询次数)"
              >
                <Users className="w-3.5 h-3.5 text-indigo-200" />
                <span>父母访谈 ({parentCompletedCount} 次)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onTogglePinCase?.(item.id)}
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition border cursor-pointer ${
                item.pinned
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 hover:bg-amber-200'
                  : 'bg-zinc-50 dark:bg-slate-800 text-zinc-600 dark:text-slate-300 border-zinc-200 dark:border-slate-700 hover:bg-amber-50 dark:hover:bg-amber-950/40'
              }`}
              title={item.pinned ? '取消重点置顶' : '置顶重要个案'}
            >
              {item.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5 text-amber-500" />}
              <span>{item.pinned ? '已置顶' : '置顶'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowChartsCaseId(showChartsCaseId === item.id ? null : item.id)}
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg transition border cursor-pointer ${
                showChartsCaseId === item.id
                  ? 'bg-rose-600 text-white border-rose-600'
                  : 'bg-rose-50 dark:bg-slate-800 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-slate-700 hover:bg-rose-100'
              }`}
              title="查看可视化咨询进度图表分析"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>{showChartsCaseId === item.id ? '收起图表' : '进度图表'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSummaryModalCase(item)}
              className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-200" />
              <span>AI总结/报告</span>
            </button>

            <button
              type="button"
              onClick={() => setExportingPdfCase(item)}
              className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 bg-zinc-100 dark:bg-slate-800 hover:bg-zinc-200 dark:hover:bg-slate-700 text-zinc-700 dark:text-slate-200 border border-zinc-200 dark:border-slate-700 rounded-lg transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>导出PDF/打印</span>
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`确定要彻底删除 ${item.caseNum} ${item.name} 的个案档案及其所有会谈记录吗？`)) {
                  onDeleteCase(item.id);
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 text-rose-600 dark:text-rose-300 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-600 border border-rose-200 dark:border-rose-900/60 hover:border-rose-600 rounded-xl transition-all duration-200 cursor-pointer select-none touch-manipulation min-h-[36px] min-w-[36px] active:scale-95 shadow-2xs group"
              title="彻底删除此个案档案"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
              <span>删除档案</span>
            </button>

            <button
              type="button"
              onClick={() =>
                setExpandedCaseIds((prev) => ({
                  ...prev,
                  [item.id]: prev[item.id] === false ? true : false,
                }))
              }
              className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 text-zinc-700 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-rose-50/80 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-lg transition cursor-pointer font-bold shadow-2xs"
              title={expandedCaseIds[item.id] === false ? '点击展开个案细节' : '点击折叠收起个案细节'}
            >
              {expandedCaseIds[item.id] === false ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-rose-600" />
                  <span>展开详情</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-rose-600" />
                  <span>折叠详情</span>
                </>
              )}
            </button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {expandedCaseIds[item.id] !== false && (
            <motion.div
              key={`case-detail-${item.id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.28, ease: 'easeInOut' }}
              className="overflow-hidden pt-2"
            >

        {/* 咨询节次可视化进展分析图表 (D3 / Recharts) */}
        {showChartsCaseId === item.id && (
          <div className="mb-4">
            <CaseProgressCharts record={item} />
          </div>
        )}

        {/* 父母访谈展开卡片区 (仅在选择“青少年个案”时允许展示与使用) */}
        {item.isTeenager && isParentSectionOpen && (
          <div className="mb-4 bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl p-4 space-y-3 animate-fadeIn">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-200/80 dark:border-indigo-800 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4.5 h-4.5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-xs text-indigo-950 dark:text-indigo-200">
                  👪 青少年个案·父母访谈档案区 (单独统计: {parentCompletedCount} 次完成，不占用个体咨询总次数)
                </h4>
              </div>
              <div className="flex items-center gap-2">
                {parentTotalCount > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (window.confirm('确定要清空当前个案的所有父母访谈记录吗？此操作不可撤销！')) {
                        onUpdateParentSessionNote?.(item.id, -1, null);
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 rounded-xl text-xs font-bold transition border border-rose-200 dark:border-rose-800 cursor-pointer flex items-center gap-1 shadow-2xs select-none touch-manipulation min-h-[36px] active:scale-95"
                    title="点击直接清空当前个案的所有父母访谈记录"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>批量清空父母访谈</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openParentSessionModal(item, nextParentNum)}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition shadow-2xs cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>录入第 {nextParentNum} 次父母访谈</span>
                </button>
              </div>
            </div>

            {parentTotalCount === 0 ? (
              <p className="text-xs text-indigo-700/80 dark:text-indigo-300/80 italic py-1">
                暂无父母访谈记录。可根据实际需要随时点击右上角【录入第 1 次父母访谈】进行记录。
              </p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 pt-1">
                {Object.entries(parentSessions).map(([pNumStr, pData]) => {
                  const pNum = Number(pNumStr);
                  const isCompleted = pData.completed !== false;
                  return (
                    <div key={pNum} className="relative group">
                      <button
                        type="button"
                        onClick={() => openParentSessionModal(item, pNum)}
                        className="w-full p-2.5 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 hover:border-indigo-500 rounded-xl flex flex-col items-center justify-center text-xs transition cursor-pointer shadow-2xs hover:scale-102"
                      >
                        <span className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                          <Users className="w-3 h-3 text-indigo-500" />
                          第 {pNum} 次父母访谈
                        </span>
                        <span className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1">
                          {pData.date || '点击编辑录入'}
                        </span>
                        {isCompleted ? (
                          <span className="mt-1 text-[9px] px-1.5 py-0.2 bg-indigo-100 dark:bg-indigo-900/80 text-indigo-800 dark:text-indigo-200 font-bold rounded">
                            已完成
                          </span>
                        ) : (
                          <span className="mt-1 text-[9px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200 font-bold rounded">
                            计划中
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          if (window.confirm(`确定要删除第 ${pNum} 次父母访谈记录吗？`)) {
                            onUpdateParentSessionNote?.(item.id, pNum, null);
                          }
                        }}
                        onMouseDown={(e) => e.stopPropagation()}
                        onTouchStart={(e) => e.stopPropagation()}
                        className="absolute top-1 right-1 p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer select-none touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95"
                        title="直接删除此父母访谈"
                      >
                        <X className="w-3.5 h-3.5 text-rose-500" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 咨询进程进度百分比视觉条 */}
        <div className="mb-4 bg-rose-50/50 dark:bg-slate-800/80 border border-rose-100 dark:border-slate-700/80 rounded-xl p-3 transition-colors">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-zinc-800 dark:text-slate-100 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                咨询进度节奏:
              </span>
              <span className="text-zinc-600 dark:text-slate-300 font-medium flex items-center gap-1.5 flex-wrap">
                <span>
                  已记录 <strong className="text-rose-600 dark:text-rose-400 font-bold">{recordedCount}</strong> 次 / 预设总数 <strong className="text-slate-900 dark:text-slate-100 font-bold">{item.totalSessions}</strong> 次
                </span>
                {completedCount > 0 && (
                  <span className="text-[11px] text-zinc-500 dark:text-slate-400">
                    (已完结: {completedCount} 次)
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const input = window.prompt(`请输入个案【${item.name}】的最新计划咨询总次数:`, String(item.totalSessions));
                    if (input) {
                      const num = parseInt(input, 10);
                      if (!isNaN(num) && num > 0) {
                        if (onUpdateCaseTotalSessions) {
                          onUpdateCaseTotalSessions(item.id, num);
                        } else if (onBatchUpdateCases) {
                          onBatchUpdateCases([{ id: item.id, totalSessions: num }]);
                        }
                      }
                    }
                  }}
                  className="px-2 py-0.5 text-[11px] font-bold bg-white dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-slate-600 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-slate-600 rounded-md transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  title="修改设置该个案的计划咨询总次数"
                >
                  <Pencil className="w-2.5 h-2.5" />
                  <span>设置总次数</span>
                </button>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-rose-600 dark:text-rose-400 font-mono bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-slate-700 shadow-2xs">
                {progressPercent}%
              </span>
            </div>
          </div>

          {/* 进度百分比轨迹条 */}
          <div className="w-full bg-rose-200/60 dark:bg-slate-700/80 h-2.5 rounded-full overflow-hidden relative shadow-inner">
            <div
              className="bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600 dark:from-rose-500 dark:to-rose-400 h-full rounded-full transition-all duration-500 shadow-xs"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* ⚡ 节次 (1~N次) 批量设置快捷工具栏 */}
        {(() => {
          const isBatchSessionActive = Boolean(batchSessionModes[item.id]);
          const currentSelectedSessions = selectedSessionsMap[item.id] || [];

          return (
            <div className="mb-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-rose-50/80 dark:bg-slate-800/90 rounded-xl border border-rose-200/80 dark:border-slate-700/80 text-xs">
                {/* 快捷一键批量完成/重置 */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1 text-[11px]">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0" />
                    一键快捷标记:
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQuickSetTopNSessions(item.id, item.totalSessions, 1, true)}
                    className="px-2 py-0.5 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 text-zinc-700 dark:text-slate-200 border border-rose-200 dark:border-slate-600 rounded-md font-semibold text-[11px] transition cursor-pointer"
                    title="将第1次设为已完成"
                  >
                    第1次完成
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSetTopNSessions(item.id, item.totalSessions, 5, true)}
                    className="px-2 py-0.5 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 text-zinc-700 dark:text-slate-200 border border-rose-200 dark:border-slate-600 rounded-md font-semibold text-[11px] transition cursor-pointer"
                    title="将前5次一键设为已完成"
                  >
                    前5次完成
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSetTopNSessions(item.id, item.totalSessions, 10, true)}
                    className="px-2 py-0.5 bg-white dark:bg-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-600 text-zinc-700 dark:text-slate-200 border border-rose-200 dark:border-slate-600 rounded-md font-semibold text-[11px] transition cursor-pointer"
                    title="将前10次一键设为已完成"
                  >
                    前10次完成
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSetTopNSessions(item.id, item.totalSessions, item.totalSessions, true)}
                    className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[11px] transition cursor-pointer shadow-2xs"
                    title="一键将该个案所有节次全部设为已完成"
                  >
                    全部完成
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickSetTopNSessions(item.id, item.totalSessions, item.totalSessions, false)}
                    className="px-2 py-0.5 bg-zinc-200 dark:bg-slate-700 hover:bg-zinc-300 dark:hover:bg-slate-600 text-zinc-700 dark:text-slate-200 rounded-md font-semibold text-[11px] transition cursor-pointer"
                    title="重置所有节次状态为未完成"
                  >
                    全部未完成
                  </button>
                </div>

                {/* 开关自定义多选勾选模式 */}
                <button
                  type="button"
                  onClick={() => toggleBatchSessionMode(item.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                    isBatchSessionActive
                      ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                      : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-slate-600 hover:bg-rose-100'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>{isBatchSessionActive ? '退出多选' : '勾选多项节次'}</span>
                </button>
              </div>

              {/* 勾选模式展开的状态工具面板 */}
              {isBatchSessionActive && (
                <div className="p-2 bg-rose-100/90 dark:bg-slate-800/90 border border-rose-300 dark:border-slate-600 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs shadow-2xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-rose-900 dark:text-rose-200">
                      已勾选 <span className="text-rose-600 dark:text-rose-400 font-black text-sm">{currentSelectedSessions.length}</span> 个节次
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectAllSessions(item.id, item.totalSessions)}
                      className="px-2 py-0.5 bg-white dark:bg-slate-700 text-zinc-700 dark:text-slate-200 rounded border border-rose-200 dark:border-slate-600 text-[11px] font-bold cursor-pointer"
                    >
                      全选
                    </button>
                    <button
                      type="button"
                      onClick={() => handleClearSelectedSessions(item.id)}
                      className="px-2 py-0.5 bg-white dark:bg-slate-700 text-zinc-700 dark:text-slate-200 rounded border border-rose-200 dark:border-slate-600 text-[11px] font-bold cursor-pointer"
                    >
                      清空
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApplyBatchSessionStatus(item.id, true)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      标为已完成
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyBatchSessionStatus(item.id, false)}
                      className="px-3 py-1 bg-zinc-600 hover:bg-zinc-700 text-white font-bold rounded-lg text-xs cursor-pointer shadow-2xs flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      标为未完成
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* 次数网格 (包含个体咨询与父母访谈穿插显示) */}
        {(() => {
          const isExpanded = Boolean(expandedCaseSessions[item.id]);
          const displayLimit = 15;
          const isLongList = item.totalSessions > displayLimit;
          const parentSessions = item.parentSessions || {};

          // 收集所有已录入/保存的父母访谈序号，计算穿插位置
          const allParentNums = Object.keys(parentSessions).map(Number).sort((a, b) => a - b);

          return (
            <div>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-2">
                {Array.from({ length: item.totalSessions }, (_, idx) => {
                  const sessionNum = idx + 1;
                  const sessionData = item.sessions[sessionNum] || { completed: false, note: '' };

                  const hasNote = Boolean(sessionData.note && sessionData.note.trim());
                  const hasTranscript = Boolean(sessionData.transcript && sessionData.transcript.trim());
                  const hasIdeas = Boolean(sessionData.ideas && sessionData.ideas.length > 0);
                  const resources = sessionData.resources || [];
                  const hasResources = resources.length > 0;
                  const hasContent = sessionData.completed || hasNote || hasTranscript || hasIdeas || hasResources;

                  // 如果列表较长且处于折叠状态，隐藏15次之后未录入内容的空白按钮
                  if (isLongList && !isExpanded && sessionNum > displayLimit && !hasContent) {
                    return null;
                  }

                  const isBatchSessionActive = Boolean(batchSessionModes[item.id]);
                  const currentSelectedSessions = selectedSessionsMap[item.id] || [];
                  const isSelected = currentSelectedSessions.includes(sessionNum);

                  // 找出放置在当前 sessionNum 之后的父母访谈列表 (可自由拖拽改变 afterSessionNum)
                  const parentSessionsAfterThis = allParentNums.filter((pNum) => {
                    const pData = parentSessions[pNum];
                    const targetAfter = pData?.afterSessionNum ?? (pNum * 4);
                    return targetAfter === sessionNum;
                  });

                  return (
                    <React.Fragment key={sessionNum}>
                      <div
                        className="relative group transition-all"
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'move';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          try {
                            const raw = e.dataTransfer.getData('text/plain');
                            if (!raw) return;
                            const parsed = JSON.parse(raw);
                            if (parsed && parsed.caseId === item.id && parsed.parentNum) {
                              onUpdateParentSessionNote?.(item.id, parsed.parentNum, {
                                afterSessionNum: sessionNum,
                              });
                            }
                          } catch (err) {
                            console.error('Drag drop error:', err);
                          }
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            if (isBatchSessionActive) {
                              handleToggleSelectSession(item.id, sessionNum);
                            } else {
                              openSessionModal(item, sessionNum);
                            }
                          }}
                          className={`w-full min-h-12 border rounded-xl flex flex-col items-center justify-center p-1 text-xs transition cursor-pointer relative ${
                            isSelected
                              ? 'ring-2 ring-rose-500 border-rose-600 bg-rose-100 dark:bg-rose-900/60 font-black'
                              : sessionData.completed
                              ? 'bg-rose-400 dark:bg-rose-600 border-rose-500 dark:border-rose-500 text-white font-bold shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-rose-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-700 text-zinc-700 dark:text-slate-200'
                          }`}
                        >
                          {/* 多选模式复选勾号 */}
                          {isBatchSessionActive && (
                            <span className="absolute top-0.5 left-0.5">
                              {isSelected ? (
                                <CheckSquare className="w-3 h-3 text-rose-600 fill-white dark:text-rose-400" />
                              ) : (
                                <Square className="w-3 h-3 text-zinc-400 dark:text-slate-500" />
                              )}
                            </span>
                          )}

                          <span className="text-[11px] font-bold">{sessionNum}次</span>
                          <div className="flex items-center gap-0.5 mt-0.5">
                            {hasNote && (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  sessionData.completed ? 'bg-white' : 'bg-rose-500 dark:bg-rose-400'
                                }`}
                                title="包含笔记"
                              />
                            )}
                            {hasTranscript && (
                              <Mic className={`w-2.5 h-2.5 ${sessionData.completed ? 'text-white' : 'text-emerald-600'}`} title="包含逐字稿" />
                            )}
                            {hasIdeas && (
                              <Lightbulb className={`w-2.5 h-2.5 ${sessionData.completed ? 'text-amber-200' : 'text-amber-500'}`} title="包含随记想法" />
                            )}
                            {hasResources && (
                              <LinkIcon className={`w-2.5 h-2.5 ${sessionData.completed ? 'text-white' : 'text-blue-500'}`} title="包含WPS/公众号/小红书外链" />
                            )}
                          </div>
                        </button>

                        {/* 如果包含外链，悬浮/右上方提供一键嵌入预览快捷按钮 */}
                        {hasResources && !isBatchSessionActive && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionResourcePreview({
                                resource: resources[0],
                                allResources: resources,
                              });
                            }}
                            className="absolute -top-1.5 -right-1.5 p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-xs transition cursor-pointer hover:scale-110 z-10"
                            title={`点击直接在线预览绑定的 ${resources[0].title || 'WPS/微信公众号外链'}`}
                          >
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* 动态穿插于此次个体咨询后的父母访谈按钮 (仅限青少年个案) */}
                      {item.isTeenager && parentSessionsAfterThis.map((pNum) => {
                        const pData = parentSessions[pNum];
                        const hasParentData = Boolean(pData);
                        const isPCompleted = pData?.completed !== false && Boolean(pData?.date);

                        return (
                          <div
                            key={`parent_${pNum}`}
                            className="relative group cursor-grab active:cursor-grabbing"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData(
                                'text/plain',
                                JSON.stringify({ caseId: item.id, parentNum: pNum })
                              );
                              e.dataTransfer.effectAllowed = 'move';
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => openParentSessionModal(item, pNum)}
                              className={`w-full min-h-12 border rounded-xl flex flex-col items-center justify-center p-1 text-xs transition relative shadow-2xs ${
                                isPCompleted
                                  ? 'bg-indigo-600 dark:bg-indigo-700 text-white border-indigo-700 font-bold'
                                  : hasParentData
                                  ? 'bg-indigo-100 dark:bg-indigo-950/80 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-200 hover:bg-indigo-200'
                                  : 'bg-indigo-50/80 dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 hover:bg-indigo-100'
                              }`}
                              title={`第 ${pNum} 次父母访谈 (🖐️ 按住拖拽可任意放置到第N次个体咨询后)`}
                            >
                              <span className="text-[10px] font-black flex items-center gap-0.5">
                                <GripVertical className="w-2.5 h-2.5 opacity-60 shrink-0" />
                                <Users className="w-3 h-3 text-indigo-500 dark:text-indigo-300 shrink-0" />
                                <span>👪 父母{pNum}</span>
                              </span>
                              <span className="text-[9px] opacity-90 scale-90 mt-0.5 font-bold">
                                {isPCompleted ? '已完成' : '可拖拽穿插'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onUpdateParentSessionNote?.(item.id, pNum, null);
                              }}
                              className="absolute -top-1.5 -right-1.5 p-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full transition cursor-pointer shadow-xs z-10"
                              title="直接删除此父母访谈"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* 展开 / 折叠按钮 */}
              {isLongList && (
                <div className="mt-3 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setExpandedCaseSessions((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                    className="px-4 py-1.5 bg-rose-50/90 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-slate-700 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>折叠会谈次数按钮 (当前已展开全套 {item.totalSessions} 次)</span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                        <span>展开剩余 {item.totalSessions - displayLimit} 次会谈按钮 (共 {item.totalSessions} 次)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入来访者名称或代号！');
      return;
    }

    const targetShortTermType = category === 'shortTerm'
      ? (shortTermSubtypeFilter === 'agency' ? 'agency' : 'personal')
      : undefined;

    onAddCase({
      category,
      avatar,
      caseNum: caseNum.trim() || `C${Math.floor(Math.random() * 900 + 100)}`,
      name: name.trim(),
      startDate: startDate || new Date().toISOString().split('T')[0],
      status,
      endDate: status === 'ended' ? endDate : undefined,
      totalSessions: Number(totalSessions) || 20,
      isTeenager,
      shortTermType: targetShortTermType,
    });

    setName('');
    setCaseNum('');
    setIsTeenager(false);
  };

  const openSessionModal = (caseRecord: CaseRecord, sessionNum: number) => {
    const sessions = caseRecord.sessions || {};
    const sData = sessions[sessionNum] || { completed: false, note: '' };
    setSelectedCaseId(caseRecord.id);
    setSelectedSessionNum(sessionNum);
    setModalNote(sData.note || '');
    setModalCompleted(sData.completed || false);
    setModalTranscript(sData.transcript || '');
    setModalIdeas(sData.ideas || []);
    setModalResources(sData.resources || []);
    setModalTab('note');
  };

  const closeSessionModal = () => {
    setSelectedCaseId(null);
    setSelectedSessionNum(null);
  };

  const handleSaveSession = () => {
    if (selectedCaseId && selectedSessionNum !== null) {
      onUpdateSessionNote(selectedCaseId, selectedSessionNum, {
        completed: modalCompleted,
        note: modalNote,
        transcript: modalTranscript,
        ideas: modalIdeas,
        resources: modalResources,
      });
      closeSessionModal();
    }
  };

  const currentCase = records.find((r) => r.id === selectedCaseId);

  // 计算当前视图筛选下的自动累计时数
  const autoCompletedHours = statusFilteredRecords.reduce((acc, rec) => {
    const completedCount = Object.values(rec.sessions || {}).filter((s: any) => s.completed).length;
    const parentCount = Object.values(rec.parentSessions || {}).filter((p: any) => p.completed !== false && Boolean(p.date)).length;
    return acc + completedCount + parentCount;
  }, 0);

  let currentCategoryOverrideHours: number | undefined;
  if (category === 'shortTerm') {
    if (shortTermSubtypeFilter === 'personal') {
      currentCategoryOverrideHours = totalHoursOverrides?.shortTermPersonalCaseHours;
    } else if (shortTermSubtypeFilter === 'agency') {
      currentCategoryOverrideHours = totalHoursOverrides?.shortTermAgencyCaseHours;
    } else {
      currentCategoryOverrideHours = totalHoursOverrides?.shortTermCaseHours;
    }
  } else if (category === 'longTerm') {
    if (internalStatusFilter === 'active') {
      currentCategoryOverrideHours = totalHoursOverrides?.longTermActiveCaseHours;
    } else if (internalStatusFilter === 'ended') {
      currentCategoryOverrideHours = totalHoursOverrides?.longTermEndedCaseHours;
    } else {
      currentCategoryOverrideHours = totalHoursOverrides?.longTermCaseHours;
    }
  }

  const displayHours = currentCategoryOverrideHours !== undefined ? currentCategoryOverrideHours : autoCompletedHours;

  let titleText = category === 'longTerm' ? '长程个案' : '短程个案';
  let hoursLabel = '个案累计';
  if (category === 'longTerm') {
    if (internalStatusFilter === 'active') {
      titleText = '长程个案 · 正在进行';
      hoursLabel = '正在进行个案累计';
    } else if (internalStatusFilter === 'ended') {
      titleText = '长程个案 · 终止和暂停';
      hoursLabel = '终止暂停个案累计实数';
    } else {
      titleText = '长程个案 · 全部档案';
      hoursLabel = '长程个案累计';
    }
  } else {
    if (shortTermSubtypeFilter === 'personal') {
      titleText = '短程个案 · 个人短程案例';
      hoursLabel = '个人短程案例累计';
    } else if (shortTermSubtypeFilter === 'agency') {
      titleText = '短程个案 · 医院或机构短程案例';
      hoursLabel = '医院机构短程案例累计';
    } else {
      titleText = '短程个案';
      hoursLabel = '短程个案累计';
    }
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-rose-200 dark:border-slate-800 pb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-slate-100 border-l-4 border-rose-400 pl-3 flex items-center gap-2">
          <span>{internalStatusFilter === 'active' ? '🟢' : internalStatusFilter === 'ended' ? '⏸️' : (category === 'longTerm' ? '📂' : '📁')}</span>
          <span>{titleText}</span>
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* 可编辑时数按钮 */}
          <button
            type="button"
            onClick={() => {
              setHoursInputValue(String(displayHours));
              setIsEditHoursModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer"
            title="点击手动编辑/修改当前模块的累计时数"
          >
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>{hoursLabel}: <strong>{displayHours}</strong> 小时</span>
            <Pencil className="w-3 h-3 text-amber-600 dark:text-amber-400 opacity-80 shrink-0" />
          </button>

          {category === 'longTerm' && (
            <div className="flex items-center bg-rose-100/70 dark:bg-slate-800 p-1 rounded-xl border border-rose-200/80 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setInternalStatusFilter('active')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  internalStatusFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-slate-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                🟢 正在进行 ({categoryRecords.filter((r) => r.status === 'active' || !r.status).length})
              </button>
              <button
                type="button"
                onClick={() => setInternalStatusFilter('ended')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  internalStatusFilter === 'ended'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-zinc-600 dark:text-slate-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                ⏸️ 终止和暂停 ({categoryRecords.filter((r) => r.status === 'ended').length})
              </button>
              <button
                type="button"
                onClick={() => setInternalStatusFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                  internalStatusFilter === 'all'
                    ? 'bg-zinc-800 text-white dark:bg-slate-700 shadow-2xs'
                    : 'text-zinc-600 dark:text-slate-300 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                🌐 全部 ({categoryRecords.length})
              </button>
            </div>
          )}
          <span className="text-xs font-semibold px-3 py-1 bg-rose-100 dark:bg-slate-800 text-rose-800 dark:text-rose-300 rounded-full border border-rose-200 dark:border-slate-700">
            共 {filteredRecords.length} 个档案
          </span>
        </div>
      </div>

      {/* 新建个案卡片 */}
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors duration-300">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-rose-100 dark:border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-rose-500" />
            <span>动态新增个案档案</span>
          </h3>

          {/* 快速选择模板功能 */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-zinc-500 dark:text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-rose-500" />
              <span>快速套用模板:</span>
            </span>
            <button
              type="button"
              onClick={() => handleApplyQuickTemplate('personal')}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
              title="一键自动填充【个人短程案例】默认预设字段"
            >
              <span>👤 个人短程模板</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyQuickTemplate('agency')}
              className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer active:scale-95 shadow-2xs"
              title="一键自动填充【医院/机构短程案例】默认预设字段"
            >
              <span>🏥 医院/机构短程模板</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleCreateCase} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-slate-300 mb-1">头像与类型</label>
            <select
              value={avatar}
              onChange={(e) => {
                const val = e.target.value;
                setAvatar(val);
                if (val === '👦' || val === '👧') {
                  setIsTeenager(true);
                } else if (val === '👨‍💼' || val === '👩‍💼' || val === '👴') {
                  setIsTeenager(false);
                }
              }}
              className="w-full text-xs p-2.5 bg-rose-50/40 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
            >
              <option value="👨‍💼">👨‍💼 成年男性</option>
              <option value="👩‍💼">👩‍💼 成年女性</option>
              <option value="👦">👦 青少年男</option>
              <option value="👧">👧 青少年女</option>
              <option value="👴">👴 年长者</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-slate-300 mb-1">编号</label>
            <input
              type="text"
              placeholder="如: C001"
              value={caseNum}
              onChange={(e) => setCaseNum(e.target.value)}
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs font-semibold text-zinc-600 dark:text-slate-300 mb-1">来访者代号/名称 *</label>
            <input
              type="text"
              placeholder="来访者代号/隐名"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-slate-300 mb-1">开始日期 (YYYY-MM-DD)</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          {category === 'longTerm' && (
            <div>
              <label className="block text-xs font-semibold text-zinc-600 dark:text-slate-300 mb-1">状态</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'active' | 'ended')}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
              >
                <option value="active">正在进行中</option>
                <option value="ended">暂停/终止/已结案</option>
              </select>
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full py-2.5 bg-zinc-800 dark:bg-rose-600 hover:bg-zinc-700 dark:hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-xs active:scale-95 cursor-pointer"
            >
              新建个案
            </button>
          </div>

          {status === 'ended' && (
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-xs font-semibold text-zinc-600 dark:text-slate-300 mb-1">终止/结案日期 (YYYY-MM-DD)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-slate-300 mb-1">预估总次数</label>
            <input
              type="number"
              min={1}
              max={1000}
              value={totalSessions}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setTotalSessions('');
                } else {
                  const num = parseInt(val, 10);
                  setTotalSessions(isNaN(num) ? '' : num);
                }
              }}
              onFocus={(e) => e.target.select()}
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-7 pt-1">
            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50/80 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 rounded-xl cursor-pointer hover:bg-indigo-100/80 transition">
              <input
                type="checkbox"
                checked={isTeenager}
                onChange={(e) => setIsTeenager(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-indigo-300"
              />
              <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1">
                👶 标记为“青少年个案”
              </span>
            </label>
          </div>
        </form>
      </div>

      {/* 搜索过滤栏与个案批量管理开关 */}
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs space-y-3 transition-colors duration-300">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="检索姓名、编号、会谈笔记关键词或日期..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-8 py-2 bg-rose-50/30 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 placeholder-zinc-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded-full cursor-pointer"
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

          <div className="flex items-center gap-3">
            <div className="text-xs text-zinc-500 font-medium hidden sm:block">
              {searchQuery ? (
                <span>检索结果: <strong className="text-rose-600 font-bold">{filteredRecords.length}</strong> / {categoryRecords.length} 项</span>
              ) : (
                <span>包含 <strong className="text-zinc-800 dark:text-slate-200 font-bold">{categoryRecords.length}</strong> 个档案</span>
              )}
            </div>

            {/* 开关批量管理个案列表 */}
            <button
              type="button"
              onClick={() => {
                setBatchCaseMode(!batchCaseMode);
                if (batchCaseMode) setSelectedCaseIds([]);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                batchCaseMode
                  ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                  : 'bg-rose-50 dark:bg-slate-800 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-slate-700 hover:bg-rose-100'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{batchCaseMode ? '退出批量管理' : '批量管理个案'}</span>
            </button>
          </div>
        </div>

        {/* 开启批量个案管理后的快捷控制台 */}
        {batchCaseMode && (
          <div className="p-3 bg-rose-100/80 dark:bg-slate-800 border border-rose-300 dark:border-slate-700 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-900 dark:text-rose-200">
                已选中 <strong className="text-rose-600 dark:text-rose-400 text-sm font-black">{selectedCaseIds.length}</strong> 个个案档案
              </span>
              <button
                type="button"
                onClick={handleSelectAllFilteredCases}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 text-zinc-800 dark:text-slate-100 font-bold rounded-lg border border-rose-200 dark:border-slate-600 hover:bg-rose-50 cursor-pointer"
              >
                全选本页 ({filteredRecords.length})
              </button>
              <button
                type="button"
                onClick={handleClearSelectedCases}
                className="px-2.5 py-1 bg-white dark:bg-slate-700 text-zinc-800 dark:text-slate-100 font-bold rounded-lg border border-rose-200 dark:border-slate-600 hover:bg-rose-50 cursor-pointer"
              >
                清空选择
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleBatchChangeCasesStatus('active')}
                disabled={selectedCaseIds.length === 0}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs flex items-center gap-1"
              >
                🟢 批量设为正在进行
              </button>
              <button
                type="button"
                onClick={() => handleBatchChangeCasesStatus('ended')}
                disabled={selectedCaseIds.length === 0}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs flex items-center gap-1"
              >
                ⏸️ 批量设为终止/暂停
              </button>
              <button
                type="button"
                onClick={handleBatchChangeCasesTotal}
                disabled={selectedCaseIds.length === 0}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 dark:bg-slate-700 dark:hover:bg-slate-600 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs flex items-center gap-1"
              >
                🔢 批量修改总次数
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleBatchDeleteSelectedCases();
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                disabled={selectedCaseIds.length === 0}
                className="px-3.5 py-2 bg-rose-700 hover:bg-rose-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs cursor-pointer shadow-2xs flex items-center gap-1 select-none touch-manipulation min-h-[36px] active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                批量删除
              </button>
            </div>
          </div>
        )}
      </div>
                {/* 个案档案列表 */}
      <div className="space-y-6">
        {sortedRecords.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-8 text-center text-zinc-500 dark:text-slate-400 text-xs space-y-3">
            <p>暂无此分类下的个案档案。请在上方表单输入代号/名称直接“新建个案”。</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 p-2.5 rounded-xl shadow-2xs">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-rose-600" />
                <span>个案列表折叠管理 (包含 {sortedRecords.length} 个个案档案):</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  const allKeys = sortedRecords.map((r) => r.id);
                  const isAllExpanded = allKeys.length > 0 && allKeys.every((id) => expandedCaseIds[id] !== false);
                  const nextState: Record<string, boolean> = {};
                  allKeys.forEach((id) => {
                    nextState[id] = !isAllExpanded;
                  });
                  setExpandedCaseIds(nextState);
                }}
                className="px-3 py-1 bg-rose-50 dark:bg-slate-800 text-rose-800 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-slate-700 border border-rose-200 dark:border-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                title="一键展开或折叠页面中所有的个案卡片与会谈记录"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>一键展开/折叠所有个案档案</span>
              </button>
            </div>

            {/* 短程个案直通渲染列表 (不区分进行中/结案限制) */}
            {category === 'shortTerm' && (
              <div className="space-y-4">
                {filteredRecords.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-dashed border-rose-200 dark:border-slate-800">
                    暂无短程个案记录，请在上方“动态新增个案档案”中添加
                  </div>
                ) : (
                  filteredRecords.map((item) => renderCaseCard(item))
                )}
              </div>
            )}

            {/* 长程个案: 小标题 1 - 正在进行中 */}
            {category === 'longTerm' && (internalStatusFilter === 'active' || internalStatusFilter === 'all') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-4 py-2.5 rounded-xl shadow-2xs">
                  <div className="flex items-center gap-2.5 font-bold text-emerald-900 dark:text-emerald-300 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <h3>1. 长程个案正在进行中</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-200/60 dark:bg-emerald-900/80 text-emerald-950 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700">
                      共 {activeRecords.length} 名个案
                    </span>
                  </div>
                </div>
                {activeRecords.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-dashed border-rose-200 dark:border-slate-800">
                    暂无进行中的长程个案记录
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeRecords.map((item) => renderCaseCard(item))}
                  </div>
                )}
              </div>
            )}

            {/* 小标题 2: 暂停或终止的长程个案 (短程个案不显示此区块) */}
            {category === 'longTerm' && (internalStatusFilter === 'ended' || internalStatusFilter === 'all') && (
              <div className="space-y-3 pt-3">
                <div className="flex items-center justify-between bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 px-4 py-2.5 rounded-xl shadow-2xs">
                  <div className="flex items-center gap-2.5 font-bold text-amber-900 dark:text-amber-300 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <h3>2. 暂停或终止的长程个案</h3>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200/60 dark:bg-amber-900/80 text-amber-950 dark:text-amber-200 font-bold border border-amber-300 dark:border-amber-700">
                      共 {endedRecords.length} 名个案
                    </span>
                  </div>
                </div>
                {endedRecords.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400 bg-white/60 dark:bg-slate-900/60 rounded-xl border border-dashed border-rose-200 dark:border-slate-800">
                    暂无暂停或终止的长程个案记录
                  </div>
                ) : (
                  <div className="space-y-4">
                    {endedRecords.map((item) => renderCaseCard(item))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Session Modal */}
      {selectedCaseId && selectedSessionNum !== null && currentCase && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3 mb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-rose-600" />
                <span>
                  {currentCase.avatar} {currentCase.name} - 第 {selectedSessionNum} 次咨询全功能档案
                </span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentCase && selectedSessionNum !== null) {
                      setExportingTranscriptSession({
                        caseRecord: currentCase,
                        sessionNum: selectedSessionNum,
                        sessionData: {
                          completed: modalCompleted,
                          note: modalNote,
                          transcript: modalTranscript,
                          ideas: modalIdeas,
                          resources: modalResources,
                        },
                      });
                    }
                  }}
                  className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                  title="导出当次会谈及逐字稿为 PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>导出逐字稿 PDF</span>
                </button>
                <button
                  onClick={closeSessionModal}
                  className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 完成状态 toggle & 切换选项卡 */}
            <div className="space-y-3 mb-3">
              <div className="flex items-center justify-between bg-rose-50/70 dark:bg-slate-800 p-2.5 rounded-xl border border-rose-200 dark:border-slate-700">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">标记完成状态:</span>
                <button
                  type="button"
                  onClick={() => setModalCompleted(!modalCompleted)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
                    modalCompleted
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600'
                  }`}
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>{modalCompleted ? '已完成' : '未完成'}</span>
                </button>
              </div>

              {/* 选项卡按钮 */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setModalTab('note')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    modalTab === 'note'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>咨询笔记</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('transcript')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    modalTab === 'transcript'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Mic className="w-3.5 h-3.5" />
                  <span>逐字稿 ({modalTranscript ? '已录' : '未录'})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('ideas')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    modalTab === 'ideas'
                      ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>想法点子 ({modalIdeas.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('resources')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                    modalTab === 'resources'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  <span>WPS与公众号/小红书 ({modalResources.length})</span>
                </button>
              </div>
            </div>

            {/* Modal Body with Tab Content */}
            <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-4">
              {modalTab === 'note' && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    咨询笔记 / 观察与分析 (支持加粗、居中对齐、文字颜色与高亮)
                  </label>
                  <RichTextEditor
                    value={modalNote}
                    onChange={(val) => setModalNote(val)}
                    placeholder="在此记录当次会谈的关键要点、心理动力、反移情观察等... 可使用上方工具栏调整样式和颜色，或点击语音录入口述。"
                    minHeight="220px"
                    voiceButtonText="语音口述笔记"
                  />
                </div>
              )}

              {modalTab === 'transcript' && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Mic className="w-4 h-4 text-emerald-600" />
                    <span>会谈逐字稿记录 (支持富文本编辑器、居中、文本颜色与实时语音转文字)</span>
                  </label>
                  <RichTextEditor
                    value={modalTranscript}
                    onChange={(val) => setModalTranscript(val)}
                    placeholder="在此记录完整或片段逐字稿，可使用上方工具栏设置字号、对齐方式、颜色，或直接点击右侧语音口述转文字..."
                    minHeight="260px"
                    voiceButtonText="语音口述逐字稿"
                  />
                </div>
              )}

              {modalTab === 'ideas' && (
                <IdeasSection
                  ideas={modalIdeas}
                  onAddIdea={(newIdea) => setModalIdeas((prev) => [...prev, newIdea])}
                  onDeleteIdea={(index) => setModalIdeas((prev) => prev.filter((_, i) => i !== index))}
                />
              )}

              {modalTab === 'resources' && (
                <ResourceLinkSection
                  resources={modalResources}
                  onAddResource={(newLink) => setModalResources((prev) => [...prev, newLink])}
                  onDeleteResource={(id) => setModalResources((prev) => prev.filter((r) => r.id !== id))}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-rose-100 dark:border-slate-800 mt-2">
              <button
                type="button"
                onClick={closeSessionModal}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveSession}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition shadow-2xs cursor-pointer"
              >
                保存完整档案
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 从网格点击眼睛快速调出的资源内嵌预览 Modal */}
      {sessionResourcePreview && (
        <LinkPreviewModal
          resource={sessionResourcePreview.resource}
          allResources={sessionResourcePreview.allResources}
          onSelectResource={(res) =>
            setSessionResourcePreview((prev) => (prev ? { ...prev, resource: res } : null))
          }
          onClose={() => setSessionResourcePreview(null)}
        />
      )}

      {/* 导出个案 PDF 汇总 Modal */}
      {exportingPdfCase && (
        <ExportCasePdfModal
          caseRecord={exportingPdfCase}
          mentors={mentors}
          thinkingNotes={thinkingNotes}
          onClose={() => setExportingPdfCase(null)}
        />
      )}

      {/* 导出单次会谈逐字稿 PDF Modal */}
      {exportingTranscriptSession && (
        <ExportTranscriptPdfModal
          caseRecord={exportingTranscriptSession.caseRecord}
          sessionNum={exportingTranscriptSession.sessionNum}
          sessionData={exportingTranscriptSession.sessionData}
          onClose={() => setExportingTranscriptSession(null)}
        />
      )}

      {/* Gemini AI 咨询进度摘要 Modal */}
      {summaryModalCase && (
        <AiCaseSummaryModal
          caseRecord={summaryModalCase}
          mentors={mentors}
          onClose={() => setSummaryModalCase(null)}
          onSaveToThinkingNotes={onSaveToThinkingNotes}
        />
      )}

      {/* 父母访谈 (Parent Session) 专属全功能档案 Modal */}
      {selectedParentCaseId && selectedParentSessionNum !== null && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-800 pb-3 mb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <span>
                  👶 青少年个案父母访谈：第 {selectedParentSessionNum} 次父母访谈档案
                </span>
              </h3>
              <button
                type="button"
                onClick={closeParentSessionModal}
                className="p-1 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Meta Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-indigo-50/70 dark:bg-indigo-950/60 p-3 rounded-xl border border-indigo-200 dark:border-indigo-800 mb-4 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200">
                  <CalendarIcon className="w-4 h-4 text-indigo-600" />
                  <span>访谈日期:</span>
                  <input
                    type="date"
                    value={parentModalDate}
                    onChange={(e) => setParentModalDate(e.target.value)}
                    className="px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-slate-800 dark:text-slate-100 font-normal focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  />
                </label>

                <label className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-200" title="可按住拖拽图标或在此指定穿插于第几次个体咨询之后">
                  <GripVertical className="w-4 h-4 text-indigo-500" />
                  <span>穿插位置:</span>
                  <select
                    value={parentModalAfterSessionNum}
                    onChange={(e) => setParentModalAfterSessionNum(Number(e.target.value))}
                    className="px-2 py-1 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-lg text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  >
                    {Array.from({ length: 60 }, (_, i) => i + 1).map((sNum) => (
                      <option key={sNum} value={sNum}>
                        第 {sNum} 次个体咨询后
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parentModalCompleted}
                  onChange={(e) => setParentModalCompleted(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 border-indigo-300"
                />
                <span className="font-bold text-indigo-900 dark:text-indigo-200">
                  标记为已完成访谈
                </span>
              </label>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center border-b border-indigo-100 dark:border-indigo-800 mb-4 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setParentModalTab('note')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  parentModalTab === 'note'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>父母访谈评估/笔记</span>
              </button>

              <button
                type="button"
                onClick={() => setParentModalTab('transcript')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  parentModalTab === 'transcript'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Mic className="w-4 h-4 text-emerald-600" />
                <span>逐字稿 (微信语音大模型)</span>
              </button>

              <button
                type="button"
                onClick={() => setParentModalTab('ideas')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  parentModalTab === 'ideas'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>反思要点 ({parentModalIdeas.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setParentModalTab('resources')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  parentModalTab === 'resources'
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/40 rounded-t-lg'
                    : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-blue-500" />
                <span>绑定外链 ({parentModalResources.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[260px]">
              {parentModalTab === 'note' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span>父母访谈观察与家庭系统评估:</span>
                    </label>
                    <VoiceInputButton
                      currentText={parentModalNote}
                      onTranscript={(text) => setParentModalNote((prev) => (prev ? `${prev}\n${text}` : text))}
                      buttonText="微信语音口述"
                    />
                  </div>
                  <RichTextEditor
                    value={parentModalNote}
                    onChange={setParentModalNote}
                    placeholder="输入或通过【微信语音口述】录入父母访谈要点、养育态度、家庭系统沟通模式与父母期望..."
                  />
                </div>
              )}

              {parentModalTab === 'transcript' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      父母访谈会谈逐字稿:
                    </label>
                    <VoiceInputButton
                      currentText={parentModalTranscript}
                      onTranscript={(text) => setParentModalTranscript((prev) => (prev ? `${prev}\n${text}` : text))}
                      buttonText="微信语音录制逐字稿"
                    />
                  </div>
                  <textarea
                    rows={10}
                    value={parentModalTranscript}
                    onChange={(e) => setParentModalTranscript(e.target.value)}
                    placeholder="录入父母访谈对话全貌或逐字稿..."
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-indigo-200 dark:border-indigo-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono leading-relaxed"
                  />
                </div>
              )}

              {parentModalTab === 'ideas' && (
                <IdeasSection
                  ideas={parentModalIdeas}
                  onAddIdea={(newIdea) => setParentModalIdeas((prev) => [...prev, newIdea])}
                  onDeleteIdea={(index) => setParentModalIdeas((prev) => prev.filter((_, i) => i !== index))}
                />
              )}

              {parentModalTab === 'resources' && (
                <ResourceLinkSection
                  resources={parentModalResources}
                  onAddResource={(newLink) => setParentModalResources((prev) => [...prev, newLink])}
                  onDeleteResource={(id) => setParentModalResources((prev) => prev.filter((r) => r.id !== id))}
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-indigo-100 dark:border-indigo-800 pt-3 mt-3">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (window.confirm('确定要删除此父母访谈记录吗？')) {
                    if (onUpdateParentSessionNote && selectedParentCaseId && selectedParentSessionNum !== null) {
                      onUpdateParentSessionNote(selectedParentCaseId, selectedParentSessionNum, null);
                    }
                    closeParentSessionModal();
                  }
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer flex items-center gap-1 transition border border-rose-200/80 dark:border-rose-900/60 select-none touch-manipulation min-h-[36px] active:scale-95 shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>删除此父母访谈</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={closeParentSessionModal}
                  className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveParentSession}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
                >
                  保存父母访谈档案
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 模块累计时数快捷修改 Modal */}
      {isEditHoursModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-amber-100 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>编辑 {hoursLabel}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditHoursModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  设置累计时数 (小时):
                </label>
                <input
                  type="number"
                  min="0"
                  value={hoursInputValue}
                  onChange={(e) => setHoursInputValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="输入时数"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setHoursInputValue(String((Number(hoursInputValue) || 0) + 1))}
                  className="flex-1 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-lg text-xs font-bold cursor-pointer hover:bg-amber-100"
                >
                  +1 小时
                </button>
                <button
                  type="button"
                  onClick={() => setHoursInputValue(String((Number(hoursInputValue) || 0) + 5))}
                  className="flex-1 py-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 rounded-lg text-xs font-bold cursor-pointer hover:bg-amber-100"
                >
                  +5 小时
                </button>
                <button
                  type="button"
                  onClick={() => setHoursInputValue(String(autoCompletedHours))}
                  className="flex-1 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-200"
                  title="重置为根据实际录入档案自动统计的时数"
                >
                  自动重置 ({autoCompletedHours}h)
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-amber-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditHoursModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = Number(hoursInputValue);
                  const num = isNaN(val) ? 0 : Math.max(0, val);
                  if (onUpdateTotalHoursOverrides) {
                    if (category === 'shortTerm') {
                      if (shortTermSubtypeFilter === 'personal') {
                        onUpdateTotalHoursOverrides({ ...totalHoursOverrides, shortTermPersonalCaseHours: num });
                      } else if (shortTermSubtypeFilter === 'agency') {
                        onUpdateTotalHoursOverrides({ ...totalHoursOverrides, shortTermAgencyCaseHours: num });
                      } else {
                        onUpdateTotalHoursOverrides({ ...totalHoursOverrides, shortTermCaseHours: num });
                      }
                    } else if (category === 'longTerm') {
                      if (internalStatusFilter === 'active') {
                        onUpdateTotalHoursOverrides({ ...totalHoursOverrides, longTermActiveCaseHours: num });
                      } else if (internalStatusFilter === 'ended') {
                        onUpdateTotalHoursOverrides({ ...totalHoursOverrides, longTermEndedCaseHours: num });
                      } else {
                        onUpdateTotalHoursOverrides({ ...totalHoursOverrides, longTermCaseHours: num });
                      }
                    }
                  }
                  setIsEditHoursModalOpen(false);
                }}
                className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-2xs"
              >
                保存时数
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
