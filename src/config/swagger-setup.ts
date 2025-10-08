import swaggerUi from 'swagger-ui-express';
import { swaggerDefinition } from './swagger.js';

// Configuration Swagger UI
export const swaggerOptions = {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { color: #2c3e50; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 10px; border-radius: 5px; }
  `,
  customSiteTitle: 'Cynker API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true,
  },
};

// Génération de la documentation Swagger à partir des commentaires JSDoc
export const generateSwaggerDocs = async () => {
  const swaggerJSDoc = (await import('swagger-jsdoc')).default;
  
  const options = {
    definition: swaggerDefinition,
    apis: [
      './src/routes/*.ts',
      './src/app.ts',
    ],
  };

  return swaggerJSDoc(options);
};

// Middleware pour servir la documentation Swagger
export const setupSwagger = async (app: any) => {
  const swaggerDocs = await generateSwaggerDocs();
  
  // Route pour la documentation JSON
  app.get('/api-docs.json', (req: any, res: any) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerDocs);
  });

  // Route pour l'interface Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs, swaggerOptions));
  
  console.log('📚 Documentation Swagger disponible sur: http://localhost:8085/api-docs');
};
