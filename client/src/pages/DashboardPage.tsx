import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, AlertCircle, TrendingUp, Share2, Trash2, Settings, BrainCircuit } from 'lucide-react';
import clsx from 'clsx';
import { useContextStore } from '../store/useContextStore';
import MainLayout from '../components/MainLayout';
import EmptyStateDashboard from '../components/EmptyStateDashboard';
import DecisionModal from '../components/DecisionModal';
import FailureModal from '../components/FailureModal';

export default function DashboardPage() {
  const { contextId } = useParams<{ contextId: string }>();
  const navigate = useNavigate();
  const store = useContextStore();
  
  const [activeTab, setActiveTab] = useState<'decisions' | 'failures' | 'analytics'>('decisions');
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);

  const handleDeleteDecision = async (decisionId: string) => {
    if (confirm('Are you sure you want to delete this decision?')) await store.deleteDecision(decisionId);
  };

  const handleDeleteFailure = async (failureId: string) => {
    if (confirm('Are you sure you want to delete this failure?')) await store.deleteFailure(failureId);
  };

  const handleDeleteProject = async () => {
    if (!store.activeContext) return;
    if (confirm(`Are you sure you want to delete "${store.activeContext.name}"?`)) {
      await store.deleteProject(store.activeContext.id);
      navigate('/');
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
  }, [contextId, store.contexts.length]);

  if (!store.activeContext) return (<MainLayout><div className="flex-1 flex items-center justify-center text-[#8E8E93]">Loading project...</div></MainLayout>);

  const hasData = store.hasData();
  
  // Local Metric Calculation for Hackathon Demo
  const moatScore = Math.min(100, (store.decisions.length * 5) + (store.failures.length * 10));

  return (
    <MainLayout>
      <header className="h-16 border-b border-black/10 flex items-center justify-between px-8 bg-white/70 backdrop-blur-xl z-10 shrink-0">
        <h1 className="text-xl font-semibold text-[#1C1C1E] truncate pr-4">{store.activeContext.name}</h1>
        <div className="flex gap-2 shrink-0">
          <button onClick={() => setIsFailureModalOpen(true)} className="bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/30 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"><AlertCircle className="w-4 h-4" /> Log Failure</button>
          <button onClick={() => setIsDecisionModalOpen(true)} className="bg-gradient-to-r from-[#FFB340] to-[#FF9500] hover:brightness-105 text-white px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all"><Plus className="w-4 h-4" /> Add Decision</button>
          <button onClick={() => navigate(`/graph/${store.activeContext?.id}`)} className="bg-white hover:bg-black/5 text-[#1C1C1E] border border-black/10 px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-colors"><Share2 className="w-4 h-4" /> Graph</button>
          <div className="relative">
            <button onClick={() => setShowProjectMenu(!showProjectMenu)} className="bg-white hover:bg-black/5 text-[#1C1C1E] border border-black/10 p-2 rounded-xl transition-colors"><Settings className="w-5 h-5" /></button>
            {showProjectMenu && (<div className="absolute right-0 mt-2 w-48 bg-white border border-black/10 rounded-xl shadow-lg overflow-hidden z-20"><button onClick={handleDeleteProject} className="w-full px-4 py-3 text-left text-sm text-[#FF3B30] hover:bg-[#FF3B30]/10 flex items-center gap-2 transition-colors"><Trash2 className="w-4 h-4" /> Delete Project</button></div>)}
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col w-full overflow-hidden">
        {!hasData ? (
          <EmptyStateDashboard onAddDecision={() => setIsDecisionModalOpen(true)} onLogFailure={() => setIsFailureModalOpen(true)} onInviteTeam={() => navigate(`/team/${store.activeContext?.id}`)} />
        ) : (
          <>
            <div className="flex border-b border-black/10 shrink-0 px-8 pt-6 overflow-x-auto">
              {(['decisions', 'failures', 'analytics'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={clsx('px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap', activeTab === tab ? 'border-[#FF9500] text-[#FF9500]' : 'border-transparent text-[#8E8E93] hover:text-[#1C1C1E]')}>
                  {tab === 'decisions' && `Decisions (${store.decisions.length})`}
                  {tab === 'failures' && `Failures (${store.failures.length})`}
                  {tab === 'analytics' && (<span className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Insights</span>)}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-6">
              {activeTab === 'decisions' && (
                <div className="max-w-5xl mx-auto space-y-4 pb-12">
                  {store.decisions.map((d) => (
                    <div key={d.id} className="bg-white border border-black/10 rounded-2xl p-6 shadow-soft group relative">
                      <button onClick={() => handleDeleteDecision(d.id)} className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      <div className="flex justify-between mb-2 pr-12"><h3 className="text-lg font-medium text-[#1C1C1E]">{d.title}</h3><span className="text-xs text-[#8E8E93] font-medium bg-[#F2F2F7] px-2 py-1 rounded">By {d.author?.name || 'Engineer'}</span></div>
                      <p className="text-[#8E8E93] text-sm leading-relaxed">{d.rationale}</p>
                      {d.constraints && d.constraints.length > 0 && (<div className="mt-4 space-y-2">{d.constraints.map((c, i) => (<div key={i} className="text-sm rounded-lg p-2.5 bg-[#F1F4E8] border border-[#D8DFC2] text-[#6B7A3E]">{c}</div>))}</div>)}
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'failures' && (
                <div className="max-w-5xl mx-auto space-y-4 pb-12">
                  {store.failures.map((f) => (
                    <div key={f.id} className="bg-white border border-[#FFC8C4] rounded-2xl p-6 shadow-soft group relative">
                      <button onClick={() => handleDeleteFailure(f.id)} className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] rounded-lg"><Trash2 className="w-4 h-4" /></button>
                      <h3 className="text-lg font-medium text-[#FF3B30] mb-2 pr-12">{f.title}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="bg-[#FFEDEC] p-3 rounded-lg border border-[#FFC8C4]"><div className="text-xs text-[#FF3B30] uppercase font-bold mb-1">What Failed</div><div className="text-sm text-[#1C1C1E]">{f.whatFailed}</div></div><div className="bg-[#FFEDEC] p-3 rounded-lg border border-[#FFC8C4]"><div className="text-xs text-[#FF3B30] uppercase font-bold mb-1">Why Failed</div><div className="text-sm text-[#1C1C1E]">{f.whyFailed}</div></div></div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'analytics' && (
                <div className="max-w-5xl mx-auto space-y-6 pb-12">
                  
                  {/* Top Stats Row */}
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-r from-[#FFB340] to-[#FF9500] text-white rounded-2xl p-5 shadow-soft">
                      <div className="text-sm opacity-90 mb-2">Moat Score</div>
                      <div className="text-4xl font-bold">{moatScore}</div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-2xl p-5">
                      <div className="text-sm text-[#8E8E93] mb-2">Decisions</div>
                      <div className="text-3xl font-bold text-[#1C1C1E]">{store.decisions.length}</div>
                    </div>
                    <div className="bg-white border border-black/10 rounded-2xl p-5">
                      <div className="text-sm text-[#8E8E93] mb-2">Failures</div>
                      <div className="text-3xl font-bold text-[#1C1C1E]">{store.failures.length}</div>
                    </div>
                  </div>

                  {/* Grok AI Insights Panel */}
                  <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-soft">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-[#1C1C1E] font-semibold flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-[#FF9500]" /> 
                        Grok AI Analysis
                      </h3>
                      <button 
                        onClick={store.generateGrokInsights}
                        disabled={store.isGeneratingInsights || !hasData}
                        className="bg-[#1C1C1E] hover:bg-[#2C2C2E] disabled:bg-[#EAEAEE] disabled:text-[#8E8E93] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                      >
                        {store.isGeneratingInsights ? 'Analyzing Memory...' : 'Generate AI Insights'}
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {!store.grokInsights && !store.isGeneratingInsights && (
                        <div className="text-sm text-[#8E8E93] italic p-4 bg-[#F2F2F7] rounded-xl border border-black/5">
                          Click generate to have Grok analyze your team's decisions and failures for blind spots.
                        </div>
                      )}

                      {store.isGeneratingInsights && (
                        <div className="animate-pulse flex space-x-4 p-4 bg-[#F2F2F7] rounded-xl border border-black/5">
                          <div className="flex-1 space-y-4 py-1">
                            <div className="h-2 bg-[#D1D1D6] rounded w-3/4"></div>
                            <div className="space-y-2">
                              <div className="h-2 bg-[#D1D1D6] rounded"></div>
                              <div className="h-2 bg-[#D1D1D6] rounded w-5/6"></div>
                            </div>
                          </div>
                        </div>
                      )}

                      {store.grokInsights && !store.isGeneratingInsights && (
                        <div className="text-sm text-[#1C1C1E] leading-relaxed p-5 bg-[#FFF9F0] border border-[#FFB340]/30 rounded-xl whitespace-pre-wrap font-medium">
                          {store.grokInsights}
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

      <DecisionModal isOpen={isDecisionModalOpen} onClose={() => setIsDecisionModalOpen(false)} onSubmit={store.logDecision} isLoading={store.isLoading} />
      <FailureModal isOpen={isFailureModalOpen} onClose={() => setIsFailureModalOpen(false)} onSubmit={store.logFailure} isLoading={store.isLoading} />
    </MainLayout>
  );
}