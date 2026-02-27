import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, AlertCircle, TrendingUp, Share2, Trash2, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useContextStore } from '../store/useContextStore';
import MainLayout from '../components/MainLayout';
import EmptyStateDashboard from '../components/EmptyStateDashboard';
import DecisionModal from '../components/DecisionModal';
import FailureModal from '../components/FailureModal';
import { decisionService, getApiErrorMessage, metricsService } from '../services/api';
import type { Metrics, SimilarDecision } from '../types';

export default function DashboardPage() {
  const { contextId } = useParams<{ contextId: string }>();
  const navigate = useNavigate();
  const store = useContextStore();
  const [activeTab, setActiveTab] = useState<'decisions' | 'failures' | 'analytics'>('decisions');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [similarDecisions, setSimilarDecisions] = useState<SimilarDecision[]>([]);
  const [analyticsState, setAnalyticsState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [analyticsError, setAnalyticsError] = useState('');
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const handleDeleteDecision = async (decisionId: string) => {
    if (confirm('Are you sure you want to delete this decision?')) {
      try {
        await store.deleteDecision(decisionId);
      } catch (error: any) {
        // Check if it's a 404 (already deleted)
        if (error?.response?.status === 404) {
          alert('This decision has already been deleted');
        } else {
          alert('Failed to delete decision');
        }
      }
    }
  };

  const handleDeleteFailure = async (failureId: string) => {
    if (confirm('Are you sure you want to delete this failure?')) {
      try {
        await store.deleteFailure(failureId);
      } catch (error: any) {
        // Check if it's a 404 (already deleted)
        if (error?.response?.status === 404) {
          alert('This failure has already been deleted');
        } else {
          alert('Failed to delete failure');
        }
      }
    }
  };

  const handleDeleteProject = async () => {
    if (!store.activeContext) return;
    const projectName = store.activeContext.name;
    if (confirm(`Are you sure you want to delete "${projectName}"? This will delete all decisions and failures.`)) {
      try {
        await store.deleteProject(store.activeContext.id);
        navigate('/');
      } catch (error) {
        alert('Failed to delete project');
      }
    }
    setShowProjectMenu(false);
  };

  useEffect(() => {
    if (!contextId) return;
    store.fetchCurrentUser();
    const context = store.contexts.find((c) => c.id === contextId);
    if (context && context.id !== store.activeContext?.id) {
      store.setActiveContext(context);
    } else if (!store.activeContext && store.contexts.length === 0) {
      store.fetchContexts();
    }
  }, [contextId, store.contexts, store.activeContext?.id]);

  useEffect(() => {
    if (!store.activeContext?.id) return;
    const projectId = store.activeContext.id;

    const loadAnalytics = async () => {
      try {
        setAnalyticsState('loading');
        setAnalyticsError('');
        const nextMetrics = await metricsService.get(projectId);
        setMetrics(nextMetrics);
        if (store.decisions.length > 0) {
          const similar = await decisionService.getSimilar(projectId, store.decisions[0].id);
          setSimilarDecisions(similar);
        } else {
          setSimilarDecisions([]);
        }
        setAnalyticsState('success');
      } catch (error) {
        setAnalyticsState('error');
        setAnalyticsError(getApiErrorMessage(error));
      }
    };

    loadAnalytics();
  }, [store.activeContext?.id, store.decisions.length, store.failures.length]);

  if (!store.activeContext) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center text-[#8E8E93]">Loading project...</div>
      </MainLayout>
    );
  }

  const hasData = store.hasData();

  return (
    <MainLayout>
      <header className="h-16 border-b border-black/10 flex items-center justify-between px-8 bg-white/70 backdrop-blur-xl z-10 shrink-0">
        <h1 className="text-xl font-semibold text-[#1C1C1E] truncate pr-4">{store.activeContext.name}</h1>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => setIsFailureModalOpen(true)}
            className="bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/30 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <AlertCircle className="w-4 h-4" />
            Log Failure
          </button>
          <button
            onClick={() => setIsDecisionModalOpen(true)}
            className="bg-gradient-to-r from-[#FFB340] to-[#FF9500] hover:brightness-105 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Decision
          </button>
          <button
            onClick={() => navigate(`/graph/${store.activeContext?.id}`)}
            className="bg-white hover:bg-black/5 text-[#1C1C1E] border border-black/10 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Graph
          </button>
          <div className="relative">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="bg-white hover:bg-black/5 text-[#1C1C1E] border border-black/10 p-2 rounded-xl transition-colors"
              title="Project settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            {showProjectMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-black/10 rounded-xl shadow-lg overflow-hidden z-20">
                <button
                  onClick={handleDeleteProject}
                  className="w-full px-4 py-3 text-left text-sm text-[#FF3B30] hover:bg-[#FF3B30]/10 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Project
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col w-full overflow-hidden">
        {!hasData ? (
          <EmptyStateDashboard
            onAddDecision={() => setIsDecisionModalOpen(true)}
            onLogFailure={() => setIsFailureModalOpen(true)}
            onInviteTeam={() => navigate(`/team/${store.activeContext?.id}`)}
          />
        ) : (
          <>
            <div className="flex border-b border-black/10 shrink-0 px-8 pt-6 overflow-x-auto">
              {(['decisions', 'failures', 'analytics'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    'px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                    activeTab === tab
                      ? 'border-[#FF9500] text-[#FF9500]'
                      : 'border-transparent text-[#8E8E93] hover:text-[#1C1C1E]'
                  )}
                >
                  {tab === 'decisions' && `Decisions (${store.decisions.length})`}
                  {tab === 'failures' && `Failures (${store.failures.length})`}
                  {tab === 'analytics' && (
                    <span className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Insights
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {activeTab === 'decisions' && (
                <div className="max-w-5xl mx-auto space-y-4 pb-12">
                  {store.decisions.length === 0 && (
                    <div className="bg-white border border-black/10 rounded-2xl p-6 text-[#8E8E93]">
                      No decisions yet. Add your first decision to start building reusable context.
                    </div>
                  )}
                  {store.decisions.map((d) => (
                    <div key={d.id} className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] group relative">
                      <button
                        onClick={() => handleDeleteDecision(d.id)}
                        className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] rounded-lg"
                        title="Delete decision"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="flex justify-between mb-2 pr-12">
                        <h3 className="text-lg font-medium text-[#1C1C1E]">{d.title}</h3>
                        <span className="text-xs text-[#8E8E93] font-medium bg-[#F2F2F7] px-2 py-1 rounded">
                          By {d.author?.name || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-[#8E8E93] text-sm leading-relaxed">{d.rationale}</p>
                      {d.constraints && d.constraints.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {d.constraints.map((c, i) => (
                            <div key={i} className="text-sm rounded-lg p-2.5 bg-[#F1F4E8] border border-[#D8DFC2] text-[#6B7A3E]">
                              {c}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'failures' && (
                <div className="max-w-5xl mx-auto space-y-4 pb-12">
                  {store.failures.length === 0 && (
                    <div className="bg-white border border-black/10 rounded-2xl p-6 text-[#8E8E93]">
                      No failures logged yet. Capture one to improve future decisions.
                    </div>
                  )}
                  {store.failures.map((f) => (
                    <div key={f.id} className="bg-white border border-[#FFC8C4] rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)] group relative">
                      <button
                        onClick={() => handleDeleteFailure(f.id)}
                        className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] rounded-lg"
                        title="Delete failure"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <h3 className="text-lg font-medium text-[#FF3B30] mb-2 pr-12">{f.title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-[#FFEDEC] p-3 rounded-lg border border-[#FFC8C4]">
                          <div className="text-xs text-[#FF3B30] uppercase font-bold mb-1">What Failed</div>
                          <div className="text-sm text-[#1C1C1E]">{f.whatFailed}</div>
                        </div>
                        <div className="bg-[#FFEDEC] p-3 rounded-lg border border-[#FFC8C4]">
                          <div className="text-xs text-[#FF3B30] uppercase font-bold mb-1">Why Failed</div>
                          <div className="text-sm text-[#1C1C1E]">{f.whyFailed}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="max-w-5xl mx-auto space-y-6 pb-12">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-r from-[#FFB340] to-[#FF9500] text-white rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                      <div className="text-sm opacity-90 mb-2">Moat Score</div>
                      <div className="text-4xl font-bold">{metrics?.moatScore ?? 0}</div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-2xl p-5">
                      <div className="text-sm text-[#8E8E93] mb-2">Decisions</div>
                      <div className="text-3xl font-bold text-[#1C1C1E]">{metrics?.decisionsCount ?? store.decisions.length}</div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-2xl p-5">
                      <div className="text-sm text-[#8E8E93] mb-2">Failures</div>
                      <div className="text-3xl font-bold text-[#1C1C1E]">{metrics?.failuresCount ?? store.failures.length}</div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-2xl p-5">
                      <div className="text-sm text-[#8E8E93] mb-2">Reuse Rate</div>
                      <div className="text-3xl font-bold text-[#1C1C1E]">{metrics?.reuseRate ?? 0}%</div>
                    </div>
                  </div>

                  {analyticsState === 'error' && (
                    <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/30 rounded-xl p-4 text-[#FF3B30] text-sm">
                      {analyticsError}
                    </div>
                  )}

                  <div className="bg-white border border-black/10 rounded-2xl p-6">
                    <h3 className="text-[#1C1C1E] font-semibold mb-3">Trend</h3>
                    <div className="space-y-3">
                      {(metrics?.trend || []).map((point) => {
                        const total = point.decisions + point.failures;
                        const width = total ? Math.max(8, Math.round((point.decisions / total) * 100)) : 0;
                        return (
                          <div key={point.month}>
                            <div className="flex justify-between text-xs text-[#8E8E93] mb-1">
                              <span>{point.month}</span>
                              <span>D {point.decisions} / F {point.failures}</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-[#EAEAEE] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#FF9500] to-[#34C759]"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white border border-black/10 rounded-2xl p-6">
                    <h3 className="text-[#1C1C1E] font-semibold mb-3">Insights Feed</h3>
                    <div className="space-y-2">
                      {analyticsState === 'loading' && <p className="text-sm text-[#8E8E93]">Loading insights...</p>}
                      {analyticsState === 'success' && similarDecisions.length === 0 && (
                        <p className="text-sm text-[#8E8E93]">No similar decisions yet. Add more decisions to unlock reuse insights.</p>
                      )}
                      {similarDecisions.map((item) => (
                        <div key={item.id} className="rounded-lg border border-[#D8DFC2] bg-[#F1F4E8] p-3">
                          <div className="text-sm text-[#6B7A3E]">Similar: {item.title}</div>
                        </div>
                      ))}
                      {metrics && metrics.moatScore >= 60 && (
                        <div className="rounded-lg border border-[#34C759]/30 bg-[#34C759]/10 p-3 text-sm text-[#34C759]">
                          Success: Knowledge reuse is compounding.
                        </div>
                      )}
                      {metrics && metrics.failuresCount > metrics.decisionsCount && (
                        <div className="rounded-lg border border-[#FF9500]/30 bg-[#FF9500]/10 p-3 text-sm text-[#FF9500]">
                          Warning: Failures are outpacing decisions.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <DecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        onSubmit={store.logDecision}
        isLoading={store.isLoading}
      />
      <FailureModal
        isOpen={isFailureModalOpen}
        onClose={() => setIsFailureModalOpen(false)}
        onSubmit={store.logFailure}
        isLoading={store.isLoading}
      />
    </MainLayout>
  );
}
