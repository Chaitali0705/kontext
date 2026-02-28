import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendError, sendSuccess } from '../utils/http';
import { generateAISummary } from '../utils/llmService';

const prisma = new PrismaClient();

const tokenize = (value: string): string[] =>
    value
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .map((t) => t.trim())
        .filter((t) => t.length > 2);

export const getGraph = async (req: Request, res: Response) => {
    const projectId = String(req.query.projectId || req.query.contextId || '');
    if (!projectId) {
        return sendError(req, res, 400, 'Project is required');
    }

    try {
        const [decisions, failures] = await Promise.all([
            prisma.decision.findMany({
                where: { contextId: projectId },
                select: { id: true, title: true, rationale: true, outcome: true, content: true }
            }),
            prisma.failure.findMany({
                where: { contextId: projectId },
                select: { id: true, title: true, whatFailed: true, whyFailed: true }
            })
        ]);

        const decisionNodes = await Promise.all(decisions.map(async (d) => ({
            id: `d_${d.id}`,
            label: d.title,
            summary: await generateAISummary(`${d.title}. ${d.rationale || d.content || ''}`, 12),
            type: 'decision' as const,
            color: '#FF9500'
        })));
        const failureNodes = await Promise.all(failures.map(async (f) => ({
            id: `f_${f.id}`,
            label: f.title,
            summary: await generateAISummary(`${f.title}. ${f.whyFailed}`, 12),
            type: 'failure' as const,
            color: '#FF3B30'
        })));
        const successNodes = await Promise.all(decisions
            .filter((d) => d.outcome === 'success')
            .map(async (d) => ({
                id: `s_${d.id}`,
                label: `Success: ${d.title}`,
                summary: await generateAISummary(`Success: ${d.rationale || d.content || ''}`, 10),
                type: 'success' as const,
                color: '#34C759'
            })));

        const edges: Array<{ source: string; target: string; color: string }> = [];

        decisions.forEach((d) => {
            if (d.outcome === 'success') {
                edges.push({ source: `d_${d.id}`, target: `s_${d.id}`, color: 'rgba(0,0,0,0.25)' });
            }
        });

        decisions.forEach((d) => {
            const decisionTokens = tokenize(`${d.title} ${d.rationale}`);
            failures.forEach((f) => {
                const failureTokens = tokenize(`${f.title} ${f.whatFailed} ${f.whyFailed}`);
                const overlaps = decisionTokens.filter((token) => failureTokens.includes(token)).length;
                if (overlaps >= 2) {
                    edges.push({
                        source: `d_${d.id}`,
                        target: `f_${f.id}`,
                        color: 'rgba(0,0,0,0.18)'
                    });
                }
            });
        });

        return sendSuccess(
            req,
            res,
            {
                nodes: [...decisionNodes, ...failureNodes, ...successNodes],
                edges
            },
            'Graph fetched'
        );
    } catch (error) {
        console.error(error);
        return sendError(req, res, 500, 'Server error');
    }
};
