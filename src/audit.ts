import { AuditHandle } from './types';
import { createAuditProxy } from './proxy';

/**
 * Main Audit function that creates transparent audit-enabled wrappers
 * 
 * @param target - The object to wrap with audit tracking
 * @returns A wrapped object that behaves identically to the original while tracking changes
 * 
 */
export function Audit<T extends object>(target: T): T & AuditHandle {
  // Input validation (essential error handling)
  if (!target || typeof target !== 'object') {
    throw new Error('Audit target must be a non-null object');
  }
  
  // Create and return audit proxy (errors propagate naturally)
  return createAuditProxy(target);
}