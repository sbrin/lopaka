import {UnwrapRef, reactive} from 'vue';
import {Keys} from '../core/keys.enum';
import {AbstractLayer} from '../core/layers/abstract.layer';
import {Point} from '../core/point';
import {Session} from '../core/session';
import {Font} from '../draw/fonts/font';
import {AbstractEditorPlugin} from './plugins/abstract-editor.plugin';
import {AddPlugin} from './plugins/add.plugin';
import {CopyPlugin} from './plugins/copy.plugin';
import {DeletePlugin} from './plugins/delete.plugin';
import {ImageDropPlugin} from './plugins/image-drop.plugin';
import {MovePlugin} from './plugins/move.plugin';
import {PaintPlugin} from './plugins/paint.plugin';
import {ResizePlugin} from './plugins/resize.plugin';
import {SavePlugin} from './plugins/save.plugin';
import {SelectPlugin} from './plugins/select.plugin';
import {AbstractTool} from './tools/abstract.tool';
import {CircleTool} from './tools/circle.tool';
import {DotTool} from './tools/dot.tool';
import {EllipseTool} from './tools/ellipse.tool';
import {LineTool} from './tools/line.tool';
import {PaintTool} from './tools/paint.tool';
import {RectTool} from './tools/rect.tool';
import {TextTool} from './tools/text.tool';
import {HistoryPlugin} from './plugins/history.plugin';

type TEditorState = {
    activeLayer: AbstractLayer;
    activeTool: AbstractTool;
    selectionUpdates: number;
};

export class Editor {
    plugins: AbstractEditorPlugin[] = [];
    container: HTMLElement;
    // default font
    font: Font;

    layer: AbstractLayer;

    mouseDownCaptured: boolean = false;

    state: UnwrapRef<TEditorState> = reactive({
        activeLayer: null,
        activeTool: null,
        selectionUpdates: 1
    });

    constructor(public session: Session) {}

    tools: {[key: string]: AbstractTool} = {
        paint: new PaintTool(this),
        string: new TextTool(this),
        rect: new RectTool(this),
        circle: new CircleTool(this),
        ellipse: new EllipseTool(this),
        line: new LineTool(this),
        dot: new DotTool(this)
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
                new ResizePlugin(this.session, this.container),
                new SelectPlugin(this.session, this.container),
                new MovePlugin(this.session, this.container),
                new CopyPlugin(this.session, this.container),
                new HistoryPlugin(this.session, this.container),
                new DeletePlugin(this.session, this.container),
                new SavePlugin(this.session, this.container),
                new ImageDropPlugin(this.session, this.container)
            ]
        );
    }

    selectionUpdate(): void {
        this.state.selectionUpdates++;
    }

    clear(): void {
        this.plugins.forEach((p: AbstractEditorPlugin) => p.onClear());
        this.state.activeTool = null;
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
            if (this.session.state.isPublic) {
                return;
            }
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
            let alienEvent: boolean = false;
            switch (event.type) {
                case 'click':
                    this.onMouseClick(point, event);
                    break;
                case 'mousedown':
                    this.mouseDownCaptured = true;
                    this.onMouseDown(point, event);
                    break;
                case 'mousemove':
                    !this.session.state.isPublic && this.onMouseMove(point, event);
                    break;
                case 'mouseup':
                    if (this.mouseDownCaptured) {
                        this.onMouseUp(point, event);
                        this.mouseDownCaptured = false;
                    } else {
                        alienEvent = true;
                    }
                    break;
                case 'mouseleave':
                    this.onMouseLeave(point, event);
                    break;
                case 'dblclick':
                    this.onMouseDoubleClick(point, event);
                    break;
            }
            if (!alienEvent) {
                virtualScreen.updateMousePosition(screenPoint, event);
            }
        }
    };

    private onMouseClick(point: Point, event: MouseEvent): void {
        for (let plugin of this.plugins) {
            plugin.onMouseClick(point, event);
            if (plugin.captured) {
                break;
            }
        }
    }
    private onMouseDown(point: Point, event: MouseEvent): void {
        (document.activeElement as HTMLElement).blur();
        for (let plugin of this.plugins) {
            plugin.onMouseDown(point, event);
            if (plugin.captured) {
                break;
            }
        }
    }
    private onMouseMove(point: Point, event: MouseEvent): void {
        for (let plugin of this.plugins) {
            plugin.onMouseMove(point, event);
            if (plugin.captured) {
                break;
            }
        }
    }
    private onMouseUp(point: Point, event: MouseEvent): void {
        for (let plugin of this.plugins) {
            plugin.onMouseUp(point, event);
            if (plugin.captured) {
                break;
            }
        }
    }
    private onMouseLeave(point: Point, event: MouseEvent): void {
        for (let plugin of this.plugins) {
            plugin.onMouseLeave(point, event);
            if (plugin.captured) {
                break;
            }
        }
    }
    private onMouseDoubleClick(point: Point, event: MouseEvent): void {
        for (let plugin of this.plugins) {
            plugin.onMouseDoubleClick(point, event);
            if (plugin.captured) {
                break;
            }
        }
    }
    private onKeyDown(key: Keys, event: KeyboardEvent): void {
        this.plugins.forEach((plugin) => plugin.onKeyDown(key, event));
    }
    private onDrop(point: Point, event: DragEvent): void {
        this.plugins.forEach((plugin) => plugin.onDrop(point, event));
    }
}
