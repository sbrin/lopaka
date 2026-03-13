import { TLayerModifier, TModifierType } from '/src/core/layers/abstract.layer';
import { LVGLPlatform } from '/src/platforms/lvgl';
import { MicropythonPlatform } from '/src/platforms/micropython';
import { EsphomePlatform } from '/src/platforms/esphome';
import { TFTeSPIPlatform } from '/src/platforms/tft-espi';
import { U8g2Platform } from '/src/platforms/u8g2';

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
    // Hide fill for polygons because code generation on most platforms only supports outlines.
    if (name === 'fill' && layerType === 'polygon') {
        return false;
    }
    // Hide fill where Micropython code generation only supports triangle outlines.
    if (platformId === MicropythonPlatform.id && name === 'fill' && layerType === 'triangle') {
        return false;
    }
    // Show all remaining modifiers by default.
    return true;
};
