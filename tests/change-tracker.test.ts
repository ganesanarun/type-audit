import {ChangeTrackerImpl} from '../src/tracking';

describe('ChangeTracker', () => {
    let tracker: ChangeTrackerImpl;

    beforeEach(() => {
        tracker = new ChangeTrackerImpl();
    });

    describe('trackChange', () => {
        it('should create a change record for a new field', () => {
            tracker.trackChange('email', 'old@example.com', 'new@example.com');

            const changes = tracker.getChanges();
            expect(changes).toHaveLength(1);
            expect(changes[0]).toEqual({
                field: 'email',
                oldValue: 'old@example.com',
                newValue: 'new@example.com'
            });
        });

        it('should collapse multiple changes to the same field', () => {
            tracker.trackChange('email', 'original@example.com', 'middle@example.com');
            tracker.trackChange('email', 'middle@example.com', 'final@example.com');

            const changes = tracker.getChanges();
            expect(changes).toHaveLength(1);
            expect(changes[0]).toEqual({
                field: 'email',
                oldValue: 'original@example.com', // First old value preserved
                newValue: 'final@example.com'     // Last new value preserved
            });
        });

        it('should track changes to different fields separately', () => {
            tracker.trackChange('email', 'old@example.com', 'new@example.com');
            tracker.trackChange('name', 'Old Name', 'New Name');

            const changes = tracker.getChanges();
            expect(changes).toHaveLength(2);

            const emailChange = changes.find(c => c.field === 'email');
            const nameChange = changes.find(c => c.field === 'name');

            expect(emailChange).toEqual({
                field: 'email',
                oldValue: 'old@example.com',
                newValue: 'new@example.com'
            });

            expect(nameChange).toEqual({
                field: 'name',
                oldValue: 'Old Name',
                newValue: 'New Name'
            });
        });
    });

    describe('getChanges', () => {
        it('should return empty array when no changes tracked', () => {
            const changes = tracker.getChanges();
            expect(changes).toEqual([]);
        });

        it('should return immutable change records', () => {
            tracker.trackChange('email', 'old@example.com', 'new@example.com');

            const changes = tracker.getChanges();
            const changeRecord = changes[0];

            // Verify the change record is frozen (immutable)
            expect(Object.isFrozen(changeRecord)).toBe(true);
        });

        it('should not mutate internal state when called multiple times', () => {
            tracker.trackChange('email', 'old@example.com', 'new@example.com');

            const changes1 = tracker.getChanges();
            const changes2 = tracker.getChanges();

            expect(changes1).toEqual(changes2);
            expect(changes1).not.toBe(changes2); // Different array instances
        });
    });

    describe('reset', () => {
        it('should clear all tracked changes', () => {
            tracker.trackChange('email', 'old@example.com', 'new@example.com');
            tracker.trackChange('name', 'Old Name', 'New Name');

            expect(tracker.getChanges()).toHaveLength(2);

            tracker.reset();

            expect(tracker.getChanges()).toHaveLength(0);
        });
    });

    describe('hasChanges', () => {
        it('should return false when no changes tracked', () => {
            expect(tracker.hasChanges()).toBe(false);
        });

        it('should return true when changes are tracked', () => {
            tracker.trackChange('email', 'old@example.com', 'new@example.com');
            expect(tracker.hasChanges()).toBe(true);
        });

        it('should return false after reset', () => {
            tracker.trackChange('email', 'old@example.com', 'new@example.com');
            tracker.reset();
            expect(tracker.hasChanges()).toBe(false);
        });
    });
});