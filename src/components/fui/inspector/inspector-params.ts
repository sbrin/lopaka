import { TLayerModifier, TModifierType } from '/src/core/layers/abstract.layer';
import { LVGLPlatform } from '/src/platforms/lvgl';
import { MicropythonPlatform } from '/src/platforms/micropython';
import { FlipperPlatform } from '/src/platforms/flipper';

type InspectorParamVisibility = {
    name: string;
    param: TLayerModifier;
    platformId?: string;
    layerType?: string;
};

export const shouldShowInspectorParam = ({
    name,
    param,
    platformId,
    layerType,
}: InspectorParamVisibility): boolean => {
    // Hide image modifiers because image controls live outside the base inspector list.
    if (param.type === TModifierType.image) {
        return false;
    }
    // Hide font selectors on LVGL to rely on default fonts.
    if (platformId === LVGLPlatform.id && param.type === TModifierType.font) {
        return false;
    }
    // Hide font size controls on LVGL to avoid unsupported scaling inputs.
    if (platformId === LVGLPlatform.id && name === 'fontSize') {
        return false;
    }
    // Polygon layers only support outlines across current platforms.
    if (name === 'fill' && layerType === 'polygon') {
        return false;
    }
    // Micropython triangles only support outline drawing.
    if (platformId === MicropythonPlatform.id && name === 'fill' && layerType === 'triangle') {
        return false;
    }
    // Flipper Zero triangles only support outline drawing
    if (platformId === FlipperPlatform.id && (name === 'fill' || name === 'color') && layerType === 'triangle') {
        return false;
    }
    // Show all remaining modifiers by default.
    return true;
};
