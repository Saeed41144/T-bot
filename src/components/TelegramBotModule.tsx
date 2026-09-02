import React, { useState } from 'react';
import { TelegramBotConfig, Channel, ScheduledPost } from '../types';
import { api } from '../services/api';
import {
  Send,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Radio,
  Share2,
  CheckCircle2,
  Bot,
  Hash,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Shield,
  Loader2,
} from 'lucide-react';

interface TelegramBotModuleProps {
  botConfig: TelegramBotConfig | null;
  channels: Channel[];
  posts: ScheduledPost[];
  onRefresh: () => void;
}

export const TelegramBotModule: React.FC<TelegramBotModuleProps> = ({
  botConfig,
  channels,
  posts,
  onRefresh,
}) => {
  // Bot Config Form
  const [tokenInput, setTokenInput] = useState(botConfig?.botToken || '');
  const [usernameInput, setUsernameInput] = useState(botConfig?.botUsername || '');
  const [isUpdatingBot, setIsUpdatingBot] = useState(false);
  const [botUpdateFeedback, setBotUpdateFeedback] = useState<string | null>(null);

  // New Channel Form
  const [newChanUsername, setNewChanUsername] = useState('');
  const [newChanTitle, setNewChanTitle] = useState('');
  const [newChanType, setNewChanType] = useState<'source' | 'destination'>('source');
  const [isAddingChannel, setIsAddingChannel] = useState(false);

  // Direct Publish Form
  const [directPostText, setDirectPostText] = useState('');
  const [directPostTarget, setDirectPostTarget] = useState('');
  const [isSendingPost, setIsSendingPost] = useState(false);
  const [postFeedback, setPostFeedback] = useState<string | null>(null);

  const handleUpdateBot = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingBot(true);
    setBotUpdateFeedback(null);
    try {
      const res = await api.updateBotConfig({
        botToken: tokenInput.trim(),
        botUsername: usernameInput.trim(),
      });
      setBotUpdateFeedback(
        res.verified
          ? 'اتصال رسمی به ربات تلگرام با موفقیت تایید شد.'
          : 'اطلاعات ربات به‌روزرسانی شد.'
      );
      setTimeout(() => setBotUpdateFeedback(null), 4000);
      onRefresh();
    } catch (err) {
      console.error('Update bot error:', err);
      setBotUpdateFeedback('خطا در ذخیره اطلاعات ربات.');
    } finally {
      setIsUpdatingBot(false);
    }
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChanUsername.trim()) return;
    setIsAddingChannel(true);
    try {
      await api.addChannel({
        username: newChanUsername.trim(),
        title: newChanTitle.trim() || newChanUsername.trim(),
        type: newChanType,
      });
      setNewChanUsername('');
      setNewChanTitle('');
      onRefresh();
    } catch (err) {
      console.error('Add channel error:', err);
    } finally {
      setIsAddingChannel(false);
    }
  };

  const handleDeleteChannel = async (id: string) => {
    if (window.confirm('آیا از حذف این کانال اطمینان دارید؟')) {
      await api.deleteChannel(id);
      onRefresh();
    }
  };

  const handleSendDirectPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directPostText.trim()) return;
    setIsSendingPost(true);
    setPostFeedback(null);
    try {
      const res = await api.sendPostDirectly({
        text: directPostText.trim(),
        channelId: directPostTarget || undefined,
      });
      setPostFeedback(res.message || 'پست ارسال شد.');
      setDirectPostText('');
      setTimeout(() => setPostFeedback(null), 4000);
      onRefresh();
    } catch (err) {
      console.error('Send post error:', err);
      setPostFeedback('خطا در ارسال پست.');
    } finally {
      setIsSendingPost(false);
    }
  };

  const sourceChannels = channels.filter((c) => c.type === 'source');
  const destinationChannels = channels.filter((c) => c.type === 'destination');

  return (
    <div className="space-y-6">
      {/* Bot Connection Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-sm text-white">
                پیکربندی توکن و وضعیت اتصال ربات تلگرام (Telegram Bot API)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                ربات به عنوان ادمین کانال‌های مقصد برای انتشار مستقیم پست‌ها عمل می‌کند.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                botConfig?.isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-xs font-mono text-slate-300">
              {botConfig?.isConnected ? 'ONLINE / CONNECTED' : 'OFFLINE'}
            </span>
          </div>
        </div>

        <form onSubmit={handleUpdateBot} className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div className="md:col-span-2">
            <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
              توکن ربات تلگرام (Bot Token از BotFather@):
            </label>
            <input
              type="password"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="مثال: 123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-200 outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-300 mb-1 block">
              یوزرنیم ربات:
            </label>
            <input
              type="text"
              value={usernameInput}
              onChange={(e) => setUsernameInput(e.target.value)}
              placeholder="@MyAwesomeBot"
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none"
            />
          </div>
          <div className="md:col-span-3 flex items-center justify-between mt-1">
            <span className="text-[11px] text-slate-400">
              در صورت خالی بودن توکن، سیستم با شبیه‌ساز واقعی پیام‌ها را در صف و دیتابیس ثبت می‌کند.
            </span>
            <button
              type="submit"
              disabled={isUpdatingBot}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2"
            >
              {isUpdatingBot ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>ذخیره و بررسی اتصال</span>
            </button>
          </div>
        </form>

        {botUpdateFeedback && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>{botUpdateFeedback}</span>
          </div>
        )}
      </div>

      {/* Channel Management: Source (رصد) and Destination (مقصد) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Channel Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Plus className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-xs text-white">افزودن کانال جدید</h3>
          </div>

          <form onSubmit={handleAddChannel} className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                نوع کانال:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewChanType('source')}
                  className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    newChanType === 'source'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  📡 کانال مبدأ (برای رصد و فکت‌چک)
                </button>
                <button
                  type="button"
                  onClick={() => setNewChanType('destination')}
                  className={`p-2 rounded-xl text-xs font-medium border text-center transition-all ${
                    newChanType === 'destination'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  🎯 کانال مقصد (برای انتشار)
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                آیدی کانال تلگرام:
              </label>
              <input
                type="text"
                value={newChanUsername}
                onChange={(e) => setNewChanUsername(e.target.value)}
                placeholder="@my_channel"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                نام نمایشی کانال:
              </label>
              <input
                type="text"
                value={newChanTitle}
                onChange={(e) => setNewChanTitle(e.target.value)}
                placeholder="اخبار فناوری و استارتاپ"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isAddingChannel || !newChanUsername.trim()}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl transition-all"
            >
              افزودن به لیست کانال‌ها
            </button>
          </form>
        </div>

        {/* Channels List */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-xs text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              <span>کانال‌های متصل ({channels.length} کانال)</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              {sourceChannels.length} مبدأ برای رصد | {destinationChannels.length} مقصد برای انتشار
            </span>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {channels.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                هنوز کانالی ثبت نشده است. می‌توانید یک کانال خبری برای رصد یا کانال خود را برای انتشار اضافه کنید.
              </div>
            ) : (
              channels.map((chan) => (
                <div
                  key={chan.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        chan.type === 'destination'
                          ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}
                    >
                      {chan.type === 'destination' ? 'مقصد' : 'مبدأ'}
                    </div>
                    <div>
                      <div className="font-semibold text-xs text-slate-100 flex items-center gap-2">
                        <span>{chan.title}</span>
                        <span className="font-mono text-[11px] text-slate-400">
                          {chan.username}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        اعضا: {chan.membersCount.toLocaleString('fa-IR')} نفر | وضعیت: فعال
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteChannel(chan.id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="حذف کانال"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Direct Publisher & Scheduled Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct Send */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
            <Send className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-xs text-white">ارسال سریع پیام به کانال مقصد</h3>
          </div>

          <form onSubmit={handleSendDirectPost} className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                انتخاب کانال مقصد:
              </label>
              <select
                value={directPostTarget}
                onChange={(e) => setDirectPostTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
              >
                <option value="">پیش‌فرض سیستم (اولین کانال مقصد)</option>
                {destinationChannels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.username})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                متن پیام:
              </label>
              <textarea
                value={directPostText}
                onChange={(e) => setDirectPostText(e.target.value)}
                rows={4}
                placeholder="متن پست تلگرامی خود را بنویسید..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none"
              />
            </div>

            {postFeedback && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs border border-emerald-500/20">
                {postFeedback}
              </div>
            )}

            <button
              type="submit"
              disabled={isSendingPost || !directPostText.trim()}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2"
            >
              {isSendingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>ارسال آنی به تلگرام</span>
            </button>
          </form>
        </div>

        {/* Scheduled / Draft Posts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-xs text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>پست‌های زمان‌بندی‌شده و پیش‌نویس‌های شورا ({posts.length})</span>
            </h3>
          </div>

          <div className="space-y-2.5 max-h-80 overflow-y-auto">
            {posts.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                هیچ پست پیش‌نویسی وجود ندارد. می‌توانید از بخش شورا یا پالایش محتوا پست جدید ایجاد کنید.
              </div>
            ) : (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs text-slate-200 truncate max-w-[240px]">
                      {post.title}
                    </div>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-md border font-mono ${
                        post.status === 'published'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : post.status === 'scheduled'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {post.status === 'published' ? 'منتشر شده' : 'پیش‌نویس / آماده'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-900">
                    <span>
                      {post.approvedByCouncil ? '✓ تایید شده توسط شورا' : 'تولید عادی'}
                    </span>
                    <button
                      onClick={() => api.deletePost(post.id).then(onRefresh)}
                      className="text-slate-500 hover:text-red-400 transition-colors"
                    >
                      حذف
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
