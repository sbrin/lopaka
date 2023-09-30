/**
 * Abstract platform definition.
 */
export abstract class Platform {
    protected fonts: TPlatformFont[];
    protected name: string;
    protected description: string;

    public getFonts(): TPlatformFont[] {
        return this.fonts;
    }

    public getName(): string {
        return this.name;
    }

    public getDescription(): string {
        return this.description;
    }

    abstract generate(): string;
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
