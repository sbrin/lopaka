import {TPlatformFeatures} from '../../platforms/platform';
import {Point} from '../point';
import {AbstractImageLayer} from './abstract-image.layer';
import {EditMode, TLayerModifiers, TModifierType} from './abstract.layer';

export class PaintLayer extends AbstractImageLayer {
    protected type: ELayerType = 'paint';
    private emtyPixel: ImageData = new ImageData(new Uint8ClampedArray([0, 0, 0, 0]), 1, 1);

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
        w: {
            getValue: () => this.size.x,
            type: TModifierType.number
        },
        h: {
            getValue: () => this.size.y,
            type: TModifierType.number
        },
        color: {
            getValue: () => this.color,
            setValue: (v: string) => {
                this.color = v;
                this.applyColor();
                this.draw();
            },
            type: TModifierType.color
        },
        overlay: {
            getValue: () => this.overlay,
            setValue: (v: boolean) => {
                this.overlay = v;
                this.draw();
            },
            type: TModifierType.boolean
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

    startEdit(mode: EditMode, point: Point) {
        this.mode = mode;
        this.editState = {
            firstPoint: point,
            position: this.position?.clone() || new Point(),
            size: this.size?.clone() || new Point()
        };
        if (mode === EditMode.CREATING) {
            this.editState.position = point.clone();
        }
    }

    edit(point: Point, originalEvent: MouseEvent) {
        const {position, firstPoint} = this.editState;
        const {ctx} = this.dc;
        switch (this.mode) {
            case EditMode.MOVING:
                const newPos = position.clone().add(point.clone().subtract(firstPoint)).round();
                this.position = newPos.clone();
                break;
            case EditMode.RESIZING:
                // this.size = size.clone().add(point.clone().subtract(firstPoint)).round();
                // todo
                break;
            case EditMode.CREATING:
                if (originalEvent && (originalEvent.which == 3 || originalEvent.metaKey)) {
                    ctx.putImageData(this.emtyPixel, point.x, point.y);
                } else {
                    ctx.save();
                    ctx.beginPath();
                    if (position.distanceTo(point) < 1) {
                        ctx.rect(point.x, point.y, 1, 1);
                    } else {
                        this.dc.pixelateLine(position, point, 1);
                    }
                    ctx.fillStyle = this.color;
                    ctx.fill();
                    this.editState.position = point.clone();
                    ctx.closePath();
                    ctx.restore();
                }
                this.recalculate();
                break;
        }
        this.updateBounds();
        this.draw();
    }

    stopEdit() {
        this.mode = EditMode.NONE;
        this.updateBounds();
        this.editState = null;
    }

    draw() {
        if (this.data) {
            super.draw();
        }
    }
}
