export interface TelegramBotConfig {
  botToken: string;
  botUsername: string;
  botName: string;
  isConnected: boolean;
  status: string;
  webhookUrl: string;
}

export interface Channel {
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

export interface ScheduledPost {
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

export interface StoredKey {
  id: string;
  provider: string;
  name: string;
  category: 'text' | 'image' | 'video' | 'audio';
  maskedValue: string;
  isActive: boolean;
  lastTestedAt?: string;
  status: 'valid' | 'invalid' | 'untested';
}

export interface RoutingConfig {
  provider: string;
  model: string;
  label: string;
}

export interface RoutingMatrix {
  summarization: RoutingConfig;
  ideaGeneration: RoutingConfig;
  rewriting: RoutingConfig;
  copyrightAudit: RoutingConfig;
  audioScripting: RoutingConfig;
  imageGeneration: RoutingConfig;
  videoGeneration: RoutingConfig;
  voiceSynthesis: RoutingConfig;
}

export interface PromptTemplate {
  id: string;
  name: string;
  category: string;
  systemPrompt: string;
}

export interface IngestedMessage {
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

export interface CouncilConfig {
  autonomousModeEnabled: boolean;
  autoPublishOnConsensus: boolean;
  emergencyKeywords: string[];
  maxDeliberationRounds: number; // 0 for unlimited / until consensus
  studioAccessEnabled: boolean;
  channelPostingEnabled: boolean;
  channelMonitoringEnabled: boolean;
}

export interface CouncilEmergencySession {
  id: string;
  topic: string;
  triggerType: 'manual' | 'autonomous_breaking_news';
  status: 'active' | 'consensus_reached' | 'published';
  consensusText?: string;
  verificationReport?: {
    isVerified: boolean;
    sourcesCount: number;
    verdict: string;
    confidenceScore: number;
  };
  generatedMedia?: {
    type: 'image' | 'audio' | 'video';
    url: string;
    caption?: string;
  };
  roundsCount: number;
  startedAt: string;
  completedAt?: string;
  publishedPostId?: string;
}

export interface CouncilAgent {
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

export interface CouncilMessage {
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

export interface QueueJob {
  id: string;
  taskType: 'video_generation' | 'audio_synthesis' | 'batch_crawler' | 'ai_synthesis';
  title?: string;
  type?: string;
  provider?: string;
  result?: string;
  payload: any;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  completedAt?: string;
  estimatedCompletionSeconds: number;
  resultUrl?: string;
  error?: string;
}

export interface CostReport {
  totalTodayUsd: number;
  totalTodayToman: number;
  totalMonthUsd?: number;
  totalMonthToman?: number;
  byProvider: Record<string, { usd: number; toman: number; calls: number }>;
}

export interface CostLog {
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
