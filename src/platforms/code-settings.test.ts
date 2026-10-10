import { describe, expect, it } from 'vitest';
import platforms from '../core/platforms';

describe('platform code setting defaults', () => {
    it('enables code inclusion settings and keeps separate image headers opt-in', () => {
        for (const platform of Object.values(platforms)) {
            for (const template of Object.values(platform.getTemplates() ?? {}) as Array<{ settings: Record<string, boolean> }>) {
                for (const [name, value] of Object.entries(template.settings)) {
                    expect(value).toBe(name !== 'export_images');
                }
            }
        }
    });
});
