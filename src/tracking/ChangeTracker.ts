import {ChangeRecord, ChangeRecordImpl, ChangeTracker} from '../types';
import {auditLogger} from '../utils';

/**
 * Implementation of ChangeTracker for managing field changes
 * Handles change collapsing and immutable change record creation
 */
export class ChangeTrackerImpl implements ChangeTracker {
    private changes: Map<string, ChangeRecord> = new Map();

    /**
     * Tracks a field change, implementing change collapsing logic
     * Multiple assignments to the same field are collapsed into a single record
     * with the first old value and the last new value
     * Implements error resilience to never disrupt business logic
     */
    trackChange(field: string, oldValue: unknown, newValue: unknown): void {
        try {
            // Input validation
            if (!field || field.length === 0) {
                auditLogger.warn('Invalid field name for trackChange', {
                    fieldType: typeof field,
                    field,
                    fieldLength: field ? field.length : 'N/A'
                });
                return;
            }

            const existingChange = this.changes.get(field);

            if (existingChange) {
                try {
                    // Change collapsing: keep the original old value, update to a new value
                    const collapsedChange = new ChangeRecordImpl(
                        field,
                        existingChange.oldValue, // Keep the first old value
                        newValue // Update to the latest new value
                    );
                    this.changes.set(field, collapsedChange);
                } catch (collapseError) {
                    auditLogger.error('Failed to collapse change record', collapseError, {
                        field,
                        hasExistingChange: true,
                        existingOldValue: typeof existingChange.oldValue,
                        newValueType: typeof newValue
                    });
                    // Continue without collapsing - keep the existing change
                }
            } else {
                try {
                    // First change for this field
                    const newChange = new ChangeRecordImpl(field, oldValue, newValue);
                    this.changes.set(field, newChange);
                } catch (createError) {
                    auditLogger.error('Failed to create new change record', createError, {
                        field,
                        oldValueType: typeof oldValue,
                        newValueType: typeof newValue
                    });
                    // Silently continue - tracking failure should not affect business logic
                }
            }
        } catch (error) {
            auditLogger.error('Critical error in trackChange', error, {
                field,
                oldValueType: typeof oldValue,
                newValueType: typeof newValue,
                changesMapSize: this.changes.size
            });
            // Silently continue - tracking failure should not affect business logic
        }
    }

    /**
     * Returns an array of immutable change records
     * Does not mutate internal state as per requirements
     * Implements error resilience to always return a valid array
     */
    getChanges(): ChangeRecord[] {
        try {
            // Return a new array to avoid external mutation of the internal state
            return Array.from(this.changes.values());
        } catch (error) {
            auditLogger.error('Failed to retrieve change records', error, {
                changesMapSize: this.changes?.size || 'unknown',
                changesMapType: typeof this.changes
            });

            // Graceful degradation: return an empty array
            return [];
        }
    }

    /**
     * Resets all tracked changes
     * Used by optional reset functionality
     * Implements error resilience to never disrupt operation
     */
    reset(): void {
        try {
            this.changes.clear();
        } catch (error) {
            auditLogger.error('Failed to reset change tracker', error, {
                changesMapSize: this.changes?.size || 'unknown'
            });

            // Attempt to recreate the changes map if clearing failed
            try {
                this.changes = new Map();
            } catch (recreateError) {
                auditLogger.error('Failed to recreate changes map', recreateError);
                // At this point, the tracker is in an invalid state
                // But we won't throw to avoid disrupting business logic
            }
        }
    }

    /**
     * Checks if any changes have been tracked
     * Implements error resilience to always return a valid boolean
     */
    hasChanges(): boolean {
        try {
            return this.changes.size > 0;
        } catch (error) {
            auditLogger.error('Failed to check if changes exist', error, {
                changesMapType: typeof this.changes
            });

            // Graceful degradation: assume no changes
            return false;
        }
    }
}