/**
 * Starter templates for onboarding.
 * Each template is a set of layer states that can be loaded directly into the session.
 * Templates are keyed by platform ID so they use compatible fonts and settings.
 */

export type TemplateItem = {
    id: string;
    title: string;
    description: string;
    layers: Record<string, any>[];
    display?: [number, number];
};

export type TemplateSet = Record<string, TemplateItem[]>;

// "Hello World" template — simple centered text
function createHelloWorldTemplate(platform: string): TemplateItem {
    const fontName = platform === 'lvgl' ? 'Montserrat' : 'tom-thumb';

    return {
        id: 'hello-world',
        title: 'Hello World',
        description: 'A simple greeting screen to get you started',
        display: [128, 64],
        layers: [
            {
                t: 'string',
                p: [30, 28],
                d: 'Hello!',
                z: 1,
                f: fontName,
            },
            {
                t: 'string',
                p: [18, 44],
                d: 'Welcome to Lopaka',
                z: 1,
                f: fontName,
            },
        ],
    };
}

// "Button UI" template — a simple button layout
function createButtonTemplate(platform: string): TemplateItem {
    const fontName = platform === 'lvgl' ? 'Montserrat' : 'tom-thumb';

    return {
        id: 'button-ui',
        title: 'Button UI',
        description: 'Basic button layout with labels',
        display: [128, 64],
        layers: [
            {
                t: 'rect',
                p: [14, 10],
                s: [100, 20],
                r: 3,
                f: true,
            },
            {
                t: 'string',
                p: [42, 14],
                d: 'SETTINGS',
                z: 1,
                f: fontName,
            },
            {
                t: 'rect',
                p: [14, 36],
                s: [100, 20],
                r: 3,
                f: true,
            },
            {
                t: 'string',
                p: [48, 40],
                d: 'START',
                z: 1,
                f: fontName,
            },
        ],
    };
}

// "Clock" template — a simple clock face layout
function createClockTemplate(platform: string): TemplateItem {
    const fontName = platform === 'lvgl' ? 'Montserrat' : 'tom-thumb';

    return {
        id: 'clock',
        title: 'Clock Face',
        description: 'Simple clock display layout',
        display: [128, 64],
        layers: [
            {
                t: 'circle',
                p: [32, 32],
                s: [64, 64],
                f: false,
            },
            {
                t: 'string',
                p: [20, 56],
                d: '12:00',
                z: 1,
                f: fontName,
            },
            {
                t: 'line',
                p: [64, 32],
                s: [0, -20],
            },
        ],
    };
}

// Build template sets per platform
const templates: TemplateSet = {
    'tft-espi': [
        createHelloWorldTemplate('tft-espi'),
        createButtonTemplate('tft-espi'),
        createClockTemplate('tft-espi'),
    ],
    u8g2: [
        createHelloWorldTemplate('u8g2'),
        createButtonTemplate('u8g2'),
        createClockTemplate('u8g2'),
    ],
    lvgl: [
        createHelloWorldTemplate('lvgl'),
        createButtonTemplate('lvgl'),
        createClockTemplate('lvgl'),
    ],
    adafruit: [
        createHelloWorldTemplate('adafruit'),
        createButtonTemplate('adafruit'),
        createClockTemplate('adafruit'),
    ],
    flipper: [
        createHelloWorldTemplate('flipper'),
        createButtonTemplate('flipper'),
        createClockTemplate('flipper'),
    ],
};

// Default templates for unknown platforms — fall back to tft-espi
export function getTemplates(platform: string): TemplateItem[] {
    return templates[platform] ?? templates['tft-espi'];
}

export function getTemplateById(platform: string, templateId: string): TemplateItem | undefined {
    return getTemplates(platform).find((t) => t.id === templateId);
}

export function getDefaultTemplate(platform: string): TemplateItem {
    return getTemplates(platform)[0]; // "Hello World" is always first
}
