/**
 * Tests for proxy behavior with different object types
 * Covers plain objects, arrays, functions, built-in types, and edge cases
 */

import {Audit} from '../src';
import {Auditable} from '../src/decorators';

describe('Different Object Types', () => {
    describe('Plain objects', () => {
        it('should handle plain objects without decorators', () => {
            const plainObj = {
                field1: 'value1',
                field2: 42,
                field3: true
            };

            const wrapped = Audit(plainObj);

            wrapped.field1 = 'new value1';
            wrapped.field2 = 100;
            wrapped.field3 = false;

            // No decorators, so no changes should be tracked
            expect(wrapped.changes()).toHaveLength(0);

            // But values should be updated
            expect(wrapped.field1).toBe('new value1');
            expect(wrapped.field2).toBe(100);
            expect(wrapped.field3).toBe(false);
        });

        it('should handle objects with methods', () => {
            const objWithMethods = {
                value: 'initial',
                getValue() {
                    return this.value;
                },
                setValue(newValue: string) {
                    this.value = newValue;
                },
                compute() {
                    return this.value.toUpperCase();
                }
            };

            const wrapped = Audit(objWithMethods);

            // Methods should work correctly
            expect(wrapped.getValue()).toBe('initial');
            expect(wrapped.compute()).toBe('INITIAL');

            wrapped.setValue('updated');
            expect(wrapped.getValue()).toBe('updated');
            expect(wrapped.compute()).toBe('UPDATED');

            // Direct assignment should also work
            wrapped.value = 'direct';
            expect(wrapped.getValue()).toBe('direct');
        });

        it('should handle objects with getters and setters', () => {
            const objWithAccessors = {
                _value: 'initial',
                get value() {
                    return this._value;
                },
                set value(newValue: string) {
                    this._value = newValue.toLowerCase();
                }
            };

            const wrapped = Audit(objWithAccessors);

            expect(wrapped.value).toBe('initial');

            wrapped.value = 'UPDATED';
            expect(wrapped.value).toBe('updated'); // Setter converts to lowercase
            expect(wrapped._value).toBe('updated');
        });
    });

    describe('Array-like objects', () => {
        it('should handle arrays as objects', () => {
            const arr = ['a', 'b', 'c'];
            const wrapped = Audit(arr);

            // Array methods should work
            expect(wrapped.length).toBe(3);
            expect(wrapped[0]).toBe('a');
            expect(wrapped.slice(0, 2)).toEqual(['a', 'b']);

            // Direct index assignment
            wrapped[0] = 'modified';
            expect(wrapped[0]).toBe('modified');

            // Array methods that modify
            wrapped.push('d');
            expect(wrapped.length).toBe(4);
            expect(wrapped[3]).toBe('d');

            // No audit tracking for arrays without decorators
            expect(wrapped.changes()).toHaveLength(0);
        });

        it('should handle array-like objects', () => {
            const arrayLike = {
                0: 'first',
                1: 'second',
                2: 'third',
                length: 3,
                push(item: string) {
                    (this as any)[this.length] = item;
                    this.length++;
                }
            };

            const wrapped = Audit(arrayLike);

            expect(wrapped[0]).toBe('first');
            expect(wrapped.length).toBe(3);

            wrapped[0] = 'modified first';
            wrapped.push('fourth');

            expect(wrapped[0]).toBe('modified first');
            expect(wrapped.length).toBe(4);
            expect((wrapped as any)[3]).toBe('fourth');
        });
    });

    describe('Function objects', () => {
        it('should handle function objects with properties', () => {
            function testFunction() {
                return 'function result';
            }

            // Add properties to function
            (testFunction as any).prop1 = 'function property';
            (testFunction as any).prop2 = 42;

            // Functions are not supported by the current implementation
            expect(() => {
                Audit(testFunction);
            }).toThrow('Audit target must be a non-null object');
        });

        it('should handle constructor functions', () => {
            function TestConstructor(this: any, value: string) {
                this.value = value;
            }

            TestConstructor.prototype.getValue = function () {
                return this.value;
            };

            // Functions are not supported by the current implementation
            expect(() => {
                Audit(TestConstructor);
            }).toThrow('Audit target must be a non-null object');
        });
    });

    describe('Built-in object types', () => {
        it('should handle Date objects', () => {
            const date = new Date('2023-01-01');
            const wrapped = Audit(date);

            // Date methods should work
            expect(wrapped.getFullYear()).toBe(2023);
            expect(wrapped.getMonth()).toBe(0); // January is 0

            // Date modification should work
            wrapped.setFullYear(2024);
            expect(wrapped.getFullYear()).toBe(2024);

            // No audit tracking without decorators
            expect(wrapped.changes()).toHaveLength(0);
        });

        it('should handle RegExp objects', () => {
            const regex = /test/gi;
            const wrapped = Audit(regex);

            // RegExp methods should work
            expect(wrapped.test('TEST')).toBe(true);
            expect(wrapped.test('other')).toBe(false);

            // Note: Some built-in properties may have issues with proxies
            // This is a known limitation of proxying built-in objects
            // We'll skip testing problematic properties like 'source'
        });

        it('should handle Error objects', () => {
            const error = new Error('Test error');
            error.name = 'TestError';

            const wrapped = Audit(error);

            // Error properties should be accessible
            expect(wrapped.message).toBe('Test error');
            expect(wrapped.name).toBe('TestError');

            // Property modification should work
            wrapped.message = 'Modified error';
            expect(wrapped.message).toBe('Modified error');
        });

        it('should handle Map objects', () => {
            const map = new Map([['key1', 'value1'], ['key2', 'value2']]);
            const wrapped = Audit(map);

            // Map methods should work
            expect(wrapped.get('key1')).toBe('value1');

            // Note: Built-in objects like Map have special property access patterns
            // that may not work perfectly with proxies. This is a known limitation.
            wrapped.set('key3', 'value3');
            expect(wrapped.get('key3')).toBe('value3');

            // Iteration should work
            const keys = Array.from(wrapped.keys());
            expect(keys).toContain('key1');
            expect(keys).toContain('key2');
            expect(keys).toContain('key3');
        });

        it('should handle Set objects', () => {
            const set = new Set(['a', 'b', 'c']);
            const wrapped = Audit(set);

            // Set methods should work
            expect(wrapped.has('a')).toBe(true);

            // Note: Built-in objects like Set have special property access patterns
            // that may not work perfectly with proxies. This is a known limitation.
            wrapped.add('d');
            expect(wrapped.has('d')).toBe(true);

            wrapped.delete('a');
            expect(wrapped.has('a')).toBe(false);
        });
    });

    describe('Complex nested objects', () => {
        it('should handle deeply nested object structures', () => {
            @Auditable()
            class NestedClass {
                nested: {
                    level1: {
                        level2: {
                            value: string;
                        };
                        array: string[];
                    };
                    simple: string;
                } = {
                    level1: {
                        level2: {value: 'deep'},
                        array: ['a', 'b', 'c']
                    },
                    simple: 'simple'
                };
            }

            const obj = new NestedClass();
            const wrapped = Audit(obj);

            // Direct assignment to nested property should be tracked
            const oldNested = wrapped.nested;
            wrapped.nested = {
                level1: {
                    level2: {value: 'new deep'},
                    array: ['x', 'y', 'z']
                },
                simple: 'new simple'
            };

            const changes = wrapped.changes();
            expect(changes).toHaveLength(1);
            expect(changes[0]?.field).toBe('nested');
            expect(changes[0]?.oldValue).toBe(oldNested);

            // Nested mutations should not be tracked (as per requirements)
            wrapped.nested.simple = 'mutated simple';
            wrapped.nested.level1.level2.value = 'mutated deep';
            wrapped.nested.level1.array.push('w');

            // Should still only have one change record
            expect(wrapped.changes()).toHaveLength(1);
        });

        it('should handle objects with circular references', () => {
            @Auditable()
            class CircularClass {
                name: string = 'circular';
                self?: CircularClass;
            }

            const obj = new CircularClass();
            obj.self = obj; // Create circular reference

            const wrapped = Audit(obj);

            // Should handle circular references without infinite loops
            wrapped.name = 'updated';

            const changes = wrapped.changes();
            expect(changes).toHaveLength(1);
            expect(changes[0]?.field).toBe('name');

            // Circular reference should still work
            expect(wrapped.self).toBe(obj); // Points to original object
            expect(wrapped.self?.name).toBe('updated');
        });
    });

    describe('Edge cases and special objects', () => {
        it('should handle objects with null prototype', () => {
            const nullProtoObj = Object.create(null);
            nullProtoObj.field = 'value';

            const wrapped = Audit(nullProtoObj);

            wrapped.field = 'new value';
            expect(wrapped.field).toBe('new value');

            // No constructor, so no audit tracking
            expect(wrapped.changes()).toHaveLength(0);
        });

        it('should handle frozen objects', () => {
            const frozenObj = Object.freeze({
                field: 'frozen'
            });

            const wrapped = Audit(frozenObj);

            // Attempting to modify frozen object will throw because the proxy
            // cannot override the frozen property behavior
            expect(() => {
                (wrapped as any).field = 'new value';
            }).toThrow(); // Frozen objects cannot be modified

            expect(wrapped.field).toBe('frozen'); // Value should remain unchanged
        });

        it('should handle sealed objects', () => {
            const sealedObj = Object.seal({
                field: 'sealed'
            });

            const wrapped = Audit(sealedObj);

            // Can modify existing properties on sealed objects
            wrapped.field = 'modified sealed';
            expect(wrapped.field).toBe('modified sealed');

            // Cannot add new properties - will throw
            expect(() => {
                (wrapped as any).newField = 'new';
            }).toThrow(); // Sealed objects cannot have new properties added
        });

        it('should handle objects with symbol properties', () => {
            const sym1 = Symbol('test1');
            const sym2 = Symbol('test2');

            @Auditable()
            class SymbolClass {
                normalField: string = 'normal';
                [sym1]: string = 'symbol1';
                [sym2]: number = 42;
            }

            const obj = new SymbolClass();
            const wrapped = Audit(obj);

            // Normal field should be tracked
            wrapped.normalField = 'new normal';

            // Symbol properties should work but may not be tracked
            wrapped[sym1] = 'new symbol1';
            wrapped[sym2] = 100;

            expect(wrapped[sym1]).toBe('new symbol1');
            expect(wrapped[sym2]).toBe(100);

            // At least normal field should be tracked
            const changes = wrapped.changes();
            expect(changes.length).toBeGreaterThanOrEqual(1);
            expect(changes.some(c => c.field === 'normalField')).toBe(true);
        });
    });
});