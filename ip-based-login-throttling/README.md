# 🛡️ IP-Based Login Throttling

![License: Custom - Educational Use Only](https://img.shields.io/badge/license-educational--only-blue)

## Description

Ce module fournit une classe TypeScript permettant de limiter les tentatives de connexion échouées par adresse IP.  
Il vise à atténuer les attaques de force brute en bloquant temporairement les IP après un certain nombre d'échecs successifs.

## Fonctionnalités

- ✅ Suivi des tentatives échouées par IP
- 🚫 Blocage temporaire après un seuil configurable
- 🔄 Réinitialisation automatique du compteur après un délai défini ou après une connexion réussie

## Prérequis techniques

Ce service repose sur un **stockage persistant**, via l'ORM compatible TypeORM et d’un dépôt `Repository<FailedLoginAttempt>`.
Il suppose que le repository soit injecté à un module et en dépendance d'une factory de configuration.

## Configuration

Ce service est conçu pour être injecté via une **injection de dépendances**, avec une **factory provider** permettant d’injecter dynamiquement les paramètres suivants :

- `blockDuration` *(secondes)* : durée du blocage d’une IP
- `maxFailedAttempts` : nombre d’échecs autorisés avant blocage
- `resetFailedAttemptsTime` *(secondes)* : délai avant réinitialisation du compteur

> Des valeurs par défaut sont recommandées pour une application de taille moyenne avec un niveau de sécurité standard.

## Utilisation

Le service s’appuie sur un stockage persistant, via un dépôt de type Repository<FailedLoginAttempt>.
Il peut être intégré dans une logique d’authentification côté serveur (ex. : middleware Express, service NestJS, etc.).

## Évolutions prévues

- ✅ Nettoyage périodique
- 🔧 Ajout de tests unitaires (ex. : Jest)

## Auteur

Développé par **Tim**, développeur web indépendant.  
Ce code est publié à des fins **pédagogiques** et **exemplaires uniquement**.

