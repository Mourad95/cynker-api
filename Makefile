# Makefile pour Cynker API

.PHONY: help dev build start stop clean docker-mongo docker-api docker-up docker-down logs test lint

# Variables
API_PORT := 8085
DOCKER_COMPOSE := docker-compose

# Charger les variables d'environnement
include .env
export

# Aide par défaut
help: ## Afficher l'aide
	@echo "🚀 Cynker API - Commandes disponibles:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' Makefile | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

# Développement local
dev: ## Démarrer l'API en mode développement (nécessite MongoDB)
	@echo "🔄 Démarrage de l'API en mode développement..."
	yarn dev

build: ## Construire l'API
	@echo "🔨 Construction de l'API..."
	yarn build

start: ## Démarrer l'API en production
	@echo "🚀 Démarrage de l'API en production..."
	yarn start

# MongoDB avec Docker
docker-mongo: ## Démarrer seulement MongoDB avec Docker
	@echo "🐳 Démarrage de MongoDB avec Docker..."
	$(DOCKER_COMPOSE) up -d mongodb
	@echo "✅ MongoDB démarré sur le port $(MONGO_PORT)"
	@echo "📊 Connexion: mongodb://$(MONGO_USERNAME):$(MONGO_PASSWORD)@localhost:$(MONGO_PORT)/$(MONGO_DATABASE)?authSource=$(MONGO_AUTH_SOURCE)"

# API avec Docker
docker-api: ## Construire et démarrer l'API avec Docker
	@echo "🐳 Construction et démarrage de l'API avec Docker..."
	$(DOCKER_COMPOSE) up --build api

# Docker Compose complet
docker-up: ## Démarrer tous les services avec Docker Compose
	@echo "🐳 Démarrage de tous les services..."
	$(DOCKER_COMPOSE) up --build

docker-down: ## Arrêter tous les services Docker
	@echo "🛑 Arrêt de tous les services Docker..."
	$(DOCKER_COMPOSE) down

docker-down-mongo: ## Arrêter seulement MongoDB
	@echo "🛑 Arrêt de MongoDB..."
	$(DOCKER_COMPOSE) stop mongodb

docker-down-api: ## Arrêter seulement l'API
	@echo "🛑 Arrêt de l'API..."
	$(DOCKER_COMPOSE) stop api

# Logs
logs: ## Afficher les logs des services Docker
	$(DOCKER_COMPOSE) logs -f

logs-api: ## Afficher les logs de l'API
	$(DOCKER_COMPOSE) logs -f api

logs-mongo: ## Afficher les logs de MongoDB
	$(DOCKER_COMPOSE) logs -f mongodb

# Tests et qualité
test: ## Lancer les tests
	@echo "🧪 Lancement des tests..."
	yarn test

lint: ## Lancer le linter
	@echo "🔍 Vérification du code..."
	yarn lint

typecheck: ## Vérifier les types TypeScript
	@echo "📝 Vérification des types..."
	yarn typecheck

# Nettoyage
clean: ## Nettoyer les fichiers générés
	@echo "🧹 Nettoyage..."
	rm -rf dist/
	rm -rf node_modules/.cache/

clean-docker: ## Nettoyer les conteneurs et volumes Docker
	@echo "🧹 Nettoyage Docker..."
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -f

# Utilitaires
status: ## Afficher le statut des services
	@echo "📊 Statut des services:"
	@echo "API (port $(API_PORT)):"
	@curl -s http://localhost:$(API_PORT)/health > /dev/null && echo "  ✅ API en ligne" || echo "  ❌ API hors ligne"
	@echo "MongoDB (port $(MONGO_PORT)):"
	@nc -z localhost $(MONGO_PORT) > /dev/null 2>&1 && echo "  ✅ MongoDB en ligne" || echo "  ❌ MongoDB hors ligne"

mongo-info: ## Afficher les informations de connexion MongoDB
	@echo "🔗 Informations de connexion MongoDB:"
	@echo "  Host: localhost"
	@echo "  Port: $(MONGO_PORT)"
	@echo "  Username: $(MONGO_USERNAME)"
	@echo "  Password: $(MONGO_PASSWORD)"
	@echo "  Database: $(MONGO_DATABASE)"
	@echo "  Auth Source: $(MONGO_AUTH_SOURCE)"
	@echo ""
	@echo "📋 URL de connexion Compass:"
	@echo "  mongodb://$(MONGO_USERNAME):$(MONGO_PASSWORD)@localhost:$(MONGO_PORT)/$(MONGO_DATABASE)?authSource=$(MONGO_AUTH_SOURCE)"

install: ## Installer les dépendances
	@echo "📦 Installation des dépendances..."
	yarn install

# Développement complet
dev-full: docker-mongo dev ## Démarrer MongoDB + API en mode développement

# Production
prod: docker-up ## Démarrage complet en production
