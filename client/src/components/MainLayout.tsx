import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; // 👈 Added Link
import { BrainCircuit, Layers, Plus, Users, X, Menu, Share2, CheckCircle, AlertTriangle, TrendingUp, BookOpen } from 'lucide-react';
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
                "backdrop-blur-xl border-r border-black/10 flex flex-col z-50 shrink-0 transition-all duration-300 relative", // 👈 Boosted z-index
                sidebarOpen ? "w-72" : "w-20"
            )}
            style={{ backgroundColor: 'rgba(249, 249, 249, 0.8)' }}>
                
                {/* Logo */}
                <div className="p-6 pb-5 flex items-center justify-between">
                    {sidebarOpen && (
                        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
                            <div className="w-12 h-12 rounded-3xl flex items-center justify-center font-bold text-xl shadow-sm"
                                 style={{ background: 'linear-gradient(135deg, #FF9500 0%, #FFAA33 100%)', color: 'white' }}>
                                <BrainCircuit className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-xl tracking-tight text-[#1C1C1E]">KONTEXT</h1>
                                <p className="text-xs font-semibold text-[#8E8E93]">Context as Moat</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                    >
                        {sidebarOpen ? <X className="w-5 h-5 text-[#8E8E93]" /> : <Menu className="w-5 h-5 text-[#8E8E93]" />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-2 overflow-hidden flex flex-col z-50 relative">
                    {sidebarOpen && (
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                            Your Projects
                        </div>
                    )}
                    
                    <div className="flex-1 overflow-y-auto space-y-1">
                        {contexts.map((ctx) => (
                            <button
                                key={ctx.id}
                                onClick={() => handleContextClick(ctx.id)}
                                className={clsx(
                                    "w-full text-left px-4 py-3 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] cursor-pointer",
                                )}
                                style={{
                                    backgroundColor: activeContext?.id === ctx.id ? '#FFFFFF' : 'transparent',
                                    boxShadow: activeContext?.id === ctx.id ? '0 2px 8px rgba(0, 0, 0, 0.08)' : 'none',
                                    color: activeContext?.id === ctx.id ? '#FF9500' : '#8E8E93'
                                }}
                                title={sidebarOpen ? undefined : ctx.name}
                            >
                                <Layers className="w-5 h-5 shrink-0" />
                                {sidebarOpen && <span className="truncate font-semibold text-sm">{ctx.name}</span>}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 space-y-2 border-t border-black/10 z-50 relative pointer-events-auto">
                    {sidebarOpen && (
                        <div className="p-4 rounded-3xl mb-2" style={{ background: 'linear-gradient(135deg, #6B7A3E15 0%, #8B945625 100%)' }}>
                          <div className="text-xs font-bold mb-1.5" style={{ color: '#6B7A3E' }}>💡 Pro Tip</div>
                          <p className="text-xs leading-relaxed font-medium" style={{ color: '#8E8E93' }}>
                            Log decisions as you make them to build your moat faster
                          </p>
                        </div>
                    )}

                    <Link
                        to="/create-project"
                        className={clsx(
                            "w-full px-4 py-3 rounded-2xl flex items-center gap-3 transition-all active:scale-95 cursor-pointer hover:bg-black/5",
                            sidebarOpen ? "justify-start" : "justify-center"
                        )}
                        style={{ color: '#8E8E93' }}
                        title={sidebarOpen ? undefined : "New Project"}
                    >
                        <Plus className="w-5 h-5 shrink-0" />
                        {sidebarOpen && <span className="text-sm font-semibold">New Project</span>}
                    </Link>

                    {activeContext && (
                        <>
                            {/* MODAL TRIGGERS */}
                            <button
                                onClick={() => setIsDecisionModalOpen(true)}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] cursor-pointer",
                                    sidebarOpen ? "justify-start" : "justify-center"
                                )}
                                style={{ background: 'linear-gradient(135deg, #FF9500 0%, #FFAA33 100%)', color: 'white', boxShadow: '0 4px 16px rgba(255, 149, 0, 0.25)' }}
                                title={sidebarOpen ? undefined : "Add Decision"}
                            >
                                <CheckCircle className="w-5 h-5 shrink-0" />
                                {sidebarOpen && <span className="text-sm font-semibold">Log Decision</span>}
                            </button>

                            <button
                                onClick={() => setIsFailureModalOpen(true)}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] cursor-pointer",
                                    sidebarOpen ? "justify-start" : "justify-center"
                                )}
                                style={{ backgroundColor: '#FF3B30', color: 'white', boxShadow: '0 4px 16px rgba(255, 59, 48, 0.25)' }}
                                title={sidebarOpen ? undefined : "Log Failure"}
                            >
                                <AlertTriangle className="w-5 h-5 shrink-0" />
                                {sidebarOpen && <span className="text-sm font-semibold">Log Failure</span>}
                            </button>

                            {/* ROUTING LINKS */}
                            <Link
                                to={`/context/${activeContext.id}`}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] cursor-pointer hover:bg-black/5",
                                    sidebarOpen ? "justify-start" : "justify-center",
                                    isActive('/context') ? "bg-white shadow-sm pointer-events-none" : ""
                                )}
                                style={{ color: isActive('/context') ? '#FF9500' : '#8E8E93' }}
                                title={sidebarOpen ? undefined : "Project Context"}
                            >
                                <BookOpen className="w-5 h-5 shrink-0" />
                                {sidebarOpen && <span className="text-sm font-semibold">Context</span>}
                            </Link>

                            <Link
                                to={`/team/${activeContext.id}`}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] cursor-pointer hover:bg-black/5",
                                    sidebarOpen ? "justify-start" : "justify-center",
                                    isActive('/team') ? "bg-white shadow-sm pointer-events-none" : ""
                                )}
                                style={{ color: isActive('/team') ? '#FF9500' : '#8E8E93' }}
                                title={sidebarOpen ? undefined : "Team"}
                            >
                                <Users className="w-5 h-5 shrink-0" />
                                {sidebarOpen && <span className="text-sm font-semibold">Team</span>}
                            </Link>

                            <Link
                                to={`/graph/${activeContext.id}`}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] cursor-pointer hover:bg-black/5",
                                    sidebarOpen ? "justify-start" : "justify-center",
                                    isActive('/graph') ? "bg-white shadow-sm pointer-events-none" : ""
                                )}
                                style={{ color: isActive('/graph') ? '#FF9500' : '#8E8E93' }}
                                title={sidebarOpen ? undefined : "Knowledge Graph"}
                            >
                                <Share2 className="w-5 h-5 shrink-0" />
                                {sidebarOpen && <span className="text-sm font-semibold">Graph</span>}
                            </Link>

                            <Link
                                to={`/dashboard/${activeContext.id}`}
                                className={clsx(
                                    "w-full px-4 py-3 rounded-2xl flex items-center gap-3 transition-all active:scale-[0.98] cursor-pointer hover:bg-black/5",
                                    sidebarOpen ? "justify-start" : "justify-center",
                                    isActive('/dashboard') ? "bg-white shadow-sm pointer-events-none" : ""
                                )}
                                style={{ color: isActive('/dashboard') ? '#FF9500' : '#8E8E93' }}
                                title={sidebarOpen ? undefined : "Analytics"}
                            >
                                <TrendingUp className="w-5 h-5 shrink-0" />
                                {sidebarOpen && <span className="text-sm font-semibold">Insights</span>}
                            </Link>
                        </>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                {children}
            </div>

            {/* Modals - Placed outside the layout flow so they never get trapped */}
            {isDecisionModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center">
                    <DecisionModal
                        isOpen={isDecisionModalOpen}
                        onClose={() => setIsDecisionModalOpen(false)}
                        onSubmit={async (data) => {
                            await logDecision(data);
                            setIsDecisionModalOpen(false); // Close on success
                        }}
                        isLoading={isLoading}
                    />
                </div>
            )}
            
            {isFailureModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center">
                    <FailureModal
                        isOpen={isFailureModalOpen}
                        onClose={() => setIsFailureModalOpen(false)}
                        onSubmit={async (data) => {
                            await logFailure(data);
                            setIsFailureModalOpen(false); // Close on success
                        }}
                        isLoading={isLoading}
                    />
                </div>
            )}
        </div>
    );
}