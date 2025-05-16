# 🛡️ IP-Based Login Throttling

![License: Custom - Educational Use Only](https://img.shields.io/badge/license-educational--only-blue)

## Description

Ce module fournit une classe TypeScript pour limiter les tentatives de connexion échouées par adresse IP.  
Il vise à atténuer les attaques de force brute en bloquant temporairement les IP après un certain nombre d'échecs.

## Fonctionnalités

- Suivi des tentatives échouées par IP.
- Blocage temporaire après un seuil configurable.
- Réinitialisation automatique du compteur après un délai défini.

## Configuration

Ce service est conçu pour être utilisé via **injection de dépendance**, avec une **factory** permettant d’injecter dynamiquement les paramètres suivants :

- `blockDuration` *(secondes)* : durée de blocage.
- `maxFailedAttempts` : seuil d’échecs autorisés.
- `resetFailedAttemptsTime` *(secondes)* : délai de réinitialisation du compteur.

> Les valeurs par défaut recommandées sont adaptées à une application de taille moyenne avec un niveau de sécurité standard.

## Utilisation

Le service utilise un stockage en mémoire sans persistance entre les redémarrages.  
Il peut être intégré dans une logique d’authentification serveur ou framework (ex. NestJS).

## À venir

- Tests unitaires (ex. : avec Jest).
- Possibles extensions dans ce dépôt : autres modules liés à la sécurité.

## Auteur

Développé par **Tim**, développeur web indépendant.  
Ce code est mis à disposition à titre d'exemple.
