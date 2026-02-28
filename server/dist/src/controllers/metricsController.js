"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMetrics = void 0;
const client_1 = require("@prisma/client");
const http_1 = require("../utils/http");
const prisma = new client_1.PrismaClient();
const monthKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
const getMetrics = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const projectId = String(req.query.projectId || req.query.contextId || '');
    if (!projectId) {
        return (0, http_1.sendError)(req, res, 400, 'Project is required');
    }
    try {
        const [decisions, failures] = yield Promise.all([
            prisma.decision.findMany({
                where: { contextId: projectId },
                select: {
                    id: true,
                    tags: true,
                    constraints: true,
                    createdAt: true,
                    timeSavedHours: true,
                    title: true
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
        const moatScore = Math.min(100, Math.round(decisionsCount * 4 +
            failuresCount * 2 +
            reuseRate * 0.6 +
            Math.max(0, decisionsCount - failuresCount) * 1.5 +
            Math.min(timeSavedDays, 20) * 2));
        // Decision graph metrics
        const decisionConnections = new Map();
        decisions.forEach((d) => {
            const signature = [...new Set([...d.tags, ...d.constraints])].join('|');
            decisionConnections.set(signature, (decisionConnections.get(signature) || 0) + 1);
        });
        const graphDensity = decisions.length > 0
            ? Number((decisionConnections.size / decisions.length).toFixed(2))
            : 0;
        const mostConnectedNode = Array.from(decisionConnections.entries())
            .sort((a, b) => b[1] - a[1])[0];
        // Build trend
        const trendMap = new Map();
        for (let i = 5; i >= 0; i--) {
            const d = new Date();
            d.setUTCDate(1);
            d.setUTCMonth(d.getUTCMonth() - i);
            trendMap.set(monthKey(d), { decisions: 0, failures: 0 });
        }
        decisions.forEach((item) => {
            const key = monthKey(item.createdAt);
            const current = trendMap.get(key);
            if (current)
                current.decisions += 1;
        });
        failures.forEach((item) => {
            const key = monthKey(item.createdAt);
            const current = trendMap.get(key);
            if (current)
                current.failures += 1;
        });
        const trend = [...trendMap.entries()].map(([month, values]) => ({
            month,
            decisions: values.decisions,
            failures: values.failures
        }));
        // Insights
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
        if (failuresCount > decisionsCount) {
            insights.push({ type: 'warning', message: '⚠️ Failures exceeding decisions. Document more decisions.' });
        }
        if (graphDensity > 0.5) {
            insights.push({ type: 'success', message: '🔗 High graph density. Decisions are well-connected.' });
        }
        return (0, http_1.sendSuccess)(req, res, {
            moatScore,
            decisionsCount,
            failuresCount,
            reuseRate,
            trend,
            timeSavedHours,
            timeSavedDays,
            graphDensity,
            mostConnectedNode: mostConnectedNode ? { signature: mostConnectedNode[0], count: mostConnectedNode[1] } : null,
            insights
        }, 'Metrics fetched');
    }
    catch (error) {
        console.error(error);
        return (0, http_1.sendError)(req, res, 500, 'Server error');
    }
});
exports.getMetrics = getMetrics;
