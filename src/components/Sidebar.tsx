import React from 'react';
import { NavTab } from '../types';
import {
  Users,
  Send,
  KeyRound,
  FileText,
  Sparkles,
  Activity,
  Flame,
  Radio,
} from 'lucide-react';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingReviewsCount: number;
  scheduledPostsCount: number;
  activeJobsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  pendingReviewsCount,
  scheduledPostsCount,
  activeJobsCount,
}) => {
  const menuItems = [
    {
      id: 'council' as NavTab,
      label: 'شورای ایجنت‌ها و بحران',
      subtitle: 'رصد خودکار، فکت‌چک، تولید و انتشار',
      icon: Users,
      badge: 'اختیارات کامل',
      badgeColor: 'bg-red-500/10 text-red-400 border-red-500/20',
      highlight: true,
    },
    {
      id: 'bot' as NavTab,
      label: 'ربات و کانال‌های تلگرام',
      subtitle: 'مدیریت منبع و مقصد، زمان‌بندی',
      icon: Send,
      badge: scheduledPostsCount > 0 ? `${scheduledPostsCount} پست` : undefined,
      badgeColor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    },
    {
      id: 'ingest' as NavTab,
      label: 'رصد و پالایش محتوا',
      subtitle: 'بازنویسی، ممیزی و ضد سرقت',
      icon: FileText,
      badge: pendingReviewsCount > 0 ? `${pendingReviewsCount} پیام` : undefined,
      badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    {
      id: 'media' as NavTab,
      label: 'استودیو چندرسانه‌ای',
      subtitle: 'تصویر، صوت گوینده، ویدیو AI',
      icon: Sparkles,
      badge: 'ElevenLabs & DALL-E',
      badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    },
    {
      id: 'keys' as NavTab,
      label: 'خزانه امن کلیدهای API',
      subtitle: 'رمزنگاری AES-256 و ماتریس مدل‌ها',
      icon: KeyRound,
    },
    {
      id: 'queue' as NavTab,
      label: 'صف پردازش و هزینه‌ها',
      subtitle: 'مدیریت کشش، توکن و گزارش مالی',
      icon: Activity,
      badge: activeJobsCount > 0 ? `${activeJobsCount} در حال اجرا` : undefined,
      badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    },
  ];

  return (
    <aside className="w-64 lg:w-72 bg-slate-900/60 border-l border-slate-800 flex flex-col p-4 shrink-0 overflow-y-auto">
      <div className="text-[11px] font-semibold text-slate-400 px-3 pb-2 uppercase tracking-wider">
        بخش‌های عملیاتی پلتفرم
      </div>

      <nav className="space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-right p-3 rounded-2xl transition-all flex items-center justify-between group relative ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-medium'
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : item.highlight
                      ? 'bg-red-500/10 text-red-400 group-hover:bg-red-500/20'
                      : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold leading-snug flex items-center gap-1.5">
                    {item.label}
                    {item.highlight && !isActive && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                    )}
                  </div>
                  <div
                    className={`text-[11px] line-clamp-1 mt-0.5 ${
                      isActive ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {item.subtitle}
                  </div>
                </div>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-md border font-medium ${
                    isActive
                      ? 'bg-white/20 text-white border-white/20'
                      : item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Autonomous Guard Status Card */}
      <div className="mt-auto pt-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 text-xs text-slate-300">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              پروتکل کشف بحران شبانه
            </span>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
              فعال (۲۴/۷)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            در صورت انتشار اخبار حساس مانند منازعات نظامی، شورا فوراً وارد اتاق وضعیت شده و با دورهای نامحدود صحت‌سنجی را انجام می‌دهد.
          </p>
        </div>
      </div>
    </aside>
  );
};
