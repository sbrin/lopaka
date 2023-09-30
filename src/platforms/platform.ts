/**
 * Abstract platform definition.
 */
export abstract class Platform {
    protected fonts: TPlatformFont[];
    protected name: string;
    protected description: string;

    public generateSourceCode(layers: TLayer[], ctx?: OffscreenCanvasRenderingContext2D): TSourceCode {
        const source: TSourceCode = {code: [], declarations: []};
        for (const layer of layers) {
            switch (layer.type) {
                case 'dot':
                    this.drawDot(layer, source);
                    break;
                case 'line':
                    this.drawLine(layer, source);
                    break;
                case 'text':
                    this.drawText(layer, source);
                    break;
                case 'box':
                    this.drawBox(layer, source);
                    break;
                case 'frame':
                    this.drawFrame(layer, source);
                    break;
                case 'circle':
                    this.drawCircle(layer, source);
                    break;
                case 'disc':
                    this.drawDisc(layer, source);
                    break;
                case 'bitmap':
                    this.drawBitmap(layer, source);
                    break;
                case 'icon':
                    this.drawIcon(layer, source);
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

    abstract drawDot(layer: TLayer, source: TSourceCode): void;
    abstract drawLine(layer: TLayer, source: TSourceCode): void;
    abstract drawText(layer: TLayer, source: TSourceCode): void;
    abstract drawBox(layer: TLayer, source: TSourceCode): void;
    abstract drawFrame(layer: TLayer, source: TSourceCode): void;
    abstract drawCircle(layer: TLayer, source: TSourceCode): void;
    abstract drawDisc(layer: TLayer, source: TSourceCode): void;
    abstract drawBitmap(layer: TLayer, source: TSourceCode): void;
    abstract drawIcon(layer: TLayer, source: TSourceCode): void;
}
