import {describe, expect, it} from 'vitest';
import {TLayerModifier, TModifierType} from '/src/core/layers/abstract.layer';
import {shouldShowInspectorParam} from './inspector-params';

// Build a minimal modifier stub for visibility checks.
const createModifier = (type: TModifierType): TLayerModifier => ({
    getValue: () => null,
    type,
});

describe('shouldShowInspectorParam', () => {
    it('hides image modifiers regardless of platform', () => {
        // Arrange a modifier with the image type.
        const modifier = createModifier(TModifierType.image);

        // Act by checking visibility on a non-LVGL platform.
        const result = shouldShowInspectorParam({name: 'image', param: modifier, platformId: 'test'});

        // Assert that image modifiers are hidden.
        expect(result).toBe(false);
    });

    it('hides font modifiers for LVGL', () => {
        // Arrange a modifier with the font type.
        const modifier = createModifier(TModifierType.font);

        // Act by checking visibility on LVGL.
        const result = shouldShowInspectorParam({name: 'font', param: modifier, platformId: 'lvgl'});

        // Assert that font modifiers are hidden on LVGL.
        expect(result).toBe(false);
    });

    it('hides font size modifiers for LVGL', () => {
        // Arrange a modifier that represents font size.
        const modifier = createModifier(TModifierType.number);

        // Act by checking visibility on LVGL.
        const result = shouldShowInspectorParam({name: 'fontSize', param: modifier, platformId: 'lvgl'});

        // Assert that font size modifiers are hidden on LVGL.
        expect(result).toBe(false);
    });

    it('shows font size modifiers for non-LVGL platforms', () => {
        // Arrange a modifier that represents font size.
        const modifier = createModifier(TModifierType.number);

        // Act by checking visibility on a non-LVGL platform.
        const result = shouldShowInspectorParam({name: 'fontSize', param: modifier, platformId: 'test'});

        // Assert that font size modifiers remain visible elsewhere.
        expect(result).toBe(true);
    });
});
