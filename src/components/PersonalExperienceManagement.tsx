import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PersonalExperienceSetting, PersonalExperienceRecord, ResourceLink } from '../types';
import {
  Sparkles,
  Plus,
  Trash2,
  Calendar as CalendarIcon,
  Search,
  Pencil,
  X,
  ChevronDown,
  ChevronUp,
  User,
  Users,
  FileText,
  Mic,
  Lightbulb,
  Link as LinkIcon,
  CheckCircle2,
  Sliders,
  Printer,
  Clock,
} from 'lucide-react';
import { VoiceInputButton } from './VoiceInputButton';
import { RichTextEditor } from './RichTextEditor';
import { IdeasSection } from './IdeasSection';
import { ResourceLinkSection } from './ResourceLinkSection';

interface PersonalExperienceManagementProps {
  experienceData?: PersonalExperienceSetting;
  totalHoursOverrides?: any;
  onUpdateTotalHoursOverrides?: (newOverrides: any) => void;
  onUpdateExperienceData: (updated: PersonalExperienceSetting) => void;
  experienceTypeFilter?: 'all' | 'individual' | 'group';
  onTypeFilterChange?: (filter: 'all' | 'individual' | 'group') => void;
}

export const PersonalExperienceManagement: React.FC<PersonalExperienceManagementProps> = ({
  experienceData: rawExperienceData,
  totalHoursOverrides,
  onUpdateTotalHoursOverrides,
  onUpdateExperienceData,
  experienceTypeFilter: propTypeFilter,
  onTypeFilterChange,
}) => {
  const experienceData: PersonalExperienceSetting = {
    totalIndividualHours: 20,
    totalGroupHours: 30,
    records: [],
    individualTherapists: [],
    groupOptions: [],
    ...rawExperienceData,
  };
  const [localTypeFilter, setLocalTypeFilter] = useState<'all' | 'individual' | 'group'>('all');
  const activeTypeFilter = propTypeFilter ?? localTypeFilter;

  // 时数编辑 Modal State
  const [isEditHoursModalOpen, setIsEditHoursModalOpen] = useState(false);
  const [editingHoursType, setEditingHoursType] = useState<'individual' | 'group'>('individual');
  const [hoursInputValue, setHoursInputValue] = useState('');

  const setFilter = (filter: 'all' | 'individual' | 'group') => {
    setLocalTypeFilter(filter);
    onTypeFilterChange?.(filter);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRecordIds, setExpandedRecordIds] = useState<Record<string, boolean>>({});

  // Modal State for adding/editing a Personal Experience Record
  const [modalRecord, setModalRecord] = useState<{
    id?: string;
    sessionNum: number;
    type: 'individual' | 'group';
    date: string;
    timeRange: string;
    facilitator: string;
    note: string;
    transcript: string;
    ideas: string[];
    resources: ResourceLink[];
    completed: boolean;
  } | null>(null);

  const [modalTab, setModalTab] = useState<'note' | 'transcript' | 'ideas' | 'resources'>('note');

  // 折叠管理状态 (个体体验板块 vs 团体体验板块)
  const [isIndividualCollapsed, setIsIndividualCollapsed] = useState(false);
  const [isGroupCollapsed, setIsGroupCollapsed] = useState(false);

  // 体验师筛选状态
  const [selectedFacilitatorFilter, setSelectedFacilitatorFilter] = useState<string>('all');

  // Batch Management Modal
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchTargetType, setBatchTargetType] = useState<'individual' | 'group'>('individual');
  const [batchSelectedNums, setBatchSelectedNums] = useState<number[]>([]);
  const [batchDateStart, setBatchDateStart] = useState(() => new Date().toISOString().split('T')[0]);
  const [batchIntervalDays, setBatchIntervalDays] = useState(7);
  const [batchFacilitator, setBatchFacilitator] = useState('');
  const [batchNote, setBatchNote] = useState('');

  // 动态新增个人体验师表单 State
  const [newIndivName, setNewIndivName] = useState('');
  const [newIndivGender, setNewIndivGender] = useState('👨‍🏫 男体验师');
  const [newIndivStartDate, setNewIndivStartDate] = useState('2026-01-01');
  const [newIndivEndDate, setNewIndivEndDate] = useState('2026-12-31');
  const [newIndivTotalHours, setNewIndivTotalHours] = useState<number | string>(20);

  // 动态新增团体体验表单 State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupFacilitator, setNewGroupFacilitator] = useState('张带领者');
  const [newGroupStartDate, setNewGroupStartDate] = useState('2026-01-01');
  const [newGroupEndDate, setNewGroupEndDate] = useState('2026-12-31');
  const [newGroupTotalHours, setNewGroupTotalHours] = useState<number | string>(20);

  // 编辑体验师 / 团体 Modal State
  const [editingItemModal, setEditingItemModal] = useState<{
    id: string;
    type: 'individual' | 'group';
    name: string;
    genderOrFacilitator: string;
    startDate: string;
    endDate: string;
    totalHours: number;
  } | null>(null);

  const records = experienceData.records || [];
  const individualRecords = records.filter((r) => r.type === 'individual');
  const groupRecords = records.filter((r) => r.type === 'group');

  // 个人体验师与团体选项的数据初始化
  const defaultIndividualTherapists = [
    { id: 'indiv_therapist_1', name: '个人体验师 1', gender: '👨‍🏫 男体验师', title: '体验分析师', startDate: '2026-01-01', endDate: '2026-12-31', totalHours: 20 },
  ];

  const defaultGroupOptions = [
    { id: 'group_opt_1', name: '东方心理团体', facilitator: '带领者 A', startDate: '2026-01-01', endDate: '2026-12-31', totalHours: 20 },
    { id: 'group_opt_2', name: '遇见团体', facilitator: '带领者 B', startDate: '2026-01-01', endDate: '2026-12-31', totalHours: 20 },
  ];

  const individualTherapists = Array.isArray(experienceData.individualTherapists)
    ? experienceData.individualTherapists
    : defaultIndividualTherapists;

  const groupOptions = Array.isArray(experienceData.groupOptions)
    ? experienceData.groupOptions
    : defaultGroupOptions;

  // --- 个人体验师 Handlers ---
  const handleCreateIndividualTherapist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndivName.trim()) {
      alert('请输入体验师姓名！');
      return;
    }
    const hours = Number(newIndivTotalHours) || 20;
    const newTherapist = {
      id: `therapist_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newIndivName.trim(),
      gender: newIndivGender,
      title: newIndivGender,
      startDate: newIndivStartDate || '2026-01-01',
      endDate: newIndivEndDate || '2026-12-31',
      totalHours: hours,
      type: 'individual' as const,
    };
    const updated = [...individualTherapists, newTherapist];
    onUpdateExperienceData({
      ...experienceData,
      individualTherapists: updated,
      totalIndividualHours: Math.max(experienceData.totalIndividualHours || 0, hours),
    });
    setNewIndivName('');
  };

  // --- 团体体验 Handlers ---
  const handleCreateGroupOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert('请输入团体/小组名称！');
      return;
    }
    const hours = Number(newGroupTotalHours) || 20;
    const newGroup = {
      id: `group_opt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newGroupName.trim(),
      facilitator: newGroupFacilitator.trim() || '带领者',
      startDate: newGroupStartDate || '2026-01-01',
      endDate: newGroupEndDate || '2026-12-31',
      totalHours: hours,
      type: 'group' as const,
    };
    const updated = [...groupOptions, newGroup];
    onUpdateExperienceData({
      ...experienceData,
      groupOptions: updated,
      totalGroupHours: Math.max(experienceData.totalGroupHours || 0, hours),
    });
    setNewGroupName('');
  };

  const handleSaveEditedItem = () => {
    if (!editingItemModal) return;
    const hours = Number(editingItemModal.totalHours) || 20;
    if (editingItemModal.type === 'individual') {
      const updated = individualTherapists.map((t) =>
        t.id === editingItemModal.id
          ? {
              ...t,
              name: editingItemModal.name.trim(),
              gender: editingItemModal.genderOrFacilitator,
              title: editingItemModal.genderOrFacilitator,
              startDate: editingItemModal.startDate,
              endDate: editingItemModal.endDate,
              totalHours: hours,
            }
          : t
      );
      onUpdateExperienceData({
        ...experienceData,
        individualTherapists: updated,
        totalIndividualHours: Math.max(experienceData.totalIndividualHours || 0, hours),
      });
    } else {
      const updated = groupOptions.map((g) =>
        g.id === editingItemModal.id
          ? {
              ...g,
              name: editingItemModal.name.trim(),
              facilitator: editingItemModal.genderOrFacilitator,
              startDate: editingItemModal.startDate,
              endDate: editingItemModal.endDate,
              totalHours: hours,
            }
          : g
      );
      onUpdateExperienceData({
        ...experienceData,
        groupOptions: updated,
        totalGroupHours: Math.max(experienceData.totalGroupHours || 0, hours),
      });
    }
    setEditingItemModal(null);
  };

  const handleDeleteTherapistItem = (id: string, name: string, type: 'individual' | 'group') => {
    const typeLabel = type === 'individual' ? '个人体验师' : '团体体验';
    if (!window.confirm(`⚠️ 警示：确定要彻底删除【${name}】(${typeLabel}) 及其所有关联的打卡记录、会谈逐字稿与反思笔记吗？\n\n此操作不可撤销，请确认！`)) {
      return;
    }
    if (type === 'individual') {
      const updatedIndiv = individualTherapists.filter((t) => t.id !== id);
      const updatedRecords = records.filter((r) => r.therapistId !== id && r.facilitator !== name);
      onUpdateExperienceData({
        ...experienceData,
        individualTherapists: updatedIndiv,
        records: updatedRecords,
      });
    } else {
      const updatedGroup = groupOptions.filter((g) => g.id !== id);
      const updatedRecords = records.filter((r) => r.therapistId !== id && r.facilitator !== name);
      onUpdateExperienceData({
        ...experienceData,
        groupOptions: updatedGroup,
        records: updatedRecords,
      });
    }
  };

  // 自动搜集与提炼已有的体验师/带领者名单
  const existingFacilitators = Array.from(
    new Set(records.map((r) => r.facilitator?.trim()).filter(Boolean))
  ) as string[];
  const therapistNames = individualTherapists.map((t) => t.name);
  const groupNames = groupOptions.map((g) => g.name);
  const allPresetFacilitators = Array.from(
    new Set([...existingFacilitators, ...therapistNames, ...groupNames, '张体验师', '李带领者'])
  );

  const completedIndividualCount = individualRecords.filter((r) => r.completed !== false).length;
  const completedGroupCount = groupRecords.filter((r) => r.completed !== false).length;

  const sumTherapistsHours = individualTherapists.reduce((sum, t) => sum + (Number(t.totalHours) || 0), 0);
  const maxIndivTherapistHours = Math.max(0, ...individualTherapists.map((t) => t.totalHours || 0));
  const maxIndivRecNum = Math.max(0, ...individualRecords.map((r) => r.sessionNum || 0));
  const totalIndividualCount = Math.max(
    20,
    experienceData.totalIndividualHours || 0,
    sumTherapistsHours,
    maxIndivTherapistHours,
    maxIndivRecNum
  );

  const sumGroupHours = groupOptions.reduce((sum, g) => sum + (Number(g.totalHours) || 0), 0);
  const maxGroupOptionHours = Math.max(0, ...groupOptions.map((g) => g.totalHours || 0));
  const maxGroupRecNum = Math.max(0, ...groupRecords.map((r) => r.sessionNum || 0));
  const totalGroupCount = Math.max(
    30,
    experienceData.totalGroupHours || 0,
    sumGroupHours,
    maxGroupOptionHours,
    maxGroupRecNum
  );

  const filteredRecords = records.filter((rec) => {
    if (activeTypeFilter !== 'all' && rec.type !== activeTypeFilter) {
      return false;
    }
    if (selectedFacilitatorFilter !== 'all') {
      if ((rec.facilitator || '').trim() !== selectedFacilitatorFilter) {
        return false;
      }
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const matchFacilitator = (rec.facilitator || '').toLowerCase().includes(q);
    const matchNote = (rec.note || '').toLowerCase().includes(q);
    const matchTranscript = (rec.transcript || '').toLowerCase().includes(q);
    const matchDate = (rec.date || '').includes(q);
    return matchFacilitator || matchNote || matchTranscript || matchDate;
  });

  const handleOpenAddModal = (type: 'individual' | 'group', sessionNum?: number) => {
    const typeRecords = type === 'individual' ? individualRecords : groupRecords;
    const nextNum = sessionNum || typeRecords.length + 1;
    const existing = typeRecords.find((r) => r.sessionNum === nextNum);

    if (existing) {
      setModalRecord({
        id: existing.id,
        sessionNum: existing.sessionNum,
        type: existing.type,
        date: existing.date || new Date().toISOString().split('T')[0],
        timeRange: existing.timeRange || '14:00-15:00',
        facilitator: existing.facilitator || '',
        note: existing.note || '',
        transcript: existing.transcript || '',
        ideas: existing.ideas || [],
        resources: existing.resources || [],
        completed: existing.completed !== false,
      });
    } else {
      setModalRecord({
        sessionNum: nextNum,
        type,
        date: new Date().toISOString().split('T')[0],
        timeRange: '14:00-15:00',
        facilitator: '',
        note: '',
        transcript: '',
        ideas: [],
        resources: [],
        completed: true,
      });
    }
    setModalTab('note');
  };

  const handleOpenEditModal = (rec: PersonalExperienceRecord) => {
    setModalRecord({
      id: rec.id,
      sessionNum: rec.sessionNum,
      type: rec.type,
      date: rec.date || new Date().toISOString().split('T')[0],
      timeRange: rec.timeRange || '14:00-15:00',
      facilitator: rec.facilitator || '',
      note: rec.note || '',
      transcript: rec.transcript || '',
      ideas: rec.ideas || [],
      resources: rec.resources || [],
      completed: rec.completed !== false,
    });
    setModalTab('note');
  };

  const handleSaveModalRecord = () => {
    if (!modalRecord) return;

    let updatedList = [...records];
    if (modalRecord.id) {
      updatedList = updatedList.map((r) =>
        r.id === modalRecord.id
          ? {
              ...r,
              sessionNum: modalRecord.sessionNum,
              type: modalRecord.type,
              date: modalRecord.date,
              timeRange: modalRecord.timeRange,
              facilitator: modalRecord.facilitator,
              note: modalRecord.note,
              transcript: modalRecord.transcript,
              ideas: modalRecord.ideas,
              resources: modalRecord.resources,
              completed: modalRecord.completed !== false,
            }
          : r
      );
    } else {
      const newRec: PersonalExperienceRecord = {
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        sessionNum: modalRecord.sessionNum,
        type: modalRecord.type,
        date: modalRecord.date || new Date().toISOString().split('T')[0],
        timeRange: modalRecord.timeRange,
        facilitator: modalRecord.facilitator,
        note: modalRecord.note,
        transcript: modalRecord.transcript,
        ideas: modalRecord.ideas,
        resources: modalRecord.resources,
        completed: modalRecord.completed !== false,
      };
      updatedList.push(newRec);
    }

    onUpdateExperienceData({
      ...experienceData,
      records: updatedList,
    });
    setModalRecord(null);
  };

  const handleDeleteRecord = (id: string) => {
    if (!window.confirm('⚠️ 警示：确定要删除此条个人体验记录及其所有的逐字稿、反思和体悟吗？此操作不可恢复！')) return;
    const updatedList = records.filter((r) => r.id !== id);
    onUpdateExperienceData({
      ...experienceData,
      records: updatedList,
    });
  };

  const handleUpdateTotalHours = (type: 'individual' | 'group') => {
    const currentVal = type === 'individual' ? totalIndividualCount : totalGroupCount;
    const nameStr = type === 'individual' ? '个体体验' : '团体体验';
    const input = window.prompt(`请输入【${nameStr}】的总设置额度/次数:`, String(currentVal));
    if (input !== null) {
      const num = parseInt(input, 10);
      if (!isNaN(num) && num > 0) {
        onUpdateExperienceData({
          ...experienceData,
          totalIndividualHours: type === 'individual' ? num : experienceData.totalIndividualHours,
          totalGroupHours: type === 'group' ? num : experienceData.totalGroupHours,
        });
      }
    }
  };

  const handleOpenBatchModalForType = (type: 'individual' | 'group') => {
    setBatchTargetType(type);
    setBatchSelectedNums([]);
    setIsBatchModalOpen(true);
  };

  // Batch fill operations
  const handleApplyBatchFill = () => {
    if (batchSelectedNums.length === 0) {
      alert('请至少勾选选择一个需要批量填报的体验次数！');
      return;
    }

    let currentRecords = [...records];
    const baseDate = new Date(batchDateStart);

    batchSelectedNums.forEach((num, index) => {
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + index * batchIntervalDays);
      const dateStr = targetDate.toISOString().split('T')[0];

      const existingIndex = currentRecords.findIndex(
        (r) => r.type === batchTargetType && r.sessionNum === num
      );

      if (existingIndex >= 0) {
        currentRecords[existingIndex] = {
          ...currentRecords[existingIndex],
          date: dateStr,
          facilitator: batchFacilitator || currentRecords[existingIndex].facilitator,
          note: batchNote ? `${currentRecords[existingIndex].note}\n${batchNote}` : currentRecords[existingIndex].note,
          completed: true,
        };
      } else {
        currentRecords.push({
          id: `exp_batch_${Date.now()}_${num}`,
          sessionNum: num,
          type: batchTargetType,
          date: dateStr,
          timeRange: '14:00-15:00',
          facilitator: batchFacilitator || (batchTargetType === 'individual' ? '体验分析师' : '团体带领者'),
          note: batchNote || `第 ${num} 次${batchTargetType === 'individual' ? '个体' : '团体'}体验记录`,
          completed: true,
        });
      }
    });

    onUpdateExperienceData({
      ...experienceData,
      records: currentRecords,
    });

    alert(`已成功为 ${batchSelectedNums.length} 次【${batchTargetType === 'individual' ? '个体体验' : '团体体验'}】批量排程与填报记录！`);
    setIsBatchModalOpen(false);
    setBatchSelectedNums([]);
  };

  const handleApplyBatchFacilitatorChange = () => {
    if (batchSelectedNums.length === 0) {
      alert('请至少勾选选择一个体验次数！');
      return;
    }
    if (!batchFacilitator.trim()) {
      alert('请先在下方输入或选择目标【体验分析师 / 团体带领者】名称（例如：张体验师）！');
      return;
    }

    let currentRecords = [...records];
    const setNums = new Set(batchSelectedNums);

    batchSelectedNums.forEach((num) => {
      const existingIndex = currentRecords.findIndex(
        (r) => r.type === batchTargetType && r.sessionNum === num
      );
      if (existingIndex >= 0) {
        currentRecords[existingIndex] = {
          ...currentRecords[existingIndex],
          facilitator: batchFacilitator.trim(),
        };
      } else {
        currentRecords.push({
          id: `exp_batch_${Date.now()}_${num}`,
          sessionNum: num,
          type: batchTargetType,
          date: new Date().toISOString().split('T')[0],
          timeRange: '14:00-15:00',
          facilitator: batchFacilitator.trim(),
          note: batchNote || `第 ${num} 次${batchTargetType === 'individual' ? '个体' : '团体'}体验记录`,
          completed: true,
        });
      }
    });

    onUpdateExperienceData({
      ...experienceData,
      records: currentRecords,
    });

    alert(`已成功将 ${batchSelectedNums.length} 项【${batchTargetType === 'individual' ? '个体体验' : '团体体验'}】的体验师/带领者批量更名为【${batchFacilitator.trim()}】！`);
    setIsBatchModalOpen(false);
    setBatchSelectedNums([]);
  };

  const handleApplyBatchDelete = () => {
    if (batchSelectedNums.length === 0) {
      alert('请至少勾选选择一个需要批量清空/删除的体验次数！');
      return;
    }
    if (!window.confirm(`确定要批量清空已勾选的 ${batchSelectedNums.length} 项【${batchTargetType === 'individual' ? '个体体验' : '团体体验'}】记录吗？`)) {
      return;
    }

    const setNums = new Set(batchSelectedNums);
    const updatedRecords = records.filter(
      (r) => !(r.type === batchTargetType && setNums.has(r.sessionNum))
    );

    onUpdateExperienceData({
      ...experienceData,
      records: updatedRecords,
    });

    alert(`已彻底批量清空 ${batchSelectedNums.length} 项【${batchTargetType === 'individual' ? '个体体验' : '团体体验'}】记录！`);
    setIsBatchModalOpen(false);
    setBatchSelectedNums([]);
  };

  const handleApplyBatchMarkCompleted = () => {
    if (batchSelectedNums.length === 0) {
      alert('请至少勾选选择一个需要标记为【已全部完成/已录入】的体验次数！');
      return;
    }

    let currentRecords = [...records];
    const baseDate = new Date(batchDateStart);

    batchSelectedNums.forEach((num, index) => {
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + index * batchIntervalDays);
      const dateStr = targetDate.toISOString().split('T')[0];

      const existingIndex = currentRecords.findIndex(
        (r) => r.type === batchTargetType && r.sessionNum === num
      );

      if (existingIndex >= 0) {
        currentRecords[existingIndex] = {
          ...currentRecords[existingIndex],
          date: currentRecords[existingIndex].date || dateStr,
          facilitator: batchFacilitator || currentRecords[existingIndex].facilitator,
          completed: true,
        };
      } else {
        currentRecords.push({
          id: `exp_batch_done_${Date.now()}_${num}_${Math.random().toString(36).substring(2, 6)}`,
          sessionNum: num,
          type: batchTargetType,
          date: dateStr,
          timeRange: '14:00-15:00',
          facilitator: batchFacilitator || (batchTargetType === 'individual' ? '体验分析师' : '团体带领者'),
          note: batchNote || `第 ${num} 次${batchTargetType === 'individual' ? '个体' : '团体'}体验 (已全部完成录入)`,
          completed: true,
        });
      }
    });

    const maxSession = Math.max(0, ...batchSelectedNums);
    onUpdateExperienceData({
      ...experienceData,
      records: currentRecords,
      ...(batchTargetType === 'individual'
        ? { totalIndividualHours: Math.max(experienceData.totalIndividualHours || 0, maxSession) }
        : { totalGroupHours: Math.max(experienceData.totalGroupHours || 0, maxSession) }),
    });

    alert(`🎉 已成功将 ${batchSelectedNums.length} 项【${batchTargetType === 'individual' ? '个体体验' : '团体体验'}】批量标记为【已全部完成/已录入】，现已完全计入累计体验总数中！`);
    setIsBatchModalOpen(false);
    setBatchSelectedNums([]);
  };

  const handleQuickCompleteAllForTherapist = (therapistId: string, name: string, totalHours: number, type: 'individual' | 'group') => {
    if (!window.confirm(`确定要将【${name}】的全部 ${totalHours} 小时体验一键标记为【已全部完成/已录入】吗？\n\n标记后，此 ${totalHours} 小时将完全计入自我成长体验总额中。`)) {
      return;
    }

    let currentRecords = [...records];
    const today = new Date().toISOString().split('T')[0];

    for (let num = 1; num <= totalHours; num++) {
      const existingIndex = currentRecords.findIndex(
        (r) => r.type === type && (r.therapistId === therapistId || r.facilitator === name) && r.sessionNum === num
      );

      if (existingIndex >= 0) {
        currentRecords[existingIndex] = {
          ...currentRecords[existingIndex],
          completed: true,
          date: currentRecords[existingIndex].date || today,
          facilitator: name,
        };
      } else {
        currentRecords.push({
          id: `exp_quick_done_${Date.now()}_${num}_${Math.random().toString(36).substring(2, 6)}`,
          sessionNum: num,
          type: type,
          therapistId: therapistId,
          date: today,
          timeRange: '14:00-15:00',
          facilitator: name,
          note: `第 ${num} 次${type === 'individual' ? '个体' : '团体'}体验 (已全部打卡完成)`,
          completed: true,
        });
      }
    }

    onUpdateExperienceData({
      ...experienceData,
      records: currentRecords,
      ...(type === 'individual'
        ? { totalIndividualHours: Math.max(experienceData.totalIndividualHours || 0, totalHours) }
        : { totalGroupHours: Math.max(experienceData.totalGroupHours || 0, totalHours) }),
    });

    alert(`🎉 已成功将【${name}】的 ${totalHours} 小时体验全部标记为【已完成】，已完全计入总额！`);
  };

  const displayIndivExpHours = totalHoursOverrides?.individualExperienceHours !== undefined
    ? totalHoursOverrides.individualExperienceHours
    : completedIndividualCount;

  const displayGroupExpHours = totalHoursOverrides?.groupExperienceHours !== undefined
    ? totalHoursOverrides.groupExperienceHours
    : completedGroupCount;

  return (
    <div className="space-y-6">
      {/* 1. 顶部大标题卡片 */}
      <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">🧘</span>
              <h2 className="text-2xl font-black text-zinc-800 dark:text-slate-100 tracking-tight">
                {activeTypeFilter === 'individual'
                  ? '自我成长  个人体验'
                  : activeTypeFilter === 'group'
                  ? '自我成长  团体体验'
                  : '自我成长  个人与团体体验'}
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-full border border-purple-200 dark:border-purple-800">
                {activeTypeFilter === 'individual'
                  ? '个人体验与分析师管理'
                  : activeTypeFilter === 'group'
                  ? '团体体验与小组活动管理'
                  : '自我体验与分析档案'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 font-medium">
              包含【个体体验】与【团体体验】两大核心板块，记录体验分析师、反思悟道、会谈逐字稿与学习资源
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 可编辑个人体验时数按钮 */}
            {(activeTypeFilter === 'individual' || activeTypeFilter === 'all') && (
              <button
                type="button"
                onClick={() => {
                  setEditingHoursType('individual');
                  setHoursInputValue(String(displayIndivExpHours));
                  setIsEditHoursModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/60 dark:hover:bg-sky-900/80 text-sky-900 dark:text-sky-200 border border-sky-300 dark:border-sky-700 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer"
                title="点击编辑/修改个体体验累计时数"
              >
                <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>个体体验: <strong>{displayIndivExpHours}</strong> 小时</span>
                <Pencil className="w-3 h-3 text-sky-600 dark:text-sky-400 opacity-80" />
              </button>
            )}

            {(activeTypeFilter === 'group' || activeTypeFilter === 'all') && (
              <button
                type="button"
                onClick={() => {
                  setEditingHoursType('group');
                  setHoursInputValue(String(displayGroupExpHours));
                  setIsEditHoursModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 rounded-full text-xs font-bold transition shadow-2xs cursor-pointer"
                title="点击编辑/修改团体体验累计时数"
              >
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>团体体验: <strong>{displayGroupExpHours}</strong> 小时</span>
                <Pencil className="w-3 h-3 text-emerald-600 dark:text-emerald-400 opacity-80" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Sliders className="w-4 h-4 text-purple-200" />
              <span>⚡ 批量管理体验次数</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. 动态新增卡片区 (支持起止时间与额度) */}
      {(activeTypeFilter === 'all' || activeTypeFilter === 'individual') && (
        <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-sky-100 dark:border-slate-800 pb-2.5">
            <Plus className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-slate-100">
              + 动态新增个人体验师 (支持起止时间与额度)
            </h3>
          </div>

          <form onSubmit={handleCreateIndividualTherapist} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs pt-1">
            <div className="lg:col-span-1">
              <label className="block font-bold text-zinc-700 dark:text-slate-300 mb-1">
                体验师姓名 *
              </label>
              <input
                type="text"
                placeholder="如: 张体验师 / 体验师 1"
                value={newIndivName}
                onChange={(e) => setNewIndivName(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block font-bold text-zinc-700 dark:text-slate-300 mb-1">
                性别 / 称谓
              </label>
              <select
                value={newIndivGender}
                onChange={(e) => setNewIndivGender(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl font-bold"
              >
                <option value="👨‍🏫 男体验师">👨‍🏫 男体验师</option>
                <option value="👩‍🏫 女体验师">👩‍🏫 女体验师</option>
                <option value="🧘 体验分析师">🧘 体验分析师</option>
              </select>
            </div>

            <div className="lg:col-span-1">
              <label className="block font-bold text-zinc-700 dark:text-slate-300 mb-1">
                体验起始时间
              </label>
              <input
                type="date"
                value={newIndivStartDate}
                onChange={(e) => setNewIndivStartDate(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-zinc-700 dark:text-slate-300">
                  体验终止时间
                </label>
                <button
                  type="button"
                  onClick={() => setNewIndivEndDate('正在持续中')}
                  className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 rounded-md border border-emerald-300 dark:border-emerald-700 transition cursor-pointer"
                  title="设定为正在持续中"
                >
                  ⚡ 正在持续中
                </button>
              </div>
              <input
                type="text"
                placeholder="YYYY-MM-DD 或 正在持续中"
                value={newIndivEndDate}
                onChange={(e) => setNewIndivEndDate(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block font-bold text-zinc-700 dark:text-slate-300 mb-1">
                体验总小时额度 (0.5h起)
              </label>
              <input
                type="number"
                step="0.5"
                min={0.5}
                value={newIndivTotalHours}
                onChange={(e) => setNewIndivTotalHours(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div className="lg:col-span-1 flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ 新增体验师</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {(activeTypeFilter === 'all' || activeTypeFilter === 'group') && (
        <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2 border-b border-purple-100 dark:border-slate-800 pb-2.5">
            <Plus className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h3 className="font-bold text-sm text-zinc-900 dark:text-slate-100">
              + 动态新增团体体验 (支持起止时间与额度)
            </h3>
          </div>

          <form onSubmit={handleCreateGroupOption} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs pt-1">
            <div className="lg:col-span-1">
              <label className="block font-bold text-zinc-700 dark:text-slate-300 mb-1">
                团体/小组名称 *
              </label>
              <input
                type="text"
                placeholder="如: 东方心理团体 / 遇见团体"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block font-bold text-zinc-700 dark:text-slate-300 mb-1">
                带领者 / 导师
              </label>
              <input
                type="text"
                placeholder="如: 张带领者"
                value={newGroupFacilitator}
                onChange={(e) => setNewGroupFacilitator(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block font-bold text-zinc-700 dark:text-slate-300 mb-1">
                团体起始时间
              </label>
              <input
                type="date"
                value={newGroupStartDate}
                onChange={(e) => setNewGroupStartDate(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 rounded-xl"
              />
            </div>

            <div className="lg:col-span-1">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-bold text-zinc-700 dark:text-slate-300">
                  团体终止时间
                </label>
                <button
                  type="button"
                  onClick={() => setNewGroupEndDate('正在持续中')}
                  className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 rounded-md border border-emerald-300 dark:border-emerald-700 transition cursor-pointer"
                  title="设定为正在持续中"
                >
                  ⚡ 正在持续中
                </button>
              </div>
              <input
                type="text"
                placeholder="YYYY-MM-DD 或 正在持续中"
                value={newGroupEndDate}
                onChange={(e) => setNewGroupEndDate(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 rounded-xl font-medium"
              />
            </div>

            <div className="lg:col-span-1">
              <label className="block font-bold text-zinc-700 dark:text-slate-300 mb-1">
                团体总小时额度 (0.5h起)
              </label>
              <input
                type="number"
                step="0.5"
                min={0.5}
                value={newGroupTotalHours}
                onChange={(e) => setNewGroupTotalHours(e.target.value)}
                className="w-full p-2 bg-white dark:bg-slate-800 border border-purple-200 dark:border-slate-700 rounded-xl font-bold"
              />
            </div>

            <div className="lg:col-span-1 flex items-end">
              <button
                type="submit"
                className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-1 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ 新增团体体验</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. 动态体验卡片主体呈现 (像督导与案例板块一样) */}
      <div className="flex flex-col gap-6">
        {/* 个人体验师列表 */}
        {(activeTypeFilter === 'all' || activeTypeFilter === 'individual') &&
          individualTherapists.map((therapist) => {
            const therapistRecords = records.filter(
              (r) => r.type === 'individual' && (r.therapistId === therapist.id || r.facilitator === therapist.name)
            );
            const totalHours = therapist.totalHours || 20;

            return (
              <div
                key={therapist.id}
                className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 animate-fadeIn"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 rounded-xl text-lg font-black">
                      {therapist.gender?.includes('女') ? '👩‍🏫' : '👨‍🏫'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-zinc-900 dark:text-slate-100">
                          {therapist.name}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 rounded-lg border border-sky-200 dark:border-sky-800">
                          {therapist.gender || therapist.title || '个人体验师'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>🗓️ 时间范围: {therapist.startDate || '2026-01-01'} ~ {(!therapist.endDate || therapist.endDate.includes('持续') || therapist.endDate === '正在持续中') ? (
                          <span className="inline-flex items-center gap-1 font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-700 animate-pulse">
                            🔥 正在持续中
                          </span>
                        ) : (
                          therapist.endDate
                        )}</span>
                        <span>•</span>
                        <span>🎯 体验额度: 共 <strong>{totalHours}</strong> 小时</span>
                        <span>•</span>
                        <span>已录入: <strong className="text-sky-600 dark:text-sky-400">{therapistRecords.length}</strong> / {totalHours} 小时</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingItemModal({
                          id: therapist.id,
                          type: 'individual',
                          name: therapist.name,
                          genderOrFacilitator: therapist.gender || therapist.title || '👨‍🏫 男体验师',
                          startDate: therapist.startDate || '2026-01-01',
                          endDate: therapist.endDate || '2026-12-31',
                          totalHours: therapist.totalHours || 20,
                        })
                      }
                      className="px-2.5 py-1 text-xs font-bold bg-sky-50 hover:bg-sky-100 dark:bg-slate-800 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>编辑体验师</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteTherapistItem(therapist.id, therapist.name, 'individual');
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-300 dark:hover:text-white border border-rose-200 dark:border-rose-900/60 hover:border-rose-600 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs group touch-manipulation select-none min-h-[36px]"
                      title="彻底删除此体验师名录及其所有体验记录"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
                      <span>删除体验师</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenBatchModalForType('individual')}
                      className="px-2.5 py-1 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>批量管理</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleQuickCompleteAllForTherapist(therapist.id, therapist.name, totalHours, 'individual');
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95 touch-manipulation select-none min-h-[32px]"
                      title="一键将该体验师的全部次额度打卡标记为已完成并计入总额"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>已全部完成</span>
                    </button>
                  </div>
                </div>

                {/* 次数进度打卡节点网格 */}
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 pt-1">
                  {Array.from({ length: totalHours }, (_, idx) => {
                    const num = idx + 1;
                    const rec = therapistRecords.find((r) => r.sessionNum === num);
                    const hasRec = Boolean(rec && rec.completed !== false);

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setModalRecord({
                            id: rec?.id,
                            sessionNum: num,
                            type: 'individual',
                            date: rec?.date || new Date().toISOString().split('T')[0],
                            timeRange: rec?.timeRange || '14:00-15:00',
                            facilitator: therapist.name,
                            note: rec?.note || '',
                            transcript: rec?.transcript || '',
                            ideas: rec?.ideas || [],
                            resources: rec?.resources || [],
                            completed: rec?.completed !== false,
                          });
                          setModalTab('note');
                        }}
                        className={`p-1.5 min-h-10 border rounded-xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
                          hasRec
                            ? 'bg-sky-600 text-white border-sky-700 dark:bg-sky-600 dark:border-sky-500'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-sky-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-slate-700'
                        }`}
                        title={hasRec ? `第 ${num} 次体验已记录 (点击编辑)` : `第 ${num} 次体验未录入 (点击新增打卡)`}
                      >
                        <span>{num}次</span>
                        {hasRec && <span className="text-[9px] opacity-90 scale-90">已打卡</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

        {/* 团体体验项目列表 */}
        {(activeTypeFilter === 'all' || activeTypeFilter === 'group') &&
          groupOptions.map((group) => {
            const groupRecordsList = records.filter(
              (r) => r.type === 'group' && (r.therapistId === group.id || r.facilitator === group.name)
            );
            const totalHours = group.totalHours || 20;

            return (
              <div
                key={group.id}
                className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4 animate-fadeIn"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 rounded-xl text-lg font-black">
                      👥
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-base text-zinc-900 dark:text-slate-100">
                          {group.name}
                        </h3>
                        <span className="text-[11px] font-bold px-2 py-0.5 bg-purple-50 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 rounded-lg border border-purple-200 dark:border-purple-800">
                          带领者: {group.facilitator || '未指定'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>🗓️ 时间范围: {group.startDate || '2026-01-01'} ~ {(!group.endDate || group.endDate.includes('持续') || group.endDate === '正在持续中') ? (
                          <span className="inline-flex items-center gap-1 font-bold px-1.5 py-0.2 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 rounded border border-emerald-300 dark:border-emerald-700 animate-pulse">
                            🔥 正在持续中
                          </span>
                        ) : (
                          group.endDate
                        )}</span>
                        <span>•</span>
                        <span>🎯 团体额度: 共 <strong>{totalHours}</strong> 小时</span>
                        <span>•</span>
                        <span>已录入: <strong className="text-purple-600 dark:text-purple-400">{groupRecordsList.length}</strong> / {totalHours} 小时</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setEditingItemModal({
                          id: group.id,
                          type: 'group',
                          name: group.name,
                          genderOrFacilitator: group.facilitator || '张带领者',
                          startDate: group.startDate || '2026-01-01',
                          endDate: group.endDate || '2026-12-31',
                          totalHours: group.totalHours || 20,
                        })
                      }
                      className="px-2.5 py-1 text-xs font-bold bg-purple-50 hover:bg-purple-100 dark:bg-slate-800 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-slate-700 rounded-lg transition cursor-pointer flex items-center gap-1 active:scale-95"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>编辑团体</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteTherapistItem(group.id, group.name, 'group');
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-300 dark:hover:text-white border border-rose-200 dark:border-rose-900/60 hover:border-rose-600 rounded-lg transition-all duration-200 cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs group touch-manipulation select-none min-h-[36px]"
                      title="彻底删除此团体选项及其所有体验记录"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
                      <span>删除团体</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenBatchModalForType('group')}
                      className="px-2.5 py-1 text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>批量管理</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleQuickCompleteAllForTherapist(group.id, group.name, totalHours, 'group');
                      }}
                      onMouseDown={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      className="px-2.5 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer flex items-center gap-1 shadow-2xs active:scale-95 touch-manipulation select-none min-h-[32px]"
                      title="一键将该团体项目的全部次额度打卡标记为已完成并计入总额"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>已全部完成</span>
                    </button>
                  </div>
                </div>

                {/* 次数节点打卡网格 */}
                <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-1.5 pt-1">
                  {Array.from({ length: totalHours }, (_, idx) => {
                    const num = idx + 1;
                    const rec = groupRecordsList.find((r) => r.sessionNum === num);
                    const hasRec = Boolean(rec && rec.completed !== false);

                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          setModalRecord({
                            id: rec?.id,
                            sessionNum: num,
                            type: 'group',
                            date: rec?.date || new Date().toISOString().split('T')[0],
                            timeRange: rec?.timeRange || '14:00-15:00',
                            facilitator: group.name,
                            note: rec?.note || '',
                            transcript: rec?.transcript || '',
                            ideas: rec?.ideas || [],
                            resources: rec?.resources || [],
                            completed: rec?.completed !== false,
                          });
                          setModalTab('note');
                        }}
                        className={`p-1.5 min-h-10 border rounded-xl text-xs font-bold transition flex flex-col items-center justify-center cursor-pointer shadow-2xs ${
                          hasRec
                            ? 'bg-purple-600 text-white border-purple-700 dark:bg-purple-600 dark:border-purple-500'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-purple-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-slate-700'
                        }`}
                        title={hasRec ? `第 ${num} 次团体记录 (点击编辑)` : `第 ${num} 次团体未录入 (点击新增打卡)`}
                      >
                        <span>{num}次</span>
                        {hasRec && <span className="text-[9px] opacity-90 scale-90">已打卡</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>

      {/* 3. 搜索与板块筛选 Filter Bar */}
      <div className="bg-white border border-purple-200 rounded-2xl p-3.5 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-zinc-700 dark:text-slate-200">板块筛选:</span>
            <div className="flex items-center gap-1 bg-purple-50/60 dark:bg-slate-800 p-1 rounded-xl border border-purple-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeTypeFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-300'
                }`}
              >
                全部体验 ({records.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('individual')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeTypeFilter === 'individual'
                    ? 'bg-sky-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-300'
                }`}
              >
                👤 个体体验 ({individualRecords.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('group')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition cursor-pointer ${
                  activeTypeFilter === 'group'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-300'
                }`}
              >
                👥 团体体验 ({groupRecords.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">

            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="检索体验记录、分析师/带领者或体会..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-8 py-2 bg-purple-50/30 border border-purple-200 rounded-xl text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-purple-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5 rounded-full cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 体验师 / 带领者快速筛选列 */}
        {existingFacilitators.length > 0 && (
          <div className="flex items-center gap-2 pt-2 border-t border-purple-100 dark:border-slate-800 text-xs">
            <span className="font-bold text-zinc-600 dark:text-slate-300 shrink-0">按体验师/带领者过滤:</span>
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              <button
                type="button"
                onClick={() => setSelectedFacilitatorFilter('all')}
                className={`px-2.5 py-0.5 rounded-lg font-bold border transition cursor-pointer text-[11px] ${
                  selectedFacilitatorFilter === 'all'
                    ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                    : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                }`}
              >
                全部导师 ({records.length})
              </button>
              {existingFacilitators.map((facName) => {
                const count = records.filter((r) => (r.facilitator || '').trim() === facName).length;
                const isSelected = selectedFacilitatorFilter === facName;
                return (
                  <button
                    key={facName}
                    type="button"
                    onClick={() => setSelectedFacilitatorFilter(facName)}
                    className={`px-2.5 py-0.5 rounded-lg font-bold border transition cursor-pointer text-[11px] flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-600 text-white border-amber-700 shadow-2xs'
                        : 'bg-white dark:bg-slate-800 text-zinc-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    <span>👤 {facName}</span>
                    <span className="opacity-80">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>



      {/* Modal for Single Record Add/Edit */}
      {modalRecord && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-6 max-w-2xl w-full shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-purple-100 dark:border-slate-800 pb-3 mb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <span>🧘</span>
                <span>
                  {modalRecord.type === 'individual' ? '个体体验' : '团体体验'} · 第 {modalRecord.sessionNum} 次档案
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setModalRecord(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meta bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-purple-50/70 dark:bg-purple-950/60 p-3 rounded-xl border border-purple-200 dark:border-purple-800 mb-4 text-xs">
              <label className="flex items-center gap-1.5 font-bold text-purple-950 dark:text-purple-200">
                <span>体验类型:</span>
                <select
                  value={modalRecord.type}
                  onChange={(e) =>
                    setModalRecord((prev) =>
                      prev ? { ...prev, type: e.target.value as 'individual' | 'group' } : null
                    )
                  }
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-purple-200 rounded-lg text-slate-800 dark:text-slate-100"
                >
                  <option value="individual">1. 个体体验</option>
                  <option value="group">2. 团体体验</option>
                </select>
              </label>

              <label className="flex items-center gap-1.5 font-bold text-purple-950 dark:text-purple-200">
                <CalendarIcon className="w-4 h-4 text-purple-600" />
                <span>日期:</span>
                <input
                  type="date"
                  value={modalRecord.date}
                  onChange={(e) =>
                    setModalRecord((prev) => (prev ? { ...prev, date: e.target.value } : null))
                  }
                  className="px-2 py-1 bg-white dark:bg-slate-800 border border-purple-200 rounded-lg text-slate-800 dark:text-slate-100 font-normal"
                />
              </label>

              <label className="flex items-center gap-1.5 font-bold text-purple-950 dark:text-purple-200">
                <span>分析师/带领者:</span>
                <input
                  type="text"
                  placeholder="如: 李分析师"
                  value={modalRecord.facilitator}
                  onChange={(e) =>
                    setModalRecord((prev) => (prev ? { ...prev, facilitator: e.target.value } : null))
                  }
                  className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-purple-200 rounded-lg text-slate-800 dark:text-slate-100 font-normal"
                />
              </label>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center border-b border-purple-100 dark:border-slate-800 mb-4 gap-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalTab('note')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'note'
                    ? 'border-purple-600 text-purple-600 font-bold bg-purple-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>体验体会与反思</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('transcript')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'transcript'
                    ? 'border-purple-600 text-purple-600 font-bold bg-purple-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <Mic className="w-4 h-4 text-emerald-600" />
                <span>逐字稿 (微信语音大模型)</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('ideas')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'ideas'
                    ? 'border-purple-600 text-purple-600 font-bold bg-purple-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <span>体悟想法 ({modalRecord.ideas.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('resources')}
                className={`px-3 py-2 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                  modalTab === 'resources'
                    ? 'border-purple-600 text-purple-600 font-bold bg-purple-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-500'
                }`}
              >
                <LinkIcon className="w-4 h-4 text-blue-500" />
                <span>绑定外链 ({modalRecord.resources.length})</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-[260px]">
              {modalTab === 'note' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      体验感悟与心理成长体会:
                    </label>
                    <VoiceInputButton
                      currentText={modalRecord.note}
                      onTranscript={(text) =>
                        setModalRecord((prev) => (prev ? { ...prev, note: prev.note ? `${prev.note}\n${text}` : text } : null))
                      }
                      buttonText="微信语音口述"
                    />
                  </div>
                  <RichTextEditor
                    value={modalRecord.note}
                    onChange={(val) => setModalRecord((prev) => (prev ? { ...prev, note: val } : null))}
                    placeholder="录入本次自我体验反思、情绪觉察、移情/反移情觉察或总结..."
                  />
                </div>
              )}

              {modalTab === 'transcript' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      体验会谈逐字稿:
                    </label>
                    <VoiceInputButton
                      currentText={modalRecord.transcript}
                      onTranscript={(text) =>
                        setModalRecord((prev) => (prev ? { ...prev, transcript: prev.transcript ? `${prev.transcript}\n${text}` : text } : null))
                      }
                      buttonText="微信语音录制逐字稿"
                    />
                  </div>
                  <textarea
                    rows={10}
                    value={modalRecord.transcript}
                    onChange={(e) =>
                      setModalRecord((prev) => (prev ? { ...prev, transcript: e.target.value } : null))
                    }
                    placeholder="录入会谈逐字稿或现场录音整理..."
                    className="w-full text-xs p-3 bg-slate-50 dark:bg-slate-800 border border-purple-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-purple-400 font-mono leading-relaxed"
                  />
                </div>
              )}

              {modalTab === 'ideas' && (
                <IdeasSection
                  ideas={modalRecord.ideas}
                  onAddIdea={(newIdea) =>
                    setModalRecord((prev) => (prev ? { ...prev, ideas: [...prev.ideas, newIdea] } : null))
                  }
                  onDeleteIdea={(idx) =>
                    setModalRecord((prev) => (prev ? { ...prev, ideas: prev.ideas.filter((_, i) => i !== idx) } : null))
                  }
                />
              )}

              {modalTab === 'resources' && (
                <ResourceLinkSection
                  resources={modalRecord.resources}
                  onAddResource={(newLink) =>
                    setModalRecord((prev) => (prev ? { ...prev, resources: [...prev.resources, newLink] } : null))
                  }
                  onDeleteResource={(id) =>
                    setModalRecord((prev) => (prev ? { ...prev, resources: prev.resources.filter((r) => r.id !== id) } : null))
                  }
                />
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-purple-100 dark:border-slate-800 pt-3 mt-3">
              <div>
                {modalRecord.id && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      if (window.confirm('⚠️ 确定要彻底删除此条体验记录及其所有的逐字稿和反思体悟吗？')) {
                        handleDeleteRecord(modalRecord.id!);
                        setModalRecord(null);
                      }
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="px-3.5 py-2 bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/60 dark:hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-300 dark:hover:text-white border border-rose-200 dark:border-rose-800 hover:border-rose-600 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs group touch-manipulation select-none min-h-[36px]"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
                    <span>彻底删除此体验记录</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalRecord(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveModalRecord}
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
                >
                  保存体验档案
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Batch Management Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-purple-300 dark:border-slate-800 rounded-2xl p-6 max-w-lg w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base flex items-center gap-2">
                <Sliders className="w-5 h-5 text-purple-600" />
                <span>⚡ 个人体验次数批量填报与管理</span>
              </h3>
              <button
                onClick={() => setIsBatchModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">目标体验类型:</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setBatchTargetType('individual');
                      setBatchSelectedNums([]);
                    }}
                    className={`flex-1 py-1.5 rounded-lg border font-bold cursor-pointer transition ${
                      batchTargetType === 'individual'
                        ? 'bg-sky-600 text-white border-sky-700'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    1. 个体体验
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBatchTargetType('group');
                      setBatchSelectedNums([]);
                    }}
                    className={`flex-1 py-1.5 rounded-lg border font-bold cursor-pointer transition ${
                      batchTargetType === 'group'
                        ? 'bg-purple-600 text-white border-purple-700'
                        : 'bg-white text-slate-700 border-slate-200'
                    }`}
                  >
                    2. 团体体验
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">勾选需要填报/删减的次数:</label>
                  <div className="flex gap-2 text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        const total = batchTargetType === 'individual' ? totalIndividualCount : totalGroupCount;
                        setBatchSelectedNums(Array.from({ length: total }, (_, i) => i + 1));
                      }}
                      className="text-purple-600 font-bold hover:underline cursor-pointer"
                    >
                      全选
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const total = batchTargetType === 'individual' ? totalIndividualCount : totalGroupCount;
                        const targetRecords = batchTargetType === 'individual' ? individualRecords : groupRecords;
                        const recSet = new Set(targetRecords.map((r) => r.sessionNum));
                        const unrecorded = Array.from({ length: total }, (_, i) => i + 1).filter((num) => !recSet.has(num));
                        setBatchSelectedNums(unrecorded);
                      }}
                      className="text-sky-600 font-bold hover:underline cursor-pointer"
                    >
                      选未录入
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const targetRecords = batchTargetType === 'individual' ? individualRecords : groupRecords;
                        setBatchSelectedNums(targetRecords.map((r) => r.sessionNum).sort((a, b) => a - b));
                      }}
                      className="text-emerald-600 font-bold hover:underline cursor-pointer"
                    >
                      选已录入
                    </button>
                    <button
                      type="button"
                      onClick={() => setBatchSelectedNums([])}
                      className="text-slate-400 hover:underline cursor-pointer"
                    >
                      清空选择
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-1 max-h-36 overflow-y-auto p-2 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200">
                  {Array.from(
                    { length: batchTargetType === 'individual' ? totalIndividualCount : totalGroupCount },
                    (_, i) => i + 1
                  ).map((num) => {
                    const isSelected = batchSelectedNums.includes(num);
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setBatchSelectedNums((prev) => prev.filter((n) => n !== num));
                          } else {
                            setBatchSelectedNums((prev) => [...prev, num].sort((a, b) => a - b));
                          }
                        }}
                        className={`p-1 rounded text-[11px] font-bold border transition ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-700'
                            : 'bg-white dark:bg-slate-900 border-slate-200 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {num}次
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">起始排程日期:</label>
                  <input
                    type="date"
                    value={batchDateStart}
                    onChange={(e) => setBatchDateStart(e.target.value)}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">递增间隔天数:</label>
                  <select
                    value={batchIntervalDays}
                    onChange={(e) => setBatchIntervalDays(Number(e.target.value))}
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl"
                  >
                    <option value={7}>7天 (每周一次)</option>
                    <option value={14}>14天 (每两周一次)</option>
                    <option value={1}>1天 (每天连续)</option>
                    <option value={30}>30天 (每月一次)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-slate-700 dark:text-slate-300">分析师 / 团体带领者:</label>
                  {batchFacilitator && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetRecords = batchTargetType === 'individual' ? individualRecords : groupRecords;
                        const matched = targetRecords
                          .filter((r) => (r.facilitator || '').trim() === batchFacilitator.trim())
                          .map((r) => r.sessionNum);
                        setBatchSelectedNums(matched);
                      }}
                      className="text-[10px] text-amber-700 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                    >
                      点击勾选【{batchFacilitator}】的记录 ({
                        (batchTargetType === 'individual' ? individualRecords : groupRecords)
                          .filter((r) => (r.facilitator || '').trim() === batchFacilitator.trim()).length
                      }次)
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="如: 张体验师、李带领者"
                  value={batchFacilitator}
                  onChange={(e) => setBatchFacilitator(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl mb-1.5"
                />

                {/* 常用 / 现有体验师快捷预设按钮 */}
                {allPresetFacilitators.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 text-[10px]">
                    <span className="text-slate-500 font-medium">快速套用:</span>
                    {allPresetFacilitators.map((fName) => (
                      <button
                        key={fName}
                        type="button"
                        onClick={() => setBatchFacilitator(fName)}
                        className={`px-2 py-0.5 rounded border transition cursor-pointer font-bold ${
                          batchFacilitator === fName
                            ? 'bg-amber-600 text-white border-amber-700'
                            : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                        }`}
                      >
                        {fName}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">统一体悟备注 / 模板:</label>
                <input
                  type="text"
                  placeholder="如: 完成标准自我体验成长小时数"
                  value={batchNote}
                  onChange={(e) => setBatchNote(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-purple-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleApplyBatchDelete}
                disabled={batchSelectedNums.length === 0}
                className="px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 shadow-xs"
                title="彻底删除并清空选中的体验记录"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>批量删除已选</span>
              </button>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyBatchFacilitatorChange}
                  disabled={batchSelectedNums.length === 0 || !batchFacilitator.trim()}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer transition active:scale-95"
                  title="仅统一修改已选记录的体验师/带领者姓名"
                >
                  仅批量更名导师
                </button>

                <button
                  type="button"
                  onClick={handleApplyBatchMarkCompleted}
                  disabled={batchSelectedNums.length === 0}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition active:scale-95 flex items-center gap-1"
                  title="一键将勾选的项目标记为【已全部完成/已录入】，完全计入统计总额"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>一键标记已全部完成 (计入总数)</span>
                </button>

                <button
                  type="button"
                  onClick={handleApplyBatchFill}
                  disabled={batchSelectedNums.length === 0}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition active:scale-95"
                >
                  一键批量排程生成
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 体验累计时数快捷修改 Modal */}
      {editingItemModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-zinc-900 dark:text-slate-100 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>编辑 {editingItemModal.type === 'individual' ? '个人体验师' : '团体体验'} 信息</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingItemModal(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-zinc-700 dark:text-slate-300 mb-1">
                  {editingItemModal.type === 'individual' ? '体验师姓名' : '团体/小组名称'} *
                </label>
                <input
                  type="text"
                  value={editingItemModal.name}
                  onChange={(e) =>
                    setEditingItemModal((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-slate-300 mb-1">
                  {editingItemModal.type === 'individual' ? '性别称谓' : '带领者/导师'}
                </label>
                <input
                  type="text"
                  value={editingItemModal.genderOrFacilitator}
                  onChange={(e) =>
                    setEditingItemModal((prev) => (prev ? { ...prev, genderOrFacilitator: e.target.value } : null))
                  }
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-slate-300 mb-1">
                    起始时间
                  </label>
                  <input
                    type="date"
                    value={editingItemModal.startDate}
                    onChange={(e) =>
                      setEditingItemModal((prev) => (prev ? { ...prev, startDate: e.target.value } : null))
                    }
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-zinc-700 dark:text-slate-300">
                      终止时间
                    </label>
                    <button
                      type="button"
                      onClick={() => setEditingItemModal((prev) => (prev ? { ...prev, endDate: '正在持续中' } : null))}
                      className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 rounded-md border border-emerald-300 dark:border-emerald-700 transition cursor-pointer"
                    >
                      ⚡ 正在持续中
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD 或 正在持续中"
                    value={editingItemModal.endDate}
                    onChange={(e) =>
                      setEditingItemModal((prev) => (prev ? { ...prev, endDate: e.target.value } : null))
                    }
                    className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-zinc-700 dark:text-slate-300 mb-1">
                  体验/团体总小时额度 (0.5h起)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min={0.5}
                  value={editingItemModal.totalHours}
                  onChange={(e) =>
                    setEditingItemModal((prev) =>
                      prev ? { ...prev, totalHours: Number(e.target.value) || 20 } : null
                    )
                  }
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  handleDeleteTherapistItem(editingItemModal.id, editingItemModal.name, editingItemModal.type);
                  setEditingItemModal(null);
                }}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-600 text-rose-600 hover:text-white dark:text-rose-300 dark:hover:text-white border border-rose-200 dark:border-rose-900/60 hover:border-rose-600 rounded-xl font-bold text-xs transition-all duration-200 cursor-pointer flex items-center gap-1 active:scale-95 group shadow-2xs touch-manipulation select-none min-h-[36px]"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-white transition-colors" />
                <span>彻底删除此{editingItemModal.type === 'individual' ? '体验师' : '团体'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItemModal(null)}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditedItem}
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer active:scale-95 transition"
                >
                  保存修改
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 体验累计时数快捷修改 Modal */}
      {isEditHoursModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-2xl p-5 max-w-sm w-full shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-purple-100 dark:border-slate-800 pb-2">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-500" />
                <span>编辑 {editingHoursType === 'individual' ? '个体体验' : '团体体验'} 累计时数</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsEditHoursModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  设置 {editingHoursType === 'individual' ? '个体体验' : '团体体验'} 累计时数 (小时):
                </label>
                <input
                  type="number"
                  min="0"
                  value={hoursInputValue}
                  onChange={(e) => setHoursInputValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="输入时数"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setHoursInputValue(String((Number(hoursInputValue) || 0) + 1))}
                  className="flex-1 py-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 rounded-lg text-xs font-bold cursor-pointer hover:bg-purple-100"
                >
                  +1 小时
                </button>
                <button
                  type="button"
                  onClick={() => setHoursInputValue(String((Number(hoursInputValue) || 0) + 5))}
                  className="flex-1 py-1 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-200 rounded-lg text-xs font-bold cursor-pointer hover:bg-purple-100"
                >
                  +5 小时
                </button>
                <button
                  type="button"
                  onClick={() => setHoursInputValue(String(editingHoursType === 'individual' ? completedIndividualCount : completedGroupCount))}
                  className="flex-1 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold cursor-pointer hover:bg-slate-200"
                  title="重置为根据实际完成的体验记录自动统计的时数"
                >
                  自动重置 ({editingHoursType === 'individual' ? completedIndividualCount : completedGroupCount}h)
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-purple-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsEditHoursModalOpen(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  const val = Number(hoursInputValue);
                  const num = isNaN(val) ? 0 : Math.max(0, val);
                  if (onUpdateTotalHoursOverrides) {
                    if (editingHoursType === 'individual') {
                      onUpdateTotalHoursOverrides({ ...totalHoursOverrides, individualExperienceHours: num });
                    } else {
                      onUpdateTotalHoursOverrides({ ...totalHoursOverrides, groupExperienceHours: num });
                    }
                  }
                  setIsEditHoursModalOpen(false);
                }}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-2xs"
              >
                保存时数
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
