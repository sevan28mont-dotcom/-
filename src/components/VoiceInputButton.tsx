import React, { useState, useEffect, useRef } from 'react';
import { Mic, Sparkles, Loader2 } from 'lucide-react';

interface VoiceInputButtonProps {
  onTranscript: (textChunk: string) => void;
  className?: string;
  buttonText?: string;
  placeholderText?: string;
}

export const VoiceInputButton: React.FC<VoiceInputButtonProps> = ({
  onTranscript,
  className = '',
  buttonText = '语音口述',
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
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

  // Helper function to refine text with Gemini AI or local smart format fallback
  const processTranscriptWithAI = async (rawText: string) => {
    if (!rawText || !rawText.trim()) return;

    setIsProcessingAI(true);
    setStatusMessage('✨ AI 智能断句、校准标点中...');

    try {
      const response = await fetch('/api/refine-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: rawText }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.refinedText) {
          onTranscript(data.refinedText);
          setStatusMessage(`已智能录入: "${data.refinedText.slice(0, 14)}${data.refinedText.length > 14 ? '...' : ''}"`);
          return;
        }
      }
    } catch (e) {
      console.warn('AI speech refinement fetch failed, falling back to local format', e);
    } finally {
      setIsProcessingAI(false);
      setTimeout(() => setStatusMessage(null), 3000);
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
        // VAD 静音监测: 2.5 秒内无有效声音则自动停止录音并交由 AI 处理
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
        setStatusMessage('正在聆听中，请清晰口述...');
        resetSilenceTimer();
      };

      recognition.onspeechstart = () => {
        setStatusMessage('正在接收语音...');
        resetSilenceTimer();
      };

      recognition.onspeechend = () => {
        setStatusMessage('检测到口述暂停，准备 AI 校准...');
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
    <div className="inline-flex items-center gap-2 relative">
      <button
        type="button"
        onClick={toggleListening}
        disabled={isProcessingAI}
        className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-lg border transition cursor-pointer select-none shrink-0 ${
          isListening
            ? 'bg-rose-600 text-white border-rose-700 animate-pulse shadow-md'
            : isProcessingAI
            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700 cursor-wait'
            : 'bg-rose-50 dark:bg-slate-800 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-slate-700 hover:bg-rose-100 dark:hover:bg-slate-700'
        } ${className}`}
        title={
          !isSupported
            ? '当前浏览器不支持 Web Speech API'
            : isListening
            ? '点击停止语音录入并进行 AI 断句标点校准'
            : '点击开始语音口述，支持 AI 自动断句与重构'
        }
      >
        {isListening ? (
          <>
            <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <Mic className="w-3.5 h-3.5" />
            <span>录音中 (点击完成)</span>
          </>
        ) : isProcessingAI ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600 dark:text-amber-400" />
            <span>AI 断句标点中...</span>
          </>
        ) : (
          <>
            <Mic className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>{buttonText}</span>
          </>
        )}
      </button>

      {statusMessage && !isListening && (
        <span className="text-[11px] font-medium text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-slate-800 border border-rose-200 dark:border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1 animate-fadeIn">
          {isProcessingAI && <Sparkles className="w-3 h-3 text-amber-500 animate-spin" />}
          <span>{statusMessage}</span>
        </span>
      )}
    </div>
  );
};
