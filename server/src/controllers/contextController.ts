// server/src/controllers/contextController.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const getContexts = async (req: Request, res: Response) => {
    try {
        const contexts = await prisma.context.findMany({
        include: {
            _count: {
            select: { decisions: true, failures: true }
            }
        }
        });
        res.json(contexts);
    } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contexts' });
    }
};

export const createContext = async (req: Request, res: Response) => {
    try {
        const { name, description, teamId } = req.body;
        const context = await prisma.context.create({
        data: { name, description, teamId }
        });
        res.json(context);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create context' });
    }
};