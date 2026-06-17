# Qantara (قنطرة) — Documentation Technique Complète

## 1. Introduction

**Qantara** est une plateforme web d'annuaire de services professionnels algériens. Elle connecte les clients avec des prestataires vérifiés dans trois catégories : **Médecins**, **Tech & Programmation**, et **Traducteurs**.

### Caractéristiques principales
- Annuaire public accessible sans authentification
- Vérification des certificats par intelligence artificielle (Gemini)
- Authentification par email avec code à 6 chiffres
- Interface trilingue (Français, Anglais, Arabe avec RTL)
- Recherche insensible aux accents
- Système de notation et d'avis
- Gestion de comptes (suppression douce, bannissement)

---

## 2. Stack Technique

| Couche | Technologie | Version |
|--------|-------------|---------|
| Frontend | Next.js (App Router) | 16.2.0 |
| UI Components | shadcn/ui + Radix UI | - |
| Langage | TypeScript | 5.7.3 |
| Base de données | PostgreSQL (Neon) | - |
| ORM | Prisma | 7.7.0 |
| Authentification | JWT (jose) + bcryptjs | - |
| Email | Nodemailer (Gmail SMTP) | 8.0.7 |
| IA | Google Gemini 2.5 Flash | - |
| Hébergement | Vercel | - |
| Analytics | Vercel Analytics | 1.6.1 (avec tracking d'événements personnalisés) |

---

## 3. Architecture du Projet

```
qantara/
├── app/                          # Routes Next.js (App Router)
│   ├── page.tsx                  # Page d'accueil — Annuaire public
│   ├── layout.tsx                # Layout racine (ThemeProvider, AuthProvider, LanguageProvider)
│   ├── login/                    # Page de connexion
│   ├── signup/                   # Page d'inscription multi-étapes
│   ├── api/                      # Routes API backend
│   │   ├── auth/
│   │   │   ├── signup/           # POST — Créer un compte + envoi code 6 chiffres
│   │   │   ├── verify/           # POST — Vérifier le code email
│   │   │   ├── login/            # POST — Authentification + JWT cookie
│   │   │   ├── logout/           # POST — Supprimer le cookie
│   │   │   └── me/               # GET  — Session utilisateur depuis JWT
│   │   ├── providers/            # GET  — Liste des prestataires vérifiés
│   │   │   └── [id]/             # GET  — Détails d'un prestataire
│   │   ├── provider/
│   │   │   └── complete-profile/ # POST — Compléter le profil prestataire
│   │   ├── verify-certificate/   # POST — Vérification IA du certificat
│   │   ├── reviews/              # GET/POST — Avis clients
│   │   ├── services/             # GET  — Liste des services
│   │   ├── account/              # DELETE/PUT — Gestion du compte
│   │   ├── admin/                # Routes d'administration
│   │   │   ├── login/            # POST — Authentification Admin via admin_token cookie
│   │   │   ├── data/             # GET/POST/DELETE — Gérer les données (clients, prestataires, avis) et ban status
│   │   │   ├── authority-registry/ # GET/POST/DELETE — Gérer les certificats pré-approuvés
│   │   │   ├── pending-verifications/ # GET — Récupérer les prestataires en attente de vérification
│   │   │   ├── verify-action/    # POST — Approuver ou rejeter le certificat d'un prestataire
│   │   │   └── ban/              # POST — Bannir définitivement un utilisateur par son ID
│   │   └── chat/                 # POST — Assistant de chat IA avec contexte des prestataires
│   ├── consumer/                 # Pages client authentifié
│   │   ├── search/               # Recherche avancée avec tri
│   │   ├── provider-details/[id] # Détails prestataire + avis
│   │   ├── favorites/            # Prestataires sauvegardés
│   │   ├── notifications/        # Notifications
│   │   ├── profile/              # Profil client
│   │   └── settings/             # Paramètres
│   └── provider/                 # Pages prestataire authentifié
│       ├── profile/              # Profil + vérification + wizard
│       ├── dashboard/            # Tableau de bord
│       ├── services/             # Gestion des services
│       ├── notifications/        # Notifications
│       └── settings/             # Paramètres
├── components/
│   ├── marketplace/              # Composants métier (AppLogo, ProviderCard, etc.)
│   └── ui/                       # Composants shadcn/ui (Button, Input, Dialog, etc.)
├── contexts/
│   ├── auth-context.tsx          # Contexte d'authentification React
│   └── language-context.tsx      # Contexte i18n (EN/FR/AR) avec 540+ traductions
├── lib/
│   ├── prisma.ts                 # Instance PrismaClient avec adaptateur Neon
│   ├── email.ts                  # Envoi d'emails via Nodemailer
│   ├── admin-auth.ts             # Validation JWT pour l'authentification Admin
│   ├── analytics.ts              # Fonctions de suivi Vercel Analytics pour les événements personnalisés
│   ├── constants.ts              # Catégories et interfaces TypeScript
│   └── utils.ts                  # Utilitaire cn() pour classNames
├── prisma/
│   └── schema.prisma             # Schéma de base de données
└── public/
    └── providers/                # Photos de profil des prestataires
```

---

## 4. Schéma de Base de Données

### 4.1 Modèle `Client`
| Champ | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Clé primaire |
| email | String (unique) | Email du client |
| name | String? | Nom complet |
| password | String? | Mot de passe hashé (bcrypt) |
| phoneNumber | String? (unique) | Numéro de téléphone |
| emailVerified | Boolean | Email vérifié (défaut: false) |
| createdAt | DateTime | Date de création |
| updatedAt | DateTime | Date de mise à jour |
| deletedAt | DateTime? | Date de suppression douce |
| isBanned | Boolean | Compte banni (défaut: false) |

### 4.2 Modèle `Provider`
| Champ | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Clé primaire |
| email | String (unique) | Email du prestataire |
| name | String? | Nom complet |
| password | String? | Mot de passe hashé |
| phoneNumber | String? (unique) | Téléphone (caché aux non-authentifiés) |
| emailVerified | Boolean | Email vérifié |
| createdAt | DateTime | Date de création |
| updatedAt | DateTime | Date de mise à jour |
| deletedAt | DateTime? | Date de suppression douce |
| isBanned | Boolean | Compte banni (défaut: false) |
| certificateStatus | String? | Statut ("VALID", "INVALID", "PENDING") |
| certificateMessage | String? | Message de l'IA ou de l'Admin |
| certificateIdHash | String? | Hash bcrypt du N° de certificat |
| extractedFullName | String? | Nom extrait par l'IA |
| extractedDate | String? | Date extraite par l'IA |
| verifiedName | String? | Nom vérifié par l'IDV (Didit) ou ID de session en review |
| idCardImage | String? | Image de la carte d'identité |
| selfieImage | String? | Selfie du prestataire |
| certificateImage | String? | Image du certificat/diplôme général |
| certificateId | String? | Numéro ou identifiant du certificat |
| verificationSubmittedAt | DateTime? | Date de soumission de la vérification |
| aiFaceMatch | Boolean? | Résultat de comparaison de visage par IA |
| aiNameMatch | Boolean? | Résultat de comparaison de nom par IA |
| aiAnalysisMessage | String? | Détails de l'analyse IA de vérification |
| professionalCategoryId | String? | FK vers ProfessionalCategory |
| regulatoryBodyId | String? | FK vers RegulatoryBody (Professions Libérales) |
| licenseNumber | String? | Numéro d'inscription au tableau / ordre |
| licenseDocumentUrl | String? | URL du certificat/carte de licence professionnelle |
| licenseVerifiedAt | DateTime? | Date de vérification de la licence |
| licenseStatus | String | Statut de licence ("PENDING", "VERIFIED", "REJECTED", "EXPIRED") |
| licenseVerifiedBy | String? | Agent de vérification ("GEMINI", "MANUAL", "API") |
| licenseRejectionReason | String? | Motif si la licence est rejetée |
| tradeId | String? | FK vers Trade (Artisans) |
| cnamCardNumber | String? | Numéro de Carte d'Artisan CNAM |
| cnamCardDocumentUrl | String? | URL de la carte CNAM uploadée |
| cnamCardVerifiedAt | DateTime? | Date de validation de la carte CNAM |
| cnamCardStatus | String | Statut de la carte CNAM ("PENDING", "VERIFIED", etc.) |
| cnamCardVerifiedBy | String? | Validateur de la carte CNAM |
| cnamCardRejectionReason | String? | Motif si rejeté |
| autoEntrepreneurActivityId | String? | FK vers AutoEntrepreneurActivity |
| anaeCardNumber | String? | Numéro de Carte d'Auto-Entrepreneur ANAE |
| anaeCardDocumentUrl | String? | URL de la carte ANAE uploadée |
| anaeCardVerifiedAt | DateTime? | Date de validation de la carte ANAE |
| anaeCardStatus | String | Statut de la carte ANAE ("PENDING", "VERIFIED", etc.) |
| anaeCardVerifiedBy | String? | Validateur de la carte ANAE |
| anaeCardRejectionReason | String? | Motif si rejeté |
| title | String? | Titre professionnel |
| category | String? | Catégorie(s) : doctors, programmer, translator |
| bio | String? | Biographie |
| profileImage | String? | URL de la photo de profil |
| portfolio | String? | Images du portfolio |
| rating | Float | Note moyenne (défaut: 0) |
| reviewCount | Int | Nombre d'avis (défaut: 0) |
| isProfileComplete | Boolean | Profil complété (défaut: false) |

### 4.3 Modèle `Service`
| Champ | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Clé primaire |
| name | String | Nom du service |
| description | String? | Description du service |
| price | Float? | Prix en DZD |
| duration | Int? | Durée en minutes |
| category | String? | Catégorie |
| createdAt | DateTime | Date de création |
| updatedAt | DateTime | Date de mise à jour |
| providerId | String (FK) | Référence vers Provider |
| rating | Float | Note moyenne du service |
| reviewCount | Int | Nombre d'avis du service |

### 4.4 Modèle `Review`
| Champ | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Clé primaire |
| rating | Int | Note de 1 à 5 |
| comment | String | Commentaire |
| createdAt | DateTime | Date de création |
| clientId | String (FK) | Référence vers Client |
| serviceId | String (FK) | Référence vers Service |

### 4.5 Modèle `VerificationToken`
| Champ | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Clé primaire |
| email | String | Email associé |
| token | String (unique) | Code à 6 chiffres |
| expiresAt | DateTime | Expiration (15 minutes) |

### 4.6 Modèle `BannedEmail`
| Champ | Type | Description |
|-------|------|-------------|
| email | String | Clé primaire — Email banni définitivement |
| reason | String? | Raison du bannissement |
| bannedAt | DateTime | Date du bannissement |

### 4.7 Modèle `Admin`
| Champ | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Clé primaire |
| email | String (unique) | Email de l'administrateur |
| password | String | Mot de passe hashé (bcrypt) |
| name | String? | Nom ou pseudo de l'administrateur |
| createdAt | DateTime | Date de création du compte |

### 4.8 Modèle `AuthorityCertificate`
| Champ | Type | Description |
|-------|------|-------------|
| id | String (CUID) | Clé primaire |
| certId | String (unique) | Identifiant unique officiel du certificat pré-approuvé |
| holderName | String | Nom du titulaire légitime |
| receivedDate | DateTime | Date de réception officielle |
| category | String | Catégorie ("doctors" \| "programmer" \| "translator") |
| createdAt | DateTime | Date d'ajout au registre |

---

## 5. API — Documentation des Endpoints

### 5.1 Authentification

#### `POST /api/auth/signup`
Crée un compte client ou prestataire et envoie un code de vérification par email.

**Body :**
```json
{ "name": "Karim", "email": "karim@mail.com", "password": "monMotDePasse", "role": "PROVIDER" }
```

**Réponses :**
- `201` — Compte créé, email envoyé
- `400` — Champs manquants ou email déjà existant
- `403` — Email banni

**Logique interne :**
1. Vérifie si l'email est dans `BannedEmail`
2. Vérifie si un utilisateur existe déjà pour ce rôle
3. Hash le mot de passe avec bcrypt (10 rounds)
4. Crée l'utilisateur dans la table appropriée
5. Génère un code à 6 chiffres aléatoire
6. Stocke le code dans `VerificationToken` (expire en 15 min)
7. Envoie le code par email via Gmail SMTP

---

#### `POST /api/auth/verify`
Vérifie le code à 6 chiffres et active le compte.

**Body :**
```json
{ "token": "847293" }
```

**Réponses :**
- `200` — Email vérifié
- `400` — Code invalide ou expiré

---

#### `POST /api/auth/login`
Authentifie un utilisateur et retourne un JWT dans un cookie HTTP-only.

**Body :**
```json
{ "email": "karim@mail.com", "password": "monMotDePasse", "role": "PROVIDER" }
```

**Réponses :**
- `200` — Connexion réussie + cookie `auth_token`
- `401` — Identifiants invalides
- `403` — Compte banni ou supprimé définitivement

**Logique interne :**
1. Recherche l'utilisateur par email + rôle
2. Compare le mot de passe avec bcrypt
3. Vérifie le bannissement
4. Gère la suppression douce (restauration si < 30 jours)
5. Signe un JWT avec jose (expiration 30 jours)
6. Stocke le JWT dans un cookie HTTP-only, Secure, SameSite=lax

---

#### `GET /api/auth/me`
Retourne l'utilisateur courant depuis le cookie JWT.

#### `POST /api/auth/logout`
Supprime le cookie d'authentification.

---

### 5.2 Prestataires

#### `GET /api/providers`
Liste tous les prestataires vérifiés et visibles.

**Filtres (query params) :**
- `category` — Filtrer par catégorie
- `search` — Recherche par nom ou titre

**Conditions de visibilité :**
- `certificateStatus = "VALID"`
- `isProfileComplete = true`
- `deletedAt = null`
- `isBanned = false`

---

#### `GET /api/providers/[id]`
Retourne les détails complets d'un prestataire (profil, services, infos de contact).

> **Note :** Le numéro de téléphone est inclus dans la réponse API mais le frontend le masque pour les utilisateurs non authentifiés.

---

#### `POST /api/provider/complete-profile`
Sauvegarde les données du wizard de complétion de profil.

**Body :**
```json
{
  "userId": "cuid...",
  "bio": "Mon expérience...",
  "profilePhoto": "https://...",
  "servicesOffered": [{ "name": "Consultation", "price": 2000, "duration": "30 min" }],
  "portfolio": ["https://img1.jpg"],
  "category": "doctors"
}
```

---

### 5.3 Vérification de Certificat

#### `POST /api/verify-certificate`
Upload d'une image de certificat pour analyse par l'IA Gemini.

**Body :** `FormData` avec `file` (image) et `userId`

**Logique :**
1. Convertit l'image en base64
2. Envoie à l'API Gemini 2.5 Flash avec un prompt structuré
3. L'IA retourne : `is_valid`, `message`, `FULL_NAME`, `DATE`, `ID`
4. Le N° d'identification est hashé avec bcrypt
5. Met à jour le `Provider` dans la base de données

---

### 5.4 Avis

#### `GET /api/reviews?providerId=xxx`
Récupère tous les avis d'un prestataire.

#### `POST /api/reviews`
Soumet un avis et recalcule automatiquement les moyennes.

**Body :**
```json
{ "clientId": "...", "serviceId": "...", "rating": 5, "comment": "Excellent service" }
```

**Après création :**
1. Recalcule la moyenne et le nombre d'avis du **service**
2. Recalcule la moyenne et le nombre d'avis du **prestataire**

---

### 5.5 Gestion de Compte

#### `DELETE /api/account`
Suppression douce (soft-delete) — met `deletedAt` à la date courante. Le compte peut être restauré en se reconnectant dans les 30 jours.

#### `PUT /api/account`
Mise à jour de l'email ou du mot de passe.

---

### 5.6 Assistant de Chat IA

#### `POST /api/chat`
Endpoint de chat conversationnel interactif pour aider à trouver un prestataire de services.

**Body :**
```json
{
  "message": "J'ai besoin d'un médecin sur Alger",
  "history": [
    { "role": "user", "content": "Bonjour" },
    { "role": "model", "content": "Bonjour, comment puis-je vous aider ?" }
  ],
  "locale": "fr"
}
```

**Réponses :**
- `200` — `{ "reply": "Voici les prestataires recommandés..." }`
- `400` — Message manquant ou vide
- `500` — Clé API Gemini non configurée ou erreur du service IA

**Logique interne :**
1. Récupère tous les prestataires actifs, dont le certificat est vérifié (`VALID`), le profil complété, non banni et non supprimé.
2. Formate la liste des prestataires disponibles comme contexte textuel.
3. Construit l'historique conversationnel formaté pour l'API Gemini.
4. Envoie le tout à l'API **Google Gemini 2.5 Flash** avec un prompt système forçant la réponse dans la langue ciblée (`locale`) et demandant d'inclure des liens sous la forme `[Nom du Prestataire:id]`.

---

### 5.7 Administration

#### `POST /api/admin/login`
Authentifie un administrateur et génère un cookie JWT `admin_token` (HTTP-only, valide 7 jours).

**Body :**
```json
{ "email": "admin@qantara.dz", "password": "motDePasseAdmin" }
```

**Réponses :**
- `200` — `{ "success": true, "user": { "id": "...", "name": "...", "email": "...", "role": "admin" } }`
- `400` — Paramètres manquants
- `401` — Identifiants administrateur incorrects
- `500` — Erreur interne

---

#### `GET /api/admin/data`
Récupère les listes complètes des ressources ou des statistiques globales pour le tableau de bord d'administration (requiert authentification admin).

**Query Params :**
- `type` — Optionnel : `providers` | `clients` | `services` | `reviews`. Si omis, renvoie les statistiques globales.

**Réponses :**
- `200` (avec type) — `{ "data": [...] }` (liste ordonnée par date de création décroissante)
- `200` (sans type) — `{ "stats": { "providers": 12, "clients": 45, "services": 8, "reviews": 15, "pendingVerifications": 2 } }`
- `401` — Non autorisé
- `500` — Erreur interne

---

#### `POST /api/admin/data`
Permet de bannir ou débannir un utilisateur client ou prestataire (requiert authentification admin).

**Body :**
```json
{
  "type": "provider", // ou "client"
  "id": "cuid...",
  "action": "toggle-ban"
}
```

**Réponses :**
- `200` — `{ "success": true, "message": "..." }`
- `400` — Paramètres invalides ou manquants
- `401` — Non autorisé
- `404` — Utilisateur introuvable
- `500` — Erreur interne

**Logique interne :**
1. Inverse la propriété `isBanned` de l'utilisateur.
2. Si banni (`isBanned: true`), ajoute l'email à la table `BannedEmail` pour empêcher toute réinscription ou connexion future.
3. Si débanni, supprime l'email de la table `BannedEmail`.

---

#### `DELETE /api/admin/data`
Supprime définitivement (hard delete) une ressource de la base de données (requiert authentification admin).

**Query Params :**
- `type` — `provider` | `client` | `service` | `review`
- `id` — L'identifiant de la ressource

**Réponses :**
- `200` — `{ "success": true, "message": "..." }`
- `400` — Paramètres manquants ou type invalide
- `401` — Non autorisé
- `500` — Erreur interne

---

#### `GET /api/admin/authority-registry`
Récupère tous les certificats d'autorité pré-approuvés enregistrés, triés par catégorie puis par nom (requiert authentification admin).

---

#### `POST /api/admin/authority-registry`
Ajoute une attestation ou un certificat pré-approuvé au registre de l'autorité (requiert authentification admin).

**Body :**
```json
{
  "certId": "MED-12345",
  "holderName": "Karim Benali",
  "receivedDate": "2026-01-15",
  "category": "doctors"
}
```

**Réponses :**
- `201` — `{ "success": true, "certificate": { ... } }`
- `400` — Paramètres manquants ou identifiant de certificat existant déjà
- `401` — Non autorisé

---

#### `DELETE /api/admin/authority-registry`
Retire un certificat d'autorité du registre officiel (requiert authentification admin).

**Query Params :**
- `id` — Identifiant unique du certificat d'autorité (CUID)

---

#### `GET /api/admin/pending-verifications`
Liste tous les prestataires en attente de validation (`certificateStatus: "PENDING"`), triés par date de soumission croissante.

Chaque prestataire renvoyé inclut l'objet `matchedAuthorityCertificate` s'il existe un certificat pré-approuvé portant le même `certId` que le `certificateId` soumis par le prestataire.

---

#### `POST /api/admin/verify-action`
Approuve ou rejette manuellement le certificat ou l'identité d'un prestataire (requiert authentification admin).

**Body :**
```json
{
  "providerId": "cuid...",
  "action": "approve", // ou "reject"
  "message": "Raison éventuelle du rejet"
}
```

**Réponses :**
- `200` — `{ "success": true, "message": "..." }`
- `400` — Paramètres incorrects
- `401` — Non autorisé
- `404` — Prestataire non trouvé

---

#### `POST /api/admin/ban`
Permet de bannir de manière permanente un compte utilisateur (requiert authentification admin).

**Body :**
```json
{
  "userId": "cuid...",
  "reason": "Raison du bannissement"
}
```

**Réponses :**
- `200` — `{ "success": true, "message": "Account for ... was banned permanently." }`
- `400` — Paramètres manquants
- `404` — Utilisateur introuvable

---

## 6. Flux Utilisateur

### 6.1 Visiteur Non Authentifié
1. Visite `/` → Voit l'annuaire complet avec recherche et filtres par catégorie
2. Clique sur un prestataire → Voit profil, services, avis
3. **Le numéro de téléphone est masqué** → Bouton "Connectez-vous pour voir les coordonnées"

### 6.2 Inscription Client
1. `/signup` → Sélectionne "Consumer" → Remplit nom, email, mot de passe
2. Code à 6 chiffres envoyé par email
3. Saisie du code directement sur la page d'inscription
4. Redirection vers `/login` après vérification

### 6.3 Inscription Prestataire
1. `/signup` → Sélectionne "Service Provider"
2. **Étape 1 :** Nom, email, mot de passe
3. **Étape 2 :** Titre professionnel, téléphone, bio
4. **Étape 3 :** Service initial (nom + prix)
5. Vérification email par code à 6 chiffres
6. Connexion → Profile en état "pending"
7. Upload du certificat → Analyse IA Gemini
8. Si valide → Wizard de complétion (bio, catégories, services, portfolio)
9. Profil publié dans l'annuaire public

### 6.4 Client Authentifié
- Voit les numéros de téléphone des prestataires
- Peut laisser des avis sur les services
- Accède à ses favoris, notifications, paramètres

### 6.5 Prestataire Authentifié
- Gère son profil (bio, services, portfolio)
- Consulte son tableau de bord
- Modifie ses paramètres (langue, thème, compte)

---

## 7. Internationalisation (i18n)

Le système supporte 3 langues via `contexts/language-context.tsx` :

| Langue | Code | Direction | Nom de l'app |
|--------|------|-----------|-------------|
| English | `en` | LTR | Qantara |
| Français | `fr` | LTR | Qantara |
| العربية | `ar` | RTL | قنطرة |

**Catégories traduites :**

| ID | EN | FR | AR |
|----|----|----|-----|
| doctors | Doctors | Médecins | أطباء |
| programmer | Tech & Programming | Tech & Programmation | تقنية وبرمجة |
| translator | Translator | Traducteur | مترجم |

La langue est stockée dans `localStorage` et appliquée au chargement. Le changement de langue modifie l'attribut `dir` du `<html>` pour le support RTL.

---

## 8. Recherche

La recherche utilise une **normalisation Unicode NFD** pour être insensible aux accents :

```typescript
const normalize = (str: string) =>
  str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
```

Exemples :
- `"medecin"` → correspond à `"Médecin"`
- `"generaliste"` → correspond à `"Généraliste"`
- `"Said"` → correspond à `"Saïd"`

La recherche s'effectue sur : **nom**, **titre**, et **bio** du prestataire.

---

## 9. Sécurité

| Mesure | Détail |
|--------|--------|
| Mots de passe | Hashés avec bcrypt (10 rounds de sel) |
| Sessions | JWT stocké en cookie HTTP-only (inaccessible via JS) |
| N° de certificat | Hashé avec bcrypt avant stockage |
| Téléphone | Masqué côté frontend pour les non-authentifiés |
| Bannissement | Par email — vérifié à l'inscription et à la connexion |
| Suppression douce | Période de grâce de 30 jours avant suppression définitive |
| CORS/SameSite | Cookie SameSite=lax, Secure en production |

---

## 10. Déploiement

### Services externes
| Service | Usage |
|---------|-------|
| **GitHub** | Dépôt `younnesse/Qantara` |
| **Vercel** | Hébergement frontend + API serverless |
| **Neon** | Base de données PostgreSQL managée |
| **Gmail** | SMTP pour les emails de vérification |
| **Google AI** | API Gemini 2.5 Flash pour la vérification des certificats |

### Variables d'environnement
| Variable | Description |
|----------|-------------|
| `QANTARADB_POSTGRES_PRISMA_URL` | URL de connexion Neon PostgreSQL |
| `JWT_SECRET` | Clé secrète pour signer les tokens JWT |
| `GEMINI_API_KEY` | Clé API Google Gemini |
| `EMAIL_USER` | Adresse Gmail pour l'envoi d'emails |
| `EMAIL_APP_PASSWORD` | Mot de passe d'application Gmail |
| `NEXT_PUBLIC_APP_URL` | URL publique de l'application |

### Installation locale
```bash
git clone https://github.com/younnesse/Qantara.git
cd Qantara
npm install
cp .env.example .env    # Configurer les variables
npx prisma generate     # Générer le client Prisma
npm run dev             # Démarrer en mode développement
```

---

## 11. Composants UI

| Composant | Fichier | Rôle |
|-----------|---------|------|
| AppLogo | `components/marketplace/app-logo.tsx` | Logo SVG + nom traduit |
| BottomNav | `components/marketplace/bottom-nav.tsx` | Navigation mobile (Accueil, Recherche, Notifications, Profil) |
| CategoryCard | `components/marketplace/category-card.tsx` | Carte de catégorie avec icône |
| ProviderCard | `components/marketplace/provider-card.tsx` | Carte prestataire (photo, nom, note) |
| ServiceCard | `components/marketplace/service-card.tsx` | Carte service (nom, prix, durée) |
| ReviewCard | `components/marketplace/review-card.tsx` | Carte avis (auteur, note, commentaire) |
| StarRating | `components/marketplace/star-rating.tsx` | Affichage étoiles |
| AlertBanner | `components/marketplace/alert-banner.tsx` | Bannière d'alerte (warning, info) |
| LanguageSwitcher | `components/marketplace/language-switcher.tsx` | Sélecteur de langue |
| ProgressBar | `components/marketplace/progress-bar.tsx` | Barre d'étapes (wizard) |
| SkeletonCard | `components/marketplace/skeleton-card.tsx` | Placeholder de chargement |

---

## 12. Prestataires de Démonstration

| Nom | Catégorie | Spécialité | Ville |
|-----|-----------|------------|-------|
| Dr. Karim Benali | Médecins | Généraliste | Alger |
| Dr. Amina Hadj-Saïd | Médecins | Dermatologue | Alger |
| Dr. Yacine Boumediene | Médecins | Dentiste | Alger |
| Dr. Nadia Mebarki | Médecins | Pédiatre | Alger |
| Sofiane Haddad | Tech & Programmation | Full-Stack | Alger |
| Djamila Boualem | Tech & Programmation | Data & IA | Alger |
| Farid Najar | Tech & Programmation | Mobile | Oran |
| Leila Kaddour | Traducteur | Arabe-Français-Anglais | Alger |
| Meriem Bouzid | Traducteur | Français-Anglais | Oran |
| Tarek Boulahia | Traducteur | Technique | Hassi Messaoud |

---

## 13. Vérification des Certificats par IA (Gemini 2.5 Flash)

Le processus de vérification de certificat pour les prestataires de services est entièrement automatisé. L'objectif est d'assurer l'authenticité des profils enregistrés dans l'annuaire avant leur publication.

### 13.1 Fonctionnement technique
1. **Requête Frontend :** Le prestataire soumet son certificat (image JPEG/PNG) via un formulaire `FormData` envoyé à l'endpoint `POST /api/verify-certificate`.
2. **Encodage Base64 :** Le serveur backend lit le fichier binaire sous forme d'un `ArrayBuffer`, puis le convertit en chaîne Base64.
3. **Appel à l'API Gemini :** Le serveur envoie l'image encodée à l'API **Google Gemini 2.5 Flash** (`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=...`) avec une configuration forçant le format de réponse en JSON (`responseMimeType: "application/json"`).
4. **Prompt Structuré :** L'instruction envoyée à l'IA exige une validation et l'extraction de métadonnées précises :
   ```json
   {
     "is_valid": boolean,
     "message": "reason for validity or invalidity",
     "extracted_data": {
       "FULL_NAME": "full name found or null",
       "DATE": "date found or null",
       "ID": "any identification number found or null"
     }
   }
   ```
5. **Hachage de Sécurité :** Pour respecter la confidentialité du prestataire, l'identifiant du certificat (`ID`) extrait par l'IA est haché avec un sel robuste (`bcryptjs`) avant son stockage sous la clé `certificateIdHash`.
6. **Mise à jour Base de données :** Le profil `Provider` est mis à jour avec les informations extraites. Si `certificateStatus` est `"VALID"`, le prestataire est considéré comme vérifié.

---

## 14. Intégration d'un Modèle Local (Self-Hosted)

Si vous souhaitez héberger votre propre modèle d'intelligence artificielle localement pour assurer la vérification des certificats hors-ligne ou pour des raisons de souveraineté des données, vous pouvez remplacer l'API Gemini par un modèle de vision local.

### 14.1 Prérequis
Les certificats étant des documents visuels, vous devez utiliser un modèle local doté de capacités de **Vision-Langage (VLM)** capable d'effectuer de la lecture de texte (OCR) et de l'analyse d'images.

**Modèles recommandés :**
* `llama3-vision` (Excellent pour l'extraction de données)
* `llava` (Modèle de vision open-source de référence, versions 7b ou 13b)
* `qwen2-vl` (Très performant pour la lecture de documents textuels multilingues)

### 14.2 Installation de l'infrastructure locale (Ollama)
Le moyen le plus simple d'exécuter un modèle local est d'utiliser **Ollama** :

1. Téléchargez et installez Ollama depuis [ollama.com](https://ollama.com).
2. Lancez le serveur local Ollama (il s'exécute par défaut sur le port `11434`).
3. Téléchargez le modèle de vision de votre choix via votre terminal :
   ```bash
   ollama pull llama3-vision
   ```

### 14.3 Adaptation du code backend
Pour rediriger les requêtes vers votre instance locale d'Ollama, modifiez le fichier [route.ts](file:///c:/Users/USER/PFE1/service_hub/app/api/verify-certificate/route.ts) comme suit :

```typescript
// Remplacement dans app/api/verify-certificate/route.ts

// Payload pour Ollama Vision API
const ollamaPayload = {
  model: "llama3-vision", // Modèle local installé
  messages: [
    {
      role: "user",
      content: "Analyze this certificate image. Extract data and return ONLY a valid JSON object matching this schema:\n{\n  \"is_valid\": boolean,\n  \"message\": \"reason for validity or invalidity\",\n  \"extracted_data\": {\n    \"FULL_NAME\": \"full name found or null\",\n    \"DATE\": \"date found or null\",\n    \"ID\": \"any identification number found or null\"\n  }\n}",
      images: [base64Image] // Image encodée en base64
    }
  ],
  format: "json", // Force le format de retour structuré JSON
  stream: false // Désactive le streaming de jetons
};

// Requête vers le serveur local Ollama
const localResponse = await fetch("http://localhost:11434/api/chat", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify(ollamaPayload)
});

if (!localResponse.ok) {
  return NextResponse.json({ message: "Failed to connect to local model." }, { status: 500 });
}

const localData = await localResponse.json();
const responseText = localData.message.content; // Ollama retourne la réponse sous message.content
const data = JSON.parse(responseText);
```

### 14.4 Avantages et Limites du modèle local
* **Avantages :** Gratuité totale des requêtes, confidentialité absolue (les certificats ne quittent pas votre serveur), indépendance vis-à-vis d'une connexion internet externe.
* **Limites :** Nécessite une configuration matérielle avec GPU dédié (NVIDIA CUDA de préférence) pour des performances d'analyse rapides (< 5 secondes par certificat). Les petits modèles de vision locaux (comme LLaVA 7B) peuvent avoir un taux de réussite d'OCR inférieur à Gemini 1.5 sur des images floues ou manuscrites.

---

## 15. Intégration Locale Dédiée avec LayoutLMv3 (Document AI)

**LayoutLMv3** (développé par Microsoft) est un modèle transformer pré-entraîné multimodal de pointe, spécifiquement conçu pour l'analyse de documents (Document AI). Contrairement aux modèles de vision généraux, il traite conjointement :
1. **Le texte du document** (obtenu par un moteur OCR).
2. **La mise en page spatiale** (coordonnées 2D/boîtes englobantes de chaque mot).
3. **L'aspect visuel** (caractéristiques graphiques de l'image).

Cette combinaison le rend extrêmement fiable pour la lecture et la validation de certificats professionnels.

### 15.1 Architecture d'intégration
LayoutLMv3 s'exécutant dans un environnement Python (PyTorch + Hugging Face Transformers), la plateforme Qantara utilise une architecture de microservices :

```
┌─────────────────┐   Image + User ID    ┌─────────────────────────┐
│                 │ ───────────────────> │                         │
│ Next.js API     │                      │ Python FastAPI Service  │
│ (Port 3000)     │ <─────────────────── │ (Port 8000)             │
└─────────────────┘      JSON Data       │ - LayoutLMv3 DocVQA     │
                                         │ - OCR Engine (EasyOCR)  │
                                         └─────────────────────────┘
```

---

### 15.2 Implémentation du Microservice Python (FastAPI)

#### 1. Dépendances requises (`requirements.txt`)
```text
fastapi==0.110.0
uvicorn==0.28.0
python-multipart==0.0.9
torch==2.2.1
transformers==4.38.2
pillow==10.2.0
easyocr==1.7.1
```

#### 2. Code du Serveur de Vision (`server.py`)
Ce service utilise `impira/layoutlmv3-document-qa` (LayoutLMv3 adapté pour le Visual Question Answering sur document) pour extraire de manière ciblée les informations requises en posant des questions naturelles au document.

```python
import io
import uvicorn
from fastapi import FastAPI, UploadFile, File, HTTPException
from PIL import Image
from transformers import pipeline

app = FastAPI(title="LayoutLMv3 Document Verification Service")

# Initialisation du pipeline de questions-réponses pour documents avec LayoutLMv3
# Ce pipeline gère automatiquement l'extraction OCR et l'encodage des coordonnées
try:
    doc_qa_pipeline = pipeline(
        "document-question-answering",
        model="impira/layoutlmv3-document-qa"
    )
except Exception as e:
    print(f"Erreur lors du chargement du modèle LayoutLMv3: {e}")
    doc_qa_pipeline = None

@app.post("/verify")
async def verify_document(file: UploadFile = File(...)):
    if doc_qa_pipeline is None:
        raise HTTPException(status_code=500, detail="LayoutLMv3 pipeline is not loaded.")
        
    try:
        # Lire l'image
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Poser des questions ciblées au modèle LayoutLMv3
        # Chaque question extrait la valeur et renvoie un score de confiance
        name_res = doc_qa_pipeline(image, "What is the full name of the certificate holder?")
        date_res = doc_qa_pipeline(image, "What is the date of issue or graduation?")
        id_res = doc_qa_pipeline(image, "What is the certificate number, registration ID, or licence code?")
        type_res = doc_qa_pipeline(image, "Is this a professional license, diploma, medical degree, or translation certificate?")
        
        # Extraire les meilleures réponses
        full_name = name_res[0]['answer'] if name_res else None
        issue_date = date_res[0]['answer'] if date_res else None
        cert_id = id_res[0]['answer'] if id_res else None
        doc_type = type_res[0]['answer'] if type_res else ""
        
        # Calculer le score moyen de confiance du modèle
        scores = [res[0]['score'] for res in [name_res, date_res, id_res] if res]
        avg_confidence = sum(scores) / len(scores) if scores else 0.0
        
        # Logique métier de validation locale :
        # Le document est considéré valide si la confiance moyenne dépasse 65% et
        # si le type de document contient des termes clés liés aux certificats d'études ou professionnels
        keywords = ["diploma", "degree", "certificate", "license", "doctor", "translation", "medical", "attestation"]
        is_valid_type = any(kw in doc_type.lower() for kw in keywords)
        
        is_valid = avg_confidence > 0.65 and is_valid_type
        message = "Certificat validé avec succès." if is_valid else "Le document n'a pas pu être validé avec certitude comme certificat professionnel."
        
        return {
            "is_valid": is_valid,
            "message": f"{message} (Confiance: {avg_confidence:.2%})",
            "extracted_data": {
                "FULL_NAME": full_name,
                "DATE": issue_date,
                "ID": cert_id
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing document: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

---

### 15.3 Connexion de la route API Next.js au microservice
Pour utiliser le microservice LayoutLMv3 local, modifiez l'API Next.js dans [route.ts](file:///c:/Users/USER/PFE1/service_hub/app/api/verify-certificate/route.ts) comme suit :

```typescript
// Modification dans app/api/verify-certificate/route.ts

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("userId") as string | null;

    if (!file) {
      return NextResponse.json({ message: "File is required." }, { status: 400 });
    }

    // Préparation du FormData pour la transmission au microservice local
    const pythonServiceData = new FormData();
    pythonServiceData.append("file", file);

    // Envoi de l'image au service local Python exécutant LayoutLMv3
    const pythonResponse = await fetch("http://localhost:8000/verify", {
      method: "POST",
      body: pythonServiceData
    });

    if (!pythonResponse.ok) {
      const errorText = await pythonResponse.text();
      console.error("LayoutLMv3 Service Error:", errorText);
      return NextResponse.json({ message: "Failed to process image with local LayoutLMv3 service." }, { status: 500 });
    }

    const data = await pythonResponse.json();

    // Hachage du numéro de certificat pour la vie privée
    let extractedIdHash = null;
    if (data.extracted_data?.ID) {
      const salt = await bcrypt.genSalt(10);
      extractedIdHash = await bcrypt.hash(data.extracted_data.ID, salt);
    }

    // Enregistrement des métadonnées et statut de vérification dans Prisma
    if (userId) {
      await prisma.provider.update({
        where: { id: userId },
        data: {
          certificateStatus: data.is_valid ? "VALID" : "INVALID",
          certificateMessage: data.message,
          certificateIdHash: extractedIdHash,
          extractedFullName: data.extracted_data?.FULL_NAME || null,
          extractedDate: data.extracted_data?.DATE || null,
          verifiedName: null, // Initialisation pour le processus Didit
        },
      });
    }

    return NextResponse.json({
      is_valid: data.is_valid,
      message: data.message,
      extracted_data: {
        FULL_NAME: data.extracted_data?.FULL_NAME || null,
        DATE: data.extracted_data?.DATE || null,
        ID_FOUND: !!data.extracted_data?.ID,
      }
    });

  } catch (error) {
    console.error("Certificate API Error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
```

### 15.4 Avantages de LayoutLMv3 par rapport aux LLM de vision généraux
* **Précision spatiale :** LayoutLMv3 intègre les positions exactes 2D des mots (bounding boxes), ce qui lui permet d'analyser la structure d'un tableau ou l'en-tête d'un certificat bien plus précisément qu'un modèle de vision multimodal classique (comme LLaVA) qui traite l'image de manière séquentielle globale.
* **Rapidité :** La version de base de LayoutLMv3 est beaucoup plus légère (environ 500 Mo) que les grands modèles de vision (LLaVA-7B fait ~4,5 Go), permettant des temps de réponse d'OCR et d'extraction de moins de 2 secondes sur un CPU moderne ou une petite carte graphique standard.
* **Sécurité locale :** Aucune clé API externe n'est requise et aucun flux de données n'est partagé en dehors de votre serveur local.

---

## 16. Intégration de l'Identité avec Didit (IDV)

Après avoir retiré Yoti Sandbox, la plateforme utilise **Didit IDV** (Identity Verification) pour automatiser la vérification d'identité par pièce d'identité officielle et comparaison de selfie liveness.

### 16.1 Processus d'intégration
1. **Initialisation de session (`POST /api/provider/didit/create-session`)** :
   - Le serveur contacte Didit API (`POST https://verification.didit.me/v3/session/`) avec le workflow ID configuré.
   - Retourne l'URL de session (`sessionUrl`) et le code unique (`sessionId`).
2. **Interface Client (Iframe/Nouvel Onglet)** :
   - Le frontend intègre le flux Didit dans une caméra-iframe sécurisée ou fournit un lien externe direct pour ouvrir la vérification sur mobile.
3. **Récupération des résultats (`POST /api/provider/verify-identity`)** :
   - Lorsque le prestataire confirme avoir terminé, le serveur interroge la décision Didit via `GET https://verification.didit.me/v3/session/{sessionId}/decision/`.
   - Si la décision est `"Approved"`, le serveur extrait le prénom et le nom du document vérifié, télécharge les photos d'identité (`front_image` et `portrait_image` depuis les URLs signées temporaires de Didit) et met à jour le statut dans la base de données.
   - Le nom extrait est sauvegardé dans l'attribut `verifiedName` pour la comparaison ultérieure avec la carte professionnelle.

---

## 17. Système Hybride de Vérification Professionnelle & QR Code (FastAPI + Pyzbar)

Afin d'offrir une flexibilité maximale, le système Next.js oriente les prestataires vers des canaux d'audit IA distincts selon leur catégorie professionnelle :

```
                                  Catégorie ?
                                 /          \
            (Artisan / Auto-Entrepreneur)     (Professions Libérales)
                           /                           \
                  FastAPI /verify-card-qr           FastAPI /verify
                       /                                   \
             [Image Preprocessing]                   [LayoutLMv3 OCR]
            - Grayscale, Gaussian Blur                      |
            - Adaptive Thresholding                 - Extraction Nom/ID
                       |                                    |
            [pyzbar QR Code Decoding]                       |
                       |                                    |
             - Extraction du Nom                            |
                       \                                   /
                        \                                 /
                   Match avec Didit Name (verifiedName) ? (Min. 2 mots)
                                      |
                     [Database Update & Admin Review]
```

### 17.1 Canal 1 : Professions Libérales (LayoutLMv3 / Gemini)
- Les prestataires soumettent leurs diplômes ou licences ordinales.
- Le document est analysé via LayoutLMv3 (local) ou Gemini 2.5 Flash (production) pour en extraire le nom du titulaire, le numéro de licence et la date.

### 17.2 Canal 2 : Artisans (CNAM) & Auto-Entrepreneurs (ANAE) (QR Code + pyzbar)
- Les cartes professionnelles CNAM et ANAE disposent de codes QR officiels.
- L'image de la carte est envoyée à l'endpoint dédié de notre serveur Python : `POST /verify-card-qr`.
- **Pipeline de prétraitement d'image (OpenCV)** :
  1. **Grayscale** : Conversion de l'image en nuances de gris pour éliminer la chromaticité.
  2. **Gaussian Blur** : Lissage pour éliminer le bruit haute-fréquence.
  3. **Adaptive Thresholding** : Seuillage adaptatif pour obtenir une image binaire contrastée, particulièrement efficace contre les ombres et variations de luminosité des photos prises sur mobile.
- **Détection QR & Fallbacks (pyzbar)** :
  - Le système tente de localiser et décoder le QR code sur l'image binarisée.
  - En cas d'échec (seuillage trop agressif), il effectue successivement des tentatives de repli sur l'image en nuances de gris brute, sur l'image floutée, et sur chacun des canaux BGR individuels.
- **Extracteur de Données** :
  - Le texte décodé du QR est nettoyé et analysé (gestion des formats bruts, clé-valeur textuels, ou chaînes JSON).
  - Retourne les données extraites au backend.

### 17.3 Algorithme de Correspondance de Noms (Name Matcher)
- Pour éviter les rejets injustifiés dus aux fautes de frappe ou à l'ordre des prénoms/noms (ex. *Amina Saidi* vs. *Saidi Amina*), le backend effectue un recoupement souple des mots.
- Divise les deux chaînes (`verifiedName` de Didit et le nom extrait du document) en jetons textuels normalisés (minuscules, sans accents).
- La validation n'est acceptée que si **au moins 2 mots uniques** correspondent entre les deux sources.
