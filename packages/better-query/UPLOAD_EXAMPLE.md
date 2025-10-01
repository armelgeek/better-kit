# File Upload Plugin - Usage Example

This example demonstrates how to use the Upload Plugin in a Better Query application.

## Server Setup

```typescript
import { betterQuery, uploadPlugin } from 'better-query';

// Initialize Better Query with upload plugin
const query = betterQuery({
  database: {
    provider: "sqlite",
    url: "./data.db"
  },
  plugins: [
    uploadPlugin({
      enabled: true,
      uploadDir: './uploads',
      baseUrl: 'http://localhost:3000/uploads',
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/pdf'
      ],
      fileNaming: 'uuid', // or 'original' or custom function
      trackInDatabase: true,
    })
  ]
});

// Start your server
import express from 'express';

const app = express();

// Serve uploaded files (if using local storage)
app.use('/uploads', express.static('./uploads'));

// Mount Better Query API
app.all('/api/query/*', query.handler);

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

## Client Usage (Browser)

```typescript
import { createClient } from 'better-query/client';

const client = createClient({
  baseUrl: 'http://localhost:3000'
});

// File upload example
async function uploadFile(file: File) {
  // Convert file to base64
  const base64File = await fileToBase64(file);
  
  // Upload the file
  const response = await client.uploadFile({
    file: base64File,
    filename: file.name,
    mimeType: file.type,
    metadata: {
      uploadedFrom: 'web-app',
      description: 'User uploaded file'
    }
  });
  
  console.log('File uploaded:', response.data);
  return response.data;
}

// Helper function to convert File to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/png;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// List uploaded files
async function listFiles() {
  const response = await client.listFiles({
    page: 1,
    limit: 10,
    mimeType: 'image/jpeg' // optional filter
  });
  
  console.log('Files:', response.data);
  return response.data;
}

// Delete a file
async function deleteFile(fileId: string) {
  await client.deleteFile({ id: fileId });
  console.log('File deleted');
}
```

## React Component Example

```tsx
import { useState } from 'react';
import { useClient } from 'better-query/react';

function FileUploader() {
  const client = useClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    try {
      // Convert to base64
      const base64File = await fileToBase64(file);
      
      // Upload
      const response = await client.uploadFile({
        file: base64File,
        filename: file.name,
        mimeType: file.type,
      });
      
      setUploadedFile(response.data);
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <input
        type="file"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        disabled={uploading}
        accept="image/*,application/pdf"
      />
      
      <button 
        onClick={handleUpload} 
        disabled={!file || uploading}
      >
        {uploading ? 'Uploading...' : 'Upload File'}
      </button>

      {uploadedFile && (
        <div className="upload-result">
          <h3>Uploaded File:</h3>
          <p>Filename: {uploadedFile.filename}</p>
          <p>Size: {(uploadedFile.size / 1024).toFixed(2)} KB</p>
          {uploadedFile.url && (
            <a href={uploadedFile.url} target="_blank" rel="noopener noreferrer">
              View File
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// Helper function
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default FileUploader;
```

## Custom Storage Adapter Example (S3)

```typescript
import { uploadPlugin, type StorageAdapter } from 'better-query/plugins';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

class S3StorageAdapter implements StorageAdapter {
  private s3Client: S3Client;
  private bucket: string;
  private region: string;

  constructor(config: { bucket: string; region: string; credentials: any }) {
    this.bucket = config.bucket;
    this.region = config.region;
    this.s3Client = new S3Client({
      region: config.region,
      credentials: config.credentials
    });
  }

  async store(file: Buffer | ReadableStream, filename: string, options?: any) {
    const buffer = Buffer.isBuffer(file) ? file : await this.streamToBuffer(file);
    
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: filename,
      Body: buffer,
      ContentType: options?.mimeType,
      Metadata: options?.metadata
    }));

    return {
      path: filename,
      url: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${filename}`
    };
  }

  async retrieve(path: string): Promise<Buffer> {
    const response = await this.s3Client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: path
    }));
    
    return await this.streamToBuffer(response.Body as any);
  }

  async delete(path: string): Promise<void> {
    await this.s3Client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: path
    }));
  }

  async exists(path: string): Promise<boolean> {
    try {
      await this.s3Client.send(new GetObjectCommand({
        Bucket: this.bucket,
        Key: path
      }));
      return true;
    } catch {
      return false;
    }
  }

  getUrl(path: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${path}`;
  }

  private async streamToBuffer(stream: ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];
    const reader = stream.getReader();
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(Buffer.from(value));
    }
    
    return Buffer.concat(chunks);
  }
}

// Use S3 adapter
const query = betterQuery({
  database: { provider: "sqlite", url: "./data.db" },
  plugins: [
    uploadPlugin({
      storage: new S3StorageAdapter({
        bucket: 'my-app-uploads',
        region: 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
        }
      })
    })
  ]
});
```

## Advanced Configuration

### Custom Validation

```typescript
uploadPlugin({
  validate: async (file) => {
    // Check file size
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('File too large');
    }
    
    // Check file extension
    const ext = file.filename.split('.').pop()?.toLowerCase();
    if (!['jpg', 'png', 'pdf'].includes(ext || '')) {
      throw new Error('Invalid file type');
    }
    
    // Custom validation logic
    if (file.filename.includes('malicious')) {
      return false;
    }
    
    return true;
  }
})
```

### Custom File Naming

```typescript
uploadPlugin({
  fileNaming: (originalName) => {
    const timestamp = Date.now();
    const sanitized = originalName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .toLowerCase();
    return `${timestamp}-${sanitized}`;
  }
})
```

### Environment-Specific Storage

```typescript
const storage = process.env.NODE_ENV === 'production'
  ? new S3StorageAdapter({
      bucket: process.env.S3_BUCKET!,
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
      }
    })
  : new LocalStorageAdapter('./uploads', 'http://localhost:3000/uploads');

uploadPlugin({ storage })
```

## API Reference

See the [full documentation](../src/plugins/upload/README.md) for detailed API reference and configuration options.
