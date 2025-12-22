/**
 * Tests for TypeScript compilation and type checking
 * Ensures the library works correctly with TypeScript's type system
 */

import {Audit, AuditHandle, ChangeRecord} from '../src';
import {Auditable, AuditField, AuditIgnore} from '../src/decorators';

describe('TypeScript Integration', () => {
    describe('Type preservation', () => {
        it('should preserve original object types', () => {
            class TestClass {
                @AuditField()
                stringField: string = 'test';

                @AuditField()
                numberField: number = 42;

                @AuditField()
                booleanField: boolean = true;

                @AuditField()
                arrayField: string[] = ['a', 'b'];

                @AuditField()
                objectField: { nested: string } = {nested: 'value'};
            }

            const obj = new TestClass();
            const wrapped = Audit(obj);

            // TypeScript should infer correct types
            const str: string = wrapped.stringField;
            const num: number = wrapped.numberField;
            const bool: boolean = wrapped.booleanField;
            const arr: string[] = wrapped.arrayField;
            const nested: { nested: string } = wrapped.objectField;

            expect(typeof str).toBe('string');
            expect(typeof num).toBe('number');
            expect(typeof bool).toBe('boolean');
            expect(Array.isArray(arr)).toBe(true);
            expect(typeof nested).toBe('object');

            // Type-safe assignments
            wrapped.stringField = 'new string';
            wrapped.numberField = 100;
            wrapped.booleanField = false;
            wrapped.arrayField = ['x', 'y'];
            wrapped.objectField = {nested: 'new value'};

            expect(wrapped.stringField).toBe('new string');
            expect(wrapped.numberField).toBe(100);
            expect(wrapped.booleanField).toBe(false);
            expect(wrapped.arrayField).toEqual(['x', 'y']);
            expect(wrapped.objectField.nested).toBe('new value');
        });

        it('should work with generic types', () => {
            @Auditable()
            class GenericContainer<T> {
                value: T;

                constructor(value: T) {
                    this.value = value;
                }

                getValue(): T {
                    return this.value;
                }

                setValue(newValue: T): void {
                    this.value = newValue;
                }
            }

            // String container
            const stringContainer = new GenericContainer<string>('initial');
            const wrappedString = Audit(stringContainer);

            const stringValue: string = wrappedString.getValue();
            expect(stringValue).toBe('initial');

            wrappedString.setValue('updated');
            expect(wrappedString.getValue()).toBe('updated');

            // Number container
            const numberContainer = new GenericContainer<number>(42);
            const wrappedNumber = Audit(numberContainer);

            const numberValue: number = wrappedNumber.getValue();
            expect(numberValue).toBe(42);

            wrappedNumber.setValue(100);
            expect(wrappedNumber.getValue()).toBe(100);

            // Complex type container
            interface ComplexType {
                id: number;
                name: string;
            }

            const complexContainer = new GenericContainer<ComplexType>({id: 1, name: 'test'});
            const wrappedComplex = Audit(complexContainer);

            const complexValue: ComplexType = wrappedComplex.getValue();
            expect(complexValue.id).toBe(1);
            expect(complexValue.name).toBe('test');
        });

        it('should work with union types', () => {
            @Auditable()
            class UnionTypeClass {
                value: string | number | boolean = 'initial';

                setValue(newValue: string | number | boolean): void {
                    this.value = newValue;
                }
            }

            const obj = new UnionTypeClass();
            const wrapped = Audit(obj);

            // Should accept all union type values
            wrapped.value = 'string value';
            expect(wrapped.value).toBe('string value');

            wrapped.value = 42;
            expect(wrapped.value).toBe(42);

            wrapped.value = true;
            expect(wrapped.value).toBe(true);

            wrapped.setValue('method set');
            expect(wrapped.value).toBe('method set');
        });

        it('should work with optional properties', () => {
            @Auditable()
            class OptionalPropsClass {
                required: string = 'required';
                optional?: string;
                nullableOptional?: string | null;
            }

            const obj = new OptionalPropsClass();
            const wrapped = Audit(obj);

            expect(wrapped.required).toBe('required');
            expect(wrapped.optional).toBeUndefined();
            expect(wrapped.nullableOptional).toBeUndefined();

            wrapped.optional = 'now defined';
            wrapped.nullableOptional = 'also defined';

            expect(wrapped.optional).toBe('now defined');
            expect(wrapped.nullableOptional).toBe('also defined');

            wrapped.nullableOptional = null;
            expect(wrapped.nullableOptional).toBeNull();
        });
    });

    describe('Interface compatibility', () => {
        it('should work with interface implementations', () => {
            interface Auditable {
                id: number;
                name: string;

                update(name: string): void;
            }

            @Auditable()
            class AuditableImpl implements Auditable {
                id: number = 1;
                name: string = 'test';

                update(name: string): void {
                    this.name = name;
                }
            }

            const obj = new AuditableImpl();
            const wrapped = Audit(obj);

            // Should satisfy interface
            const auditable: Auditable = wrapped;
            expect(auditable.id).toBe(1);
            expect(auditable.name).toBe('test');

            auditable.update('updated');
            expect(auditable.name).toBe('updated');
        });

        it('should work with extending interfaces', () => {
            interface BaseInterface {
                baseField: string;
            }

            interface ExtendedInterface extends BaseInterface {
                extendedField: number;
            }

            @Auditable()
            class InterfaceImpl implements ExtendedInterface {
                baseField: string = 'base';
                extendedField: number = 42;
            }

            const obj = new InterfaceImpl();
            const wrapped = Audit(obj);

            const extended: ExtendedInterface = wrapped;
            expect(extended.baseField).toBe('base');
            expect(extended.extendedField).toBe(42);

            extended.baseField = 'new base';
            extended.extendedField = 100;

            expect(extended.baseField).toBe('new base');
            expect(extended.extendedField).toBe(100);
        });
    });

    describe('AuditHandle interface', () => {
        it('should properly implement AuditHandle interface', () => {
            @Auditable()
            class TestClass {
                field: string = 'test';
            }

            const obj = new TestClass();
            const wrapped = Audit(obj);

            // Should satisfy AuditHandle interface
            const auditHandle: AuditHandle = wrapped;
            expect(typeof auditHandle.changes).toBe('function');
            expect(typeof auditHandle.resetAudit).toBe('function');

            // Should return proper ChangeRecord array
            wrapped.field = 'updated';
            const changes: ChangeRecord[] = auditHandle.changes();

            expect(Array.isArray(changes)).toBe(true);
            expect(changes).toHaveLength(1);

            const change: ChangeRecord = changes[0]!;
            expect(typeof change.field).toBe('string');
            expect(change.field).toBe('field');
            expect(change.oldValue).toBe('test');
            expect(change.newValue).toBe('updated');
        });

        it('should work with intersection types', () => {
            @Auditable()
            class TestClass {
                value: string = 'test';

                getValue(): string {
                    return this.value;
                }
            }

            const obj = new TestClass();
            const wrapped = Audit(obj);

            // Should be both TestClass and AuditHandle
            type WrappedType = TestClass & AuditHandle;
            const typedWrapped: WrappedType = wrapped;

            // TestClass methods should work
            expect(typedWrapped.getValue()).toBe('test');
            typedWrapped.value = 'updated';
            expect(typedWrapped.getValue()).toBe('updated');

            // AuditHandle methods should work
            const changes = typedWrapped.changes();
            expect(changes).toHaveLength(1);

            typedWrapped.resetAudit?.();
            expect(typedWrapped.changes()).toHaveLength(0);
        });
    });

    describe('Decorator type safety', () => {
        it('should work with properly typed decorators', () => {
            // This test mainly ensures TypeScript compilation works correctly
            expect(() => {
                @Auditable()
                class DecoratedClass {
                    @AuditField()
                    field1: string = 'test1';

                    @AuditIgnore()
                    field2: string = 'test2';

                    @AuditField()
                    @AuditIgnore() // Should handle multiple decorators
                    field3: string = 'test3';
                }

                const obj = new DecoratedClass();
                const wrapped = Audit(obj);

                wrapped.field1 = 'new1';
                wrapped.field2 = 'new2';
                wrapped.field3 = 'new3';

                return wrapped.changes();
            }).not.toThrow();
        });
    });

    describe('Method signature preservation', () => {
        it('should preserve method signatures and return types', () => {
            @Auditable()
            class MethodClass {
                value: string = 'initial';

                getString(): string {
                    return this.value;
                }

                getNumber(): number {
                    return this.value.length;
                }

                getBoolean(): boolean {
                    return this.value.length > 0;
                }

                getArray(): string[] {
                    return this.value.split('');
                }

                getObject(): { length: number; value: string } {
                    return {length: this.value.length, value: this.value};
                }

                async getPromise(): Promise<string> {
                    return Promise.resolve(this.value);
                }

                setMultiple(str: string, num: number, bool: boolean): void {
                    this.value = `${str}-${num}-${bool}`;
                }
            }

            const obj = new MethodClass();
            const wrapped = Audit(obj);

            // Return types should be preserved
            const str: string = wrapped.getString();
            const num: number = wrapped.getNumber();
            const bool: boolean = wrapped.getBoolean();
            const arr: string[] = wrapped.getArray();
            const obj2: { length: number; value: string } = wrapped.getObject();

            expect(str).toBe('initial');
            expect(num).toBe(7);
            expect(bool).toBe(true);
            expect(arr).toEqual(['i', 'n', 'i', 't', 'i', 'a', 'l']);
            expect(obj2.length).toBe(7);
            expect(obj2.value).toBe('initial');

            // Async methods should work
            wrapped.getPromise().then((result: string) => {
                expect(result).toBe('initial');
            });

            // Multiple parameter methods should work
            wrapped.setMultiple('test', 42, true);
            expect(wrapped.value).toBe('test-42-true');
        });
    });

    describe('Strict TypeScript settings compatibility', () => {
        it('should work with strict null checks', () => {
            @Auditable()
            class StrictClass {
                nonNullField: string = 'non-null';
                nullableField: string | null = null;
                undefinedField: string | undefined = undefined;
                optionalField?: string;
            }

            const obj = new StrictClass();
            const wrapped = Audit(obj);

            // Non-null field
            wrapped.nonNullField = 'updated';
            expect(wrapped.nonNullField).toBe('updated');

            // Nullable field
            wrapped.nullableField = 'not null anymore';
            expect(wrapped.nullableField).toBe('not null anymore');

            wrapped.nullableField = null;
            expect(wrapped.nullableField).toBeNull();

            // Undefined field
            wrapped.undefinedField = 'defined';
            expect(wrapped.undefinedField).toBe('defined');

            wrapped.undefinedField = undefined;
            expect(wrapped.undefinedField).toBeUndefined();

            // Optional field
            wrapped.optionalField = 'optional value';
            expect(wrapped.optionalField).toBe('optional value');
        });

        it('should handle readonly properties appropriately', () => {
            @Auditable()
            class ReadonlyClass {
                readonly readonlyField: string = 'readonly';
                mutableField: string = 'mutable';
            }

            const obj = new ReadonlyClass();
            const wrapped = Audit(obj);

            // Readonly field should be accessible
            expect(wrapped.readonlyField).toBe('readonly');

            // Mutable field should work normally
            wrapped.mutableField = 'updated';
            expect(wrapped.mutableField).toBe('updated');

            // TypeScript would prevent this at compile time:
            // wrapped.readonlyField = 'new value'; // Should cause TS error
        });
    });
});