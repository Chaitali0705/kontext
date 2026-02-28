import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { inviteTeamSchema } from '../validators';
import { sendError, sendSuccess } from '../utils/http';

const prisma = new PrismaClient();

export const getTeamMembers = async (req: Request, res: Response) => {
    const teamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
    
    if (!teamId) {
        return sendError(req, res, 400, 'Team ID is required');
    }
    
    try {
        const members = await prisma.user.findMany({
            where: { teamId },
            select: { id: true, email: true, name: true },
            orderBy: { name: 'asc' }
        });
        
        if (members.length === 0) {
            return sendSuccess(req, res, [], 'No team members found');
        }
        
        return sendSuccess(req, res, members, 'Team members fetched successfully');
    } catch (error) {
        console.error('GET TEAM MEMBERS ERROR:', error);
        return sendError(req, res, 500, 'Failed to fetch team members');
    }
};

export const inviteTeamMember = async (req: Request, res: Response) => {
    const teamId = Array.isArray(req.params.teamId) ? req.params.teamId[0] : req.params.teamId;
    const { email, name, role } = req.body;
    
    // Input validation
    if (!teamId) {
        return sendError(req, res, 400, 'Team ID is required');
    }
    
    if (!email || typeof email !== 'string' || !email.includes('@')) {
        return sendError(req, res, 400, 'Valid email address is required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
        return sendError(req, res, 400, 'Invalid email format');
    }
    
    if (name && typeof name !== 'string') {
        return sendError(req, res, 400, 'Member name must be a text string');
    }
    
    try {
        // Check if user exists
        let user = await prisma.user.findUnique({ where: { email: email.trim() } });
        
        if (user) {
            // User exists, just update team if needed
            if (user.teamId !== teamId) {
                user = await prisma.user.update({
                    where: { email: email.trim() },
                    data: { teamId, name: name ? name.trim() : user.name }
                });
            }
        } else {
            // Create new user as invitation
            user = await prisma.user.create({
                data: {
                    email: email.trim(),
                    name: name ? name.trim() : email.split('@')[0],
                    teamId
                }
            });
        }
        
        return sendSuccess(req, res, { id: user.id, email: user.email, name: user.name }, 'Team member invited successfully');
    } catch (error) {
        console.error('INVITE TEAM MEMBER ERROR:', error);
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
    
    // Input validation
    if (!teamId) {
        return sendError(req, res, 400, 'Team ID is required');
    }
    
    if (!userId) {
        return sendError(req, res, 400, 'User ID is required');
    }
    
    try {
        // Verify user exists before deletion
        const userExists = await prisma.user.findUnique({
            where: { id: userId }
        });
        
        if (!userExists) {
            return sendError(req, res, 404, 'User not found');
        }
        
        if (userExists.teamId !== teamId) {
            return sendError(req, res, 403, 'User does not belong to this team');
        }
        
        const result = await prisma.user.deleteMany({
            where: { id: userId, teamId }
        });
        
        if (result.count === 0) {
            return sendError(req, res, 404, 'Team member not found');
        }
        
        return sendSuccess(req, res, { deleted: result.count }, 'Team member removed successfully');
    } catch (error) {
        console.error('REMOVE TEAM MEMBER ERROR:', error);
        return sendError(req, res, 500, 'Failed to remove team member');
    }
};
