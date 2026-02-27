import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendError, sendSuccess } from '../utils/http';

const prisma = new PrismaClient();

const monthKey = (date: Date): string =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

export const getMetrics = async (req: Request, res: Response) => {
    const projectId = String(req.query.projectId || req.query.contextId || '');
    if (!projectId) {
        return sendError(req, res, 400, 'Project is required');
    }

    try {
        const [decisions, failures] = await Promise.all([
            prisma.decision.findMany({
                where: { contextId: projectId },
                select: { id: true, tags: true, constraints: true, createdAt: true }
            }),
            prisma.failure.findMany({
                where: { contextId: projectId },
                select: { id: true, createdAt: true }
            })
        ]);

        const decisionsCount = decisions.length;
        const failuresCount = failures.length;

        const reusedDecisions = decisions.filter((d, idx) => {
            const pool = decisions.slice(0, idx);
            return pool.some((other) => {
                const tagsOverlap = other.tags.some((tag) => d.tags.includes(tag));
                const constraintsOverlap = other.constraints.some((c) => d.constraints.includes(c));
                return tagsOverlap || constraintsOverlap;
            });
        }).length;

        const reuseRate = decisionsCount === 0 ? 0 : Number(((reusedDecisions / decisionsCount) * 100).toFixed(1));
        const moatScore = Math.min(
            100,
            Math.round(
                decisionsCount * 4 +
                    failuresCount * 2 +
                    reuseRate * 0.6 +
                    Math.max(0, decisionsCount - failuresCount) * 1.5
            )
        );

        const trendMap = new Map<string, { decisions: number; failures: number }>();
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setUTCDate(1);
            d.setUTCMonth(d.getUTCMonth() - i);
            trendMap.set(monthKey(d), { decisions: 0, failures: 0 });
        }

        decisions.forEach((item) => {
            const key = monthKey(item.createdAt);
            const current = trendMap.get(key);
            if (current) current.decisions += 1;
        });

        failures.forEach((item) => {
            const key = monthKey(item.createdAt);
            const current = trendMap.get(key);
            if (current) current.failures += 1;
        });

        const trend = [...trendMap.entries()].map(([month, values]) => ({
            month,
            decisions: values.decisions,
            failures: values.failures
        }));

        return sendSuccess(
            req,
            res,
            {
                moatScore,
                decisionsCount,
                failuresCount,
                reuseRate,
                trend
            },
            'Metrics fetched'
        );
    } catch (error) {
        console.error(error);
        return sendError(req, res, 500, 'Server error');
    }
};
