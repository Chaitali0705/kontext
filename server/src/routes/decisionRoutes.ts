import { Router } from 'express';
import { getDecisions, createDecision, getSimilarDecisions, invalidateConstraint, deleteDecision } from '../controllers/decisionController';

const router = Router();

router.get('/', getDecisions);
router.get('/similar', getSimilarDecisions);
router.post('/', createDecision);
router.post('/:decisionId/invalidate', invalidateConstraint);
router.delete('/:decisionId', deleteDecision);

export default router;
