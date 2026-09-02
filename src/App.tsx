import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar, NavTab } from './components/Sidebar';
import { TelegramBotModule } from './components/TelegramBotModule';
import { KeyVaultModule } from './components/KeyVaultModule';
import { ContentIngestionModule } from './components/ContentIngestionModule';
import { MultimediaModule } from './components/MultimediaModule';
import { CouncilModule } from './components/CouncilModule';
import { CostAndQueueModule } from './components/CostAndQueueModule';
import { ArchitectureModal } from './components/ArchitectureModal';
import { api } from './services/api';
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
  QueueJob,
  CostReport,
} from './types';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('bot');
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Core Data States
  const [botConfig, setBotConfig] = useState<TelegramBotConfig | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [routingMatrix, setRoutingMatrix] = useState<RoutingMatrix>({} as any);
  const [ingestedMessages, setIngestedMessages] = useState<IngestedMessage[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [agents, setAgents] = useState<CouncilAgent[]>([]);
  const [councilMessages, setCouncilMessages] = useState<CouncilMessage[]>([]);
  const [councilConfig, setCouncilConfig] = useState<CouncilConfig | undefined>(undefined);
  const [activeEmergencySession, setActiveEmergencySession] = useState<CouncilEmergencySession | null>(null);
  const [jobs, setJobs] = useState<QueueJob[]>([]);
  const [costReport, setCostReport] = useState<CostReport | null>(null);

  const loadAllData = useCallback(async () => {
    try {
      const [
        botRes,
        chanRes,
        postRes,
        keyRes,
        routeRes,
        msgRes,
        tmplRes,
        councilRes,
        jobRes,
        costRes,
      ] = await Promise.all([
        api.getBotConfig(),
        api.getChannels(),
        api.getPosts(),
        api.getKeys(),
        api.getRoutingMatrix(),
        api.getIngestedMessages(),
        api.getTemplates(),
        api.getCouncil(),
        api.getQueueJobs(),
        api.getCostReport(),
      ]);

      setBotConfig(botRes);
      setChannels(chanRes);
      setPosts(postRes);
      setKeys(keyRes);
      setRoutingMatrix(routeRes);
      setIngestedMessages(msgRes);
      setTemplates(tmplRes);
      if (councilRes) {
        setAgents(councilRes.agents || []);
        setCouncilMessages(councilRes.messages || []);
        if (councilRes.config) setCouncilConfig(councilRes.config);
        setActiveEmergencySession(councilRes.activeEmergencySession || null);
      }
      setJobs(jobRes);
      setCostReport(costRes);
    } catch (err) {
      console.error('Error loading dashboard state:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    // Poll updates every 25 seconds
    const interval = setInterval(loadAllData, 25000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  const pendingReviewsCount = ingestedMessages.filter(
    (m) => m.processingStatus === 'pending'
  ).length;
  const scheduledPostsCount = posts.filter((p) => p.status === 'scheduled').length;
  const activeJobsCount = jobs.filter(
    (j) => j.status === 'processing' || j.status === 'queued'
  ).length;

  const destinationChannels = channels.filter((c) => c.type === 'destination');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3" dir="rtl">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-sm font-medium">در حال اتصال به پلتفرم هوشمند تله‌مسترز...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white" dir="rtl">
      {/* Header */}
      <Header
        botConfig={botConfig}
        totalCostUsd={costReport?.totalTodayUsd || 0}
        totalCostToman={costReport?.totalTodayToman || 0}
        onOpenArchitecture={() => setIsArchitectureOpen(true)}
      />

      {/* Main Container with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingReviewsCount={pendingReviewsCount}
          scheduledPostsCount={scheduledPostsCount}
          activeJobsCount={activeJobsCount}
        />

        {/* Viewport Content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950/90">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'bot' && (
              <TelegramBotModule
                botConfig={botConfig}
                channels={channels}
                posts={posts}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'keys' && (
              <KeyVaultModule
                keys={keys}
                routingMatrix={routingMatrix}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'ingest' && (
              <ContentIngestionModule
                ingestedMessages={ingestedMessages}
                templates={templates}
                destinationChannels={destinationChannels}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'media' && (
              <MultimediaModule
                destinationChannels={destinationChannels}
                onRefresh={loadAllData}
              />
            )}

            {activeTab === 'council' && (
              <CouncilModule
                agents={agents}
                messages={councilMessages}
                config={councilConfig}
                activeEmergencySession={activeEmergencySession}
                destinationChannels={destinationChannels}
                sourceChannels={channels.filter((c) => c.type === 'source')}
                onRefresh={loadAllData}
                onPostCreated={() => setActiveTab('bot')}
              />
            )}

            {activeTab === 'queue' && (
              <CostAndQueueModule
                jobs={jobs}
                costReport={costReport}
                onRefresh={loadAllData}
              />
            )}
          </div>
        </main>
      </div>

      {/* Technical Architecture & Database Schema Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />
    </div>
  );
}
