import React from 'react';
import { Send, Bot, ShieldCheck, Database, DollarSign, Activity } from 'lucide-react';
import { TelegramBotConfig } from '../types';

interface Props {
  botConfig: TelegramBotConfig | null;
  totalCostUsd: number;
  totalCostToman: number;
  onOpenArchitecture: () => void;
}

export const Header: React.FC<Props> = ({ botConfig, totalCostUsd, totalCostToman, onOpenArchitecture }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between z-20 sticky top-0" dir="rtl">
      {/* Brand & Bot Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Send className="w-5 h-5 -rotate-45 ml-0.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base tracking-tight text-white">TeleMasters</h1>
              <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full font-medium">
                هوشمند تلگرام
              </span>
            </div>
            <p className="text-xs text-slate-400">داشبورد یکپارچه مدیریت محتوا و شورای ایجنت‌ها</p>
          </div>
        </div>

        {/* Telegram Bot Live Pill */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <Bot className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-300 font-medium">ربات:</span>
          <span className="text-emerald-400 font-mono text-[11px] dir-ltr">{botConfig?.botUsername || '@TeleMasters_AiBot'}</span>
        </div>
      </div>

      {/* Right Controls: Cost Tracker, Security, Architecture Modal */}
      <div className="flex items-center gap-3">
        {/* Cost Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs">
          <DollarSign className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-400 hidden md:inline">هزینه امروز API:</span>
          <span className="font-mono text-amber-300 font-semibold">${totalCostUsd.toFixed(3)}</span>
          <span className="text-[11px] text-slate-400 hidden lg:inline">({totalCostToman.toLocaleString('fa-IR')} تومان)</span>
        </div>

        {/* Security Vault Indicator */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span className="hidden sm:inline">گاوصندوق AES-256</span>
        </div>

        {/* Architecture & DB schema button */}
        <button
          onClick={onOpenArchitecture}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition shadow-md shadow-blue-600/20"
        >
          <Database className="w-3.5 h-3.5" />
          <span>اسکیما و معماری</span>
        </button>
      </div>
    </header>
  );
};
