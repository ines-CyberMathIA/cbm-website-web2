# Variables
SERVER_DIR = server
CLIENT_DIR = client

# Commandes par défaut
.PHONY: all
all: install start

# Installation des dépendances
.PHONY: install
install:
	@echo "Installation des dépendances du serveur..."
	cd $(SERVER_DIR) && npm install
	@echo "Installation des dépendances du client..."
	cd $(CLIENT_DIR) && npm install

# Démarrage des services
.PHONY: start
start: start-server start-client

# Démarrage du serveur
.PHONY: start-server
start-server:
	@echo "Démarrage du serveur..."
	cd $(SERVER_DIR) && npm run dev

# Démarrage du client
.PHONY: start-client
start-client:
	@echo "Démarrage du client..."
	cd $(CLIENT_DIR) && npm start

# Nettoyage
.PHONY: clean
clean:
	@echo "Nettoyage des node_modules..."
	rm -rf $(SERVER_DIR)/node_modules
	rm -rf $(CLIENT_DIR)/node_modules

# Aide
.PHONY: help
help:
	@echo "Commandes disponibles:"
	@echo "  make install     - Installe les dépendances"
	@echo "  make start      - Démarre le serveur et le client"
	@echo "  make start-server - Démarre uniquement le serveur"
	@echo "  make start-client - Démarre uniquement le client"
	@echo "  make clean      - Nettoie les dépendances"
	@echo "  make help       - Affiche cette aide"