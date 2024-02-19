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
    protected currentTemplate: string;
    protected settings = {
        wrap: false
    };

    abstract generateSourceCode(
        templateName: string,
        layers: AbstractLayer[],
        ctx?: OffscreenCanvasRenderingContext2D
    ): string;

    public getTemplates(): any {
        return this.templates;
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
