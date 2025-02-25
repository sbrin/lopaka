import {TPlatformFeatures} from '../../platforms/platform';
import {Point} from '../point';
import {AbstractImageLayer} from './abstract-image.layer';
import {EditMode, TLayerModifiers, TModifierType} from './abstract.layer';
import {addAlphaChannelToImageData} from '/src/utils';

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
            type: TModifierType.number,
        },
        h: {
            getValue: () => this.size.y,
            type: TModifierType.number,
        },
        icon: {
            getValue: () => this.data,
            setValue: (v: HTMLImageElement) => {
                this.imageName = v.dataset.name;
                const [w, h] = [Number(v.dataset.w), Number(v.dataset.h)];
                if (w && h) {
                    this.size = new Point(w, h);
                }
                const buf = document.createElement('canvas');
                const ctx = buf.getContext('2d');
                buf.width = this.size.x;
                buf.height = this.size.y;
                ctx.drawImage(v, 0, 0);
                this.data = addAlphaChannelToImageData(ctx.getImageData(0, 0, this.size.x, this.size.y), this.color);
                this.updateBounds();
                this.applyColor();
                this.draw();
            },
            type: TModifierType.image,
        },
        color: {
            getValue: () => this.color,
            setValue: (v: string) => {
                this.color = v;
                this.applyColor();
                this.draw();
            },
            type: TModifierType.color,
        },
        overlay: {
            getValue: () => this.overlay,
            setValue: (v: boolean) => {
                this.overlay = v;
                this.draw();
            },
            type: TModifierType.boolean,
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

    startEdit(mode: EditMode, point: Point) {
        this.pushHistory();
        this.mode = mode;
        this.editState = {
            firstPoint: point,
            position: this.position?.clone() || new Point(),
            size: this.size?.clone() || new Point(),
        };
        if (mode === EditMode.CREATING) {
            this.editState.position = point.clone();
        }
    }

    edit(point: Point, originalEvent: MouseEvent) {
        if (!this.editState) {
            return;
        }

        const {ctx} = this.dc;
        const {position, firstPoint} = this.editState;
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
        this.pushRedoHistory();
    }

    draw() {
        if (this.data) {
            super.draw();
        }
    }
}
