import type {Platform} from '../../platforms/platform';
import type {AbstractLayer} from '../../core/layers/abstract.layer';
import type {ImageFile} from '../../platforms/image-files';

export function getImageFiles(
    platform: Platform,
    layers: AbstractLayer[],
    ctx?: OffscreenCanvasRenderingContext2D,
    screenTitle?: string
): ImageFile[] {
    const settings = platform.getTemplates()?.[platform.getTemplate()]?.settings;
    if (!settings?.export_images || !settings.include_images) return [];
    const files: ImageFile[] = [];
    // Collect the same declarations used by the code generator, without storing files on the platform.
    platform.generateSourceCode(layers, ctx, screenTitle, (file) => files.push(file));
    return files;
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
