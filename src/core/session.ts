import {Platform, TPlatformFeatures} from 'src/platforms/platform';
import {UnwrapRef, reactive} from 'vue';
import {getFont, loadFont} from '../draw/fonts';
import {VirtualScreen} from '../draw/virtual-screen';
import {Editor} from '../editor/editor';
import {AdafruitPlatform} from '../platforms/adafruit';
import {AdafruitMonochromePlatform} from '../platforms/adafruit_mono';
import {FlipperPlatform} from '../platforms/flipper';
import {U8g2Platform} from '../platforms/u8g2';
import {Uint32RawPlatform} from '../platforms/uint32-raw';
import {generateUID, logEvent, postParentMessage} from '../utils';
import {ChangeHistory, useHistory} from './history';
import {AbstractLayer} from './layers/abstract.layer';
import {CircleLayer} from './layers/circle.layer';
import {DotLayer} from './layers/dot.layer';
import {EllipseLayer} from './layers/ellipse.layer';
import {IconLayer} from './layers/icon.layer';
import {LineLayer} from './layers/line.layer';
import {PaintLayer} from './layers/paint.layer';
import {RectangleLayer} from './layers/rectangle.layer';
import {TextLayer} from './layers/text.layer';
import {Point} from './point';

const sessions = new Map<string, UnwrapRef<Session>>();
let currentSessionId = null;

type TSessionState = {
    platform: string;
    display: Point;
    isDisplayCustom: boolean;
    layers: AbstractLayer[];
    scale: Point;
    lock: boolean;
    customImages: TLayerImageData[];
};

export class Session {
    id: string = generateUID();
    platforms: {[key: string]: Platform} = {
        [U8g2Platform.id]: new U8g2Platform(),
        [AdafruitPlatform.id]: new AdafruitPlatform(),
        [AdafruitMonochromePlatform.id]: new AdafruitMonochromePlatform(),
        [Uint32RawPlatform.id]: new Uint32RawPlatform(),
        [FlipperPlatform.id]: new FlipperPlatform()
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
        new Point(250, 122),
        new Point(256, 128),
        new Point(256, 32),
        new Point(256, 64),
        new Point(280, 240),
        new Point(296, 128),
        new Point(320, 200),
        new Point(320, 240),
        new Point(400, 240)
    ];

    state: TSessionState = reactive({
        lock: false,
        platform: null,
        display: new Point(128, 64),
        isDisplayCustom: false,
        customDisplay: new Point(128, 64),
        layers: [],
        scale: new Point(4, 4),
        customImages: []
    });

    history: ChangeHistory = useHistory();

    editor: Editor = new Editor(this);

    virtualScreen: VirtualScreen = new VirtualScreen(this, {
        ruler: true,
        smartRuler: true,
        highlight: true,
        pointer: false
    });
    removeLayer = (layer: AbstractLayer) => {
        this.state.layers = this.state.layers.filter((l) => l !== layer);
        this.history.push({
            type: 'remove',
            layer,
            state: layer.getState()
        });
        this.virtualScreen.redraw();
    };
    addLayer = (layer: AbstractLayer) => {
        const {display, scale, layers} = this.state;
        layer.resize(display, scale);
        layer.index = layer.index ?? layers.length + 1;
        layer.name = layer.name ?? 'Layer ' + (layers.length + 1);
        layers.unshift(layer);
        this.history.push({
            type: 'add',
            layer,
            state: layer.getState()
        });
        layer.draw();
    };
    clearLayers = () => {
        this.state.layers = [];
        this.history.push({
            type: 'clear',
            layer: null,
            state: []
        });
        this.virtualScreen.redraw();
    };
    setDisplay = (display: Point, isLogged?: boolean) => {
        this.state.display = display;
        this.virtualScreen.resize();
        requestAnimationFrame(() => {
            this.virtualScreen.redraw(false);
        });
        // TODO: update cloud and storage to avoid display conversion
        const displayString = `${display.x}×${display.y}`;
        if (window.top === window.self) {
            localStorage.setItem('lopaka_display', displayString);
        }
        isLogged && logEvent('select_display', displayString);
    };
    setDisplayCustom = (enabled: boolean) => {
        this.state.isDisplayCustom = enabled;
    };
    saveDisplayCustom = (enabled: boolean) => {
        this.setDisplayCustom(enabled);
        if (window.top === window.self) {
            localStorage.setItem('lopaka_display_custom', enabled ? 'true' : 'false');
        }
    };
    setScale = (scale, isLogged?: boolean) => {
        this.state.scale = new Point(scale / 100, scale / 100);
        localStorage.setItem('lopaka_scale', `${scale}`);
        isLogged && logEvent('select_scale', scale);
    };
    setPlatform = async (name: string, isLogged?: boolean): Promise<void> => {
        this.state.platform = name;
        const fonts = this.platforms[name].getFonts();
        this.lock();
        this.editor.clear();
        // preload default font
        return Promise.all(fonts.map((font) => loadFont(font))).then(() => {
            this.editor.font = getFont(fonts[0].name);
            this.unlock();
            if (window.top === window.self) {
                loadLayers(
                    localStorage.getItem(`${name}_lopaka_layers`)
                        ? JSON.parse(localStorage.getItem(`${name}_lopaka_layers`))
                        : []
                );
                localStorage.setItem('lopaka_library', name);
            }
            this.virtualScreen.redraw(false);
            isLogged && logEvent('select_library', name);
        });
    };
    generateCode = () => {
        const {platform, layers} = this.state;
        const sourceCode = this.platforms[platform].generateSourceCode(
            layers.filter((layer) => !layer.modifiers.overlay || !layer.modifiers.overlay.getValue()),
            this.virtualScreen.ctx
        );
        return sourceCode.declarations.reverse().join('\n') + '\n' + sourceCode.code.reverse().join('\n');
    };
    getPlatformFeatures(): TPlatformFeatures {
        return this.platforms[this.state.platform].features;
    }
    lock = () => {
        this.state.lock = true;
    };
    unlock = () => {
        this.state.lock = false;
    };
    constructor() {}
}
export const LayerClassMap: {[key in ELayerType]: any} = {
    box: RectangleLayer,
    frame: RectangleLayer,
    rect: RectangleLayer,
    circle: CircleLayer,
    disc: CircleLayer,
    dot: DotLayer,
    icon: IconLayer,
    line: LineLayer,
    string: TextLayer,
    paint: PaintLayer,
    ellipse: EllipseLayer
};
// for testing
export function loadLayers(layers: any[]) {
    const session = useSession();
    session.state.layers = [];
    layers.forEach((l) => {
        const type: ELayerType = l.t;
        if (type in LayerClassMap) {
            const layer = new LayerClassMap[type](session.getPlatformFeatures());
            layer.loadState(l);
            session.addLayer(layer);
            layer.saveState();
        }
    });
    session.virtualScreen.redraw(false);
}

export function saveLayers() {
    const session = useSession();
    const packedSession = JSON.stringify(session.state.layers.map((l) => l.getState()));
    if (window.top !== window.self) {
        postParentMessage('updateLayers', packedSession);
        postParentMessage('updateThumbnail', session.virtualScreen.canvas.toDataURL());
    } else {
        localStorage.setItem(`${session.state.platform}_lopaka_layers`, packedSession);
    }
    console.log('Saved session size', packedSession.length, 'bytes');
}
// for testing
window['saveLayers'] = saveLayers;

export function useSession(id?: string) {
    if (currentSessionId) {
        return sessions.get(currentSessionId);
    } else {
        const session = new Session();
        if (window.top === window.self) {
            const platformLocal = localStorage.getItem('lopaka_library');
            session.setPlatform(platformLocal ?? U8g2Platform.id);
        } else {
            session.setPlatform(U8g2Platform.id);
        }
        session.setDisplayCustom(localStorage.getItem('lopaka_display_custom') === 'true');
        const displayStored = localStorage.getItem('lopaka_display');
        if (displayStored) {
            const displayStoredArr = displayStored.split('×').map((n) => parseInt(n));
            session.setDisplay(new Point(displayStoredArr[0], displayStoredArr[1]));
        }
        const scaleLocal = JSON.parse(localStorage.getItem('lopaka_scale'));
        session.setScale(scaleLocal ?? 400);
        sessions.set(session.id, session);
        currentSessionId = session.id;
        return session;
    }
}
