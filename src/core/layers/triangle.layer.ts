import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';
import {AbstractDrawingRenderer} from '../../draw/renderers';

export class TriangleLayer extends AbstractLayer {
    protected type: ELayerType = 'triangle';
    protected editState: {
        firstPoint: Point;
        p1: Point;
        p2: Point;
        p3: Point;
        editPoint: TLayerEditPoint;
    } = null;

    @mapping('p1', 'point') public p1: Point = new Point();
    @mapping('p2', 'point') public p2: Point = new Point();
    @mapping('p3', 'point') public p3: Point = new Point();
    @mapping('f') public fill: boolean = false;

    modifiers: TLayerModifiers = {
        x1: {
            getValue: () => this.p1.x,
            setValue: (v: number) => {
                this.p1.x = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        y1: {
            getValue: () => this.p1.y,
            setValue: (v: number) => {
                this.p1.y = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        x2: {
            getValue: () => this.p2.x,
            setValue: (v: number) => {
                this.p2.x = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        y2: {
            getValue: () => this.p2.y,
            setValue: (v: number) => {
                this.p2.y = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        x3: {
            getValue: () => this.p3.x,
            setValue: (v: number) => {
                this.p3.x = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        y3: {
            getValue: () => this.p3.y,
            setValue: (v: number) => {
                this.p3.y = v;
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

    editPoints: TLayerEditPoint[] = [
        {
            cursor: 'move',
            getRect: (): Rect => new Rect(this.p1, new Point(3)).subtract(1, 1, 0, 0),
            move: (offset: Point, event?: MouseEvent): void => {
                this.p1 = this.editState.p1.clone().add(offset).round();
            },
        },
        {
            cursor: 'move',
            getRect: (): Rect => new Rect(this.p2, new Point(3)).subtract(1, 1, 0, 0),
            move: (offset: Point, event?: MouseEvent): void => {
                this.p2 = this.editState.p2.clone().add(offset).round();
            },
        },
        {
            cursor: 'move',
            getRect: (): Rect => new Rect(this.p3, new Point(3)).subtract(1, 1, 0, 0),
            move: (offset: Point, event?: MouseEvent): void => {
                this.p3 = this.editState.p3.clone().add(offset).round();
            },
        },
    ];

    private cornerEditPoints: TLayerEditPoint[] = [
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point): void => {
                // Skip resize work when there is no edit state.
                if (!this.editState) {
                    return;
                }
                // Compute the original bounds for proportional scaling.
                const bounds = this.getTriangleBoundsForPoints(
                    this.editState.p1,
                    this.editState.p2,
                    this.editState.p3
                );
                // Resize using the opposite corner as the anchor.
                this.resizeFromCorner(
                    offset,
                    new Point(bounds.x, bounds.y),
                    new Point(bounds.x + bounds.w, bounds.y + bounds.h)
                );
            },
        },
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
                // Skip resize work when there is no edit state.
                if (!this.editState) {
                    return;
                }
                // Compute the original bounds for proportional scaling.
                const bounds = this.getTriangleBoundsForPoints(
                    this.editState.p1,
                    this.editState.p2,
                    this.editState.p3
                );
                // Resize using the opposite corner as the anchor.
                this.resizeFromCorner(
                    offset,
                    new Point(bounds.x + bounds.w, bounds.y),
                    new Point(bounds.x, bounds.y + bounds.h)
                );
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
            move: (offset: Point): void => {
                // Skip resize work when there is no edit state.
                if (!this.editState) {
                    return;
                }
                // Compute the original bounds for proportional scaling.
                const bounds = this.getTriangleBoundsForPoints(
                    this.editState.p1,
                    this.editState.p2,
                    this.editState.p3
                );
                // Resize using the opposite corner as the anchor.
                this.resizeFromCorner(
                    offset,
                    new Point(bounds.x, bounds.y + bounds.h),
                    new Point(bounds.x + bounds.w, bounds.y)
                );
            },
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(
                    new Point(this.bounds.x + this.bounds.w, this.bounds.y + this.bounds.h),
                    new Point(3)
                ).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point): void => {
                // Skip resize work when there is no edit state.
                if (!this.editState) {
                    return;
                }
                // Compute the original bounds for proportional scaling.
                const bounds = this.getTriangleBoundsForPoints(
                    this.editState.p1,
                    this.editState.p2,
                    this.editState.p3
                );
                // Resize using the opposite corner as the anchor.
                this.resizeFromCorner(
                    offset,
                    new Point(bounds.x + bounds.w, bounds.y + bounds.h),
                    new Point(bounds.x, bounds.y)
                );
            },
        },
    ];

    // Switch edit points based on the shift modifier state.
    public getEditPoints(event?: MouseEvent | TouchEvent): TLayerEditPoint[] {
        // Use bounding box corners when shift is held.
        if (event?.shiftKey) {
            return this.cornerEditPoints;
        }
        // Fall back to vertex edit points when shift is not held.
        return this.editPoints;
    }

    // Build bounds from triangle vertices.
    private getTriangleBoundsForPoints(p1: Point, p2: Point, p3: Point): Rect {
        // Determine the axis-aligned extents of the vertices.
        const minX = Math.min(p1.x, p2.x, p3.x);
        const minY = Math.min(p1.y, p2.y, p3.y);
        const maxX = Math.max(p1.x, p2.x, p3.x);
        const maxY = Math.max(p1.y, p2.y, p3.y);
        // Return the bounding rectangle using inclusive sizing.
        return new Rect(new Point(minX, minY), new Point(maxX - minX + 1, maxY - minY + 1));
    }

    // Resize triangle points uniformly from an anchor.
    private resizeFromCorner(offset: Point, corner: Point, anchor: Point): void {
        // Compute the dragged corner position.
        const newCorner = corner.clone().add(offset);
        // Compute the scale ratios while preserving orientation.
        const cornerVector = corner.clone().subtract(anchor);
        const newVector = newCorner.clone().subtract(anchor);
        const scaleX = cornerVector.x ? Math.abs(newVector.x / cornerVector.x) : 1;
        const scaleY = cornerVector.y ? Math.abs(newVector.y / cornerVector.y) : 1;
        const uniformScale = Math.max(scaleX, scaleY);
        // Scale each vertex around the anchor point.
        const scaleVertex = (vertex: Point) =>
            anchor.clone().add(vertex.clone().subtract(anchor).multiply(uniformScale)).round();
        this.p1 = scaleVertex(this.editState.p1);
        this.p2 = scaleVertex(this.editState.p2);
        this.p3 = scaleVertex(this.editState.p3);
    }

    startEdit(mode: EditMode, point: Point, editPoint: TLayerEditPoint) {
        this.pushHistory();
        this.mode = mode;
        this.editState = {
            firstPoint: point,
            p1: this.p1?.clone() || point.clone(),
            p2: this.p2?.clone() || point.clone().add(1),
            p3: this.p3?.clone() || point.clone().add(1, -1),
            editPoint,
        };
    }

    edit(point: Point, originalEvent: MouseEvent | TouchEvent) {
        if (!this.editState) {
            return;
        }
        const {p1, p2, p3, firstPoint, editPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.p1 = p1.clone().add(point.clone().subtract(firstPoint)).round();
                this.p2 = p2.clone().add(point.clone().subtract(firstPoint)).round();
                this.p3 = p3.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                editPoint.move(point.clone().subtract(firstPoint), originalEvent);
                break;
            case EditMode.CREATING:
                // First click sets p1, drag creates p2 and p3
                this.p1 = firstPoint.clone();
                // p2 is the dragged point
                this.p2 = point.clone();
                // p3 forms an equilateral-ish triangle
                this.p3 = new Point(
                    firstPoint.x - (point.x - firstPoint.x),
                    point.y
                );
                break;
        }
        this.updateBounds();
        this.draw();
    }

    stopEdit() {
        this.mode = EditMode.NONE;
        this.editState = null;
        this.pushRedoHistory();
    }

    draw() {
        this.renderer.drawTriangle(this.p1, this.p2, this.p3, this.fill, this.color);
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds() {
        // Refresh bounds based on the latest triangle vertices.
        this.bounds = this.getTriangleBoundsForPoints(this.p1, this.p2, this.p3);
    }

    /**
     * Override contains to use bounding box for triangle selection
     * This makes the entire triangle area clickable, not just the edges
     */
    public contains(point: Point): boolean {
        return this.bounds.contains(point);
    }
}
