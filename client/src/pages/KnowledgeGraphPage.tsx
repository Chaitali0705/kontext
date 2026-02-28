import { useMemo } from 'react';
import { Share2, BrainCircuit } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d'; // Adjust this import if your friend used a different package name
import MainLayout from '../components/MainLayout';
import { useContextStore } from '../store/useContextStore';

export default function KnowledgeGraphPage() {
  const store = useContextStore();

  // 🧠 Build the graph data instantly from your local Supabase store!
  // No need to fetch from a dead backend anymore.
  const graphData = useMemo(() => {
    const nodes: any[] = [];
    const links: any[] = [];

    if (store.activeContext) {
      // 1. Create a central Project Node
      nodes.push({ id: 'root', label: store.activeContext.name, color: '#34C759', val: 10 });

      // 2. Add Decision Nodes and link them to the root
      store.decisions.forEach(d => {
        nodes.push({ id: `d_${d.id}`, label: d.title, summary: d.rationale, color: '#FF9500', val: 6 });
        links.push({ source: 'root', target: `d_${d.id}` });
      });

      // 3. Add Failure Nodes and link them to the root
      store.failures.forEach(f => {
        nodes.push({ id: `f_${f.id}`, label: f.title, summary: f.whatFailed, color: '#FF3B30', val: 6 });
        links.push({ source: 'root', target: `f_${f.id}` });
      });
    }
    return { nodes, links };
  }, [store.activeContext, store.decisions, store.failures]);

  return (
    <MainLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="h-16 border-b border-black/10 flex items-center px-8 bg-white/70 backdrop-blur-xl shrink-0">
          <h1 className="text-xl font-semibold text-[#1C1C1E] flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Knowledge Graph
          </h1>
        </div>

        <div className="max-w-6xl mx-auto px-8 py-8 space-y-6">
          <div className="relative bg-white border border-black/10 rounded-2xl p-4 h-[620px] shadow-[0_2px_16px_rgba(0,0,0,0.06)] overflow-hidden">
            
            {/* Render the Graph directly from local data */}
            {graphData.nodes.length <= 1 ? (
              <div className="h-full flex items-center justify-center text-[#8E8E93]">
                No graph data yet. Add decisions and failures first.
              </div>
            ) : (
              <ForceGraph2D
                graphData={graphData}
                nodeLabel={(node: any) => `${node.label}\n\n${node.summary || ''}`}
                linkColor={() => 'rgba(0,0,0,0.15)'}
                nodeColor={(node: any) => node.color}
                nodeRelSize={6}
                cooldownTicks={80}
                backgroundColor="#FFFFFF"
                nodeCanvasObjectMode={() => 'after'}
                nodeCanvasObject={(node: any, ctx, globalScale) => {
                  if (node.summary) {
                    const label = node.summary;
                    const fontSize = 10 / globalScale;
                    ctx.font = `${fontSize}px Sans-Serif`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'top';
                    ctx.fillStyle = '#666';
                    ctx.fillText(label, node.x, node.y + 10);
                  }
                }}
              />
            )}

            {/* Floating AI Panel */}
            <div className="absolute bottom-6 right-6 w-96 bg-white/90 backdrop-blur-xl border border-black/10 rounded-2xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] z-10">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[#1C1C1E] font-semibold flex items-center gap-2 text-sm">
                  <BrainCircuit className="w-4 h-4 text-[#FF9500]" /> 
                  Graph Topology Analysis
                </h3>
                <button 
                  onClick={store.generateGraphInsights}
                  disabled={store.isGeneratingGraphInsights || graphData.nodes.length <= 1}
                  className="bg-[#1C1C1E] hover:bg-[#2C2C2E] disabled:bg-[#EAEAEE] disabled:text-[#8E8E93] text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  {store.isGeneratingGraphInsights ? 'Scanning Nodes...' : 'Analyze Graph'}
                </button>
              </div>

              {store.isGeneratingGraphInsights && (
                <div className="animate-pulse flex space-x-4 p-3 bg-[#F2F2F7] rounded-xl border border-black/5 mt-3">
                  <div className="flex-1 space-y-3 py-1">
                    <div className="h-2 bg-[#D1D1D6] rounded w-3/4"></div>
                    <div className="h-2 bg-[#D1D1D6] rounded w-5/6"></div>
                  </div>
                </div>
              )}

              {store.graphInsights && !store.isGeneratingGraphInsights && (
                <div className="mt-3 text-xs text-[#1C1C1E] leading-relaxed p-3 bg-[#FFF9F0] border border-[#FFB340]/30 rounded-xl max-h-48 overflow-y-auto whitespace-pre-wrap">
                  {store.graphInsights}
                </div>
              )}
            </div>

          </div>

          <div className="bg-white border border-black/10 rounded-2xl p-4">
            <div className="text-[#1C1C1E] text-sm font-medium mb-3">Legend</div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-[#1C1C1E]">
                <span className="w-3 h-3 rounded-full bg-[#34C759]" /> Project Root
              </div>
              <div className="flex items-center gap-2 text-[#1C1C1E]">
                <span className="w-3 h-3 rounded-full bg-[#FF9500]" /> Decision
              </div>
              <div className="flex items-center gap-2 text-[#1C1C1E]">
                <span className="w-3 h-3 rounded-full bg-[#FF3B30]" /> Failure
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}