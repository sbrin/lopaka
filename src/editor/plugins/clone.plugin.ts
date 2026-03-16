import {Keys} from '../../core/keys.enum';
import {AbstractLayer, EditMode} from '../../core/layers/abstract.layer';
import {Point} from '../../core/point';
import {generateUID} from '../../utils';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class ClonePlugin extends AbstractEditorPlugin {
    private firstPoint: Point | null = null;
    private clonedLayers: AbstractLayer[] = [];
    private sourceLayers: AbstractLayer[] = [];
    private historyBatchOpen = false;
    captured: boolean = false;

    onMouseDown(point: Point, event: MouseEvent | TouchEvent): void {
        const {layers} = this.session.layersManager;
        const {activeTool} = this.session.editor.state;

        if (!event.altKey || event.shiftKey || activeTool || layers.some((layer) => layer.isEditing())) {
            this.reset();
            return;
        }

        const selected = layers.filter((layer) => layer.selected && !layer.locked && !layer.hidden);
        const hovered = layers.filter((layer) => layer.contains(point) && !layer.locked && !layer.hidden);

        if (selected.length && hovered.length) {
            this.captured = true;
            this.firstPoint = point.clone();
            this.sourceLayers = selected;
        } else {
            this.reset();
        }
    }

    onMouseMove(point: Point, event: MouseEvent | TouchEvent): void {
        if (!this.captured) {
            return;
        }

        if (!this.clonedLayers.length) {
            this.initializeClones();
            if (!this.clonedLayers.length) {
                this.reset();
                return;
            }
        }

        this.clonedLayers.forEach((layer) => layer.edit(point.clone(), event));
        this.session.virtualScreen.redraw(false);
    }

    onMouseUp(point: Point, event: MouseEvent | TouchEvent): void {
        if (!this.captured) {
            return;
        }

        if (this.clonedLayers.length) {
            this.clonedLayers.forEach((layer) => layer.stopEdit());
            this.session.virtualScreen.redraw();
            this.session.editor.selectionUpdate();
        }

        this.reset();
    }

    onMouseLeave(point: Point, event: MouseEvent | TouchEvent): void {
        if (this.captured && this.clonedLayers.length) {
            this.clonedLayers.forEach((layer) => layer.stopEdit());
            this.session.virtualScreen.redraw();
        }
        this.reset();
    }

    onClear(): void {
        this.reset();
    }

    onKeyDown(key: Keys, event: KeyboardEvent): void {}

    private initializeClones(): void {
        if (!this.firstPoint || !this.sourceLayers.length) {
            return;
        }

        const sortedSource = [...this.sourceLayers].sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
        const clones: AbstractLayer[] = [];
        // Track fully selected groups so we can spawn fresh groups for their clones
        const fullySelectedGroups = this.getFullySelectedGroups(sortedSource);
        const clonedGroupMembers = new Map<string, AbstractLayer[]>();
        const shouldBatchHistory = sortedSource.length > 1 || fullySelectedGroups.size > 0;

        if (shouldBatchHistory) {
            this.openHistoryBatch();
        }

        this.sourceLayers.forEach((layer) => (layer.selected = false));

        const insertIndex = this.getCloneInsertIndex(sortedSource);
        this.shiftLayersAboveInsertIndex(insertIndex, sortedSource.length);

        sortedSource.forEach((layer) => {
            const clone = layer.clone();
            clone.uid = generateUID();
            clone.name = this.getUniqueName(clone.name);
            // Detach clones from their source group when the full group is being duplicated
            if (layer.group && fullySelectedGroups.has(layer.group)) {
                clone.group = null;
                if (!clonedGroupMembers.has(layer.group)) {
                    clonedGroupMembers.set(layer.group, []);
                }
                clonedGroupMembers.get(layer.group)!.push(clone);
            }
            clone.selected = true;
            this.session.addLayer(clone);
            clone.index = insertIndex + clones.length;
            clone.startEdit(EditMode.MOVING, this.firstPoint.clone());
            clones.push(clone);
        });

        // Rebuild groups for the duplicated sets and carry the original label forward
        clonedGroupMembers.forEach((groupClones, originalGroupName) => {
            if (!groupClones.length) {
                return;
            }
            this.session.layersManager.group(groupClones);
            const newGroupName = groupClones[0].group;
            if (newGroupName) {
                this.session.layersManager.renameGroup(newGroupName, `${originalGroupName} copy`);
            }
        });

        this.clonedLayers = clones;
    }

    private getCloneInsertIndex(sourceLayers: AbstractLayer[]): number {
        if (!sourceLayers.length) {
            return 0;
        }
        const indices = sourceLayers.map((layer) => layer.index ?? 0);
        const highestIndex = Math.max(...indices);
        return highestIndex + 1;
    }

    private shiftLayersAboveInsertIndex(startIndex: number, shiftBy: number): void {
        if (!shiftBy) {
            return;
        }
        this.session.layersManager.layers
            .filter((layer) => !this.sourceLayers.includes(layer) && (layer.index ?? -Infinity) >= startIndex)
            .forEach((layer) => {
                layer.index = (layer.index ?? 0) + shiftBy;
            });
    }

    private reset(): void {
        this.closeHistoryBatch();
        this.captured = false;
        this.firstPoint = null;
        this.clonedLayers = [];
        this.sourceLayers = [];
    }

    private getFullySelectedGroups(sourceLayers: AbstractLayer[]): Set<string> {
        // Count selected members per group so we can detect full selections
        const selectedCounts = new Map<string, number>();
        sourceLayers.forEach((layer) => {
            if (!layer.group) {
                return;
            }
            selectedCounts.set(layer.group, (selectedCounts.get(layer.group) ?? 0) + 1);
        });

        const fullySelected = new Set<string>();
        selectedCounts.forEach((count, groupName) => {
            const members = this.session.layersManager.getLayersInGroup(groupName);
            if (members.length && members.length === count) {
                fullySelected.add(groupName);
            }
        });
        return fullySelected;
    }

    private getUniqueName(name: string): string {
        // 1. Strip existing " copy N" suffix to get the base name
        const baseName = name.replace(/ copy(?: \d+)?$/, '');

        // 2. Find max index among ALL layers (including newly pasted ones)
        let maxIndex = 0;
        const regex = new RegExp(`^${this.escapeRegExp(baseName)}(?: copy(?: (\\d+))?)?$`);

        this.session.layersManager.layers.forEach((l) => {
            const match = l.name.match(regex);
            if (match) {
                const num = match[1] ? parseInt(match[1], 10) : (l.name === baseName ? 0 : 1);
                if (num > maxIndex) maxIndex = num;
            }
        });

        // 3. Generate new name
        return `${baseName} copy ${maxIndex + 1}`;
    }

    private escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private openHistoryBatch(): void {
        if (this.historyBatchOpen) {
            return;
        }
        this.session.history.batchStart();
        this.historyBatchOpen = true;
    }

    private closeHistoryBatch(): void {
        if (!this.historyBatchOpen) {
            return;
        }
        this.session.history.batchEnd();
        this.historyBatchOpen = false;
    }
}
