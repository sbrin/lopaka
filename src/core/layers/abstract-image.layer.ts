import {TPlatformFeatures} from '../../platforms/platform';
import {packImage, unpackImage} from '../../utils';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerState} from './abstract.layer';

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
            id: this.uid
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
            c: this.color
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
        this.updateBounds();
        this.mode = EditMode.NONE;
    }

    updateBounds(): void {
        this.bounds = new Rect(this.position, this.size);
    }
}
