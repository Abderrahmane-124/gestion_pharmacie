# 💊 Application de Gestion Pharmaceutique

Une application web complète permettant la gestion des médicaments, des ventes et des commandes entre **pharmaciens** et **fournisseurs**.

---

## 🚀 Fonctionnalités Principales

### 🔐 Authentification & Autorisation
- Inscription / Connexion pour pharmaciens et fournisseurs
- Gestion des rôles et des permissions
- Protection des routes sensibles

### 👨‍⚕️ Espace Pharmacien
- Tableau de bord personnalisé
- Gestion du stock de médicaments (CRUD)
- Suivi des ventes et passation de commandes
- Visualisation de statistiques
- Historique des transactions

### 🏭 Espace Fournisseur
- Gestion du catalogue de produits
- Traitement et gestion des commandes reçues
- Système d'alertes (commandes, ruptures, etc.)
- Statistiques des ventes

### 🛒 Fonctionnalités Communes
- Panier d'achat intelligent (limité à un seul fournisseur par commande)
- Système de notifications
- Historique des commandes
- Interface responsive et moderne

---

## 🧰 Stack Technique

### 🖥 Frontend
- **React 18** avec **TypeScript**
- **React Router 6** pour la navigation
- **Context API** pour la gestion d'état globale
- **Axios** pour les appels API
- **CSS** pour le style de l'interface

### 🖥 Backend
- **Springboot** 
- Authentification avec **JWT**
- Architecture **RESTful**

### 🗄 Base de Données
- **Postgrasql**

---

## 🛠 Prérequis

- [Node.js](https://nodejs.org/) (v14 ou supérieur)
- [Postgresql](https://www.postgresql.com/)
- `npm` ou `yarn`

---

## ⚙️ Installation et Démarrage

### 1. Cloner le projet

```bash
git clone https://github.com/Abderrahmane-124/gestion_pharmacie.git
cd gestion_pharmacie
```

---

### 2. Lancer le Frontend (Terminal 1)

```bash
cd frontend
npm install
npm run dev
```

---

### 3. Lancer le Backend

```bash
cd backend
mvn spring-boot:run
```


---



## 👨‍🎓 Membres du groupe

- **El Badouri Abderrahmane**
- **Ait Abderrahmane Hind**
- **El Mendili Ayman Youssef**
- **Elmourabite Asma**
- **Ouquelli Yassmine**



