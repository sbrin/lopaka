import {TPlatformFeatures} from '../../platforms/platform';
import {
    applyColor,
    downloadImage,
    flipImageDataByX,
    flipImageDataByY,
    invertImageData,
    rotateImageData
} from '../../utils';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerActions} from './abstract.layer';

export abstract class AbstractImageLayer extends AbstractLayer {
    protected type: ELayerType;
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

    @mapping('p', 'point') public position: Point = new Point();

    @mapping('s', 'point') public size: Point = new Point();

    @mapping('d', 'image') public data: ImageData;

    @mapping('o') public overlay: boolean;

    @mapping('nm') public imageName: string;

    constructor(protected features: TPlatformFeatures) {
        super(features);
    }

    actions: TLayerActions = [
        {
            label: '⬌',
            title: 'Flip horizontally',
            action: () => {
                this.data = flipImageDataByX(this.data);
                this.draw();
            }
        },
        {
            label: '⬍',
            title: 'Flip vertically',
            action: () => {
                this.data = flipImageDataByY(this.data);
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
                this.draw();
            }
        },
        {
            label: '◧',
            title: 'Invert colors',
            action: () => {
                this.data = invertImageData(this.data, this.color);
                this.draw();
            }
        },
        {
            label: '⚀',
            title: 'Remove blank padding',
            action: () => {
                this.recalculate();
                this.updateBounds();
                this.draw();
            }
        },
        {
            label: 'Download',
            title: 'Download image',
            action: () => {
                downloadImage(this.data, this.imageName ?? 'image_' + this.index);
            }
        }
    ];

    applyColor() {
        this.data = applyColor(this.data, this.color);
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

    onLoadState() {
        this.updateBounds();
        this.mode = EditMode.NONE;
        this.applyColor();
    }

    updateBounds(): void {
        this.bounds = new Rect(this.position, this.size);
    }
}
