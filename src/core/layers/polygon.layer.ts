import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';
import {AbstractDrawingRenderer} from '../../draw/renderers';

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
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
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
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
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
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
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

    constructor(
        protected features: TPlatformFeatures,
        renderer?: AbstractDrawingRenderer
    ) {
        super(features, renderer);
        if (!this.features.hasRGBSupport && !this.features.hasIndexedColors) {
            delete this.modifiers.color;
        }
        if (!this.features.hasInvertedColors) {
            delete this.modifiers.inverted;
        }
        this.color = this.features.defaultColor;
    }

    editPoints: TLayerEditPoint[] = [];

    public vertexEditMode: boolean = false;

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

    // Position getter for compatibility with platform code
    get position(): Point {
        return this.getBoundsOrigin();
    }

    // Size getter for compatibility with platform code
    get size(): Point {
        return new Point(this.bounds.w, this.bounds.h);
    }

    toggleVertexEditMode() {
        this.vertexEditMode = !this.vertexEditMode;
        this.rebuildEditPoints();
    }

    exitVertexEditMode() {
        if (this.vertexEditMode) {
            this.vertexEditMode = false;
            this.rebuildEditPoints();
        }
    }

    private rebuildEditPoints() {
        if (this.vertexEditMode) {
            this.rebuildVertexEditPoints();
        } else {
            this.rebuildBoundsEditPoints();
        }
    }

    private rebuildVertexEditPoints() {
        this.editPoints = this.points.map((_, idx) => ({
            cursor: 'move' as const,
            getRect: (): Rect =>
                new Rect(new Point(this.points[idx][0], this.points[idx][1]), new Point(7)).subtract(3, 3, 0, 0),
            move: (offset: Point): void => {
                this.points[idx] = [this.editState.points[idx][0] + offset.x, this.editState.points[idx][1] + offset.y];
            },
        }));
    }

    private rebuildBoundsEditPoints() {
        this.editPoints = [
            {
                cursor: 'nesw-resize',
                getRect: (): Rect =>
                    new Rect(new Point(this.bounds.x + this.bounds.w, this.bounds.y), new Point(3)).subtract(
                        1.5,
                        1.5,
                        0,
                        0
                    ),
                move: (offset: Point, event?: MouseEvent): void => {
                    this.scalePoints(offset, 'top-right', event);
                },
            },
            {
                cursor: 'nwse-resize',
                getRect: (): Rect =>
                    new Rect(
                        new Point(this.bounds.x + this.bounds.w, this.bounds.y + this.bounds.h),
                        new Point(3)
                    ).subtract(1.5, 1.5, 0, 0),
                move: (offset: Point, event?: MouseEvent): void => {
                    this.scalePoints(offset, 'bottom-right', event);
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
                move: (offset: Point, event?: MouseEvent): void => {
                    this.scalePoints(offset, 'bottom-left', event);
                },
            },
            {
                cursor: 'nwse-resize',
                getRect: (): Rect =>
                    new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
                move: (offset: Point, event?: MouseEvent): void => {
                    this.scalePoints(offset, 'top-left', event);
                },
            },
        ];
    }

    private scalePoints(
        offset: Point,
        corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
        event?: MouseEvent
    ) {
        if (!this.editState || this.editState.points.length < 2) return;
        const origPts = this.editState.points;
        let minX = Infinity,
            minY = Infinity,
            maxX = -Infinity,
            maxY = -Infinity;
        for (const p of origPts) {
            if (p[0] < minX) minX = p[0];
            if (p[1] < minY) minY = p[1];
            if (p[0] > maxX) maxX = p[0];
            if (p[1] > maxY) maxY = p[1];
        }
        const origW = maxX - minX || 1;
        const origH = maxY - minY || 1;
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        let anchorX: number, anchorY: number, newW: number, newH: number;
        switch (corner) {
            case 'top-left':
                anchorX = maxX;
                anchorY = maxY;
                newW = Math.max(origW - offset.x, 2);
                newH = Math.max(origH - offset.y, 2);
                break;
            case 'top-right':
                anchorX = minX;
                anchorY = maxY;
                newW = Math.max(origW + offset.x, 2);
                newH = Math.max(origH - offset.y, 2);
                break;
            case 'bottom-left':
                anchorX = maxX;
                anchorY = minY;
                newW = Math.max(origW - offset.x, 2);
                newH = Math.max(origH + offset.y, 2);
                break;
            case 'bottom-right':
                anchorX = minX;
                anchorY = minY;
                newW = Math.max(origW + offset.x, 2);
                newH = Math.max(origH + offset.y, 2);
                break;
        }

        // Shift: lock aspect ratio
        if (event?.shiftKey) {
            const aspectRatio = origW / origH;
            const maxDim = Math.max(newW, newH);
            if (newW > newH) {
                newW = Math.round(maxDim);
                newH = Math.round(maxDim / aspectRatio);
            } else {
                newW = Math.round(maxDim * aspectRatio);
                newH = Math.round(maxDim);
            }
        }

        // Alt: resize from center
        if (event?.altKey) {
            anchorX = centerX;
            anchorY = centerY;
        }

        const scaleX = newW / origW;
        const scaleY = newH / origH;
        this.points = origPts.map((p) => [
            Math.round(anchorX + (p[0] - anchorX) * scaleX),
            Math.round(anchorY + (p[1] - anchorY) * scaleY),
        ]);
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
                editPoint.move(point.clone().subtract(firstPoint), originalEvent as MouseEvent);
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
        if (this.points.length < 2) return;
        const pts = this.points.map((p) => new Point(p[0], p[1]));
        this.renderer.drawPolygon(pts, this.fill, this.color);
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
