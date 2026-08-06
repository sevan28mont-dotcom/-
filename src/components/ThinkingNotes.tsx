import React, { useState, useRef } from 'react';
import { ThinkingNote } from '../types';
import { Plus, Trash2, Pencil, Brain, Sparkles, Tag, Search, X, CheckCircle2, RefreshCw, HardDrive, Maximize2, Minimize2, Save, Type, Copy, Wand2, ListOrdered, Loader2, Bot } from 'lucide-react';
import { VoiceInputButton } from './VoiceInputButton';
import { FontSelectorToggle, FontOption, FONT_LIST } from './FontSelectorToggle';

interface ThinkingNotesProps {
  notes: ThinkingNote[];
  onAddNote: (newNote: Omit<ThinkingNote, 'id'>) => void;
  onUpdateNote?: (updatedNote: ThinkingNote) => void;
  onDeleteNote: (id: string) => void;
}

export const ThinkingNotes: React.FC<ThinkingNotesProps> = ({ notes, onAddNote, onUpdateNote, onDeleteNote }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('反思, 督导心得');
  const [searchQuery, setSearchQuery] = useState('');
  const [editorFont, setEditorFont] = useState<FontOption>('kaiti'); // 默认华文楷体
  const activeFontObj = FONT_LIST.find((f) => f.id === editorFont) || FONT_LIST[0];

  // AI 智能自然语言处理状态
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState<string | null>(null);
  const [aiSummaryResult, setAiSummaryResult] = useState<string | null>(null);
  const [savedNoteSummariesMap, setSavedNoteSummariesMap] = useState<Record<string, { summary?: string; loading?: boolean }>>({});

  // 编辑现有笔记状态
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const deleteLockRef = useRef<Record<string, number>>({});

  const handleDebouncedDeleteNote = (id: string) => {
    const now = Date.now();
    if (deleteLockRef.current[id] && now - deleteLockRef.current[id] < 500) {
      return;
    }
    deleteLockRef.current[id] = now;
    if (editingNoteId === id) {
      setEditingNoteId(null);
      setTitle('');
      setContent('');
      setTagInput('反思, 督导心得');
    }
    onDeleteNote(id);
  };

  // 全屏沉浸撰写与自动保存指示
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  });
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // AI 功能 1: 微信大模型智能分点提炼 (1. 2. 3.)
  const handleAiRefineWeChat = async () => {
    if (!content.trim()) {
      alert('请先输入或口述笔记正文内容，再进行微信大模型智能分点！');
      return;
    }
    setIsAiProcessing(true);
    setAiStatusMessage('🤖 Gemini AI 正在对笔记进行微信式智能分点提炼与口语剔除...');
    try {
      const res = await fetch('/api/refine-speech-wechat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.structuredText) {
          handleContentChange(data.structuredText);
          setAiStatusMessage('✅ 已完成微信式智能分点重写！');
        }
      }
    } catch (e) {
      console.error(e);
      setAiStatusMessage('❌ 智能分点失败，请稍后重试');
    } finally {
      setIsAiProcessing(false);
      setTimeout(() => setAiStatusMessage(null), 3000);
    }
  };

  // AI 功能 2: 临床专业表达润色 & 术语纠错
  const handleAiPolish = async () => {
    if (!content.trim()) {
      alert('请先输入或口述笔记正文内容，再进行专业表达润色！');
      return;
    }
    setIsAiProcessing(true);
    setAiStatusMessage('✨ Gemini Pro 正在规范临床心理学术语并润色表达...');
    try {
      const res = await fetch('/api/refine-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: content }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.refinedText) {
          handleContentChange(data.refinedText);
          setAiStatusMessage('✅ 临床表达润色与术语纠错已完成！');
        }
      }
    } catch (e) {
      console.error(e);
      setAiStatusMessage('❌ 润色失败，请稍后重试');
    } finally {
      setIsAiProcessing(false);
      setTimeout(() => setAiStatusMessage(null), 3000);
    }
  };

  // AI 功能 3: 提炼 Gemini 反思摘要与心理动力觉察
  const handleAiSummarize = async () => {
    if (!content.trim()) {
      alert('请先输入或口述笔记正文，再提炼 Gemini 结构化反思摘要！');
      return;
    }
    setIsAiProcessing(true);
    setAiStatusMessage('💡 Gemini Pro AI 正在生成反思摘要与心理动力学提炼...');
    try {
      const res = await fetch('/api/gemini/summarize-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.summary) {
          setAiSummaryResult(data.summary);
          setAiStatusMessage('✅ Gemini 反思摘要已提炼生成！');
        }
      }
    } catch (e) {
      console.error(e);
      setAiStatusMessage('❌ 提炼摘要失败');
    } finally {
      setIsAiProcessing(false);
      setTimeout(() => setAiStatusMessage(null), 3000);
    }
  };

  // 针对列表中的已存笔记生成 Gemini 摘要
  const handleSummarizeSavedNote = async (note: ThinkingNote) => {
    const existing = savedNoteSummariesMap[note.id];
    if (existing?.summary) {
      // Toggle display off if already generated
      setSavedNoteSummariesMap((prev) => ({
        ...prev,
        [note.id]: { ...prev[note.id], summary: undefined },
      }));
      return;
    }

    setSavedNoteSummariesMap((prev) => ({
      ...prev,
      [note.id]: { loading: true },
    }));

    try {
      const res = await fetch('/api/gemini/summarize-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: note.title, content: note.content }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedNoteSummariesMap((prev) => ({
          ...prev,
          [note.id]: { summary: data.summary, loading: false },
        }));
      }
    } catch (e) {
      console.error(e);
      setSavedNoteSummariesMap((prev) => ({
        ...prev,
        [note.id]: { loading: false },
      }));
    }
  };

  const notifyTextChange = () => {
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saved');
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 500);
  };

  const handleManualSave = () => {
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saved');
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 300);
  };

  // 快捷键 Ctrl+S / Cmd+S 保存与 ESC 退出全屏监听
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        handleManualSave();
      }
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    notifyTextChange();
  };

  const handleContentChange = (val: string) => {
    setContent(val);
    notifyTextChange();
  };

  const filteredNotes = notes.filter((note) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      note.title.toLowerCase().includes(q) ||
      note.content.toLowerCase().includes(q) ||
      (note.tags && note.tags.some((tag) => tag.toLowerCase().includes(q))) ||
      (note.time && note.time.toLowerCase().includes(q))
    );
  });

  const handleStartEdit = (note: ThinkingNote) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setContent(note.content);
    setTagInput(note.tags ? note.tags.join(', ') : '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setTitle('');
    setContent('');
    setTagInput('反思, 督导心得');
  };

  const handleSaveNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('请填写完整的标题和笔记内容！');
      return;
    }

    const now = new Date();
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    const tags = tagInput
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingNoteId) {
      onUpdateNote?.({
        id: editingNoteId,
        title: title.trim(),
        content: content.trim(),
        time: `${formatter.format(now)} (已编辑)`,
        tags,
      });
      setEditingNoteId(null);
    } else {
      onAddNote({
        title: title.trim(),
        content: content.trim(),
        time: formatter.format(now),
        tags,
      });
    }

    setTitle('');
    setContent('');
    setTagInput('反思, 督导心得');
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => (prev ? prev + ' ' + emoji : emoji));
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-rose-200 dark:border-slate-800 pb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-800 dark:text-slate-100 border-l-4 border-rose-400 pl-3 flex items-center gap-2">
          <span>💡</span>
          <span>随笔与反思笔记</span>
        </h2>
        <span className="text-xs font-semibold px-3 py-1 bg-rose-100 dark:bg-slate-800 text-rose-800 dark:text-rose-300 rounded-full border border-rose-200 dark:border-slate-700">
          共 {notes.length} 条反思记录
        </span>
      </div>

      {/* 新建随笔笔记 */}
      <div
        className={
          isFullscreen
            ? 'fixed inset-0 z-[9999] bg-white dark:bg-slate-900 p-6 flex flex-col h-screen w-screen overflow-y-auto shadow-2xl transition-all duration-300'
            : 'bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 transition-colors duration-300'
        }
      >
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-rose-100 dark:border-slate-800 pb-2.5">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-slate-100 flex items-center gap-2">
            <Brain className="w-4 h-4 text-rose-500" />
            <span>{editingNoteId ? '编辑反思随笔记录' : isFullscreen ? '沉浸式全屏反思笔记撰写' : '撰写新的反思笔记'}</span>
            {editingNoteId && (
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                修改模式
              </span>
            )}
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* 字体切换 */}
            <FontSelectorToggle currentFont={editorFont} onChangeFont={(f) => setEditorFont(f)} />

            {/* Ctrl+S 快捷保存 */}
            <button
              type="button"
              onClick={handleManualSave}
              className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 border border-rose-200 dark:border-slate-700 rounded-lg text-zinc-700 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-2xs"
              title="快捷键: Ctrl + S 手动保存"
            >
              <Save className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Ctrl+S</span>
            </button>

            {/* 全屏模式切换按钮 */}
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="flex items-center gap-1 px-2.5 py-1 bg-rose-500 hover:bg-rose-600 dark:bg-rose-700 dark:hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-2xs"
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span>{isFullscreen ? '退出全屏' : '全屏'}</span>
            </button>

            <VoiceInputButton
              buttonText="🎙️ 语音口述反思"
              onTranscript={(text) => handleContentChange(content ? content + ' ' + text : text)}
            />
          </div>
        </div>

        <form onSubmit={handleSaveNoteSubmit} className={isFullscreen ? "flex-1 flex flex-col space-y-3 mt-2 min-h-0" : "space-y-3"}>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <input
                type="text"
                placeholder="请输入主题/标题 (例: 关于精神分析中的反移情觉察)..."
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                required
                className={`w-full text-xs font-bold p-3 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white dark:bg-slate-800 ${
                  editorFont === 'kaiti' ? 'font-kaiti text-sm' : editorFont === 'song' ? 'font-song' : ''
                }`}
              />
            </div>
            <VoiceInputButton
              buttonText="🎤 语音标题"
              onTranscript={(text) => handleTitleChange(text.replace(/[。！？]$/, ''))}
            />
          </div>

          {/* 表情与语音快捷标记栏 */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-rose-50/50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-rose-100 dark:border-slate-700 text-xs shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-rose-900 dark:text-rose-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-rose-500" /> 快捷标记:
              </span>
              {['💡 思考', '🧠 联想', '⚠️ 觉察', '❤️ 共情', '🔍 动力学', '🌱 成长'].map((item) => {
                const [emoji, label] = item.split(' ');
                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      insertEmoji(emoji);
                      notifyTextChange();
                    }}
                    className="px-2.5 py-1 bg-white dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-slate-600 border border-rose-200 dark:border-slate-600 rounded-lg text-zinc-700 dark:text-slate-200 font-medium transition cursor-pointer text-xs"
                  >
                    {emoji} {label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-rose-700 dark:text-rose-400 font-bold hidden sm:inline">
                🎙️ 浏览器 Microphone API 录音速记
              </span>
              <VoiceInputButton
                buttonText="🎙️ 追加口述正文"
                onTranscript={(text) => handleContentChange(content ? content + '\n' + text : text)}
              />
            </div>
          </div>

          {/* Gemini Pro AI 智能助手自然语言理解工具栏 */}
          <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-rose-50/90 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800/80 p-3 rounded-2xl border border-indigo-200/80 dark:border-slate-700 space-y-2 shrink-0 shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <span className="font-bold text-xs text-indigo-950 dark:text-indigo-200 flex items-center gap-1">
                  Gemini Pro API 自然语言处理
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-950 px-1.5 py-0.5 rounded-md border border-indigo-200 dark:border-indigo-800">
                    微信语音大模型级
                  </span>
                </span>
              </div>

              {aiStatusMessage && (
                <div className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 bg-white/80 dark:bg-slate-900/80 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-lg flex items-center gap-1.5 animate-fadeIn">
                  {isAiProcessing && <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />}
                  <span>{aiStatusMessage}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {/* 微信智能分点 */}
              <button
                type="button"
                onClick={handleAiRefineWeChat}
                disabled={isAiProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-indigo-100/80 dark:hover:bg-slate-600 border border-indigo-200 dark:border-slate-600 text-indigo-900 dark:text-indigo-200 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs disabled:opacity-50"
                title="类似微信语音输入后的自动智能分点 (1. 2. 3.) 并剔除口语语气词"
              >
                <ListOrdered className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>微信语音智能分点</span>
              </button>

              {/* 临床专业润色 */}
              <button
                type="button"
                onClick={handleAiPolish}
                disabled={isAiProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-purple-100/80 dark:hover:bg-slate-600 border border-purple-200 dark:border-slate-600 text-purple-900 dark:text-purple-200 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs disabled:opacity-50"
                title="校正心理咨询专业术语 (反移情/阻抗/共情等) 与优化标点语序"
              >
                <Wand2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>专业表达润色 & 术语纠错</span>
              </button>

              {/* 生成结构化摘要 */}
              <button
                type="button"
                onClick={handleAiSummarize}
                disabled={isAiProcessing}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95 shadow-2xs disabled:opacity-50"
                title="提炼 4 维心理学结构化反思摘要 (核心概括, 心理动力觉察, 编号条目, 督导建议)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                <span>Gemini 提炼反思摘要</span>
              </button>
            </div>
          </div>

          {/* Gemini AI 提炼摘要结果卡片 */}
          {aiSummaryResult && (
            <div className="p-4 bg-gradient-to-br from-indigo-50/90 to-purple-50/90 dark:from-slate-800/95 dark:to-indigo-950/90 border border-indigo-300 dark:border-indigo-800 rounded-2xl shadow-sm space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-indigo-200/80 dark:border-indigo-800/80 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-bounce" />
                  <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    Gemini Pro 智能摘要与心理动力觉察
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiSummaryResult(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 p-1 rounded-lg cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs sm:text-sm text-zinc-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed font-sans">
                {aiSummaryResult}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-indigo-200/80 dark:border-indigo-900/80">
                <button
                  type="button"
                  onClick={() => {
                    handleContentChange(content ? `${content}\n\n${aiSummaryResult}` : aiSummaryResult);
                    setAiSummaryResult(null);
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>追加到笔记正文末尾</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleContentChange(aiSummaryResult);
                    setAiSummaryResult(null);
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-slate-600 text-indigo-950 dark:text-indigo-200 border border-indigo-300 dark:border-slate-600 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                  <span>替换为结构化摘要</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(aiSummaryResult);
                    alert('摘要内容已成功复制到剪贴板！');
                  }}
                  className="px-3 py-1.5 bg-white dark:bg-slate-700 hover:bg-zinc-100 dark:hover:bg-slate-600 text-zinc-700 dark:text-slate-200 border border-zinc-300 dark:border-slate-600 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>复制摘要</span>
                </button>
              </div>
            </div>
          )}

          <div className={isFullscreen ? "flex-1 flex flex-col min-h-0" : ""}>
            <textarea
              rows={isFullscreen ? 12 : 5}
              placeholder="在此记录您的临床感悟、案例反思或专业自由联想（支持多种常用字体切换与语音口述）..."
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              required
              style={{ fontFamily: activeFontObj.family }}
              className={`w-full p-3 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400 bg-white dark:bg-slate-800 leading-relaxed text-sm sm:text-base ${
                isFullscreen ? 'flex-1 overflow-y-auto' : ''
              }`}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-2 text-xs flex-1 max-w-sm">
              <Tag className="w-3.5 h-3.5 text-rose-400 shrink-0" />
              <input
                type="text"
                placeholder="标签 (以逗号分隔, 如: 依恋, 督导心得)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full p-2.5 border border-rose-200 dark:border-slate-700 rounded-xl text-xs text-zinc-800 dark:text-slate-100 bg-white dark:bg-slate-800"
              />
            </div>

            <div className="flex items-center gap-2">
              {editingNoteId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  取消修改
                </button>
              )}
              <button
                type="submit"
                className="px-5 py-2.5 bg-zinc-800 dark:bg-rose-600 hover:bg-zinc-700 dark:hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                {editingNoteId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{editingNoteId ? '更新修改反思笔记' : '保存思考笔记'}</span>
              </button>
            </div>
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
              placeholder="搜索思考主题、反思内容、标签或记录时间..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-8 py-2 bg-rose-50/30 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 placeholder-zinc-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-300 p-0.5 rounded-full cursor-pointer"
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
            <span>已筛选出 <strong className="text-rose-600 dark:text-rose-400 font-bold">{filteredNotes.length}</strong> 条关联笔记</span>
          ) : (
            <span>共 <strong className="text-zinc-700 dark:text-slate-300 font-bold">{notes.length}</strong> 条反思记录</span>
          )}
        </div>
      </div>

      {/* 笔记列表 */}
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-8 text-center text-zinc-500 dark:text-slate-400 text-xs">
            {searchQuery ? `未找到包含 "${searchQuery}" 的反思笔记` : '暂无随笔或反思笔记，请在上方撰写第一条笔记。'}
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div key={note.id} className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3 transition-colors duration-300">
              <div className="flex items-start justify-between border-b border-rose-100 dark:border-slate-800 pb-2">
                <div>
                  <h3 className="font-bold text-zinc-800 dark:text-slate-100 text-base flex items-center gap-2">
                    <span>💡</span>
                    <span>{note.title}</span>
                  </h3>
                  <div className="text-[11px] text-zinc-400 dark:text-slate-500 mt-0.5">记录时间: YYYY-MM-DD ({note.time})</div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSummarizeSavedNote(note)}
                    disabled={savedNoteSummariesMap[note.id]?.loading}
                    className="px-2 py-1 bg-indigo-50 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-slate-700 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-bold shadow-2xs"
                    title="使用 Gemini Pro 提炼本条笔记的结构化反思与心理动力要点"
                  >
                    {savedNoteSummariesMap[note.id]?.loading ? (
                      <Loader2 className="w-3.5 h-3.5 text-indigo-600 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    )}
                    <span>{savedNoteSummariesMap[note.id]?.summary ? '收起 AI 摘要' : '✨ Gemini 提炼'}</span>
                  </button>

                  <button
                    onClick={() => handleStartEdit(note)}
                    className="p-1.5 text-zinc-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="编辑修改此反思笔记"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>编辑</span>
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDebouncedDeleteNote(note.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="p-1.5 text-rose-600 dark:text-rose-400 hover:text-white bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg transition cursor-pointer select-none touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center active:scale-95 shadow-2xs"
                    title="删除此笔记"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-zinc-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-kaiti">
                {note.content}
              </div>

              {/* Gemini AI 提炼摘要展示 */}
              {savedNoteSummariesMap[note.id]?.summary && (
                <div className="p-3.5 bg-indigo-50/80 dark:bg-slate-800/90 border border-indigo-200 dark:border-indigo-800/80 rounded-xl space-y-2 text-xs text-zinc-800 dark:text-slate-100 animate-fadeIn">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 dark:text-indigo-300 border-b border-indigo-200/60 dark:border-indigo-800/60 pb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                    <span>Gemini Pro AI 提炼总结</span>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed font-sans">
                    {savedNoteSummariesMap[note.id].summary}
                  </div>
                </div>
              )}

              {note.tags && note.tags.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-rose-50 dark:border-slate-800">
                  {note.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-semibold px-2.5 py-0.5 bg-rose-50 dark:bg-slate-800 text-rose-800 dark:text-rose-300 rounded-md border border-rose-200 dark:border-slate-700"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

