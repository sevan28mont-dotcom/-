import React, { useState } from 'react';
import { Lightbulb, Plus, X } from 'lucide-react';
import { VoiceInputButton } from './VoiceInputButton';

interface IdeasSectionProps {
  ideas: string[];
  onAddIdea: (newIdea: string) => void;
  onDeleteIdea: (index: number) => void;
  readOnly?: boolean;
}

export const IdeasSection: React.FC<IdeasSectionProps> = ({
  ideas,
  onAddIdea,
  onDeleteIdea,
  readOnly = false,
}) => {
  const [input, setInput] = useState('');

  const handleAdd = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    onAddIdea(input.trim());
    setInput('');
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>随时插入想法 / 随记点子 ({ideas.length})</span>
        </label>
        {!readOnly && (
          <VoiceInputButton
            buttonText="语音输入想法"
            onTranscript={(text) => {
              if (text.trim()) {
                onAddIdea(text.trim());
              }
            }}
          />
        )}
      </div>

      {!readOnly && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="输入灵感想法、简短督导点子或随想，回车快速插入..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
            className="flex-1 text-xs p-2 bg-white dark:bg-slate-800 border border-rose-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-400"
          />
          <button
            type="button"
            onClick={() => handleAdd()}
            disabled={!input.trim()}
            className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-2xs transition cursor-pointer shrink-0 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>插入</span>
          </button>
        </div>
      )}

      {ideas.length === 0 ? (
        <div className="text-xs text-slate-400 dark:text-slate-500 italic bg-amber-50/40 dark:bg-amber-950/20 p-2.5 rounded-xl border border-dashed border-amber-200 dark:border-amber-900 text-center">
          暂无插入的想法 (支持点击上方语音按钮口述，或在输入框中直接敲回车快速插入)
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 pt-1">
          {ideas.map((idea, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs rounded-xl shadow-2xs"
            >
              <span className="font-semibold">{idea}</span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onDeleteIdea(idx)}
                  className="p-0.5 text-amber-600 dark:text-amber-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-full hover:bg-amber-200/50 cursor-pointer"
                  title="删除想法"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
