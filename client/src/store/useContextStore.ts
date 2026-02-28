// client/src/store/useContextStore.ts
import { create } from 'zustand';
import type { Context } from '../types';
import axios from 'axios';

interface User {
    id: string;
    email: string;
    name?: string;
    onboardingCompletedAt?: string;
    onboardingStep?: number;
}

interface TeamMember {
    id: string;
    email: string;
    name?: string;
}

interface Decision {
    id: string;
    title: string;
    content?: string;
    rationale: string;
    status?: string;
    tags?: string[];
    constraints?: string[];
    brokenRules?: string[];
    author?: { name: string };
    createdAt: string;
}

interface Failure {
    id: string;
    title: string;
    whatFailed: string;
    whyFailed: string;
    author?: { name: string };
    createdAt: string;
}

interface ContextState {
    // User & Auth
    currentUser: User | null;
    
    // Contexts/Projects
    contexts: Context[];
    activeContext: Context | null;
    
    // Team
    teamMembers: TeamMember[];
    
    // Data
    decisions: Decision[];
    failures: Failure[];
    
    // UI State
    isLoading: boolean;
    onboardingCompleted: boolean;
    
    // Methods - User
    fetchCurrentUser: () => Promise<void>;
    
    // Methods - Contexts
    fetchContexts: () => Promise<void>;
    setActiveContext: (context: Context) => void;
    createProject: (name: string, description?: string, teamSize?: string) => Promise<Context | null>;
    deleteProject: (contextId: string) => Promise<void>;
    
    // Methods - Team
    fetchTeamMembers: (teamId: string) => Promise<void>;
    inviteTeamMember: (email: string, name?: string, role?: string) => Promise<void>;
    
    // Methods - Data
    fetchDecisions: (contextId: string) => Promise<void>;
    fetchFailures: (contextId: string) => Promise<void>;
    logDecision: (data: any) => Promise<void>;
    logFailure: (data: any) => Promise<void>;
    deleteDecision: (decisionId: string) => Promise<void>;
    deleteFailure: (failureId: string) => Promise<void>;
    
    // Methods - Onboarding
    markOnboardingComplete: () => Promise<void>;
    updateOnboardingStep: (step: number, completed?: boolean) => Promise<void>;
    
    // Helpers
    hasData: () => boolean;
}

const API_BASE = 'http://localhost:3001/api';
const api = axios.create({ baseURL: API_BASE });

export const useContextStore = create<ContextState>((set, get) => ({
    currentUser: null,
    contexts: [],
    activeContext: null,
    teamMembers: [],
    decisions: [],
    failures: [],
    isLoading: false,
    onboardingCompleted: false,

    // ===== USER =====
    fetchCurrentUser: async () => {
        try {
            const response = await api.get('/users/current');
            const user = response.data?.data ?? response.data;
            set({ currentUser: user, onboardingCompleted: !!user.onboardingCompletedAt });
        } catch (error) {
            console.error('Failed to fetch current user', error);
        }
    },

    // ===== CONTEXTS =====
    fetchContexts: async () => {
        set({ isLoading: true });
        try {
            const response = await api.get('/contexts');
            const data = response.data?.data ?? response.data;
            set({ contexts: data, isLoading: false });
            
            if (data.length > 0 && !get().activeContext) {
                set({ activeContext: data[0] });
                get().fetchDecisions(data[0].id);
                get().fetchFailures(data[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch contexts', error);
            set({ isLoading: false });
        }
    },

    setActiveContext: (context) => {
        const currentContext = get().activeContext;
        set({ activeContext: context });
        
        // Only fetch if this is a different context or first load
        if (!currentContext || currentContext.id !== context.id) {
            get().fetchDecisions(context.id);
            get().fetchFailures(context.id);
            if (context.teamId) {
                get().fetchTeamMembers(context.teamId);
            }
        }
    },

    createProject: async (name: string, description?: string, teamSize?: string) => {
        set({ isLoading: true });
        try {
            const response = await api.post('/projects', {
                name,
                description,
                teamSize
            });

            const created = response.data?.data ?? response.data;
            await get().fetchContexts();
            const hydrated = get().contexts.find((ctx) => ctx.id === created.id) || created;

            set({ activeContext: hydrated, isLoading: false });
            get().fetchDecisions(hydrated.id);
            get().fetchFailures(hydrated.id);
            return hydrated;
        } catch (error) {
            set({ isLoading: false });
            throw error;
        }
    },

    deleteProject: async (contextId: string) => {
        try {
            await api.delete(`/contexts/${contextId}`);
            await get().fetchContexts();
            
            // If deleted project was active, clear it
            if (get().activeContext?.id === contextId) {
                set({ 
                    activeContext: null,
                    decisions: [],
                    failures: []
                });
            }
        } catch (error) {
            console.error('Failed to delete project', error);
            throw error;
        }
    },

    // ===== TEAM =====
    fetchTeamMembers: async (teamId: string) => {
        if (!teamId) return;
        try {
            const response = await api.get(`/teams/${teamId}/members`);
            set({ teamMembers: response.data?.data ?? response.data });
        } catch (error) {
            console.error('Failed to fetch team members', error);
        }
    },

    inviteTeamMember: async (email: string, name?: string, role?: string) => {
        try {
            const context = get().activeContext;
            if (!context) return;
            
            await api.post('/team/invite', {
                projectId: context.id,
                email,
                name,
                role
            });
            
            if (context.teamId) {
                get().fetchTeamMembers(context.teamId);
            }
        } catch (error) {
            console.error('Failed to invite team member', error);
            throw error;
        }
    },

    // ===== DECISIONS & FAILURES =====
    fetchDecisions: async (contextId: string) => {
        try {
            const response = await api.get(`/decisions?contextId=${contextId}`);
            set({ decisions: response.data?.data ?? response.data });
        } catch (error) {
            console.error('Failed to fetch decisions', error);
        }
    },

    fetchFailures: async (contextId: string) => {
        try {
            const response = await api.get(`/failures?contextId=${contextId}`);
            set({ failures: response.data?.data ?? response.data });
        } catch (error) {
            console.error('Failed to fetch failures', error);
        }
    },

    logDecision: async (data: any) => {
        try {
            const context = get().activeContext;
            if (!context) return;
            
            await api.post('/decisions', {
                ...data,
                contextId: context.id
            });
            
            get().fetchDecisions(context.id);
        } catch (error) {
            console.error('Failed to log decision', error);
        }
    },

    logFailure: async (data: any) => {
        try {
            const context = get().activeContext;
            if (!context) return;
            
            await api.post('/failures', {
                ...data,
                contextId: context.id
            });
            
            get().fetchFailures(context.id);
        } catch (error) {
            console.error('Failed to log failure', error);
        }
    },

    deleteDecision: async (decisionId: string) => {
        const context = get().activeContext;
        if (!context) return;
        
        // Optimistic update - remove from UI immediately
        set((state) => ({
            decisions: state.decisions.filter(d => d.id !== decisionId)
        }));
        
        try {
            await api.delete(`/decisions/${decisionId}`);
            // Success - optimistic update was correct, no need to refetch
        } catch (error: any) {
            console.error('Failed to delete decision', error);
            // Only refetch if it wasn't a 404 (404 means it was already deleted)
            if (error?.response?.status !== 404) {
                get().fetchDecisions(context.id);
            }
            throw error;
        }
    },

    deleteFailure: async (failureId: string) => {
        const context = get().activeContext;
        if (!context) return;
        
        // Optimistic update - remove from UI immediately
        set((state) => ({
            failures: state.failures.filter(f => f.id !== failureId)
        }));
        
        try {
            await api.delete(`/failures/${failureId}`);
            // Success - optimistic update was correct, no need to refetch
        } catch (error: any) {
            console.error('Failed to delete failure', error);
            // Only refetch if it wasn't a 404 (404 means it was already deleted)
            if (error?.response?.status !== 404) {
                get().fetchFailures(context.id);
            }
            throw error;
        }
    },

    // ===== ONBOARDING =====
    markOnboardingComplete: async () => {
        try {
            const user = get().currentUser;
            if (!user) return;
            
            await api.patch('/users/onboarding', {
                userId: user.id,
                step: 4,
                completed: true
            });
            set({ onboardingCompleted: true });
            
            const updated = await api.get('/users/current');
            set({ currentUser: updated.data?.data ?? updated.data });
        } catch (error) {
            console.error('Failed to mark onboarding complete', error);
        }
    },

    updateOnboardingStep: async (step: number, completed?: boolean) => {
        try {
            const user = get().currentUser;
            if (!user) return;
            await api.patch('/users/onboarding', {
                userId: user.id,
                step,
                completed: !!completed
            });
            const updated = await api.get('/users/current');
            const updatedUser = updated.data?.data ?? updated.data;
            set({
                currentUser: { ...updatedUser, onboardingStep: step },
                onboardingCompleted: !!updatedUser.onboardingCompletedAt
            });
        } catch (error) {
            console.error('Failed to update onboarding step', error);
        }
    },

    // ===== HELPERS =====
    hasData: () => {
        const state = get();
        return state.decisions.length > 0 || state.failures.length > 0;
    }
}));
