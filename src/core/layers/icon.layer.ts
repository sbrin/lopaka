import {TPlatformFeatures} from '../../platforms/platform';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerModifier, TLayerModifiers, TLayerState, TModifierType} from './abstract.layer';

type TIconState = TLayerState & {
    p: number[]; // position [x, y]
    s: number[]; // size [w, h]
    d: number[]; // data
    in: string; // image name
    o: boolean; // is overlay
};

export class IconLayer extends AbstractLayer {
    protected type: ELayerType = 'icon';
    protected state: TIconState;
    protected editState: {
        firstPoint: Point;
        position: Point;
        size: Point;
    } = null;

    public position: Point = new Point();
    public size: Point = new Point();
    public image: ImageData = null;
    public imageName: string = '';
    public overlay: boolean = false;

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
        icon: {
            getValue: () => this.image,
            setValue: (v: HTMLImageElement) => {
                this.imageName = v.dataset.name;
                const buf = document.createElement('canvas');
                const ctx = buf.getContext('2d');
                buf.width = v.width;
                buf.height = v.height;
                ctx.drawImage(v, 0, 0);
                this.image = ctx.getImageData(0, 0, v.width, v.height);
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
        if (!this.features.hasCustomFontSize) {
            delete this.modifiers.fontSize;
        }
        if (!this.features.hasRGBSupport) {
            delete this.modifiers.color;
            this.color = '#000000';
        }
        if (this.features.hasInvertedColors) {
            this.color = '#FFFFFF';
        }
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

    draw() {
        const {dc, position, image, size} = this;
        dc.clear();
        if (image) {
            if (this.overlay) {
            }
            dc.ctx.putImageData(image, position.x, position.y);
        } else {
            dc.rect(position, size, false);
        }
        dc.ctx.save();
        dc.ctx.fillStyle = 'rgba(0,0,0,0)';
        dc.ctx.beginPath();
        dc.ctx.rect(position.x, position.y, size.x, size.y);
        dc.ctx.fill();
        dc.ctx.restore();
    }

    saveState() {
        const state: TIconState = {
            p: this.position.xy,
            s: this.size.xy,
            d: Array.from(this.image?.data || []), //TODO image data
            in: this.imageName,
            n: this.name,
            i: this.index,
            g: this.group,
            t: this.type,
            o: this.overlay,
            u: this.uid
        };
        this.state = state;
    }

    loadState(state: TIconState) {
        this.position = new Point(state.p);
        this.size = new Point(state.s);
        this.name = state.n;
        this.index = state.i;
        this.group = state.g;
        this.image = new ImageData(new Uint8ClampedArray(state.d), this.size.x, this.size.y);
        this.imageName = state.in;
        this.overlay = state.o;
        this.uid = state.u;
        this.updateBounds();
    }

    updateBounds(): void {
        this.bounds = new Rect(this.position, this.size);
    }
}
