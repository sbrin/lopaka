import { reactive, UnwrapRef } from 'vue';
import { TPlatformFeatures } from 'src/platforms/platform';
import { getFont, loadFont } from '../draw/fonts';
import { VirtualScreen } from '../draw/virtual-screen';
import { Editor } from '../editor/editor';
import { applyColor, generateUID, imageDataToImage, imageToImageData, loadImageDataAsync, logEvent } from '../utils';
import { ChangeHistory, TChange, THistoryEvent, useHistory } from './history';
import { LayersManager } from './layers-manager';
import { AbstractLayer } from './layers/abstract.layer';
import { ButtonLayer } from './layers/button.layer';
import { CircleLayer } from './layers/circle.layer';
import { EllipseLayer } from './layers/ellipse.layer';
import { IconLayer } from './layers/icon.layer';
import { LineLayer } from './layers/line.layer';
import { PaintLayer, resolvePaintColorMode } from './layers/paint.layer';
import { RectangleLayer } from './layers/rectangle.layer';
import { TriangleLayer } from './layers/triangle.layer';
import { TextLayer } from './layers/text.layer';
import { SwitchLayer } from './layers/switch.layer';
import { PanelLayer } from './layers/panel.layer';
import { SliderLayer } from './layers/slider.layer';
import { CheckboxLayer } from './layers/checkbox.layer';
import { TextAreaLayer } from './layers/text-area.layer';
import { PolygonLayer } from './layers/polygon.layer';
import platforms from './platforms';
import { Point } from './point';
import { paramsToState } from './decorators/mapping';
import { iconsList } from '../icons/icons';
import { Display } from '/src/core/displays';
import { FontFormat } from '/src/draw/fonts/font';
import { TFTeSPIPlatform } from '/src/platforms/tft-espi';
import { Project, ProjectScreen } from '/src/types';
import { LVGLPlatform } from '/src/platforms/lvgl';
import { AbstractDrawingRenderer } from '../draw/renderers';
import { SCALE_LIST } from '/src/const';
import { syncProjectClipboard } from './project-clipboard';

const sessions = new Map<string, UnwrapRef<Session>>();
let currentSessionId = null;

export type TSessionState = {
    platform: string;
    display: Point;
    isDisplayCustom: boolean;
    immidiateUpdates: number; // for immediate updates
    selectionUpdates: number;
    scale: Point;
    scaleIndex: number;
    lock: boolean;
    customImages: TLayerImageData[];
    isPublic: boolean;
    customFonts: TPlatformFont[];
    warnings: string[];
    brushColor: string;
    paintColorMode: 'rgb' | 'monochrome';
    screenTitle: string;
    imageWizard: {
        isOpen: boolean;
        onSaveCallback?: (processedImagesArr: any[]) => void;
        onCloseCallback?: () => void;
    };
};

export class Session {
    LayerClassMap: { [key in ELayerType]: any } = {
        box: RectangleLayer,
        frame: RectangleLayer,
        rect: RectangleLayer,
        triangle: TriangleLayer,
        circle: CircleLayer,
        disc: CircleLayer,
        line: LineLayer,
        string: TextLayer,
        paint: PaintLayer,
        ellipse: EllipseLayer,
        button: ButtonLayer,
        polygon: PolygonLayer,
        // TODO: deprecated, use PaintLayer instead
        icon: IconLayer,
        switch: SwitchLayer,
        panel: PanelLayer,
        slider: SliderLayer,
        checkbox: CheckboxLayer,
        textarea: TextAreaLayer,
    };

    id: string = generateUID();
    platforms = platforms;

    state: TSessionState = reactive({
        lock: false,
        platform: null,
        display: new Point(128, 64),
        isDisplayCustom: false,
        customDisplay: new Point(128, 64),
        immidiateUpdates: 1,
        selectionUpdates: 1,
        scale: new Point(4, 4),
        scaleIndex: SCALE_LIST.indexOf(400),
        customImages: [],
        icons: iconsList,
        isPublic: false,
        customFonts: [],
        warnings: [],
        brushColor: '#ffffff',
        paintColorMode: 'monochrome',
        screenTitle: '',
        imageWizard: {
            isOpen: false,
            onSaveCallback: null,
            onCloseCallback: null,
        },
    });

    history: ChangeHistory = useHistory();
    layersManager: LayersManager = new LayersManager(this);

    editor: Editor = new Editor(this);

    virtualScreen: VirtualScreen = new VirtualScreen(this, {
        ruler: true,
        smartRuler: true,
        highlight: true,
        pointer: false,
    });
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
    showLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        layer.hidden = false;
        if (saveHistory) {
            this.history.push({
                type: 'show',
                layer,
                state: layer.state,
            });
            this.history.pushRedo({
                type: 'show',
                layer,
                state: layer.state,
            });
        }
        this.virtualScreen.redraw();
    };
    hideLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        layer.hidden = true;
        if (saveHistory) {
            this.history.push({
                type: 'hide',
                layer,
                state: layer.state,
            });
            this.history.pushRedo({
                type: 'hide',
                layer,
                state: layer.state,
            });
        }
        this.virtualScreen.redraw();
    };
    grab = (position: Point, size: Point) => {
        const renderer = this.createRenderer();
        const features = this.getPlatformFeatures();
        const layer = new PaintLayer(features, renderer, resolvePaintColorMode(features));
        this.addLayer(layer);
        const ctx = layer.getBuffer().getContext('2d');
        ctx.drawImage(this.virtualScreen.canvas, position.x, position.y, size.x, size.y, 0, 0, size.x, size.y);
        layer.recalculate();
        layer.position = position.clone();
        layer.stopEdit();
        layer.selected = true;
        layer.draw();
        this.virtualScreen.redraw(false);
        return layer;
    };
    addLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        this.layersManager.add(layer, saveHistory);
    };
    clearLayers = () => {
        this.layersManager.clearLayers();
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
        if (this.state.display.x === display.x && this.state.display.y === display.y) {
            return;
        }
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
        const idx = SCALE_LIST.indexOf(scale);
        if (idx !== -1) {
            this.state.scaleIndex = idx;
        }
        localStorage.setItem('lopaka_scale', `${scale}`);
    };

    scaleUp = (): number => {
        const newIndex = Math.min(this.state.scaleIndex + 1, SCALE_LIST.length - 1);
        this.setScale(SCALE_LIST[newIndex], true);
        return SCALE_LIST[newIndex];
    };

    scaleDown = (): number => {
        const newIndex = Math.max(this.state.scaleIndex - 1, 0);
        this.setScale(SCALE_LIST[newIndex], true);
        return SCALE_LIST[newIndex];
    };

    getScalePercent = (): number => {
        return SCALE_LIST[this.state.scaleIndex];
    };
    preparePlatform = async (name: string, isLogged?: boolean, layers?): Promise<void> => {
        const fonts = this.platforms[name].getFonts();
        this.lock();
        this.editor.clear();
        this.history.clear(false);

        // Update platform state BEFORE loading layers so createRenderer uses the correct platform
        this.state.platform = name;

        let layersToload = layers ?? JSON.parse(localStorage.getItem(`${name}_lopaka_layers`));
        this.editor.font = name === LVGLPlatform.id ? getFont('Montserrat') : getFont(fonts[0].name);
        const features = this.platforms[name].features;
        // Decide whether monochrome is supported for default paint mode.
        const supportsMonochrome = features?.hasMonochromeSupport ?? true;
        // Default to RGB only when monochrome is disabled on an RGB platform.
        const defaultPaintMode = features?.hasRGBSupport && !supportsMonochrome ? 'rgb' : 'monochrome';
        this.setPaintColorMode(defaultPaintMode, features);
        this.setBrushColor(features.defaultColor);
        this.unlock();
        await this.layersManager.loadLayers(layersToload ?? []);
        if (!layers) {
            localStorage.setItem('lopaka_library', name);
            isLogged && logEvent('select_library', name);
        }
        this.virtualScreen.redraw();
    };

    setBrushColor = (color: string) => {
        this.state.brushColor = color;
    };
    setLastColor = (color: string) => {
        this.editor.lastColor = color;
    };

    setPaintColorMode = (mode: 'rgb' | 'monochrome', features: TPlatformFeatures = this.getPlatformFeatures()) => {
        // Read platform capabilities to decide which modes are valid.
        const supportsRgb = Boolean(features?.hasRGBSupport);
        // Treat missing flag as monochrome-capable to preserve existing behavior.
        const supportsMonochrome = features?.hasMonochromeSupport ?? true;
        // Force RGB when monochrome is disabled on an RGB platform.
        const resolvedMode = supportsRgb && !supportsMonochrome ? 'rgb' : mode;
        // Fall back to monochrome when RGB is unsupported.
        this.state.paintColorMode = supportsRgb ? resolvedMode : 'monochrome';
    };

    setIsPublic = (enabled: boolean) => {
        this.state.isPublic = enabled;
    };

    generateCode = (): TSourceCode => {
        const { platform, screenTitle } = this.state;
        const code = this.platforms[platform].generateSourceCode(
            this.layersManager.sorted.filter(
                (layer) => !layer.modifiers.overlay || !layer.modifiers.overlay.getValue()
            ),
            this.virtualScreen.ctx,
            screenTitle
        );
        return this.platforms[platform].sourceMapParser.parse(code);
    };

    setScreenTitle = (title: string) => {
        this.state.screenTitle = title;
    };

    importCode = async (code: string, append: boolean = false) => {
        const { platform } = this.state;
        const { states, warnings } = this.platforms[platform].importSourceCode(code);
        const fonts = [...this.platforms[platform].getFonts(), ...this.state.customFonts];
        if (states.length === 0) {
            warnings.push(`Couldn't find any layer data.`);
        }
        for (const state of states) {
            if (state.type == 'string' && state.font !== '') {
                const layerFont = fonts.find((font) => font.name == state.font || font.title == state.font);
                if (!layerFont) {
                    warnings.push(`Font ${state.font} was not found. Resetting to default.`);
                    state.font = fonts[0].name;
                } else {
                    state.font = layerFont.name;
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
        this.history.batchStart();
        await this.layersManager.loadLayers(
            states.map((state) => paramsToState(state, this.layersManager.LayerClassMap)),
            append,
            true
        );
        this.history.batchEnd();
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
    initSandbox = async () => {
        // Scope clipboard to sandbox context so project copy data is not reused.
        syncProjectClipboard(null);
        const platformLocal = localStorage.getItem('lopaka_library');
        this.state.platform = platformLocal;
        const local_color_bg = localStorage.getItem(`lopaka_${this.state.platform}_color_bg`);
        if (local_color_bg) {
            this.platforms[this.state.platform].features.screenBgColor = local_color_bg;
        }
        await this.preparePlatform(platformLocal ?? TFTeSPIPlatform.id);
        this.setDisplayCustom(localStorage.getItem('lopaka_display_custom') === 'true');
        const displayStored = localStorage.getItem('lopaka_display');
        if (displayStored) {
            const displayStoredArr = displayStored.split('×').map((n) => parseInt(n));
            this.setDisplay(new Point(displayStoredArr[0], displayStoredArr[1]));
        }
    };
    constructor() {
        this.history.subscribe((event: THistoryEvent, change: TChange) => {
            this.layersManager.undoChange(event, change);
            this.virtualScreen.redraw();
        });
    }

    openImageWizard = (onSave?: (processedImagesArr: any[]) => void, onClose?: () => void) => {
        this.state.imageWizard.isOpen = true;
        this.state.imageWizard.onSaveCallback = onSave;
        this.state.imageWizard.onCloseCallback = onClose;
    };

    closeImageWizard = () => {
        this.state.imageWizard.isOpen = false;
        if (this.state.imageWizard.onCloseCallback) {
            this.state.imageWizard.onCloseCallback();
        }
        this.state.imageWizard.onSaveCallback = null;
        this.state.imageWizard.onCloseCallback = null;
    };

    /**
     * Helper method to create a renderer for the current platform
     */
    createRenderer(): AbstractDrawingRenderer {
        const platform = this.platforms[this.state.platform];
        if (!platform) {
            return null;
        }
        return platform.createRenderer();
    }

    /**
     * Load a starter template into the current session.
     * Used during onboarding to give users a working design immediately.
     */
    loadTemplate = async (templateLayers: Record<string, any>[]) => {
        if (!templateLayers || templateLayers.length === 0) return;
        this.history.batchStart();
        await this.layersManager.loadLayers(templateLayers, false, true);
        this.history.batchEnd();
        this.virtualScreen.redraw();
    };
}

export async function loadLayers(states: any[], append: boolean = false, saveHistory: boolean = false) {
    const session = useSession();
    await session.layersManager.loadLayers(states);
    // session.virtualScreen.redraw();
}

type SaveLayersSnapshot = {
    layers?: any[];
    imagePreview?: string;
};

export function saveLayers(screen_id, snapshot: SaveLayersSnapshot = {}) {
    const session = useSession();
    // Prefer captured payload when provided to avoid saving mixed screen state after async switches.
    const packedSession = snapshot.layers ?? session.layersManager.layers.map((l) => l.state);
    localStorage.setItem(`${session.state.platform}_lopaka_layers`, JSON.stringify(packedSession));
    return Promise.resolve();
}

export async function loadProject(project: Project, screen: ProjectScreen): Promise<ProjectScreen> {
    // TODO loading project move to session and provider
    const session = useSession();
    // Reset clipboard only when user opens a different project.
    syncProjectClipboard(project?.id ?? null);
    session.unlock();
    session.state.platform = project.platform;
    if (screen) {
        if (project.color_bg) session.platforms[project.platform].features.screenBgColor = project.color_bg;
        await session.preparePlatform(project.platform, false, screen.layers);
        session.setDisplay(new Point(project.screen_x, project.screen_y));
        return screen;
    }
}

export async function loadAssetsFonts() {
    // TODO: load local fonts
}

export async function addCustomFont(asset) {
    const session = useSession();
    const { customFonts } = session.state;

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

    const fontTitle = fileName
        .split('#')
        .pop()
        .replace(/^[a-f0-9-]+\/[a-zA-Z0-9]+_/, '');

    customFonts.push({
        name: fileName,
        title: fontTitle,
        file: asset.url,
        format: format,
    });
}

export async function addCustomImage(
    name: string,
    width: number,
    height: number,
    image: HTMLImageElement,
    process = false,
    asset_id?: number | null,
    colorMode: string = 'monochrome'
) {
    const session = useSession();
    const { customImages } = session.state;

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
    if (process && colorMode !== 'rgb') {
        const imageData = imageToImageData(image);
        const coloredImageData = applyColor(imageData, '#FFFFFF');
        image = await imageDataToImage(coloredImageData);
    }
    customImages.push({ name, width, height, image, isCustom: true, id: asset_id, colorMode });
}

export function useSession(id?: string) {
    if (currentSessionId) {
        return sessions.get(currentSessionId);
    }
    const session = new Session();
    const scaleLocal = JSON.parse(localStorage.getItem('lopaka_scale') ?? '400');
    session.setScale(scaleLocal);
    sessions.set(session.id, session);
    currentSessionId = session.id;
    return session;
}
