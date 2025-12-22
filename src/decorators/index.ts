import {metadataManager} from '../metadata';
import {auditLogger} from '../utils';

export function AuditField(): PropertyDecorator {
    return function (target: any, propertyKey: string | symbol | undefined): void {
        try {
            // Input validation
            if (!target) {
                auditLogger.error('Invalid target for @AuditField decorator', undefined, {
                    targetType: typeof target,
                    propertyKey: typeof propertyKey === 'string' ? propertyKey : propertyKey?.toString()
                });
                return;
            }

            if (typeof propertyKey !== 'string') {
                auditLogger.warn('Non-string property key for @AuditField decorator', {
                    propertyKeyType: typeof propertyKey,
                    propertyKey: propertyKey?.toString(),
                    targetConstructor: target.constructor?.name
                });
                return;
            }

            // Get the constructor function for class-level metadata storage
            const constructor = target.constructor;
            if (!constructor || typeof constructor !== 'function') {
                auditLogger.error('Invalid constructor for @AuditField decorator', undefined, {
                    constructorType: typeof constructor,
                    propertyKey,
                    targetType: typeof target
                });
                return;
            }

            metadataManager.setFieldTracking(constructor, propertyKey, true);

        } catch (error) {
            auditLogger.error('Critical error in @AuditField decorator', error, {
                propertyKey: typeof propertyKey === 'string' ? propertyKey : propertyKey?.toString(),
                targetConstructor: target?.constructor?.name,
                targetType: typeof target
            });
            // Silently continue - decorator failure should not disrupt class definition
        }
    };
}

/**
 * Class decorator for marking all fields in a class for audit tracking
 */
export function Auditable(): ClassDecorator {
    return function <TFunction extends Function>(target: TFunction): TFunction {
        try {
            // Input validation
            if (!target || typeof target !== 'function') {
                auditLogger.error('Invalid target for @Auditable decorator', undefined, {
                    targetType: typeof target,
                    targetName: (target as any)?.name
                });
                return target;
            }

            metadataManager.setClassLevelAudit(target, true);
            return target;

        } catch (error) {
            auditLogger.error('Critical error in @Auditable decorator', error, {
                targetName: (target as any)?.name,
                targetType: typeof target
            });

            // Return the original target to avoid disrupting class definition
            return target;
        }
    };
}

/**
 * Property decorator for excluding specific fields from audit tracking
 * Used in conjunction with @Auditable class decorator
 */
export function AuditIgnore(): PropertyDecorator {
    return function (target: any, propertyKey: string | symbol | undefined): void {
        try {
            // Input validation
            if (!target) {
                auditLogger.error('Invalid target for @AuditIgnore decorator', undefined, {
                    targetType: typeof target,
                    propertyKey: typeof propertyKey === 'string' ? propertyKey : propertyKey?.toString()
                });
                return;
            }

            if (typeof propertyKey !== 'string') {
                auditLogger.warn('Non-string property key for @AuditIgnore decorator', {
                    propertyKeyType: typeof propertyKey,
                    propertyKey: propertyKey?.toString(),
                    targetConstructor: target.constructor?.name
                });
                return;
            }

            // Get the constructor function for class-level metadata storage
            const constructor = target.constructor;
            if (!constructor || typeof constructor !== 'function') {
                auditLogger.error('Invalid constructor for @AuditIgnore decorator', undefined, {
                    constructorType: typeof constructor,
                    propertyKey,
                    targetType: typeof target
                });
                return;
            }

            metadataManager.setFieldIgnored(constructor, propertyKey, true);

        } catch (error) {
            auditLogger.error('Critical error in @AuditIgnore decorator', error, {
                propertyKey: typeof propertyKey === 'string' ? propertyKey : propertyKey?.toString(),
                targetConstructor: target?.constructor?.name,
                targetType: typeof target
            });
            // Silently continue - decorator failure should not disrupt class definition
        }
    };
}