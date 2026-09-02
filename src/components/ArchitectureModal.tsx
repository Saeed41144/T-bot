import React from 'react';
import { Shield, Cpu, Users, Send, KeyRound, Sparkles, X, Radio } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                معماری فنی و پایپ‌لاین سیستم TeleMasters
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                جریان داده، امنیت، پروتکل شورای چند-عاملی و پایش خودکار بحران
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Technical Blocks */}
        <div className="space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-indigo-400">
              <Users className="w-4 h-4" />
              <span>۱. شورای ایجنت‌های هوش مصنوعی با دسترسی‌های بالا (Multi-Agent Council)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              ۴ ایجنت تخصصی (دکتر تحلیلگر، استاد ویراستار، ناظر اخلاق، استراتژیست وایرال) به ابزارهای رصد زنده کانال‌های ورودی، راستی‌آزمایی چندمنبعی (Cross-Source Fact Checking)، استودیو تصویر DALL-E، استودیو صوت ElevenLabs و انتشار مستقیم در کانال تلگرام مجهز هستند.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
              <span>۲. پروتکل واکنش سریع و ورود خودکار شبانه (Autonomous Breaking News)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              در صورت ورود اخبار با کلمات کلیدی بحران (مانند جنگ، تنش نظامی، اخبار فوری)، سیستم بدون نیاز به مداخله شورا یا کاربر وارد اتاق وضعیت می‌شود. در این وضعیت، اعضا دارای سهمیه پیام نامحدود هستند و گفتگو تا حصول اجماع ۱۰۰٪ ادامه می‌یابد. کاربر در هر لحظه می‌تواند فعال‌سازی خودکار را کنترل یا شبیه‌سازی دستی را اجرا کند.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <Shield className="w-4 h-4" />
              <span>۳. امنیت کلیدهای API و پراکسی بدون نشت (Zero-Leak Vault)</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              کلیه کلیدها با AES-256-GCM در سرور رمزنگاری می‌شوند. مرورگر کلاینت فقط مقدار ماسک‌شده را می‌بیند و کلیه تعاملات هوش مصنوعی از طریق سرور Express مدیریت می‌گردند.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 font-bold text-purple-400">
              <Sparkles className="w-4 h-4" />
              <span>۴. استودیو چندرسانه‌ای و زمان‌بندی انتشار در تلگرام</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              هماهنگی کامل صف وظایف برای رندر موازی عکس و صوت، الصاق به پست‌ها و ارسال خودکار یا با یک کلیک از طریق Telegram Bot API رسمی.
            </p>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};
