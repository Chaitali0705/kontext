import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import { useContextStore } from '../store/useContextStore';
import MainLayout from '../components/MainLayout';

export default function ProjectContextPage() {
  const { contextId } = useParams<{ contextId: string }>();
  const store = useContextStore();

  // Ensure active context is loaded if someone refreshes the page directly here
  useEffect(() => {
    if (!contextId || store.contexts.length === 0) return;
    const context = store.contexts.find((c: any) => c.id === contextId);
    if (context && context.id !== store.activeContext?.id) {
      store.setActiveContext(context);
    }
  }, [contextId, store.contexts, store.activeContext?.id, store]);

  if (!store.activeContext) {
    return (
      <MainLayout>
        <div className="flex-1 flex items-center justify-center text-[#8E8E93]">Loading context...</div>
      </MainLayout>
    );
  }

  const hasData = store.decisions.length > 0 || store.failures.length > 0;

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto bg-[#F2F2F7]">
        {/* Header */}
        <div className="h-16 border-b border-black/10 flex items-center px-8 bg-white/70 backdrop-blur-xl shrink-0">
          <h1 className="text-xl font-semibold text-[#1C1C1E] flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Project Context & Onboarding
          </h1>
        </div>

        <div className="max-w-4xl mx-auto px-8 py-8 space-y-6">
          
          {/* Project Details */}
          <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-[#1C1C1E] mb-2">{store.activeContext.name}</h2>
            <p className="text-[#8E8E93]">{store.activeContext.description || "No project description provided."}</p>
          </div>

          {/* AI Onboarding Generator */}
          <div className="bg-white border border-black/10 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#1C1C1E] flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF9500]" /> AI Onboarding Summary
                </h3>
                <p className="text-sm text-[#8E8E93] mt-1">
                  Generate a complete overview of all decisions and failures to get new team members up to speed instantly.
                </p>
              </div>
              <button
                onClick={() => store.generateContextSummary()}
                disabled={store.isGeneratingContextSummary || !hasData}
                className="shrink-0 bg-gradient-to-r from-[#FFB340] to-[#FF9500] hover:brightness-105 text-white font-semibold py-2.5 px-6 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {store.isGeneratingContextSummary ? 'Summarizing...' : 'Generate AI Summary'}
              </button>
            </div>

            {/* Warning if there's no data yet */}
            {!hasData && (
               <div className="bg-[#FF9500]/10 border border-[#FF9500]/20 rounded-xl p-4 flex items-start gap-3 text-[#FF9500]">
                 <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                 <p className="text-sm font-medium">Log some decisions or failures first so the AI has enough context to generate a meaningful onboarding summary.</p>
               </div>
            )}

            {/* The Generated Summary */}
            {store.contextSummary && (
              <div className="mt-6 p-6 bg-[#F8F8FB] border border-black/5 rounded-xl text-[#1C1C1E] text-sm leading-relaxed whitespace-pre-wrap custom-scrollbar max-h-[500px] overflow-y-auto">
                {store.contextSummary}
              </div>
            )}
          </div>

        </div>
      </div>
    </MainLayout>
  );
}