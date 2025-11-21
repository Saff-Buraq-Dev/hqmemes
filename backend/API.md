# 📡 HQ-Memes API Documentation

Base URL: `https://api-hqmemems.dev.gharbidev.com`

## 🔐 Authentification

Toutes les routes (sauf `/health`) requièrent un JWT token dans le header `Authorization`.

```bash
Authorization: Bearer <JWT_TOKEN>
```

Le token est obtenu via AWS Cognito après login.

## 📋 Endpoints

### Health Check

#### GET /health
Vérification du statut de l'API (pas d'auth requis).

**Response**
```json
{
  "status": "healthy",
  "environment": "production"
}
```

---

### 👤 Authentication

#### POST /auth/signup
Créer un utilisateur après inscription Cognito.

**Request Body**
```json
{
  "userId": "cognito-user-id",
  "email": "user@example.com",
  "username": "username"
}
```

**Response** (201)
```json
{
  "userId": "cognito-user-id",
  "email": "user@example.com",
  "username": "username",
  "avatarUrl": "/avatars/avatar-1.png",
  "createdAt": "2025-10-18T12:00:00Z"
}
```

#### GET /auth/me
Récupérer le profil de l'utilisateur actuel.

**Response** (200)
```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "username": "username",
  "avatarUrl": "/avatars/avatar-1.png",
  "createdAt": "2025-10-18T12:00:00Z"
}
```

#### PUT /auth/me
Mettre à jour le profil utilisateur.

**Request Body**
```json
{
  "username": "new-username",
  "avatarUrl": "/avatars/avatar-2.png"
}
```

**Response** (200)
```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "username": "new-username",
  "avatarUrl": "/avatars/avatar-2.png",
  "createdAt": "2025-10-18T12:00:00Z"
}
```

---

### 🎭 Memes

#### GET /memes
Récupérer les memes avec filtres et pagination.

**Query Parameters**
- `uploaderId` (optional): Filter by uploader
- `categories` (optional): Comma-separated categories
- `sortBy` (optional): `recent` or `popular` (default: `recent`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10, max: 50)

**Response** (200)
```json
{
  "data": [
    {
      "memeId": "meme-id",
      "name": "Funny meme",
      "url": "/memes/meme-id.jpg",
      "uploaderId": "user-id",
      "uploader": {
        "userId": "user-id",
        "username": "username",
        "avatarUrl": "/avatars/avatar-1.png"
      },
      "categories": ["drole", "travail"],
      "likesCount": 42,
      "likes": [
        {
          "userId": "user-id",
          "username": "username",
          "avatarUrl": "/avatars/avatar-1.png",
          "createdAt": "2025-10-18T12:00:00Z"
        }
      ],
      "isLiked": true,
      "createdAt": "2025-10-18T12:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "hasMore": true
}
```

#### GET /memes/{memeId}
Récupérer un meme spécifique.

**Response** (200)
```json
{
  "memeId": "meme-id",
  "name": "Funny meme",
  "url": "/memes/meme-id.jpg",
  "uploaderId": "user-id",
  "uploader": {
    "userId": "user-id",
    "username": "username",
    "avatarUrl": "/avatars/avatar-1.png"
  },
  "categories": ["drole"],
  "likesCount": 42,
  "isLiked": false,
  "createdAt": "2025-10-18T12:00:00Z"
}
```

#### POST /memes
Créer un meme (après upload S3).

**Request Body**
```json
{
  "memeId": "generated-id",
  "name": "My meme",
  "url": "/memes/generated-id.jpg",
  "categories": ["drole", "actualite"]
}
```

**Response** (201)
```json
{
  "memeId": "generated-id",
  "name": "My meme",
  "url": "/memes/generated-id.jpg",
  "uploaderId": "current-user-id",
  "categories": ["drole", "actualite"],
  "likesCount": 0,
  "createdAt": "2025-10-18T12:00:00Z"
}
```

#### DELETE /memes/{memeId}
Supprimer un meme (seulement par l'uploader).

**Response** (204)
No content

---

### ❤️ Likes

#### POST /memes/{memeId}/like
Toggle like/unlike sur un meme.

**Response** (200)
```json
{
  "isLiked": true,
  "likesCount": 43
}
```

#### GET /memes/{memeId}/likes
Récupérer tous les likes d'un meme.

**Response** (200)
```json
[
  {
    "userId": "user-id",
    "username": "username",
    "avatarUrl": "/avatars/avatar-1.png",
    "createdAt": "2025-10-18T12:00:00Z"
  }
]
```

---

### 🏷️ Categories

#### GET /categories
Récupérer toutes les catégories.

**Response** (200)
```json
[
  {
    "categoryId": "drole",
    "name": "Drôle",
    "count": 42,
    "createdAt": "2025-10-18T12:00:00Z"
  }
]
```

#### POST /categories
Créer une nouvelle catégorie.

**Request Body**
```json
{
  "name": "Nouvelle catégorie"
}
```

**Response** (201)
```json
{
  "categoryId": "nouvelle-categorie",
  "name": "Nouvelle catégorie",
  "count": 0,
  "createdAt": "2025-10-18T12:00:00Z"
}
```

---

### 📤 Upload

#### POST /upload/presigned
Obtenir une URL présignée S3 pour upload.

**Request Body**
```json
{
  "filename": "meme.jpg",
  "contentType": "image/jpeg"
}
```

**Response** (200)
```json
{
  "uploadUrl": "https://s3.amazonaws.com/presigned-url",
  "fileUrl": "/memes/generated-id.jpg",
  "memeId": "generated-id"
}
```

**Upload Flow**
1. Appeler `/upload/presigned` pour obtenir l'URL
2. PUT le fichier vers `uploadUrl` (sans auth, directement vers S3)
3. Appeler `POST /memes` avec `memeId`, `fileUrl`, etc.

---

## 🔴 Codes d'Erreur

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized (invalid/missing token) |
| 403 | Forbidden (not authorized) |
| 404 | Not Found |
| 500 | Internal Server Error |

**Error Response Format**
```json
{
  "detail": "Error message"
}
```

---

## 📝 Notes

- Toutes les dates sont en format ISO 8601 (UTC)
- Les URLs de fichiers sont relatives (préfixez avec `ASSETS_URL`)
- La pagination max est de 50 items par page
- Les tokens JWT expirent après 1 heure
- Les presigned URLs expirent après 1 heure

## 🔗 Interactive Docs

- **Swagger UI**: https://api-hqmemems.dev.gharbidev.com/docs
- **ReDoc**: https://api-hqmemems.dev.gharbidev.com/redoc

