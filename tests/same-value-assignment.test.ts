import { Audit, AuditField } from '../src';

describe('Same Value Assignment Behavior', () => {
    class TestClass {
        @AuditField()
        stringField: string = 'initial';

        @AuditField()
        numberField: number = 42;

        @AuditField()
        booleanField: boolean = true;

        @AuditField()
        objectField: object = { id: 1 };
    }

    describe('primitive values', () => {
        it('should not create change records when assigning the same string value', () => {
            const obj = new TestClass();
            const wrapped = Audit(obj);

            // Assign the same value
            wrapped.stringField = 'initial';

            expect(wrapped.changes()).toHaveLength(0);
        });

        it('should not create change records when assigning the same number value', () => {
            const obj = new TestClass();
            const wrapped = Audit(obj);

            // Assign the same value
            wrapped.numberField = 42;

            expect(wrapped.changes()).toHaveLength(0);
        });

        it('should not create change records when assigning the same boolean value', () => {
            const obj = new TestClass();
            const wrapped = Audit(obj);

            // Assign the same value
            wrapped.booleanField = true;

            expect(wrapped.changes()).toHaveLength(0);
        });

        it('should handle special number values correctly', () => {
            const obj = new TestClass();
            obj.numberField = NaN;
            const wrapped = Audit(obj);

            // Assign NaN to NaN (should not create change record)
            wrapped.numberField = NaN;
            expect(wrapped.changes()).toHaveLength(0);

            // Reset and test -0 vs +0
            wrapped.resetAudit?.();
            obj.numberField = -0;
            wrapped.numberField = +0;
            expect(wrapped.changes()).toHaveLength(1); // Object.is(-0, +0) is false
        });
    });

    describe('object references', () => {
        it('should not create change records when assigning the same object reference', () => {
            const obj = new TestClass();
            const wrapped = Audit(obj);
            const originalObject = wrapped.objectField;

            // Assign the same object reference
            wrapped.objectField = originalObject;

            expect(wrapped.changes()).toHaveLength(0);
        });

        it('should create change records when assigning different object references', () => {
            const obj = new TestClass();
            const wrapped = Audit(obj);
            const newObject = { id: 2 };

            // Assign a different object reference
            wrapped.objectField = newObject;

            const changes = wrapped.changes();
            expect(changes).toHaveLength(1);
            expect(changes[0]!.field).toBe('objectField');
            expect(changes[0]!.newValue).toBe(newObject);
        });
    });

    describe('multiple same value assignments', () => {
        it('should not create any change records for multiple same value assignments', () => {
            const obj = new TestClass();
            const wrapped = Audit(obj);

            // Multiple assignments of the same value
            wrapped.stringField = 'initial';
            wrapped.stringField = 'initial';
            wrapped.stringField = 'initial';

            expect(wrapped.changes()).toHaveLength(0);
        });
    });

    describe('change sequence with same final value', () => {
        it('should create change record when final value equals original after changes', () => {
            const obj = new TestClass();
            const wrapped = Audit(obj);

            // Change to different value, then back to original
            wrapped.stringField = 'changed';
            wrapped.stringField = 'initial';

            const changes = wrapped.changes();
            expect(changes).toHaveLength(1);
            expect(changes[0]!.field).toBe('stringField');
            expect(changes[0]!.oldValue).toBe('initial');
            expect(changes[0]!.newValue).toBe('initial');
        });

        it('should handle complex change sequences correctly', () => {
            const obj = new TestClass();
            const wrapped = Audit(obj);

            // Complex sequence: initial -> value1 -> value2 -> value1
            wrapped.stringField = 'value1';
            wrapped.stringField = 'value2';
            wrapped.stringField = 'value1';

            const changes = wrapped.changes();
            expect(changes).toHaveLength(1);
            expect(changes[0]!.field).toBe('stringField');
            expect(changes[0]!.oldValue).toBe('initial');
            expect(changes[0]!.newValue).toBe('value1');
        });
    });

    describe('mixed with actual changes', () => {
        it('should only track actual changes when mixed with same-value assignments', () => {
            const obj = new TestClass();
            const wrapped = Audit(obj);

            // Mix of same-value and actual changes
            wrapped.stringField = 'initial'; // Same value - should not track
            wrapped.numberField = 100; // Different value - should track
            wrapped.booleanField = true; // Same value - should not track
            wrapped.numberField = 42; // Back to original - should update existing record

            const changes = wrapped.changes();
            expect(changes).toHaveLength(1);
            expect(changes[0]!.field).toBe('numberField');
            expect(changes[0]!.oldValue).toBe(42);
            expect(changes[0]!.newValue).toBe(42);
        });
    });
});