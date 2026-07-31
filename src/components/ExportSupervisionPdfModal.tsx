import React, { useRef, useState } from 'react';
import { SupervisionRecord, Supervisor, CaseRecord } from '../types';
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
  BookOpen,
} from 'lucide-react';

interface ExportSupervisionPdfModalProps {
  supervisor: Supervisor;
  record?: SupervisionRecord; // If present, export single record. If omitted, export all supervisor records.
  cases: CaseRecord[];
  onClose: () => void;
}

export const ExportSupervisionPdfModal: React.FC<ExportSupervisionPdfModalProps> = ({
  supervisor,
  record,
  cases,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const recordsToExport = record ? [record] : supervisor.records || [];

  const getCaseInfo = (caseId: string) => {
    return cases.find((c) => c.id === caseId) || { name: '未知个案', caseNum: caseId, avatar: '👤' };
  };

  const handlePrint = () => {
    window.print();
  };

  const generateMarkdown = () => {
    let md = `# 督导记录与导师反思卷宗：${supervisor.name} 导师\n\n`;
    md += `*导出时间：${new Date().toLocaleString()}*\n\n`;
    md += `## 一、督导师基本资料\n`;
    md += `- **导师姓名**：${supervisor.name}\n`;
    md += `- **导师称谓**：${supervisor.gender}\n`;
    md += `- **督导周期**：${supervisor.startDate} 至 ${supervisor.endDate}\n`;
    md += `- **督导额度**：已完成 ${supervisor.records?.length || 0} / 总额度 ${supervisor.totalSupervisions} 次\n\n`;

    md += `## 二、督导会谈与反思记录明细 (${recordsToExport.length} 条)\n\n`;

    recordsToExport.forEach((rec, idx) => {
      const caseObj = getCaseInfo(rec.caseId);
      md += `### 督导记录 #${idx + 1} (${rec.date} [${rec.timeRange}])\n`;
      md += `- **督导类型**：${rec.type === 'individual' ? '1. 个体督导' : '2. 团体督导'}\n`;
      md += `- **关联个案**：${caseObj.caseNum} ${caseObj.name} (针对第 ${rec.sessionNum} 次咨询)\n\n`;

      if (rec.reflection) {
        md += `**督导反思与要点：**\n${rec.reflection.replace(/<[^>]+>/g, '')}\n\n`;
      }
      if (rec.transcript) {
        md += `**督导逐字稿：**\n${rec.transcript.replace(/<[^>]+>/g, '')}\n\n`;
      }
      if (rec.ideas && rec.ideas.length > 0) {
        md += `**导师指导意见与灵感：**\n${rec.ideas.map((item) => `- ${item}`).join('\n')}\n\n`;
      }
      if (rec.resources && rec.resources.length > 0) {
        md += `**关联外链与资源文档：**\n${rec.resources.map((r) => `- [${r.title}](${r.url}) (${r.type})`).join('\n')}\n\n`;
      }
    });

    return md;
  };

  const handleDownloadFile = () => {
    const content = generateMarkdown();
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `督导记录汇总_${supervisor.name}_${record ? record.date : '全套'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-fadeIn print:p-0 print:static print:bg-white print:backdrop-blur-none">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden print:border-0 print:shadow-none print:max-h-none print:rounded-none">
        {/* Modal Top Bar (Hidden on print) */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 rounded-xl font-bold">
              📄
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>导出督导记录 PDF 汇总报告</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {record ? `导出单条督导记录 (${record.date})` : `导出 ${supervisor.name} 导师全套督导文档档案 (${recordsToExport.length} 条)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="调用系统打印机直接保存/导出为 PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>导出/打印 PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFile}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer hidden sm:flex"
              title="下载 Markdown/TXT 格式"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载 .md 文档</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer hidden sm:flex"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? '已复制' : '复制全文'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Printable Content View */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-100 print:p-0 print:overflow-visible">
          <div ref={printRef} className="space-y-6 max-w-3xl mx-auto">
            {/* Header Title Banner */}
            <div className="border-b-2 border-rose-500 pb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <span>🎓 督导记录与导师反思档案</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  督导师：<strong>{supervisor.name}</strong> ({supervisor.gender}) | 打印生成日期：{new Date().toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 hidden sm:block">
                <span className="px-2.5 py-1 bg-rose-50 dark:bg-slate-800 text-rose-800 dark:text-rose-300 font-bold rounded-lg border border-rose-200 dark:border-slate-700">
                  保密档案 Confidential
                </span>
              </div>
            </div>

            {/* Supervisor Metadata Box */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">督导师</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{supervisor.name}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">督导周期</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{supervisor.startDate} ~ {supervisor.endDate}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">完成记录数</span>
                <span className="font-bold text-rose-600">{recordsToExport.length} 次</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">督导总配额</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{supervisor.totalSupervisions} 次</span>
              </div>
            </div>

            {/* Records List */}
            <div className="space-y-6">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-l-4 border-rose-500 pl-2.5 flex items-center justify-between">
                <span>明细督导会谈与逐字稿记录</span>
              </h2>

              {recordsToExport.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                  暂无已登记的督导记录。
                </div>
              ) : (
                recordsToExport.map((rec, index) => {
                  const caseObj = getCaseInfo(rec.caseId);
                  return (
                    <div
                      key={rec.id || index}
                      className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3 bg-white dark:bg-slate-900 shadow-2xs break-inside-avoid"
                    >
                      {/* Record Title Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                            督导记录 #{index + 1}
                          </span>
                          <span className="text-xs px-2 py-0.5 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-bold rounded-md border border-rose-200 dark:border-rose-900">
                            {rec.date} [{rec.timeRange}]
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md">
                            {rec.type === 'individual' ? '1. 个体督导' : '2. 团体督导'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 font-semibold">
                          <span>{caseObj.avatar}</span>
                          <span>{caseObj.caseNum} {caseObj.name}</span>
                          <span className="text-rose-600">(第 {rec.sessionNum} 次咨询)</span>
                        </div>
                      </div>

                      {/* Reflection */}
                      {rec.reflection && (
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5" />
                            <span>督导反思与总结要点:</span>
                          </div>
                          <div
                            className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 bg-rose-50/40 dark:bg-slate-800/40 p-3 rounded-lg border border-rose-100 dark:border-slate-800"
                            dangerouslySetInnerHTML={{ __html: rec.reflection }}
                          />
                        </div>
                      )}

                      {/* Transcript */}
                      {rec.transcript && (
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                            <Mic className="w-3.5 h-3.5" />
                            <span>督导对话逐字稿:</span>
                          </div>
                          <div
                            className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 bg-emerald-50/30 dark:bg-slate-800/40 p-3 rounded-lg border border-emerald-100 dark:border-slate-800"
                            dangerouslySetInnerHTML={{ __html: rec.transcript }}
                          />
                        </div>
                      )}

                      {/* Ideas */}
                      {rec.ideas && rec.ideas.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                            <Lightbulb className="w-3.5 h-3.5" />
                            <span>导师建议与指导意见:</span>
                          </div>
                          <ul className="list-disc list-inside text-xs space-y-1 pl-1 text-slate-700 dark:text-slate-300">
                            {rec.ideas.map((idea, i) => (
                              <li key={i}>{idea}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Resources */}
                      {rec.resources && rec.resources.length > 0 && (
                        <div className="space-y-1">
                          <div className="text-[11px] font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                            <LinkIcon className="w-3.5 h-3.5" />
                            <span>关联在线文档与参考文件:</span>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {rec.resources.map((res) => (
                              <span
                                key={res.id}
                                className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                              >
                                {res.title} ({res.type === 'file' ? '本地文件' : res.url})
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Print Footer Notice */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400 dark:text-slate-500">
              本文档由临床心理咨询系统生成，严格受心理咨询伦理守则保护。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
