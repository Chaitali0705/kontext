import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendError, sendSuccess } from '../utils/http';
import { generateAISummary } from '../utils/llmService';

const prisma = new PrismaClient();

const monthKey = (date: Date): string =>
    `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;

export const getMetrics = async (req: Request, res: Response) => {
    const projectId = String(req.query.projectId || req.query.contextId || '');
    if (!projectId) {
        return sendError(req, res, 400, 'Project ID is required');
    }

    try {
        const [decisions, failures] = await Promise.all([
            prisma.decision.findMany({
                where: { contextId: projectId },
                select: { 
                    id: true, 
                    tags: true, 
                    constraints: true, 
                    createdAt: true,
                    timeSavedHours: true,
                    title: true,
                    authorId: true
                }
            }),
            prisma.failure.findMany({
                where: { contextId: projectId },
                select: { 
                    id: true, 
                    createdAt: true,
                    title: true
                }
            })
        ]);

        const decisionsCount = decisions.length;
        const failuresCount = failures.length;

        // Calculate reused decisions
        const reusedDecisions = decisions.filter((d, idx) => {
            const pool = decisions.slice(0, idx);
            return pool.some((other) => {
                const tagsOverlap = other.tags.some((tag) => d.tags.includes(tag));
                const constraintsOverlap = other.constraints.some((c) => d.constraints.includes(c));
                return tagsOverlap || constraintsOverlap;
            });
        }).length;

        const reuseRate = decisionsCount === 0 ? 0 : Number(((reusedDecisions / decisionsCount) * 100).toFixed(1));

        // Calculate time saved
        const timeSavedHours = decisions.reduce((sum, d) => sum + (d.timeSavedHours || 0), 0);
        const timeSavedDays = Number((timeSavedHours / 8).toFixed(1));

        // Calculate moat score with enhanced formula
        const moatScore = Math.min(
            100,
            Math.round(
                decisionsCount * 4 +
                    failuresCount * 2 +
                    reuseRate * 0.6 +
                    Math.max(0, decisionsCount - failuresCount) * 1.5 +
                    Math.min(timeSavedDays, 20) * 2
            )
        );

        // Decision graph metrics
        const decisionConnections = new Map<string, number>();
        decisions.forEach((d) => {
            const signature = [...new Set([...d.tags, ...d.constraints])].join('|');
            decisionConnections.set(signature, (decisionConnections.get(signature) || 0) + 1);
        });

        const graphDensity = decisions.length > 0 
            ? Number((decisionConnections.size / decisions.length).toFixed(2))
            : 0;

        const mostConnectedNode = Array.from(decisionConnections.entries())
            .sort((a, b) => b[1] - a[1])[0];

        // Calculate Bus Factor (team knowledge concentration)
        const authorDecisionCount = new Map<string, number>();
        decisions.forEach((d) => {
            authorDecisionCount.set(d.authorId, (authorDecisionCount.get(d.authorId) || 0) + 1);
        });

        let busFactor = decisions.length; // worst case: all decisions by one person
        if (authorDecisionCount.size > 0) {
            const maxAuthorDecisions = Math.max(...authorDecisionCount.values());
            const concentrationRatio = (maxAuthorDecisions / decisionsCount) * 100;
            busFactor = concentrationRatio > 80 ? 1 : concentrationRatio > 50 ? 2 : 3;
        }

        // Build trend
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

        // Generate insights
        const insights = [];
        if (moatScore >= 70) {
            insights.push({ type: 'success', message: '🔥 Excellent moat building. Your knowledge system is highly reusable.' });
        }
        if (reuseRate >= 50) {
            insights.push({ type: 'success', message: '📚 Strong pattern recognition. Decisions are building on each other.' });
        }
        if (timeSavedDays > 0) {
            insights.push({ type: 'info', message: `⏱️ Time saved: ${timeSavedDays} days of future decisions` });
        }
        if (failuresCount > decisionsCount && decisionsCount > 0) {
            insights.push({ type: 'warning', message: '⚠️ Failures exceeding decisions. Document more decisions.' });
        }
        if (graphDensity > 0.5) {
            insights.push({ type: 'success', message: '🔗 High graph density. Decisions are well-connected.' });
        }
        if (busFactor === 1) {
            insights.push({ type: 'warning', message: '🚨 CRITICAL: Bus Factor is 1. Single person holds 80%+ of decisions.' });
        } else if (busFactor === 2) {
            insights.push({ type: 'warning', message: '⚠️ Bus Factor is 2. Knowledge concentration risk detected.' });
        }

        return sendSuccess(
            req,
            res,
            {
                moatScore,
                decisionsCount,
                failuresCount,
                reuseRate,
                trend,
                timeSavedHours,
                timeSavedDays,
                graphDensity,
                mostConnectedNode: mostConnectedNode ? { signature: mostConnectedNode[0], count: mostConnectedNode[1] } : null,
                busFactor,
                insights
            },
            'Metrics fetched'
        );
    } catch (error) {
        console.error('METRICS ERROR:', error);
        return sendError(req, res, 500, 'Failed to fetch metrics');
    }
};

// Generate AI-powered project context for onboarding
export const generateProjectContext = async (req: Request, res: Response) => {
    const projectId = String(req.query.projectId || req.query.contextId || '');
    if (!projectId) {
        return sendError(req, res, 400, 'Project ID is required');
    }

    try {
        // Fetch project context
        const context = await prisma.context.findUnique({
            where: { id: projectId },
            include: { team: true }
        });

        if (!context) {
            return sendError(req, res, 404, 'Project not found');
        }

        // Fetch all related data
        const [decisions, failures, team] = await Promise.all([
            prisma.decision.findMany({
                where: { contextId: projectId },
                include: { author: { select: { name: true, email: true } } },
                take: 50
            }),
            prisma.failure.findMany({
                where: { contextId: projectId },
                include: { author: { select: { name: true, email: true } } },
                take: 30
            }),
            prisma.user.findMany({
                where: { teamId: context.teamId || '' }
            })
        ]);

        // Extract key information
        const uniqueTags = new Set<string>();
        const uniqueConstraints = new Set<string>();
        decisions.forEach(d => {
            d.tags?.forEach(t => uniqueTags.add(t));
            d.constraints?.forEach(c => uniqueConstraints.add(c));
        });

        const topDecisions = decisions.slice(0, 5).map(d => d.title).join(', ');
        const topFailures = failures.slice(0, 5).map(f => f.title).join(', ');

        // Generate AI-powered context summary
        const contextSummary = await generateAISummary({
            text: `Project: ${context.name}. Description: ${context.description || 'No description'}. Key decisions: ${topDecisions || 'None yet'}. Documented failures: ${topFailures || 'None yet'}. Team size: ${team.length}. Key focus areas: ${Array.from(uniqueTags).slice(0, 5).join(', ') || 'General'}`,
            maxWords: 50,
            context: 'general'
        });

        return sendSuccess(
            req,
            res,
            {
                projectId,
                projectName: context.name,
                projectDescription: context.description,
                contextSummary,
                statistics: {
                    totalDecisions: decisions.length,
                    totalFailures: failures.length,
                    teamSize: team.length,
                    tagsCount: uniqueTags.size,
                    constraintsCount: uniqueConstraints.size
                },
                topTags: Array.from(uniqueTags).slice(0, 10),
                topConstraints: Array.from(uniqueConstraints).slice(0, 10),
                recentDecisions: decisions.slice(0, 5).map(d => ({
                    id: d.id,
                    title: d.title,
                    author: d.author?.name || 'Unknown',
                    createdAt: d.createdAt
                })),
                recentFailures: failures.slice(0, 5).map(f => ({
                    id: f.id,
                    title: f.title,
                    author: f.author?.name || 'Unknown',
                    createdAt: f.createdAt
                })),
                teamMembers: team.map(m => ({
                    id: m.id,
                    email: m.email,
                    name: m.name
                }))
            },
            'Project context generated'
        );
    } catch (error) {
        console.error('PROJECT CONTEXT ERROR:', error);
        return sendError(req, res, 500, 'Failed to generate project context');
    }
};

// Generate AI-powered insights for project decisions
export const generateProjectInsights = async (req: Request, res: Response) => {
    const projectId = String(req.query.projectId || req.query.contextId || '');
    if (!projectId) {
        return sendError(req, res, 400, 'Project ID is required');
    }

    try {
        // Fetch all decisions and failures
        const [decisions, failures] = await Promise.all([
            prisma.decision.findMany({
                where: { contextId: projectId }
            }),
            prisma.failure.findMany({
                where: { contextId: projectId }
            })
        ]);

        // Analyze patterns
        const tagFrequency = new Map<string, number>();
        const constraintFrequency = new Map<string, number>();

        decisions.forEach(d => {
            d.tags?.forEach(t => tagFrequency.set(t, (tagFrequency.get(t) || 0) + 1));
            d.constraints?.forEach(c => constraintFrequency.set(c, (constraintFrequency.get(c) || 0) + 1));
        });

        const topTags = Array.from(tagFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag, count]) => ({ tag, count }));

        const topConstraints = Array.from(constraintFrequency.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([constraint, count]) => ({ constraint, count }));

        // Generate insights based on patterns
        const insightsList: any[] = [];

        // Pattern-based insights
        if (topTags.length > 0) {
            const topTag = topTags[0];
            const insight = await generateAISummary({
                text: `The project has ${topTag.count} decisions related to "${topTag.tag}". This is a critical focus area.`,
                maxWords: 20,
                context: 'general'
            });
            insightsList.push({
                type: 'pattern',
                category: 'top_focus',
                title: `Primary Focus: ${topTag.tag}`,
                description: insight,
                relatedCount: topTag.count
            });
        }

        if (topConstraints.length > 0) {
            const topConstraint = topConstraints[0];
            insightsList.push({
                type: 'pattern',
                category: 'constraint_analysis',
                title: `Key Constraint: ${topConstraint.constraint}`,
                description: `This constraint appears in ${topConstraint.count} decisions. Consider documenting mitigation strategies.`,
                relatedCount: topConstraint.count
            });
        }

        // Failure analysis insights
        if (failures.length > 0 && decisions.length > 0) {
            const failureRate = Math.round((failures.length / (decisions.length + failures.length)) * 100);
            if (failureRate > 20) {
                insightsList.push({
                    type: 'warning',
                    category: 'failure_rate',
                    title: 'High Failure Rate Detected',
                    description: `${failureRate}% of tracked items are failures. Consider reviewing decision criteria and constraints.`,
                    relatedCount: failures.length
                });
            } else if (failureRate < 10) {
                insightsList.push({
                    type: 'success',
                    category: 'low_failure_rate',
                    title: 'Low Failure Rate',
                    description: `Only ${failureRate}% failures. Your decision-making process is working well.`,
                    relatedCount: failures.length
                });
            }
        }

        // Recommendation generation
        const recommendations: string[] = [];
        if (decisions.length < 5) {
            recommendations.push('Start logging decisions to build a knowledge base for your team');
        }
        if (failures.length === 0 && decisions.length > 5) {
            recommendations.push('Consider documenting failures to learn from past mistakes');
        }
        if (topConstraints.length === 0) {
            recommendations.push('Add constraints to decisions to capture trade-offs and requirements');
        }

        return sendSuccess(
            req,
            res,
            {
                insights: insightsList,
                recommendations,
                patterns: {
                    topTags,
                    topConstraints
                },
                summary: {
                    totalDecisions: decisions.length,
                    totalFailures: failures.length,
                    uniqueTags: new Set(decisions.flatMap(d => d.tags || [])).size,
                    uniqueConstraints: new Set(decisions.flatMap(d => d.constraints || [])).size
                }
            },
            'Project insights generated'
        );
    } catch (error) {
        console.error('PROJECT INSIGHTS ERROR:', error);
        return sendError(req, res, 500, 'Failed to generate project insights');
    }
};
