import express from 'express';

const app = express();

// Middleware de base
app.use(express.json());

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;
