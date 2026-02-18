// client/src/components/Sidebar.tsx
import { useEffect } from 'react';
import { useContextStore } from '../store/useContextStore';
import { Layers, Plus, BrainCircuit } from 'lucide-react';
import clsx from 'clsx';

export const Sidebar = () => {
    const { contexts, activeContext, setActiveContext, fetchContexts } = useContextStore();

    useEffect(() => {
        fetchContexts();
    }, [fetchContexts]);

    return (
        <div className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col border-r border-slate-800">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
            <BrainCircuit className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-lg text-white tracking-tight">Kontext</span>
        </div>

        {/* Context List */}
        <div className="flex-1 overflow-y-auto py-4">
            <div className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Your Projects
            </div>
            
            <div className="space-y-1 px-2">
            {contexts.map((ctx) => (
                <button
                key={ctx.id}
                onClick={() => setActiveContext(ctx)}
                className={clsx(
                    "w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors",
                    activeContext?.id === ctx.id 
                    ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                    : "hover:bg-slate-800 hover:text-slate-100"
                )}
                >
                <Layers className="w-4 h-4 shrink-0" />
                <div className="truncate">
                    <div className="font-medium text-sm">{ctx.name}</div>
                </div>
                </button>
            ))}
            </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 border-t border-slate-800">
            <button className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-md text-sm font-medium transition-colors border border-slate-700">
            <Plus className="w-4 h-4" />
            New Context
            </button>
        </div>
        </div>
    );
};