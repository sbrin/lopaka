import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';
import {AbstractDrawingRenderer} from '../../draw/renderers';
import {Rect} from '../rect';
import {LVGL_SWITCH_DEFAULT_COLOR, LVGL_SWITCH_DEFAULT_BG_COLOR} from '../../platforms/lvgl/constants';

export class SwitchLayer extends AbstractLayer {
    protected type: ELayerType = 'switch';
    protected editState: {
        firstPoint: Point;
        position: Point;
        size: Point;
        editPoint: TLayerEditPoint;
    } = null;

    @mapping('p', 'point') public position: Point = new Point();
    @mapping('s', 'point') public size: Point = new Point();
    @mapping('ch') public checked: boolean = true;
    // Use LVGL defaults for switch colors.
    @mapping('c') public color: string = LVGL_SWITCH_DEFAULT_COLOR;
    @mapping('bc') public backgroundColor: string = LVGL_SWITCH_DEFAULT_BG_COLOR;

    constructor(
        protected features: TPlatformFeatures,
        renderer?: AbstractDrawingRenderer
    ) {
        super(features, renderer);
        // Default size for switch roughly matching iOS aspect ratio
        this.size = new Point(50, 25);
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
                this.size.x = Math.max(v, 1);
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
                this.size.y = Math.max(v, 1);
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
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
        checked: {
            getValue: () => this.checked,
            setValue: (v: boolean) => {
                this.checked = v;
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.boolean,
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
                if (size.x != this.size.x && size.x >= 1) {
                    this.position.x = position.x;
                    this.size.x = size.x;
                }
                if (size.y != this.size.y && size.y >= 1) {
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
                this.size = this.editState.size.clone().subtract(offset).max(new Point(1, 1));
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
                if (size.x != this.size.x && size.x >= 1) {
                    this.position.x = position.x;
                    this.size.x = size.x;
                }
                if (size.y != this.size.y && size.y >= 1) {
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
                if (size.x != this.size.x && size.x >= 1) {
                    this.position.x = position.x;
                    this.size.x = size.x;
                }
                if (size.y != this.size.y && size.y >= 1) {
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
        if (this.renderer.drawSwitch) {
            this.renderer.drawSwitch(
                this.position,
                this.size,
                this.checked,
                this.color,
                this.backgroundColor
            );
        }
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds(): void {
        this.bounds = new Rect(this.position, this.size);
    }

    public contains(point: Point): boolean {
        const localPoint = point.clone().subtract(this.position);
        // Add a small buffer (2px) to make selection easier
        return (
            localPoint.x >= -2 &&
            localPoint.x < this.size.x + 2 &&
            localPoint.y >= -2 &&
            localPoint.y < this.size.y + 2
        );
    }
}
