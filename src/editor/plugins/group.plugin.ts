import {Keys} from '../../core/keys.enum';
import {AbstractEditorPlugin} from './abstract-editor.plugin';

export class GroupPlugin extends AbstractEditorPlugin {
    onKeyDown(key: Keys, event: KeyboardEvent): void {
        const {layersManager: layerManager} = this.session;
        if (key === Keys.KeyG && (event.ctrlKey || event.metaKey)) {
            const selected = layerManager.selected;
            if (selected.length) {
                // Snapshot current memberships before we mutate groups
                const before = selected.map((layer) => ({uid: layer.uid, group: layer.group ?? null}));

                if (event.shiftKey) {
                    layerManager.ungroup(selected);
                } else {
                    layerManager.group(selected);
                }

                // Capture the memberships after the group action completes
                const after = selected.map((layer) => ({uid: layer.uid, group: layer.group ?? null}));
                const change = {
                    type: 'group' as const,
                    layer: null,
                    state: {before, after},
                };

                // Push the change into both undo/redo stacks so history can toggle it
                this.session.history.push(change);
                this.session.history.pushRedo(change);
            }
        }
    }
}
