import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrainCircuit, AlertTriangle, ChevronRight } from 'lucide-react';
import { useContextStore } from '../store/useContextStore';

export default function LandingPage() {
  const store = useContextStore();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' });

  // Intelligent Routing: Bulletproof handoff to your friend's pages
  useEffect(() => {
    if (store.currentUser && !store.isLoading) {
      if (store.contexts.length > 0) {
        // If they have projects, grab the first one and go to the dashboard
        const targetId = store.activeContext?.id || store.contexts[0].id;
        navigate(`/dashboard/${targetId}`);
      } else {
        // If they have zero projects, send them to the project creation flow
        navigate('/create-project');
      }
    }
  }, [store.currentUser, store.contexts, store.activeContext, store.isLoading, navigate]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Custom Validation (so the button doesn't silently fail)
    if (!authForm.email.includes('@')) {
      useContextStore.setState({ authError: 'Please enter a valid email address.' });
      return;
    }
    if (authForm.password.length < 6) {
      useContextStore.setState({ authError: 'Password must be at least 6 characters.' });
      return;
    }

    if (isLogin) {
      await store.login({ email: authForm.email, password: authForm.password });
    } else {
      await store.register(authForm);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] flex flex-col items-center justify-center p-4 font-sans">
      <div className="w-full max-w-[420px]">
        {/* Logo Header */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <div className="bg-gradient-to-br from-[#FFB340] to-[#FF9500] p-3 rounded-2xl shadow-sm mb-4">
            <BrainCircuit className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#1C1C1E] tracking-tight mb-2">Kontext</h1>
          <p className="text-[#8E8E93] text-[15px]">The institutional memory engine for elite teams.</p>
        </div>

        {/* Auth Card */}
        <div className="bg-white rounded-[24px] p-8 shadow-[0_2px_16px_rgba(0,0,0,0.06)] border border-black/5">
          <h2 className="text-xl font-semibold text-[#1C1C1E] mb-6">
            {isLogin ? 'Sign in to workspace' : 'Create your workspace'}
          </h2>

          {store.authError && (
            <div className="mb-6 p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl flex items-center gap-2 text-sm text-[#FF3B30]">
              <AlertTriangle className="w-4 h-4 shrink-0" /> 
              {store.authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4" noValidate>
            {!isLogin && (
              <div>
                <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-1.5 ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={authForm.name} 
                  onChange={e => setAuthForm({...authForm, name: e.target.value})} 
                  placeholder="Steve Jobs" 
                  className="w-full bg-[#F2F2F7] border-transparent focus:border-[#FF9500] focus:ring-2 focus:ring-[#FF9500]/20 rounded-xl px-4 py-3 text-[#1C1C1E] transition-all outline-none" 
                />
              </div>
            )}
            
            <div>
              <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-1.5 ml-1">Work Email</label>
              <input 
                type="email" 
                value={authForm.email} 
                onChange={e => setAuthForm({...authForm, email: e.target.value})} 
                placeholder="name@company.com" 
                className="w-full bg-[#F2F2F7] border-transparent focus:border-[#FF9500] focus:ring-2 focus:ring-[#FF9500]/20 rounded-xl px-4 py-3 text-[#1C1C1E] transition-all outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8E8E93] uppercase tracking-wider mb-1.5 ml-1">Password</label>
              <input 
                type="password" 
                value={authForm.password} 
                onChange={e => setAuthForm({...authForm, password: e.target.value})} 
                placeholder="••••••••" 
                className="w-full bg-[#F2F2F7] border-transparent focus:border-[#FF9500] focus:ring-2 focus:ring-[#FF9500]/20 rounded-xl px-4 py-3 text-[#1C1C1E] transition-all outline-none" 
              />
            </div>

            <button 
              type="submit" 
              disabled={store.isLoading}
              className="w-full bg-[#1C1C1E] hover:bg-[#2C2C2E] text-white font-medium py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {store.isLoading ? 'Processing...' : (isLogin ? 'Continue to Dashboard' : 'Create Free Account')}
              {!store.isLoading && <ChevronRight className="w-4 h-4 opacity-70" />}
            </button>
          </form>
        </div>

        {/* Toggle Links */}
        <div className="mt-8 text-center text-[15px] text-[#8E8E93]">
          {isLogin ? "Don't have an account? " : "Already have a workspace? "}
          <button 
            onClick={() => { 
              setIsLogin(!isLogin); 
              useContextStore.setState({ authError: null }); 
            }} 
            className="text-[#FF9500] font-semibold hover:text-[#E08300] transition-colors"
          >
            {isLogin ? 'Sign up' : 'Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}