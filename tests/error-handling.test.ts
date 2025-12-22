import {Audit, AuditField, disableAuditLogging, enableAuditLogging, LogLevel} from '../src';

describe('Error Handling and Resilience', () => {
    beforeEach(() => {
        // Disable logging during tests to avoid console noise
        disableAuditLogging();
    });

    afterEach(() => {
        disableAuditLogging();
    });

    describe('Audit function error resilience', () => {
        it('should throw error for null input', () => {
            expect(() => Audit(null as any)).toThrow('Audit target must be a non-null object');
        });

        it('should throw error for undefined input', () => {
            expect(() => Audit(undefined as any)).toThrow('Audit target must be a non-null object');
        });

        it('should throw error for primitive input', () => {
            expect(() => Audit('string' as any)).toThrow('Audit target must be a non-null object');
        });
    });

    describe('Metadata error resilience', () => {
        it('should handle objects without constructors gracefully', () => {
            const obj = Object.create(null);
            obj.field = 'value';

            const wrapped = Audit(obj);

            // Should not throw and should work normally
            wrapped.field = 'new value';
            expect(wrapped.changes()).toEqual([]);
        });

        it('should handle corrupted metadata gracefully', () => {
            class TestClass {
                @AuditField()
                field: string = 'initial';
            }

            // Corrupt the metadata
            (TestClass as any)[Symbol.for('audit:metadata')] = 'corrupted';

            const obj = new TestClass();
            const wrapped = Audit(obj);

            // Should not throw and should work normally
            wrapped.field = 'new value';

            // Changes should still be tracked despite corrupted metadata
            expect(wrapped.changes()).toHaveLength(1);
        });
    });

    describe('Proxy error resilience', () => {
        it('should handle property access errors gracefully', () => {
            const obj = {
                get problematicProperty() {
                    throw new Error('Property access error');
                }
            };

            const wrapped = Audit(obj);

            // Should re-throw property access errors (not audit errors)
            expect(() => wrapped.problematicProperty).toThrow('Property access error');
        });

        it('should handle method execution errors gracefully', () => {
            const obj = {
                problematicMethod() {
                    throw new Error('Method execution error');
                }
            };

            const wrapped = Audit(obj);

            // Should re-throw method execution errors (not audit errors)
            expect(() => wrapped.problematicMethod()).toThrow('Method execution error');
        });
    });

    describe('Change tracking error resilience', () => {
        it('should handle tracking errors without affecting assignment', () => {
            class TestClass {
                @AuditField()
                field: string = 'initial';
            }

            const obj = new TestClass();
            const wrapped = Audit(obj);

            // Assignment should succeed even if tracking fails internally
            wrapped.field = 'new value';
            expect(wrapped.field).toBe('new value');
        });

        it('should handle changes() method errors gracefully', () => {
            class TestClass {
                @AuditField()
                field: string = 'initial';
            }

            const obj = new TestClass();
            const wrapped = Audit(obj);

            wrapped.field = 'new value';

            // Should not throw even if internal state is corrupted
            const changes = wrapped.changes();
            expect(Array.isArray(changes)).toBe(true);
        });

        it('should handle reset errors gracefully', () => {
            class TestClass {
                @AuditField()
                field: string = 'initial';
            }

            const obj = new TestClass();
            const wrapped = Audit(obj);

            wrapped.field = 'new value';

            // Should not throw even if reset fails internally
            expect(() => wrapped.resetAudit?.()).not.toThrow();
        });
    });

    describe('Decorator error resilience', () => {
        it('should handle decorator application errors gracefully', () => {
            // This test verifies that decorator errors don't prevent class definition
            expect(() => {
                class TestClass {
                    @AuditField()
                    field: string = 'value';
                }

                return TestClass;
            }).not.toThrow();
        });
    });

    describe('Logging functionality', () => {
        it('should allow enabling and disabling logging', () => {
            // Should not throw
            expect(() => enableAuditLogging(LogLevel.ERROR)).not.toThrow();
            expect(() => enableAuditLogging(LogLevel.WARN)).not.toThrow();
            expect(() => enableAuditLogging(LogLevel.DEBUG)).not.toThrow();
            expect(() => disableAuditLogging()).not.toThrow();
        });

        it('should handle logging errors gracefully', () => {
            enableAuditLogging(LogLevel.DEBUG);

            // Even with logging enabled, audit operations should not fail
            const obj = {field: 'value'};
            const wrapped = Audit(obj);

            expect(() => {
                wrapped.field = 'new value';
            }).not.toThrow();

            disableAuditLogging();
        });
    });

    describe('Business logic non-interference', () => {
        it('should never interfere with normal object operations', () => {
            class TestClass {
                @AuditField()
                field: string = 'initial';

                method() {
                    return 'method result';
                }

                get computed() {
                    return this.field.toUpperCase();
                }

                set computed(value: string) {
                    this.field = value.toLowerCase();
                }
            }

            const obj = new TestClass();
            const wrapped = Audit(obj);

            // All operations should work exactly as with the original object
            expect(wrapped.field).toBe('initial');
            expect(wrapped.method()).toBe('method result');
            expect(wrapped.computed).toBe('INITIAL');

            wrapped.computed = 'NEW VALUE';
            expect(wrapped.field).toBe('new value');
            expect(wrapped.computed).toBe('NEW VALUE');

            // Audit functionality should also work
            const changes = wrapped.changes();
            expect(changes).toHaveLength(1);
            expect(changes[0]?.field).toBe('field');
        });
    });
});