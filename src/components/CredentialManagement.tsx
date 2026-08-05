import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CounselorCredential } from '../types';
import {
  ShieldCheck,
  Plus,
  Pencil,
  Trash2,
  Award,
  Calendar,
  Building2,
  CheckCircle2,
  Search,
  Sparkles,
  X,
  FileCheck2,
  Tag,
  Info,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface CredentialManagementProps {
  credentials: CounselorCredential[];
  onAddCredential: (cred: Omit<CounselorCredential, 'id'>) => void;
  onUpdateCredential: (id: string, updated: Partial<CounselorCredential>) => void;
  onDeleteCredential: (id: string) => void;
}

// 快速预设类型
const PRESETS = [
  {
    title: '心理治疗师 (卫生专业技术资格中级)',
    category: 'psychotherapy' as const,
    level: '中级',
    issuingBody: '国家卫生健康委员会 / 人社部',
    badge: '🏥 心理治疗',
    color: 'emerald',
  },
  {
    title: '社会工作者 (中级社会工作师)',
    category: 'socialWork' as const,
    level: '中级社工师',
    issuingBody: '中华人民共和国民政部 / 人社部',
    badge: '🤝 社工',
    color: 'indigo',
  },
  {
    title: 'CPS 中国心理学会注册心理师 (3级)',
    category: 'cps' as const,
    level: 'CPS 3级注册心理师',
    issuingBody: '中国心理学会临床心理学注册工作委员会',
    badge: '🎓 CPS注册系统',
    color: 'purple',
  },
  {
    title: 'CPS 中国心理学会注册心理师 (2级)',
    category: 'cps' as const,
    level: 'CPS 2级注册心理师',
    issuingBody: '中国心理学会临床心理学注册工作委员会',
    badge: '🎓 CPS注册系统',
    color: 'purple',
  },
  {
    title: '国家二级心理咨询师',
    category: 'national' as const,
    level: '国家二级',
    issuingBody: '原中华人民共和国人力资源和社会保障部',
    badge: '📜 国家咨询师',
    color: 'amber',
  },
  {
    title: '国家三级心理咨询师',
    category: 'national' as const,
    level: '国家三级',
    issuingBody: '原中华人民共和国人力资源和社会保障部',
    badge: '📜 国家咨询师',
    color: 'amber',
  },
];

export const CredentialManagement: React.FC<CredentialManagementProps> = ({
  credentials,
  onAddCredential,
  onUpdateCredential,
  onDeleteCredential,
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CounselorCredential['category']>('psychotherapy');
  const [level, setLevel] = useState('');
  const [issuingBody, setIssuingBody] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [certNumber, setCertNumber] = useState('');
  const [status, setStatus] = useState<CounselorCredential['status']>('lifetime');
  const [note, setNote] = useState('');

  // Modal for editing
  const [editingItem, setEditingItem] = useState<CounselorCredential | null>(null);

  // Apply Preset
  const handleApplyPreset = (preset: (typeof PRESETS)[0]) => {
    setTitle(preset.title);
    setCategory(preset.category);
    setLevel(preset.level);
    setIssuingBody(preset.issuingBody);
    if (!issueDate) {
      setIssueDate(new Date().toISOString().slice(0, 7));
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('请填写证件/资质名称！');
      return;
    }

    onAddCredential({
      title: title.trim(),
      category,
      level: level.trim() || undefined,
      issuingBody: issuingBody.trim() || undefined,
      issueDate: issueDate.trim() || new Date().toISOString().slice(0, 10),
      certNumber: certNumber.trim() || undefined,
      status,
      note: note.trim() || undefined,
    });

    // Reset Form
    setTitle('');
    setLevel('');
    setIssuingBody('');
    setCertNumber('');
    setNote('');
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    onUpdateCredential(editingItem.id, {
      title: editingItem.title,
      category: editingItem.category,
      level: editingItem.level,
      issuingBody: editingItem.issuingBody,
      issueDate: editingItem.issueDate,
      certNumber: editingItem.certNumber,
      status: editingItem.status,
      note: editingItem.note,
    });

    setEditingItem(null);
  };

  // Filtered List
  const filteredCredentials = credentials.filter((item) => {
    const matchCat = filterCategory === 'all' || item.category === filterCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchSearch =
      !q ||
      item.title.toLowerCase().includes(q) ||
      (item.issuingBody && item.issuingBody.toLowerCase().includes(q)) ||
      (item.certNumber && item.certNumber.toLowerCase().includes(q)) ||
      (item.level && item.level.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const getCategoryBadge = (cat: CounselorCredential['category']) => {
    switch (cat) {
      case 'psychotherapy':
        return { label: '🏥 心理治疗', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700' };
      case 'socialWork':
        return { label: '🤝 社工', bg: 'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-700' };
      case 'cps':
        return { label: '🎓 CPS注册系统', bg: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/80 dark:text-purple-300 dark:border-purple-700' };
      case 'national':
        return { label: '📜 国家咨询师', bg: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700' };
      default:
        return { label: '🛡️ 其他专业资质', bg: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' };
    }
  };

  const getStatusBadge = (st?: CounselorCredential['status']) => {
    switch (st) {
      case 'lifetime':
        return { label: '✨ 终身有效', bg: 'bg-emerald-500 text-white dark:bg-emerald-600' };
      case 'valid':
        return { label: '🟢 有效', bg: 'bg-teal-500 text-white dark:bg-teal-600' };
      case 'renewing':
        return { label: '🟡 正在续期中', bg: 'bg-amber-500 text-white dark:bg-amber-600' };
      case 'expired':
        return { label: '🔴 已到期', bg: 'bg-rose-500 text-white dark:bg-rose-600' };
      default:
        return { label: '🟢 生效中', bg: 'bg-emerald-500 text-white' };
    }
  };

  return (
    <div className="space-y-6">
      {/* 顶部标题 Header */}
      <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-2xl">📜</span>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-slate-100 tracking-tight">
                心理咨询师证件与专业资质
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800">
                国家级资质管理
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-slate-400 mt-1 font-medium">
              快速管理心理治疗师、社会工作者(社工)、CPS 3级/2级注册心理师、国家咨询师等权威证书与颁发日期
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-slate-800 px-3.5 py-2 rounded-xl border border-emerald-200 dark:border-slate-700">
            <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>已录入资质: <strong className="text-emerald-900 dark:text-emerald-200 font-extrabold text-sm">{credentials.length}</strong> 项</span>
          </div>
        </div>
      </div>

      {/* 新增证件栏目 */}
      <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-emerald-100 dark:border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-zinc-800 dark:text-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>添加心理咨询师证件栏目</span>
          </h3>
          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            💡 无需繁琐的起始时间，仅需填写“获得时间”即可
          </span>
        </div>

        {/* 快捷模板 Preset Chips */}
        <div>
          <label className="block text-xs font-bold text-zinc-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>快捷一键填入常见国家资质模板:</span>
          </label>
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-2.5 py-1 text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-slate-700 transition cursor-pointer active:scale-95 flex items-center gap-1"
              >
                <span>{preset.badge}</span>
                <span className="opacity-70 font-normal">({preset.level})</span>
              </button>
            ))}
          </div>
        </div>

        {/* 添加表单 Form */}
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
              证件/资质名称 *
            </label>
            <input
              type="text"
              placeholder="例如: 心理治疗师 (中级) / CPS注册心理师"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
              证件类别
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CounselorCredential['category'])}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="psychotherapy">🏥 心理治疗 (卫健委/卫生部)</option>
              <option value="socialWork">🤝 社会工作者 (社工)</option>
              <option value="cps">🎓 CPS 中国心理学会注册系统</option>
              <option value="national">📜 国家心理咨询师 (二/三级)</option>
              <option value="other">🛡️ 其他专业资质证书</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
              级别 / 称号
            </label>
            <input
              type="text"
              placeholder="例如: 中级 / CPS 3级 / 国家二级"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
              获得时间 (颁发/注册年月) *
            </label>
            <input
              type="month"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
              颁发 / 认证机构
            </label>
            <input
              type="text"
              placeholder="例如: 国家卫健委 / 中国心理学会"
              value={issuingBody}
              onChange={(e) => setIssuingBody(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
              证书编号 / 注册号 (选填)
            </label>
            <input
              type="text"
              placeholder="例如: 202412345678"
              value={certNumber}
              onChange={(e) => setCertNumber(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
              证书状态
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CounselorCredential['status'])}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="lifetime">✨ 终身有效</option>
              <option value="valid">🟢 正常生效中</option>
              <option value="renewing">🟡 正在续期 / 再注册中</option>
              <option value="expired">🔴 已到期</option>
            </select>
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">
              备注与证书说明 (选填)
            </label>
            <input
              type="text"
              placeholder="例如: 每年需完成再继续教育学分，或证书原件存放位置说明"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-800 border border-emerald-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl transition shadow-xs cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>添加此证件栏目</span>
            </button>
          </div>
        </form>
      </div>

      {/* 搜索与分类 Tab */}
      <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: '全部证件' },
            { id: 'psychotherapy', label: '🏥 心理治疗' },
            { id: 'socialWork', label: '🤝 社工' },
            { id: 'cps', label: '🎓 CPS注册系统' },
            { id: 'national', label: '📜 国家咨询师' },
            { id: 'other', label: '🛡️ 其他资质' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filterCategory === tab.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="搜索证件名称、机构或证书编号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-8 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-zinc-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 证件卡片列表 Credentials List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCredentials.length === 0 ? (
          <div className="md:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-zinc-500 dark:text-slate-400 text-xs space-y-2">
            <Award className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-bold">暂无找到符合条件的心理咨询师证件</p>
            <p className="text-[11px] text-zinc-400">请使用上方快捷按钮或表单添加您的国家级资质、心理治疗师或CPS注册证件</p>
          </div>
        ) : (
          filteredCredentials.map((item) => {
            const catBadge = getCategoryBadge(item.category);
            const stBadge = getStatusBadge(item.status);

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-3 relative hover:border-emerald-300 dark:hover:border-slate-700 transition"
              >
                {/* 顶部标题栏与 Status Badge */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2.5">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catBadge.bg}`}>
                        {catBadge.label}
                      </span>
                      {item.level && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {item.level}
                        </span>
                      )}
                    </div>
                    <h4 className="font-black text-zinc-900 dark:text-slate-100 text-base leading-snug">
                      {item.title}
                    </h4>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${stBadge.bg}`}>
                    {stBadge.label}
                  </span>
                </div>

                {/* 内容详情 Details */}
                <div className="space-y-1.5 text-xs text-zinc-600 dark:text-slate-300 font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span>获得时间: <strong className="text-zinc-900 dark:text-slate-100 font-bold">{item.issueDate}</strong></span>
                  </div>

                  {item.issuingBody && (
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span>发证/认证机构: <strong className="text-zinc-800 dark:text-slate-200">{item.issuingBody}</strong></span>
                    </div>
                  )}

                  {item.certNumber && (
                    <div className="flex items-center gap-2">
                      <FileCheck2 className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                      <span>证书/注册编号: <strong className="font-mono text-zinc-900 dark:text-slate-100 font-bold">{item.certNumber}</strong></span>
                    </div>
                  )}

                  {item.note && (
                    <div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl text-[11px] text-zinc-500 dark:text-slate-400 mt-2 border border-slate-100 dark:border-slate-800">
                      💡 备注: {item.note}
                    </div>
                  )}
                </div>

                {/* 底部操作按钮 */}
                <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-2.5 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditingItem(item)}
                    className="px-2.5 py-1 text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-zinc-700 dark:text-slate-200 rounded-lg transition cursor-pointer flex items-center gap-1"
                  >
                    <Pencil className="w-3 h-3 text-zinc-500" />
                    <span>编辑栏目</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm(`确定要删除证件【${item.title}】的记录吗？`)) {
                        onDeleteCredential(item.id);
                      }
                    }}
                    className="px-2.5 py-1 text-xs font-bold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800 transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>删除</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 编辑 Modal */}
      {editingItem && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 max-w-lg w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-zinc-900 dark:text-slate-100 text-base flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-600" />
                <span>编辑证件栏目: {editingItem.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="text-zinc-400 hover:text-zinc-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">证件/资质名称</label>
                <input
                  type="text"
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  required
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">类别</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value as CounselorCredential['category'] })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="psychotherapy">🏥 心理治疗</option>
                    <option value="socialWork">🤝 社会工作者 (社工)</option>
                    <option value="cps">🎓 CPS注册系统</option>
                    <option value="national">📜 国家心理咨询师</option>
                    <option value="other">🛡️ 其他专业资质</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">级别 / 称号</label>
                  <input
                    type="text"
                    value={editingItem.level || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, level: e.target.value })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">获得时间 (年月/日期)</label>
                  <input
                    type="text"
                    placeholder="YYYY-MM 或 YYYY-MM-DD"
                    value={editingItem.issueDate}
                    onChange={(e) => setEditingItem({ ...editingItem, issueDate: e.target.value })}
                    required
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">状态</label>
                  <select
                    value={editingItem.status || 'lifetime'}
                    onChange={(e) => setEditingItem({ ...editingItem, status: e.target.value as CounselorCredential['status'] })}
                    className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="lifetime">✨ 终身有效</option>
                    <option value="valid">🟢 正常生效中</option>
                    <option value="renewing">🟡 正在续期 / 再注册中</option>
                    <option value="expired">🔴 已到期</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">颁发 / 认证机构</label>
                <input
                  type="text"
                  value={editingItem.issuingBody || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, issuingBody: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">证书编号 / 注册号</label>
                <input
                  type="text"
                  value={editingItem.certNumber || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, certNumber: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-700 dark:text-slate-300 mb-1">备注说明</label>
                <input
                  type="text"
                  value={editingItem.note || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                  className="w-full text-xs p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800 pt-3 mt-4">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-zinc-600 dark:text-slate-300 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  保存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
