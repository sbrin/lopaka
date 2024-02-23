import {TPlatformFeatures} from '../../platforms/platform';
import {
    downloadImage,
    flipImageDataByX,
    flipImageDataByY,
    hexToRgb,
    invertImageData,
    packImage,
    rotateImageData,
    unpackImage
} from '../../utils';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerActions, TLayerEditPoint, TLayerState} from './abstract.layer';

export type TImageState = TLayerState & {
    p: number[]; // position
    s: number[]; // size
    d: string; // data
    nm: string; // name
    o: boolean; // overlay
    c?: string; // color
};

export abstract class AbstractImageLayer extends AbstractLayer {
    protected type: ELayerType;
    protected state: TImageState;
    protected editState: {
        firstPoint: Point;
        position: Point;
        size: Point;
    } = null;

    public get properties(): any {
        return {
            x: this.position.x,
            y: this.position.y,
            w: this.size.x,
            h: this.size.y,
            overlay: this.overlay,
            color: this.color,
            image: this.data,
            type: this.type,
            id: this.uid,
            imageName: this.imageName,
            inverted: this.inverted
        };
    }

    public position: Point = new Point();
    public size: Point = new Point();
    public data: ImageData;
    public overlay: boolean;
    public imageName: string;

    constructor(protected features: TPlatformFeatures) {
        super(features);
    }

    actions: TLayerActions = [
        {
            label: '⬌',
            title: 'Flip horizontally',
            action: () => {
                this.data = flipImageDataByX(this.data);
                this.saveState();
                this.draw();
            }
        },
        {
            label: '⬍',
            title: 'Flip vertically',
            action: () => {
                this.data = flipImageDataByY(this.data);
                this.saveState();
                this.draw();
            }
        },
        {
            label: '↻',
            title: 'Rotate clockwise',
            action: () => {
                this.data = rotateImageData(this.data);
                this.size = new Point(this.data.width, this.data.height);
                this.updateBounds();
                this.saveState();
                this.draw();
            }
        },
        {
            label: '◧',
            title: 'Invert colors',
            action: () => {
                this.data = invertImageData(this.data, this.color);
                this.saveState();
                this.draw();
            }
        },
        {
            name: 'Fit layer',
            action: () => {
                this.recalculate();
                this.updateBounds();
                this.saveState();
                this.draw();
            }
        },
        {
            name: 'Download image',
            action: () => {
                downloadImage(this.data, this.imageName);
            }
        }
    ];

    applyColor() {
        const color = hexToRgb(this.color);
        this.data.data.forEach((v, i) => {
            if (i % 4 === 3 && v !== 0) {
                this.data.data[i - 3] = color.r;
                this.data.data[i - 2] = color.g;
                this.data.data[i - 1] = color.b;
                return v;
            }
        });
    }

    recalculate() {
        const {dc} = this;
        const {width, height} = dc.ctx.canvas;
        const data = dc.ctx.getImageData(0, 0, width, height);
        let min: Point = new Point(width, height);
        let max: Point = new Point(0, 0);
        dc.ctx.beginPath();
        for (let i = 0; i < data.data.length; i += 4) {
            const x = (i / 4) % width;
            const y = Math.floor(i / 4 / width);
            if (data.data[i + 3] !== 0) {
                min = min.min(new Point(x, y));
                max = max.max(new Point(x, y));
            }
        }
        this.position = min.clone();
        this.size = max.clone().subtract(min).add(1);
        this.data = dc.ctx.getImageData(min.x, min.y, this.size.x, this.size.y);
    }

    draw() {
        const {dc, position, data, size} = this;
        dc.clear();
        dc.ctx.putImageData(data, position.x, position.y);
        dc.ctx.save();
        dc.ctx.fillStyle = 'rgba(0,0,0,0)';
        dc.ctx.beginPath();
        dc.ctx.rect(position.x, position.y, size.x, size.y);
        dc.ctx.fill();
        dc.ctx.restore();
    }

    saveState() {
        const state: TImageState = {
            p: this.position.xy,
            s: this.size.xy,
            d: packImage(this.data),
            nm: this.imageName,
            n: this.name,
            i: this.index,
            g: this.group,
            t: this.type,
            o: this.overlay,
            u: this.uid,
            c: this.color,
            in: this.inverted
        };
        this.state = state;
    }

    loadState(state: TImageState) {
        this.position = new Point(state.p);
        this.size = new Point(state.s);
        this.name = state.n;
        this.index = state.i;
        this.group = state.g;
        this.data = unpackImage(state.d, this.size.x, this.size.y);
        this.color = state.c || this.features.defaultColor;
        this.imageName = state.nm;
        this.overlay = state.o;
        this.uid = state.u;
        this.inverted = state.in;
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds(): void {
        this.bounds = new Rect(this.position, this.size);
    }
}
