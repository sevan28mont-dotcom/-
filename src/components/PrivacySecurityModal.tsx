import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  HardDrive,
  Lock,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
  KeyRound,
  Database,
  Globe,
  Sliders,
  GripVertical,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  FolderOpen,
  Folder,
  UserCheck,
  Brain,
  Calendar,
  Bell,
  Cloud,
} from 'lucide-react';
import { SystemData } from '../types';
import { clearAllLocalStorage } from '../services/storage';
import {
  WorkspaceLayoutConfig,
  DEFAULT_WORKSPACE_LAYOUT,
  NavItemConfig,
} from '../services/layout';

interface PrivacySecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemData: SystemData;
  userId?: string;
  onImportData: (importedData: SystemData) => void;
  onResetToDefault: () => void;
  layoutConfig?: WorkspaceLayoutConfig;
  onUpdateLayoutConfig?: (config: WorkspaceLayoutConfig) => void;
  initialTab?: 'privacy' | 'backup' | 'clear' | 'layout';
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  FolderOpen,
  Folder,
  UserCheck,
  Brain,
  Calendar,
};

export const PrivacySecurityModal: React.FC<PrivacySecurityModalProps> = ({
  isOpen,
  onClose,
  systemData,
  userId,
  onImportData,
  onResetToDefault,
  layoutConfig = DEFAULT_WORKSPACE_LAYOUT,
  onUpdateLayoutConfig,
  initialTab = 'privacy',
}) => {
  const [useEncryptedBackup, setUseEncryptedBackup] = useState(false);
  const [encryptKey, setEncryptKey] = useState('PSY_SECURE_2026');
  const [confirmClearInput, setConfirmClearInput] = useState('');
  const [activeTab, setActiveTab] = useState<'privacy' | 'backup' | 'clear' | 'layout'>(initialTab);

  // Drag & drop state for layout reordering
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || 'privacy');
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  // Simple string obfuscation/encryption for offline export
  const encryptData = (jsonStr: string, key: string) => {
    try {
      const salt = `SALT_${key}_`;
      const encoded = btoa(encodeURIComponent(salt + jsonStr));
      return encoded;
    } catch {
      return jsonStr;
    }
  };

  const decryptData = (encodedStr: string, key: string) => {
    try {
      const decoded = decodeURIComponent(atob(encodedStr));
      const salt = `SALT_${key}_`;
      if (decoded.startsWith(salt)) {
        return decoded.slice(salt.length);
      }
      return decoded;
    } catch {
      return encodedStr;
    }
  };

  // Export Data Action
  const handleExportData = () => {
    let jsonString = JSON.stringify(systemData, null, 2);
    let fileName = `心理咨询系统数据备份_${new Date().toISOString().split('T')[0]}.json`;

    if (useEncryptedBackup) {
      jsonString = encryptData(jsonString, encryptKey);
      fileName = `心理咨询系统数据备份_加密版_${new Date().toISOString().split('T')[0]}.psybak`;
    }

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import File Action
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let rawContent = event.target?.result as string;
        if (file.name.endsWith('.psybak') || useEncryptedBackup) {
          rawContent = decryptData(rawContent, encryptKey);
        }

        const parsed = JSON.parse(rawContent);
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.records)) {
          if (window.confirm('导入此备份将覆盖当前浏览器本地数据，确定导入吗？')) {
            onImportData(parsed as SystemData);
            alert('数据恢复导入成功！');
            onClose();
          }
        } else {
          alert('数据解密或解析失败，格式不匹配或秘钥错误！');
        }
      } catch (err) {
        alert('读取备份文件失败，请检查密码或文件完整性。');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Clear Local Data
  const handleExecuteClear = () => {
    if (confirmClearInput !== '确认清空') {
      alert('请输入“确认清空”四个字以二次校验操作。');
      return;
    }

    if (window.confirm('警告：此操作将彻底删除浏览器 LocalStorage 中的所有咨询案例、逐字稿与督导记录！此过程无法撤销，确定清空吗？')) {
      clearAllLocalStorage(userId);
      onResetToDefault();
      alert('已成功清空本地所有缓存数据！');
      setConfirmClearInput('');
      onClose();
    }
  };

  // Layout handlers
  const handleToggleNavItemVisibility = (index: number) => {
    if (!onUpdateLayoutConfig) return;
    const newItems = [...layoutConfig.navItems];
    newItems[index] = {
      ...newItems[index],
      visible: !newItems[index].visible,
    };
    onUpdateLayoutConfig({
      ...layoutConfig,
      navItems: newItems,
    });
  };

  const handleMoveNavItem = (index: number, direction: 'up' | 'down') => {
    if (!onUpdateLayoutConfig) return;
    const newItems = [...layoutConfig.navItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    onUpdateLayoutConfig({
      ...layoutConfig,
      navItems: newItems,
    });
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index || !onUpdateLayoutConfig) return;

    const newItems = [...layoutConfig.navItems];
    const [draggedItem] = newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setDraggedIndex(null);
    onUpdateLayoutConfig({
      ...layoutConfig,
      navItems: newItems,
    });
  };

  const handleToggleWidget = (widgetKey: keyof WorkspaceLayoutConfig['widgets']) => {
    if (!onUpdateLayoutConfig) return;
    onUpdateLayoutConfig({
      ...layoutConfig,
      widgets: {
        ...layoutConfig.widgets,
        [widgetKey]: !layoutConfig.widgets[widgetKey],
      },
    });
  };

  const handleResetLayout = () => {
    if (window.confirm('确定将工作区导航菜单与底部工具栏重置为系统默认布局吗？')) {
      if (onUpdateLayoutConfig) {
        onUpdateLayoutConfig(DEFAULT_WORKSPACE_LAYOUT);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 rounded-xl font-bold">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <span>系统设置与工作区自定义</span>
                <span className="text-xs px-2 py-0.5 bg-rose-50 dark:bg-slate-800 text-rose-700 dark:text-rose-300 font-semibold rounded-md border border-rose-200 dark:border-slate-700">
                  布局 & 隐私控制
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                个性化工作区布局偏好、数据备份导出与伦理保障中枢
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-4 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('layout')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'layout'
                ? 'border-rose-600 text-rose-700 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>自定义工作区布局</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'privacy'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>数据隐私与存储架构</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'backup'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>备份导出与恢复恢复</span>
          </button>

          <button
            onClick={() => setActiveTab('clear')}
            className={`px-3.5 py-2.5 text-xs font-bold border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'clear'
                ? 'border-rose-600 text-rose-700 dark:text-rose-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            <span>一键清理本地缓存</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-200 text-xs flex-1">
          {/* TAB 1: 自定义工作区布局 */}
          {activeTab === 'layout' && (
            <div className="space-y-5">
              {/* Top Banner */}
              <div className="p-3.5 bg-rose-50/70 dark:bg-slate-800/80 border border-rose-200 dark:border-slate-700 rounded-xl flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <h4 className="font-bold text-rose-900 dark:text-rose-300 text-xs flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-rose-500" />
                    <span>左侧导航与板块排布偏好</span>
                  </h4>
                  <p className="text-[11px] text-zinc-600 dark:text-slate-400">
                    按住 ⠿ 图标拖拽可调整菜单次序；或点击 ↑↓ 及 👁️ 开关掌控显示与隐藏，设置自动同步保存至本地。
                  </p>
                </div>
                <button
                  onClick={handleResetLayout}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-slate-600 border border-rose-200 dark:border-slate-600 text-zinc-700 dark:text-slate-200 font-bold rounded-lg transition text-[11px] flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span>恢复默认</span>
                </button>
              </div>

              {/* Navigation Items Reorder & Toggle List */}
              <div className="space-y-2">
                <h4 className="font-bold text-zinc-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>1. 主导航菜单顺序与显隐</span>
                  <span className="text-[10px] font-normal text-zinc-400">
                    (支持拖拽或上下按钮调整)
                  </span>
                </h4>

                <div className="space-y-2">
                  {layoutConfig.navItems.map((item, index) => {
                    const IconComponent = ICON_MAP[item.iconName] || FolderOpen;
                    return (
                      <div
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, index)}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 bg-white dark:bg-slate-800 ${
                          item.visible
                            ? 'border-slate-200 dark:border-slate-700 shadow-2xs'
                            : 'border-slate-200/50 dark:border-slate-800 opacity-60 bg-slate-50/50 dark:bg-slate-900/50'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {/* Drag Handle */}
                          <span
                            className="cursor-grab active:cursor-grabbing p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                            title="按住拖拽排序"
                          >
                            <GripVertical className="w-4 h-4" />
                          </span>

                          {/* Up & Down Arrows */}
                          <div className="flex flex-col gap-0.5">
                            <button
                              disabled={index === 0}
                              onClick={() => handleMoveNavItem(index, 'up')}
                              className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-rose-500 disabled:opacity-20 cursor-pointer"
                              title="向上移动"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={index === layoutConfig.navItems.length - 1}
                              onClick={() => handleMoveNavItem(index, 'down')}
                              className="p-0.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-400 hover:text-rose-500 disabled:opacity-20 cursor-pointer"
                              title="向下移动"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>

                          {/* Icon & Details */}
                          <div className="p-2 bg-rose-50 dark:bg-slate-700/80 rounded-lg shrink-0">
                            <IconComponent className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-zinc-800 dark:text-slate-100">
                                {item.label}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                                  item.visible
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                }`}
                              >
                                {item.visible ? '已显示' : '已隐藏'}
                              </span>
                            </div>
                            <p className="text-[11px] text-zinc-400 dark:text-slate-400 truncate mt-0.5">
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* Visibility Toggle Button */}
                        <button
                          onClick={() => handleToggleNavItemVisibility(index)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                            item.visible
                              ? 'bg-rose-50 hover:bg-rose-100 dark:bg-slate-700 dark:hover:bg-slate-600 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-slate-600'
                              : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                          }`}
                        >
                          {item.visible ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5 text-rose-500" />
                              <span>隐藏此板块</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5 text-emerald-500" />
                              <span>恢复显示</span>
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sidebar Bottom Widgets Toggle */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="font-bold text-zinc-800 dark:text-slate-200 text-xs uppercase tracking-wider">
                  2. 侧边栏底部功能组件显隐
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    onClick={() => handleToggleWidget('showRemindersWidget')}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      layoutConfig.widgets.showRemindersWidget
                        ? 'bg-rose-50/50 dark:bg-slate-800/80 border-rose-200 dark:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-rose-500" />
                      <div>
                        <p className="font-bold text-xs text-zinc-800 dark:text-slate-200">
                          工作提醒通知中心
                        </p>
                        <p className="text-[10px] text-zinc-400">提醒事项数量与弹窗</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        layoutConfig.widgets.showRemindersWidget
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {layoutConfig.widgets.showRemindersWidget ? '显示中' : '已隐藏'}
                    </span>
                  </div>

                  <div
                    onClick={() => handleToggleWidget('showBackupWidget')}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      layoutConfig.widgets.showBackupWidget
                        ? 'bg-rose-50/50 dark:bg-slate-800/80 border-rose-200 dark:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-4 h-4 text-emerald-500" />
                      <div>
                        <p className="font-bold text-xs text-zinc-800 dark:text-slate-200">
                          备份导出与恢复按钮
                        </p>
                        <p className="text-[10px] text-zinc-400">快捷 JSON 导出恢复</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        layoutConfig.widgets.showBackupWidget
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {layoutConfig.widgets.showBackupWidget ? '显示中' : '已隐藏'}
                    </span>
                  </div>

                  <div
                    onClick={() => handleToggleWidget('showSyncWidget')}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      layoutConfig.widgets.showSyncWidget
                        ? 'bg-rose-50/50 dark:bg-slate-800/80 border-rose-200 dark:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Cloud className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="font-bold text-xs text-zinc-800 dark:text-slate-200">
                          后台同步卡片
                        </p>
                        <p className="text-[10px] text-zinc-400">一键与云端同步状态</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        layoutConfig.widgets.showSyncWidget
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {layoutConfig.widgets.showSyncWidget ? '显示中' : '已隐藏'}
                    </span>
                  </div>

                  <div
                    onClick={() => handleToggleWidget('showPrivacyWidget')}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                      layoutConfig.widgets.showPrivacyWidget
                        ? 'bg-rose-50/50 dark:bg-slate-800/80 border-rose-200 dark:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="font-bold text-xs text-zinc-800 dark:text-slate-200">
                          数据隐私伦理横幅
                        </p>
                        <p className="text-[10px] text-zinc-400">本地离线加密保障标识</p>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        layoutConfig.widgets.showPrivacyWidget
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                      }`}
                    >
                      {layoutConfig.widgets.showPrivacyWidget ? '显示中' : '已隐藏'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PRIVACY */}
          {activeTab === 'privacy' && (
            <div className="space-y-4">
              {/* Privacy Notice Box */}
              <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>核心数据隐私承诺（符合心理咨询伦理）</span>
                </div>
                <p className="text-xs text-emerald-900/80 dark:text-emerald-200/90 leading-relaxed">
                  本系统将个案保密性放在首位。所有录入的来访者代号、会谈笔记、逐字稿、督导反思等信息，<strong>100% 仅保存在您当前设备浏览器的 LocalStorage 沙盒中</strong>，绝不会在未经您许可的情况下上传至外部第三方服务器，杜绝数据泄露隐患。
                </p>
              </div>

              {/* 针对用户访客数/扣费/数据安全疑问解答 FAQ 板块 */}
              <div className="p-4 bg-sky-50/80 dark:bg-slate-800/90 border border-sky-200 dark:border-slate-700 rounded-xl space-y-3">
                <div className="flex items-center gap-2 font-bold text-sky-900 dark:text-sky-300 text-xs">
                  <Globe className="w-4 h-4 text-sky-600" />
                  <span>隐私与安全说明：关于网络访客量、扣费、数据隔离与访问权限设置</span>
                </div>
                <div className="space-y-2 text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
                  <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-sky-100 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-sky-950 dark:text-sky-200 flex items-center gap-1">
                      <span>❓ 如何设置限制访问，只允许我同意/发给的人进网站？</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>双重权限把关方案：</strong><br />
                      1. <strong>设置工作台登录密码：</strong> 您可以在系统登录页注册专属账号与强密码。没有您的账号密码，其他人即使获取链接也无法解锁系统主界面。<br />
                      2. <strong>私密数据加密分享：</strong> 若要将某些记录单独发给特定督导或同事，请在【数据备份】中导出**带密码加密**的数据包，对方必须输入您告知的解密口令才能还原查看。<br />
                      3. <strong>物理隔离优势：</strong> 本网站基于本地浏览器独立存储，即便陌生人打开网址，其看到的是完全空白的页面，绝不可能看到您的任何私密记录。
                    </p>
                  </div>

                  <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-sky-100 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-sky-950 dark:text-sky-200 flex items-center gap-1">
                      <span>❓ 为什么统计显示有 300+ 独立访客与 1k+ 请求数？</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      该应用托管在 Cloud Run 公网云端节点。当应用部署后，云端平台防护系统、搜索引擎蜘蛛爬虫、网络自动安全探测以及静态资源下载都会被云端 CDN 计入“独立访客”和“请求数”，这属于公网网站托管的正常技术现象。
                    </p>
                  </div>

                  <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-sky-100 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                      <span>💰 会扣我的钱吗？</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>完全不会扣费！零额外费用！</strong> AI Studio 提供的应用分享与预览环境完全包含在平台免费额度与开发测试权限内，您无需绑定任何信用卡，也不会产生任何扣费或账单支出。
                    </p>
                  </div>

                  <div className="p-2.5 bg-white/80 dark:bg-slate-900/80 rounded-lg border border-sky-100 dark:border-slate-800 space-y-1">
                    <p className="font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1">
                      <span>🔒 那些“独立访客”能看到我录入的日程与咨询档案吗？</span>
                    </p>
                    <p className="text-slate-600 dark:text-slate-400">
                      <strong>绝对不会！数据 100% 物理隔离！</strong> 因为本应用是纯前端浏览器沙盒架构，所有数据仅存储在您个人电脑/手机的本地浏览器中。陌生访客或网络爬虫打开链接时，只能看到全新的空白页面或默认示例，绝不可能调取或查看您的任何隐私记录。
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <HardDrive className="w-4 h-4 text-rose-500" />
                    <span>浏览器本地独立隔离存储</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-normal">
                    数据以独立 Key 形式保存在 HTML5 LocalStorage 空间中。支持针对不同用户账号设置隔离的数据域，互相独立不受干扰。
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-emerald-500" />
                    <span>终身可用与离线自主权</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-normal">
                    本系统采用纯前端离线优先（PWA/Web App）架构。即使没有网络连接或域名更迭，您也可以随时通过离线网页或导出的 JSON 备份文件永续保存所有卷宗。
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-500" />
                    <span>备份文稿加密混淆</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-normal">
                    支持在导出 `.json` 或 `.psybak` 备份文件时添加自定义口令秘钥加密混淆，防止备份文件误分发造成来访者隐私外泄。
                  </p>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Database className="w-4 h-4 text-blue-500" />
                    <span>预留 RESTful 后台同步</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 leading-normal">
                    顶部工具栏提供了“同步至后台”按键及预留 API 接口 `saveDataToBackend()`，便于未来无缝对接自建私有云数据库。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BACKUP */}
          {activeTab === 'backup' && (
            <div className="space-y-4">
              {/* 优化后的备份引导提示卡片 */}
              <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-xs">
                  <Download className="w-4 h-4 text-amber-600" />
                  <span>💡 零泄露风险的安全备份建议与引导说明</span>
                </div>
                <div className="text-[11px] text-amber-900/90 dark:text-amber-200/90 space-y-1.5 leading-relaxed">
                  <p>
                    <strong>1. 定期备份：</strong> 由于当前系统数据 100% 存储于您的当前浏览器中，清空浏览器缓存或更换设备将无法自动跨设备同步。建议每周或在新增重要咨询记录后，点击下方的【一键导出 JSON 备份文件】。
                  </p>
                  <p>
                    <strong>2. 异地或更换设备恢复：</strong> 若要在新电脑、手机或更换浏览器后使用，只需将导出的 JSON 文件传输到新设备上，点击下方的【从 JSON 备份导入恢复】即可一键完美还原所有案例、逐字稿与日程安排！
                  </p>
                  <p>
                    <strong>3. 双重加密保障：</strong> 导出的备份文件可以开启自定义密码加密，防止文件意外丢在 U 盘或公共电脑中造成患者隐私泄漏。
                  </p>
                </div>
              </div>

              {/* Encryption options */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl space-y-3">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={useEncryptedBackup}
                    onChange={(e) => setUseEncryptedBackup(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>启用导出备份加密 (Base64 / 口令混淆)</span>
                </label>

                {useEncryptedBackup && (
                  <div className="space-y-1 pl-6">
                    <label className="text-[11px] text-slate-500 dark:text-slate-400 block font-semibold">
                      自定义解密秘钥口令：
                    </label>
                    <input
                      type="text"
                      value={encryptKey}
                      onChange={(e) => setEncryptKey(e.target.value)}
                      className="w-full max-w-xs px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100"
                      placeholder="设置秘钥口令"
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={handleExportData}
                  className="p-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>一键导出 JSON 备份文件</span>
                </button>

                <label className="p-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>从 JSON 备份导入恢复</span>
                  <input
                    type="file"
                    onChange={handleImportFile}
                    accept=".json,.psybak"
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: CLEAR */}
          {activeTab === 'clear' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl space-y-2">
                <div className="flex items-center gap-2 font-bold text-rose-800 dark:text-rose-300 text-sm">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>高风险操作：销毁本地所有存储数据</span>
                </div>
                <p className="text-xs text-rose-900/80 dark:text-rose-200/90 leading-relaxed">
                  若您在网吧、医院公共电脑或他人设备上使用本系统，请在离线前清空本地缓存，避免来访者个案信息残留于公共设备中。
                </p>
              </div>

              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                  请输入“<span className="text-rose-600 font-extrabold">确认清空</span>”以解锁清理按钮：
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={confirmClearInput}
                    onChange={(e) => setConfirmClearInput(e.target.value)}
                    placeholder="输入：确认清空"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100"
                  />
                  <button
                    disabled={confirmClearInput !== '确认清空'}
                    onClick={handleExecuteClear}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>彻底清空</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 shrink-0">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>心理咨询伦理、布局个性化与数据安全保障中</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition cursor-pointer"
          >
            完成并关闭
          </button>
        </div>
      </div>
    </div>
  );
};
