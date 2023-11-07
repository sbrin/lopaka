import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerModifier, TLayerModifiers, TLayerState, TModifierType} from './abstract.layer';

type TRectangleState = TLayerState & {
    p: number[]; // position [x, y]
    s: number[]; // size [w, h]
};

export abstract class RectangleLayer extends AbstractLayer {
    protected state: TRectangleState;
    protected editState: {
        firstPoint: Point;
        position: Point;
        size: Point;
    } = null;

    public position: Point = new Point();
    public size: Point = new Point();

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
        }
    };

    constructor(private fill: boolean) {
        super();
    }

    startEdit(mode: EditMode, point: Point) {
        this.mode = mode;
        if (mode == EditMode.CREATING) {
            this.position = point.clone();
            this.size = new Point(1);
            this.updateBounds();
            this.draw();
        }
        this.editState = {
            firstPoint: point,
            position: this.position.clone(),
            size: this.size.clone()
        };
    }

    edit(point: Point, originalEvent: MouseEvent) {
        const {position, size, firstPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                // this.size = size.clone().add(point.clone().subtract(firstPoint)).round();
                // todo
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
        dc.clear().rect(position, size, this.fill);
    }

    saveState() {
        const state: TRectangleState = {
            p: this.position.xy,
            s: this.size.xy,
            n: this.name,
            i: this.index,
            g: this.group,
            t: this.type
        };
        this.state = state;
    }

    loadState(state: TRectangleState) {
        this.position = new Point(state.p);
        this.size = new Point(state.s);
        this.name = state.n;
        this.index = state.i;
        this.group = state.g;
        this.updateBounds();
    }

    updateBounds(): void {
        this.bounds = new Rect(this.position, this.size);
    }
}
