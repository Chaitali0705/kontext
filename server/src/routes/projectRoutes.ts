import { Router } from 'express';
import { createContext, getContextById, getContexts } from '../controllers/contextController';

const router = Router();

router.get('/', getContexts);
router.post('/', createContext);
router.get('/:contextId', getContextById);

export default router;
