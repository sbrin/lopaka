import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';
import {getFont} from '../../draw/fonts';
import {Font} from '../../draw/fonts/font';
import {AbstractDrawingRenderer} from '../../draw/renderers';
import {
    LVGL_BUTTON_DEFAULT_BG_COLOR,
    LVGL_BUTTON_DEFAULT_TEXT_COLOR,
    LVGL_BUTTON_DEFAULT_RADIUS,
} from '../../platforms/lvgl/constants';

export class ButtonLayer extends AbstractLayer {
    protected type: ELayerType = 'button';
    protected editState: {
        firstPoint: Point;
        position: Point;
        size: Point;
        editPoint: TLayerEditPoint;
    } = null;

    @mapping('p', 'point') public position: Point = new Point();
    @mapping('s', 'point') public size: Point = new Point();
    @mapping('r') public radius: number = LVGL_BUTTON_DEFAULT_RADIUS;
    @mapping('d') public text: string = 'Button';
    @mapping('f', 'font') public font: Font;
    @mapping('c') public color: string = LVGL_BUTTON_DEFAULT_TEXT_COLOR; // text color
    @mapping('bc') public backgroundColor: string = LVGL_BUTTON_DEFAULT_BG_COLOR;

    get minLen(): number {
        return this.radius * 2 + 2;
    }

    constructor(
        protected features: TPlatformFeatures,
        renderer?: AbstractDrawingRenderer,
        font?: Font
    ) {
        super(features, renderer);

        this.size = new Point(80, 30); // Default button size

        if (!this.features.hasRGBSupport && !this.features.hasIndexedColors) {
            delete this.modifiers.color;
        }
        if (!this.features.hasRoundCorners) {
            delete this.modifiers.radius;
        }
        this.color = this.features.defaultButtonTextColor;
        this.backgroundColor = this.features.defaultButtonColor;
        if (font) {
            this.font = font;
        }
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
            setValue: (v: number) => {
                this.size.x = Math.max(v, this.minLen);
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        h: {
            getValue: () => this.size.y,
            setValue: (v: number) => {
                this.size.y = Math.max(v, this.minLen);
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        radius: {
            getValue: () => this.radius,
            setValue: (v: number) => {
                this.radius = Math.max(
                    0,
                    Math.min(v, Math.round(this.size.x / 2 - 1), Math.round(this.size.y / 2 - 1))
                );
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
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
        color: {
            getValue: () => this.color,
            setValue: (v: string) => {
                this.color = v;
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.color,
        },
        backgroundColor: {
            getValue: () => this.backgroundColor,
            setValue: (v: string) => {
                this.backgroundColor = v;
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.color,
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
    };

    editPoints: TLayerEditPoint[] = [
        {
            cursor: 'nesw-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x + this.bounds.w, this.bounds.y), new Point(3)).subtract(
                    1.5,
                    1.5,
                    0,
                    0
                ),
            move: (offset: Point): void => {
                const size = new Point(this.editState.size.x - offset.x, this.editState.size.y + offset.y);
                const position = this.editState.position.clone().subtract(0, offset.y);
                if (size.x != this.size.x && size.x >= this.minLen) {
                    this.position.x = position.x;
                    this.size.x = size.x;
                }
                if (size.y != this.size.y && size.y >= this.minLen) {
                    this.position.y = position.y;
                    this.size.y = size.y;
                }
            },
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(
                    new Point(this.bounds.x + this.bounds.w, this.bounds.y + this.bounds.h),
                    new Point(3)
                ).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point): void => {
                this.size = this.editState.size.clone().subtract(offset).max(new Point(this.minLen));
            },
        },
        {
            cursor: 'nesw-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y + this.bounds.h), new Point(3)).subtract(
                    1.5,
                    1.5,
                    0,
                    0
                ),
            move: (offset: Point): void => {
                const position = this.editState.position.clone().subtract(offset.x, 0);
                const size = this.editState.size.clone().add(offset.x, -offset.y);
                if (size.x != this.size.x && size.x >= this.minLen) {
                    this.position.x = position.x;
                    this.size.x = size.x;
                }
                if (size.y != this.size.y && size.y >= this.minLen) {
                    this.position.y = position.y;
                    this.size.y = size.y;
                }
            },
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point): void => {
                const position = this.editState.position.clone().subtract(offset);
                const size = this.editState.size.clone().add(offset);
                if (size.x != this.size.x && size.x >= this.minLen) {
                    this.position.x = position.x;
                    this.size.x = size.x;
                }
                if (size.y != this.size.y && size.y >= this.minLen) {
                    this.size.y = size.y;
                    this.position.y = position.y;
                }
            },
        },
    ];

    startEdit(mode: EditMode, point: Point, editPoint: TLayerEditPoint) {
        this.pushHistory();
        this.mode = mode;
        if (mode == EditMode.CREATING) {
            this.position = point.clone();
            this.updateBounds();
            this.draw();
        }
        this.editState = {
            firstPoint: point,
            editPoint,
            position: this.position.clone(),
            size: this.size.clone(),
        };
    }

    edit(point: Point, originalEvent: MouseEvent | TouchEvent) {
        if (!this.editState) {
            return;
        }
        const {position, editPoint, firstPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                editPoint.move(firstPoint.clone().subtract(point));
                break;
            case EditMode.CREATING:
                break;
        }
        this.updateBounds();
        this.draw();
    }

    stopEdit() {
        this.mode = EditMode.NONE;
        this.editState = null;
    }

    draw() {
        this.renderer.drawButton(
            this.position,
            this.size,
            this.radius,
            this.backgroundColor,
            this.text,
            this.color,
            this.font
        );
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds(): void {
        // For buttons, we need to ensure the bounds account for the text size
        const {dc, font, text, size} = this;
        if (font && text) {
            const textSize = font.getSize(dc, text, 1);
            // Ensure the button is at least as wide as the text plus some padding
            const minWidth = Math.max(size.x, textSize.x + 20);
            const minHeight = Math.max(size.y, textSize.y + 10);
            this.bounds = new Rect(this.position, new Point(minWidth, minHeight));
        } else {
            this.bounds = new Rect(this.position, this.size);
        }
    }

    public contains(point: Point): boolean {
        const localPoint = point.clone().subtract(this.position);
        return localPoint.x >= 0 && localPoint.x < this.size.x && localPoint.y >= 0 && localPoint.y < this.size.y;
    }
}
