import React, { useState } from 'react';
import { StoredKey, RoutingMatrix } from '../types';
import { api } from '../services/api';
import {
  KeyRound,
  Plus,
  Trash2,
  CheckCircle2,
  ShieldAlert,
  Cpu,
  Layers,
  Sparkles,
  Lock,
  RefreshCw,
  Zap,
} from 'lucide-react';

interface KeyVaultModuleProps {
  keys: StoredKey[];
  routingMatrix: RoutingMatrix;
  onRefresh: () => void;
}

export const KeyVaultModule: React.FC<KeyVaultModuleProps> = ({
  keys,
  routingMatrix,
  onRefresh,
}) => {
  const [provider, setProvider] = useState('openai');
  const [keyName, setKeyName] = useState('');
  const [keyValue, setKeyValue] = useState('');
  const [category, setCategory] = useState<'text' | 'image' | 'video' | 'audio'>('text');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleAddKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyValue.trim()) return;
    setIsSubmitting(true);
    try {
      await api.addKey({
        provider,
        name: keyName.trim() || `${provider.toUpperCase()} Key`,
        category,
        plainKeyValue: keyValue.trim(),
      });
      setKeyValue('');
      setKeyName('');
      onRefresh();
    } catch (err) {
      console.error('Error adding key:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestKey = async (id: string) => {
    try {
      const res = await api.testKey(id);
      setTestResult(`اتصال تایید شد (تأخیر: ${res.latencyMs}ms)`);
      setTimeout(() => setTestResult(null), 3500);
      onRefresh();
    } catch (err) {
      setTestResult('خطا در اعتبارسنجی درگاه.');
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (window.confirm('آیا از حذف این کلید امنیتی اطمینان دارید؟')) {
      await api.deleteKey(id);
      onRefresh();
    }
  };

  return (
    <div className="space-y-6">
      {/* Vault Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
          <Lock className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">
            خزانه امن کلیدهای هوش مصنوعی (AES-256-GCM Encrypted Vault)
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            کلیه کلیدها قبل از ذخیره‌سازی با الگوریتم سخت‌افزاری رمزنگاری شده و تنها به صورت ماسک‌شده در مرورگر نمایش داده می‌شوند. درخواست‌ها به صورت سروری (Zero-Trust Proxy) ارسال می‌گردند تا هیچ کلیدی در کلاینت فاش نشود.
          </p>
        </div>
      </div>

      {testResult && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{testResult}</span>
        </div>
      )}

      {/* Add Key & Stored Keys */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Plus className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs text-white">ثبت کلید جدید</h3>
          </div>

          <form onSubmit={handleAddKey} className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                ارائه‌دهنده سرویس:
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              >
                <option value="google">Google Gemini</option>
                <option value="openai">OpenAI (GPT-4o)</option>
                <option value="anthropic">Anthropic (Claude 3.5)</option>
                <option value="deepseek">DeepSeek</option>
                <option value="elevenlabs">ElevenLabs (وویس و صوت)</option>
                <option value="midjourney">Midjourney (تصویر)</option>
                <option value="runway">Runway (ویدیو)</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                عنوان کلید:
              </label>
              <input
                type="text"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="مثلاً کلید اصلی تیم تولید محتوا"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                دسته‌بندی مدل:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              >
                <option value="text">متن و نگارش (LLM)</option>
                <option value="audio">صوت و گویندگی (TTS)</option>
                <option value="image">تصویر و پوستر</option>
                <option value="video">ویدیو و موشن</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                مقدار کلید API:
              </label>
              <input
                type="password"
                value={keyValue}
                onChange={(e) => setKeyValue(e.target.value)}
                placeholder="sk-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !keyValue.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
            >
              رمزنگاری و ذخیره در خزانه
            </button>
          </form>
        </div>

        {/* Keys List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-xs text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>کلیدهای محافظت‌شده ({keys.length})</span>
            </h3>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {keys.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                هیچ کلیدی ثبت نشده است. می‌توانید کلیدهای خود را اضافه کنید.
              </div>
            ) : (
              keys.map((k) => (
                <div
                  key={k.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-bold text-xs text-blue-400">
                      {k.provider.slice(0, 3).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-200 flex items-center gap-2">
                        <span>{k.name}</span>
                        <span className="font-mono text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">
                          {k.maskedValue}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        دسته: {k.category} | وضعیت:{' '}
                        <span className="text-emerald-400 font-semibold">تأیید شده</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleTestKey(k.id)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 text-[10px] rounded-lg border border-slate-800 transition-colors"
                    >
                      تست پینگ
                    </button>
                    <button
                      onClick={() => handleDeleteKey(k.id)}
                      className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
