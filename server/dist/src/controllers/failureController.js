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
exports.deleteFailure = exports.createFailure = exports.getFailures = void 0;
const client_1 = require("@prisma/client");
const http_1 = require("../utils/http");
const prisma = new client_1.PrismaClient();
const getFailures = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { contextId } = req.query;
    if (!contextId) {
        return (0, http_1.sendError)(req, res, 400, 'Context ID is required');
    }
    try {
        const failures = yield prisma.failure.findMany({
            where: { contextId: String(contextId) },
            orderBy: { createdAt: 'desc' },
            include: { author: { select: { name: true, id: true } } }
        });
        if (failures.length === 0) {
            return (0, http_1.sendSuccess)(req, res, [], 'No failures logged for this project');
        }
        return (0, http_1.sendSuccess)(req, res, failures, 'Failures fetched successfully');
    }
    catch (error) {
        console.error('GET FAILURES ERROR:', error);
        return (0, http_1.sendError)(req, res, 500, 'Failed to fetch failures');
    }
});
exports.getFailures = getFailures;
const createFailure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, whatFailed, whyFailed, contextId } = req.body;
    // Input validation
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
        return (0, http_1.sendError)(req, res, 400, 'Title must be at least 3 characters long');
    }
    if (!whatFailed || typeof whatFailed !== 'string' || whatFailed.trim().length < 10) {
        return (0, http_1.sendError)(req, res, 400, 'What Failed description must be at least 10 characters long');
    }
    if (!whyFailed || typeof whyFailed !== 'string' || whyFailed.trim().length < 10) {
        return (0, http_1.sendError)(req, res, 400, 'Why Failed explanation must be at least 10 characters long');
    }
    if (!contextId || typeof contextId !== 'string') {
        return (0, http_1.sendError)(req, res, 400, 'Context ID is required');
    }
    try {
        // Automatically find our seeded user (Alice Engineer)
        const user = yield prisma.user.findFirst();
        if (!user)
            return (0, http_1.sendError)(req, res, 404, 'User not found');
        const failure = yield prisma.failure.create({
            data: {
                title: title.trim(),
                whatFailed: whatFailed.trim(),
                whyFailed: whyFailed.trim(),
                contextId: contextId.trim(),
                authorId: user.id
            },
            include: { author: { select: { name: true, id: true } } }
        });
        return (0, http_1.sendSuccess)(req, res, failure, 'Failure logged successfully');
    }
    catch (error) {
        console.error("🔥 FAILURE SAVE ERROR:", error);
        return (0, http_1.sendError)(req, res, 500, 'Failed to log failure. Please try again.');
    }
});
exports.createFailure = createFailure;
const deleteFailure = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const failureId = String(req.params.failureId);
    try {
        const failure = yield prisma.failure.findUnique({ where: { id: failureId } });
        if (!failure)
            return (0, http_1.sendError)(req, res, 404, 'Failure not found');
        yield prisma.failure.delete({ where: { id: failureId } });
        return (0, http_1.sendSuccess)(req, res, { id: failureId }, 'Failure deleted');
    }
    catch (error) {
        console.error("🔥 DELETE FAILURE ERROR:", error);
        return (0, http_1.sendError)(req, res, 500, 'Failed to delete failure');
    }
});
exports.deleteFailure = deleteFailure;
