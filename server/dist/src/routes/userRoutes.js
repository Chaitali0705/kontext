"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const userController_1 = require("../controllers/userController");
const router = (0, express_1.Router)();
router.get('/current', userController_1.getCurrentUser);
router.post('/:userId/onboarding-complete', userController_1.markOnboardingComplete);
router.patch('/onboarding', userController_1.patchOnboarding);
exports.default = router;
