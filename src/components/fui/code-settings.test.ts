import { describe, expect, it } from 'vitest';
import { applySavedCodeSettings } from './code-settings';

describe('code settings', () => {
    it('keeps platform defaults when there are no saved choices', () => {
        const settings = { wrap: true, include_fonts: true };

        applySavedCodeSettings(settings, {});

        expect(settings).toEqual({ wrap: true, include_fonts: true });
    });

    it('applies explicit saved choices only for settings supported by the platform', () => {
        const settings = { wrap: true, include_fonts: true };

        applySavedCodeSettings(settings, { wrap: false, unsupported: false });

        expect(settings).toEqual({ wrap: false, include_fonts: true });
    });
});
