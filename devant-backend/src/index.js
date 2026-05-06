require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { initRealtime } = require('./realtime');

const healthRouter = require('./routes/health');
const authRouter = require('./routes/auth');
const projectsRouter = require('./routes/projects');
const githubRouter = require('./routes/github');
const webhookRouter = require('./routes/webhook');
const commitsRouter = require('./routes/commits');
const teamRouter = require('./routes/team');
const metricsRouter = require('./routes/metrics');
const deploymentsRouter = require('./routes/deployments');

const app = express();
const PORT = process.env.PORT || 3001;

const normalizeOrigin = (value) => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return value.replace(/\/$/, '');
  }
};

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ]
    .filter(Boolean)
    .flatMap((value) => value.split(/[,\n]/))
    .map((value) => normalizeOrigin(value.trim()))
    .filter(Boolean)
);

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  const normalizedOrigin = normalizeOrigin(origin);
  if (allowedOrigins.has(normalizedOrigin)) return true;

  let hostname;
  try {
    hostname = new URL(normalizedOrigin).hostname;
  } catch {
    return false;
  }

  return (
    hostname.endsWith('.lovableproject.com') ||
    hostname.endsWith('.lovable.app') ||
    hostname === 'localhost'
  );
};

const corsOptions = {
  origin(origin, callback) {
    callback(null, isAllowedOrigin(origin));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// ── Middleware ──────────────────────────────────────────────
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Raw body needed for GitHub webhook signature verification
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// JSON body for all other routes
app.use(express.json());

// ── Routes ──────────────────────────────────────────────────
app.use('/api/health',    healthRouter);
app.use('/api/auth',      authRouter);
app.use('/api/projects',  projectsRouter);
app.use('/api/github',    githubRouter);
app.use('/api/webhook',   webhookRouter);
app.use('/api/commits',   commitsRouter);
app.use('/api/team',      teamRouter);
app.use('/api/metrics',   metricsRouter);
app.use('/api/deployments', deploymentsRouter);

// ── Global error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

const server = http.createServer(app);
initRealtime(server);

server.listen(PORT, () => {
  console.log(`✅ DevANT backend running on port ${PORT}`);
});
