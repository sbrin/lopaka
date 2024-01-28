import {TPlatformFeatures} from '../../platforms/platform';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TLayerState, TModifierType} from './abstract.layer';

type TEllipseState = TLayerState & {
    p: number[]; // position
    rx: number; // radius X
    ry: number; // radius Y
    f: boolean; // fill
};

export class EllipseLayer extends AbstractLayer {
    protected type: ELayerType = 'ellipse';
    protected state: TEllipseState;
    public radiusX: number = 1;
    public radiusY: number = 1;
    public position: Point = new Point();
    public fill: boolean = false;

    protected editState: {
        firstPoint: Point;
        position: Point;
        radiusX: number;
        radiusY: number;
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
        radiusX: {
            getValue: () => this.radiusX,
            setValue: (v: number) => {
                this.radiusX = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        radiusY: {
            getValue: () => this.radiusY,
            setValue: (v: number) => {
                this.radiusY = v;
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
        }
    };

    constructor(protected features: TPlatformFeatures) {
        super(features);
        if (!this.features.hasCustomFontSize) {
            delete this.modifiers.fontSize;
        }
        if (!this.features.hasRGBSupport) {
            delete this.modifiers.color;
        }
        this.color = this.features.defaultColor;
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
                const dx = Math.round(offset.x / 2);
                const dy = Math.round(offset.y / 2);
                if (Math.floor(this.editState.radiusY + dy) >= 1) {
                    this.position.y = this.editState.position.y - dy * 2;
                }
                this.radiusX = Math.max(1, Math.floor(this.editState.radiusX - dx));
                this.radiusY = Math.max(1, Math.floor(this.editState.radiusY + dy));
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
                const dx = Math.round(offset.x / 2);
                const dy = Math.round(offset.y / 2);
                this.radiusX = Math.max(1, Math.round(this.editState.radiusX - dx));
                this.radiusY = Math.max(1, Math.round(this.editState.radiusY - dy));
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
                const dx = Math.round(offset.x / 2);
                const dy = Math.round(offset.y / 2);
                if (Math.ceil(this.editState.radiusX + dx) >= 1) {
                    this.position.x = this.editState.position.x - dx * 2;
                }
                this.radiusX = Math.max(1, Math.ceil(this.editState.radiusX + dx));
                this.radiusY = Math.max(1, Math.ceil(this.editState.radiusY - dy));
            }
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point): void => {
                const dx = Math.round(offset.x / 2);
                const dy = Math.round(offset.y / 2);

                if (Math.ceil(this.editState.radiusX + dx) >= 1) {
                    this.position.x = this.editState.position.x - dx * 2;
                }
                if (Math.ceil(this.editState.radiusY + dy) >= 1) {
                    this.position.y = this.editState.position.y - dy * 2;
                }
                this.radiusX = Math.max(1, Math.ceil(this.editState.radiusX + dx));
                this.radiusY = Math.max(1, Math.ceil(this.editState.radiusY + dy));
            }
        }
    ];

    startEdit(mode: EditMode, point: Point, editPoint: TLayerEditPoint) {
        this.mode = mode;
        if (mode == EditMode.CREATING) {
            this.position = point.clone();
            this.radiusX = 1;
            this.radiusY = 1;
            this.updateBounds();
            this.draw();
        }
        this.editState = {
            firstPoint: point,
            position: this.position.clone(),
            radiusX: this.radiusX,
            radiusY: this.radiusY,
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
                const radius = point.clone().subtract(firstPoint).abs().divide(2).round().subtract(2);
                this.radiusX = Math.max(radius.x, 0);
                this.radiusY = Math.max(radius.y, 0);
                const signs = point.clone().subtract(firstPoint).xy.map(Math.sign);
                this.position = firstPoint.min(
                    firstPoint
                        .clone()
                        .add(new Point(radius.clone().multiply(2).add(1)).multiply(signs))
                        .floor()
                );
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
        const {dc, radiusX, radiusY, position} = this;
        const center = position.clone().add(radiusX, radiusY);
        dc.clear();
        dc.ctx.fillStyle = this.color;
        dc.ctx.strokeStyle = this.color;
        dc.pixelateEllipse(center, radiusX, radiusY, this.fill);
    }

    saveState() {
        const state: TEllipseState = {
            p: this.position.xy,
            rx: this.radiusX,
            ry: this.radiusY,
            f: this.fill,
            n: this.name,
            i: this.index,
            g: this.group,
            t: this.type,
            u: this.uid,
            c: this.color
        };
        this.state = state;
    }

    loadState(state: TEllipseState) {
        this.position = new Point(state.p);
        this.radiusX = state.rx;
        this.radiusY = state.ry;
        this.name = state.n;
        this.index = state.i;
        this.group = state.g;
        this.uid = state.u;
        this.color = state.c;
        this.fill = state.f;
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds() {
        this.bounds = new Rect(this.position, new Point(this.radiusX, this.radiusY).multiply(2)).add(0, 0, 1, 1);
    }
}
