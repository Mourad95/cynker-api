# 📚 Documentation API Cynker

## 🚀 Vue d'ensemble

L'API Cynker propose un système d'authentification complet avec deux modes :
- **Authentification classique** : Email + Mot de passe
- **Authentification OAuth2 Google** : Connexion via Google

## 📖 Documentation Swagger

La documentation interactive de l'API est disponible via Swagger UI :

- **URL de développement** : http://localhost:8085/api-docs
- **Documentation JSON** : http://localhost:8085/api-docs.json

## 🔐 Authentification

### 1. Inscription (Email/Mot de passe)

```bash
curl -X POST http://localhost:8085/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MySecure123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

**Réponse :**
```json
{
  "success": true,
  "user": {
    "_id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "authProvider": "local",
    "emailVerified": false,
    "isActive": true
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "message": "Inscription réussie"
}
```

### 2. Connexion (Email/Mot de passe)

```bash
curl -X POST http://localhost:8085/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "MySecure123!"
  }'
```

### 3. Connexion OAuth2 Google

#### Étape 1 : Initiation
```bash
curl "http://localhost:8085/oauth/google?userId=507f1f77bcf86cd799439011"
```

**Réponse :**
```json
{
  "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?...",
  "state": "abc123def456ghi789"
}
```

#### Étape 2 : Redirection utilisateur
L'utilisateur clique sur `authUrl` et autorise l'application.

#### Étape 3 : Callback automatique
Google redirige vers `/oauth/callback/google` avec le code d'autorisation.

### 4. Vérification du token

```bash
curl -X GET http://localhost:8085/auth/verify \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔒 Sécurité

### Critères de mot de passe
- Minimum 8 caractères
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre
- Au moins un caractère spécial

### Validation de mot de passe
```bash
curl -X POST http://localhost:8085/auth/validate-password \
  -H "Content-Type: application/json" \
  -d '{"password": "MySecure123!"}'
```

## 🌐 APIs Google

### Gmail

#### Envoyer un email
```bash
curl -X POST http://localhost:8085/api/google/gmail/send \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "destinataire@example.com",
    "subject": "Mon sujet",
    "body": "Contenu de l'\''email",
    "isHtml": false
  }'
```

#### Récupérer les emails
```bash
curl -X GET "http://localhost:8085/api/google/gmail/emails/507f1f77bcf86cd799439011?maxResults=10" \
  -H "Authorization: Bearer <token>"
```

### Google Sheets

#### Lire une feuille
```bash
curl -X GET http://localhost:8085/api/google/sheets/spreadsheetId/A1:C10 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"userId": "507f1f77bcf86cd799439011"}'
```

#### Écrire dans une feuille
```bash
curl -X PUT http://localhost:8085/api/google/sheets/spreadsheetId/A1:C2 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "values": [
      ["Nom", "Email"],
      ["John", "john@example.com"]
    ]
  }'
```

### Google Calendar

#### Créer un événement
```bash
curl -X POST http://localhost:8085/api/google/calendar/events \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "507f1f77bcf86cd799439011",
    "calendarId": "primary",
    "event": {
      "summary": "Réunion importante",
      "description": "Discussion sur le projet",
      "start": {
        "dateTime": "2024-01-15T10:00:00.000Z",
        "timeZone": "Europe/Paris"
      },
      "end": {
        "dateTime": "2024-01-15T11:00:00.000Z",
        "timeZone": "Europe/Paris"
      }
    }
  }'
```

## 📊 Statut OAuth2

### Vérifier le statut Google
```bash
curl "http://localhost:8085/oauth/google/status?userId=507f1f77bcf86cd799439011"
```

### Déconnexion Google
```bash
curl -X DELETE http://localhost:8085/oauth/google \
  -H "Content-Type: application/json" \
  -d '{"userId": "507f1f77bcf86cd799439011"}'
```

## 🏥 Santé de l'API

```bash
curl http://localhost:8085/health
```

**Réponse :**
```json
{
  "status": "ok"
}
```

## 🚨 Gestion des erreurs

Toutes les erreurs suivent le format standard :

```json
{
  "error": "Message d'erreur descriptif",
  "details": ["Détail supplémentaire 1", "Détail supplémentaire 2"]
}
```

### Codes d'erreur courants

- **400** : Erreur de validation ou paramètres manquants
- **401** : Non authentifié ou token invalide
- **403** : Accès refusé (compte désactivé, email non vérifié, etc.)
- **404** : Ressource non trouvée
- **429** : Trop de requêtes (rate limiting)
- **500** : Erreur interne du serveur

## 🔧 Configuration

### Variables d'environnement requises

```env
# Base de données
MONGODB_URI=mongodb://localhost:27017/cynker-api

# JWT
JWT_SECRET=your_jwt_secret_here

# Google OAuth2
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8080/oauth/callback/google

# Sécurité
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

## 🚀 Démarrage rapide

1. **Installation des dépendances**
   ```bash
   yarn install
   ```

2. **Configuration**
   ```bash
   cp env.example .env
   # Éditer .env avec vos vraies valeurs
   ```

3. **Démarrage**
   ```bash
   # Mode développement
   yarn dev
   
   # Mode production
   yarn build
   yarn start
   ```

4. **Accès à la documentation**
   - Ouvrir http://localhost:8080/api-docs
   - Tester les endpoints directement dans l'interface Swagger

## 📝 Exemples d'utilisation

### Flux complet d'authentification

1. **Inscription d'un utilisateur**
   ```bash
   curl -X POST http://localhost:8080/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "MySecure123!",
       "firstName": "Test",
       "lastName": "User"
     }'
   ```

2. **Connexion**
   ```bash
   curl -X POST http://localhost:8080/auth/login \
     -H "Content-Type: application/json" \
     -d '{
       "email": "test@example.com",
       "password": "MySecure123!"
     }'
   ```

3. **Utilisation du token pour accéder aux APIs**
   ```bash
   curl -X GET http://localhost:8080/auth/verify \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

### Flux OAuth2 Google

1. **Initiation de la connexion**
   ```bash
   curl "http://localhost:8080/oauth/google?userId=507f1f77bcf86cd799439011"
   ```

2. **L'utilisateur clique sur l'URL retournée et autorise l'application**

3. **Google redirige automatiquement vers le callback**

4. **Vérification du statut**
   ```bash
   curl "http://localhost:8080/oauth/google/status?userId=507f1f77bcf86cd799439011"
   ```

## 🛡️ Bonnes pratiques

1. **Sécurité des tokens**
   - Stockez les tokens JWT de manière sécurisée
   - Ne les exposez jamais dans les logs
   - Utilisez HTTPS en production

2. **Gestion des erreurs**
   - Toujours vérifier les codes de statut HTTP
   - Gérer les cas d'expiration des tokens
   - Implémenter une logique de retry pour les erreurs temporaires

3. **Rate limiting**
   - Respectez les limites de taux pour les routes d'authentification
   - Implémentez un backoff exponentiel en cas de limitation

4. **Validation**
   - Validez toujours les données côté client ET serveur
   - Utilisez la route `/auth/validate-password` pour vérifier les mots de passe
