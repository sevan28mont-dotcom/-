import React, { useRef } from 'react';
import { CaseRecord, Supervisor, ThinkingNote, SessionData } from '../types';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  FileText,
  User,
  Calendar,
  Clock,
  Mic,
  Lightbulb,
  Link as LinkIcon,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

interface ExportCasePdfModalProps {
  caseRecord: CaseRecord;
  mentors?: Supervisor[];
  thinkingNotes?: ThinkingNote[];
  onClose: () => void;
}

export const ExportCasePdfModal: React.FC<ExportCasePdfModalProps> = ({
  caseRecord,
  mentors = [],
  thinkingNotes = [],
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // 匹配绑定的督导记录
  const linkedSupervisions = React.useMemo(() => {
    if (!caseRecord || !caseRecord.id) return [];
    const list: { mentorName: string; record: any }[] = [];
    (mentors || []).forEach((m) => {
      if (!m) return;
      const isBoundMentor = (m.boundCaseIds || []).includes(caseRecord.id);
      (m.records || []).forEach((rec) => {
        if (!rec) return;
        if (rec.caseId === caseRecord.id || isBoundMentor) {
          list.push({
            mentorName: m.name || '',
            record: rec,
          });
        }
      });
    });
    return list;
  }, [mentors, caseRecord?.id]);

  // 匹配关联的思考笔记
  const linkedNotes = React.useMemo(() => {
    if (!caseRecord || !caseRecord.id) return [];
    return (thinkingNotes || []).filter((note) => {
      if (!note) return false;
      const q = (caseRecord.name || '').toLowerCase();
      const numQ = (caseRecord.caseNum || '').toLowerCase();
      if (!q && !numQ) return false;
      const titleMatch = Boolean((note.title || '').toLowerCase().includes(q) || (note.title || '').toLowerCase().includes(numQ));
      const contentMatch = Boolean((note.content || '').toLowerCase().includes(q) || (note.content || '').toLowerCase().includes(numQ));
      const tagMatch = Boolean(note.tags?.some((t) => t && ((t || '').toLowerCase().includes(q) || (t || '').toLowerCase().includes(numQ))));
      return titleMatch || contentMatch || tagMatch;
    });
  }, [thinkingNotes, caseRecord?.name, caseRecord?.caseNum, caseRecord?.id]);

  if (!caseRecord || !caseRecord.id) return null;

  // 已完成次数计算
  const completedSessionsCount = React.useMemo(() => {
    return Object.values(caseRecord.sessions || {}).filter((s: SessionData) => s.completed).length;
  }, [caseRecord.sessions]);

  // 触发浏览器原生打印为 PDF
  const handlePrint = () => {
    window.print();
  };

  // 生成 Markdown 文本内容
  const generateMarkdown = () => {
    let md = `# 心理咨询个案归档卷宗：${caseRecord.name} (${caseRecord.caseNum})\n\n`;
    md += `*导出时间：${new Date().toLocaleString()}*\n\n`;
    md += `## 一、个案基本资料\n`;
    md += `- **个案编号**：${caseRecord.caseNum}\n`;
    md += `- **客户/代号**：${caseRecord.name}\n`;
    md += `- **咨询类型**：${caseRecord.category === 'longTerm' ? '长程咨询' : '短程咨询'}\n`;
    md += `- **咨询状态**：${caseRecord.status === 'active' ? '进行中' : '已结案'}\n`;
    md += `- **咨询周期**：${caseRecord.startDate} ~ ${caseRecord.endDate || '至今'}\n`;
    md += `- **会谈进度**：已完成 ${completedSessionsCount} / 计划 ${caseRecord.totalSessions} 次 (${Math.round((completedSessionsCount / caseRecord.totalSessions) * 100)}%)\n\n`;

    md += `## 二、历次会谈记录汇总\n\n`;
    for (let i = 1; i <= caseRecord.totalSessions; i++) {
      const sess = caseRecord.sessions[i];
      if (!sess) continue;
      md += `### 第 ${i} 次会谈 [${sess.completed ? '已完成' : '未进行'}]\n`;
      if (sess.note) {
        md += `**咨询笔记：**\n${sess.note.replace(/<[^>]+>/g, '')}\n\n`;
      }
      if (sess.transcript) {
        md += `**会谈逐字稿：**\n${sess.transcript.replace(/<[^>]+>/g, '')}\n\n`;
      }
      if (sess.ideas && sess.ideas.length > 0) {
        md += `**灵感与随记：**\n${sess.ideas.map((id) => `- ${id}`).join('\n')}\n\n`;
      }
      if (sess.resources && sess.resources.length > 0) {
        md += `**关联外链资源：**\n${sess.resources.map((r) => `- [${r.title}](${r.url}) (${r.type})`).join('\n')}\n\n`;
      }
    }

    if (linkedSupervisions.length > 0) {
      md += `## 三、关联督导记录汇总\n\n`;
      linkedSupervisions.forEach((sup, idx) => {
        md += `### 督导 #${idx + 1} - 督导师：${sup.mentorName} (${sup.record.date})\n`;
        md += `- **督导类型**：${sup.record.type === 'individual' ? '个体督导' : '团体督导'}\n`;
        if (sup.record.reflection) {
          md += `**督导反思与要点：**\n${sup.record.reflection.replace(/<[^>]+>/g, '')}\n\n`;
        }
        if (sup.record.transcript) {
          md += `**督导逐字稿：**\n${sup.record.transcript.replace(/<[^>]+>/g, '')}\n\n`;
        }
      });
    }

    if (linkedNotes.length > 0) {
      md += `## 四、关联思考与灵感笔记\n\n`;
      linkedNotes.forEach((n) => {
        md += `### ${n.title} (${n.time})\n${n.content.replace(/<[^>]+>/g, '')}\n\n`;
      });
    }

    return md;
  };

  // 下载 Markdown/TXT 文本
  const handleDownloadFile = () => {
    const content = generateMarkdown();
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `个案卷宗_${caseRecord.caseNum}_${caseRecord.name}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 复制全文
  const handleCopyText = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      {/* 打印专用的隐藏 CSS 样式表 */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #case-pdf-print-area, #case-pdf-print-area * {
            visibility: visible !important;
          }
          #case-pdf-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden">
        {/* 顶部模态框操作栏 */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <span>导出个案 PDF 汇总档案</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-200 font-semibold">
                  {caseRecord.caseNum}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                支持直接调用打印另存为 PDF 或导出规范 Markdown 卷宗
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>🖨️ 打印 / 存为 PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFile}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
              title="下载 TXT/Markdown 汇总文本"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>下载卷宗</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-2.5 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? '已复制' : '复制全文'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-rose-100 hover:text-rose-600 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF 预读及打印区域 */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100 dark:bg-slate-950">
          <div
            id="case-pdf-print-area"
            ref={printRef}
            className="max-w-3xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-100"
          >
            {/* 卷宗页眉 */}
            <div className="border-b-2 border-rose-500 pb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-xl tracking-wide">
                  <ShieldCheck className="w-6 h-6" />
                  <span>心理咨询个案归档卷宗</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Psychological Counseling Confidential Case File • 保密档案
                </p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <p className="font-mono font-bold text-slate-700 dark:text-slate-300">
                  {caseRecord.caseNum}
                </p>
                <p>生成时间：{new Date().toLocaleDateString()}</p>
              </div>
            </div>

            {/* 一、个案档案概览表格 */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-l-4 border-rose-500 pl-2">
                <User className="w-4 h-4 text-rose-500" />
                <span>一、个案基本资料信息</span>
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">客户 / 代号:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{caseRecord.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">档案编号:</span>
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-100">{caseRecord.caseNum}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">咨询类别:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">
                    {caseRecord.category === 'longTerm' ? '长程咨询' : '短程咨询'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">卷宗状态:</span>
                  <span className={`font-semibold ${caseRecord.status === 'active' ? 'text-emerald-600' : 'text-slate-500'}`}>
                    {caseRecord.status === 'active' ? '服务进行中' : '已归档结案'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">开启日期:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{caseRecord.startDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">结案日期:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-200">{caseRecord.endDate || '尚未结案'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">计划总会谈数:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">{caseRecord.totalSessions} 次</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">已完成会谈:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    {completedSessionsCount} / {caseRecord.totalSessions} 次 ({Math.round((completedSessionsCount / caseRecord.totalSessions) * 100)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* 二、历次会谈记录全景 */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-l-4 border-rose-500 pl-2">
                <Clock className="w-4 h-4 text-rose-500" />
                <span>二、历次咨询会谈记录全景</span>
              </h4>

              <div className="space-y-4">
                {Array.from({ length: caseRecord.totalSessions }).map((_, index) => {
                  const sNum = index + 1;
                  const sess = caseRecord.sessions[sNum];
                  if (!sess) return null;

                  const hasNote = Boolean(sess.note && sess.note.trim());
                  const hasTranscript = Boolean(sess.transcript && sess.transcript.trim());
                  const hasIdeas = Boolean(sess.ideas && sess.ideas.length > 0);
                  const hasResources = Boolean(sess.resources && sess.resources.length > 0);

                  if (!hasNote && !hasTranscript && !hasIdeas && !hasResources && !sess.completed) {
                    return null; // 过滤无内容的空白会谈
                  }

                  return (
                    <div
                      key={sNum}
                      className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                            第 {sNum} 次会谈
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[10px] rounded-full font-bold ${
                              sess.completed
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {sess.completed ? '已完成会谈' : '待处理'}
                          </span>
                        </div>
                      </div>

                      {/* 笔记内容 */}
                      {hasNote && (
                        <div className="space-y-1">
                          <span className="font-bold text-rose-700 dark:text-rose-400 block">
                            📝 咨询笔记 & 观察分析:
                          </span>
                          {/<[a-z][\s\S]*>/i.test(sess.note) ? (
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: sess.note }} />
                          ) : (
                            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-800 leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                              {sess.note}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 逐字稿内容 */}
                      {hasTranscript && (
                        <div className="space-y-1">
                          <span className="font-bold text-emerald-700 dark:text-emerald-400 block flex items-center gap-1">
                            <Mic className="w-3.5 h-3.5 text-emerald-600" />
                            <span>会谈逐字稿:</span>
                          </span>
                          {/<[a-z][\s\S]*>/i.test(sess.transcript || '') ? (
                            <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/40 leading-relaxed text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: sess.transcript || '' }} />
                          ) : (
                            <div className="p-2.5 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-lg border border-emerald-100 dark:border-emerald-900/40 leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-mono text-[11px]">
                              {sess.transcript}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 思考灵感 */}
                      {hasIdeas && (
                        <div className="space-y-1">
                          <span className="font-bold text-amber-700 dark:text-amber-400 block flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                            <span>随记与思考灵感:</span>
                          </span>
                          <ul className="list-disc list-inside space-y-1 p-2 bg-amber-50/50 dark:bg-amber-950/30 rounded-lg border border-amber-100 dark:border-amber-900/40 text-slate-800 dark:text-slate-200">
                            {sess.ideas?.map((idea, i) => (
                              <li key={i}>{idea}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 绑定的外链资源 */}
                      {hasResources && (
                        <div className="space-y-1">
                          <span className="font-bold text-blue-700 dark:text-blue-400 block flex items-center gap-1">
                            <LinkIcon className="w-3.5 h-3.5 text-blue-500" />
                            <span>绑定的 WPS/微信公众号外链资源:</span>
                          </span>
                          <div className="space-y-1">
                            {sess.resources?.map((res) => (
                              <div key={res.id} className="p-1.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{res.title}</span>
                                <span className="text-slate-400 font-mono underline truncate max-w-xs">{res.url}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 三、关联督导记录 */}
            {linkedSupervisions.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-l-4 border-rose-500 pl-2">
                  <BookOpen className="w-4 h-4 text-rose-500" />
                  <span>三、关联督导记录汇总 ({linkedSupervisions.length} 条)</span>
                </h4>

                <div className="space-y-3">
                  {linkedSupervisions.map((sup, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-rose-50/40 dark:bg-slate-800/50 rounded-xl border border-rose-100 dark:border-slate-700 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 border-b border-rose-100 dark:border-slate-700 pb-1.5">
                        <span>督导师：{sup.mentorName}</span>
                        <span className="text-slate-500 text-[11px]">日期：{sup.record.date} ({sup.record.type === 'individual' ? '个体督导' : '团体督导'})</span>
                      </div>

                      {sup.record.reflection && (
                        <div>
                          <strong className="text-rose-900 dark:text-rose-300 block mb-1">💡 督导要点与反思觉察:</strong>
                          {/<[a-z][\s\S]*>/i.test(sup.record.reflection) ? (
                            <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800" dangerouslySetInnerHTML={{ __html: sup.record.reflection }} />
                          ) : (
                            <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">{sup.record.reflection}</div>
                          )}
                        </div>
                      )}

                      {sup.record.transcript && (
                        <div>
                          <strong className="text-emerald-900 dark:text-emerald-300 block mb-1">🎙️ 督导逐字稿:</strong>
                          {/<[a-z][\s\S]*>/i.test(sup.record.transcript) ? (
                            <div className="p-2 bg-emerald-50/40 dark:bg-emerald-950/30 rounded border border-emerald-100 dark:border-emerald-900/40" dangerouslySetInnerHTML={{ __html: sup.record.transcript }} />
                          ) : (
                            <div className="p-2 bg-emerald-50/40 dark:bg-emerald-950/30 rounded border border-emerald-100 dark:border-emerald-900/40 whitespace-pre-wrap font-mono text-[11px]">{sup.record.transcript}</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 四、关联思考笔记 */}
            {linkedNotes.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 border-l-4 border-rose-500 pl-2">
                  <Lightbulb className="w-4 h-4 text-rose-500" />
                  <span>四、关联思考与灵感笔记 ({linkedNotes.length} 条)</span>
                </h4>

                <div className="space-y-2">
                  {linkedNotes.map((n) => (
                    <div key={n.id} className="p-3 bg-amber-50/40 dark:bg-slate-800/50 rounded-xl border border-amber-100 dark:border-slate-700 text-xs space-y-1">
                      <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400">{n.time}</span>
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{n.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 卷宗页脚落款 */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-400 space-y-1">
              <p>心理咨询专业系统 • 档案归档卷宗管理</p>
              <p>严禁未经授权复制、分发或传播本卷宗内的任何客户保密资料</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
