import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getFailures = async (req: Request, res: Response) => {
    const { contextId } = req.query;
    try {
        const failures = await prisma.failure.findMany({
        where: { contextId: String(contextId) },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true } } }
        });
        res.json(failures);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch failures' });
    }
};

export const createFailure = async (req: Request, res: Response) => {
    const { title, whatFailed, whyFailed, costEstimate, contextId } = req.body;
    try {
        // Automatically find our seeded user (Alice Engineer)
        const user = await prisma.user.findFirst();
        
        if (!user) throw new Error("No users found in database");

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
        res.json(failure);
    } catch (error) {
        console.error("🔥 FAILURE SAVE ERROR:", error);
        res.status(500).json({ error: 'Failed to log failure' });
    }
};