import {generateUID, logEvent} from '../utils';
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
import {U8g2Platform} from '../platforms/u8g2';
import {AdafruitPlatform} from '../platforms/adafruit';
import {Uint32RawPlatform} from '../platforms/uint32-raw';
import {IconTool} from '../draw/tools/icon';
import {loadFont} from '../draw/fonts';

const sessions = new Map<string, UnwrapRef<Session>>();
let currentSessionId = null;

type TSessionState = {
    platform: string;
    display: Point;
    layers: Layer[];
    activeLayer: Layer | null;
    activeTool: Tool | null;
    scale: Point;
    lock: boolean;
    customImages: TLayerImageData[];
};

export class Session {
    id: string = generateUID();
    platforms: {[key: string]: Platform} = {
        [FlipperPlatform.id]: new FlipperPlatform(),
        [U8g2Platform.id]: new U8g2Platform(),
        [AdafruitPlatform.id]: new AdafruitPlatform(),
        [Uint32RawPlatform.id]: new Uint32RawPlatform()
    };
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
        new Point(240, 240),
        new Point(256, 128),
        new Point(256, 32),
        new Point(256, 64),
        new Point(296, 128),
        new Point(320, 200),
        new Point(320, 240),
        new Point(400, 240)
    ];

    state: TSessionState = reactive({
        lock: false,
        platform: null,
        display: new Point(128, 64),
        layers: [],
        activeLayer: null,
        activeTool: null,
        scale: new Point(4, 4),
        customImages: [],
    });

    virtualScreen: VirtualScreen = new VirtualScreen(this, {
        ruler: true,
        smartRuler: true,
        highlight: true,
        pointer: false
    });
    tools: {[key: string]: Tool} = {
        select: new SelectTool(this),
        paint: new PaintTool(this),
        frame: new FrameTool(this),
        box: new BoxTool(this),
        line: new LineTool(this),
        dot: new DotTool(this),
        circle: new CircleTool(this),
        disc: new DiscTool(this),
        string: new TextTool(this),
        icon: new IconTool(this)
    };
    removeLayer = (layer: Layer) => {
        if (this.state.activeLayer === layer) {
            this.state.activeLayer = null;
        }
        this.state.layers = this.state.layers.filter((l) => l !== layer);
    };
    setActiveLayer = (layer: Layer) => {
        this.state.activeLayer = layer;
    };
    setActiveTool = (tool: Tool) => {
        this.state.activeTool = tool;
    };
    setDisplay = (display: Point, isLogged?: boolean) => {
        this.state.display = display;
        this.virtualScreen.resize();
        this.virtualScreen.redraw();
        // TODO: update cloud and storage to avoid display conversion
        const displayString = `${display.x}×${display.y}`;
        localStorage.setItem("lopaka_display", displayString);
        isLogged && logEvent("select_display", displayString);
    };
    setPlatform = (name: string, isLogged?: boolean) => {
        this.state.platform = name;
        this.state.layers = [...this.state.layers];
        localStorage.setItem("lopaka_library", name);
        // preload default font
        const fonts = this.platforms[name].getFonts();
        if (fonts) {
            loadFont(fonts[0]);
        }
        isLogged && logEvent("select_library", name);
    };
    lock = () => {
        this.state.lock = true;
    };
    unlock = () => {
        this.state.lock = false;
    };
    constructor() {}
}

export function useSession(id?: string) {
    if (currentSessionId) {
        return sessions.get(currentSessionId);
    } else {
        const session = new Session();
        const platformLocal = localStorage.getItem("lopaka_library")
        session.setPlatform(platformLocal ?? U8g2Platform.id);
        let displayStored = localStorage.getItem("lopaka_display");
        if (displayStored) {
            const displayStoredArr = displayStored.split("×").map(n => parseInt(n));
            session.setDisplay(new Point(displayStoredArr[0], displayStoredArr[1]));
        }
        session.state.activeTool = session.tools.frame;
        sessions.set(session.id, session);
        currentSessionId = session.id;
        return session;
    }
}
