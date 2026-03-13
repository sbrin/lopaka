import { TPlatformFeatures } from '../../platforms/platform';
import { Point } from '../point';
import { AbstractImageLayer } from './abstract-image.layer';
import { EditMode, TLayerEditPoint, TLayerModifier, TLayerModifiers, TModifierType } from './abstract.layer';
import { addAlphaChannelToImageData, applyColor } from '/src/utils';
import { Rect } from '../rect';
import { AbstractDrawingRenderer } from '../../draw/renderers';
import { mapping } from '../decorators/mapping';

export function resolvePaintColorMode(features?: TPlatformFeatures): 'rgb' | 'monochrome' {
    if (features?.hasRGBSupport) {
        return 'rgb';
    }

    return 'monochrome';
}

export class PaintLayer extends AbstractImageLayer {
    protected type: ELayerType = 'paint';

    protected editState: {
        firstPoint: Point;
        position: Point;
        size: Point;
        originalData?: ImageData;
        originalRgbData?: ImageData;
        editPoint?: TLayerEditPoint;
    } = null;

    private rgbSnapshot?: ImageData;

    get minLen(): number {
        return 1;
    }

    private buildColorModifier(): TLayerModifier {
        return {
            getValue: () => this.color,
            setValue: (v: string) => {
                this.color = v;
                this.applyColor();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.color,
        };
    }

    modifiers: TLayerModifiers = {
        x: {
            getValue: () => this.position.x,
            setValue: (v: number) => {
                this.position.x = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        y: {
            getValue: () => this.position.y,
            setValue: (v: number) => {
                this.position.y = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        w: {
            getValue: () => this.size.x,
            type: TModifierType.number,
            fixed: true,
        },
        h: {
            getValue: () => this.size.y,
            type: TModifierType.number,
            fixed: true,
        },
        icon: {
            getValue: () => this.data,
            setValue: (v: HTMLImageElement) => {
                this.imageName = v.dataset.name;
                // Use dataset dimensions if available, otherwise fall back to intrinsic image dimensions
                const w = Number(v.dataset.w) || v.naturalWidth || 0;
                const h = Number(v.dataset.h) || v.naturalHeight || 0;
                if (w && h) {
                    this.size = new Point(w, h);
                }
                // Only update colorMode if explicitly set in dataset, otherwise keep current
                if (v.dataset.colorMode) {
                    this.colorMode = v.dataset.colorMode === 'rgb' ? 'rgb' : 'monochrome';
                }
                if (this.colorMode === 'rgb') {
                    delete this.modifiers.color;
                } else if (!this.modifiers.color) {
                    this.modifiers.color = this.buildColorModifier();
                    this.color = this.features.defaultColor;
                }
                const buf = document.createElement('canvas');
                const ctx = buf.getContext('2d');
                buf.width = this.size.x;
                buf.height = this.size.y;
                ctx.drawImage(v, 0, 0);
                if (this.colorMode === 'rgb') {
                    this.data = ctx.getImageData(0, 0, this.size.x, this.size.y);
                    this.rgbSnapshot = this.cloneImageData(this.data);
                } else {
                    this.data = addAlphaChannelToImageData(
                        ctx.getImageData(0, 0, this.size.x, this.size.y),
                        this.color
                    );
                }
                this.updateBounds();
                // this.applyColor();
                this.draw();
            },
            type: TModifierType.image,
        },
        overlay: {
            getValue: () => this.overlay,
            setValue: (v: boolean) => {
                this.overlay = v;
                this.draw();
            },
            type: TModifierType.boolean,
        },
        alphaChannel: {
            getValue: () => this.alphaChannel,
            setValue: (v: boolean) => {
                this.alphaChannel = v;
                this.draw();
            },
            type: TModifierType.boolean,
        },
        inverted: {
            getValue: () => this.inverted,
            setValue: (v: boolean) => {
                this.inverted = v;
                this.draw();
            },
            type: TModifierType.boolean,
        },
    };

    constructor(
        protected features: TPlatformFeatures,
        renderer?: AbstractDrawingRenderer,
        colorMode = 'monochrome'
    ) {
        super(features, renderer);
        this.modifiers.color = this.buildColorModifier();
        if (!this.features.hasInvertedColors) {
            delete this.modifiers.inverted;
        }
        this.colorMode = colorMode;
        if (colorMode === 'rgb') {
            delete this.modifiers.color;
            delete this.variables.color;
        } else {
            this.color = this.features.defaultColor;
        }
        if (!this.features.hasAlphaChannel) {
            delete this.modifiers.alphaChannel;
        }
    }

    setColorMode(mode: 'rgb' | 'monochrome', color?: string) {
        if (!this.data) {
            return;
        }
        const targetColor = color ?? this.color ?? this.features.defaultColor;
        const previousMode = this.colorMode;

        if (mode === 'monochrome' || this.features.hasIndexedColors) {
            this.color = targetColor;
            if (!this.modifiers.color) {
                this.modifiers.color = this.buildColorModifier();
            }
            if (previousMode === 'rgb') {
                this.rgbSnapshot = this.cloneImageData(this.data);
            }
            const source = this.rgbSnapshot ?? this.data;
            this.data = addAlphaChannelToImageData(source, this.color);
            this.data = applyColor(this.data, this.color);

            this.alphaChannel = true;
        } else if (this.rgbSnapshot) {
            this.data = this.cloneImageData(this.rgbSnapshot);
        }

        if (mode === 'rgb') {
            delete this.modifiers.color;
            delete this.variables.color;

            if (!this.features.hasAlphaChannel) {
                this.alphaChannel = false;
            }
        }

        if (this.colorMode !== mode) {
            this.colorMode = mode;
        }

        this.draw();
    }

    private cloneImageData(data: ImageData): ImageData {
        return new ImageData(new Uint8ClampedArray(data.data), data.width, data.height);
    }

    private resizeBitmapWithScale(originalData: ImageData, scaleFactor: number): ImageData {
        const scaledWidth = Math.max(1, Math.round(originalData.width * scaleFactor));
        const scaledHeight = Math.max(1, Math.round(originalData.height * scaleFactor));

        const sourceCanvas = document.createElement('canvas');
        const sourceCtx = sourceCanvas.getContext('2d');
        sourceCanvas.width = originalData.width;
        sourceCanvas.height = originalData.height;
        sourceCtx.putImageData(originalData, 0, 0);

        const targetCanvas = document.createElement('canvas');
        const targetCtx = targetCanvas.getContext('2d');
        targetCanvas.width = scaledWidth;
        targetCanvas.height = scaledHeight;

        targetCtx.imageSmoothingEnabled = false;
        targetCtx.drawImage(
            sourceCanvas,
            0,
            0,
            originalData.width,
            originalData.height,
            0,
            0,
            scaledWidth,
            scaledHeight
        );

        return targetCtx.getImageData(0, 0, scaledWidth, scaledHeight);
    }

    private calculateNewScale(targetScale: number): number {
        if (targetScale < 1) {
            // Find the appropriate power of 0.5: 0.5, 0.25, 0.125, 0.0625, etc.
            let scale = 0.5;
            while (scale > targetScale && scale > 0.0625) {
                // Minimum scale to prevent too small images
                scale *= 0.5;
            }
            // Ensure the resulting dimensions are whole pixels
            const testWidth = Math.round(this.editState.originalData.width * scale);
            const testHeight = Math.round(this.editState.originalData.height * scale);
            if (testWidth >= 1 && testHeight >= 1) {
                return scale;
            } else {
                // If too small, use the previous scale level
                return scale * 2;
            }
        } else {
            return Math.max(1, Math.round(targetScale));
        }
    }

    private applyScaling(newScale: number, originalSize: Point, positionAdjustment: Point): void {
        const scaledSize = new Point(
            Math.max(1, Math.round(originalSize.x * newScale)),
            Math.max(1, Math.round(originalSize.y * newScale))
        );

        this.position = this.editState.position.clone().subtract(positionAdjustment);
        this.size = scaledSize;

        if (Math.abs(newScale - 1) > 0.001) {
            this.data = this.resizeBitmapWithScale(this.editState.originalData, newScale);
        } else {
            this.data = new ImageData(
                this.editState.originalData.data.slice(),
                this.editState.originalData.width,
                this.editState.originalData.height
            );
        }
    }

    editPoints: TLayerEditPoint[] = [
        {
            // top right
            cursor: 'nesw-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x + this.bounds.w, this.bounds.y), new Point(3)).subtract(
                    1.5,
                    1.5,
                    0,
                    0
                ),
            move: (offset: Point, event?: MouseEvent): void => {
                if (!this.editState?.originalData) return;

                const originalSize = this.editState.size.clone();
                const targetSize = new Point(originalSize.x - offset.x, originalSize.y + offset.y);
                const targetScale = Math.min(targetSize.x / originalSize.x, targetSize.y / originalSize.y);
                const newScale = this.calculateNewScale(targetScale);
                const currentScale = this.size.x / originalSize.x;

                if (Math.abs(newScale - currentScale) > 0.001) {
                    const scaledSize = new Point(
                        Math.max(1, Math.round(originalSize.x * newScale)),
                        Math.max(1, Math.round(originalSize.y * newScale))
                    );
                    // Adjust position to maintain bottom-left corner
                    const positionAdjustment = new Point(0, scaledSize.y - this.editState.size.y);
                    this.applyScaling(newScale, originalSize, positionAdjustment);
                }
            },
        },
        {
            // bottom right
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(
                    new Point(this.bounds.x + this.bounds.w, this.bounds.y + this.bounds.h),
                    new Point(3)
                ).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, event?: MouseEvent): void => {
                if (!this.editState?.originalData) return;

                const originalSize = this.editState.size.clone();
                const targetSize = originalSize.clone().subtract(offset);
                const targetScale = Math.min(targetSize.x / originalSize.x, targetSize.y / originalSize.y);
                const newScale = this.calculateNewScale(targetScale);
                const currentScale = this.size.x / originalSize.x;

                if (Math.abs(newScale - currentScale) > 0.001) {
                    // No position adjustment needed - top-left corner stays fixed
                    this.applyScaling(newScale, originalSize, new Point(0, 0));
                }
            },
        },
        {
            // bottom left
            cursor: 'nesw-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y + this.bounds.h), new Point(3)).subtract(
                    1.5,
                    1.5,
                    0,
                    0
                ),
            move: (offset: Point, event?: MouseEvent): void => {
                if (!this.editState?.originalData) return;

                const originalSize = this.editState.size.clone();
                const targetSize = new Point(originalSize.x + offset.x, originalSize.y - offset.y);
                const targetScale = Math.min(targetSize.x / originalSize.x, targetSize.y / originalSize.y);
                const newScale = this.calculateNewScale(targetScale);
                const currentScale = this.size.x / originalSize.x;

                if (Math.abs(newScale - currentScale) > 0.001) {
                    const scaledSize = new Point(
                        Math.max(1, Math.round(originalSize.x * newScale)),
                        Math.max(1, Math.round(originalSize.y * newScale))
                    );
                    // Adjust position to maintain top-right corner
                    const positionAdjustment = new Point(scaledSize.x - this.editState.size.x, 0);
                    this.applyScaling(newScale, originalSize, positionAdjustment);
                }
            },
        },
        {
            // top left
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, event?: MouseEvent): void => {
                if (!this.editState?.originalData) return;

                const originalSize = this.editState.size.clone();
                const targetSize = originalSize.clone().add(offset);
                const targetScale = Math.min(targetSize.x / originalSize.x, targetSize.y / originalSize.y);
                const newScale = this.calculateNewScale(targetScale);
                const currentScale = this.size.x / originalSize.x;

                if (Math.abs(newScale - currentScale) > 0.001) {
                    const scaledSize = new Point(
                        Math.max(1, Math.round(originalSize.x * newScale)),
                        Math.max(1, Math.round(originalSize.y * newScale))
                    );
                    // Adjust position to maintain bottom-right corner
                    const positionAdjustment = new Point(
                        scaledSize.x - this.editState.size.x,
                        scaledSize.y - this.editState.size.y
                    );
                    this.applyScaling(newScale, originalSize, positionAdjustment);
                }
            },
        },
    ];

    startEdit(mode: EditMode, point: Point, editPoint: TLayerEditPoint, originalEvent: MouseEvent | TouchEvent) {
        this.pushHistory();
        if (originalEvent && (originalEvent.button === 2 || originalEvent.metaKey)) {
            this.mode = EditMode.ERASING;
        } else {
            this.mode = mode;
        }
        this.editState = {
            firstPoint: point,
            position: this.position?.clone() || new Point(),
            size: this.size?.clone() || new Point(),
            originalData: this.data ? new ImageData(this.data.data.slice(), this.data.width, this.data.height) : null,
            originalRgbData: this.getRgbSourceData(),
            editPoint: editPoint,
        };
        if (mode === EditMode.CREATING) {
            this.editState.position = point.clone();
        }
    }

    private getRgbSourceData(): ImageData | null {
        const source = this.colorMode === 'rgb' ? this.data : this.rgbSnapshot;
        return source ? this.cloneImageData(source) : null;
    }

    edit(point: Point, originalEvent: MouseEvent | TouchEvent) {
        if (!this.editState) {
            return;
        }

        const { ctx } = this.dc;
        const { position, firstPoint, size } = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                const newPos = position.clone().add(point.clone().subtract(firstPoint)).round();
                this.position = newPos.clone();
                break;
            case EditMode.RESIZING:
                if (this.editState.editPoint) {
                    this.editState.editPoint.move(firstPoint.clone().subtract(point), originalEvent);
                }
                break;
            case EditMode.CREATING:
                ctx.save();
                ctx.beginPath();
                if (position.distanceTo(point) < 1) {
                    ctx.rect(point.x, point.y, 1, 1);
                } else {
                    this.dc.pixelateLine(position, point, 1);
                }
                ctx.fillStyle = this.color;
                ctx.fill();
                this.editState.position = point.clone();
                ctx.closePath();
                ctx.restore();
                this.recalculate();
                break;
            case EditMode.ERASING:
                ctx.save();
                if (this.editState.firstPoint.distanceTo(point) < 1) {
                    ctx.clearRect(point.x, point.y, 1, 1);
                } else {
                    ctx.globalCompositeOperation = 'destination-out';
                    this.dc.pixelateLine(this.editState.firstPoint, point, 1);
                }
                ctx.restore();
                this.editState.firstPoint = point.clone();
                this.recalculate();
                break;
        }
        this.updateBounds();
        this.draw();
    }

    stopEdit() {
        this.mode = EditMode.NONE;
        this.updateBounds();
        const { originalData, originalRgbData } = this.editState ?? {};
        this.pushRedoHistory();
        if (this.colorMode === 'rgb') {
            this.rgbSnapshot = this.data ? this.cloneImageData(this.data) : undefined;
        } else if (this.rgbSnapshot && originalData && originalRgbData && this.data) {
            this.mergeMonochromeEditsIntoRgbSnapshot(originalData, this.data, originalRgbData);
        }
        this.editState = null;
    }

    draw() {
        if (this.data) {
            super.draw();
        }
    }

    private mergeMonochromeEditsIntoRgbSnapshot(
        previousMonochrome: ImageData,
        currentMonochrome: ImageData,
        previousRgb: ImageData
    ) {
        if (!this.rgbSnapshot) {
            return;
        }

        if (
            previousMonochrome.width !== currentMonochrome.width ||
            previousMonochrome.height !== currentMonochrome.height ||
            previousRgb.width !== this.rgbSnapshot.width ||
            previousRgb.height !== this.rgbSnapshot.height
        ) {
            this.rgbSnapshot = this.cloneImageData(currentMonochrome);
            return;
        }

        const updated = new Uint8ClampedArray(this.rgbSnapshot.data);
        const prevMonoData = previousMonochrome.data;
        const currentMonoData = currentMonochrome.data;
        for (let i = 0; i < currentMonoData.length; i += 4) {
            const prevAlpha = prevMonoData[i + 3];
            const currentAlpha = currentMonoData[i + 3];
            const colorChanged =
                prevMonoData[i] !== currentMonoData[i] ||
                prevMonoData[i + 1] !== currentMonoData[i + 1] ||
                prevMonoData[i + 2] !== currentMonoData[i + 2] ||
                prevAlpha !== currentAlpha;

            if (!colorChanged) {
                continue;
            }

            if (currentAlpha === 0) {
                updated[i] = 0;
                updated[i + 1] = 0;
                updated[i + 2] = 0;
                updated[i + 3] = 0;
            } else {
                updated[i] = currentMonoData[i];
                updated[i + 1] = currentMonoData[i + 1];
                updated[i + 2] = currentMonoData[i + 2];
                updated[i + 3] = currentAlpha;
            }
        }

        this.rgbSnapshot = new ImageData(updated, currentMonochrome.width, currentMonochrome.height);
    }

    protected createCloneInstance(): this {
        // Clone paint layers with a fresh renderer while preserving the color mode.
        const RendererCtor = this.renderer.constructor as new () => AbstractDrawingRenderer;
        const renderer = new RendererCtor();
        return new PaintLayer(this.features, renderer, this.colorMode) as this;
    }
}
