import { OAuthToken } from '../models/OAuthToken.js';
import { N8NService } from './n8n.js';
import { env } from '../config/env.js';

export interface GoogleTokenForN8N {
  userId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scopes: string[];
  provider: 'google';
}

export interface N8NGoogleWorkflowData {
  userId: string;
  userEmail: string;
  googleTokens: GoogleTokenForN8N;
  action: 'gmail' | 'sheets' | 'calendar' | 'all';
  parameters?: any;
}

export class N8NGoogleIntegration {
  /**
   * Partager les tokens Google d'un utilisateur avec N8N
   */
  static async shareGoogleTokensWithN8N(userId: string): Promise<{
    success: boolean;
    message: string;
    workflowData?: N8NGoogleWorkflowData;
  }> {
    try {
      // Récupérer les tokens OAuth de l'utilisateur
      const oauthTokens = await OAuthToken.find({ userId });
      
      if (!oauthTokens || oauthTokens.length === 0) {
        return {
          success: false,
          message: 'Aucun token OAuth trouvé pour cet utilisateur',
        };
      }

      // Trouver les tokens Google
      const googleTokens = oauthTokens.find(token => 
        token.provider === 'google' && 
        token.scope && 
        token.scope.length > 0
      );

      if (!googleTokens) {
        return {
          success: false,
          message: 'Aucun token Google trouvé pour cet utilisateur',
        };
      }

      // Vérifier si le token est encore valide
      if (googleTokens.expiresAt && googleTokens.expiresAt < new Date()) {
        return {
          success: false,
          message: 'Le token Google a expiré. Veuillez vous reconnecter.',
        };
      }

      // Préparer les données pour N8N
      const workflowData: N8NGoogleWorkflowData = {
        userId,
        userEmail: '', // L'email sera récupéré via l'API Google
        googleTokens: {
          userId,
          accessToken: googleTokens.accessToken,
          refreshToken: googleTokens.refreshToken,
          expiresAt: googleTokens.expiresAt || new Date(Date.now() + 3600000), // 1 heure par défaut
          scopes: googleTokens.scope || [],
          provider: 'google',
        },
        action: 'all', // Par défaut, accès à tous les services
      };

      // Déclencher le workflow N8N avec les tokens
      const result = await N8NService.triggerWorkflow(env.N8N_WORKFLOW_ID, workflowData);

      if (result.success) {
        return {
          success: true,
          message: 'Tokens Google partagés avec N8N avec succès',
          workflowData,
        };
      } else {
        return {
          success: false,
          message: `Erreur lors du partage avec N8N: ${result.error}`,
        };
      }
    } catch (error) {
      console.error('Erreur lors du partage des tokens Google avec N8N:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur',
      };
    }
  }

  /**
   * Exécuter une action Google spécifique via N8N
   */
  static async executeGoogleActionViaN8N(
    userId: string,
    action: 'gmail' | 'sheets' | 'calendar',
    parameters: any
  ): Promise<{
    success: boolean;
    message: string;
    executionId?: string;
    result?: any;
  }> {
    try {
      // Récupérer les tokens OAuth de l'utilisateur
      const oauthTokens = await OAuthToken.find({ userId });
      const googleTokens = oauthTokens?.find(token => 
        token.provider === 'google' && 
        token.scope && 
        token.scope.length > 0
      );

      if (!googleTokens) {
        return {
          success: false,
          message: 'Aucun token Google trouvé pour cet utilisateur',
        };
      }

      // Vérifier les scopes nécessaires
      const requiredScopes = this.getRequiredScopesForAction(action);
      const hasRequiredScopes = requiredScopes.every(scope => 
        googleTokens.scope?.includes(scope)
      );

      if (!hasRequiredScopes) {
        return {
          success: false,
          message: `Permissions insuffisantes pour l'action ${action}. Scopes requis: ${requiredScopes.join(', ')}`,
        };
      }

      // Préparer les données pour N8N
      const workflowData: N8NGoogleWorkflowData = {
        userId,
        userEmail: '', // L'email sera récupéré via l'API Google
        googleTokens: {
          userId,
          accessToken: googleTokens.accessToken,
          refreshToken: googleTokens.refreshToken,
          expiresAt: googleTokens.expiresAt || new Date(Date.now() + 3600000),
          scopes: googleTokens.scope || [],
          provider: 'google',
        },
        action,
        parameters,
      };

      // Déclencher le workflow N8N
      const result = await N8NService.triggerWorkflow(env.N8N_WORKFLOW_ID, workflowData);

      if (result.success) {
        return {
          success: true,
          message: `Action ${action} exécutée via N8N avec succès`,
          executionId: result.executionId,
        };
      } else {
        return {
          success: false,
          message: `Erreur lors de l'exécution de l'action ${action}: ${result.error}`,
        };
      }
    } catch (error) {
      console.error(`Erreur lors de l'exécution de l'action ${action} via N8N:`, error);
      return {
        success: false,
        message: 'Erreur interne du serveur',
      };
    }
  }

  /**
   * Obtenir les scopes requis pour une action spécifique
   */
  private static getRequiredScopesForAction(action: string): string[] {
    const scopeMap: Record<string, string[]> = {
      gmail: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
      ],
      sheets: [
        'https://www.googleapis.com/auth/spreadsheets',
      ],
      calendar: [
        'https://www.googleapis.com/auth/calendar',
      ],
    };

    return scopeMap[action] || [];
  }

  /**
   * Vérifier si un utilisateur a les permissions nécessaires pour N8N
   */
  static async checkUserPermissionsForN8N(userId: string): Promise<{
    hasGoogleAccess: boolean;
    availableActions: string[];
    missingScopes: string[];
    tokenExpiry?: Date;
  }> {
    try {
      const oauthTokens = await OAuthToken.find({ userId });
      const googleTokens = oauthTokens?.find(token => 
        token.provider === 'google' && 
        token.scope && 
        token.scope.length > 0
      );

      if (!googleTokens) {
        return {
          hasGoogleAccess: false,
          availableActions: [],
          missingScopes: ['google_oauth'],
        };
      }

      const availableActions: string[] = [];
      const missingScopes: string[] = [];

      // Vérifier chaque action
      const actions = ['gmail', 'sheets', 'calendar'];
      for (const action of actions) {
        const requiredScopes = this.getRequiredScopesForAction(action);
        const hasScopes = requiredScopes.every(scope => 
          googleTokens.scope?.includes(scope)
        );

        if (hasScopes) {
          availableActions.push(action);
        } else {
          const missing = requiredScopes.filter(scope => 
            !googleTokens.scope?.includes(scope)
          );
          missingScopes.push(...missing);
        }
      }

      return {
        hasGoogleAccess: true,
        availableActions,
        missingScopes: [...new Set(missingScopes)], // Supprimer les doublons
        tokenExpiry: googleTokens.expiresAt,
      };
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error);
      return {
        hasGoogleAccess: false,
        availableActions: [],
        missingScopes: ['error'],
      };
    }
  }

  /**
   * Révoker l'accès N8N aux tokens Google d'un utilisateur
   */
  static async revokeN8NAccess(userId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Déclencher un workflow N8N pour révoquer l'accès
      const workflowData = {
        userId,
        action: 'revoke_access',
        timestamp: new Date().toISOString(),
      };

      const result = await N8NService.triggerWorkflow(env.N8N_WORKFLOW_ID, workflowData);

      if (result.success) {
        return {
          success: true,
          message: 'Accès N8N révoqué avec succès',
        };
      } else {
        return {
          success: false,
          message: `Erreur lors de la révocation: ${result.error}`,
        };
      }
    } catch (error) {
      console.error('Erreur lors de la révocation de l\'accès N8N:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur',
      };
    }
  }
}
