import {
  TelegramBotConfig,
  Channel,
  ScheduledPost,
  StoredKey,
  RoutingMatrix,
  PromptTemplate,
  IngestedMessage,
  CouncilAgent,
  CouncilMessage,
  CouncilConfig,
  CouncilEmergencySession,
  QueueJob,
  CostLog,
} from '../types';

export const api = {
  // Telegram Bot
  getBotStatus: async (): Promise<TelegramBotConfig> => {
    const res = await fetch('/api/telegram/status');
    return res.json();
  },

  getBotConfig: async (): Promise<TelegramBotConfig> => {
    const res = await fetch('/api/telegram/status');
    return res.json();
  },

  updateBotConfig: async (config: { botToken?: string; botUsername?: string; botName?: string }) => {
    const res = await fetch('/api/telegram/update-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  sendPostDirectly: async (payload: {
    channelId?: string;
    postTitle?: string;
    text: string;
    mediaUrl?: string;
    mediaType?: string;
  }) => {
    const res = await fetch('/api/telegram/send-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Channels
  getChannels: async (): Promise<Channel[]> => {
    const res = await fetch('/api/channels');
    return res.json();
  },

  addChannel: async (channel: Partial<Channel>): Promise<{ success: boolean; channel: Channel }> => {
    const res = await fetch('/api/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(channel),
    });
    return res.json();
  },

  deleteChannel: async (id: string) => {
    const res = await fetch(`/api/channels/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Posts & Scheduler
  getPosts: async (): Promise<ScheduledPost[]> => {
    const res = await fetch('/api/posts');
    return res.json();
  },

  createPost: async (post: Partial<ScheduledPost>): Promise<{ success: boolean; post: ScheduledPost }> => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    return res.json();
  },

  updatePost: async (id: string, updates: Partial<ScheduledPost>): Promise<{ success: boolean; post: ScheduledPost }> => {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    return res.json();
  },

  deletePost: async (id: string) => {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Keys & Routing
  getKeys: async (): Promise<{ keys: StoredKey[]; routingMatrix: RoutingMatrix }> => {
    const res = await fetch('/api/keys');
    return res.json();
  },

  getRoutingMatrix: async (): Promise<RoutingMatrix> => {
    const res = await fetch('/api/keys');
    const data = await res.json();
    return data.routingMatrix;
  },

  addKey: async (keyData: { provider: string; name: string; category: string; plainKeyValue: string }) => {
    const res = await fetch('/api/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(keyData),
    });
    return res.json();
  },

  deleteKey: async (id: string) => {
    const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    return res.json();
  },

  testKey: async (id: string) => {
    const res = await fetch('/api/keys/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    return res.json();
  },

  updateRouting: async (task: string, config: any) => {
    const res = await fetch('/api/keys/routing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, config }),
    });
    return res.json();
  },

  // Content Ingestion & AI
  getIngestedMessages: async (): Promise<IngestedMessage[]> => {
    const res = await fetch('/api/ingested');
    return res.json();
  },

  getTemplates: async (): Promise<PromptTemplate[]> => {
    const res = await fetch('/api/templates');
    return res.json();
  },

  addTemplate: async (template: { name: string; category: string; systemPrompt: string }) => {
    const res = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(template),
    });
    return res.json();
  },

  processContentAI: async (payload: {
    originalText: string;
    templateId?: string;
    customInstruction?: string;
    targetTone?: string;
  }) => {
    const res = await fetch('/api/ai/process-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Council
  getCouncil: async (): Promise<{
    agents: CouncilAgent[];
    messages: CouncilMessage[];
    config?: CouncilConfig;
    activeEmergencySession?: CouncilEmergencySession;
  }> => {
    const res = await fetch('/api/council');
    return res.json();
  },

  getCouncilAgents: async (): Promise<CouncilAgent[]> => {
    const res = await fetch('/api/council');
    const data = await res.json();
    return data.agents;
  },

  getCouncilMessages: async (): Promise<CouncilMessage[]> => {
    const res = await fetch('/api/council');
    const data = await res.json();
    return data.messages;
  },

  sendCouncilMessage: async (text: string) => {
    const res = await fetch('/api/council/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  updateCouncilConfig: async (config: Partial<CouncilConfig>) => {
    const res = await fetch('/api/council/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
  },

  triggerEmergencySession: async (payload: { topic?: string; isManual?: boolean }) => {
    const res = await fetch('/api/council/emergency-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  publishCouncilDraft: async (payload: { postId: string; channelId?: string }) => {
    const res = await fetch('/api/council/action/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  clearCouncilHistory: async () => {
    const res = await fetch('/api/council/clear', { method: 'POST' });
    return res.json();
  },

  // Multimedia & Queue
  getQueue: async (): Promise<QueueJob[]> => {
    const res = await fetch('/api/queue');
    return res.json();
  },

  getQueueJobs: async (): Promise<QueueJob[]> => {
    const res = await fetch('/api/queue');
    return res.json();
  },

  generateMedia: async (payload: {
    type: 'image' | 'video' | 'audio';
    prompt: string;
    provider?: string;
    style?: string;
    voice?: string;
  }) => {
    const res = await fetch('/api/media/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Cost & Logs
  getCostLogs: async (): Promise<{ logs: CostLog[]; summary: { totalCostUsd: number; totalCostToman: number; totalCalls: number } }> => {
    const res = await fetch('/api/logs');
    return res.json();
  },

  getCostReport: async () => {
    const res = await fetch('/api/logs');
    const data = await res.json();
    const logs: CostLog[] = data.logs || [];
    const byProvider: Record<string, { usd: number; toman: number; calls: number }> = {};

    logs.forEach((log) => {
      const p = log.provider || 'Other';
      if (!byProvider[p]) {
        byProvider[p] = { usd: 0, toman: 0, calls: 0 };
      }
      byProvider[p].usd += log.costUsd;
      byProvider[p].toman += log.costToman;
      byProvider[p].calls += 1;
    });

    return {
      totalTodayUsd: data.summary?.totalCostUsd || 0.048,
      totalTodayToman: data.summary?.totalCostToman || 4800,
      totalMonthUsd: (data.summary?.totalCostUsd || 0.048) * 26,
      totalMonthToman: (data.summary?.totalCostToman || 4800) * 26,
      byProvider,
    };
  },

  estimateCost: async (payload: { textLength: number; model?: string; mediaTasks?: { image?: boolean; video?: boolean; audio?: boolean } }) => {
    const res = await fetch('/api/ai/estimate-cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.json();
  },

  // Architecture
  getArchitectureSchema: async () => {
    const res = await fetch('/api/system/schema');
    return res.json();
  },
};
