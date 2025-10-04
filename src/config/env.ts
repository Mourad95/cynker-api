import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Configuration centralisée des variables d'environnement
export const env = {
  // Configuration de base
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 3000,
  BASE_URL: process.env.BASE_URL || 'http://localhost:3000',

  // Configuration de base de données
  MONGODB_URI: process.env.MONGODB_URI!,

  // Configuration de sécurité
  JWT_SECRET: process.env.JWT_SECRET!,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY!,

  // Configuration CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  CORS_ALLOWED_ORIGINS:
    process.env.CORS_ALLOWED_ORIGINS ||
    'http://localhost:3000,http://localhost:8080',

  // Configuration rate limiting
  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // Configuration OAuth2 Google
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID!,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET!,
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI!,

  // Configuration OAuth2 Facebook
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID,
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET,
  FACEBOOK_REDIRECT_URI: process.env.FACEBOOK_REDIRECT_URI,

  // Configuration OAuth2 Instagram
  INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID,
  INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET,
  INSTAGRAM_REDIRECT_URI: process.env.INSTAGRAM_REDIRECT_URI,

  // Configuration OAuth2 WhatsApp
  WHATSAPP_CLIENT_ID: process.env.WHATSAPP_CLIENT_ID,
  WHATSAPP_CLIENT_SECRET: process.env.WHATSAPP_CLIENT_SECRET,
  WHATSAPP_REDIRECT_URI: process.env.WHATSAPP_REDIRECT_URI,

  // Configuration OAuth2 Outlook
  OUTLOOK_CLIENT_ID: process.env.OUTLOOK_CLIENT_ID,
  OUTLOOK_CLIENT_SECRET: process.env.OUTLOOK_CLIENT_SECRET,
  OUTLOOK_REDIRECT_URI: process.env.OUTLOOK_REDIRECT_URI,

  // Configuration OAuth2 Asana
  ASANA_CLIENT_ID: process.env.ASANA_CLIENT_ID,
  ASANA_CLIENT_SECRET: process.env.ASANA_CLIENT_SECRET,
  ASANA_REDIRECT_URI: process.env.ASANA_REDIRECT_URI,

  // Configuration OAuth2 Notion
  NOTION_CLIENT_ID: process.env.NOTION_CLIENT_ID,
  NOTION_CLIENT_SECRET: process.env.NOTION_CLIENT_SECRET,
  NOTION_REDIRECT_URI: process.env.NOTION_REDIRECT_URI,

  // Configuration OAuth2 Calendly
  CALENDLY_CLIENT_ID: process.env.CALENDLY_CLIENT_ID,
  CALENDLY_CLIENT_SECRET: process.env.CALENDLY_CLIENT_SECRET,
  CALENDLY_REDIRECT_URI: process.env.CALENDLY_REDIRECT_URI,

  // Configuration OAuth2 LinkedIn
  LINKEDIN_CLIENT_ID: process.env.LINKEDIN_CLIENT_ID,
  LINKEDIN_CLIENT_SECRET: process.env.LINKEDIN_CLIENT_SECRET,
  LINKEDIN_REDIRECT_URI: process.env.LINKEDIN_REDIRECT_URI,

  // Configuration N8N (existante)
  N8N_WEBHOOK_URL: process.env.N8N_WEBHOOK_URL,
  N8N_API_KEY: process.env.N8N_API_KEY,
  N8N_WORKFLOW_ID: process.env.N8N_WORKFLOW_ID,
  RUN_TOKEN_TTL_SECONDS: Number(process.env.RUN_TOKEN_TTL_SECONDS) || 3600,
} as const;
