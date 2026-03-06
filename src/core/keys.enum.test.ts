import {describe, expect, it} from 'vitest';
import {Keys} from './keys.enum';

describe('Keys enum', () => {
    it('should have enum values equal to their keys', () => {
        Object.entries(Keys).forEach(([key, value]) => {
            expect(value).toBe(key);
        });
    });
});
