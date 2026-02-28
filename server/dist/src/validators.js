"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onboardingSchema = exports.inviteTeamSchema = exports.createProjectSchema = void 0;
const zod_1 = require("zod");
exports.createProjectSchema = zod_1.z.object({
    name: zod_1.z.preprocess((val) => typeof val === 'string' ? val.trim() : val, zod_1.z.string().min(1, 'Project name is required')),
    description: zod_1.z.preprocess((val) => typeof val === 'string' ? val.trim() : val, zod_1.z.string().optional()),
    teamId: zod_1.z.preprocess((val) => typeof val === 'string' ? val.trim() : val, zod_1.z.string().optional()),
    teamSize: zod_1.z.preprocess((val) => typeof val === 'string' ? val.trim() : val, zod_1.z.string().optional())
});
exports.inviteTeamSchema = zod_1.z.object({
    projectId: zod_1.z.preprocess((val) => typeof val === 'string' ? val.trim() : val, zod_1.z.string().min(1, 'Project is required').optional()),
    teamId: zod_1.z.preprocess((val) => typeof val === 'string' ? val.trim() : val, zod_1.z.string().min(1, 'Team is required').optional()),
    email: zod_1.z.preprocess((val) => typeof val === 'string' ? val.trim() : val, zod_1.z.string().email('Invalid email format')),
    name: zod_1.z.preprocess((val) => typeof val === 'string' ? val.trim() : val, zod_1.z.string().optional()),
    role: zod_1.z.preprocess((val) => typeof val === 'string' ? val.trim() : val, zod_1.z.string().min(1, 'Role is required'))
});
exports.onboardingSchema = zod_1.z.object({
    userId: zod_1.z.preprocess((val) => typeof val === 'string' ? val.trim() : val, zod_1.z.string().min(1, 'User is required').optional()),
    step: zod_1.z.number().int().min(1).max(4),
    completed: zod_1.z.boolean().optional()
});
