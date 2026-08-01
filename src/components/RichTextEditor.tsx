import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Highlighter,
  Eraser,
  Type,
  ChevronDown,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Maximize2,
  Minimize2,
  Save,
} from 'lucide-react';
import { VoiceInputButton } from './VoiceInputButton';

interface RichTextEditorProps {
  value: string;
  onChange: (newValue: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  voiceButtonText?: string;
}

// 60+ 精细文本颜色库
const TEXT_COLOR_PALETTE = [
  // 黑灰暗色系 (8)
  { name: '纯黑', value: '#000000' },
  { name: '暗石灰', value: '#0f172a' },
  { name: '深铅灰', value: '#1e293b' },
  { name: '墨灰', value: '#334155' },
  { name: '中灰色', value: '#64748b' },
  { name: '银灰', value: '#94a3b8' },
  { name: '浅银', value: '#cbd5e1' },
  { name: '深棕灰', value: '#44403c' },

  // 红与玫瑰色系 (8)
  { name: '玫瑰红', value: '#e11d48' },
  { name: '宝石红', value: '#dc2626' },
  { name: '深红', value: '#991b1b' },
  { name: '朱红', value: '#b91c1c' },
  { name: '暗绯红', value: '#881337' },
  { name: '珊瑚红', value: '#f43f5e' },
  { name: '洋红', value: '#be123c' },
  { name: '桃红', value: '#fb7185' },

  // 粉与紫红系 (6)
  { name: '热烈粉', value: '#ec4899' },
  { name: '深紫红', value: '#be185d' },
  { name: '樱花粉', value: '#f472b6' },
  { name: '亮品红', value: '#d946ef' },
  { name: '暗品红', value: '#a21caf' },
  { name: '芭比粉', value: '#f0abfc' },

  // 紫色系 (7)
  { name: '高贵紫', value: '#7c3aed' },
  { name: '深紫色', value: '#6b21a8' },
  { name: '皇家紫', value: '#581c87' },
  { name: '丁香紫', value: '#a855f7' },
  { name: '熏衣草紫', value: '#c084fc' },
  { name: '浅罗兰', value: '#e9d5ff' },
  { name: '暗蓝紫', value: '#4c1d95' },

  // 蓝色系 (8)
  { name: '宝石蓝', value: '#2563eb' },
  { name: '海军蓝', value: '#1e3a8a' },
  { name: '皇家蓝', value: '#1d4ed8' },
  { name: '蔚蓝', value: '#0284c7' },
  { name: '天空蓝', value: '#38bdf8' },
  { name: '深天蓝', value: '#0369a1' },
  { name: '湖蓝', value: '#0891b2' },
  { name: '冰蓝', value: '#7dd3fc' },

  // 靛青与青绿系 (6)
  { name: '靛青', value: '#4338ca' },
  { name: '暗靛蓝', value: '#312e81' },
  { name: '深青色', value: '#0f766e' },
  { name: '孔雀青', value: '#0d9488' },
  { name: '明青', value: '#14b8a6' },
  { name: '薄荷青', value: '#5eead4' },

  // 绿色系 (8)
  { name: '翡翠绿', value: '#059669' },
  { name: '森林绿', value: '#14532d' },
  { name: '深绿', value: '#15803d' },
  { name: '草绿', value: '#16a34a' },
  { name: '鲜绿', value: '#22c55e' },
  { name: '橄榄绿', value: '#4d7c0f' },
  { name: '苔藓绿', value: '#3f6212' },
  { name: '嫩绿', value: '#86efac' },

  // 黄与琥珀色系 (6)
  { name: '暖橘黄', value: '#d97706' },
  { name: '金色', value: '#eab308' },
  { name: '芥末黄', value: '#ca8a04' },
  { name: '暗金', value: '#854d0e' },
  { name: '柠檬黄', value: '#facc15' },
  { name: '姜黄', value: '#b45309' },

  // 橙与琥珀红系 (6)
  { name: '暖暖橙', value: '#ea580c' },
  { name: '深橙红', value: '#c2410c' },
  { name: '鲜橘红', value: '#f97316' },
  { name: '柿子红', value: '#9a3412' },
  { name: '杏橙', value: '#fb923c' },
  { name: '桃橙', value: '#ffedd5' },

  // 棕与大地色系 (5)
  { name: '咖啡棕', value: '#78350f' },
  { name: '巧克力色', value: '#451a03' },
  { name: '卡其棕', value: '#a16207' },
  { name: '赭石色', value: '#92400e' },
  { name: '驼色', value: '#d97706' },
];

// 50+ 精美背景高亮/底色库
const HIGHLIGHT_COLOR_PALETTE = [
  // 柔和高亮底色 (浅色系 25)
  { name: '柔黄色', value: '#fef08a' },
  { name: '柠檬浅黄', value: '#fef9c3' },
  { name: '金黄底色', value: '#fde047' },
  { name: '薄荷绿', value: '#bbf7d0' },
  { name: '浅草绿', value: '#dcfce7' },
  { name: '翡翠亮绿', value: '#86efac' },
  { name: '樱花粉', value: '#fbcfe8' },
  { name: '柔粉红', value: '#ffe4e6' },
  { name: '桃气粉', value: '#f472b6' },
  { name: '天空蓝', value: '#bfdbfe' },
  { name: '冰霜蓝', value: '#e0f2fe' },
  { name: '浅水蓝', value: '#bae6fd' },
  { name: '紫罗兰淡紫', value: '#e9d5ff' },
  { name: '薰衣草浅紫', value: '#f3e8ff' },
  { name: '暖蜜橙', value: '#ffedd5' },
  { name: '浅杏色', value: '#fed7aa' },
  { name: '亮浅青', value: '#ccfbf1' },
  { name: '蒂芙尼淡青', value: '#99f6e4' },
  { name: '冷银灰底', value: '#e2e8f0' },
  { name: '中灰背景', value: '#cbd5e1' },
  { name: '奶白色', value: '#fef3c7' },
  { name: '象牙白', value: '#fefce8' },
  { name: '浅咖底色', value: '#f5f5f4' },
  { name: '石苔浅灰', value: '#e7e5e4' },
  { name: '淡玫瑰底', value: '#fecdd3' },

  // 鲜艳/中等饱和底色 (20)
  { name: '高亮黄', value: '#ffff00' },
  { name: '荧光绿', value: '#00ff00' },
  { name: '荧光粉', value: '#ff00ff' },
  { name: '荧光蓝', value: '#00ffff' },
  { name: '明黄底色', value: '#facc15' },
  { name: '亮橙背景', value: '#fb923c' },
  { name: '珊瑚底色', value: '#f87171' },
  { name: '紫色背景', value: '#c084fc' },
  { name: '海蓝底色', value: '#60a5fa' },
  { name: '翠绿底色', value: '#4ade80' },
  { name: '琥珀橙底', value: '#f59e0b' },
  { name: '青绿底色', value: '#2dd4bf' },
  { name: '玫瑰亮背景', value: '#fb7185' },
  { name: '深黄高亮', value: '#eab308' },
  { name: '浅棕底色', value: '#d6d3d1' },

  // 暗色沉浸底色 (8)
  { name: '深蓝底色', value: '#1e3a8a' },
  { name: '暗绿底色', value: '#14532d' },
  { name: '酒红底色', value: '#881337' },
  { name: '墨紫底色', value: '#581c87' },
  { name: '深青底色', value: '#0f766e' },
  { name: '暗炭灰底', value: '#334155' },
  { name: '纯黑背景', value: '#000000' },
  { name: '暗棕底色', value: '#451a03' },
];

// 丰富字体库
const FONT_FAMILIES = [
  { label: '✨ 华文楷体 (STKaiti)', value: '"STKaiti", "KaiTi", "楷体", "楷体_GB2312", "STKaiti SC", serif' },
  { label: '默认系统字体', value: 'system-ui, -apple-system, sans-serif' },
  { label: '微软雅黑 (Microsoft YaHei)', value: '"Microsoft YaHei", "PingFang SC", sans-serif' },
  { label: '微软正黑体 (Microsoft JhengHei)', value: '"Microsoft JhengHei", sans-serif' },
  { label: '宋体 (SimSun)', value: 'SimSun, "Songti SC", serif' },
  { label: '黑体 (SimHei)', value: 'SimHei, "Heiti SC", sans-serif' },
  { label: '仿宋 (FangSong)', value: 'FangSong, "Fangsong SC", STFangsong, serif' },
  { label: '隶书 (LiSu)', value: 'LiSu, "Lantinghei SC", serif' },
  { label: 'Arial (经典无衬线)', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Georgia (典雅衬线体)', value: 'Georgia, serif' },
  { label: 'Times New Roman (正统衬线)', value: '"Times New Roman", Times, serif' },
  { label: 'Courier New (等宽代码体)', value: '"Courier New", Courier, monospace' },
];

// 丰富字号
const FONT_SIZES = [
  { label: '12px (极小)', value: '1' },
  { label: '14px (小号)', value: '2' },
  { label: '16px (标准)', value: '3' },
  { label: '18px (中号)', value: '4' },
  { label: '24px (大号)', value: '5' },
  { label: '32px (特大)', value: '6' },
  { label: '48px (巨型)', value: '7' },
];

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '在此输入或黏贴文字，支持使用工具栏进行样式排版...',
  minHeight = '180px',
  className = '',
  voiceButtonText = '语音录入',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [showTextColorGrid, setShowTextColorGrid] = useState(false);
  const [showHighlightGrid, setShowHighlightGrid] = useState(false);

  // 自动保存与全屏沉浸编辑状态
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>(() => {
    const now = new Date();
    return now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  });
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const notifyAutoSave = () => {
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saved');
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 500);
  };

  const handleManualSave = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
    setSaveStatus('saving');
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      setSaveStatus('saved');
      const now = new Date();
      setLastSavedTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
    }, 300);
  };

  // 快捷键 Ctrl+S / Cmd+S 保存与 ESC 退出全屏监听
  useEffect(() => {
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

  // 初始化设置 innerHTML，只在初次或外部有根本变化时更新
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        const formatted = value && !/<[a-z][\s\S]*>/i.test(value)
          ? value.replace(/\n/g, '<br/>')
          : value || '';
        editorRef.current.innerHTML = formatted;
      }
    }
  }, [value]);

  const handleExecCommand = (command: string, arg: string | undefined = undefined) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      notifyAutoSave();
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      notifyAutoSave();
    }
  };

  const handleAppendVoiceText = (text: string) => {
    if (!text) return;
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      editorRef.current.innerHTML = currentHtml + (currentHtml && !currentHtml.endsWith('<br>') ? '<br/>' : '') + text;
      onChange(editorRef.current.innerHTML);
      notifyAutoSave();
    }
  };

  const handleClearFormat = () => {
    document.execCommand('removeFormat', false);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
      notifyAutoSave();
    }
  };

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-[9999] bg-white dark:bg-slate-900 flex flex-col p-4 sm:p-6 shadow-2xl h-screen w-screen overflow-hidden transition-all duration-300'
          : `border border-rose-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 shadow-2xs relative overflow-visible ${className}`
      }
    >
      {/* 顶部轻量级‘自动保存’状态与全屏控制指示栏 */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-rose-50/90 dark:bg-slate-800/90 border-b border-rose-100 dark:border-slate-700/80 rounded-t-xl text-xs select-none shrink-0">
        <div className="flex items-center gap-2 text-zinc-800 dark:text-slate-100 font-bold text-[11px] sm:text-xs">
          <HardDrive className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{isFullscreen ? '沉浸式全屏编辑模式' : '富文本笔记编辑器'}</span>
          {isFullscreen && (
            <span className="hidden md:inline-block text-[10px] font-normal text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-slate-700 px-2 py-0.5 rounded-full border border-rose-200 dark:border-slate-600">
              按 ESC 键退出全屏 | 按 Ctrl+S 保存
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 保存状态指示 */}
          {saveStatus === 'saving' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80 text-[11px] font-bold animate-pulse shadow-2xs">
              <RefreshCw className="w-3 h-3 animate-spin text-amber-600 dark:text-amber-400 shrink-0" />
              <span>正在保存...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 text-[11px] font-bold shadow-2xs">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>已自动保存至本地</span>
              {lastSavedTime && (
                <span className="hidden sm:inline-block text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-normal opacity-90">
                  ({lastSavedTime})
                </span>
              )}
            </span>
          )}

          {/* 手动 Ctrl+S 保存按钮 */}
          <button
            type="button"
            onClick={handleManualSave}
            className="flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-slate-900 hover:bg-rose-100 dark:hover:bg-slate-700 border border-rose-200 dark:border-slate-700 rounded-lg text-zinc-700 dark:text-slate-200 text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-2xs"
            title="快捷键: Ctrl + S / Cmd + S 手动立刻保存"
          >
            <Save className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Ctrl+S 保存</span>
          </button>

          {/* 全屏/退出全屏按钮 */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1 px-2.5 py-1 bg-rose-500 hover:bg-rose-600 dark:bg-rose-700 dark:hover:bg-rose-600 text-white rounded-lg text-[11px] font-bold transition cursor-pointer active:scale-95 shadow-2xs"
            title={isFullscreen ? '退出全屏编辑模式 (ESC)' : '进入沉浸式全屏编辑模式'}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>退出全屏</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>全屏沉浸</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 格式工具栏 */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/90 border-b border-rose-100 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs select-none relative z-20">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* 字体选择下拉 */}
          <div className="flex items-center bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <Type className="w-3.5 h-3.5 text-indigo-500 shrink-0 mr-1" />
            <select
              onChange={(e) => handleExecCommand('fontName', e.target.value)}
              className="text-[11px] bg-transparent border-0 focus:outline-none cursor-pointer font-medium text-slate-700 dark:text-slate-200 max-w-[120px] truncate"
              defaultValue="system-ui, -apple-system, sans-serif"
              title="切换字体"
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.label} value={font.value} style={{ fontFamily: font.value }}>
                  {font.label}
                </option>
              ))}
            </select>
          </div>


          {/* 字号选择 */}
          <div className="flex items-center bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <select
              onChange={(e) => handleExecCommand('fontSize', e.target.value)}
              className="text-[11px] bg-transparent border-0 focus:outline-none cursor-pointer font-medium text-slate-700 dark:text-slate-200"
              defaultValue="3"
              title="字号大小"
            >
              {FONT_SIZES.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          {/* 常用基础样式 */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleExecCommand('bold')}
              className="p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 hover:text-rose-600 transition cursor-pointer"
              title="加粗"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleExecCommand('italic')}
              className="p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 hover:text-rose-600 transition cursor-pointer"
              title="斜体"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleExecCommand('underline')}
              className="p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 hover:text-rose-600 transition cursor-pointer"
              title="下划线"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 对齐方式 */}
          <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => handleExecCommand('justifyLeft')}
              className="p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 hover:text-rose-600 transition cursor-pointer"
              title="居左对齐"
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleExecCommand('justifyCenter')}
              className="p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 hover:text-rose-600 transition cursor-pointer"
              title="居中对齐"
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleExecCommand('justifyRight')}
              className="p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-200 hover:text-rose-600 transition cursor-pointer"
              title="居右对齐"
            >
              <AlignRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 60+ 文字颜色调色板按钮 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowTextColorGrid((prev) => !prev);
                setShowHighlightGrid(false);
              }}
              className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-rose-50 transition cursor-pointer text-[11px] font-semibold"
              title="选择 60+ 种文字颜色"
            >
              <Palette className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span>文字颜色 ({TEXT_COLOR_PALETTE.length})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* 60+ 文字颜色 Popover Palette */}
            {showTextColorGrid && (
              <div className="absolute left-0 top-full mt-1.5 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[100] w-72 sm:w-80 max-h-72 overflow-y-auto animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  <span>选择文字颜色 ({TEXT_COLOR_PALETTE.length} 种)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">自选:</span>
                    <input
                      type="color"
                      onChange={(e) => {
                        handleExecCommand('foreColor', e.target.value);
                        setShowTextColorGrid(false);
                      }}
                      className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                      title="自定义任意颜色"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                  {TEXT_COLOR_PALETTE.map((c) => (
                    <button
                      key={c.name + c.value}
                      type="button"
                      onClick={() => {
                        handleExecCommand('foreColor', c.value);
                        setShowTextColorGrid(false);
                      }}
                      style={{ backgroundColor: c.value }}
                      className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 hover:scale-125 transition shadow-2xs cursor-pointer focus:outline-none shrink-0"
                      title={`${c.name} (${c.value})`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleExecCommand('foreColor', 'inherit');
                    setShowTextColorGrid(false);
                  }}
                  className="w-full mt-2 py-1 text-[11px] text-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md font-medium text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  恢复默认文字颜色
                </button>
              </div>
            )}
          </div>

          {/* 50+ 背景高亮调色板按钮 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowHighlightGrid((prev) => !prev);
                setShowTextColorGrid(false);
              }}
              className="flex items-center gap-1 bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-amber-50 transition cursor-pointer text-[11px] font-semibold"
              title="选择 50+ 种背景高亮底色"
            >
              <Highlighter className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>高亮底色 ({HIGHLIGHT_COLOR_PALETTE.length})</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* 50+ 高亮背景 Popover Palette */}
            {showHighlightGrid && (
              <div className="absolute left-0 top-full mt-1.5 p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-[100] w-72 sm:w-80 max-h-72 overflow-y-auto animate-fadeIn">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5 mb-2 text-[11px] font-bold text-slate-700 dark:text-slate-200">
                  <span>选择高亮背景 ({HIGHLIGHT_COLOR_PALETTE.length} 种)</span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">自选:</span>
                    <input
                      type="color"
                      onChange={(e) => {
                        handleExecCommand('hiliteColor', e.target.value);
                        setShowHighlightGrid(false);
                      }}
                      className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                      title="自定义任意底色"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5">
                  {HIGHLIGHT_COLOR_PALETTE.map((hl) => (
                    <button
                      key={hl.name + hl.value}
                      type="button"
                      onClick={() => {
                        handleExecCommand('hiliteColor', hl.value);
                        setShowHighlightGrid(false);
                      }}
                      style={{ backgroundColor: hl.value }}
                      className="w-6 h-6 rounded-md border border-slate-300 dark:border-slate-600 hover:scale-125 transition shadow-2xs cursor-pointer focus:outline-none shrink-0"
                      title={`${hl.name} (${hl.value})`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    handleExecCommand('hiliteColor', 'transparent');
                    setShowHighlightGrid(false);
                  }}
                  className="w-full mt-2 py-1 text-[11px] text-center bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md font-medium text-slate-600 dark:text-slate-300 transition cursor-pointer"
                >
                  清除背景高亮
                </button>
              </div>
            )}
          </div>

          {/* 清除所有格式 */}
          <button
            type="button"
            onClick={handleClearFormat}
            className="p-1.5 bg-white dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:text-slate-300 transition cursor-pointer"
            title="清除选中区域的所有样式排版"
          >
            <Eraser className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 语音输入按钮 */}
        <div className="shrink-0">
          <VoiceInputButton
            buttonText={voiceButtonText}
            onTranscript={handleAppendVoiceText}
          />
        </div>
      </div>

      {/* 可编辑区域 */}
      <div className={isFullscreen ? "flex-1 overflow-hidden relative z-10 flex flex-col mt-2 border border-rose-100 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900" : "rounded-b-xl overflow-hidden relative z-10"}>
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          style={{ minHeight: isFullscreen ? '100%' : minHeight }}
          className={
            isFullscreen
              ? "flex-1 p-6 sm:p-8 text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-100 focus:outline-none overflow-y-auto font-sans min-w-full"
              : "p-3.5 text-xs leading-relaxed text-slate-800 dark:text-slate-100 focus:outline-none overflow-y-auto font-sans min-w-full"
          }
          data-placeholder={placeholder}
        />
      </div>
    </div>
  );
};
