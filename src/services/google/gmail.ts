import axios from 'axios';
import { GoogleOAuth2 } from '../../utils/oauth/google.js';

export class GmailService {
  private static readonly GMAIL_API_BASE =
    'https://gmail.googleapis.com/gmail/v1';

  /**
   * Envoie un email via Gmail API
   */
  static async sendEmail(
    userId: string,
    to: string,
    subject: string,
    body: string,
    isHtml: boolean = false
  ): Promise<void> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const message = {
        raw: Buffer.from(
          `To: ${to}\r\n` +
            `Subject: ${subject}\r\n` +
            `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n` +
            `\r\n${body}`
        ).toString('base64url'),
      };

      await axios.post(
        `${this.GMAIL_API_BASE}/users/me/messages/send`,
        message,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Erreur envoi email:', error);
      throw new Error("Échec de l'envoi de l'email");
    }
  }

  /**
   * Récupère les emails de l'utilisateur
   */
  static async getEmails(
    userId: string,
    maxResults: number = 10
  ): Promise<any[]> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const response = await axios.get(
        `${this.GMAIL_API_BASE}/users/me/messages`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            maxResults,
          },
        }
      );

      return response.data.messages || [];
    } catch (error) {
      console.error('Erreur récupération emails:', error);
      throw new Error('Échec de la récupération des emails');
    }
  }

  /**
   * Récupère le contenu d'un email spécifique
   */
  static async getEmailContent(
    userId: string,
    messageId: string
  ): Promise<any> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const response = await axios.get(
        `${this.GMAIL_API_BASE}/users/me/messages/${messageId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur récupération contenu email:', error);
      throw new Error("Échec de la récupération du contenu de l'email");
    }
  }

  /**
   * Marque un email comme lu/non lu
   */
  static async markAsRead(
    userId: string,
    messageId: string,
    read: boolean = true
  ): Promise<void> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      await axios.post(
        `${this.GMAIL_API_BASE}/users/me/messages/${messageId}/modify`,
        {
          removeLabelIds: read ? ['UNREAD'] : [],
          addLabelIds: read ? [] : ['UNREAD'],
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Erreur modification email:', error);
      throw new Error("Échec de la modification de l'email");
    }
  }
}
