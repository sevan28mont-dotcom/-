import React, { useState, useEffect, useRef } from 'react';
import { Mic, Sparkles, Loader2, ListOrdered, CheckCircle2 } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (textChunk: string) => void;
  className?: string;
  buttonText?: string;
  placeholderText?: string;
  currentText?: string; // 可选：传入当前输入框文字以进行一键微信大模型整理
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = '',
  buttonText = '语音口述',
  currentText,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [useWeChatModel, setUseWeChatModel] = useState(true); // 默认开启微信语音大模型智能分点提炼
  const [isSupported, setIsSupported] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  // Helper function to refine text with Gemini AI / WeChat Voice Big Model
  const processTranscriptWithAI = async (rawText: string, forceWeChatFormat: boolean = false) => {
    if (!rawText || !rawText.trim()) return;

    setIsProcessingAI(true);
    const isWeChat = forceWeChatFormat || useWeChatModel;
    setStatusMessage(isWeChat ? '✨ 微信语音大模型·智能分点整理中...' : '✨ AI 智能断句、校准标点中...');

    try {
      const endpoint = isWeChat ? '/api/refine-speech-wechat' : '/api/refine-speech';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });

      if (response.ok) {
        const data = await response.json();
        const resultText = data.structuredText || data.refinedText;
        if (resultText) {
          onTranscript(resultText);
          setStatusMessage(`已分点整理: "${resultText.slice(0, 16)}${resultText.length > 16 ? '...' : ''}"`);
          return;
        }
      }
    } catch (e) {
      console.warn('AI speech refinement fetch failed, falling back to local format', e);
    } finally {
      setIsProcessingAI(false);
      setTimeout(() => setStatusMessage(null), 3500);
    }

    // Local smart formatting fallback
    let fallbackText = rawText
      .replace(/(那个|就是说|嗯+|额+|呃+|对吧|然后那个)/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (fallbackText && !/[。！？!,.?]$/.test(fallbackText)) {
      fallbackText += '。';
    }
    onTranscript(fallbackText);
    setStatusMessage(`已录入: "${fallbackText.slice(0, 14)}${fallbackText.length > 14 ? '...' : ''}"`);
  };

  // 一键将现有的输入框文本用“微信语音大模型”智能重写提炼成条目
  const handleFormatExistingTextWithWeChat = () => {
    if (!currentText || !currentText.trim()) {
      setStatusMessage('输入框暂无文字，请先语音口述或输入文本');
      setTimeout(() => setStatusMessage(null), 2500);
      return;
    }
    processTranscriptWithAI(currentText, true);
  };

  const toggleListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatusMessage('当前浏览器不支持语音识别，请使用 Chrome/Edge/Safari 浏览器');
      setTimeout(() => setStatusMessage(null), 3500);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.continuous = false;
      recognition.interimResults = false;

      let hasEmitted = false;
      let silenceTimer: any = null;

      const resetSilenceTimer = () => {
        if (silenceTimer) clearTimeout(silenceTimer);
        silenceTimer = setTimeout(() => {
          if (recognitionRef.current) {
            try {
              recognitionRef.current.stop();
            } catch (e) {
              // ignore
            }
          }
        }, 2500);
      };

      recognition.onstart = () => {
        setIsListening(true);
        setStatusMessage(useWeChatModel ? '正在聆听，稍后将使用【微信语音大模型】自动分点整理...' : '正在聆听中，请清晰口述...');
        resetSilenceTimer();
      };

      recognition.onspeechstart = () => {
        setStatusMessage('正在接收语音...');
        resetSilenceTimer();
      };

      recognition.onspeechend = () => {
        setStatusMessage('检测到口述暂停，准备微信大模型智能整理...');
        if (silenceTimer) clearTimeout(silenceTimer);
      };

      recognition.onresult = (event: any) => {
        if (silenceTimer) clearTimeout(silenceTimer);

        if (event.results && event.results.length > 0) {
          const result = event.results[0];
          const transcriptStr = result[0]?.transcript || '';
          const cleanChunk = transcriptStr.trim();

          if (cleanChunk && !hasEmitted) {
            hasEmitted = true;
            processTranscriptWithAI(cleanChunk);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (silenceTimer) clearTimeout(silenceTimer);
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setStatusMessage('麦克风权限被拒绝，请允许麦克风权限');
        } else if (event.error === 'no-speech') {
          setStatusMessage('未检测到有效声音');
        } else if (event.error !== 'aborted') {
          setStatusMessage(`提示: ${event.error}`);
        }
        setIsListening(false);
        setTimeout(() => setStatusMessage(null), 3000);
      };

      recognition.onend = () => {
        if (silenceTimer) clearTimeout(silenceTimer);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setStatusMessage('启动语音识别失败');
      setIsListening(false);
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  return (
    <div className="inline-flex flex-wrap items-center gap-1.5 relative">
      {/* 核心录音按钮 */}
      <button
        type="button"
        onClick={toggleListening}
        disabled={isProcessingAI}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer select-none shrink-0 ${
          isListening
            ? 'bg-emerald-600 text-white border-emerald-700 animate-pulse shadow-md'
            : isProcessingAI
            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 cursor-wait'
            : 'bg-emerald-50 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-slate-700 hover:bg-emerald-100 dark:hover:bg-slate-700'
        } ${className}`}
        title={
          !isSupported
            ? '当前浏览器不支持 Web Speech API'
            : isListening
            ? '点击停止语音录入并交由微信语音大模型智能分点整理'
            : '点击开始语音口述，支持微信语音大模型理解重写与分点提炼'
        }
      >
        {isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <Mic className="w-3.5 h-3.5" />
            <span>微信语音录音中...</span>
          </>
        ) : isProcessingAI ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
            <span>微信大模型整理中...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {/* 微信大模型模式 Toggle / 智能提炼现有文字按钮 */}
      {currentText && currentText.trim() && (
        <button
          type="button"
          onClick={handleFormatExistingTextWithWeChat}
          disabled={isProcessingAI}
          className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950 hover:bg-emerald-200 border border-emerald-300 dark:border-emerald-800 rounded-lg transition cursor-pointer shadow-2xs"
          title="微信语音大模型：将当前输入框内容重新理解、整理提炼成有条理的分点格式 (1. 2. 3.)"
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>微信分点整理</span>
        </button>
      )}

      {/* 切换整理模式提示 badge */}
      <button
        type="button"
        onClick={() => setUseWeChatModel((prev) => !prev)}
        className={`px-1.5 py-0.5 text-[10px] font-bold rounded-md border transition cursor-pointer flex items-center gap-0.5 ${
          useWeChatModel
            ? 'bg-emerald-600 text-white border-emerald-700 shadow-2xs'
            : 'bg-zinc-100 text-zinc-600 border-zinc-200'
        }`}
        title={useWeChatModel ? '已开启【微信语音大模型智能分点】模式 (点击可切换为普通标点断句)' : '当前为普通标点断句 (点击可开启微信语音大模型智能分点)'}
      >
        <ListOrdered className="w-2.5 h-2.5" />
        <span>{useWeChatModel ? '微信大模型' : '标准断句'}</span>
      </button>

      {statusMessage && !isListening && (
        <span className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 animate-fadeIn">
          {isProcessingAI && <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />}
          <span>{statusMessage}</span>
        </span>
      )}
    </div>
  );
};

