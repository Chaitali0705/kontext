import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ForceGraph2D from 'react-force-graph-2d';
import { Share2 } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import { graphService, getApiErrorMessage } from '../services/api';
import { useContextStore } from '../store/useContextStore';
import type { GraphData } from '../types';

export default function KnowledgeGraphPage() {
  const { contextId } = useParams<{ contextId: string }>();
  const store = useContextStore();
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [graph, setGraph] = useState<GraphData>({ nodes: [], edges: [] });

  useEffect(() => {
    if (!contextId) return;
    const context = store.contexts.find((c) => c.id === contextId);
    if (context && context.id !== store.activeContext?.id) {
      store.setActiveContext(context);
    }
  }, [contextId, store.contexts, store.activeContext?.id]);

  useEffect(() => {
    if (!contextId) return;
    const loadGraph = async () => {
      try {
        setState('loading');
        setErrorMessage('');
        const data = await graphService.get(contextId);
        setGraph(data);
        setState('success');
      } catch (error) {
        setState('error');
        setErrorMessage(getApiErrorMessage(error));
      }
    };
    loadGraph();
  }, [contextId, store.decisions.length, store.failures.length]);

  const graphData = useMemo(
    () => ({
      nodes: graph.nodes.map((node) => ({ ...node })),
      links: graph.edges.map((edge) => ({ ...edge }))
    }),
    [graph]
  );

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
          <div className="bg-white border border-black/10 rounded-2xl p-4 h-[620px] shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
            {state === 'loading' && (
              <div className="h-full flex items-center justify-center text-slate-500">Loading graph...</div>
            )}
            {state === 'error' && (
              <div className="h-full flex items-center justify-center text-red-500">{errorMessage}</div>
            )}
            {state === 'success' && graph.nodes.length === 0 && (
              <div className="h-full flex items-center justify-center text-slate-500">
                No graph data yet. Add decisions and failures first.
              </div>
            )}
            {state === 'success' && graph.nodes.length > 0 && (
              <>
                <ForceGraph2D
                  graphData={graphData as any}
                  nodeLabel={(node: any) => `${node.label}\n\n${node.summary || ''}`}
                  linkColor={(link: any) => link.color || 'rgba(0,0,0,0.2)'}
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
              </>
            )}
          </div>

          <div className="bg-white border border-black/10 rounded-2xl p-4">
            <div className="text-[#1C1C1E] text-sm font-medium mb-3">Legend</div>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2 text-[#1C1C1E]">
                <span className="w-3 h-3 rounded-full bg-[#FF9500]" /> Decision
              </div>
              <div className="flex items-center gap-2 text-[#1C1C1E]">
                <span className="w-3 h-3 rounded-full bg-[#FF3B30]" /> Failure
              </div>
              <div className="flex items-center gap-2 text-[#1C1C1E]">
                <span className="w-3 h-3 rounded-full bg-[#34C759]" /> Success
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
