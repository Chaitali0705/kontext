import { Router } from 'express';
import { getCurrentUser, markOnboardingComplete, patchOnboarding } from '../controllers/userController';

const router = Router();

router.get('/current', getCurrentUser);
router.post('/:userId/onboarding-complete', markOnboardingComplete);
router.patch('/onboarding', patchOnboarding);

export default router;
