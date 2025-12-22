import { Audit } from '../src';
import { AuditField, Auditable } from '../src/decorators';

describe('Proxy Wrapper System', () => {
  describe('Audit function', () => {
    it('should create a wrapped object with audit capabilities', () => {
      class TestClass {
        @AuditField()
        name: string = 'initial';
      }
      
      const obj = new TestClass();
      const wrapped = Audit(obj);
      
      // Should have audit methods
      expect(typeof wrapped.changes).toBe('function');
      expect(typeof wrapped.resetAudit).toBe('function');
      
      // Should initially have no changes
      expect(wrapped.changes()).toEqual([]);
    });
    
    it('should preserve original object behavior', () => {
      class TestClass {
        @AuditField()
        value: number = 42;
        
        getValue(): number {
          return this.value;
        }
        
        setValue(newValue: number): void {
          this.value = newValue;
        }
      }
      
      const obj = new TestClass();
      const wrapped = Audit(obj);
      
      // Original behavior should be preserved
      expect(wrapped.getValue()).toBe(42);
      expect(wrapped.value).toBe(42);
      
      // Method calls should work
      wrapped.setValue(100);
      expect(wrapped.getValue()).toBe(100);
      expect(wrapped.value).toBe(100);
    });
    
    it('should track field changes through proxy', () => {
      class TestClass {
        @AuditField()
        name: string = 'initial';
        
        @AuditField()
        age: number = 0;
      }
      
      const obj = new TestClass();
      const wrapped = Audit(obj);
      
      // Make changes
      wrapped.name = 'updated';
      wrapped.age = 25;
      
      const changes = wrapped.changes();
      expect(changes).toHaveLength(2);
      
      const nameChange = changes.find(c => c.field === 'name');
      const ageChange = changes.find(c => c.field === 'age');
      
      expect(nameChange).toEqual({
        field: 'name',
        oldValue: 'initial',
        newValue: 'updated'
      });
      
      expect(ageChange).toEqual({
        field: 'age',
        oldValue: 0,
        newValue: 25
      });
    });
    
    it('should handle class-level audit tracking', () => {
      @Auditable()
      class TestClass {
        name: string = 'initial';
        age: number = 0;
      }
      
      const obj = new TestClass();
      const wrapped = Audit(obj);
      
      wrapped.name = 'updated';
      wrapped.age = 25;
      
      const changes = wrapped.changes();
      expect(changes).toHaveLength(2);
    });
    
    it('should preserve method context (this binding)', () => {
      class TestClass {
        @AuditField()
        value: string = 'test';
        
        getValue(): string {
          return this.value;
        }
        
        getThis(): TestClass {
          return this;
        }
      }
      
      const obj = new TestClass();
      const wrapped = Audit(obj);
      
      // Method should return correct value
      expect(wrapped.getValue()).toBe('test');
      
      // 'this' context should be preserved (though it will be the original object)
      const thisRef = wrapped.getThis();
      expect(thisRef).toBe(obj); // Should be the original object
    });
    
    it('should handle instanceof checks where possible', () => {
      class TestClass {
        @AuditField()
        value: string = 'test';
      }
      
      const obj = new TestClass();
      const wrapped = Audit(obj);
      
      // instanceof should work with the original class
      expect(wrapped instanceof TestClass).toBe(true);
    });
    
    it('should not track undecorated fields', () => {
      class TestClass {
        @AuditField()
        tracked: string = 'initial';
        
        untracked: string = 'initial';
      }
      
      const obj = new TestClass();
      const wrapped = Audit(obj);
      
      wrapped.tracked = 'changed';
      wrapped.untracked = 'changed';
      
      const changes = wrapped.changes();
      expect(changes).toHaveLength(1);
      expect(changes[0]?.field).toBe('tracked');
    });
    
    it('should handle reset functionality', () => {
      class TestClass {
        @AuditField()
        name: string = 'initial';
      }
      
      const obj = new TestClass();
      const wrapped = Audit(obj);
      
      wrapped.name = 'changed';
      expect(wrapped.changes()).toHaveLength(1);
      
      wrapped.resetAudit!();
      expect(wrapped.changes()).toHaveLength(0);
      
      // Object state should be preserved
      expect(wrapped.name).toBe('changed');
    });
    
    it('should handle errors gracefully', () => {
      const obj = { value: 'test' };
      
      // Should not throw even without decorators
      expect(() => {
        const wrapped = Audit(obj);
        wrapped.value = 'changed';
        wrapped.changes();
      }).not.toThrow();
    });
    
    it('should throw error for invalid input', () => {
      expect(() => Audit(null as any)).toThrow('Audit target must be a non-null object');
      expect(() => Audit(undefined as any)).toThrow('Audit target must be a non-null object');
      expect(() => Audit('string' as any)).toThrow('Audit target must be a non-null object');
    });
  });
});