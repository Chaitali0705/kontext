import { create } from 'zustand';
import type { Context } from '../types';
import { createClient } from '@supabase/supabase-js';

// 🔴 PASTE YOUR SUPABASE KEYS HERE 🔴
const SUPABASE_URL = 'https://cgfqlmwlkrvkcpbrmper.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnZnFsbXdsa3J2a2NwYnJtcGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDYwNzksImV4cCI6MjA4Nzc4MjA3OX0.wev0IxY2mqhFPqno-uGQwzlEeaT2hQ5QnaISrJiymaU';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface User { id: string; email: string; name?: string; onboardingCompletedAt?: string; onboardingStep?: number; }
interface TeamMember { id: string; email: string; name?: string; }
interface Decision { id: string; title: string; content?: string; rationale: string; status?: string; constraints?: string[]; brokenRules?: string[]; author?: { name: string }; createdAt: string; }
interface Failure { id: string; title: string; whatFailed: string; whyFailed: string; costEstimate?: number; author?: { name: string }; createdAt: string; }

interface ContextState {
    currentUser: User | null;
    contexts: Context[];
    activeContext: Context | null;
    teamMembers: TeamMember[];
    decisions: Decision[];
    failures: Failure[];
    isLoading: boolean;
    onboardingCompleted: boolean;
    authError: string | null;
    // Add these under onboardingCompleted
    grokInsights: string | null;
    isGeneratingInsights: boolean;
    generateGrokInsights: () => Promise<void>;

    login: (data: any) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    fetchCurrentUser: () => Promise<void>;
    fetchContexts: () => Promise<void>;
    setActiveContext: (context: Context) => void;
    createProject: (name: string, description?: string, teamSize?: string) => Promise<Context | null>;
    deleteProject: (contextId: string) => Promise<void>;
    fetchTeamMembers: (teamId: string) => Promise<void>;
    inviteTeamMember: (email: string, name?: string, role?: string) => Promise<void>;
    fetchDecisions: (contextId: string) => Promise<void>;
    fetchFailures: (contextId: string) => Promise<void>;
    logDecision: (data: any) => Promise<void>;
    logFailure: (data: any) => Promise<void>;
    deleteDecision: (decisionId: string) => Promise<void>;
    deleteFailure: (failureId: string) => Promise<void>;
    markOnboardingComplete: () => Promise<void>;
    updateOnboardingStep: (step: number, completed?: boolean) => Promise<void>;
    hasData: () => boolean;
}

export const useContextStore = create<ContextState>((set, get) => ({
    currentUser: null, contexts: [], activeContext: null, teamMembers: [], decisions: [], failures: [], isLoading: false, onboardingCompleted: false, authError: null, grokInsights: null, isGeneratingInsights: false,

    // ===== AUTH =====
    login: async (data) => {
        set({ authError: null, isLoading: true });
        const { data: authData, error } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
        if (error) { set({ authError: error.message, isLoading: false }); return; }
        if (authData.user) {
            set({ currentUser: { id: authData.user.id, email: authData.user.email || '', name: authData.user.user_metadata?.name || 'Engineer' }});
            await get().fetchContexts();
        }
    },

    register: async (data) => {
        set({ authError: null, isLoading: true });
        const { data: authData, error } = await supabase.auth.signUp({ email: data.email, password: data.password, options: { data: { name: data.name } } });
        if (error) { set({ authError: error.message, isLoading: false }); return; }
        if (authData.user) {
            set({ currentUser: { id: authData.user.id, email: authData.user.email || '', name: data.name }});
            await get().fetchContexts();
        }
    },

    logout: async () => {
        await supabase.auth.signOut();
        set({ currentUser: null, contexts: [], activeContext: null, decisions: [], failures: [] });
    },

    // ===== USER =====
    fetchCurrentUser: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            set({ currentUser: { id: session.user.id, email: session.user.email || '', name: session.user.user_metadata?.name || 'Engineer' }, onboardingCompleted: true });
        }
    },

    // ===== CONTEXTS =====
    fetchContexts: async () => {
        set({ isLoading: true });
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) { set({ isLoading: false }); return; }

        // 👈 BUG FIXED: Now we only fetch projects owned by THIS specific user
        const { data } = await supabase.from('contexts')
            .select('*')
            .eq('user_id', session.user.id) 
            .order('created_at', { ascending: true });
            
        set({ contexts: data || [], isLoading: false });
        
        if (data && data.length > 0 && !get().activeContext) {
            set({ activeContext: data[0] });
            get().fetchDecisions(data[0].id);
            get().fetchFailures(data[0].id);
        } else if (data && data.length === 0) {
            // Ensure we clear active context if they have no projects
            set({ activeContext: null, decisions: [], failures: [] });
        }
    },

    setActiveContext: (context) => {
        const currentContext = get().activeContext;
        set({ activeContext: context });
        if (!currentContext || currentContext.id !== context.id) {
            get().fetchDecisions(context.id);
            get().fetchFailures(context.id);
        }
    },

    createProject: async (name: string, description?: string, teamSize?: string) => {
        set({ isLoading: true });
        const { data: { session } } = await supabase.auth.getSession();
        
        // 👈 ATTACH PROJECT TO THE USER
        const { data, error } = await supabase.from('contexts').insert({ 
            name, 
            description,
            user_id: session?.user.id 
        }).select().single();
        
        if (error) { set({ isLoading: false }); throw error; }
        
        await get().fetchContexts();
        const hydrated = get().contexts.find((ctx) => ctx.id === data.id) || data;
        set({ activeContext: hydrated, isLoading: false });
        return hydrated;
    },

    deleteProject: async (contextId: string) => {
        await supabase.from('contexts').delete().eq('id', contextId);
        await get().fetchContexts();
        if (get().activeContext?.id === contextId) set({ activeContext: null, decisions: [], failures: [] });
    },

    // ===== TEAM (Mocked for Hackathon MVP) =====
    fetchTeamMembers: async () => { set({ teamMembers: [] }); },
    inviteTeamMember: async () => { console.log("Invites handled via Supabase Auth emails in V2"); },

    // ===== DECISIONS & FAILURES =====
    fetchDecisions: async (contextId: string) => {
        const { data } = await supabase.from('decisions').select('*').eq('context_id', contextId).order('created_at', { ascending: false });
        const formatted = (data || []).map((d: any) => ({ ...d, createdAt: d.created_at, brokenRules: d.broken_rules, author: { name: d.author_name } }));
        set({ decisions: formatted });
    },

    fetchFailures: async (contextId: string) => {
        const { data } = await supabase.from('failures').select('*').eq('context_id', contextId).order('created_at', { ascending: false });
        const formatted = (data || []).map((f: any) => ({ ...f, createdAt: f.created_at, whatFailed: f.what_failed, whyFailed: f.why_failed, costEstimate: f.cost_estimate, author: { name: f.author_name } }));
        set({ failures: formatted });
    },

    logDecision: async (data: any) => {
        const ctx = get().activeContext; if (!ctx) return;
        await supabase.from('decisions').insert({ title: data.title, rationale: data.rationale, constraints: data.constraints, context_id: ctx.id, author_name: get().currentUser?.name || 'Engineer' });
        get().fetchDecisions(ctx.id);
    },

    logFailure: async (data: any) => {
        const ctx = get().activeContext; if (!ctx) return;
        await supabase.from('failures').insert({ title: data.title, what_failed: data.whatFailed, why_failed: data.whyFailed, cost_estimate: data.costEstimate, context_id: ctx.id, author_name: get().currentUser?.name || 'Engineer' });
        get().fetchFailures(ctx.id);
    },

    deleteDecision: async (decisionId: string) => {
        set((state) => ({ decisions: state.decisions.filter(d => d.id !== decisionId) }));
        await supabase.from('decisions').delete().eq('id', decisionId);
    },

    deleteFailure: async (failureId: string) => {
        set((state) => ({ failures: state.failures.filter(f => f.id !== failureId) }));
        await supabase.from('failures').delete().eq('id', failureId);
    },

    // ===== ONBOARDING =====
    markOnboardingComplete: async () => { set({ onboardingCompleted: true }); },
    updateOnboardingStep: async () => { /* Handle local storage if needed */ },
    // ===== AI INSIGHTS (GROK) =====
    generateGrokInsights: async () => {
        const state = get();
        if (!state.activeContext) return;

        set({ isGeneratingInsights: true, grokInsights: null });

        // We bundle up the context for Grok to read
        const prompt = `You are a Principal Software Engineer analyzing a team's institutional memory. 
        Project Name: ${state.activeContext.name}
        
        Decisions Made: 
        ${state.decisions.map(d => `- ${d.title}: ${d.rationale}`).join('\n')}
        
        Failures Logged:
        ${state.failures.map(f => `- ${f.title}: Failed because ${f.whyFailed}`).join('\n')}
        
        Based on this data, provide 3 brief, high-value, and slightly candid architectural insights or warnings for this team. Format as a short markdown list.`;

        try {
            // 👈 1. Notice the URL changed to our new /groq-api proxy
            const res = await fetch('/groq-api/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 👈 2. PASTE YOUR GROQ KEY HERE (keep the backticks and Bearer word!)
                    'Authorization': `Bearer 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` 
                },
                body: JSON.stringify({
                    // 👈 3. Swapped to Llama 3 8B (insanely fast for hackathons)
                    model: "openai/gpt-oss-120b", 
                    messages: [
                        { role: "system", content: "You are a sharp, analytical AI engineering manager." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7
                })
            });

            if (!res.ok) {
                const errorText = await res.text(); 
                console.error("GROQ RAW ERROR BODY:", errorText);
                try {
                    const errorJson = JSON.parse(errorText);
                    throw new Error(errorJson.error?.message || `API Error: ${errorText}`);
                } catch {
                    throw new Error(`API Error: ${errorText}`);
                }
            }
            
            const data = await res.json();
            // We keep the variable named grokInsights so we don't have to rewrite your UI code!
            set({ grokInsights: data.choices[0].message.content, isGeneratingInsights: false });
            
        } catch (error: any) {
            console.error("GROQ RAW ERROR:", error);
            set({ 
                isGeneratingInsights: false, 
                grokInsights: `❌ ${error.message}` 
            });
        }
    },
    hasData: () => { const state = get(); return state.decisions.length > 0 || state.failures.length > 0; }
}));