import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendError, sendSuccess } from '../utils/http';

const prisma = new PrismaClient();

export const getDecisions = async (req: Request, res: Response) => {
  const { contextId } = req.query;
  try {
    const decisions = await prisma.decision.findMany({
      where: { contextId: String(contextId) },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { name: true } } }
    });
    return sendSuccess(req, res, decisions, 'Decisions fetched');
  } catch (error) {
    return sendError(req, res, 500, 'Failed to fetch decisions');
  }
};

export const createDecision = async (req: Request, res: Response) => {
  const { title, content, rationale, tags, constraints, alternatives, contextId } = req.body;
  try {
    const user = await prisma.user.findFirst();
    if (!user) return sendError(req, res, 404, 'User not found');

    const decision = await prisma.decision.create({
      data: {
        title,
        content,
        rationale,
        tags: tags || [],
        constraints: constraints || [],
        brokenRules: [],
        status: 'active',
        contextId,
        authorId: user.id,
        alternatives: alternatives || [],
        outcome: 'pending'
      }
    });
    return sendSuccess(req, res, decision, 'Decision logged');
  } catch (error) {
    console.error('DECISION SAVE ERROR:', error);
    return sendError(req, res, 500, 'Failed to log decision');
  }
};

const normalize = (value: string): string[] =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2);

const jaccard = (a: string[], b: string[]): number => {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter((token) => setB.has(token)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
};

export const getSimilarDecisions = async (req: Request, res: Response) => {
  const projectId = String(req.query.projectId || req.query.contextId || '');
  const decisionId = String(req.query.decisionId || '');

  if (!projectId) {
    return sendError(req, res, 400, 'Project is required');
  }

  try {
    const decisions = await prisma.decision.findMany({
      where: { contextId: projectId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        rationale: true,
        content: true,
        tags: true,
        constraints: true,
        createdAt: true
      }
    });

    if (decisions.length === 0) {
      return sendSuccess(req, res, [], 'No decisions found');
    }

    const target = decisionId ? decisions.find((item) => item.id === decisionId) : decisions[0];
    if (!target) {
      return sendError(req, res, 404, 'Decision not found');
    }

    const targetTokens = normalize(
      [target.title, target.content, target.rationale, ...target.tags, ...target.constraints].join(' ')
    );

    const similar = decisions
      .filter((item) => item.id !== target.id)
      .map((item) => {
        const candidateTokens = normalize(
          [item.title, item.content, item.rationale, ...item.tags, ...item.constraints].join(' ')
        );
        const score = jaccard(targetTokens, candidateTokens);
        return {
          id: item.id,
          title: item.title,
          score: Number(score.toFixed(3)),
          createdAt: item.createdAt
        };
      })
      .filter((item) => item.score >= 0.15)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return sendSuccess(req, res, similar, similar.length ? 'Similar decisions found' : 'No strong similarities yet');
  } catch (error) {
    console.error(error);
    return sendError(req, res, 500, 'Server error');
  }
};

export const invalidateConstraint = async (req: Request, res: Response) => {
  const decisionId = String(req.params.decisionId);
  const { brokenConstraint } = req.body;

  try {
    const decision = await prisma.decision.findUnique({ where: { id: decisionId } });
    if (!decision) return sendError(req, res, 404, 'Decision not found');

    const updatedBrokenRules = [...((decision as any).brokenRules || []), brokenConstraint];
    const updatedDecision = await prisma.decision.update({
      where: { id: decisionId },
      data: {
        brokenRules: updatedBrokenRules,
        status: 'warning'
      } as any
    });

    return sendSuccess(req, res, updatedDecision, 'Constraint invalidated');
  } catch (error) {
    console.error('CONSTRAINT INVALIDATION ERROR:', error);
    return sendError(req, res, 500, 'Failed to invalidate constraint');
  }
};

export const deleteDecision = async (req: Request, res: Response) => {
  const decisionId = String(req.params.decisionId);
  
  try {
    const decision = await prisma.decision.findUnique({ where: { id: decisionId } });
    if (!decision) return sendError(req, res, 404, 'Decision not found');

    await prisma.decision.delete({ where: { id: decisionId } });
    return sendSuccess(req, res, { id: decisionId }, 'Decision deleted');
  } catch (error) {
    console.error('DELETE DECISION ERROR:', error);
    return sendError(req, res, 500, 'Failed to delete decision');
  }
};
