import express from 'express';
import {
  corsMiddleware,
  helmetMiddleware,
  generalRateLimit,
  authRateLimit,
} from './config/security.js';
import oauthRoutes from './routes/oauth.js';
import googleRoutes from './routes/google.js';
import authRoutes from './routes/auth.js';
import { setupSwagger } from './config/swagger-setup.js';

const app = express();

// Middlewares de sécurité (ordre important)
app.use(helmetMiddleware);
app.use(corsMiddleware);
app.use(generalRateLimit);

// Middleware de parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));


// Routes d'authentification
app.use('/auth', authRoutes);

// Routes OAuth2
app.use('/oauth', oauthRoutes);

// Routes Google API
app.use('/api/google', googleRoutes);

// Route de santé
/**
 * @swagger
 * /health:
 *   get:
 *     summary: Vérification de l'état de l'API
 *     description: Endpoint de santé pour vérifier que l'API fonctionne correctement
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API fonctionnelle
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "ok"
 *               required:
 *                 - status
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Configuration de la documentation Swagger
setupSwagger(app).catch(console.error);

export default app;
