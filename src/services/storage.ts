import { SystemData, CaseRecord, Supervisor, ThinkingNote, ScheduleItem, ReminderItem } from '../types';

const STORAGE_KEYS = {
  RECORDS: 'psy_records_v8',
  MENTORS: 'psy_mentors_v8',
  THINKING: 'psy_thinking_v8',
  SCHEDULES: 'psy_schedules_v8',
  REMINDERS: 'psy_reminders_v8',
  TRAININGS: 'psy_trainings_v8',
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
    isTeenager: true,
    parentSessions: {
      1: { completed: true, date: '2026-03-10', note: '与张同学父母进行初次会谈，了解考前家庭支持与期待。' },
    },
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

export const DEFAULT_TRAININGS = [
  {
    id: 'tr_psychodynamics_1',
    category: 'psychodynamics',
    name: '经典长程动力学心理咨询连续培训项目',
    startDate: '2024-03-01',
    endDate: '2026-03-01',
    totalHours: 120,
    status: 'ongoing',
    organization: '中国心理学会 / 动力学专业委员会',
    instructor: '国内外资深精神分析专家',
    description: '系统学习客体关系理论、自我心理学及依恋理论，掌握长程动力学评估与治疗实操。',
    sessions: [
      { id: 'ts_1', date: '2024-03-15', title: '第一讲：精神分析发展史与潜意识理论', hours: 6, note: '重点掌握经典潜意识理论与防卫机制分类', completed: true },
      { id: 'ts_2', date: '2024-04-20', title: '第二讲：移情、反移情与阻抗处理', hours: 6, note: '临床会谈中的反移情觉察与反思', completed: true },
    ]
  },
  {
    id: 'tr_longShort_1',
    category: 'longShort',
    name: '长程评估与短程焦点解决(SFBT)整合连续培训',
    startDate: '2024-05-10',
    endDate: '2024-12-31',
    totalHours: 60,
    status: 'ongoing',
    organization: '心理咨询与治疗专业培训中心',
    instructor: '短程焦点与整合取向导师',
    description: '掌握短程焦点解决技术的奇迹提问、例外提问，以及长短程个案转化评估策略。',
    sessions: [
      { id: 'ts_3', date: '2024-05-20', title: '短程焦点基本假设与赞赏技术', hours: 4, note: '如何在第一次会谈中建立合作同盟', completed: true },
    ]
  },
  {
    id: 'tr_otherSchools_1',
    category: 'otherSchools',
    name: '认知行为疗法(CBT)与人本流派整合实操培训',
    startDate: '2024-06-01',
    endDate: '2024-11-30',
    totalHours: 48,
    status: 'ongoing',
    organization: '认知行为取向研究院',
    instructor: 'CBT 资深督导师',
    description: '学习自动思维识别、思维日记记录以及无条件积极关注的技术整合。',
    sessions: [
      { id: 'ts_4', date: '2024-06-10', title: '自动想法与核心信念评估', hours: 4, note: '三栏表与五栏表在临床中的应用', completed: true },
    ]
  },
  {
    id: 'tr_ethicsCrisis_1',
    category: 'ethicsCrisis',
    name: '心理咨询伦理守则与高危危机干预实操培训',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    totalHours: 30,
    status: 'ongoing',
    organization: '心理健康促进协会',
    instructor: '心理伦理委员会专家',
    description: '深入研读《临床与咨询心理学工作伦理守则》，掌握自杀风险评估、知情同意与突破保密流程。',
    sessions: [
      { id: 'ts_5', date: '2024-02-01', title: '知情同意、双重关系与保密例外', hours: 6, note: '熟记高危评估红线及转介告知规范', completed: true },
    ]
  }
];

export const EMPTY_SYSTEM_DATA: SystemData = {
  records: [],
  mentors: [],
  thinking: [],
  schedules: [],
  reminders: [],
  trainings: [],
};

export function getDefaultSampleSystemData(): SystemData {
  return {
    records: JSON.parse(JSON.stringify(DEFAULT_RECORDS)),
    mentors: JSON.parse(JSON.stringify(DEFAULT_MENTORS)),
    thinking: JSON.parse(JSON.stringify(DEFAULT_THINKING)),
    schedules: JSON.parse(JSON.stringify(DEFAULT_SCHEDULES)),
    reminders: JSON.parse(JSON.stringify(DEFAULT_REMINDERS)),
    trainings: JSON.parse(JSON.stringify(DEFAULT_TRAININGS)),
  };
}

export function getZeroedSystemData(): SystemData {
  return { ...EMPTY_SYSTEM_DATA };
}

export function loadDataFromLocalStorage(userId?: string): SystemData {
  try {
    const userPrefix = userId ? `psy_u_${userId}_` : '';
    const primaryKeys = {
      records: userId ? `${userPrefix}records` : STORAGE_KEYS.RECORDS,
      mentors: userId ? `${userPrefix}mentors` : STORAGE_KEYS.MENTORS,
      thinking: userId ? `${userPrefix}thinking` : STORAGE_KEYS.THINKING,
      schedules: userId ? `${userPrefix}schedules` : STORAGE_KEYS.SCHEDULES,
      reminders: userId ? `${userPrefix}reminders` : STORAGE_KEYS.REMINDERS,
      trainings: userId ? `${userPrefix}trainings` : STORAGE_KEYS.TRAININGS,
    };

    // If userId is provided, check if user-specific local storage key exists
    if (userId) {
      const existingUserRecords = localStorage.getItem(primaryKeys.records);
      if (existingUserRecords) {
        try {
          const records = JSON.parse(existingUserRecords).map((r: any) => ({
            ...r,
            isTeenager: typeof r.isTeenager === 'boolean'
              ? r.isTeenager
              : Boolean(
                  r.avatar === '👦' ||
                  r.avatar === '👧' ||
                  r.avatar === '👶' ||
                  (r.parentSessions && Object.keys(r.parentSessions).length > 0)
                ),
            parentSessions: r.parentSessions || {},
          }));
          const mentors = JSON.parse(localStorage.getItem(primaryKeys.mentors) || '[]');
          const thinking = JSON.parse(localStorage.getItem(primaryKeys.thinking) || '[]');
          const schedules = JSON.parse(localStorage.getItem(primaryKeys.schedules) || '[]');
          const reminders = JSON.parse(localStorage.getItem(primaryKeys.reminders) || '[]');
          const trainings = JSON.parse(localStorage.getItem(primaryKeys.trainings) || '[]');
          const experienceData = JSON.parse(localStorage.getItem(`${userPrefix}experienceData`) || 'null');

          return { records, mentors, thinking, schedules, reminders, trainings, experienceData };
        } catch (e) {
          console.error('Error parsing user local storage:', e);
        }
      }

      // If user is u_default or u_demo, initialize with default sample data
      if (userId === 'u_default' || userId === 'u_demo') {
        return getDefaultSampleSystemData();
      }

      // For new custom user accounts, return empty system data so cloud fetch takes precedence
      return { ...EMPTY_SYSTEM_DATA };
    }

    // Helper to read from primary key or search legacy fallback keys
    const readWithFallback = (primaryKey: string, fallbackKeys: string[], defaultVal: any) => {
      const val = localStorage.getItem(primaryKey);
      if (val) {
        try { return JSON.parse(val); } catch (e) { /* ignore parse error */ }
      }
      for (const fKey of fallbackKeys) {
        const fallbackVal = localStorage.getItem(fKey);
        if (fallbackVal) {
          try {
            const parsed = JSON.parse(fallbackVal);
            localStorage.setItem(primaryKey, fallbackVal);
            return parsed;
          } catch (e) { /* ignore */ }
        }
      }
      return defaultVal;
    };

    const legacyRecordsKeys = [STORAGE_KEYS.RECORDS, 'psy_records_v8', 'psy_records_v7', 'psy_records_v6', 'psy_records_v5', 'psy_records', 'psy_master_backup_records'];
    const legacyMentorsKeys = [STORAGE_KEYS.MENTORS, 'psy_mentors_v8', 'psy_mentors_v7', 'psy_mentors_v6', 'psy_mentors_v5', 'psy_mentors', 'psy_master_backup_mentors'];
    const legacyThinkingKeys = [STORAGE_KEYS.THINKING, 'psy_thinking_v8', 'psy_thinking_v7', 'psy_thinking_v6', 'psy_thinking_v5', 'psy_thinking', 'psy_master_backup_thinking'];
    const legacySchedulesKeys = [STORAGE_KEYS.SCHEDULES, 'psy_schedules_v8', 'psy_schedules_v7', 'psy_schedules_v6', 'psy_schedules_v5', 'psy_schedules', 'psy_master_backup_schedules'];
    const legacyRemindersKeys = [STORAGE_KEYS.REMINDERS, 'psy_reminders_v8', 'psy_reminders_v7', 'psy_reminders_v6', 'psy_reminders_v5', 'psy_reminders', 'psy_master_backup_reminders'];
    const legacyTrainingsKeys = [STORAGE_KEYS.TRAININGS, 'psy_trainings_v8', 'psy_master_backup_trainings'];

    const rawRecords = readWithFallback(primaryKeys.records, legacyRecordsKeys, DEFAULT_RECORDS);
    const records = (Array.isArray(rawRecords) ? rawRecords : DEFAULT_RECORDS).map((r: any) => ({
      ...r,
      isTeenager: typeof r.isTeenager === 'boolean'
        ? r.isTeenager
        : Boolean(
            r.avatar === '👦' ||
            r.avatar === '👧' ||
            r.avatar === '👶' ||
            (r.parentSessions && Object.keys(r.parentSessions).length > 0)
          ),
      parentSessions: r.parentSessions || {},
    }));
    const mentors = readWithFallback(primaryKeys.mentors, legacyMentorsKeys, DEFAULT_MENTORS);
    const thinking = readWithFallback(primaryKeys.thinking, legacyThinkingKeys, DEFAULT_THINKING);
    const schedules = readWithFallback(primaryKeys.schedules, legacySchedulesKeys, DEFAULT_SCHEDULES);
    const reminders = readWithFallback(primaryKeys.reminders, legacyRemindersKeys, DEFAULT_REMINDERS);
    const trainings = readWithFallback(primaryKeys.trainings, legacyTrainingsKeys, DEFAULT_TRAININGS);

    return { records, mentors, thinking, schedules, reminders, trainings };
  } catch (err) {
    console.error('Failed to load from localStorage:', err);
    return getDefaultSampleSystemData();
  }
}

export function saveDataToLocalStorage(data: SystemData, userId?: string): void {
  try {
    const userPrefix = userId ? `psy_u_${userId}_` : '';
    const keys = {
      records: userId ? `${userPrefix}records` : STORAGE_KEYS.RECORDS,
      mentors: userId ? `${userPrefix}mentors` : STORAGE_KEYS.MENTORS,
      thinking: userId ? `${userPrefix}thinking` : STORAGE_KEYS.THINKING,
      schedules: userId ? `${userPrefix}schedules` : STORAGE_KEYS.SCHEDULES,
      reminders: userId ? `${userPrefix}reminders` : STORAGE_KEYS.REMINDERS,
      trainings: userId ? `${userPrefix}trainings` : STORAGE_KEYS.TRAININGS,
    };

    const recordsStr = JSON.stringify(data.records);
    const mentorsStr = JSON.stringify(data.mentors);
    const thinkingStr = JSON.stringify(data.thinking);
    const schedulesStr = JSON.stringify(data.schedules);
    const remindersStr = JSON.stringify(data.reminders || []);
    const trainingsStr = JSON.stringify(data.trainings || []);
    const experienceDataStr = JSON.stringify(data.experienceData || null);

    // Save to user / current key
    localStorage.setItem(keys.records, recordsStr);
    localStorage.setItem(keys.mentors, mentorsStr);
    localStorage.setItem(keys.thinking, thinkingStr);
    localStorage.setItem(keys.schedules, schedulesStr);
    localStorage.setItem(keys.reminders, remindersStr);
    localStorage.setItem(keys.trainings, trainingsStr);
    if (userId) {
      localStorage.setItem(`psy_u_${userId}_experienceData`, experienceDataStr);
    }

    // Save mirror copies to master backup keys for version update durability
    localStorage.setItem('psy_master_backup_records', recordsStr);
    localStorage.setItem('psy_master_backup_mentors', mentorsStr);
    localStorage.setItem('psy_master_backup_thinking', thinkingStr);
    localStorage.setItem('psy_master_backup_schedules', schedulesStr);
    localStorage.setItem('psy_master_backup_reminders', remindersStr);
    localStorage.setItem('psy_master_backup_trainings', trainingsStr);

    if (userId) {
      localStorage.setItem(STORAGE_KEYS.RECORDS, recordsStr);
      localStorage.setItem(STORAGE_KEYS.MENTORS, mentorsStr);
      localStorage.setItem(STORAGE_KEYS.THINKING, thinkingStr);
      localStorage.setItem(STORAGE_KEYS.SCHEDULES, schedulesStr);
      localStorage.setItem(STORAGE_KEYS.REMINDERS, remindersStr);
      localStorage.setItem(STORAGE_KEYS.TRAININGS, trainingsStr);
    }
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
      const data = result.data as SystemData;
      if (data.records && Array.isArray(data.records)) {
        data.records = data.records.map((r: any) => ({
          ...r,
          isTeenager: typeof r.isTeenager === 'boolean'
            ? r.isTeenager
            : Boolean(
                r.avatar === '👦' ||
                r.avatar === '👧' ||
                r.avatar === '👶' ||
                (r.parentSessions && Object.keys(r.parentSessions).length > 0)
              ),
          parentSessions: r.parentSessions || {},
        }));
      }
      return data;
    }
  } catch (e) {
    console.warn('Backend sync fetch warning:', e);
  }
  return null;
}
