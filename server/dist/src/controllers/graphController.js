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
exports.getGraph = void 0;
const client_1 = require("@prisma/client");
const http_1 = require("../utils/http");
const llmService_1 = require("../utils/llmService");
const prisma = new client_1.PrismaClient();
const tokenize = (value) => value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);
const getGraph = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const projectId = String(req.query.projectId || req.query.contextId || '');
    if (!projectId) {
        return (0, http_1.sendError)(req, res, 400, 'Project is required');
    }
    try {
        const [decisions, failures] = yield Promise.all([
            prisma.decision.findMany({
                where: { contextId: projectId },
                select: { id: true, title: true, rationale: true, outcome: true, content: true }
            }),
            prisma.failure.findMany({
                where: { contextId: projectId },
                select: { id: true, title: true, whatFailed: true, whyFailed: true }
            })
        ]);
        const decisionNodes = yield Promise.all(decisions.map((d) => __awaiter(void 0, void 0, void 0, function* () {
            return ({
                id: `d_${d.id}`,
                label: d.title,
                summary: yield (0, llmService_1.generateAISummary)(`${d.title}. ${d.rationale || d.content || ''}`, 12),
                type: 'decision',
                color: '#FF9500'
            });
        })));
        const failureNodes = yield Promise.all(failures.map((f) => __awaiter(void 0, void 0, void 0, function* () {
            return ({
                id: `f_${f.id}`,
                label: f.title,
                summary: yield (0, llmService_1.generateAISummary)(`${f.title}. ${f.whyFailed}`, 12),
                type: 'failure',
                color: '#FF3B30'
            });
        })));
        const successNodes = yield Promise.all(decisions
            .filter((d) => d.outcome === 'success')
            .map((d) => __awaiter(void 0, void 0, void 0, function* () {
            return ({
                id: `s_${d.id}`,
                label: `Success: ${d.title}`,
                summary: yield (0, llmService_1.generateAISummary)(`Success: ${d.rationale || d.content || ''}`, 10),
                type: 'success',
                color: '#34C759'
            });
        })));
        const edges = [];
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
        return (0, http_1.sendSuccess)(req, res, {
            nodes: [...decisionNodes, ...failureNodes, ...successNodes],
            edges
        }, 'Graph fetched');
    }
    catch (error) {
        console.error(error);
        return (0, http_1.sendError)(req, res, 500, 'Server error');
    }
});
exports.getGraph = getGraph;
