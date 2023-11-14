import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerModifiers, TLayerState, TModifierType} from './abstract.layer';

type TPaintState = TLayerState & {
    p: number[]; // position
    s: number[]; // size
    d: number[][]; // data
};

export class PaintLayer extends AbstractLayer {
    protected type: ELayerType = 'paint';
    protected state: TPaintState;
    protected editState: {
        firstPoint?: Point;
        position?: Point;
    } = {};

    public position: Point = null;
    public size: Point = null;
    public data: ImageData;
    public points: number[][] = [];
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
                if (originalEvent && originalEvent.which == 3) {
                    this.points = this.points.filter((p) => p[0] !== point.x || p[1] !== point.y);
                } else {
                    if (position.distanceTo(point) < 1) {
                        this.points.push(point.xy);
                    } else {
                        // add missing points
                        const diff = point.clone().subtract(position);
                        const steps = Math.max(Math.abs(diff.x), Math.abs(diff.y));
                        const step = diff.clone().divide(steps);
                        for (let i = 0; i < steps; i++) {
                            const p = position.clone().add(step.clone().multiply(i)).round();
                            this.points.push(p.xy);
                        }
                    }
                    if (!this.position) {
                        this.position = point.clone();
                        this.size = new Point(1);
                    } else {
                        this.position = this.position.min(point);
                        this.maxPoint = this.maxPoint.max(point);
                        this.size = this.maxPoint.clone().subtract(this.position).add(1);
                    }
                    this.editState.position = point.clone();
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
            g: this.group,
            t: this.type,
            u: this.uid
        };
        this.state = JSON.parse(JSON.stringify(state));
    }

    loadState(state: TPaintState) {
        this.position = new Point(state.p);
        this.size = new Point(state.s);
        this.points = state.d;
        this.name = state.n;
        this.index = state.i;
        this.group = state.g;
        this.uid = state.u;
        this.updateBounds();
    }

    updateBounds() {
        this.bounds = new Rect(this.position, this.size);
    }
}
