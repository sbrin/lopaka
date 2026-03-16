import {describe, expect, it, beforeEach, vi} from 'vitest';
import {CopyPlugin} from './copy.plugin';
import {RectangleLayer} from '../../core/layers/rectangle.layer';
import {Point} from '../../core/point';
import {TPlatformFeatures} from '../../platforms/platform';
import {AbstractLayer} from '../../core/layers/abstract.layer';
import {Keys} from '../../core/keys.enum';
import {syncProjectClipboard} from '../../core/project-clipboard';

const features: TPlatformFeatures = {
    hasCustomFontSize: false,
    hasInvertedColors: false,
    hasRGBSupport: false,
    defaultColor: '#ffffff',
    interfaceColors: {
        selectColor: '#fff',
        resizeIconColor: '#fff',
        hoverColor: '#fff',
        rulerColor: '#fff',
        rulerLineColor: '#fff',
        selectionStrokeColor: '#fff',
    },
};

let projectScopeCounter = 0;

type TestSession = {
    state: {
        platform?: string;
        layers: AbstractLayer[];
    };
    editor: {
        state: {activeTool: null};
        selectionUpdate: ReturnType<typeof vi.fn>;
    };
    virtualScreen: {redraw: ReturnType<typeof vi.fn>};
    addLayer: (layer: AbstractLayer) => void;
    layersManager: {
        layers: AbstractLayer[];
        selected: AbstractLayer[];
        count: number;
        groupCounter: number;
        group: (layers: AbstractLayer[]) => void;
        renameGroup: (currentName: string, desiredName: string) => void;
        getLayersInGroup: (name: string) => AbstractLayer[];
        clearSelection: ReturnType<typeof vi.fn>;
        removeLayers: ReturnType<typeof vi.fn>;
    };
    history: {
        batchStart: ReturnType<typeof vi.fn>;
        batchEnd: ReturnType<typeof vi.fn>;
    };
    createRenderer: () => any;
    getPlatformFeatures: () => TPlatformFeatures;
};

describe('CopyPlugin', () => {
    let session: TestSession;
    let plugin: CopyPlugin;
    let container: HTMLDivElement;
    let layersCollection: AbstractLayer[];
    let projectScopeId: number;

    function setLayers(layers: AbstractLayer[]) {
        layersCollection.length = 0;
        layers.forEach((entry) => layersCollection.push(entry));
    }

    beforeEach(() => {
        projectScopeId = ++projectScopeCounter;
        // Force a fresh project scope so tests do not share clipboard state.
        syncProjectClipboard(projectScopeId);
        container = document.createElement('div');
        layersCollection = [];
        session = {
            state: {
                platform: 'test',
                layers: layersCollection,
            },
            editor: {
                state: {activeTool: null},
                selectionUpdate: vi.fn(),
            },
            virtualScreen: {
                redraw: vi.fn(),
            },
            addLayer: (newLayer: AbstractLayer) => {
                newLayer.index = newLayer.index ?? layersCollection.length + 1;
                layersCollection.unshift(newLayer);
            },
            createRenderer: () => ({
                setDrawContext: vi.fn(),
            }),
            getPlatformFeatures: () => features,
            layersManager: {
                layers: layersCollection,
                selected: [],
                count: 0,
                groupCounter: 0,
                clearSelection: vi.fn(),
                removeLayers: vi.fn(),
                group: (layersToGroup: AbstractLayer[]) => {
                    if (!layersToGroup.length) return;
                    const sharedGroup = layersToGroup[0].group;
                    // Simplified group logic mock
                },
                renameGroup: (currentName: string, desiredName: string) => {
                    layersCollection.forEach((layer) => {
                        if (layer.group === currentName) {
                            layer.group = desiredName;
                        }
                    });
                },
                getLayersInGroup: (name: string) => layersCollection.filter((entry) => entry.group === name),
            },
            history: {
                batchStart: vi.fn(),
                batchEnd: vi.fn(),
            },
        };
        // sync count
        Object.defineProperty(session.layersManager, 'count', {
            get: () => layersCollection.length,
        });

        plugin = new CopyPlugin(session as any, container);
    });

    it('copies selected layers to buffer on Ctrl+C', () => {
        const layer = new RectangleLayer(features);
        layer.name = 'Layer 1';
        layer.selected = true;
        session.layersManager.selected = [layer];
        setLayers([layer]);

        plugin.onKeyDown(Keys.KeyC, new KeyboardEvent('keydown', {ctrlKey: true}));

        expect(plugin.buffer).not.toBeNull();
        expect(plugin.buffer?.records).toHaveLength(1);
    });

    it('pastes layers from buffer with unique names on Ctrl+V', () => {
        const layer = new RectangleLayer(features);
        layer.name = 'Layer 1';
        layer.selected = true;
        session.layersManager.selected = [layer];
        setLayers([layer]);

        // Copy
        plugin.onKeyDown(Keys.KeyC, new KeyboardEvent('keydown', {ctrlKey: true}));

        // Paste
        plugin.onKeyDown(Keys.KeyV, new KeyboardEvent('keydown', {ctrlKey: true}));

        expect(session.layersManager.layers).toHaveLength(2);
        const newLayer = session.layersManager.layers[0];
        expect(newLayer).not.toBe(layer);
        expect(newLayer.name).toBe('Layer 1 copy 1');
    });

    it('increments copy index on subsequent pastes', () => {
        const layer = new RectangleLayer(features);
        layer.name = 'Layer 1';
        layer.selected = true;
        session.layersManager.selected = [layer];
        setLayers([layer]);

        // Copy
        plugin.onKeyDown(Keys.KeyC, new KeyboardEvent('keydown', {ctrlKey: true}));

        // Paste 1
        plugin.onKeyDown(Keys.KeyV, new KeyboardEvent('keydown', {ctrlKey: true}));
        // Paste 2
        plugin.onKeyDown(Keys.KeyV, new KeyboardEvent('keydown', {ctrlKey: true}));

        const pastedLayers = session.layersManager.layers.filter((l) => l !== layer);
        expect(pastedLayers).toHaveLength(2);
        // Stack order: latest paste is at [0] because addLayer unshifts in this mock
        expect(pastedLayers[0].name).toBe('Layer 1 copy 2');
        expect(pastedLayers[1].name).toBe('Layer 1 copy 1');
    });

    it('handles Cut (Ctrl+X)', () => {
        const layer = new RectangleLayer(features);
        layer.name = 'Layer 1';
        layer.selected = true;
        session.layersManager.selected = [layer];
        setLayers([layer]);

        plugin.onKeyDown(Keys.KeyX, new KeyboardEvent('keydown', {ctrlKey: true}));

        expect(plugin.buffer).not.toBeNull();
        expect(session.layersManager.removeLayers).toHaveBeenCalledWith([layer]);
    });

    it('keeps copied buffer when editor plugin is reinitialized in the same project', () => {
        const layer = new RectangleLayer(features);
        layer.name = 'Layer 1';
        layer.selected = true;
        session.layersManager.selected = [layer];
        setLayers([layer]);

        // Copy layer into project-scoped clipboard.
        plugin.onKeyDown(Keys.KeyC, new KeyboardEvent('keydown', {ctrlKey: true}));
        // Simulate editor.clear() during screen switch.
        plugin.onClear();
        // Recreate plugin instance as if editor was reinitialized.
        const reinitializedPlugin = new CopyPlugin(session as any, container);

        reinitializedPlugin.onKeyDown(Keys.KeyV, new KeyboardEvent('keydown', {ctrlKey: true}));

        expect(session.layersManager.layers).toHaveLength(2);
    });

    it('clears copied buffer when project scope changes', () => {
        const layer = new RectangleLayer(features);
        layer.name = 'Layer 1';
        layer.selected = true;
        session.layersManager.selected = [layer];
        setLayers([layer]);

        // Copy layer into clipboard in current project.
        plugin.onKeyDown(Keys.KeyC, new KeyboardEvent('keydown', {ctrlKey: true}));
        // Simulate loading a different project.
        syncProjectClipboard(projectScopeId + 1);
        // Recreate plugin instance after project switch.
        const reinitializedPlugin = new CopyPlugin(session as any, container);

        reinitializedPlugin.onKeyDown(Keys.KeyV, new KeyboardEvent('keydown', {ctrlKey: true}));

        expect(session.layersManager.layers).toHaveLength(1);
        expect(reinitializedPlugin.buffer).toBeNull();
    });
});
