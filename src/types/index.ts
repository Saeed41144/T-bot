export type NavTab = 'bot' | 'keys' | 'ingest' | 'media' | 'council' | 'queue';

export interface TelegramBotConfig {
  botToken: string;
  botUsername: string;
  botName: string;
  isConnected: boolean;
  status: 'online' | 'offline' | 'error';
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
  telegramId?: string;
}

export interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  mediaType: 'text' | 'photo' | 'video' | 'audio' | 'mixed';
  mediaUrl?: string;
  audioUrl?: string;
  destinationChannelIds?: string[];
  targetChannelIds?: string[];
  scheduledAt?: string;
  scheduledTime?: string;
  status: 'draft' | 'pending_review' | 'scheduled' | 'published' | 'failed';
  originalSourceId?: string;
  plagiarismRiskScore?: number;
  similarityScore?: number;
  approvedByCouncil?: boolean;
  councilConsensusVotes?: number;
  tags?: string[];
  views?: number;
  costEstimatedUsd?: number;
}

export interface StoredKey {
  id: string;
  provider: string;
  name: string;
  category: 'text' | 'image' | 'video' | 'audio';
  encryptedValue: string;
  maskedValue: string;
  isActive: boolean;
  lastTestedAt?: string;
  status: 'valid' | 'invalid' | 'untested';
}

export interface RoutingRule {
  provider: string;
  model: string;
  label: string;
}

export interface RoutingMatrix {
  summarization: RoutingRule;
  ideaGeneration: RoutingRule;
  rewriting: RoutingRule;
  copyrightAudit: RoutingRule;
  audioScripting: RoutingRule;
  imageGeneration: RoutingRule;
  videoGeneration: RoutingRule;
  voiceSynthesis: RoutingRule;
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
  processingStatus: 'new' | 'rewritten' | 'approved' | 'rejected' | 'pending' | 'in_council' | 'council_approved' | 'council_rejected';
  rewrittenText?: string;
  copyrightStatus: 'safe' | 'attribution_needed' | 'high_similarity';
  similarityPercentage: number;
  importanceScore?: number;
  urgencyLevel?: 'critical' | 'high' | 'normal' | 'low';
  isImportant?: boolean;
  importanceReason?: string;
  factCredibilityScore?: number;
  councilVerdict?: 'approved' | 'rejected' | 'revised';
  councilDeliberationId?: string;
  councilRounds?: number;
  councilDecisionSummary?: string;
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
  roundNumber?: number;
  totalRounds?: number;
  replyingToAgentName?: string;
  replyingToQuote?: string;
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
  isDeliberationSessionMessage?: boolean;
  sourceMessageId?: string;
}

export interface CouncilDeliberationSession {
  id: string;
  sourceMessageId?: string;
  newsTitle: string;
  newsText: string;
  sourceChannelName: string;
  importanceScore?: number;
  urgencyLevel?: 'critical' | 'high' | 'normal' | 'low';
  roundsCount: number;
  status: 'deliberating' | 'decided' | 'published';
  verdict: 'approved' | 'rejected' | 'revised';
  verdictSummary: string;
  votes: {
    approve: number;
    reject: number;
    revise: number;
  };
  telegramDraft?: string;
  mediaAttachment?: {
    type: 'image' | 'audio';
    url: string;
  };
  publishedPostId?: string;
  startedAt: string;
  completedAt?: string;
}

export interface CouncilConfig {
  autonomousModeEnabled: boolean;
  autoPublishOnConsensus: boolean;
  emergencyKeywords: string[];
  maxDeliberationRounds: number;
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
    caption: string;
  };
  roundsCount?: number;
  startedAt: string;
  completedAt?: string;
  publishedPostId?: string;
}

export interface QueueJob {
  id: string;
  taskType: 'video_generation' | 'audio_synthesis' | 'batch_crawler' | 'ai_synthesis';
  title?: string;
  payload: any;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  estimatedCompletionSeconds: number;
  resultUrl?: string;
  error?: string;
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

export interface CostReport {
  totalTodayUsd: number;
  totalTodayToman: number;
  logs: CostLog[];
}
