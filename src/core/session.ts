import {generateUID} from '../utils';
import {reactive, UnwrapRef} from 'vue';
import {Layer} from './layer';
import {Platform} from 'src/platforms/platform';
import {Point} from './point';
import {Tool} from '../draw/tools/tool';
import {VirtualScreen} from '../draw/virtual-screen';
import {FlipperPlatform} from '../platforms/flipper';
import {PaintTool} from '../draw/tools/paint';
import {BoxTool} from '../draw/tools/box';
import {FrameTool} from '../draw/tools/frame';
import {CircleTool} from '../draw/tools/circle';
import {DiscTool} from '../draw/tools/disc';
import {LineTool} from '../draw/tools/line';
import {DotTool} from '../draw/tools/dot';
import {TextTool} from '../draw/tools/text';
import {SelectTool} from '../draw/tools/select';

const sessions = new Map<string, UnwrapRef<Session>>();
let currentSessionId = null;

export class Session {
    id: string = generateUID();
    layers: Layer[] = [];
    platform: Platform = new FlipperPlatform();
    display: Point = new Point(32, 32); //new Point(128, 64);
    displays: Point[] = [
        new Point(8, 8),
        new Point(12, 8),
        new Point(32, 8),
        new Point(48, 64),
        new Point(64, 8),
        new Point(60, 32),
        new Point(64, 32),
        new Point(64, 48),
        new Point(64, 128),
        new Point(72, 40),
        new Point(84, 48),
        new Point(96, 16),
        new Point(96, 32),
        new Point(96, 39),
        new Point(96, 40),
        new Point(96, 65),
        new Point(96, 68),
        new Point(96, 96),
        new Point(100, 64),
        new Point(102, 64),
        new Point(122, 32),
        new Point(128, 32),
        new Point(128, 36),
        new Point(128, 64),
        new Point(128, 80),
        new Point(128, 96),
        new Point(128, 128),
        new Point(128, 160),
        new Point(144, 168),
        new Point(150, 32),
        new Point(160, 16),
        new Point(160, 32),
        new Point(160, 80),
        new Point(160, 132),
        new Point(160, 160),
        new Point(172, 72),
        new Point(192, 32),
        new Point(192, 64),
        new Point(192, 96),
        new Point(200, 200),
        new Point(206, 36),
        new Point(240, 64),
        new Point(240, 128),
        new Point(240, 160),
        new Point(256, 128),
        new Point(256, 32),
        new Point(256, 64),
        new Point(296, 128),
        new Point(320, 200),
        new Point(320, 240),
        new Point(400, 240)
    ];
    // size of pixel
    scale: Point = new Point(20, 20);
    activeTool: Tool = null;
    activeLayer: Layer = null;
    virtualScreen: VirtualScreen = new VirtualScreen(this);
    tools: {[key: string]: Tool} = {};
    removeLayer = (layer: Layer) => {
        const index = this.layers.indexOf(layer);
        if (index > -1) {
            this.layers.splice(index, 1);
        }
    };
    setActiveLayer = (layer: Layer) => {
        this.activeLayer = layer;
    };
    setActiveTool = (tool: Tool) => {
        this.activeTool = tool;
    };
    setDisplay = (display: Point) => {
        this.display = display;
        this.virtualScreen.resize();
        this.virtualScreen.redraw();
    };
    constructor() {
        this.tools.paint = new PaintTool(this);
        this.tools.box = new BoxTool(this);
        this.tools.frame = new FrameTool(this);
        this.tools.circle = new CircleTool(this);
        this.tools.disc = new DiscTool(this);
        this.tools.line = new LineTool(this);
        this.tools.dot = new DotTool(this);
        this.tools.string = new TextTool(this);
        this.tools.select = new SelectTool(this);
    }
}

export function useSession(id?: string) {
    if (currentSessionId) {
        return sessions.get(currentSessionId);
    } else {
        const session = new Session();
        session.activeTool = session.tools.circle;
        sessions.set(session.id, reactive(session));
        currentSessionId = session.id;
        return session;
    }
}
