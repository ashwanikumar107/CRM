require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const routes          = require('./routes/index');
const authRoutes      = require('./routes/auth.routes');
const errorMiddleware = require('./middlewares/error.middleware');
const logMiddleware   = require('./middlewares/logger.middleware');
const logger          = require('./config/logger');

// Boot DB
require('./config/database');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:3000',
    'http://localhost:6000',
  ],
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(logMiddleware);

// ── Routes ─────────────────────────────────────────────────
app.use('/api', authRoutes);   // /api/auth/* — public + admin user mgmt
app.use('/api', routes);       // all other routes — JWT protected

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'crm-backend', ts: new Date() }));

// ── Error handler ──────────────────────────────────────────
app.use(errorMiddleware);

app.listen(PORT, () => logger.info(`🚀 CRM Backend running on port ${PORT}`));

module.exports = app;
