/**
 * Tests for decorator functionality with various class structures
 * Covers inheritance, complex hierarchies, and different class patterns
 */

import {Audit} from '../src';
import {Auditable, AuditField, AuditIgnore} from '../src/decorators';

describe('Inheritance and Complex Class Structures', () => {
    describe('Basic inheritance', () => {
        it('should handle simple inheritance with field-level decorators', () => {
            class BaseClass {
                @AuditField()
                baseField: string = 'base';
            }

            class DerivedClass extends BaseClass {
                @AuditField()
                derivedField: string = 'derived';
            }

            const obj = new DerivedClass();
            const wrapped = Audit(obj);

            wrapped.baseField = 'new base';
            wrapped.derivedField = 'new derived';

            const changes = wrapped.changes();
            expect(changes).toHaveLength(2);

            const fields = changes.map(c => c.field).sort();
            expect(fields).toEqual(['baseField', 'derivedField']);
        });

        it('should handle inheritance with class-level decorators', () => {
            @Auditable()
            class BaseClass {
                baseField: string = 'base';
                baseField2: string = 'base2';
            }

            @Auditable()
            class DerivedClass extends BaseClass {
                derivedField: string = 'derived';
            }

            const obj = new DerivedClass();
            const wrapped = Audit(obj);

            wrapped.baseField = 'new base';
            wrapped.baseField2 = 'new base2';
            wrapped.derivedField = 'new derived';

            const changes = wrapped.changes();
            expect(changes).toHaveLength(3);

            const fields = changes.map(c => c.field).sort();
            expect(fields).toEqual(['baseField', 'baseField2', 'derivedField']);
        });

        it('should handle mixed decorator inheritance patterns', () => {
            @Auditable()
            class BaseClass {
                baseField: string = 'base';

                @AuditIgnore()
                ignoredBase: string = 'ignored';
            }

            class DerivedClass extends BaseClass {
                @AuditField()
                derivedField: string = 'derived';

                normalField: string = 'normal';
            }
            const obj = new DerivedClass();
            const wrapped = Audit(obj);

            wrapped.baseField = 'new base';
            wrapped.ignoredBase = 'new ignored';
            wrapped.derivedField = 'new derived';
            wrapped.normalField = 'new normal';

            const changes = wrapped.changes();
            expect(changes.length).toBeGreaterThanOrEqual(3);
            const fields = changes.map(c => c.field).sort();
            expect(fields).toContain('baseField');
            expect(fields).toContain('derivedField');
            expect(fields).toContain('normalField');
            expect(fields).not.toContain('ignoredBase');
        });
    });

    describe('Multi-level inheritance', () => {
        it('should handle deep inheritance hierarchies', () => {
            @Auditable()
            class GrandParent {
                grandParentField: string = 'grandparent';
            }

            class Parent extends GrandParent {
                @AuditField()
                parentField: string = 'parent';
            }

            class Child extends Parent {
                @AuditField()
                childField: string = 'child';

                @AuditIgnore()
                ignoredChild: string = 'ignored';
            }

            const obj = new Child();
            const wrapped = Audit(obj);

            wrapped.grandParentField = 'new grandparent';
            wrapped.parentField = 'new parent';
            wrapped.childField = 'new child';
            wrapped.ignoredChild = 'new ignored';

            const changes = wrapped.changes();
            expect(changes).toHaveLength(3);

            const fields = changes.map(c => c.field).sort();
            expect(fields).toEqual(['childField', 'grandParentField', 'parentField']);
        });
    });

    describe('Abstract classes and interfaces', () => {
        it('should handle abstract base classes', () => {
            abstract class AbstractBase {
                @AuditField()
                abstractField: string = 'abstract';

                abstract abstractMethod(): string;
            }

            class ConcreteClass extends AbstractBase {
                @AuditField()
                concreteField: string = 'concrete';

                abstractMethod(): string {
                    return 'implemented';
                }
            }

            const obj = new ConcreteClass();
            const wrapped = Audit(obj);

            wrapped.abstractField = 'new abstract';
            wrapped.concreteField = 'new concrete';

            const changes = wrapped.changes();
            expect(changes).toHaveLength(2);

            expect(wrapped.abstractMethod()).toBe('implemented');
        });

        it('should handle classes implementing interfaces', () => {
            interface TestInterface {
                interfaceField: string;

                interfaceMethod(): string;
            }

            @Auditable()
            class ImplementingClass implements TestInterface {
                interfaceField: string = 'interface';
                additionalField: string = 'additional';

                interfaceMethod(): string {
                    return 'interface method';
                }
            }

            const obj = new ImplementingClass();
            const wrapped = Audit(obj);

            wrapped.interfaceField = 'new interface';
            wrapped.additionalField = 'new additional';

            const changes = wrapped.changes();
            expect(changes).toHaveLength(2);

            expect(wrapped.interfaceMethod()).toBe('interface method');
        });
    });

    describe('Mixin patterns', () => {
        it('should handle mixin-style composition', () => {
            // Base class
            class Base {
                @AuditField()
                baseValue: string = 'base';
            }

            // Mixin function
            function AuditableMixin<T extends new (...args: any[]) => {}>(constructor: T) {
                class MixinClass extends constructor {
                    mixinField: string = 'mixin';
                }

                // Apply decorator manually since decorators in function scope have issues
                const {AuditField} = require('../src/decorators');
                AuditField()(MixinClass.prototype, 'mixinField');

                return MixinClass;
            }

            // Apply mixin
            const MixedClass = AuditableMixin(Base);

            const obj = new MixedClass();
            const wrapped = Audit(obj);

            wrapped.baseValue = 'new base';
            wrapped.mixinField = 'new mixin';

            const changes = wrapped.changes();
            expect(changes).toHaveLength(2);

            const fields = changes.map(c => c.field).sort();
            expect(fields).toEqual(['baseValue', 'mixinField']);
        });
    });

    describe('Generic classes', () => {
        it('should handle generic class definitions', () => {
            @Auditable()
            class GenericContainer<T> {
                value: T;
                name: string = 'container';

                constructor(value: T) {
                    this.value = value;
                }

                getValue(): T {
                    return this.value;
                }
            }

            const stringContainer = new GenericContainer<string>('initial');
            const wrappedString = Audit(stringContainer);

            wrappedString.value = 'updated';
            wrappedString.name = 'updated container';

            const stringChanges = wrappedString.changes();
            expect(stringChanges).toHaveLength(2);
            expect(wrappedString.getValue()).toBe('updated');

            const numberContainer = new GenericContainer<number>(42);
            const wrappedNumber = Audit(numberContainer);

            wrappedNumber.value = 100;
            wrappedNumber.name = 'number container';

            const numberChanges = wrappedNumber.changes();
            expect(numberChanges).toHaveLength(2);
            expect(wrappedNumber.getValue()).toBe(100);
        });
    });

    describe('Static members and methods', () => {
        it('should not interfere with static members', () => {
            @Auditable()
            class ClassWithStatics {
                static staticField: string = 'static';
                instanceField: string = 'instance';

                static staticMethod(): string {
                    return 'static method';
                }

                instanceMethod(): string {
                    return 'instance method';
                }
            }

            const obj = new ClassWithStatics();
            const wrapped = Audit(obj);

            // Static members should work normally
            expect(ClassWithStatics.staticField).toBe('static');
            expect(ClassWithStatics.staticMethod()).toBe('static method');

            // Instance tracking should work
            wrapped.instanceField = 'new instance';
            expect(wrapped.changes()).toHaveLength(1);
            expect(wrapped.instanceMethod()).toBe('instance method');

            // Modifying static members should not affect audit
            ClassWithStatics.staticField = 'new static';
            expect(wrapped.changes()).toHaveLength(1); // Still only instance change
        });
    });

    describe('Private and protected members', () => {
        it('should handle private fields appropriately', () => {
            @Auditable()
            class ClassWithPrivate {
                private privateField: string = 'private';
                protected protectedField: string = 'protected';
                public publicField: string = 'public';

                getPrivate(): string {
                    return this.privateField;
                }

                setPrivate(value: string): void {
                    this.privateField = value;
                }

                getProtected(): string {
                    return this.protectedField;
                }

                setProtected(value: string): void {
                    this.protectedField = value;
                }
            }

            const obj = new ClassWithPrivate();
            const wrapped = Audit(obj);

            // Public field should be tracked
            wrapped.publicField = 'new public';

            // Private/protected fields accessed through methods
            wrapped.setPrivate('new private');
            wrapped.setProtected('new protected');

            // Only public field changes should be tracked directly
            const changes = wrapped.changes();
            expect(changes).toHaveLength(1);
            expect(changes[0]?.field).toBe('publicField');

            // Methods should work correctly
            expect(wrapped.getPrivate()).toBe('new private');
            expect(wrapped.getProtected()).toBe('new protected');
        });
    });
});