import React from 'react';
import {
  Activity,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Layers,
  Cpu,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { QueueJob, CostReport } from '../types';

interface Props {
  jobs: QueueJob[];
  costReport: CostReport | null;
  onRefresh: () => void;
}

export const CostAndQueueModule: React.FC<Props> = ({ jobs, costReport, onRefresh }) => {
  const pendingJobs = jobs.filter((j) => j.status === 'processing' || j.status === 'queued');
  const completedJobs = jobs.filter((j) => j.status === 'completed' || j.status === 'failed');

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner: Financial Overview */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">مرکز پایش هزینه‌ها و صف کارهای پس‌زمینه (Queue)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  تخمین لحظه‌ای دلار و تومان
                </span>
              </div>
              <p className="text-xs text-slate-400">
                ردیابی موشکافانه مصرف توکن‌های متنی و هزینه‌های رندر مدیا به همراه مدیریت صف کارهای سنگین (BullMQ / Redis)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-400 block">کل هزینه امروز:</span>
              <span className="text-xl font-extrabold text-emerald-400 font-mono">
                ${costReport?.totalTodayUsd.toFixed(3) || '0.048'}
              </span>
            </div>
            <div className="w-px h-8 bg-slate-800"></div>
            <div>
              <span className="text-[11px] text-slate-400 block">معادل ریالی:</span>
              <span className="text-base font-bold text-slate-200">
                {(costReport?.totalTodayToman || 4800).toLocaleString('fa-IR')} تومان
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Provider Cost Breakdown Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {costReport?.byProvider && Object.keys(costReport.byProvider).length > 0 ? (
          Object.entries(costReport.byProvider).map(([prov, data]: [string, { usd: number; toman: number; calls: number }]) => (
            <div
              key={prov}
              className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5"
            >
              <span className="text-[10px] uppercase font-mono text-slate-400 block font-semibold">
                {prov}
              </span>
              <div className="text-sm font-bold text-white font-mono">${data.usd.toFixed(3)}</div>
              <div className="text-[10px] text-slate-400 font-medium">
                {data.toman.toLocaleString('fa-IR')} تومان
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-4 text-center text-xs text-slate-500 rounded-xl bg-slate-900/40 border border-slate-800">
            هنوز درخواست هوش مصنوعی ثبت نشده و هزینه‌ای مصرف نگردیده است (۰ تومان).
          </div>
        )}
      </div>

      {/* Active Jobs Queue and Background Workers */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active & Queued Tasks (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-400" />
              <h3 className="font-bold text-white text-base">کارهای در حال اجرا و صف انتظار</h3>
            </div>
            <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
              {pendingJobs.length} تسک فعال
            </span>
          </div>

          <div className="space-y-3">
            {pendingJobs.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                در حال حاضر هیچ کار سنگینی در صف پردازش نیست.
              </div>
            ) : (
              pendingJobs.map((job) => (
                <div
                  key={job.id}
                  className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200 text-xs">{job.title}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      {job.status === 'processing' ? 'در حال پردازش' : 'در صف'}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>پیشرفت رندر</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="font-mono uppercase">{job.type} • {job.provider}</span>
                    <span>شروع: {new Date(job.createdAt).toLocaleTimeString('fa-IR')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Completed Jobs History & Execution Logs (6 cols) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">تاریخچه کارهای انجام‌شده و لاگ نتایج</h3>
            </div>
            <button
              onClick={onRefresh}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              بروزرسانی
            </button>
          </div>

          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {completedJobs.map((job) => (
              <div
                key={job.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs">{job.title}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      job.status === 'completed'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}
                  >
                    {job.status === 'completed' ? 'تکمیل شد' : 'شکست'}
                  </span>
                </div>

                {job.result && (
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    نتیجه: {job.result}
                  </p>
                )}

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                  <span>سرویس: {job.provider}</span>
                  <span>
                    پایان:{' '}
                    {job.completedAt ? new Date(job.completedAt).toLocaleTimeString('fa-IR') : '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
