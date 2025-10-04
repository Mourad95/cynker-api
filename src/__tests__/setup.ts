// Configuration des variables d'environnement pour les tests
process.env.NODE_ENV = 'test';
process.env.PORT = '8080';
process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000';
process.env.SESSION_SECRET =
  'test_session_secret_ultra_long_et_securise_32_caracteres_minimum';
process.env.JWT_SECRET =
  'test_jwt_secret_ultra_long_et_securise_32_caracteres_minimum';
process.env.RUN_TOKEN_TTL_SECONDS = '3600';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test-cynker-api';
process.env.ENCRYPTION_KEY_CURRENT =
  'dGVzdF9jbGVfY2hpZmZyZW1lbnRfYWN0dWVsbGVfMzJfY2FyYWN0ZXJlc19taW5pbXVt';
process.env.ENCRYPTION_KEY_PREVIOUS =
  'dGVzdF9jbGVfY2hpZmZyZW1lbnRfcHJlY2VkZW50ZV8zMl9jYXJhY3RlcmVzX21pbmltdW0=';

