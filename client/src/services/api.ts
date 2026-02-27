// client/src/services/api.ts
import axios from 'axios';
import type { Context, GraphData, Metrics, SimilarDecision } from '../types';

// Create the axios instance
export const api = axios.create({
    baseURL: 'http://localhost:3001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Define the services
export const contextService = {
    getAll: async (): Promise<Context[]> => {
        const response = await api.get('/contexts');
        return response.data;
    },
    
    create: async (name: string, description: string, teamSize?: string): Promise<Context> => {
        const response = await api.post('/projects', { 
            name, 
            description, 
            teamSize
        });
        return response.data?.data ?? response.data;
    }
};

export const decisionService = {
  getSimilar: async (projectId: string, decisionId?: string): Promise<SimilarDecision[]> => {
    const response = await api.get('/decisions/similar', { params: { projectId, decisionId } });
    return response.data?.data ?? [];
  }
};

export const metricsService = {
  get: async (projectId: string): Promise<Metrics> => {
    const response = await api.get('/metrics', { params: { projectId } });
    return response.data?.data ?? response.data;
  }
};

export const graphService = {
  get: async (projectId: string): Promise<GraphData> => {
    const response = await api.get('/graph', { params: { projectId } });
    return response.data?.data ?? response.data;
  }
};

export const getApiErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
    if (!error.response) return 'Network error, retry';
    if (error.response.status === 409) return 'Project already exists';
    if (error.response.status === 400) return 'Project name is required';
    return 'Server error';
  }
  return 'Server error';
};
