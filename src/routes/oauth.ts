import express from 'express';
import crypto from 'crypto';
import { GoogleOAuth2 } from '../utils/oauth/google.js';
import { ScopeValidator } from '../utils/oauth/scopeValidator.js';
import { AuthService } from '../services/auth.js';

const router = express.Router();

// Store temporaire pour les états (en production, utilisez Redis)
const stateStore = new Map<string, { userId: string; timestamp: number }>();

/**
 * @swagger
 * /oauth/google:
 *   get:
 *     summary: Initiation de la connexion OAuth2 Google
 *     description: Génère l'URL d'autorisation Google et un état CSRF pour sécuriser le processus
 *     tags: [OAuth2]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur pour lier la connexion Google
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: URL d'autorisation générée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OAuthInitResponse'
 *             example:
 *               authUrl: "https://accounts.google.com/o/oauth2/v2/auth?client_id=..."
 *               state: "abc123def456ghi789"
 *       400:
 *         description: userId manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "userId requis"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 * @swagger
 * /oauth/callback/google:
 *   get:
 *     summary: Callback OAuth2 Google
 *     description: Traite la réponse de Google après autorisation et crée/met à jour l'utilisateur
 *     tags: [OAuth2]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Code d'autorisation fourni par Google
 *       - in: query
 *         name: state
 *         required: true
 *         schema:
 *           type: string
 *         description: État CSRF pour la sécurité
 *       - in: query
 *         name: error
 *         schema:
 *           type: string
 *         description: Code d'erreur si l'autorisation a échoué
 *     responses:
 *       200:
 *         description: Connexion Google réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               user:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 email: "user@gmail.com"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 authProvider: "google"
 *                 googleId: "123456789012345678901"
 *                 emailVerified: true
 *                 isActive: true
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               message: "Connexion Google réussie"
 *       400:
 *         description: Erreur dans le processus OAuth2
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               missing_params:
 *                 summary: Paramètres manquants
 *                 value:
 *                   error: "Code et state requis"
 *               invalid_state:
 *                 summary: État invalide
 *                 value:
 *                   error: "État invalide ou expiré"
 *               oauth_error:
 *                 summary: Erreur OAuth2
 *                 value:
 *                   error: "Erreur OAuth2: access_denied"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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

    // Créer ou mettre à jour l'utilisateur avec le service d'authentification
    const authResult = await AuthService.handleGoogleAuth(userInfo);

    if (!authResult.success) {
      return res.status(400).json({
        error: authResult.message || 'Erreur lors de la création du compte',
      });
    }

    // Sauvegarde les tokens OAuth
    const scopes = (tokens as any).scope.split(' ');
    await GoogleOAuth2.saveTokens((authResult.user as any)._id.toString(), tokens, scopes);

    res.json({
      success: true,
      user: authResult.user,
      token: authResult.token,
      message: 'Connexion Google réussie',
    });
  } catch (error) {
    console.error('Erreur callback Google:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion Google' });
  }
});

/**
 * @swagger
 * /oauth/google:
 *   delete:
 *     summary: Déconnexion Google
 *     description: Supprime les tokens OAuth2 Google de l'utilisateur
 *     tags: [OAuth2]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID de l'utilisateur
 *                 example: "507f1f77bcf86cd799439011"
 *             required:
 *               - userId
 *     responses:
 *       200:
 *         description: Déconnexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Déconnexion Google réussie"
 *       400:
 *         description: userId manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
 * @swagger
 * /oauth/google/status:
 *   get:
 *     summary: Statut de connexion Google
 *     description: Vérifie si l'utilisateur est connecté à Google et l'état de ses tokens
 *     tags: [OAuth2]
 *     parameters:
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'utilisateur
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Statut de connexion récupéré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OAuthStatusResponse'
 *             examples:
 *               connected:
 *                 summary: Utilisateur connecté
 *                 value:
 *                   connected: true
 *                   isValid: true
 *                   expiresAt: "2024-01-15T10:30:00.000Z"
 *                   scope: ["https://www.googleapis.com/auth/gmail.send"]
 *               not_connected:
 *                 summary: Utilisateur non connecté
 *                 value:
 *                   connected: false
 *       400:
 *         description: userId manquant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
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
