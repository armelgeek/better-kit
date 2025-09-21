# Adiemus OpenAPI Plugin

The OpenAPI plugin for Adiemus automatically generates OpenAPI 3.1.0 specifications from your CRUD resources and provides an interactive API documentation interface using Scalar.

## Features

- **Automatic Schema Generation**: Converts Zod schemas to OpenAPI schemas
- **Complete CRUD Documentation**: Documents all CRUD endpoints (Create, Read, Update, Delete, List)
- **Interactive Documentation**: Provides a beautiful Scalar UI for API exploration
- **Customizable**: Support for custom themes, paths, and configurations
- **Type Safe**: Full TypeScript support with proper type inference

## Installation

The OpenAPI plugin is included with Adiemus. Simply import it:

```typescript
import { adiemus, openApiPlugin } from "adiemus";
```

## Basic Usage

```typescript
import { adiemus, openApiPlugin } from "adiemus";
import { z } from "zod";

const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
});

const crud = adiemus({
  database: {
    provider: "sqlite",
    url: "database.db",
  },
  resources: [
    {
      name: "user",
      schema: userSchema,
    },
  ],
  plugins: [
    openApiPlugin(), // Add the OpenAPI plugin
  ],
});
```

This automatically adds two endpoints to your API:

- `GET /openapi/schema` - Returns the OpenAPI JSON specification
- `GET /reference` - Interactive API documentation

## Configuration Options

### Custom Reference Path

```typescript
openApiPlugin({
  path: "/docs", // Custom path for the reference UI
})
```

### Custom Theme

Choose from various Scalar themes:

```typescript
openApiPlugin({
  theme: "purple", // Available: default, purple, moon, solarized, etc.
})
```

### Disable Reference UI

```typescript
openApiPlugin({
  disableDefaultReference: true, // Only provide the JSON schema endpoint
})
```

### Complete Configuration

```typescript
openApiPlugin({
  path: "/api-docs",
  theme: "moon",
  disableDefaultReference: false,
})
```

## Generated Documentation

The plugin automatically generates documentation for:

### Resource Schemas
- Input schemas for create/update operations
- Output schemas with timestamps and IDs
- Validation rules and descriptions from Zod schemas

### CRUD Endpoints
- **POST /{resource}** - Create new resource
- **GET /{resource}** - List resources with pagination
- **GET /{resource}/{id}** - Get specific resource
- **PUT /{resource}/{id}** - Update specific resource  
- **DELETE /{resource}/{id}** - Delete specific resource

### Standard Response Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

### Query Parameters
- Pagination: `page`, `limit`
- Search: `search`, `q`
- Relationships: `include`
- Filtering: `filters`, `where`
- Sorting: `sortBy`, `sortOrder`

## Advanced Features

### Relationship Documentation
If your resources have relationships defined, they'll be documented with include options:

```typescript
const productSchema = z.object({
  name: z.string(),
  categoryId: z.string(),
});

const crud = adiemus({
  resources: [
    {
      name: "product",
      schema: productSchema,
      relationships: {
        category: {
          type: "belongsTo",
          target: "category",
          foreignKey: "categoryId",
        },
      },
    },
  ],
  plugins: [openApiPlugin()],
});
```

### Custom Endpoint Documentation
Custom endpoints defined in your resources will also be included in the OpenAPI specification.

## Integration

### With Frontend Applications
Use the generated OpenAPI schema to generate TypeScript clients:

```bash
# Generate TypeScript client from OpenAPI schema
npx openapi-typescript http://localhost:3000/openapi/schema -o types/api.ts
```

### With API Testing Tools
Import the OpenAPI schema into tools like:
- Postman
- Insomnia  
- Thunder Client
- Swagger UI

### With Code Generators
Generate client libraries for various languages using tools like:
- OpenAPI Generator
- Swagger Codegen

## MCP Integration

The plugin includes MCP (Model Context Protocol) configuration for AI/editor integration. See `.mcp/config.json` for details on:
- Schema generation tools
- Resource definitions
- Endpoint documentation

## Example Output

The generated OpenAPI specification includes:

```json
{
  "openapi": "3.1.0",
  "info": {
    "title": "Adiemus API",
    "description": "Auto-generated API documentation for Adiemus resources",
    "version": "1.0.0"
  },
  "paths": {
    "/user": {
      "get": { /* List users */ },
      "post": { /* Create user */ }
    },
    "/user/{id}": {
      "get": { /* Get user */ },
      "put": { /* Update user */ },
      "delete": { /* Delete user */ }
    }
  },
  "components": {
    "schemas": {
      "User": { /* User model schema */ },
      "UserInput": { /* User input schema */ }
    }
  }
}
```

## Contributing

To contribute to the OpenAPI plugin:

1. Make changes in `packages/better-crud/src/plugins/openapi/`
2. Run tests: `pnpm test -- openapi.test.ts`
3. Build: `pnpm build`
4. Submit a pull request

## License

Part of the Adiemus package. See the main project license for details.