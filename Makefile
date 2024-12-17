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
	@echo "Installation de socket.io..."
	cd $(SERVER_DIR) && npm install socket.io@latest --save
	@echo "Installation des dépendances du client..."
	cd $(CLIENT_DIR) && npm install

# Démarrage des services
.PHONY: start
start: stop
	@echo "Démarrage du serveur en arrière-plan..."
	cd $(SERVER_DIR) && npm run dev & 
	@echo "Démarrage du client..."
	cd $(CLIENT_DIR) && npm start

# Arrêt des services
.PHONY: stop
stop:
	@echo "Arrêt des services..."
	-pkill -f "node.*server" || true
	-pkill -f "node.*react-scripts" || true

# Redémarrage des services
.PHONY: restart
restart: stop start

# Redémarrage complet avec réinstallation
.PHONY: restart-all
restart-all: clean install restart

# Nettoyage
.PHONY: clean
clean:
	@echo "Nettoyage des node_modules..."
	rm -rf $(SERVER_DIR)/node_modules
	rm -rf $(CLIENT_DIR)/node_modules
	rm -rf $(SERVER_DIR)/package-lock.json
	rm -rf $(CLIENT_DIR)/package-lock.json

# Aide
.PHONY: help
help:
	@echo "Commandes disponibles:"
	@echo "  make install     - Installe les dépendances"
	@echo "  make start      - Démarre le serveur et le client"
	@echo "  make stop       - Arrête tous les services"
	@echo "  make restart    - Redémarre les services"
	@echo "  make restart-all - Réinstalle tout et redémarre"
	@echo "  make clean      - Nettoie les dépendances"
	@echo "  make help       - Affiche cette aide"