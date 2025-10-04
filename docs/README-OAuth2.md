# 🔐 Guide d'intégration OAuth2 - Cynker API

## 📋 Vue d'ensemble

Ce guide vous accompagne dans l'intégration OAuth2 avec Google dans votre application Cynker API. L'intégration permet d'accéder aux services Google (Gmail, Sheets, Docs, Calendar) de manière sécurisée.

## 🚀 Démarrage rapide

### 1. Configuration des variables d'environnement

Copiez le fichier `env.example` vers `.env` et configurez vos variables :

```bash
cp env.example .env
```

Éditez le fichier `.env` avec vos vraies valeurs :

```env
# Configuration OAuth2 Google
GOOGLE_CLIENT_ID=your_actual_google_client_id
GOOGLE_CLIENT_SECRET=your_actual_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3000/oauth/callback/google
```

### 2. Configuration Google Cloud Console

1. **Créer un projet** sur [Google Cloud Console](https://console.cloud.google.com/)
2. **Activer les APIs** :
   - Gmail API
   - Google Sheets API
   - Google Docs API
   - Google Calendar API
3. **Créer des credentials OAuth2** :
   - Type : Application Web
   - URI de redirection : `http://localhost:3000/oauth/callback/google`

### 3. Installation et démarrage

```bash
# Installation des dépendances
yarn install

# Démarrage en mode développement
yarn dev

# Ou compilation et démarrage en production
yarn build
yarn start
```

## 🔄 Flux OAuth2

### 1. Initiation de la connexion

```bash
GET /oauth/google?userId=user123
```

**Réponse :**

```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "abc123def456..."
}
```

### 2. Redirection utilisateur

L'utilisateur clique sur `authUrl` et autorise l'application sur Google.

### 3. Callback automatique

Google redirige vers `/oauth/callback/google` avec le code d'autorisation.

### 4. Sauvegarde des tokens

Les tokens sont automatiquement sauvegardés en base de données.

## 📡 Utilisation des APIs Google

### Gmail

#### Envoyer un email

```bash
POST /api/google/gmail/send
Content-Type: application/json

{
  "userId": "user123",
  "to": "destinataire@example.com",
  "subject": "Sujet de l'email",
  "body": "Contenu de l'email",
  "isHtml": false
}
```

#### Récupérer les emails

```bash
GET /api/google/gmail/emails/user123?maxResults=10
```

### Google Sheets

#### Lire des données

```bash
GET /api/google/sheets/SPREADSHEET_ID/A1:C10
Content-Type: application/json

{
  "userId": "user123"
}
```

#### Écrire des données

```bash
PUT /api/google/sheets/SPREADSHEET_ID/A1:C3
Content-Type: application/json

{
  "userId": "user123",
  "values": [
    ["Nom", "Email", "Téléphone"],
    ["John Doe", "john@example.com", "0123456789"],
    ["Jane Smith", "jane@example.com", "0987654321"]
  ]
}
```

### Google Calendar

#### Créer un événement

```bash
POST /api/google/calendar/events
Content-Type: application/json

{
  "userId": "user123",
  "calendarId": "primary",
  "event": {
    "summary": "Réunion importante",
    "description": "Description de la réunion",
    "start": {
      "dateTime": "2024-01-15T10:00:00",
      "timeZone": "Europe/Paris"
    },
    "end": {
      "dateTime": "2024-01-15T11:00:00",
      "timeZone": "Europe/Paris"
    }
  }
}
```

## 🔒 Sécurité

### Gestion des tokens

- Les tokens sont stockés chiffrés en base de données
- Rafraîchissement automatique des tokens expirés
- Validation des scopes pour limiter les permissions
- Protection CSRF avec les paramètres `state`

### Rate limiting

- Limitation des requêtes OAuth2 : 10 requêtes/15 minutes
- Limitation des APIs Google : 100 requêtes/15 minutes

## 🧪 Tests

```bash
# Exécuter tous les tests
yarn test

# Tests en mode watch
yarn test:watch

# Tests avec couverture
yarn test:coverage
```

## 📊 Monitoring

### Vérifier le statut de connexion

```bash
GET /oauth/google/status?userId=user123
```

**Réponse :**

```json
{
  "connected": true,
  "isValid": true,
  "expiresAt": "2024-01-15T12:00:00.000Z",
  "scope": ["https://www.googleapis.com/auth/gmail.send", "..."]
}
```

### Déconnexion

```bash
DELETE /oauth/google
Content-Type: application/json

{
  "userId": "user123"
}
```

## 🐛 Dépannage

### Erreurs courantes

1. **"Token Google non trouvé"**
   - Vérifiez que l'utilisateur a bien autorisé l'application
   - Vérifiez que les tokens sont bien sauvegardés en base

2. **"Token expiré et aucun refresh token disponible"**
   - L'utilisateur doit réautoriser l'application
   - Vérifiez que `access_type=offline` est bien configuré

3. **"État invalide ou expiré"**
   - Le paramètre `state` a expiré (10 minutes)
   - Relancez le processus d'autorisation

### Logs utiles

```bash
# Activer les logs détaillés
DEBUG=oauth:* yarn dev
```

## 📚 Ressources

- [Documentation Google OAuth2](https://developers.google.com/identity/protocols/oauth2)
- [Gmail API](https://developers.google.com/gmail/api)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [Google Calendar API](https://developers.google.com/calendar/api)

## 🔄 Prochaines étapes

Cette intégration Google est la première d'une série. Les prochaines intégrations prévues :

- [ ] Facebook OAuth2
- [ ] Instagram OAuth2
- [ ] WhatsApp OAuth2
- [ ] Outlook OAuth2
- [ ] Asana OAuth2
- [ ] Notion OAuth2
- [ ] Calendly OAuth2
- [ ] LinkedIn OAuth2

Chaque intégration suivra le même pattern que Google pour une cohérence maximale.
