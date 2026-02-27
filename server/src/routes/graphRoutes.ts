import { Router } from 'express';
import { getGraph } from '../controllers/graphController';

const router = Router();

router.get('/', getGraph);

export default router;
