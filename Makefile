# Variables
DOCKER_COMPOSE = docker compose
NODE = node
NPM = npm
PROJECT_NAME = online-tutoring-platform
DOCKER_SOCKET = /var/run/docker.sock

# Couleurs pour les messages
CYAN = \033[0;36m
GREEN = \033[0;32m
YELLOW = \033[0;33m
RED = \033[0;31m
NC = \033[0m # No Color

# Commandes principales
# ... (garder toutes les variables et cibles existantes)

# Nouvelles commandes pour l'administration
.PHONY: admin-setup admin-reset admin-logs admin-test admin-check

help: ## Affiche l'aide avec les nouvelles commandes
	@echo "${CYAN}=== Commandes disponibles ===${NC}"
	@echo "${GREEN}make remove-old-node${NC} - Supprime l'ancienne version de Node.js"
	@echo "${GREEN}make setup-node${NC}    - Configure Node.js (version LTS)"
	@echo "${GREEN}make docker-permissions${NC} - Configure les permissions Docker"
	@echo "${GREEN}make check-deps${NC}    - Vérifie les dépendances requises"
	@echo "${GREEN}make install-deps${NC}  - Installe les dépendances système requises"
	@echo "${GREEN}make setup-dev${NC}     - Configure l'environnement de développement"
	@echo "${GREEN}make install${NC}       - Installe les dépendances Node.js"
	@echo "${GREEN}make dev${NC}           - Lance l'application en mode développement"
	@echo "${GREEN}make start${NC}         - Lance l'application en production"
	@echo "${GREEN}make stop${NC}          - Arrête l'application"
	@echo "${GREEN}make clean${NC}         - Nettoie les fichiers temporaires"
	@echo "${GREEN}make db-shell${NC}      - Se connecter à MongoDB"
	@echo "${GREEN}make db-status${NC}     - Voir l'état de la base de données"
	@echo "${YELLOW}=== Commandes Admin ===${NC}"
	@echo "${GREEN}make admin-setup${NC}   - Configure le compte administrateur"
	@echo "${GREEN}make admin-reset${NC}   - Réinitialise le compte administrateur"
	@echo "${GREEN}make admin-logs${NC}    - Affiche les logs du serveur"
	@echo "${GREEN}make admin-test${NC}    - Teste la configuration admin"
	@echo "${GREEN}make admin-check${NC}   - Vérifie l'état des services admin"

admin-setup: ## Configure le compte administrateur et l'authentification double facteur
	@echo "${CYAN}Configuration du compte administrateur...${NC}"
	@$(DOCKER_COMPOSE) down
	@$(DOCKER_COMPOSE) up -d mongodb
	@sleep 5
	@cd server && $(NPM) run create-admin
	@$(DOCKER_COMPOSE) up -d
	@echo "${GREEN}Compte administrateur configuré !${NC}"
	@echo "${YELLOW}=== Identifiants Admin ===${NC}"
	@echo "URL      : http://localhost:3000/admin-login"
	@echo "Login    : admin_cybermathia"
	@echo "Password : Admin123!@#"
	@echo "${YELLOW}=== Configuration Email ===${NC}"
	@echo "Email    : cybermathia@gmail.com"
	@echo "App Pass : wuig znrg uggv tydt"

admin-reset: ## Réinitialise le compte administrateur
	@echo "${CYAN}Réinitialisation du compte administrateur...${NC}"
	@$(DOCKER_COMPOSE) down
	@$(DOCKER_COMPOSE) up -d mongodb
	@sleep 5
	@cd server && $(NPM) run reset-admin
	@$(DOCKER_COMPOSE) up -d
	@echo "${GREEN}Compte administrateur réinitialisé !${NC}"

admin-logs: ## Affiche les logs du serveur pour le debugging admin
	@echo "${CYAN}Affichage des logs du serveur...${NC}"
	@$(DOCKER_COMPOSE) logs -f server

admin-test: ## Teste la connexion admin et l'envoi d'emails
	@echo "${CYAN}Test de la configuration admin...${NC}"
	@echo "1. Vérification de la base de données..."
	@$(DOCKER_COMPOSE) exec mongodb mongosh -u admin -p password --eval "use tutoring; db.users.findOne({role:'admin'})"
	@echo "2. Vérification du serveur SMTP..."
	@cd server && node -e "require('nodemailer').createTransport({service:'gmail',auth:{user:process.env.EMAIL_USER,pass:process.env.EMAIL_PASSWORD}}).verify().then(() => console.log('${GREEN}Configuration email OK${NC}')).catch(err => console.error('${RED}Erreur email:', err, '${NC}'))"

admin-check: ## Vérifie l'état des services admin
	@echo "${CYAN}Vérification des services admin...${NC}"
	@echo "1. État des conteneurs :"
	@$(DOCKER_COMPOSE) ps
	@echo "\n2. État de la base de données :"
	@$(DOCKER_COMPOSE) exec mongodb mongosh -u admin -p password --eval "db.adminCommand('ping')"
	@echo "\n3. Vérification des variables d'environnement :"
	@cd server && node -e "console.log('EMAIL_USER:', process.env.EMAIL_USER); console.log('JWT_SECRET:', process.env.JWT_SECRET?.substring(0,10) + '...')"




remove-old-node:
	@echo "${CYAN}Suppression de l'ancienne version de Node.js...${NC}"
	@sudo apt-get remove -y nodejs nodejs-doc libnode-dev libnode72 || true
	@sudo apt-get autoremove -y
	@sudo rm -rf /usr/local/bin/npm /usr/local/share/man/man1/node* /usr/local/lib/dtrace/node.d ~/.npm
	@sudo rm -rf /usr/local/include/node /usr/local/bin/node
	@sudo apt-get clean
	@echo "${GREEN}Ancienne version de Node.js supprimée !${NC}"

setup-node: remove-old-node
	@echo "${CYAN}Configuration de Node.js...${NC}"
	@echo "${YELLOW}Installation de Node.js LTS...${NC}"
	@curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
	@sudo apt-get install -y nodejs
	@sudo npm install -g npm@latest
	@echo "${GREEN}Node.js LTS installé !${NC}"
	@node -v
	@npm -v

docker-permissions:
	@echo "${CYAN}Configuration des permissions Docker...${NC}"
	@if [ ! -S $(DOCKER_SOCKET) ]; then \
		echo "${RED}Socket Docker non trouvé${NC}"; \
		exit 1; \
	fi
	@sudo groupadd -f docker
	@sudo usermod -aG docker $$USER
	@echo "${YELLOW}Permissions Docker configurées. Pour appliquer les changements, exécutez:${NC}"
	@echo "${YELLOW}newgrp docker${NC}"
	@echo "${YELLOW}ou déconnectez-vous et reconnectez-vous${NC}"

check-deps:
	@echo "${CYAN}Vérification des dépendances...${NC}"
	@which docker >/dev/null 2>&1 || (echo "${RED}Docker n'est pas installé${NC}" && exit 1)
	@which node >/dev/null 2>&1 || (echo "${RED}Node.js n'est pas installé${NC}" && exit 1)
	@which npm >/dev/null 2>&1 || (echo "${RED}NPM n'est pas installé${NC}" && exit 1)
	@docker compose version >/dev/null 2>&1 || (echo "${RED}Docker Compose n'est pas installé${NC}" && exit 1)
	@echo "${GREEN}Toutes les dépendances sont installées !${NC}"

install-deps: setup-node
	@echo "${CYAN}Installation des dépendances système...${NC}"
	@if ! which docker >/dev/null 2>&1; then \
		echo "${YELLOW}Installation de Docker...${NC}"; \
		sudo apt-get update && sudo apt-get install -y docker.io; \
	fi
	@if ! which docker-compose >/dev/null 2>&1; then \
		echo "${YELLOW}Installation de Docker Compose...${NC}"; \
		sudo apt-get install -y docker-compose; \
	fi
	@make docker-permissions
	@echo "${GREEN}Dépendances système installées !${NC}"

setup-dev: check-deps docker-permissions
	@echo "${CYAN}Configuration de l'environnement de développement...${NC}"
	@if [ ! -f .env ]; then \
		cp .env.example .env; \
		echo "${YELLOW}Fichier .env créé. N'oubliez pas de configurer vos variables d'environnement${NC}"; \
	fi
	@make setup-db
	@make install

setup-db: docker-permissions
	@echo "${CYAN}Configuration de la base de données...${NC}"
	@docker compose up -d mongodb || (echo "${RED}Erreur lors du démarrage de MongoDB${NC}" && exit 1)
	@echo "${GREEN}MongoDB est prêt !${NC}"

install: setup-node
	@echo "${CYAN}Installation des dépendances du client...${NC}"
	@cd client && $(NPM) install --legacy-peer-deps || (echo "${RED}Erreur lors de l'installation des dépendances client${NC}" && exit 1)
	@echo "${CYAN}Installation des dépendances du serveur...${NC}"
	@cd server && $(NPM) install --legacy-peer-deps || (echo "${RED}Erreur lors de l'installation des dépendances serveur${NC}" && exit 1)
	@echo "${GREEN}Installation terminée !${NC}"

dev: check-deps docker-permissions
	@echo "${CYAN}Démarrage en mode développement...${NC}"
	@docker compose up -d mongodb
	@cd server && $(NPM) run dev &
	@cd client && $(NPM) run dev

start: check-deps docker-permissions check-docker-files
	@echo "${CYAN}Démarrage en production...${NC}"
	@docker compose up -d
	@echo "${GREEN}Application démarrée !${NC}"
	@echo "${YELLOW}Client: http://localhost:3000${NC}"
	@echo "${YELLOW}Serveur: http://localhost:5000${NC}"

stop:
	@echo "${CYAN}Arrêt de l'application...${NC}"
	@docker compose down || true
	@pkill node || true
	@echo "${GREEN}Application arrêtée${NC}"

clean:
	@echo "${CYAN}Nettoyage des fichiers temporaires...${NC}"
	@rm -rf client/node_modules server/node_modules client/build server/dist
	@echo "${GREEN}Nettoyage terminé !${NC}"

check-docker-files:
	@echo "${CYAN}Vérification des Dockerfiles...${NC}"
	@if [ ! -f server/Dockerfile ]; then \
		echo "${YELLOW}Création du Dockerfile serveur...${NC}"; \
		echo "FROM node:18-alpine\n\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm install\n\nCOPY . .\n\nEXPOSE 5000\n\nCMD [\"npm\", \"start\"]" > server/Dockerfile; \
	fi
	@if [ ! -f client/Dockerfile ]; then \
		echo "${YELLOW}Création du Dockerfile client...${NC}"; \
		echo "FROM node:18-alpine\n\nWORKDIR /app\n\nCOPY package*.json ./\nRUN npm install\n\nCOPY . .\n\nEXPOSE 3000\n\nCMD [\"npm\", \"start\"]" > client/Dockerfile; \
	fi
	@echo "${GREEN}Dockerfiles vérifiés !${NC}"

db-shell:
	@echo "${CYAN}Connexion à MongoDB...${NC}"
	@docker exec -it cbm-website-web2-mongodb-1 mongosh -u admin -p password

db-status:
	@echo "${CYAN}État de la base de données...${NC}"
	@echo "\n${YELLOW}Collections :${NC}"
	@docker exec cbm-website-web2-mongodb-1 mongosh -u admin -p password --eval "use tutoring; show collections;"
	@echo "\n${YELLOW}Nombre d'utilisateurs par rôle :${NC}"
	@docker exec cbm-website-web2-mongodb-1 mongosh -u admin -p password --eval 'use tutoring; db.users.aggregate([{$group:{_id:"$role", count:{$sum:1}}}]);'