# NestJS + TypeORM + PostgreSQL Audit Example

This example demonstrates how to use `@snow-tzu/audit` with NestJS, TypeORM, and PostgreSQL to track entity changes within database transactions.

## Features

- 🏢 **User and Company entities** with audit tracking
- 📊 **Transaction-based audit logging** - Track multiple entity changes in a single transaction
- 🔄 **Automatic audit trail** - Changes are automatically captured and stored
- 🎯 **Selective field tracking** - Choose which fields to audit
- 🚫 **Field exclusion** - Exclude sensitive fields from audit logs
- 📝 **Comprehensive logging** - Detailed logs for all audit operations and HTTP requests
- 🔍 **Debug mode** - Enable detailed audit library logging for development

## Setup

### 1. Install Dependencies

```bash
# From the root directory
yarn install
```

### 2. Start PostgreSQL

Using Docker:
```bash
docker run --name audit-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_USER=audit_user \
  -e POSTGRES_DB=audit_db \
  -p 5432:5432 \
  -d postgres:15
```

### 3. Run Migrations

```bash
cd examples/nestjs-typeorm
yarn migration:run
```

### 4. Start the Application

```bash
yarn start:dev
```

The application will start with comprehensive logging enabled. You'll see:
- 🚀 Application startup logs
- 📥 HTTP request logs  
- 🔍 Audit library debug logs (in development mode)
- 📝 Database transaction logs
- ✅ Audit trail creation logs

Logs are written to both console and files in the `logs/` directory.

## API Endpoints

### Create User and Company (with audit tracking)

```bash
POST http://localhost:3000/users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "companyName": "Acme Corp",
  "companyIndustry": "Technology"
}
```

### Update User (with audit tracking)

```bash
PUT http://localhost:3000/users/1
Content-Type: application/json

{
  "name": "John Smith",
  "email": "john.smith@example.com"
}
```

### Get Audit Logs

```bash
GET http://localhost:3000/audit-logs
```

## How It Works

### 1. Entity Definition with Audit Decorators

```typescript
@Entity()
@Auditable()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  email: string;

  @AuditIgnore()
  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastLogin: Date;
}
```

### 2. Service with Transaction and Audit Tracking

```typescript
@Injectable()
export class UserService {
  async createUserWithCompany(userData: CreateUserDto): Promise<User> {
    return this.dataSource.transaction(async manager => {
      // Create and track company changes
      const company = new Company();
      const auditedCompany = Audit(company);
      auditedCompany.name = userData.companyName;
      auditedCompany.industry = userData.companyIndustry;
      
      const savedCompany = await manager.save(auditedCompany);
      
      // Create and track user changes
      const user = new User();
      const auditedUser = Audit(user);
      auditedUser.name = userData.name;
      auditedUser.email = userData.email;
      auditedUser.company = savedCompany;
      
      const savedUser = await manager.save(auditedUser);
      
      // Save audit logs for both entities in the same transaction
      await this.saveAuditLogs(manager, [
        { entity: 'Company', entityId: savedCompany.id, changes: auditedCompany.changes() },
        { entity: 'User', entityId: savedUser.id, changes: auditedUser.changes() }
      ]);
      
      return savedUser;
    });
  }
}
```

### 3. Audit Log Storage

All changes are captured and stored in an `audit_logs` table with:
- Entity type and ID
- Field name, old value, new value
- Timestamp and transaction ID
- User context (if available)

## Audit Storage Strategies

The example demonstrates a per-field audit storage approach, but you can choose different strategies based on your needs:

### 1. Per-Field Storage (Current Implementation)
Each field change is stored as a separate audit log record:

```typescript
// Results in multiple audit_logs records
await this.saveAuditLogs(manager, [
  { entity: 'User', entityId: 1, field: 'name', oldValue: 'John', newValue: 'John Smith' },
  { entity: 'User', entityId: 1, field: 'email', oldValue: 'john@example.com', newValue: 'john.smith@example.com' }
]);
```

**Benefits**: Easy querying by field, detailed granular history
**Use case**: When you need to track individual field changes over time

### 2. Per-Entity Storage (JSONB Approach)
Store all changes for an entity in a single record using PostgreSQL JSONB:

```typescript
// Modified audit log entity
@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  entityType: string;

  @Column()
  entityId: number;

  @Column('jsonb')
  changes: ChangeRecord[]; // Store entire changes array as JSONB

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}

// Usage in service
async saveEntityAuditLog(manager: EntityManager, entityType: string, entityId: number, changes: ChangeRecord[]) {
  if (changes.length === 0) return;
  
  const auditLog = new AuditLog();
  auditLog.entityType = entityType;
  auditLog.entityId = entityId;
  auditLog.changes = changes; // PostgreSQL automatically handles JSONB serialization
  
  await manager.save(auditLog);
}
```

**Benefits**: Fewer database records, atomic change sets, efficient for bulk operations
**Use case**: When you want to see complete change sets per operation

### 3. Per-Request Storage (Transaction-Level JSONB)
Store all changes from a single request/transaction in one record:

```typescript
@Entity()
export class RequestAuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  transactionId: string;

  @Column()
  userId?: number; // Optional user context

  @Column('jsonb')
  entityChanges: Array<{
    entityType: string;
    entityId: number;
    changes: ChangeRecord[];
  }>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;
}

// Usage in service
async createUserWithCompany(userData: CreateUserDto): Promise<User> {
  return this.dataSource.transaction(async manager => {
    const transactionId = randomUUID();
    
    // ... create entities with audit tracking ...
    
    // Save all changes from this request in a single record
    await this.saveRequestAuditLog(manager, transactionId, [
      { entityType: 'Company', entityId: savedCompany.id, changes: auditedCompany.changes() },
      { entityType: 'User', entityId: savedUser.id, changes: auditedUser.changes() }
    ]);
    
    return savedUser;
  });
}
```

**Benefits**: Complete request context, easy correlation of related changes, minimal database records
**Use case**: When you need to track business operations that span multiple entities

### 4. Hybrid Approach
Combine strategies based on your querying needs:

```typescript
// Store both per-field records for detailed queries AND per-request JSONB for context
async saveHybridAuditLogs(manager: EntityManager, transactionId: string, entityChanges: EntityChange[]) {
  // Save detailed per-field records
  await this.saveDetailedAuditLogs(manager, entityChanges);
  
  // Save consolidated request-level record
  await this.saveRequestAuditLog(manager, transactionId, entityChanges);
}
```

### JSONB Query Examples

With JSONB storage, you can leverage PostgreSQL's powerful JSON operators:

```sql
-- Find all changes to a specific field across entities
SELECT * FROM audit_logs 
WHERE changes @> '[{"field": "email"}]';

-- Find records where any field changed from a specific value
SELECT * FROM audit_logs 
WHERE changes @> '[{"oldValue": "john@example.com"}]';

-- Extract specific field changes
SELECT 
  entity_type,
  entity_id,
  jsonb_path_query_array(changes, '$[*] ? (@.field == "email")') as email_changes
FROM audit_logs;

-- Count changes by field name
SELECT 
  jsonb_path_query(changes, '$[*].field') as field_name,
  COUNT(*)
FROM audit_logs
GROUP BY field_name;
```

Choose the strategy that best fits your audit requirements, query patterns, and storage constraints.

## Key Benefits

1. **Non-intrusive**: No changes to existing entity definitions
2. **Transaction-safe**: All audit logs are saved within the same database transaction
3. **Type-safe**: Full TypeScript support with decorator-based configuration
4. **Selective tracking**: Choose exactly which fields to audit
5. **Performance**: Minimal overhead with efficient change detection
6. **Observable**: Comprehensive logging shows exactly what's happening during audit operations

## Logging Features

The example includes comprehensive logging to demonstrate audit tracking in action:

### Application Logs
- **HTTP Request/Response** - All API calls with timing and status codes
- **Database Transactions** - Transaction IDs and operation details
- **Audit Operations** - Field changes, audit log creation, and timing
- **Error Handling** - Detailed error logs with context

### Audit Library Logs  
- **Change Detection** - When fields are modified and tracked
- **Proxy Creation** - Object wrapping and audit setup
- **Metadata Processing** - Decorator metadata handling

### Log Levels
- `ERROR` - Critical errors and failures
- `WARN` - Warnings and potential issues  
- `INFO` - General application flow (default)
- `DEBUG` - Detailed audit operations (development only)

### Log Files
- `logs/error.log` - Error-level logs only
- `logs/combined.log` - All log levels
- Console output with colors for development

## Database Schema

The example creates the following tables:
- `users` - User entities
- `companies` - Company entities  
- `audit_logs` - Audit trail records

See the migration files in `src/migrations/` for the complete schema.