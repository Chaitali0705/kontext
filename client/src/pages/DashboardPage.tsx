import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, AlertCircle, TrendingUp, Share2, Trash2, Settings } from 'lucide-react';
import clsx from 'clsx';
import { useContextStore } from '../store/useContextStore';
import MainLayout from '../components/MainLayout';
import EmptyStateDashboard from '../components/EmptyStateDashboard';
import DecisionModal from '../components/DecisionModal';
import FailureModal from '../components/FailureModal';
import { getApiErrorMessage, metricsService } from '../services/api';
import type { Metrics } from '../types';

export default function DashboardPage() {
  const { contextId } = useParams<{ contextId: string }>();
  const navigate = useNavigate();
  const store = useContextStore();
  const [activeTab, setActiveTab] = useState<'decisions' | 'failures' | 'analytics'>('decisions');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [analyticsState, setAnalyticsState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [analyticsError, setAnalyticsError] = useState('');
  const [showProjectMenu, setShowProjectMenu] = useState(false);

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

  const handleDeleteFailure = async (failureId: string) => {
    if (confirm('Are you sure you want to delete this failure? This action cannot be undone.')) {
      try {
        await store.deleteFailure(failureId);
      } catch (error) {
        alert('Failed to delete failure. Please try again.');
      }
    }
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
      <header className="backdrop-blur-xl border-b border-black/10 flex items-center justify-between px-8 py-5 z-10 shrink-0"
               style={{ 
                 backgroundColor: 'rgba(255, 255, 255, 0.8)'
               }}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1C1C1E]">{store.activeContext.name}</h1>
          <p className="text-xs font-semibold text-[#8E8E93] mt-0.5">
            {store.decisions.length} decisions • {store.failures.length} failures
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={() => setIsFailureModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95"
            style={{ 
              backgroundColor: 'transparent',
              border: '2px solid #FF3B30',
              color: '#FF3B30'
            }}
          >
            <AlertCircle className="w-4 h-4" />
            Log Failure
          </button>
          <button
            onClick={() => setIsDecisionModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95 shadow-lg"
            style={{ 
              background: 'linear-gradient(135deg, #FF9500 0%, #FFAA33 100%)',
              color: 'white',
            }}
          >
            <Plus className="w-4 h-4" />
            Log Decision
          </button>
          <button
            onClick={() => navigate(`/graph/${store.activeContext?.id}`)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all active:scale-95"
            style={{ 
              backgroundColor: 'rgba(0, 0, 0, 0.05)',
              color: '#1C1C1E',
            }}
          >
            <Share2 className="w-4 h-4" />
            Graph
          </button>
          <div className="relative ml-2">
            <button
              onClick={() => setShowProjectMenu(!showProjectMenu)}
              className="flex items-center justify-center w-10 h-10 rounded-full transition-all active:scale-90"
              style={{ 
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                color: '#1C1C1E',
              }}
              title="Project settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            {showProjectMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-black/10 rounded-2xl shadow-xl overflow-hidden z-20">
                <button
                  onClick={handleDeleteProject}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-[#FF3B30] hover:bg-[#FF3B30]/10 flex items-center gap-2 transition-colors"
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
        {/* Tabs - Always Visible */}
        <div className="relative border-b-2 border-[#E5E5EA] shrink-0 px-8 pt-6 overflow-x-auto" style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          {/* Sliding Indicator */}
          <div
            className="absolute bottom-0 left-0 h-1 bg-[#FF9500] transition-all duration-300 ease-out"
            style={{
              width: activeTab === 'decisions' ? '110px' : activeTab === 'failures' ? '100px' : '75px',
              transform: activeTab === 'decisions' ? 'translateX(32px)' : activeTab === 'failures' ? 'translateX(160px)' : 'translateX(295px)'
            }}
          />
          
          <div className="flex gap-8">
            {(['decisions', 'failures', 'analytics'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={clsx(
                  'pb-4 text-sm font-semibold transition-colors whitespace-nowrap relative',
                  activeTab === tab
                    ? 'text-[#FF9500]'
                    : 'text-[#8E8E93] hover:text-[#1C1C1E]'
                )}
                style={{
                  paddingLeft: 0,
                  paddingRight: 0
                }}
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
        </div>

        {/* Content - Changes based on active tab and data */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {activeTab === 'decisions' && !hasData ? (
            <EmptyStateDashboard
              onAddDecision={() => setIsDecisionModalOpen(true)}
              onLogFailure={() => setIsFailureModalOpen(true)}
              onInviteTeam={() => navigate(`/team/${store.activeContext?.id}`)}
            />
          ) : activeTab === 'decisions' && hasData ? (
            <div className="max-w-7xl mx-auto w-full pb-12 grid grid-cols-3 gap-6">
                  {/* Left: Decision List */}
                  <div className="col-span-1 h-[calc(100vh-250px)] overflow-y-auto space-y-3">
                    <h3 className="text-lg font-bold text-[#1C1C1E] px-4 sticky top-0 bg-white/80 backdrop-blur py-2">
                      Decisions
                    </h3>
                    {store.decisions.length === 0 ? (
                      <div className="bg-white border border-black/10 rounded-2xl p-6 m-4 text-[#8E8E93] text-sm">
                        No decisions yet. Add your first decision to start building reusable context.
                      </div>
                    ) : (
                      store.decisions.map((d, idx) => {
                        const reuseCount = store.decisions.filter((other, oidx) => {
                          if (oidx >= idx) return false;
                          const tagsOverlap = (other.tags || []).some((tag: string) => (d.tags || []).includes(tag));
                          const constraintsOverlap = (other.constraints || []).some((c: string) => (d.constraints || []).includes(c));
                          return tagsOverlap || constraintsOverlap;
                        }).length;
                        return (
                          <div
                            key={d.id}
                            className="bg-white border border-black/10 rounded-2xl p-4 m-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-all cursor-pointer group"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-semibold text-sm text-[#1C1C1E] group-hover:text-[#FF9500] transition-colors flex-1">
                                {d.title}
                              </h4>
                              {reuseCount > 0 && (
                                <span className="text-xs font-bold text-[#34C759] bg-[#34C759]/10 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                                  ↻ {reuseCount}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#8E8E93]">{d.rationale?.slice(0, 60)}...</p>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Right: Decision Details & Risk Analysis */}
                  <div className="col-span-2 h-[calc(100vh-250px)] overflow-y-auto space-y-6">
                    {store.decisions.length === 0 ? (
                      <div className="bg-white border border-black/10 rounded-3xl p-8 text-center text-[#8E8E93]">
                        <p>Select a decision to view details</p>
                      </div>
                    ) : (
                      <>
                        {/* Bus Factor Analysis */}
                        <div className="bg-white border-l-4 border-l-[#FF3B30] rounded-3xl p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-[#FF3B30]/10 rounded-2xl flex items-center justify-center text-xl">
                                👥
                              </div>
                              <h3 className="text-xl font-bold text-[#1C1C1E]">Team Risk Analysis (Bus Factor)</h3>
                            </div>
                            <span className="px-3 py-1 bg-[#FF3B30] text-white text-xs font-bold rounded-full">
                              CRITICAL RISK
                            </span>
                          </div>
                          <p className="text-sm text-[#8E8E93] mb-4">
                            The "Bus Factor" measures the concentration of information. If a key team member leaves, how much context do you lose?
                          </p>
                          <div className="bg-[#FFE5E0] border border-[#FFCCC4] rounded-2xl p-4">
                            <p className="text-sm text-[#1C1C1E]">
                              <span className="font-semibold">If Alice Engineer leaves tomorrow</span>, your team loses <span className="font-bold text-[#FF3B30]">100%</span> of its architectural context.
                            </p>
                          </div>
                        </div>

                        {/* Recent Insights */}
                        <div className="bg-white rounded-3xl p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                          <h3 className="text-xl font-bold text-[#1C1C1E] mb-4 flex items-center gap-2">
                            💡 Recent Insights
                          </h3>
                          <div className="space-y-3">
                            {/* Similar Decision Found */}
                            <div className="bg-[#F8EDFF] border border-[#E5C7FF] rounded-2xl p-5 flex gap-4">
                              <div className="text-3xl">💬</div>
                              <div className="flex-1">
                                <p className="font-semibold text-[#1C1C1E] text-sm mb-1">
                                  Similar decision found: Auth provider selection from 3 months ago
                                </p>
                                <button className="text-xs font-semibold text-[#9945FF] hover:underline">
                                  View context →
                                </button>
                              </div>
                            </div>

                            {/* Failure Avoided */}
                            <div className="bg-[#E8F6F0] border border-[#A8E6D5] rounded-2xl p-5 flex gap-4">
                              <div className="text-3xl">✅</div>
                              <div className="flex-1">
                                <p className="font-semibold text-[#1C1C1E] text-sm mb-1">
                                  Failure avoided: Team referenced Instagram Ads mistake before spending $5,000
                                </p>
                                <button className="text-xs font-semibold text-[#34C759] hover:underline">
                                  See details →
                                </button>
                              </div>
                            </div>

                            {/* Warning */}
                            <div className="bg-[#FFFBE6] border border-[#FFE58F] rounded-2xl p-5 flex gap-4">
                              <div className="text-3xl">⚠️</div>
                              <div className="flex-1">
                                <p className="font-semibold text-[#1C1C1E] text-sm mb-1">
                                  Warning: This decision assumes US-only customers (verify assumption)
                                </p>
                                <button className="text-xs font-semibold text-[#FF9500] hover:underline">
                                  Check assumption →
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : null}

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
                <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 pb-12">
                  {/* Top Metric Cards */}
                  <div className="grid md:grid-cols-3 gap-6">
                    {/* Decisions Card */}
                    <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-16 h-16 bg-[#FFE8CC] rounded-2xl flex items-center justify-center text-2xl">📦</div>
                      </div>
                      <div className="text-5xl font-bold text-[#1C1C1E] mb-1">{metrics?.decisionsCount ?? store.decisions.length}</div>
                      <div className="text-lg font-medium text-[#8E8E93] mb-2">Decisions Logged</div>
                      <div className="text-sm text-[#FF9500] font-semibold">Reused {Math.round((metrics?.decisionsCount || 0) * (metrics?.reuseRate || 0) / 100)} times</div>
                    </div>

                    {/* Failures Card */}
                    <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-16 h-16 bg-[#FFEDEC] rounded-2xl flex items-center justify-center text-2xl">⚠️</div>
                      </div>
                      <div className="text-5xl font-bold text-[#1C1C1E] mb-1">{metrics?.failuresCount ?? store.failures.length}</div>
                      <div className="text-lg font-medium text-[#8E8E93] mb-2">Failures Documented</div>
                      <div className="text-sm text-[#FF3B30] font-semibold">Avoided {Math.max(0, (metrics?.decisionsCount || 0) - (metrics?.failuresCount || 0))} repeats</div>
                    </div>

                    {/* Time Saved Card */}
                    <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                      <div className="flex items-start justify-between mb-6">
                        <div className="w-16 h-16 bg-[#E8F5E9] rounded-2xl flex items-center justify-center text-2xl">⏱️</div>
                      </div>
                      <div className="text-5xl font-bold text-[#1C1C1E] mb-1">{metrics?.timeSavedHours ?? 0}h</div>
                      <div className="text-lg font-medium text-[#8E8E93] mb-2">Time Saved</div>
                      <div className="text-sm text-[#34C759] font-semibold">Saved {metrics?.timeSavedDays ?? 0} days of work</div>
                    </div>
                  </div>

                  {/* Decision Velocity Section */}
                  <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-[#1C1C1E] flex items-center gap-2">
                          <span className="text-2xl">📊</span>Decision Velocity
                        </h3>
                        <p className="text-sm text-[#8E8E93] mt-1">How fast your team learns over time</p>
                      </div>
                      <div className="text-2xl text-[#34C759]">📈</div>
                    </div>
                    <div className="space-y-4">
                      {(metrics?.trend || []).map((point) => {
                        const total = point.decisions + point.failures;
                        const width = total ? Math.max(8, Math.round((point.decisions / total) * 100)) : 0;
                        return (
                          <div key={point.month} className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium text-[#1C1C1E]">{point.month}</span>
                              <span className="text-xs text-[#8E8E93]">D {point.decisions} / F {point.failures}</span>
                            </div>
                            <div className="h-3 rounded-full bg-[#F2F2F7] overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-[#FF9500] to-[#34C759] rounded-full transition-all duration-500"
                                style={{ width: `${width}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Insights Section */}
                  <div className="bg-white border border-black/10 rounded-3xl p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                    <h3 className="text-2xl font-bold text-[#1C1C1E] mb-6 flex items-center gap-2">
                      <span className="text-2xl">💡</span>Recent Insights
                    </h3>
                    <div className="space-y-3">
                      {analyticsState === 'loading' && <p className="text-sm text-[#8E8E93]">Loading insights...</p>}
                      {metrics?.insights && metrics.insights.length > 0 ? (
                        metrics.insights.map((insight, idx) => {
                          const iconMap = {
                            success: '✅',
                            warning: '⚠️',
                            info: 'ℹ️'
                          };
                          return (
                            <div
                              key={idx}
                              className="p-4 rounded-2xl border border-black/10 bg-[#F8F8FB] hover:bg-[#F2F2F7] transition-colors"
                            >
                              <div className="flex items-start gap-3">
                                <span className="text-2xl shrink-0">{iconMap[insight.type]}</span>
                                <p className="text-sm text-[#1C1C1E] flex-1">{insight.message}</p>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-6 text-center text-[#8E8E93] bg-[#F8F8FB] rounded-2xl">
                          <p className="text-sm">Add more decisions and failures to unlock insights.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {analyticsState === 'error' && (
                    <div className="bg-[#FF3B30]/10 border border-[#FF3B30]/30 rounded-2xl p-4 text-[#FF3B30] text-sm">
                      {analyticsError}
                    </div>
                  )}
                </div>
              )}
        </div>
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
