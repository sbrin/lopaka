import {getFont} from '../../draw/fonts';
import {Font, FontFormat} from '../../draw/fonts/font';
import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';
import {AbstractDrawingRenderer} from '../../draw/renderers';

type FixedCorner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

interface CornerConfig {
    shouldBlockInward: (offset: Point) => boolean;
    getFixedPoint: (bounds: Rect) => Point;
    calculateNewPosition: (fixedPoint: Point, newSize: Point) => Point;
}

const CORNER_CONFIGS: Record<FixedCorner, CornerConfig> = {
    'top-left': {
        shouldBlockInward: (offset: Point) => offset.x > 0 || offset.y > 0,
        getFixedPoint: (bounds: Rect) => new Point(bounds.x, bounds.y),
        calculateNewPosition: (fixedPoint: Point, newSize: Point) => new Point(fixedPoint.x, fixedPoint.y + newSize.y),
    },
    'top-right': {
        shouldBlockInward: (offset: Point) => offset.x < 0 || offset.y > 0,
        getFixedPoint: (bounds: Rect) => new Point(bounds.x + bounds.w, bounds.y),
        calculateNewPosition: (fixedPoint: Point, newSize: Point) =>
            new Point(fixedPoint.x - newSize.x, fixedPoint.y + newSize.y),
    },
    'bottom-left': {
        shouldBlockInward: (offset: Point) => offset.x > 0 || offset.y < 0,
        getFixedPoint: (bounds: Rect) => new Point(bounds.x, bounds.y + bounds.h),
        calculateNewPosition: (fixedPoint: Point, newSize: Point) => fixedPoint.clone(),
    },
    'bottom-right': {
        shouldBlockInward: (offset: Point) => offset.x < 0 || offset.y < 0,
        getFixedPoint: (bounds: Rect) => new Point(bounds.x + bounds.w, bounds.y + bounds.h),
        calculateNewPosition: (fixedPoint: Point, newSize: Point) => new Point(fixedPoint.x - newSize.x, fixedPoint.y),
    },
};

export class TextLayer extends AbstractLayer {
    protected type: ELayerType = 'string';
    protected editState: {
        firstPoint: Point;
        position: Point;
        text: string;
        scaleFactor: number;
        editPoint: TLayerEditPoint;
        originalCornerPosition?: Point;
    } = null;

    @mapping('p', 'point') public position: Point = new Point();
    @mapping('d') public text: string = 'Text';
    @mapping('z') public scaleFactor: number = 1;
    @mapping('f', 'font') public font: Font;
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
        font: {
            getValue: () => this.font?.name,
            setValue: (v: string) => {
                this.font = getFont(v);
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.font,
        },
        text: {
            getValue: () => this.text,
            setValue: (v: string) => {
                this.text = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.string,
        },
        fontSize: {
            getValue: () => this.scaleFactor,
            setValue: (v: string) => {
                this.scaleFactor = Math.max(parseInt(v), 1);
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number,
            fixed: true,
        },
        color: {
            getValue: () => this.color,
            setValue: (v: string) => {
                this.color = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.color,
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

    editPoints: TLayerEditPoint[] = [
        {
            // top right - bottom left corner stays fixed
            cursor: 'nesw-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x + this.bounds.w, this.bounds.y), new Point(3)).subtract(
                    1.5,
                    1.5,
                    0,
                    0
                ),
            move: (offset: Point, event?: MouseEvent): void => {
                this.applyScaleWithThreshold('bottom-left', offset);
            },
        },
        {
            // bottom right - top left corner stays fixed
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(
                    new Point(this.bounds.x + this.bounds.w, this.bounds.y + this.bounds.h),
                    new Point(3)
                ).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, event?: MouseEvent): void => {
                this.applyScaleWithThreshold('top-left', offset);
            },
        },
        {
            // bottom left - top right corner stays fixed
            cursor: 'nesw-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y + this.bounds.h), new Point(3)).subtract(
                    1.5,
                    1.5,
                    0,
                    0
                ),
            move: (offset: Point, event?: MouseEvent): void => {
                this.applyScaleWithThreshold('top-right', offset);
            },
        },
        {
            // top left - bottom right corner stays fixed
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, event?: MouseEvent): void => {
                this.applyScaleWithThreshold('bottom-right', offset);
            },
        },
    ];

    private applyScaleWithThreshold(fixedCorner: FixedCorner, offset: Point): void {
        if (!this.editState) return;

        const cornerConfig = CORNER_CONFIGS[fixedCorner];

        // If scale is 1, prevent inward movements that would make text smaller
        if (this.scaleFactor === 1 && cornerConfig.shouldBlockInward(offset)) {
            return;
        }

        // Calculate current text bounds
        const currentSize = this.font.getSize(this.dc, this.text, this.scaleFactor);
        const currentBounds = new Rect(this.position.clone().subtract(0, currentSize.y), currentSize);

        // Get fixed corner position (the corner that stays in place)
        const fixedCornerPos = cornerConfig.getFixedPoint(currentBounds);

        // Calculate virtual rectangle based on cursor position and fixed corner
        const cursorPos = this.editState.firstPoint.clone().subtract(offset);
        const virtualWidth = Math.abs(cursorPos.x - fixedCornerPos.x);
        const virtualHeight = Math.abs(cursorPos.y - fixedCornerPos.y);

        // Calculate next possible sizes
        const nextSizeUp = this.font.getSize(this.dc, this.text, this.scaleFactor + 1);
        const nextSizeDown = this.scaleFactor > 1 ? this.font.getSize(this.dc, this.text, this.scaleFactor - 1) : null;

        // Determine if we should increase or decrease font size based on virtual rectangle
        let newScaleFactor = this.scaleFactor;

        if (nextSizeUp && virtualWidth > nextSizeUp.x && virtualHeight > nextSizeUp.y) {
            // Virtual rectangle is larger than next size up - increase font size
            newScaleFactor = this.scaleFactor + 1;
        } else if (nextSizeDown && virtualWidth < nextSizeDown.x && virtualHeight < nextSizeDown.y) {
            // Virtual rectangle is smaller than next size down - decrease font size
            newScaleFactor = this.scaleFactor - 1;
        } else {
            // Virtual rectangle is within current size range, no change
            return;
        }

        // Apply the font size change with fixed corner logic
        this.applyScaleWithFixedCorner(newScaleFactor, fixedCorner);
    }

    private applyScaleWithFixedCorner(newScaleFactor: number, fixedCorner: FixedCorner): void {
        if (!this.editState) return;

        const cornerConfig = CORNER_CONFIGS[fixedCorner];

        // Calculate current text dimensions
        const currentSize = this.font.getSize(this.dc, this.text, this.scaleFactor);
        const newSize = this.font.getSize(this.dc, this.text, newScaleFactor);

        // Calculate the fixed corner position in the current state
        const currentBounds = new Rect(this.position.clone().subtract(0, currentSize.y), currentSize);
        const fixedPoint = cornerConfig.getFixedPoint(currentBounds);

        // Calculate new position to keep the fixed corner in the same place
        const newPosition = cornerConfig.calculateNewPosition(fixedPoint, newSize);

        // Apply the changes
        this.scaleFactor = newScaleFactor;
        this.position = newPosition;
    }

    private platformId?: string;

    constructor(
        protected features: TPlatformFeatures,
        renderer?: AbstractDrawingRenderer,
        font?: Font,
        platformId?: string
    ) {
        super(features, renderer);

        // Disable edit points for u8g2 and micropython platforms
        if (['u8g2', 'micropython', 'flipper'].includes(platformId)) {
            this.editPoints = [];
        }

        this.platformId = platformId;

        if (!this.features.hasCustomFontSize) {
            delete this.modifiers.fontSize;
        }
        if (!this.features.hasRGBSupport && !this.features.hasIndexedColors) {
            delete this.modifiers.color;
        }
        if (!this.features.hasInvertedColors) {
            delete this.modifiers.inverted;
        }
        this.scaleFactor = font?.format == FontFormat.FORMAT_TTF ? 14 : 1;
        if (font) {
            this.font = font;
        }
        this.color = this.features.defaultColor;
    }

    startEdit(mode: EditMode, point: Point, editPoint?: TLayerEditPoint) {
        this.pushHistory();
        this.mode = mode;
        if (mode == EditMode.CREATING) {
            this.position = point.clone();
            this.updateBounds();
            this.draw();
        }
        this.editState = {
            firstPoint: point,
            position: this.position.clone(),
            text: this.text,
            scaleFactor: this.scaleFactor,
            editPoint: editPoint,
        };
    }

    edit(point: Point, originalEvent: MouseEvent | TouchEvent) {
        if (!this.editState) {
            return;
        }
        const {position, text, firstPoint, editPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                editPoint.move(firstPoint.clone().subtract(point), originalEvent);
                break;
            case EditMode.CREATING:
                this.position = point.clone();
                break;
        }
        this.updateBounds();
        this.draw();
    }

    stopEdit() {
        this.mode = EditMode.NONE;
        this.editState = null;
        this.pushRedoHistory();
    }

    draw() {
        this.renderer.drawText(this.position, this.text, this.font, this.scaleFactor, this.color);

        // Draw transparent overlay for bounds (this is used for selection/interaction)
        const ctx = this.renderer.dc.ctx;
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.beginPath();
        ctx.rect(this.bounds.x, this.bounds.y, this.bounds.w, this.bounds.h);
        ctx.fill();
        ctx.restore();
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds(): void {
        const {dc, font, position, text} = this;
        const size = font.getSize(dc, text, this.scaleFactor);
        this.bounds = new Rect(position.clone().subtract(0, size.y), size);
    }

    protected createCloneInstance(): this {
        // Rebuild a text layer clone with a fresh renderer while preserving font and platform metadata.
        const RendererCtor = this.renderer.constructor as new () => AbstractDrawingRenderer;
        const renderer = new RendererCtor();
        return new TextLayer(this.features, renderer, this.font, this.platformId) as this;
    }
}
