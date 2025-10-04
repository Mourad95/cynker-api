import express from 'express';
import crypto from 'crypto';
import { GoogleOAuth2 } from '../utils/oauth/google.js';
import { ScopeValidator } from '../utils/oauth/scopeValidator.js';

const router = express.Router();

// Store temporaire pour les états (en production, utilisez Redis)
const stateStore = new Map<string, { userId: string; timestamp: number }>();

/**
 * Redirection vers Google OAuth2
 * GET /oauth/google
 */
router.get('/google', (req, res) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    // Scopes selon les besoins de l'application
    const requestedScopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/calendar',
    ];

    // Validation des scopes
    const scopes = ScopeValidator.validateScopes('google', requestedScopes);

    // Génère un état unique pour la sécurité CSRF
    const state = crypto.randomBytes(16).toString('hex');
    stateStore.set(state, { userId, timestamp: Date.now() });

    // Nettoie les états expirés (plus de 10 minutes)
    const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
    for (const [key, value] of stateStore.entries()) {
      if (value.timestamp < tenMinutesAgo) {
        stateStore.delete(key);
      }
    }

    const authUrl = GoogleOAuth2.generateAuthUrl(scopes, state);

    res.json({
      authUrl,
      state,
    });
  } catch (error) {
    console.error('Erreur génération URL auth:', error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

/**
 * Callback Google OAuth2
 * GET /oauth/callback/google
 */
router.get('/callback/google', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.status(400).json({ error: `Erreur OAuth2: ${error}` });
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Code et state requis' });
    }

    // Vérifie l'état pour la sécurité CSRF
    const stateData = stateStore.get(state as string);
    if (!stateData) {
      return res.status(400).json({ error: 'État invalide ou expiré' });
    }

    // Supprime l'état utilisé
    stateStore.delete(state as string);

    // Échange le code contre des tokens
    const tokens = await GoogleOAuth2.exchangeCodeForTokens(code as string);

    // Récupère les informations utilisateur
    const userInfo = await GoogleOAuth2.getUserInfo(tokens.access_token);

    // Sauvegarde les tokens
    const scopes = tokens.scope.split(' ');
    await GoogleOAuth2.saveTokens(stateData.userId, tokens, scopes);

    res.json({
      success: true,
      user: userInfo,
      message: 'Connexion Google réussie',
    });
  } catch (error) {
    console.error('Erreur callback Google:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion Google' });
  }
});

/**
 * Déconnexion Google
 * DELETE /oauth/google
 */
router.delete('/google', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    // Supprime le token de la base de données
    const { OAuthToken } = await import('../models/OAuthToken.js');
    await OAuthToken.deleteOne({ userId, provider: 'google' });

    res.json({
      success: true,
      message: 'Déconnexion Google réussie',
    });
  } catch (error) {
    console.error('Erreur déconnexion Google:', error);
    res.status(500).json({ error: 'Erreur lors de la déconnexion' });
  }
});

/**
 * Vérifie le statut de connexion Google
 * GET /oauth/google/status
 */
router.get('/google/status', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    const { OAuthToken } = await import('../models/OAuthToken.js');
    const token = await OAuthToken.findOne({ userId, provider: 'google' });

    if (!token) {
      return res.json({ connected: false });
    }

    // Vérifie si le token est valide
    const isValid = token.expiresAt > new Date();

    res.json({
      connected: true,
      isValid,
      expiresAt: token.expiresAt,
      scope: token.scope,
    });
  } catch (error) {
    console.error('Erreur vérification statut:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification du statut' });
  }
});

export default router;
