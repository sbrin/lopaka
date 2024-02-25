import {TPlatformFeatures} from '../../platforms/platform';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerModifiers, TModifierType} from './abstract.layer';

export class CircleLayer extends AbstractLayer {
    protected type: ELayerType = 'circle';
    @mapping('r', 'point')
    public radius: number = 1;
    @mapping('p', 'point')
    public position: Point = new Point();
    @mapping('f')
    public fill: boolean = false;

    protected editState: {
        firstPoint: Point;
        position: Point;
        radius: number;
        editPoint: TLayerEditPoint;
    } = null;

    public get properties(): any {
        return {
            x: this.position.x + this.radius,
            y: this.position.y + this.radius,
            r: this.radius,
            fill: this.fill,
            color: this.color,
            type: this.type,
            id: this.uid,
            inverted: this.inverted
        };
    }

    modifiers: TLayerModifiers = {
        x: {
            getValue: () => this.position.x,
            setValue: (v: number) => {
                this.position.x = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number
        },
        y: {
            getValue: () => this.position.y,
            setValue: (v: number) => {
                this.position.y = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number
        },
        radius: {
            getValue: () => this.radius,
            setValue: (v: number) => {
                this.radius = v;
                this.updateBounds();
                this.draw();
            },
            type: TModifierType.number
        },
        fill: {
            getValue: () => this.fill,
            setValue: (v: boolean) => {
                this.fill = v;
                this.draw();
            },
            type: TModifierType.boolean
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
            cursor: 'nesw-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x + this.bounds.w, this.bounds.y), new Point(3)).subtract(
                    1.5,
                    1.5,
                    0,
                    0
                ),
            move: (offset: Point): void => {
                this.position.y = Math.floor(this.editState.position.y + Math.round(offset.x / 2) * 2);
                this.radius = Math.floor(this.editState.radius - offset.x / 2);
            }
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(
                    new Point(this.bounds.x + this.bounds.w, this.bounds.y + this.bounds.h),
                    new Point(3)
                ).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point): void => {
                this.radius = Math.round(this.editState.radius - offset.x / 2);
            }
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
                this.position.x = Math.ceil(this.editState.position.x - Math.round(offset.x / 2) * 2);
                this.radius = Math.ceil(this.editState.radius + offset.x / 2);
            }
        },
        {
            cursor: 'nwse-resize',
            getRect: (): Rect =>
                new Rect(new Point(this.bounds.x, this.bounds.y), new Point(3)).subtract(1.5, 1.5, 0, 0),
            move: (offset: Point): void => {
                this.position = this.editState.position
                    .clone()
                    .subtract(Math.round(offset.x / 2) * 2)
                    .ceil();
                this.radius = Math.ceil(this.editState.radius + offset.x / 2);
            }
        }
    ];

    startEdit(mode: EditMode, point: Point, editPoint: TLayerEditPoint) {
        this.mode = mode;
        if (mode == EditMode.CREATING) {
            this.position = point.clone();
            this.radius = 1;
            this.updateBounds();
            this.draw();
        }
        this.editState = {
            firstPoint: point,
            position: this.position.clone(),
            radius: this.radius,
            editPoint
        };
    }

    edit(point: Point, originalEvent: MouseEvent) {
        const {position, firstPoint, editPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                // todo
                editPoint.move(firstPoint.clone().subtract(point));
                break;
            case EditMode.CREATING:
                const radius = Math.max(
                    Math.max(...point.clone().subtract(firstPoint).abs().divide(2).round().xy) - 2,
                    1
                );
                this.radius = radius;
                if (originalEvent.altKey) {
                    this.position = firstPoint.clone().subtract(radius);
                } else {
                    const signs = point.clone().subtract(firstPoint).xy.map(Math.sign);
                    this.position = firstPoint.min(firstPoint.clone().add(new Point(radius * 2 + 1).multiply(signs)));
                }
                break;
        }
        this.updateBounds();
        this.draw();
    }

    stopEdit() {
        this.mode = EditMode.NONE;
        this.editState = null;
    }

    draw() {
        const {dc, radius, position} = this;
        const center = position.clone().add(radius);
        dc.clear();
        dc.ctx.fillStyle = this.color;
        dc.ctx.strokeStyle = this.color;
        dc.pixelateCircle(center, radius, this.fill);
    }

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds() {
        this.bounds = new Rect(this.position, new Point(this.radius * 2)).add(0, 0, 1, 1);
    }
}
