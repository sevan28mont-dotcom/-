import { ActiveTab } from '../components/Sidebar';

export interface NavItemConfig {
  id: ActiveTab;
  label: string;
  iconName: 'FolderOpen' | 'Folder' | 'UserCheck' | 'Brain' | 'Calendar';
  visible: boolean;
  description: string;
}

export interface SidebarWidgetsConfig {
  showRemindersWidget: boolean;
  showBackupWidget: boolean;
  showSyncWidget: boolean;
  showPrivacyWidget: boolean;
}

export interface WorkspaceLayoutConfig {
  navItems: NavItemConfig[];
  widgets: SidebarWidgetsConfig;
}

export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayoutConfig = {
  navItems: [
    { id: 'longTerm', label: '长程（下周见）', iconName: 'FolderOpen', visible: true, description: '管理长程心理咨询案例、会谈评估及深度逐字稿' },
    { id: 'shortTerm', label: '短程（拜拜了）', iconName: 'Folder', visible: true, description: '管理短程焦点解决型个案及短周期咨询进度' },
    { id: 'mentor', label: '督了个啥', iconName: 'UserCheck', visible: true, description: '绑定督导师与个案档案，记录督导要点及反思' },
    { id: 'thinking', label: '想出来个啥', iconName: 'Brain', visible: true, description: '撰写日常临床感悟、自由联想与案例反思随笔' },
    { id: 'schedule', label: '出了个门儿', iconName: 'Calendar', visible: true, description: '管理会谈预约、督导安排及个人工作历表' },
  ],
  widgets: {
    showRemindersWidget: true,
    showBackupWidget: true,
    showSyncWidget: true,
    showPrivacyWidget: true,
  },
};

const STORAGE_KEY = 'PSY_WORKSPACE_LAYOUT_V1';

export const loadWorkspaceLayout = (): WorkspaceLayoutConfig => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.navItems) && parsed.widgets) {
        // Ensure all default items exist in case new features were added
        const loadedIds = new Set(parsed.navItems.map((item: NavItemConfig) => item.id));
        const missingItems = DEFAULT_WORKSPACE_LAYOUT.navItems.filter(
          (defaultItem) => !loadedIds.has(defaultItem.id)
        );
        const mergedNavItems = [...parsed.navItems, ...missingItems].map((item: NavItemConfig) => {
          if (item.id === 'longTerm' && (item.label === '长程案例管理' || !item.label)) {
            return { ...item, label: '长程（下周见）' };
          }
          if (item.id === 'shortTerm' && (item.label === '短程案例管理' || !item.label)) {
            return { ...item, label: '短程（拜拜了）' };
          }
          if (item.id === 'mentor' && (item.label === '督导师与个案关联' || !item.label)) {
            return { ...item, label: '督了个啥' };
          }
          if (item.id === 'thinking' && (item.label === '思考与总结反思' || item.label === '想出来个啥（假装思考）' || !item.label)) {
            return { ...item, label: '想出来个啥' };
          }
          if (item.id === 'schedule' && (item.label === '多维日程安排表' || !item.label)) {
            return { ...item, label: '出了个门儿' };
          }
          return item;
        });

        return {
          navItems: mergedNavItems,
          widgets: { ...DEFAULT_WORKSPACE_LAYOUT.widgets, ...parsed.widgets },
        };
      }
    }
  } catch (e) {
    console.error('Failed to load workspace layout', e);
  }
  return DEFAULT_WORKSPACE_LAYOUT;
};

export const saveWorkspaceLayout = (config: WorkspaceLayoutConfig): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save workspace layout', e);
  }
};
