import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerModifiers, TModifierType} from './abstract.layer';

type TPaintState = {
    p: number[]; // position
    s: number[]; // size
    d: number[][]; // data
    n: string; // name
    i: number; // index
    g: number; // group
};

export class PaintLayer extends AbstractLayer {
    protected state: TPaintState;
    protected editState: {
        firstPoint?: Point;
        position?: Point;
    } = {};

    public position: Point = null;
    public size: Point = null;
    public data: ImageData;
    public points: Set<number[]> = new Set();
    private maxPoint = new Point();

    modifiers: TLayerModifiers = {
        x: {
            getValue: () => this.position?.x || '',
            setValue: (v: number) => {
                const diff = new Point(v - this.position.x, 0);
                this.movePoints(diff);
                this.position.x = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        y: {
            getValue: () => this.position?.y || '',
            setValue: (v: number) => {
                const diff = new Point(0, v - this.position.y);
                this.movePoints(diff);
                this.position.y = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        }
    };

    constructor() {
        super();
    }

    startEdit(mode: EditMode, point: Point) {
        this.mode = mode;
        this.editState = {
            firstPoint: point,
            position: this.position?.clone()
        };
        if (mode === EditMode.CREATING) {
            this.editState.position = point.clone();
        }
    }

    edit(point: Point, originalEvent: MouseEvent) {
        const {position, firstPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                const newPos = position.clone().add(point.clone().subtract(firstPoint)).round();
                const diff = newPos.clone().subtract(this.position);
                this.position = newPos.clone();
                this.movePoints(diff);
                break;
            case EditMode.RESIZING:
                // this.size = size.clone().add(point.clone().subtract(firstPoint)).round();
                // todo
                break;
            case EditMode.CREATING:
                this.points.add(point.xy);
                if (!this.position) {
                    this.position = point.clone();
                    this.size = new Point(1);
                } else {
                    this.position = this.position.min(point);
                    this.maxPoint = this.maxPoint.max(point);
                    this.size = this.maxPoint.clone().subtract(this.position);
                }
                break;
        }
        this.updateBounds();
        this.draw();
    }

    stopEdit() {
        this.mode = EditMode.NONE;
        this.updateBounds();
        this.editState = null;
        this.saveState();
        this.history.push(this.state);
    }

    movePoints(diff: Point) {
        this.points.forEach((p) => {
            p[0] += diff.x;
            p[1] += diff.y;
        });
    }

    draw() {
        const {dc} = this;
        dc.clear();
        dc.ctx.beginPath();
        this.points.forEach((p) => {
            dc.ctx.rect(p[0], p[1], 1, 1);
        });
        dc.ctx.fill();
    }

    saveState() {
        const state: TPaintState = {
            p: this.position.xy,
            s: this.size.xy,
            d: Array.from(this.points).map((p) => [p[0], p[1]]),
            n: this.name,
            i: this.index,
            g: this.group
        };
        this.state = JSON.parse(JSON.stringify(state));
    }

    loadState(state: TPaintState) {
        this.position = new Point(state.p);
        this.size = new Point(state.s);
        this.points = new Set(state.d);
        this.name = state.n;
        this.index = state.i;
        this.group = state.g;
        this.updateBounds();
    }

    updateBounds() {
        this.bounds = new Rect(this.position, this.size).add(0, 0, 1, 1);
    }
}
