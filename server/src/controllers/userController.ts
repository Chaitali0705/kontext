import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { onboardingSchema } from '../validators';
import { sendError, sendSuccess } from '../utils/http';

const prisma = new PrismaClient();

// Mock auth - return current user (in real app, would use JWT/session)
export const getCurrentUser = async (req: Request, res: Response) => {
    try {
        // Try to get any user (for demo purposes)
        let user = await prisma.user.findFirst();
        
        if (!user) {
            // Create a default user if none exists
            user = await prisma.user.create({
                data: {
                    email: 'demo@kontext.ai',
                    name: 'Demo User',
                    teamId: (await prisma.team.findFirst())?.id || 
                            (await prisma.team.create({ data: { name: 'Demo Team' } })).id
                }
            });
        }
        
        const onboardingStep = (user as any).onboardingStep ?? (user.onboardingCompletedAt ? 4 : 1);
        return sendSuccess(req, res, { ...user, onboardingStep }, 'Current user fetched');
    } catch (error) {
        console.error(error);
        return sendError(req, res, 500, 'Failed to fetch current user');
    }
};

export const markOnboardingComplete = async (req: Request, res: Response) => {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    
    try {
        const user = await prisma.user.update({
            where: { id: userId },
            data: {
                onboardingCompletedAt: new Date(),
                onboardingStep: 4
            } as any
        });
        return sendSuccess(req, res, { ...user, onboardingStep: 4 }, 'Onboarding completed');
    } catch (error) {
        console.error(error);
        return sendError(req, res, 500, 'Failed to mark onboarding complete');
    }
};

export const patchOnboarding = async (req: Request, res: Response) => {
        const parsed = onboardingSchema.safeParse(req.body);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'Invalid request';
        return sendError(req, res, 400, firstError);
    }

    const { userId, step, completed } = parsed.data;

    try {
        let targetUserId = userId;
        if (!targetUserId) {
            const currentUser = await prisma.user.findFirst({ select: { id: true } });
            if (!currentUser) {
                return sendError(req, res, 404, 'User not found');
            }
            targetUserId = currentUser.id;
        }

        const user = await prisma.user.update({
            where: { id: targetUserId },
            data: {
                onboardingCompletedAt: completed || step === 4 ? new Date() : null,
                onboardingStep: step
            } as any
        });

        return sendSuccess(
            req,
            res,
            {
                userId: user.id,
                step,
                completed: !!user.onboardingCompletedAt
            },
            'Onboarding updated'
        );
    } catch (error) {
        console.error(error);
        return sendError(req, res, 500, 'Server error');
    }
};
