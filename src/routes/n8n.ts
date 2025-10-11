import express from 'express';
import { N8NService } from '../services/n8n.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * @swagger
 * /n8n/health:
 *   get:
 *     summary: Vérifier la santé de N8N
 *     description: Vérifie si l'instance N8N est accessible et répond
 *     tags: [N8N]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut de santé de N8N
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isHealthy:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "N8N est accessible"
 *                 responseTime:
 *                   type: number
 *                   example: 150
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/health', authenticateToken, async (req, res) => {
  try {
    const healthStatus = await N8NService.checkHealth();
    
    if (healthStatus.isHealthy) {
      res.json(healthStatus);
    } else {
      res.status(503).json(healthStatus);
    }
  } catch (error) {
    console.error('Erreur lors de la vérification de santé N8N:', error);
    res.status(500).json({
      isHealthy: false,
      message: 'Erreur interne du serveur',
    });
  }
});

/**
 * @swagger
 * /n8n/workflow/status:
 *   get:
 *     summary: Obtenir le statut du workflow
 *     description: Récupère le statut du workflow d'automatisation principal
 *     tags: [N8N]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workflowId
 *         schema:
 *           type: string
 *         description: ID du workflow (optionnel, utilise le workflow par défaut)
 *     responses:
 *       200:
 *         description: Statut du workflow
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   example: "workflow_123"
 *                 name:
 *                   type: string
 *                   example: "Automatisation Cynker"
 *                 active:
 *                   type: boolean
 *                   example: true
 *                 lastExecuted:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:30:00Z"
 *                 nextExecution:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T11:00:00Z"
 *                 errorCount:
 *                   type: number
 *                   example: 2
 *                 successCount:
 *                   type: number
 *                   example: 45
 *       404:
 *         description: Workflow non trouvé
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/workflow/status', authenticateToken, async (req, res) => {
  try {
    const { workflowId } = req.query;
    const workflowStatus = await N8NService.getWorkflowStatus(workflowId as string);
    
    if (!workflowStatus) {
      return res.status(404).json({
        error: 'Workflow non trouvé ou non accessible',
      });
    }
    
    res.json(workflowStatus);
  } catch (error) {
    console.error('Erreur lors de la récupération du statut du workflow:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
    });
  }
});

/**
 * @swagger
 * /n8n/executions:
 *   get:
 *     summary: Obtenir les exécutions récentes
 *     description: Récupère les exécutions récentes du workflow d'automatisation
 *     tags: [N8N]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: workflowId
 *         schema:
 *           type: string
 *         description: ID du workflow (optionnel)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Nombre d'exécutions à récupérer
 *     responses:
 *       200:
 *         description: Liste des exécutions récentes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: "exec_123"
 *                   workflowId:
 *                     type: string
 *                     example: "workflow_123"
 *                   status:
 *                     type: string
 *                     enum: [running, success, error, waiting]
 *                     example: "success"
 *                   startedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:30:00Z"
 *                   finishedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2024-01-15T10:32:00Z"
 *                   error:
 *                     type: string
 *                     example: "Erreur de connexion"
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/executions', authenticateToken, async (req, res) => {
  try {
    const { workflowId, limit } = req.query;
    const executions = await N8NService.getRecentExecutions(
      workflowId as string,
      limit ? parseInt(limit as string) : 10
    );
    
    res.json(executions);
  } catch (error) {
    console.error('Erreur lors de la récupération des exécutions:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
    });
  }
});

/**
 * @swagger
 * /n8n/workflow/toggle:
 *   patch:
 *     summary: Activer/désactiver le workflow
 *     description: Active ou désactive le workflow d'automatisation
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
 *               workflowId:
 *                 type: string
 *                 description: ID du workflow (optionnel)
 *               active:
 *                 type: boolean
 *                 description: État souhaité (true = actif, false = inactif)
 *                 example: true
 *             required:
 *               - active
 *     responses:
 *       200:
 *         description: Workflow modifié avec succès
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
 *                   example: "Workflow activé avec succès"
 *       400:
 *         description: Requête invalide
 *       500:
 *         description: Erreur interne du serveur
 */
router.patch('/workflow/toggle', authenticateToken, async (req, res) => {
  try {
    const { workflowId, active } = req.body;
    
    if (typeof active !== 'boolean') {
      return res.status(400).json({
        error: 'Le paramètre "active" doit être un booléen',
      });
    }
    
    const success = await N8NService.toggleWorkflow(workflowId, active);
    
    if (success) {
      res.json({
        success: true,
        message: `Workflow ${active ? 'activé' : 'désactivé'} avec succès`,
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Impossible de modifier le workflow',
      });
    }
  } catch (error) {
    console.error('Erreur lors de la modification du workflow:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
    });
  }
});

/**
 * @swagger
 * /n8n/workflow/trigger:
 *   post:
 *     summary: Déclencher manuellement le workflow
 *     description: Déclenche manuellement l'exécution du workflow d'automatisation
 *     tags: [N8N]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workflowId:
 *                 type: string
 *                 description: ID du workflow (optionnel)
 *               data:
 *                 type: object
 *                 description: Données à passer au workflow
 *                 example: {"userId": "123", "action": "test"}
 *     responses:
 *       200:
 *         description: Workflow déclenché avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 executionId:
 *                   type: string
 *                   example: "exec_123"
 *                 message:
 *                   type: string
 *                   example: "Workflow déclenché avec succès"
 *       400:
 *         description: Erreur lors du déclenchement
 *       500:
 *         description: Erreur interne du serveur
 */
router.post('/workflow/trigger', authenticateToken, async (req, res) => {
  try {
    const { workflowId, data } = req.body;
    
    const result = await N8NService.triggerWorkflow(workflowId, data);
    
    if (result.success) {
      res.json({
        success: true,
        executionId: result.executionId,
        message: 'Workflow déclenché avec succès',
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error || 'Impossible de déclencher le workflow',
      });
    }
  } catch (error) {
    console.error('Erreur lors du déclenchement du workflow:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
    });
  }
});

/**
 * @swagger
 * /n8n/status:
 *   get:
 *     summary: Statut complet de l'automatisation
 *     description: Récupère un statut complet de l'automatisation N8N
 *     tags: [N8N]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut complet de l'automatisation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isHealthy:
 *                   type: boolean
 *                   example: true
 *                 workflowStatus:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "workflow_123"
 *                     name:
 *                       type: string
 *                       example: "Automatisation Cynker"
 *                     active:
 *                       type: boolean
 *                       example: true
 *                     lastExecuted:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                     errorCount:
 *                       type: number
 *                       example: 2
 *                     successCount:
 *                       type: number
 *                       example: 45
 *                 recentExecutions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "exec_123"
 *                       status:
 *                         type: string
 *                         example: "success"
 *                       startedAt:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-15T10:30:00Z"
 *                 lastHealthCheck:
 *                   type: string
 *                   format: date-time
 *                   example: "2024-01-15T10:35:00Z"
 *       500:
 *         description: Erreur interne du serveur
 */
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const automationStatus = await N8NService.getAutomationStatus();
    res.json(automationStatus);
  } catch (error) {
    console.error('Erreur lors de la récupération du statut complet:', error);
    res.status(500).json({
      error: 'Erreur interne du serveur',
    });
  }
});

export default router;
