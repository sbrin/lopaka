import { UnwrapRef, reactive } from 'vue';
import { Keys } from '../core/keys.enum';
import { AbstractLayer } from '../core/layers/abstract.layer';
import { Point } from '../core/point';
import { Session } from '../core/session';
import { Font } from '../draw/fonts/font';
import { AbstractEditorPlugin } from './plugins/abstract-editor.plugin';
import { AddPlugin } from './plugins/add.plugin';
import { CopyPlugin } from './plugins/copy.plugin';
import { ClonePlugin } from './plugins/clone.plugin';
import { DeletePlugin } from './plugins/delete.plugin';
import { ImageDropPlugin } from './plugins/image-drop.plugin';
import { MovePlugin } from './plugins/move.plugin';
import { PaintPlugin } from './plugins/paint.plugin';
import { ResizePlugin } from './plugins/resize.plugin';
import { SelectPlugin } from './plugins/select.plugin';
import { AbstractTool } from './tools/abstract.tool';
import { CircleTool } from './tools/circle.tool';
import { EllipseTool } from './tools/ellipse.tool';
import { LineTool } from './tools/line.tool';
import { PaintTool } from './tools/paint.tool';
import { ImageTool } from './tools/image.tool';
import { RectTool } from './tools/rect.tool';
import { TriangleTool } from './tools/triangle.tool';
import { TextTool } from './tools/text.tool';
import { TextAreaTool } from './tools/text-area.tool';
import { ButtonTool } from './tools/button.tool';
import { PanelTool } from './tools/panel.tool';
import { SwitchTool } from './tools/switch.tool';
import { SliderTool } from './tools/slider.tool';
import { CheckboxTool } from './tools/checkbox.tool';
import { HistoryPlugin } from './plugins/history.plugin';
import { GroupPlugin } from './plugins/group.plugin';
import { ZoomPlugin } from './plugins/zoom.plugin';

type TEditorState = {
    activeLayer: AbstractLayer;
    activeTool: AbstractTool;
    textEditMode: number;
    shiftPressed: boolean;
};

export class Editor {
    plugins: AbstractEditorPlugin[] = [];
    container: HTMLElement;
    scrollContainer: HTMLElement | null = null;
    // default font
    font: Font;
    lastFontName: string;
    lastColor: string;
    layer: AbstractLayer;

    mouseDownCaptured: boolean = false;

    state: UnwrapRef<TEditorState> = reactive({
        activeLayer: null,
        activeTool: null,
        textEditMode: 0,
        shiftPressed: false,
    });

    constructor(public session: Session) { }

    tools: { [key: string]: AbstractTool } = {
        image: new ImageTool(this),
        paint: new PaintTool(this),
        string: new TextTool(this),
        textarea: new TextAreaTool(this),
        rect: new RectTool(this),
        panel: new PanelTool(this),
        circle: new CircleTool(this),
        ellipse: new EllipseTool(this),
        line: new LineTool(this),
        triangle: new TriangleTool(this),
        button: new ButtonTool(this),
        switch: new SwitchTool(this),
        slider: new SliderTool(this),
        checkbox: new CheckboxTool(this),
    };

    getSupportedTools(platform: string): { [key: string]: AbstractTool } {
        return Object.values(this.tools)
            .filter((tool) => tool.isSupported(platform))
            .reduce((acc, tool) => {
                acc[tool.getName()] = tool;
                return acc;
            }, {});
    }

    setContainer(container: HTMLElement) {
        this.container = container;
        this.scrollContainer = container.closest('.fui-editor__canvas');
        this.plugins = [
            new PaintPlugin(this.session, this.container),
            new AddPlugin(this.session, this.container),
            new ResizePlugin(this.session, this.container),
            new SelectPlugin(this.session, this.container),
            new ClonePlugin(this.session, this.container),
            new MovePlugin(this.session, this.container),
            new CopyPlugin(this.session, this.container),
            new HistoryPlugin(this.session, this.container),
            new DeletePlugin(this.session, this.container),
            new ImageDropPlugin(this.session, this.container),
            new GroupPlugin(this.session, this.container),
            new ZoomPlugin(this.session, this.container),
        ];
        if (this.scrollContainer) {
            this.scrollContainer.addEventListener('wheel', this.onWheel, { passive: false });
        }
    }

    destroy() {
        if (this.scrollContainer) {
            this.scrollContainer.removeEventListener('wheel', this.onWheel);
        }
    }

    selectionUpdate(): void {
        this.session.state.selectionUpdates++;
    }

    triggerTextEdit(): void {
        this.state.textEditMode++;
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

    handleEvent = (event: MouseEvent | KeyboardEvent | DragEvent | TouchEvent) => {
        const { virtualScreen, state } = this.session;
        const { scale } = state;
        if (event instanceof KeyboardEvent) {
            // Keep modifier state in sync for draw plugins that depend on Shift mode.
            const nextShiftPressed = event.code === Keys.Shift ? event.type === 'keydown' : event.shiftKey;
            // Redraw plugin overlays only when Shift state actually changes.
            if (this.state.shiftPressed !== nextShiftPressed) {
                this.state.shiftPressed = nextShiftPressed;
                virtualScreen.redrawPlugins();
            }
            if (
                ((event.ctrlKey || event.metaKey) && [Keys.KeyZ, Keys.KeyY].includes(event.code as Keys)) ||
                (this.state.activeTool && event.code === Keys.Escape) ||
                (event.target === document.body && Object.values(Keys).indexOf(event.code as Keys) != -1)
            ) {
                event.preventDefault();
                // Dispatch keyboard shortcuts only on keydown events.
                if (event.type === 'keydown') {
                    this.onKeyDown(Keys[event.code], event);
                }
            }
        } else if (event instanceof DragEvent) {
            this.onDrop(new Point(event.offsetX, event.offsetY).divide(scale).round(), event);
        } else {
            let offsetX;
            let offsetY;
            if ((event as TouchEvent).touches !== undefined) {
                const touch = (event as TouchEvent).touches[0] || (event as TouchEvent).changedTouches[0];
                const rect = this.container.getBoundingClientRect();
                offsetX = touch.clientX - rect.left;
                offsetY = touch.clientY - rect.top;
            } else {
                offsetX = (event as MouseEvent).offsetX;
                offsetY = (event as MouseEvent).offsetY;
            }
            const screenPoint = new Point(offsetX, offsetY).clone();
            const point = screenPoint.clone().divide(scale).floor(); //.boundTo(new Rect(new Point(), display));
            let alienEvent: boolean = false;

            switch (event.type) {
                case 'click':
                    this.onMouseClick(point, event);
                    break;
                case 'mousedown':
                case 'touchstart':
                    this.mouseDownCaptured = true;
                    this.onMouseDown(point, event);
                    break;
                case 'mousemove':
                case 'touchmove':
                    this.onMouseMove(point, event);
                    break;
                case 'mouseup':
                case 'touchend':
                case 'touchcancel':
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
                    this.onMouseDoubleClick(point, event as MouseEvent);
                    break;
            }
            if (!alienEvent) {
                virtualScreen.updateMousePosition(screenPoint, event);
            }
        }
    };

    private onMouseClick(point: Point, event: MouseEvent | TouchEvent): void {
        for (let plugin of this.plugins) {
            plugin.onMouseClick(point, event);
            if (plugin.captured) {
                break;
            }
        }
    }
    private onMouseDown(point: Point, event: MouseEvent | TouchEvent): void {
        (document.activeElement as HTMLElement).blur();
        for (let plugin of this.plugins) {
            plugin.onMouseDown(point, event);
            if (plugin.captured) {
                break;
            }
        }
    }
    private onMouseMove(point: Point, event: MouseEvent | TouchEvent): void {
        for (let plugin of this.plugins) {
            plugin.onMouseMove(point, event);
            if (plugin.captured) {
                break;
            }
        }
    }
    private onMouseUp(point: Point, event: MouseEvent | TouchEvent): void {
        for (let plugin of this.plugins) {
            plugin.onMouseUp(point, event);
            if (plugin.captured) {
                break;
            }
        }
    }
    private onMouseLeave(point: Point, event: MouseEvent | TouchEvent): void {
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

    private onWheel = (event: WheelEvent): void => {
        this.plugins.forEach((plugin) => plugin.onWheel(event));
    }
}
