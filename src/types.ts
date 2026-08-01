export type CaseCategory = 'longTerm' | 'shortTerm';

export interface ResourceLink {
  id: string;
  title: string;
  url: string;
  type: 'wps' | 'weixin' | 'xiaohongshu' | 'file' | 'other';
  addedAt?: string;
  fileName?: string;
  fileSize?: string;
}

export interface SessionData {
  completed: boolean;
  note: string;
  transcript?: string; // 逐字稿内容
  ideas?: string[]; // 插入的想法/随想列表
  resources?: ResourceLink[]; // 关联的WPS文档、微信公众号、小红书博文等链接
  durationMinutes?: number; // 咨询时长 (分钟)
}

export interface CaseRecord {
  id: string;
  category: CaseCategory;
  avatar: string;
  caseNum: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  status: 'active' | 'ended';
  endDate?: string; // YYYY-MM-DD
  totalSessions: number;
  sessions: Record<number, SessionData>;
  pinned?: boolean; // 是否重要置顶
}

export interface SupervisionRecord {
  id: string;
  caseId: string;
  sessionNum: number;
  date: string; // YYYY-MM-DD
  timeRange: string;
  type: 'individual' | 'group'; // 1. 个体督导  2. 团体督导
  reflection: string;
  isReflectionExpanded?: boolean;
  transcript?: string; // 督导逐字稿
  ideas?: string[]; // 督导想法/建议
  resources?: ResourceLink[]; // 关联WPS文档、微信公众号、小红书博文等
}

export interface Supervisor {
  id: string;
  name: string;
  gender: string; // '👨‍🏫 男导师' | '👩‍🏫 女导师'
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalSupervisions: number;
  boundCaseIds: string[]; // List of case IDs checked/bound to this supervisor
  activeCaseId?: string | null;
  records: SupervisionRecord[];
}

export type ScheduleType = string;

export interface ScheduleCategory {
  id: string;
  name: string;
  color: string; // 'rose' | 'sky' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'teal' | 'fuchsia'
  isSystem?: boolean;
}

export interface ScheduleItem {
  id: string;
  dateStr: string; // YYYY-MM-DD
  hour: number; // 8-21
  type: ScheduleType;
  clientName?: string;
  detail?: string;
}

export interface ThinkingNote {
  id: string;
  title: string;
  content: string;
  time: string;
  tags?: string[];
}

export interface ReminderItem {
  id: string;
  title: string;
  dateStr: string; // YYYY-MM-DD
  timeStr?: string; // HH:mm
  completed: boolean;
  priority: 'high' | 'normal' | 'low';
  category: 'case' | 'supervision' | 'admin' | 'general';
  createdAt: string;
}

export interface SystemData {
  records: CaseRecord[];
  mentors: Supervisor[];
  thinking: ThinkingNote[];
  schedules: ScheduleItem[];
  reminders: ReminderItem[];
}
