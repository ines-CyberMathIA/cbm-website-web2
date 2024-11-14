

### 1. **Définition de l'Architecture et des Technologies**

- **Frontend** : HTML, CSS, JavaScript
  - **Bibliothèques** : React pour les interfaces dynamiques, ou Vue.js si besoin de simplicité.
  - **Styling** : Tailwind CSS ou SCSS pour créer des interfaces modernes, fluides, avec des formes géométriques et abstraites.
  - **Authentification** : Intégration d'une bibliothèque de composants visuels comme Material UI ou Chakra UI pour faciliter la mise en page moderne et réactive.

- **Backend** : Node.js avec Express.js pour gérer les API, les rôles utilisateurs, et les données de réservation.
  - **Authentification** : JSON Web Token (JWT) pour sécuriser les connexions utilisateurs.
  - **Gestion des Emails** : Nodemailer pour les notifications d'inscription, d'activation de compte et de rappels.
  - **Orchestration** : Makefile pour gérer les scripts de lancement, le développement et les tests.

- **Base de Données** : MongoDB, qui permet de gérer facilement les utilisateurs, les cours et les réservations de créneaux grâce à son modèle NoSQL, et d’effectuer des requêtes complexes pour filtrer les créneaux en fonction des rôles et niveaux.

- **Intégration des Paiements** : Stripe pour gérer les abonnements des parents.

---

### 2. **Ébauche de la Structure et des Fonctionnalités par Rôle**

Chaque utilisateur aura un espace personnalisé :

- **Admin** :
  - Visualise les statistiques clés (chiffre d’affaires, nombre de comptes, etc.).
  - Crée et supprime des comptes (professeurs, parents, recruteurs).
  - **Sécurité** : Mot de passe, double authentification.

- **Recruteur** :
  - Crée et supprime des comptes professeurs, avec gestion des informations comme le RIB.
  - **Sécurité** : Authentification avec JWT et gestion des permissions spécifiques.

- **Parent** :
  - Crée des comptes élèves et gère les abonnements (Stripe).
  - Peut réserver les créneaux des professeurs disponibles en fonction du niveau de l'élève.
  - Visualise l’historique des cours, les séances prévues, les comptes rendus et les devoirs.

- **Élève** :
  - Accès à un dashboard personnalisé pour consulter son emploi du temps et ses devoirs.
  - Peut recevoir des notifications de rappel pour les séances.

- **Professeur** :
  - Gère ses créneaux d'enseignement, visibles selon le niveau des élèves.
  - Peut ajouter, modifier, clôturer des créneaux pour les groupes.

---

### 3. **Étapes de Développement et Technologies Associées**

**Étape 1 : Création du Backend**

- **Node.js + Express.js** : Mise en place du serveur et des API.
  - **API de gestion des utilisateurs** : routes pour créer, supprimer, et modifier les comptes selon les rôles.
  - **JWT** : configuration de l’authentification JWT pour sécuriser les sessions et les permissions.
  - **Nodemailer** : configurer un service pour les notifications par mail (inscriptions, rappels de séances, etc.).
  - **MongoDB** : modèle de données avec collections pour les `users`, `professors`, `parents`, `students`, et `sessions`.

- **Documentation** :
  - [Express.js Guide](https://expressjs.com/en/guide/routing.html)
  - [JWT Basics](https://jwt.io/introduction)
  - [Nodemailer Documentation](https://nodemailer.com/about/)
  - [MongoDB CRUD Operations](https://www.mongodb.com/docs/manual/crud/)

**Étape 2 : Gestion de l'Authentification et des Permissions**

- **JWT** : Mise en œuvre de la logique d’authentification JWT dans les middlewares Express pour protéger les routes.
- **Double authentification** : pour le compte admin, en utilisant une bibliothèque comme `speakeasy` pour les codes TOTP.

- **Documentation** :
  - [Securing APIs with JWT](https://auth0.com/blog/node-js-and-express-tutorial-building-and-securing-restful-apis/)

**Étape 3 : Développement des Dashboards Personnalisés par Rôle**

- **React ou Vue.js** : Créer des composants pour les dashboards de chaque rôle, avec des informations spécifiques.
  - Exemples de composants : `AdminDashboard`, `RecruiterDashboard`, `ParentDashboard`, `StudentDashboard`, `TeacherDashboard`.

- **Conditions de Rôle** : Implémenter des redirections selon le rôle de l’utilisateur après la connexion.

- **Documentation** :
  - [React Conditional Rendering](https://react.dev/learn/conditional-rendering)
  - [Vue.js Role-Based Authentication](https://www.vuemastery.com/blog/role-based-authentication-vue/)

**Étape 4 : Gestion des Cours et des Créneaux**

- **Gestion des Créneaux Professeur** : Création de formulaires pour que le professeur sélectionne ses créneaux, avec vérification des conflits et visibilité selon les niveaux.
- **Attribution des élèves** : Algorithme pour attribuer automatiquement les élèves aux créneaux en fonction de la disponibilité des professeurs.
- **MongoDB** : Structure des documents pour `sessions` et `appointments`.

- **Documentation** :
  - [MongoDB Aggregation](https://www.mongodb.com/docs/manual/aggregation/)
  - [Express & MongoDB Relations](https://www.digitalocean.com/community/tutorials/relationship-in-mongodb)

**Étape 5 : Intégration des Paiements avec Stripe**

- **Stripe** : Configuration des abonnements et intégration des paiements pour les comptes parents lors de la souscription d'un forfait pour les enfants.
- **Webhook Stripe** : Création d’un webhook pour mettre à jour le statut des paiements dans la base de données.

- **Documentation** :
  - [Stripe Checkout](https://stripe.com/docs/checkout)
  - [Webhook Stripe Integration](https://stripe.com/docs/webhooks)

**Étape 6 : Frontend Design et Accessibilité**

- **UI/UX** : Utilisation de Tailwind CSS et composants avec des formes géométriques et abstraites pour un rendu visuel moderne.
- **Formulaires et Expérience Utilisateur** : Créer des formulaires clairs pour chaque action utilisateur (création de comptes, réservation de créneaux, etc.).
- **Page d’accueil et tutoriel** : Création de la page d’accueil avec une `hero section` et tutoriel expliquant le fonctionnement.

- **Documentation** :
  - [Tailwind CSS Guide](https://tailwindcss.com/docs)
  - [React UI Libraries Comparison](https://blog.logrocket.com/5-best-react-component-libraries-for-2022/)

---

### 4. **Liaison Frontend et Backend**

- **API REST avec Axios** : Utilisation d'Axios pour gérer les requêtes vers le backend depuis le frontend.
- **Context API (React)** ou **Vuex (Vue)** : Pour gérer l'état global de l'application (ex. : utilisateur connecté, rôle, statut de réservation).
- **Sockets (si besoin)** : Utilisation de WebSocket (ex. : Socket.io) pour les notifications en temps réel si des mises à jour fréquentes sont nécessaires (par exemple, lors de modifications de créneaux).

- **Documentation** :
  - [Using Axios with React](https://axios-http.com/docs/intro)
  - [Vuex Documentation](https://vuex.vuejs.org/)

---

### 5. **Orchestration et Déploiement**

- **Makefile** : Créer un fichier `Makefile` pour faciliter les commandes de démarrage (`make start`), de test (`make test`), et de déploiement (`make deploy`).
- **Docker (facultatif)** : Conteneuriser l'application pour faciliter le déploiement sur des plateformes comme AWS ou DigitalOcean.

- **Documentation** :
  - [Makefile Basics](https://www.gnu.org/software/make/manual/make.html)
  - [Docker for Beginners](https://docs.docker.com/get-started/)

---

### BROUILLON


## Plateforme de cours en ligne avec comptes utilisateurs avec des rôles

Plusieurs gestions :
  - Gestion des données avec bases de données (MongoDB)
  - Gestion des comptes utilisateurs (création, suppression de comptes)
  - Gestion du frontend (HTML,CSS,JavaScript)
  - Gestion du backend (Node.js, Node.mailer, JWT, Express)
  - Liaison frontend backend et bases de données (je ne sais pas, fais moi une proposition)
  - Un makefile pour orchestrer le tout

Chaque utilisateur doit a son espace personnels selon son rôle et ses données.

Il n'y a qu'un seul compte **administrateur**: 
  Celui ci a une vision claire du chiffre d'affaire, du nombre de comptes et leurs roles, les cours, les lecons etc...
  Il peut creer et supprimer des comptes comme il le veut.
  - Le compte administrateur a un login, une adresse mail, un mot de passe, et double authentification.

Il y a le compte **recruteur**:

  Sa seule fonctionnalité est de creer des comptes professeur. 
  Il créer des comptes professeurs en rentrant leurs nom, leurs prénom, leurs mail, toutes les classes auquel ce professeur peut enseigner et leurs rib.
  Il peut aussi supprimer le compte professeur.
  - Le compte recruteur a une adresse mail (qui est son login), un mot de passe.

Il y a le compte **parent**: 
  - Un compte parent a une adresse mail, et un mot de passe mais renseigne aussi son nom et prénom. 
  => Dans son dashboard personnalisé (avec ses informations), le compte parent peut souscrire des abonnements pour ses enfants. 
  Pour chaque abonnement il créer un compte élève et souscrit un forfait payant (le paiement se fera par intégration stripe)
  Une fois les comptes créer il peut suivre les comptes élève de ses enfants en voyant les séances réalisées, les séances à venir, 
  les comptes rendu des séances, les devoirs à faire, faits et en retard.

Il y a le compte **élève**:
  - crée par un utilisateur du compte parent. Celui ci a un login qui est un pseudo, un nom, un prénom, une adresse mail qui n'est pas 
  obligatoire mais lui servira à recevoir les informations. 

Il y a le compte **professeur**:
C'est le compte recruteur qui va créer le compte professeur. Pour ce faire, il demande le nom, l'adresse  mail du professeur ainsi que les classes qu'il peut prendre. 
Lorsque le professeur se connecte il a la possibilité de créer des créneaux. Lorsque le professeur valide son créneau il est disponible pour les parents. 

Les professeurs prennent certaines classes (exemple de la 6e jusqu'à la 3e), lorsqu'ils creent leurs crénaux, ces créneaux sont visibles pour les parents au moment où ils créent les comptes de leurs enfants.
Admettons que deux professeurs A et B prennent tous les deux les eleves de collèges. 
Le professeur A a reservé des creneaux de lundi à mercredi de 16h à 20h, et le professeur B a réservé des créneaux de mercredi à vendredi de 17h à 19h. 

Un certain parent C veut souscrire un forfait pour son enfant en 4e, il va donc créer un compte élève pour son enfant. 
Lorsque le parent C crée le compte de son enfant il choisi un forfait et doit reserver des créneaux. Comme il y a deux enseignants qui prennent des collégiens 
sur la plateforme le parent voit les crénaux ci dessous :
- lundi à mercredi de 16h à 20h, 
- jeudi à vendredi de 17h à 19h. 

S'il choisi le créneau lundi de 18h à 20h alors l'élève sera automatiquement attritubué au professeur A. 
Celui ci a le droit de cloturer son crénaux ou le laisser ouvert. Dorenavant, le crénaux de 18h à 20h du professeur A ne sera visible 
qu'aupres des parents d'élève de 4e, car on ne mélange pas les classes. Le professeur A a le droit de laisser son créneau ouvert pour les eleves de 4e sinon il peut le fermer
et le crénau ne sera plus visible. Tant que son groupe n'aura pas atteint le nombre maximum de 4 élèves il pourra le rouvrir. Il peut aussi séparer les membres de son groupe en plusieurs groupes.

Si le parent aurait choisit un créneau vendredi de 17h à 19h alors on applique la même politique au professeur B.

Maintenant, si le parent aurait choisi le créneau de mercredi soir de 17h à 19h. Là, les deux professeurs sont disponibles. 
Comment on attribue l'eleve ? On choisit le professeur qui a le moins d'eleves.

La premiere page contient la hero section qui doit contenir le nom de la platforme, un sous titre qui sera :
 "Soutien scolaire en ligne en mathématiques et informatique adapté à chaque élève du collège au lycée. "
 Un bouton de connexion et quand on dépasse la hero section on tombe sur un tutoriel qui explique le principe ( à coder à la fin)
 Lorsqu'on clique sur le bouton de connexion on arrive sur une page de login qui demande notre role: 
 parent, prof, eleve, autre (dans autre ce sera le compte recruteur et l'admin)
 puis on se connecte en utilisant les bases de données, (api si besoin) et JWT.
 Une fois qu'on est connecté on est directement rediriger vers notre espace personnel selon notre role et nos données.

 Le site doit etre vraiment joli, moderne, rond, avec des formes geometriques et abstraites.



