import React, { useState } from 'react';
import { Channel } from '../types';
import { api } from '../services/api';
import {
  Sparkles,
  Image as ImageIcon,
  Volume2,
  Video,
  Send,
  Loader2,
  CheckCircle2,
  Play,
  Layers,
  Wand2,
} from 'lucide-react';

interface MultimediaModuleProps {
  destinationChannels: Channel[];
  onRefresh: () => void;
}

export const MultimediaModule: React.FC<MultimediaModuleProps> = ({
  destinationChannels,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'image' | 'audio' | 'video'>('image');
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('سینمایی و واقع‌گرایانه (Cinematic 4K)');
  const [voice, setVoice] = useState('گوینده رسمی خبری تلگرام (مرد، بم و رسا)');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMedia, setGeneratedMedia] = useState<{
    type: 'image' | 'audio' | 'video';
    url: string;
    caption: string;
  } | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const res = await api.generateMedia({
        type: activeTab,
        prompt: prompt.trim(),
        style,
        voice,
      });

      // Simulate completion in few seconds
      setTimeout(() => {
        let resultUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80';
        if (activeTab === 'audio') {
          resultUrl = 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum.ogg';
        } else if (activeTab === 'video') {
          resultUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
        }

        setGeneratedMedia({
          type: activeTab,
          url: resultUrl,
          caption: prompt.trim(),
        });
        setIsGenerating(false);
        onRefresh();
      }, 3000);
    } catch (err) {
      console.error('Media generation error:', err);
      setIsGenerating(false);
    }
  };

  const handleSendToDraft = async () => {
    if (!generatedMedia) return;
    try {
      await api.createPost({
        title: `پست چندرسانه‌ای: ${generatedMedia.caption.slice(0, 35)}...`,
        content: `🎨 تولید اختصاصی استودیو چندرسانه‌ای TeleMasters\n\n📌 موضوع: ${generatedMedia.caption}\n\n#چندرسانه‌ای #هوش_مصنوعی`,
        mediaType: generatedMedia.type === 'image' ? 'photo' : generatedMedia.type === 'video' ? 'video' : 'audio',
        mediaUrl: generatedMedia.url,
        audioUrl: generatedMedia.type === 'audio' ? generatedMedia.url : undefined,
        destinationChannelIds: destinationChannels.map((c) => c.id),
        status: 'draft',
      });
      alert('فایل چندرسانه‌ای با موفقیت به صف پیش‌نویس‌های پست تلگرام اضافه شد.');
      onRefresh();
    } catch (err) {
      console.error('Error adding media to post:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
          <Sparkles className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">
            استودیو چندرسانه‌ای و موتور هوش مصنوعی نسل جدید (DALL·E, Midjourney, ElevenLabs, Runway)
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            تولید کاورهای گرافیکی 4K با هوش مصنوعی، ساخت پادکست‌های صوتی فارسی تلگرام با شبیه‌ساز صدای گوینده، و تولید کلیپ‌های ویدیویی کوتاه برای انتشار همراه متن خبر.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Studio Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          {/* Mode Tabs */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('image')}
              className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'image'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>پوستر و تصویر</span>
            </button>
            <button
              onClick={() => setActiveTab('audio')}
              className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'audio'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>پادکست و صوت</span>
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`py-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-all ${
                activeTab === 'video'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>ویدیو و موشن</span>
            </button>
          </div>

          <form onSubmit={handleGenerate} className="space-y-3">
            <div>
              <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                توصیف پرامپت (Prompt) برای هوش مصنوعی:
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
                placeholder={
                  activeTab === 'image'
                    ? 'مثلاً: پوستر مینیمال با رنگ‌های نئونی درباره هوش مصنوعی کوانتومی و سرورهای فوق پیشرفته...'
                    : activeTab === 'audio'
                    ? 'متن یا سناریوی پادکست خبری برای گویندگی با صدای رسا و باکیفیت...'
                    : 'کلیپ گرافیکی کوتاه با افکت‌های نوری و دوربین سینمایی...'
                }
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-purple-500"
              />
            </div>

            {activeTab === 'image' && (
              <div>
                <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                  سبک هنری و استایل:
                </label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  <option value="سینمایی و واقع‌گرایانه (Cinematic 4K)">سینمایی و واقع‌گرایانه (Cinematic 4K)</option>
                  <option value="طراحی گرافیکی تلگرامی (Modern Vector)">گرافیک خبری و اینفوگرافیک</option>
                  <option value="سایبرپانک و دیجیتال آرت (Cyberpunk Digital Art)">سایبرپانک و هنر دیجیتال</option>
                  <option value="عکاسی خبری ژورنالیستی (Documentary Editorial)">عکاسی مستند و خبری</option>
                </select>
              </div>
            )}

            {activeTab === 'audio' && (
              <div>
                <label className="text-[11px] text-slate-300 font-semibold mb-1 block">
                  لحن و کاراکتر گوینده:
                </label>
                <select
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                >
                  <option value="گوینده رسمی خبری تلگرام (مرد، بم و رسا)">گوینده رسمی خبری (مرد، بم و رسا)</option>
                  <option value="گوینده پادکست تحلیلی (زن، آرام و روان)">گوینده پادکست تحلیلی (زن، آرام و روان)</option>
                  <option value="گزارشگر فوری و مهیج (Breaking News)">گزارشگر فوری و مهیج (Breaking News)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isGenerating || !prompt.trim()}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              <span>شروع پردازش در استودیو چندرسانه‌ای</span>
            </button>
          </form>
        </div>

        {/* Media Preview & Send */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-xs text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>پیش‌نمایش خروجی رندر شده</span>
              </h3>
            </div>

            <div className="mt-4 flex items-center justify-center min-h-[260px] bg-slate-950 rounded-xl border border-slate-800 p-4">
              {isGenerating ? (
                <div className="flex flex-col items-center gap-2 text-purple-400 text-xs">
                  <Loader2 className="w-7 h-7 animate-spin" />
                  <span>در حال رندر محتوای چندرسانه‌ای با کارت‌های گرافیکی ابری...</span>
                </div>
              ) : generatedMedia ? (
                <div className="w-full space-y-3">
                  {generatedMedia.type === 'image' && (
                    <img
                      src={generatedMedia.url}
                      alt="رندر استودیو"
                      className="w-full max-h-64 object-cover rounded-lg border border-slate-800"
                    />
                  )}
                  {generatedMedia.type === 'audio' && (
                    <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                      <div className="text-xs text-purple-300 font-semibold flex items-center gap-2">
                        <Volume2 className="w-4 h-4" />
                        <span>پادکست صوتی گوینده هوش مصنوعی (ElevenLabs)</span>
                      </div>
                      <audio controls src={generatedMedia.url} className="w-full h-8" />
                    </div>
                  )}
                  {generatedMedia.type === 'video' && (
                    <video
                      controls
                      src={generatedMedia.url}
                      className="w-full max-h-64 rounded-lg border border-slate-800"
                    />
                  )}
                  <p className="text-[11px] text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                    پرامپت: {generatedMedia.caption}
                  </p>
                </div>
              ) : (
                <div className="text-center text-slate-500 text-xs">
                  هیچ فایلی هنوز رندر نشده است. فرم روبه‌رو را تکمیل کنید.
                </div>
              )}
            </div>
          </div>

          {generatedMedia && (
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={handleSendToDraft}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ضمیمه به پست تلگرام و ارسال به پیش‌نویس</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
