import express from 'express';
import { AuthService } from '../services/auth.js';

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Inscription d'un utilisateur
 *     description: Crée un nouveau compte utilisateur avec email et mot de passe
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "MySecure123!"
 *             firstName: "John"
 *             lastName: "Doe"
 *     responses:
 *       201:
 *         description: Inscription réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               user:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 email: "user@example.com"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 authProvider: "local"
 *                 emailVerified: false
 *                 isActive: true
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               message: "Inscription réussie"
 *       400:
 *         description: Erreur de validation ou utilisateur existant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Un utilisateur avec cet email existe déjà"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    // Validation des champs requis
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        error: 'Tous les champs sont requis (email, password, firstName, lastName)',
      });
    }

    // Validation de l'email
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Format d\'email invalide',
      });
    }

    // Validation du mot de passe
    const passwordValidation = AuthService.validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: 'Mot de passe invalide',
        details: passwordValidation.errors,
      });
    }

    // Tentative d'inscription
    const result = await AuthService.register({
      email,
      password,
      firstName,
      lastName,
    });

    if (!result.success) {
      return res.status(400).json({
        error: result.message,
      });
    }

    res.status(201).json({
      success: true,
      user: result.user,
      token: result.token,
      message: result.message,
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
    });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     description: Authentifie un utilisateur avec email et mot de passe
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: "user@example.com"
 *             password: "MySecure123!"
 *     responses:
 *       200:
 *         description: Connexion réussie
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               success: true
 *               user:
 *                 _id: "507f1f77bcf86cd799439011"
 *                 email: "user@example.com"
 *                 firstName: "John"
 *                 lastName: "Doe"
 *                 authProvider: "local"
 *                 emailVerified: false
 *                 isActive: true
 *               token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               message: "Connexion réussie"
 *       400:
 *         description: Champs manquants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Identifiants incorrects
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Email ou mot de passe incorrect"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des champs requis
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email et mot de passe requis',
      });
    }

    // Tentative de connexion
    const result = await AuthService.login({ email, password });

    if (!result.success) {
      return res.status(401).json({
        error: result.message,
      });
    }

    res.json({
      success: true,
      user: result.user,
      token: result.token,
      message: result.message,
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
    });
  }
});

/**
 * @swagger
 * /auth/verify:
 *   get:
 *     summary: Vérification du token JWT
 *     description: Vérifie la validité d'un token JWT et retourne les informations de l'utilisateur
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Token valide
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 message:
 *                   type: string
 *                   example: "Token valide"
 *       401:
 *         description: Token manquant, invalide ou expiré
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               error: "Token invalide ou expiré"
 *       500:
 *         description: Erreur interne du serveur
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token d\'authentification requis',
      });
    }

    const token = authHeader.substring(7); // Enlève "Bearer "
    const user = await AuthService.verifyToken(token);

    if (!user) {
      return res.status(401).json({
        error: 'Token invalide ou expiré',
      });
    }

    res.json({
      success: true,
      user,
      message: 'Token valide',
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
    });
  }
});

/**
 * @swagger
 * /auth/validate-password:
 *   post:
 *     summary: Validation de la force d'un mot de passe
 *     description: Vérifie si un mot de passe respecte les critères de sécurité
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: Mot de passe à valider
 *                 example: "MySecure123!"
 *             required:
 *               - password
 *     responses:
 *       200:
 *         description: Résultat de la validation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PasswordValidationResponse'
 *             example:
 *               isValid: false
 *               errors: ["Le mot de passe doit contenir au moins une majuscule"]
 *       400:
 *         description: Mot de passe manquant
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
router.post('/validate-password', (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        error: 'Mot de passe requis',
      });
    }

    const validation = AuthService.validatePassword(password);

    res.json({
      isValid: validation.isValid,
      errors: validation.errors,
    });
  } catch (error) {
    console.error('Erreur lors de la validation du mot de passe:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
    });
  }
});

export default router;
