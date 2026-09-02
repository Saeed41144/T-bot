import React from 'react';
import { QueueJob, CostReport } from '../types';
import {
  Activity,
  DollarSign,
  Cpu,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

interface CostAndQueueModuleProps {
  jobs: QueueJob[];
  costReport: CostReport | null;
  onRefresh: () => void;
}

export const CostAndQueueModule: React.FC<CostAndQueueModuleProps> = ({
  jobs,
  costReport,
  onRefresh,
}) => {
  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>مجموع هزینه امروز (دلار):</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-2">
            ${costReport?.totalTodayUsd.toFixed(4) || '0.0000'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            محاسبه دقیق توکن‌های Gemini و سرویس‌ها
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>معادل ریالی (تومان):</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-2">
            {(costReport?.totalTodayToman || 0).toLocaleString('fa-IR')} تومان
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            نرخ محاسبه: ۱ دلار = ۱۰۰,۰۰۰ تومان
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>تعداد فراخوانی مدل‌ها:</span>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-purple-400 mt-2">
            {costReport?.logs.length || 0} فراخوانی
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            مشارکت شورا، بازنویسی و استودیو
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Background Jobs Queue */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-xs text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>صف پردازش‌های پس‌زمینه ({jobs.length})</span>
            </h3>
            <button
              onClick={onRefresh}
              className="text-slate-400 hover:text-white p-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {jobs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                صف در حال حاضر خالی است. پردازش‌های استودیو یا رصد در این بخش نمایش داده می‌شوند.
              </div>
            ) : (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs text-slate-200">
                      {job.title || job.taskType}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        job.status === 'completed'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {job.status === 'completed' ? 'تکمیل شد' : 'در حال پردازش'}
                    </span>
                  </div>

                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${job.progress}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                    <span>پیشرفت: {job.progress}%</span>
                    <span>{new Date(job.createdAt).toLocaleTimeString('fa-IR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-xs text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>لاگ دقیق هزینه توکن‌ها</span>
            </h3>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {costReport?.logs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                هنوز هیچ درخواست هوش مصنوعی ثبت نشده است.
              </div>
            ) : (
              costReport?.logs.map((log) => (
                <div
                  key={log.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 flex-1 pl-2">
                    <div className="font-semibold text-slate-200 truncate">
                      {log.task}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                      مدل: {log.model} | توکن‌ها: {log.inputTokens + log.outputTokens}
                    </div>
                  </div>
                  <div className="text-left font-mono shrink-0">
                    <div className="text-emerald-400 font-semibold text-[11px]">
                      ${log.costUsd.toFixed(5)}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {log.costToman} تومان
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
