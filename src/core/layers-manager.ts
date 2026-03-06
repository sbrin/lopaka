import { loadFont } from '../draw/fonts';
import { debounce, postParentMessage } from '../utils';
import { TChange, TChangeType, THistoryEvent } from './history';
import { AbstractImageLayer } from './layers/abstract-image.layer';
import { AbstractLayer } from './layers/abstract.layer';
import { CircleLayer } from './layers/circle.layer';
import { EllipseLayer } from './layers/ellipse.layer';
import { IconLayer } from './layers/icon.layer';
import { LineLayer } from './layers/line.layer';
import { PaintLayer, resolvePaintColorMode } from './layers/paint.layer';
import { RectangleLayer } from './layers/rectangle.layer';
import { TriangleLayer } from './layers/triangle.layer';
import { TextLayer } from './layers/text.layer';
import { Point } from './point';
import { Rect } from './rect';
import { Session } from './session';
import { ButtonLayer } from '/src/core/layers/button.layer';
import { SwitchLayer } from '/src/core/layers/switch.layer';
import { PanelLayer } from '/src/core/layers/panel.layer';
import { SliderLayer } from '/src/core/layers/slider.layer';
import { CheckboxLayer } from '/src/core/layers/checkbox.layer';
import { LVGLPlatform } from '/src/platforms/lvgl';
import { TextAreaLayer } from '/src/core/layers/text-area.layer';
import { PolygonLayer } from '/src/core/layers/polygon.layer';

// Describes drag/drop reorder intent for either single layers or groups
export type LayerReorderEntry =
    | { type: 'layer'; layer: AbstractLayer }
    | { type: 'group'; group: string; layers: AbstractLayer[] };

export class LayersManager {
    // groups: Map<string, AbstractLayer[]> = new Map();

    groupCounter = 0;

    groupsMap: Map<string, string[]> = new Map();
    layersMap: Map<string, AbstractLayer> = new Map();

    LayerClassMap: { [key in ELayerType]: any } = {
        box: RectangleLayer,
        frame: RectangleLayer,
        rect: RectangleLayer,
        triangle: TriangleLayer,
        circle: CircleLayer,
        disc: CircleLayer,
        icon: IconLayer,
        line: LineLayer,
        string: TextLayer,
        paint: PaintLayer,
        ellipse: EllipseLayer,
        button: ButtonLayer,
        switch: SwitchLayer,
        panel: PanelLayer,
        slider: SliderLayer,
        checkbox: CheckboxLayer,
        textarea: TextAreaLayer,
        polygon: PolygonLayer,
    };

    get layers() {
        return Array.from(this.layersMap.values());
    }

    get selected(): AbstractLayer[] {
        return this.layers.filter((l) => l.selected && !l.locked && !l.hidden);
    }

    get sorted(): AbstractLayer[] {
        return this.layers.sort((a, b) => a.index - b.index);
    }

    get count() {
        return this.layersMap.size;
    }

    get grouped() {
        const list = [];
        const groupsAdded = new Map();
        this.sorted.forEach((l) => {
            if (l.group && !groupsAdded.has(l.group)) {
                groupsAdded.set(l.group, true);
                list.push(this.getLayersInGroup(l.group));
            } else if (!l.group) {
                list.push(l);
            }
        });
        return list;
    }

    constructor(private session: Session) { }

    getLayer(uid: string): AbstractLayer {
        return this.layersMap.get(uid);
    }

    getLayersInGroup(group: string): AbstractLayer[] {
        // Bail early when no group identifier is supplied
        if (!group) {
            return [];
        }

        const memberIds = this.groupsMap.get(group);
        // Reconstruct the mapping from layer state if the registry is empty
        if (!memberIds || !memberIds.length) {
            const inferred = this.sorted.filter((layer) => layer.group === group);
            if (inferred.length) {
                this.groupsMap.set(
                    group,
                    inferred.map((layer) => layer.uid)
                );
            }
            return inferred;
        }

        // Resolve the registered layer ids into layer instances, discarding stale entries
        const layers = memberIds
            .map((uid) => this.layersMap.get(uid))
            .filter((layer): layer is AbstractLayer => Boolean(layer) && layer.group === group);

        // Sync the registry with the filtered result or drop the group entirely
        if (layers.length !== memberIds.length) {
            if (layers.length) {
                this.groupsMap.set(
                    group,
                    layers.map((layer) => layer.uid)
                );
            } else {
                this.groupsMap.delete(group);
            }
        }

        return layers;
    }

    getGroupBounds(group: string): Rect {
        // Look up the current group members and short-circuit empty sets
        const layers = this.getLayersInGroup(group);
        if (!layers.length) {
            return new Rect();
        }
        // Fold all member bounds into a single rectangle
        return layers.slice(1).reduce((acc, layer) => acc.extends(layer.bounds), new Rect(layers[0].bounds));
    }

    eachLayer(callback: (layer: AbstractLayer) => void) {
        this.layersMap.forEach(callback);
        this.requestUpdate();
    }

    eachEditableLayer(callback: (layer: AbstractLayer) => void) {
        this.layers.filter((l) => !l.locked && !l.hidden).forEach(callback);
    }

    contains(point: Point) {
        return this.sorted.filter((l) => l.contains(point) && !l.locked && !l.hidden);
    }

    update() {
        this.session.state.immidiateUpdates++;
        // TODO: fiigure out if it is needed to save layers here or somewhere else; I've left it in session for now
        // this.saveLayers();
    }

    selectLayer(layer: AbstractLayer) {
        layer.selected = true;
        this.session.state.selectionUpdates++;
    }

    unselectLayer(layer: AbstractLayer) {
        layer.selected = false;
        this.session.state.selectionUpdates++;
    }

    clearSelection() {
        this.eachLayer((l) => (l.selected = false));
        this.session.state.selectionUpdates++;
    }

    debouncedUpdate = debounce(() => {
        this.update();
    }, 100);

    requestUpdate() {
        this.debouncedUpdate();
    }

    add(layer: AbstractLayer, saveHistory: boolean = true) {
        const { display, scale } = this.session.state;
        layer.resize(display, scale);
        layer.index = layer.index ?? this.layersMap.size + 1;
        layer.name = layer.name ?? 'Layer ' + (this.layersMap.size + 1);
        // Pull platform capabilities to keep image modes consistent.
        const features = this.session.getPlatformFeatures();
        // Treat missing flag as monochrome-capable to preserve existing behavior.
        const supportsMonochrome = features?.hasMonochromeSupport ?? true;
        // Only force RGB when monochrome is disabled on an RGB platform.
        const shouldForceRgb = Boolean(features?.hasRGBSupport) && !supportsMonochrome;
        if (shouldForceRgb && layer instanceof AbstractImageLayer) {
            layer.setColorMode('rgb');
        }
        if (layer.colorMode === 'rgb') {
            delete layer.modifiers.color;
        }
        this.layersMap.set(layer.uid, layer);
        layer.draw();
        if (layer.group) {
            if (!this.groupsMap.has(layer.group)) {
                this.groupsMap.set(layer.group, []);
            }
            this.groupsMap.get(layer.group).push(layer.uid);
        }
        if (saveHistory) {
            this.updateHistory(layer, 'add');
        }
        this.requestUpdate();
    }

    group(layers: AbstractLayer[]) {
        // Ignore empty calls
        if (!layers.length) {
            return;
        }

        // Work on a copy ordered by z-index so results stay predictable
        const ordered = layers.slice().sort((a, b) => a.index - b.index);

        // Bucket selected entries by their current group membership
        const groupedSelection = new Map<string, AbstractLayer[]>();
        const ungrouped: AbstractLayer[] = [];
        ordered.forEach((layer) => {
            if (layer.group) {
                if (!groupedSelection.has(layer.group)) {
                    groupedSelection.set(layer.group, []);
                }
                groupedSelection.get(layer.group)!.push(layer);
            } else {
                ungrouped.push(layer);
            }
        });

        // Collect metadata for all affected groups so we can decide whether to reuse names
        const groupDetails = Array.from(groupedSelection.entries()).map(([name, selected]) => {
            const members = this.getLayersInGroup(name);
            const selectedSet = new Set(selected.map((layer) => layer.uid));
            const fullSelection =
                members.length > 0 &&
                members.length === selectedSet.size &&
                members.every((member) => selectedSet.has(member.uid));
            const topIndex = members.reduce((max, member) => Math.max(max, member.index), -Infinity);
            return { name, selected, members, fullSelection, topIndex };
        });

        // Skip regrouping when an entire group is selected on its own
        if (
            groupDetails.length === 1 &&
            groupDetails[0].fullSelection &&
            !ungrouped.length &&
            ordered.length === groupDetails[0].members.length
        ) {
            return;
        }

        // Prefer reusing one of the fully-selected group names when possible
        const fullySelected = groupDetails.filter((detail) => detail.fullSelection);
        let targetGroupName: string | null = null;
        if (fullySelected.length) {
            // Choose the group whose top-most member has the highest index
            fullySelected.sort((a, b) => b.topIndex - a.topIndex);
            targetGroupName = fullySelected[0].name;
        }

        // Generate a fresh name when no existing group can be reused
        if (!targetGroupName) {
            const baseName = `Group ${++this.groupCounter}`;
            targetGroupName = this.ensureUniqueGroupName(baseName);
        }

        // Apply the target group name to every selected layer
        ordered.forEach((layer) => {
            layer.group = targetGroupName!;
        });

        // Normalize all group registries after the reassignment
        this.rebuildGroups();
        this.requestUpdate();
    }

    renameGroup(currentName: string, desiredName: string) {
        // Ignore renames without a valid source group
        if (!currentName) {
            return;
        }

        // Trim the requested name and bail on empty or unchanged values
        const normalized = desiredName.trim();
        if (!normalized || normalized === currentName) {
            return;
        }

        // Resolve the current members to keep registry updates consistent
        const members = this.getLayersInGroup(currentName);
        if (!members.length) {
            return;
        }

        // Derive a collision-free group name while allowing in-place updates
        const nextName = this.ensureUniqueGroupName(normalized, currentName);

        // Capture history snapshots so undo/redo restores the rename
        const before = members.map((layer) => ({ uid: layer.uid, group: currentName }));
        const after = members.map((layer) => ({ uid: layer.uid, group: nextName }));

        // Apply the new name to each layer and refresh the registry entry
        members.forEach((layer) => {
            layer.group = nextName;
        });
        this.groupsMap.delete(currentName);
        this.groupsMap.set(
            nextName,
            members.map((layer) => layer.uid)
        );

        // Persist the change so timeline actions restore the original label
        const change = {
            type: 'group' as const,
            layer: null,
            state: { before, after },
        };
        this.session.history.push(change);
        this.session.history.pushRedo(change);

        this.requestUpdate();
    }

    ungroup(layers: AbstractLayer[]) {
        // Ignore empty calls that have nothing to ungroup
        if (!layers.length) {
            return;
        }

        const updates = new Map<string, Set<string>>();

        layers.forEach((layer: AbstractLayer) => {
            const group = layer.group;
            if (!group) {
                layer.group = null;
                return;
            }

            // Clone the current membership list once per affected group
            if (!updates.has(group)) {
                const members = this.groupsMap.get(group) ?? [];
                updates.set(group, new Set(members));
            }

            // Drop the layer from its group while clearing the reference
            updates.get(group)?.delete(layer.uid);
            layer.group = null;
        });

        // Persist the remaining membership or remove the group entirely
        updates.forEach((remaining, group) => {
            if (remaining.size) {
                this.groupsMap.set(group, Array.from(remaining));
            } else {
                this.groupsMap.delete(group);
            }
        });

        // Normalize all groups after edits and schedule updates
        this.rebuildGroups();
        this.requestUpdate();
    }

    mergeLayers(layers: AbstractLayer[]): AbstractImageLayer {
        const renderer = this.session.createRenderer();
        const features = this.session.getPlatformFeatures();
        const layer = new PaintLayer(features, renderer, resolvePaintColorMode(features));
        this.session.history.push({
            type: 'merge',
            layer,
            state: layers,
        });
        this.session.history.pushRedo({
            type: 'merge',
            layer,
            state: layers,
        });
        // Add the composite layer without recording history so the merge entry stays singular
        // this.session.history.batchStart();
        this.add(layer, false);
        const ctx = layer.getBuffer().getContext('2d');
        layers.forEach((l) => {
            l.selected = false;
            if (l.inverted) {
                ctx.globalCompositeOperation = 'xor';
            }
            ctx.drawImage(l.getBuffer(), 0, 0);
            ctx.globalCompositeOperation = 'source-over';
            // Remove each source layer without logging history while merging
            this.removeLayer(l, false);
        });
        layer.recalculate();
        layer.applyColor();
        layer.stopEdit();
        layer.selected = true;
        layer.draw();
        // this.session.history.batchEnd();
        this.session.state.selectionUpdates++;
        return layer;
    }

    reorder(structure: LayerReorderEntry[]): void {
        // Track reordered layers and build the final ordering snapshot
        const processed = new Set<string>();
        const orderedLayers: AbstractLayer[] = [];
        const groupMap = new Map<string, string[]>();

        // Walk the desired structure, recording new group membership as we go
        structure.forEach((entry) => {
            if (entry.type === 'group') {
                const layers = entry.layers.filter((layer) => this.layersMap.has(layer.uid));
                if (!layers.length) {
                    return;
                }
                const uids: string[] = [];
                layers.forEach((layer) => {
                    processed.add(layer.uid);
                    uids.push(layer.uid);
                    layer.group = entry.group;
                    orderedLayers.push(layer);
                });
                groupMap.set(entry.group, uids);
            } else {
                const { layer } = entry;
                if (!layer || !this.layersMap.has(layer.uid)) {
                    return;
                }
                processed.add(layer.uid);
                layer.group = null;
                orderedLayers.push(layer);
            }
        });

        // Append any untouched layers at the end while stripping their group
        this.sorted.forEach((layer) => {
            if (!processed.has(layer.uid)) {
                layer.group = null;
                orderedLayers.push(layer);
            }
        });

        // Reassign indexes based on the reversed order array to keep stacking intact
        orderedLayers
            .slice()
            .reverse()
            .forEach((layer, index) => {
                layer.index = index + 1;
            });

        // Persist the new group membership map before notifying listeners
        this.groupsMap.clear();
        groupMap.forEach((uids, groupName) => {
            this.groupsMap.set(groupName, [...uids]);
        });

        this.requestUpdate();
    }

    removeLayer(layer: AbstractLayer, saveHistory: boolean = true) {
        // Drop selection flag so selection state stays in sync
        if (layer.selected) {
            layer.selected = false;
            this.session.state.selectionUpdates++;
        }
        // Clear active painting reference when this layer is removed
        if (this.session.editor.state.activeLayer === layer) {
            layer.stopEdit();
            this.session.editor.state.activeLayer = null;
        }
        this.layersMap.delete(layer.uid);
        if (layer.group) {
            const group = this.groupsMap.get(layer.group);
            if (group) {
                group.splice(this.groupsMap.get(layer.group).indexOf(layer.uid), 1);
                this.rebuildGroups();
            }
        }
        if (saveHistory) {
            this.updateHistory(layer, 'remove');
        }
        this.requestUpdate();
    }

    removeLayers(layers: AbstractLayer[], saveHistory: boolean = true) {
        // Normalize the incoming list and drop duplicates so we only process each layer once
        const unique = Array.from(new Set((layers ?? []).filter((layer): layer is AbstractLayer => Boolean(layer))));

        if (!unique.length) {
            return;
        }

        // Batch history entries so undo collapses multi-removal into a single step
        const shouldBatch = saveHistory && unique.length > 1;
        if (shouldBatch) {
            this.session.history.batchStart();
        }

        unique.forEach((layer) => this.removeLayer(layer, saveHistory));

        if (shouldBatch) {
            this.session.history.batchEnd();
        }

        // Ensure the canvas reflects the new stack once the operation completes
        this.session.virtualScreen.redraw();
    }

    lockLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        layer.locked = true;
        if (saveHistory) {
            this.updateHistory(layer, 'lock');
        }
        this.requestUpdate();
    };

    unlockLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        layer.locked = false;
        if (saveHistory) {
            this.updateHistory(layer, 'unlock');
        }
        this.requestUpdate();
    };

    showLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        layer.hidden = false;
        if (saveHistory) {
            this.updateHistory(layer, 'show');
        }
        this.requestUpdate();
    };

    hideLayer = (layer: AbstractLayer, saveHistory: boolean = true) => {
        layer.hidden = true;
        if (saveHistory) {
            this.updateHistory(layer, 'hide');
        }
        this.requestUpdate();
    };

    updateHistory(layer, type: TChangeType) {
        this.session.history.push({
            type,
            layer,
            state: layer.state,
        });
        this.session.history.pushRedo({
            type,
            layer,
            state: layer.state,
        });
    }

    rebuildGroups() {
        // Rebuild the registry using the current sorted layer list
        const rebuilt = new Map<string, string[]>();

        this.sorted.forEach((layer) => {
            if (!layer.group) {
                return;
            }

            if (!rebuilt.has(layer.group)) {
                rebuilt.set(layer.group, []);
            }

            rebuilt.get(layer.group)?.push(layer.uid);
        });

        // Replace the old group mapping with the reconstructed snapshot
        this.groupsMap.clear();
        rebuilt.forEach((uids, groupName) => {
            if (uids.length) {
                this.groupsMap.set(groupName, uids);
            }
        });

        // Clear out stale group references on layers that lost their group
        this.layersMap.forEach((layer) => {
            if (layer.group && !this.groupsMap.has(layer.group)) {
                layer.group = null;
            }
        });
    }

    private ensureUniqueGroupName(name: string, ignore?: string): string {
        // Append a numeric suffix when the target label conflicts with another group
        let candidate = name;
        let suffix = 1;
        while (this.groupsMap.has(candidate) && candidate !== ignore) {
            candidate = `${name} (${suffix++})`;
        }
        return candidate;
    }

    private applyGroupChange(state?: { uid: string; group: string | null }[]) {
        // Ignore history entries that omit grouping payloads
        if (!Array.isArray(state)) {
            return;
        }

        // Restore each recorded layer membership from history
        state.forEach(({ uid, group }) => {
            const layer = this.getLayer(uid);
            if (layer) {
                layer.group = group ?? null;
            }
        });

        // Normalize the registry and notify listeners after restore
        this.rebuildGroups();
        this.requestUpdate();
    }

    clearLayers() {
        this.layersMap.clear();
        this.groupsMap.clear();
        this.requestUpdate();
    }

    async loadFontsForLayers(usedFonts: string[]) {
        const fonts = [
            ...this.session.platforms[this.session.state.platform].getFonts(),
            ...this.session.state.customFonts,
        ];
        const defaultFontName = this.session.state.platform === LVGLPlatform.id ? 'Montserrat' : fonts[0].name;
        if (!usedFonts.includes(defaultFontName)) {
            usedFonts.push(defaultFontName);
        }
        return Promise.all(
            fonts
                .filter((font) => usedFonts.includes(font.name))
                //
                .map((font) => loadFont(font))
        );
    }

    async loadLayers(states: any[], append: boolean = false, saveHistory: boolean = false) {
        if (!append) {
            this.clearLayers();
        }
        return this.loadFontsForLayers(states.filter((s) => s.t == 'string').map((s) => s.f)).then((fonts) => {
            states.forEach((state) => {
                if (this.session.editor.tools[state.t]) {
                    const layer = this.session.editor.tools[state.t].createLayer();
                    this.validateLayerState(state);
                    layer.state = state;
                    this.add(layer, saveHistory);
                }
            });
        });
    }

    validateLayerState(state: any) {
        if (state.t === 'paint' && !state.d) {
            state.d = "";
            this.session.state.warnings = [...this.session.state.warnings, 'Image layer data is missing. Skipping render.'];
        }
    }

    undoChange(event: THistoryEvent, change: TChange) {
        switch (event.type) {
            case 'undo':
                switch (change.type) {
                    case 'add':
                        this.removeLayer(change.layer, false);
                        break;
                    case 'remove':
                        this.add(change.layer, false);
                        break;
                    case 'change':
                        change.layer.state = change.state;
                        change.layer.draw();
                        break;
                    case 'group':
                        // Restore the pre-change group membership snapshot
                        this.applyGroupChange(change.state?.before);
                        break;
                    case 'merge':
                        this.removeLayer(change.layer, false);
                        change.state.forEach((l) => {
                            this.add(l, false);
                        });
                        break;
                    case 'lock':
                        this.unlockLayer(change.layer, false);
                        break;
                    case 'unlock':
                        this.lockLayer(change.layer, false);
                        break;
                    case 'show':
                        this.hideLayer(change.layer, false);
                        break;
                    case 'hide':
                        this.showLayer(change.layer, false);
                        break;
                    case 'clear':
                        change.state.forEach((l) => {
                            const layerType: ELayerType = l.t;
                            if (layerType in this.session.editor.tools) {
                                const layer = this.session.editor.tools[layerType].createLayer();
                                layer.loadState(l);
                                this.add(layer, false);
                                layer.saveState();
                            }
                        });
                        break;
                }
                break;
            case 'redo':
                switch (change.type) {
                    case 'add':
                        this.add(change.layer, false);
                        break;
                    case 'remove':
                        this.removeLayer(change.layer, false);
                        break;
                    case 'change':
                        change.layer.state = change.state;
                        change.layer.draw();
                        break;
                    case 'group':
                        // Apply the post-change group membership snapshot
                        this.applyGroupChange(change.state?.after);
                        break;
                    case 'merge':
                        change.state.forEach((l) => {
                            this.removeLayer(l, false);
                        });
                        this.add(change.layer, false);
                        break;
                    case 'lock':
                        this.lockLayer(change.layer, false);
                        break;
                    case 'unlock':
                        this.unlockLayer(change.layer, false);
                        break;
                    case 'clear':
                        this.clearLayers();
                        break;
                }
                break;
        }
    }
}
