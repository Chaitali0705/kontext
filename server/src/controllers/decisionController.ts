import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getDecisions = async (req: Request, res: Response) => {
    const { contextId } = req.query;
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

export const createDecision = async (req: Request, res: Response) => {
    const { title, content, rationale, tags, constraints, contextId } = req.body;
    try {
        const user = await prisma.user.findFirst();
        if (!user) throw new Error("No users found in database");

        const decision = await prisma.decision.create({
        data: {
            title,
            content,
            rationale,
            tags: tags || [],
            constraints: constraints || [], // Save the pillars
            brokenRules: [], // Starts with 0 broken rules
            status: 'active',
            contextId,
            authorId: user.id,
            alternatives: [],
            outcome: 'pending'
        }
        });
        res.json(decision);
    } catch (error) {
        console.error("🔥 DECISION SAVE ERROR:", error);
        res.status(500).json({ error: 'Failed to log decision' });
    }
};

// TRIGGER CONSTRAINT FAILURE
export const invalidateConstraint = async (req: Request, res: Response): Promise<any> => {
    // Wrap in String() to satisfy TypeScript
    const decisionId = String(req.params.decisionId); 
    const { brokenConstraint } = req.body;

    try {
        // ... inside invalidateConstraint ...
    const decision = await prisma.decision.findUnique({ where: { id: decisionId } });
    if (!decision) return res.status(404).json({ error: 'Decision not found' });

    // 🔴 ADD "(decision as any)" HERE to silence the red line:
    const updatedBrokenRules = [...((decision as any).brokenRules || []), brokenConstraint];
    
    // 🔴 ADD "as any" HERE to silence the red line:
    const updatedDecision = await prisma.decision.update({
        where: { id: decisionId },
        data: {
            brokenRules: updatedBrokenRules,
            status: 'warning'
        } as any // <-- Add 'as any' here!
    });

        res.json(updatedDecision);
    } catch (error) {
        console.error("🔥 CONSTRAINT INVALIDATION ERROR:", error);
        res.status(500).json({ error: 'Failed to invalidate constraint' });
    }
};