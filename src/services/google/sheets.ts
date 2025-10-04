import axios from 'axios';
import { GoogleOAuth2 } from '../../utils/oauth/google.js';

export class GoogleSheetsService {
  private static readonly SHEETS_API_BASE =
    'https://sheets.googleapis.com/v4/spreadsheets';

  /**
   * Lit les données d'une feuille de calcul
   */
  static async readSheet(
    userId: string,
    spreadsheetId: string,
    range: string
  ): Promise<any[][]> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const response = await axios.get(
        `${this.SHEETS_API_BASE}/${spreadsheetId}/values/${range}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data.values || [];
    } catch (error) {
      console.error('Erreur lecture feuille:', error);
      throw new Error('Échec de la lecture de la feuille de calcul');
    }
  }

  /**
   * Écrit des données dans une feuille de calcul
   */
  static async writeSheet(
    userId: string,
    spreadsheetId: string,
    range: string,
    values: any[][]
  ): Promise<void> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      await axios.put(
        `${this.SHEETS_API_BASE}/${spreadsheetId}/values/${range}`,
        {
          values,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          params: {
            valueInputOption: 'RAW',
          },
        }
      );
    } catch (error) {
      console.error('Erreur écriture feuille:', error);
      throw new Error("Échec de l'écriture dans la feuille de calcul");
    }
  }

  /**
   * Crée une nouvelle feuille de calcul
   */
  static async createSpreadsheet(
    userId: string,
    title: string
  ): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const response = await axios.post(
        'https://sheets.googleapis.com/v4/spreadsheets',
        {
          properties: {
            title,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        spreadsheetId: response.data.spreadsheetId,
        spreadsheetUrl: response.data.spreadsheetUrl,
      };
    } catch (error) {
      console.error('Erreur création feuille:', error);
      throw new Error('Échec de la création de la feuille de calcul');
    }
  }

  /**
   * Récupère les métadonnées d'une feuille de calcul
   */
  static async getSpreadsheetMetadata(
    userId: string,
    spreadsheetId: string
  ): Promise<any> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const response = await axios.get(
        `${this.SHEETS_API_BASE}/${spreadsheetId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur métadonnées feuille:', error);
      throw new Error('Échec de la récupération des métadonnées');
    }
  }

  /**
   * Ajoute une nouvelle feuille dans un spreadsheet
   */
  static async addSheet(
    userId: string,
    spreadsheetId: string,
    sheetTitle: string
  ): Promise<void> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      await axios.post(
        `${this.SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`,
        {
          requests: [
            {
              addSheet: {
                properties: {
                  title: sheetTitle,
                },
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Erreur ajout feuille:', error);
      throw new Error("Échec de l'ajout de la feuille");
    }
  }
}
