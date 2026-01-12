import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';

export class EllipseLayer extends AbstractLayer {
    protected type: ELayerType = 'ellipse';
    @mapping('rx') public rx: number = 1;
    @mapping('ry') public ry: number = 1;
    @mapping('p', 'point') public position: Point = new Point();
    @mapping('f') public fill: boolean = false;

    protected editState: {
        firstPoint: Point;
        position: Point;
        radiusX: number;
        radiusY: number;
        editPoint: TLayerEditPoint;
    } = null;

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
        radiusX: {
            getValue: () => this.rx,
            setValue: (v: number) => {
                this.rx = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number,
        },
        radiusY: {
            getValue: () => this.ry,
            setValue: (v: number) => {
                this.ry = v;
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
                const dx = Math.round(offset.x / 2);
                const dy = Math.round(offset.y / 2);
                let newRx = Math.max(1, Math.floor(this.editState.radiusX - dx));
                let newRy = Math.max(1, Math.floor(this.editState.radiusY + dy));

                if (modifiers?.shiftKey) {
                    const aspectRatio = this.editState.radiusX / this.editState.radiusY;
                    const maxRadius = Math.max(newRx, newRy);
                    if (newRx > newRy) {
                        newRx = Math.round(maxRadius);
                        newRy = Math.round(maxRadius / aspectRatio);
                    } else {
                        newRx = Math.round(maxRadius * aspectRatio);
                        newRy = Math.round(maxRadius);
                    }
                }

                if (modifiers?.altKey) {
                    const center = this.editState.position.clone().add(this.editState.radiusX, this.editState.radiusY);
                    this.position = center.clone().subtract(newRx, newRy).round();
                } else {
                    if (Math.floor(this.editState.radiusY + dy) >= 1) {
                        this.position.y = this.editState.position.y - (newRy - this.editState.radiusY);
                    }
                }

                this.rx = Math.max(1, Math.floor(newRx));
                this.ry = Math.max(1, Math.floor(newRy));
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
                const dx = Math.round(offset.x / 2);
                const dy = Math.round(offset.y / 2);
                let newRx = Math.max(1, Math.round(this.editState.radiusX - dx));
                let newRy = Math.max(1, Math.round(this.editState.radiusY - dy));

                if (modifiers?.shiftKey) {
                    const aspectRatio = this.editState.radiusX / this.editState.radiusY;
                    const maxRadius = Math.max(newRx, newRy);
                    if (newRx > newRy) {
                        newRx = Math.round(maxRadius);
                        newRy = Math.round(maxRadius / aspectRatio);
                    } else {
                        newRx = Math.round(maxRadius * aspectRatio);
                        newRy = Math.round(maxRadius);
                    }
                }

                if (modifiers?.altKey) {
                    const center = this.editState.position.clone().add(this.editState.radiusX, this.editState.radiusY);
                    this.position = center.clone().subtract(newRx, newRy).round();
                }

                this.rx = Math.max(1, Math.round(newRx));
                this.ry = Math.max(1, Math.round(newRy));
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
                const dx = Math.round(offset.x / 2);
                const dy = Math.round(offset.y / 2);
                let newRx = Math.max(1, Math.ceil(this.editState.radiusX + dx));
                let newRy = Math.max(1, Math.ceil(this.editState.radiusY - dy));

                if (modifiers?.shiftKey) {
                    const aspectRatio = this.editState.radiusX / this.editState.radiusY;
                    const maxRadius = Math.max(newRx, newRy);
                    if (newRx > newRy) {
                        newRx = Math.round(maxRadius);
                        newRy = Math.round(maxRadius / aspectRatio);
                    } else {
                        newRx = Math.round(maxRadius * aspectRatio);
                        newRy = Math.round(maxRadius);
                    }
                }

                if (modifiers?.altKey) {
                    const center = this.editState.position.clone().add(this.editState.radiusX, this.editState.radiusY);
                    this.position = center.clone().subtract(newRx, newRy).round();
                } else {
                    if (Math.ceil(this.editState.radiusX + dx) >= 1) {
                        this.position.x = this.editState.position.x - (newRx - this.editState.radiusX);
                    }
                }

                this.rx = Math.max(1, Math.ceil(newRx));
                this.ry = Math.max(1, Math.ceil(newRy));
            },
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point, modifiers?: {shiftKey: boolean; altKey: boolean}): void => {
                const dx = Math.round(offset.x / 2);
                const dy = Math.round(offset.y / 2);
                let newRx = Math.max(1, Math.ceil(this.editState.radiusX + dx));
                let newRy = Math.max(1, Math.ceil(this.editState.radiusY + dy));

                if (modifiers?.shiftKey) {
                    const aspectRatio = this.editState.radiusX / this.editState.radiusY;
                    const maxRadius = Math.max(newRx, newRy);
                    if (newRx > newRy) {
                        newRx = Math.round(maxRadius);
                        newRy = Math.round(maxRadius / aspectRatio);
                    } else {
                        newRx = Math.round(maxRadius * aspectRatio);
                        newRy = Math.round(maxRadius);
                    }
                }

                if (modifiers?.altKey) {
                    const center = this.editState.position.clone().add(this.editState.radiusX, this.editState.radiusY);
                    this.position = center.clone().subtract(newRx, newRy).round();
                } else {
                    if (Math.ceil(this.editState.radiusX + dx) >= 1) {
                        this.position.x = this.editState.position.x - (newRx - this.editState.radiusX);
                    }
                    if (Math.ceil(this.editState.radiusY + dy) >= 1) {
                        this.position.y = this.editState.position.y - (newRy - this.editState.radiusY);
                    }
                }

                this.rx = Math.max(1, Math.ceil(newRx));
                this.ry = Math.max(1, Math.ceil(newRy));
            },
        },
    ];

    startEdit(mode: EditMode, point: Point, editPoint: TLayerEditPoint) {
        this.pushHistory();
        this.mode = mode;
        if (mode == EditMode.CREATING) {
            this.position = point.clone();
            this.rx = 1;
            this.ry = 1;
            this.updateBounds();
            this.draw();
        }
        this.editState = {
            firstPoint: point,
            position: this.position.clone(),
            radiusX: this.rx,
            radiusY: this.ry,
            editPoint,
        };
    }

    edit(point: Point, originalEvent: MouseEvent) {
        if (!this.editState) {
            return;
        }
        const {position, firstPoint, editPoint} = this.editState;
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
                let radiusOffset = point.clone().subtract(firstPoint).abs();
                if (originalEvent.altKey) {
                    radiusOffset = radiusOffset.subtract(2).max(new Point(0));
                } else {
                    radiusOffset = radiusOffset.divide(2).round().subtract(2).max(new Point(0));
                }
                this.rx = Math.max(radiusOffset.x, 0);
                this.ry = Math.max(radiusOffset.y, 0);
                if (originalEvent.shiftKey) {
                    const maxRadius = Math.max(this.rx, this.ry);
                    this.rx = maxRadius;
                    this.ry = maxRadius;
                }
                if (originalEvent.altKey) {
                    this.position = firstPoint.clone().subtract(this.rx, this.ry).round();
                } else {
                    const signs = point.clone().subtract(firstPoint).xy.map(Math.sign);
                    const finalRadius = new Point(this.rx, this.ry);
                    this.position = firstPoint.min(
                        firstPoint.clone().add(finalRadius.clone().multiply(2).add(1).multiply(signs)).floor()
                    );
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
        const {dc, rx: radiusX, ry: radiusY, position} = this;
        const center = position.clone().add(radiusX, radiusY);
        dc.clear();
        dc.ctx.fillStyle = this.color;
        dc.ctx.strokeStyle = this.color;
        dc.pixelateEllipse(center, radiusX, radiusY, this.fill);
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds() {
        this.bounds = new Rect(this.position, new Point(this.rx, this.ry).multiply(2)).add(0, 0, 1, 1);
    }
}
