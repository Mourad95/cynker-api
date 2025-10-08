export const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Cynker API',
    version: '1.0.0',
    description: `# 🔐 API Cynker - Authentification et Intégration Google

Cette API permet l'authentification des utilisateurs via deux méthodes :
- **Authentification classique** : Email + Mot de passe
- **Authentification OAuth2 Google** : Connexion via Google

## 🚀 Fonctionnalités

### Authentification
- Inscription et connexion avec email/mot de passe
- Connexion OAuth2 Google
- Gestion des tokens JWT
- Validation de la force des mots de passe

### Intégration Google
- Gmail : Envoi et récupération d'emails
- Google Sheets : Lecture et écriture de feuilles de calcul
- Google Calendar : Gestion des événements et calendriers

## 🔒 Sécurité

- Rate limiting sur les routes d'authentification
- Validation stricte des entrées
- Hachage sécurisé des mots de passe (bcrypt)
- Tokens JWT avec expiration
- Protection CSRF pour OAuth2

## 📝 Utilisation

1. **Inscription/Connexion** : Utilisez les routes /auth/*
2. **OAuth2 Google** : Utilisez les routes /oauth/*
3. **APIs Google** : Utilisez les routes /api/google/* avec authentification`,
    contact: {
      name: 'Équipe Cynker',
      email: 'support@cynker.com',
    },
    license: {
      name: 'ISC',
    },
  },
  servers: [
    {
      url: 'http://localhost:8085',
      description: 'Serveur de développement',
    },
    {
      url: 'https://api.cynker.com',
      description: 'Serveur de production',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Token JWT obtenu via les routes d\'authentification',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          _id: {
            type: 'string',
            description: 'ID unique de l\'utilisateur',
            example: '507f1f77bcf86cd799439011',
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Adresse email de l\'utilisateur',
            example: 'user@example.com',
          },
          firstName: {
            type: 'string',
            description: 'Prénom de l\'utilisateur',
            example: 'John',
          },
          lastName: {
            type: 'string',
            description: 'Nom de l\'utilisateur',
            example: 'Doe',
          },
          company: {
            type: 'string',
            description: 'Nom de l\'entreprise',
            example: 'Acme Corp',
          },
          authProvider: {
            type: 'string',
            enum: ['local', 'google'],
            description: 'Type d\'authentification utilisé',
            example: 'local',
          },
          googleId: {
            type: 'string',
            description: 'ID Google (si authentification Google)',
            example: '123456789012345678901',
          },
          profilePicture: {
            type: 'string',
            format: 'uri',
            description: 'URL de la photo de profil',
            example: 'https://lh3.googleusercontent.com/a/...',
          },
          emailVerified: {
            type: 'boolean',
            description: 'Statut de vérification de l\'email',
            example: true,
          },
          isActive: {
            type: 'boolean',
            description: 'Statut d\'activation du compte',
            example: true,
          },
          lastLoginAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date de dernière connexion',
            example: '2024-01-15T10:30:00.000Z',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date de création du compte',
            example: '2024-01-01T00:00:00.000Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date de dernière mise à jour',
            example: '2024-01-15T10:30:00.000Z',
          },
        },
        required: ['_id', 'email', 'firstName', 'lastName', 'authProvider', 'emailVerified', 'isActive'],
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            description: 'Statut de la requête',
            example: true,
          },
          user: {
            $ref: '#/components/schemas/User',
          },
          token: {
            type: 'string',
            description: 'Token JWT pour l\'authentification',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
          message: {
            type: 'string',
            description: 'Message de confirmation',
            example: 'Connexion réussie',
          },
        },
        required: ['success', 'user', 'token', 'message'],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: {
            type: 'string',
            description: 'Message d\'erreur',
            example: 'Email ou mot de passe incorrect',
          },
          details: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Détails supplémentaires de l\'erreur',
            example: ['Le mot de passe doit contenir au moins 8 caractères'],
          },
        },
        required: ['error'],
      },
      RegisterRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Adresse email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            minLength: 8,
            description: 'Mot de passe (minimum 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial)',
            example: 'MySecure123!',
          },
          firstName: {
            type: 'string',
            description: 'Prénom',
            example: 'John',
          },
          lastName: {
            type: 'string',
            description: 'Nom',
            example: 'Doe',
          },
          company: {
            type: 'string',
            description: 'Nom de l\'entreprise',
            example: 'Acme Corp',
          },
        },
        required: ['email', 'password', 'firstName', 'lastName'],
      },
      LoginRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'Adresse email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            description: 'Mot de passe',
            example: 'MySecure123!',
          },
        },
        required: ['email', 'password'],
      },
      OAuthInitResponse: {
        type: 'object',
        properties: {
          authUrl: {
            type: 'string',
            format: 'uri',
            description: 'URL d\'autorisation Google',
            example: 'https://accounts.google.com/o/oauth2/v2/auth?...',
          },
          state: {
            type: 'string',
            description: 'État CSRF pour la sécurité',
            example: 'abc123def456...',
          },
        },
        required: ['authUrl', 'state'],
      },
      OAuthStatusResponse: {
        type: 'object',
        properties: {
          connected: {
            type: 'boolean',
            description: 'Statut de connexion Google',
            example: true,
          },
          isValid: {
            type: 'boolean',
            description: 'Validité du token (non expiré)',
            example: true,
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Date d\'expiration du token',
            example: '2024-01-15T10:30:00.000Z',
          },
          scope: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Scopes autorisés',
            example: ['https://www.googleapis.com/auth/gmail.send'],
          },
        },
        required: ['connected'],
      },
      PasswordValidationResponse: {
        type: 'object',
        properties: {
          isValid: {
            type: 'boolean',
            description: 'Validité du mot de passe',
            example: false,
          },
          errors: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Liste des erreurs de validation',
            example: ['Le mot de passe doit contenir au moins une majuscule'],
          },
        },
        required: ['isValid', 'errors'],
      },
      GmailSendRequest: {
        type: 'object',
        properties: {
          to: {
            type: 'string',
            format: 'email',
            description: 'Adresse email du destinataire',
            example: 'destinataire@example.com',
          },
          subject: {
            type: 'string',
            description: 'Sujet de l\'email',
            example: 'Mon sujet',
          },
          body: {
            type: 'string',
            description: 'Corps de l\'email',
            example: 'Contenu de mon email',
          },
          isHtml: {
            type: 'boolean',
            description: 'Indique si le corps est en HTML',
            example: false,
          },
        },
        required: ['to', 'subject', 'body'],
      },
      GoogleSheetsWriteRequest: {
        type: 'object',
        properties: {
          values: {
            type: 'array',
            items: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            description: 'Données à écrire (tableau 2D)',
            example: [['Nom', 'Email'], ['John', 'john@example.com']],
          },
        },
        required: ['values'],
      },
      CalendarEventRequest: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Titre de l\'événement',
            example: 'Réunion importante',
          },
          description: {
            type: 'string',
            description: 'Description de l\'événement',
            example: 'Discussion sur le projet',
          },
          start: {
            type: 'object',
            properties: {
              dateTime: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-15T10:00:00.000Z',
              },
              timeZone: {
                type: 'string',
                example: 'Europe/Paris',
              },
            },
            required: ['dateTime'],
          },
          end: {
            type: 'object',
            properties: {
              dateTime: {
                type: 'string',
                format: 'date-time',
                example: '2024-01-15T11:00:00.000Z',
              },
              timeZone: {
                type: 'string',
                example: 'Europe/Paris',
              },
            },
            required: ['dateTime'],
          },
        },
        required: ['summary', 'start', 'end'],
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'Routes d\'authentification (inscription, connexion, validation)',
    },
    {
      name: 'OAuth2',
      description: 'Routes OAuth2 Google (connexion, callback, statut)',
    },
    {
      name: 'Gmail',
      description: 'API Gmail (envoi et récupération d\'emails)',
    },
    {
      name: 'Google Sheets',
      description: 'API Google Sheets (lecture et écriture de feuilles)',
    },
    {
      name: 'Google Calendar',
      description: 'API Google Calendar (gestion des événements)',
    },
    {
      name: 'Health',
      description: 'Routes de santé et monitoring',
    },
  ],
};
