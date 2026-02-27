import { Router } from 'express';
import { getContexts, createContext, getContextById, deleteContext } from '../controllers/contextController';

const router = Router();

router.get('/', getContexts);
router.post('/', createContext);
router.get('/:contextId', getContextById);
router.delete('/:contextId', deleteContext);

export default router;