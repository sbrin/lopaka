import { AbstractLayer } from '../core/layers/abstract.layer';
import { AbstractParser } from './parsers/abstract-parser';
import { SourceMapParser } from './parsers/source-map-parser';
import displays, { Display } from '/src/core/displays';
import { CircleLayer } from '/src/core/layers/circle.layer';
import { EllipseLayer } from '/src/core/layers/ellipse.layer';
import { TextLayer } from '/src/core/layers/text.layer';
import { PlatformTemplates } from '/src/types';
import { packedHexColor565, toCppVariableName } from '/src/utils';
import { AbstractDrawingRenderer, PixelatedDrawingRenderer } from '../draw/renderers';

export type TPlatformFeatures = {
    hasCustomFontSize: boolean;
    hasInvertedColors: boolean;
    hasRGBSupport: boolean;
    // When false, the platform is RGB-only and should skip monochrome modes.
    hasMonochromeSupport?: boolean;
    defaultColor: string;
    defaultButtonColor?: string;
    defaultButtonTextColor?: string;
    screenBgColor?: string;
    hasIndexedColors?: boolean;
    hasRoundCorners?: boolean;
    hasFonts?: boolean;
    hasImages?: boolean;
    palette?: string[];
    interfaceColors: {
        selectColor: string;
        resizeIconColor: string;
        hoverColor: string;
        rulerColor: string;
        rulerLineColor: string;
        selectionStrokeColor: string;
    };
    smooth?: boolean;
    isHidden?: boolean;
    clearScreenMethod?: string;
    hasAlphaChannel?: boolean;
};

/**
 * Abstract platform definition.
 */
export abstract class Platform {
    static id: string;
    protected fonts: TPlatformFont[];
    protected name: string;
    protected description: string;
    public features: TPlatformFeatures = {
        hasCustomFontSize: false,
        hasInvertedColors: false,
        hasRGBSupport: false,
        // Allow monochrome assets by default for platforms that support it.
        hasMonochromeSupport: true,
        defaultColor: '#FFFFFF',
        screenBgColor: '#000000',
        hasIndexedColors: false,
        hasRoundCorners: true,
        hasFonts: true,
        interfaceColors: {
            selectColor: '#8f8f8f',
            resizeIconColor: '#8f8f8f',
            hoverColor: '#8f8f8f',
            rulerColor: '#8f8f8f',
            rulerLineColor: '#8f8f8f',
            selectionStrokeColor: '#8f8f8f',
        },
        smooth: false,
        isHidden: false,
        hasAlphaChannel: false,
    };

    protected templates: PlatformTemplates;
    protected currentTemplate: string = 'Default';
    protected settings = {};
    protected parser: AbstractParser;
    public displays: Display[] = displays;
    public sourceMapParser: SourceMapParser = new SourceMapParser();

    abstract generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D, screenTitle?: string): string;

    importSourceCode(sourceCode: string): { states: any[]; warnings: string[] } {
        return this.parser.importSourceCode(sourceCode);
    }

    processLayerModifiers(layer: AbstractLayer, props: any, overrides: any = {}) {
        const modifyPropsHandlers = {
            x: (layer: AbstractLayer, props: any) => {
                if (layer instanceof CircleLayer) {
                    props.x = layer.position.x + layer.radius;
                } else if (layer instanceof EllipseLayer) {
                    props.x = layer.position.x + layer.rx;
                } else {
                    props.x = layer.position.x;
                }
            },
            y: (layer: AbstractLayer, props: any) => {
                if (layer instanceof CircleLayer) {
                    props.y = layer.position.y + layer.radius;
                } else if (layer instanceof EllipseLayer) {
                    props.y = layer.position.y + layer.ry;
                } else if (layer instanceof TextLayer) {
                    props.y = this.getTextPosition(props)[1];
                } else {
                    props.y = layer.position.y;
                }
            },
            w: (layer: AbstractLayer, props: any) => {
                props.w = layer.size.x;
            },
            h: (layer: AbstractLayer, props: any) => {
                props.h = layer.size.y;
            },
            x1: (layer: AbstractLayer, props: any) => {
                props.x1 = layer.p1.x;
            },
            y1: (layer: AbstractLayer, props: any) => {
                props.y1 = layer.p1.y;
            },
            x2: (layer: AbstractLayer, props: any) => {
                props.x2 = layer.p2.x;
            },
            y2: (layer: AbstractLayer, props: any) => {
                props.y2 = layer.p2.y;
            },
            x3: (layer: AbstractLayer, props: any) => {
                props.x3 = layer.p3.x;
            },
            y3: (layer: AbstractLayer, props: any) => {
                props.y3 = layer.p3.y;
            },
            rx: (layer: AbstractLayer, props: any) => {
                props.rx = layer.rx;
            },
            ry: (layer: AbstractLayer, props: any) => {
                props.ry = layer.ry;
            },
            fontSize: (layer: AbstractLayer, props: any) => {
                props.fontSize = layer.scaleFactor;
            },
            color: (layer: AbstractLayer, props: any) => {
                props.color = this.packColor(layer.color);
            },
            text: (layer: AbstractLayer, props: any) => {
                // Escape quotes for generated string literals.
                props.text = props.text.replace(/"/g, '\\"');
                // Normalize textarea line breaks for generated code.
                if (layer.getType() === 'textarea') {
                    // Double-escape so the Pug template keeps a literal backslash.
                    props.text = props.text.replace(/\r?\n/g, '\\n');
                }
            },
            ...overrides,
        };

        Object.keys(layer.modifiers).forEach((name) => {
            if (modifyPropsHandlers[name]) {
                modifyPropsHandlers[name](layer, props);
            }
        });
    }

    protected processVarDeclarations(layer: AbstractLayer, props: any, declarations: { type: string; data: any }[]) {
        Object.keys(layer.variables).forEach((name) => {
            if (layer.variables[name]) {
                const varName = toCppVariableName(`${layer.name}_${name}`);
                declarations.push({
                    type: 'var',
                    data: {
                        name: varName,
                        value: props[name],
                        type: layer.modifiers[name].type,
                    },
                });
                props[name] = varName;
                if (['text', 'textarea', 'checkbox', 'button'].includes(name)) {
                    props.isTextVariable = true;
                }
            }
        });
        return declarations.sort((a, b) => a.data.name.localeCompare(b.data.name));
    }

    packColor(color: string): string {
        return packedHexColor565(color);
    }

    getTextPosition(layer: TextLayer) {
        return [layer.position[0], layer.position[1] - layer.bounds[3]];
    }

    getClearScreenMethod(color) {
        return `fillScreen(${this.packColor(color)})`;
    }

    public getTemplate(): string {
        return this.currentTemplate;
    }

    public getTemplateSettings(): any {
        return this.templates[this.currentTemplate].settings;
    }

    public getTemplates(): any {
        return this.templates;
    }

    public setTemplate(templateName: string): void {
        this.currentTemplate = templateName;
    }

    public setTemplateSetting(name: string, value: boolean): void {
        this.templates[this.currentTemplate].settings[name] = value;
    }

    public getFonts(): TPlatformFont[] {
        return this.fonts;
    }

    public getName(): string {
        return this.name;
    }

    public getDescription(): string {
        return this.description;
    }

    public hasParser(): boolean {
        return !!this.parser;
    }

    /**
     * Create a drawing renderer for this platform
     * @returns Platform-specific drawing renderer
     */
    public createRenderer(): AbstractDrawingRenderer {
        // Default implementation uses pixelated renderer for backward compatibility
        return new PixelatedDrawingRenderer();
    }
}
