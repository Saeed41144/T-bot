import React, { useState } from 'react';
import {
  KeyRound,
  ShieldCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cpu,
  Layers,
  Sparkles,
  Lock,
  ArrowUpDown,
  Zap,
} from 'lucide-react';
import { StoredKey, RoutingMatrix } from '../types';
import { api } from '../services/api';

interface Props {
  keys: StoredKey[];
  routingMatrix: RoutingMatrix;
  onRefresh: () => void;
}

export const KeyVaultModule: React.FC<Props> = ({ keys, routingMatrix, onRefresh }) => {
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [provider, setProvider] = useState('openai');
  const [keyName, setKeyName] = useState('');
  const [category, setCategory] = useState<'text' | 'image' | 'video' | 'audio'>('text');
  const [plainKey, setPlainKey] = useState('');
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; message: string; latency?: number } | null>(null);

  // Available task options
  const taskList = [
    {
      key: 'summarization',
      title: 'خلاصه‌سازی و استخراج نکات',
      desc: 'استخراج داده‌های کلیدی و خلاصه‌های تلگرامی از متون طولانی',
      current: routingMatrix?.summarization,
    },
    {
      key: 'ideaGeneration',
      title: 'ایده‌پردازی و تیترزنی (Hooks)',
      desc: 'تولید زوایای نو، پرسش‌های ترغیب‌کننده و سناریوهای داغ',
      current: routingMatrix?.ideaGeneration,
    },
    {
      key: 'rewriting',
      title: 'بازنویسی و بومی‌سازی زبان فارسی',
      desc: 'نگارش روان، اصلاح لحن و ساختار پاراگرافی متناسب با مخاطب ایرانی',
      current: routingMatrix?.rewriting,
    },
    {
      key: 'copyrightAudit',
      title: 'ممیزی کپی‌رایت و حقوق نشر',
      desc: 'سنجش درصد شباهت متنی با کانال مبدأ و پیشنهاد ارجاع اخلاقی',
      current: routingMatrix?.copyrightAudit,
    },
    {
      key: 'audioScripting',
      title: 'سناریونویسی پادکست و پیام صوتی',
      desc: 'نگارش سناریو برای تبدیل به وویس تلگرام با لحن گفتاری',
      current: routingMatrix?.audioScripting,
    },
  ];

  const modelOptions = [
    { provider: 'anthropic', model: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Anthropic)' },
    { provider: 'openai', model: 'gpt-4o', label: 'GPT-4o (OpenAI)' },
    { provider: 'openai', model: 'gpt-4o-mini', label: 'GPT-4o-mini (اقتصادی)' },
    { provider: 'google', model: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash (سریع و هوشمند)' },
    { provider: 'deepseek', model: 'deepseek-chat', label: 'DeepSeek V3 (قدرتمند در منطق)' },
    { provider: 'deepseek', model: 'deepseek-reasoner', label: 'DeepSeek R1 (استدلال عمیق)' },
  ];

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plainKey) return;
    await api.addKey({
      provider,
      name: keyName || `${provider.toUpperCase()} Key`,
      category,
      plainKeyValue: plainKey,
    });
    setPlainKey('');
    setKeyName('');
    setIsAddingKey(false);
    onRefresh();
  };

  const handleTestKey = async (id: string) => {
    setTestingKeyId(id);
    setTestResult(null);
    try {
      const res = await api.testKey(id);
      setTestResult({ id, message: res.message, latency: res.latencyMs });
    } catch {
      setTestResult({ id, message: 'خطا در تست اعتبار کلید.' });
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (confirm('آیا از حذف این کلید API از گاوصندوق رمزنگاری اطمینان دارید؟')) {
      await api.deleteKey(id);
      onRefresh();
    }
  };

  const handleRoutingChange = async (taskKey: string, modelStr: string) => {
    const matched = modelOptions.find((m) => m.model === modelStr);
    if (!matched) return;
    await api.updateRouting(taskKey, matched);
    onRefresh();
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Security Callout */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/30 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">گاوصندوق امن کلیدهای API (AES-256-GCM)</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  رمزنگاری در سطح دیتابیس
                </span>
              </div>
              <p className="text-xs text-slate-400">
                کلیدهای شما به صورت متن خام (Plain Text) ذخیره نمی‌شوند و قبل از ذخیره‌سازی با الگوریتم رمزنگاری دوجانبه سخت‌افزاری قفل می‌شوند.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddingKey(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shrink-0 shadow-lg shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            افزودن کلید جدید به گاوصندوق
          </button>
        </div>
      </div>

      {/* Grid: Stored Keys Vault vs Task Routing Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stored Keys List (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-emerald-400" />
              <h3 className="font-bold text-white text-base">کلیدهای ثبت‌شده و وضعیت اتصال</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{keys.length} کلید امن فعال</span>
          </div>

          <div className="space-y-3">
            {keys.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-800 space-y-2">
                <p>هیچ کلید هوش مصنوعی در گاوصندوق ثبت نشده است.</p>
                <p className="text-[11px] text-slate-600">
                  برای اتصال سیستم به مدل‌های هوش مصنوعی، از دکمه «افزودن کلید جدید به گاوصندوق» استفاده نمایید.
                </p>
              </div>
            ) : (
              keys.map((k) => (
              <div
                key={k.id}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        k.status === 'valid' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                      }`}
                    ></span>
                    <span className="font-bold text-slate-200 text-sm">{k.name}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {k.provider}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {k.category === 'text'
                        ? 'متنی / زبانی'
                        : k.category === 'image'
                        ? 'تولید تصویر'
                        : k.category === 'video'
                        ? 'تولید ویدیو'
                        : 'تولید صدا'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleTestKey(k.id)}
                      disabled={testingKeyId === k.id}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium transition flex items-center gap-1 border border-slate-700"
                    >
                      {testingKeyId === k.id ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-blue-400" />
                      ) : (
                        <Zap className="w-3 h-3 text-amber-400" />
                      )}
                      تست پینگ
                    </button>
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-slate-400 pt-1 border-t border-slate-900">
                  <span className="dir-ltr text-slate-300 font-semibold">{k.maskedValue}</span>
                  <span className="text-[11px] text-slate-500">
                    آخرین بررسی:{' '}
                    {k.lastTestedAt ? new Date(k.lastTestedAt).toLocaleTimeString('fa-IR') : 'به‌تازگی'}
                  </span>
                </div>

                {testResult && testResult.id === k.id && (
                  <div className="p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
                    <span>{testResult.message}</span>
                    {testResult.latency && <span>پاسخ: {testResult.latency}ms</span>}
                  </div>
                )}
              </div>
            )))}
          </div>
        </div>

        {/* Task Assignment / Routing Matrix (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="font-bold text-white text-base">ماتریس تخصیص مدل‌ها به وظایف</h3>
              <p className="text-xs text-slate-400">تعیین هوشمند اینکه هر تسک با کدام مدل پردازش شود</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {taskList.map((task) => (
              <div
                key={task.key}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-xs">{task.title}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-300">
                    {task.current?.label || 'پیش‌فرض'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{task.desc}</p>
                <div>
                  <select
                    value={task.current?.model || 'gemini-3.8-flash'}
                    onChange={(e) => handleRoutingChange(task.key, e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {modelOptions.map((opt) => (
                      <option key={opt.model} value={opt.model}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Add Key */}
      {isAddingKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-5 h-5" />
              <h3 className="text-white text-base">افزودن کلید جدید به گاوصندوق رمزنگاری</h3>
            </div>
            <p className="text-xs text-slate-400">
              کلید ورودی فوراً با کلید اختصاصی سرور رمزنگاری شده و کاراکترهای میانی آن ماسک می‌شوند.
            </p>

            <form onSubmit={handleAddKey} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">ارائه‌دهنده سرویس (Provider):</label>
                <select
                  value={provider}
                  onChange={(e) => setProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="openai">OpenAI (GPT-4o, DALL-E, TTS)</option>
                  <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                  <option value="google">Google (Gemini 3.8 Flash / Pro)</option>
                  <option value="deepseek">DeepSeek (V3, R1 Reasoner)</option>
                  <option value="elevenlabs">ElevenLabs (صدا و گفتار)</option>
                  <option value="runway">Runway ML (تولید ویدیو Gen-3)</option>
                  <option value="midjourney">Midjourney / Imagine API (تصویر)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">دسته‌بندی عملکردی:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="text">مدل زبانی و متنی (Text LLM)</option>
                  <option value="image">تولید تصویر (Image Generation)</option>
                  <option value="video">تولید ویدیو (Video Generation)</option>
                  <option value="audio">تولید صدا / گفتار (Voice / TTS)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">نام یا برچسب کلید:</label>
                <input
                  type="text"
                  value={keyName}
                  onChange={(e) => setKeyName(e.target.value)}
                  placeholder="مثلاً: کلید اصلی پروداکشن کلود"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">مقدار کلید API (Secret Key):</label>
                <input
                  type="password"
                  value={plainKey}
                  onChange={(e) => setPlainKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white dir-ltr font-mono focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingKey(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500 transition shadow-md shadow-emerald-600/20"
                >
                  رمزنگاری و ذخیره امن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
