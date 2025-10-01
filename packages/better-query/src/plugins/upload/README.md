# Upload Plugin

The Upload Plugin provides file upload functionality for Better Query applications. It supports multiple storage backends, file validation, and automatic metadata tracking.

## Features

- 📤 **File Upload** - Upload files via base64 or multipart form data
- 💾 **Multiple Storage Backends** - Local filesystem, S3, or custom adapters
- ✅ **File Validation** - Size limits, MIME type restrictions, custom validators
- 🗄️ **Database Tracking** - Optional metadata storage in database
- 🔐 **Secure** - Built-in validation and sanitization
- 🎨 **Flexible Naming** - UUID, original, or custom naming strategies

## Installation

The upload plugin is included in `better-query` by default:

```typescript
import { uploadPlugin } from 'better-query/plugins';
```

## Basic Usage

### Server Setup

```typescript
import { betterQuery, uploadPlugin } from 'better-query';

const query = betterQuery({
  database: {
    provider: "sqlite",
    url: "./data.db"
  },
  plugins: [
    uploadPlugin({
      enabled: true,
      uploadDir: './uploads',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    })
  ]
});
```

### Client Usage

```typescript
import { createClient } from 'better-query/client';

const client = createClient({
  baseUrl: 'http://localhost:3000'
});

// Upload a file
const file = document.getElementById('fileInput').files[0];
const reader = new FileReader();

reader.onload = async () => {
  const base64File = reader.result.split(',')[1]; // Remove data URL prefix
  
  const response = await client.uploadFile({
    file: base64File,
    filename: file.name,
    mimeType: file.type,
    metadata: {
      description: 'User profile picture'
    }
  });
  
  console.log('File uploaded:', response.data);
};

reader.readAsDataURL(file);
```

## Configuration Options

### `UploadPluginOptions`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable the plugin |
| `storage` | `StorageAdapter` | `LocalStorageAdapter` | Storage backend to use |
| `uploadDir` | `string` | `'./uploads'` | Directory for local storage |
| `baseUrl` | `string` | `undefined` | Base URL for serving files |
| `maxFileSize` | `number` | `10485760` (10MB) | Maximum file size in bytes |
| `allowedMimeTypes` | `string[]` | `[]` (all) | Allowed MIME types |
| `fileNaming` | `'original' \| 'uuid' \| function` | `'uuid'` | File naming strategy |
| `trackInDatabase` | `boolean` | `true` | Store metadata in database |
| `validate` | `function` | `undefined` | Custom validation function |

## Storage Adapters

### Local Storage (Default)

Stores files on the local filesystem:

```typescript
import { uploadPlugin, LocalStorageAdapter } from 'better-query/plugins';

uploadPlugin({
  storage: new LocalStorageAdapter('./uploads', 'https://example.com/files')
})
```

### Custom Storage Adapter

Implement the `StorageAdapter` interface for custom storage:

```typescript
import type { StorageAdapter } from 'better-query/plugins';

class S3StorageAdapter implements StorageAdapter {
  async store(file, filename, options) {
    // Upload to S3
    const key = await uploadToS3(file, filename);
    return {
      path: key,
      url: \`https://bucket.s3.amazonaws.com/\${key}\`
    };
  }

  async retrieve(path) {
    return await downloadFromS3(path);
  }

  async delete(path) {
    await deleteFromS3(path);
  }

  async exists(path) {
    return await s3FileExists(path);
  }

  getUrl(path) {
    return \`https://bucket.s3.amazonaws.com/\${path}\`;
  }
}

// Use custom adapter
uploadPlugin({
  storage: new S3StorageAdapter()
})
```

## API Endpoints

The plugin automatically creates the following endpoints:

### Upload File
- **POST** `/api/query/upload/file`
- Body: `{ file: string, filename: string, mimeType: string, metadata?: object }`

### Get File Metadata
- **GET** `/api/query/upload/file/:id`

### Download File
- **GET** `/api/query/upload/download/:id`

### Delete File
- **DELETE** `/api/query/upload/file/:id`

### List Files
- **GET** `/api/query/upload/files?page=1&limit=50&mimeType=image/jpeg`

## Best Practices

### 1. Always Validate Files

```typescript
uploadPlugin({
  maxFileSize: 10 * 1024 * 1024,
  allowedMimeTypes: ['image/jpeg', 'image/png'],
  validate: async (file) => {
    // Additional validation
    return true;
  }
})
```

### 2. Use Environment-Specific Storage

```typescript
const storage = process.env.NODE_ENV === 'production'
  ? new S3StorageAdapter()
  : new LocalStorageAdapter('./uploads');

uploadPlugin({ storage })
```

### 3. Secure File Access

```typescript
// Add authentication middleware
app.use('/uploads/*', authenticateUser);
```

## License

MIT
