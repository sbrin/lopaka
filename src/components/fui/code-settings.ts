import type {Platform} from '../../platforms/platform';
import type {AbstractLayer} from '../../core/layers/abstract.layer';
import {createImageExport} from '../../platforms/image-files';
import {MicropythonPlatform} from '../../platforms/micropython';
import {EsphomePlatform} from '../../platforms/esphome';

export function generateCodeFiles(
    platform: Platform,
    layers: AbstractLayer[],
    ctx?: OffscreenCanvasRenderingContext2D,
    screenTitle?: string
) {
    const settings = platform.getTemplates()?.[platform.getTemplate()]?.settings ?? {};
    let format: 'h' | 'py' | 'png' = 'h';
    if (platform instanceof MicropythonPlatform) format = 'py';
    if (platform instanceof EsphomePlatform) format = 'png';
    const images = createImageExport(!!(settings.export_images && settings.include_images), format);
    const source = platform.generateSourceCode(layers, ctx, screenTitle, images.declare);
    return {source, files: images.files};
}

export type CodeSettings = Record<string, boolean>;

export function setCodeSetting(settings: CodeSettings, name: string, value: boolean): void {
    settings[name] = value;
    if (name === 'include_images' && !value && 'export_images' in settings) {
        settings.export_images = false;
    }
}

export function applySavedCodeSettings(settings: CodeSettings, savedSettings: unknown): void {
    if (!savedSettings || typeof savedSettings !== 'object') return;

    for (const key of Object.keys(settings)) {
        const savedValue = (savedSettings as Record<string, unknown>)[key];
        if (typeof savedValue === 'boolean') settings[key] = savedValue;
    }
}
