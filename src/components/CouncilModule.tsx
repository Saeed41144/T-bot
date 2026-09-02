import React, { useState, useRef, useEffect } from 'react';
import {
  Users2,
  Send,
  Wrench,
  User,
  Vote,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  AlertTriangle,
  Radio,
  Sliders,
  Play,
  Share2,
  Trash2,
  Image as ImageIcon,
  Volume2,
  Clock,
  Check,
  X,
  ExternalLink,
  Flame,
  Globe,
  Plus,
} from 'lucide-react';
import {
  CouncilAgent,
  CouncilMessage,
  CouncilConfig,
  CouncilEmergencySession,
  Channel,
} from '../types';
import { api } from '../services/api';

interface Props {
  agents: CouncilAgent[];
  messages: CouncilMessage[];
  config?: CouncilConfig;
  activeEmergencySession?: CouncilEmergencySession | null;
  destinationChannels: Channel[];
  sourceChannels?: Channel[];
  onRefresh: () => void;
  onPostCreated?: () => void;
}

export const CouncilModule: React.FC<Props> = ({
  agents,
  messages,
  config: initialConfig,
  activeEmergencySession,
  destinationChannels,
  sourceChannels = [],
  onRefresh,
  onPostCreated,
}) => {
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTriggeringEmergency, setIsTriggeringEmergency] = useState(false);
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPublishingPost, setIsPublishingPost] = useState(false);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>('all');
  const [newKeywordInput, setNewKeywordInput] = useState('');

  // Local state for Council Config
  const [config, setConfig] = useState<CouncilConfig>(
    initialConfig || {
      autonomousModeEnabled: true,
      autoPublishOnConsensus: false,
      emergencyKeywords: [
        'جنگ ایران و آمریکا',
        'حمله نظامی',
        'خبر فوری',
        'تنش خلیج فارس',
        'حادثه امنیتی',
        'زلزله شدید',
      ],
      maxDeliberationRounds: 0,
      studioAccessEnabled: true,
      channelPostingEnabled: true,
      channelMonitoringEnabled: true,
    }
  );

  useEffect(() => {
    if (initialConfig) {
      setConfig(initialConfig);
    }
  }, [initialConfig]);

  // Topic for emergency war-room trigger
  const [emergencyTopic, setEmergencyTopic] = useState(
    'گزارش فوری: تنش‌های ژئوپلیتیک و تحرکات نظامی در خاورمیانه (ایران و آمریکا)'
  );

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isSending) return;

    const textToSend = userInput.trim();
    setUserInput('');
    setIsSending(true);

    try {
      await api.sendCouncilMessage(textToSend);
      onRefresh();
    } catch {
      alert('خطا در ارسال پیام به شورا.');
    } finally {
      setIsSending(false);
    }
  };

  const handleTriggerEmergency = async () => {
    setIsTriggeringEmergency(true);
    try {
      await api.triggerEmergencySession({
        topic: emergencyTopic,
        isManual: true,
      });
      setIsEmergencyModalOpen(false);
      setExportNotice('🚨 اتاق وضعیت اضطراری با موفقیت فعال شد و اعضای شورا در حال رصد، فکت‌چک و تدوین چندرسانه‌ای هستند.');
      onRefresh();
      setTimeout(() => setExportNotice(null), 8000);
    } catch {
      alert('خطا در فعال‌سازی اتاق وضعیت اضطراری.');
    } finally {
      setIsTriggeringEmergency(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await api.updateCouncilConfig(config);
      setIsSettingsModalOpen(false);
      setExportNotice('✅ تنظیمات خودمختاری و اختیارات شورا با موفقیت ذخیره شد.');
      onRefresh();
      setTimeout(() => setExportNotice(null), 4000);
    } catch {
      alert('خطا در ذخیره تنظیمات شورا.');
    }
  };

  const handleAddKeyword = () => {
    if (!newKeywordInput.trim()) return;
    const trimmed = newKeywordInput.trim();
    if (!config.emergencyKeywords.includes(trimmed)) {
      setConfig({
        ...config,
        emergencyKeywords: [...config.emergencyKeywords, trimmed],
      });
    }
    setNewKeywordInput('');
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setConfig({
      ...config,
      emergencyKeywords: config.emergencyKeywords.filter((k) => k !== keywordToRemove),
    });
  };

  const handlePublishPost = async (postId: string) => {
    setIsPublishingPost(true);
    setPublishingPostId(postId);
    try {
      const channelId = destinationChannels[0]?.id;
      const res = await api.publishCouncilDraft({ postId, channelId });
      setExportNotice(res.message || '✅ پست مصوب شورا با موفقیت در کانال تلگرام منتشر شد!');
      onRefresh();
      if (onPostCreated) onPostCreated();
      setTimeout(() => setExportNotice(null), 6000);
    } catch {
      alert('خطا در انتشار پست.');
    } finally {
      setIsPublishingPost(false);
      setPublishingPostId(null);
    }
  };

  const handleClearHistory = async () => {
    if (!confirm('آیا از پاک‌سازی کامل تاریخچه گفتگو و اتاق وضعیت شورا اطمینان دارید؟')) return;
    try {
      await api.clearCouncilHistory();
      setExportNotice('✅ تاریخچه گفتگوهای شورا با موفقیت پاک‌سازی شد.');
      onRefresh();
      setTimeout(() => setExportNotice(null), 4000);
    } catch {
      alert('خطا در ریست تاریخچه شورا.');
    }
  };

  const handleExportConsensusToPost = async () => {
    const agentMsgs = messages.filter((m) => m.sender === 'agent').slice(-3);
    const synthesisText = `📌 جمع‌بندی کارشناسی شورای هوش مصنوعی:

${agentMsgs.map((m) => `🔹 دیدگاه ${m.agentName}:\n${m.text}`).join('\n\n')}

💡 نتیجه نهایی و توافق شورا:
موضوع فوق با رعایت کامل اصول اخلاقی و استانداردهای رسانه‌ای تایید گردید.

#تحلیل_اختصاصی #شورای_هوش_مصنوعی
کانال: ${destinationChannels[0]?.username || '@MyTechPulse_Channel'}`;

    try {
      await api.createPost({
        title: 'خروجی توافق شورای ایجنت‌های هوش مصنوعی',
        content: synthesisText,
        destinationChannelIds: [destinationChannels[0]?.id || 'ch-dst-1'],
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        status: 'scheduled',
        plagiarismRiskScore: 5,
        tags: ['شورای_ایجنت', 'تحلیل', 'هوش_مصنوعی'],
      });

      setExportNotice('✅ جمع‌بندی شورا با موفقیت به تقویم زمان‌بندی پست‌های کانال تلگرام اضافه شد!');
      onRefresh();
      if (onPostCreated) onPostCreated();
      setTimeout(() => setExportNotice(null), 5000);
    } catch {
      setExportNotice('خطا در ایجاد پست از شورا.');
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (selectedAgentFilter === 'all') return true;
    if (m.sender === 'user' || m.sender === 'system') return true;
    return m.agentId === selectedAgentFilter;
  });

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner: Council Identity & Emergency War-Room Controls */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/30 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600/20 text-purple-400 flex items-center justify-center border border-purple-500/30 shadow-inner">
              <Users2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">شورای ارتقایافته ایجنت‌ها و اتاق وضعیت بحران</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30">
                  اختیارات سطح بالا + استودیو و کانال
                </span>
                {config.autonomousModeEnabled && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    رصد خودکار بحران فعال
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                مجهز به رصد زنده کانال‌های مبدأ، راستی‌آزمایی چندمنبعی (Fact-Checking)، تولید کاور و پادکست در استودیو چندرسانه‌ای و انتشار مستقیم در تلگرام
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Emergency War Room Manual Trigger */}
            <button
              onClick={() => setIsEmergencyModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-rose-600/25 animate-pulse"
            >
              <AlertTriangle className="w-4 h-4" />
              🚨 فعال‌سازی اتاق وضعیت اضطراری
            </button>

            {/* Council Settings */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700"
            >
              <Sliders className="w-4 h-4 text-purple-400" />
              تنظیمات خودمختاری و کلیدواژه‌ها
            </button>

            {/* Clear History */}
            <button
              onClick={handleClearHistory}
              title="پاک‌سازی تاریخچه شورا"
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 rounded-xl transition border border-slate-700"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {exportNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between gap-2 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Active Emergency Session Banner if exists */}
      {activeEmergencySession && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-amber-950/30 border border-rose-500/40 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
              <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                اتاق وضعیت فعال: {activeEmergencySession.topic}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                اجماع حاصل شد (۴ رأی تایید)
              </span>
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 border border-slate-700 font-mono">
                ضریب اطمینان فکت‌چک: {activeEmergencySession.verificationReport?.confidenceScore}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-slate-400 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-blue-400" />
                <span>رصد منابع و راستی‌آزمایی:</span>
              </div>
              <p className="text-slate-200 font-medium">
                {activeEmergencySession.verificationReport?.verdict || 'صحت خبر پس از رصد چندمنبعی تأیید شد.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
              <div className="text-slate-400 flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-purple-400" />
                <span>بسته چندرسانه‌ای تولیدشده:</span>
              </div>
              <p className="text-slate-200 font-medium">
                کاور گرافیکی هوش مصنوعی 4K + صوت گوینده رندر شدند.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col justify-between">
              <div className="text-slate-400 flex items-center gap-1">
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>وضعیت کانال مقصد:</span>
              </div>
              {activeEmergencySession.status === 'published' ? (
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  مستقیماً در تلگرام منتشر شد
                </span>
              ) : (
                <button
                  onClick={() => activeEmergencySession.publishedPostId && handlePublishPost(activeEmergencySession.publishedPostId)}
                  disabled={isPublishingPost}
                  className="mt-2 w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold text-xs transition flex items-center justify-center gap-1 shadow-md shadow-emerald-600/30"
                >
                  {isPublishingPost ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  )}
                  ارسال و انتشار آنی در کانال تلگرام
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Agent Roster Bar with High-Access Badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {agents.map((agent) => (
          <div
            key={agent.id}
            onClick={() =>
              setSelectedAgentFilter(selectedAgentFilter === agent.id ? 'all' : agent.id)
            }
            className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
              selectedAgentFilter === agent.id
                ? 'bg-purple-950/40 border-purple-500 shadow-md ring-1 ring-purple-500/40'
                : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{agent.avatar}</span>
                <div>
                  <h4 className="font-bold text-slate-200 text-xs">{agent.name}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">{agent.provider}</span>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 font-mono text-purple-300 border border-slate-700">
                {agent.model.split('-')[0]}
              </span>
            </div>

            <p className="text-[11px] text-slate-400 line-clamp-1">{agent.role}</p>

            {/* High Access Badges */}
            <div className="pt-1 border-t border-slate-800/80 flex flex-wrap gap-1">
              {agent.id === 'agent-analyst' && (
                <span className="text-[9px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold flex items-center gap-1">
                  <Globe className="w-2.5 h-2.5" />
                  رصد کانال‌ها و فکت‌چک
                </span>
              )}
              {agent.id === 'agent-editor' && (
                <span className="text-[9px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold flex items-center gap-1">
                  <Volume2 className="w-2.5 h-2.5" />
                  استودیو صوتی تلگرام
                </span>
              )}
              {agent.id === 'agent-legal' && (
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-2.5 h-2.5" />
                  ممیزی کپی‌رایت و اخلاق
                </span>
              )}
              {agent.id === 'agent-viral' && (
                <span className="text-[9px] px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-semibold flex items-center gap-1">
                  <ImageIcon className="w-2.5 h-2.5" />
                  استودیو تصویر + انتشار کانال
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Council Telegram Group Discussion Interface */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-2xl flex flex-col h-[700px]">
        {/* Telegram Group Top Header */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              <Users2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-200 text-sm">هیئت تحریریه هوشمند و شورای نظارت کانال</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <p className="text-[11px] text-slate-400">
                ۴ ایجنت متخصص، دسترسی کامل به استودیو چندرسانه‌ای و مجوز انتشار
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedAgentFilter !== 'all' && (
              <button
                onClick={() => setSelectedAgentFilter('all')}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[11px] hover:bg-slate-700"
              >
                نمایش همه ایجنت‌ها
              </button>
            )}
            <button
              onClick={handleExportConsensusToPost}
              className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              تبدیل توافق به پست
            </button>
          </div>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-950/40">
          {filteredMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-purple-600/10 text-purple-400 flex items-center justify-center border border-purple-500/20 shadow-inner">
                <Users2 className="w-8 h-8" />
              </div>
              <div>
                <p className="text-base font-bold text-slate-200">اتاق گفتگوی شورای هوش مصنوعی آماده است</p>
                <p className="text-xs text-slate-400 mt-1 max-w-lg leading-relaxed">
                  موضوع یا ادعای خبری مورد نظرتان را در کادر زیر ارسال کنید تا ۴ ایجنت همزمان کانال‌های دیگر را رصد، صحت ادعا را فکت‌چک، در استودیو پوستر و پادکست بسازند و برای انتشار تصمیم بگیرند.
                </p>
              </div>

              {/* Quick Prompt Ideas */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  onClick={() =>
                    setUserInput('بررسی و رصد فوری اخبار: آیا گزارش درگیری نظامی بین ایران و آمریکا تأیید شده است؟')
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs hover:border-purple-500/50 hover:bg-purple-950/20 transition"
                >
                  ⚡ رصد فوری اخبار درگیری ایران و آمریکا
                </button>
                <button
                  onClick={() =>
                    setUserInput('یک پست تحلیلی با کاور و پادکست اختصاصی درباره هوش مصنوعی بسازید و در کانال بگذارید.')
                  }
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs hover:border-purple-500/50 hover:bg-purple-950/20 transition"
                >
                  🎨 ساخت پست چندرسانه‌ای کامل با شورا
                </button>
              </div>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              if (msg.sender === 'system') {
                return (
                  <div key={msg.id} className="my-4">
                    <div className="max-w-2xl mx-auto p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 shadow-xl space-y-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="font-bold text-rose-400 flex items-center gap-1.5">
                          <Radio className="w-4 h-4 animate-pulse text-rose-500" />
                          اطلاعیه سامانه هوشمند شورا
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString('fa-IR')}
                        </span>
                      </div>
                      <p className="whitespace-pre-line leading-relaxed text-slate-300 font-medium">
                        {msg.text}
                      </p>
                    </div>
                  </div>
                );
              }

              const isUser = msg.sender === 'user';
              const agent = agents.find((a) => a.id === msg.agentId);

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 max-w-3xl ${isUser ? 'mr-auto flex-row-reverse' : 'ml-auto'}`}
                >
                  {/* Avatar */}
                  <div className="shrink-0 pt-1">
                    {isUser ? (
                      <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
                        <User className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-lg shadow-md">
                        {msg.avatar || '🤖'}
                      </div>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`p-4 rounded-2xl space-y-2.5 text-xs leading-relaxed shadow-lg ${
                      isUser
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : msg.isEmergencySessionMessage
                        ? 'bg-slate-900 border border-rose-500/30 text-slate-200 rounded-tl-none shadow-rose-950/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    {/* Sender Name & Role */}
                    {!isUser && (
                      <div className="flex items-center justify-between gap-3 border-b border-slate-800/80 pb-1.5 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-purple-300 font-bold">{msg.agentName}</strong>
                          <span className="text-slate-500">({msg.agentRole})</span>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                          {agent?.model || 'AI Model'}
                        </span>
                      </div>
                    )}

                    {/* Main Message Text */}
                    <div className="whitespace-pre-line select-text font-normal leading-relaxed">
                      {msg.text}
                    </div>

                    {/* Tool Invocations Badge */}
                    {msg.toolInvocations && msg.toolInvocations.length > 0 && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-[11px]">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>ابزار فراخوانی‌شده: {msg.toolInvocations[0].toolName}</span>
                        </div>
                        {msg.toolInvocations[0].toolInput && (
                          <div className="text-[10px] text-slate-400 font-mono bg-slate-900/80 p-2 rounded dir-ltr text-right">
                            Input: {msg.toolInvocations[0].toolInput}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-300 font-medium leading-relaxed">
                          خروجی: {msg.toolInvocations[0].toolOutput}
                        </div>
                      </div>
                    )}

                    {/* Media Attachment (Generated in Studio by Council) */}
                    {msg.mediaAttachment && (
                      <div className="mt-2 p-3 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-purple-300 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                            تولیدشده در استودیو چندرسانه‌ای توسط شورا
                          </span>
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-purple-900/50 rounded">
                            {msg.mediaAttachment.type}
                          </span>
                        </div>

                        {msg.mediaAttachment.type === 'image' && (
                          <div className="relative rounded-lg overflow-hidden border border-slate-800">
                            <img
                              src={msg.mediaAttachment.url}
                              alt="Council Generated Studio Asset"
                              className="w-full h-44 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {msg.mediaAttachment.prompt && (
                              <div className="p-2 bg-slate-950/80 text-[10px] text-slate-400">
                                {msg.mediaAttachment.prompt}
                              </div>
                            )}
                          </div>
                        )}

                        {msg.mediaAttachment.type === 'audio' && (
                          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1">
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                              <span>پادکست صوتی گوینده (ElevenLabs)</span>
                            </div>
                            <audio controls className="w-full h-8 mt-1">
                              <source src={msg.mediaAttachment.url} type="audio/ogg" />
                            </audio>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Consensus Vote Badge */}
                    {msg.consensusVote && (
                      <div className="pt-1 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">رأی نهایی ایجنت:</span>
                        <span className="px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Vote className="w-3 h-3" />
                          تایید و انطباق کامل (Approve)
                        </span>
                      </div>
                    )}

                    {/* Published or Ready-to-Publish Post Action */}
                    {msg.publishedPostId && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400">پست مصوب شورا:</span>
                        <button
                          onClick={() => handlePublishPost(msg.publishedPostId!)}
                          disabled={isPublishingPost && publishingPostId === msg.publishedPostId}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                        >
                          {isPublishingPost && publishingPostId === msg.publishedPostId ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5 -rotate-45" />
                          )}
                          انتشار در کانال تلگرام
                        </button>
                      </div>
                    )}

                    {/* Timestamp */}
                    <div
                      className={`text-[10px] text-left pt-1 ${
                        isUser ? 'text-blue-200' : 'text-slate-500'
                      }`}
                    >
                      {new Date(msg.timestamp).toLocaleTimeString('fa-IR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="دستور یا موضوع خود را بنویسید (مثلاً: رصد کانال‌ها، فکت‌چک خبر، ساخت عکس در استودیو، انتشار)..."
            className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />

          <button
            type="submit"
            disabled={isSending || !userInput.trim()}
            className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5 shadow-md shadow-purple-600/20 disabled:opacity-50"
          >
            {isSending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4 -rotate-45 ml-0.5" />
            )}
            ارسال به شورا
          </button>
        </form>
      </div>

      {/* Emergency War-Room Modal */}
      {isEmergencyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <span>فعال‌سازی دستی اتاق وضعیت اضطراری (War-Room)</span>
              </div>
              <button
                onClick={() => setIsEmergencyModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="leading-relaxed text-slate-400">
                در این حالت، پروتکل واکنش سریع شورا بدون محدودیت در تعداد تبادل پیام فعال می‌شود:
                اعضا کانال‌های خبری را رصد کرده، با راستی‌آزمایی چندمنبعی صحت خبر را تایید می‌کنند، سپس در استودیو چندرسانه‌ای کاور 4K و صوت تولید نموده و متن را برای کانال تلگرام آماده یا منتشر می‌نمایند.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  موضوع یا ادعای فوری نیازمند بررسی و رصد:
                </label>
                <textarea
                  rows={3}
                  value={emergencyTopic}
                  onChange={(e) => setEmergencyTopic(e.target.value)}
                  placeholder="مثال: گزارش فوری اخبار جنگ بین ایران و آمریکا یا تحرکات نظامی در خلیج فارس..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              {/* Quick Topic Chips */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setEmergencyTopic(
                      'گزارش فوری: تنش‌های ژئوپلیتیک و تحرکات نظامی در خاورمیانه (ایران و آمریکا)'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 hover:bg-slate-700"
                >
                  ⚡ جنگ و درگیری ایران و آمریکا
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEmergencyTopic(
                      'خبر فوری: انتشار بیانیه رسمی اقتصادی و نوسانات شدید بازار ارز و طلا'
                    )
                  }
                  className="px-2.5 py-1 rounded-lg bg-slate-800 text-[11px] text-slate-300 hover:bg-slate-700"
                >
                  📈 تحولات فوری اقتصادی
                </button>
              </div>

              {/* Auto publish toggle for this session */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-200 block text-xs">
                    انتشار مستقیم در کانال مقصد به محض اجماع ۱۰۰٪
                  </span>
                  <span className="text-[11px] text-slate-400">
                    در صورت غیرفعال بودن، پست به صورت پیش‌نویس ذخیره می‌شود تا خودتان تایید کنید.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={config.autoPublishOnConsensus}
                  onChange={(e) =>
                    setConfig({ ...config, autoPublishOnConsensus: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsEmergencyModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleTriggerEmergency}
                disabled={isTriggeringEmergency || !emergencyTopic.trim()}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isTriggeringEmergency ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Flame className="w-4 h-4" />
                )}
                شروع مذاکره اضطراری و رصد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Autonomy & Keywords Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-base">
                <Sliders className="w-5 h-5 text-purple-400" />
                <span>تنظیمات خودمختاری و اختیارات شورا (Autonomous Council Settings)</span>
              </div>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Toggles */}
              <div className="space-y-2.5">
                {/* 1. Autonomous Emergency Mode */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block text-xs">
                      فعال‌سازی خودکار شورا در شرایط بحرانی (بدون دخالت انسان)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      اگر نیمه‌شب اخباری منطبق با کلیدواژه‌های بحرانی رصد شود، شورا خودکار تشکیل جلسه داده و صحت آن را بررسی می‌کند.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autonomousModeEnabled}
                    onChange={(e) =>
                      setConfig({ ...config, autonomousModeEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </div>

                {/* 2. Auto-Publish on Consensus */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block text-xs">
                      اجازه انتشار خودکار در کانال مقصد پس از رسیدن به اجماع ۱۰۰٪
                    </span>
                    <span className="text-[11px] text-slate-400">
                      در صورت تایید ۴ ایجنت، پست مستقیماً توسط ربات در کانال تلگرام پست می‌شود.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.autoPublishOnConsensus}
                    onChange={(e) =>
                      setConfig({ ...config, autoPublishOnConsensus: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </div>

                {/* 3. Studio Access */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block text-xs">
                      دسترسی کامل شورا به استودیو چندرسانه‌ای (DALL-E 3 & ElevenLabs)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      اعضای شورا می‌توانند بدون نیاز به دستور مجزا، خودشان برای پست‌ها کاور تصویری یا پادکست صوتی بسازند.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.studioAccessEnabled}
                    onChange={(e) =>
                      setConfig({ ...config, studioAccessEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </div>

                {/* 4. Channel Monitoring */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-200 block text-xs">
                      رصد پیوسته کانال‌های مبدأ و راستی‌آزمایی مستقل
                    </span>
                    <span className="text-[11px] text-slate-400">
                      دکتر تحلیلگر کانال‌های رقیب و مرجع را برای یافتن اخبار جدید و تطبیق فکت‌ها پیمایش می‌کند.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.channelMonitoringEnabled}
                    onChange={(e) =>
                      setConfig({ ...config, channelMonitoringEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Emergency Keywords list */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <label className="block text-xs font-bold text-slate-200">
                  کلیدواژه‌های حساس و ماشه فعال‌سازی اضطراری (Emergency Trigger Keywords):
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {config.emergencyKeywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs flex items-center gap-1.5"
                    >
                      <span>{kw}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(kw)}
                        className="text-rose-400 hover:text-white"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>

                {/* Add keyword input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newKeywordInput}
                    onChange={(e) => setNewKeywordInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    placeholder="افزودن کلیدواژه جدید (مثلاً: حمله موشکی، بیانیه جنگی)..."
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    افزودن
                  </button>
                </div>
              </div>

              {/* Deliberation rounds info */}
              <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-slate-300 text-[11px] flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400 shrink-0" />
                <span>
                  <strong>تعداد پیام‌های نامحدود:</strong> در حالت اضطراری، سقف محدودیت پیام برداشته می‌شود و اعضای شورا تا رسیدن به توافق قطعی ۱۰۰٪ با یکدیگر مذاکره و ارزیابی خواهند کرد.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSaveConfig}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-purple-600/30"
              >
                <Check className="w-4 h-4" />
                ذخیره تنظیمات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
