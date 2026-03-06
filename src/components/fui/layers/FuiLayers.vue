<script
    lang="ts"
    setup
>
import { computed, reactive, ref } from 'vue';
import { AbstractLayer } from '../../../core/layers/abstract.layer';
import { useSession } from '../../../core/session';
import type { LayerReorderEntry } from '/src/core/layers-manager';
import { PaintLayer } from '/src/core/layers/paint.layer';
import Icon from '/src/components/layout/Icon.vue';
import FuiLayersListItem from './FuiLayersListItem.vue';

type LayerNode = { type: 'layer'; layer: AbstractLayer };
type GroupNode = { type: 'group'; group: string; layers: AbstractLayer[] };
type LayerTreeNode = LayerNode | GroupNode;

type DragLayerItem = { type: 'layer'; layer: AbstractLayer; originGroup: string | null };
type DragGroupItem = { type: 'group'; group: string; layers: AbstractLayer[] };
type DragItem = DragLayerItem | DragGroupItem;

type RootReferenceTarget = {
    container: 'root';
    position: 'before' | 'after';
    referenceType: 'layer' | 'group';
    referenceId: string;
    rootIndex: number;
};
type RootEndTarget = { container: 'root'; position: 'end' };
type GroupReferenceTarget = {
    container: 'group';
    group: string;
    position: 'before' | 'after';
    referenceLayerId: string;
    rootIndex: number;
};
type GroupEdgeTarget = {
    container: 'group';
    group: string;
    position: 'start' | 'end';
    rootIndex: number;
};
type DropTarget = RootReferenceTarget | RootEndTarget | GroupReferenceTarget | GroupEdgeTarget;

function hasRootReference(target: DropTarget): target is RootReferenceTarget {
    return target.container === 'root' && 'referenceType' in target;
}

function hasGroupReference(target: DropTarget): target is GroupReferenceTarget {
    return target.container === 'group' && 'referenceLayerId' in target;
}

const props = defineProps<{
    readonly?: boolean;
}>();

const session = useSession();
const container = ref<HTMLElement | null>(null);
const expandedGroups = reactive<Record<string, boolean>>({});
const draggedItem = ref<DragItem | null>(null);
const dropTarget = ref<DropTarget | null>(null);

const disabled = computed(
    () =>
        session.editor.state.activeLayer?.getType() === 'paint' &&
        !(session.editor.state.activeLayer as PaintLayer).data
);

const tree = computed<LayerTreeNode[]>(() => {
    session.state.immidiateUpdates;
    session.state.selectionUpdates;

    const ordered = session.layersManager.sorted.slice().reverse();
    const groupLayers = new Map<string, AbstractLayer[]>();

    ordered.forEach((layer) => {
        if (!layer.group) {
            return;
        }
        if (!groupLayers.has(layer.group)) {
            groupLayers.set(layer.group, []);
        }
        groupLayers.get(layer.group)!.push(layer);
    });

    const seenGroups = new Set<string>();
    const nodes: LayerTreeNode[] = [];

    ordered.forEach((layer) => {
        if (layer.group) {
            if (seenGroups.has(layer.group)) {
                return;
            }
            seenGroups.add(layer.group);
            ensureGroupRegistered(layer.group);
            const layers = groupLayers.get(layer.group) ?? [];
            nodes.push({ type: 'group', group: layer.group, layers: [...layers] });
        } else {
            nodes.push({ type: 'layer', layer });
        }
    });

    cleanupDanglingGroups(seenGroups);
    return nodes;
});

function ensureGroupRegistered(name: string) {
    if (!(name in expandedGroups)) {
        expandedGroups[name] = true;
    }
}

function cleanupDanglingGroups(active: Set<string>) {
    Object.keys(expandedGroups).forEach((group) => {
        if (!active.has(group)) {
            delete expandedGroups[group];
        }
    });
}

function setActive(target: AbstractLayer | AbstractLayer[]) {
    session.layersManager.clearSelection();
    if (Array.isArray(target)) {
        target.forEach((layer) => session.layersManager.selectLayer(layer));
    } else {
        session.layersManager.selectLayer(target);
    }
    session.virtualScreen.redraw();
}

function onLayerDragStart(layer: AbstractLayer, event: DragEvent) {
    draggedItem.value = { type: 'layer', layer, originGroup: layer.group ?? null };
    prepareDragEvent(event);
}

function onGroupDragStart(node: GroupNode, event: DragEvent) {
    draggedItem.value = { type: 'group', group: node.group, layers: [...node.layers] };
    prepareDragEvent(event);
}

function prepareDragEvent(event: DragEvent) {
    dropTarget.value = null;
    if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.dropEffect = 'move';
        try {
            event.dataTransfer.setData('text/plain', '');
        } catch (err) {
            // ignore setting data errors in unsupported browsers
        }
    }
}

function onDragEnd() {
    resetDragState();
}

function onDragOver(event: DragEvent) {
    if (!draggedItem.value) {
        return;
    }
    event.preventDefault();
    const target = resolveDropTarget(event);
    if (target) {
        dropTarget.value = target;
        if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'move';
        }
    } else {
        dropTarget.value = null;
    }
}

function onDragLeave(event: DragEvent) {
    if (!container.value) {
        return;
    }
    const related = event.relatedTarget as Node | null;
    if (!related || !container.value.contains(related)) {
        dropTarget.value = null;
    }
}

function onDrop(event: DragEvent) {
    event.preventDefault();
    if (draggedItem.value && dropTarget.value) {
        applyDrop();
    }
    resetDragState();
}

function resetDragState() {
    draggedItem.value = null;
    dropTarget.value = null;
}

function resolveDropTarget(event: DragEvent): DropTarget | null {
    if (!container.value) {
        return null;
    }
    const drag = draggedItem.value;
    const target = (event.target as HTMLElement | null)?.closest('[data-entry]') as HTMLElement | null;
    if (!target || !container.value.contains(target)) {
        return { container: 'root', position: 'end' };
    }

    const entry = target.dataset.entry;
    const rootIndex = Number(target.dataset.rootIndex ?? '-1');

    if (entry === 'layer') {
        const rect = target.getBoundingClientRect();
        const position: 'before' | 'after' = event.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
        return filterDropTarget(drag, {
            container: 'root',
            position,
            referenceType: 'layer',
            referenceId: target.dataset.layerUid!,
            rootIndex,
        });
    }

    if (entry === 'group') {
        const rect = target.getBoundingClientRect();
        const local = event.clientY - rect.top;
        const ratio = rect.height ? local / rect.height : 0.5;
        if (drag?.type === 'group') {
            const position: 'before' | 'after' = ratio < 0.5 ? 'before' : 'after';
            return filterDropTarget(drag, {
                container: 'root',
                position,
                referenceType: 'group',
                referenceId: target.dataset.group!,
                rootIndex,
            });
        }
        if (ratio < 0.3) {
            return filterDropTarget(drag, {
                container: 'root',
                position: 'before',
                referenceType: 'group',
                referenceId: target.dataset.group!,
                rootIndex,
            });
        }
        if (ratio > 0.7) {
            return filterDropTarget(drag, {
                container: 'root',
                position: 'after',
                referenceType: 'group',
                referenceId: target.dataset.group!,
                rootIndex,
            });
        }
        return {
            container: 'group',
            group: target.dataset.group!,
            position: 'start',
            rootIndex,
        };
    }

    if (entry === 'group-layer') {
        if (drag?.type === 'group') {
            const groupEl = target.closest('[data-entry="group"]') as HTMLElement | null;
            if (!groupEl) {
                return null;
            }
            const rect = groupEl.getBoundingClientRect();
            const position: 'before' | 'after' = event.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
            return filterDropTarget(drag, {
                container: 'root',
                position,
                referenceType: 'group',
                referenceId: groupEl.dataset.group!,
                rootIndex: Number(groupEl.dataset.rootIndex ?? '-1'),
            });
        }
        const rect = target.getBoundingClientRect();
        const position: 'before' | 'after' = event.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
        return filterDropTarget(drag, {
            container: 'group',
            group: target.dataset.group!,
            position,
            referenceLayerId: target.dataset.layerUid!,
            rootIndex,
        });
    }

    if (entry === 'group-container') {
        if (drag?.type === 'group') {
            const groupEl = target.closest('[data-entry="group"]') as HTMLElement | null;
            if (!groupEl) {
                return null;
            }
            const rect = groupEl.getBoundingClientRect();
            const position: 'before' | 'after' = event.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
            return filterDropTarget(drag, {
                container: 'root',
                position,
                referenceType: 'group',
                referenceId: groupEl.dataset.group!,
                rootIndex: Number(groupEl.dataset.rootIndex ?? '-1'),
            });
        }
        const rect = target.getBoundingClientRect();
        const position: 'start' | 'end' = event.clientY - rect.top < rect.height / 2 ? 'start' : 'end';
        return {
            container: 'group',
            group: target.dataset.group!,
            position,
            rootIndex,
        };
    }

    if (entry === 'group-end') {
        if (drag?.type === 'group') {
            const groupEl = target.closest('[data-entry="group"]') as HTMLElement | null;
            if (!groupEl) {
                return null;
            }
            return filterDropTarget(drag, {
                container: 'root',
                position: 'after',
                referenceType: 'group',
                referenceId: groupEl.dataset.group!,
                rootIndex: Number(groupEl.dataset.rootIndex ?? '-1'),
            });
        }
        return {
            container: 'group',
            group: target.dataset.group!,
            position: 'end',
            rootIndex,
        };
    }

    return filterDropTarget(drag, { container: 'root', position: 'end' });
}

function filterDropTarget(drag: DragItem | null, target: DropTarget): DropTarget | null {
    if (!drag) {
        return target;
    }
    if (drag.type === 'layer') {
        if (target.container === 'root' && hasRootReference(target) && target.referenceType === 'layer') {
            if (target.referenceId === drag.layer.uid) {
                return null;
            }
        }
        if (target.container === 'group' && hasGroupReference(target) && target.referenceLayerId === drag.layer.uid) {
            return null;
        }
    } else {
        if (target.container === 'root' && hasRootReference(target) && target.referenceType === 'group') {
            if (target.referenceId === drag.group) {
                return null;
            }
        }
    }
    return target;
}

function applyDrop() {
    if (!draggedItem.value || !dropTarget.value) {
        return;
    }

    const drag = draggedItem.value;
    let target = dropTarget.value;

    if (drag.type === 'group' && target.container === 'group') {
        target = {
            container: 'root',
            position: target.position === 'before' || target.position === 'start' ? 'before' : 'after',
            referenceType: 'group',
            referenceId: target.group,
            rootIndex: target.rootIndex,
        };
    }

    const nodes = cloneTree(tree.value);

    let groupNode: GroupNode | null = null;
    let layerRef: AbstractLayer | null = null;

    if (drag.type === 'group') {
        const index = nodes.findIndex((node) => node.type === 'group' && node.group === drag.group);
        if (index === -1) {
            return;
        }
        groupNode = nodes.splice(index, 1)[0] as GroupNode;
    } else {
        const layerUid = drag.layer.uid;
        outer: for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            if (node.type === 'layer' && node.layer.uid === layerUid) {
                layerRef = node.layer;
                nodes.splice(i, 1);
                break;
            }
            if (node.type === 'group') {
                const index = node.layers.findIndex((layer) => layer.uid === layerUid);
                if (index !== -1) {
                    layerRef = node.layers.splice(index, 1)[0];
                    if (!node.layers.length) {
                        nodes.splice(i, 1);
                    }
                    break outer;
                }
            }
        }
        if (!layerRef) {
            return;
        }
    }

    if (drag.type === 'group') {
        insertGroup(nodes, groupNode!, target);
    } else {
        insertLayer(nodes, layerRef, target);
    }

    const normalized = nodes.filter((node) => node.type !== 'group' || node.layers.length);
    const structure: LayerReorderEntry[] = normalized.map((node) => {
        if (node.type === 'group') {
            return { type: 'group', group: node.group, layers: node.layers };
        }
        return { type: 'layer', layer: node.layer };
    });

    session.layersManager.reorder(structure);
    session.virtualScreen.redraw();
}

function insertGroup(nodes: LayerTreeNode[], group: GroupNode, target: DropTarget) {
    if (target.container !== 'root') {
        nodes.push(group);
        return;
    }
    if (target.position === 'end' || !hasRootReference(target)) {
        nodes.push(group);
        return;
    }
    const refIndex = findRootIndex(nodes, target.referenceType, target.referenceId);
    const insertIndex = refIndex === -1 ? nodes.length : target.position === 'before' ? refIndex : refIndex + 1;
    nodes.splice(insertIndex, 0, group);
}

function insertLayer(nodes: LayerTreeNode[], layer: AbstractLayer, target: DropTarget) {
    if (target.container === 'root') {
        if (target.position === 'end' || !hasRootReference(target)) {
            nodes.push({ type: 'layer', layer });
            return;
        }
        const refIndex = findRootIndex(nodes, target.referenceType, target.referenceId);
        const insertIndex = refIndex === -1 ? nodes.length : target.position === 'before' ? refIndex : refIndex + 1;
        nodes.splice(insertIndex, 0, { type: 'layer', layer });
        return;
    }

    let groupNode = nodes.find((node) => node.type === 'group' && node.group === target.group) as GroupNode | undefined;
    if (!groupNode) {
        groupNode = { type: 'group', group: target.group, layers: [] };
        const index = target.rootIndex >= 0 ? Math.min(target.rootIndex, nodes.length) : nodes.length;
        nodes.splice(index, 0, groupNode);
    }

    if (target.position === 'start') {
        groupNode.layers.unshift(layer);
        return;
    }
    if (target.position === 'end') {
        groupNode.layers.push(layer);
        return;
    }
    if (!hasGroupReference(target)) {
        groupNode.layers.push(layer);
        return;
    }
    const refIndex = groupNode.layers.findIndex((l) => l.uid === target.referenceLayerId);
    const insertIndex =
        refIndex === -1 ? groupNode.layers.length : target.position === 'before' ? refIndex : refIndex + 1;
    groupNode.layers.splice(insertIndex, 0, layer);
}

function findRootIndex(nodes: LayerTreeNode[], type: 'layer' | 'group', id: string) {
    return nodes.findIndex((node) => {
        if (type === 'layer') {
            return node.type === 'layer' && node.layer.uid === id;
        }
        return node.type === 'group' && node.group === id;
    });
}

function cloneTree(nodes: LayerTreeNode[]): LayerTreeNode[] {
    return nodes.map((node) => {
        if (node.type === 'group') {
            return { type: 'group', group: node.group, layers: [...node.layers] };
        }
        return { type: 'layer', layer: node.layer };
    });
}

function removeGroup(layers: AbstractLayer[]) {
    // Drop the group members together so undo treats it as one step
    session.layersManager.removeLayers(layers);
}

function rootDropBefore(node: LayerTreeNode) {
    const target = dropTarget.value;
    if (!target || target.container !== 'root' || target.position === 'end' || !hasRootReference(target)) {
        return false;
    }
    if (node.type === 'layer' && target.referenceType === 'layer') {
        return target.referenceId === node.layer.uid && target.position === 'before';
    }
    if (node.type === 'group' && target.referenceType === 'group') {
        return target.referenceId === node.group && target.position === 'before';
    }
    return false;
}

function rootDropAfter(node: LayerTreeNode) {
    const target = dropTarget.value;
    if (!target || target.container !== 'root' || target.position === 'end' || !hasRootReference(target)) {
        return false;
    }
    if (node.type === 'layer' && target.referenceType === 'layer') {
        return target.referenceId === node.layer.uid && target.position === 'after';
    }
    if (node.type === 'group' && target.referenceType === 'group') {
        return target.referenceId === node.group && target.position === 'after';
    }
    return false;
}

function layerRootDropClasses(node: LayerNode) {
    const drag = draggedItem.value;
    const isSelf = drag?.type === 'layer' && drag.layer.uid === node.layer.uid;
    return {
        'drop-indicator--before': !isSelf && rootDropBefore(node),
        'drop-indicator--after': !isSelf && rootDropAfter(node),
    };
}

function groupRootDropClasses(node: GroupNode) {
    return {
        'drop-indicator--before': rootDropBefore(node),
        'drop-indicator--after': rootDropAfter(node),
    };
}

function groupHeaderClasses(node: GroupNode) {
    const target = dropTarget.value;
    const drag = draggedItem.value;
    return {
        'bg-base-300': node.layers.some((layer) => layer.selected),
        'text-gray-500': node.layers.some((layer) => layer.overlay),
        'drop-indicator--after':
            drag?.type === 'layer' &&
            !!target &&
            target.container === 'group' &&
            target.group === node.group &&
            (target.position === 'start' || (target.position === 'end' && !expandedGroups[node.group])),
    };
}

function groupLayerDropClasses(group: string, layerUid: string) {
    const target = dropTarget.value;
    const drag = draggedItem.value;
    if (drag?.type === 'group') {
        return {};
    }
    if (!target || target.container !== 'group' || target.group !== group || !hasGroupReference(target)) {
        return {};
    }
    return {
        'drop-indicator--before': target.position === 'before' && target.referenceLayerId === layerUid,
        'drop-indicator--after': target.position === 'after' && target.referenceLayerId === layerUid,
    };
}
</script>

<template>
    <ul
        ref="container"
        class="menu menu-xs w-[200px] p-0 layers-list flex-nowrap"
        @dragover="onDragOver"
        @drop="onDrop"
        @dragleave="onDragLeave"
    >
        <template
            v-for="(node, index) in tree"
            :key="node.type === 'group' ? `group-${node.group}` : node.layer.uid"
        >
            <FuiLayersListItem
                v-if="node.type === 'layer'"
                :item="node.layer"
                :readonly="readonly"
                :disabled="disabled"
                :data-entry="'layer'"
                :data-layer-uid="node.layer.uid"
                :data-root-index="index"
                :class="layerRootDropClasses(node)"
                @selectLayer="setActive"
                @removeLayer="session.layersManager.removeLayer"
                @showLayer="session.layersManager.showLayer"
                @hideLayer="session.layersManager.hideLayer"
                @lockLayer="session.layersManager.lockLayer"
                @unlockLayer="session.layersManager.unlockLayer"
                @drag-start="onLayerDragStart"
                @drag-end="onDragEnd"
            />
            <li
                v-else
                class="layer layer-group group pr-2"
                :class="groupRootDropClasses(node)"
                :data-entry="'group'"
                :data-group="node.group"
                :data-root-index="index"
                :draggable="true"
                @dragstart="onGroupDragStart(node, $event)"
                @dragend="onDragEnd"
            >
                <div
                    class="group-row max-w-full pl-1 mb-[1px] rounded-none"
                    :class="groupHeaderClasses(node)"
                    @click.stop="!disabled && setActive(node.layers)"
                >
                    <Icon
                        :type="expandedGroups[node.group] ? 'collapse' : 'expand'"
                        sm
                        class="text-gray-500 self-start"
                        @click.stop="expandedGroups[node.group] = !expandedGroups[node.group]"
                    />
                    <div class="truncate grow">
                        <span>{{ node.group }}</span>
                        <ul
                            v-if="expandedGroups[node.group]"
                            class="m-0 p-0"
                            :data-entry="'group-container'"
                            :data-group="node.group"
                            :data-root-index="index"
                        >
                            <FuiLayersListItem
                                v-for="layer in node.layers"
                                :key="layer.uid"
                                :item="layer"
                                :readonly="readonly"
                                :disabled="disabled"
                                :data-entry="'group-layer'"
                                :data-group="node.group"
                                :data-layer-uid="layer.uid"
                                :data-root-index="index"
                                :class="groupLayerDropClasses(node.group, layer.uid)"
                                @drag-start="onLayerDragStart"
                                @drag-end="onDragEnd"
                                @selectLayer="setActive"
                                @removeLayer="session.layersManager.removeLayer"
                                @showLayer="session.layersManager.showLayer"
                                @hideLayer="session.layersManager.hideLayer"
                                @lockLayer="session.layersManager.lockLayer"
                                @unlockLayer="session.layersManager.unlockLayer"
                            />
                        </ul>
                    </div>
                    <div
                        v-if="!readonly"
                        class="btn text-error btn-xs btn-ghost hidden layer-actions -mr-2"
                        @click.stop="!disabled && removeGroup(node.layers)"
                    >
                        ×
                    </div>
                </div>
            </li>
        </template>
    </ul>
</template>

<style lang="css">
.layer,
.layer-group,
.group-row {
    position: relative;
}

.drop-indicator--before::before,
.drop-indicator--after::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    height: 2px;
    background: rgba(148, 163, 184, 0.8);
}

.drop-indicator--before::before {
    top: -1px;
}

.drop-indicator--after::after {
    bottom: -1px;
}
</style>

<style
    lang="css"
    scoped
>
.layer:hover .layer-actions {
    visibility: visible;
}

.layer {
    width: inherit;
}

.layer_ignored {
    color: #999;
}

.layers-list {
    overflow-y: auto;
    overflow-x: hidden;
    max-height: calc(87vh - 100px);
}

.group-row {
    display: flex;
    gap: 0.25rem;
    align-items: flex-start;
}
</style>
