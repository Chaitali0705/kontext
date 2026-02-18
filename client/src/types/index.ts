// client/src/types/index.ts

export interface Context {
    id: string;
    name: string;
    description?: string;
    _count?: {
        decisions: number;
        failures: number;
    };
}

export interface Decision {
    id: string;
    title: string;
    status: 'active' | 'revisit_needed' | 'deprecated';
    createdAt: string;
}