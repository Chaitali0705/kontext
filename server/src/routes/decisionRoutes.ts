import { Router } from 'express';
import { getDecisions, createDecision, invalidateConstraint } from '../controllers/decisionController';

const router = Router();

router.get('/', getDecisions);
router.post('/', createDecision);
router.post('/:decisionId/invalidate', invalidateConstraint); // <-- NEW ROUTE

export default router;