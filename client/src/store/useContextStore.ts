import { create } from 'zustand';
import type { Context } from '../types';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = `${window.location.origin}/supabase-proxy`; 
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
    pendingInvites: any[]; fetchPendingInvites: () => Promise<void>; acceptInvite: (id: string) => Promise<void>; declineInvite: (id: string) => Promise<void>;
    // AI States
    grokInsights: string | null;
    isGeneratingInsights: boolean;
    graphInsights: string | null;
    isGeneratingGraphInsights: boolean;
    contextSummary: string | null;
    isGeneratingContextSummary: boolean;

    // Actions
    generateGrokInsights: () => Promise<void>;
    generateGraphInsights: () => Promise<void>;
    generateContextSummary: () => Promise<void>;
    removeTeamMember: (memberId: string) => Promise<void>;
    
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
    currentUser: null, 
    contexts: [], 
    activeContext: null, 
    teamMembers: [], 
    decisions: [], 
    failures: [], 
    isLoading: false, 
    onboardingCompleted: false, 
    authError: null, 
    grokInsights: null, 
    isGeneratingInsights: false, 
    graphInsights: null, 
    isGeneratingGraphInsights: false,
    contextSummary: null,
    isGeneratingContextSummary: false,

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

        // 1. Get projects the user created
        const { data: ownedContexts } = await supabase.from('contexts').select('*').eq('user_id', session.user.id);

        // 2. Get projects the user ACCEPTED an invite to
        const { data: memberships } = await supabase.from('team_members')
            .select('context_id')
            .eq('email', session.user.email)
            .eq('status', 'accepted'); // 👈 ONLY fetch accepted ones!
        
        let invitedContexts: any[] = [];
        if (memberships && memberships.length > 0) {
            const contextIds = memberships.map(m => m.context_id);
            const { data } = await supabase.from('contexts').select('*').in('id', contextIds);
            invitedContexts = data || [];
        }

        const allContexts = [...(ownedContexts || []), ...invitedContexts];
        const uniqueContexts = Array.from(new Map(allContexts.map(item => [item.id, item])).values());
        uniqueContexts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        set({ contexts: uniqueContexts, isLoading: false });
        
        if (uniqueContexts.length > 0 && !get().activeContext) {
            set({ activeContext: uniqueContexts[0] });
            get().fetchDecisions(uniqueContexts[0].id);
            get().fetchFailures(uniqueContexts[0].id);
            get().fetchTeamMembers(uniqueContexts[0].id);
        } else if (uniqueContexts.length === 0) {
            set({ activeContext: null, decisions: [], failures: [] });
        }

        // 👈 Also fetch the pending invites in the background!
        await get().fetchPendingInvites();
    },

    // ===== TEAM & INBOX (FULLY FUNCTIONAL) =====
    pendingInvites: [], // Add this to your interface at the top later if TS complains
    
    fetchPendingInvites: async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;
        
        // Supabase magic: Join the contexts table so we get the project name!
        const { data } = await supabase.from('team_members')
            .select(`id, role, created_at, contexts ( id, name, description )`)
            .eq('email', session.user.email)
            .eq('status', 'pending');
            
        set({ pendingInvites: data || [] });
    },
    acceptInvite: async (inviteId: string) => {
        await supabase.from('team_members').update({ status: 'accepted' }).eq('id', inviteId);
        await get().fetchPendingInvites(); // Clear it from inbox
        await get().fetchContexts();       // Load the new project into the sidebar!
    },

    declineInvite: async (inviteId: string) => {
        await supabase.from('team_members').delete().eq('id', inviteId);
        await get().fetchPendingInvites(); // Clear it from inbox
    },

    setActiveContext: (context) => {
        const currentContext = get().activeContext;
        set({ activeContext: context });
        if (!currentContext || currentContext.id !== context.id) {
            get().fetchDecisions(context.id);
            get().fetchFailures(context.id);
            
        }
    },

    createProject: async (name: string, description?: string, _teamSize?: string) => {
        set({ isLoading: true });
        const { data: { session } } = await supabase.auth.getSession();
        
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
    fetchTeamMembers: async (contextId: string) => { 
        const { data } = await supabase.from('team_members')
            .select('*')
            .eq('context_id', contextId)
            .order('created_at', { ascending: true });
        set({ teamMembers: data || [] }); 
    },

    inviteTeamMember: async (email: string, name?: string) => { 
        const state = get();
        if (!state.activeContext) return;

        const targetEmail = email.toLowerCase().trim();

        // 1. STRICT CHECK: Ask the database if this exact email is already in this exact project
        const { data: existingMember } = await supabase
            .from('team_members')
            .select('id')
            .eq('context_id', state.activeContext.id)
            .eq('email', targetEmail)
            .maybeSingle(); // maybeSingle doesn't crash if it finds nothing

        if (existingMember) {
            // If they are found, throw a hard error to stop the process!
            throw new Error("This user is already on the team or has a pending invite.");
        }

        // 2. If they are completely new, send the invite
        const { data, error } = await supabase.from('team_members').insert({
            context_id: state.activeContext.id,
            email: targetEmail,
            name: name || 'Invited User',
            role: 'Editor',
            status: 'pending' 
        }).select().single();

        if (error) throw error;
        
        // 3. Update the UI
        set((state) => ({ teamMembers: [...state.teamMembers, data] }));
    },
    removeTeamMember: async (memberId: string) => {
        // 1. Delete them from the database
        const { error } = await supabase.from('team_members').delete().eq('id', memberId);
        if (error) {
            console.error("Failed to remove member:", error);
            throw error;
        }
        
        // 2. Instantly remove them from the UI list
        set((state) => ({ 
            teamMembers: state.teamMembers.filter(m => m.id !== memberId) 
        }));
    },
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
    
    // ===== AI INSIGHTS (GROK/GROQ) =====
    generateGrokInsights: async () => {
        const state = get();
        if (!state.activeContext) return;

        set({ isGeneratingInsights: true, grokInsights: null });

        const prompt = `You are a Principal Software Engineer analyzing a team's institutional memory. 
        Project Name: ${state.activeContext.name}
        
        Decisions Made: 
        ${state.decisions.map(d => `- ${d.title}: ${d.rationale}`).join('\n')}
        
        Failures Logged:
        ${state.failures.map(f => `- ${f.title}: Failed because ${f.whyFailed}`).join('\n')}
        
        Based on this data, provide 3 brief, high-value, and slightly candid architectural insights or warnings for this team. Format as a short markdown list.`;

        try {
            const res = await fetch(`${window.location.origin}/grok-proxy/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer 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` 
                },
                body: JSON.stringify({
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
            set({ grokInsights: data.choices[0].message.content, isGeneratingInsights: false });
            
        } catch (error: any) {
            console.error("GROQ RAW ERROR:", error);
            set({ 
                isGeneratingInsights: false, 
                grokInsights: `❌ ${error.message}` 
            });
        }
    },

    // ===== GRAPH AI (GROQ) =====
    generateGraphInsights: async () => {
        const state = get();
        if (!state.activeContext) return;

        set({ isGeneratingGraphInsights: true, graphInsights: null });

        // Extract real team names so the AI knows exactly who is here
        // 1. We pre-format the exact bulleted list we want in JavaScript
        const teamDetails = state.teamMembers.length > 0 
            ? state.teamMembers.map((m: any) => `- ${m.name || 'Invited User'} (${m.email})`).join('\n') 
            : '- No team members added yet.';

        // 2. We force the AI to use our exact string as a template
        const prompt = `You are a strict copy-paste formatter. Copy the template below EXACTLY. Replace the bracketed instructions with bullet points using the provided data. 
        DO NOT invent names. DO NOT create tables. DO NOT add any greetings.

        TEMPLATE TO COPY:
        
        ### Project Overview
        [Write 3 bullet points summarizing this project: ${state.activeContext.name} - ${state.activeContext.description || 'No description'}]

        ### Key Architectural Decisions
        [Turn these decisions into concise bullet points: ${state.decisions.map((d: any) => `${d.title} (${d.rationale})`).join(' | ')}]

        ### Known Pitfalls to Avoid
        [Turn these failures into concise bullet points: ${state.failures.map((f: any) => `${f.title} (${f.whyFailed})`).join(' | ')}]

        ### Team Contacts
        ${teamDetails}
        `;
        try {
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer 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`
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-120b", 
                    messages: [
                        { role: "system", content: "You are a sharp graph data analyst." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.7
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`API Rejected: ${errText}`);
            }
            
            const data = await res.json();
            set({ graphInsights: data.choices[0].message.content, isGeneratingGraphInsights: false });
            
        } catch (error: any) {
            console.error("GRAPH AI ERROR:", error);
            set({ 
                isGeneratingGraphInsights: false, 
                graphInsights: `❌ ${error.message}` 
            });
        }
    },

    // ===== CONTEXT AI ONBOARDING SUMMARY =====
    generateContextSummary: async () => {
        const state = get();
        if (!state.activeContext) return;

        set({ isGeneratingContextSummary: true, contextSummary: null });

        const prompt = `You are an AI engineering manager helping onboard a new team member. 
        Project: ${state.activeContext.name}
        Description: ${state.activeContext.description || 'No description provided.'}
        
        Decisions Made:
        ${state.decisions.map(d => `- ${d.title}: ${d.rationale}`).join('\n')}
        
        Failures Logged:
        ${state.failures.map(f => `- ${f.title}: Failed because ${f.whyFailed}`).join('\n')}
        
        Based on this, write a clear, comprehensive, and structured onboarding summary for a new developer joining the team. Explain what the project is, the key architectural decisions they need to know, and the pitfalls (failures) to avoid. Format in markdown with clear headings.`;

        try {
            // Using the direct Groq API endpoint you had in generateGraphInsights
            const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer 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`
                },
                body: JSON.stringify({
                    model: "openai/gpt-oss-120b", 
                    messages: [
                        { role: "system", content: "You are a helpful technical onboarding assistant." },
                        { role: "user", content: prompt }
                    ],
                    temperature: 0.5
                })
            });

            if (!res.ok) {
                const errText = await res.text();
                throw new Error(`API Rejected: ${errText}`);
            }
            
            const data = await res.json();
            set({ contextSummary: data.choices[0].message.content, isGeneratingContextSummary: false });
            
        } catch (error: any) {
            console.error("CONTEXT AI ERROR:", error);
            set({ 
                isGeneratingContextSummary: false, 
                contextSummary: `❌ Failed to generate onboarding summary: ${error.message}` 
            });
        }
    },

    hasData: () => { const state = get(); return state.decisions.length > 0 || state.failures.length > 0; }
}));