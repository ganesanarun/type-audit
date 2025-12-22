/**
 * Tests for public API exports
 * Validates that all public APIs are accessible and work correctly
 */

import {
    Audit,
    Auditable,
    AuditField,
    AuditHandle,
    AuditIgnore,
    ChangeRecord,
    disableAuditLogging,
    enableAuditLogging,
    LogLevel
} from '../src';

describe('Public API Exports', () => {
    describe('Main Audit function', () => {
        it('should be exported and callable', () => {
            class TestClass {
                @AuditField()
                name: string = '';
            }

            const obj = new TestClass();
            const wrapped = Audit(obj);

            expect(wrapped).toBeDefined();
            expect(typeof wrapped.changes).toBe('function');
        });
    });

    describe('Decorator exports', () => {
        it('should export AuditField decorator', () => {
            expect(typeof AuditField).toBe('function');

            class TestClass {
                @AuditField()
                field: string = '';
            }

            const obj = new TestClass();
            const wrapped = Audit(obj);
            wrapped.field = 'test';

            expect(wrapped.changes()).toHaveLength(1);
        });

        it('should export Auditable (class decorator)', () => {
            expect(typeof Auditable).toBe('function');

            @Auditable()
            class TestClass {
                field: string = '';
            }

            const obj = new TestClass();
            const wrapped = Audit(obj);
            wrapped.field = 'test';

            expect(wrapped.changes()).toHaveLength(1);
        });

        it('should export AuditIgnore decorator', () => {
            expect(typeof AuditIgnore).toBe('function');

            @Auditable()
            class TestClass {
                field1: string = '';

                @AuditIgnore()
                field2: string = '';
            }

            const obj = new TestClass();
            const wrapped = Audit(obj);
            wrapped.field1 = 'test1';
            wrapped.field2 = 'test2';

            const changes = wrapped.changes();
            expect(changes).toHaveLength(1);
            expect(changes[0]?.field).toBe('field1');
        });
    });

    describe('Type exports', () => {
        it('should export AuditHandle interface', () => {
            class TestClass {
                @AuditField()
                name: string = '';
            }

            const obj = new TestClass();
            const wrapped: AuditHandle = Audit(obj);

            expect(typeof wrapped.changes).toBe('function');
        });

        it('should export ChangeRecord interface', () => {
            class TestClass {
                @AuditField()
                name: string = '';
            }

            const obj = new TestClass();
            const wrapped = Audit(obj);
            wrapped.name = 'test';

            const changes: ChangeRecord[] = wrapped.changes();
            expect(changes).toHaveLength(1);
            expect(changes[0]?.field).toBe('name');
            expect(changes[0]?.oldValue).toBe('');
            expect(changes[0]?.newValue).toBe('test');
        });
    });

    describe('Utility exports', () => {
        it('should export logging utilities', () => {
            expect(typeof enableAuditLogging).toBe('function');
            expect(typeof disableAuditLogging).toBe('function');
            expect(LogLevel).toBeDefined();
            expect(LogLevel.ERROR).toBe('ERROR');
            expect(LogLevel.WARN).toBe('WARN');
            expect(LogLevel.DEBUG).toBe('DEBUG');
        });

        it('should allow enabling and disabling logging', () => {
            expect(() => {
                enableAuditLogging(LogLevel.DEBUG);
                disableAuditLogging();
            }).not.toThrow();
        });
    });

    describe('Integration test', () => {
        it('should work with all exports together', () => {
            @Auditable()
            class User {
                @AuditIgnore()
                id: number = 0;

                name: string = '';

                @AuditField()
                email: string = '';
            }

            const user = new User();
            const wrapped = Audit(user);

            wrapped.id = 123;
            wrapped.name = 'John';
            wrapped.email = 'john@example.com';

            const changes: ChangeRecord[] = wrapped.changes();

            // id should not be tracked (ignored)
            // name should be tracked (class-level audit)
            // email should be tracked (field-level audit)
            expect(changes).toHaveLength(2);

            const fields = changes.map(c => c.field).sort();
            const nameField: ChangeRecord | undefined = changes.find(c => c.field === 'name');
            const emailField: ChangeRecord | undefined = changes.find(c => c.field === 'email');
            expect(fields).toEqual(['email', 'name']);
            expect(nameField).toBeDefined();
            expect(emailField).toBeDefined();
            expect(nameField?.oldValue).toBe('');
            expect(nameField?.newValue).toBe('John');
            expect(emailField?.oldValue).toBe('');
            expect(emailField?.newValue).toBe('john@example.com');

        });
    });
});
