import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendError, sendSuccess } from '../utils/http';

const prisma = new PrismaClient();

export const getFailures = async (req: Request, res: Response) => {
    const { contextId } = req.query;
    
    if (!contextId) {
        return sendError(req, res, 400, 'Context ID is required');
    }
    
    try {
        const failures = await prisma.failure.findMany({
            where: { contextId: String(contextId) },
            orderBy: { createdAt: 'desc' },
            include: { author: { select: { name: true, id: true } } }
        });
        
        if (failures.length === 0) {
            return sendSuccess(req, res, [], 'No failures logged for this project');
        }
        
        return sendSuccess(req, res, failures, 'Failures fetched successfully');
    } catch (error) {
        console.error('GET FAILURES ERROR:', error);
        return sendError(req, res, 500, 'Failed to fetch failures');
    }
};

export const createFailure = async (req: Request, res: Response) => {
    const { title, whatFailed, whyFailed, costEstimate, contextId } = req.body;
    
    // Input validation
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
        return sendError(req, res, 400, 'Title must be at least 3 characters long');
    }
    
    if (!whatFailed || typeof whatFailed !== 'string' || whatFailed.trim().length < 10) {
        return sendError(req, res, 400, 'What Failed description must be at least 10 characters long');
    }
    
    if (!whyFailed || typeof whyFailed !== 'string' || whyFailed.trim().length < 10) {
        return sendError(req, res, 400, 'Why Failed explanation must be at least 10 characters long');
    }
    
    if (!contextId || typeof contextId !== 'string') {
        return sendError(req, res, 400, 'Context ID is required');
    }
    
    const cost = Number(costEstimate) || 0;
    if (cost < 0 || cost > 10000000) {
        return sendError(req, res, 400, 'Cost estimate must be between 0 and 10,000,000');
    }
    
    try {
        // Automatically find our seeded user (Alice Engineer)
        const user = await prisma.user.findFirst();
        
        if (!user) return sendError(req, res, 404, 'User not found');

        const failure = await prisma.failure.create({
            data: {
                title: title.trim(),
                whatFailed: whatFailed.trim(),
                whyFailed: whyFailed.trim(),
                costEstimate: cost,
                contextId: contextId.trim(),
                authorId: user.id
            },
            include: { author: { select: { name: true, id: true } } }
        });
        return sendSuccess(req, res, failure, 'Failure logged successfully');
    } catch (error) {
        console.error("🔥 FAILURE SAVE ERROR:", error);
        return sendError(req, res, 500, 'Failed to log failure. Please try again.');
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
