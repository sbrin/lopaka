import {TPlatformFeatures} from '../../platforms/platform';
import {inverImageDataWithAlpha} from '../../utils';
import {Point} from '../point';
import {AbstractImageLayer} from './abstract-image.layer';
import {EditMode, TLayerModifiers, TModifierType} from './abstract.layer';

export class IconLayer extends AbstractImageLayer {
    protected type: ELayerType = 'icon';

    modifiers: TLayerModifiers = {
        x: {
            getValue: () => this.position.x,
            setValue: (v: number) => {
                this.position.x = v;

                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.number
        },
        y: {
            getValue: () => this.position.y,
            setValue: (v: number) => {
                this.position.y = v;
                this.updateBounds();
                this.saveState();
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
        icon: {
            getValue: () => this.data,
            setValue: (v: HTMLImageElement) => {
                this.imageName = v.dataset.name;
                const buf = document.createElement('canvas');
                const ctx = buf.getContext('2d');
                buf.width = v.width;
                buf.height = v.height;
                ctx.drawImage(v, 0, 0);
                if (this.features.hasInvertedColors) {
                    this.data = inverImageDataWithAlpha(ctx.getImageData(0, 0, v.width, v.height));
                } else {
                    this.data = ctx.getImageData(0, 0, v.width, v.height);
                }
                this.size = new Point(v.width, v.height);
                this.updateBounds();
                this.saveState();
                this.draw();
            },
            type: TModifierType.image
        },
        overlay: {
            getValue: () => this.overlay,
            setValue: (v: boolean) => {
                this.overlay = v;
                this.saveState();
                this.draw();
            },
            type: TModifierType.boolean
        }
    };

    startEdit(mode: EditMode, point: Point) {
        this.mode = mode;
        this.editState = {
            firstPoint: point,
            position: this.position.clone(),
            size: this.size.clone()
        };
    }

    constructor(protected features: TPlatformFeatures) {
        super(features);
        if (!this.features.hasRGBSupport) {
            delete this.modifiers.color;
        }
        this.color = this.features.defaultColor;
    }

    edit(point: Point, originalEvent: MouseEvent) {
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
        this.saveState();
        this.history.push(this.state);
    }
}
