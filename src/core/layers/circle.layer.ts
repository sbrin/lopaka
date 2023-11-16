import {TPlatformFeatures} from '../../platforms/platform';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TLayerState, TModifierType} from './abstract.layer';

type TCircleState = TLayerState & {
    p: number[]; // position
    r: number; // radius
};

export class CircleLayer extends AbstractLayer {
    protected type: ELayerType = 'circle';
    protected state: TCircleState;
    public radius: number = 1;
    public position: Point = new Point();
    protected fill: boolean = false;

    protected editState: {
        firstPoint: Point;
        position: Point;
        radius: number;
        editPoint: TLayerEditPoint;
    } = null;

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
        radius: {
            getValue: () => this.radius,
            setValue: (v: number) => {
                this.radius = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
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
        }
    };

    constructor(protected features: TPlatformFeatures) {
        super(features);
        if (!this.features.hasCustomFontSize) {
            delete this.modifiers.fontSize;
        }
        if (!this.features.hasRGBSupport) {
            delete this.modifiers.color;
            this.color = '#000000';
        }
        if (this.features.hasInvertedColors) {
            this.color = '#FFFFFF';
        }
    }

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
                this.position.y = Math.floor(this.editState.position.y + Math.round(offset.x / 2) * 2);
                this.radius = Math.floor(this.editState.radius - offset.x / 2);
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
                this.radius = Math.round(this.editState.radius - offset.x / 2);
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
                this.position.x = Math.ceil(this.editState.position.x - Math.round(offset.x / 2) * 2);
                this.radius = Math.ceil(this.editState.radius + offset.x / 2);
            }
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point): void => {
                this.position = this.editState.position
                    .clone()
                    .subtract(Math.round(offset.x / 2) * 2)
                    .ceil();
                this.radius = Math.ceil(this.editState.radius + offset.x / 2);
            }
        }
    ];

    startEdit(mode: EditMode, point: Point, editPoint: TLayerEditPoint) {
        this.mode = mode;
        if (mode == EditMode.CREATING) {
            this.position = point.clone();
            this.radius = 1;
            this.updateBounds();
            this.draw();
        }
        this.editState = {
            firstPoint: point,
            position: this.position.clone(),
            radius: this.radius,
            editPoint
        };
    }

    edit(point: Point, originalEvent: MouseEvent) {
        const {position, firstPoint, editPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                // todo
                editPoint.move(firstPoint.clone().subtract(point));
                break;
            case EditMode.CREATING:
                const radius = Math.max(
                    Math.max(...point.clone().subtract(firstPoint).abs().divide(2).round().xy) - 2,
                    1
                );
                this.radius = radius;
                if (originalEvent.altKey) {
                    this.position = firstPoint.clone().subtract(radius);
                } else {
                    const signs = point.clone().subtract(firstPoint).xy.map(Math.sign);
                    this.position = firstPoint.min(firstPoint.clone().add(new Point(radius * 2 + 1).multiply(signs)));
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
        const {dc, radius, position} = this;
        const center = position.clone().add(radius);
        dc.clear();
        dc.ctx.fillStyle = this.color;
        dc.ctx.strokeStyle = this.color;
        dc.pixelateCircle(center, radius, this.fill);
    }

    saveState() {
        const state: TCircleState = {
            p: this.position.xy,
            r: this.radius,
            n: this.name,
            i: this.index,
            g: this.group,
            t: this.type,
            u: this.uid,
            c: this.color
        };
        this.state = state;
    }

    loadState(state: TCircleState) {
        this.position = new Point(state.p);
        this.radius = state.r;
        this.name = state.n;
        this.index = state.i;
        this.group = state.g;
        this.uid = state.u;
        this.color = state.c;
        this.updateBounds();
    }

    updateBounds() {
        this.bounds = new Rect(this.position, new Point(this.radius * 2)).add(0, 0, 1, 1);
    }
}
