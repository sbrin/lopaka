import {AbstractLayer} from '../core/layers/abstract.layer';
import {AbstractParser} from './parsers/abstract-parser';
import {SourceMapParser} from './parsers/source-map-parser';

export type TPlatformFeatures = {
    hasCustomFontSize: boolean;
    hasInvertedColors: boolean;
    hasRGBSupport: boolean;
    defaultColor: string;
    screenBgColor?: string;
    hasIndexedColors?: boolean;
    palette?: string[];
    interfaceColors: {
        selectColor: string;
        resizeIconColor: string;
        hoverColor: string;
        rulerColor: string;
    };
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
        defaultColor: '#FFFFFF',
        screenBgColor: '#000000',
        hasIndexedColors: false,
        palette: [],
        interfaceColors: {
            selectColor: '#ff0000',
            resizeIconColor: '#ff0000',
            hoverColor: '#ff0000',
            rulerColor: '#ff0000'
        }
    };

    protected templates: any;
    protected currentTemplate: string = 'Default';
    protected settings = {};
    protected parser: AbstractParser;
    public sourceMapParser: SourceMapParser = new SourceMapParser();

    abstract generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D): string;

    importSourceCode(sourceCode: string): any[] {
        return this.parser.importSourceCode(sourceCode);
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

    public getFonts(): TPlatformFont[] {
        return this.fonts;
    }

    public getName(): string {
        return this.name;
    }

    public getDescription(): string {
        return this.description;
    }
}
