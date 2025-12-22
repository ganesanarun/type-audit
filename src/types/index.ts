// Public type definitions for the audit library

/**
 * Interface for accessing audit functionality on wrapped objects
 */
export interface AuditHandle {
    /**
     * Returns an array of change records for all tracked modifications
     */
    changes(): ChangeRecord[];

    /**
     * Optional method to reset audit history without affecting the object state
     */
    resetAudit?(): void;
}

/**
 * Interface representing a single field change
 */
export interface ChangeRecord {
    readonly field: string;
    readonly oldValue: unknown;
    readonly newValue: unknown;
}

/**
 * Concrete implementation of ChangeRecord interface
 * Provides immutable change record data structure
 */
export class ChangeRecordImpl implements ChangeRecord {
    constructor(
        public readonly field: string,
        public readonly oldValue: unknown,
        public readonly newValue: unknown
    ) {
        // Ensure immutability by freezing the object
        Object.freeze(this);
    }
}

// Internal interfaces for library implementation

/**
 * Metadata information for audit tracking configuration
 */
export interface AuditMetadata {
    trackedFields: Set<string>;
    ignoredFields: Set<string>;
    classLevelAudit: boolean;
}

/**
 * Interface for managing decorator metadata
 */
export interface MetadataManager {
    getTrackedFields(target: object): Set<string>;

    isFieldTracked(target: object, field: string): boolean;

    setFieldTracking(target: Function, field: string, track: boolean): void;

    setClassLevelAudit(target: Function, enabled: boolean): void;

    setFieldIgnored(target: Function, field: string, ignored: boolean): void;
}

/**
 * Interface for tracking field changes
 */
export interface ChangeTracker {
    trackChange(field: string, oldValue: unknown, newValue: unknown): void;

    getChanges(): ChangeRecord[];

    reset(): void;

    hasChanges(): boolean;
}

/**
 * Interface for creating audit-enabled proxy objects
 */
export interface ProxyFactory {
    createAuditProxy<T extends object>(target: T): T & AuditHandle;
}