import { describe, expect, it } from 'vitest';
import platforms from '../core/platforms';

describe('platform code setting defaults', () => {
    it('enables every code setting exposed by every platform template', () => {
        for (const platform of Object.values(platforms)) {
            for (const template of Object.values(platform.getTemplates() ?? {}) as Array<{ settings: Record<string, boolean> }>) {
                expect(Object.values(template.settings).every((value) => value === true)).toBe(true);
            }
        }
    });
});
