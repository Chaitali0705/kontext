import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, Layers, Plus } from 'lucide-react';
import { useContextStore } from '../store/useContextStore';

export default function LandingPage() {
  const navigate = useNavigate();
  const { contexts, fetchContexts, isLoading } = useContextStore();

  useEffect(() => {
    fetchContexts();
  }, []);

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#1C1C1E]">
      <div className="border-b border-black/10 sticky top-0 z-40 bg-white/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-[#4A90E2] to-[#2E5C8A] p-2 rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-[#1C1C1E] tracking-tight">Kontext</span>
          </div>
          <div className="text-sm text-[#8E8E93]">Context as Competitive Moat</div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-6 text-[#1C1C1E] leading-tight">
            Capture Decisions.
            <br />
            Learn from Failures.
            <br />
            Compound Team Intelligence.
          </h1>
          <p className="text-lg text-[#8E8E93] max-w-2xl mx-auto mb-8">
            Kontext helps teams turn everyday decisions and setbacks into reusable context that increases value over time.
          </p>
          <button
            onClick={() => navigate('/create-project')}
            className="bg-gradient-to-r from-[#FFB340] to-[#FF9500] hover:brightness-105 text-white font-semibold px-8 py-3 rounded-2xl flex items-center gap-2 mx-auto transition-all shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
          >
            <Plus className="w-5 h-5" />
            Create Project
          </button>
        </div>

        {contexts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-[#1C1C1E]">Your Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {contexts.map((context) => (
                <button
                  key={context.id}
                  onClick={() => navigate(`/dashboard/${context.id}`)}
                  className="bg-white border border-black/10 rounded-2xl p-6 text-left transition-all shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
                >
                  <Layers className="w-5 h-5 text-[#FF9500] mb-3" />
                  <h3 className="text-lg font-semibold text-[#1C1C1E] mb-2">{context.name}</h3>
                  {context.description && <p className="text-sm text-[#8E8E93] mb-4">{context.description}</p>}
                  <div className="flex gap-4 text-xs text-[#8E8E93]">
                    <span>{context._count?.decisions || 0} decisions</span>
                    <span>{context._count?.failures || 0} failures</span>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => navigate('/create-project')}
              className="mt-4 bg-white border-2 border-dashed border-black/10 hover:border-[#FF9500]/40 rounded-2xl p-6 w-full text-center transition-colors"
            >
              <Plus className="w-6 h-6 text-[#8E8E93] mx-auto mb-2" />
              <span className="text-[#1C1C1E] font-medium">Create New Project</span>
            </button>
          </section>
        )}

        {contexts.length === 0 && !isLoading && (
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <h3 className="font-semibold text-[#1C1C1E] mb-2">Capture Decisions</h3>
              <p className="text-sm text-[#8E8E93]">Document what was decided and why.</p>
            </div>
            <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <h3 className="font-semibold text-[#1C1C1E] mb-2">Learn from Failures</h3>
              <p className="text-sm text-[#8E8E93]">Track what failed, what it cost, and what changed.</p>
            </div>
            <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
              <h3 className="font-semibold text-[#1C1C1E] mb-2">Share Knowledge</h3>
              <p className="text-sm text-[#8E8E93]">Make insight reusable for every new project cycle.</p>
            </div>
          </section>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin text-[#FF9500]">
              <BrainCircuit className="w-8 h-8" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
