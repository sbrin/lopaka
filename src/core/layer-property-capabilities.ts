import {MicropythonPlatform} from '/src/platforms/micropython';
import {FlipperPlatform} from '/src/platforms/flipper';
import {U8g2Platform} from '/src/platforms/u8g2';
import {TPlatformFeatures} from '/src/platforms/platform';
import {TLayerModifier, TModifierType} from './layers/abstract.layer';

export type LayerPropertyCapabilityInput = {
    name: string;
    modifier: TLayerModifier;
    platformId?: string;
    layerType?: string;
    features?: Partial<TPlatformFeatures>;
    paintColorMode?: 'rgb' | 'monochrome';
};

/** Domain capability rules shared by Inspector presentation and applications. */
export function isLayerPropertySupported({
    name,
    modifier,
    platformId,
    layerType,
    features = {},
    paintColorMode,
}: LayerPropertyCapabilityInput): boolean {
    if (modifier.type === TModifierType.image) return false;
    if (
        modifier.type === TModifierType.color &&
        features.hasRGBSupport === false &&
        features.hasIndexedColors === false &&
        !(layerType === 'paint' && paintColorMode !== 'rgb')
    )
        return false;
    if (layerType === 'paint' && name === 'color' && paintColorMode === 'rgb') return false;
    if (!features.hasCustomFontSize && name === 'fontSize') return false;
    if (!features.hasFonts && modifier.type === TModifierType.font) return false;
    if (name === 'fill' && layerType === 'polygon') return false;
    if (platformId === MicropythonPlatform.id && name === 'fill' && layerType === 'triangle') return false;
    if (platformId === FlipperPlatform.id && (name === 'fill' || name === 'color') && layerType === 'triangle')
        return false;
    if (platformId === U8g2Platform.id && name === 'color' && !(layerType === 'paint' && paintColorMode !== 'rgb'))
        return false;
    if (name === 'alphaChannel' && !features.hasAlphaChannel) return false;
    if (name === 'inverted' && !features.hasInvertedColors) return false;
    if (
        name === 'radius' &&
        ['rect', 'panel', 'button', 'textarea'].includes(layerType ?? '') &&
        !features.hasRoundCorners
    )
        return false;
    return true;
}
