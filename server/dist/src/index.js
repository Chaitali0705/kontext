"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const contextRoutes_1 = __importDefault(require("./routes/contextRoutes"));
const projectRoutes_1 = __importDefault(require("./routes/projectRoutes"));
const decisionRoutes_1 = __importDefault(require("./routes/decisionRoutes"));
const failureRoutes_1 = __importDefault(require("./routes/failureRoutes"));
const teamRoutes_1 = __importDefault(require("./routes/teamRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const metricsRoutes_1 = __importDefault(require("./routes/metricsRoutes"));
const graphRoutes_1 = __importDefault(require("./routes/graphRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)('dev'));
// Routes
app.use('/api/contexts', contextRoutes_1.default);
app.use('/api/projects', projectRoutes_1.default);
app.use('/api/decisions', decisionRoutes_1.default);
app.use('/api/failures', failureRoutes_1.default);
app.use('/api/teams', teamRoutes_1.default);
app.use('/api/users', userRoutes_1.default);
app.use('/api/metrics', metricsRoutes_1.default);
app.use('/api/graph', graphRoutes_1.default);
// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Kontext API', timestamp: new Date() });
});
app.listen(PORT, () => {
    console.log(`🚀 Kontext Server running on port ${PORT}`);
});
