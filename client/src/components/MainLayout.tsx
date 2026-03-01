import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom'; 
import { BrainCircuit, Layers, Plus, Users, X, Menu, Share2, CheckCircle, AlertTriangle, TrendingUp, BookOpen, LogOut, Bell, Check } from 'lucide-react';
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
    
    // 🔥 THE FIX: We define 'store' here so the entire object is available for the UI
    const store = useContextStore();
    const { contexts, activeContext, setActiveContext, logDecision, logFailure, isLoading, logout } = store;
    
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
    const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
    const [isInvitesOpen, setIsInvitesOpen] = useState(false);

    const handleContextClick = (contextId: string) => {
        const context = contexts.find((c: any) => c.id === contextId);
        if (context) {
            setActiveContext(context);
            navigate(`/dashboard/${contextId}`);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/'); 
    };

    const isActive = (path: string) => location.pathname.includes(path);

    return (
        <div className="flex h-screen bg-[#F2F2F7] text-[#1C1C1E] font-sans overflow-hidden">
            {/* Sidebar */}
            <div className={clsx(
                "backdrop-blur-xl border-r border-black/10 flex flex-col z-50 shrink-0 transition-all duration-300 relative", 
                sidebarOpen ? "w-72" : "w-20"
            )}
            style={{ backgroundColor: 'rgba(249, 249, 249, 0.8)' }}>
                
                {/* Logo (Fixed at Top) */}
                <div className="p-6 pb-5 flex items-center justify-between shrink-0">
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

                {/* Master Scrollable Area for everything below the logo */}
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col z-50 relative pb-4">
                    
                    {/* Navigation (Projects) */}
                    <nav className="px-4 py-2 flex flex-col shrink-0">
                        {sidebarOpen && (
                            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 mt-2">
                                Your Projects
                            </div>
                        )}
                        
                        <div className="space-y-1">
                            {contexts.map((ctx: any) => (
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

                    {/* Spacer pushes bottom actions down on tall screens */}
                    <div className="mt-auto"></div>

                    {/* Bottom Actions */}
                    <div className="px-4 pt-4 space-y-2 border-t border-black/10 shrink-0 mt-4">
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
                        
                        {/* NOTIFICATION INBOX */}
                        <button
                            onClick={() => setIsInvitesOpen(true)}
                            className={clsx(
                                "w-full px-4 py-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer mb-2",
                                sidebarOpen ? "justify-start" : "justify-center",
                                store.pendingInvites?.length > 0 
                                    ? "bg-[#007AFF]/10 text-[#007AFF] font-bold shadow-sm ring-1 ring-[#007AFF]/20" 
                                    : "text-[#8E8E93] hover:bg-black/5"
                            )}
                            title={sidebarOpen ? undefined : "Invitations"}
                        >
                            <div className="relative flex items-center justify-center">
                                <Bell className="w-5 h-5 shrink-0" />
                                {store.pendingInvites?.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#007AFF] opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#007AFF]"></span>
                                    </span>
                                )}
                            </div>
                            {sidebarOpen && <span>Invitations {store.pendingInvites?.length > 0 && `(${store.pendingInvites.length})`}</span>}
                        </button>

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

                        <button
                            onClick={handleLogout}
                            className={clsx(
                                "w-full px-4 py-3 rounded-2xl flex items-center gap-3 transition-all active:scale-95 cursor-pointer hover:bg-[#FF3B30]/10 hover:text-[#FF3B30] mt-2",
                                sidebarOpen ? "justify-start" : "justify-center"
                            )}
                            style={{ color: '#8E8E93' }}
                            title={sidebarOpen ? undefined : "Log Out"}
                        >
                            <LogOut className="w-5 h-5 shrink-0" />
                            {sidebarOpen && <span className="text-sm font-semibold">Log Out</span>}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                {children}
            </div>

            {/* Modals */}
            {isDecisionModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center">
                    <DecisionModal
                        isOpen={isDecisionModalOpen}
                        onClose={() => setIsDecisionModalOpen(false)}
                        onSubmit={async (data) => {
                            await logDecision(data);
                            setIsDecisionModalOpen(false); 
                        }}
                        isLoading={isLoading}
                    />
                </div>
            )}
            
            {/* INVITATIONS MODAL */}
            {isInvitesOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[24px] w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-[#1C1C1E] flex items-center gap-2">
                                <Bell className="w-5 h-5 text-[#007AFF]" /> Your Invitations
                            </h2>
                            <button onClick={() => setIsInvitesOpen(false)} className="p-2 bg-[#F2F2F7] hover:bg-[#E5E5EA] rounded-full cursor-pointer transition-colors">
                                <X className="w-4 h-4 text-[#8E8E93]" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {!store.pendingInvites || store.pendingInvites.length === 0 ? (
                                <p className="text-center text-[#8E8E93] py-8 font-medium">No pending invitations.</p>
                            ) : (
                                store.pendingInvites.map((invite: any) => (
                                    <div key={invite.id} className="p-4 rounded-xl border border-black/10 bg-[#F9F9F9] flex flex-col gap-3">
                                        <div>
                                            <h3 className="font-bold text-[#1C1C1E]">{invite.contexts?.name}</h3>
                                            <p className="text-xs text-[#8E8E93] mt-0.5">{invite.contexts?.description || "No description provided."}</p>
                                        </div>
                                        <div className="flex gap-2 mt-1">
                                            <button 
                                                onClick={() => store.acceptInvite(invite.id)}
                                                className="flex-1 bg-gradient-to-r from-[#007AFF] to-[#005bb5] text-white font-bold py-2 rounded-lg text-sm hover:brightness-110 cursor-pointer flex items-center justify-center gap-1"
                                            >
                                                <Check className="w-4 h-4" /> Accept
                                            </button>
                                            <button 
                                                onClick={() => store.declineInvite(invite.id)}
                                                className="flex-1 bg-[#F2F2F7] hover:bg-[#E5E5EA] text-[#FF3B30] font-bold py-2 rounded-lg text-sm cursor-pointer"
                                            >
                                                Decline
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {isFailureModalOpen && (
                <div className="fixed inset-0 z-[999] flex items-center justify-center">
                    <FailureModal
                        isOpen={isFailureModalOpen}
                        onClose={() => setIsFailureModalOpen(false)}
                        onSubmit={async (data) => {
                            await logFailure(data);
                            setIsFailureModalOpen(false); 
                        }}
                        isLoading={isLoading}
                    />
                </div>
            )}
        </div>
    );
}