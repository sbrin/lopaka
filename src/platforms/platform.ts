import {Layer} from 'src/core/layer';

/**
 * Abstract platform definition.
 */
export abstract class Platform {
    protected fonts: TPlatformFont[];
    protected name: string;
    protected description: string;

    public generateSourceCode(layers: Layer[], ctx?: OffscreenCanvasRenderingContext2D): TSourceCode {
        const source: TSourceCode = {code: [], declarations: []};
        for (const layer of layers) {
            switch (layer.type) {
                case 'dot':
                    this.addDot(layer, source);
                    break;
                case 'line':
                    this.addLine(layer, source);
                    break;
                case 'string':
                    this.addText(layer, source);
                    break;
                case 'box':
                    this.addBox(layer, source);
                    break;
                case 'frame':
                    this.addFrame(layer, source);
                    break;
                case 'circle':
                    this.addCircle(layer, source);
                    break;
                case 'disc':
                    this.addDisc(layer, source);
                    break;
                case 'paint':
                case 'bitmap':
                    this.addImage(layer, source);
                    break;
                case 'icon':
                    this.addIcon(layer, source);
                    break;
                default:
                    throw new Error(`Unknown layer type: ${layer.type}`);
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

    abstract addDot(layer: Layer, source: TSourceCode): void;
    abstract addLine(layer: Layer, source: TSourceCode): void;
    abstract addText(layer: Layer, source: TSourceCode): void;
    abstract addBox(layer: Layer, source: TSourceCode): void;
    abstract addFrame(layer: Layer, source: TSourceCode): void;
    abstract addCircle(layer: Layer, source: TSourceCode): void;
    abstract addDisc(layer: Layer, source: TSourceCode): void;
    abstract addImage(layer: Layer, source: TSourceCode): void;
    abstract addIcon(layer: Layer, source: TSourceCode): void;
}
