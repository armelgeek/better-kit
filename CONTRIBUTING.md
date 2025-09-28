# Contributing to Better Kit 🤝

Thank you for your interest in contributing to Better Kit! This guide will help you get started with development and submitting contributions.

## 🚀 Quick Start for Contributors

### Prerequisites
- **Node.js 18+** 
- **pnpm** (preferred) or npm
- **Git**
- **TypeScript knowledge**

### Setup Development Environment
```bash
# 1. Fork the repository on GitHub
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/better-kit.git
cd better-kit

# 3. Install dependencies
pnpm install

# 4. Build packages
pnpm build

# 5. Run tests
pnpm test
```

### Project Structure
```
better-kit/
├── packages/
│   ├── better-query/        # Core CRUD library
│   │   ├── src/
│   │   │   ├── query.ts     # Main factory function
│   │   │   ├── adapters/    # Database adapters
│   │   │   ├── plugins/     # Plugin system
│   │   │   └── client/      # Client SDK
│   │   └── README.md
│   └── shared/              # Shared utilities
├── dev/                     # Development examples
│   ├── next-app/           # Next.js demo
│   └── bun/                # Bun runtime demo
└── examples/               # Standalone examples
```

## 🎯 How to Contribute

### 1. Types of Contributions

#### 🐛 **Bug Fixes**
- Fix broken functionality
- Improve error handling
- Resolve TypeScript issues
- Performance improvements

#### ✨ **New Features**
- New admin components
- Database adapters
- Plugins
- Better Auth integration

#### 📖 **Documentation**
- API documentation
- Tutorials and guides
- Code examples
- README improvements

#### 🧪 **Testing**
- Unit tests
- Integration tests
- E2E tests
- Visual regression tests

### 2. Before You Start

#### Check Existing Work
- Browse [GitHub Issues](https://github.com/armelgeek/better-kit/issues)
- Check [Pull Requests](https://github.com/armelgeek/better-kit/pulls)
- Review [TODO.md](./TODO.md) for planned work

#### Discuss Major Changes
- Open an issue for large features
- Comment on existing issues
- Ask questions in discussions

### 3. Development Workflow

#### Create a Branch
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or fix branch
git checkout -b fix/issue-description
```

#### Make Changes
```bash
# Make your changes
# Write/update tests
# Update documentation

# Run checks
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

#### Submit Pull Request
```bash
# Push your branch
git push origin feature/your-feature-name

# Create pull request on GitHub
# Fill out the PR template
# Link to related issues
```

## 📝 Code Guidelines

### TypeScript Standards
```typescript
// ✅ Good: Use explicit types
interface UserSchema {
  id: string;
  name: string;
  email: string;
}

// ✅ Good: Use generic constraints
function createResource<T extends z.ZodSchema>(schema: T) {
  // implementation
}

// ❌ Avoid: Using 'any'
function processData(data: any) { }

// ❌ Avoid: Implicit returns without types
const getUser = (id) => { /* ... */ }
```

### Code Style
```typescript
// Use tabs for indentation (Biome configuration)
// Use trailing commas
// Use single quotes
// Use TypeScript strict mode

// ✅ Good: Descriptive naming
const createUserEndpoint = () => { };
const USER_CACHE_TTL = 3600;

// ❌ Avoid: Unclear naming
const fn = () => { };
const t = 3600;
```

### Component Patterns
```typescript
// ✅ Good: Forward refs for components
const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<'button'>
>(({ className, ...props }, ref) => (
  <button ref={ref} className={cn("btn", className)} {...props} />
));

// ✅ Good: Export types
export type ButtonProps = React.ComponentProps<typeof Button>;
```

## 🧪 Testing Guidelines

### Test Structure
```typescript
// Use descriptive test names
describe('betterQuery', () => {
  describe('user resource', () => {
    it('should create user with valid data', async () => {
      // Arrange
      const userData = { name: 'John', email: 'john@example.com' };
      
      // Act
      const result = await query.user.create(userData);
      
      // Assert
      expect(result).toMatchObject({
        success: true,
        data: expect.objectContaining(userData)
      });
    });
  });
});
```

### Test Requirements
- **Unit tests** for utilities and pure functions
- **Integration tests** for database operations
- **Component tests** for React components
- **E2E tests** for complete workflows

### Running Tests
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests for specific package
pnpm --filter better-query test

# Run tests with coverage
pnpm test --coverage
```

## 📖 Documentation Standards

### Code Documentation
```typescript
/**
 * Creates a new Better Query instance with the provided configuration.
 * 
 * @param options - Configuration options for the query instance
 * @returns Configured Better Query instance with CRUD operations
 * 
 * @example
 * ```typescript
 * const query = betterQuery({
 *   database: { provider: "sqlite", url: "./data.db" },
 *   resources: [userResource]
 * });
 * ```
 */
export function betterQuery<T extends QueryOptions>(options: T) {
  // implementation
}
```

### README Standards
- Clear installation instructions
- Working code examples
- API reference
- Common use cases
- Troubleshooting section

## 🔧 Package Development

### Better Query Development
```bash
# Navigate to package
cd packages/better-query

# Run in watch mode
pnpm dev

# Test specific features
pnpm test crud.test.ts
```

## 🐛 Bug Report Guidelines

### Good Bug Reports Include:
1. **Clear title** - Describe the issue briefly
2. **Steps to reproduce** - Exact steps to trigger bug
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happens
5. **Environment details** - OS, Node version, package versions
6. **Code example** - Minimal reproduction case

### Bug Report Template:
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Step one
2. Step two  
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: macOS 12.0
- Node: 18.17.0
- Better Kit: 0.0.1
- Database: SQLite

## Code Example
\`\`\`typescript
// Minimal code that reproduces the issue
\`\`\`
```

## 🎯 Feature Request Guidelines

### Good Feature Requests Include:
1. **Problem statement** - What problem does this solve?
2. **Proposed solution** - How should it work?
3. **Use cases** - When would this be used?
4. **Examples** - Mock API or code examples
5. **Alternatives** - Other solutions considered

## 📋 Pull Request Guidelines

### PR Checklist
- [ ] **Tests pass** - All existing tests still pass
- [ ] **New tests added** - For new functionality
- [ ] **Documentation updated** - README, JSDoc, etc.
- [ ] **TypeScript compiles** - No type errors
- [ ] **Linting passes** - Code follows style guidelines
- [ ] **Build succeeds** - Package builds without errors
- [ ] **Breaking changes documented** - If any

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature  
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests pass
```

## ❓ Getting Help

### Resources
- **📖 Documentation** - [Complete docs](./documentation/README.md)
- **💬 Discussions** - [GitHub Discussions](https://github.com/armelgeek/better-kit/discussions)
- **🐛 Issues** - [Bug reports and features](https://github.com/armelgeek/better-kit/issues)
- **📝 TODO List** - [Planned improvements](./TODO.md)

### Questions?
- Check existing documentation first
- Search closed issues for similar questions
- Open a discussion for general questions
- Open an issue for bugs or feature requests

---

**Thank you for contributing to Better Kit!** 🎉

Every contribution, no matter how small, helps make Better Kit better for everyone.