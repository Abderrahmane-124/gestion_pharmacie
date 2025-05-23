# Guide de Déploiement - Application de Gestion de Pharmacie

Ce document décrit le processus de déploiement de l'application de gestion de pharmacie.

## Prérequis

- Un compte GitHub
- Un compte Docker Hub
- Un serveur de staging/production avec Docker et Docker Compose installés
- Accès SSH au serveur de déploiement

## Configuration des Secrets GitHub

Avant de déployer, vous devez configurer les secrets suivants dans votre repository GitHub (Settings > Secrets and variables > Actions) :

- `DOCKER_USERNAME`: Votre nom d'utilisateur Docker Hub
- `DOCKER_PASSWORD`: Votre mot de passe Docker Hub
- `SSH_PRIVATE_KEY`: La clé privée SSH pour accéder au serveur de déploiement
- `STAGING_HOST`: L'adresse du serveur de staging (ex: user@staging.example.com)
- `DB_USERNAME`: Nom d'utilisateur de la base de données
- `DB_PASSWORD`: Mot de passe de la base de données

## Processus de Déploiement

Le déploiement est entièrement automatisé via GitHub Actions. Voici comment cela fonctionne :

1. À chaque push sur la branche `main`, le workflow de déploiement se déclenche automatiquement
2. Le workflow :
   - Build le backend Spring Boot
   - Build le frontend React
   - Crée et pousse les images Docker
   - Déploie l'application sur le serveur de staging

## Accès à l'Application

### Environnement de Staging

- Frontend: http://staging.example.com
- Backend API: http://staging.example.com:8080
- Swagger UI: http://staging.example.com:8080/swagger-ui.html

### Environnement de Production

- Frontend: http://pharmacy.example.com
- Backend API: http://pharmacy.example.com:8080
- Swagger UI: http://pharmacy.example.com:8080/swagger-ui.html

## Déploiement Manuel

Si nécessaire, vous pouvez déployer manuellement en suivant ces étapes :

1. Cloner le repository
2. Configurer les variables d'environnement dans un fichier `.env`
3. Exécuter :
   ```bash
   docker-compose up -d
   ```

## Monitoring et Logs

- Les logs des conteneurs sont accessibles via :
  ```bash
  docker-compose logs -f [service_name]
  ```
- Les métriques sont disponibles via Prometheus sur le port 9090
- Les logs sont centralisés via ELK Stack

## Rollback

En cas de problème, vous pouvez revenir à une version précédente :

1. Identifier le SHA du commit précédent
2. Modifier le fichier docker-compose.yml pour utiliser les images correspondantes
3. Redéployer avec :
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

## Support

Pour toute question concernant le déploiement, veuillez contacter l'équipe DevOps. 