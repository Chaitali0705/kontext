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
exports.patchOnboarding = exports.markOnboardingComplete = exports.getCurrentUser = void 0;
const client_1 = require("@prisma/client");
const validators_1 = require("../validators");
const http_1 = require("../utils/http");
const prisma = new client_1.PrismaClient();
// Mock auth - return current user (in real app, would use JWT/session)
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        // Try to get any user (for demo purposes)
        let user = yield prisma.user.findFirst({
            select: {
                id: true,
                email: true,
                name: true,
                teamId: true,
                onboardingStep: true,
                onboardingCompletedAt: true
            }
        });
        if (!user) {
            // Create a default user if none exists
            user = yield prisma.user.create({
                data: {
                    email: 'demo@kontext.ai',
                    name: 'Demo User',
                    teamId: ((_a = (yield prisma.team.findFirst())) === null || _a === void 0 ? void 0 : _a.id) ||
                        (yield prisma.team.create({ data: { name: 'Demo Team' } })).id
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    teamId: true,
                    onboardingStep: true,
                    onboardingCompletedAt: true
                }
            });
        }
        const onboardingStep = (_b = user.onboardingStep) !== null && _b !== void 0 ? _b : (user.onboardingCompletedAt ? 4 : 1);
        return (0, http_1.sendSuccess)(req, res, Object.assign(Object.assign({}, user), { onboardingStep }), 'Current user fetched');
    }
    catch (error) {
        console.error(error);
        return (0, http_1.sendError)(req, res, 500, 'Failed to fetch current user');
    }
});
exports.getCurrentUser = getCurrentUser;
const markOnboardingComplete = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    try {
        const user = yield prisma.user.update({
            where: { id: userId },
            data: {
                onboardingCompletedAt: new Date(),
                onboardingStep: 4
            }
        });
        return (0, http_1.sendSuccess)(req, res, Object.assign(Object.assign({}, user), { onboardingStep: 4 }), 'Onboarding completed');
    }
    catch (error) {
        console.error(error);
        return (0, http_1.sendError)(req, res, 500, 'Failed to mark onboarding complete');
    }
});
exports.markOnboardingComplete = markOnboardingComplete;
const patchOnboarding = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const parsed = validators_1.onboardingSchema.safeParse(req.body);
    if (!parsed.success) {
        const firstError = ((_a = parsed.error.issues[0]) === null || _a === void 0 ? void 0 : _a.message) || 'Invalid request';
        return (0, http_1.sendError)(req, res, 400, firstError);
    }
    const { userId, step, completed } = parsed.data;
    try {
        let targetUserId = userId;
        if (!targetUserId) {
            const currentUser = yield prisma.user.findFirst({ select: { id: true } });
            if (!currentUser) {
                return (0, http_1.sendError)(req, res, 404, 'User not found');
            }
            targetUserId = currentUser.id;
        }
        const user = yield prisma.user.update({
            where: { id: targetUserId },
            data: {
                onboardingCompletedAt: completed || step === 4 ? new Date() : null,
                onboardingStep: step
            },
            select: {
                id: true,
                email: true,
                name: true,
                teamId: true,
                onboardingStep: true,
                onboardingCompletedAt: true
            }
        });
        return (0, http_1.sendSuccess)(req, res, {
            userId: user.id,
            step,
            completed: !!user.onboardingCompletedAt
        }, 'Onboarding updated');
    }
    catch (error) {
        console.error(error);
        return (0, http_1.sendError)(req, res, 500, 'Server error');
    }
});
exports.patchOnboarding = patchOnboarding;
