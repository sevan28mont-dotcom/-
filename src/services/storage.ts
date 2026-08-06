import { SystemData, CaseRecord, Supervisor, ThinkingNote, ScheduleItem, ReminderItem, CounselorCredential, PersonalExperienceSetting, TrainingCourse } from '../types';

const STORAGE_KEYS = {
  RECORDS: 'psy_records_v8',
  MENTORS: 'psy_mentors_v8',
  THINKING: 'psy_thinking_v8',
  SCHEDULES: 'psy_schedules_v8',
  REMINDERS: 'psy_reminders_v8',
  TRAININGS: 'psy_trainings_v8',
  CREDENTIALS: 'psy_credentials_v8',
  EXPERIENCE: 'psy_experience_v8',
};

export const DEFAULT_EXPERIENCE: PersonalExperienceSetting = {
  totalIndividualHours: 40,
  totalGroupHours: 30,
  records: [
    {
      id: 'pe_1',
      sessionNum: 1,
      date: '2026-01-15',
      timeRange: '15:00-16:00',
      type: 'individual',
      therapistId: 'th_1',
      facilitator: '陈教授 (资深精神分析取向体验师)',
      note: '首次个体体验，探索早年成长经验与关系模式的重现。',
      completed: true,
      durationMinutes: 60,
    },
    {
      id: 'pe_2',
      sessionNum: 1,
      date: '2026-02-10',
      timeRange: '19:00-21:00',
      type: 'group',
      therapistId: 'grp_1',
      facilitator: '王老师 (团体人际互动体验小组)',
      note: '团体体验首次会谈，观察动力场在小组中的显现与人际位置。',
      completed: true,
      durationMinutes: 120,
    },
  ],
  individualTherapists: [
    {
      id: 'th_1',
      name: '陈教授 (资深精神分析取向体验师)',
      gender: '👨‍🏫 男体验师',
      title: '动力学取向个人体验',
      startDate: '2026-01-01',
      totalHours: 40,
      type: 'individual',
    },
  ],
  groupOptions: [
    {
      id: 'grp_1',
      name: '王老师 (团体人际互动体验小组)',
      facilitator: '王老师',
      gender: '👩‍🏫 女体验师',
      startDate: '2026-02-01',
      totalHours: 30,
      type: 'group',
    },
  ],
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

const DEFAULT_CREDENTIALS: CounselorCredential[] = [
  {
    id: 'cred_1',
    title: '心理治疗师 (中级卫生专业技术资格)',
    category: 'psychotherapy',
    level: '中级',
    issuingBody: '国家卫生健康委员会 / 人社部',
    issueDate: '2023-05',
    certNumber: '20230520001',
    status: 'lifetime',
    note: '通过全国卫生专业技术资格考试，具备临床心理治疗资质',
  },
  {
    id: 'cred_2',
    title: 'CPS 中国心理学会注册心理师 (3级)',
    category: 'cps',
    level: 'CPS 3级注册心理师',
    issuingBody: '中国心理学会临床心理学注册工作委员会',
    issueDate: '2024-01',
    certNumber: 'X-24-0188',
    status: 'valid',
    note: '定期完成注册系统要求的伦理学分与继续教育培训',
  },
];

export const EMPTY_SYSTEM_DATA: SystemData = {
  records: [],
  mentors: [],
  thinking: [],
  schedules: [],
  reminders: [],
  trainings: [],
  credentials: [],
  personalExperience: { totalIndividualHours: 0, totalGroupHours: 0, records: [], individualTherapists: [], groupOptions: [] },
  experienceData: { totalIndividualHours: 0, totalGroupHours: 0, records: [], individualTherapists: [], groupOptions: [] },
};

export function getDefaultSampleSystemData(): SystemData {
  const defaultExp = JSON.parse(JSON.stringify(DEFAULT_EXPERIENCE));
  return {
    records: JSON.parse(JSON.stringify(DEFAULT_RECORDS)),
    mentors: JSON.parse(JSON.stringify(DEFAULT_MENTORS)),
    thinking: JSON.parse(JSON.stringify(DEFAULT_THINKING)),
    schedules: JSON.parse(JSON.stringify(DEFAULT_SCHEDULES)),
    reminders: JSON.parse(JSON.stringify(DEFAULT_REMINDERS)),
    trainings: JSON.parse(JSON.stringify(DEFAULT_TRAININGS)),
    credentials: JSON.parse(JSON.stringify(DEFAULT_CREDENTIALS)),
    personalExperience: defaultExp,
    experienceData: defaultExp,
  };
}

export function getZeroedSystemData(): SystemData {
  return { ...EMPTY_SYSTEM_DATA };
}

/**
 * 启动与加载时的数据完整性自检与修复函数 (integrityCheck)
 * 遍历 systemData 中的所有关联 ID（如 mentor 与 case、schedule 与 case/mentor、experience 与 therapist），
 * 如果发现孤儿数据（如 mentor 绑定了或督导记录引用了不存在的 caseId），则自动清除或修正该索引，
 * 避免因渲染时缺失关联对象而导致页面崩溃。
 */
export function integrityCheck(data: SystemData): SystemData {
  if (!data || typeof data !== 'object') {
    return getDefaultSampleSystemData();
  }

  // 1. 清理与校验个案档案 (Case Records)
  const rawRecords = Array.isArray(data.records) ? data.records : [];
  const validRecords: CaseRecord[] = rawRecords
    .filter((c) => c && typeof c === 'object' && c.id)
    .map((c) => ({
      ...c,
      category: c.category || 'longTerm',
      status: c.status || 'active',
      sessions: c.sessions || {},
      parentSessions: c.parentSessions || {},
      isTeenager:
        typeof c.isTeenager === 'boolean'
          ? c.isTeenager
          : Boolean(
              c.avatar === '👦' ||
              c.avatar === '👧' ||
              c.avatar === '👶' ||
              (c.parentSessions && Object.keys(c.parentSessions).length > 0)
            ),
    }));

  const validCaseIds = new Set(validRecords.map((c) => c.id));

  // 2. 清理与校验导师/督导 (Supervisors / Mentors) 及关联绑定
  const rawMentors = Array.isArray(data.mentors) ? data.mentors : [];
  const validMentors: Supervisor[] = rawMentors
    .filter((m) => m && typeof m === 'object' && m.id)
    .map((m) => {
      // 过滤绑定的个案 ID，清除孤儿 caseId
      const boundCaseIds = Array.isArray(m.boundCaseIds)
        ? m.boundCaseIds.filter((cid) => cid && validCaseIds.has(cid))
        : [];

      // 校验活跃个案 ID
      const activeCaseId = m.activeCaseId && validCaseIds.has(m.activeCaseId) ? m.activeCaseId : null;

      // 清理督导记录中的孤儿 caseId 引用
      const rawSupRecords = Array.isArray(m.records) ? m.records : [];
      const cleanedSupRecords = rawSupRecords
        .filter((r) => r && typeof r === 'object' && r.id)
        .map((r) => {
          const caseId = r.caseId && validCaseIds.has(r.caseId) ? r.caseId : '';
          return {
            ...r,
            caseId,
          };
        });

      return {
        ...m,
        boundCaseIds,
        activeCaseId,
        records: cleanedSupRecords,
      };
    });

  const validMentorIds = new Set(validMentors.map((m) => m.id));

  // 3. 清理与校验日程记录 (Schedules) 中的关联对象
  const rawSchedules = Array.isArray(data.schedules) ? data.schedules : [];
  const validSchedules: ScheduleItem[] = rawSchedules
    .filter((s) => s && typeof s === 'object' && s.id)
    .map((s) => {
      let relatedId = s.relatedId;
      let relatedType = s.relatedType;

      if (relatedType === 'case' && relatedId && !validCaseIds.has(relatedId)) {
        relatedId = undefined;
        relatedType = undefined;
      } else if (relatedType === 'supervisor' && relatedId && !validMentorIds.has(relatedId)) {
        relatedId = undefined;
        relatedType = undefined;
      }

      return {
        ...s,
        relatedId,
        relatedType,
      };
    });

  // 4. 清理与校验个人体验 (Personal Experience) 中的关联体验师
  const expSource = data.personalExperience || data.experienceData;
  let cleanedExp: PersonalExperienceSetting | undefined = undefined;

  if (expSource && typeof expSource === 'object') {
    const individualTherapists = Array.isArray(expSource.individualTherapists)
      ? expSource.individualTherapists.filter((t: any) => t && t.id)
      : [];
    const groupOptions = Array.isArray(expSource.groupOptions)
      ? expSource.groupOptions.filter((g: any) => g && g.id)
      : [];

    const validTherapistIds = new Set([
      ...individualTherapists.map((t: any) => t.id),
      ...groupOptions.map((g: any) => g.id),
    ]);

    const rawExpRecords = Array.isArray(expSource.records) ? expSource.records : [];
    const cleanedExpRecords = rawExpRecords
      .filter((r: any) => r && typeof r === 'object' && r.id)
      .map((r: any) => {
        const therapistId = r.therapistId && validTherapistIds.has(r.therapistId) ? r.therapistId : undefined;
        return {
          ...r,
          therapistId,
        };
      });

    cleanedExp = {
      ...expSource,
      records: cleanedExpRecords,
      individualTherapists,
      groupOptions,
      totalIndividualHours: expSource.totalIndividualHours || 0,
      totalGroupHours: expSource.totalGroupHours || 0,
    };
  }

  // 5. 清理思考笔记 (Thinking Notes)
  const rawThinking = Array.isArray(data.thinking) ? data.thinking : [];
  const validThinking: ThinkingNote[] = rawThinking.filter((n) => n && typeof n === 'object' && n.id);

  // 6. 清理提醒事项 (Reminders)
  const rawReminders = Array.isArray(data.reminders) ? data.reminders : [];
  const validReminders: ReminderItem[] = rawReminders.filter((r) => r && typeof r === 'object' && r.id);

  // 7. 清理培训项目 (Trainings)
  const rawTrainings = Array.isArray(data.trainings) ? data.trainings : [];
  const validTrainings: TrainingCourse[] = rawTrainings
    .filter((t) => t && typeof t === 'object' && t.id)
    .map((t) => ({
      ...t,
      sessions: Array.isArray(t.sessions) ? t.sessions.filter((s: any) => s && s.id) : [],
    }));

  // 8. 清理资质证书 (Credentials)
  const rawCredentials = Array.isArray(data.credentials) ? data.credentials : [];
  const validCredentials: CounselorCredential[] = rawCredentials.filter((c) => c && typeof c === 'object' && c.id);

  // 9. 版本号自检与维持 (versioning)
  const versioning = typeof data.versioning === 'number' && data.versioning > 0 ? data.versioning : Date.now();

  return {
    versioning,
    records: validRecords,
    mentors: validMentors,
    thinking: validThinking,
    schedules: validSchedules,
    reminders: validReminders,
    personalExperience: cleanedExp,
    experienceData: cleanedExp,
    trainings: validTrainings,
    credentials: validCredentials,
    totalHoursOverrides: data.totalHoursOverrides || {},
  };
}

// In-memory fallback store if localStorage is restricted, disabled, or throws QuotaExceededError/SecurityError
const memoryStore: Record<string, string> = {};

function checkLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const testKey = '__psy_storage_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}

const isStorageAvailable = checkLocalStorageAvailable();

export function safeGetItem(key: string): string | null {
  try {
    if (isStorageAvailable) {
      const val = window.localStorage.getItem(key);
      if (val !== null) return val;
    }
    return memoryStore[key] !== undefined ? memoryStore[key] : null;
  } catch (e) {
    return memoryStore[key] !== undefined ? memoryStore[key] : null;
  }
}

export function safeSetItem(key: string, value: string): boolean {
  try {
    memoryStore[key] = value;
    if (isStorageAvailable) {
      window.localStorage.setItem(key, value);
    }
    return true;
  } catch (err) {
    console.warn(`[Storage] Failed writing to localStorage for key "${key}":`, err);
    return false;
  }
}

export function safeRemoveItem(key: string): void {
  try {
    delete memoryStore[key];
    if (isStorageAvailable) {
      window.localStorage.removeItem(key);
    }
  } catch (e) {
    /* ignore */
  }
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
      credentials: userId ? `${userPrefix}credentials` : STORAGE_KEYS.CREDENTIALS,
      experience: userId ? `${userPrefix}experience` : STORAGE_KEYS.EXPERIENCE,
    };

    // Helper to read from primary key or search legacy fallback keys
    const readWithFallback = (primaryKey: string, fallbackKeys: string[], defaultVal: any) => {
      const val = safeGetItem(primaryKey);
      if (val) {
        try { return JSON.parse(val); } catch (e) { /* ignore parse error */ }
      }
      for (const fKey of fallbackKeys) {
        const fallbackVal = safeGetItem(fKey);
        if (fallbackVal) {
          try {
            const parsed = JSON.parse(fallbackVal);
            safeSetItem(primaryKey, fallbackVal);
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
    const legacyCredentialsKeys = [STORAGE_KEYS.CREDENTIALS, 'psy_credentials_v8', 'psy_master_backup_credentials'];
    const legacyExperienceKeys = [STORAGE_KEYS.EXPERIENCE, 'psy_experience_v8', 'psy_master_backup_experience', `${userPrefix}experienceData`, `psy_u_${userId}_experienceData`];

    // If userId is provided, check if user-specific local storage key exists
    if (userId) {
      const existingUserRecords = safeGetItem(primaryKeys.records);
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
          const mentors = JSON.parse(safeGetItem(primaryKeys.mentors) || '[]');
          const thinking = JSON.parse(safeGetItem(primaryKeys.thinking) || '[]');
          const schedules = JSON.parse(safeGetItem(primaryKeys.schedules) || '[]');
          const reminders = JSON.parse(safeGetItem(primaryKeys.reminders) || '[]');
          const trainings = JSON.parse(safeGetItem(primaryKeys.trainings) || '[]');
          const credentials = JSON.parse(safeGetItem(primaryKeys.credentials) || JSON.stringify(DEFAULT_CREDENTIALS));
          const expRaw = safeGetItem(primaryKeys.experience) || safeGetItem(`${userPrefix}experienceData`) || safeGetItem('psy_master_backup_experience');
          const experienceData = expRaw ? JSON.parse(expRaw) : DEFAULT_EXPERIENCE;

          return integrityCheck({ records, mentors, thinking, schedules, reminders, trainings, credentials, personalExperience: experienceData, experienceData });
        } catch (e) {
          console.error('Error parsing user local storage:', e);
        }
      }

      // If user is u_default or u_demo, initialize with default sample data
      if (userId === 'u_default' || userId === 'u_demo') {
        return getDefaultSampleSystemData();
      }

      // For new custom user accounts, check if there is local experience or default data
      const fallbackExp = readWithFallback(primaryKeys.experience, legacyExperienceKeys, DEFAULT_EXPERIENCE);
      return integrityCheck({ ...EMPTY_SYSTEM_DATA, personalExperience: fallbackExp, experienceData: fallbackExp });
    }

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
    const credentials = readWithFallback(primaryKeys.credentials, legacyCredentialsKeys, DEFAULT_CREDENTIALS);
    const experienceData = readWithFallback(primaryKeys.experience, legacyExperienceKeys, DEFAULT_EXPERIENCE);

    return integrityCheck({ records, mentors, thinking, schedules, reminders, trainings, credentials, personalExperience: experienceData, experienceData });
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
      credentials: userId ? `${userPrefix}credentials` : STORAGE_KEYS.CREDENTIALS,
      experience: userId ? `${userPrefix}experience` : STORAGE_KEYS.EXPERIENCE,
    };

    const recordsStr = JSON.stringify(data.records || []);
    const mentorsStr = JSON.stringify(data.mentors || []);
    const thinkingStr = JSON.stringify(data.thinking || []);
    const schedulesStr = JSON.stringify(data.schedules || []);
    const remindersStr = JSON.stringify(data.reminders || []);
    const trainingsStr = JSON.stringify(data.trainings || []);
    const credentialsStr = JSON.stringify(data.credentials || []);
    const expObj = data.personalExperience || data.experienceData || DEFAULT_EXPERIENCE;
    const experienceDataStr = JSON.stringify(expObj);

    // Save to user / current key
    safeSetItem(keys.records, recordsStr);
    safeSetItem(keys.mentors, mentorsStr);
    safeSetItem(keys.thinking, thinkingStr);
    safeSetItem(keys.schedules, schedulesStr);
    safeSetItem(keys.reminders, remindersStr);
    safeSetItem(keys.trainings, trainingsStr);
    safeSetItem(keys.credentials, credentialsStr);
    safeSetItem(keys.experience, experienceDataStr);

    if (userId) {
      safeSetItem(`psy_u_${userId}_experienceData`, experienceDataStr);
      safeSetItem(`psy_u_${userId}_experience`, experienceDataStr);
    }

    // Save mirror copies to master backup keys only for default or legacy guest user
    if (!userId || userId === 'u_default') {
      safeSetItem('psy_master_backup_records', recordsStr);
      safeSetItem('psy_master_backup_mentors', mentorsStr);
      safeSetItem('psy_master_backup_thinking', thinkingStr);
      safeSetItem('psy_master_backup_schedules', schedulesStr);
      safeSetItem('psy_master_backup_reminders', remindersStr);
      safeSetItem('psy_master_backup_trainings', trainingsStr);
      safeSetItem('psy_master_backup_experience', experienceDataStr);

      safeSetItem(STORAGE_KEYS.RECORDS, recordsStr);
      safeSetItem(STORAGE_KEYS.MENTORS, mentorsStr);
      safeSetItem(STORAGE_KEYS.THINKING, thinkingStr);
      safeSetItem(STORAGE_KEYS.SCHEDULES, schedulesStr);
      safeSetItem(STORAGE_KEYS.REMINDERS, remindersStr);
      safeSetItem(STORAGE_KEYS.TRAININGS, trainingsStr);
      safeSetItem(STORAGE_KEYS.EXPERIENCE, experienceDataStr);
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
    Object.values(keys).forEach((k) => safeRemoveItem(k));
  } catch (err) {
    console.error('Failed to clear localStorage:', err);
  }
}

/**
 * 深度清理机制：扫描并自动清除 localStorage 中超过 30 天未被访问或过期的临时 UI 缓存、旧版冗余 key 或临时草稿，保持应用轻量极速运行
 */
export function deepCleanExpiredCaches(): { cleanedKeys: string[]; totalFreedBytes: number } {
  const cleanedKeys: string[] = [];
  let totalFreedBytes = 0;

  if (typeof window === 'undefined' || !window.localStorage) {
    return { cleanedKeys, totalFreedBytes };
  }

  try {
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();

    // 核心或长效持久化 Key 白名单 (绝不删除)
    const PROTECTED_PREFIXES = [
      'psy_records_v8',
      'psy_mentors_v8',
      'psy_thinking_v8',
      'psy_schedules_v8',
      'psy_reminders_v8',
      'psy_trainings_v8',
      'psy_credentials_v8',
      'psy_experience_v8',
      'psy_u_',
      'psy_master_backup_',
      'psy_user_session',
      'psy_theme_is_dark',
      'psy_workspace_layout_v1',
      'psy_schedule_categories_v2',
      'psy_last_deep_clean',
    ];

    const isProtectedKey = (key: string) => {
      return PROTECTED_PREFIXES.some((prefix) => key.startsWith(prefix) || key === prefix);
    };

    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // 1. 自动清除无用的历史旧版本升级残留 (如 psy_*_v1 到 v7)
      if (
        /^psy_(records|mentors|thinking|schedules|reminders|trainings|credentials|experience)_v[1-7]$/.test(key)
      ) {
        keysToRemove.push(key);
        continue;
      }

      // 绝不误删受保护的核心 Key
      if (isProtectedKey(key)) continue;

      // 2. 判断是否是显式临时 UI 缓存/预览/日志/测试 Key
      const isTemporaryCacheKey =
        key.startsWith('psy_tmp_') ||
        key.startsWith('psy_cache_') ||
        key.startsWith('psy_ui_temp_') ||
        key.startsWith('psy_draft_') ||
        key.startsWith('psy_export_') ||
        key.startsWith('psy_log_') ||
        key.startsWith('psy_search_') ||
        key.startsWith('_tmp_') ||
        key.startsWith('_test_');

      const rawVal = localStorage.getItem(key);
      if (!rawVal) continue;

      let isExpired = false;

      // 3. 检查 JSON 内部的 timestamp / updatedAt / expireAt / lastAccessed 是否超过 30 天
      try {
        const parsed = JSON.parse(rawVal);
        if (parsed && typeof parsed === 'object') {
          const itemTime =
            parsed.timestamp ||
            parsed.updatedAt ||
            parsed.createdAt ||
            parsed.lastAccessed ||
            parsed.expireAt;

          if (typeof itemTime === 'number' && now - itemTime > THIRTY_DAYS_MS) {
            isExpired = true;
          } else if (typeof itemTime === 'string') {
            const parsedMs = new Date(itemTime).getTime();
            if (!isNaN(parsedMs) && now - parsedMs > THIRTY_DAYS_MS) {
              isExpired = true;
            }
          }
        }
      } catch {
        // 如果无法解析且不是临时 key，不轻易删除；若是临时 cache 字符串则判定清理
        if (isTemporaryCacheKey) {
          isExpired = true;
        }
      }

      if (isExpired || isTemporaryCacheKey) {
        keysToRemove.push(key);
      }
    }

    // 执行清理
    keysToRemove.forEach((key) => {
      const val = localStorage.getItem(key);
      const itemSize = val ? val.length * 2 : 0;
      totalFreedBytes += itemSize;
      localStorage.removeItem(key);
      cleanedKeys.push(key);
    });

    if (cleanedKeys.length > 0) {
      console.log(
        `[Deep Clean] 深度清理完成: 自动清除了 ${cleanedKeys.length} 个超过 30 天或过期的临时 UI 缓存，释放了约 ${(totalFreedBytes / 1024).toFixed(2)} KB 内存空间。`
      );
    }

    localStorage.setItem('psy_last_deep_clean_time', String(now));
  } catch (err) {
    console.warn('[Deep Clean] 深度清理扫描警告:', err);
  }

  return { cleanedKeys, totalFreedBytes };
}

/**
 * 在线后端账号全量信息同步接口
 */
export async function saveDataToBackend(data: SystemData, userId: string = 'default'): Promise<{ success: boolean; message: string; timestamp: string }> {
  try {
    const response = await fetch(`/api/sync/save?_t=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
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
    const response = await fetch(`/api/sync/get?_t=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      cache: 'no-store',
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
      return integrityCheck(data);
    }
  } catch (e) {
    console.warn('Backend sync fetch warning:', e);
  }
  return null;
}
