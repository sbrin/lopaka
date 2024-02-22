import {AbstractLayer} from '../core/layers/abstract.layer';

export type TPlatformFeatures = {
    hasCustomFontSize: boolean;
    hasInvertedColors: boolean;
    hasRGBSupport: boolean;
    defaultColor: string;
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
        defaultColor: '#000000'
    };

    protected templates: any;
    protected currentTemplate: string = 'Default';
    protected settings = {};

    abstract generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D): string;

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
