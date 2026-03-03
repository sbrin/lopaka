import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';

export class PolygonLayer extends AbstractLayer {
    protected type: ELayerType = 'polygon';
    protected editState: {
        firstPoint: Point;
        points: number[][];
        editPoint: TLayerEditPoint;
    } = null;

    @mapping('pts') public points: number[][] = [];
    @mapping('f') public fill: boolean = false;

    modifiers: TLayerModifiers = {
        x: {
            getValue: () => this.getBoundsOrigin().x,
            setValue: (v: number) => {
                const origin = this.getBoundsOrigin();
                const offset = v - origin.x;
                this.points.forEach((p) => (p[0] += offset));
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number,
        },
        y: {
            getValue: () => this.getBoundsOrigin().y,
            setValue: (v: number) => {
                const origin = this.getBoundsOrigin();
                const offset = v - origin.y;
                this.points.forEach((p) => (p[1] += offset));
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number,
        },
        fill: {
            getValue: () => this.fill,
            setValue: (v: boolean) => {
                this.fill = v;
                this.draw();
            },
            type: TModifierType.boolean,
        },
        color: {
            getValue: () => this.color,
            setValue: (v: string) => {
                this.color = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.color,
        },
        inverted: {
            getValue: () => this.inverted,
            setValue: (v: boolean) => {
                this.inverted = v;
                this.draw();
            },
            type: TModifierType.boolean,
        },
    };

    constructor(protected features: TPlatformFeatures) {
        super(features);
        if (!this.features.hasRGBSupport && !this.features.hasIndexedColors) {
            delete this.modifiers.color;
        }
        if (!this.features.hasInvertedColors) {
            delete this.modifiers.inverted;
        }
        this.color = this.features.defaultColor;
    }

    editPoints: TLayerEditPoint[] = [];

    private toPoints(): Point[] {
        return this.points.map((p) => new Point(p[0], p[1]));
    }

    private getBoundsOrigin(): Point {
        if (this.points.length === 0) return new Point();
        let minX = Infinity,
            minY = Infinity;
        for (const p of this.points) {
            if (p[0] < minX) minX = p[0];
            if (p[1] < minY) minY = p[1];
        }
        return new Point(minX, minY);
    }

    private rebuildEditPoints() {
        this.editPoints = this.points.map((_, idx) => ({
            cursor: 'move' as const,
            getRect: (): Rect =>
                new Rect(new Point(this.points[idx][0], this.points[idx][1]), new Point(3)).subtract(1, 1, 0, 0),
            move: (offset: Point): void => {
                this.points[idx] = [this.editState.points[idx][0] + offset.x, this.editState.points[idx][1] + offset.y];
            },
        }));
    }

    startEdit(mode: EditMode, point: Point, editPoint?: TLayerEditPoint) {
        this.pushHistory();
        this.mode = mode;
        if (mode === EditMode.CREATING) {
            if (this.points.length === 0) {
                this.points = [point.xy, point.xy];
            }
        }
        this.editState = {
            firstPoint: point,
            points: this.points.map((p) => [...p]),
            editPoint,
        };
    }

    edit(point: Point, originalEvent: MouseEvent) {
        if (!this.editState) {
            if (this.points.length > 1) {
                this.points[this.points.length - 1] = point.xy;
                this.updateBounds();
                this.draw();
            }
            return;
        }
        const {points, firstPoint, editPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                const dx = point.x - firstPoint.x;
                const dy = point.y - firstPoint.y;
                this.points = points.map((p) => [Math.round(p[0] + dx), Math.round(p[1] + dy)]);
                break;
            case EditMode.RESIZING:
                editPoint.move(point.clone().subtract(firstPoint));
                break;
            case EditMode.CREATING:
                if (this.points.length > 0) {
                    this.points[this.points.length - 1] = point.xy;
                }
                break;
        }
        this.updateBounds();
        this.draw();
    }

    addPoint(point: Point) {
        this.points.push(point.xy);
        this.updateBounds();
        this.draw();
    }

    stopEdit() {
        this.mode = EditMode.NONE;
        this.editState = null;
        this.rebuildEditPoints();
        this.pushRedoHistory();
    }

    draw() {
        const {dc} = this;
        dc.clear();
        if (this.points.length < 2) return;
        dc.ctx.fillStyle = this.color;
        dc.ctx.strokeStyle = this.color;
        dc.pixelatePolygon(this.toPoints(), this.fill);
    }

    onLoadState() {
        this.rebuildEditPoints();
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds() {
        if (this.points.length === 0) {
            this.bounds = new Rect();
            return;
        }
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        for (const p of this.points) {
            if (p[0] < minX) minX = p[0];
            if (p[1] < minY) minY = p[1];
            if (p[0] > maxX) maxX = p[0];
            if (p[1] > maxY) maxY = p[1];
        }
        this.bounds = new Rect(new Point(minX, minY), new Point(maxX - minX + 1, maxY - minY + 1));
    }
}
