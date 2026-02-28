// server/src/controllers/contextController.ts
import { Request, Response } from 'express';
import { Prisma, PrismaClient } from '@prisma/client';
import { createProjectSchema } from '../validators';
import { sendError, sendSuccess } from '../utils/http';

const prisma = new PrismaClient();

export const getContexts = async (req: Request, res: Response) => {
    try {
        const contexts = await prisma.context.findMany({
            include: {
                _count: {
                    select: { decisions: true, failures: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        
        if (contexts.length === 0) {
            return sendSuccess(req, res, [], 'No projects found');
        }
        
        return sendSuccess(req, res, contexts, 'Contexts fetched successfully');
    } catch (error) {
        console.error('GET CONTEXTS ERROR:', error);
        return sendError(req, res, 500, 'Failed to fetch contexts');
    }
};

export const createContext = async (req: Request, res: Response) => {
    try {
        const parsed = createProjectSchema.safeParse(req.body);
        if (!parsed.success) {
            const firstError = parsed.error.issues[0]?.message || 'Invalid request';
            return sendError(req, res, 400, firstError);
        }

        const { name, description, teamId } = parsed.data;

        const trimmedName = String(name ?? '').trim();
        if (!trimmedName) {
            return sendError(req, res, 400, 'Project name is required');
        }

        let team = null;
        if (teamId) {
            team = await prisma.team.findUnique({ where: { id: String(teamId) } });
            if (!team) return sendError(req, res, 400, 'Invalid teamId');
        } else {
            team = await prisma.team.findFirst();
            if (!team) {
                team = await prisma.team.create({ data: { name: 'Default Team' } });
            }
        }

        const duplicate = await prisma.context.findFirst({
            where: { teamId: team.id, name: trimmedName }
        });
        if (duplicate) {
            return sendError(req, res, 409, 'Project already exists');
        }

        const context = await prisma.context.create({
            data: {
                name: trimmedName,
                description: description ? String(description).trim() : null,
                teamId: team.id
            },
            include: {
                _count: { select: { decisions: true, failures: true } }
            }
        });

        if (req.baseUrl.includes('/projects')) {
            return sendSuccess(req, res, { id: context.id, name: context.name }, 'Project created', 200);
        }

        return sendSuccess(req, res, context, 'Context created', 201);
    } catch (error) {
        console.error('createContext error:', error);
        if (error instanceof Prisma.PrismaClientInitializationError) {
            return sendError(req, res, 503, 'Database unavailable, retry');
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2021') {
                return sendError(req, res, 500, 'Database schema mismatch. Run migrations.');
            }
        }
        return sendError(req, res, 500, 'Server error');
    }
};

export const getContextById = async (req: Request, res: Response) => {
    try {
        const contextId = Array.isArray(req.params.contextId) ? req.params.contextId[0] : req.params.contextId;
        const context = await prisma.context.findUnique({
            where: { id: contextId },
            include: {
                _count: {
                    select: { decisions: true, failures: true }
                }
            }
        });
        
        if (!context) {
            return sendError(req, res, 404, 'Context not found');
        }
        
        return sendSuccess(req, res, context, 'Context fetched');
    } catch (error) {
        return sendError(req, res, 500, 'Failed to fetch context');
    }
};

export const deleteContext = async (req: Request, res: Response) => {
    try {
        const contextId = Array.isArray(req.params.contextId) ? req.params.contextId[0] : req.params.contextId;
        
        if (!contextId) {
            return sendError(req, res, 400, 'Context ID is required');
        }
        
        const context = await prisma.context.findUnique({ where: { id: contextId } });
        if (!context) {
            return sendError(req, res, 404, 'Project not found');
        }

        // Delete context (cascade will delete related decisions and failures)
        const deleted = await prisma.context.delete({ where: { id: contextId } });
        
        return sendSuccess(req, res, { id: deleted.id }, 'Project deleted successfully');
    } catch (error) {
        console.error('DELETE CONTEXT ERROR:', error);
        return sendError(req, res, 500, 'Failed to delete project');
    }
};
