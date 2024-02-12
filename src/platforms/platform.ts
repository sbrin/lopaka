import {AbstractLayer} from '../core/layers/abstract.layer';
import {CircleLayer} from '../core/layers/circle.layer';
import {DotLayer} from '../core/layers/dot.layer';
import {EllipseLayer} from '../core/layers/ellipse.layer';
import {IconLayer} from '../core/layers/icon.layer';
import {LineLayer} from '../core/layers/line.layer';
import {PaintLayer} from '../core/layers/paint.layer';
import {RectangleLayer} from '../core/layers/rectangle.layer';
import {TextLayer} from '../core/layers/text.layer';

export type TPlatformFeatures = {
    hasCustomFontSize: boolean;
    hasInvertedColors: boolean; // has iverted colors screen (pixel is white)
    hasRGBSupport: boolean;
    defaultColor: string;
    hasInvertedMode: boolean; // support of inverted colors (xor node)
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
        defaultColor: '#000000',
        hasInvertedMode: false
    };

    public generateSourceCode(layers: AbstractLayer[], ctx?: OffscreenCanvasRenderingContext2D): TSourceCode {
        const source: TSourceCode = {code: [], declarations: []};
        for (const layer of layers) {
            switch (layer.constructor) {
                case DotLayer:
                    this.addDot(layer as DotLayer, source);
                    break;
                case LineLayer:
                    this.addLine(layer as LineLayer, source);
                    break;
                case TextLayer:
                    this.addText(layer as TextLayer, source);
                    break;
                case RectangleLayer:
                    this.addRect(layer as RectangleLayer, source);
                    break;
                case CircleLayer:
                    this.addCircle(layer as CircleLayer, source);
                    break;
                case IconLayer:
                    this.addIcon(layer as IconLayer, source);
                    break;
                case PaintLayer:
                    this.addImage(layer as PaintLayer, source);
                    break;
                case EllipseLayer:
                    this.addEllipse(layer as EllipseLayer, source);
                default:
                    console.warn(`Unknown layer type: ${layer.constructor.name}`);
            }
        }
        return source;
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

    abstract addDot(layer: DotLayer, source: TSourceCode): void;
    abstract addLine(layer: LineLayer, source: TSourceCode): void;
    abstract addText(layer: TextLayer, source: TSourceCode): void;
    abstract addRect(layer: RectangleLayer, source: TSourceCode): void;
    abstract addCircle(layer: CircleLayer, source: TSourceCode): void;
    abstract addEllipse(layer: EllipseLayer, source: TSourceCode): void;
    abstract addImage(layer: IconLayer | PaintLayer, source: TSourceCode): void;
    abstract addIcon(layer: IconLayer, source: TSourceCode): void;
}
