import { z } from 'zod';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Schéma de validation Zod pour les variables d'environnement
const envSchema = z.object({
  PORT: z.string().default('8080').transform(Number),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CORS_ALLOWED_ORIGINS: z.string().default('http://localhost:3000'),
  SESSION_SECRET: z
    .string()
    .min(32, 'SESSION_SECRET doit faire au moins 32 caractères'),
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET doit faire au moins 32 caractères'),
  RUN_TOKEN_TTL_SECONDS: z.string().default('3600').transform(Number),
  MONGODB_URI: z.string().url('MONGODB_URI doit être une URL valide'),
  N8N_WEBHOOK_URL: z
    .string()
    .url('N8N_WEBHOOK_URL doit être une URL valide')
    .optional(),
  N8N_API_KEY: z.string().min(1, 'N8N_API_KEY est requis').optional(),
  N8N_WORKFLOW_ID: z.string().min(1, 'N8N_WORKFLOW_ID est requis').optional(),
  ENCRYPTION_KEY_CURRENT: z
    .string()
    .min(32, 'ENCRYPTION_KEY_CURRENT doit faire au moins 32 caractères'),
  ENCRYPTION_KEY_PREVIOUS: z
    .string()
    .min(32, 'ENCRYPTION_KEY_PREVIOUS doit faire au moins 32 caractères')
    .optional(),
});

// Validation et parsing des variables d'environnement
const parseEnv = () => {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Erreur de validation des variables d'environnement:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
};

// Export de la configuration validée
export const env = parseEnv();

// Types TypeScript dérivés du schéma Zod
export type EnvConfig = z.infer<typeof envSchema>;
