// client/src/services/api.ts
import axios from 'axios';
import { Context } from '../types';

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
    
    create: async (name: string, description: string): Promise<Context> => {
        // Hardcoding a demo team ID for now
        const response = await api.post('/contexts', { 
        name, 
        description, 
        teamId: 'demo-team-id' 
        });
        return response.data;
    }
};