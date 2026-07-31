import React, { useState } from 'react';
import { ResourceLink } from '../types';
import {
  X,
  ExternalLink,
  Copy,
  RefreshCw,
  FileText,
  MessageSquare,
  BookOpen,
  Globe,
  Check,
  AlertCircle,
  Maximize2,
  Minimize2,
  FileUp,
  Download,
} from 'lucide-react';

interface LinkPreviewModalProps {
  resource: ResourceLink;
  allResources?: ResourceLink[];
  onSelectResource?: (res: ResourceLink) => void;
  onClose: () => void;
}

export const LinkPreviewModal: React.FC<LinkPreviewModalProps> = ({
  resource,
  allResources = [],
  onSelectResource,
  onClose,
}) => {
  const [current, setCurrent] = useState<ResourceLink>(resource);
  const [copied, setCopied] = useState(false);
  const [keyCounter, setKeyCounter] = useState(0);
  const [isMaximized, setIsMaximized] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(current.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTypeIcon = (type: ResourceLink['type']) => {
    switch (type) {
      case 'file':
        return <FileUp className="w-4 h-4 text-amber-600" />;
      case 'wps':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'weixin':
        return <MessageSquare className="w-4 h-4 text-emerald-600" />;
      case 'xiaohongshu':
        return <BookOpen className="w-4 h-4 text-rose-600" />;
      default:
        return <Globe className="w-4 h-4 text-indigo-600" />;
    }
  };

  const isImage = current.url.startsWith('data:image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(current.url);
  const isPdf = current.url.startsWith('data:application/pdf') || /\.pdf$/i.test(current.url);

  const handleSelect = (res: ResourceLink) => {
    setCurrent(res);
    setKeyCounter((prev) => prev + 1);
    if (onSelectResource) {
      onSelectResource(res);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div
        className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl flex flex-col transition-all duration-300 ${
          isMaximized ? 'w-full h-full rounded-none p-2' : 'w-full max-w-5xl h-[88vh]'
        }`}
      >
        {/* Header Bar */}
        <div className="p-3 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 shrink-0 bg-slate-50 dark:bg-slate-900 rounded-t-2xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xs">
              {getTypeIcon(current.type)}
            </span>
            <div className="truncate">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 truncate flex items-center gap-1.5">
                <span>{current.title}</span>
                {current.fileSize && (
                  <span className="text-xs text-amber-600 dark:text-amber-400 font-normal">({current.fileSize})</span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-md">
                {current.type === 'file' ? `本地离线文件附件 (${current.fileName || '已加载'})` : current.url}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {current.type === 'file' ? (
              <a
                href={current.url}
                download={current.fileName || current.title}
                className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>下载文件</span>
              </a>
            ) : (
              <>
                {/* 链接快捷复制 */}
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-2.5 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition flex items-center gap-1 cursor-pointer"
                  title="复制网址链接"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copied ? '已复制' : '复制网址'}</span>
                </button>

                {/* 在新窗口打开 */}
                <a
                  href={current.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition flex items-center gap-1 shadow-2xs cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>新标签页打开</span>
                </a>
              </>
            )}

            {/* 刷新 */}
            <button
              type="button"
              onClick={() => setKeyCounter((prev) => prev + 1)}
              className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
              title="重新加载"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            {/* 最大化/还原 */}
            <button
              type="button"
              onClick={() => setIsMaximized((prev) => !prev)}
              className="p-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer hidden sm:block"
              title={isMaximized ? '还原窗口' : '最大化全屏'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 关联资源多标签切换条 */}
        {allResources.length > 1 && (
          <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 shrink-0">关联资源:</span>
            {allResources.map((res) => (
              <button
                key={res.id}
                type="button"
                onClick={() => handleSelect(res)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                  res.id === current.id
                    ? 'bg-rose-600 text-white shadow-2xs font-bold'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-rose-50 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {getTypeIcon(res.type)}
                <span className="truncate max-w-[120px]">{res.title}</span>
              </button>
            ))}
          </div>
        )}

        {/* 提示条 */}
        <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200/80 dark:border-amber-900 text-[11px] text-amber-800 dark:text-amber-300 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>
              {current.type === 'file'
                ? '提示：本地文件已成功嵌入在线预览模式，您可以随时直接在线查阅或点击右上角导出下载。'
                : '提示：部分平台（如微信公众号或WPS安全设置）若拒绝外部网站嵌套展示，请使用右上方「新标签页打开」畅快阅读。'}
            </span>
          </div>
        </div>

        {/* 预览主体 */}
        <div className="flex-1 bg-slate-100 dark:bg-slate-950 relative overflow-hidden rounded-b-2xl flex items-center justify-center p-2">
          {isImage ? (
            <div className="max-w-full max-h-full overflow-auto flex items-center justify-center p-4">
              <img src={current.url} alt={current.title} className="max-w-full max-h-full object-contain rounded-lg shadow-md" />
            </div>
          ) : current.type === 'file' && !isPdf ? (
            <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-md">
              <FileUp className="w-16 h-16 text-amber-500 mx-auto mb-3 animate-bounce" />
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-1">{current.title}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                文件大小: {current.fileSize || '未知大小'} | 类型: 本地文档附件
              </p>
              <a
                href={current.url}
                download={current.fileName || current.title}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>立即下载/保存到本地电脑</span>
              </a>
            </div>
          ) : (
            <iframe
              key={`${current.url}_${keyCounter}`}
              src={current.url}
              title={current.title}
              className="w-full h-full border-0 bg-white"
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-modals"
            />
          )}
        </div>
      </div>
    </div>
  );
};
