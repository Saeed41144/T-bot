import React from 'react';
import {
  Send,
  Calendar,
  KeyRound,
  Compass,
  Sparkles,
  Users2,
  Activity,
  Layers,
  Settings,
} from 'lucide-react';

export type NavTab = 'bot' | 'keys' | 'ingest' | 'media' | 'council' | 'queue';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingReviewsCount: number;
  scheduledPostsCount: number;
  activeJobsCount: number;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  pendingReviewsCount,
  scheduledPostsCount,
  activeJobsCount,
}) => {
  const items = [
    {
      id: 'bot' as NavTab,
      label: 'ربات و زمان‌بندی',
      description: 'مدیریت کانال‌ها، سورس‌ها و تقویم پست‌ها',
      icon: Send,
      badge: scheduledPostsCount > 0 ? scheduledPostsCount : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
    },
    {
      id: 'keys' as NavTab,
      label: 'مدیریت کلیدهای API',
      description: 'گاوصندوق رمزنگاری، ماتریس تخصیص مدل‌ها',
      icon: KeyRound,
    },
    {
      id: 'ingest' as NavTab,
      label: 'رصد و پردازش محتوا',
      description: 'فیلتر پیام‌ها، بازنویسی هوشمند و تایید دستی',
      icon: Compass,
      badge: pendingReviewsCount > 0 ? pendingReviewsCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'media' as NavTab,
      label: 'استودیو چندرسانه‌ای',
      description: 'تولید تصویر، ویدیو، صدا و ترکیب پست نهایی',
      icon: Sparkles,
    },
    {
      id: 'council' as NavTab,
      label: 'اتاق گفتگوی شورا (Multi-Agent)',
      description: 'مباحثه زنده ایجنت‌های هوش مصنوعی با ابزارها',
      icon: Users2,
      badge: '۴ ایجنت',
      badgeColor: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    },
    {
      id: 'queue' as NavTab,
      label: 'صف پردازش و هزینه‌ها',
      description: 'کارهای پس‌زمینه، تخمین هزینه و لاگ API',
      icon: Activity,
      badge: activeJobsCount > 0 ? `${activeJobsCount} در صف` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
  ];

  return (
    <aside className="w-72 border-l border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between shrink-0" dir="rtl">
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-slate-500 px-3 py-1 tracking-wider">
          بخش‌های اصلی پلتفرم
        </div>
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full text-right flex items-start gap-3 p-3 rounded-xl transition group text-sm ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 font-medium'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                    : 'bg-slate-900 text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={`truncate ${isActive ? 'text-white font-bold' : ''}`}>{item.label}</span>
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-medium ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 truncate mt-0.5 group-hover:text-slate-400">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Telegram Terms & Copyright Compliance Reminder */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 space-y-2">
        <div className="flex items-center gap-2 text-slate-300 font-semibold text-[11px]">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>قوانین تلگرام و مالکیت فکری</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          تمام بازنویسی‌ها با مدل‌های هوش مصنوعی اختصاصی تولید شده و از کپی مستقیم جلوگیری می‌شود.
        </p>
      </div>
    </aside>
  );
};
