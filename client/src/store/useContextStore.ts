// client/src/store/useContextStore.ts
import { create } from 'zustand';
import { Context } from '../types';
import { contextService } from '../services/api';

interface ContextState {
    contexts: Context[];
    activeContext: Context | null;
    isLoading: boolean;
    
    fetchContexts: () => Promise<void>;
    setActiveContext: (context: Context) => void;
}

export const useContextStore = create<ContextState>((set) => ({
    contexts: [],
    activeContext: null,
    isLoading: false,

    fetchContexts: async () => {
        set({ isLoading: true });
        try {
        const data = await contextService.getAll();
        set({ contexts: data, isLoading: false });
        
        // Auto-select the first context if we have data and nothing is selected
        if (data.length > 0) {
            set((state) => ({ 
            activeContext: state.activeContext || data[0] 
            }));
        }
        } catch (error) {
        console.error("Failed to fetch contexts", error);
        set({ isLoading: false });
        }
    },

    setActiveContext: (context) => set({ activeContext: context }),
}));