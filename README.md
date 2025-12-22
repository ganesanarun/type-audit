# @snow-tzu/audit

Transparent audit tracking for object field changes in TypeScript applications. Non-intrusive proxy-based tracking that preserves original object behavior while passively collecting audit information.

[![npm](https://img.shields.io/npm/v/@snow-tzu/audit)](https://www.npmjs.com/package/@snow-tzu/audit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![build.yml](https://github.com/ganesanarun/type-audit/actions/workflows/build.yml/badge.svg)](https://github.com/ganesanarun/type-audit/actions/workflows/build.yml)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
- [Examples](#examples)
- [Performance](#performance)
  - [Benchmarks](#benchmarks)
- [Why @snow-tzu/audit?](#why-snow-tzuaudit)
- [Requirements](#requirements)
- [Contributing](#contributing)
- [License](#license)

## Features

✨ **Field-level tracking** - `@AuditField()` decorator for selective field monitoring  
🎯 **Class-level tracking** - `@Auditable()` decorator for comprehensive audit coverage  
🚫 **Field exclusion** - `@AuditIgnore()` decorator to exclude sensitive fields  
🔍 **Non-intrusive proxies** - Preserve original object behavior and method context  
🛡️ **Type safety** - Full TypeScript support with strong typing  
📊 **Change history** - Retrieve all tracked changes with `changes()`  
🔄 **Reset functionality** - Clear audit history without affecting object state  
⚡ **Robust error handling** - Never disrupts business logic execution  
🐛 **Optional logging** - Built-in debugging utilities

## Installation

```bash
yarn add @snow-tzu/audit
# or
npm install @snow-tzu/audit
```

## Quick Start

### 1. Field-Level Tracking

```typescript
import { Audit, AuditField } from '@snow-tzu/audit';

class User {
  @AuditField()
  email: string = '';
  
  name: string = ''; // Not tracked
}

const user = new User();
const audited = Audit(user);

audited.email = 'john@example.com';
audited.name = 'John Doe';

console.log(audited.changes());
// [{ field: 'email', oldValue: '', newValue: 'john@example.com' }]
```

### 2. Class-Level Tracking

```typescript
import { Audit, Auditable, AuditIgnore } from '@snow-tzu/audit';

@Auditable()
class Product {
  id: number = 0;
  name: string = '';
  
  @AuditIgnore()
  internalCode: string = ''; // Excluded from tracking
}

const product = new Product();
const audited = Audit(product);

audited.id = 123;
audited.name = 'Widget';
audited.internalCode = 'X123';

console.log(audited.changes());
// [
//   { field: 'id', oldValue: 0, newValue: 123 },
//   { field: 'name', oldValue: '', newValue: 'Widget' }
// ]
```

### 3. Reset Audit History

```typescript
const audited = Audit(new User());
audited.email = 'test@example.com';

console.log(audited.changes().length); // 1

audited.resetAudit?.();
console.log(audited.changes().length); // 0
```

## API Reference

### Main Function

#### `Audit<T>(target: T): T & AuditHandle`
Wraps an object for audit tracking while preserving all original behavior.

**Parameters:**
- `target` - The object to wrap with audit tracking

**Returns:** A wrapped object that behaves identically to the original while tracking changes

### Decorators

#### `@AuditField()`
Property decorator that marks individual fields for audit tracking.

```typescript
class Example {
  @AuditField()
  trackedField: string = '';
}
```

#### `@Auditable()`
Class decorator that marks all fields in a class for audit tracking.

```typescript
@Auditable()
class Example {
  field1: string = ''; // Tracked
  field2: number = 0;  // Tracked
}
```

#### `@AuditIgnore()`
Property decorator that excludes specific fields from tracking when used with `@Auditable()`.

```typescript
@Auditable()
class Example {
  tracked: string = '';
  
  @AuditIgnore()
  ignored: string = ''; // Not tracked
}
```

### Interfaces

#### `AuditHandle`
```typescript
interface AuditHandle {
  changes(): ChangeRecord[];
  resetAudit?(): void;
}
```

#### `ChangeRecord`
```typescript
interface ChangeRecord {
  readonly field: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
}
```

### Utilities

#### `enableAuditLogging(level?: LogLevel)`
Enable debug logging for audit operations.

#### `disableAuditLogging()`
Disable audit logging.

#### `LogLevel`
```typescript
enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  DEBUG = 'DEBUG'
}
```

## Examples

👉 **[NestJS + TypeORM Example](./examples/nestjs-typeorm)** - Complete audit tracking with PostgreSQL

### Complex Object Tracking

```typescript
@Auditable()
class Order {
  id: number = 0;
  items: string[] = [];
  
  @AuditIgnore()
  internalNotes: string = '';
  
  calculateTotal(): number {
    return this.items.length * 10;
  }
}

const order = new Order();
const audited = Audit(order);

// Method calls work normally
console.log(audited.calculateTotal()); // 0

// Field changes are tracked
audited.id = 123;
audited.items = ['item1', 'item2'];
audited.internalNotes = 'secret'; // Not tracked

console.log(audited.changes());
console.log(audited.calculateTotal()); // 20
// [
//   { field: 'id', oldValue: 0, newValue: 123 },
//   { field: 'items', oldValue: [], newValue: ['item1', 'item2'] }
// ]
```

### Inheritance Support

```typescript
@Auditable()
class BaseEntity {
  id: number = 0;
  createdAt: Date = new Date();
}

class User extends BaseEntity {
  @AuditField()
  email: string = '';
  
  name: string = ''; // Tracked via inheritance
}

const user = new User();
const audited = Audit(user);

audited.id = 1;
audited.email = 'user@example.com';
audited.name = 'John';

console.log(audited.changes().length); // 3 changes tracked
```

## Performance

@snow-tzu/audit is designed for production use with minimal overhead:

- ⚡ **Fast proxy creation** - Efficient object wrapping
- 🚀 **Negligible field access overhead** - Transparent property access
- 📊 **Efficient change detection** - Smart change tracking and collapsing
- 🔋 **Minimal memory footprint** - ~0.2KB per tracked object

### Benchmarks

The library includes comprehensive benchmarks to measure real-world performance impact:

#### Latest Results (Node.js v24.5.0, macOS ARM64)

| Metric | Unwrapped | Wrapped | Overhead |
|--------|-----------|---------|----------|
| **Assignment Performance** | 1.34M ops/sec | 0.59M ops/sec | **+56.1%** |
| **Memory Usage** | ~0 KB | 0.21 KB | **+0.21 KB per object** |

*The optimized implementation provides excellent performance with minimal memory overhead.*


## Why @snow-tzu/audit?

### vs. Manual Change Tracking

| Feature | @snow-tzu/audit | Manual Tracking |
|---------|-----------------|-----------------|
| **Setup complexity** | ✅ Decorator-based | ❌ Boilerplate code |
| **Type safety** | ✅ Full TypeScript | ⚠️ Manual typing |
| **Non-intrusive** | ✅ Transparent proxies | ❌ Code modification |
| **Error handling** | ✅ Built-in resilience | ❌ Manual implementation |
| **Performance** | ✅ Optimized proxies | ⚠️ Varies |

### vs. Object.observe() (Deprecated)

| Feature | @snow-tzu/audit | Object.observe |
|---------|-----------------|----------------|
| **Browser support** | ✅ All modern browsers | ❌ Deprecated |
| **Selective tracking** | ✅ Decorator-based | ❌ All properties |
| **TypeScript support** | ✅ Native | ❌ No types |
| **Change collapsing** | ✅ Smart merging | ❌ Raw events |

## Requirements

- Node.js 16+ or modern browsers
- TypeScript 4.5+ (for decorator support)
- `experimentalDecorators: true` in tsconfig.json

## Contributing

We welcome contributions! 

## License

MIT © Ganesan Arunachalam

## Complete Examples

Check out the [examples directory](./examples/) for fully working projects:

- **[NestJS + TypeORM + PostgreSQL](./examples/nestjs-typeorm/)** - Complete audit tracking with database transactions

Each example includes:
- 🚀 Ready-to-run setup with Docker
- 📊 Database schema and migrations  
- 🔄 Transaction-based audit logging
- 🎯 Real-world usage patterns
- 📝 API examples and documentation

## Support

- 🐛 [Issues](https://github.com/ganesanarun/type-audit/issues)
- 💬 [Discussions](https://github.com/ganesanarun/type-audit/discussions)