import {AbstractLayer} from '../core/layers/abstract.layer';
import {BoxLayer} from '../core/layers/box.layer';
import {CircleLayer} from '../core/layers/circle.layer';
import {DiscLayer} from '../core/layers/disc.layer';
import {DotLayer} from '../core/layers/dot.layer';
import {FrameLayer} from '../core/layers/frame.layer';
import {IconLayer} from '../core/layers/icon.layer';
import {LineLayer} from '../core/layers/line.layer';
import {PaintLayer} from '../core/layers/paint.layer';
import {TextLayer} from '../core/layers/text.layer';

export type TPlatformFeatures = {
    hasCustomFontSize: boolean;
    hasInvertedColors: boolean;
    hasRGBSupport: boolean;
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
        hasRGBSupport: false
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
                case BoxLayer:
                    this.addBox(layer as BoxLayer, source);
                    break;
                case FrameLayer:
                    this.addFrame(layer as FrameLayer, source);
                    break;
                case CircleLayer:
                    this.addCircle(layer as CircleLayer, source);
                    break;
                case DiscLayer:
                    this.addDisc(layer as DiscLayer, source);
                    break;
                case IconLayer:
                    this.addIcon(layer as IconLayer, source);
                    break;
                case PaintLayer:
                    this.addImage(layer as PaintLayer, source);
                    break;
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
    abstract addBox(layer: BoxLayer, source: TSourceCode): void;
    abstract addFrame(layer: FrameLayer, source: TSourceCode): void;
    abstract addCircle(layer: CircleLayer, source: TSourceCode): void;
    abstract addDisc(layer: DiscLayer, source: TSourceCode): void;
    abstract addImage(layer: IconLayer | PaintLayer, source: TSourceCode): void;
    abstract addIcon(layer: IconLayer, source: TSourceCode): void;
}
