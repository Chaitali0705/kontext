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
exports.deleteContext = exports.getContextById = exports.createContext = exports.getContexts = void 0;
const client_1 = require("@prisma/client");
const validators_1 = require("../validators");
const http_1 = require("../utils/http");
const prisma = new client_1.PrismaClient();
const getContexts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contexts = yield prisma.context.findMany({
            include: {
                _count: {
                    select: { decisions: true, failures: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        if (contexts.length === 0) {
            return (0, http_1.sendSuccess)(req, res, [], 'No projects found');
        }
        return (0, http_1.sendSuccess)(req, res, contexts, 'Contexts fetched successfully');
    }
    catch (error) {
        console.error('GET CONTEXTS ERROR:', error);
        return (0, http_1.sendError)(req, res, 500, 'Failed to fetch contexts');
    }
});
exports.getContexts = getContexts;
const createContext = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const parsed = validators_1.createProjectSchema.safeParse(req.body);
        if (!parsed.success) {
            const firstError = ((_a = parsed.error.issues[0]) === null || _a === void 0 ? void 0 : _a.message) || 'Invalid request';
            return (0, http_1.sendError)(req, res, 400, firstError);
        }
        const { name, description, teamId } = parsed.data;
        const trimmedName = String(name !== null && name !== void 0 ? name : '').trim();
        if (!trimmedName) {
            return (0, http_1.sendError)(req, res, 400, 'Project name is required');
        }
        let team = null;
        if (teamId) {
            team = yield prisma.team.findUnique({ where: { id: String(teamId) } });
            if (!team)
                return (0, http_1.sendError)(req, res, 400, 'Invalid teamId');
        }
        else {
            team = yield prisma.team.findFirst();
            if (!team) {
                team = yield prisma.team.create({ data: { name: 'Default Team' } });
            }
        }
        const duplicate = yield prisma.context.findFirst({
            where: { teamId: team.id, name: trimmedName }
        });
        if (duplicate) {
            return (0, http_1.sendError)(req, res, 409, 'Project already exists');
        }
        const context = yield prisma.context.create({
            data: {
                name: trimmedName,
                description: description ? String(description).trim() : null,
                teamId: team.id
            },
            include: {
                _count: { select: { decisions: true, failures: true } }
            }
        });
        if (req.baseUrl.includes('/projects')) {
            return (0, http_1.sendSuccess)(req, res, { id: context.id, name: context.name }, 'Project created', 200);
        }
        return (0, http_1.sendSuccess)(req, res, context, 'Context created', 201);
    }
    catch (error) {
        console.error('createContext error:', error);
        if (error instanceof client_1.Prisma.PrismaClientInitializationError) {
            return (0, http_1.sendError)(req, res, 503, 'Database unavailable, retry');
        }
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2021') {
                return (0, http_1.sendError)(req, res, 500, 'Database schema mismatch. Run migrations.');
            }
        }
        return (0, http_1.sendError)(req, res, 500, 'Server error');
    }
});
exports.createContext = createContext;
const getContextById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contextId = Array.isArray(req.params.contextId) ? req.params.contextId[0] : req.params.contextId;
        const context = yield prisma.context.findUnique({
            where: { id: contextId },
            include: {
                _count: {
                    select: { decisions: true, failures: true }
                }
            }
        });
        if (!context) {
            return (0, http_1.sendError)(req, res, 404, 'Context not found');
        }
        return (0, http_1.sendSuccess)(req, res, context, 'Context fetched');
    }
    catch (error) {
        return (0, http_1.sendError)(req, res, 500, 'Failed to fetch context');
    }
});
exports.getContextById = getContextById;
const deleteContext = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const contextId = Array.isArray(req.params.contextId) ? req.params.contextId[0] : req.params.contextId;
        if (!contextId) {
            return (0, http_1.sendError)(req, res, 400, 'Context ID is required');
        }
        const context = yield prisma.context.findUnique({ where: { id: contextId } });
        if (!context) {
            return (0, http_1.sendError)(req, res, 404, 'Project not found');
        }
        // Delete context (cascade will delete related decisions and failures)
        const deleted = yield prisma.context.delete({ where: { id: contextId } });
        return (0, http_1.sendSuccess)(req, res, { id: deleted.id }, 'Project deleted successfully');
    }
    catch (error) {
        console.error('DELETE CONTEXT ERROR:', error);
        return (0, http_1.sendError)(req, res, 500, 'Failed to delete project');
    }
});
exports.deleteContext = deleteContext;
