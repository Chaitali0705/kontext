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
exports.deleteDecision = exports.invalidateConstraint = exports.getSimilarDecisions = exports.createDecision = exports.getDecisions = void 0;
const client_1 = require("@prisma/client");
const http_1 = require("../utils/http");
const prisma = new client_1.PrismaClient();
const getDecisions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { contextId } = req.query;
    try {
        const decisions = yield prisma.decision.findMany({
            where: { contextId: String(contextId) },
            orderBy: { createdAt: 'desc' },
            include: { author: { select: { name: true } } }
        });
        return (0, http_1.sendSuccess)(req, res, decisions, 'Decisions fetched');
    }
    catch (error) {
        return (0, http_1.sendError)(req, res, 500, 'Failed to fetch decisions');
    }
});
exports.getDecisions = getDecisions;
const createDecision = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, content, rationale, tags, constraints, alternatives, contextId, timeSavedHours } = req.body;
    try {
        const user = yield prisma.user.findFirst();
        if (!user)
            return (0, http_1.sendError)(req, res, 404, 'User not found');
        const decision = yield prisma.decision.create({
            data: {
                title,
                content,
                rationale,
                tags: tags || [],
                constraints: constraints || [],
                brokenRules: [],
                status: 'active',
                contextId,
                authorId: user.id,
                alternatives: alternatives || [],
                outcome: 'pending',
                timeSavedHours: timeSavedHours || 0
            }
        });
        return (0, http_1.sendSuccess)(req, res, decision, 'Decision logged');
    }
    catch (error) {
        console.error('DECISION SAVE ERROR:', error);
        return (0, http_1.sendError)(req, res, 500, 'Failed to log decision');
    }
});
exports.createDecision = createDecision;
const normalize = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
const jaccard = (a, b) => {
    const setA = new Set(a);
    const setB = new Set(b);
    const intersection = [...setA].filter((token) => setB.has(token)).length;
    const union = new Set([...setA, ...setB]).size;
    return union === 0 ? 0 : intersection / union;
};
const getSimilarDecisions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const projectId = String(req.query.projectId || req.query.contextId || '');
    const decisionId = String(req.query.decisionId || '');
    if (!projectId) {
        return (0, http_1.sendError)(req, res, 400, 'Project is required');
    }
    try {
        const decisions = yield prisma.decision.findMany({
            where: { contextId: projectId },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                title: true,
                rationale: true,
                content: true,
                tags: true,
                constraints: true,
                createdAt: true
            }
        });
        if (decisions.length === 0) {
            return (0, http_1.sendSuccess)(req, res, [], 'No decisions found');
        }
        const target = decisionId ? decisions.find((item) => item.id === decisionId) : decisions[0];
        if (!target) {
            return (0, http_1.sendError)(req, res, 404, 'Decision not found');
        }
        const targetTokens = normalize([target.title, target.content, target.rationale, ...target.tags, ...target.constraints].join(' '));
        const similar = decisions
            .filter((item) => item.id !== target.id)
            .map((item) => {
            const candidateTokens = normalize([item.title, item.content, item.rationale, ...item.tags, ...item.constraints].join(' '));
            const score = jaccard(targetTokens, candidateTokens);
            return {
                id: item.id,
                title: item.title,
                score: Number(score.toFixed(3)),
                createdAt: item.createdAt
            };
        })
            .filter((item) => item.score >= 0.15)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
        return (0, http_1.sendSuccess)(req, res, similar, similar.length ? 'Similar decisions found' : 'No strong similarities yet');
    }
    catch (error) {
        console.error(error);
        return (0, http_1.sendError)(req, res, 500, 'Server error');
    }
});
exports.getSimilarDecisions = getSimilarDecisions;
const invalidateConstraint = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decisionId = String(req.params.decisionId);
    const { brokenConstraint } = req.body;
    try {
        const decision = yield prisma.decision.findUnique({ where: { id: decisionId } });
        if (!decision)
            return (0, http_1.sendError)(req, res, 404, 'Decision not found');
        const updatedBrokenRules = [...(decision.brokenRules || []), brokenConstraint];
        const updatedDecision = yield prisma.decision.update({
            where: { id: decisionId },
            data: {
                brokenRules: updatedBrokenRules,
                status: 'warning'
            }
        });
        return (0, http_1.sendSuccess)(req, res, updatedDecision, 'Constraint invalidated');
    }
    catch (error) {
        console.error('CONSTRAINT INVALIDATION ERROR:', error);
        return (0, http_1.sendError)(req, res, 500, 'Failed to invalidate constraint');
    }
});
exports.invalidateConstraint = invalidateConstraint;
const deleteDecision = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const decisionId = String(req.params.decisionId);
    try {
        const decision = yield prisma.decision.findUnique({ where: { id: decisionId } });
        if (!decision)
            return (0, http_1.sendError)(req, res, 404, 'Decision not found');
        yield prisma.decision.delete({ where: { id: decisionId } });
        return (0, http_1.sendSuccess)(req, res, { id: decisionId }, 'Decision deleted');
    }
    catch (error) {
        console.error('DELETE DECISION ERROR:', error);
        return (0, http_1.sendError)(req, res, 500, 'Failed to delete decision');
    }
});
exports.deleteDecision = deleteDecision;
