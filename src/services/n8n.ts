import axios from 'axios';
import { env } from '../config/env.js';

export interface N8NWorkflowStatus {
  id: string;
  name: string;
  active: boolean;
  lastExecuted?: Date;
  nextExecution?: Date;
  errorCount: number;
  successCount: number;
}

export interface N8NExecution {
  id: string;
  workflowId: string;
  status: 'running' | 'success' | 'error' | 'waiting';
  startedAt: Date;
  finishedAt?: Date;
  data?: any;
  error?: string;
}

export class N8NService {
  private static readonly API_BASE_URL = env.N8N_WEBHOOK_URL?.replace('/webhook/', '/api/') || '';
  private static readonly API_KEY = env.N8N_API_KEY;
  private static readonly WORKFLOW_ID = env.N8N_WORKFLOW_ID;

  /**
   * Vérifier si N8N est accessible
   */
  static async checkHealth(): Promise<{ isHealthy: boolean; message: string; responseTime?: number }> {
    try {
      const startTime = Date.now();
      
      const response = await axios.get(`${this.API_BASE_URL}/health`, {
        headers: {
          'X-N8N-API-KEY': this.API_KEY,
        },
        timeout: 5000,
      });

      const responseTime = Date.now() - startTime;

      return {
        isHealthy: response.status === 200,
        message: 'N8N est accessible',
        responseTime,
      };
    } catch (error) {
      return {
        isHealthy: false,
        message: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Obtenir le statut d'un workflow spécifique
   */
  static async getWorkflowStatus(workflowId?: string): Promise<N8NWorkflowStatus | null> {
    try {
      const id = workflowId || this.WORKFLOW_ID;
      if (!id) {
        throw new Error('ID de workflow non configuré');
      }

      const response = await axios.get(`${this.API_BASE_URL}/workflows/${id}`, {
        headers: {
          'X-N8N-API-KEY': this.API_KEY,
        },
        timeout: 5000,
      });

      const workflow = response.data;

      return {
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        lastExecuted: workflow.lastExecuted ? new Date(workflow.lastExecuted) : undefined,
        nextExecution: workflow.nextExecution ? new Date(workflow.nextExecution) : undefined,
        errorCount: workflow.errorCount || 0,
        successCount: workflow.successCount || 0,
      };
    } catch (error) {
      console.error('Erreur lors de la récupération du statut du workflow:', error);
      return null;
    }
  }

  /**
   * Obtenir les exécutions récentes d'un workflow
   */
  static async getRecentExecutions(workflowId?: string, limit: number = 10): Promise<N8NExecution[]> {
    try {
      const id = workflowId || this.WORKFLOW_ID;
      if (!id) {
        throw new Error('ID de workflow non configuré');
      }

      const response = await axios.get(`${this.API_BASE_URL}/executions`, {
        headers: {
          'X-N8N-API-KEY': this.API_KEY,
        },
        params: {
          workflowId: id,
          limit,
        },
        timeout: 5000,
      });

      return response.data.data.map((execution: any) => ({
        id: execution.id,
        workflowId: execution.workflowId,
        status: execution.status,
        startedAt: new Date(execution.startedAt),
        finishedAt: execution.finishedAt ? new Date(execution.finishedAt) : undefined,
        data: execution.data,
        error: execution.error,
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des exécutions:', error);
      return [];
    }
  }

  /**
   * Activer/désactiver un workflow
   */
  static async toggleWorkflow(workflowId?: string, active?: boolean): Promise<boolean> {
    try {
      const id = workflowId || this.WORKFLOW_ID;
      if (!id) {
        throw new Error('ID de workflow non configuré');
      }

      const response = await axios.patch(`${this.API_BASE_URL}/workflows/${id}`, {
        active: active !== undefined ? active : true,
      }, {
        headers: {
          'X-N8N-API-KEY': this.API_KEY,
        },
        timeout: 5000,
      });

      return response.status === 200;
    } catch (error) {
      console.error('Erreur lors de la modification du workflow:', error);
      return false;
    }
  }

  /**
   * Déclencher manuellement un workflow
   */
  static async triggerWorkflow(workflowId?: string, data?: any): Promise<{ success: boolean; executionId?: string; error?: string }> {
    try {
      const id = workflowId || this.WORKFLOW_ID;
      if (!id) {
        throw new Error('ID de workflow non configuré');
      }

      const response = await axios.post(`${this.API_BASE_URL}/workflows/${id}/execute`, {
        data,
      }, {
        headers: {
          'X-N8N-API-KEY': this.API_KEY,
        },
        timeout: 10000,
      });

      return {
        success: true,
        executionId: response.data.executionId,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      };
    }
  }

  /**
   * Obtenir un statut complet de l'automatisation
   */
  static async getAutomationStatus(): Promise<{
    isHealthy: boolean;
    workflowStatus: N8NWorkflowStatus | null;
    recentExecutions: N8NExecution[];
    lastHealthCheck: Date;
  }> {
    const healthCheck = await this.checkHealth();
    const workflowStatus = await this.getWorkflowStatus();
    const recentExecutions = await this.getRecentExecutions();

    return {
      isHealthy: healthCheck.isHealthy,
      workflowStatus,
      recentExecutions,
      lastHealthCheck: new Date(),
    };
  }
}
