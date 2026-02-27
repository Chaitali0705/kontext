import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { inviteTeamSchema } from '../validators';
import { sendError, sendSuccess } from '../utils/http';

const prisma = new PrismaClient();

export const getTeamMembers = async (req: Request, res: Response) => {
    const teamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
    try {
        const members = await prisma.user.findMany({
            where: { teamId },
            select: { id: true, email: true, name: true }
        });
        return sendSuccess(req, res, members, 'Team members fetched');
    } catch (error) {
        return sendError(req, res, 500, 'Failed to fetch team members');
    }
};

export const inviteTeamMember = async (req: Request, res: Response) => {
    const teamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
    const { email, name, role } = req.body;
    
    try {
        // Check if user exists
        let user = await prisma.user.findUnique({ where: { email } });
        
        if (user) {
            // User exists, just update team if needed
            if (user.teamId !== teamId) {
                user = await prisma.user.update({
                    where: { email },
                    data: { teamId }
                });
            }
        } else {
            // Create new user as invitation
            user = await prisma.user.create({
                data: {
                    email,
                    name: name || email.split('@')[0],
                    teamId
                }
            });
        }
        
        return sendSuccess(req, res, user, 'Invite sent');
    } catch (error) {
        console.error(error);
        return sendError(req, res, 500, 'Failed to invite team member');
    }
};

export const inviteTeamMemberByProject = async (req: Request, res: Response) => {
    const parsed = inviteTeamSchema.safeParse(req.body);
    if (!parsed.success) {
        const firstError = parsed.error.issues[0]?.message || 'Invalid request';
        return sendError(req, res, 400, firstError);
    }

    const { projectId, teamId, email, name } = parsed.data;

    try {
        let resolvedTeamId = teamId;

        if (!resolvedTeamId && projectId) {
            const context = await prisma.context.findUnique({
                where: { id: projectId },
                select: { teamId: true }
            });
            if (!context) {
                return sendError(req, res, 400, 'Invalid projectId');
            }
            resolvedTeamId = context.teamId;
        }

        if (!resolvedTeamId) {
            return sendError(req, res, 400, 'Team is required');
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.teamId === resolvedTeamId) {
            return sendError(req, res, 409, 'Member already invited');
        }

        const user = existing
            ? await prisma.user.update({
                  where: { email },
                  data: { teamId: resolvedTeamId, name: name || existing.name }
              })
            : await prisma.user.create({
                  data: {
                      email,
                      name: name || email.split('@')[0],
                      teamId: resolvedTeamId
                  }
              });

        return sendSuccess(req, res, { id: user.id, email: user.email, name: user.name }, 'Invite sent');
    } catch (error) {
        console.error(error);
        return sendError(req, res, 500, 'Server error');
    }
};

export const removeTeamMember = async (req: Request, res: Response) => {
    const teamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    
    try {
        const user = await prisma.user.deleteMany({
            where: { id: userId, teamId }
        });
        return sendSuccess(req, res, { deleted: user.count }, 'Team member removed');
    } catch (error) {
        return sendError(req, res, 500, 'Failed to remove team member');
    }
};
