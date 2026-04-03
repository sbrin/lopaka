import {describe, expect, it, beforeEach, vi} from 'vitest';
import {ClonePlugin} from './clone.plugin';
import {RectangleLayer} from '../../core/layers/rectangle.layer';
import {Point} from '../../core/point';
import {TPlatformFeatures} from '../../platforms/platform';
import {AbstractLayer} from '../../core/layers/abstract.layer';

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
        groupCounter: number;
        group: (layers: AbstractLayer[]) => void;
        renameGroup: (currentName: string, desiredName: string) => void;
        getLayersInGroup: (name: string) => AbstractLayer[];
    };
    history: {
        batchStart: ReturnType<typeof vi.fn>;
        batchEnd: ReturnType<typeof vi.fn>;
    };
};

describe('ClonePlugin', () => {
    let session: TestSession;
    let plugin: ClonePlugin;
    let container: HTMLDivElement;
    let layer: RectangleLayer;
    let layersCollection: AbstractLayer[];
    let batchStartSpy: ReturnType<typeof vi.fn>;
    let batchEndSpy: ReturnType<typeof vi.fn>;

    function setLayers(layers: AbstractLayer[]) {
        layersCollection.length = 0;
        layers.forEach((entry) => layersCollection.push(entry));
    }

    beforeEach(() => {
        container = document.createElement('div');
        layersCollection = [];
        batchStartSpy = vi.fn();
        batchEndSpy = vi.fn();
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
            layersManager: {
                layers: layersCollection,
                groupCounter: 0,
                group: (layersToGroup: AbstractLayer[]) => {
                    if (!layersToGroup.length) {
                        return;
                    }
                    const sharedGroup = layersToGroup[0].group;
                    const allShare = sharedGroup && layersToGroup.every((layer) => layer.group === sharedGroup);
                    let targetName = sharedGroup ?? '';
                    if (!allShare) {
                        const existing = new Set(
                            layersCollection
                                .map((layer) => layer.group)
                                .filter((name): name is string => Boolean(name))
                        );
                        do {
                            targetName = `Group ${++session.layersManager.groupCounter}`;
                        } while (existing.has(targetName));
                        layersToGroup.forEach((entry) => (entry.group = targetName));
                    }
                },
                renameGroup: (currentName: string, desiredName: string) => {
                    const trimmed = desiredName.trim();
                    if (!currentName || !trimmed) {
                        return;
                    }
                    const existing = new Set(
                        layersCollection
                            .map((layer) => layer.group)
                            .filter((name): name is string => Boolean(name) && name !== currentName)
                    );
                    let candidate = trimmed;
                    let suffix = 1;
                    while (existing.has(candidate)) {
                        candidate = `${trimmed} (${suffix++})`;
                    }
                    layersCollection.forEach((layer) => {
                        if (layer.group === currentName) {
                            layer.group = candidate;
                        }
                    });
                },
                getLayersInGroup: (name: string) => layersCollection.filter((entry) => entry.group === name),
            },
            history: {
                batchStart: batchStartSpy,
                batchEnd: batchEndSpy,
            },
        };

        layer = new RectangleLayer(features);
        layer.position = new Point(0, 0);
        layer.size = new Point(10, 10);
        layer.updateBounds();
        layer.stopEdit();
        layer.selected = true;
        layer.name = 'Layer 1';
        layer.index = 1;
        setLayers([layer]);

        plugin = new ClonePlugin(session as any, container);
    });

    it('creates a clone when dragging with modifier key pressed', () => {
        const startPoint = new Point(2, 2);
        plugin.onMouseDown(startPoint, new MouseEvent('mousedown', {altKey: true}));
        plugin.onMouseMove(new Point(4, 4), new MouseEvent('mousemove', {altKey: true}));

        expect(session.layersManager.layers.length).toBe(2);
        const [clonedLayer, originalLayer] = session.layersManager.layers;
        expect(clonedLayer).not.toBe(originalLayer);
        expect(clonedLayer.name).toMatch(/ copy \d+$/);
        expect(originalLayer.position.xy).toEqual([0, 0]);

        plugin.onMouseUp(new Point(4, 4), new MouseEvent('mouseup'));
        expect(session.virtualScreen.redraw).toHaveBeenCalled();
        expect(session.editor.selectionUpdate).toHaveBeenCalled();
    });

    it('does not clone without modifier key', () => {
        const startPoint = new Point(2, 2);
        plugin.onMouseDown(startPoint, new MouseEvent('mousedown'));
        plugin.onMouseMove(new Point(4, 4), new MouseEvent('mousemove'));

        expect(session.layersManager.layers.length).toBe(1);
    });
    it('places the cloned layer directly above the source layer', () => {
        const bottomLayer = new RectangleLayer(features);
        bottomLayer.position = new Point(20, 20);
        bottomLayer.size = new Point(10, 10);
        bottomLayer.updateBounds();
        bottomLayer.stopEdit();
        bottomLayer.name = 'Bottom';
        bottomLayer.index = 1;

        const topLayer = new RectangleLayer(features);
        topLayer.position = new Point(40, 40);
        topLayer.size = new Point(10, 10);
        topLayer.updateBounds();
        topLayer.stopEdit();
        topLayer.name = 'Top';
        topLayer.index = 3;

        layer.index = 2;
        setLayers([topLayer, layer, bottomLayer]);

        const startPoint = new Point(2, 2);
        plugin.onMouseDown(startPoint, new MouseEvent('mousedown', {altKey: true}));
        plugin.onMouseMove(new Point(4, 4), new MouseEvent('mousemove', {altKey: true}));

        const sorted = session.layersManager.layers.slice().sort((a, b) => a.index - b.index);
        const clone = sorted.find((l) => l.selected) as AbstractLayer;
        expect(clone).toBeDefined();
        const originalIndex = sorted.indexOf(layer);
        const cloneIndex = sorted.indexOf(clone);
        expect(cloneIndex).toBe(originalIndex + 1);
        const aboveOriginal = sorted.slice(cloneIndex + 1);
        expect(aboveOriginal.every((l) => l.index > clone.index)).toBe(true);
    });

    it('groups cloned layers together above the original layers', () => {
        const firstLayer = new RectangleLayer(features);
        firstLayer.position = new Point(10, 10);
        firstLayer.size = new Point(10, 10);
        firstLayer.updateBounds();
        firstLayer.stopEdit();
        firstLayer.name = 'Layer 1';
        firstLayer.index = 1;

        const secondLayer = new RectangleLayer(features);
        secondLayer.position = new Point(30, 30);
        secondLayer.size = new Point(10, 10);
        secondLayer.updateBounds();
        secondLayer.stopEdit();
        secondLayer.name = 'Layer 2';
        secondLayer.index = 2;

        const upperLayer = new RectangleLayer(features);
        upperLayer.position = new Point(50, 50);
        upperLayer.size = new Point(10, 10);
        upperLayer.updateBounds();
        upperLayer.stopEdit();
        upperLayer.name = 'Upper';
        upperLayer.index = 3;

        firstLayer.selected = true;
        secondLayer.selected = true;

        const highestSelectedIndex = Math.max(firstLayer.index, secondLayer.index);
        const originalUpperIndex = upperLayer.index;

        setLayers([upperLayer, secondLayer, firstLayer]);

        const startPoint = new Point(12, 12);
        plugin.onMouseDown(startPoint, new MouseEvent('mousedown', {altKey: true}));
        plugin.onMouseMove(new Point(14, 14), new MouseEvent('mousemove', {altKey: true}));

        expect(session.layersManager.layers.length).toBe(5);

        const sorted = session.layersManager.layers.slice().sort((a, b) => a.index - b.index);
        const originalsSet = new Set([firstLayer, secondLayer, upperLayer]);
        const clones = sorted.filter((l) => !originalsSet.has(l));
        expect(clones).toHaveLength(2);

        clones.forEach((clone, offset) => {
            expect(clone.index).toBe(highestSelectedIndex + 1 + offset);
        });

        const cloneNamesInOrder = clones.map((l) => l.name);
        expect(cloneNamesInOrder).toEqual(['Layer 1 copy 1', 'Layer 2 copy 1']);

        const upper = sorted.find((l) => l.name === 'Upper');
        expect(upper?.index).toBe(originalUpperIndex + clones.length);
    });

    it('creates a new group when cloning an entire group selection', () => {
        const groupLayerA = new RectangleLayer(features);
        groupLayerA.name = 'Grouped A';
        groupLayerA.index = 1;
        groupLayerA.group = 'Group 1';
        groupLayerA.selected = true;
        groupLayerA.position = new Point(0, 0);
        groupLayerA.size = new Point(10, 10);
        groupLayerA.updateBounds();
        groupLayerA.stopEdit();

        const groupLayerB = new RectangleLayer(features);
        groupLayerB.name = 'Grouped B';
        groupLayerB.index = 2;
        groupLayerB.group = 'Group 1';
        groupLayerB.selected = true;
        groupLayerB.position = new Point(20, 0);
        groupLayerB.size = new Point(10, 10);
        groupLayerB.updateBounds();
        groupLayerB.stopEdit();

        setLayers([groupLayerB, groupLayerA]);

        const startPoint = new Point(5, 5);
        plugin.onMouseDown(startPoint, new MouseEvent('mousedown', {altKey: true}));
        plugin.onMouseMove(new Point(7, 7), new MouseEvent('mousemove', {altKey: true}));

        const clonedLayers = layersCollection.filter((entry) => entry.name.endsWith('copy'));
        const clones = layersCollection.filter((entry) => / copy \d+$/.test(entry.name));
        expect(clones).toHaveLength(2);
        // "Group 1 copy" is consistent with logic in line 128
        const newGroupName = clones[0].group;
        expect(newGroupName).toBe('Group 1 copy');
        clonedLayers.forEach((entry) => expect(entry.group).toBe(newGroupName));
        expect(groupLayerA.group).toBe('Group 1');
        expect(groupLayerB.group).toBe('Group 1');
        plugin.onMouseUp(new Point(7, 7), new MouseEvent('mouseup'));
        expect(batchStartSpy).toHaveBeenCalledTimes(1);
        expect(batchEndSpy).toHaveBeenCalledTimes(1);
    });

    it('keeps cloned layer within original group when duplicating a single member', () => {
        const groupLayerA = new RectangleLayer(features);
        groupLayerA.name = 'Grouped A';
        groupLayerA.index = 1;
        groupLayerA.group = 'Group 1';
        groupLayerA.selected = true;
        groupLayerA.position = new Point(0, 0);
        groupLayerA.size = new Point(10, 10);
        groupLayerA.updateBounds();
        groupLayerA.stopEdit();

        const groupLayerB = new RectangleLayer(features);
        groupLayerB.name = 'Grouped B';
        groupLayerB.index = 2;
        groupLayerB.group = 'Group 1';
        groupLayerB.selected = false;
        groupLayerB.position = new Point(20, 0);
        groupLayerB.size = new Point(10, 10);
        groupLayerB.updateBounds();
        groupLayerB.stopEdit();

        setLayers([groupLayerB, groupLayerA]);

        const startPoint = new Point(5, 5);
        plugin.onMouseDown(startPoint, new MouseEvent('mousedown', {altKey: true}));
        plugin.onMouseMove(new Point(7, 7), new MouseEvent('mousemove', {altKey: true}));

        const clonedLayers = layersCollection.filter((entry) => entry !== groupLayerA && entry !== groupLayerB);
        expect(clonedLayers).toHaveLength(1);
        expect(clonedLayers[0].group).toBe('Group 1');
        expect(groupLayerA.group).toBe('Group 1');
        expect(groupLayerB.group).toBe('Group 1');
        plugin.onMouseUp(new Point(7, 7), new MouseEvent('mouseup'));
        expect(batchStartSpy).not.toHaveBeenCalled();
        expect(batchEndSpy).not.toHaveBeenCalled();
    });

    it('wraps multi-layer clone in a history batch', () => {
        const firstLayer = new RectangleLayer(features);
        firstLayer.position = new Point(10, 10);
        firstLayer.size = new Point(10, 10);
        firstLayer.updateBounds();
        firstLayer.stopEdit();
        firstLayer.name = 'Layer 1';
        firstLayer.index = 1;
        firstLayer.selected = true;

        const secondLayer = new RectangleLayer(features);
        secondLayer.position = new Point(30, 30);
        secondLayer.size = new Point(10, 10);
        secondLayer.updateBounds();
        secondLayer.stopEdit();
        secondLayer.name = 'Layer 2';
        secondLayer.index = 2;
        secondLayer.selected = true;

        setLayers([secondLayer, firstLayer]);

        const startPoint = new Point(12, 12);
        plugin.onMouseDown(startPoint, new MouseEvent('mousedown', {altKey: true}));
        plugin.onMouseMove(new Point(14, 14), new MouseEvent('mousemove', {altKey: true}));
        plugin.onMouseUp(new Point(15, 15), new MouseEvent('mouseup'));

        expect(batchStartSpy).toHaveBeenCalledTimes(1);
        expect(batchEndSpy).toHaveBeenCalledTimes(1);
    });

    describe('Active Selection Naming', () => {
        it('generates unique names for cloned layers (e.g., Layer 1 -> Layer 1 copy 1)', () => {
            const layer = new RectangleLayer(features);
            layer.name = 'Layer 1';
            layer.selected = true;
            layer.index = 1;
            layer.position = new Point(0, 0);
            layer.size = new Point(20, 20);
            layer.updateBounds();
            layer.stopEdit();
            setLayers([layer]);

            plugin.onMouseDown(new Point(5, 5), new MouseEvent('mousedown', {altKey: true}));
            plugin.onMouseMove(new Point(15, 15), new MouseEvent('mousemove', {altKey: true}));

            const clone = session.layersManager.layers[0];
            expect(clone.name).toBe('Layer 1 copy 1');
        });

        it('increments copy index for subsequent clones (Layer 1 copy 1 -> Layer 1 copy 2)', () => {
            const layer1 = new RectangleLayer(features);
            layer1.name = 'Layer 1';
            layer1.selected = true;
            layer1.index = 1;
            layer1.position = new Point(0, 0);
            layer1.size = new Point(20, 20);
            layer1.updateBounds();
            layer1.stopEdit();

            const existingCopy = new RectangleLayer(features);
            existingCopy.name = 'Layer 1 copy 1';
            existingCopy.index = 2;
            existingCopy.stopEdit();

            setLayers([existingCopy, layer1]);

            plugin.onMouseDown(new Point(5, 5), new MouseEvent('mousedown', {altKey: true}));
            plugin.onMouseMove(new Point(15, 15), new MouseEvent('mousemove', {altKey: true}));

            // The new clone should end up at index 3 (top)
            const clone = session.layersManager.layers[0];
            expect(clone.name).toBe('Layer 1 copy 2');
        });

        it('handles existing "copy" suffix without number (Layer 1 copy -> Layer 1 copy 2)', () => {
            const layer1 = new RectangleLayer(features);
            layer1.name = 'Layer 1';
            layer1.selected = true;
            layer1.index = 1;
            layer1.position = new Point(0, 0);
            layer1.size = new Point(20, 20);
            layer1.updateBounds();
            layer1.stopEdit();

            const existingCopy = new RectangleLayer(features);
            existingCopy.name = 'Layer 1 copy';
            existingCopy.index = 2;
            existingCopy.stopEdit();

            setLayers([existingCopy, layer1]);

            plugin.onMouseDown(new Point(5, 5), new MouseEvent('mousedown', {altKey: true}));
            plugin.onMouseMove(new Point(15, 15), new MouseEvent('mousemove', {altKey: true}));

            const clone = session.layersManager.layers[0];
            expect(clone.name).toBe('Layer 1 copy 2');
        });
    });
});
