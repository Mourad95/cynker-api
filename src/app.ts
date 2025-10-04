import express from 'express';
import {
  corsMiddleware,
  helmetMiddleware,
  generalRateLimit,
  authRateLimit,
} from './config/security.js';
import oauthRoutes from './routes/oauth.js';
import googleRoutes from './routes/google.js';

const app = express();

// Middlewares de sécurité (ordre important)
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(generalRateLimit);

// Middleware de parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting strict pour les routes d'authentification
app.use('/auth', authRateLimit);
app.use('/oauth', authRateLimit);

// Routes OAuth2
app.use('/oauth', oauthRoutes);

// Routes Google API
app.use('/api/google', googleRoutes);

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
