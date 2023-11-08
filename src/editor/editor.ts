import {Keys} from '../core/keys.enum';
import {Point} from '../core/point';
import {Rect} from '../core/rect';
import {Session} from '../core/session';
import {CopyPlugin} from './plugins/copy.plugin';
import {DeletePlugin} from './plugins/delete.plugin';
import {AbstractEditorPlugin} from './plugins/abstract-editor.plugin';
import {AddPlugin} from './plugins/add.plugin';
import {MovePlugin} from './plugins/move.plugin';
import {ResizePlugin} from './plugins/resize.plugin';
import {SelectPlugin} from './plugins/select.plugin';
import {AbstractTool} from './tools/abstract.tool';
import {BoxTool} from './tools/box.tool';
import {CircleTool} from './tools/circle.tool';
import {DiscTool} from './tools/disc.tool';
import {DotTool} from './tools/dot.tool';
import {FrameTool} from './tools/frame.tool';
import {IconTool} from './tools/icon.tool';
import {LineTool} from './tools/line.tool';
import {TextTool} from './tools/text.tool';
import {Font} from '../draw/fonts/font';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {UnwrapRef, reactive} from 'vue';
import {PaintTool} from './tools/paint.tool';
import {PaintPlugin} from './plugins/paint.plugin';
import {ImageDropPlugin} from './plugins/image-drop.plugin';

type TEditorState = {
    // creatingLayyer: boolean;
    // resizingLayer: boolean;
    // movingLayer: boolean;
    // selecting: boolean;
    activeLayer: AbstractLayer;
    activeTool: AbstractTool;
};

export class Editor {
    plugins: AbstractEditorPlugin[] = [];
    container: HTMLElement;
    // default font
    font: Font;

    layer: AbstractLayer;

    state: UnwrapRef<TEditorState> = reactive({
        activeLayer: null,
        activeTool: null
    });

    constructor(public session: Session) {}

    tools: {[key: string]: AbstractTool} = {
        // select: new SelectTool(this),
        paint: new PaintTool(this),
        frame: new FrameTool(this),
        box: new BoxTool(this),
        line: new LineTool(this),
        dot: new DotTool(this),
        circle: new CircleTool(this),
        disc: new DiscTool(this),
        string: new TextTool(this)
        // icon: new IconTool(this)
    };

    getSupportedTools(platform: string): {[key: string]: AbstractTool} {
        return Object.values(this.tools)
            .filter((tool) => tool.isSupported(platform))
            .reduce((acc, tool) => {
                acc[tool.getName()] = tool;
                return acc;
            }, {});
    }

    setContainer(container: HTMLElement) {
        this.container = container;
        this.plugins.push(
            ...[
                new PaintPlugin(this.session, this.container),
                new AddPlugin(this.session, this.container),
                new SelectPlugin(this.session, this.container),
                new ResizePlugin(this.session, this.container),
                new CopyPlugin(this.session, this.container),
                new MovePlugin(this.session, this.container),
                new DeletePlugin(this.session, this.container),
                new ImageDropPlugin(this.session, this.container)
            ]
        );
    }

    setTool(name: string) {
        if (this.state.activeTool) {
            this.state.activeTool.onDeactivate();
        }
        if (name) {
            this.state.activeTool = this.tools[name];
            this.state.activeTool.onActivate();
        } else {
            this.state.activeTool = null;
        }
    }

    handleEvent = (event: MouseEvent | KeyboardEvent | DragEvent) => {
        const {virtualScreen, state} = this.session;
        const {display, scale, layers} = state;
        if (event instanceof KeyboardEvent) {
            if (event.target === document.body && Object.values(Keys).indexOf(event.code as Keys) != -1) {
                event.preventDefault();
                this.onKeyDown(Keys[event.code], event);
            }
        }

        if (event instanceof DragEvent) {
            this.onDrop(new Point(event.offsetX, event.offsetY).divide(scale).round(), event);
        } else if (event instanceof MouseEvent) {
            const screenPoint = new Point(event.offsetX, event.offsetY).clone();
            const point = screenPoint.clone().divide(scale).floor(); //.boundTo(new Rect(new Point(), display));
            switch (event.type) {
                case 'click':
                    this.onMouseClick(point, event);
                    break;
                case 'mousedown':
                    this.onMouseDown(point, event);
                    break;
                case 'mousemove':
                    this.onMouseMove(point, event);
                    break;
                case 'mouseup':
                    this.onMouseUp(point, event);
                    break;
                case 'mouseleave':
                    this.onMouseLeave(point, event);
                    break;
                case 'dblclick':
                    this.onMouseDoubleClick(point, event);
                    break;
            }
            virtualScreen.updateMousePosition(screenPoint);
        }
    };

    private onMouseClick(point: Point, event: MouseEvent): void {
        this.plugins.forEach((plugin) => plugin.onMouseClick(point, event));
    }
    private onMouseDown(point: Point, event: MouseEvent): void {
        this.plugins.forEach((plugin) => plugin.onMouseDown(point, event));
    }
    private onMouseMove(point: Point, event: MouseEvent): void {
        this.plugins.forEach((plugin) => plugin.onMouseMove(point, event));
    }
    private onMouseUp(point: Point, event: MouseEvent): void {
        this.plugins.forEach((plugin) => plugin.onMouseUp(point, event));
    }
    private onMouseLeave(point: Point, event: MouseEvent): void {
        this.plugins.forEach((plugin) => plugin.onMouseLeave(point, event));
    }
    private onKeyDown(key: Keys, event: KeyboardEvent): void {
        this.plugins.forEach((plugin) => plugin.onKeyDown(key, event));
    }
    private onMouseDoubleClick(point: Point, event: MouseEvent): void {
        this.plugins.forEach((plugin) => plugin.onMouseDoubleClick(point, event));
    }
    private onDrop(point: Point, event: DragEvent): void {
        this.plugins.forEach((plugin) => plugin.onDrop(point, event));
    }
}
