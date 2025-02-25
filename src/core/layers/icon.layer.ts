import {TPlatformFeatures} from '../../platforms/platform';
import {addAlphaChannelToImageData} from '../../utils';
import {Point} from '../point';
import {AbstractImageLayer} from './abstract-image.layer';
import {EditMode, TLayerModifiers, TModifierType} from './abstract.layer';

export class IconLayer extends AbstractImageLayer {
    public type: ELayerType = 'icon';

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

    startEdit(mode: EditMode, point: Point) {
        this.pushHistory();
        this.mode = mode;
        this.editState = {
            firstPoint: point,
            position: this.position.clone(),
            size: this.size.clone(),
        };
    }

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

    edit(point: Point, originalEvent: MouseEvent) {
        if (!this.editState) {
            return;
        }
        const {position, size, firstPoint} = this.editState;
        switch (this.mode) {
            case EditMode.MOVING:
                this.position = position.clone().add(point.clone().subtract(firstPoint)).round();
                break;
            case EditMode.RESIZING:
                // this.size = size.clone().add(point.clone().subtract(firstPoint)).round();
                // todo
                break;
            case EditMode.CREATING:
                this.position = point.clone();
                this.size = new Point(10, 10);
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
}
