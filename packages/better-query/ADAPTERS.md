# ORM Adapter System

Adiemus now supports a generic ORM adapter system, similar to better-auth, allowing you to use different database ORMs and custom adapters.

## Built-in Adapters

### Kysely Adapter (Default)

```typescript
import { adiemus } from "adiemus";

const crud = adiemus({
  resources: [/* ... */],
  database: {
    provider: "sqlite",  // "sqlite" | "postgres" | "mysql"
    url: "sqlite:./database.db",
    autoMigrate: true,
  },
});
```

## Custom Adapters

You can create custom adapters for any ORM or database system by implementing the `CrudAdapter` interface:

```typescript
import { CrudAdapter } from "adiemus";

class MyCustomAdapter implements CrudAdapter {
  async create(params) {
    // Implement create logic
  }

  async findFirst(params) {
    // Implement find logic
  }

  async findMany(params) {
    // Implement find many logic
  }

  async update(params) {
    // Implement update logic
  }

  async delete(params) {
    // Implement delete logic
  }

  async count(params) {
    // Implement count logic
  }
}

// Use your custom adapter
const crud = adiemus({
  resources: [/* ... */],
  database: {
    adapter: new MyCustomAdapter(),
  },
});
```

## Adapter Interface

The `CrudAdapter` interface defines the following methods:

```typescript
interface CrudAdapter {
  create(params: { model: string; data: Record<string, any>; include?: IncludeOptions }): Promise<any>;
  findFirst(params: { model: string; where?: CrudWhere[]; include?: IncludeOptions; select?: string[] }): Promise<any | null>;
  findMany(params: { model: string; where?: CrudWhere[]; limit?: number; offset?: number; orderBy?: CrudOrderBy[]; include?: IncludeOptions; select?: string[] }): Promise<any[]>;
  update(params: { model: string; where: CrudWhere[]; data: Record<string, any>; include?: IncludeOptions }): Promise<any>;
  delete(params: { model: string; where: CrudWhere[]; cascade?: boolean }): Promise<void>;
  count(params: { model: string; where?: CrudWhere[] }): Promise<number>;
  
  // Optional methods for advanced features
  createWithRelations?(params: { model: string; data: Record<string, any>; relations?: Record<string, any>; include?: IncludeOptions }): Promise<any>;
  updateWithRelations?(params: { model: string; where: CrudWhere[]; data: Record<string, any>; relations?: Record<string, any>; include?: IncludeOptions }): Promise<any>;
  validateReferences?(params: { model: string; data: Record<string, any>; operation: "create" | "update" | "delete" }): Promise<{ valid: boolean; errors: string[] }>;
  createSchema?(data: { model: string; fields: Record<string, FieldAttribute> }[]): Promise<void>;
}
```

## Examples

### Prisma Adapter

```typescript
class PrismaAdapter implements CrudAdapter {
  constructor(private prisma: PrismaClient) {}

  async create(params) {
    const { model, data } = params;
    return await this.prisma[model].create({ data });
  }

  async findFirst(params) {
    const { model, where = [] } = params;
    const whereClause = this.convertWhere(where);
    return await this.prisma[model].findFirst({ where: whereClause });
  }

  // ... implement other methods
}
```

### Drizzle Adapter

```typescript
class DrizzleAdapter implements CrudAdapter {
  constructor(private db: DrizzleDB, private schema: any) {}

  async create(params) {
    const { model, data } = params;
    const table = this.schema[model];
    const [result] = await this.db.insert(table).values(data).returning();
    return result;
  }

  // ... implement other methods
}
```

### In-Memory Adapter (for testing)

```typescript
class InMemoryAdapter implements CrudAdapter {
  private data = new Map<string, any>();

  async create(params) {
    const { model, data } = params;
    const id = `${model}_${Date.now()}`;
    const record = { id, ...data };
    this.data.set(id, record);
    return record;
  }

  // ... implement other methods
}
```

## Benefits

1. **ORM Flexibility**: Use any ORM or database driver
2. **Testing**: Easy to create mock adapters for testing
3. **Migration**: Gradually migrate from one ORM to another
4. **Extensibility**: Add custom functionality to adapters
5. **Type Safety**: Full TypeScript support with proper interfaces

## Migration from Direct Kysely Usage

If you were previously using better-crud with direct Kysely configuration, no changes are required. The system is backward compatible:

```typescript
// This still works exactly the same
const crud = adiemus({
  resources: [/* ... */],
  database: {
    provider: "sqlite",
    url: "sqlite:./database.db",
    autoMigrate: true,
  },
});
```