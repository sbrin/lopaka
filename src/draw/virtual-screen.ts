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
        const {display, platform, scale} = toRefs(session.state);
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
        this.plugins.push(new ResizeIconsPlugin(session));
        this.scope = new EffectScope();
        this.scope.run(() => {
            this.state = reactive({
                updates: 0
            });
            watch([platform], () => {
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
            this.pluginLayerContext.imageSmoothingEnabled = true;
            this.canvas.parentElement.prepend(this.pluginLayer);
            Object.assign(this.pluginLayer.style, {
                pointerEvents: 'none',
                position: 'absolute',
                left: -DrawPlugin.offset.x + 'px',
                top: -DrawPlugin.offset.y + 'px',
                zIndex: 1
            });
        }
        this.resize();
        this.redraw();
    }

    updateMousePosition(position: Point) {
        if (this.pluginLayer) {
            requestAnimationFrame(() => {
                const ctx = this.pluginLayerContext;
                ctx.clearRect(0, 0, this.pluginLayer.width, this.pluginLayer.height);
                this.plugins.forEach((plugin) => {
                    ctx.save();
                    ctx.scale(2, 2);
                    ctx.translate(DrawPlugin.offset.x, DrawPlugin.offset.y);
                    plugin.update(ctx, position);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.restore();
                });
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
            this.pluginLayer.width = (size.x * scale.x + DrawPlugin.offset.x * 2) * 2;
            this.pluginLayer.height = (size.y * scale.y + DrawPlugin.offset.y * 2) * 2;
            Object.assign(this.pluginLayer.style, {
                width: `${size.x * scale.x + DrawPlugin.offset.x * 2}px`,
                height: `${size.y * scale.y + DrawPlugin.offset.y * 2}px`
            });
        }
        layers.forEach((layer: AbstractLayer) => {
            layer.resize(display, scale);
            layer.draw();
        });
    }

    public redraw() {
        if (!this.canvas) return;
        this.clear();
        const overlays = [];
        this.session.state.layers.forEach((layer) => {
            // skip all oberlays
            if (layer.modifiers.overlay && layer.modifiers.overlay.getValue()) {
                overlays.push(layer);
                return;
            }
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
        // draw overlays
        this.canvasContext.globalAlpha = 0.3;
        overlays.forEach((layer) => {
            this.canvasContext.drawImage(layer.getBuffer(), 0, 0);
        });
        this.canvasContext.globalAlpha = 1;
        if (this.pluginLayer) {
            requestAnimationFrame(() => {
                const ctx = this.pluginLayerContext;
                ctx.clearRect(0, 0, this.pluginLayer.width, this.pluginLayer.height);
                this.plugins.forEach((plugin) => {
                    ctx.save();
                    ctx.scale(2, 2);
                    ctx.translate(DrawPlugin.offset.x, DrawPlugin.offset.y);
                    plugin.update(ctx, null);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.restore();
                });
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
