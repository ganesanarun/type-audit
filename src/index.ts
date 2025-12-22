/**
 * @snow-tzu/audit - Transparent audit tracking for TypeScript objects
 * 
 * The main entry point for the audit library providing clean public API exports.
 * This library enables non-intrusive audit tracking of object field changes
 * using TypeScript decorators and transparent proxy wrappers.
 */

// Main Audit function - primary entry point
export { Audit } from './audit';

// Decorator functions for marking fields and classes for audit tracking
export { AuditField, AuditIgnore, Auditable } from './decorators';

// Public interfaces for TypeScript type safety
export type { AuditHandle, ChangeRecord } from './types';

// Optional utilities for debugging and development
export { enableAuditLogging, disableAuditLogging, LogLevel } from './utils/logger';