"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const failureController_1 = require("../controllers/failureController");
const router = (0, express_1.Router)();
router.get('/', failureController_1.getFailures);
router.post('/', failureController_1.createFailure);
router.delete('/:failureId', failureController_1.deleteFailure);
exports.default = router;
