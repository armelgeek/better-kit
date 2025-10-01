# Réponse à la Question : Plugin ou Middleware pour l'Upload de Fichiers ?

## Question Originale
"Je sais pas si c'est un middleware ou un plugins pour gérer l'upload de fichier"

## Réponse : C'est un Plugin ! ✅

Pour gérer l'upload de fichiers dans Better Query, **un plugin est la meilleure approche** plutôt qu'un middleware. Voici pourquoi :

### Pourquoi un Plugin ?

1. **Architecture Modulaire**
   - Les plugins peuvent ajouter des endpoints complets
   - Ils peuvent étendre le schéma de la base de données
   - Ils sont réutilisables et configurables

2. **Fonctionnalités Complètes**
   - Gestion du stockage (local, S3, personnalisé)
   - Validation des fichiers
   - Suivi des métadonnées
   - Endpoints API automatiques

3. **Pourquoi Pas un Middleware ?**
   - Les middlewares sont pour le traitement des requêtes
   - Ils ne peuvent pas ajouter de nouveaux endpoints
   - Ils ne peuvent pas gérer le stockage persistant
   - Ils sont limités dans leurs capacités

## Le Plugin d'Upload

Le plugin d'upload a été implémenté avec les fonctionnalités suivantes :

### Fonctionnalités Principales

```typescript
import { uploadPlugin } from 'better-query/plugins';

const query = betterQuery({
  database: { provider: "sqlite", url: "./data.db" },
  plugins: [
    uploadPlugin({
      enabled: true,
      uploadDir: './uploads',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
      fileNaming: 'uuid', // Nommage unique des fichiers
      trackInDatabase: true, // Suivi en base de données
    })
  ]
});
```

### Endpoints Automatiquement Créés

- **POST** `/api/query/upload/file` - Uploader un fichier
- **GET** `/api/query/upload/file/:id` - Obtenir les métadonnées
- **GET** `/api/query/upload/download/:id` - Télécharger un fichier
- **DELETE** `/api/query/upload/file/:id` - Supprimer un fichier
- **GET** `/api/query/upload/files` - Lister les fichiers

### Validation des Fichiers

```typescript
uploadPlugin({
  maxFileSize: 10 * 1024 * 1024, // Limite de taille
  allowedMimeTypes: ['image/jpeg', 'image/png'], // Types autorisés
  validate: async (file) => {
    // Validation personnalisée
    return true;
  }
})
```

### Adaptateurs de Stockage

Le plugin supporte plusieurs backends de stockage :

1. **Stockage Local** (par défaut)
```typescript
import { LocalStorageAdapter } from 'better-query/plugins';

uploadPlugin({
  storage: new LocalStorageAdapter('./uploads', 'https://example.com/files')
})
```

2. **Stockage S3** (personnalisé)
```typescript
class S3StorageAdapter implements StorageAdapter {
  async store(file, filename, options) {
    // Upload vers S3
    return { path, url };
  }
  // ... autres méthodes
}

uploadPlugin({
  storage: new S3StorageAdapter()
})
```

### Utilisation Côté Client

```typescript
import { createClient } from 'better-query/client';

const client = createClient({
  baseUrl: 'http://localhost:3000'
});

// Uploader un fichier
const response = await client.uploadFile({
  file: base64File,
  filename: 'photo.jpg',
  mimeType: 'image/jpeg',
  metadata: {
    description: 'Ma photo'
  }
});

console.log('Fichier uploadé:', response.data);
```

### Schéma de Base de Données

Le plugin crée automatiquement une table pour suivre les fichiers :

```sql
CREATE TABLE uploaded_files (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size INTEGER NOT NULL,
  path TEXT NOT NULL,
  url TEXT,
  uploaded_by TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata JSON
);
```

## Documentation Complète

Pour plus d'informations :
- [Documentation du Plugin Upload](./src/plugins/upload/README.md)
- [Exemples d'Utilisation](./UPLOAD_EXAMPLE.md)

## Tests

Le plugin est entièrement testé avec 25 tests couvrant :
- Configuration du plugin
- Adaptateurs de stockage
- Validation des fichiers
- Stratégies de nommage
- Intégration avec le système de plugins

## Conclusion

**Utilisez le plugin d'upload** pour gérer les fichiers dans Better Query. Il offre une solution complète, sécurisée et flexible qui s'intègre parfaitement dans l'architecture du framework.
