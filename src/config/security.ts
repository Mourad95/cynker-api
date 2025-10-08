import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { env } from './env.js';

/**
 * Parse les origines CORS autorisées
 * Supporte les formats : chaîne séparée par virgules ou tableau
 */
function parseAllowedOrigins(): string[] {
  if (Array.isArray(env.CORS_ALLOWED_ORIGINS)) {
    return env.CORS_ALLOWED_ORIGINS;
  }
  
  if (typeof env.CORS_ALLOWED_ORIGINS === 'string') {
    return env.CORS_ALLOWED_ORIGINS
      .split(',')
      .map(origin => origin.trim())
      .filter(origin => origin.length > 0);
  }
  
  return ['http://localhost:8085'];
}

// Configuration CORS avec whitelist
export const corsOptions = {
  origin: (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) => {
    const allowedOrigins = parseAllowedOrigins();

    // Autoriser les requêtes sans origin (ex: Postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS: Origine non autorisée: ${origin}`);
      callback(new Error('Non autorisé par CORS'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

// Middleware CORS
export const corsMiddleware = cors(corsOptions);

// Middleware Helmet pour la sécurité
export const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: false,
});

// Rate limiting général
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite chaque IP à 100 requêtes par fenêtre
  message: {
    error: 'Trop de requêtes depuis cette IP, veuillez réessayer plus tard.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting strict pour /auth et /oauth
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite chaque IP à 5 tentatives d'auth par fenêtre
  message: {
    error:
      'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies
});

// Rate limiting pour les webhooks
export const webhookRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limite chaque IP à 10 webhooks par minute
  message: {
    error: 'Trop de webhooks, veuillez ralentir.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
