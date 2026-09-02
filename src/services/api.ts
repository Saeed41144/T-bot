import {
  TelegramBotConfig,
  Channel,
  ScheduledPost,
  StoredKey,
  RoutingMatrix,
  IngestedMessage,
  PromptTemplate,
  CouncilAgent,
  CouncilMessage,
  CouncilConfig,
  CouncilEmergencySession,
  CouncilDeliberationSession,
  QueueJob,
  CostReport,
} from '../types';

export const api = {
  // Telegram Bot
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

  sendPostDirectly: async (data: { channelId?: string; postTitle?: string; text: string; mediaUrl?: string; mediaType?: string }) => {
    const res = await fetch('/api/telegram/send-post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Channels
  getChannels: async (): Promise<Channel[]> => {
    const res = await fetch('/api/channels');
    return res.json();
  },

  addChannel: async (channel: Partial<Channel>) => {
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

  // Posts
  getPosts: async (): Promise<ScheduledPost[]> => {
    const res = await fetch('/api/posts');
    return res.json();
  },

  createPost: async (post: Partial<ScheduledPost>) => {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    return res.json();
  },

  updatePost: async (id: string, post: Partial<ScheduledPost>) => {
    const res = await fetch(`/api/posts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(post),
    });
    return res.json();
  },

  deletePost: async (id: string) => {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Keys & Routing
  getKeys: async (): Promise<StoredKey[]> => {
    const res = await fetch('/api/keys');
    const data = await res.json();
    return data.keys || [];
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

  getRoutingMatrix: async (): Promise<RoutingMatrix> => {
    const res = await fetch('/api/keys');
    const data = await res.json();
    return data.routingMatrix;
  },

  updateRoutingRule: async (task: string, config: any) => {
    const res = await fetch('/api/keys/routing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task, config }),
    });
    return res.json();
  },

  // Ingestion & AI Processing
  getIngestedMessages: async (): Promise<IngestedMessage[]> => {
    const res = await fetch('/api/ingested');
    return res.json();
  },

  createIngestedMessage: async (data: { originalText: string; sourceChannelName?: string; topic?: string }) => {
    const res = await fetch('/api/ingested/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  analyzeImportance: async (messageId?: string) => {
    const res = await fetch('/api/ingested/analyze-importance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    });
    return res.json();
  },

  escalateToCouncil: async (messageId: string, roundsCount: number, customInstruction?: string) => {
    const res = await fetch('/api/ingested/escalate-to-council', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId, roundsCount, customInstruction }),
    });
    return res.json();
  },

  getTemplates: async (): Promise<PromptTemplate[]> => {
    const res = await fetch('/api/templates');
    return res.json();
  },

  processContent: async (data: { originalText: string; templateId?: string; targetTone?: string; customInstruction?: string }) => {
    const res = await fetch('/api/ai/process-content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Council of AI Agents
  getCouncil: async (): Promise<{
    agents: CouncilAgent[];
    messages: CouncilMessage[];
    config?: CouncilConfig;
    activeEmergencySession?: CouncilEmergencySession | null;
    activeDeliberationSession?: CouncilDeliberationSession | null;
  }> => {
    const res = await fetch('/api/council');
    return res.json();
  },

  sendCouncilMessage: async (text: string) => {
    const res = await fetch('/api/council/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    return res.json();
  },

  deliberateCouncil: async (data: {
    newsId?: string;
    newsTitle?: string;
    newsText: string;
    sourceChannel?: string;
    importanceScore?: number;
    roundsCount: number;
    customInstruction?: string;
  }) => {
    const res = await fetch('/api/council/deliberate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  triggerEmergencySession: async (topic?: string, isManual = true) => {
    const res = await fetch('/api/council/emergency-trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, isManual }),
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

  clearCouncilHistory: async () => {
    const res = await fetch('/api/council/clear', { method: 'POST' });
    return res.json();
  },

  publishCouncilDraft: async (postId: string, channelId?: string) => {
    const res = await fetch('/api/council/action/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, channelId }),
    });
    return res.json();
  },

  // Media & Queue
  getQueueJobs: async (): Promise<QueueJob[]> => {
    const res = await fetch('/api/queue');
    return res.json();
  },

  generateMedia: async (data: { type: 'image' | 'video' | 'audio'; prompt: string; provider?: string; style?: string; voice?: string }) => {
    const res = await fetch('/api/media/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Cost Reports
  getCostReport: async (): Promise<CostReport> => {
    const res = await fetch('/api/logs');
    const data = await res.json();
    return {
      totalTodayUsd: data.summary?.totalCostUsd || 0,
      totalTodayToman: data.summary?.totalCostToman || 0,
      logs: data.logs || [],
    };
  },

  estimateCost: async (data: { textLength: number; model?: string; mediaTasks?: string[] }) => {
    const res = await fetch('/api/ai/estimate-cost', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};
