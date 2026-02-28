import { Router } from 'express';
import { getMetrics, generateProjectContext, generateProjectInsights } from '../controllers/metricsController';

const router = Router();

router.get('/', getMetrics);
router.get('/context/generate', generateProjectContext);
router.get('/insights/generate', generateProjectInsights);

export default router;
