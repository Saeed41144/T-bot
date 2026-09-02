import React, { useState } from 'react';
import {
  Send,
  Bot,
  Plus,
  Trash2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Radio,
  ArrowRightLeft,
  Eye,
  ShieldCheck,
} from 'lucide-react';
import { TelegramBotConfig, Channel, ScheduledPost } from '../types';
import { api } from '../services/api';

interface Props {
  botConfig: TelegramBotConfig | null;
  channels: Channel[];
  posts: ScheduledPost[];
  onRefresh: () => void;
  onSelectPostForComposer?: (post: ScheduledPost) => void;
}

export const TelegramBotModule: React.FC<Props> = ({
  botConfig,
  channels,
  posts,
  onRefresh,
  onSelectPostForComposer,
}) => {
  const [botTokenInput, setBotTokenInput] = useState(botConfig?.botToken || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null);

  // Add Channel Modal
  const [isAddingChannel, setIsAddingChannel] = useState(false);
  const [newChanUsername, setNewChanUsername] = useState('');
  const [newChanTitle, setNewChanTitle] = useState('');
  const [newChanType, setNewChanType] = useState<'source' | 'destination'>('source');
  const [newChanKeywords, setNewChanKeywords] = useState('هوش مصنوعی, تکنولوژی');

  // Quick Post Modal
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [selectedDestId, setSelectedDestId] = useState(
    channels.find((c) => c.type === 'destination')?.id || ''
  );
  const [isSendingDirect, setIsSendingDirect] = useState(false);
  const [directSendNotice, setDirectSendNotice] = useState<string | null>(null);

  const sourceChannels = channels.filter((c) => c.type === 'source');
  const destinationChannels = channels.filter((c) => c.type === 'destination');

  const handleVerifyBot = async () => {
    setIsVerifying(true);
    setVerifyMessage(null);
    try {
      const res = await api.updateBotConfig({ botToken: botTokenInput });
      if (res.verified) {
        setVerifyMessage(`✅ ربات ${res.bot.first_name} (@${res.bot.username}) با موفقیت تایید و متصل شد.`);
      } else {
        setVerifyMessage('✅ تنظیمات ربات با موفقیت ذخیره شد (حالت آزمایشی شبیه‌ساز تلگرام فعال است).');
      }
      onRefresh();
    } catch {
      setVerifyMessage('❌ خطا در برقراری ارتباط با سرور تلگرام.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChanUsername) return;
    await api.addChannel({
      username: newChanUsername,
      title: newChanTitle || newChanUsername,
      type: newChanType,
      filterRules: newChanKeywords.split(',').map((k) => k.trim()),
    });
    setNewChanUsername('');
    setNewChanTitle('');
    setIsAddingChannel(false);
    onRefresh();
  };

  const handleDeleteChannel = async (id: string) => {
    if (confirm('آیا از حذف این کانال اطمینان دارید؟')) {
      await api.deleteChannel(id);
      onRefresh();
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent) return;
    await api.createPost({
      title: postTitle || 'پست جدید',
      content: postContent,
      destinationChannelIds: [selectedDestId || destinationChannels[0]?.id || 'ch-dst-1'],
      scheduledAt: new Date(Date.now() + 3600000 * 2).toISOString(),
      status: 'scheduled',
    });
    setPostTitle('');
    setPostContent('');
    setIsCreatingPost(false);
    onRefresh();
  };

  const handleSendDirect = async (post: ScheduledPost) => {
    setIsSendingDirect(true);
    setDirectSendNotice(null);
    try {
      const res = await api.sendPostDirectly({
        channelId: post.destinationChannelIds[0],
        postTitle: post.title,
        text: post.content,
        mediaUrl: post.mediaUrl,
        mediaType: post.mediaType,
      });
      setDirectSendNotice(res.message);
      onRefresh();
      setTimeout(() => setDirectSendNotice(null), 4000);
    } catch {
      setDirectSendNotice('خطا در ارسال پست به تلگرام');
    } finally {
      setIsSendingDirect(false);
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner: Telegram Bot Status & Credentials */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-blue-950/30 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-white">اتصال به Telegram Bot API</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    فعال و متصل
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  مدیریت ارسال پست، خواندن پیام‌های کانال‌های مبدأ و بررسی سطح دسترسی ادمین
                </p>
              </div>
            </div>
          </div>

          {/* Bot Token Configuration */}
          <div className="flex-1 max-w-xl">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={botTokenInput}
                onChange={(e) => setBotTokenInput(e.target.value)}
                placeholder="توکن ربات تلگرام (از @BotFather دریافت کنید: مثلاً 123456:ABC-DEF...)"
                className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono dir-ltr"
              />
              <button
                onClick={handleVerifyBot}
                disabled={isVerifying}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shrink-0 flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
              >
                {isVerifying ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                بررسی و ذخیره
              </button>
            </div>
            {verifyMessage && (
              <p className="text-xs mt-2 text-slate-300 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800">
                {verifyMessage}
              </p>
            )}
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
              <span>ربات فعال: <strong className="text-slate-200 dir-ltr">{botConfig?.botUsername}</strong></span>
              <span>وب‌هوک: <span className="text-slate-300 font-mono">HTTPS فعال</span></span>
            </div>
          </div>
        </div>
      </div>

      {directSendNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{directSendNotice}</span>
        </div>
      )}

      {/* Grid: Source Channels vs Destination Channels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Source Channels */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-amber-400" />
              <div>
                <h3 className="font-bold text-white text-base">کانال‌های مبدأ (Sources)</h3>
                <p className="text-xs text-slate-400">کانال‌های مجاز برای رصد اخبار و الهام‌گیری محتوایی</p>
              </div>
            </div>
            <button
              onClick={() => {
                setNewChanType('source');
                setIsAddingChannel(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium transition border border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              افزودن مبدأ
            </button>
          </div>

          <div className="space-y-3">
            {sourceChannels.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                هیچ کانال مبدأیی تعریف نشده است. با دکمه «افزودن مبدأ» می‌توانید کانال‌های منبع را اضافه کنید.
              </div>
            ) : (
              sourceChannels.map((ch) => (
                <div
                  key={ch.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                      <span className="font-bold text-slate-200 text-sm">{ch.title}</span>
                      <span className="text-xs text-slate-400 font-mono dir-ltr">{ch.username}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteChannel(ch.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      اعضا: {ch.membersCount.toLocaleString('fa-IR')}
                    </span>
                    {ch.filterRules?.map((rule, idx) => (
                      <span key={idx} className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        فیلتر: {rule}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Destination Channels */}
        <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Send className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="font-bold text-white text-base">کانال‌های مقصد (Destinations)</h3>
                <p className="text-xs text-slate-400">کانال‌هایی که ربات در آنها ادمین رسمی انتشار است</p>
              </div>
            </div>
            <button
              onClick={() => {
                setNewChanType('destination');
                setIsAddingChannel(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-xl text-xs font-medium transition border border-blue-500/30"
            >
              <Plus className="w-3.5 h-3.5" />
              افزودن مقصد
            </button>
          </div>

          <div className="space-y-3">
            {destinationChannels.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                هیچ کانال مقصدی تعریف نشده است. با دکمه «افزودن مقصد»، کانالی که ربات در آن ادمین است را اضافه کنید.
              </div>
            ) : (
              destinationChannels.map((ch) => (
                <div
                  key={ch.id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                      <span className="font-bold text-slate-200 text-sm">{ch.title}</span>
                      <span className="text-xs text-slate-400 font-mono dir-ltr">{ch.username}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteChannel(ch.id)}
                      className="text-slate-500 hover:text-red-400 p-1 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      مخاطب: {ch.membersCount.toLocaleString('fa-IR')} کاربر
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      دسترسی ارسال پست فعال
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Post Scheduler Table */}
      <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              پنل مدیریت زمان‌بندی و صف انتشار (Scheduler)
            </h3>
            <p className="text-xs text-slate-400">
              برنامه‌ریزی دقیق انتشار پست‌ها با رعایت فواصل زمانی و بررسی نهایی کپی‌رایت
            </p>
          </div>
          <button
            onClick={() => setIsCreatingPost(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" />
            ثبت پست زمان‌بندی جدید
          </button>
        </div>

        {posts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            هنوز هیچ پستی در صف زمان‌بندی قرار ندارد.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="border-b border-slate-800 text-slate-400 font-medium">
                <tr>
                  <th className="py-3 px-4">عنوان پست</th>
                  <th className="py-3 px-4">کانال مقصد</th>
                  <th className="py-3 px-4">زمان برنامه‌ریزی</th>
                  <th className="py-3 px-4">نوع رسانه</th>
                  <th className="py-3 px-4">ریسک کپی‌رایت</th>
                  <th className="py-3 px-4">وضعیت</th>
                  <th className="py-3 px-4 text-left">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {posts.map((post) => {
                  const destChannel = channels.find((c) => c.id === post.destinationChannelIds[0]);
                  return (
                    <tr key={post.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-4 font-medium text-white max-w-xs truncate">
                        {post.title}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 dir-ltr text-right">
                        {destChannel ? destChannel.username : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-400">
                        {new Date(post.scheduledAt).toLocaleTimeString('fa-IR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        -{' '}
                        {new Date(post.scheduledAt).toLocaleDateString('fa-IR')}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px]">
                          {post.mediaType === 'photo'
                            ? '🖼 عکس دار'
                            : post.mediaType === 'video'
                            ? '🎥 ویدیو'
                            : post.mediaType === 'mixed'
                            ? '🎙 چندرسانه‌ای'
                            : '📄 متنی'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            post.plagiarismRiskScore < 15
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {post.plagiarismRiskScore}% (ایمن)
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                            post.status === 'published'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : post.status === 'scheduled'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {post.status === 'published'
                            ? 'منتشر شده'
                            : post.status === 'scheduled'
                            ? 'زمان‌بندی‌شده'
                            : 'پیش‌نویس'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-left">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleSendDirect(post)}
                            disabled={isSendingDirect}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-[11px] font-medium transition flex items-center gap-1"
                            title="ارسال فوری به تلگرام"
                          >
                            <Send className="w-3 h-3" />
                            ارسال آنی
                          </button>
                          <button
                            onClick={async () => {
                              await api.deletePost(post.id);
                              onRefresh();
                            }}
                            className="text-slate-500 hover:text-red-400 p-1 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Add Channel */}
      {isAddingChannel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4">
            <h3 className="font-bold text-white text-base">
              افزودن کانال {newChanType === 'source' ? 'مبدأ (سورس)' : 'مقصد (انتشار)'}
            </h3>
            <form onSubmit={handleAddChannel} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">شناسه یا یوزرنیم کانال تلگرام:</label>
                <input
                  type="text"
                  value={newChanUsername}
                  onChange={(e) => setNewChanUsername(e.target.value)}
                  placeholder="@Channel_Username"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white dir-ltr font-mono focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">عنوان نمایشی کانال:</label>
                <input
                  type="text"
                  value={newChanTitle}
                  onChange={(e) => setNewChanTitle(e.target.value)}
                  placeholder="مثال: کانال اخبار دنیای تکنولوژی"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              {newChanType === 'source' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">کلمات کلیدی فیلتر (جداشده با کاما):</label>
                  <input
                    type="text"
                    value={newChanKeywords}
                    onChange={(e) => setNewChanKeywords(e.target.value)}
                    placeholder="هوش مصنوعی, تحلیل, استارتاپ"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddingChannel(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition"
                >
                  افزودن کانال
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Post */}
      {isCreatingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4">
            <h3 className="font-bold text-white text-base">ثبت پست جدید در صف زمان‌بندی</h3>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">عنوان پست:</label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="عنوان خلاصه پست..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">کانال مقصد:</label>
                <select
                  value={selectedDestId}
                  onChange={(e) => setSelectedDestId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none"
                >
                  {destinationChannels.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">متن کامل پست تلگرام:</label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={5}
                  placeholder="متن پست با فرمت‌بندی، هشتگ‌ها و ایموجی..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none leading-relaxed"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingPost(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs hover:bg-slate-700 transition"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-500 transition"
                >
                  افزودن به تقویم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
