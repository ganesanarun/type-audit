import {Auditable, AuditField, AuditIgnore} from '../src/decorators';
import {metadataManager} from '../src/metadata';

describe('Decorator Metadata System', () => {
    describe('@AuditField decorator', () => {
        it('should mark individual fields for tracking', () => {
            class TestClass {
                @AuditField()
                trackedField: string = '';

                untrackedField: string = '';
            }

            const instance = new TestClass();

            expect(metadataManager.isFieldTracked(instance, 'trackedField')).toBe(true);
            expect(metadataManager.isFieldTracked(instance, 'untrackedField')).toBe(false);
        });

        it('should track multiple fields when decorated', () => {
            class TestClass {
                @AuditField()
                field1: string = '';

                @AuditField()
                field2: number = 0;

                field3: boolean = false;
            }

            const instance = new TestClass();
            const trackedFields = metadataManager.getTrackedFields(instance);

            expect(trackedFields.has('field1')).toBe(true);
            expect(trackedFields.has('field2')).toBe(true);
            expect(trackedFields.has('field3')).toBe(false);
        });
    });

    describe('@Auditable decorator', () => {
        it('should mark all fields for tracking at class level', () => {
            @Auditable()
            class TestClass {
                field1: string = '';
                field2: number = 0;
                field3: boolean = false;
            }

            const instance = new TestClass();

            expect(metadataManager.isFieldTracked(instance, 'field1')).toBe(true);
            expect(metadataManager.isFieldTracked(instance, 'field2')).toBe(true);
            expect(metadataManager.isFieldTracked(instance, 'field3')).toBe(true);
        });
    });

    describe('@AuditIgnore decorator', () => {
        it('should exclude fields from class-level tracking', () => {
            @Auditable()
            class TestClass {
                field1: string = '';

                @AuditIgnore()
                field2: number = 0;

                field3: boolean = false;
            }

            const instance = new TestClass();

            expect(metadataManager.isFieldTracked(instance, 'field1')).toBe(true);
            expect(metadataManager.isFieldTracked(instance, 'field2')).toBe(false);
            expect(metadataManager.isFieldTracked(instance, 'field3')).toBe(true);
        });

        it('should not affect field-level @AuditField decorators', () => {
            class TestClass {
                @AuditField()
                @AuditIgnore()
                field1: string = '';

                @AuditField()
                field2: number = 0;
            }

            const instance = new TestClass();

            // @AuditIgnore should override @AuditField
            expect(metadataManager.isFieldTracked(instance, 'field1')).toBe(false);
            expect(metadataManager.isFieldTracked(instance, 'field2')).toBe(true);
        });
    });

    describe('MetadataManager', () => {
        it('should return empty set for classes without decorators', () => {
            class TestClass {
                field1: string = '';
                field2: number = 0;
            }

            const instance = new TestClass();
            const trackedFields = metadataManager.getTrackedFields(instance);

            expect(trackedFields.size).toBe(0);
        });

        it('should handle mixed decorator scenarios', () => {
            @Auditable()
            class TestClass {
                field1: string = '';

                @AuditField()
                field2: number = 0;

                @AuditIgnore()
                field3: boolean = false;

                field4: string = '';
            }

            const instance = new TestClass();
            const trackedFields = metadataManager.getTrackedFields(instance);

            expect(trackedFields.has('field1')).toBe(true);  // Class-level audit
            expect(trackedFields.has('field2')).toBe(true);  // Both class and field level
            expect(trackedFields.has('field3')).toBe(false); // Ignored
            expect(trackedFields.has('field4')).toBe(true);  // Class-level audit
        });

        it('should store metadata at class level and share across instances', () => {
            @Auditable()
            class TestClass {
                field1: string = '';
            }

            const instance1 = new TestClass();
            const instance2 = new TestClass();

            expect(metadataManager.isFieldTracked(instance1, 'field1')).toBe(true);
            expect(metadataManager.isFieldTracked(instance2, 'field1')).toBe(true);

            // Both instances should have the same tracked fields
            const trackedFields1 = metadataManager.getTrackedFields(instance1);
            const trackedFields2 = metadataManager.getTrackedFields(instance2);

            expect(trackedFields1).toEqual(trackedFields2);
        });
    });
});