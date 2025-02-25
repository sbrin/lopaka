import {TPlatformFeatures} from 'src/platforms/platform';
import {UnwrapRef, reactive} from 'vue';
import {getFont, loadFont} from '../draw/fonts';
import {VirtualScreen} from '../draw/virtual-screen';
import {Editor} from '../editor/editor';
import {U8g2Platform} from '../platforms/u8g2';
import {
    applyColor,
    generateUID,
    imageDataToImage,
    imageToImageData,
    loadImageDataAsync,
    logEvent,
    postParentMessage,
} from '../utils';
import displays, {Display} from './displays';
import {ChangeHistory, TChange, THistoryEvent, useHistory} from './history';
import {AbstractLayer} from './layers/abstract.layer';
import {CircleLayer} from './layers/circle.layer';
import {EllipseLayer} from './layers/ellipse.layer';
import {IconLayer} from './layers/icon.layer';
import {LineLayer} from './layers/line.layer';
import {PaintLayer} from './layers/paint.layer';
import {RectangleLayer} from './layers/rectangle.layer';
import {TextLayer} from './layers/text.layer';
import platforms from './platforms';
import {Point} from './point';
import {paramsToState} from './decorators/mapping';
import {iconsList} from '../icons/icons';

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
    isPublic: boolean;
    customFonts: TPlatformFont[];
    warnings: string[];
};

export class Session {
    LayerClassMap: {[key in ELayerType]: any} = {
        box: RectangleLayer,
        frame: RectangleLayer,
        rect: RectangleLayer,
        circle: CircleLayer,
        disc: CircleLayer,
        icon: IconLayer,
        line: LineLayer,
        string: TextLayer,
        paint: PaintLayer,
        ellipse: EllipseLayer,
    };

    id: string = generateUID();
    displays = displays;
    platforms = platforms;

    state: TSessionState = reactive({
        lock: false,
        platform: null,
        display: new Point(128, 64),
        isDisplayCustom: false,
        customDisplay: new Point(128, 64),
        layers: [],
        scale: new Point(4, 4),
        customImages: [],
        icons: iconsList,
        isPublic: false,
        customFonts: [],
        warnings: [],
    });

    history: ChangeHistory = useHistory();

    editor: Editor = new Editor(this);

    virtualScreen: VirtualScreen = new VirtualScreen(this, {
        ruler: true,
        smartRuler: true,
        highlight: true,
        pointer: false,
    });
    removeLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        this.state.layers = this.state.layers.filter((l) => l.uid !== layer.uid);
        if (saveHistory) {
            this.history.push({type: 'remove', layer, state: layer.state});
        }
        this.virtualScreen.redraw();
    };
    mergeLayers = (layers: AbstractLayer[]) => {
        const layer = new PaintLayer(this.getPlatformFeatures());
        this.addLayer(layer, false);
        const ctx = layer.getBuffer().getContext('2d');
        layers.forEach((l) => {
            l.selected = false;
            if (l.inverted) {
                ctx.globalCompositeOperation = 'difference';
            }
            ctx.drawImage(l.getBuffer(), 0, 0);
            ctx.globalCompositeOperation = 'source-over';
            this.removeLayer(l, false);
        });
        this.history.push({type: 'merge', layer, state: layers});
        layer.recalculate();
        layer.applyColor();
        layer.stopEdit();
        layer.selected = true;
        layer.draw();
        this.virtualScreen.redraw();
    };
    lockLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        layer.locked = true;
        if (saveHistory) {
            this.history.push({
                type: 'lock',
                layer,
                state: layer.state,
            });
            this.history.pushRedo({
                type: 'lock',
                layer,
                state: layer.state,
            });
        }
        this.virtualScreen.redraw();
    };
    unlockLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        layer.locked = false;
        if (saveHistory) {
            this.history.push({
                type: 'unlock',
                layer,
                state: layer.state,
            });
            this.history.pushRedo({
                type: 'unlock',
                layer,
                state: layer.state,
            });
        }
    };
    grab = (position: Point, size: Point) => {
        const layer = new PaintLayer(this.getPlatformFeatures());
        this.addLayer(layer);
        const ctx = layer.getBuffer().getContext('2d');
        ctx.drawImage(this.virtualScreen.canvas, position.x, position.y, size.x, size.y, 0, 0, size.x, size.y);
        layer.recalculate();
        layer.position = position.clone();
        layer.applyColor();
        layer.stopEdit();
        layer.selected = true;
        layer.draw();
        this.virtualScreen.redraw();
        return layer;
    };
    addLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        const {display, scale, layers} = this.state;
        layer.resize(display, scale);
        layer.index = layer.index ?? layers.length + 1;
        layer.name = layer.name ?? 'Layer ' + (layers.length + 1);
        layers.unshift(layer);
        if (saveHistory) {
            this.history.push({type: 'add', layer, state: layer.state});
        }
        layer.draw();
    };
    clearLayers = () => {
        this.state.layers = [];
        this.history.push({type: 'clear', layer: null, state: []});
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
    preparePlatform = async (name: string, isLogged?: boolean, layers?): Promise<void> => {
        const fonts = this.platforms[name].getFonts();
        this.lock();
        this.editor.clear();
        this.history.clear(false);
        let layersToload = layers ?? JSON.parse(localStorage.getItem(`${name}_lopaka_layers`));
        this.editor.font = getFont(fonts[0].name);
        this.unlock();
        await loadLayers(layersToload ?? []);
        if (!layers) {
            localStorage.setItem('lopaka_library', name);
            isLogged && logEvent('select_library', name);
        }
        this.virtualScreen.redraw(false);
    };
    setPlatform = async (name: string, isLogged?: boolean, layers?): Promise<void> => {
        this.state.platform = name;
        const fonts = this.platforms[name].getFonts();
        this.lock();
        this.editor.clear();
        let layersToload =
            window.top === window.self ? JSON.parse(localStorage.getItem(`${name}_lopaka_layers`)) : layers;
        return this.loadFontsForLayers(
            layersToload ? layersToload.filter((l) => l.type == 'string').map((l) => l.f) : [fonts[0].name]
        ).then(() => {
            this.editor.font = getFont(fonts[0].name);
            this.unlock();
            loadLayers(layersToload ?? []);
            if (window.top === window.self) {
                localStorage.setItem('lopaka_library', name);
                isLogged && logEvent('select_library', name);
            }
            this.virtualScreen.redraw(false);
        });
    };

    loadFontsForLayers = (usedFonts: string[]) => {
        const fonts = this.platforms[this.state.platform].getFonts();
        if (!usedFonts.includes(fonts[0].name)) {
            usedFonts.push(fonts[0].name);
        }
        return Promise.all(fonts.filter((font) => usedFonts.includes(font.name)).map((font) => loadFont(font)));
    };

    setIsPublic = (enabled: boolean) => {
        this.state.isPublic = enabled;
    };

    generateCode = (): TSourceCode => {
        const {platform, layers} = this.state;
        const code = this.platforms[platform].generateSourceCode(
            layers.filter((layer) => !layer.modifiers.overlay || !layer.modifiers.overlay.getValue()),
            this.virtualScreen.ctx
        );
        return this.platforms[platform].sourceMapParser.parse(code);
    };

    importCode = async (code: string, append: boolean = false) => {
        const {platform} = this.state;
        const {states, warnings} = this.platforms[platform].importSourceCode(code);
        const fonts = [...this.platforms[platform].getFonts(), ...this.state.customFonts];
        for (const state of states) {
            if (state.type == 'string' && state.font !== '') {
                if (!fonts.find((font) => font.name == state.font)) {
                    warnings.push(`Font ${state.font} was not found. Resetting to default.`);
                    state.font = fonts[0].name;
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

        if (states.length > 0)
            await loadLayers(
                states.map((state) => paramsToState(state, this.LayerClassMap)),
                append,
                true
            );
        this.state.warnings = warnings;
    };

    getPlatformFeatures(platform?: string): TPlatformFeatures {
        return this.platforms[platform ?? this.state.platform]?.features;
    }
    getDisplays = (platform?): Display[] => {
        return this.platforms[platform ?? this.state.platform]?.displays;
    };
    lock = () => {
        this.state.lock = true;
    };
    unlock = () => {
        this.state.lock = false;
    };
    initSandbox = () => {
        const platformLocal = localStorage.getItem('lopaka_library');
        this.state.platform = platformLocal;
        this.preparePlatform(platformLocal ?? U8g2Platform.id);
        this.setDisplayCustom(localStorage.getItem('lopaka_display_custom') === 'true');
        const displayStored = localStorage.getItem('lopaka_display');
        if (displayStored) {
            const displayStoredArr = displayStored.split('×').map((n) => parseInt(n));
            this.setDisplay(new Point(displayStoredArr[0], displayStoredArr[1]));
        }
    };
    constructor() {
        this.history.subscribe((event: THistoryEvent, change: TChange) => {
            switch (event.type) {
                case 'undo':
                    switch (change.type) {
                        case 'add':
                            this.removeLayer(change.layer, false);
                            break;
                        case 'remove':
                            this.addLayer(change.layer, false);
                            break;
                        case 'change':
                            change.layer.state = change.state;
                            change.layer.draw();
                            break;
                        case 'merge':
                            this.removeLayer(change.layer, false);
                            change.state.forEach((l) => {
                                this.addLayer(l, false);
                            });
                            break;
                        case 'clear':
                            change.state.forEach((l) => {
                                const type: ELayerType = l.t;
                                if (type in this.LayerClassMap) {
                                    const layer = new this.LayerClassMap[type](this.getPlatformFeatures());
                                    layer.loadState(l);
                                    this.addLayer(layer, false);
                                    layer.saveState();
                                }
                            });
                            break;
                    }
                    this.virtualScreen.redraw();
                    break;
                // case 'redo':
                //     switch (change.type) {
                //         case 'add':
                //             this.addLayer(change.layer, false);
                //             break;
                //         case 'remove':
                //             this.removeLayer(change.layer, false);
                //             break;
                //         case 'change':
                //             change.layer.loadState(change.state);
                //             change.layer.draw();
                //             break;
                //         case 'merge':
                //             this.addLayer(change.layer, false);
                //             change.state.forEach((l) => {
                //                 this.removeLayer(l, false);
                //             });
                //             break;
                //         case 'clear':
                //             this.clearLayers();
                //             break;
                //     }
                //     this.virtualScreen.redraw();
                //     break;
            }
        });
    }
}

export async function loadLayers(states: any[], append: boolean = false, saveHistory: boolean = false) {
    const session = useSession();
    if (!append) {
        session.state.layers = [];
    }
    const usedFonts = states.filter((s) => s.t == 'string').map((s) => s.f);
    return session.loadFontsForLayers(usedFonts).then(() => {
        states.forEach((state) => {
            const layerClass = session.LayerClassMap[state.t];
            const layer = new layerClass(session.getPlatformFeatures());
            layer.state = state;
            session.addLayer(layer, saveHistory);
        });
        session.virtualScreen.redraw();
    });
}

export function saveLayers(screenId?: number) {
    const session = useSession();
    const packedSession = JSON.stringify(session.state.layers.map((l) => l.state));
    if (window.top !== window.self) {
        postParentMessage('updateLayers', packedSession);
        postParentMessage('updateThumbnail', session.virtualScreen.canvas.toDataURL());
    } else {
        localStorage.setItem(`${session.state.platform}_lopaka_layers`, packedSession);
    }
}

export async function addCustomImage(
    name: string,
    width: number,
    height: number,
    image: HTMLImageElement,
    process?: boolean,
    asset_id?: number
) {
    const session = useSession();
    const {customImages} = session.state;

    // check for duplicate names
    const nameRegex = new RegExp(`^${name}(_\\d+)?$`);
    const founded = customImages.filter((item) => nameRegex.test(item.name));
    if (founded.length > 0) {
        const last = founded[founded.length - 1];
        const lastNumber = last.name.match(/_(\d+)$/);
        const number = lastNumber ? parseInt(lastNumber[1]) + 1 : 1;
        name = `${name}_${number}`;
    }

    // convert to monochrome
    if (process) {
        const imageData = imageToImageData(image);
        const coloredImageData = applyColor(imageData, '#FFFFFF');
        image = await imageDataToImage(coloredImageData);
    }
    customImages.push({name, width, height, image, isCustom: true, id: asset_id});
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
