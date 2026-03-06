import {beforeEach, describe, expect, it, vi} from 'vitest';
import {LayersManager} from './layers-manager';
import {Session} from './session';
import {Rect} from './rect';
import {AbstractLayer} from './layers/abstract.layer';

// Track ids so our mock layers remain unique across tests
let layerId = 0;
let historyPush: ReturnType<typeof vi.fn>;
let historyPushRedo: ReturnType<typeof vi.fn>;

// Build a lightweight layer stub that satisfies the manager contract
const createMockLayer = (overrides: Partial<AbstractLayer> = {}): AbstractLayer => {
    const uid = `layer-${++layerId}`;
    const base: Partial<AbstractLayer> = {
        uid,
        index: layerId,
        name: `Layer ${layerId}`,
        group: null,
        selected: false,
        locked: false,
        hidden: false,
        bounds: new Rect(0, 0, 10, 10),
        resize: vi.fn(),
        draw: vi.fn(),
        getBuffer: () => ({getContext: () => ({})}),
        stopEdit: vi.fn(),
        recalculate: vi.fn(),
        applyColor: vi.fn(),
    };

    return {...base, ...overrides} as AbstractLayer;
};

describe('LayersManager group management', () => {
    let manager: LayersManager;
    let sessionStub: Session;
    let historyBatchStart: ReturnType<typeof vi.fn>;
    let historyBatchEnd: ReturnType<typeof vi.fn>;
    let virtualScreenRedraw: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        // Minimal session stub covering the manager dependencies we touch
        historyPush = vi.fn();
        historyPushRedo = vi.fn();
        historyBatchStart = vi.fn();
        historyBatchEnd = vi.fn();
        virtualScreenRedraw = vi.fn();

        // Capture history spies so rename assertions can verify integrations
        sessionStub = {
            state: {
                display: {x: 128, y: 64},
                scale: {x: 1, y: 1},
                immidiateUpdates: 0,
                selectionUpdates: 0,
            },
            history: {
                push: historyPush,
                pushRedo: historyPushRedo,
                batchStart: historyBatchStart,
                batchEnd: historyBatchEnd,
            },
            getPlatformFeatures: vi.fn(() => ({})),
            virtualScreen: {
                redraw: virtualScreenRedraw,
            },
            editor: {
                state: {
                    activeLayer: {},
                },
            },
        } as unknown as Session;

        manager = new LayersManager(sessionStub);
        // Silence debounced update side effects inside unit tests
        (manager as any).debouncedUpdate = vi.fn();
        manager.requestUpdate = vi.fn();
        layerId = 0;
    });

    it('hydrates groups when getLayersInGroup called for missing mapping', () => {
        // Arrange a layer whose group registry entry has not been populated yet
        const layer = createMockLayer({group: 'Group 1'});
        manager.layersMap.set(layer.uid, layer);

        const result = manager.getLayersInGroup('Group 1');

        expect(result).toEqual([layer]);
        expect(manager.groupsMap.get('Group 1')).toEqual([layer.uid]);
    });

    it('filters out stale uids when a group loses members', () => {
        // Seed a stale id alongside a valid member in the registry
        const layer = createMockLayer({group: 'Group 1'});
        manager.layersMap.set(layer.uid, layer);
        manager.groupsMap.set('Group 1', [layer.uid, 'missing-layer']);

        const result = manager.getLayersInGroup('Group 1');

        expect(result).toEqual([layer]);
        expect(manager.groupsMap.get('Group 1')).toEqual([layer.uid]);
    });

    it('keeps remaining layers grouped when ungrouping subset', () => {
        // Create a group and remove a single member
        const a = createMockLayer();
        const b = createMockLayer();

        manager.add(a, false);
        manager.add(b, false);
        manager.group([a, b]);

        const groupName = a.group;
        expect(groupName).toBeTruthy();

        manager.ungroup([a]);

        expect(a.group).toBeNull();
        expect(b.group).toBe(groupName);
        expect(manager.getLayersInGroup(groupName)).toEqual([b]);
    });

    it('restores previous group structure on undo and redo', () => {
        // Capture before/after states to mimic history payloads
        const a = createMockLayer();
        const b = createMockLayer();
        const before = [
            {uid: a.uid, group: null},
            {uid: b.uid, group: null},
        ];

        manager.add(a, false);
        manager.add(b, false);
        manager.group([a, b]);

        const groupName = a.group;
        const after = [
            {uid: a.uid, group: groupName},
            {uid: b.uid, group: groupName},
        ];

        manager.undoChange({type: 'undo'}, {type: 'group', state: {before, after}} as any);

        expect(a.group).toBeNull();
        expect(b.group).toBeNull();
        expect(manager.getLayersInGroup(groupName)).toEqual([]);

        manager.undoChange({type: 'redo'}, {type: 'group', state: {before, after}} as any);

        const members = manager.getLayersInGroup(groupName);
        expect(members).toHaveLength(2);
        expect(members).toContain(a);
        expect(members).toContain(b);
    });

    it('re-adds removed layer back to group on undo', () => {
        // Drop a grouped layer and confirm undo restores the registry entry
        const a = createMockLayer();
        const b = createMockLayer();

        manager.add(a, false);
        manager.add(b, false);
        manager.group([a, b]);

        const groupName = a.group;
        manager.removeLayer(b, false);

        expect(manager.getLayersInGroup(groupName)).toEqual([a]);

        manager.undoChange({type: 'undo'}, {type: 'remove', layer: b} as any);

        const restored = manager.getLayersInGroup(groupName);
        expect(restored).toHaveLength(2);
        expect(restored).toContain(b);
    });

    it('preserves layer indexes when grouping and through undo/redo', () => {
        // Arrange three stacked layers where higher index means higher z-order
        const bottom = createMockLayer();
        const middle = createMockLayer();
        const top = createMockLayer();

        manager.add(bottom, false);
        manager.add(middle, false);
        manager.add(top, false);

        expect([bottom.index, middle.index, top.index]).toEqual([1, 2, 3]);

        const before = [
            {uid: middle.uid, group: null},
            {uid: top.uid, group: null},
        ];

        manager.group([middle, top]);

        const groupName = middle.group;
        expect([bottom.index, middle.index, top.index]).toEqual([1, 2, 3]);

        const after = [
            {uid: middle.uid, group: groupName},
            {uid: top.uid, group: groupName},
        ];

        const members = manager.getLayersInGroup(groupName);
        expect(members.map((l) => l.uid)).toEqual([middle.uid, top.uid]);

        manager.undoChange({type: 'undo'}, {type: 'group', state: {before, after}} as any);

        expect([bottom.index, middle.index, top.index]).toEqual([1, 2, 3]);
        expect(middle.group).toBeNull();
        expect(top.group).toBeNull();

        manager.undoChange({type: 'redo'}, {type: 'group', state: {before, after}} as any);

        expect([bottom.index, middle.index, top.index]).toEqual([1, 2, 3]);
        expect(manager.getLayersInGroup(groupName).map((l) => l.uid)).toEqual([middle.uid, top.uid]);
    });

    it('renames groups and syncs registry entries', () => {
        // Arrange a grouped layer pair that will be renamed
        const a = createMockLayer();
        const b = createMockLayer();

        manager.add(a, false);
        manager.add(b, false);
        manager.group([a, b]);

        const original = a.group;
        expect(original).toBeTruthy();

        // Trigger the rename workflow with a custom label
        manager.renameGroup(original!, 'Widgets');

        expect(a.group).toBe('Widgets');
        expect(b.group).toBe('Widgets');
        expect(manager.groupsMap.has(original!)).toBe(false);
        expect(manager.groupsMap.get('Widgets')).toEqual([a.uid, b.uid]);
        expect(historyPush).toHaveBeenCalledWith(
            expect.objectContaining({type: 'group', state: {before: expect.any(Array), after: expect.any(Array)}})
        );
        expect(historyPushRedo).toHaveBeenCalledWith(
            expect.objectContaining({type: 'group', state: {before: expect.any(Array), after: expect.any(Array)}})
        );
        expect(manager.requestUpdate).toHaveBeenCalled();
    });

    it('avoids group name collisions when renaming to an existing label', () => {
        // Prepare two distinct groups that could collide after rename
        const groupOneA = createMockLayer();
        const groupOneB = createMockLayer();
        const groupTwoA = createMockLayer();
        const groupTwoB = createMockLayer();

        manager.add(groupOneA, false);
        manager.add(groupOneB, false);
        manager.group([groupOneA, groupOneB]);

        manager.add(groupTwoA, false);
        manager.add(groupTwoB, false);
        manager.group([groupTwoA, groupTwoB]);

        const firstGroupName = groupOneA.group!;
        const secondGroupName = groupTwoA.group!;

        // Request a rename that would otherwise duplicate the first group name
        manager.renameGroup(secondGroupName, firstGroupName);

        expect(groupTwoA.group).toBe(`${firstGroupName} (1)`);
        expect(groupTwoB.group).toBe(`${firstGroupName} (1)`);
        expect(manager.groupsMap.get(firstGroupName)).toEqual([groupOneA.uid, groupOneB.uid]);
        expect(manager.groupsMap.get(`${firstGroupName} (1)`)).toEqual([groupTwoA.uid, groupTwoB.uid]);
    });

    it('leaves an existing group untouched when regrouped alone', () => {
        // Seed a group with two members
        const a = createMockLayer();
        const b = createMockLayer();
        manager.add(a, false);
        manager.add(b, false);
        manager.group([a, b]);

        const name = a.group!;
        const counterBefore = manager.groupCounter;
        (manager.requestUpdate as any).mockReset();

        // Attempt to regroup the same selection
        manager.group([a, b]);

        expect(a.group).toBe(name);
        expect(b.group).toBe(name);
        expect(manager.groupCounter).toBe(counterBefore);
        expect(manager.getLayersInGroup(name).map((l) => l.uid)).toEqual([a.uid, b.uid]);
        expect(manager.requestUpdate).not.toHaveBeenCalled();
    });

    it('extends an existing group when grouped with additional layers', () => {
        // Create a base group and an extra layer
        const a = createMockLayer();
        const b = createMockLayer();
        const extra = createMockLayer();
        manager.add(a, false);
        manager.add(b, false);
        manager.add(extra, false);
        manager.group([a, b]);

        const name = a.group!;
        const counterBefore = manager.groupCounter;
        (manager.requestUpdate as any).mockReset();

        // Group the existing group alongside the extra layer
        manager.group([a, b, extra]);

        expect(a.group).toBe(name);
        expect(b.group).toBe(name);
        expect(extra.group).toBe(name);
        expect(manager.groupCounter).toBe(counterBefore);
        expect(manager.groupsMap.get(name)).toEqual([a.uid, b.uid, extra.uid]);
        expect(manager.requestUpdate).toHaveBeenCalled();
    });

    it('merges multiple groups retaining the highest order name', () => {
        // Arrange two groups where the second sits above the first
        const a1 = createMockLayer();
        const a2 = createMockLayer();
        const b1 = createMockLayer();
        const b2 = createMockLayer();
        manager.add(a1, false);
        manager.add(a2, false);
        manager.add(b1, false);
        manager.add(b2, false);
        manager.group([a1, a2]);
        manager.group([b1, b2]);

        const lowerName = a1.group!;
        const higherName = b1.group!;
        const counterBefore = manager.groupCounter;
        (manager.requestUpdate as any).mockReset();

        // Merge both groups together
        manager.group([a1, a2, b1, b2]);

        expect(a1.group).toBe(higherName);
        expect(a2.group).toBe(higherName);
        expect(b1.group).toBe(higherName);
        expect(b2.group).toBe(higherName);
        expect(manager.groupCounter).toBe(counterBefore);
        expect(manager.groupsMap.get(higherName)).toEqual([a1.uid, a2.uid, b1.uid, b2.uid]);
        expect(manager.groupsMap.has(lowerName)).toBe(false);
        expect(manager.requestUpdate).toHaveBeenCalled();
    });

    it('batches history when removing multiple layers', () => {
        // Seed three layers so the manager can remove two at once
        const a = createMockLayer();
        const b = createMockLayer();
        const c = createMockLayer();

        manager.add(a, false);
        manager.add(b, false);
        manager.add(c, false);

        manager.removeLayers([a, b]);

        expect(manager.layersMap.has(a.uid)).toBe(false);
        expect(manager.layersMap.has(b.uid)).toBe(false);
        expect(manager.layersMap.has(c.uid)).toBe(true);
        expect(historyBatchStart).toHaveBeenCalledTimes(1);
        expect(historyBatchEnd).toHaveBeenCalledTimes(1);
        expect(virtualScreenRedraw).toHaveBeenCalledTimes(1);
    });
});
