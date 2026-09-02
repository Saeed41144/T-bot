import React, { useState } from 'react';
import { IngestedMessage, PromptTemplate, Channel } from '../types';
import { api } from '../services/api';
import {
  FileText,
  Sparkles,
  ShieldCheck,
  Send,
  Loader2,
  Copy,
  Check,
  Zap,
  Tag,
  SlidersHorizontal,
  AlertTriangle,
  Flame,
  Radio,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Search,
  Filter,
} from 'lucide-react';

interface ContentIngestionModuleProps {
  ingestedMessages: IngestedMessage[];
  templates: PromptTemplate[];
  destinationChannels: Channel[];
  onRefresh: () => void;
  onNavigateToCouncil?: () => void;
}

export const ContentIngestionModule: React.FC<ContentIngestionModuleProps> = ({
  ingestedMessages,
  templates,
  destinationChannels,
  onRefresh,
  onNavigateToCouncil,
}) => {
  // Tabs: 'monitor' (رصد و غربالگری هوشمند اخبار) or 'rewrite' (ابزار بازنویسی Gemini)
  const [activeSubTab, setActiveSubTab] = useState<'monitor' | 'rewrite'>('monitor');

  // Filter & Search
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'critical' | 'high' | 'council'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Importance Analysis State
  const [isAnalyzingAll, setIsAnalyzingAll] = useState(false);
  const [analyzingItemId, setAnalyzingItemId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Escalate to Council Modal State
  const [escalatingItem, setEscalatingItem] = useState<IngestedMessage | null>(null);
  const [selectedRounds, setSelectedRounds] = useState<number>(3);
  const [managerInstruction, setManagerInstruction] = useState('');
  const [isEscalating, setIsEscalating] = useState(false);

  // Add Manual Monitored News Modal State
  const [showAddNewsModal, setShowAddNewsModal] = useState(false);
  const [newNewsText, setNewNewsText] = useState('');
  const [newNewsSource, setNewNewsSource] = useState('کانال خبری تلگرام (رویترز / فارس / بین‌الملل)');
  const [newNewsTopic, setNewNewsTopic] = useState('');
  const [isSubmittingNews, setIsSubmittingNews] = useState(false);

  // Rewrite Tab State
  const [inputText, setInputText] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(templates[0]?.id || '');
  const [targetTone, setTargetTone] = useState('حرفه‌ای و ژورنالیستی');
  const [customInstruction, setCustomInstruction] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [rewrittenResult, setRewrittenResult] = useState<string | null>(null);
  const [similarityScore, setSimilarityScore] = useState<number | null>(null);
  const [costInfo, setCostInfo] = useState<any | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingPost, setIsSavingPost] = useState(false);

  const showNotification = (type: 'success' | 'error', text: string) => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 5000);
  };

  // Run AI Importance Analysis on all or single
  const handleAnalyzeAll = async () => {
    setIsAnalyzingAll(true);
    try {
      const res = await api.analyzeImportance();
      if (res.success) {
        showNotification('success', res.message || 'پروتکل غربالگری هوش مصنوعی با موفقیت اجرا شد.');
        onRefresh();
      }
    } catch (err) {
      console.error('Error running AI importance analysis:', err);
      showNotification('error', 'خطا در ارزیابی خودکار اخبار.');
    } finally {
      setIsAnalyzingAll(false);
    }
  };

  const handleAnalyzeItem = async (msgId: string) => {
    setAnalyzingItemId(msgId);
    try {
      const res = await api.analyzeImportance(msgId);
      if (res.success) {
        showNotification('success', 'ارزیابی فوریت و اعتبار خبر با موفقیت انجام شد.');
        onRefresh();
      }
    } catch (err) {
      console.error('Error analyzing news item:', err);
      showNotification('error', 'خطا در تحلیل خبر.');
    } finally {
      setAnalyzingItemId(null);
    }
  };

  // Add Manual News
  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNewsText.trim() || isSubmittingNews) return;

    setIsSubmittingNews(true);
    try {
      const res = await api.createIngestedMessage({
        originalText: newNewsText.trim(),
        sourceChannelName: newNewsSource,
        topic: newNewsTopic.trim() || undefined,
      });

      if (res.success) {
        showNotification('success', 'خبر جدید با موفقیت به رصد محتوا افزوده شد.');
        setNewNewsText('');
        setNewNewsTopic('');
        setShowAddNewsModal(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Error creating news:', err);
      showNotification('error', 'خطا در افزودن خبر.');
    } finally {
      setIsSubmittingNews(false);
    }
  };

  // Escalate to Council with User-Defined Rounds
  const handleEscalateToCouncil = async () => {
    if (!escalatingItem || isEscalating) return;

    setIsEscalating(true);
    try {
      const res = await api.escalateToCouncil(
        escalatingItem.id,
        selectedRounds,
        managerInstruction.trim() || undefined
      );

      if (res.success) {
        showNotification(
          'success',
          `جلسه داوری شورا در ${selectedRounds} دور آغاز گردید. شورا تصمیم گرفت: ${
            res.session?.verdict === 'approved' ? 'تایید و تصویب جهت انتشار در کانال تلگرام' : 'رد خبر و عدم انتشار'
          }`
        );
        setEscalatingItem(null);
        setManagerInstruction('');
        onRefresh();
      }
    } catch (err) {
      console.error('Error escalating to council:', err);
      showNotification('error', 'خطا در ارجاع به شورای ایجنت‌ها.');
    } finally {
      setIsEscalating(false);
    }
  };

  // Rewrite Handlers
  const handleRewrite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const res = await api.processContent({
        originalText: inputText.trim(),
        templateId: selectedTemplateId || undefined,
        targetTone,
        customInstruction,
      });

      if (res.success) {
        setRewrittenResult(res.rewrittenText);
        setSimilarityScore(res.similarityScore);
        setCostInfo(res.cost);
        onRefresh();
      }
    } catch (err) {
      console.error('Error processing content:', err);
      showNotification('error', 'خطا در بازنویسی محتوا.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveToPost = async () => {
    if (!rewrittenResult) return;
    setIsSavingPost(true);
    try {
      await api.createPost({
        title: rewrittenResult.split('\n')[0].slice(0, 45) || 'پست بازنویسی‌شده',
        content: rewrittenResult,
        mediaType: 'text',
        targetChannelIds: destinationChannels.map((c) => c.id),
        status: 'draft',
      });
      showNotification('success', 'پست با موفقیت در لیست پیش‌نویس‌ها ذخیره شد.');
      onRefresh();
    } catch (err) {
      console.error('Error saving post:', err);
      showNotification('error', 'خطا در ذخیره پست.');
    } finally {
      setIsSavingPost(false);
    }
  };

  const copyToClipboard = () => {
    if (rewrittenResult) {
      navigator.clipboard.writeText(rewrittenResult);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Filter messages
  const filteredMessages = ingestedMessages.filter((msg) => {
    if (urgencyFilter === 'critical' && msg.urgencyLevel !== 'critical') return false;
    if (urgencyFilter === 'high' && msg.urgencyLevel !== 'high' && msg.urgencyLevel !== 'critical') return false;
    if (urgencyFilter === 'council' && !msg.councilVerdict && msg.processingStatus !== 'in_council') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        msg.originalText.toLowerCase().includes(q) ||
        msg.sourceChannelName.toLowerCase().includes(q) ||
        msg.topic.toLowerCase().includes(q) ||
        (msg.importanceReason && msg.importanceReason.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Mode Toggle */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/25 ring-2 ring-emerald-400/20">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  پروتکل هوشمند رصد، غربالگری و پالایش اخبار با هوش مصنوعی
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  مجهز به فیلتر هوش مصنوعی و ارجاع به شورا
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                این پروتکل اخبار دریافتی از کانال‌های تلگرامی و منابع خبری را رصد کرده، فوریت و ارزش خبری را به صورت خودکار با مدل Gemini تشخیص می‌دهد و خبرهای حساس را جهت تصمیم‌گیری نهایی پیرامون پخش یا عدم پخش به شورای ایجنت‌ها ارسال می‌کند.
              </p>
            </div>
          </div>

          {/* Tab buttons */}
          <div className="flex items-center gap-2 shrink-0 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveSubTab('monitor')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'monitor'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>پایش و رصد اخبار ({ingestedMessages.length})</span>
            </button>
            <button
              onClick={() => setActiveSubTab('rewrite')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeSubTab === 'rewrite'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>کارگاه بازنویسی Gemini</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div
          className={`p-3.5 rounded-xl border flex items-center gap-3 text-xs animate-in fade-in ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-300'
          }`}
        >
          {notificationMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{notificationMsg.text}</span>
        </div>
      )}

      {/* SUB-TAB 1: AI NEWS MONITORING & DELIBERATION ESCALATION */}
      {activeSubTab === 'monitor' && (
        <div className="space-y-5">
          {/* Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search & Urgency Filter */}
            <div className="flex flex-wrap items-center gap-2.5 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در متن، منبع یا موضوع اخبار..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-9 pl-3 py-2 text-xs text-slate-200 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setUrgencyFilter('all')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    urgencyFilter === 'all'
                      ? 'bg-slate-800 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  همه ({ingestedMessages.length})
                </button>
                <button
                  onClick={() => setUrgencyFilter('critical')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    urgencyFilter === 'critical'
                      ? 'bg-red-950/80 text-red-300 font-semibold border border-red-800/50'
                      : 'text-red-400/80 hover:text-red-300'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                  <span>بحرانی / فوری</span>
                </button>
                <button
                  onClick={() => setUrgencyFilter('high')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    urgencyFilter === 'high'
                      ? 'bg-amber-950/80 text-amber-300 font-semibold border border-amber-800/50'
                      : 'text-amber-400/80 hover:text-amber-300'
                  }`}
                >
                  اهمیت بالا
                </button>
                <button
                  onClick={() => setUrgencyFilter('council')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                    urgencyFilter === 'council'
                      ? 'bg-purple-950/80 text-purple-300 font-semibold border border-purple-800/50'
                      : 'text-purple-400/80 hover:text-purple-300'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  <span>داوری‌شده در شورا</span>
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              {/* Manual News Ingestion */}
              <button
                onClick={() => setShowAddNewsModal(true)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-700 active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>ثبت دستی خبر رصدشده</span>
              </button>

              {/* Run AI Importance Protocol */}
              <button
                onClick={handleAnalyzeAll}
                disabled={isAnalyzingAll}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg shadow-emerald-600/30 active:scale-95 transition-all disabled:opacity-50"
              >
                {isAnalyzingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>غربالگری هوشمند اخبار با هوش مصنوعی</span>
              </button>
            </div>
          </div>

          {/* News Items Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredMessages.length === 0 ? (
              <div className="col-span-full bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
                <Radio className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                <h3 className="font-semibold text-slate-300 text-sm">خبری با فیلتر انتخابی یافت نشد</h3>
                <p className="text-xs text-slate-500 mt-1">
                  می‌توانید فیلترها را ریست کنید یا با دکمه «ثبت دستی خبر رصدشده» متن جدیدی را وارد نمایید.
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
                const isCritical = msg.urgencyLevel === 'critical' || (msg.importanceScore || 0) >= 90;
                const isHigh = msg.urgencyLevel === 'high' || ((msg.importanceScore || 0) >= 75 && !isCritical);
                const isCouncilApproved = msg.councilVerdict === 'approved' || msg.processingStatus === 'council_approved';
                const isCouncilRejected = msg.councilVerdict === 'rejected' || msg.processingStatus === 'council_rejected';
                const isInCouncil = msg.processingStatus === 'in_council';

                return (
                  <div
                    key={msg.id}
                    className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition-all flex flex-col justify-between ${
                      isCritical
                        ? 'border-red-500/40 bg-gradient-to-b from-red-950/20 via-slate-900 to-slate-900 ring-1 ring-red-500/20'
                        : isHigh
                          ? 'border-amber-500/30'
                          : 'border-slate-800'
                    }`}
                  >
                    <div>
                      {/* Card Header: Source, Date, Badges */}
                      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-200">
                            {msg.sourceChannelName}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(msg.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Urgency Badge */}
                        <div className="flex items-center gap-1.5">
                          {isCritical && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/40 flex items-center gap-1">
                              <Flame className="w-3 h-3 text-red-400" />
                              بحرانی / فوری
                            </span>
                          )}
                          {isHigh && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              اهمیت راهبردی
                            </span>
                          )}

                          {/* Council Status Badge */}
                          {isCouncilApproved && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              تصویب شورا (پخش در کانال)
                            </span>
                          )}
                          {isCouncilRejected && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                              <XCircle className="w-3 h-3 text-rose-400" />
                              رد شورا (عدم انتشار)
                            </span>
                          )}
                          {isInCouncil && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1 animate-pulse">
                              <Users className="w-3 h-3 text-purple-400" />
                              در حال داوری شورا...
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Topic Title */}
                      <div className="mt-3">
                        <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                          <Tag className="w-3.5 h-3.5 text-amber-400" />
                          <span>{msg.topic}</span>
                        </h4>
                      </div>

                      {/* Raw Text */}
                      <p className="mt-2 text-xs text-slate-200 leading-relaxed line-clamp-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 font-sans">
                        {msg.originalText}
                      </p>

                      {/* AI Importance Indicators */}
                      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 text-[11px]">
                        <div>
                          <span className="text-slate-400 block text-[10px]">شاخص فوریت هوش مصنوعی:</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  (msg.importanceScore || 70) >= 85
                                    ? 'bg-red-500'
                                    : (msg.importanceScore || 70) >= 70
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                }`}
                                style={{ width: `${msg.importanceScore || 75}%` }}
                              />
                            </div>
                            <span className="font-bold text-white font-mono">
                              %{msg.importanceScore || 75}
                            </span>
                          </div>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px]">تخمین وثاقت منبع:</span>
                          <span className="font-bold text-cyan-400 font-mono">
                            %{msg.factCredibilityScore || 90}
                          </span>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-slate-400 block text-[10px]">تشابه با مراجع:</span>
                          <span className="font-bold text-emerald-400 font-mono">
                            %{msg.similarityPercentage || 5} (ممیزی امن)
                          </span>
                        </div>
                      </div>

                      {/* AI Reason for Importance */}
                      {msg.importanceReason && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 leading-relaxed flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-emerald-400">تحلیل هوشمند ارزش خبری: </span>
                            <span>{msg.importanceReason}</span>
                          </div>
                        </div>
                      )}

                      {/* Council Decision Summary (if decided) */}
                      {msg.councilDecisionSummary && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-purple-200 leading-relaxed flex items-start gap-2">
                          <Users className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-purple-300">
                              مصوبه شورا ({msg.councilRounds || 3} دور مباحثه):{' '}
                            </span>
                            <span>{msg.councilDecisionSummary}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {/* Quick AI Analyze Single Item */}
                        <button
                          onClick={() => handleAnalyzeItem(msg.id)}
                          disabled={analyzingItemId === msg.id}
                          className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                          title="ارزیابی مجدد با هوش مصنوعی"
                        >
                          {analyzingItemId === msg.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span>تحلیل مجدد</span>
                        </button>

                        {/* Copy raw text */}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(msg.originalText);
                            showNotification('success', 'متن خبر کپی شد.');
                          }}
                          className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 p-1.5 rounded-lg transition-colors"
                          title="کپی متن خام خبر"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Escalation to Council Button */}
                      <div className="flex items-center gap-2">
                        {msg.councilVerdict ? (
                          onNavigateToCouncil && (
                            <button
                              onClick={onNavigateToCouncil}
                              className="text-xs bg-purple-900/60 hover:bg-purple-800 text-purple-200 font-semibold px-3 py-1.5 rounded-xl border border-purple-700/50 flex items-center gap-1.5 transition-all"
                            >
                              <span>مشاهده مذاکرات در شورا</span>
                              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                            </button>
                          )
                        ) : (
                          <button
                            onClick={() => {
                              setEscalatingItem(msg);
                              setSelectedRounds(3);
                            }}
                            className="text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-3.5 py-2 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-1.5 active:scale-95 transition-all"
                          >
                            <Users className="w-3.5 h-3.5" />
                            <span>ارجاع به شورا جهت داوری انتشار</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: GEMINI 3.8 FLASH REWRITE WORKSHOP */}
      {activeSubTab === 'rewrite' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <form onSubmit={handleRewrite} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-xs text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
                <span>ورودی متن و تنظیمات پرامپت</span>
              </h3>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                متن خام خبر یا پیام مبدأ:
              </label>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                placeholder="متن خبر را اینجا قرار دهید..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                  قالب بازنویسی:
                </label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                  لحن پیام:
                </label>
                <select
                  value={targetTone}
                  onChange={(e) => setTargetTone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  <option value="حرفه‌ای و ژورنالیستی">حرفه‌ای و ژورنالیستی</option>
                  <option value="فوری و هیجانی تلگرامی">فوری و پرکشش</option>
                  <option value="تحلیلی و علمی عمیق">تحلیلی و موشکافانه</option>
                  <option value="ساده و همه‌فهم برای عموم">روان و خودمانی</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                دستورالعمل اختصاصی برای مدل (اختیاری):
              </label>
              <input
                type="text"
                value={customInstruction}
                onChange={(e) => setCustomInstruction(e.target.value)}
                placeholder="مثلاً: روی ابعاد اقتصادی تمرکز کن..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isProcessing || !inputText.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              <span>پردازش و بازنویسی با Gemini 3.8 Flash</span>
            </button>
          </form>

          {/* Output Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-xs text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>پست آماده و ممیزی کپی‌رایت</span>
                </h3>
                {similarityScore !== null && (
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    میزان تشابه لفظی: {similarityScore}% (کاملاً امن)
                  </span>
                )}
              </div>

              <div className="mt-3 bg-slate-950 rounded-xl p-4 border border-slate-800 min-h-[220px] text-xs leading-relaxed text-slate-200 whitespace-pre-line">
                {rewrittenResult ? (
                  rewrittenResult
                ) : (
                  <div className="h-44 flex flex-col items-center justify-center text-slate-500 text-xs">
                    <span>متن خروجی پس از پردازش اینجا نمایش داده خواهد شد.</span>
                  </div>
                )}
              </div>
            </div>

            {rewrittenResult && (
              <div className="space-y-3 pt-3 border-t border-slate-800">
                {costInfo && (
                  <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono">
                    <span>توکن‌های مصرفی: {costInfo.tokens}</span>
                    <span className="text-emerald-400">
                      هزینه: ${costInfo.costUsd?.toFixed(6)} (~{costInfo.costToman} تومان)
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs py-2 rounded-xl flex items-center justify-center gap-2"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'کپی شد!' : 'کپی متن'}</span>
                  </button>
                  <button
                    onClick={handleSaveToPost}
                    disabled={isSavingPost}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2 rounded-xl flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>ذخیره به عنوان پست تلگرام</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ESCALATE TO COUNCIL WITH USER-DEFINED ROUNDS */}
      {escalatingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-purple-500/40 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    ارجاع خبر به شورای ایجنت‌ها جهت تصمیم‌گیری پیرامون انتشار
                  </h3>
                  <span className="text-xs text-slate-400">
                    پروتکل مباحثه متقابل و رأی‌گیری چند دور
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEscalatingItem(null)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            {/* News summary preview */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>منبع: {escalatingItem.sourceChannelName}</span>
                <span className="text-amber-400 font-bold">شاخص اهمیت: %{escalatingItem.importanceScore || 85}</span>
              </div>
              <div className="font-semibold text-slate-200">{escalatingItem.topic}</div>
              <p className="text-slate-300 line-clamp-2 text-[11px] leading-relaxed">
                {escalatingItem.originalText}
              </p>
            </div>

            {/* Rounds selector: User explicitly defines the deliberation rounds */}
            <div className="space-y-2 bg-purple-950/20 border border-purple-900/30 p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-purple-200 flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-purple-400" />
                  <span>تعداد دورهای مباحثه و چالش شورا (تعیین‌شده توسط شما):</span>
                </label>
                <span className="text-xs font-bold text-purple-300 font-mono bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/50">
                  {selectedRounds} دور گفتگوی متقابل
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2 pt-2">
                {[1, 2, 3, 4, 5].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRounds(r)}
                    className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                      selectedRounds === r
                        ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-600/40 scale-105'
                        : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {r} {r === 1 ? 'دور' : 'دور'}
                  </button>
                ))}
              </div>

              <p className="text-[11px] text-purple-300/80 leading-relaxed pt-1">
                💡 <span className="font-semibold text-purple-200">سازوکار چند دور:</span> در هر دور، اعضای شورا پیام‌های یکدیگر را می‌بینند، به استدلال‌های هم پاسخ داده و یکدیگر را نقد می‌کنند. در دور نهایی، هر عضو رأی قطعی می‌دهد و شورا مصوب می‌کند که آیا خبر باید در کانال تلگرام منتشر شود یا خیر.
              </p>
            </div>

            {/* Custom Instruction for Council */}
            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                دستورالعمل خاص مدیر برای جلسه شورا (اختیاری):
              </label>
              <input
                type="text"
                value={managerInstruction}
                onChange={(e) => setManagerInstruction(e.target.value)}
                placeholder="مثلاً: در صورت عدم وجود بیانیه وزارت خارجه، انتشار را رد کنید..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setEscalatingItem(null)}
                className="text-xs px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                انصراف
              </button>

              <button
                onClick={handleEscalateToCouncil}
                disabled={isEscalating}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-lg shadow-purple-600/30 disabled:opacity-50 active:scale-95 transition-all"
              >
                {isEscalating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Users className="w-4 h-4" />
                )}
                <span>آغاز داوری شورا ({selectedRounds} دور متوالی)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD MANUAL MONITORED NEWS */}
      {showAddNewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateNews}
            className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4"
            dir="rtl"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm text-white">ثبت خبر جدید در رصد و پالایش محتوا</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddNewsModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                نام یا آیدی کانال مبدأ:
              </label>
              <input
                type="text"
                value={newNewsSource}
                onChange={(e) => setNewNewsSource(e.target.value)}
                placeholder="مثلاً: کانال خبرگزاری رویترز / ایرنا"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                موضوع یا تیتر خبر (اختیاری):
              </label>
              <input
                type="text"
                value={newNewsTopic}
                onChange={(e) => setNewNewsTopic(e.target.value)}
                placeholder="مثلاً: بیانیه فوری شورای امنیت درباره خاورمیانه"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                متن کامل خبر رصدشده:
              </label>
              <textarea
                value={newNewsText}
                onChange={(e) => setNewNewsText(e.target.value)}
                rows={5}
                required
                placeholder="متن خبر را اینجا قرار دهید تا فوریت و ارزش خبری آن توسط هوش مصنوعی ارزیابی شود..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAddNewsModal(false)}
                className="text-xs px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              >
                انصراف
              </button>

              <button
                type="submit"
                disabled={isSubmittingNews || !newNewsText.trim()}
                className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-5 py-2 rounded-xl shadow-lg shadow-emerald-600/30 disabled:opacity-50 transition-all"
              >
                {isSubmittingNews ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>ثبت خبر و آغاز پالایش</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
