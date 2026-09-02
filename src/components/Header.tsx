import React from 'react';
import { TelegramBotConfig } from '../types';
import { Bot, Shield, Zap, RefreshCw, Cpu, Layers } from 'lucide-react';

interface HeaderProps {
  botConfig: TelegramBotConfig | null;
  totalCostUsd: number;
  totalCostToman: number;
  onOpenArchitecture: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  botConfig,
  totalCostUsd,
  totalCostToman,
  onOpenArchitecture,
}) => {
  const isOnline = botConfig?.isConnected && botConfig?.status === 'online';

  return (
    <header className="bg-slate-900/95 backdrop-blur border-b border-slate-800 text-slate-100 px-6 py-3.5 sticky top-0 z-30 flex items-center justify-between">
      {/* Brand & Status */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 ring-1 ring-white/20">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              تِله‌مَستِرز <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">TeleMasters v2.4</span>
            </h1>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
            <span>سیستم خودمختار مدیریت کانال و شورای چند-ایجنتی هوش مصنوعی</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="text-[11px] text-slate-300">
                {isOnline ? `متصل: ${botConfig?.botUsername || 'ربات فعال'}` : 'در انتظار اتصال ربات'}
              </span>
            </span>
          </p>
        </div>
      </div>

      {/* Quick Metrics & Actions */}
      <div className="flex items-center gap-4">
        {/* Token Cost Widget */}
        <div className="hidden md:flex items-center gap-3 bg-slate-950/70 border border-slate-800/80 px-3.5 py-1.5 rounded-xl text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>هزینه مدل‌های امروز:</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="text-emerald-400 font-semibold">${totalCostUsd.toFixed(4)}</span>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300">{totalCostToman.toLocaleString('fa-IR')} تومان</span>
          </div>
        </div>

        {/* System Architecture Button */}
        <button
          onClick={onOpenArchitecture}
          className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 active:scale-95 transition-all text-xs font-medium px-3.5 py-2 rounded-xl border border-slate-700 text-slate-200"
          title="مشاهده ساختار و نمودار فنی سامانه"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">معماری سیستم</span>
        </button>
      </div>
    </header>
  );
};
