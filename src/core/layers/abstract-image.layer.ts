import {TPlatformFeatures} from '../../platforms/platform';
import {
    applyColor,
    downloadImage,
    flattenImageDataToBackground,
    flipImageDataByX,
    flipImageDataByY,
    invertImageData,
    rotateImageData,
} from '../../utils';
import {mapping} from '../decorators/mapping';
import {Point} from '../point';
import {Rect} from '../rect';
import {AbstractLayer, EditMode, TLayerActions} from './abstract.layer';
import {AbstractDrawingRenderer} from '../../draw/renderers';

export abstract class AbstractImageLayer extends AbstractLayer {
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
            colorMode: this.colorMode,
            image: this.data,
            type: this.type,
            id: this.uid,
            imageName: this.imageName,
            inverted: this.inverted,
            alphaChannel: this.alphaChannel,
        };
    }

    @mapping('p', 'point') public position: Point = new Point();

    @mapping('s', 'point') public size: Point = new Point();

    @mapping('d', 'image') public data: ImageData;

    @mapping('cm') public colorMode: string = 'monochrome';

    @mapping('nm') public imageName: string;

    @mapping('ac') public alphaChannel: boolean = true;

    actions: TLayerActions = [
        {
            label: '⬌',
            iconType: 'flip_h',
            title: 'Flip horizontally',
            action: () => {
                this.data = flipImageDataByX(this.data);
                this.draw();
            },
        },
        {
            label: '⬍',
            iconType: 'flip_v',
            title: 'Flip vertically',
            action: () => {
                this.data = flipImageDataByY(this.data);
                this.draw();
            },
        },
        {
            label: '↻',
            iconType: 'rotate',
            title: 'Rotate clockwise',
            action: () => {
                this.data = rotateImageData(this.data);
                this.size = new Point(this.data.width, this.data.height);
                this.updateBounds();
                this.draw();
            },
        },
        {
            label: '◧',
            iconType: 'invert',
            title: 'Invert colors',
            action: () => {
                this.data = invertImageData(this.data, this.color, this.colorMode);
                this.draw();
            },
        },
        {
            label: '⚀',
            iconType: 'padding',
            title: 'Remove blank padding',
            action: () => {
                this.recalculate();
                this.updateBounds();
                this.draw();
            },
        },
        {
            label: 'Download',
            title: 'Download image',
            action: () => {
                downloadImage(this.data, this.imageName ?? (this.name ? this.name : 'image'));
            },
        },
        {
            label: 'Save',
            title: 'Add to Project assets',
            action: () => {},
        },
    ];

    applyColor() {
        if (this.colorMode === 'monochrome') {
            this.data = applyColor(this.data, this.color);
        }
    }

    recalculate() {
        const {dc} = this;
        const {width, height} = dc.ctx.canvas;
        const data = dc.ctx.getImageData(0, 0, width, height);
        let min: Point = new Point(width, height);
        let max: Point = new Point(0, 0);
        let hasContent = false;

        dc.ctx.beginPath();
        for (let i = 0; i < data.data.length; i += 4) {
            const x = (i / 4) % width;
            const y = Math.floor(i / 4 / width);
            if (data.data[i + 3] !== 0) {
                hasContent = true;
                min = min.min(new Point(x, y));
                max = max.max(new Point(x, y));
            }
        }

        if (!hasContent) {
            // Handle empty image case
            this.position = new Point(0, 0);
            this.size = new Point(1, 1);
            this.data = new ImageData(1, 1); // Create minimal valid ImageData
            return;
        }

        this.position = min.clone();
        this.size = max.clone().subtract(min).add(1);
        this.data = dc.ctx.getImageData(min.x, min.y, this.size.x, this.size.y);
    }
    draw() {
        const {position, data, size} = this;
        // Draw transparent overlay for bounds (this is used for selection/interaction)
        const {dc} = this.renderer;
        dc.clear();

        // Use the platform background when alpha export is disabled.
        const drawData =
            this.alphaChannel === false
                ? flattenImageDataToBackground(data, this.features?.screenBgColor ?? '#000000')
                : data;
        // Draw the image content (flattened or original) onto the buffer.
        dc.ctx.putImageData(drawData, position.x, position.y);

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
