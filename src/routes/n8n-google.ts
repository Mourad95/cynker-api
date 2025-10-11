import express from 'express';
import { N8NGoogleIntegration } from '../services/n8n-google-integration.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /n8n/google/share:
 *   post:
 *     summary: Partager les tokens Google avec N8N
 *     description: Partage les tokens OAuth Google de l'utilisateur avec N8N pour l'automatisation
 *     tags: [N8N]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tokens partagés avec succès
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
 *                   example: "Tokens Google partagés avec N8N avec succès"
 *                 workflowData:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     userEmail:
 *                       type: string
 *                       example: "user@gmail.com"
 *                     action:
 *                       type: string
 *                       example: "all"
 *       400:
 *         description: Erreur de validation
 *       401:
 *         description: Non autorisé
 *       404:
 *         description: Tokens Google non trouvés
 */
router.post('/share', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    const result = await N8NGoogleIntegration.shareGoogleTokensWithN8N(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erreur lors du partage des tokens Google avec N8N:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

/**
 * @swagger
 * /n8n/google/execute:
 *   post:
 *     summary: Exécuter une action Google via N8N
 *     description: Exécute une action spécifique sur Google (Gmail, Sheets, Calendar) via N8N
 *     tags: [N8N]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [gmail, sheets, calendar]
 *                 description: Type d'action à exécuter
 *                 example: "gmail"
 *               parameters:
 *                 type: object
 *                 description: Paramètres spécifiques à l'action
 *                 example:
 *                   to: "test@example.com"
 *                   subject: "Test automatisation"
 *                   body: "Email envoyé via N8N"
 *             required:
 *               - action
 *     responses:
 *       200:
 *         description: Action exécutée avec succès
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
 *                   example: "Action gmail exécutée via N8N avec succès"
 *                 executionId:
 *                   type: string
 *                   example: "exec_123"
 *       400:
 *         description: Erreur de validation ou permissions insuffisantes
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/execute', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { action, parameters } = req.body;
    
    if (!action || !['gmail', 'sheets', 'calendar'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action invalide. Actions supportées: gmail, sheets, calendar',
      });
    }
    
    const result = await N8NGoogleIntegration.executeGoogleActionViaN8N(
      userId,
      action,
      parameters
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erreur lors de l\'exécution de l\'action Google via N8N:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

/**
 * @swagger
 * /n8n/google/permissions:
 *   get:
 *     summary: Vérifier les permissions N8N pour Google
 *     description: Vérifie quelles actions Google l'utilisateur peut exécuter via N8N
 *     tags: [N8N]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions vérifiées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hasGoogleAccess:
 *                   type: boolean
 *                   example: true
 *                 availableActions:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["gmail", "sheets", "calendar"]
 *                 missingScopes:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: []
 *                 tokenExpiry:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T12:00:00Z"
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/permissions', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    const permissions = await N8NGoogleIntegration.checkUserPermissionsForN8N(userId);
    
    res.json(permissions);
  } catch (error) {
    console.error('Erreur lors de la vérification des permissions:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
    });
  }
});

/**
 * @swagger
 * /n8n/google/revoke:
 *   post:
 *     summary: Révoquer l'accès N8N aux tokens Google
 *     description: Révoque l'accès de N8N aux tokens Google de l'utilisateur
 *     tags: [N8N]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Accès révoqué avec succès
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
 *                   example: "Accès N8N révoqué avec succès"
 *       401:
 *         description: Non autorisé
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/revoke', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    const result = await N8NGoogleIntegration.revokeN8NAccess(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Erreur lors de la révocation de l\'accès N8N:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
    });
  }
});

export default router;
