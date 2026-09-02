import React, { useState } from 'react';
import {
  CouncilAgent,
  CouncilMessage,
  CouncilConfig,
  CouncilEmergencySession,
  CouncilDeliberationSession,
  Channel,
} from '../types';
import { api } from '../services/api';
import {
  Users,
  Send,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Sparkles,
  Radio,
  Clock,
  ShieldCheck,
  Play,
  RotateCcw,
  Sliders,
  Eye,
  ArrowUpRight,
  Loader2,
  Volume2,
  Image as ImageIcon,
  Check,
  ExternalLink,
  Bot,
  Zap,
  MessageSquare,
  Scale,
  Layers,
  XCircle,
  Plus,
} from 'lucide-react';

interface CouncilModuleProps {
  agents: CouncilAgent[];
  messages: CouncilMessage[];
  config?: CouncilConfig;
  activeEmergencySession?: CouncilEmergencySession | null;
  activeDeliberationSession?: CouncilDeliberationSession | null;
  destinationChannels: Channel[];
  sourceChannels: Channel[];
  onRefresh: () => void;
  onPostCreated?: () => void;
}

export const CouncilModule: React.FC<CouncilModuleProps> = ({
  agents,
  messages,
  config,
  activeEmergencySession,
  activeDeliberationSession,
  destinationChannels,
  sourceChannels,
  onRefresh,
  onPostCreated,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTriggeringEmergency, setIsTriggeringEmergency] = useState(false);
  const [emergencyTopicInput, setEmergencyTopicInput] = useState(
    'گزارش فوری: انتشار اخبار تنش نظامی میان ایران و آمریکا در خاورمیانه'
  );
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showDeliberationModal, setShowDeliberationModal] = useState(false);
  const [publishingPostId, setPublishingPostId] = useState<string | null>(null);
  const [publishSuccessMsg, setPublishSuccessMsg] = useState<string | null>(null);

  // Deliberation Modal Input State
  const [delibTopic, setDelibTopic] = useState('تحلیل و فکت‌چک رویداد فوری و استراتژیک');
  const [delibText, setDelibText] = useState('');
  const [delibSource, setDelibSource] = useState('کانال‌های تلگرام و خبرگزاری‌های بین‌المللی');
  const [delibRounds, setDelibRounds] = useState<number>(3);
  const [delibInstruction, setDelibInstruction] = useState('');
  const [isDeliberating, setIsDeliberating] = useState(false);

  // Council Config State
  const [autonomousMode, setAutonomousMode] = useState(
    config?.autonomousModeEnabled ?? true
  );
  const [autoPublish, setAutoPublish] = useState(
    config?.autoPublishOnConsensus ?? false
  );
  const [studioAccess, setStudioAccess] = useState(
    config?.studioAccessEnabled ?? true
  );
  const [channelPosting, setChannelPosting] = useState(
    config?.channelPostingEnabled ?? true
  );
  const [channelMonitoring, setChannelMonitoring] = useState(
    config?.channelMonitoringEnabled ?? true
  );

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const userText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      await api.sendCouncilMessage(userText);
      await onRefresh();
    } catch (err) {
      console.error('Error sending message to council:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleTriggerEmergency = async (customTopic?: string) => {
    const topicToUse = customTopic || emergencyTopicInput;
    setIsTriggeringEmergency(true);
    setShowEmergencyModal(false);

    try {
      await api.triggerEmergencySession(topicToUse, true);
      await onRefresh();
    } catch (err) {
      console.error('Error triggering emergency council:', err);
    } finally {
      setIsTriggeringEmergency(false);
    }
  };

  const handleStartDeliberation = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!delibText.trim() || isDeliberating) return;

    setIsDeliberating(true);
    setShowDeliberationModal(false);
    try {
      await api.deliberateCouncil({
        newsTitle: delibTopic,
        newsText: delibText,
        sourceChannel: delibSource,
        roundsCount: delibRounds,
        customInstruction: delibInstruction.trim() || undefined,
      });
      await onRefresh();
    } catch (err) {
      console.error('Error starting deliberation:', err);
    } finally {
      setIsDeliberating(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await api.updateCouncilConfig({
        autonomousModeEnabled: autonomousMode,
        autoPublishOnConsensus: autoPublish,
        studioAccessEnabled: studioAccess,
        channelPostingEnabled: channelPosting,
        channelMonitoringEnabled: channelMonitoring,
        maxDeliberationRounds: 0, // 0 means unlimited rounds until 100% consensus
      });
      setShowConfigModal(false);
      onRefresh();
    } catch (err) {
      console.error('Error updating config:', err);
    }
  };

  const handleClearHistory = async () => {
    if (window.confirm('آیا از ریست و پاکسازی کامل تاریخچه مذاکرات و اتاق وضعیت اطمینان دارید؟')) {
      await api.clearCouncilHistory();
      onRefresh();
    }
  };

  const handlePublishDirectly = async (postId: string) => {
    setPublishingPostId(postId);
    try {
      const res = await api.publishCouncilDraft(postId);
      setPublishSuccessMsg(res.message || 'پست با موفقیت در کانال تلگرام منتشر شد.');
      setTimeout(() => setPublishSuccessMsg(null), 4000);
      onRefresh();
      if (onPostCreated) onPostCreated();
    } catch (err) {
      console.error('Error publishing council draft:', err);
    } finally {
      setPublishingPostId(null);
    }
  };

  const emergencyPresets = [
    'گزارش فوری: انتشار اخبار تنش نظامی میان ایران و آمریکا در خاورمیانه',
    'فوری: اخبار ضد و نقیض درباره تحرکات موشکی و ادعای حملات هوایی',
    'هشدار رسانه‌ای: شایعه سقوط ارزش ریال و آغاز تعطیلی بازارهای ارزی',
    'خبر اضطراری: سانحه هوایی در مسیر پروازی بین‌المللی و ادعای خبرگزاری‌های خارجی',
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner: Council Identity & Authority */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/25 ring-2 ring-purple-400/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  شورای عالی ایجنت‌های هوش مصنوعی (AI Council)
                </h2>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  سطح دسترسی: فوق‌العاده (Full Privilege)
                </span>
                {autonomousMode ? (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5 font-medium">
                    <Radio className="w-3.5 h-3.5 animate-pulse text-blue-400" />
                    ورود خودکار شبانه: فعال
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                    ورود خودکار: غیرفعال (صرفاً دستی)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                شورا اختیار دارد کانال‌های دیگر را برای تایید اخبار رصد کند، ابزارهای فکت‌چک را به کار بگیرد، در استودیو چندرسانه‌ای کاور و صوت بسازد و مستقیماً در کانال مقصد پست بگذارد. در زمان بحران، اعضا تا رسیدن به اجماع ۱۰۰٪ مجاز به ارسال نامحدود پیام هستند.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {/* Multi-Round Deliberation Trigger */}
            <button
              onClick={() => setShowDeliberationModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-purple-600/30 active:scale-95 transition-all"
            >
              <Users className="w-4 h-4" />
              <span>جلسه داوری چند دور شورا</span>
            </button>

            {/* Manual Emergency Room Trigger */}
            <button
              onClick={() => setShowEmergencyModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-red-600/30 active:scale-95 transition-all"
            >
              <Flame className="w-4 h-4 animate-bounce" />
              <span>اتاق وضعیت بحران (دستی)</span>
            </button>

            {/* Settings Modal Toggle */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl border border-slate-700 active:scale-95 transition-all"
            >
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>تنظیم اختیارات</span>
            </button>

            {/* Clear History */}
            <button
              onClick={handleClearHistory}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl border border-slate-700 transition-all"
              title="پاکسازی تاریخچه گفتگو"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 4 Agents Badge Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800/80">
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-start gap-3 hover:border-slate-700 transition-colors"
            >
              <span className="text-2xl shrink-0 p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                {agent.avatar}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="font-semibold text-xs text-white truncate">
                    {agent.name}
                  </div>
                  <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/30">
                    {agent.provider}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {agent.role}
                </div>
                <div className="text-[10px] text-emerald-400/90 mt-1 flex items-center gap-1 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>دسترسی کامل به ابزارها</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Notification Alert */}
      {publishSuccessMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-3 text-emerald-300 text-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{publishSuccessMsg}</span>
        </div>
      )}

      {/* Emergency Active Banner (if session active) */}
      {activeEmergencySession && (
        <div className="bg-gradient-to-r from-red-950/70 via-slate-900 to-red-950/70 border-2 border-red-500/40 rounded-2xl p-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-red-500/20">
            <div className="flex items-center gap-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <h3 className="font-bold text-sm text-red-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                اتاق وضعیت بحران و رصد فوق‌العاده
              </h3>
              <span className="text-[10px] bg-red-500/20 text-red-200 border border-red-500/30 px-2 py-0.5 rounded-md font-mono">
                {activeEmergencySession.triggerType === 'autonomous_breaking_news'
                  ? '⚡ ورود خودکار شبانه'
                  : '👤 فعال‌سازی دستی'}
              </span>
            </div>
            <div className="text-xs text-slate-400 flex items-center gap-3">
              <span>دورهای مذاکره: {activeEmergencySession.roundsCount || 'نامحدود'}</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                اجماع ۱۰۰٪ حاصل شد
              </span>
            </div>
          </div>

          <div className="mt-3 text-xs text-slate-200">
            <div className="font-semibold text-amber-300">
              موضوع تحت رصد: {activeEmergencySession.topic}
            </div>
            {activeEmergencySession.verificationReport && (
              <div className="mt-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>{activeEmergencySession.verificationReport.verdict}</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400">منابع رصدشده:</span>
                  <span className="text-cyan-400 font-bold">
                    {activeEmergencySession.verificationReport.sourcesCount} منبع
                  </span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-400">ضریب اطمینان:</span>
                  <span className="text-emerald-400 font-bold">
                    %{activeEmergencySession.verificationReport.confidenceScore}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Active Multi-Round Deliberation Session Banner */}
      {activeDeliberationSession && (
        <div
          className={`border rounded-2xl p-5 shadow-xl transition-all ${
            activeDeliberationSession.verdict === 'approved'
              ? 'bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-emerald-500/40'
              : activeDeliberationSession.verdict === 'rejected'
                ? 'bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-rose-500/40'
                : 'bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border-purple-500/40'
          }`}
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${
                  activeDeliberationSession.verdict === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : activeDeliberationSession.verdict === 'rejected'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                }`}
              >
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-white">
                    جلسه داوری و مباحثه شورا ({activeDeliberationSession.roundsCount} دور گفتگوی متقابل)
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-400 font-mono">
                    شناسه جلسه: #{activeDeliberationSession.sessionId.slice(-6)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  منبع رصدشده: <span className="font-semibold text-cyan-400">{activeDeliberationSession.sourceChannel}</span> | موضوع: <span className="font-semibold text-amber-300">{activeDeliberationSession.newsTopic}</span>
                </p>
              </div>
            </div>

            {/* Verdict Status */}
            <div>
              {activeDeliberationSession.verdict === 'approved' && (
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  مصوبه شورا: تایید صحت و تصویب انتشار در کانال تلگرام
                </span>
              )}
              {activeDeliberationSession.verdict === 'rejected' && (
                <span className="text-xs px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold flex items-center gap-1.5 shadow-sm">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  مصوبه شورا: رد خبر و منع انتشار به دلیل عدم احراز فکت‌ها
                </span>
              )}
              {activeDeliberationSession.verdict === 'in_progress' && (
                <span className="text-xs px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                  اعضای شورا در حال چالش و مباحثه متقابل هستند...
                </span>
              )}
            </div>
          </div>

          {/* Details & Votes */}
          <div className="mt-3 space-y-2.5 text-xs text-slate-200">
            {/* Votes Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-slate-400 text-[11px]">نتایج آرای اعضای شورا:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/40 text-emerald-300 font-bold font-mono text-[11px]">
                  موافق: {activeDeliberationSession.votesSummary.approve} عضو
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/40 text-rose-300 font-bold font-mono text-[11px]">
                  مخالف: {activeDeliberationSession.votesSummary.reject} عضو
                </span>
                {activeDeliberationSession.votesSummary.conditional > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/40 text-amber-300 font-bold font-mono text-[11px]">
                    مشروط: {activeDeliberationSession.votesSummary.conditional} عضو
                  </span>
                )}
              </div>

              {/* Direct Publish Button if Drafted */}
              {activeDeliberationSession.publishedPostId && (
                <button
                  onClick={() => handlePublishDirectly(activeDeliberationSession.publishedPostId!)}
                  disabled={publishingPostId === activeDeliberationSession.publishedPostId}
                  className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-3.5 py-1.5 rounded-lg active:scale-95 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  {publishingPostId === activeDeliberationSession.publishedPostId ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>انتشار مستقیم مصوبه در کانال تلگرام</span>
                </button>
              )}
            </div>

            {/* Statement */}
            <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800/80 text-[11px] leading-relaxed text-slate-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-purple-300">خلاصه استدلال جمعی شورا: </span>
                <span>{activeDeliberationSession.councilStatement}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Dialogue & Deliberation Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-xl min-h-[560px]">
        {/* Chat Header */}
        <div className="bg-slate-950/80 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">
              کانال گفتگوی آزاد و مباحثه چند-عاملی (Multi-Agent Deliberation)
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              ({messages.length} پیام ثبتی)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>پروتکل اجماع نامحدود: فعال</span>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 max-h-[640px] bg-slate-950/40">
          {messages.length === 0 ? (
            <div className="h-96 flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-3">
                <Users className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="font-semibold text-slate-200 text-sm">
                شورای ایجنت‌ها در حالت آماده‌باش هستند
              </h3>
              <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
                می‌توانید موضوعی برای انتشار مطرح کنید (مثلاً رصد اخبار یک کانال، راستی‌آزمایی یا ساخت کاور استودیو)، یا با زدن دکمه «اتاق وضعیت بحران» شورا را برای فکت‌چک فوری اخبار جنگ ایران و آمریکا به کار بگیرید.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <button
                  onClick={() =>
                    setInputText(
                      'کانال‌های خبری را رصد کنید و آخرین وضعیت توافقات تجاری و اقتصادی را تحلیل، فکت‌چک و برای انتشار در کانال پست کنید.'
                    )
                  }
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                  📡 رصد و فکت‌چک اخبار اقتصادی
                </button>
                <button
                  onClick={() =>
                    setInputText(
                      'برای موضوع فناوری کوانتومی، یک پوستر در استودیو تصویر بسازید و متن خبر را آماده انتشار در کانال تلگرام کنید.'
                    )
                  }
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 transition-colors"
                >
                  🎨 درخواست کار استودیو و کاور 4K
                </button>
                <button
                  onClick={() => handleTriggerEmergency()}
                  className="text-xs bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/40 px-3 py-1.5 rounded-lg transition-colors"
                >
                  ⚡ شبیه‌سازی خبر فوری جنگ ایران و آمریکا
                </button>
              </div>
            </div>
          ) : (
            messages.map((msg) => {
              const isUser = msg.sender === 'user';
              const isSystem = msg.sender === 'system';

              // System Round Header Announcement
              if (msg.agentName === 'شورا (سیستم)' || msg.text.startsWith('🔹 [')) {
                return (
                  <div key={msg.id} className="py-2 flex items-center justify-center my-3">
                    <div className="bg-gradient-to-r from-purple-950/80 via-slate-900 to-purple-950/80 border border-purple-800/60 rounded-xl px-5 py-2.5 text-center shadow-lg max-w-xl w-full">
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-purple-300">
                        <Layers className="w-4 h-4 text-purple-400" />
                        <span>{msg.text}</span>
                      </div>
                    </div>
                  </div>
                );
              }

              if (isSystem) {
                return (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-3 my-2"
                  >
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed whitespace-pre-line">
                      {msg.text}
                    </div>
                  </div>
                );
              }

              if (isUser) {
                return (
                  <div key={msg.id} className="flex justify-end">
                    <div className="max-w-2xl bg-blue-600 text-white rounded-2xl rounded-tl-sm p-4 text-xs leading-relaxed shadow-lg">
                      <div className="font-bold text-[11px] text-blue-200 mb-1 flex items-center justify-between">
                        <span>مدیر سیستم (شما)</span>
                        <span className="font-mono text-[10px] text-blue-300">
                          {new Date(msg.timestamp).toLocaleTimeString('fa-IR')}
                        </span>
                      </div>
                      <p>{msg.text}</p>
                    </div>
                  </div>
                );
              }

              // Agent Response Card
              return (
                <div key={msg.id} className="flex items-start gap-3 max-w-3xl">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-lg shrink-0 shadow">
                    {msg.avatar || '🤖'}
                  </div>

                  <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tr-sm p-4 text-xs space-y-3">
                    {/* Agent Header */}
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2 gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-100 text-xs">
                          {msg.agentName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({msg.agentRole})
                        </span>

                        {/* Round Badge */}
                        {msg.roundNumber && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/40 font-mono font-semibold">
                            دور {msg.roundNumber} از {msg.totalRounds || 3}
                          </span>
                        )}
                      </div>

                      {msg.consensusVote && (
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1 ${
                            msg.consensusVote === 'approve'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          {msg.consensusVote === 'approve'
                            ? 'رأی موافق و تایید صحت'
                            : 'نیاز به بازبینی مجدد'}
                        </span>
                      )}
                    </div>

                    {/* Agent Direct Reaction & Reply to Peer */}
                    {msg.replyingToAgentName && (
                      <div className="flex items-center gap-1.5 text-[11px] text-cyan-300 bg-cyan-950/40 border border-cyan-800/40 px-3 py-1.5 rounded-xl">
                        <MessageSquare className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span className="text-cyan-300 font-medium">در واکنش و پاسخ متقابل به:</span>
                        <span className="font-bold text-white underline decoration-cyan-400/50">
                          {msg.replyingToAgentName}
                        </span>
                      </div>
                    )}

                    {/* Speech Text */}
                    <p className="text-slate-200 leading-relaxed whitespace-pre-line">
                      {msg.text}
                    </p>

                    {/* Tool Invocation Card */}
                    {msg.toolInvocations && msg.toolInvocations.length > 0 && (
                      <div className="space-y-2 mt-2">
                        {msg.toolInvocations.map((tool, idx) => (
                          <div
                            key={idx}
                            className="bg-slate-950 border border-cyan-900/30 rounded-xl p-2.5 text-[11px]"
                          >
                            <div className="flex items-center gap-2 text-cyan-400 font-semibold mb-1">
                              <Zap className="w-3.5 h-3.5" />
                              <span>فراخوانی ابزار: {tool.toolName}</span>
                            </div>
                            <div className="text-slate-400">
                              <span className="text-slate-500">پارامتر ورودی: </span>
                              {tool.toolInput}
                            </div>
                            <div className="text-emerald-400 mt-0.5 font-medium">
                              <span className="text-slate-500">خروجی عملیاتی: </span>
                              {tool.toolOutput}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Media Attachment (Image or Audio from Studio) */}
                    {msg.mediaAttachment && (
                      <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-2 mt-2">
                        <div className="flex items-center justify-between text-[11px] text-purple-300 font-semibold">
                          <span className="flex items-center gap-1.5">
                            {msg.mediaAttachment.type === 'image' ? (
                              <ImageIcon className="w-4 h-4 text-purple-400" />
                            ) : (
                              <Volume2 className="w-4 h-4 text-purple-400" />
                            )}
                            خروجی استودیو چندرسانه‌ای
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            ElevenLabs / DALL-E
                          </span>
                        </div>

                        {msg.mediaAttachment.type === 'image' && (
                          <div className="rounded-lg overflow-hidden border border-slate-800">
                            <img
                              src={msg.mediaAttachment.url}
                              alt="خروجی استودیو شورا"
                              className="w-full max-h-56 object-cover"
                            />
                            {msg.mediaAttachment.prompt && (
                              <div className="p-2 bg-slate-900/90 text-[10px] text-slate-400">
                                پرامپت: {msg.mediaAttachment.prompt}
                              </div>
                            )}
                          </div>
                        )}

                        {msg.mediaAttachment.type === 'audio' && (
                          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 flex items-center gap-3">
                            <audio
                              controls
                              src={msg.mediaAttachment.url}
                              className="w-full h-8"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Direct Channel Post Action (if post drafted) */}
                    {msg.publishedPostId && (
                      <div className="bg-gradient-to-r from-blue-950/40 to-slate-950 border border-blue-800/40 rounded-xl p-3 flex items-center justify-between gap-3 mt-2">
                        <div className="text-xs text-blue-200">
                          <div className="font-bold flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            پیش‌نویس نهایی در تلگرام تدوین و تصویب شد
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            آماده انتشار در کانال‌های تلگرام ثبت‌شده است.
                          </p>
                        </div>
                        <button
                          onClick={() => handlePublishDirectly(msg.publishedPostId!)}
                          disabled={publishingPostId === msg.publishedPostId}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-3.5 py-2 rounded-xl text-xs shrink-0 active:scale-95 transition-all shadow-md shadow-blue-600/30 disabled:opacity-50"
                        >
                          {publishingPostId === msg.publishedPostId ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Send className="w-3.5 h-3.5" />
                          )}
                          <span>انتشار مستقیم در کانال</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {isSending && (
            <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-2xl border border-slate-800 text-xs text-slate-400">
              <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              <span>
                شورای ایجنت‌ها در حال رصد کانال‌ها، تبادل نظر، بررسی فکت‌ها و تصمیم‌گیری هستند...
              </span>
            </div>
          )}

          {isTriggeringEmergency && (
            <div className="flex items-center gap-3 p-4 bg-red-950/40 rounded-2xl border border-red-800/40 text-xs text-red-300 animate-pulse">
              <Flame className="w-5 h-5 text-red-400 animate-bounce" />
              <span>
                اتاق وضعیت بحران فعال است؛ اعضای شورا تا زمان تأیید کامل ۱۰۰٪ صحت خبر در حال مباحثه نامحدود هستند...
              </span>
            </div>
          )}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center gap-3"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="دستور یا موضوع برای رصد، فکت‌چک، ساخت محتوا و انتشار به شورا بدهید..."
            disabled={isSending || isTriggeringEmergency}
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending || isTriggeringEmergency}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-500 px-4 py-2.5 rounded-xl text-xs font-semibold shrink-0 transition-all"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span>ارسال به شورا</span>
          </button>
        </form>
      </div>

      {/* Manual Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-red-400 font-bold text-sm">
                <Flame className="w-5 h-5 text-red-500" />
                <span>فعال‌سازی دستی اتاق وضعیت بحران</span>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                بستن ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              با فعال‌سازی این حالت، شورا وارد پروتکل اضطراری می‌شود. اعضا با دورهای نامحدود مکالمه می‌کنند، کانال‌های ورودی را رصد کرده، فکت‌چک چندمنبعی انجام داده، بسته استودیو تولید و پیش‌نویس موثق را نهایی می‌کنند.
            </p>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-200">
                موضوع بحران برای راستی‌آزمایی:
              </label>
              <textarea
                value={emergencyTopicInput}
                onChange={(e) => setEmergencyTopicInput(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 focus:border-red-500 rounded-xl p-3 text-xs text-slate-200 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] text-slate-400">سناریوهای آماده:</span>
              <div className="flex flex-col gap-1.5">
                {emergencyPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => setEmergencyTopicInput(preset)}
                    className="text-right text-[11px] p-2 rounded-lg bg-slate-950 hover:bg-slate-800/90 text-slate-300 border border-slate-800/80 transition-colors"
                  >
                    ⚡ {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
              >
                انصراف
              </button>
              <button
                onClick={() => handleTriggerEmergency()}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>شروع فوری اتاق وضعیت</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Council Privileges & Autonomous Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                <Sliders className="w-5 h-5 text-cyan-400" />
                <span>تنظیمات اختیارات و خودمختاری شورا</span>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                بستن ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Toggle 1: Autonomous Mode */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">
                    ورود خودکار شورا در صورت بحران (نصف شب)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    فعال‌سازی بی‌درنگ بدون نیاز به تأیید کاربر هنگام ورود اخبار حساس
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autonomousMode}
                  onChange={(e) => setAutonomousMode(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
                />
              </div>

              {/* Toggle 2: Auto Publish on Consensus */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">
                    انتشار خودکار در کانال مقصد پس از اجماع ۱۰۰٪
                  </div>
                  <div className="text-[11px] text-slate-400">
                    اگر فعال باشد پست فوراً به تلگرام ارسال می‌شود؛ وگرنه به شکل پیش‌نویس ذخیره می‌گردد
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer shrink-0"
                />
              </div>

              {/* Toggle 3: Studio Full Access */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">
                    دسترسی شورا به استودیو چندرسانه‌ای
                  </div>
                  <div className="text-[11px] text-slate-400">
                    تولید خودکار عکس کاور، پادکست صوتی گوینده و ویدیو
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={studioAccess}
                  onChange={(e) => setStudioAccess(e.target.checked)}
                  className="w-5 h-5 accent-purple-600 rounded cursor-pointer shrink-0"
                />
              </div>

              {/* Toggle 4: Source Channel Scanning */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-200">
                    اختیار رصد کانال‌های ورودی تلگرام
                  </div>
                  <div className="text-[11px] text-slate-400">
                    پایش مستمر پست‌های منابع برای فکت‌چک و راستی‌آزمایی اخبار
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={channelMonitoring}
                  onChange={(e) => setChannelMonitoring(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer shrink-0"
                />
              </div>

              <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-xl text-blue-200 text-[11px] leading-relaxed">
                ℹ️ <strong>پروتکل مذاکره نامحدود:</strong> تعداد دورهای مکالمه اعضا به طور پیش‌فرض روی <strong>نامحدود (تا حصول اجماع ۱۰۰٪)</strong> تنظیم شده است.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowConfigModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                انصراف
              </button>
              <button
                onClick={handleSaveConfig}
                className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
              >
                ذخیره اختیارات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Round Deliberation Modal (User-Defined Rounds) */}
      {showDeliberationModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <form
            onSubmit={handleStartDeliberation}
            className="bg-slate-900 border border-purple-500/40 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl"
            dir="rtl"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-purple-400 font-bold text-sm">
                <Users className="w-5 h-5 text-purple-400" />
                <span>برگزاری جلسه داوری و مباحثه چند دور شورا (تعیین‌شده توسط شما)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDeliberationModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-200 block mb-1">
                  موضوع یا تیتر خبر:
                </label>
                <input
                  type="text"
                  value={delibTopic}
                  onChange={(e) => setDelibTopic(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-200 block mb-1">
                  منبع رصدشده (کانال تلگرامی یا خبرگزاری):
                </label>
                <input
                  type="text"
                  value={delibSource}
                  onChange={(e) => setDelibSource(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-200 block mb-1">
                  متن کامل خبر رصدشده جهت داوری شورا:
                </label>
                <textarea
                  value={delibText}
                  onChange={(e) => setDelibText(e.target.value)}
                  rows={4}
                  required
                  placeholder="متن خبر را وارد نمایید تا اعضای شورا در چند دور به گفتگو و واکنش نسبت به یکدیگر بپردازند..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-purple-500"
                />
              </div>

              {/* Rounds Selector */}
              <div className="bg-purple-950/25 border border-purple-900/30 p-3.5 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-purple-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-400" />
                    <span>تعداد دورهای مباحثه و چالش اعضا (تعیین توسط کاربر):</span>
                  </label>
                  <span className="text-xs font-bold text-purple-300 font-mono bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/50">
                    {delibRounds} دور گفتگوی متقابل
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setDelibRounds(r)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        delibRounds === r
                          ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/40 scale-105'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {r} {r === 1 ? 'دور' : 'دور'}
                    </button>
                  ))}
                </div>

                <p className="text-[11px] text-purple-300/80 leading-relaxed pt-1">
                  اعضای شورا در هر دور پیام‌های دور قبلی یکدیگر را می‌خوانند، به هم پاسخ می‌دهند، راستی‌آزمایی می‌کنند و در انتها مصوب می‌کنند که آیا خبر در کانال تلگرام پخش شود یا خیر.
                </p>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-200 block mb-1">
                  دستورالعمل خاص مدیر (اختیاری):
                </label>
                <input
                  type="text"
                  value={delibInstruction}
                  onChange={(e) => setDelibInstruction(e.target.value)}
                  placeholder="مثلاً: در صورت عدم وجود ادعای رسمی، رأی منفی بدهید..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowDeliberationModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                انصراف
              </button>
              <button
                type="submit"
                disabled={isDeliberating || !delibText.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 flex items-center gap-2 disabled:opacity-50 active:scale-95 transition-all"
              >
                {isDeliberating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-white" />
                )}
                <span>آغاز جلسه داوری ({delibRounds} دور)</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
