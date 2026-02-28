"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const graphController_1 = require("../controllers/graphController");
const router = (0, express_1.Router)();
router.get('/', graphController_1.getGraph);
exports.default = router;
