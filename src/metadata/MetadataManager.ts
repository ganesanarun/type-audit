import {AuditMetadata, MetadataManager} from '../types';
import {auditLogger} from '../utils';

/**
 * Symbol keys for storing metadata on class constructors
 */
const AUDIT_METADATA_KEY = Symbol('audit:metadata');

/**
 * Default metadata structure for classes without audit configuration
 */
const DEFAULT_METADATA: AuditMetadata = {
    trackedFields: new Set<string>(),
    ignoredFields: new Set<string>(),
    classLevelAudit: false
};

/**
 * Implementation of MetadataManager for storing and retrieving decorator metadata
 * Uses class-level static metadata storage as specified in requirements
 */
export class MetadataManagerImpl implements MetadataManager {

    /**
     * Gets the set of tracked fields for a given object instance
     * Combines class-level audit settings with field-level decorators
     * Implements graceful degradation when metadata is missing or invalid
     */
    getTrackedFields(target: object): Set<string> {
        try {
            // Validate input target
            if (!target || typeof target !== 'object') {
                auditLogger.warn('Invalid target provided to getTrackedFields', {
                    target: typeof target
                });
                return new Set<string>();
            }

            const constructor = target.constructor as Function;
            if (!constructor) {
                auditLogger.warn('Target has no constructor, using default metadata', {
                    targetType: typeof target
                });
                return new Set<string>();
            }

            const metadata = this.getMetadata(constructor);
            const trackedFields = new Set<string>();

            // If class-level audit is enabled, track all fields except ignored ones
            if (metadata.classLevelAudit) {
                try {
                    // Get all enumerable properties of the object
                    const allFields = Object.keys(target);
                    for (const field of allFields) {
                        if (!metadata.ignoredFields.has(field)) {
                            trackedFields.add(field);
                        }
                    }
                } catch (error) {
                    auditLogger.error('Failed to enumerate object properties', error, {
                        targetConstructor: constructor.name
                    });
                    // Continue with field-level tracking even if enumeration fails
                }
            }

            // Add explicitly tracked fields from @AuditField decorators
            try {
                for (const field of metadata.trackedFields) {
                    if (!metadata.ignoredFields.has(field)) {
                        trackedFields.add(field);
                    }
                }
            } catch (error) {
                auditLogger.error('Failed to process tracked fields metadata', error, {
                    targetConstructor: constructor.name
                });
                // Return whatever we managed to collect
            }

            return trackedFields;

        } catch (error) {
            auditLogger.error('Critical error in getTrackedFields', error, {
                targetType: typeof target,
                hasConstructor: target && typeof target === 'object' && 'constructor' in target
            });

            // Graceful degradation: return empty set to disable tracking
            return new Set<string>();
        }
    }

    /**
     * Checks if a specific field should be tracked for the given object
     * Implements error resilience to never disrupt business logic
     */
    isFieldTracked(target: object, field: string): boolean {
        try {
            // Input validation
            if (!target || typeof target !== 'object' || typeof field !== 'string') {
                auditLogger.warn('Invalid parameters for isFieldTracked', {
                    targetType: typeof target,
                    fieldType: typeof field,
                    field
                });
                return false;
            }

            const trackedFields = this.getTrackedFields(target);
            return trackedFields.has(field);

        } catch (error) {
            auditLogger.error('Error checking field tracking status', error, {
                targetType: typeof target,
                field,
                targetConstructor: target?.constructor?.name
            });

            // Graceful degradation: assume field is not tracked
            return false;
        }
    }

    /**
     * Sets field-level tracking for a specific field on a class
     * Used by @AuditField decorator
     * Implements error resilience to never disrupt decorator application
     */
    setFieldTracking(target: Function, field: string, track: boolean): void {
        try {
            // Input validation
            if (!target || typeof target !== 'function') {
                auditLogger.error('Invalid target function for setFieldTracking', undefined, {
                    targetType: typeof target,
                    field,
                    track
                });
                return;
            }

            if (typeof field !== 'string' || field.length === 0) {
                auditLogger.error('Invalid field name for setFieldTracking', undefined, {
                    targetName: target.name,
                    fieldType: typeof field,
                    field,
                    track
                });
                return;
            }

            const metadata = this.getOrCreateMetadata(target);

            if (track) {
                metadata.trackedFields.add(field);
            } else {
                metadata.trackedFields.delete(field);
            }

        } catch (error) {
            auditLogger.error('Failed to set field tracking', error, {
                targetName: target?.name,
                field,
                track
            });
            // Silently continue - decorator application should not fail
        }
    }

    /**
     * Sets class-level audit tracking
     * Used by @Audit decorator
     * Implements error resilience to never disrupt decorator application
     */
    setClassLevelAudit(target: Function, enabled: boolean): void {
        try {
            // Input validation
            if (!target || typeof target !== 'function') {
                auditLogger.error('Invalid target function for setClassLevelAudit', undefined, {
                    targetType: typeof target,
                    enabled
                });
                return;
            }

            const metadata = this.getOrCreateMetadata(target);
            metadata.classLevelAudit = enabled;

        } catch (error) {
            auditLogger.error('Failed to set class-level audit', error, {
                targetName: target?.name,
                enabled
            });
            // Silently continue - decorator application should not fail
        }
    }

    /**
     * Sets field to be ignored during tracking
     * Used by @AuditIgnore decorator
     * Implements error resilience to never disrupt decorator application
     */
    setFieldIgnored(target: Function, field: string, ignored: boolean): void {
        try {
            // Input validation
            if (!target || typeof target !== 'function') {
                auditLogger.error('Invalid target function for setFieldIgnored', undefined, {
                    targetType: typeof target,
                    field,
                    ignored
                });
                return;
            }

            if (typeof field !== 'string' || field.length === 0) {
                auditLogger.error('Invalid field name for setFieldIgnored', undefined, {
                    targetName: target.name,
                    fieldType: typeof field,
                    field,
                    ignored
                });
                return;
            }

            const metadata = this.getOrCreateMetadata(target);

            if (ignored) {
                metadata.ignoredFields.add(field);
            } else {
                metadata.ignoredFields.delete(field);
            }

        } catch (error) {
            auditLogger.error('Failed to set field ignored status', error, {
                targetName: target?.name,
                field,
                ignored
            });
            // Silently continue - decorator application should not fail
        }
    }

    /**
     * Retrieves metadata for a class constructor, returning default if none exists
     * Implements graceful degradation for corrupted or invalid metadata
     */
    private getMetadata(target: Function): AuditMetadata {
        try {
            if (!target || typeof target !== 'function') {
                auditLogger.warn('Invalid target function for getMetadata', {
                    targetType: typeof target
                });
                return {...DEFAULT_METADATA};
            }

            const metadata = (target as any)[AUDIT_METADATA_KEY];

            if (!metadata) {
                return {...DEFAULT_METADATA};
            }

            // Validate metadata structure
            if (!this.isValidMetadata(metadata)) {
                auditLogger.warn('Invalid metadata structure detected, using defaults', {
                    targetName: target.name,
                    metadata: typeof metadata
                });
                return {...DEFAULT_METADATA};
            }

            return metadata;

        } catch (error) {
            auditLogger.error('Error retrieving metadata', error, {
                targetName: target?.name
            });
            return {...DEFAULT_METADATA};
        }
    }

    /**
     * Gets or creates metadata for a class constructor
     * Implements error resilience for metadata creation and storage
     */
    private getOrCreateMetadata(target: Function): AuditMetadata {
        try {
            if (!target || typeof target !== 'function') {
                auditLogger.error('Invalid target function for getOrCreateMetadata', undefined, {
                    targetType: typeof target
                });
                // Return a temporary metadata object that won't be stored
                return {
                    trackedFields: new Set<string>(),
                    ignoredFields: new Set<string>(),
                    classLevelAudit: false
                };
            }

            let metadata = (target as any)[AUDIT_METADATA_KEY];

            if (!metadata || !this.isValidMetadata(metadata)) {
                if (metadata && !this.isValidMetadata(metadata)) {
                    auditLogger.warn('Corrupted metadata detected, recreating', {
                        targetName: target.name,
                        metadata: typeof metadata
                    });
                }

                metadata = {
                    trackedFields: new Set<string>(),
                    ignoredFields: new Set<string>(),
                    classLevelAudit: false
                };

                try {
                    // Store metadata on the constructor function
                    (target as any)[AUDIT_METADATA_KEY] = metadata;
                } catch (storageError) {
                    auditLogger.error('Failed to store metadata on constructor', storageError, {
                        targetName: target.name
                    });
                    // Return the metadata anyway, even if we can't store it
                }
            }

            return metadata;

        } catch (error) {
            auditLogger.error('Critical error in getOrCreateMetadata', error, {
                targetName: target?.name
            });

            // Return a safe default metadata object
            return {
                trackedFields: new Set<string>(),
                ignoredFields: new Set<string>(),
                classLevelAudit: false
            };
        }
    }

    /**
     * Validates metadata structure to ensure it's not corrupted
     */
    private isValidMetadata(metadata: any): metadata is AuditMetadata {
        try {
            return (
                metadata &&
                typeof metadata === 'object' &&
                metadata.trackedFields instanceof Set &&
                metadata.ignoredFields instanceof Set &&
                typeof metadata.classLevelAudit === 'boolean'
            );
        } catch (error) {
            return false;
        }
    }
}

/**
 * Singleton instance of MetadataManager for use throughout the library
 */
export const metadataManager = new MetadataManagerImpl();