import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { BrainCircuit, Layers, Plus, Users, BookOpen, X, Menu, Share2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useContextStore } from '../store/useContextStore';
import clsx from 'clsx';
import DecisionModal from './DecisionModal';
import FailureModal from './FailureModal';

interface MainLayoutProps {
    children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { contexts, activeContext, setActiveContext, logDecision, logFailure, isLoading } = useContextStore();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
    const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);

    const handleContextClick = (contextId: string) => {
        const context = contexts.find(c => c.id === contextId);
        if (context) {
            setActiveContext(context);
            navigate(`/dashboard/${contextId}`);
        }
    };

    const isActive = (path: string) => location.pathname.includes(path);

    return (
        <div className="flex h-screen bg-[#F2F2F7] text-[#1C1C1E] font-sans overflow-hidden">
            {/* Sidebar */}
            <div className={clsx(
                "bg-white/80 backdrop-blur-xl border-r border-black/10 flex flex-col z-20 shrink-0 transition-all duration-200",
                sidebarOpen ? "w-64" : "w-16"
            )}>
                {/* Header */}
                <div className="p-4 border-b border-black/10 flex items-center justify-between">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2">
                            <div className="bg-gradient-to-br from-[#4A90E2] to-[#2E5C8A] p-1.5 rounded-xl shadow-[0_2px_16px_rgba(0,0,0,0.06)]">
                                <BrainCircuit className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-bold text-lg text-[#1C1C1E] tracking-tight">Kontext</span>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1 hover:bg-black/5 rounded-lg transition-colors"
                    >
                        {sidebarOpen ? (
                            <X className="w-5 h-5 text-[#8E8E93]" />
                        ) : (
                            <Menu className="w-5 h-5 text-[#8E8E93]" />
                        )}
                    </button>
                </div>

                {/* Projects List */}
                <div className="flex-1 overflow-y-auto py-4 flex flex-col">
                    {sidebarOpen && (
                        <div className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                            Your Projects
                        </div>
                    )}
                    
                    <div className={clsx("space-y-1", sidebarOpen ? "px-2" : "px-2")}>
                        {contexts.map((ctx) => (
                            <button
                                key={ctx.id}
                                onClick={() => handleContextClick(ctx.id)}
                                className={clsx(
                                    "w-full text-left px-3 py-2 rounded-md flex items-center gap-3 transition-colors",
                                    activeContext?.id === ctx.id
                                        ? "bg-[#FFF4E5] text-[#FF9500] border border-[#FFD9A3]"
                                        : "hover:bg-black/5 text-[#1C1C1E]"
                                )}
                                title={sidebarOpen ? undefined : ctx.name}
                            >
                                <Layers className="w-4 h-4 shrink-0" />
                                {sidebarOpen && (
                                    <span className="truncate font-medium text-sm">{ctx.name}</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Bottom Actions */}
                <div className={clsx("border-t border-black/10 p-2 space-y-1", !sidebarOpen && "flex flex-col")}>
                    <button
                        onClick={() => navigate('/create-project')}
                        className={clsx(
                            "w-full px-3 py-2 rounded-md flex items-center gap-3 transition-colors hover:bg-black/5 text-[#8E8E93] hover:text-[#1C1C1E]",
                            sidebarOpen ? "justify-start" : "justify-center"
                        )}
                        title={sidebarOpen ? undefined : "New Project"}
                    >
                        <Plus className="w-4 h-4 shrink-0" />
                        {sidebarOpen && <span className="text-sm font-medium">New Project</span>}
                    </button>

                    {activeContext && (
                        <>
                            <button
                                onClick={() => setIsDecisionModalOpen(true)}
                                className={clsx(
                                    "w-full px-3 py-2 rounded-md flex items-center gap-3 transition-colors bg-[#FF9500]/10 hover:bg-[#FF9500]/20 text-[#FF9500] border border-[#FF9500]/30",
                                    sidebarOpen ? "justify-start" : "justify-center"
                                )}
                                title={sidebarOpen ? undefined : "Add Decision"}
                            >
                                <CheckCircle className="w-4 h-4 shrink-0" />
                                {sidebarOpen && <span className="text-sm font-medium">Add Decision</span>}
                            </button>

                            <button
                                onClick={() => setIsFailureModalOpen(true)}
                                className={clsx(
                                    "w-full px-3 py-2 rounded-md flex items-center gap-3 transition-colors bg-[#FF3B30]/10 hover:bg-[#FF3B30]/20 text-[#FF3B30] border border-[#FF3B30]/30",
                                    sidebarOpen ? "justify-start" : "justify-center"
                                )}
                                title={sidebarOpen ? undefined : "Log Failure"}
                            >
                                <AlertTriangle className="w-4 h-4 shrink-0" />
                                {sidebarOpen && <span className="text-sm font-medium">Log Failure</span>}
                            </button>

                            <button
                                onClick={() => navigate(`/team/${activeContext.id}`)}
                                className={clsx(
                                    "w-full px-3 py-2 rounded-md flex items-center gap-3 transition-colors hover:bg-black/5 text-[#8E8E93] hover:text-[#1C1C1E]",
                                    isActive('/team') ? "bg-white border border-black/10 text-[#1C1C1E]" : ""
                                )}
                                title={sidebarOpen ? undefined : "Team"}
                            >
                                <Users className="w-4 h-4 shrink-0" />
                                {sidebarOpen && <span className="text-sm font-medium">Team</span>}
                            </button>

                            <button
                                onClick={() => navigate(`/onboarding/${activeContext.id}`)}
                                className={clsx(
                                    "w-full px-3 py-2 rounded-md flex items-center gap-3 transition-colors hover:bg-black/5 text-[#8E8E93] hover:text-[#1C1C1E]",
                                    isActive('/onboarding') ? "bg-white border border-black/10 text-[#1C1C1E]" : ""
                                )}
                                title={sidebarOpen ? undefined : "Onboarding"}
                            >
                                <BookOpen className="w-4 h-4 shrink-0" />
                                {sidebarOpen && <span className="text-sm font-medium">Onboarding</span>}
                            </button>
                            <button
                                onClick={() => navigate(`/graph/${activeContext.id}`)}
                                className={clsx(
                                    "w-full px-3 py-2 rounded-md flex items-center gap-3 transition-colors hover:bg-black/5 text-[#8E8E93] hover:text-[#1C1C1E]",
                                    isActive('/graph') ? "bg-white border border-black/10 text-[#1C1C1E]" : ""
                                )}
                                title={sidebarOpen ? undefined : "Knowledge Graph"}
                            >
                                <Share2 className="w-4 h-4 shrink-0" />
                                {sidebarOpen && <span className="text-sm font-medium">Graph</span>}
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {children}
            </div>

            {/* Modals */}
            <DecisionModal
                isOpen={isDecisionModalOpen}
                onClose={() => setIsDecisionModalOpen(false)}
                onSubmit={logDecision}
                isLoading={isLoading}
            />
            <FailureModal
                isOpen={isFailureModalOpen}
                onClose={() => setIsFailureModalOpen(false)}
                onSubmit={logFailure}
                isLoading={isLoading}
            />
        </div>
    );
}
