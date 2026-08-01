import { SystemData, CaseRecord, Supervisor, ThinkingNote, ScheduleItem, ReminderItem } from '../types';

const STORAGE_KEYS = {
  RECORDS: 'psy_records_v8',
  MENTORS: 'psy_mentors_v8',
  THINKING: 'psy_thinking_v8',
  SCHEDULES: 'psy_schedules_v8',
  REMINDERS: 'psy_reminders_v8',
};

// Initial default seed data for demonstration and instant rich UX
const DEFAULT_RECORDS: CaseRecord[] = [
  {
    id: 'c1',
    category: 'longTerm',
    avatar: '👨‍💼',
    caseNum: 'C001',
    name: '李先生 (焦虑取向)',
    startDate: '2026-01-10',
    status: 'active',
    totalSessions: 30,
    sessions: {
      1: { completed: true, note: '建立咨询同盟，探索焦虑诱因与工作压力。' },
      2: { completed: true, note: '认知重构尝试，识别自动思维。' },
      3: { completed: true, note: '讨论亲密关系中的依恋模式。' },
    },
  },
  {
    id: 'c2',
    category: 'longTerm',
    avatar: '👩‍💼',
    caseNum: 'C002',
    name: '王女士 (抑郁议题)',
    startDate: '2026-02-01',
    status: 'active',
    totalSessions: 40,
    sessions: {
      1: { completed: true, note: '评估抑郁情绪，制定安全协议与行为激活计划。' },
      2: { completed: true, note: '探索早年家庭互动与情绪防御机制。' },
    },
  },
  {
    id: 'c3',
    category: 'shortTerm',
    avatar: '👧',
    caseNum: 'S001',
    name: '张同学 (考前压力)',
    startDate: '2026-03-05',
    status: 'active',
    totalSessions: 12,
    sessions: {
      1: { completed: true, note: '短期焦点解决技术，澄清考前目标。' },
    },
  },
];

const DEFAULT_MENTORS: Supervisor[] = [
  {
    id: 'm1',
    name: '张教授',
    gender: '👨‍🏫 男导师',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    totalSupervisions: 20,
    boundCaseIds: ['c1', 'c2'],
    records: [
      {
        id: 'sup1',
        caseId: 'c1',
        sessionNum: 2,
        date: '2026-01-20',
        timeRange: '14:00-15:00',
        type: 'individual',
        reflection: '导师建议：注意咨询师自身的拯救冲动，在认知重构阶段保持中立与觉察。',
        isReflectionExpanded: true,
      },
      {
        id: 'sup2',
        caseId: 'c2',
        sessionNum: 1,
        date: '2026-02-10',
        timeRange: '16:00-17:00',
        type: 'group',
        reflection: '团体督导汇报：小组讨论了负性情绪转化的防卫机制。',
        isReflectionExpanded: true,
      },
    ],
  },
  {
    id: 'm2',
    name: '陈督导',
    gender: '👩‍🏫 女导师',
    startDate: '2026-03-01',
    endDate: '2026-09-30',
    totalSupervisions: 15,
    boundCaseIds: ['c3'],
    records: [],
  },
];

const DEFAULT_THINKING: ThinkingNote[] = [
  {
    id: 't1',
    title: '关于精神分析中阻抗的思考',
    content: '在与焦虑取向来访者的会谈中，阻抗往往以表面上的顺从形式出现。咨询师需要敏锐感知这种“伪合作”，探究背后的控制感需求。',
    time: '2026-03-12 10:30',
  },
];

const DEFAULT_SCHEDULES: ScheduleItem[] = [
  {
    id: 's1',
    dateStr: '2026-07-30',
    hour: 10,
    type: 'consult',
    clientName: 'C001 李先生 (焦虑取向)',
    detail: '常规个体咨询第4次',
  },
  {
    id: 's2',
    dateStr: '2026-07-30',
    hour: 14,
    type: 'individual_supervision',
    clientName: '张教授',
    detail: '1. 个体督导 - C001案例讨论',
  },
  {
    id: 's3',
    dateStr: '2026-07-31',
    hour: 15,
    type: 'group_supervision',
    clientName: '陈督导',
    detail: '2. 团体督导 - 考前压力个案小组研讨',
  },
  {
    id: 's4',
    dateStr: '2026-08-01',
    hour: 9,
    type: 'course',
    detail: '客体关系心理学进阶课程',
  },
];

const DEFAULT_REMINDERS: ReminderItem[] = [
  {
    id: 'rem1',
    title: '准备李先生 (C001) 第4次咨询督导反思提纲',
    dateStr: '2026-07-30',
    timeStr: '12:00',
    completed: false,
    priority: 'high',
    category: 'supervision',
    createdAt: '2026-07-29',
  },
  {
    id: 'rem2',
    title: '跟进张同学 (S001) 考前压力评估问卷量表回访',
    dateStr: '2026-07-31',
    timeStr: '16:00',
    completed: false,
    priority: 'normal',
    category: 'case',
    createdAt: '2026-07-29',
  },
];

export const EMPTY_SYSTEM_DATA: SystemData = {
  records: [],
  mentors: [],
  thinking: [],
  schedules: [],
  reminders: [],
};

export function getZeroedSystemData(): SystemData {
  return { ...EMPTY_SYSTEM_DATA };
}

export function loadDataFromLocalStorage(userId?: string): SystemData {
  try {
    const keys = {
      records: userId ? `psy_u_${userId}_records` : STORAGE_KEYS.RECORDS,
      mentors: userId ? `psy_u_${userId}_mentors` : STORAGE_KEYS.MENTORS,
      thinking: userId ? `psy_u_${userId}_thinking` : STORAGE_KEYS.THINKING,
      schedules: userId ? `psy_u_${userId}_schedules` : STORAGE_KEYS.SCHEDULES,
      reminders: userId ? `psy_u_${userId}_reminders` : STORAGE_KEYS.REMINDERS,
    };

    const r = localStorage.getItem(keys.records);
    const m = localStorage.getItem(keys.mentors);
    const t = localStorage.getItem(keys.thinking);
    const s = localStorage.getItem(keys.schedules);
    const rem = localStorage.getItem(keys.reminders);

    // If a specific custom user ID is given and they have no saved records yet, return EMPTY_SYSTEM_DATA
    if (userId && !r && !m && !t && !s && !rem) {
      return { ...EMPTY_SYSTEM_DATA };
    }

    return {
      records: r ? JSON.parse(r) : DEFAULT_RECORDS,
      mentors: m ? JSON.parse(m) : DEFAULT_MENTORS,
      thinking: t ? JSON.parse(t) : DEFAULT_THINKING,
      schedules: s ? JSON.parse(s) : DEFAULT_SCHEDULES,
      reminders: rem ? JSON.parse(rem) : DEFAULT_REMINDERS,
    };
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
    return userId ? { ...EMPTY_SYSTEM_DATA } : {
      records: DEFAULT_RECORDS,
      mentors: DEFAULT_MENTORS,
      thinking: DEFAULT_THINKING,
      schedules: DEFAULT_SCHEDULES,
      reminders: DEFAULT_REMINDERS,
    };
  }
}

export function saveDataToLocalStorage(data: SystemData, userId?: string): void {
  try {
    const keys = {
      records: userId ? `psy_u_${userId}_records` : STORAGE_KEYS.RECORDS,
      mentors: userId ? `psy_u_${userId}_mentors` : STORAGE_KEYS.MENTORS,
      thinking: userId ? `psy_u_${userId}_thinking` : STORAGE_KEYS.THINKING,
      schedules: userId ? `psy_u_${userId}_schedules` : STORAGE_KEYS.SCHEDULES,
      reminders: userId ? `psy_u_${userId}_reminders` : STORAGE_KEYS.REMINDERS,
    };

    localStorage.setItem(keys.records, JSON.stringify(data.records));
    localStorage.setItem(keys.mentors, JSON.stringify(data.mentors));
    localStorage.setItem(keys.thinking, JSON.stringify(data.thinking));
    localStorage.setItem(keys.schedules, JSON.stringify(data.schedules));
    localStorage.setItem(keys.reminders, JSON.stringify(data.reminders || []));
  } catch (err) {
    console.error('Failed to save to localStorage:', err);
  }
}

export function clearAllLocalStorage(userId?: string): void {
  try {
    const keys = {
      records: userId ? `psy_u_${userId}_records` : STORAGE_KEYS.RECORDS,
      mentors: userId ? `psy_u_${userId}_mentors` : STORAGE_KEYS.MENTORS,
      thinking: userId ? `psy_u_${userId}_thinking` : STORAGE_KEYS.THINKING,
      schedules: userId ? `psy_u_${userId}_schedules` : STORAGE_KEYS.SCHEDULES,
      reminders: userId ? `psy_u_${userId}_reminders` : STORAGE_KEYS.REMINDERS,
    };
    Object.values(keys).forEach((k) => localStorage.removeItem(k));
  } catch (err) {
    console.error('Failed to clear localStorage:', err);
  }
}

/**
 * 在线后端账号全量信息同步接口
 */
export async function saveDataToBackend(data: SystemData, userId: string = 'default'): Promise<{ success: boolean; message: string; timestamp: string }> {
  try {
    const response = await fetch('/api/sync/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, data }),
    });
    const result = await response.json();
    if (result.success) {
      return {
        success: true,
        message: result.message || '数据已在线成功同步至同账号云端',
        timestamp: result.timestamp || new Date().toLocaleTimeString('zh-CN', { hour12: false }),
      };
    }
  } catch (e) {
    console.warn('Backend sync save warning:', e);
  }

  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });
  return {
    success: true,
    message: `本地离线状态打包保存 (未连接远端服务器)`,
    timestamp,
  };
}

export async function fetchBackendData(userId: string): Promise<SystemData | null> {
  try {
    const response = await fetch('/api/sync/get', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    const result = await response.json();
    if (result.success && result.data) {
      return result.data as SystemData;
    }
  } catch (e) {
    console.warn('Backend sync fetch warning:', e);
  }
  return null;
}
