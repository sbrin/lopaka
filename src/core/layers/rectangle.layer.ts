import {TPlatformFeatures} from '../../platforms/platform';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TLayerState, TModifierType} from './abstract.layer';

type TRectangleState = TLayerState & {
    p: number[]; // position [x, y]
    s: number[]; // size [w, h]
    f: boolean; // fill
    r: number; // radius
};

export class RectangleLayer extends AbstractLayer {
    protected type: ELayerType = 'rect';
    protected state: TRectangleState;
    protected editState: {
        firstPoint: Point;
        position: Point;
        size: Point;
        editPoint: TLayerEditPoint;
    } = null;

    public get properties(): any {
        return {
            x: this.position.x,
            y: this.position.y,
            w: this.size.x,
            h: this.size.y,
            fill: this.fill,
            color: this.color,
            type: this.type,
            id: this.uid,
            inverted: this.inverted
        };
    }

    public position: Point = new Point();
    public size: Point = new Point();
    public fill: boolean = false;
    public radius: number = 0;

    modifiers: TLayerModifiers = {
        x: {
            getValue: () => this.position.x,
            setValue: (v: number) => {
                this.position.x = v;

                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        y: {
            getValue: () => this.position.y,
            setValue: (v: number) => {
                this.position.y = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        w: {
            getValue: () => this.size.x,
            setValue: (v: number) => {
                this.size.x = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        h: {
            getValue: () => this.size.y,
            setValue: (v: number) => {
                this.size.y = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        radius: {
            getValue: () => this.radius,
            setValue: (v: number) => {
                this.radius = Math.min(v, Math.round(this.size.x / 2), Math.round(this.size.y / 2));
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        fill: {
            getValue: () => this.fill,
            setValue: (v: boolean) => {
                this.fill = v;
                this.saveState();
                this.draw();
            },
            type: TModifierType.boolean
        },
        color: {
            getValue: () => this.color,
            setValue: (v: string) => {
                this.color = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.color
        },
        inverted: {
            getValue: () => this.inverted,
            setValue: (v: boolean) => {
                this.inverted = v;
                this.saveState();
                this.draw();
            },
            type: TModifierType.boolean
        }
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
                this.position = this.editState.position.clone().subtract(0, offset.y);
                this.size = new Point(this.editState.size.x - offset.x, this.editState.size.y + offset.y);
            }
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(
                    new Point(this.bounds.x + this.bounds.w, this.bounds.y + this.bounds.h),
                    new Point(3)
                ).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point): void => {
                this.size = this.editState.size.clone().subtract(offset);
            }
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
                this.position = this.editState.position.clone().subtract(offset.x, 0);
                this.size = this.editState.size.clone().add(offset.x, -offset.y);
            }
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point): void => {
                this.position = this.editState.position.clone().subtract(offset);
                this.size = this.editState.size.clone().add(offset);
            }
        }
    ];

    constructor(protected features: TPlatformFeatures) {
        super(features);
        if (!this.features.hasRGBSupport) {
            delete this.modifiers.color;
        }
        if (!this.features.hasInvertedColors) {
            delete this.modifiers.inverted;
        }
        this.color = this.features.defaultColor;
    }

    startEdit(mode: EditMode, point: Point, editPoint: TLayerEditPoint) {
        this.mode = mode;
        if (mode == EditMode.CREATING) {
            this.position = point.clone();
            this.size = new Point(1);
            this.updateBounds();
            this.draw();
        }
        this.editState = {
            firstPoint: point,
            editPoint,
            position: this.position.clone(),
            size: this.size.clone()
        };
    }

    edit(point: Point, originalEvent: MouseEvent) {
        const {position, editPoint, firstPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                editPoint.move(firstPoint.clone().subtract(point));
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
        this.saveState();
        this.history.push(this.state);
    }

    draw() {
        const {dc, position, size} = this;
        dc.clear();
        dc.ctx.fillStyle = this.color;
        dc.ctx.strokeStyle = this.color;
        dc.pixelateRoundedRect(position, size, this.radius, this.fill);
    }

    saveState() {
        const state: TRectangleState = {
            p: this.position.xy,
            s: this.size.xy,
            r: this.radius,
            n: this.name,
            i: this.index,
            g: this.group,
            t: this.type,
            u: this.uid,
            c: this.color,
            f: this.fill,
            in: this.inverted
        };
        this.state = state;
    }

    loadState(state: TRectangleState) {
        this.position = new Point(state.p);
        this.size = new Point(state.s);
        this.radius = state.r ?? 0;
        this.name = state.n;
        this.index = state.i;
        this.group = state.g;
        this.uid = state.u;
        this.color = state.c;
        this.fill = state.f;
        this.inverted = state.in;
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds(): void {
        this.bounds = new Rect(this.position, this.size);
    }
}
