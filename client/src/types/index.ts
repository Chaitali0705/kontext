// client/src/types/index.ts

export interface Context {
    id: string;
    name: string;
    description?: string;
    teamId?: string;
    _count?: {
        decisions: number;
        failures: number;
    };
}

export interface Decision {
    id: string;
    title: string;
    content: string;
    rationale: string;
    status: 'active' | 'revisit_needed' | 'deprecated';
    createdAt: string;
    tags: string[];
    constraints: string[];
    author?: { name: string };
}

export interface SimilarDecision {
    id: string;
    title: string;
    score: number;
    createdAt: string;
}

export interface MetricsTrendPoint {
    month: string;
    decisions: number;
    failures: number;
}

export interface MetricsInsight {
    type: 'success' | 'info' | 'warning';
    message: string;
}

export interface Metrics {
    moatScore: number;
    decisionsCount: number;
    failuresCount: number;
    reuseRate: number;
    trend: MetricsTrendPoint[];
    timeSavedHours: number;
    timeSavedDays: number;
    graphDensity: number;
    mostConnectedNode?: { signature: string; count: number } | null;
    insights: MetricsInsight[];
}

export interface GraphNode {
    id: string;
    label: string;
    summary?: string;
    type: 'decision' | 'failure' | 'success';
    color: string;
}

export interface GraphEdge {
    source: string;
    target: string;
    color: string;
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}
