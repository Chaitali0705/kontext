import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendError, sendSuccess } from '../utils/http';

const prisma = new PrismaClient();

export const getFailures = async (req: Request, res: Response) => {
    const { contextId } = req.query;
    try {
        const failures = await prisma.failure.findMany({
        where: { contextId: String(contextId) },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true } } }
        });
        return sendSuccess(req, res, failures, 'Failures fetched');
    } catch (error) {
        return sendError(req, res, 500, 'Failed to fetch failures');
    }
};

export const createFailure = async (req: Request, res: Response) => {
    const { title, whatFailed, whyFailed, costEstimate, contextId } = req.body;
    try {
        // Automatically find our seeded user (Alice Engineer)
        const user = await prisma.user.findFirst();
        
        if (!user) return sendError(req, res, 404, 'User not found');

        const failure = await prisma.failure.create({
        data: {
            title,
            whatFailed,
            whyFailed,
            costEstimate: Number(costEstimate) || 0, // Fallback to 0 if left blank
            contextId,
            authorId: user.id // Use the REAL database ID
        }
        });
        return sendSuccess(req, res, failure, 'Failure logged');
    } catch (error) {
        console.error("🔥 FAILURE SAVE ERROR:", error);
        return sendError(req, res, 500, 'Failed to log failure');
    }
};

export const deleteFailure = async (req: Request, res: Response) => {
    const failureId = String(req.params.failureId);
    
    try {
        const failure = await prisma.failure.findUnique({ where: { id: failureId } });
        if (!failure) return sendError(req, res, 404, 'Failure not found');

        await prisma.failure.delete({ where: { id: failureId } });
        return sendSuccess(req, res, { id: failureId }, 'Failure deleted');
    } catch (error) {
        console.error("🔥 DELETE FAILURE ERROR:", error);
        return sendError(req, res, 500, 'Failed to delete failure');
    }
};
