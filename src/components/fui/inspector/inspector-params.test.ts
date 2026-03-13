import {describe, expect, it} from 'vitest';
import {TLayerModifier, TModifierType} from '/src/core/layers/abstract.layer';
import {shouldShowInspectorParam} from './inspector-params';
import {LVGLPlatform} from '/src/platforms/lvgl';
import {MicropythonPlatform} from '/src/platforms/micropython';
import {EsphomePlatform} from '/src/platforms/esphome';
import {TFTeSPIPlatform} from '/src/platforms/tft-espi';
import {U8g2Platform} from '/src/platforms/u8g2';

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
        const result = shouldShowInspectorParam({name: 'font', param: modifier, platformId: LVGLPlatform.id});

        // Assert that font modifiers are hidden on LVGL.
        expect(result).toBe(false);
    });

    it('hides font size modifiers for LVGL', () => {
        // Arrange a modifier that represents font size.
        const modifier = createModifier(TModifierType.number);

        // Act by checking visibility on LVGL.
        const result = shouldShowInspectorParam({name: 'fontSize', param: modifier, platformId: LVGLPlatform.id});

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

    it('hides fill for Micropython triangle layers', () => {
        // Arrange a boolean modifier that represents fill.
        const modifier = createModifier(TModifierType.boolean);

        // Act by checking fill visibility for a Micropython triangle.
        const result = shouldShowInspectorParam({
            name: 'fill',
            param: modifier,
            platformId: MicropythonPlatform.id,
            layerType: 'triangle',
        });

        // Assert that the unsupported fill toggle stays hidden.
        expect(result).toBe(false);
    });

    it('hides fill for Micropython polygon layers', () => {
        // Arrange a boolean modifier that represents fill.
        const modifier = createModifier(TModifierType.boolean);

        // Act by checking fill visibility for a Micropython polygon.
        const result = shouldShowInspectorParam({
            name: 'fill',
            param: modifier,
            platformId: MicropythonPlatform.id,
            layerType: 'polygon',
        });

        // Assert that the unsupported fill toggle stays hidden.
        expect(result).toBe(false);
    });

    it('keeps fill visible for other Micropython layer types', () => {
        // Arrange a boolean modifier that represents fill.
        const modifier = createModifier(TModifierType.boolean);

        // Act by checking fill visibility for a Micropython rectangle.
        const result = shouldShowInspectorParam({
            name: 'fill',
            param: modifier,
            platformId: MicropythonPlatform.id,
            layerType: 'rect',
        });

        // Assert that supported fill controls remain visible.
        expect(result).toBe(true);
    });

    it('hides fill for ESPHome polygon layers', () => {
        // Arrange a boolean modifier that represents fill.
        const modifier = createModifier(TModifierType.boolean);

        // Act by checking fill visibility for an ESPHome polygon.
        const result = shouldShowInspectorParam({
            name: 'fill',
            param: modifier,
            platformId: EsphomePlatform.id,
            layerType: 'polygon',
        });

        // Assert that the unsupported fill toggle stays hidden.
        expect(result).toBe(false);
    });

    it('hides fill for TFT_eSPI polygon layers', () => {
        // Arrange a boolean modifier that represents fill.
        const modifier = createModifier(TModifierType.boolean);

        // Act by checking fill visibility for a TFT_eSPI polygon.
        const result = shouldShowInspectorParam({
            name: 'fill',
            param: modifier,
            platformId: TFTeSPIPlatform.id,
            layerType: 'polygon',
        });

        // Assert that the unsupported fill toggle stays hidden.
        expect(result).toBe(false);
    });

    it('hides fill for U8g2 polygon layers', () => {
        // Arrange a boolean modifier that represents fill.
        const modifier = createModifier(TModifierType.boolean);

        // Act by checking fill visibility for a U8g2 polygon.
        const result = shouldShowInspectorParam({
            name: 'fill',
            param: modifier,
            platformId: U8g2Platform.id,
            layerType: 'polygon',
        });

        // Assert that the unsupported fill toggle stays hidden.
        expect(result).toBe(false);
    });
});
