import { useEffect, useState } from 'react';
import { create } from 'zustand';
import axios from 'axios';
import { Layers, Plus, BrainCircuit, AlertCircle, CheckCircle, RefreshCw, FileText, X } from 'lucide-react';
import clsx from 'clsx';

// --- 1. TYPES ---
interface Context {
  id: string;
  name: string;
  description?: string;
  _count?: { decisions: number; failures: number; };
}

interface Decision {
  id: string;
  title: string;
  content: string;
  rationale: string;
  createdAt: string;
  author: { name: string };
}

// --- 2. API ---
const api = axios.create({ baseURL: 'http://localhost:3001/api' });

// --- 3. STORE ---
interface StoreState {
  contexts: Context[];
  activeContext: Context | null;
  decisions: Decision[];
  isLoading: boolean;
  fetchContexts: () => Promise<void>;
  setActiveContext: (context: Context) => void;
  fetchDecisions: (contextId: string) => Promise<void>;
  logDecision: (data: any) => Promise<void>;
}

const useStore = create<StoreState>((set, get) => ({
  contexts: [],
  activeContext: null,
  decisions: [],
  isLoading: false,

  fetchContexts: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/contexts');
      set({ contexts: res.data, isLoading: false });
      if (res.data.length > 0 && !get().activeContext) {
        get().setActiveContext(res.data[0]);
      }
    } catch (e) { console.error(e); set({ isLoading: false }); }
  },

  setActiveContext: (context) => {
    set({ activeContext: context });
    get().fetchDecisions(context.id);
  },

  fetchDecisions: async (contextId) => {
    try {
      const res = await api.get(`/decisions?contextId=${contextId}`);
      set({ decisions: res.data });
    } catch (e) { console.error(e); }
  },

  logDecision: async (data) => {
    const context = get().activeContext;
    if (!context) return;
    await api.post('/decisions', { ...data, contextId: context.id });
    get().fetchDecisions(context.id); // Refresh list
    get().fetchContexts(); // Refresh counts
  }
}));

// --- 4. UI COMPONENTS ---

// Simple Modal Component
const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-lg rounded-xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <h3 className="font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

export default function App() {
  const { contexts, activeContext, decisions, setActiveContext, fetchContexts, logDecision, isLoading } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [title, setTitle] = useState('');
  const [rationale, setRationale] = useState('');

  useEffect(() => { fetchContexts(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await logDecision({ title, rationale, content: rationale }); // Simple mapping for now
    setIsModalOpen(false);
    setTitle(''); setRationale('');
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg"><BrainCircuit className="w-6 h-6 text-white" /></div>
          <span className="font-bold text-lg text-white tracking-tight">Kontext</span>
        </div>
        <div className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          <div className="px-2 mb-2 text-xs font-semibold uppercase text-slate-500">Projects</div>
          {contexts.map((ctx) => (
            <button key={ctx.id} onClick={() => setActiveContext(ctx)}
              className={clsx("w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors",
                activeContext?.id === ctx.id ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" : "hover:bg-slate-800 text-slate-400 hover:text-slate-100"
              )}>
              <Layers className="w-4 h-4" /><span className="truncate font-medium text-sm">{ctx.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col relative">
        {activeContext ? (
          <>
            <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-900/50 backdrop-blur-sm">
              <h1 className="text-xl font-semibold text-white">{activeContext.name}</h1>
              <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                <Plus className="w-4 h-4" /> Log Decision
              </button>
            </header>

            <div className="p-8 max-w-5xl mx-auto w-full space-y-8 overflow-y-auto">
              
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                  <div className="p-3 bg-emerald-500/10 rounded-lg"><CheckCircle className="w-6 h-6 text-emerald-500" /></div>
                  <div><div className="text-2xl font-bold text-white">{decisions.length}</div><div className="text-xs text-slate-500 uppercase font-semibold">Decisions Logged</div></div>
                </div>
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 rounded-lg"><AlertCircle className="w-6 h-6 text-amber-500" /></div>
                  <div><div className="text-2xl font-bold text-white">{activeContext._count?.failures || 0}</div><div className="text-xs text-slate-500 uppercase font-semibold">Failures Avoided</div></div>
                </div>
              </div>

              {/* Decision Timeline */}
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-400" /> Decision History
                </h2>
                <div className="space-y-4">
                  {decisions.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl text-slate-500">
                      No decisions logged yet. Start building your moat!
                    </div>
                  ) : (
                    decisions.map((decision) => (
                      <div key={decision.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="text-lg font-medium text-white">{decision.title}</h3>
                          <span className="text-xs text-slate-500">{new Date(decision.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">{decision.rationale}</p>
                        <div className="mt-4 flex gap-2">
                          <span className="text-xs bg-slate-950 text-blue-400 px-2 py-1 rounded border border-slate-800">Moat Factor: High</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* MODAL FORM */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Log New Decision">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Decision Title</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="e.g., Switch to PostgreSQL"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1">Rationale (Why?)</label>
                  <textarea 
                    value={rationale}
                    onChange={(e) => setRationale(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 h-32 resize-none"
                    placeholder="Explain the context, constraints, and why you chose this path..."
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm font-medium">Cancel</button>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium">Save Decision</button>
                </div>
              </form>
            </Modal>

          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            {isLoading ? "Loading..." : "Select a project to begin"}
          </div>
        )}
      </main>
    </div>
  );
}