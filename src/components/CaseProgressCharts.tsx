import React from 'react';
import { CaseRecord } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { PieChart as PieIcon, TrendingUp, CheckCircle, Clock } from 'lucide-react';

interface CaseProgressChartsProps {
  record?: CaseRecord;
  caseRecord?: CaseRecord;
}

export const CaseProgressCharts: React.FC<CaseProgressChartsProps> = ({ record, caseRecord }) => {
  const targetRecord = record || caseRecord;
  if (!targetRecord) return null;

  const sessions = targetRecord.sessions || {};
  const total = targetRecord.totalSessions || 20;

  // Compute completed vs remaining
  const completedCount = (Object.values(sessions) as any[]).filter((s) => s?.completed).length;
  const recordedCount = Object.keys(sessions).length;
  const remainingCount = Math.max(0, total - completedCount);

  // Data for Pie Chart
  const pieData = [
    { name: '已完成节次', value: completedCount, color: '#e11d48' }, // Rose-600
    { name: '未完成/计划节次', value: remainingCount, color: '#e2e8f0' }, // Slate-200 / Slate-700
  ];

  // Data for Duration/Progress Line Chart
  const lineData = Array.from({ length: Math.max(total, recordedCount) }, (_, i) => {
    const sessionNum = i + 1;
    const sess = sessions[sessionNum];
    const duration = sess?.durationMinutes || (sess?.completed ? 50 : 0);
    return {
      sessionLabel: `第${sessionNum}次`,
      sessionNum,
      duration,
      completed: sess?.completed ? 1 : 0,
      hasNote: sess?.note ? 1 : 0,
    };
  }).slice(0, Math.max(recordedCount + 3, 10)); // Show active sessions up to next few planned

  return (
    <div className="bg-rose-50/40 dark:bg-slate-900/80 border border-rose-200/80 dark:border-slate-800 rounded-2xl p-4 my-3 space-y-4">
      <div className="flex items-center justify-between border-b border-rose-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-rose-500 text-white rounded-lg shadow-2xs">
            <PieIcon className="w-4 h-4" />
          </div>
          <h4 className="font-bold text-xs sm:text-sm text-zinc-800 dark:text-slate-100">
            个案咨询进度可视化面板 ({targetRecord.caseNum || ''} {targetRecord.name || ''})
          </h4>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800">
            <CheckCircle className="w-3 h-3" />
            已完成 {completedCount} / {total} 节
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie/Donut Chart */}
        <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-rose-100 dark:border-slate-800 flex flex-col items-center justify-center">
          <div className="text-[11px] font-bold text-zinc-600 dark:text-slate-300 mb-1 flex items-center gap-1">
            <PieIcon className="w-3.5 h-3.5 text-rose-500" />
            <span>节次完成比例环形图</span>
          </div>
          <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [`${value} 节`, '节次']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 text-[11px] font-bold mt-1">
            <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block"></span>
              已完成 ({Math.round((completedCount / total) * 100)}%)
            </span>
            <span className="flex items-center gap-1 text-zinc-400 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 inline-block"></span>
              未完成 ({Math.round((remainingCount / total) * 100)}%)
            </span>
          </div>
        </div>

        {/* Line Chart for Duration/Session Trends */}
        <div className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-rose-100 dark:border-slate-800 flex flex-col justify-between">
          <div className="text-[11px] font-bold text-zinc-600 dark:text-slate-300 mb-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
            <span>会谈时长趋势 (分钟/节)</span>
          </div>
          <div className="w-full h-40">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.3} />
                <XAxis dataKey="sessionLabel" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 60]} stroke="#94a3b8" />
                <Tooltip
                  formatter={(val: any) => [`${val} 分钟`, '咨询时长']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    borderColor: '#334155',
                    color: '#fff',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="duration"
                  stroke="#e11d48"
                  strokeWidth={2}
                  dot={{ r: 4, fill: '#f43f5e' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="text-[10px] text-zinc-400 dark:text-slate-500 text-center mt-1">
            每节标准咨询时间为 50 分钟，折线反映会谈持续时长波动
          </p>
        </div>
      </div>
    </div>
  );
};
