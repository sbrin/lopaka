import {reactive, UnwrapRef} from 'vue';
import {TPlatformFeatures} from 'src/platforms/platform';
import {getFont, loadFont} from '../draw/fonts';
import {VirtualScreen} from '../draw/virtual-screen';
import {Editor} from '../editor/editor';
import {U8g2Platform} from '../platforms/u8g2';
import {applyColor, generateUID, imageDataToImage, imageToImageData, loadImageDataAsync, logEvent} from '../utils';
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
import {Display} from '/src/core/displays';
import {FontFormat} from '/src/draw/fonts/font';
import {AnimationFrame, AnimationSettings, Project, ProjectScreen} from '../types';
import {TFTeSPIPlatform} from '../platforms/tft-espi';

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
    frames: AnimationFrame[];
    currentFrameIndex: number;
    animationSettings: AnimationSettings;
    isPlaying: boolean;
};

export class Session {
    LayerClassMap: {[key in ELayerType]: any} = {
        box: RectangleLayer,
        frame: RectangleLayer,
        rect: RectangleLayer,
        circle: CircleLayer,
        disc: CircleLayer,
        line: LineLayer,
        string: TextLayer,
        paint: PaintLayer,
        ellipse: EllipseLayer,
        // TODO: deprecated, use PaintLayer instead
        icon: IconLayer,
    };

    id: string = generateUID();
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
        frames: [],
        currentFrameIndex: 0,
        animationSettings: {
            fps: 12,
            loop: true,
            pingPong: false,
            onionSkin: false,
            onionSkinOpacity: 0.3,
            onionSkinFrames: 1,
        },
        isPlaying: false,
    });

    private animationTimer: number | null = null;
    private animationDirection: number = 1;

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
            this.history.push({
                type: 'remove',
                layer,
                state: layer.state,
            });
            this.history.pushRedo({
                type: 'remove',
                layer,
                state: layer.state,
            });
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
                ctx.globalCompositeOperation = 'xor';
            }
            ctx.drawImage(l.getBuffer(), 0, 0);
            ctx.globalCompositeOperation = 'source-over';
            this.removeLayer(l, false);
        });
        this.history.push({
            type: 'merge',
            layer,
            state: layers,
        });
        this.history.pushRedo({
            type: 'merge',
            layer,
            state: layers,
        });
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
        this.virtualScreen.redraw(false);
        return layer;
    };
    addLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        const {display, scale, layers} = this.state;
        layer.resize(display, scale);
        layer.index = layer.index ?? layers.length + 1;
        layer.name = layer.name ?? 'Layer ' + (layers.length + 1);
        layers.unshift(layer);
        if (saveHistory) {
            this.history.push({
                type: 'add',
                layer,
                state: layer.state,
            });
            this.history.pushRedo({
                type: 'add',
                layer,
                state: layer.state,
            });
        }
        layer.draw();
    };
    clearLayers = () => {
        this.state.layers = [];
        this.history.push({
            type: 'clear',
            layer: null,
            state: [],
        });
        this.history.pushRedo({
            type: 'clear',
            layer: null,
            state: [],
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
        localStorage.setItem('lopaka_display', displayString);
        isLogged && logEvent('select_display', displayString);
    };
    setDisplayCustom = (enabled: boolean) => {
        this.state.isDisplayCustom = enabled;
    };
    saveDisplayCustom = (enabled: boolean) => {
        this.setDisplayCustom(enabled);
        localStorage.setItem('lopaka_display_custom', enabled ? 'true' : 'false');
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

    loadFontsForLayers = (usedFonts: string[]) => {
        const fonts = [...this.platforms[this.state.platform].getFonts(), ...this.state.customFonts];
        if (!usedFonts.includes(fonts[0].name)) {
            usedFonts.push(fonts[0].name);
        }
        const fontLoadPromises = fonts.filter((font) => usedFonts.includes(font.name)).map((font) => loadFont(font));
        return Promise.all(fontLoadPromises);
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

    generateAnimationCode = (): {code: string; map: any} => {
        const {platform, frames, animationSettings} = this.state;

        if (frames.length === 0) {
            return this.generateCode();
        }

        let output = '';

        output += `// ========== Animation Helper ==========\n`;
        output += `#define ANIMATION_FRAME_COUNT ${frames.length}\n`;
        output += `#define ANIMATION_FPS ${animationSettings.fps}\n`;
        output += `#define ANIMATION_FRAME_DELAY (1000 / ANIMATION_FPS)\n`;
        output += `#define ANIMATION_LOOP ${animationSettings.loop ? 1 : 0}\n`;
        output += `#define ANIMATION_PING_PONG ${animationSettings.pingPong ? 1 : 0}\n`;
        output += `\n`;

        const platformObj = this.platforms[platform];

        output += `// Animation: ${frames.length} frames at ${animationSettings.fps} FPS\n`;
        output += `// Loop: ${animationSettings.loop}, Ping-Pong: ${animationSettings.pingPong}\n\n`;

        frames.forEach((frame, index) => {
            const frameLayers: AbstractLayer[] = [];
            frame.layers.forEach((state) => {
                const layerClass = this.LayerClassMap[state.t as ELayerType];
                if (layerClass) {
                    const layer = new layerClass(this.getPlatformFeatures());
                    layer.state = state;
                    layer.resize(this.state.display, this.state.scale);
                    layer.draw();
                    frameLayers.push(layer);
                }
            });

            output += `// ========== Frame ${index + 1}: ${frame.title || 'Untitled'} ==========\n`;

            const frameCode = platformObj.generateSourceCode(
                frameLayers.filter((layer) => !layer.modifiers.overlay || !layer.modifiers.overlay.getValue()),
                this.virtualScreen.ctx
            );

            output += frameCode + '\n\n';
        });

        return {
            code: output,
            map: {},
        };
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

    getPlatformFeatures = (platform?): TPlatformFeatures => {
        return this.platforms[platform ?? this.state.platform]?.features;
    };
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
        const platformLocal = localStorage.getItem('lopaka_library') ?? TFTeSPIPlatform.id;
        this.state.platform = platformLocal;
        this.preparePlatform(platformLocal ?? U8g2Platform.id);
        this.setDisplayCustom(localStorage.getItem('lopaka_display_custom') === 'true');
        const displayStored = localStorage.getItem('lopaka_display');
        if (displayStored) {
            const displayStoredArr = displayStored.split('×').map((n) => parseInt(n));
            this.setDisplay(new Point(displayStoredArr[0], displayStoredArr[1]));
        }
    };

    saveCurrentFrame = () => {
        const {frames, currentFrameIndex, layers} = this.state;
        if (frames.length > 0 && frames[currentFrameIndex]) {
            frames[currentFrameIndex].layers = layers.map((l) => l.state);
        }
    };

    loadFrame = async (frameIndex: number) => {
        const {frames} = this.state;
        if (frames[frameIndex]) {
            await loadLayers(frames[frameIndex].layers, false, false);
        }
    };

    initializeFrames = () => {
        if (this.state.frames.length === 0) {
            this.state.frames = [
                {
                    id: 1,
                    title: 'Frame 1',
                    layers: this.state.layers.map((l) => l.state),
                },
            ];
            this.state.currentFrameIndex = 0;
        }
    };

    addFrame = (copyFromCurrent: boolean = true, insertAfterIndex?: number) => {
        this.saveCurrentFrame();
        const {frames} = this.state;
        const newId = frames.length > 0 ? Math.max(...frames.map((f) => f.id)) + 1 : 1;
        const insertIndex = insertAfterIndex !== undefined ? insertAfterIndex + 1 : frames.length;

        const newFrame: AnimationFrame = {
            id: newId,
            title: `Frame ${newId}`,
            layers:
                copyFromCurrent && frames.length > 0
                    ? JSON.parse(JSON.stringify(frames[this.state.currentFrameIndex]?.layers ?? []))
                    : [],
        };

        frames.splice(insertIndex, 0, newFrame);
        this.setCurrentFrame(insertIndex);
    };

    deleteFrame = (index: number) => {
        const {frames} = this.state;
        if (frames.length <= 1) {
            return;
        }
        frames.splice(index, 1);
        if (this.state.currentFrameIndex >= frames.length) {
            this.setCurrentFrame(frames.length - 1);
        } else if (this.state.currentFrameIndex === index) {
            this.setCurrentFrame(Math.min(index, frames.length - 1));
        }
    };

    duplicateFrame = (index: number) => {
        const {frames} = this.state;
        const sourcFrame = frames[index];
        if (!sourcFrame) return;

        const newId = Math.max(...frames.map((f) => f.id)) + 1;
        const newFrame: AnimationFrame = {
            id: newId,
            title: `${sourcFrame.title} (copy)`,
            layers: JSON.parse(JSON.stringify(sourcFrame.layers)),
        };

        frames.splice(index + 1, 0, newFrame);
    };

    setCurrentFrame = async (index: number) => {
        if (index < 0 || index >= this.state.frames.length) return;

        this.saveCurrentFrame();

        this.state.currentFrameIndex = index;
        await this.loadFrame(index);
        this.virtualScreen.redraw();
    };

    getCurrentFrame = (): AnimationFrame | null => {
        return this.state.frames[this.state.currentFrameIndex] ?? null;
    };

    playAnimation = () => {
        if (this.state.frames.length <= 1) return;
        if (this.animationTimer) return;

        this.state.isPlaying = true;
        this.animationDirection = 1;

        const interval = 1000 / this.state.animationSettings.fps;
        this.animationTimer = window.setInterval(() => {
            this.advanceFrame();
        }, interval);
    };

    pauseAnimation = () => {
        if (this.animationTimer) {
            clearInterval(this.animationTimer);
            this.animationTimer = null;
        }
        this.state.isPlaying = false;
    };

    stopAnimation = () => {
        this.pauseAnimation();
        this.setCurrentFrame(0);
    };

    private advanceFrame = () => {
        const {frames, currentFrameIndex, animationSettings} = this.state;
        const {loop, pingPong} = animationSettings;

        let nextIndex = currentFrameIndex + this.animationDirection;

        if (pingPong) {
            if (nextIndex >= frames.length) {
                this.animationDirection = -1;
                nextIndex = frames.length - 2;
            } else if (nextIndex < 0) {
                this.animationDirection = 1;
                nextIndex = 1;
            }
        } else {
            if (nextIndex >= frames.length) {
                if (loop) {
                    nextIndex = 0;
                } else {
                    this.pauseAnimation();
                    return;
                }
            }
        }

        this.setCurrentFrame(Math.max(0, Math.min(nextIndex, frames.length - 1)));
    };

    setAnimationFps = (fps: number) => {
        this.state.animationSettings.fps = Math.max(1, Math.min(60, fps));
        if (this.state.isPlaying) {
            this.pauseAnimation();
            this.playAnimation();
        }
    };

    toggleLoop = () => {
        this.state.animationSettings.loop = !this.state.animationSettings.loop;
    };

    togglePingPong = () => {
        this.state.animationSettings.pingPong = !this.state.animationSettings.pingPong;
    };

    toggleOnionSkin = () => {
        this.state.animationSettings.onionSkin = !this.state.animationSettings.onionSkin;
        this.virtualScreen.redraw();
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
                        case 'lock':
                            this.unlockLayer(change.layer, false);
                            break;
                        case 'unlock':
                            this.lockLayer(change.layer, false);
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
                case 'redo':
                    switch (change.type) {
                        case 'add':
                            this.addLayer(change.layer, false);
                            break;
                        case 'remove':
                            this.removeLayer(change.layer, false);
                            break;
                        case 'change':
                            change.layer.state = change.state;
                            change.layer.draw();
                            break;
                        case 'merge':
                            change.state.forEach((l) => {
                                this.removeLayer(l, false);
                            });
                            this.addLayer(change.layer, false);
                            break;
                        case 'lock':
                            this.lockLayer(change.layer, false);
                            break;
                        case 'unlock':
                            this.unlockLayer(change.layer, false);
                            break;
                        case 'clear':
                            this.state.layers = [];
                            break;
                    }
                    this.virtualScreen.redraw();
                    break;
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

export function saveLayers(screen_id) {
    const session = useSession();
    const packedSession = session.state.layers.map((l) => l.state);
    localStorage.setItem(`${session.state.platform}_lopaka_layers`, JSON.stringify(packedSession));
}

export async function loadProject(project: Project, screen: ProjectScreen): Promise<ProjectScreen> {
    // TODO move project load to providers
    const session = useSession();
    session.unlock();
    session.state.platform = project.platform;
    if (screen) {
        await session.preparePlatform(project.platform, false, screen.layers);
        session.setDisplay(new Point(project.screen_x, project.screen_y));
        return screen;
    }
}

export async function addCustomFont(asset) {
    const session = useSession();
    const {customFonts} = session.state;

    const fileName = asset.filename.substring(0, asset.filename.lastIndexOf('.')) || asset.filename;
    const fileExtension = asset.filename.substring(asset.filename.lastIndexOf('.')).toLowerCase();

    let format;
    switch (fileExtension) {
        case '.bdf':
            format = FontFormat.FORMAT_BDF;
            break;
        default:
            format = FontFormat.FORMAT_GFX;
    }

    customFonts.push({
        name: fileName,
        title: fileName.split('#').pop(),
        file: asset.url,
        format: format,
    });
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
    }
    const session = new Session();
    const scaleLocal = JSON.parse(localStorage.getItem('lopaka_scale') ?? '300');
    session.setScale(scaleLocal);
    sessions.set(session.id, session);
    currentSessionId = session.id;
    return session;
}
