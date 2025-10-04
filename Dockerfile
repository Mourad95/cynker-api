# Dockerfile pour l'API Cynker
FROM node:20-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
COPY package.json yarn.lock ./

# Installer les dépendances
RUN yarn install --frozen-lockfile

# Copier le code source
COPY . .

# Construire l'application et vérifier que les fichiers existent
RUN yarn build && ls -la dist/

# Exposer le port
EXPOSE 8080

# Variables d'environnement par défaut
ENV NODE_ENV=production
ENV PORT=8080

# Commande de démarrage
CMD ["yarn", "start"]
