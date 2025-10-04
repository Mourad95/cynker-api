import crypto from 'crypto';
import axios from 'axios';
import { IOAuthToken, OAuthToken } from '../../models/OAuthToken.js';
import { env } from '../../config/env.js';

export class GoogleOAuth2 {
  private static readonly AUTH_URL =
    'https://accounts.google.com/o/oauth2/v2/auth';
  private static readonly TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private static readonly USER_INFO_URL =
    'https://www.googleapis.com/oauth2/v2/userinfo';

  /**
   * Génère l'URL d'autorisation Google
   */
  static generateAuthUrl(scopes: string[], state?: string): string {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline', // Nécessaire pour obtenir refresh_token
      prompt: 'consent', // Force la demande de consentement
      state: state || crypto.randomBytes(16).toString('hex'),
    });

    return `${this.AUTH_URL}?${params.toString()}`;
  }

  /**
   * Échange le code d'autorisation contre des tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in: number;
    scope: string;
    token_type: string;
  }> {
    try {
      const response = await axios.post(this.TOKEN_URL, {
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      });

      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'échange du code:", error);
      throw new Error("Échec de l'échange du code d'autorisation");
    }
  }

  /**
   * Rafraîchit un access token expiré
   */
  static async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    expires_in: number;
    token_type: string;
  }> {
    try {
      const response = await axios.post(this.TOKEN_URL, {
        refresh_token: refreshToken,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'refresh_token',
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors du rafraîchissement du token:', error);
      throw new Error('Échec du rafraîchissement du token');
    }
  }

  /**
   * Récupère les informations de l'utilisateur
   */
  static async getUserInfo(accessToken: string): Promise<{
    id: string;
    email: string;
    name: string;
    picture: string;
    verified_email: boolean;
  }> {
    try {
      const response = await axios.get(this.USER_INFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error) {
      console.error(
        'Erreur lors de la récupération des infos utilisateur:',
        error
      );
      throw new Error('Échec de la récupération des informations utilisateur');
    }
  }

  /**
   * Sauvegarde les tokens en base de données
   */
  static async saveTokens(
    userId: string,
    tokens: any,
    scope: string[]
  ): Promise<IOAuthToken> {
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Supprime l'ancien token s'il existe
    await OAuthToken.deleteOne({ userId, provider: 'google' });

    // Crée le nouveau token
    const oauthToken = new OAuthToken({
      userId,
      provider: 'google',
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
      scope,
    });

    return await oauthToken.save();
  }

  /**
   * Récupère un token valide (rafraîchit si nécessaire)
   */
  static async getValidToken(userId: string): Promise<string> {
    const token = await OAuthToken.findOne({ userId, provider: 'google' });

    if (!token) {
      throw new Error('Token Google non trouvé');
    }

    // Vérifie si le token est expiré
    if (token.expiresAt <= new Date()) {
      if (!token.refreshToken) {
        throw new Error('Token expiré et aucun refresh token disponible');
      }

      // Rafraîchit le token
      const newTokens = await this.refreshAccessToken(token.refreshToken);

      // Met à jour en base
      token.accessToken = newTokens.access_token;
      token.expiresAt = new Date(Date.now() + newTokens.expires_in * 1000);
      await token.save();

      return newTokens.access_token;
    }

    return token.accessToken;
  }
}
