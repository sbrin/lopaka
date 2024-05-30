import {TPlatformFeatures} from 'src/platforms/platform';
import {UnwrapRef, reactive} from 'vue';
import {getFont} from '../draw/fonts';
import {VirtualScreen} from '../draw/virtual-screen';
import {Editor} from '../editor/editor';
import {U8g2Platform} from '../platforms/u8g2';
import {generateUID, loadImageDataAsync, logEvent} from '../utils';
import {paramsToState} from './decorators/mapping';
import displays from './displays';
import {ChangeHistory, TChange, THistoryEvent, useHistory} from './history';
import {LayersManager} from './layers-manager';
import {AbstractLayer} from './layers/abstract.layer';
import platforms from './platforms';
import {Point} from './point';

const sessions = new Map<string, UnwrapRef<Session>>();
let currentSessionId = null;

export type TSessionState = {
    platform: string;
    display: Point;
    isDisplayCustom: boolean;
    // layers: AbstractLayer[];
    updates: number; // debounce updates
    immidiateUpdates: number; // for immediate updates
    selectionUpdates: number;
    scale: Point;
    lock: boolean;
    customImages: TLayerImageData[];
    isPublic: boolean;
};

export class Session {
    id: string = generateUID();
    displays = displays;
    platforms = platforms;

    state: TSessionState = reactive({
        lock: false,
        platform: null,
        display: new Point(128, 64),
        isDisplayCustom: false,
        customDisplay: new Point(128, 64),
        // layers: [],
        updates: 1,
        immidiateUpdates: 1,
        selectionUpdates: 1,
        scale: new Point(4, 4),
        customImages: [],
        isPublic: false
    });

    history: ChangeHistory = useHistory();
    layersManager: LayersManager = new LayersManager(this);

    editor: Editor = new Editor(this);

    virtualScreen: VirtualScreen = new VirtualScreen(this, {
        ruler: true,
        smartRuler: true,
        highlight: true,
        pointer: false
    });
    removeLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        this.layersManager.removeLayer(layer);
        if (saveHistory) {
            this.history.push({
                type: 'remove',
                layer,
                state: layer.state
            });
        }
        this.virtualScreen.redraw();
    };
    mergeLayers = (layers: AbstractLayer[]) => {
        const layer = this.layersManager.mergeLayers(layers);
        this.history.push({
            type: 'merge',
            layer,
            state: layers
        });
        this.virtualScreen.redraw();
    };
    addLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        this.layersManager.add(layer);
        if (saveHistory) {
            this.history.push({
                type: 'add',
                layer,
                state: layer.state
            });
        }
    };
    clearLayers = () => {
        this.layersManager.clearLayers();
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
            this.virtualScreen.redraw();
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
        const states = JSON.parse(localStorage.getItem(`${name}_lopaka_layers`)) ?? [];
        await this.layersManager.loadLayers(states);
        this.editor.font = getFont(fonts[0].name);
        this.virtualScreen.redraw();
        this.unlock();
        isLogged && logEvent('select_library', name);
    };

    setIsPublic = (enabled: boolean) => {
        this.state.isPublic = enabled;
    };

    generateCode = (): TSourceCode => {
        const {platform} = this.state;
        const code = this.platforms[platform].generateSourceCode(
            this.layersManager.sorted.filter(
                (layer) => !layer.modifiers.overlay || !layer.modifiers.overlay.getValue()
            ),
            this.virtualScreen.ctx
        );
        return this.platforms[platform].sourceMapParser.parse(code);
    };

    importCode = async (code: string) => {
        this.clearLayers();
        const {platform} = this.state;
        const states = this.platforms[platform].importSourceCode(code);
        for (const state of states) {
            if (state.type == 'string') {
                if (!this.platforms[platform].getFonts().find((f) => f.name == state.font)) {
                    state.font = this.platforms[platform].getFonts()[0].name;
                }
            }
            if (state.type == 'icon' && state.iconSrc) {
                await loadImageDataAsync(state.iconSrc).then((imgData) => {
                    state.data = imgData;
                    state.size = new Point(imgData.width, imgData.height);
                });
                delete state.iconSrc;
            }
        }
        await this.layersManager.loadLayers(
            states.map((state) => paramsToState(state, this.layersManager.LayerClassMap))
        );
    };

    getPlatformFeatures(): TPlatformFeatures {
        return this.platforms[this.state.platform]?.features;
    }
    lock = () => {
        this.state.lock = true;
    };
    unlock = () => {
        this.state.lock = false;
    };
    constructor() {
        this.history.subscribe((event: THistoryEvent, change: TChange) => {
            this.layersManager.undoChange(event, change);
            this.virtualScreen.redraw();
        });
    }
}

export async function loadLayers(states: any[]) {
    const session = useSession();
    await session.layersManager.loadLayers(states);
    session.virtualScreen.redraw();
}

export function useSession(id?: string) {
    if (currentSessionId) {
        return sessions.get(currentSessionId);
    } else {
        const session = new Session();
        if (window.top === window.self) {
            const platformLocal = localStorage.getItem('lopaka_library');
            session.setPlatform(platformLocal ?? U8g2Platform.id);
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
