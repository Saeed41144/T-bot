import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Database, Server, FolderTree, Shield, Cpu, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'architecture' | 'schema' | 'folders'>('architecture');
  const [schemaData, setSchemaData] = useState<{ schemaSQL: string; folderStructure: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getArchitectureSchema().then(setSchemaData).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in" dir="rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">معماری فنی، ساختار پوشه‌ها و اسکیمای دیتابیس</h2>
              <p className="text-xs text-slate-400">پیشنهاد تخصصی پروداکشن بر پایه NestJS / FastAPI + PostgreSQL + BullMQ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'architecture'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            معماری سیستم و پشته فناوری
          </button>
          <button
            onClick={() => setActiveTab('schema')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'schema'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            اسکیمای کامل PostgreSQL (DDL)
          </button>
          <button
            onClick={() => setActiveTab('folders')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition ${
              activeTab === 'folders'
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FolderTree className="w-4 h-4" />
            ساختار ماژولار پوشه‌ها
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-300">
          {activeTab === 'architecture' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <div className="flex items-center gap-2 text-blue-400 font-bold mb-2">
                    <Server className="w-4 h-4" />
                    لایه Backend
                  </div>
                  <p className="text-xs text-slate-300 mb-2"><strong>پیشنهاد اول:</strong> Node.js با فریمورک NestJS (تایپ‌اسکریپت و ماژولار) یا FastAPI پایتون.</p>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                    <li>مدیریت وب‌هوک و MTProto با GramJS / Telethon</li>
                    <li>سیستم صف BullMQ / Celery با ردیس</li>
                    <li>رمزنگاری کلیدهای API با AES-256-GCM</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold mb-2">
                    <Database className="w-4 h-4" />
                    لایه داده و Cache
                  </div>
                  <p className="text-xs text-slate-300 mb-2"><strong>دیتابیس:</strong> PostgreSQL 16 همراه با پسوند pgvector (برای جستجوی معنایی و ممانعت از کپی‌رایت).</p>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                    <li>Redis برای صف کارهای سنگین (ویدیو/صدا)</li>
                    <li>پایگاه داده رابطه‌ای با قفل‌گذاری سطرها برای زمان‌بندی</li>
                    <li>سیستم لاگ مصرف توکن و ثبت هزینه‌ها</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                  <div className="flex items-center gap-2 text-purple-400 font-bold mb-2">
                    <Cpu className="w-4 h-4" />
                    موتور هوش مصنوعی و شورا
                  </div>
                  <p className="text-xs text-slate-300 mb-2"><strong>یکپارچگی مدل‌ها:</strong> معماری روتر چندمدلی (Multi-Provider Dispatcher).</p>
                  <ul className="text-xs text-slate-400 space-y-1 list-disc list-inside">
                    <li>مسیریابی وظایف (Claude، GPT-4o، DeepSeek، Gemini)</li>
                    <li>شورای چند-ایجنتی با معماری ReAct و فراخوانی ابزارها</li>
                    <li>موتور ممیزی حقوق نشر با محاسبه شباهت برداری</li>
                  </ul>
                </div>
              </div>

              {/* Security & Copyright Guard */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 flex items-start gap-3">
                <Shield className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <span className="font-bold text-amber-300 block">رعایت قوانین حق نشر (Copyright) و شرایط سرویس تلگرام:</span>
                  <p className="text-slate-300 leading-relaxed">
                    سیستم تنها کانال‌هایی را رصد می‌کند که ربات در آنها مجاز به فعالیت بوده یا به عنوان فید معتبر عمومی معرفی شده‌اند. سیستم ممیزی Human-in-the-Loop با مقایسه برداری (Cosine Similarity) تضمین می‌کند محتوای بازنویسی‌شده زیر ۲۵٪ شباهت ساختاری داشته باشد و با ذکر منبع اخلاقی، بازآفرینی خلاقانه گردد نه کپی برداری خام.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'schema' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-mono">اسکیمای کامل شامل جداول کلیدها، کانال‌ها، پست‌ها، صف و لاگ مالی</span>
                <button
                  onClick={() => copyToClipboard(schemaData?.schemaSQL || '')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'کپی شد' : 'کپی DDL'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400/90 overflow-x-auto max-h-[480px] leading-relaxed select-all" dir="ltr">
                {schemaData?.schemaSQL || '-- در حال بارگذاری اسکیما...'}
              </pre>
            </div>
          )}

          {activeTab === 'folders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">ساختار دایرکتوری تمیز با تفکیک لایه‌های مسئولیت (Clean Architecture)</span>
                <button
                  onClick={() => copyToClipboard(schemaData?.folderStructure || '')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'کپی شد' : 'کپی ساختار'}
                </button>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-blue-300/90 overflow-x-auto max-h-[480px] leading-relaxed select-all" dir="ltr">
                {schemaData?.folderStructure || '// در حال بارگذاری ساختار...'}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span>TeleMasters Production Architecture Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition"
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
};
