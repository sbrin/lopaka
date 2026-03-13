import { TPlatformFeatures } from '../../platforms/platform';
import { mapping } from '../decorators/mapping';
import { Point } from '../point';
import { Rect } from '../rect';
import { AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType } from './abstract.layer';
import { AbstractDrawingRenderer } from '../../draw/renderers';

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
        this.rebuildEditPoints();
    }

    public vertexEditMode: boolean = false;

    editPoints: TLayerEditPoint[] = [];

    private vertexEditPoints: TLayerEditPoint[] = [
        {
            cursor: 'move',
            getRect: (): Rect => new Rect(this.p1, new Point(3)).subtract(1, 1, 0, 0),
            move: (offset: Point, event?: MouseEvent | TouchEvent): void => {
                this.p1 = this.editState.p1.clone().add(offset).round();
            },
        },
        {
            cursor: 'move',
            getRect: (): Rect => new Rect(this.p2, new Point(3)).subtract(1, 1, 0, 0),
            move: (offset: Point, event?: MouseEvent | TouchEvent): void => {
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

    private boundsEditPoints: TLayerEditPoint[] = [
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, event?: MouseEvent | TouchEvent): void => {
                this.scalePoints(offset, 'top-left', event);
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
            move: (offset: Point, event?: MouseEvent | TouchEvent): void => {
                this.scalePoints(offset, 'top-right', event);
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
            move: (offset: Point, event?: MouseEvent | TouchEvent): void => {
                this.scalePoints(offset, 'bottom-left', event);
            },
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(
                    new Point(this.bounds.x + this.bounds.w, this.bounds.y + this.bounds.h),
                    new Point(3)
                ).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, event?: MouseEvent | TouchEvent): void => {
                this.scalePoints(offset, 'bottom-right', event);
            },
        },
        {
            cursor: 'ns-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x + this.bounds.w / 2, this.bounds.y), new Point(3)).subtract(
                    1.5,
                    1.5,
                    0,
                    0
                ),
            move: (offset: Point, event?: MouseEvent | TouchEvent): void => {
                this.scalePoints(offset, 'top', event);
            },
        },
        {
            cursor: 'ew-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x + this.bounds.w, this.bounds.y + this.bounds.h / 2), new Point(3))
                    .subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, event?: MouseEvent | TouchEvent): void => {
                this.scalePoints(offset, 'right', event);
            },
        },
        {
            cursor: 'ns-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x + this.bounds.w / 2, this.bounds.y + this.bounds.h), new Point(3))
                    .subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, event?: MouseEvent | TouchEvent): void => {
                this.scalePoints(offset, 'bottom', event);
            },
        },
        {
            cursor: 'ew-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y + this.bounds.h / 2), new Point(3)).subtract(
                    1.5,
                    1.5,
                    0,
                    0
                ),
            move: (offset: Point, event?: MouseEvent | TouchEvent): void => {
                this.scalePoints(offset, 'left', event);
            },
        },
    ];

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
        this.editPoints = this.vertexEditMode ? this.vertexEditPoints : this.boundsEditPoints;
    }

    public getEditPoints(_event?: MouseEvent | TouchEvent): TLayerEditPoint[] {
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

    private scalePoints(
        offset: Point,
        corner: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right',
        event?: MouseEvent | TouchEvent
    ): void {
        if (!this.editState) {
            return;
        }
        const originalPoints = [this.editState.p1, this.editState.p2, this.editState.p3];
        const bounds = this.getTriangleBoundsForPoints(...originalPoints);
        const minX = bounds.x;
        const minY = bounds.y;
        const maxX = bounds.x + bounds.w - 1;
        const maxY = bounds.y + bounds.h - 1;
        const originalWidth = Math.max(maxX - minX, 1);
        const originalHeight = Math.max(maxY - minY, 1);
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        let anchorX: number;
        let anchorY: number;
        let newWidth: number;
        let newHeight: number;

        switch (corner) {
            case 'top-left':
                anchorX = maxX;
                anchorY = maxY;
                newWidth = Math.max(originalWidth - offset.x, 2);
                newHeight = Math.max(originalHeight - offset.y, 2);
                break;
            case 'top-right':
                anchorX = minX;
                anchorY = maxY;
                newWidth = Math.max(originalWidth + offset.x, 2);
                newHeight = Math.max(originalHeight - offset.y, 2);
                break;
            case 'bottom-left':
                anchorX = maxX;
                anchorY = minY;
                newWidth = Math.max(originalWidth - offset.x, 2);
                newHeight = Math.max(originalHeight + offset.y, 2);
                break;
            case 'bottom-right':
                anchorX = minX;
                anchorY = minY;
                newWidth = Math.max(originalWidth + offset.x, 2);
                newHeight = Math.max(originalHeight + offset.y, 2);
                break;
            case 'top':
                anchorX = centerX;
                anchorY = maxY;
                newWidth = originalWidth;
                newHeight = Math.max(originalHeight - offset.y, 2);
                break;
            case 'bottom':
                anchorX = centerX;
                anchorY = minY;
                newWidth = originalWidth;
                newHeight = Math.max(originalHeight + offset.y, 2);
                break;
            case 'left':
                anchorX = maxX;
                anchorY = centerY;
                newWidth = Math.max(originalWidth - offset.x, 2);
                newHeight = originalHeight;
                break;
            case 'right':
                anchorX = minX;
                anchorY = centerY;
                newWidth = Math.max(originalWidth + offset.x, 2);
                newHeight = originalHeight;
                break;
        }

        if (event?.shiftKey) {
            const aspectRatio = originalWidth / originalHeight;
            if (corner === 'top' || corner === 'bottom') {
                newWidth = Math.round(newHeight * aspectRatio);
            } else if (corner === 'left' || corner === 'right') {
                newHeight = Math.round(newWidth / aspectRatio);
            } else {
                const maxDimension = Math.max(newWidth, newHeight);
                if (newWidth > newHeight) {
                    newWidth = Math.round(maxDimension);
                    newHeight = Math.round(maxDimension / aspectRatio);
                } else {
                    newWidth = Math.round(maxDimension * aspectRatio);
                    newHeight = Math.round(maxDimension);
                }
            }
        }

        if (event?.altKey) {
            anchorX = centerX;
            anchorY = centerY;
        }

        const scaleX = newWidth / originalWidth;
        const scaleY = newHeight / originalHeight;
        const scaleVertex = (vertex: Point) =>
            new Point(
                Math.round(anchorX + (vertex.x - anchorX) * scaleX),
                Math.round(anchorY + (vertex.y - anchorY) * scaleY)
            );

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
        const { p1, p2, p3, firstPoint, editPoint } = this.editState;
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
                if (originalEvent.altKey) {
                    const radius = point.clone().subtract(firstPoint).abs();
                    if (originalEvent.shiftKey) {
                        const maxRadius = Math.max(radius.x, radius.y);
                        radius.x = maxRadius;
                        radius.y = maxRadius;
                    }
                    this.p1 = firstPoint.clone().subtract(0, radius.y);
                    this.p2 = firstPoint.clone().add(radius.x, radius.y);
                    this.p3 = firstPoint.clone().add(-radius.x, radius.y);
                } else {
                    const diff = point.clone().subtract(firstPoint);
                    if (originalEvent.shiftKey) {
                        // Make it an equilateral triangle
                        const maxDiff = Math.max(Math.abs(diff.x), Math.abs(diff.y));
                        diff.x = Math.sign(diff.x) * maxDiff || maxDiff;
                        diff.y = Math.sign(diff.y) * maxDiff || maxDiff;
                    }

                    const p2Point = firstPoint.clone().add(diff);

                    this.p1 = new Point(firstPoint.x + diff.x / 2, firstPoint.y);
                    this.p2 = p2Point;
                    this.p3 = new Point(firstPoint.x, p2Point.y);
                }
                break;
        }
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
        this.renderer.drawTriangle(this.p1, this.p2, this.p3, this.fill, this.color);
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
        this.rebuildEditPoints();
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
