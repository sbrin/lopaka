import {TLayerModifier, TModifierType} from '/src/core/layers/abstract.layer';

type InspectorParamVisibility = {
    name: string;
    param: TLayerModifier;
    platformId?: string;
};

export const shouldShowInspectorParam = ({
    name,
    param,
    platformId,
}: InspectorParamVisibility): boolean => {
    // Hide image modifiers because image controls live outside the base inspector list.
    if (param.type === TModifierType.image) {
        return false;
    }
    // Hide font selectors on LVGL to rely on default fonts.
    if (platformId === 'lvgl' && param.type === TModifierType.font) {
        return false;
    }
    // Hide font size controls on LVGL to avoid unsupported scaling inputs.
    if (platformId === 'lvgl' && name === 'fontSize') {
        return false;
    }
    // Show all remaining modifiers by default.
    return true;
};
