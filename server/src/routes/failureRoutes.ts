import { Router } from 'express';
import { getFailures, createFailure, deleteFailure } from '../controllers/failureController';

const router = Router();

router.get('/', getFailures);
router.post('/', createFailure);
router.delete('/:failureId', deleteFailure);

export default router;