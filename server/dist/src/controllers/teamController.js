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
exports.removeTeamMember = exports.inviteTeamMemberByProject = exports.inviteTeamMember = exports.getTeamMembers = void 0;
const client_1 = require("@prisma/client");
const validators_1 = require("../validators");
const http_1 = require("../utils/http");
const prisma = new client_1.PrismaClient();
const getTeamMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const teamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
    try {
        const members = yield prisma.user.findMany({
            where: { teamId },
            select: { id: true, email: true, name: true }
        });
        return (0, http_1.sendSuccess)(req, res, members, 'Team members fetched');
    }
    catch (error) {
        return (0, http_1.sendError)(req, res, 500, 'Failed to fetch team members');
    }
});
exports.getTeamMembers = getTeamMembers;
const inviteTeamMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const teamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
    const { email, name, role } = req.body;
    try {
        // Check if user exists
        let user = yield prisma.user.findUnique({ where: { email } });
        if (user) {
            // User exists, just update team if needed
            if (user.teamId !== teamId) {
                user = yield prisma.user.update({
                    where: { email },
                    data: { teamId }
                });
            }
        }
        else {
            // Create new user as invitation
            user = yield prisma.user.create({
                data: {
                    email,
                    name: name || email.split('@')[0],
                    teamId
                }
            });
        }
        return (0, http_1.sendSuccess)(req, res, user, 'Invite sent');
    }
    catch (error) {
        console.error(error);
        return (0, http_1.sendError)(req, res, 500, 'Failed to invite team member');
    }
});
exports.inviteTeamMember = inviteTeamMember;
const inviteTeamMemberByProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const parsed = validators_1.inviteTeamSchema.safeParse(req.body);
    if (!parsed.success) {
        const firstError = ((_a = parsed.error.issues[0]) === null || _a === void 0 ? void 0 : _a.message) || 'Invalid request';
        return (0, http_1.sendError)(req, res, 400, firstError);
    }
    const { projectId, teamId, email, name } = parsed.data;
    try {
        let resolvedTeamId = teamId;
        if (!resolvedTeamId && projectId) {
            const context = yield prisma.context.findUnique({
                where: { id: projectId },
                select: { teamId: true }
            });
            if (!context) {
                return (0, http_1.sendError)(req, res, 400, 'Invalid projectId');
            }
            resolvedTeamId = context.teamId;
        }
        if (!resolvedTeamId) {
            return (0, http_1.sendError)(req, res, 400, 'Team is required');
        }
        const existing = yield prisma.user.findUnique({ where: { email } });
        if (existing && existing.teamId === resolvedTeamId) {
            return (0, http_1.sendError)(req, res, 409, 'Member already invited');
        }
        const user = existing
            ? yield prisma.user.update({
                where: { email },
                data: { teamId: resolvedTeamId, name: name || existing.name }
            })
            : yield prisma.user.create({
                data: {
                    email,
                    name: name || email.split('@')[0],
                    teamId: resolvedTeamId
                }
            });
        return (0, http_1.sendSuccess)(req, res, { id: user.id, email: user.email, name: user.name }, 'Invite sent');
    }
    catch (error) {
        console.error(error);
        return (0, http_1.sendError)(req, res, 500, 'Server error');
    }
});
exports.inviteTeamMemberByProject = inviteTeamMemberByProject;
const removeTeamMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const teamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    try {
        const user = yield prisma.user.deleteMany({
            where: { id: userId, teamId }
        });
        return (0, http_1.sendSuccess)(req, res, { deleted: user.count }, 'Team member removed');
    }
    catch (error) {
        return (0, http_1.sendError)(req, res, 500, 'Failed to remove team member');
    }
});
exports.removeTeamMember = removeTeamMember;
