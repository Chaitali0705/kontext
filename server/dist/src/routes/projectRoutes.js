"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const contextController_1 = require("../controllers/contextController");
const router = (0, express_1.Router)();
router.get('/', contextController_1.getContexts);
router.post('/', contextController_1.createContext);
router.get('/:contextId', contextController_1.getContextById);
exports.default = router;
