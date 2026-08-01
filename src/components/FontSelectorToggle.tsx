import React from 'react';
import { Type } from 'lucide-react';

export type FontOption = 'kaiti' | 'sans' | 'yahei' | 'song' | 'fangsong' | 'heiti' | 'arial';

export const FONT_LIST = [
  { id: 'kaiti', label: '华文楷体', family: '"STKaiti", "KaiTi", "楷体", "楷体_GB2312", serif' },
  { id: 'sans', label: '默认系统', family: 'system-ui, -apple-system, sans-serif' },
  { id: 'yahei', label: '微软雅黑', family: '"Microsoft YaHei", "PingFang SC", sans-serif' },
  { id: 'song', label: '宋体', family: '"SimSun", "STSong", "宋体", serif' },
  { id: 'fangsong', label: '仿宋', family: 'FangSong, "Fangsong SC", STFangsong, serif' },
  { id: 'heiti', label: '黑体', family: 'SimHei, "Heiti SC", sans-serif' },
  { id: 'arial', label: 'Arial', family: 'Arial, Helvetica, sans-serif' },
];

interface FontSelectorToggleProps {
  currentFont: FontOption;
  onChangeFont: (font: FontOption) => void;
  className?: string;
}

export const FontSelectorToggle: React.FC<FontSelectorToggleProps> = ({
  currentFont,
  onChangeFont,
  className = '',
}) => {
  const currentFontObj = FONT_LIST.find((f) => f.id === currentFont) || FONT_LIST[0];

  return (
    <div className={`inline-flex items-center gap-1 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-rose-200 dark:border-slate-700 text-[11px] font-bold shadow-2xs ${className}`}>
      <Type className="w-3.5 h-3.5 text-rose-500 shrink-0" />
      <span className="hidden sm:inline text-zinc-500 dark:text-slate-400">选择字体:</span>
      <select
        value={currentFont}
        onChange={(e) => onChangeFont(e.target.value as FontOption)}
        className="bg-transparent border-0 focus:outline-none cursor-pointer font-bold text-zinc-800 dark:text-slate-100 pr-1 max-w-[110px]"
        style={{ fontFamily: currentFontObj.family }}
        title="更改当前框中文本排版字体"
      >
        {FONT_LIST.map((f) => (
          <option
            key={f.id}
            value={f.id}
            style={{ fontFamily: f.family }}
            className="bg-white dark:bg-slate-900 text-zinc-800 dark:text-slate-100 py-1"
          >
            {f.label}
          </option>
        ))}
      </select>
    </div>
  );
};
