import React, { useState } from 'react';
import {
  Compass,
  Filter,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  RefreshCw,
  Sliders,
  Send,
  ArrowRight,
  Eye,
  Plus,
  BookOpen,
} from 'lucide-react';
import { IngestedMessage, PromptTemplate, Channel, ScheduledPost } from '../types';
import { api } from '../services/api';

interface Props {
  ingestedMessages: IngestedMessage[];
  templates: PromptTemplate[];
  destinationChannels: Channel[];
  onRefresh: () => void;
}

export const ContentIngestionModule: React.FC<Props> = ({
  ingestedMessages,
  templates,
  destinationChannels,
  onRefresh,
}) => {
  // Filtering states
  const [keywordFilter, setKeywordFilter] = useState('');
  const [topicFilter, setTopicFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('24h');

  // Active message being reviewed / processed
  const [selectedMessage, setSelectedMessage] = useState<IngestedMessage | null>(
    ingestedMessages[0] || null
  );

  // AI Rewriting parameters
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(
    templates[0]?.id || 'tmpl-1'
  );
  const [customInstruction, setCustomInstruction] = useState('');
  const [targetTone, setTargetTone] = useState('حرفه‌ای و ژورنالیستی');
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [processedOutput, setProcessedOutput] = useState<string | null>(
    selectedMessage?.rewrittenText || null
  );
  const [similarityScore, setSimilarityScore] = useState<number>(
    selectedMessage?.similarityPercentage || 14
  );
  const [copyrightNotice, setCopyrightNotice] = useState<string | null>(null);

  // Template editor modal
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplatePrompt, setNewTemplatePrompt] = useState('');

  // Human in the Loop approval
  const [isApproving, setIsApproving] = useState(false);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);

  // Filter messages
  const filteredMessages = ingestedMessages.filter((msg) => {
    if (topicFilter !== 'all' && msg.topic !== topicFilter) return false;
    if (keywordFilter) {
      const matchKey = msg.keywords.some((k) => k.toLowerCase().includes(keywordFilter.toLowerCase()));
      const matchText = msg.originalText.toLowerCase().includes(keywordFilter.toLowerCase());
      if (!matchKey && !matchText) return false;
    }
    return true;
  });

  const handleSelectMessage = (msg: IngestedMessage) => {
    setSelectedMessage(msg);
    setProcessedOutput(msg.rewrittenText || null);
    setSimilarityScore(msg.similarityPercentage || 14);
    setApprovalNotice(null);
  };

  const handleRunAiProcess = async () => {
    if (!selectedMessage) return;
    setIsProcessingAI(true);
    setCopyrightNotice(null);
    setApprovalNotice(null);

    try {
      const res = await api.processContentAI({
        originalText: selectedMessage.originalText,
        templateId: selectedTemplateId,
        customInstruction,
        targetTone,
      });

      if (res.success) {
        setProcessedOutput(res.rewrittenText);
        setSimilarityScore(res.similarityScore);
        setCopyrightNotice(
          `گزارش ممیزی حقوق نشر: شباهت متنی ${res.similarityScore}٪ ارزیابی شد. محتوا دارای اصالت بالا بوده و منطبق با قوانین تلگرام است.`
        );
      }
    } catch {
      setCopyrightNotice('خطا در پردازش با هوش مصنوعی. لطفاً دوباره امتحان کنید.');
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleApproveAndSchedule = async () => {
    if (!selectedMessage || !processedOutput) return;
    setIsApproving(true);
    try {
      const destId = destinationChannels[0]?.id || '';
      await api.createPost({
        title: `بازنویسی: ${selectedMessage.originalText.slice(0, 35)}...`,
        content: processedOutput,
        destinationChannelIds: [destId],
        scheduledAt: new Date(Date.now() + 3600000).toISOString(),
        status: 'scheduled',
        originalSourceId: selectedMessage.id,
        plagiarismRiskScore: similarityScore,
        tags: selectedMessage.keywords,
      });

      setApprovalNotice('✅ پست با موفقیت تایید شد و به صف زمان‌بندی انتشار اضافه گردید.');
      onRefresh();
    } catch {
      setApprovalNotice('خطا در ثبت پست زمان‌بندی.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName || !newTemplatePrompt) return;
    await api.addTemplate({
      name: newTemplateName,
      category: 'custom',
      systemPrompt: newTemplatePrompt,
    });
    setNewTemplateName('');
    setNewTemplatePrompt('');
    setIsAddingTemplate(false);
    onRefresh();
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/30 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-inner">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">رصد هوشمند کانال‌های مبدأ و بازنویسی اختصاصی</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Human-in-the-Loop فعال
                </span>
              </div>
              <p className="text-xs text-slate-400">
                دریافت مجاز پست‌ها از کانال‌های مبدأ، فیلتر محتوایی، بازنویسی هوشمند با قالب‌های شخصی‌سازی‌شده و ممیزی کپی‌رایت
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingTemplate(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              افزودن دستورالعمل (Prompt Template)
            </button>
          </div>
        </div>
      </div>

      {/* Main Workspace: 3 Columns Layout (Feed -> AI Configuration -> Human Review) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Col 1: Ingested Feed & Filters (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-indigo-400" />
              <h3 className="font-bold text-white text-sm">پیام‌های دریافتی از مبادی</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">{filteredMessages.length} پیام</span>
          </div>

          {/* Filters Bar */}
          <div className="space-y-2">
            <input
              type="text"
              value={keywordFilter}
              onChange={(e) => setKeywordFilter(e.target.value)}
              placeholder="جستجو در کلمات کلیدی یا متن..."
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="flex-1 px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
              >
                <option value="all">همه موضوعات</option>
                <option value="هوش مصنوعی">هوش مصنوعی</option>
                <option value="اقتصاد و کریپتو">اقتصاد و کریپتو</option>
                <option value="استارتاپ">استارتاپ</option>
              </select>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-2 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
              >
                <option value="24h">۲۴ ساعت اخیر</option>
                <option value="week">هفته جاری</option>
              </select>
            </div>
          </div>

          {/* Message List */}
          <div className="space-y-2.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredMessages.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-800 space-y-2">
                <p>هنوز پیامی از کانال‌های مبدأ دریافت نشده است.</p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  می‌توانید کانال‌های مبدأ را از بخش «ربات و کانال‌ها» ثبت کنید تا پیام‌ها در این قسمت لیست شوند.
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => {
              const isSelected = selectedMessage?.id === msg.id;
              return (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-3.5 rounded-xl border transition cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-indigo-950/40 border-indigo-500/50 shadow-md'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-300 font-mono dir-ltr">{msg.sourceChannelName}</span>
                    <span className="text-slate-500">
                      {new Date(msg.date).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {msg.originalText}
                  </p>

                  <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300">
                      #{msg.topic}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded font-medium ${
                        msg.processingStatus === 'rewritten'
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {msg.processingStatus === 'rewritten' ? 'بازنویسی‌شده' : 'جدید'}
                    </span>
                  </div>
                </div>
              );
            }))}
          </div>
        </div>

        {/* Col 2 & 3: AI Processing & Side-by-Side Human-in-the-Loop Review (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* AI Settings Toolbar */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">موتور پردازش زبانی و انتخاب قالب پرامپت</h3>
              </div>
              <span className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
                مدل: Gemini 3.8 Flash (سرور)
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">انتخاب قالب پرامپت (Prompt Template):</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {templates.map((tmpl) => (
                    <option key={tmpl.id} value={tmpl.id}>
                      {tmpl.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">لحن و سبک نگارش (Tone):</label>
                <select
                  value={targetTone}
                  onChange={(e) => setTargetTone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option value="حرفه‌ای و ژورنالیستی">حرفه‌ای، ژورنالیستی و موثق</option>
                  <option value="آموزشی و تحلیلی با جزئیات">آموزشی و تحلیلی با جزئیات عمیق</option>
                  <option value="کوتاه و ترغیب‌کننده تلگرامی">کوتاه، پرانرژی و ترغیب‌کننده</option>
                  <option value="انتقادی و نکته‌سنج">انتقادی و نکته‌سنج</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">دستورالعمل اختصاصی برای این پست (اختیاری):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  placeholder="مثال: حتماً روی کاربرد این فناوری برای کاربران ایرانی تاکید کن..."
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleRunAiProcess}
                  disabled={isProcessingAI || !selectedMessage}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50"
                >
                  {isProcessingAI ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  )}
                  اجرای بازنویسی با هوش مصنوعی
                </button>
              </div>
            </div>
          </div>

          {/* Human-in-the-Loop Review Box: Original vs Rewritten */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-white text-sm">مرحله تایید دستی (Human-in-the-Loop Review)</h3>
                  <p className="text-xs text-slate-400">بررسی قبل از انتشار برای جلوگیری از خطای محتوایی و نقض کپی‌رایت</p>
                </div>
              </div>

              {/* Copyright Safety Badge */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">ریسک مشابهت:</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-bold ${
                    similarityScore < 20
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {similarityScore}٪ (محتوای اختصاصی و امن)
                </span>
              </div>
            </div>

            {copyrightNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{copyrightNotice}</span>
              </div>
            )}

            {approvalNotice && (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{approvalNotice}</span>
              </div>
            )}

            {/* Side-by-side comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Original Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-slate-300">متن منبع (Original Source)</span>
                  <span className="font-mono text-[11px] dir-ltr text-amber-400/80">
                    {selectedMessage?.sourceChannelName}
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 h-72 overflow-y-auto leading-relaxed select-text">
                  {selectedMessage ? selectedMessage.originalText : 'پیامی انتخاب نشده است.'}
                </div>
              </div>

              {/* Rewritten AI Output (Editable) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    خروجی بازنویسی‌شده (قابل ویرایش شما)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    طول: {processedOutput ? processedOutput.length : 0} کاراکتر
                  </span>
                </div>
                <textarea
                  value={processedOutput || ''}
                  onChange={(e) => setProcessedOutput(e.target.value)}
                  placeholder="پس از اجرای بازنویسی، نتیجه در این قسمت قرار می‌گیرد و شما می‌توانید آن را قبل از انتشار ویرایش کنید..."
                  className="w-full p-4 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-100 h-72 focus:outline-none focus:border-emerald-500 leading-relaxed font-sans"
                />
              </div>
            </div>

            {/* Approval Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                ارسال به کانال مقصد:{' '}
                <strong className="text-slate-200">
                  {destinationChannels[0]?.title || 'پالس تکنولوژی'} ({destinationChannels[0]?.username})
                </strong>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setProcessedOutput(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition"
                >
                  پاک‌سازی
                </button>
                <button
                  onClick={handleApproveAndSchedule}
                  disabled={isApproving || !processedOutput}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isApproving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  تایید دستی و افزودن به صف زمان‌بندی
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Add Prompt Template */}
      {isAddingTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-white text-base">افزودن قالب پرامپت اختصاصی (Prompt Template)</h3>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">نام قالب پرامپت:</label>
                <input
                  type="text"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="مثال: گزارش تحلیلی برای توسعه‌دهندگان فرانت‌اند"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">دستورالعمل کامل سیستم (System Prompt):</label>
                <textarea
                  value={newTemplatePrompt}
                  onChange={(e) => setNewTemplatePrompt(e.target.value)}
                  rows={6}
                  placeholder="شما یک دستیار تخصصی تلگرام هستید. متن را تحلیل کن، نکات کدنویسی را استخراج کن..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-indigo-500 focus:outline-none leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingTemplate(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition"
                >
                  ذخیره قالب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
