import {TPlatformFeatures} from '../../platforms/platform';
import {packImage, unpackImage} from '../../utils';
import {getImage, setImage} from '../image-library';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerEditPoint, TLayerState} from './abstract.layer';

export type TImageState = TLayerState & {
    p: number[]; // position
    s: number[]; // size
    nm: string; // name
    o: boolean; // overlay
    c?: string; // color
    ii: string; // image id
};

export abstract class AbstractImageLayer extends AbstractLayer {
    protected type: ELayerType;
    protected state: TImageState;
    public imageId: string;
    protected editState: {
        firstPoint: Point;
        position: Point;
        size: Point;
    } = null;

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
        dc.ctx.globalCompositeOperation = 'source-atop';
        dc.ctx.rect(position.x, position.y, size.x, size.y);
        dc.ctx.fillStyle = this.color;
        dc.ctx.fill();
        dc.ctx.globalCompositeOperation = 'source-over';
        dc.ctx.save();
        dc.ctx.fillStyle = 'rgba(0,0,0,0)';
        dc.ctx.beginPath();
        dc.ctx.rect(position.x, position.y, size.x, size.y);
        dc.ctx.fill();
        dc.ctx.restore();
    }

    saveState(updateImageInLibrary: boolean = false) {
        const packedData = packImage(this.data);
        // if (updateImageInLibrary) {
        //     setImage({
        //         data: packedData,
        //         name: this.name,
        //         width: this.size.x,
        //         height: this.size.y,
        //         id: this.imageId,
        //         unused: false
        //     });
        // } else {
        // if (!this.imageId) {
        const id = setImage({
            data: packedData,
            name: this.name,
            width: this.size.x,
            height: this.size.y,
            id: null,
            unused: false
        });
        this.imageId = id;
        // }
        // }
        const state: TImageState = {
            p: this.position.xy,
            s: this.size.xy,
            ii: this.imageId,
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
        const image = getImage(state.ii);
        let packedImage = (image && image.data) || state['d'];
        this.color = state.c || this.features.defaultColor;
        try {
            this.data = unpackImage(packedImage, this.size.x, this.size.y);
        } catch (error) {
            // TODO: fix types for backwards compatibility with uncompressed images
            this.data = new ImageData(new Uint8ClampedArray(state['d'] as any), this.size.x, this.size.y);
        }
        this.imageName = state.nm;
        this.overlay = state.o;
        this.uid = state.u;
        this.updateBounds();
        this.mode = EditMode.NONE;
        this.imageId = state.ii;
    }

    updateBounds(): void {
        this.bounds = new Rect(this.position, this.size);
    }
}
