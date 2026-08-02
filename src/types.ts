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

export interface ParentSessionData {
  completed: boolean;
  date?: string;
  note: string;
  transcript?: string;
  ideas?: string[];
  resources?: ResourceLink[];
  durationMinutes?: number;
  afterSessionNum?: number; // 自由穿插放置于第几次个体咨询之后 (支持拖拽调整)
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
  isTeenager?: boolean; // 是否属于青少年个案 (启用父母访谈功能)
  parentSessions?: Record<number, ParentSessionData>; // 父母访谈记录 (独立统计，不占用个体访谈总次数)
  shortTermType?: 'personal' | 'agency'; // 1. 个人短程案例 2. 医院或机构短程案例
  agencyName?: string; // 医院或机构名称
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
  hour: number; // 8-21 所在卡槽/基准小时
  timeStr?: string; // 精准灵活时间或时间段，如 "09:30", "09:30 - 10:45", "14:15"
  type: ScheduleType;
  clientName?: string;
  detail?: string;
  relatedId?: string; // 关联的对象ID (个案ID或督导ID)
  relatedType?: 'case' | 'supervisor' | 'custom'; // 关联类型
  completed?: boolean; // 是否一键标记完成
  repeatRule?: string; // 重复规则，如 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'workdays'
  order?: number; // 拖拽手动自定义排序权重
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

export interface PersonalExperienceRecord {
  id: string;
  sessionNum: number;
  date: string; // YYYY-MM-DD
  timeRange?: string; // e.g. "14:00-15:00"
  type: 'individual' | 'group'; // 1. 个体体验 2. 团体体验
  facilitator?: string; // 体验分析师/带领者
  note: string; // 体验感悟与反思
  transcript?: string; // 逐字稿/口述
  ideas?: string[]; // 体验想法
  resources?: ResourceLink[]; // 外链资源
  completed?: boolean;
  durationMinutes?: number;
}

export interface PersonalExperienceSetting {
  totalIndividualHours: number;
  totalGroupHours: number;
  records: PersonalExperienceRecord[];
}

export type TrainingCategory = 'psychodynamics' | 'longShort' | 'otherSchools' | 'ethicsCrisis';

export interface TrainingSessionRecord {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  hours: number;
  note?: string;
  resources?: ResourceLink[];
  completed?: boolean;
}

export interface TrainingCourse {
  id: string;
  category: TrainingCategory;
  name: string; // 培训名称
  startDate: string; // 培训起始时间 YYYY-MM-DD
  endDate?: string; // 培训结束时间 YYYY-MM-DD
  totalHours: number; // 培训总时数 (小时)
  status: 'ongoing' | 'completed'; // 'ongoing' -> 正在持续当中 | 'completed' -> 已结业
  organization?: string; // 培训机构/主办方
  instructor?: string; // 主讲导师
  description?: string; // 培训简介/感想
  sessions?: TrainingSessionRecord[]; // 学习/出勤/讲座明细
}

export interface SystemData {
  records: CaseRecord[];
  mentors: Supervisor[];
  thinking: ThinkingNote[];
  schedules: ScheduleItem[];
  reminders: ReminderItem[];
  personalExperience?: PersonalExperienceSetting;
  trainings?: TrainingCourse[];
  totalHoursOverrides?: {
    caseHours?: number;
    supervisionHours?: number;
    personalExperienceHours?: number;
    longTermCaseHours?: number;
    shortTermCaseHours?: number;
    individualSupervisionHours?: number;
    groupSupervisionHours?: number;
    individualExperienceHours?: number;
    groupExperienceHours?: number;
  };
}
