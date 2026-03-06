import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';
import {AbstractDrawingRenderer} from '../../draw/renderers';
import {
    LVGL_PANEL_DEFAULT_BG_COLOR,
    LVGL_PANEL_DEFAULT_BORDER_COLOR,
    LVGL_PANEL_DEFAULT_BORDER_WIDTH,
    LVGL_PANEL_DEFAULT_RADIUS,
} from '../../platforms/lvgl/constants';

export class PanelLayer extends AbstractLayer {
    protected type: ELayerType = 'panel';
    protected editState: {
        firstPoint: Point;
        position: Point;
        size: Point;
        editPoint: TLayerEditPoint;
    } = null;

    @mapping('p', 'point') public position: Point = new Point();

    @mapping('s', 'point') public size: Point = new Point();

    @mapping('r') public radius: number = LVGL_PANEL_DEFAULT_RADIUS;

    @mapping('bc') public backgroundColor: string = LVGL_PANEL_DEFAULT_BG_COLOR;

    // Use the LVGL default background color for panel borders.
    @mapping('bdc') public borderColor: string = LVGL_PANEL_DEFAULT_BORDER_COLOR;

    @mapping('bdw') public borderWidth: number = LVGL_PANEL_DEFAULT_BORDER_WIDTH;

    get minLen(): number {
        return this.radius * 2 + 2;
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
        borderWidth: {
            getValue: () => this.borderWidth,
            setValue: (v: number) => {
                this.borderWidth = Math.max(0, v);
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
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
        borderColor: {
            getValue: () => this.borderColor,
            setValue: (v: string) => {
                this.borderColor = v;
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.color,
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
            move: (offset: Point, event?: MouseEvent): void => {
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
                if (event?.shiftKey) {
                    const left = this.position.x;
                    const bottom = this.position.y + this.size.y;
                    const uniformSize = Math.max(this.minLen, Math.max(this.size.x, this.size.y));
                    this.size.x = uniformSize;
                    this.size.y = uniformSize;
                    this.position.x = left;
                    this.position.y = bottom - this.size.y;
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
            move: (offset: Point, event?: MouseEvent): void => {
                this.size = this.editState.size.clone().subtract(offset).max(new Point(this.minLen));
                if (event?.shiftKey) {
                    const left = this.position.x;
                    const top = this.position.y;
                    const uniformSize = Math.max(this.minLen, Math.max(this.size.x, this.size.y));
                    this.size.x = uniformSize;
                    this.size.y = uniformSize;
                    this.position.x = left;
                    this.position.y = top;
                }
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
            move: (offset: Point, event?: MouseEvent): void => {
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
                if (event?.shiftKey) {
                    const top = this.position.y;
                    const right = this.position.x + this.size.x;
                    const uniformSize = Math.max(this.minLen, Math.max(this.size.x, this.size.y));
                    this.size.x = uniformSize;
                    this.size.y = uniformSize;
                    this.position.y = top;
                    this.position.x = right - this.size.x;
                }
            },
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, event?: MouseEvent): void => {
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
                if (event?.shiftKey) {
                    const right = this.position.x + this.size.x;
                    const bottom = this.position.y + this.size.y;
                    const uniformSize = Math.max(this.minLen, Math.max(this.size.x, this.size.y));
                    this.size.x = uniformSize;
                    this.size.y = uniformSize;
                    this.position.x = right - this.size.x;
                    this.position.y = bottom - this.size.y;
                }
            },
        },
    ];

    constructor(
        protected features: TPlatformFeatures,
        renderer?: AbstractDrawingRenderer
    ) {
        super(features, renderer);

        this.size = new Point(100, 60);

        if (!this.features.hasRGBSupport && !this.features.hasIndexedColors) {
            delete this.modifiers.borderColor;
        }
        if (!this.features.hasRoundCorners) {
            delete this.modifiers.radius;
        }
    }

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
                editPoint.move(firstPoint.clone().subtract(point), originalEvent);
                break;
            case EditMode.CREATING:
                this.position = point.clone().min(firstPoint);
                this.size = point.clone().subtract(firstPoint).abs().max(new Point(1));
                // square
                if (originalEvent.shiftKey) {
                    this.size = new Point(Math.max(this.size.x, this.size.y)).max(new Point(1));
                }
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
        this.renderer.drawPanel(
            this.position,
            this.size,
            this.radius,
            this.backgroundColor,
            this.borderColor,
            this.borderWidth
        );
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds(): void {
        this.bounds = new Rect(this.position, this.size);
    }

    public contains(point: Point): boolean {
        return this.bounds.contains(point);
    }

    getIcon() {
        return 'rect';
    }
}
