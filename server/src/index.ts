import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import contextRoutes from './routes/contextRoutes';
import projectRoutes from './routes/projectRoutes';
import decisionRoutes from './routes/decisionRoutes';
import failureRoutes from './routes/failureRoutes';
import teamRoutes from './routes/teamRoutes';
import userRoutes from './routes/userRoutes';
import metricsRoutes from './routes/metricsRoutes';
import graphRoutes from './routes/graphRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));

// Routes
app.use('/api/contexts', contextRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/decisions', decisionRoutes);
app.use('/api/failures', failureRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/graph', graphRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Kontext API', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`🚀 Kontext Server running on port ${PORT}`);
});
