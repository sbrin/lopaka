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
