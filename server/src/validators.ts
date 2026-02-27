import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.preprocess(
    (val) => typeof val === 'string' ? val.trim() : val,
    z.string().min(1, 'Project name is required')
  ),
  description: z.preprocess(
    (val) => typeof val === 'string' ? val.trim() : val,
    z.string().optional()
  ),
  teamId: z.preprocess(
    (val) => typeof val === 'string' ? val.trim() : val,
    z.string().optional()
  ),
  teamSize: z.preprocess(
    (val) => typeof val === 'string' ? val.trim() : val,
    z.string().optional()
  )
});

export const inviteTeamSchema = z.object({
  projectId: z.preprocess(
    (val) => typeof val === 'string' ? val.trim() : val,
    z.string().min(1, 'Project is required').optional()
  ),
  teamId: z.preprocess(
    (val) => typeof val === 'string' ? val.trim() : val,
    z.string().min(1, 'Team is required').optional()
  ),
  email: z.preprocess(
    (val) => typeof val === 'string' ? val.trim() : val,
    z.string().email('Invalid email format')
  ),
  name: z.preprocess(
    (val) => typeof val === 'string' ? val.trim() : val,
    z.string().optional()
  ),
  role: z.preprocess(
    (val) => typeof val === 'string' ? val.trim() : val,
    z.string().min(1, 'Role is required')
  )
});

export const onboardingSchema = z.object({
  userId: z.preprocess(
    (val) => typeof val === 'string' ? val.trim() : val,
    z.string().min(1, 'User is required').optional()
  ),
  step: z.number().int().min(1).max(4),
  completed: z.boolean().optional()
});
