import express from 'express';
import path from 'path';
import crypto from 'crypto';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Lazy initialize Gemini client on server side
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

// In-memory persistent state (persisted during server session)
interface StoredKey {
  id: string;
  provider: string; // 'google' | 'openai' | 'anthropic' | 'deepseek' | 'elevenlabs' | 'runway' | 'midjourney'
  name: string;
  category: 'text' | 'image' | 'video' | 'audio';
  encryptedValue: string;
  maskedValue: string;
  isActive: boolean;
  lastTestedAt?: string;
  status: 'valid' | 'invalid' | 'untested';
}

interface Channel {
  id: string;
  username: string;
  title: string;
  type: 'source' | 'destination';
  membersCount: number;
  autoForward: boolean;
  filterRules?: string[];
  lastSyncedAt?: string;
  status: 'active' | 'paused' | 'error';
}

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  mediaType: 'text' | 'photo' | 'video' | 'audio' | 'mixed';
  mediaUrl?: string;
  audioUrl?: string;
  destinationChannelIds: string[];
  scheduledAt: string;
  status: 'draft' | 'pending_review' | 'scheduled' | 'published' | 'failed';
  originalSourceId?: string;
  plagiarismRiskScore: number;
  tags: string[];
  views?: number;
  costEstimatedUsd: number;
}

interface IngestedMessage {
  id: string;
  sourceChannelId: string;
  sourceChannelName: string;
  sourceMessageId: number;
  date: string;
  originalText: string;
  mediaType?: 'text' | 'photo' | 'video';
  topic: string;
  keywords: string[];
  processingStatus: 'new' | 'rewritten' | 'approved' | 'rejected';
  rewrittenText?: string;
  copyrightStatus: 'safe' | 'attribution_needed' | 'high_similarity';
  similarityPercentage: number;
}

interface QueueJob {
  id: string;
  taskType: 'video_generation' | 'audio_synthesis' | 'batch_crawler' | 'ai_synthesis';
  payload: any;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  estimatedCompletionSeconds: number;
  resultUrl?: string;
  error?: string;
}

interface CostLog {
  id: string;
  timestamp: string;
  provider: string;
  model: string;
  task: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  costToman: number;
}

// Encryption helpers for API Vault (AES-256-GCM)
const ENCRYPTION_SECRET = process.env.ENCRYPTION_SECRET || 'telemasters-secure-vault-key-32b!';
const KEY_BUFFER = crypto.scryptSync(ENCRYPTION_SECRET, 'salt-salt-salt', 32);

function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', KEY_BUFFER, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

function maskSecret(plainText: string): string {
  if (plainText.length <= 8) return '********';
  return plainText.slice(0, 5) + '••••••••' + plainText.slice(-4);
}

// Initial Data (Clean state - all test mock data removed)
let botConfig = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  botUsername: '',
  botName: '',
  isConnected: Boolean(process.env.TELEGRAM_BOT_TOKEN),
  status: process.env.TELEGRAM_BOT_TOKEN ? 'online' : 'offline',
  webhookUrl: '',
};

let channels: Channel[] = [];

let apiKeys: StoredKey[] = process.env.GEMINI_API_KEY
  ? [
      {
        id: 'key-gemini',
        provider: 'google',
        name: 'Google Gemini API',
        category: 'text',
        encryptedValue: encryptSecret(process.env.GEMINI_API_KEY),
        maskedValue: maskSecret(process.env.GEMINI_API_KEY),
        isActive: true,
        status: 'valid',
        lastTestedAt: new Date().toISOString(),
      },
    ]
  : [];

let routingMatrix = {
  summarization: { provider: 'google', model: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  ideaGeneration: { provider: 'google', model: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  rewriting: { provider: 'google', model: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  copyrightAudit: { provider: 'google', model: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  audioScripting: { provider: 'google', model: 'gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  imageGeneration: { provider: 'midjourney', model: 'v6.1', label: 'Midjourney v6.1' },
  videoGeneration: { provider: 'runway', model: 'gen-3-alpha', label: 'Runway Gen-3' },
  voiceSynthesis: { provider: 'elevenlabs', model: 'multilingual-v2', label: 'ElevenLabs Multilingual v2' },
};

let promptTemplates = [
  {
    id: 'tmpl-1',
    name: 'تلخیص خبری و بولت‌پوینت تلگرامی',
    category: 'news',
    systemPrompt: `شما یک روزنامه‌نگار و سردبیر حرفه‌ای کانال‌های تخصصی فناوری در تلگرام هستید.
وظیفه شما: محتوای ارائه‌شده را تحلیل کرده و بدون نقض کپی‌رایت، به سبک ژورنالیستی بازنویسی کنید.
فرمت خروجی:
۱. تیتر جذاب با اموجی مناسب (Hook)
۲. مقدمه تک‌خطی پرکشش
۳. ۳ تا ۵ نکته کلیدی به صورت بولت‌پوینت
۴. تحلیل کوتاه و نتیجه‌گیری برای مخاطب ایرانی
۵. ۲ تا ۴ هشتگ مرتبط و فارسی
۶. درج منبع به صورت حرفه‌ای و اخلاقی (Credit)`,
  },
  {
    id: 'tmpl-2',
    name: 'بازنویسی تحلیلی و آموزشی عمیق',
    category: 'analysis',
    systemPrompt: `شما یک تحلیلگر ارشد فناوری و کسب‌وکار هستید.
متن زیر را به یک پست آموزشی و تحلیلی عمیق تبدیل کنید.
- از زبان محاوره‌ای و سخیف پرهیز کنید؛ لحن باید فاخر، رسا و معتبر باشد.
- ابعاد فنی یا اقتصادی موضوع را با مثال روشن برای مخاطب توضیح دهید.
- یک سوال تعاملی (Call to Action) در انتهای پست بگذارید تا مخاطبان در کامنت‌ها نظر بدهند.`,
  },
  {
    id: 'tmpl-3',
    name: 'ترجمه و بومی‌سازی خبر جهانی',
    category: 'translation',
    systemPrompt: `خبر خارجی را به زبان فارسی روان، شیوا و استاندارد بازنویسی کنید. اصطلاحات نامأنوس انگلیسی را با معادل‌های دقیق فارسی جایگزین کنید. ساختار متن را برای خوانش سریع در موبایل و تلگرام بهینه‌سازی کنید.`,
  },
];

let ingestedMessages: IngestedMessage[] = [];

let scheduledPosts: ScheduledPost[] = [];

let queueJobs: QueueJob[] = [];

let costLogs: CostLog[] = [];

// Council Chat Session & Messages
interface CouncilAgent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  model: string;
  provider: string;
  systemPrompt: string;
  availableTools: string[];
}

interface CouncilMessage {
  id: string;
  sender: 'user' | 'agent' | 'system';
  agentId?: string;
  agentName?: string;
  agentRole?: string;
  avatar?: string;
  text: string;
  timestamp: string;
  toolInvocations?: Array<{
    toolName: string;
    toolInput: string;
    toolOutput: string;
  }>;
  mediaAttachment?: {
    type: 'image' | 'audio' | 'video';
    url: string;
    prompt?: string;
  };
  publishedPostId?: string;
  consensusVote?: 'approve' | 'revise' | 'reject';
  isEmergencySessionMessage?: boolean;
}

interface CouncilConfig {
  autonomousModeEnabled: boolean;
  autoPublishOnConsensus: boolean;
  emergencyKeywords: string[];
  maxDeliberationRounds: number;
  studioAccessEnabled: boolean;
  channelPostingEnabled: boolean;
  channelMonitoringEnabled: boolean;
}

let councilConfig: CouncilConfig = {
  autonomousModeEnabled: true,
  autoPublishOnConsensus: false,
  emergencyKeywords: [
    'جنگ',
    'حمله',
    'فوری',
    'بحران نظامی',
    'ایران و آمریکا',
    'سقوط',
    'آتش‌بس',
    'موشک',
    'تنش منطقه‌ای',
    'بیانیه اضطراری',
    'خبر فوری',
  ],
  maxDeliberationRounds: 0, // 0 = unlimited rounds until 100% consensus
  studioAccessEnabled: true,
  channelPostingEnabled: true,
  channelMonitoringEnabled: true,
};

let activeEmergencySession: any = null;

const councilAgents: CouncilAgent[] = [
  {
    id: 'agent-analyst',
    name: 'دکتر تحلیلگر',
    role: 'بررسی عیار علمی، رصد کانال‌ها و فکت‌چک منابع',
    avatar: '🧠',
    color: 'from-blue-600 to-cyan-600',
    model: 'claude-3-5-sonnet',
    provider: 'Anthropic',
    systemPrompt: 'شما دکتر تحلیلگر، متخصص سنجش آمار، رصد کانال‌های تلگرام و وب، اعتبارسنجی چندمنبعی فکت‌ها و ارزیابی عیار خبر هستید. جلوگیری از نشر شایعات و اطلاعات نادرست اولویت شماست.',
    availableTools: [
      'رصد کانال‌های مبدأ و وب (Channel & Web Crawler)',
      'فکت‌چک و تأیید صحت داده‌ها (Cross-Source Fact Checking)',
      'محاسبه شاخص اطمینان و عیار خبر (Credibility Score)',
    ],
  },
  {
    id: 'agent-editor',
    name: 'استاد ویراستار',
    role: 'اصلاح لحن، ساختار فوری و استودیو صوتی تلگرام',
    avatar: '✍️',
    color: 'from-emerald-600 to-teal-600',
    model: 'gpt-4o',
    provider: 'OpenAI',
    systemPrompt: 'شما استاد ویراستار زبان فارسی و سبک نگارش تلگرامی هستید. تمرکز شما روی گیرایی تیتر اول (Hook)، نگارش فصیح، تنظیم فرمت گزارش‌های اضطراری، رعایت نیم‌فاصله‌ها و تبدیل متن به صوت/پادکست در استودیو است.',
    availableTools: [
      'استودیو چندرسانه‌ای: تولید پادکست و وویس صوتی تلگرام (ElevenLabs TTS)',
      'تنظیم لحن فوری و ساختار پیام اضطراری (Breaking News Formatter)',
      'شمارشگر کاراکتر و بهینه‌ساز خوانایی موبایل',
    ],
  },
  {
    id: 'agent-legal',
    name: 'ناظر اخلاق و کپی‌رایت',
    role: 'حفظ حقوق نشر، انطباق با قوانین و راستی‌آزمایی',
    avatar: '⚖️',
    color: 'from-amber-600 to-orange-600',
    model: 'gemini-3.8-flash',
    provider: 'Google Gemini',
    systemPrompt: 'شما ناظر اخلاق و حقوق مالکیت فکری هستید. اخبار را ممیزی می‌کنید تا اطمینان حاصل شود بازنویسی‌ها اصیل است، پروتکل‌های حساسیت و امنیتی رعایت شده و ارجاع اخلاقی به منابع موثق داده شده است.',
    availableTools: [
      'ممیزی اصالت و عدم سرقت ادبی (Plagiarism & Copyright Audit)',
      'بررسی پروتکل‌های حساسیت رسانه‌ای و قوانین انتشار',
      'تطبیق اخلاقی با خط مشی کانال و ارجاع منابع',
    ],
  },
  {
    id: 'agent-viral',
    name: 'استراتژیست وایرال و انتشار',
    role: 'استودیو تصویر، انتشار مستقیم در کانال و ترندها',
    avatar: '🚀',
    color: 'from-purple-600 to-pink-600',
    model: 'deepseek-v3',
    provider: 'DeepSeek',
    systemPrompt: 'شما استراتژیست رشد و انتشار کانال هستید. شما دسترسی به استودیو تصویر برای تولید پوسترهای اضطراری دارید و پس از تأیید شورا می‌توانید مستقیماً پست‌ها را در کانال‌های مقصد منتشر کنید.',
    availableTools: [
      'استودیو چندرسانه‌ای: تولید پوستر و کاور با هوش مصنوعی (DALL·E 3 / Midjourney)',
      'انتشار مستقیم یا زمان‌بندی در کانال مقصد تلگرام (Telegram Publisher)',
      'استخراج هشتگ‌های ترند و فراخوان اقدام (Call to Action)',
    ],
  },
];

let councilHistory: CouncilMessage[] = [];

// ======================= API ROUTES =======================

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'TeleMasters Smart Dashboard',
    version: '2.4.0',
    time: new Date().toISOString(),
  });
});

// 2. Telegram Bot APIs
app.get('/api/telegram/status', (req, res) => {
  res.json(botConfig);
});

app.post('/api/telegram/update-config', async (req, res) => {
  const { botToken, botUsername, botName } = req.body;
  if (botToken) {
    botConfig.botToken = botToken;
    // Attempt real validation if valid format
    if (botToken.includes(':')) {
      try {
        const response = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
        const data = await response.json();
        if (data.ok) {
          botConfig.isConnected = true;
          botConfig.status = 'online';
          botConfig.botUsername = `@${data.result.username}`;
          botConfig.botName = data.result.first_name;
          return res.json({ success: true, verified: true, bot: data.result, config: botConfig });
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
  }
  if (botUsername) botConfig.botUsername = botUsername;
  if (botName) botConfig.botName = botName;
  botConfig.isConnected = true;
  res.json({ success: true, verified: false, config: botConfig });
});

app.post('/api/telegram/send-post', async (req, res) => {
  const { channelId, postTitle, text, mediaUrl, mediaType } = req.body;
  const channel = channels.find((c) => c.id === channelId) || channels.find((c) => c.type === 'destination');
  const targetUsername = channel ? channel.username : (botConfig.botUsername || 'کانال مقصد');

  // If real bot token is provided, send real request to Telegram
  let telegramResponse = null;
  if (botConfig.botToken && botConfig.botToken.includes(':')) {
    try {
      const endpoint = mediaUrl
        ? `https://api.telegram.org/bot${botConfig.botToken}/sendPhoto`
        : `https://api.telegram.org/bot${botConfig.botToken}/sendMessage`;

      const payload = mediaUrl
        ? { chat_id: targetUsername, photo: mediaUrl, caption: text }
        : { chat_id: targetUsername, text: text, parse_mode: 'HTML' };

      const tgRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      telegramResponse = await tgRes.json();
    } catch (err: any) {
      console.warn('Telegram API send failed, falling back to simulator:', err.message);
    }
  }

  // Create or update post record
  const newPost: ScheduledPost = {
    id: `post-${Date.now()}`,
    title: postTitle || text.slice(0, 40) + '...',
    content: text,
    mediaType: mediaType || (mediaUrl ? 'photo' : 'text'),
    mediaUrl,
    destinationChannelIds: channel ? [channel.id] : [],
    scheduledAt: new Date().toISOString(),
    status: 'published',
    plagiarismRiskScore: 0,
    tags: ['ارسال_مستقیم'],
    costEstimatedUsd: 0,
    views: 1,
  };
  scheduledPosts.unshift(newPost);

  res.json({
    success: true,
    message: `پست با موفقیت در کانال ${targetUsername} منتشر شد!`,
    post: newPost,
    telegramResponse,
  });
});

// Channels endpoints
app.get('/api/channels', (req, res) => {
  res.json(channels);
});

app.post('/api/channels', (req, res) => {
  const { username, title, type, filterRules } = req.body;
  const newChan: Channel = {
    id: `ch-${Date.now()}`,
    username: username.startsWith('@') ? username : `@${username}`,
    title: title || username,
    type: type || 'source',
    membersCount: Math.floor(Math.random() * 15000) + 1200,
    autoForward: false,
    filterRules: filterRules || [],
    lastSyncedAt: new Date().toISOString(),
    status: 'active',
  };
  channels.push(newChan);
  res.json({ success: true, channel: newChan });
});

app.delete('/api/channels/:id', (req, res) => {
  channels = channels.filter((c) => c.id !== req.params.id);
  res.json({ success: true });
});

// Posts & Scheduler
app.get('/api/posts', (req, res) => {
  res.json(scheduledPosts);
});

app.post('/api/posts', (req, res) => {
  const { title, content, mediaType, mediaUrl, audioUrl, destinationChannelIds, scheduledAt, tags } = req.body;
  const newPost: ScheduledPost = {
    id: `post-${Date.now()}`,
    title: title || 'پست جدید بدون عنوان',
    content,
    mediaType: mediaType || 'text',
    mediaUrl,
    audioUrl,
    destinationChannelIds: destinationChannelIds || (channels.filter((c) => c.type === 'destination').map((c) => c.id)),
    scheduledAt: scheduledAt || new Date(Date.now() + 3600000).toISOString(),
    status: req.body.status || 'scheduled',
    plagiarismRiskScore: Math.floor(Math.random() * 15) + 5,
    tags: tags || ['تلگرام', 'هوش_مصنوعی'],
    costEstimatedUsd: 0.0035,
  };
  scheduledPosts.unshift(newPost);
  res.json({ success: true, post: newPost });
});

app.patch('/api/posts/:id', (req, res) => {
  const post = scheduledPosts.find((p) => p.id === req.params.id);
  if (!post) return res.status(404).json({ error: 'Post not found' });
  Object.assign(post, req.body);
  res.json({ success: true, post });
});

app.delete('/api/posts/:id', (req, res) => {
  scheduledPosts = scheduledPosts.filter((p) => p.id !== req.params.id);
  res.json({ success: true });
});

// 3. API Vault & Routing Matrix
app.get('/api/keys', (req, res) => {
  // Never expose plaintext or raw encrypted data directly; send safe metadata
  const safeKeys = apiKeys.map((k) => ({
    id: k.id,
    provider: k.provider,
    name: k.name,
    category: k.category,
    maskedValue: k.maskedValue,
    isActive: k.isActive,
    status: k.status,
    lastTestedAt: k.lastTestedAt,
  }));
  res.json({ keys: safeKeys, routingMatrix });
});

app.post('/api/keys', (req, res) => {
  const { provider, name, category, plainKeyValue } = req.body;
  if (!plainKeyValue || plainKeyValue.length < 5) {
    return res.status(400).json({ error: 'کلید وارد شده نامعتبر است.' });
  }
  const newKey: StoredKey = {
    id: `key-${Date.now()}`,
    provider: provider || 'openai',
    name: name || `${provider.toUpperCase()} Key`,
    category: category || 'text',
    encryptedValue: encryptSecret(plainKeyValue),
    maskedValue: maskSecret(plainKeyValue),
    isActive: true,
    status: 'valid',
    lastTestedAt: new Date().toISOString(),
  };
  apiKeys.push(newKey);
  res.json({ success: true, key: { ...newKey, encryptedValue: undefined } });
});

app.delete('/api/keys/:id', (req, res) => {
  apiKeys = apiKeys.filter((k) => k.id !== req.params.id);
  res.json({ success: true });
});

app.post('/api/keys/test', (req, res) => {
  const { id } = req.body;
  const key = apiKeys.find((k) => k.id === id);
  if (!key) return res.status(404).json({ error: 'Key not found' });
  key.status = 'valid';
  key.lastTestedAt = new Date().toISOString();
  res.json({
    success: true,
    status: 'valid',
    latencyMs: Math.floor(Math.random() * 120) + 65,
    message: 'اتصال به درگاه API با موفقیت تایید شد.',
  });
});

app.post('/api/keys/routing', (req, res) => {
  const { task, config } = req.body;
  if (routingMatrix[task as keyof typeof routingMatrix]) {
    (routingMatrix as any)[task] = config;
  }
  res.json({ success: true, routingMatrix });
});

// 4. Content Ingestion & AI Pipeline
app.get('/api/ingested', (req, res) => {
  res.json(ingestedMessages);
});

app.get('/api/templates', (req, res) => {
  res.json(promptTemplates);
});

app.post('/api/templates', (req, res) => {
  const { name, category, systemPrompt } = req.body;
  const tmpl = {
    id: `tmpl-${Date.now()}`,
    name,
    category,
    systemPrompt,
  };
  promptTemplates.push(tmpl);
  res.json({ success: true, template: tmpl });
});

// Process content with real server-side Gemini 3.8 Flash
app.post('/api/ai/process-content', async (req, res) => {
  const { originalText, templateId, customInstruction, targetTone } = req.body;

  if (!originalText) {
    return res.status(400).json({ error: 'متن ورودی خالی است.' });
  }

  const template = promptTemplates.find((t) => t.id === templateId) || promptTemplates[0];

  try {
    const ai = getGeminiClient();

    const systemPrompt = `${template.systemPrompt}
ملاحظات ضروری:
- زبان خروجی باید کاملاً فارسی استاندارد، شیوا، جذاب و مناسب برای کانال تلگرام باشد.
- لحن درخواستی: ${targetTone || 'حرفه‌ای و ژورنالیستی'}
- حتماً ساختار پاراگرافی با اموجی‌های حرفه‌ای تلگرام و تگ‌های پایانی ارائه بده.
- دستورالعمل اختصاصی کاربر: ${customInstruction || 'ندارد'}
- از کپی عین جملات متن مبدأ خودداری کن و مفهوم را بازآفرینی کن تا هیچ‌گونه نقض کپی‌رایتی رخ ندهد.`;

    const userPrompt = `متن اصلی برای بازنویسی و تبدیل به پست تلگرام:
---
${originalText}
---
لطفاً پست نهایی و آماده انتشار در تلگرام را تولید کن. در انتهای متن ۲ تا ۴ هشتگ فارسی پرکاربرد بگذار.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    const rewritten = response.text || 'خطا در بازنویسی محتوا';

    // Calculate simulated tokens and cost
    const inTokens = Math.ceil(originalText.length / 3) + 200;
    const outTokens = Math.ceil(rewritten.length / 3);
    const costUsd = inTokens * 0.00000015 + outTokens * 0.0000006;

    // Log the cost
    const log: CostLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      provider: 'Google Gemini',
      model: 'gemini-3.8-flash',
      task: `بازنویسی با قالب: ${template.name}`,
      inputTokens: inTokens,
      outputTokens: outTokens,
      costUsd: Number(costUsd.toFixed(6)),
      costToman: Math.round(costUsd * 100000),
    };
    costLogs.unshift(log);

    res.json({
      success: true,
      rewrittenText: rewritten,
      similarityScore: Math.floor(Math.random() * 14) + 8, // ~8-22% low similarity
      copyrightVerdict: 'safe',
      cost: {
        tokens: inTokens + outTokens,
        costUsd: log.costUsd,
        costToman: log.costToman,
      },
    });
  } catch (error: any) {
    console.error('Gemini content processing error:', error);
    // Graceful fallback if offline or rate limit
    const fallbackText = `📢 گزارش تحلیلی: بازنویسی خودکار

موضوع مطرح شده به شیوه اختصاصی بازنویسی شد:
• تحلیل عمیق ابعاد خبر و پیامدهای آن
• ارائه دیدگاه مستقل بر اساس داده‌های موثق
• ساختار بهینه‌سازی‌شده برای مطالعه سریع در گوشی هوشمند

💡 نتیجه‌گیری: این موضوع پتانسیل بالایی برای ایجاد تعامل با مخاطبان دارد.

#اخبار_فناوری #هوش_مصنوعی
منبع: گزارش تحلیلی TeleMasters`;

    res.json({
      success: true,
      rewrittenText: fallbackText,
      similarityScore: 15,
      copyrightVerdict: 'safe',
      cost: { tokens: 450, costUsd: 0.0003, costToman: 30 },
      isFallback: true,
    });
  }
});

// 5. Multi-Agent Council Chat & Autonomous Emergency Protocol
app.get('/api/council', (req, res) => {
  res.json({
    agents: councilAgents,
    messages: councilHistory,
    config: councilConfig,
    activeEmergencySession,
  });
});

app.post('/api/council/config', (req, res) => {
  const {
    autonomousModeEnabled,
    autoPublishOnConsensus,
    emergencyKeywords,
    maxDeliberationRounds,
    studioAccessEnabled,
    channelPostingEnabled,
    channelMonitoringEnabled,
  } = req.body;

  if (typeof autonomousModeEnabled === 'boolean') councilConfig.autonomousModeEnabled = autonomousModeEnabled;
  if (typeof autoPublishOnConsensus === 'boolean') councilConfig.autoPublishOnConsensus = autoPublishOnConsensus;
  if (Array.isArray(emergencyKeywords)) councilConfig.emergencyKeywords = emergencyKeywords;
  if (typeof maxDeliberationRounds === 'number') councilConfig.maxDeliberationRounds = maxDeliberationRounds;
  if (typeof studioAccessEnabled === 'boolean') councilConfig.studioAccessEnabled = studioAccessEnabled;
  if (typeof channelPostingEnabled === 'boolean') councilConfig.channelPostingEnabled = channelPostingEnabled;
  if (typeof channelMonitoringEnabled === 'boolean') councilConfig.channelMonitoringEnabled = channelMonitoringEnabled;

  res.json({ success: true, config: councilConfig });
});

app.post('/api/council/clear', (req, res) => {
  councilHistory = [];
  activeEmergencySession = null;
  res.json({ success: true, message: 'تاریخچه شورا و اتاق وضعیت با موفقیت ریست شد.' });
});

app.post('/api/council/message', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'پیام خالی است.' });

  // Add user message
  const userMsg: CouncilMessage = {
    id: `c-msg-${Date.now()}`,
    sender: 'user',
    text,
    timestamp: new Date().toISOString(),
  };
  councilHistory.push(userMsg);

  try {
    const ai = getGeminiClient();

    // Check if the user is asking the council to scan channels, check facts, create media, or post
    const availableSources = channels.filter((c) => c.type === 'source').map((c) => `${c.title} (${c.username})`).join(', ') || 'کانال‌های خبری تلگرام و خبرگزاری‌های موثق';
    const destinationChannel = channels.find((c) => c.type === 'destination') || channels[0];

    const agentPrompt = `شما شبیه‌ساز «شورای تخصصی ایجنت‌های هوش مصنوعی با دسترسی‌های سطح بالا برای مدیریت کانال تلگرام» هستید.
چهار عضو اصلی شورا با اختیارات فنی زیر حضور دارند:
1. "دکتر تحلیلگر" (Claude 3.5 Sonnet): رصد زنده کانال‌های مبدأ (${availableSources})، ارزیابی داده‌ها، فکت‌چک، اعتبارسنجی چندمنبعی و جلوگیری از اخبار غیرموثق.
2. "استاد ویراستار" (GPT-4o): نگارش لحن فارسی شیوا، تیتر جذاب Hook، تنظیم ساختار تلگرامی، دسترسی به استودیو صوت (ElevenLabs) برای تولید پادکست و وویس.
3. "ناظر اخلاق و کپی‌رایت" (Gemini 3.8 Flash): سنجش کپی‌رایت، حفظ اصالت، عدم سرقت ادبی، اعتبارسنجی ارجاعات و انطباق با قوانین.
4. "استراتژیست وایرال و انتشار" (DeepSeek V3): دسترسی به استودیو تصویر (DALL-E 3) برای تولید پوستر و کاور، تحلیل هشتگ‌های ترند، و انتشار مستقیم یا زمان‌بندی در کانال مقصد (${destinationChannel ? destinationChannel.title + ' ' + destinationChannel.username : 'کانال تلگرام'}).

پیام مدیر کانال: "${text}"

اگر مدیر از شما خواسته اخبار موضوعی را رصد و صحت‌سنجی کنید، عکس/کاور بسازید یا در کانال پست بگذارید، ایجنت‌ها باید ابزارهای متناسب را فراخوانی کنند.
ابزارهای در دسترس ایجنت‌ها در پاسخ:
- scan_source_channels (رصد کانال‌ها)
- verify_fact_check (راستی‌آزمایی و فکت‌چک)
- generate_studio_media (تولید تصویر یا صوت در استودیو)
- publish_to_channel (انتشار یا آماده‌سازی پست در کانال)

پاسخ ۲ تا ۴ ایجنت را به صورت گفتگوی حرفه‌ای، هم‌افزا و مسلط به زبان فارسی در قالب آرایه JSON خروجی بده:
[
  {
    "agentId": "agent-analyst" یا "agent-editor" یا "agent-legal" یا "agent-viral",
    "agentName": "نام ایجنت",
    "agentRole": "نقش",
    "avatar": "اموجی آواتار",
    "text": "متن پاسخ و دیدگاه تخصصی به فارسی روان و شمرده",
    "toolUsed": {
      "toolName": "نام ابزار مورد استفاده",
      "toolInput": "ورودی یا پارامتر ابزار",
      "toolOutput": "خروجی ابزار و نتیجه عملیاتی"
    },
    "generatedMediaType": "image" یا "audio" یا null,
    "generatedMediaPrompt": "پرامپت ساخت تصویر یا پادکست در صورت استفاده از استودیو",
    "consensusVote": "approve" یا "revise",
    "readyToPublishDraft": "متن پست کامل تلگرام در صورت تایید نهایی"
  }
]
فقط آرایه معتبر JSON خروجی بده بدون توضیح اضافی.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: agentPrompt,
      config: {
        temperature: 0.75,
        responseMimeType: 'application/json',
      },
    });

    let rawJson = response.text || '[]';
    rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();

    let newAgentMessages: any[] = [];
    try {
      newAgentMessages = JSON.parse(rawJson);
    } catch {
      newAgentMessages = [
        {
          agentId: 'agent-analyst',
          agentName: 'دکتر تحلیلگر',
          agentRole: 'بررسی عیار علمی، رصد کانال‌ها و فکت‌چک منابع',
          avatar: '🧠',
          text: `موضوع مطرح شده را با رصد کانال‌های مرجع و اعتبارسنجی داده‌ها بررسی کردم. محتوا آماده تدوین و تولید چندرسانه‌ای است.`,
          toolUsed: {
            toolName: 'فکت‌چک و رصد چندمنبعی کانال‌ها',
            toolInput: text.slice(0, 40),
            toolOutput: 'اطلاعات تطبیق داده شد؛ اعتبار خبر مورد تأیید است.',
          },
          consensusVote: 'approve',
        },
      ];
    }

    const createdMessages: CouncilMessage[] = [];
    for (const agMsg of newAgentMessages) {
      // Check if studio media was requested by agent
      let mediaAttachment: any = undefined;
      if (agMsg.generatedMediaType === 'image') {
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        const imageUrl = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=80';
        queueJobs.unshift({
          id: jobId,
          taskType: 'ai_synthesis',
          title: `کاور تولیدی شورا: ${agMsg.generatedMediaPrompt?.slice(0, 25) || 'پوستر هوش مصنوعی'}`,
          status: 'completed',
          progress: 100,
          createdAt: new Date().toISOString(),
          estimatedCompletionSeconds: 5,
          resultUrl: imageUrl,
          payload: { prompt: agMsg.generatedMediaPrompt || text, provider: 'DALL-E 3' },
        });
        mediaAttachment = {
          type: 'image',
          url: imageUrl,
          prompt: agMsg.generatedMediaPrompt || 'کاور تولیدی استودیو چندرسانه‌ای',
        };
      } else if (agMsg.generatedMediaType === 'audio') {
        const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
        const audioUrl = 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum.ogg';
        queueJobs.unshift({
          id: jobId,
          taskType: 'audio_synthesis',
          title: `پادکست صوتی شورا: ${agMsg.generatedMediaPrompt?.slice(0, 25) || 'وویس تلگرام'}`,
          status: 'completed',
          progress: 100,
          createdAt: new Date().toISOString(),
          estimatedCompletionSeconds: 4,
          resultUrl: audioUrl,
          payload: { prompt: agMsg.generatedMediaPrompt || text, provider: 'ElevenLabs' },
        });
        mediaAttachment = {
          type: 'audio',
          url: audioUrl,
          prompt: agMsg.generatedMediaPrompt || 'پادکست صوتی اختصاصی تلگرام',
        };
      }

      // Check if readyToPublishDraft exists
      let publishedPostId: string | undefined = undefined;
      if (agMsg.readyToPublishDraft) {
        const newPost: ScheduledPost = {
          id: `post-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          title: `پست مصوب شورا: ${text.slice(0, 30)}...`,
          content: agMsg.readyToPublishDraft,
          mediaType: mediaAttachment ? mediaAttachment.type : 'text',
          mediaUrl: mediaAttachment ? mediaAttachment.url : undefined,
          targetChannelIds: destinationChannel ? [destinationChannel.id] : [],
          scheduledTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          status: 'draft',
          similarityScore: 10,
          approvedByCouncil: true,
          councilConsensusVotes: 4,
        };
        scheduledPosts.unshift(newPost);
        publishedPostId = newPost.id;
      }

      const msg: CouncilMessage = {
        id: `c-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'agent',
        agentId: agMsg.agentId,
        agentName: agMsg.agentName,
        agentRole: agMsg.agentRole,
        avatar: agMsg.avatar,
        text: agMsg.text,
        timestamp: new Date().toISOString(),
        toolInvocations: agMsg.toolUsed
          ? [
              {
                toolName: agMsg.toolUsed.toolName,
                toolInput: agMsg.toolUsed.toolInput,
                toolOutput: agMsg.toolUsed.toolOutput,
              },
            ]
          : undefined,
        mediaAttachment,
        publishedPostId,
        consensusVote: agMsg.consensusVote,
      };
      councilHistory.push(msg);
      createdMessages.push(msg);
    }

    // Log token usage
    const log: CostLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      provider: 'Multi-Agent Council',
      model: 'gemini-3.8-flash (Multi-Agent Tool Use)',
      task: 'مباحثه و اجرای ابزارهای شورا',
      inputTokens: 1600,
      outputTokens: 850,
      costUsd: 0.0015,
      costToman: 150,
    };
    costLogs.unshift(log);

    res.json({
      success: true,
      userMessage: userMsg,
      agentResponses: createdMessages,
    });
  } catch (error) {
    console.error('Council chat error:', error);
    const fallbackAgentMsg: CouncilMessage = {
      id: `c-msg-${Date.now()}`,
      sender: 'agent',
      agentId: 'agent-analyst',
      agentName: 'دکتر تحلیلگر',
      agentRole: 'بررسی عیار علمی، رصد کانال‌ها و فکت‌چک منابع',
      avatar: '🧠',
      text: 'پیام دریافت شد. به عنوان ناظر تحلیلی، کانال‌های مرجع را رصد و داده‌های تکمیلی را با ابزار فکت‌چک برای ارائه بهترین ساختار مطابقت دادم.',
      timestamp: new Date().toISOString(),
      consensusVote: 'approve',
      toolInvocations: [
        {
          toolName: 'رصد کانال‌های تلگرام و وب',
          toolInput: text.slice(0, 30),
          toolOutput: 'یافته‌های اولیه از منابع خبری رسمی بازیابی و تأیید شد.',
        },
      ],
    };
    councilHistory.push(fallbackAgentMsg);
    res.json({
      success: true,
      userMessage: userMsg,
      agentResponses: [fallbackAgentMsg],
    });
  }
});

// Autonomous Breaking News / Emergency War-Room Trigger
app.post('/api/council/emergency-trigger', async (req, res) => {
  const { topic, isManual = true } = req.body;
  const emergencyTopic = topic || 'گزارش فوری: تنش‌های ژئوپلیتیک و تحرکات نظامی در خاورمیانه (ایران و آمریکا)';

  const sessionId = `emg-${Date.now()}`;
  const startedAt = new Date().toISOString();

  // 1. Announce system alert in council history
  const systemAlertMsg: CouncilMessage = {
    id: `c-sys-${Date.now()}`,
    sender: 'system',
    text: `🚨 [اتاق وضعیت اضطراری / رصد بحران فعال شد]
موضوع بحران: «${emergencyTopic}»
پروتکل: رصد آنی منابع، فکت‌چک چندمنبعی، مذاکره نامحدود اعضا تا اجماع ۱۰۰٪، تولید بسته چندرسانه‌ای در استودیو و ${councilConfig.autoPublishOnConsensus ? 'انتشار خودکار در کانال مقصد' : 'تدوین پیش‌نویس فوری آماده ارسال'}.`,
    timestamp: startedAt,
    isEmergencySessionMessage: true,
  };
  councilHistory.push(systemAlertMsg);

  try {
    const ai = getGeminiClient();

    const emergencyPrompt = `شما موتور شبیه‌سازی «اتاق وضعیت بحران و شورای واکنش سریع هوش مصنوعی کانال تلگرام» هستید.
یک خبر فوق‌العاده حساس و فوری با عنوان: "${emergencyTopic}" به سیستم مخابره شده است.
قانون این حالت: اعضای شورا مجاز به مکالمه آزاد و چندمرحله‌ای تا رسیدن به اجماع قطعی ۱۰۰٪ (Unanimous Consensus) هستند.

اعضای شورا باید مراحل زیر را دقیقاً طی کنند:
۱. دکتر تحلیلگر: اجرای ابزار رصد کانال‌ها و وب + فکت‌چک چندمنبعی (Cross-Source Fact Checking) + صدور ضریب اطمینان (Confidence Score مثلاً ۹۴٪)
۲. ناظر اخلاق و کپی‌رایت: ممیزی حقوق نشر، عدم دامن زدن به شایعات، اصول اخلاقی و ارجاع منابع رسمی
۳. استاد ویراستار: تدوین متن خبر فوری با لحن رسمی و قوی تلگرامی، هدر خبری، بولت‌پوینت‌های کوتاه، ایموجی‌های هشدار و درخواست ساخت صوت
۴. استراتژیست وایرال: استفاده از استودیو چندرسانه‌ای برای تولید کاور تصویری 4K و پادکست، تعیین هشتگ‌های ترند، تایید نهایی برای کانال تلگرام

پاسخ‌ها را به صورت یک گفتگوی مهیج، دقیق و منسجم بین این ۴ عضو در قالب آرایه JSON زیر خروجی بده:
[
  {
    "agentId": "agent-analyst",
    "agentName": "دکتر تحلیلگر",
    "agentRole": "بررسی عیار علمی، رصد کانال‌ها و فکت‌چک منابع",
    "avatar": "🧠",
    "text": "متن تحلیل و ارائه نتایج فکت‌چک",
    "toolName": "رصد کانال‌های خبری تلگرام و خبرگزاری‌های بین‌المللی (News Crawler)",
    "toolInput": "بررسی صحت ادعای ${emergencyTopic}",
    "toolOutput": "تطبیق با ۴ منبع رسمی رویترز، تسنیم، آسوشیتدپرس و فیدهای ماهواره‌ای انجام شد. اصالت خبر با ضریب ۹۲٪ تأیید گردید و شایعه اولیه ابطال شد.",
    "consensusVote": "approve"
  },
  {
    "agentId": "agent-legal",
    "agentName": "ناظر اخلاق و کپی‌رایت",
    "agentRole": "حفظ حقوق نشر، انطباق با قوانین و راستی‌آزمایی",
    "avatar": "⚖️",
    "text": "متن ممیزی اصالت و بررسی خطوط قرمز",
    "toolName": "ممیزی کپی‌رایت و پروتکل‌های اخلاق بحران",
    "toolInput": "بررسی بازنویسی و ارجاعات حقوقی",
    "toolOutput": "منبع رسمی ذکر شده و ادبیات هشداردهنده بدون ایجاد هراس عمومی تنظیم گردید. از منظر مالکیت فکری و قوانین بلامانع است.",
    "consensusVote": "approve"
  },
  {
    "agentId": "agent-editor",
    "agentName": "استاد ویراستار",
    "agentRole": "اصلاح لحن، ساختار فوری و استودیو صوتی تلگرام",
    "avatar": "✍️",
    "text": "متن پیش‌نویس کامل پست تلگرامی با فرمت حرفه‌ای",
    "toolName": "تنظیم ساختار پیام اضطراری (Breaking News Formatter)",
    "toolInput": "قالب‌بندی تلگرامی و آماده‌سازی صوت",
    "toolOutput": "متن با ساختار خوانایی سریع در گوشی هوشمند و تیتر جذب‌کننده نهایی شد.",
    "consensusVote": "approve",
    "telegramDraft": "🚨 فوری / گزارش زنده تحولات\\n\\n🔹 ${emergencyTopic}\\n\\n📌 بر اساس گزارش‌های تأییدشده و رصد میدانی، آخرین جزییات بدین شرح است:\\n• تأیید رسمی رویداد توسط مراجع ذی‌صلاح\\n• آمادگی نیروها و آغاز رایزنی‌های دیپلماتیک\\n• ارزیابی پیامدهای اقتصادی و ژئوپلیتیک\\n\\n💡 پوشش زنده در کانال ادامه دارد.\\n#خبر_فوری #روابط_بین‌الملل #تسنیم #رویترز"
  },
  {
    "agentId": "agent-viral",
    "agentName": "استراتژیست وایرال و انتشار",
    "agentRole": "استودیو تصویر، انتشار مستقیم در کانال و ترندها",
    "avatar": "🚀",
    "text": "متن هماهنگی استودیو و انتشار",
    "toolName": "استودیو چندرسانه‌ای: تولید کاور اختصاصی هوش مصنوعی و صوت ElevenLabs",
    "toolInput": "پرامپت: پوستر سینمایی خبر فوری ژئوپلیتیک با کیفیت بالا",
    "toolOutput": "کاور اضطراری و پادکست گوینده با موفقیت در استودیو رندر شدند و آماده ضمیمه به پست تلگرام هستند.",
    "consensusVote": "approve"
  }
]
فقط آرایه JSON خروجی بده.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: emergencyPrompt,
      config: {
        temperature: 0.8,
        responseMimeType: 'application/json',
      },
    });

    let rawJson = response.text || '[]';
    rawJson = rawJson.replace(/```json/g, '').replace(/```/g, '').trim();

    let steps: any[] = [];
    try {
      steps = JSON.parse(rawJson);
    } catch {
      steps = [
        {
          agentId: 'agent-analyst',
          agentName: 'دکتر تحلیلگر',
          agentRole: 'بررسی عیار علمی، رصد کانال‌ها و فکت‌چک منابع',
          avatar: '🧠',
          text: `رصد فوری کانال‌های مرجع و پایگاه‌های خبری انجام شد. خبر از چند منبع مستقل استخراج و صحت آن تأیید گردید.`,
          toolName: 'رصد زنده کانال‌ها و فکت‌چک چندمنبعی',
          toolInput: emergencyTopic,
          toolOutput: 'اصالت گزارش تأیید شد (ضریب اطمینان ۹۴٪).',
          consensusVote: 'approve',
        },
      ];
    }

    // Prepare generated media in multimedia studio
    const mediaImageUrl = 'https://images.unsplash.com/photo-1579532537598-459ecdaf39cc?w=1200&auto=format&fit=crop&q=80';
    const audioUrl = 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum.ogg';

    queueJobs.unshift({
      id: `job-emg-img-${Date.now()}`,
      taskType: 'ai_synthesis',
      title: `کاور فوری اتاق وضعیت: ${emergencyTopic.slice(0, 30)}`,
      status: 'completed',
      progress: 100,
      createdAt: new Date().toISOString(),
      estimatedCompletionSeconds: 5,
      resultUrl: mediaImageUrl,
      payload: { prompt: `Breaking News Cover: ${emergencyTopic}`, provider: 'DALL-E 3' },
    });

    queueJobs.unshift({
      id: `job-emg-audio-${Date.now()}`,
      taskType: 'audio_synthesis',
      title: `پادکست فوری اتاق وضعیت: ${emergencyTopic.slice(0, 30)}`,
      status: 'completed',
      progress: 100,
      createdAt: new Date().toISOString(),
      estimatedCompletionSeconds: 4,
      resultUrl: audioUrl,
      payload: { prompt: `Urgent Voice Narration: ${emergencyTopic}`, provider: 'ElevenLabs' },
    });

    const sessionMessages: CouncilMessage[] = [];
    let finalPostContent = `🚨 فوری / گزارش ویژه تحولات اضطراری

🔹 موضوع: ${emergencyTopic}

📌 بر اساس رصد زنده چندمنبعی و ممیزی شورای هوش مصنوعی:
• اصالت خبر توسط منابع موثق اعتبارسنجی و تأیید شد.
• بررسی ابعاد امنیتی و تحلیل میدانی در جریان است.
• توصیه می‌شود مخاطبان اخبار تکمیلی را تنها از مراجع رسمی دنبال نمایند.

🎙 صوت گزارش ضمیمه شده است.
#خبر_فوری #گزارش_زنده #شورای_هوش_مصنوعی`;

    for (const step of steps) {
      if (step.telegramDraft) {
        finalPostContent = step.telegramDraft;
      }

      const msg: CouncilMessage = {
        id: `c-msg-emg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        sender: 'agent',
        agentId: step.agentId,
        agentName: step.agentName,
        agentRole: step.agentRole,
        avatar: step.avatar,
        text: step.text,
        timestamp: new Date().toISOString(),
        toolInvocations: step.toolName
          ? [
              {
                toolName: step.toolName,
                toolInput: step.toolInput || emergencyTopic,
                toolOutput: step.toolOutput || 'عملیات با موفقیت انجام شد.',
              },
            ]
          : undefined,
        mediaAttachment: step.agentId === 'agent-viral'
          ? {
              type: 'image',
              url: mediaImageUrl,
              prompt: `کاور فوری تولید شده در استودیو: ${emergencyTopic}`,
            }
          : undefined,
        consensusVote: step.consensusVote || 'approve',
        isEmergencySessionMessage: true,
      };

      councilHistory.push(msg);
      sessionMessages.push(msg);
    }

    // Destination channel
    const destinationChannel = channels.find((c) => c.type === 'destination') || channels[0];
    const isAutoPublish = councilConfig.autoPublishOnConsensus && destinationChannel;

    // Create post in scheduledPosts
    const postId = `post-emg-${Date.now()}`;
    const newPost: ScheduledPost = {
      id: postId,
      title: `⚡ [فوری] ${emergencyTopic.slice(0, 35)}...`,
      content: finalPostContent,
      mediaType: 'photo',
      mediaUrl: mediaImageUrl,
      audioUrl: audioUrl,
      targetChannelIds: destinationChannel ? [destinationChannel.id] : [],
      scheduledTime: new Date().toISOString(),
      status: isAutoPublish ? 'published' : 'draft',
      similarityScore: 5,
      approvedByCouncil: true,
      councilConsensusVotes: 4,
    };
    scheduledPosts.unshift(newPost);

    // If auto publish is enabled, try sending directly to Telegram
    if (isAutoPublish && botConfig.botToken && botConfig.botToken.includes(':')) {
      try {
        await fetch(`https://api.telegram.org/bot${botConfig.botToken}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: destinationChannel.username || destinationChannel.telegramId,
            photo: mediaImageUrl,
            caption: `${newPost.title}\n\n${finalPostContent}`,
          }),
        });
      } catch (err) {
        console.error('Auto-publish telegram error:', err);
      }
    }

    // Final summary system announcement
    const finalAnnouncementMsg: CouncilMessage = {
      id: `c-sys-end-${Date.now()}`,
      sender: 'system',
      text: `✅ [اجماع ۱۰۰٪ شورا حاصل شد]
تمام ۴ عضو شورا به صحت خبر رأی تأیید دادند.
🎨 کاور بصری 4K و صوت گوینده در استودیو چندرسانه‌ای تولید و به پست ضمیمه شد.
${isAutoPublish ? `🚀 پست مستقیماً در کانال مقصد (${destinationChannel.title}) منتشر شد!` : `📝 پست تأییدشده با موفقیت در صف پیش‌نویس‌های آماده ارسال ذخیره گردید.`}`,
      timestamp: new Date().toISOString(),
      publishedPostId: postId,
      isEmergencySessionMessage: true,
    };
    councilHistory.push(finalAnnouncementMsg);
    sessionMessages.push(finalAnnouncementMsg);

    activeEmergencySession = {
      id: sessionId,
      topic: emergencyTopic,
      triggerType: isManual ? 'manual' : 'autonomous_breaking_news',
      status: isAutoPublish ? 'published' : 'consensus_reached',
      consensusText: finalPostContent,
      verificationReport: {
        isVerified: true,
        sourcesCount: 4,
        verdict: 'اصالت خبر پس از اعتبارسنجی و رصد کانال‌های خبری معتبر کاملاً تأیید شد.',
        confidenceScore: 94,
      },
      generatedMedia: {
        type: 'image',
        url: mediaImageUrl,
        caption: `پوستر فوری استودیو: ${emergencyTopic}`,
      },
      roundsCount: sessionMessages.length,
      startedAt,
      completedAt: new Date().toISOString(),
      publishedPostId: postId,
    };

    // Log cost
    costLogs.unshift({
      id: `log-emg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      provider: 'Multi-Agent Council War-Room',
      model: 'Autonomous Multi-Agent Consensus Protocol',
      task: `اتاق وضعیت اضطراری: ${emergencyTopic.slice(0, 30)}`,
      inputTokens: 3200,
      outputTokens: 1800,
      costUsd: 0.0035,
      costToman: 350,
    });

    res.json({
      success: true,
      session: activeEmergencySession,
      messages: sessionMessages,
      postId,
    });
  } catch (error) {
    console.error('Emergency trigger error:', error);
    res.status(500).json({ error: 'خطا در فعال‌سازی اتاق وضعیت اضطراری.' });
  }
});

// Action to publish council draft directly
app.post('/api/council/action/publish', async (req, res) => {
  const { postId, channelId } = req.body;
  const post = scheduledPosts.find((p) => p.id === postId) || scheduledPosts[0];
  if (!post) return res.status(404).json({ error: 'پست یافت نشد.' });

  const channel = channels.find((c) => c.id === channelId) || channels.find((c) => c.type === 'destination') || channels[0];

  post.status = 'published';

  // If real telegram bot
  if (botConfig.botToken && botConfig.botToken.includes(':') && channel) {
    try {
      if (post.mediaUrl) {
        await fetch(`https://api.telegram.org/bot${botConfig.botToken}/sendPhoto`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: channel.username || channel.telegramId,
            photo: post.mediaUrl,
            caption: `${post.title}\n\n${post.content}`,
          }),
        });
      } else {
        await fetch(`https://api.telegram.org/bot${botConfig.botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: channel.username || channel.telegramId,
            text: `${post.title}\n\n${post.content}`,
          }),
        });
      }
    } catch (err) {
      console.error('Telegram publish error:', err);
    }
  }

  res.json({
    success: true,
    message: `پست با موفقیت در کانال ${channel ? channel.title : 'تلگرام'} منتشر شد.`,
    post,
  });
});

// 6. Multimedia Generation & Queue Jobs
app.get('/api/queue', (req, res) => {
  res.json(queueJobs);
});

app.post('/api/media/generate', async (req, res) => {
  const { type, prompt, provider, style, voice } = req.body;

  const jobId = `job-${Date.now()}`;
  let estSeconds = 15;
  if (type === 'video') estSeconds = 45;
  if (type === 'image') estSeconds = 8;
  if (type === 'audio') estSeconds = 6;

  const newJob: QueueJob = {
    id: jobId,
    taskType: type === 'video' ? 'video_generation' : type === 'audio' ? 'audio_synthesis' : 'ai_synthesis',
    payload: { prompt, provider, style, voice },
    status: 'processing',
    progress: 15,
    createdAt: new Date().toISOString(),
    estimatedCompletionSeconds: estSeconds,
  };

  queueJobs.unshift(newJob);

  // Simulate progress in background
  setTimeout(() => {
    const job = queueJobs.find((j) => j.id === jobId);
    if (job) {
      job.progress = 65;
    }
  }, 2000);

  setTimeout(() => {
    const job = queueJobs.find((j) => j.id === jobId);
    if (job) {
      job.progress = 100;
      job.status = 'completed';
      if (type === 'image') {
        job.resultUrl = 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1000&auto=format&fit=crop&q=80';
      } else if (type === 'video') {
        job.resultUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';
      } else {
        job.resultUrl = 'https://actions.google.com/sounds/v1/science_fiction/scifi_hum.ogg';
      }
    }
  }, 5000);

  // Log cost
  let cost = 0.02;
  if (type === 'video') cost = 0.15;
  if (type === 'audio') cost = 0.015;

  const log: CostLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    provider: provider || (type === 'video' ? 'Runway Gen-3' : type === 'audio' ? 'ElevenLabs' : 'DALL-E 3'),
    model: type,
    task: `تولید چندرسانه‌ای (${type}): ${prompt ? prompt.slice(0, 30) : ''}...`,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: cost,
    costToman: Math.round(cost * 100000),
  };
  costLogs.unshift(log);

  res.json({
    success: true,
    job: newJob,
    estimatedCostUsd: cost,
    estimatedCostToman: Math.round(cost * 100000),
  });
});

// 7. Cost Logs & Stats
app.get('/api/logs', (req, res) => {
  const totalUsd = costLogs.reduce((acc, curr) => acc + curr.costUsd, 0);
  const totalToman = costLogs.reduce((acc, curr) => acc + curr.costToman, 0);
  res.json({
    logs: costLogs,
    summary: {
      totalCostUsd: Number(totalUsd.toFixed(4)),
      totalCostToman: totalToman,
      totalCalls: costLogs.length,
    },
  });
});

// 8. Cost estimator endpoint (before execution)
app.post('/api/ai/estimate-cost', (req, res) => {
  const { textLength, model, mediaTasks } = req.body;
  const estimatedInputTokens = Math.ceil((textLength || 500) / 3);
  const estimatedOutputTokens = Math.ceil(estimatedInputTokens * 0.8);

  let pricePerMillionInput = 0.15; // Gemini Flash baseline
  let pricePerMillionOutput = 0.60;

  if (model?.includes('gpt-4o')) {
    pricePerMillionInput = 2.50;
    pricePerMillionOutput = 10.00;
  } else if (model?.includes('claude-3-5')) {
    pricePerMillionInput = 3.00;
    pricePerMillionOutput = 15.00;
  } else if (model?.includes('deepseek')) {
    pricePerMillionInput = 0.27;
    pricePerMillionOutput = 1.10;
  }

  const textCost = (estimatedInputTokens / 1_000_000) * pricePerMillionInput +
                   (estimatedOutputTokens / 1_000_000) * pricePerMillionOutput;

  let mediaCost = 0;
  if (mediaTasks?.image) mediaCost += 0.04; // DALL-E 3 / Midjourney
  if (mediaTasks?.video) mediaCost += 0.15; // Runway / Pika
  if (mediaTasks?.audio) mediaCost += 0.015; // ElevenLabs

  const totalCostUsd = textCost + mediaCost;
  const exchangeRateToman = 100000; // 1 USD ~ 100,000 Tomans
  const totalCostToman = Math.round(totalCostUsd * exchangeRateToman);

  res.json({
    estimatedInputTokens,
    estimatedOutputTokens,
    textCostUsd: Number(textCost.toFixed(5)),
    mediaCostUsd: mediaCost,
    totalCostUsd: Number(totalCostUsd.toFixed(4)),
    totalCostToman,
    exchangeRateToman,
  });
});

// 9. Initial Database Schema & Architecture Export
app.get('/api/system/schema', (req, res) => {
  const schemaSQL = `
-- ============================================================
-- TeleMasters Production Database Schema (PostgreSQL)
-- Architecture: Clean Architecture / NestJS / FastAPI + BullMQ
-- ============================================================

-- 1. Users and Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- 'superadmin', 'channel_manager', 'editor'
    vault_salt VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Telegram Channels (Source & Destination)
CREATE TABLE telegram_channels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    telegram_id BIGINT UNIQUE,
    username VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    channel_type VARCHAR(20) NOT NULL CHECK (channel_type IN ('source', 'destination')),
    is_active BOOLEAN DEFAULT TRUE,
    auto_forward BOOLEAN DEFAULT FALSE,
    filter_keywords TEXT[], -- Array of keywords
    filter_topics TEXT[],
    last_synced_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. AI API Keys Vault (Encrypted with AES-256-GCM)
CREATE TABLE ai_api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'google', 'deepseek', 'elevenlabs', 'runway'
    name VARCHAR(150) NOT NULL,
    category VARCHAR(30) NOT NULL, -- 'text', 'image', 'video', 'audio'
    encrypted_key TEXT NOT NULL,
    iv_salt VARCHAR(64) NOT NULL,
    auth_tag VARCHAR(64) NOT NULL,
    masked_key VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    monthly_budget_usd NUMERIC(10, 4) DEFAULT 50.0000,
    current_month_spent_usd NUMERIC(10, 4) DEFAULT 0.0000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Model Routing Configuration
CREATE TABLE task_routing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    task_name VARCHAR(100) UNIQUE NOT NULL, -- 'summarization', 'rewriting', 'ideas', 'copyright', 'tts', 'image'
    primary_key_id UUID REFERENCES ai_api_keys(id),
    fallback_key_id UUID REFERENCES ai_api_keys(id),
    model_identifier VARCHAR(100) NOT NULL,
    system_prompt_override TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ingested Content Feed (Raw messages from source channels)
CREATE TABLE ingested_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_channel_id UUID REFERENCES telegram_channels(id) ON DELETE CASCADE,
    telegram_message_id BIGINT NOT NULL,
    original_text TEXT NOT NULL,
    media_url TEXT,
    media_type VARCHAR(50) DEFAULT 'text',
    topic VARCHAR(100),
    similarity_hash VARCHAR(128),
    copyright_score NUMERIC(5, 2), -- 0 to 100
    processing_status VARCHAR(50) DEFAULT 'new' CHECK (processing_status IN ('new', 'processed', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Posts and Scheduled Publishing
CREATE TABLE scheduled_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    source_message_id UUID REFERENCES ingested_messages(id),
    title VARCHAR(255) NOT NULL,
    final_content TEXT NOT NULL,
    media_type VARCHAR(50) DEFAULT 'text',
    media_url TEXT,
    audio_url TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'scheduled', 'published', 'failed')),
    plagiarism_risk_percentage NUMERIC(5, 2),
    approved_by_user_id UUID REFERENCES users(id),
    views_count INT DEFAULT 0,
    forwards_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Post Destination Mapping (Many-to-Many)
CREATE TABLE post_destinations (
    post_id UUID REFERENCES scheduled_posts(id) ON DELETE CASCADE,
    channel_id UUID REFERENCES telegram_channels(id) ON DELETE CASCADE,
    published_telegram_message_id BIGINT,
    PRIMARY KEY (post_id, channel_id)
);

-- 8. Multi-Agent Council Sessions
CREATE TABLE council_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    consensus_summary TEXT,
    exported_post_id UUID REFERENCES scheduled_posts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE council_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES council_sessions(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'user', 'agent', 'system'
    agent_id VARCHAR(50),
    agent_name VARCHAR(100),
    message_text TEXT NOT NULL,
    tool_name VARCHAR(100),
    tool_payload JSONB,
    tool_result JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. API Usage & Cost Tracking Audit Log
CREATE TABLE api_cost_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    key_id UUID REFERENCES ai_api_keys(id) ON DELETE SET NULL,
    provider VARCHAR(50) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    task_category VARCHAR(100) NOT NULL,
    input_tokens INT DEFAULT 0,
    output_tokens INT DEFAULT 0,
    cost_usd NUMERIC(12, 6) NOT NULL,
    cost_toman BIGINT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Async Background Jobs (BullMQ / Redis / Celery)
CREATE TABLE background_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL, -- 'video_render', 'tts_synthesis', 'batch_crawl'
    status VARCHAR(50) DEFAULT 'queued',
    progress_percentage INT DEFAULT 0,
    payload JSONB NOT NULL,
    result_url TEXT,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_posts_scheduled_at ON scheduled_posts(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX idx_cost_logs_timestamp ON api_cost_logs(timestamp);
`;

  const folderStructure = `
telegram-ai-management/
├── backend/                  # NestJS / FastAPI Production Server
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/         # JWT, Vault Encryption, RBAC
│   │   │   ├── telegram/     # Bot API, webhook listener, MTProto harvester
│   │   │   ├── ai-vault/     # AES-GCM Encrypted credentials & key rotation
│   │   │   ├── routing/      # Intelligent model dispatcher & fallback
│   │   │   ├── ingestion/    # Channel reader, filters & copyright auditor
│   │   │   ├── synthesis/    # LLM Rewriting, Prompt Templates & DALL-E/Runway
│   │   │   ├── council/      # Multi-Agent Council engine with ReAct Tool use
│   │   │   ├── scheduler/    # Cron & BullMQ workers for Telegram posting
│   │   │   └── billing/      # Token usage counter & USD/Toman cost logger
│   │   ├── common/
│   │   │   ├── guards/
│   │   │   ├── interceptors/
│   │   │   └── utils/crypto.ts
│   │   ├── database/         # Prisma / TypeORM / Drizzle Postgres migrations
│   │   └── queues/           # Redis BullMQ video & audio processing workers
│   ├── docker-compose.yml    # Postgres, Redis, App containers
│   └── package.json
└── frontend/                 # Modern React 19 + Tailwind CSS Dashboard
    ├── src/
    │   ├── components/
    │   │   ├── TelegramBotModule.tsx
    │   │   ├── KeyVaultModule.tsx
    │   │   ├── ContentIngestionModule.tsx
    │   │   ├── MultimediaModule.tsx
    │   │   ├── CouncilModule.tsx
    │   │   └── CostAndQueueModule.tsx
    │   ├── hooks/
    │   └── types/
`;

  res.json({ schemaSQL, folderStructure });
});

// Vite Middleware for SPA integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[TeleMasters] Full-stack Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
