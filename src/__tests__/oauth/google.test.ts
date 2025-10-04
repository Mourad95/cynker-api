import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleOAuth2 } from '../../utils/oauth/google.js';
import { ScopeValidator } from '../../utils/oauth/scopeValidator.js';
import { env } from '../../config/env.js';

describe('GoogleOAuth2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateAuthUrl', () => {
    it('should generate correct auth URL with required parameters', () => {
      const scopes = ['https://www.googleapis.com/auth/gmail.send'];
      const authUrl = GoogleOAuth2.generateAuthUrl(scopes);

      expect(authUrl).toContain('accounts.google.com/o/oauth2/v2/auth');
      expect(authUrl).toContain(`client_id=${env.GOOGLE_CLIENT_ID}`);
      expect(authUrl).toContain(
        `redirect_uri=${encodeURIComponent(env.GOOGLE_REDIRECT_URI)}`
      );
      expect(authUrl).toContain('response_type=code');
      expect(authUrl).toContain('access_type=offline');
      expect(authUrl).toContain('prompt=consent');
      expect(authUrl).toContain(
        'scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fgmail.send'
      );
    });

    it('should include state parameter when provided', () => {
      const scopes = ['https://www.googleapis.com/auth/gmail.send'];
      const customState = 'custom_state_123';
      const authUrl = GoogleOAuth2.generateAuthUrl(scopes, customState);

      expect(authUrl).toContain(`state=${customState}`);
    });

    it('should generate random state when not provided', () => {
      const scopes = ['https://www.googleapis.com/auth/gmail.send'];
      const authUrl = GoogleOAuth2.generateAuthUrl(scopes);

      const url = new URL(authUrl);
      const state = url.searchParams.get('state');

      expect(state).toBeDefined();
      expect(state).toMatch(/^[a-f0-9]{32}$/); // 16 bytes = 32 hex chars
    });
  });

  describe('exchangeCodeForTokens', () => {
    it('should throw error with invalid code', async () => {
      // Test avec un code invalide - Google retournera une erreur 400
      await expect(
        GoogleOAuth2.exchangeCodeForTokens('invalid_test_code')
      ).rejects.toThrow("Échec de l'échange du code d'autorisation");
    });

    it('should have correct configuration', () => {
      // Test que la configuration est correcte
      expect(env.GOOGLE_CLIENT_ID).toBeDefined();
      expect(env.GOOGLE_CLIENT_SECRET).toBeDefined();
      expect(env.GOOGLE_REDIRECT_URI).toBeDefined();
      expect(env.GOOGLE_REDIRECT_URI).toContain('localhost:3000');
    });
  });
});

describe('ScopeValidator', () => {
  describe('validateScopes', () => {
    it('should validate Google scopes correctly', () => {
      const validScopes = [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/userinfo.email',
      ];
      const invalidScopes = ['https://malicious.com/scope'];

      const validated = ScopeValidator.validateScopes('google', validScopes);
      expect(validated).toEqual(validScopes);

      const mixedScopes = [...validScopes, ...invalidScopes];
      const filtered = ScopeValidator.validateScopes('google', mixedScopes);
      expect(filtered).toEqual(validScopes);
    });

    it('should throw error for unsupported provider', () => {
      expect(() => {
        ScopeValidator.validateScopes('unsupported', ['some_scope']);
      }).toThrow('Provider unsupported non supporté');
    });

    it('should return empty array for no valid scopes', () => {
      const invalidScopes = [
        'https://malicious.com/scope1',
        'https://malicious.com/scope2',
      ];
      const result = ScopeValidator.validateScopes('google', invalidScopes);
      expect(result).toEqual([]);
    });
  });

  describe('getAllowedScopes', () => {
    it('should return all allowed scopes for Google', () => {
      const scopes = ScopeValidator.getAllowedScopes('google');

      expect(scopes).toContain(
        'https://www.googleapis.com/auth/userinfo.email'
      );
      expect(scopes).toContain('https://www.googleapis.com/auth/gmail.send');
      expect(scopes).toContain('https://www.googleapis.com/auth/spreadsheets');
      expect(scopes).toContain('https://www.googleapis.com/auth/calendar');
    });

    it('should throw error for unsupported provider', () => {
      expect(() => {
        ScopeValidator.getAllowedScopes('unsupported');
      }).toThrow('Provider unsupported non supporté');
    });
  });
});

describe('OAuth2 Integration Flow', () => {
  it('should have correct Google OAuth2 URLs', () => {
    expect(GoogleOAuth2['AUTH_URL']).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth'
    );
    expect(GoogleOAuth2['TOKEN_URL']).toBe(
      'https://oauth2.googleapis.com/token'
    );
    expect(GoogleOAuth2['USER_INFO_URL']).toBe(
      'https://www.googleapis.com/oauth2/v2/userinfo'
    );
  });

  it('should support all required Google scopes', () => {
    const googleScopes = ScopeValidator.getAllowedScopes('google');

    // Vérifie que tous les scopes Google essentiels sont présents
    const requiredScopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/documents',
      'https://www.googleapis.com/auth/calendar',
    ];

    requiredScopes.forEach((scope) => {
      expect(googleScopes).toContain(scope);
    });
  });
});
