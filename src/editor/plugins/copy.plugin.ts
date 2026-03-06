import {Keys} from '../../core/keys.enum';
import {AbstractLayer} from '../../core/layers/abstract.layer';
import {getProjectClipboardBuffer, setProjectClipboardBuffer, TCopyBuffer} from '../../core/project-clipboard';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class CopyPlugin extends AbstractEditorPlugin {
    // Proxy shared clipboard value so tests can still inspect plugin.buffer.
    get buffer(): TCopyBuffer | null {
        return getProjectClipboardBuffer();
    }
    set buffer(value: TCopyBuffer | null) {
        setProjectClipboardBuffer(value);
    }

    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {layersManager} = this.session;
        const isModifierPressed = event.ctrlKey || event.metaKey;
        if (isModifierPressed && (key === Keys.KeyC || key === Keys.KeyX)) {
            const selected = layersManager.selected;
            if (selected.length) {
                // Capture copy buffer alongside grouping metadata so pasted layers can spawn fresh groups
                this.buffer = {
                    records: selected.map((layer) => ({constructor: layer.constructor, state: layer.state})),
                    fullySelectedGroups: Array.from(this.getFullySelectedGroups(selected)),
                };
                if (key === Keys.KeyX) {
                    // Cut removes all layers in a single batched history entry
                    this.session.layersManager.removeLayers(selected);
                }
            }
        } else if (key === Keys.KeyV && isModifierPressed) {
            if (this.buffer?.records.length) {
                // Reset selection before pasting so only new layers end up selected
                layersManager.clearSelection();
                const fullySelectedGroups = new Set(this.buffer.fullySelectedGroups);
                const clonedGroupMembers = new Map<string, AbstractLayer[]>();
                this.buffer.records.forEach((record) => {
                    // Instantiate a fresh layer and hydrate it from the serialized state
                    const renderer = this.session.createRenderer();
                    const l: AbstractLayer = new record.constructor(this.session.getPlatformFeatures(), renderer);
                    const uid = l.uid;
                    l.state = record.state;
                    l.variables = {};

                    l.uid = uid;
                    // Keep pasted layer at the original position without applying any offset

                    l.index = layersManager.count;
                    l.name = this.getUniqueName(l.name);
                    const originalGroup = record.state?.g;
                    if (originalGroup && fullySelectedGroups.has(originalGroup)) {
                        // Temporarily strip group linkage so we can assign a fresh group name after pasting
                        l.group = null;
                        if (!clonedGroupMembers.has(originalGroup)) {
                            clonedGroupMembers.set(originalGroup, []);
                        }
                        clonedGroupMembers.get(originalGroup)!.push(l);
                    }
                    l.selected = true;
                    l.stopEdit();
                    this.session.addLayer(l);
                });
                clonedGroupMembers.forEach((groupLayers, originalGroup) => {
                    // Rebuild the grouping for cloned layers and rename it to mirror clone behaviour
                    this.session.layersManager.group(groupLayers);
                    const newGroupName = groupLayers[0].group;
                    if (newGroupName) {
                        this.session.layersManager.renameGroup(newGroupName, `${originalGroup} copy`);
                    }
                });
                this.session.virtualScreen.redraw();
            }
        }
    }
    onClear(): void {
        // Keep buffer untouched so clipboard survives editor reinitialization.
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
                const num = match[1] ? parseInt(match[1], 10) : l.name === baseName ? 0 : 1;
                if (num > maxIndex) maxIndex = num;
            }
        });

        // 3. Generate new name
        return `${baseName} copy ${maxIndex + 1}`;
    }

    private escapeRegExp(string: string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    private getFullySelectedGroups(sourceLayers: AbstractLayer[]): Set<string> {
        // Count selected members per group so we can detect when an entire group has been copied
        const selectedCounts = new Map<string, number>();
        sourceLayers.forEach((layer) => {
            if (!layer.group) {
                return;
            }
            selectedCounts.set(layer.group, (selectedCounts.get(layer.group) ?? 0) + 1);
        });

        // Resolve group membership counts to identify full selections that require fresh groups
        const fullySelected = new Set<string>();
        selectedCounts.forEach((count, groupName) => {
            const members = this.session.layersManager.getLayersInGroup(groupName);
            if (members.length && members.length === count) {
                fullySelected.add(groupName);
            }
        });
        return fullySelected;
    }
}
