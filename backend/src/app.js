import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import conversionRoutes from './routes/conversion.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security & parsing
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(morgan('dev'));
app.use(express.json());

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Too many requests, please try again later.' }
}));

// Routes
app.use('/api', conversionRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'docmod-api' }));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 DocMod API running on port ${PORT}`);
});
