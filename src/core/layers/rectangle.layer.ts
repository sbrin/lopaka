import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';

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
            type: TModifierType.number,
        },
        y: {
            getValue: () => this.position.y,
            setValue: (v: number) => {
                this.position.y = v;
                this.updateBounds();
                this.draw();
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
            type: TModifierType.number,
        },
        h: {
            getValue: () => this.size.y,
            setValue: (v: number) => {
                this.size.y = Math.max(v, this.minLen);
                this.updateBounds();
                this.draw();
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

    editPoints: TLayerEditPoint[] = [
        {
            cursor: 'nesw-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x + this.bounds.w, this.bounds.y), new Point(3)).subtract(
                    1.5,
                    1.5,
                    0,
                    0
                ),
            move: (offset: Point, modifiers?: {shiftKey: boolean; altKey: boolean}): void => {
                let newSize = new Point(this.editState.size.x - offset.x, this.editState.size.y + offset.y).max(
                    new Point(this.minLen)
                );
                let newPosition = this.editState.position.clone().subtract(0, offset.y);

                if (modifiers?.shiftKey) {
                    const aspectRatio = this.editState.size.x / this.editState.size.y;
                    const maxDimension = Math.max(newSize.x, newSize.y);
                    if (newSize.x > newSize.y) {
                        newSize = new Point(Math.round(maxDimension), Math.round(maxDimension / aspectRatio));
                    } else {
                        newSize = new Point(Math.round(maxDimension * aspectRatio), Math.round(maxDimension));
                    }
                    newPosition.y = this.editState.position.y + this.editState.size.y - newSize.y;
                }

                if (modifiers?.altKey) {
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
            move: (offset: Point, modifiers?: {shiftKey: boolean; altKey: boolean}): void => {
                let newSize = this.editState.size.clone().subtract(offset).max(new Point(this.minLen));

                if (modifiers?.shiftKey) {
                    const aspectRatio = this.editState.size.x / this.editState.size.y;
                    const maxDimension = Math.max(newSize.x, newSize.y);
                    if (newSize.x > newSize.y) {
                        newSize = new Point(Math.round(maxDimension), Math.round(maxDimension / aspectRatio));
                    } else {
                        newSize = new Point(Math.round(maxDimension * aspectRatio), Math.round(maxDimension));
                    }
                }

                if (modifiers?.altKey) {
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
            move: (offset: Point, modifiers?: {shiftKey: boolean; altKey: boolean}): void => {
                let newSize = this.editState.size.clone().add(offset.x, -offset.y).max(new Point(this.minLen));
                let newPosition = this.editState.position.clone().subtract(offset.x, 0);

                if (modifiers?.shiftKey) {
                    const aspectRatio = this.editState.size.x / this.editState.size.y;
                    const maxDimension = Math.max(newSize.x, newSize.y);
                    if (newSize.x > newSize.y) {
                        newSize = new Point(Math.round(maxDimension), Math.round(maxDimension / aspectRatio));
                    } else {
                        newSize = new Point(Math.round(maxDimension * aspectRatio), Math.round(maxDimension));
                    }
                    newPosition.x = this.editState.position.x + this.editState.size.x - newSize.x;
                }

                if (modifiers?.altKey) {
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
            move: (offset: Point, modifiers?: {shiftKey: boolean; altKey: boolean}): void => {
                let newSize = this.editState.size.clone().add(offset).max(new Point(this.minLen));
                let newPosition = this.editState.position.clone().subtract(offset);

                if (modifiers?.shiftKey) {
                    const aspectRatio = this.editState.size.x / this.editState.size.y;
                    const maxDimension = Math.max(newSize.x, newSize.y);
                    if (newSize.x > newSize.y) {
                        newSize = new Point(Math.round(maxDimension), Math.round(maxDimension / aspectRatio));
                    } else {
                        newSize = new Point(Math.round(maxDimension * aspectRatio), Math.round(maxDimension));
                    }
                    newPosition = this.editState.position.clone().add(this.editState.size).subtract(newSize);
                }

                if (modifiers?.altKey) {
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
    ];

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

    edit(point: Point, originalEvent: MouseEvent) {
        if (!this.editState) {
            return;
        }
        const {position, editPoint, firstPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                editPoint.move(firstPoint.clone().subtract(point), {
                    shiftKey: originalEvent.shiftKey,
                    altKey: originalEvent.altKey,
                });
                break;
            case EditMode.CREATING:
                let newSize = point.clone().subtract(firstPoint).abs().max(new Point(1));
                if (originalEvent.shiftKey) {
                    const maxDimension = Math.max(newSize.x, newSize.y);
                    newSize = new Point(maxDimension, maxDimension);
                }
                if (originalEvent.altKey) {
                    newSize = newSize.multiply(2);
                }
                this.size = newSize;
                if (originalEvent.altKey) {
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
        const {dc, position, size} = this;
        dc.clear();
        dc.ctx.fillStyle = this.color;
        dc.ctx.strokeStyle = this.color;
        dc.pixelateRoundedRect(position, size, this.radius, this.fill);
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds(): void {
        this.bounds = new Rect(this.position, this.size);
    }
}
