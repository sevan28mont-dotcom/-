import React, { useRef, useState } from 'react';
import { CaseRecord, SessionData } from '../types';
import {
  X,
  Printer,
  Download,
  Copy,
  Check,
  Mic,
  FileText,
  Lightbulb,
  Link as LinkIcon,
} from 'lucide-react';

interface ExportTranscriptPdfModalProps {
  caseRecord: CaseRecord;
  sessionNum: number;
  sessionData: SessionData;
  onClose: () => void;
}

export const ExportTranscriptPdfModal: React.FC<ExportTranscriptPdfModalProps> = ({
  caseRecord,
  sessionNum,
  sessionData,
  onClose,
}) => {
  if (!caseRecord || !caseRecord.id || !sessionData) return null;

  const [copied, setCopied] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const generateMarkdown = () => {
    let md = `# 会谈逐字稿与咨询记录单 (第 ${sessionNum} 次)\n\n`;
    md += `*来访者：${caseRecord.name} (${caseRecord.caseNum}) | 打印时间：${new Date().toLocaleString()}*\n\n`;
    md += `## 一、会谈基本信息\n`;
    md += `- **个案代号/姓名**：${caseRecord.name}\n`;
    md += `- **个案编号**：${caseRecord.caseNum}\n`;
    md += `- **会谈次序**：第 ${sessionNum} 次咨询\n`;
    md += `- **完成状态**：${sessionData.completed ? '已完成' : '未完成'}\n\n`;

    if (sessionData.note) {
      md += `## 二、咨询笔记与评估观察\n`;
      md += `${sessionData.note.replace(/<[^>]+>/g, '')}\n\n`;
    }

    if (sessionData.transcript) {
      md += `## 三、会谈完整逐字稿记录\n`;
      md += `${sessionData.transcript.replace(/<[^>]+>/g, '')}\n\n`;
    }

    if (sessionData.ideas && sessionData.ideas.length > 0) {
      md += `## 四、当次思考想法与随记\n`;
      md += `${sessionData.ideas.map((item) => `- ${item}`).join('\n')}\n\n`;
    }

    if (sessionData.resources && sessionData.resources.length > 0) {
      md += `## 五、关联参考资源与文件\n`;
      md += `${sessionData.resources.map((r) => `- [${r.title}](${r.url}) (${r.type})`).join('\n')}\n\n`;
    }

    return md;
  };

  const handleDownloadFile = () => {
    const content = generateMarkdown();
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `逐字稿记录_第${sessionNum}次_${caseRecord.caseNum}_${caseRecord.name}.md`;
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
        {/* Top Header */}
        <div className="p-3 sm:p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl font-bold">
              🎙️
            </span>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <span>导出第 {sessionNum} 次会谈逐字稿 PDF 卷宗</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                个案：{caseRecord.name} ({caseRecord.caseNum})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              title="调用系统打印机导出为 PDF 格式"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>导出/打印 PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadFile}
              className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer hidden sm:flex"
            >
              <Download className="w-3.5 h-3.5" />
              <span>下载 .md</span>
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

        {/* Printable Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-100 print:p-0 print:overflow-visible">
          <div ref={printRef} className="space-y-6 max-w-3xl mx-auto">
            {/* Header Banner */}
            <div className="border-b-2 border-emerald-500 pb-4 flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <span>🎙️ 心理咨询会谈逐字稿与咨询记录</span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  来访者：<strong>{caseRecord.name}</strong> ({caseRecord.caseNum}) | 咨询节次：<strong>第 {sessionNum} 次</strong> | 导出日期：{new Date().toLocaleDateString('zh-CN')}
                </p>
              </div>
              <div className="text-right text-xs text-slate-500 hidden sm:block">
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-slate-800 text-emerald-800 dark:text-emerald-300 font-bold rounded-lg border border-emerald-200 dark:border-slate-700">
                  保密逐字稿 Confidential
                </span>
              </div>
            </div>

            {/* Note */}
            {sessionData.note && (
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-l-4 border-rose-500 pl-2.5 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>咨询笔记与评估分析</span>
                </h2>
                <div
                  className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700"
                  dangerouslySetInnerHTML={{ __html: sessionData.note }}
                />
              </div>
            )}

            {/* Transcript */}
            <div className="space-y-2">
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-l-4 border-emerald-500 pl-2.5 flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-emerald-500" />
                <span>完整逐字稿文本</span>
              </h2>
              {sessionData.transcript ? (
                <div
                  className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 bg-emerald-50/20 dark:bg-slate-800/40 p-4 rounded-xl border border-emerald-200/80 dark:border-slate-700 whitespace-pre-wrap font-sans"
                  dangerouslySetInnerHTML={{ __html: sessionData.transcript }}
                />
              ) : (
                <div className="p-4 text-xs text-slate-400 bg-slate-50 rounded-xl text-center border border-dashed">
                  此节会谈未登记详细逐字稿文本。
                </div>
              )}
            </div>

            {/* Ideas */}
            {sessionData.ideas && sessionData.ideas.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-l-4 border-amber-500 pl-2.5 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>当次思考与灵感列表</span>
                </h2>
                <ul className="list-disc list-inside text-xs space-y-1.5 bg-amber-50/30 dark:bg-slate-800/40 p-3.5 rounded-xl border border-amber-200/60 dark:border-slate-700">
                  {sessionData.ideas.map((idea, index) => (
                    <li key={index} className="text-slate-800 dark:text-slate-200">{idea}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resources */}
            {sessionData.resources && sessionData.resources.length > 0 && (
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 border-l-4 border-blue-500 pl-2.5 flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4 text-blue-500" />
                  <span>关联在线文档与参考资源</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {sessionData.resources.map((res) => (
                    <div key={res.id} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <div className="font-bold text-slate-800 dark:text-slate-200">{res.title}</div>
                      <div className="text-[11px] text-slate-500 truncate">{res.type === 'file' ? '本地文件附件' : res.url}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-[10px] text-slate-400">
              本文档由临床心理咨询系统生成，受心理咨询师职业伦理及法律隐私保护。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
