// server/src/routes/contextRoutes.ts
import { Router } from 'express';
import { getContexts, createContext } from '../controllers/contextController';

const router = Router();

router.get('/', getContexts);
router.post('/', createContext);

export default router;