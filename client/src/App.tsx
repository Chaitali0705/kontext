import { useEffect, useState, useMemo } from 'react';
import { create } from 'zustand';
import axios from 'axios';
import { Layers, Plus, BrainCircuit, AlertCircle, CheckCircle, X, AlertTriangle, TrendingUp, ShieldAlert, Network, BookOpen, Copy, Users, Download, UserCircle, Briefcase } from 'lucide-react';
import clsx from 'clsx';
import ForceGraph2D from 'react-force-graph-2d';

// --- 1. TYPES ---
interface Context { id: string; name: string; description?: string; _count?: { decisions: number; failures: number; }; }
interface Decision { id: string; title: string; rationale: string; createdAt: string; status: string; constraints: string[]; brokenRules: string[]; author?: { name: string }; }
interface Failure { id: string; title: string; whatFailed: string; whyFailed: string; costEstimate: number; createdAt: string; author?: { name: string }; }

// --- 2. API ---
const api = axios.create({ baseURL: 'http://localhost:3001/api' });

// --- 3. STORE ---
interface StoreState {
  contexts: Context[];
  activeContext: Context | null;
  decisions: Decision[];
  failures: Failure[];
  activeTab: 'decisions' | 'failures' | 'analytics' | 'graph' | 'onboarding';
  isLoading: boolean;
  fetchContexts: () => Promise<void>;
  setActiveContext: (context: Context) => void;
  fetchData: (contextId: string) => Promise<void>;
  logDecision: (data: any) => Promise<void>;
  logFailure: (data: any) => Promise<void>;
  invalidateConstraint: (decisionId: string, brokenConstraint: string) => Promise<void>;
  setTab: (tab: 'decisions' | 'failures' | 'analytics' | 'graph' | 'onboarding') => void;
}

const useStore = create<StoreState>((set, get) => ({
  contexts: [],
  activeContext: null,
  decisions: [],
  failures: [],
  activeTab: 'decisions',
  isLoading: false,

  fetchContexts: async () => {
    try {
      const res = await api.get('/contexts');
      set({ contexts: res.data });
      if (res.data.length > 0 && !get().activeContext) get().setActiveContext(res.data[0]);
    } catch (e) { console.error(e); }
  },

  setActiveContext: (context) => {
    set({ activeContext: context });
    get().fetchData(context.id);
  },

  fetchData: async (contextId) => {
    set({ isLoading: true });
    try {
      const [decRes, failRes] = await Promise.all([
        api.get(`/decisions?contextId=${contextId}`),
        api.get(`/failures?contextId=${contextId}`)
      ]);
      set({ decisions: decRes.data, failures: failRes.data, isLoading: false });
    } catch (e) { console.error(e); set({ isLoading: false }); }
  },

  logDecision: async (data) => {
    const ctx = get().activeContext;
    if (!ctx) return;
    await api.post('/decisions', { ...data, contextId: ctx.id });
    get().fetchData(ctx.id);
  },

  logFailure: async (data) => {
    const ctx = get().activeContext;
    if (!ctx) return;
    await api.post('/failures', { ...data, contextId: ctx.id });
    get().fetchData(ctx.id);
  },

  invalidateConstraint: async (decisionId, brokenConstraint) => {
    try {
      await api.post(`/decisions/${decisionId}/invalidate`, { brokenConstraint });
      const ctx = get().activeContext;
      if (ctx) get().fetchData(ctx.id);
    } catch (error) { console.error("Failed to invalidate", error); }
  },

  setTab: (tab) => set({ activeTab: tab })
}));

// --- 4. MODAL UI ---
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

// --- 5. MAIN APP ---
export default function App() {
  const store = useStore();
  const [isDecModalOpen, setIsDecModalOpen] = useState(false);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  const [decForm, setDecForm] = useState({ title: '', rationale: '' });
  const [failForm, setFailForm] = useState({ title: '', what: '', why: '', cost: '' });
  const [constraints, setConstraints] = useState<string[]>([]);
  const [constraintInput, setConstraintInput] = useState('');
  const [copied, setCopied] = useState(false);
  
  // NEW: Role Toggle State
  const [onboardingRole, setOnboardingRole] = useState<'engineer' | 'pm'>('engineer');

  useEffect(() => { store.fetchContexts(); }, []);

  const handleAddConstraint = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (constraintInput.trim()) {
      setConstraints([...constraints, constraintInput.trim()]);
      setConstraintInput('');
    }
  };

  const handleDecSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await store.logDecision({ title: decForm.title, rationale: decForm.rationale, content: decForm.rationale, constraints });
    setIsDecModalOpen(false); setDecForm({ title: '', rationale: '' }); setConstraints([]);
  };

  const handleFailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await store.logFailure({ title: failForm.title, whatFailed: failForm.what, whyFailed: failForm.why, costEstimate: failForm.cost });
    setIsFailModalOpen(false); setFailForm({ title: '', what: '', why: '', cost: '' });
  };

  const copyOnboardingToClipboard = () => {
    const text = `ONBOARDING GUIDE: ${store.activeContext?.name}\nRole: ${onboardingRole.toUpperCase()}\nGenerated by Kontext\n\n== THE MINEFIELD ==\n${store.failures.map(f => `- ${f.title}\n  ${onboardingRole === 'engineer' ? `Root Cause: ${f.whyFailed}` : `Impact: ${f.costEstimate} hours lost`}`).join('\n\n')}\n\n== THE FOUNDATION ==\n${store.decisions.filter(d => d.status !== 'warning').map(d => `- ${d.title}\n  Rationale: ${d.rationale}`).join('\n\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // NEW: Export Function
  const exportWorkspace = () => {
    if (!store.activeContext) return;
    const exportData = {
      project: store.activeContext.name,
      exportDate: new Date().toISOString(),
      decisions: store.decisions,
      failures: store.failures
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kontext-${store.activeContext.name.toLowerCase().replace(/\s+/g, '-')}-export.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const graphData = useMemo(() => {
    if (!store.activeContext) return { nodes: [], links: [] };
    const nodes: any[] = [{ id: 'root', name: store.activeContext.name, val: 10, color: '#3b82f6' }];
    const links: any[] = [];
    store.decisions.forEach(d => { nodes.push({ id: d.id, name: d.title, val: 5, color: d.status === 'warning' ? '#ef4444' : '#10b981' }); links.push({ source: 'root', target: d.id, color: '#334155' }); });
    store.failures.forEach(f => { nodes.push({ id: f.id, name: f.title, val: 4, color: '#f59e0b' }); links.push({ source: 'root', target: f.id, color: '#334155' }); });
    return { nodes, links };
  }, [store.activeContext, store.decisions, store.failures]);

  const totalSavedHours = store.failures.reduce((sum, f) => sum + (Number(f.costEstimate) || 0), 0);
  const roiValue = totalSavedHours * 50;
  
  const expertiseMap = useMemo(() => {
    const counts: Record<string, number> = {};
    store.decisions.forEach(d => { const name = d.author?.name || 'Alice Engineer'; counts[name] = (counts[name] || 0) + 1; });
    store.failures.forEach(f => { const name = f.author?.name || 'Alice Engineer'; counts[name] = (counts[name] || 0) + 1; });
    const totalItems = store.decisions.length + store.failures.length;
    return Object.entries(counts).map(([name, count]) => ({ name, count, percentage: totalItems > 0 ? Math.round((count / totalItems) * 100) : 0 })).sort((a, b) => b.count - a.count);
  }, [store.decisions, store.failures]);

  const topContributor = expertiseMap[0];
  const busFactorCritical = topContributor && topContributor.percentage > 60;

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col z-10 shrink-0">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg"><BrainCircuit className="w-6 h-6 text-white" /></div>
            <span className="font-bold text-lg text-white tracking-tight">Kontext</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          <div className="px-2 mb-2 text-xs font-semibold uppercase text-slate-500">Projects</div>
          {store.contexts.map((ctx) => (
            <button key={ctx.id} onClick={() => store.setActiveContext(ctx)} className={clsx("w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors", store.activeContext?.id === ctx.id ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "hover:bg-slate-800 text-slate-400 hover:text-slate-100")}>
              <Layers className="w-4 h-4 shrink-0" /><span className="truncate font-medium text-sm">{ctx.name}</span>
            </button>
          ))}
        </div>
        
        {/* EXPORT BUTTON */}
        {store.activeContext && (
          <div className="p-4 border-t border-slate-800">
            <button onClick={exportWorkspace} className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-700">
              <Download className="w-4 h-4" /> Export Workspace
            </button>
          </div>
        )}
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {store.activeContext ? (
          <>
            <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-sm z-10 shrink-0">
              <h1 className="text-xl font-semibold text-white truncate pr-4">{store.activeContext.name}</h1>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => setIsFailModalOpen(true)} className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/50 px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"><AlertCircle className="w-4 h-4" /> Log Failure</button>
                <button onClick={() => setIsDecModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors"><Plus className="w-4 h-4" /> Log Decision</button>
              </div>
            </header>

            <div className="flex-1 flex flex-col w-full overflow-hidden">
              {/* TABS */}
              <div className="flex border-b border-slate-800 shrink-0 px-8 pt-6 overflow-x-auto hide-scrollbar">
                <button onClick={() => store.setTab('decisions')} className={clsx("px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap", store.activeTab === 'decisions' ? "border-blue-500 text-blue-400" : "border-transparent text-slate-500 hover:text-slate-300")}>Decision History ({store.decisions.length})</button>
                <button onClick={() => store.setTab('failures')} className={clsx("px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap", store.activeTab === 'failures' ? "border-red-500 text-red-400" : "border-transparent text-slate-500 hover:text-slate-300")}>Failure Knowledge ({store.failures.length})</button>
                <button onClick={() => store.setTab('analytics')} className={clsx("px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap", store.activeTab === 'analytics' ? "border-emerald-500 text-emerald-400" : "border-transparent text-slate-500 hover:text-slate-300")}><TrendingUp className="w-4 h-4"/> Moat Analytics</button>
                <button onClick={() => store.setTab('graph')} className={clsx("px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap", store.activeTab === 'graph' ? "border-purple-500 text-purple-400" : "border-transparent text-slate-500 hover:text-slate-300")}><Network className="w-4 h-4"/> Knowledge Graph</button>
                <button onClick={() => store.setTab('onboarding')} className={clsx("px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap", store.activeTab === 'onboarding' ? "border-amber-500 text-amber-400" : "border-transparent text-slate-500 hover:text-slate-300")}><BookOpen className="w-4 h-4"/> Auto-Onboarding</button>
              </div>

              {/* TAB CONTENT */}
              <div className="flex-1 overflow-y-auto px-8 py-6">
                
                {store.activeTab === 'decisions' && (
                  <div className="max-w-5xl mx-auto space-y-4 pb-12">
                    {store.decisions.map((d) => (
                      <div key={d.id} className={clsx("border rounded-xl p-6 transition-all duration-300", d.status === 'warning' ? "bg-red-950/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]" : "bg-slate-900 border-slate-800 hover:border-blue-500/30")}>
                        <div className="flex justify-between mb-2">
                          <h3 className="text-lg font-medium text-white flex items-center gap-2">{d.status === 'warning' && <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />} {d.title}</h3>
                          <span className="text-xs text-slate-500 font-medium bg-slate-800 px-2 py-1 rounded">Logged by {d.author?.name || 'Alice Engineer'}</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">{d.rationale}</p>
                        {d.constraints && d.constraints.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-slate-800/50">
                            <div className="space-y-2">
                              {d.constraints.map((c, i) => {
                                const isBroken = d.brokenRules?.includes(c);
                                return isBroken ? (
                                  <div key={i} className="flex items-center gap-2 p-2.5 bg-red-950/40 border border-red-500/30 rounded-lg text-red-400 text-sm"><AlertTriangle className="w-4 h-4 shrink-0" /><span className="line-through opacity-70">{c}</span></div>
                                ) : (
                                  <div key={i} className="flex items-center justify-between p-2.5 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm group"><div className="flex items-center gap-2"><CheckCircle className="w-4 h-4 shrink-0" /> {c}</div><button onClick={() => store.invalidateConstraint(d.id, c)} className="text-xs font-medium bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-3 py-1 rounded transition-colors opacity-0 group-hover:opacity-100">Mark Invalid</button></div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {store.decisions.length === 0 && <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">No decisions yet. Start building your moat!</div>}
                  </div>
                )}

                {store.activeTab === 'failures' && (
                  <div className="max-w-5xl mx-auto space-y-4 pb-12">
                     {store.failures.map((f) => (
                      <div key={f.id} className="bg-red-950/10 border border-red-900/30 rounded-xl p-6 hover:border-red-500/50 transition-colors">
                        <div className="flex justify-between mb-2">
                          <h3 className="text-lg font-medium text-red-200 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500" /> {f.title}</h3>
                          <span className="text-xs text-red-400/60 font-medium bg-red-950/50 px-2 py-1 rounded">Logged by {f.author?.name || 'Alice Engineer'}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div className="bg-red-950/20 p-3 rounded-lg border border-red-900/20"><div className="text-xs text-red-400 uppercase font-bold mb-1">What Failed</div><div className="text-sm text-red-100">{f.whatFailed}</div></div>
                          <div className="bg-red-950/20 p-3 rounded-lg border border-red-900/20"><div className="text-xs text-red-400 uppercase font-bold mb-1">Why it Failed</div><div className="text-sm text-red-100">{f.whyFailed}</div></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ANALYTICS & GRAPH TABS MAINTAINED FOR BREVITY */}
                {store.activeTab === 'analytics' && (
                  <div className="max-w-5xl mx-auto space-y-6 pb-12 animate-in fade-in">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="bg-gradient-to-br from-emerald-900/20 to-slate-900 border border-emerald-500/30 rounded-xl p-6"><h3 className="text-emerald-400 font-semibold mb-4">Estimated ROI</h3><div className="text-5xl font-bold text-white mb-2">${roiValue.toLocaleString()}</div></div>
                      <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-500/30 rounded-xl p-6"><h3 className="text-blue-400 font-semibold mb-4">Hours Saved</h3><div className="text-5xl font-bold text-white mb-2">{totalSavedHours} <span className="text-xl text-blue-200/50">hrs</span></div></div>
                    </div>
                    <div className={clsx("rounded-xl p-8 border transition-all duration-500", busFactorCritical ? "bg-red-950/20 border-red-500/50" : "bg-slate-900 border-slate-800")}>
                      <div className="flex justify-between items-start mb-6">
                        <div><h3 className={clsx("font-semibold flex items-center gap-2 text-xl", busFactorCritical ? "text-red-400" : "text-white")}><Users className="w-6 h-6" /> Team Risk Analysis (Bus Factor)</h3><p className="text-slate-400 mt-2 text-sm max-w-2xl">The "Bus Factor" measures the concentration of information.</p></div>
                        {busFactorCritical ? <div className="bg-red-500/10 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg font-bold flex items-center gap-2 animate-pulse"><AlertTriangle className="w-5 h-5"/> CRITICAL RISK</div> : <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-4 py-2 rounded-lg font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5"/> HEALTHY</div>}
                      </div>
                      {topContributor && (
                        <div className="space-y-6">
                          <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-lg">If <span className="font-bold text-white">{topContributor.name}</span> leaves tomorrow, your team loses <span className={clsx("font-extrabold", busFactorCritical ? "text-red-400" : "text-blue-400")}>{topContributor.percentage}%</span> of its architectural context.</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {store.activeTab === 'graph' && (
                  <div className="w-full h-full min-h-[600px] border border-slate-800 rounded-xl overflow-hidden bg-slate-950"><ForceGraph2D graphData={graphData} nodeLabel="name" nodeColor="color" nodeRelSize={6} linkColor="color" linkWidth={2} backgroundColor="#020617" width={1000} height={600} /></div>
                )}

                {/* ENHANCED ROLE-BASED ONBOARDING */}
                {store.activeTab === 'onboarding' && (
                  <div className="max-w-4xl mx-auto animate-in fade-in pb-12">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-white">Project Onboarding Guide</h2>
                        <p className="text-slate-400 mt-1">Generated dynamically. Select your role to tailor the context.</p>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* ROLE TOGGLE */}
                        <div className="flex bg-slate-900 border border-slate-700 rounded-lg p-1">
                          <button onClick={() => setOnboardingRole('engineer')} className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors", onboardingRole === 'engineer' ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}>
                            <UserCircle className="w-4 h-4" /> Engineering
                          </button>
                          <button onClick={() => setOnboardingRole('pm')} className={clsx("flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors", onboardingRole === 'pm' ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200")}>
                            <Briefcase className="w-4 h-4" /> Product / PM
                          </button>
                        </div>
                        
                        <button onClick={copyOnboardingToClipboard} className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700">
                          {copied ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white text-slate-900 p-10 rounded-xl shadow-2xl space-y-8 font-serif leading-relaxed">
                      <div className="border-b-2 border-slate-200 pb-4">
                        <h1 className="text-4xl font-extrabold text-slate-900 mb-2">Welcome to {store.activeContext.name}</h1>
                        <p className="text-slate-500 font-sans font-medium uppercase tracking-widest text-sm">
                          {onboardingRole === 'engineer' ? "Technical Implementation Guide" : "Product & Risk Overview"}
                        </p>
                      </div>

                      <section>
                        <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5"/> Section 1: The Minefield</h3>
                        <p className="text-slate-600 mb-4">We have lost <span className="font-bold text-red-500">{totalSavedHours} hours</span> to the following mistakes.</p>
                        {store.failures.map(f => (
                          <div key={f.id} className="bg-red-50 p-4 rounded-lg border border-red-100 mb-3">
                            <h4 className="font-bold text-red-800 text-lg mb-1">{f.title}</h4>
                            {/* DYNAMIC CONTENT BASED ON ROLE */}
                            {onboardingRole === 'engineer' ? (
                              <p className="text-slate-700"><span className="font-semibold">Root Cause (Why it failed):</span> {f.whyFailed}</p>
                            ) : (
                              <p className="text-slate-700"><span className="font-semibold">Business Impact:</span> Cost us approx. {f.costEstimate} hours of engineering time.</p>
                            )}
                          </div>
                        ))}
                      </section>

                      <section>
                        <h3 className="text-xl font-bold text-emerald-600 mb-4 flex items-center gap-2"><CheckCircle className="w-5 h-5"/> Section 2: Core Architecture</h3>
                        {store.decisions.filter(d => d.status !== 'warning').map(d => (
                          <div key={d.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-3">
                            <h4 className="font-bold text-slate-800 text-lg mb-1">{d.title}</h4>
                            <p className="text-slate-700 mb-3">{d.rationale}</p>
                            {/* ONLY SHOW DEEP CONSTRAINTS TO ENGINEERS */}
                            {onboardingRole === 'engineer' && d.constraints.length > 0 && (
                              <div className="mt-2 text-sm text-slate-600">
                                <span className="font-semibold uppercase text-xs tracking-wider text-slate-500 block mb-1">Load-Bearing Constraints:</span>
                                <ul className="list-disc pl-5 space-y-1">{d.constraints.map((c, i) => <li key={i}>{c}</li>)}</ul>
                              </div>
                            )}
                          </div>
                        ))}
                      </section>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* MODALS */}
            <Modal isOpen={isDecModalOpen} onClose={() => setIsDecModalOpen(false)} title="Log New Decision">
              <form onSubmit={handleDecSubmit} className="space-y-4">
                <input value={decForm.title} onChange={e => setDecForm({...decForm, title: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="Decision Title" required />
                <div className="bg-slate-950/50 p-4 border border-slate-800 rounded-lg">
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Core Assumptions</label>
                  <div className="flex gap-2 mb-3">
                    <input value={constraintInput} onChange={e => setConstraintInput(e.target.value)} onKeyDown={handleAddConstraint} className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white" placeholder="Press Enter to add..." />
                  </div>
                  {constraints.length > 0 && (
                    <div className="space-y-1.5 mt-2">
                      {constraints.map((c, i) => (
                        <div key={i} className="flex justify-between items-center text-sm bg-emerald-500/10 text-emerald-400 px-3 py-1.5 rounded border border-emerald-500/20"><span className="flex items-center gap-2"><CheckCircle className="w-3.5 h-3.5" /> {c}</span><button type="button" onClick={() => setConstraints(constraints.filter((_, index) => index !== i))} className="text-emerald-500/50 hover:text-emerald-400"><X className="w-4 h-4" /></button></div>
                      ))}
                    </div>
                  )}
                </div>
                <textarea value={decForm.rationale} onChange={e => setDecForm({...decForm, rationale: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white h-24 resize-none" placeholder="Rationale" required />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Save Decision</button>
              </form>
            </Modal>

            <Modal isOpen={isFailModalOpen} onClose={() => setIsFailModalOpen(false)} title="Log Failure">
              <form onSubmit={handleFailSubmit} className="space-y-4">
                  <input value={failForm.title} onChange={e => setFailForm({...failForm, title: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="What broke?" required />
                  <div className="grid grid-cols-2 gap-4">
                    <textarea value={failForm.what} onChange={e => setFailForm({...failForm, what: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white h-24 resize-none" placeholder="What exactly happened?" required />
                    <textarea value={failForm.why} onChange={e => setFailForm({...failForm, why: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white h-24 resize-none" placeholder="Root cause (Why?)" required />
                  </div>
                  <input type="number" value={failForm.cost} onChange={e => setFailForm({...failForm, cost: e.target.value})} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white" placeholder="Hours lost (estimate)" />
                  <button type="submit" className="w-full bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Save Learning</button>
              </form>
            </Modal>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">Select a project to begin</div>
        )}
      </main>
    </div>
  );
}