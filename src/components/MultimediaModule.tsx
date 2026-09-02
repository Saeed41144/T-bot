import React, { useState } from 'react';
import {
  Sparkles,
  Image as ImageIcon,
  Video,
  Mic,
  Play,
  Pause,
  Send,
  Calendar,
  Layers,
  CheckCircle2,
  RefreshCw,
  Eye,
  Sliders,
  Share2,
} from 'lucide-react';
import { Channel } from '../types';
import { api } from '../services/api';

interface Props {
  destinationChannels: Channel[];
  onRefresh: () => void;
}

export const MultimediaModule: React.FC<Props> = ({ destinationChannels, onRefresh }) => {
  const [activeMediaTab, setActiveMediaTab] = useState<'image' | 'video' | 'audio'>('image');

  // Generation parameters
  const [imagePrompt, setImagePrompt] = useState('یک ربات آینده‌نگر با نورهای نئونی در حال کار با تلگرام، کیفیت بالا');
  const [imageProvider, setImageProvider] = useState('DALL-E 3');
  const [imageStyle, setImageStyle] = useState('cinematic');

  const [videoPrompt, setVideoPrompt] = useState('پرواز دوربین در یک شهر دیجیتال با تم هوش مصنوعی و شبکه عصبی');
  const [videoProvider, setVideoProvider] = useState('Runway Gen-3');

  const [audioPrompt, setAudioPrompt] = useState('پادکست کوتاه تلگرامی: درود به همراهان گرامی کانال، امروز با بررسی آخرین تحولات کلود در خدمت شما هستیم...');
  const [voiceProvider, setVoiceProvider] = useState('ElevenLabs');
  const [voiceActor, setVoiceActor] = useState('آرش (فارسی طبیعی و فاخر)');

  const [isGenerating, setIsGenerating] = useState(false);
  const [genNotice, setGenNotice] = useState<string | null>(null);

  // Generated Assets
  const [selectedImage, setSelectedImage] = useState<string>(
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80'
  );
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedAudio, setSelectedAudio] = useState<string | null>(
    'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg'
  );

  // Composer States
  const [postCaption, setPostCaption] = useState(`🔥 پست جدید کانال

متن توضیحات و محتوای چندرسانه‌ای را در این کادر بازنویسی یا تکمیل نمایید.

#هوش_مصنوعی #فناوری #پست_جدید`);
  const [selectedDestId, setSelectedDestId] = useState(destinationChannels[0]?.id || '');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElem, setAudioElem] = useState<HTMLAudioElement | null>(null);

  const [isSending, setIsSending] = useState(false);
  const [sentSuccessNotice, setSentSuccessNotice] = useState<string | null>(null);

  const handleGenerateMedia = async () => {
    setIsGenerating(true);
    setGenNotice(null);
    try {
      const type = activeMediaTab;
      const prompt = type === 'image' ? imagePrompt : type === 'video' ? videoPrompt : audioPrompt;
      const provider = type === 'image' ? imageProvider : type === 'video' ? videoProvider : voiceProvider;

      const res = await api.generateMedia({
        type,
        prompt,
        provider,
        style: imageStyle,
        voice: voiceActor,
      });

      setGenNotice(
        `✅ تسک تولید ${type === 'image' ? 'تصویر' : type === 'video' ? 'ویدیو' : 'صدا'} به صف کارهای غیرهمزمان ارسال شد. (هزینه تخمینی: $${res.estimatedCostUsd} / ${res.estimatedCostToman.toLocaleString('fa-IR')} تومان)`
      );

      // Simulate completion for preview
      if (type === 'image') {
        setSelectedImage('https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1000&auto=format&fit=crop&q=80');
      } else if (type === 'video') {
        setSelectedVideo('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4');
      } else {
        setSelectedAudio('https://actions.google.com/sounds/v1/science_fiction/scifi_hum.ogg');
      }

      onRefresh();
    } catch {
      setGenNotice('خطا در فراخوانی درگاه تولید رسانه.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleAudio = () => {
    if (!selectedAudio) return;
    if (isPlayingAudio) {
      audioElem?.pause();
      setIsPlayingAudio(false);
    } else {
      const audio = audioElem || new Audio(selectedAudio);
      audio.onended = () => setIsPlayingAudio(false);
      audio.play().catch(() => {});
      setAudioElem(audio);
      setIsPlayingAudio(true);
    }
  };

  const handlePublishPost = async () => {
    setIsSending(true);
    setSentSuccessNotice(null);
    try {
      const res = await api.sendPostDirectly({
        channelId: selectedDestId,
        postTitle: 'پست ترکیبی چندرسانه‌ای',
        text: postCaption,
        mediaUrl: selectedImage,
        mediaType: 'mixed',
      });
      setSentSuccessNotice(`✅ پست چندرسانه‌ای با موفقیت در کانال منتشر شد!`);
      onRefresh();
      setTimeout(() => setSentSuccessNotice(null), 5000);
    } catch {
      setSentSuccessNotice('خطا در ارسال پست به تلگرام.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSchedulePost = async () => {
    await api.createPost({
      title: 'پست چندرسانه‌ای (متن + مدیا + وویس)',
      content: postCaption,
      mediaType: 'mixed',
      mediaUrl: selectedImage,
      audioUrl: selectedAudio || undefined,
      destinationChannelIds: [selectedDestId],
      scheduledAt: new Date(Date.now() + 3600000 * 3).toISOString(),
      status: 'scheduled',
      plagiarismRiskScore: 6,
      tags: ['چندرسانه‌ای', 'پادکست', 'هوش_مصنوعی'],
    });
    setSentSuccessNotice('✅ پست در صف انتشار تقویم زمان‌بندی ذخیره شد.');
    onRefresh();
    setTimeout(() => setSentSuccessNotice(null), 5000);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-rose-950/30 border border-slate-800 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-rose-600/20 text-rose-400 flex items-center justify-center border border-rose-500/30 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">استودیوی تولید چندرسانه‌ای و ترکیب پست نهایی</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  متن + تصویر + ویدیو + وویس
                </span>
              </div>
              <p className="text-xs text-slate-400">
                یکپارچه‌سازی سرویس‌های DALL·E، Midjourney، Runway، Sora و ElevenLabs در قالب یک پست فوق‌حرفه‌ای تلگرامی
              </p>
            </div>
          </div>
        </div>
      </div>

      {genNotice && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{genNotice}</span>
        </div>
      )}

      {sentSuccessNotice && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2 animate-pulse">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{sentSuccessNotice}</span>
        </div>
      )}

      {/* Grid: Media Generator Studio (Left 6 cols) vs Telegram Live Post Preview (Right 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Generator Tools */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5">
          {/* Sub-tabs: Image, Video, Voice */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <button
              onClick={() => setActiveMediaTab('image')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
                activeMediaTab === 'image'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
              تولید تصویر (Image)
            </button>
            <button
              onClick={() => setActiveMediaTab('video')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
                activeMediaTab === 'video'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              تولید ویدیو (Video)
            </button>
            <button
              onClick={() => setActiveMediaTab('audio')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-semibold transition ${
                activeMediaTab === 'audio'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Mic className="w-4 h-4" />
              صدا و گفتار (Voice/TTS)
            </button>
          </div>

          {/* Form fields based on tab */}
          {activeMediaTab === 'image' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">ارائه‌دهنده سرویس تصویر:</label>
                  <select
                    value={imageProvider}
                    onChange={(e) => setImageProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="DALL-E 3">OpenAI DALL·E 3 (کیفیت HD)</option>
                    <option value="Midjourney API">Midjourney v6.1 (سبک هنری)</option>
                    <option value="Stable Diffusion XL">Stable Diffusion XL (سریع)</option>
                    <option value="Google Gemini Image">Google Gemini Flash Image</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">سبک بصری (Style):</label>
                  <select
                    value={imageStyle}
                    onChange={(e) => setImageStyle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="cinematic">سینمایی و واقع‌گرایانه (Cinematic)</option>
                    <option value="digital-art">دیجیتال آرت و مفهومی (Digital Art)</option>
                    <option value="minimalist">مینیمال و تخت تلگرامی (Minimalist)</option>
                    <option value="3d-render">رندر سه‌بعدی و مدرن (3D Render)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">پرامپت توصیفی تصویر کاور:</label>
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-blue-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>هزینه تخمینی: <strong className="text-amber-300 font-mono">$0.040</strong> (۴,۰۰۰ تومان)</span>
                <button
                  onClick={handleGenerateMedia}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  تولید تصویر با {imageProvider}
                </button>
              </div>
            </div>
          )}

          {activeMediaTab === 'video' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">موتور هوش مصنوعی ویدیو:</label>
                <select
                  value={videoProvider}
                  onChange={(e) => setVideoProvider(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                >
                  <option value="Runway Gen-3">Runway Gen-3 Alpha (کیفیت استودیویی)</option>
                  <option value="Pika Labs">Pika 2.0 (انیمیشن پویا)</option>
                  <option value="Sora API">OpenAI Sora API (فوق‌العاده طبیعی)</option>
                  <option value="Google Veo">Google Veo (۷۲۰p / ۱۰۸۰p)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">سناریو و پرامپت موشن ویدیو (۵ ثانیه):</label>
                <textarea
                  value={videoPrompt}
                  onChange={(e) => setVideoPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-purple-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>هزینه تخمینی ویدیو: <strong className="text-amber-300 font-mono">$0.150</strong> (۱۵,۰۰۰ تومان)</span>
                <button
                  onClick={handleGenerateMedia}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-purple-600/20 disabled:opacity-50"
                >
                  {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Video className="w-3.5 h-3.5" />}
                  تولید ویدیو و ارسال به صف
                </button>
              </div>
            </div>
          )}

          {activeMediaTab === 'audio' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">موتور سنتز صدا (TTS Engine):</label>
                  <select
                    value={voiceProvider}
                    onChange={(e) => setVoiceProvider(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="ElevenLabs">ElevenLabs (چندزبانه فوق‌طبیعی)</option>
                    <option value="OpenAI TTS">OpenAI TTS (مدل Alloy / Nova)</option>
                    <option value="Google Cloud TTS">Google WaveNet (فارسی استاندارد)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">گوینده (Voice Character):</label>
                  <select
                    value={voiceActor}
                    onChange={(e) => setVoiceActor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none"
                  >
                    <option value="آرش (فارسی طبیعی و فاخر)">آرش (فارسی رسا، خبری)</option>
                    <option value="سارا (لحن صمیمی و پادکستی)">سارا (لحن صمیمی، پادکستی)</option>
                    <option value="مهران (حرفه‌ای و تبلیغاتی)">مهران (انرژیک، تبلیغاتی)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">متن نریشن صوتی (Audio Script):</label>
                <textarea
                  value={audioPrompt}
                  onChange={(e) => setAudioPrompt(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                <span>هزینه تخمینی: <strong className="text-amber-300 font-mono">$0.015</strong> (۱,۵۰۰ تومان)</span>
                <button
                  onClick={handleGenerateMedia}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 disabled:opacity-50"
                >
                  {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Mic className="w-3.5 h-3.5" />}
                  تولید وویس با {voiceProvider}
                </button>
              </div>
            </div>
          )}

          {/* Caption Editor */}
          <div className="pt-2 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-bold text-slate-200">کپشن و متن اصلی پست تلگرام:</label>
            <textarea
              value={postCaption}
              onChange={(e) => setPostCaption(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:border-blue-500 focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Right: Live Telegram Post Preview (Interactive card) */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-sky-400" />
              <h3 className="font-bold text-white text-base">پیش‌نمایش زنده در تلگرام (Telegram Live Preview)</h3>
            </div>
            <span className="text-xs text-slate-400 font-mono">طرح‌بندی استاندارد دسکتاپ/موبایل</span>
          </div>

          {/* Telegram Bubble Mockup */}
          <div className="max-w-md mx-auto rounded-2xl bg-[#1e2329] border border-slate-700/80 shadow-2xl overflow-hidden text-slate-100">
            {/* Telegram Channel Info Bar */}
            <div className="px-4 py-2.5 bg-[#252a32] border-b border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-[10px]">
                  TM
                </div>
                <span className="font-semibold text-slate-200">
                  {destinationChannels[0]?.title || 'کانال مقصد'}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 dir-ltr">
                {destinationChannels[0]?.username || '@Channel'}
              </span>
            </div>

            {/* Media Area (Photo or Video) */}
            {selectedVideo ? (
              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video src={selectedVideo} controls className="w-full h-full object-cover" />
              </div>
            ) : selectedImage ? (
              <div className="relative aspect-video bg-slate-900 overflow-hidden group">
                <img
                  src={selectedImage}
                  alt="Telegram post cover"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[10px] text-white">
                  کاور هوش مصنوعی HD
                </div>
              </div>
            ) : null}

            {/* Voice Clip Bar (Telegram Style Audio Player) */}
            {selectedAudio && (
              <div className="mx-3 mt-3 p-2.5 rounded-xl bg-[#2a303b] border border-slate-700 flex items-center gap-3">
                <button
                  onClick={handleToggleAudio}
                  className="w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-400 text-white flex items-center justify-center transition shrink-0"
                >
                  {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-medium text-slate-200">پادکست صوتی کانال (وویس اختصاصی)</span>
                    <span className="font-mono text-slate-400">0:45</span>
                  </div>
                  {/* Waveform graphic */}
                  <div className="flex items-center gap-0.5 h-3">
                    {[40, 70, 90, 30, 60, 100, 85, 45, 65, 80, 50, 75, 95, 35, 60, 85, 40, 70, 90, 50].map(
                      (h, i) => (
                        <div
                          key={i}
                          className={`w-1 rounded-full ${
                            isPlayingAudio ? 'bg-blue-400 animate-pulse' : 'bg-slate-500'
                          }`}
                          style={{ height: `${h}%` }}
                        />
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Post Text Caption */}
            <div className="p-4 text-xs text-slate-200 whitespace-pre-line leading-relaxed">
              {postCaption}
            </div>

            {/* Post Meta & Views Footer */}
            <div className="px-4 py-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                ۱.۲k بازدید
              </span>
              <span>هم‌اکنون</span>
            </div>
          </div>

          {/* Action Buttons: Publish Directly or Schedule */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs text-slate-400 shrink-0">مقصد:</label>
              <select
                value={selectedDestId}
                onChange={(e) => setSelectedDestId(e.target.value)}
                className="w-full sm:w-auto px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none"
              >
                {destinationChannels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.username})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleSchedulePost}
                className="flex-1 sm:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <Calendar className="w-3.5 h-3.5" />
                افزودن به زمان‌بندی
              </button>

              <button
                onClick={handlePublishPost}
                disabled={isSending}
                className="flex-1 sm:flex-none px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
              >
                {isSending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                انتشار فوری در تلگرام
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
