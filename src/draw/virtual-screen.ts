import {EffectScope, toRefs, watch} from 'vue';
import {Session} from '../core/session';
import {Layer} from '../core/layer';
import {Point} from '../core/point';

export class VirtualScreen {
    private screen: OffscreenCanvas = null;
    public ctx: OffscreenCanvasRenderingContext2D = null;

    private scope: EffectScope;
    canvas: HTMLCanvasElement;

    constructor(private session: Session) {
        const {display, layers, platform} = toRefs(session.state);
        this.screen = new OffscreenCanvas(session.state.display.x, session.state.display.y);
        this.ctx = this.screen.getContext('2d', {
            willReadFrequently: true,
            alpha: true
        });
        this.scope = new EffectScope();
        this.scope.run(() => {
            watch(
                [layers, display, platform],
                () => {
                    this.redraw();
                },
                {
                    deep: true
                }
            );
        });
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.resize();
        this.redraw();
    }

    getLayersInPoint(position: Point): Layer[] {
        const point = position.clone().divide(this.session.state.scale).round();
        return this.session.state.layers.filter(
            (layer) => layer.dc.ctx.isPointInStroke(point.x, point.y) || layer.dc.ctx.isPointInPath(point.x, point.y)
        );
    }

    public resize() {
        const {display, scale, layers} = this.session.state;
        const size = display.clone();
        this.screen.width = size.x;
        this.screen.height = size.y;
        if (this.canvas) {
            this.canvas.width = size.x;
            this.canvas.height = size.y;
            Object.assign(this.canvas.style, {
                width: `${size.x * scale.x}px`,
                height: `${size.y * scale.y}px`
            });
        }
        layers.forEach((layer: Layer) => {
            layer.buffer.width = size.x;
            layer.buffer.height = size.y;
            this.session.tools[layer.type].draw(layer);
        });
    }

    public redraw() {
        if (!this.canvas) return;
        this.clear();
        const canvasContext: CanvasRenderingContext2D = this.canvas.getContext('2d', {
            willReadFrequently: true,
            antialias: false,
            alpha: true
        }) as CanvasRenderingContext2D;

        this.session.state.layers.forEach((layer) => {
            this.ctx.drawImage(layer.buffer, 0, 0);
        });
        // create data without alpha channel
        const data = this.ctx.getImageData(0, 0, this.screen.width, this.screen.height).data.map((v, i) => {
            // if (i % 4 === 3) return v >= 255 / 2 ? 255 : 0;
            return v;
        });
        canvasContext.putImageData(
            new ImageData(new Uint8ClampedArray(data), this.screen.width, this.screen.height),
            0,
            0
        );
    }

    public clear() {
        if (!this.canvas) return;
        this.ctx.clearRect(0, 0, this.screen.width, this.screen.height);
        this.canvas.getContext('2d').clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    public onDestory() {
        this.scope.stop();
    }
}
