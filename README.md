# CIRForum - Plateforme de Discussion Web

Forum de discussion interactif avec authentification OAuth2, gestion de sujets et réponses, chat en temps réel via WebSocket. **Projet final Communication Web CIR2 - ISEN Ouest.**

## Fonctionnalités

- **Authentification OAuth2** : Connexion sécurisée avec tokens Bearer
- **Forum collaboratif** : Création, modification et suppression de sujets
- **Système de réponses** : Discussion par sujet avec gestion complète des réponses
- **Chat global en temps réel** : Communication instantanée via WebSocket
- **Interface responsive** : Design Bootstrap pour tous les écrans


## Prérequis 

- **PHP 7.4+** avec extension PDO MySQL
- **MySQL/MariaDB 5.7+** ou compatible
- **Python 3.8+** avec `websockets` (`pip install websockets`)
- **Navigateur moderne** (Chrome, Firefox, Safari, Edge)


## 📚 Structure du projet

```
comweb_project/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── chat.js
├── php/
│   ├── request.php
│   ├── db.php
│   └── constantes.php
├── init_db.sql
└── CIRChatServer.py
```
