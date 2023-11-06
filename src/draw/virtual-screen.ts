import {EffectScope, reactive, toRefs, watch} from 'vue';
import {Session} from '../core/session';
import {Point} from '../core/point';
import {DrawPlugin} from './plugins/draw.plugin';
import {RulerPlugin} from './plugins/ruler.plugin';
import {SmartRulerPlugin} from './plugins/smart-ruler.plugin';
import {HighlightPlugin} from './plugins/highlight.plugin';
import {PointerPlugin} from './plugins/pointer.plugin';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {ResizeIconsPlugin} from './plugins/resize-icons.plugin';

type VirtualScreenOptions = {
    ruler: boolean;
    smartRuler: boolean;
    highlight: boolean;
    pointer: boolean;
};

export class VirtualScreen {
    private screen: OffscreenCanvas = null;
    public ctx: OffscreenCanvasRenderingContext2D = null;

    private pluginLayer: HTMLCanvasElement = null;
    private pluginLayerContext: CanvasRenderingContext2D = null;
    public state;

    private scope: EffectScope;
    canvas: HTMLCanvasElement = null;
    canvasContext: CanvasRenderingContext2D = null;
    plugins: DrawPlugin[] = [];

    constructor(
        private session: Session,
        public options: VirtualScreenOptions
    ) {
        const {display, layers, platform, scale} = toRefs(session.state);
        this.screen = new OffscreenCanvas(display.value.x, display.value.y);
        this.ctx = this.screen.getContext('2d', {
            willReadFrequently: true,
            alpha: true
        });
        if (options.ruler) {
            this.plugins.push(new RulerPlugin(session));
        }
        if (options.smartRuler) {
            this.plugins.push(new SmartRulerPlugin(session));
        }
        if (options.highlight) {
            this.plugins.push(new HighlightPlugin(session));
        }
        if (options.pointer) {
            this.plugins.push(new PointerPlugin(session));
        }
        // this.plugins.push(new ResizeIconsPlugin(session));
        this.scope = new EffectScope();
        this.scope.run(() => {
            this.state = reactive({
                updates: 0
            });
            watch([layers, platform], () => {
                this.redraw();
            });
            watch([scale, display], () => {
                this.resize();
                this.redraw();
            });
        });
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.canvasContext = canvas.getContext('2d', {
            willReadFrequently: true,
            alpha: true
        });
        if (this.plugins.length) {
            this.pluginLayer = document.createElement('canvas');
            this.pluginLayerContext = this.pluginLayer.getContext('2d', {
                willReadFrequently: true,
                alpha: true
            });
            this.canvas.parentElement.prepend(this.pluginLayer);
            Object.assign(this.pluginLayer.style, {
                pointerEvents: 'none',
                position: 'absolute',
                zIndex: 1
            });
        }
        this.resize();
        this.redraw();
    }

    updateMousePosition(position: Point) {
        if (this.pluginLayer) {
            requestAnimationFrame(() => {
                this.pluginLayerContext.clearRect(0, 0, this.pluginLayer.width, this.pluginLayer.height);
                this.plugins.forEach((plugin) => plugin.update(this.pluginLayerContext, position));
            });
        }
    }

    getLayersInPoint(position: Point): AbstractLayer[] {
        const point = position.clone().divide(this.session.state.scale).round();
        return this.session.state.layers.filter((layer) => layer.contains(point)).sort((a, b) => b.index - a.index);
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
        if (this.pluginLayer) {
            this.pluginLayer.width = size.x * scale.x;
            this.pluginLayer.height = size.y * scale.y;
        }
        layers.forEach((layer: AbstractLayer) => {
            layer.resize(display, scale);
            layer.draw();
        });
    }

    public redraw() {
        if (!this.canvas) return;
        this.clear();
        this.session.state.layers.forEach((layer) => {
            this.ctx.drawImage(layer.getBuffer(), 0, 0);
        });
        this.state.updates++;
        // create data without alpha channel
        const data = this.ctx.getImageData(0, 0, this.screen.width, this.screen.height).data.map((v, i) => {
            if (i % 4 === 3) return v >= 255 / 2 ? 255 : 0;
            return v;
        });
        this.canvasContext.putImageData(
            new ImageData(new Uint8ClampedArray(data), this.screen.width, this.screen.height),
            0,
            0
        );
        if (this.pluginLayer) {
            requestAnimationFrame(() => {
                this.pluginLayerContext.clearRect(0, 0, this.pluginLayer.width, this.pluginLayer.height);
                this.plugins.forEach((plugin) => plugin.update(this.pluginLayerContext, null));
            });
        }
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
