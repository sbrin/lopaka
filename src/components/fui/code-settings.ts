export type CodeSettings = Record<string, boolean>;

export function applySavedCodeSettings(settings: CodeSettings, savedSettings: unknown): void {
    if (!savedSettings || typeof savedSettings !== 'object') return;

    for (const key of Object.keys(settings)) {
        const savedValue = (savedSettings as Record<string, unknown>)[key];
        if (typeof savedValue === 'boolean') settings[key] = savedValue;
    }
}
