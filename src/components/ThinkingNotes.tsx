import React, { useState, useRef } from 'react';
import { ThinkingNote } from '../types';
import { Plus, Trash2, Pencil, Brain, Sparkles, Tag, Search, X, CheckCircle2, RefreshCw, HardDrive, Maximize2, Minimize2, Save, Type } from 'lucide-react';
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

  // 编辑现有笔记状态
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  // 全屏沉浸撰写与自动保存指示
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  });
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

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
              buttonText="语音口述反思"
              onTranscript={(text) => handleContentChange(content ? content + ' ' + text : text)}
            />
          </div>
        </div>

        <form onSubmit={handleSaveNoteSubmit} className={isFullscreen ? "flex-1 flex flex-col space-y-3 mt-2 min-h-0" : "space-y-3"}>
          <div>
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

          {/* 表情快捷插入栏 */}
          <div className="flex flex-wrap items-center gap-2 bg-rose-50/50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-rose-100 dark:border-slate-700 text-xs shrink-0">
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
                    onClick={() => handleStartEdit(note)}
                    className="p-1.5 text-zinc-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer flex items-center gap-1 text-xs font-semibold"
                    title="编辑修改此反思笔记"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>编辑</span>
                  </button>

                  <button
                    onClick={() => onDeleteNote(note.id)}
                    className="p-1.5 text-zinc-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                    title="删除此笔记"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-zinc-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed font-kaiti">
                {note.content}
              </div>

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

