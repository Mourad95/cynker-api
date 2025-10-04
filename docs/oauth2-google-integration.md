# 📜 Documentation OAuth2 - Intégration Google

## 🎯 Introduction

Cette documentation détaille l'intégration OAuth2 avec les services Google (Gmail, Sheets, Docs, Calendar) dans une application Node.js/Express.

### Flow OAuth2 Authorization Code

Le flow OAuth2 Authorization Code se déroule en 4 étapes :

1. **Redirection vers Google** : L'utilisateur est redirigé vers Google avec les paramètres d'autorisation
2. **Autorisation utilisateur** : L'utilisateur autorise l'application sur Google
3. **Callback avec code** : Google redirige vers votre application avec un code d'autorisation
4. **Échange code contre tokens** : Votre application échange le code contre access_token et refresh_token

### Variables d'environnement requises

```env
# Google OAuth2 Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback/google

# Base URL de votre application
BASE_URL=http://localhost:3000
```

## 🔧 Configuration Google Cloud Console

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez les APIs nécessaires :
   - Gmail API
   - Google Sheets API
   - Google Docs API
   - Google Calendar API

### 2. Configurer OAuth2

1. Allez dans "APIs & Services" > "Credentials"
2. Cliquez sur "Create Credentials" > "OAuth 2.0 Client IDs"
3. Sélectionnez "Web application"
4. Ajoutez vos URIs de redirection :
   - `http://localhost:3000/oauth/callback/google` (développement)
   - `https://yourdomain.com/oauth/callback/google` (production)

## 📚 Scopes Google OAuth2

### Scopes Gmail

- `https://www.googleapis.com/auth/gmail.readonly` - Lecture seule des emails
- `https://www.googleapis.com/auth/gmail.send` - Envoyer des emails
- `https://www.googleapis.com/auth/gmail.modify` - Modifier les emails
- `https://www.googleapis.com/auth/gmail.compose` - Composer des emails

### Scopes Google Sheets

- `https://www.googleapis.com/auth/spreadsheets` - Accès complet aux feuilles de calcul
- `https://www.googleapis.com/auth/spreadsheets.readonly` - Lecture seule

### Scopes Google Docs

- `https://www.googleapis.com/auth/documents` - Accès complet aux documents
- `https://www.googleapis.com/auth/documents.readonly` - Lecture seule

### Scopes Google Calendar

- `https://www.googleapis.com/auth/calendar` - Accès complet au calendrier
- `https://www.googleapis.com/auth/calendar.readonly` - Lecture seule
- `https://www.googleapis.com/auth/calendar.events` - Gestion des événements

### Scopes utilisateur

- `https://www.googleapis.com/auth/userinfo.email` - Email de l'utilisateur
- `https://www.googleapis.com/auth/userinfo.profile` - Profil de l'utilisateur

## 🔗 URLs OAuth2 Google

- **URL d'autorisation** : `https://accounts.google.com/o/oauth2/v2/auth`
- **URL token** : `https://oauth2.googleapis.com/token`
- **URL de révoquation** : `https://oauth2.googleapis.com/revoke`
- **URL d'information utilisateur** : `https://www.googleapis.com/oauth2/v2/userinfo`

## 💻 Implémentation

### 1. Modèle de données pour les tokens

```typescript
// src/models/OAuthToken.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IOAuthToken extends Document {
  userId: string;
  provider: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  scope: string[];
  createdAt: Date;
  updatedAt: Date;
}

const OAuthTokenSchema = new Schema<IOAuthToken>(
  {
    userId: { type: String, required: true, index: true },
    provider: {
      type: String,
      required: true,
      enum: [
        'google',
        'facebook',
        'instagram',
        'whatsapp',
        'outlook',
        'asana',
        'notion',
        'calendly',
        'linkedin',
      ],
    },
    accessToken: { type: String, required: true },
    refreshToken: { type: String },
    expiresAt: { type: Date, required: true },
    scope: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

// Index composé pour les requêtes efficaces
OAuthTokenSchema.index({ userId: 1, provider: 1 }, { unique: true });

export const OAuthToken = mongoose.model<IOAuthToken>(
  'OAuthToken',
  OAuthTokenSchema
);
```

### 2. Utilitaires OAuth2

```typescript
// src/utils/oauth/google.ts
import crypto from 'crypto';
import axios from 'axios';
import { OAuthToken } from '../../models/OAuthToken.js';

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
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
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
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
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
```

### 3. Routes OAuth2

```typescript
// src/routes/oauth.ts
import express from 'express';
import crypto from 'crypto';
import { GoogleOAuth2 } from '../utils/oauth/google.js';

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
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/calendar',
    ];

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

export default router;
```

### 4. Services Google API

```typescript
// src/services/google/gmail.ts
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
}

// src/services/google/sheets.ts
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
}

// src/services/google/calendar.ts
export class GoogleCalendarService {
  private static readonly CALENDAR_API_BASE =
    'https://www.googleapis.com/calendar/v3';

  /**
   * Crée un événement dans le calendrier
   */
  static async createEvent(
    userId: string,
    calendarId: string,
    event: {
      summary: string;
      description?: string;
      start: { dateTime: string; timeZone: string };
      end: { dateTime: string; timeZone: string };
    }
  ): Promise<any> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const response = await axios.post(
        `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events`,
        event,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return response.data;
    } catch (error) {
      console.error('Erreur création événement:', error);
      throw new Error("Échec de la création de l'événement");
    }
  }

  /**
   * Récupère les événements du calendrier
   */
  static async getEvents(
    userId: string,
    calendarId: string,
    timeMin?: string,
    timeMax?: string
  ): Promise<any[]> {
    try {
      const accessToken = await GoogleOAuth2.getValidToken(userId);

      const response = await axios.get(
        `${this.CALENDAR_API_BASE}/calendars/${calendarId}/events`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: {
            timeMin,
            timeMax,
            singleEvents: true,
            orderBy: 'startTime',
          },
        }
      );

      return response.data.items || [];
    } catch (error) {
      console.error('Erreur récupération événements:', error);
      throw new Error('Échec de la récupération des événements');
    }
  }
}
```

### 5. Routes d'utilisation des services

```typescript
// src/routes/google.ts
import express from 'express';
import { GmailService } from '../services/google/gmail.js';
import { GoogleSheetsService } from '../services/google/sheets.js';
import { GoogleCalendarService } from '../services/google/calendar.js';

const router = express.Router();

// Gmail routes
router.post('/gmail/send', async (req, res) => {
  try {
    const { userId, to, subject, body, isHtml } = req.body;

    await GmailService.sendEmail(userId, to, subject, body, isHtml);

    res.json({ success: true, message: 'Email envoyé avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/gmail/emails/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { maxResults } = req.query;

    const emails = await GmailService.getEmails(
      userId,
      parseInt(maxResults as string) || 10
    );

    res.json({ emails });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google Sheets routes
router.get('/sheets/:spreadsheetId/:range', async (req, res) => {
  try {
    const { userId } = req.body;
    const { spreadsheetId, range } = req.params;

    const data = await GoogleSheetsService.readSheet(
      userId,
      spreadsheetId,
      range
    );

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/sheets/:spreadsheetId/:range', async (req, res) => {
  try {
    const { userId, values } = req.body;
    const { spreadsheetId, range } = req.params;

    await GoogleSheetsService.writeSheet(userId, spreadsheetId, range, values);

    res.json({ success: true, message: 'Données écrites avec succès' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Google Calendar routes
router.post('/calendar/events', async (req, res) => {
  try {
    const { userId, calendarId, event } = req.body;

    const createdEvent = await GoogleCalendarService.createEvent(
      userId,
      calendarId,
      event
    );

    res.json({ success: true, event: createdEvent });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/calendar/events/:calendarId', async (req, res) => {
  try {
    const { userId } = req.body;
    const { calendarId } = req.params;
    const { timeMin, timeMax } = req.query;

    const events = await GoogleCalendarService.getEvents(
      userId,
      calendarId,
      timeMin as string,
      timeMax as string
    );

    res.json({ events });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

## 🔒 Bonnes pratiques de sécurité

### 1. Chiffrement des tokens

```typescript
// src/utils/crypto.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const SECRET_KEY = process.env.ENCRYPTION_KEY!; // 32 bytes

export class TokenEncryption {
  static encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, SECRET_KEY);
    cipher.setAAD(Buffer.from('oauth-token'));

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
    };
  }

  static decrypt(encryptedData: {
    encrypted: string;
    iv: string;
    tag: string;
  }): string {
    const decipher = crypto.createDecipher(ALGORITHM, SECRET_KEY);
    decipher.setAAD(Buffer.from('oauth-token'));
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
```

### 2. Validation des scopes

```typescript
// src/utils/oauth/scopeValidator.ts
export class ScopeValidator {
  private static readonly ALLOWED_SCOPES = {
    google: [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/spreadsheets.readonly',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/documents.readonly',
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.readonly',
    ],
  };

  static validateScopes(provider: string, requestedScopes: string[]): string[] {
    const allowedScopes =
      this.ALLOWED_SCOPES[provider as keyof typeof this.ALLOWED_SCOPES];

    if (!allowedScopes) {
      throw new Error(`Provider ${provider} non supporté`);
    }

    return requestedScopes.filter((scope) => allowedScopes.includes(scope));
  }
}
```

### 3. Rate limiting spécifique

```typescript
// src/config/rateLimits.ts
import rateLimit from 'express-rate-limit';

export const googleApiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limite à 100 requêtes par fenêtre
  message: 'Trop de requêtes vers Google API',
  standardHeaders: true,
  legacyHeaders: false,
});
```

## 🧪 Tests

### Test unitaire pour GoogleOAuth2

```typescript
// src/__tests__/oauth/google.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleOAuth2 } from '../../utils/oauth/google.js';

describe('GoogleOAuth2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate correct auth URL', () => {
    const scopes = ['https://www.googleapis.com/auth/gmail.send'];
    const authUrl = GoogleOAuth2.generateAuthUrl(scopes);

    expect(authUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
    expect(authUrl).toContain('response_type=code');
    expect(authUrl).toContain('access_type=offline');
    expect(authUrl).toContain('prompt=consent');
  });

  it('should validate scopes correctly', () => {
    const validScopes = ['https://www.googleapis.com/auth/gmail.send'];
    const invalidScopes = ['https://malicious.com/scope'];

    const validated = ScopeValidator.validateScopes('google', validScopes);
    expect(validated).toEqual(validScopes);

    expect(() => {
      ScopeValidator.validateScopes('google', invalidScopes);
    }).toThrow();
  });
});
```

## 📋 Checklist de déploiement

- [ ] Variables d'environnement configurées
- [ ] Google Cloud Console configuré
- [ ] APIs Google activées
- [ ] URIs de redirection configurées
- [ ] Base de données MongoDB accessible
- [ ] Tests unitaires passent
- [ ] Rate limiting configuré
- [ ] Logs d'erreur configurés
- [ ] Monitoring des tokens expirés
- [ ] Documentation API mise à jour

## 🚀 Exemple d'utilisation complète

```typescript
// Exemple d'utilisation dans votre application
import express from 'express';
import oauthRoutes from './routes/oauth.js';
import googleRoutes from './routes/google.js';

const app = express();

// Routes OAuth2
app.use('/oauth', oauthRoutes);

// Routes Google API
app.use('/api/google', googleRoutes);

// Exemple de flux complet
app.get('/demo-google-flow', async (req, res) => {
  try {
    // 1. Redirection vers Google
    const authResponse = await fetch(
      'http://localhost:3000/oauth/google?userId=user123'
    );
    const { authUrl } = await authResponse.json();

    // 2. L'utilisateur clique sur authUrl et autorise l'application
    // 3. Google redirige vers /oauth/callback/google avec le code
    // 4. Les tokens sont sauvegardés automatiquement

    // 5. Utilisation des services Google
    // Envoyer un email
    await fetch('http://localhost:3000/api/google/gmail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user123',
        to: 'test@example.com',
        subject: 'Test OAuth2',
        body: 'Email envoyé via OAuth2 Google!',
      }),
    });

    res.json({ message: 'Flux OAuth2 Google complet!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Cette documentation fournit une base solide pour l'intégration OAuth2 avec Google. Elle couvre tous les aspects nécessaires : configuration, sécurité, implémentation et bonnes pratiques.
