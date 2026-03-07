import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';
import {AbstractDrawingRenderer} from '../../draw/renderers';

export class RectangleLayer extends AbstractLayer {
    protected type: ELayerType = 'rect';
    protected editState: {
        firstPoint: Point;
        position: Point;
        size: Point;
        editPoint: TLayerEditPoint;
    } = null;

    @mapping('p', 'point') public position: Point = new Point();

    @mapping('s', 'point') public size: Point = new Point();

    @mapping('r') public radius: number = 0;

    @mapping('f') public fill: boolean = false;

    get minLen(): number {
        return this.radius * 2 + 2;
    }

    modifiers: TLayerModifiers = {
        x: {
            getValue: () => this.position.x,
            setValue: (v: number) => {
                this.position.x = v;
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
            getValue: () => this.position.y,
            setValue: (v: number) => {
                this.position.y = v;
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        w: {
            getValue: () => this.size.x,
            setValue: (v: number) => {
                this.size.x = Math.max(v, this.minLen);
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        h: {
            getValue: () => this.size.y,
            setValue: (v: number) => {
                this.size.y = Math.max(v, this.minLen);
                this.updateBounds();
                this.draw();
            },
            getVariable: (name: string) => this.variables[name] ?? false,
            setVariable: (name: string, enabled: boolean) => {
                this.variables[name] = enabled;
            },
            type: TModifierType.number,
        },
        radius: {
            getValue: () => this.radius,
            setValue: (v: number) => {
                this.radius = Math.max(
                    0,
                    Math.min(v, Math.round(this.size.x / 2 - 1), Math.round(this.size.y / 2 - 1))
                );
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
        customMarkers: {
            getValue: () => this.customMarkers,
            setValue: (v: boolean) => {
                this.customMarkers = v;
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

    editPoints: TLayerEditPoint[] = [
        // Corner handles
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
                let newSize = new Point(this.editState.size.x - offset.x, this.editState.size.y + offset.y).max(
                    new Point(this.minLen)
                );
                let newPosition = this.editState.position.clone().subtract(0, offset.y);

                if (event?.shiftKey) {
                    const aspectRatio = this.editState.size.x / this.editState.size.y;
                    const maxDimension = Math.max(newSize.x, newSize.y);
                    if (newSize.x > newSize.y) {
                        newSize = new Point(Math.round(maxDimension), Math.round(maxDimension / aspectRatio));
                    } else {
                        newSize = new Point(Math.round(maxDimension * aspectRatio), Math.round(maxDimension));
                    }
                    newPosition.y = this.editState.position.y + this.editState.size.y - newSize.y;
                }

                if (event?.altKey) {
                    const center = this.editState.position
                        .clone()
                        .add(this.editState.size.x / 2, this.editState.size.y / 2);
                    newPosition = center
                        .clone()
                        .subtract(newSize.x / 2, newSize.y / 2)
                        .round();
                }

                this.position = newPosition;
                this.size = newSize;
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
                let newSize = this.editState.size.clone().subtract(offset).max(new Point(this.minLen));

                if (event?.shiftKey) {
                    const aspectRatio = this.editState.size.x / this.editState.size.y;
                    const maxDimension = Math.max(newSize.x, newSize.y);
                    if (newSize.x > newSize.y) {
                        newSize = new Point(Math.round(maxDimension), Math.round(maxDimension / aspectRatio));
                    } else {
                        newSize = new Point(Math.round(maxDimension * aspectRatio), Math.round(maxDimension));
                    }
                }

                if (event?.altKey) {
                    const center = this.editState.position
                        .clone()
                        .add(this.editState.size.x / 2, this.editState.size.y / 2);
                    this.position = center
                        .clone()
                        .subtract(newSize.x / 2, newSize.y / 2)
                        .round();
                }

                this.size = newSize.max(new Point(this.minLen));
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
                let newSize = this.editState.size.clone().add(offset.x, -offset.y).max(new Point(this.minLen));
                let newPosition = this.editState.position.clone().subtract(offset.x, 0);

                if (event?.shiftKey) {
                    const aspectRatio = this.editState.size.x / this.editState.size.y;
                    const maxDimension = Math.max(newSize.x, newSize.y);
                    if (newSize.x > newSize.y) {
                        newSize = new Point(Math.round(maxDimension), Math.round(maxDimension / aspectRatio));
                    } else {
                        newSize = new Point(Math.round(maxDimension * aspectRatio), Math.round(maxDimension));
                    }
                    newPosition.x = this.editState.position.x + this.editState.size.x - newSize.x;
                }

                if (event?.altKey) {
                    const center = this.editState.position
                        .clone()
                        .add(this.editState.size.x / 2, this.editState.size.y / 2);
                    newPosition = center
                        .clone()
                        .subtract(newSize.x / 2, newSize.y / 2)
                        .round();
                }

                this.position = newPosition;
                this.size = newSize;
            },
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, event?: MouseEvent): void => {
                let newSize = this.editState.size.clone().add(offset).max(new Point(this.minLen));
                let newPosition = this.editState.position.clone().subtract(offset);

                if (event?.shiftKey) {
                    const aspectRatio = this.editState.size.x / this.editState.size.y;
                    const maxDimension = Math.max(newSize.x, newSize.y);
                    if (newSize.x > newSize.y) {
                        newSize = new Point(Math.round(maxDimension), Math.round(maxDimension / aspectRatio));
                    } else {
                        newSize = new Point(Math.round(maxDimension * aspectRatio), Math.round(maxDimension));
                    }
                    newPosition = this.editState.position.clone().add(this.editState.size).subtract(newSize);
                }

                if (event?.altKey) {
                    const center = this.editState.position
                        .clone()
                        .add(this.editState.size.x / 2, this.editState.size.y / 2);
                    newPosition = center
                        .clone()
                        .subtract(newSize.x / 2, newSize.y / 2)
                        .round();
                }

                this.position = newPosition;
                this.size = newSize;
            },
        },
        // Edge handles
        {
            cursor: 'ns-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x + this.bounds.w / 2, this.bounds.y), new Point(3)).subtract(
                    1.5,
                    1.5,
                    0,
                    0
                ),
            move: (offset: Point, event?: MouseEvent): void => {
                let newSize = this.editState.size.clone();
                let newPosition = this.editState.position.clone();

                newSize.y = Math.max(this.editState.size.y + offset.y, this.minLen);
                newPosition.y = this.editState.position.y - offset.y;

                if (event?.shiftKey) {
                    const aspectRatio = this.editState.size.x / this.editState.size.y;
                    newSize.x = Math.round(newSize.y * aspectRatio);
                    newPosition.x = this.editState.position.x + (this.editState.size.x - newSize.x) / 2;
                }

                this.position = newPosition.round();
                this.size = newSize.round();
            },
        },
        {
            cursor: 'ew-resize',
            getRect: (): Rect =>
                new Rect(
                    new Point(this.bounds.x + this.bounds.w, this.bounds.y + this.bounds.h / 2),
                    new Point(3)
                ).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, event?: MouseEvent): void => {
                let newSize = this.editState.size.clone();
                let newPosition = this.editState.position.clone();

                newSize.x = Math.max(this.editState.size.x - offset.x, this.minLen);

                if (event?.shiftKey) {
                    const aspectRatio = this.editState.size.x / this.editState.size.y;
                    newSize.y = Math.round(newSize.x / aspectRatio);
                    newPosition.y = this.editState.position.y + (this.editState.size.y - newSize.y) / 2;
                }

                this.position = newPosition.round();
                this.size = newSize.round();
            },
        },
        {
            cursor: 'ns-resize',
            getRect: (): Rect =>
                new Rect(
                    new Point(this.bounds.x + this.bounds.w / 2, this.bounds.y + this.bounds.h),
                    new Point(3)
                ).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, event?: MouseEvent): void => {
                let newSize = this.editState.size.clone();
                let newPosition = this.editState.position.clone();

                newSize.y = Math.max(this.editState.size.y - offset.y, this.minLen);

                if (event?.shiftKey) {
                    const aspectRatio = this.editState.size.x / this.editState.size.y;
                    newSize.x = Math.round(newSize.y * aspectRatio);
                    newPosition.x = this.editState.position.x + (this.editState.size.x - newSize.x) / 2;
                }

                this.position = newPosition.round();
                this.size = newSize.round();
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
            move: (offset: Point, event?: MouseEvent): void => {
                let newSize = this.editState.size.clone();
                let newPosition = this.editState.position.clone();

                newSize.x = Math.max(this.editState.size.x + offset.x, this.minLen);
                newPosition.x = this.editState.position.x - offset.x;

                if (event?.shiftKey) {
                    const aspectRatio = this.editState.size.x / this.editState.size.y;
                    newSize.y = Math.round(newSize.x / aspectRatio);
                    newPosition.y = this.editState.position.y + (this.editState.size.y - newSize.y) / 2;
                }

                this.position = newPosition.round();
                this.size = newSize.round();
            },
        },
    ];

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
        if (!this.features.hasRoundCorners) {
            delete this.modifiers.radius;
        }
        this.color = this.features.defaultColor;
    }

    startEdit(mode: EditMode, point: Point, editPoint: TLayerEditPoint) {
        this.pushHistory();
        this.mode = mode;
        if (mode == EditMode.CREATING) {
            this.position = point.clone();
            this.size = new Point(1);
            this.updateBounds();
            this.draw();
        }
        this.editState = {
            firstPoint: point,
            editPoint,
            position: this.position.clone(),
            size: this.size.clone(),
        };
    }

    edit(point: Point, originalEvent: MouseEvent | TouchEvent) {
        if (!this.editState) {
            return;
        }
        const {position, editPoint, firstPoint} = this.editState;
        const mouseEvent = originalEvent as MouseEvent;
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                editPoint.move(firstPoint.clone().subtract(point), mouseEvent);
                break;
            case EditMode.CREATING:
                let newSize = point.clone().subtract(firstPoint).abs().max(new Point(1));
                if (mouseEvent?.shiftKey) {
                    const maxDimension = Math.max(newSize.x, newSize.y);
                    newSize = new Point(maxDimension, maxDimension);
                }
                if (mouseEvent?.altKey) {
                    newSize = newSize.multiply(2);
                }
                this.size = newSize;
                if (mouseEvent?.altKey) {
                    this.position = firstPoint
                        .clone()
                        .subtract(newSize.x / 2, newSize.y / 2)
                        .round();
                } else {
                    const signs = point
                        .clone()
                        .subtract(firstPoint)
                        .xy.map((v) => (v >= 0 ? 1 : -1));
                    const endPoint = firstPoint.clone().add(newSize.x * signs[0], newSize.y * signs[1]);
                    this.position = endPoint.min(firstPoint);
                }
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
        if (this.radius > 0) {
            this.renderer.drawRoundedRect(this.position, this.size, this.radius, this.fill, this.color);
        } else {
            this.renderer.drawRect(this.position, this.size, this.fill, this.color);
        }
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds(): void {
        this.bounds = new Rect(this.position, this.size);
    }

    public contains(point: Point): boolean {
        return this.bounds.contains(point);
    }
}
