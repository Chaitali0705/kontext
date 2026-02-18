// server/src/routes/decisionRoutes.ts
import { Router } from 'express';
import { getDecisions, createDecision } from '../controllers/decisionController';

const router = Router();

router.get('/', getDecisions);
router.post('/', createDecision);

export default router;