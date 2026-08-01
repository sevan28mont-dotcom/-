import React, { useState, useEffect } from 'react';
import { CaseRecord, Supervisor, ThinkingNote } from '../types';
import { Sparkles, Bot, RefreshCw, Copy, Check, FileText, X, AlertCircle, BookmarkPlus, Brain, ArrowRight } from 'lucide-react';

interface AiCaseSummaryModalProps {
  caseRecord: CaseRecord;
  mentors?: Supervisor[];
  onClose: () => void;
  onSaveToThinkingNotes?: (note: ThinkingNote) => void;
}

export type AiProvider = 'gemini' | 'deepseek' | 'doubao' | 'kimi';

export const AI_MODELS: { id: AiProvider; name: string; tag: string; icon: string; desc: string }[] = [
  { id: 'gemini', name: 'Gemini 2.5', tag: '精神分析引擎', icon: '✨', desc: '精神分析全景分析与督导' },
  { id: 'deepseek', name: 'DeepSeek-R1', tag: '精神分析引擎', icon: '🤖', desc: '深度逻辑推理与动力学解析' },
  { id: 'doubao', name: '豆包 Doubao', tag: '精神分析引擎', icon: '🍃', desc: '细腻倾听与精神分析研析' },
  { id: 'kimi', name: 'Kimi Moonshot', tag: '精神分析引擎', icon: '🌙', desc: '长文本会谈逐字稿精神分析' },
];

export const AiCaseSummaryModal: React.FC<AiCaseSummaryModalProps> = ({
  caseRecord,
  mentors = [],
  onClose,
  onSaveToThinkingNotes,
}) => {
  const [loading, setLoading] = useState(false);
  const [summaryText, setSummaryText] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('gemini');
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [savedToNotes, setSavedToNotes] = useState(false);
  const [customFocus, setCustomFocus] = useState('');
  const [showCustomPrompt, setShowCustomPrompt] = useState(false);

  // Compute stats for prompt context
  const recordedSessionsCount = Object.keys(caseRecord.sessions || {}).length;
  const completedSessionsCount = Object.values(caseRecord.sessions || {}).filter((s: any) => s.completed).length;

  const handleGenerateSummary = async (provider: AiProvider = selectedProvider, focusRequirement?: string) => {
    setLoading(true);
    setErrorMsg('');
    setSavedToNotes(false);
    setSelectedProvider(provider);

    try {
      const response = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          caseRecord,
          aiProvider: provider,
          focusRequirement: focusRequirement || customFocus,
        }),
      });

      const data = await response.json();
      if (data.summary) {
        setSummaryText(data.summary);
      } else if (data.error) {
        setErrorMsg(data.error);
      } else {
        setErrorMsg('摘要生成异常，请重试');
      }
    } catch (err) {
      console.error('Failed to generate summary:', err);
      setErrorMsg('网络连接异常，未能调用 AI 摘要分析服务');
    } finally {
      setLoading(false);
    }
  };

  // Auto generate on open
  useEffect(() => {
    handleGenerateSummary('gemini');
  }, [caseRecord.id]);

  const handleCopy = () => {
    if (!summaryText) return;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSaveToNotes = () => {
    if (!summaryText || !onSaveToThinkingNotes) return;

    const newNote: ThinkingNote = {
      id: `t_ai_${Date.now()}`,
      title: `【AI摘要】${caseRecord.caseNum} ${caseRecord.name} 阶段性临床小结`,
      content: summaryText,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    };

    onSaveToThinkingNotes(newNote);
    setSavedToNotes(true);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 max-w-2xl w-full shadow-2xl max-h-[92vh] flex flex-col transition-colors duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-3.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-2xl shadow-xs">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-base sm:text-lg flex items-center gap-2">
                <span>精神分析取向 AI 分析师督导报告</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                  {AI_MODELS.find(m => m.id === selectedProvider)?.name}
                </span>
              </h3>
              <p className="text-xs text-zinc-500 dark:text-slate-400">
                来访者: {caseRecord.avatar} {caseRecord.caseNum} {caseRecord.name} ({caseRecord.category === 'longTerm' ? '长程个案' : '短程个案'} · 已录 {recordedSessionsCount}/{caseRecord.totalSessions} 次)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-slate-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 多 AI 引擎切换选项卡 */}
        <div className="mb-3">
          <div className="text-[11px] font-bold text-zinc-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
            <span>切换心理督导分析 AI 大模型:</span>
            <span className="text-rose-600 dark:text-rose-400 font-mono">当前: {AI_MODELS.find(m => m.id === selectedProvider)?.name}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-rose-50/80 dark:bg-slate-800 rounded-2xl border border-rose-100 dark:border-slate-700">
            {AI_MODELS.map((m) => {
              const active = selectedProvider === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleGenerateSummary(m.id)}
                  disabled={loading}
                  className={`p-2 rounded-xl text-left transition cursor-pointer flex flex-col justify-between ${
                    active
                      ? 'bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-700 shadow-xs ring-1 ring-rose-400/30'
                      : 'hover:bg-white/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold text-zinc-800 dark:text-slate-100">
                    <span>{m.icon} {m.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${active ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold' : 'bg-slate-200/60 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {m.tag}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-slate-400 mt-1 line-clamp-1">{m.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Prompt Toggle Header */}
        <div className="mb-3 flex items-center justify-between bg-rose-50/60 dark:bg-slate-800/80 p-2.5 rounded-2xl border border-rose-100 dark:border-slate-700/80 text-xs">
          <span className="font-bold text-zinc-700 dark:text-slate-200 flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-rose-500" />
            <span>AI 分析范围: 已分析 {recordedSessionsCount} 次会谈笔记、逐字稿与随记</span>
          </span>
          <button
            type="button"
            onClick={() => setShowCustomPrompt(!showCustomPrompt)}
            className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>{showCustomPrompt ? '收起自定义侧重点' : '⚙️ 自定义分析侧重点'}</span>
          </button>
        </div>

        {/* Custom Prompt Input */}
        {showCustomPrompt && (
          <div className="mb-3 p-3 bg-zinc-50 dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-slate-700 space-y-2 animate-fadeIn">
            <label className="block text-xs font-bold text-zinc-700 dark:text-slate-200">
              指定分析指令或具体学派方向（例如：请用克莱因方向、请用拉康方向等）:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customFocus}
                onChange={(e) => setCustomFocus(e.target.value)}
                placeholder="例如：请用克莱因方向，关注投射性认同与分裂位置；或：请用拉康方向..."
                className="flex-1 text-xs p-2.5 bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
              <button
                type="button"
                onClick={() => handleGenerateSummary(customFocus)}
                disabled={loading}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shrink-0 disabled:opacity-50"
              >
                重新分析
              </button>
            </div>
          </div>
        )}

        {/* Summary Content Display Box */}
        <div className="flex-1 overflow-y-auto p-4 bg-zinc-50/80 dark:bg-slate-950/70 border border-rose-100 dark:border-slate-800 rounded-2xl space-y-3 font-sans transition-colors">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-rose-500 animate-spin" />
              <div>
                <p className="text-sm font-bold text-zinc-800 dark:text-slate-200">
                  {AI_MODELS.find(m => m.id === selectedProvider)?.name} 正在深度研读个案会谈记录与逐字稿...
                </p>
                <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1">正在提炼移情、阻抗、核心主题与下阶段督导建议</p>
              </div>
            </div>
          ) : errorMsg ? (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <span>分析异常</span>
              </div>
              <p>{errorMsg}</p>
              <button
                type="button"
                onClick={() => handleGenerateSummary()}
                className="mt-2 px-3 py-1.5 bg-rose-600 text-white font-bold rounded-xl text-xs hover:bg-rose-700 cursor-pointer"
              >
                重试生成
              </button>
            </div>
          ) : (
            <div className="prose dark:prose-invert max-w-none text-xs sm:text-sm text-zinc-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
              {summaryText}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-rose-100 dark:border-slate-800 mt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleGenerateSummary()}
              disabled={loading}
              className="px-3 py-2 bg-rose-50 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-slate-700 text-rose-700 dark:text-rose-300 font-bold text-xs rounded-xl border border-rose-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>重新生成</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onSaveToThinkingNotes && (
              <button
                type="button"
                onClick={handleSaveToNotes}
                disabled={!summaryText || savedToNotes}
                className={`px-3.5 py-2 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  savedToNotes
                    ? 'bg-emerald-600 text-white'
                    : 'bg-rose-100 dark:bg-slate-800 hover:bg-rose-200 dark:hover:bg-slate-700 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-slate-700'
                }`}
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span>{savedToNotes ? '已转存至随笔' : '转存至【反思随笔】'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopy}
              disabled={!summaryText}
              className="px-4 py-2 bg-zinc-800 dark:bg-rose-600 hover:bg-zinc-700 dark:hover:bg-rose-500 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '已复制到剪贴板' : '复制完整摘要'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
