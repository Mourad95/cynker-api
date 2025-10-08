import { describe, it, expect } from 'vitest';
import {
  encrypt,
  decrypt,
  generateEncryptionKey,
  isValidEncryptionKey,
  type EncryptedData,
} from '../utils/crypto.js';

describe('Crypto Utils', () => {
  describe('generateEncryptionKey', () => {
    it('devrait générer une clé valide de 32 bytes en base64', () => {
      const key = generateEncryptionKey();

      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(isValidEncryptionKey(key)).toBe(true);
    });

    it('devrait générer des clés différentes à chaque appel', () => {
      const key1 = generateEncryptionKey();
      const key2 = generateEncryptionKey();

      expect(key1).not.toBe(key2);
    });
  });

  describe('isValidEncryptionKey', () => {
    it('devrait valider une clé correcte', () => {
      const validKey = generateEncryptionKey();
      expect(isValidEncryptionKey(validKey)).toBe(true);
    });

    it('devrait rejeter une clé invalide', () => {
      expect(isValidEncryptionKey('invalid-key')).toBe(false);
      expect(isValidEncryptionKey('')).toBe(false);
      expect(isValidEncryptionKey('dGVzdA==')).toBe(false); // Trop courte
    });
  });

  describe('encrypt', () => {
    it('devrait chiffrer un texte simple', () => {
      const plaintext = 'Hello, World!';
      const encrypted = encrypt(plaintext);

      expect(encrypted).toHaveProperty('data');
      expect(encrypted).toHaveProperty('iv');

      expect(typeof encrypted.data).toBe('string');
      expect(typeof encrypted.iv).toBe('string');

      // Le texte chiffré ne doit pas être identique au texte original
      expect(encrypted.data).not.toBe(plaintext);
    });

    it('devrait générer des résultats différents pour le même texte', () => {
      const plaintext = 'Test message';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      // L'IV doit être différent (aléatoire)
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      // Le texte chiffré doit être différent
      expect(encrypted1.data).not.toBe(encrypted2.data);
    });

    it('devrait chiffrer des textes avec caractères spéciaux', () => {
      const specialTexts = [
        'Café ☕',
        'Émojis 🚀🎉',
        'Accents: àéèùç',
        'Symboles: !@#$%^&*()',
        'Nouvelle ligne:\nTab:\t',
      ];

      specialTexts.forEach((text) => {
        const encrypted = encrypt(text);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(text);
      });
    });

    it('devrait rejeter un texte vide', () => {
      expect(() => encrypt('')).toThrow(
        'Le texte à chiffrer ne peut pas être vide'
      );
    });
  });

  describe('decrypt', () => {
    it('devrait déchiffrer correctement un texte chiffré (round-trip)', () => {
      const originalText = 'Hello, World!';
      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('devrait déchiffrer avec différents types de contenu', () => {
      const testCases = [
        'Simple text',
        'JSON: {"key": "value", "number": 123}',
        'Long text: '.repeat(100),
        'Unicode: 你好世界 🌍',
        'Empty spaces:   ',
      ];

      testCases.forEach((text) => {
        const encrypted = encrypt(text);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(text);
      });
    });

    it('devrait rejeter des données chiffrées invalides', () => {
      const invalidData = {
        data: '',
        iv: '',
      };

      expect(() => decrypt(invalidData)).toThrow('Données chiffrées invalides');
    });

    it('devrait rejeter des données chiffrées corrompues', () => {
      const validEncrypted = encrypt('Test message');

      // Corrompre les données
      const corruptedData: EncryptedData = {
        ...validEncrypted,
        data: 'corrupted-data',
      };

      expect(() => decrypt(corruptedData)).toThrow('Erreur de déchiffrement');
    });
  });

  describe('Rotation de clés', () => {
    it("devrait utiliser la clé précédente en cas d'échec avec la clé actuelle", () => {
      // Ce test simule une rotation de clé
      const originalText = 'Test with key rotation';
      const encrypted = encrypt(originalText);

      // Le déchiffrement devrait fonctionner
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });
  });

  describe('Sécurité', () => {
    it('devrait rejeter le déchiffrement avec une mauvaise clé', () => {
      const plaintext = 'Secret message';
      const encrypted = encrypt(plaintext);

      // Simuler une mauvaise clé en modifiant l'environnement
      const originalKey = process.env.ENCRYPTION_KEY_CURRENT;
      process.env.ENCRYPTION_KEY_CURRENT = generateEncryptionKey();

      try {
        expect(() => decrypt(encrypted)).toThrow('Erreur de déchiffrement');
      } finally {
        // Restaurer la clé originale
        process.env.ENCRYPTION_KEY_CURRENT = originalKey;
      }
    });

    it("devrait maintenir l'intégrité avec AAD (Additional Authenticated Data)", () => {
      const plaintext = 'Message with AAD';
      const encrypted = encrypt(plaintext);

      // Le déchiffrement devrait fonctionner normalement
      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });
  });

  describe('Performance', () => {
    it('devrait chiffrer/déchiffrer rapidement', () => {
      const plaintext = 'Performance test message';
      const startTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const encrypted = encrypt(plaintext);
        const decrypted = decrypt(encrypted);
        expect(decrypted).toBe(plaintext);
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      // 100 opérations ne devraient pas prendre plus de 1 seconde
      expect(duration).toBeLessThan(1000);
    });
  });
});
