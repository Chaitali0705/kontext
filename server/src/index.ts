import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import contextRoutes from './routes/contextRoutes';
import decisionRoutes from './routes/decisionRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use('/api/contexts', contextRoutes);
app.use('/api/decisions', decisionRoutes);

app.use('/api/contexts', contextRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'Kontext API', timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`🚀 Kontext Server running on port ${PORT}`);
});