import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';

export class LineLayer extends AbstractLayer {
    protected type: ELayerType = 'line';
    protected editState: {
        firstPoint: Point;
        p1: Point;
        p2: Point;
        editPoint: TLayerEditPoint;
    } = null;

    @mapping('p1', 'point') public p1: Point = new Point();
    @mapping('p2', 'point') public p2: Point = new Point();

    public get properties(): any {
        return {
            x1: this.p1.x,
            y1: this.p1.y,
            x2: this.p2.x,
            y2: this.p2.y,
            color: this.color,
            type: this.type,
            id: this.uid,
            inverted: this.inverted
        };
    }

    modifiers: TLayerModifiers = {
        x1: {
            getValue: () => this.p1.x,
            setValue: (v: number) => {
                this.p1.x = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number
        },
        y1: {
            getValue: () => this.p1.y,
            setValue: (v: number) => {
                this.p1.y = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number
        },
        x2: {
            getValue: () => this.p2.x,
            setValue: (v: number) => {
                this.p2.x = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number
        },
        y2: {
            getValue: () => this.p2.y,
            setValue: (v: number) => {
                this.p2.y = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number
        },
        color: {
            getValue: () => this.color,
            setValue: (v: string) => {
                this.color = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.color
        },
        inverted: {
            getValue: () => this.inverted,
            setValue: (v: boolean) => {
                this.inverted = v;
                this.draw();
            },
            type: TModifierType.boolean
        }
    };

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
        this.history.push(this.state);
    }

    draw() {
        const {dc, p1, p2} = this;
        dc.clear();
        dc.ctx.fillStyle = this.color;
        dc.ctx.strokeStyle = this.color;
        dc.pixelateLine(p1, p2, 1);
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds() {
        const {p1, p2} = this;
        this.bounds = new Rect(p1.min(p2), p1.clone().subtract(p2).abs().add(1));
    }
}
