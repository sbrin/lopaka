import {Platform} from 'src/platforms/platform';
import {reactive} from 'vue';
import {VirtualScreen} from '../draw/virtual-screen';
import {Editor} from '../editor/editor';
import {AdafruitPlatform} from '../platforms/adafruit';
import {FlipperPlatform} from '../platforms/flipper';
import {U8g2Platform} from '../platforms/u8g2';
import {Uint32RawPlatform} from '../platforms/uint32-raw';
import {generateUID} from '../utils';
import {ChangeHistory, useHistory} from './history';
import {AbstractLayer} from './layers/abstract.layer';
import {Point} from './point';
import {AbstractProvider} from './prviders/abstract.provider';
import {LocalProvider} from './prviders/local.provider';

type TSessionState = {
    platform: string;
    display: Point;
    layers: AbstractLayer[];
    scale: Point;
    lock: boolean;
    customImages: TLayerImageData[];
    codePreview: string;
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
        scale: new Point(4, 4),
        customImages: [],
        codePreview: ''
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
    setDisplay = (display: Point, isLogged?: boolean) => {
        this.state.display = display;
        this.virtualScreen.resize();
        this.virtualScreen.redraw();
    };
    setScale = (scale, isLogged?: boolean) => {
        this.state.scale = new Point(scale / 100, scale / 100);
    };
    setPlatform = async (name: string, isLogged?: boolean): Promise<void> => {
        if (this.state.layers.length) {
            this.provider.saveProject();
            this.state.layers = [];
        }
        this.state.platform = name;
        this.provider.loadProject();
    };
    save = () => {
        this.provider.saveProject();
    };
    lock = () => {
        this.state.lock = true;
    };
    unlock = () => {
        this.state.lock = false;
    };
    private provider: AbstractProvider;
    constructor(private providerClass: {new (session: Session): AbstractProvider}) {
        this.provider = new providerClass(this);
        this.setPlatform(this.provider.getLastPlatform());
    }
}

export function saveLayers() {
    const session = useSession();
    session.save();
}

let session: Session;

export function useSession() {
    if (session) {
        return session;
    } else {
        session = new Session(LocalProvider);
        return session;
    }
}
