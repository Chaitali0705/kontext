import { Router } from 'express';
import { getFailures, createFailure } from '../controllers/failureController';

const router = Router();

router.get('/', getFailures);
router.post('/', createFailure);

export default router;