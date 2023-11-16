import {TPlatformFeatures} from '../../platforms/platform';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TLayerState, TModifierType} from './abstract.layer';

type TLineState = TLayerState & {
    p1: number[]; // point 1
    p2: number[]; // point 2
};

export class LineLayer extends AbstractLayer {
    protected type: ELayerType = 'line';
    protected state: TLineState;
    protected editState: {
        firstPoint: Point;
        p1: Point;
        p2: Point;
        editPoint: TLayerEditPoint;
    } = null;

    public p1: Point = new Point();
    public p2: Point = new Point();

    modifiers: TLayerModifiers = {
        x1: {
            getValue: () => this.p1.x,
            setValue: (v: number) => {
                this.p1.x = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        y1: {
            getValue: () => this.p1.y,
            setValue: (v: number) => {
                this.p1.y = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        x2: {
            getValue: () => this.p2.x,
            setValue: (v: number) => {
                this.p2.x = v;
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        y2: {
            getValue: () => this.p2.y,
            setValue: (v: number) => {
                this.p2.y = v;
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
            cursor: 'move',
            getRect: (): Rect => new Rect(this.p1, new Point(3)).subtract(1, 1, 0, 0),
            move: (offset: Point): void => {
                this.p1 = this.editState.p1.clone().add(offset).round();
            }
        },
        {
            cursor: 'move',
            getRect: (): Rect => new Rect(this.p2, new Point(3)).subtract(1, 1, 0, 0),
            move: (offset: Point): void => {
                this.p2 = this.editState.p2.clone().add(offset).round();
            }
        }
    ];

    startEdit(mode: EditMode, point: Point, editPoint: TLayerEditPoint) {
        this.mode = mode;
        this.editState = {
            firstPoint: point,
            p1: this.p1?.clone() || point.clone(),
            p2: this.p2?.clone() || point.clone().add(1),
            editPoint
        };
    }

    edit(point: Point, originalEvent: MouseEvent) {
        const {p1, p2, firstPoint, editPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.p1 = p1.clone().add(point.clone().subtract(firstPoint)).round();
                this.p2 = p2.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                editPoint.move(point.clone().subtract(firstPoint));
                // this.size = size.clone().add(point.clone().subtract(firstPoint)).round();
                // todo
                break;
            case EditMode.CREATING:
                this.p1 = firstPoint.clone();
                this.p2 = point.clone();
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
        const {dc, p1, p2} = this;
        dc.clear();
        dc.ctx.fillStyle = this.color;
        dc.ctx.strokeStyle = this.color;
        dc.pixelateLine(p1, p2, 1);
    }

    saveState() {
        const state: TLineState = {
            p1: this.p1.xy,
            p2: this.p2.xy,
            n: this.name,
            i: this.index,
            g: this.group,
            t: this.type,
            u: this.uid,
            c: this.color
        };
        this.state = state;
    }

    loadState(state: TLineState) {
        this.p1 = new Point(state.p1);
        this.p2 = new Point(state.p2);
        this.name = state.n;
        this.index = state.i;
        this.group = state.g;
        this.uid = state.u;
        this.color = state.c;
        this.updateBounds();
    }

    updateBounds() {
        const {p1, p2} = this;
        this.bounds = new Rect(p1.min(p2), p1.clone().subtract(p2).abs().add(1));
    }
}
