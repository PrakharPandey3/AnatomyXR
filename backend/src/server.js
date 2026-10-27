import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import anatomyRoutes from './routes/anatomyRoutes.js';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'AnatomyXR API' }));
app.use('/api/auth', authRoutes);
app.use('/api', anatomyRoutes);
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  if (error?.code === 11000) return res.status(409).json({ message: 'That record already exists.' });
  if (error?.name === 'ValidationError') return res.status(400).json({ message: 'Submitted data did not pass validation.' });
  res.status(500).json({ message: 'Unexpected server error. Please try again.' });
});

const port = Number(process.env.PORT || 5000);
try {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be set to a random secret of at least 32 characters.');
  await connectDB();
  app.listen(port, () => console.log(`AnatomyXR API listening on port ${port}`));
} catch (error) {
  console.error(`Startup failed: ${error.message}`);
  process.exit(1);
}
