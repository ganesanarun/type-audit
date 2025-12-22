import {AuditHandle, ProxyFactory} from '../types';
import {metadataManager} from '../metadata';
import {ChangeTrackerImpl} from '../tracking';

/**
 * Implementation of ProxyFactory for creating transparent object wrappers
 * Optimized version using only essential get/set traps for maximum performance
 */
export class ProxyFactoryImpl implements ProxyFactory {

    /**
     * Creates an audit-enabled proxy wrapper for the given object
     * Optimized implementation with minimal overhead and direct ChangeTracker storage
     */
    createAuditProxy<T extends object>(target: T): T & AuditHandle {
        // Input validation (essential error handling)
        if (!target || typeof target !== 'object') {
            throw new Error('Proxy target must be a non-null object');
        }

        // Create tracker directly (no intermediate state)
        const tracker = new ChangeTrackerImpl();

        // Create proxy with only essential traps
        const proxy = new Proxy(target, {
            get: (obj, prop, receiver) => {
                // Handle AuditHandle methods
                if (prop === 'changes') {
                    return () => tracker.getChanges();
                }
                if (prop === 'resetAudit') {
                    return () => tracker.reset();
                }

                // Get property value
                const value = Reflect.get(obj, prop, receiver);

                // Bind functions to preserve 'this' context
                if (typeof value === 'function') {
                    return value.bind(obj);
                }

                return value;
            },
            set: (obj, prop, value, receiver) => {
                // Only track string properties
                if (typeof prop === 'string' && metadataManager.isFieldTracked(obj, prop)) {
                    const oldValue = Reflect.get(obj, prop, receiver);
                    const success = Reflect.set(obj, prop, value, receiver);

                    // Track only if assignment succeeded and value changed
                    if (success && !Object.is(oldValue, value)) {
                        tracker.trackChange(prop, oldValue, value);
                    }
                    return success;
                }

                // For non-tracked fields, just perform assignment
                return Reflect.set(obj, prop, value, receiver);
            }
        });

        return proxy as T & AuditHandle;
    }
}

/**
 * Singleton instance of ProxyFactory for use throughout the library
 */
export const proxyFactory = new ProxyFactoryImpl();

/**
 * Convenience function for creating audit proxies
 */
export function createAuditProxy<T extends object>(target: T): T & AuditHandle {
    return proxyFactory.createAuditProxy(target);
}