import React, { useState, useRef } from 'react';
import { ResourceLink } from '../types';
import { ExternalLink, Link as LinkIcon, Plus, Trash2, FileText, Globe, MessageSquare, BookOpen, Eye, Upload, FileUp, Download } from 'lucide-react';
import { LinkPreviewModal } from './LinkPreviewModal';

interface ResourceLinkSectionProps {
  resources: ResourceLink[];
  onAddResource: (newLink: ResourceLink) => void;
  onDeleteResource: (id: string) => void;
  readOnly?: boolean;
}

export const ResourceLinkSection: React.FC<ResourceLinkSectionProps> = ({
  resources,
  onAddResource,
  onDeleteResource,
  readOnly = false,
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'wps' | 'weixin' | 'xiaohongshu' | 'file' | 'other'>('wps');
  const [isAdding, setIsAdding] = useState(false);
  const [previewingResource, setPreviewingResource] = useState<ResourceLink | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const newResource: ResourceLink = {
          id: 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          title: file.name,
          url: result || '',
          type: 'file',
          fileName: file.name,
          fileSize: formatFileSize(file.size),
          addedAt: new Date().toISOString().split('T')[0],
        };
        onAddResource(newResource);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      alert('请输入有效的链接地址！');
      return;
    }

    let formattedUrl = url.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'https://' + formattedUrl;
    }

    let defaultTitle = title.trim();
    if (!defaultTitle) {
      if (type === 'wps') defaultTitle = 'WPS在线文档';
      else if (type === 'weixin') defaultTitle = '微信公众号文章';
      else if (type === 'xiaohongshu') defaultTitle = '小红书博文';
      else defaultTitle = '网络参考链接';
    }

    const newLink: ResourceLink = {
      id: 'res_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: defaultTitle,
      url: formattedUrl,
      type,
      addedAt: new Date().toISOString().split('T')[0],
    };

    onAddResource(newLink);
    setTitle('');
    setUrl('');
    setIsAdding(false);
  };

  const getTypeBadge = (linkType: ResourceLink['type']) => {
    switch (linkType) {
      case 'file':
        return {
          icon: <FileUp className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />,
          label: '本地文件',
          bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200',
        };
      case 'wps':
        return {
          icon: <FileText className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />,
          label: 'WPS文档',
          bg: 'bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300',
        };
      case 'weixin':
        return {
          icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />,
          label: '微信公众号',
          bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300',
        };
      case 'xiaohongshu':
        return {
          icon: <BookOpen className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />,
          label: '小红书',
          bg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300',
        };
      default:
        return {
          icon: <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />,
          label: '网络链接',
          bg: 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300',
        };
    }
  };

  return (
    <div className="space-y-3">
      {/* 隐藏的文件上传 input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        multiple
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <LinkIcon className="w-4 h-4 text-rose-500" />
          <span>WPS文件 / 微信公众号 / 本地文档与图片资源 ({resources.length})</span>
        </label>
        {!readOnly && (
          <div className="flex items-center gap-2">
            {/* 专门的【添加/上传本地文件】按钮 */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-bold px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg shadow-2xs transition flex items-center gap-1 cursor-pointer"
              title="上传本地Word/PDF/图片/音频等文件附件"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>📁 添加/上传文件</span>
            </button>

            {!isAdding && (
              <button
                type="button"
                onClick={() => setIsAdding(true)}
                className="text-[11px] font-bold px-2.5 py-1 bg-rose-50 dark:bg-slate-800 text-rose-700 dark:text-rose-300 hover:bg-rose-100 border border-rose-200 dark:border-slate-700 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>插入网络链接</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* 资源列表展示 */}
      {resources.length === 0 ? (
        <div className="text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center flex flex-col items-center gap-1.5">
          <span>暂未插入任何文件或网址链接 (支持点击右上角「上传文件」添加本地Word/PDF/图片，或粘贴 WPS/微信文章链接)</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {resources.map((item) => {
            const badge = getTypeBadge(item.type);
            return (
              <div
                key={item.id}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${badge.bg} transition shadow-2xs group`}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0 mr-1">
                  <span className="p-1 bg-white dark:bg-slate-900 rounded-md border border-slate-200/60 dark:border-slate-700 shrink-0">
                    {badge.icon}
                  </span>
                  <div className="truncate">
                    <div className="font-bold text-xs truncate flex items-center gap-1">
                      <span>{item.title}</span>
                      {item.fileSize && (
                        <span className="text-[10px] opacity-75 font-normal">({item.fileSize})</span>
                      )}
                    </div>
                    <div className="text-[10px] opacity-75 truncate">
                      {item.type === 'file' ? '本地文件附件' : item.url}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {/* 在线预览 / 预览下载 */}
                  <button
                    type="button"
                    onClick={() => setPreviewingResource(item)}
                    className="p-1 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 bg-white/80 dark:bg-slate-900/80 hover:bg-white rounded-md border border-slate-200/60 dark:border-slate-700 transition cursor-pointer text-[11px] flex items-center gap-1 px-1.5"
                    title="在应用内窗口预览此文件或链接"
                  >
                    <Eye className="w-3 h-3 text-rose-500" />
                    <span>预览</span>
                  </button>

                  {item.type === 'file' ? (
                    <a
                      href={item.url}
                      download={item.fileName || item.title}
                      className="p-1 text-amber-700 dark:text-amber-300 hover:bg-white dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                      title="下载本地文件"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md transition cursor-pointer"
                      title="新窗口打开"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => onDeleteResource(item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded-md transition cursor-pointer"
                      title="删除此资源"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 在线预览 Modal */}
      {previewingResource && (
        <LinkPreviewModal
          resource={previewingResource}
          allResources={resources}
          onSelectResource={(res) => setPreviewingResource(res)}
          onClose={() => setPreviewingResource(null)}
        />
      )}

      {/* 插入网络链接表单 */}
      {isAdding && !readOnly && (
        <form onSubmit={handleAdd} className="bg-rose-50/70 dark:bg-slate-800 p-3 rounded-xl border border-rose-200 dark:border-slate-700 space-y-2.5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-rose-200/60 dark:border-slate-700 pb-1.5">
            <span className="text-xs font-bold text-rose-900 dark:text-rose-300">添加网络链接 (WPS / 微信 / 小红书 / 网页)</span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400"
            >
              取消
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">链接类型</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-1 focus:ring-rose-400"
              >
                <option value="wps">📝 WPS 文件/文档链接</option>
                <option value="weixin">💬 微信公众号文章</option>
                <option value="xiaohongshu">📕 小红书博文链接</option>
                <option value="other">🔗 其他网络参考网址</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">资源标题 / 备注 *</label>
              <input
                type="text"
                placeholder="例如: 李先生初访WPS逐字稿文档 / 微信公众号认知行为干预..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">网页链接 URL *</label>
            <input
              type="url"
              placeholder="复制粘贴网址，如: https://kdocs.cn/l/... 或 https://mp.weixin.qq.com/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              className="w-full text-xs p-2 bg-white dark:bg-slate-900 border border-rose-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-rose-400"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs cursor-pointer"
            >
              确定保存链接
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
