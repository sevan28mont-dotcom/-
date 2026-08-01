import React, { useState } from 'react';
import { CaseCategory, CaseRecord, SessionData, ResourceLink, Supervisor, ThinkingNote } from '../types';
import { Plus, Minus, Pencil, Trash2, Calendar as CalendarIcon, CheckCircle, Clock, FileText, X, Search, Link as LinkIcon, Lightbulb, Mic, Eye, Download, Printer, Sparkles, Pin, PinOff, BarChart2 } from 'lucide-react';
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
  records: CaseRecord[];
  mentors?: Supervisor[];
  thinkingNotes?: ThinkingNote[];
  onAddCase: (newCase: Omit<CaseRecord, 'id' | 'sessions'>) => void;
  onDeleteCase: (id: string) => void;
  onUpdateSessionNote: (caseId: string, sessionNum: number, sessionData: SessionData) => void;
  onUpdateCaseTotalSessions?: (caseId: string, newTotalSessions: number) => void;
  onSaveToThinkingNotes?: (note: ThinkingNote) => void;
  onTogglePinCase?: (id: string) => void;
}

export const CaseManagement: React.FC<CaseManagementProps> = ({
  category,
  records,
  mentors = [],
  thinkingNotes = [],
  onAddCase,
  onDeleteCase,
  onUpdateSessionNote,
  onUpdateCaseTotalSessions,
  onSaveToThinkingNotes,
  onTogglePinCase,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [summaryModalCase, setSummaryModalCase] = useState<CaseRecord | null>(null);
  const [showChartsCaseId, setShowChartsCaseId] = useState<string | null>(null);

  const categoryRecords = records.filter((r) => r.category === category);

  const filteredRecords = categoryRecords.filter((item) => {
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
  const [totalSessions, setTotalSessions] = useState<number>(30);

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
  const [editingTotalValue, setEditingTotalValue] = useState<number>(30);

  const titleText = category === 'longTerm' ? '长程案例记录' : '短程案例记录';

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('请输入来访者名称或代号！');
      return;
    }

    onAddCase({
      category,
      avatar,
      caseNum: caseNum.trim() || `C${Math.floor(Math.random() * 900 + 100)}`,
      name: name.trim(),
      startDate: startDate || new Date().toISOString().split('T')[0],
      status,
      endDate: status === 'ended' ? endDate : undefined,
      totalSessions: Number(totalSessions) || 20,
    });

    setName('');
    setCaseNum('');
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

  return (
    <div className="space-y-6">
      <div className="border-b border-rose-200 dark:border-slate-800 pb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-slate-100 border-l-4 border-rose-400 pl-3 flex items-center gap-2">
          <span>{category === 'longTerm' ? '📂' : '📁'}</span>
          <span>{titleText}</span>
        </h2>
        <span className="text-xs font-semibold px-3 py-1 bg-rose-100 dark:bg-slate-800 text-rose-800 dark:text-rose-300 rounded-full border border-rose-200 dark:border-slate-700">
          共 {filteredRecords.length} 个档案
        </span>
      </div>

      {/* 新建个案卡片 */}
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-colors duration-300">
        <h3 className="text-sm font-bold text-zinc-800 dark:text-slate-100 mb-4 flex items-center gap-2 border-b border-rose-100 dark:border-slate-800 pb-2">
          <Plus className="w-4 h-4 text-rose-500" />
          <span>动态新增个案档案</span>
        </h3>
        <form onSubmit={handleCreateCase} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-slate-300 mb-1">头像与类型</label>
            <select
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
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

          <div>
            <label className="block text-xs font-semibold text-zinc-600 dark:text-slate-300 mb-1">状态</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'ended')}
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
            >
              <option value="active">正在进行中</option>
              <option value="ended">已终止/结案</option>
            </select>
          </div>

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
              max={100}
              value={totalSessions}
              onChange={(e) => setTotalSessions(Number(e.target.value))}
              className="w-full text-xs p-2.5 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>
        </form>
      </div>

      {/* 搜索过滤栏 */}
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors duration-300">
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

        <div className="text-xs text-zinc-500 font-medium">
          {searchQuery ? (
            <span>检索结果: <strong className="text-rose-600 font-bold">{filteredRecords.length}</strong> / {categoryRecords.length} 项</span>
          ) : (
            <span>当前包含 <strong className="text-zinc-800 font-bold">{categoryRecords.length}</strong> 个档案</span>
          )}
        </div>
      </div>

      {/* 个案档案列表 */}
      <div className="space-y-4">
        {sortedRecords.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-8 text-center text-zinc-500 dark:text-slate-400 text-xs space-y-3">
            <p>暂无此分类下的个案档案。请在上方表单输入代号/名称直接“新建个案”。</p>
          </div>
        ) : (
          sortedRecords.map((item) => {
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

            return (
              <div
                key={item.id}
                className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-xs transition ${
                  item.pinned
                    ? 'border-amber-300 dark:border-amber-700/80 ring-2 ring-amber-400/20 bg-amber-50/20 dark:bg-slate-900/90'
                    : 'border-rose-200 dark:border-slate-800 hover:border-rose-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-rose-100 dark:border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-3">
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
                        <span className="font-bold text-zinc-800 dark:text-slate-100 text-base">
                          {item.caseNum} {item.name}
                        </span>
                        {item.status === 'active' ? (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-md border border-emerald-200 dark:border-emerald-800">
                            进行中
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 rounded-md border border-rose-200 dark:border-rose-800">
                            已结案 ({item.endDate || '未设'})
                          </span>
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
                              max={200}
                              value={editingTotalValue}
                              onChange={(e) => setEditingTotalValue(Number(e.target.value))}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  if (editingTotalValue > 0) {
                                    onUpdateCaseTotalSessions?.(item.id, editingTotalValue);
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
                                if (editingTotalValue > 0) {
                                  onUpdateCaseTotalSessions?.(item.id, editingTotalValue);
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
                              onClick={() => onUpdateCaseTotalSessions?.(item.id, Math.max(1, item.totalSessions - 1))}
                              disabled={item.totalSessions <= 1}
                              className="p-1 bg-white dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-slate-600 disabled:opacity-40 text-rose-800 dark:text-slate-200 border border-rose-200 dark:border-slate-600 rounded-lg transition cursor-pointer font-bold"
                              title="减少 1 次个案管理次数"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTotalCaseId(item.id);
                                setEditingTotalValue(item.totalSessions);
                              }}
                              className="font-bold text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-slate-700 px-2 py-0.5 rounded-lg border border-transparent hover:border-rose-200 transition text-xs cursor-pointer"
                              title="点击直接精确输入修改管理次数"
                            >
                              {item.totalSessions}次
                            </button>
                            <button
                              type="button"
                              onClick={() => onUpdateCaseTotalSessions?.(item.id, item.totalSessions + 1)}
                              className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-slate-600 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-slate-600 rounded-lg transition cursor-pointer font-bold flex items-center gap-0.5 text-xs"
                              title="增加 1 次个案管理次数"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+1次</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTotalCaseId(item.id);
                                setEditingTotalValue(item.totalSessions);
                              }}
                              className="px-2 py-1 bg-white dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-slate-600 text-zinc-700 dark:text-slate-200 border border-rose-200 dark:border-slate-600 rounded-lg transition cursor-pointer text-[11px] font-bold flex items-center gap-1"
                              title="直接输入精确修改管理次数"
                            >
                              <Pencil className="w-3 h-3 text-rose-500" />
                              <span>直接修改</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* 重要个案置顶按钮 */}
                    <button
                      type="button"
                      onClick={() => onTogglePinCase?.(item.id)}
                      className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer active:scale-95 ${
                        item.pinned
                          ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-slate-700 text-zinc-700 dark:text-slate-300 border-zinc-200 dark:border-slate-700'
                      }`}
                      title={item.pinned ? '取消重要个案置顶' : '设为重要个案并置顶显示'}
                    >
                      {item.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5 text-amber-500" />}
                      <span>{item.pinned ? '取消置顶' : '置顶'}</span>
                    </button>

                    {/* 可视化图表展开按钮 */}
                    <button
                      type="button"
                      onClick={() => setShowChartsCaseId(showChartsCaseId === item.id ? null : item.id)}
                      className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition cursor-pointer shadow-2xs active:scale-95 ${
                        showChartsCaseId === item.id
                          ? 'bg-rose-600 text-white border-rose-700'
                          : 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-slate-700 hover:bg-rose-50'
                      }`}
                      title="查看基于 Recharts 的咨询节次进展与时长趋势图表"
                    >
                      <BarChart2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>{showChartsCaseId === item.id ? '收起图表' : '进度图表'}</span>
                    </button>

                    {/* Gemini AI 摘要生成 */}
                    <button
                      type="button"
                      onClick={() => setSummaryModalCase(item)}
                      className="flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-lg transition cursor-pointer shadow-2xs active:scale-95"
                      title="利用 Gemini AI 总结个案进度、核心移情与阻抗并生成临床建议"
                    >
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      <span>AI摘要生成</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setExportingPdfCase(item)}
                      className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 text-rose-700 dark:text-rose-300 hover:text-white bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-600 border border-rose-200 dark:border-rose-800 rounded-lg transition cursor-pointer shadow-2xs"
                      title="将当前个案的所有会谈记录、关联督导与思考笔记汇总导出为 PDF 卷宗"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>导出PDF</span>
                    </button>

                    <button
                      onClick={() => onDeleteCase(item.id)}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1.5 text-zinc-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-zinc-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-zinc-200 dark:border-slate-700 rounded-lg transition cursor-pointer"
                      title="删除个案记录"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 咨询节次可视化进展分析图表 (D3 / Recharts) */}
                {showChartsCaseId === item.id && (
                  <div className="mb-4">
                    <CaseProgressCharts record={item} />
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
                      <span className="text-zinc-600 dark:text-slate-300 font-medium">
                        已记录 <strong className="text-rose-600 dark:text-rose-400 font-bold">{recordedCount}</strong> 次 / 预设总数 <strong>{item.totalSessions}</strong> 次
                        {completedCount > 0 && (
                          <span className="text-[11px] text-zinc-500 dark:text-slate-400 ml-1.5">
                            (已完结: {completedCount} 次)
                          </span>
                        )}
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

                {/* 次数网格 */}
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-2">
                  {Array.from({ length: item.totalSessions }, (_, idx) => {
                    const sessionNum = idx + 1;
                    const sessionData = item.sessions[sessionNum] || { completed: false, note: '' };

                    const hasNote = Boolean(sessionData.note && sessionData.note.trim());
                    const hasTranscript = Boolean(sessionData.transcript && sessionData.transcript.trim());
                    const hasIdeas = Boolean(sessionData.ideas && sessionData.ideas.length > 0);
                    const resources = sessionData.resources || [];
                    const hasResources = resources.length > 0;

                    return (
                      <div key={sessionNum} className="relative group">
                        <button
                          type="button"
                          onClick={() => openSessionModal(item, sessionNum)}
                          className={`w-full min-h-12 border rounded-xl flex flex-col items-center justify-center p-1 text-xs transition cursor-pointer relative ${
                            sessionData.completed
                              ? 'bg-rose-400 dark:bg-rose-600 border-rose-500 dark:border-rose-500 text-white font-bold shadow-2xs'
                              : 'bg-white dark:bg-slate-800 border-rose-200 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-slate-700 text-zinc-700 dark:text-slate-200'
                          }`}
                        >
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
                        {hasResources && (
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
                    );
                  })}
                </div>
              </div>
            );
          })
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
    </div>
  );
};
