// server/src/controllers/decisionController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. GET ALL DECISIONS (For a specific context)
export const getDecisions = async (req: Request, res: Response) => {
    const { contextId } = req.query;
    
    if (!contextId) {
        return res.status(400).json({ error: 'Context ID is required' });
    }

    try {
        const decisions = await prisma.decision.findMany({
        where: { contextId: String(contextId) },
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { name: true } } }
        });
        res.json(decisions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch decisions' });
    }
};

// 2. LOG A NEW DECISION
export const createDecision = async (req: Request, res: Response) => {
    const { title, content, rationale, tags, contextId, authorId } = req.body;

    try {
        const decision = await prisma.decision.create({
        data: {
            title,
            content,
            rationale,
            tags: tags || [],
            contextId,
            authorId: authorId || 'demo-user-id', // We'll fix auth later
            // Default empty arrays for moat factors
            constraints: [],
            alternatives: [],
            outcome: 'pending'
        }
        });
        res.json(decision);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to log decision' });
    }
};